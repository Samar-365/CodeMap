import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any

from app.schemas.graph import (
    GraphDataResponse, ReactFlowNode, ReactFlowEdge, NodeData,
    NodePosition, EdgeStyle, LayerType
)
from app.schemas.repo import RepoFileManifest
from app.core.parsers.python_parser import PythonASTParser
from app.core.parsers.js_ts_parser import JsTsParser
from app.core.parsers.base_parser import ParsedFileInfo
from app.core.dependency_resolver import DependencyResolver, ResolvedEdge

LAYER_COLUMN_POSITIONS = {
    LayerType.FRONTEND: 50,
    LayerType.SERVICE: 380,
    LayerType.API_ROUTE: 720,
    LayerType.DATA_MODEL: 1060,
    LayerType.DATABASE: 1060,
    LayerType.UTILITY: 380,
    LayerType.CONFIG: 50,
    LayerType.UNKNOWN: 380,
}

EDGE_COLORS = {
    "calls_api": "#06b6d4",    # Cyan / pulsing
    "uses_model": "#a855f7",   # Purple
    "imports": "#64748b",      # Slate
    "configures": "#f59e0b",   # Amber
}

class GraphBuilder:
    def __init__(self, repo_id: str, repo_name: str, root_dir: Path, manifest: List[RepoFileManifest]):
        self.repo_id = repo_id
        self.repo_name = repo_name
        self.root_dir = Path(root_dir)
        self.manifest = manifest
        self.py_parser = PythonASTParser()
        self.js_parser = JsTsParser()

    def build_graph(self) -> GraphDataResponse:
        parsed_files: Dict[str, ParsedFileInfo] = {}
        manifest_by_path = {m.relative_path: m for m in self.manifest}

        # 1. Parse all files in manifest
        for m in self.manifest:
            file_abs = self.root_dir / m.relative_path
            content = ""
            try:
                with open(file_abs, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except Exception as e:
                print(f"Failed to read file {file_abs}: {e}")
                continue

            if self.py_parser.can_parse(m.relative_path):
                parsed_files[m.relative_path] = self.py_parser.parse(content, m.relative_path)
            elif self.js_parser.can_parse(m.relative_path):
                parsed_files[m.relative_path] = self.js_parser.parse(content, m.relative_path)
            else:
                # Default generic file info for config / json / docs
                layer = LayerType.CONFIG if m.category == "config" else LayerType.UTILITY
                parsed_files[m.relative_path] = ParsedFileInfo(
                    relative_path=m.relative_path,
                    language=m.language,
                    layer=layer,
                    purpose_summary=f"Configuration/data file: {m.file_name}"
                )

        # 2. Resolve Dependencies & Cross-Layer Linkages
        resolver = DependencyResolver(parsed_files, self.root_dir)
        resolved_files, resolved_edges = resolver.resolve_all()

        # 3. Construct React Flow Nodes with initial grid positions
        nodes: List[ReactFlowNode] = []
        layer_y_offsets: Dict[LayerType, int] = {layer: 60 for layer in LayerType}
        layer_counts: Dict[str, int] = {}

        for rel_path, info in resolved_files.items():
            m = manifest_by_path.get(rel_path)
            size_bytes = m.size_bytes if m else 0
            line_count = m.line_count if m else 0

            # Count layers
            layer_str = info.layer.value
            layer_counts[layer_str] = layer_counts.get(layer_str, 0) + 1

            # Determine initial grid position by architectural layer
            x_pos = LAYER_COLUMN_POSITIONS.get(info.layer, 400)
            y_pos = layer_y_offsets.get(info.layer, 60)
            layer_y_offsets[info.layer] = y_pos + 150  # Spacing between cards in same column

            node_data = NodeData(
                id=rel_path,
                label=Path(rel_path).name,
                file_path=str((self.root_dir / rel_path).resolve()),
                relative_path=rel_path,
                layer=info.layer,
                language=info.language,
                line_count=line_count,
                size_bytes=size_bytes,
                purpose_summary=info.purpose_summary,
                symbols=info.symbols,
                endpoints=info.endpoints,
                imports=info.imports,
                exports=info.exports,
                dependencies=info.dependencies,
                callers=info.callers,
                tags=self._generate_tags(info, m)
            )

            nodes.append(ReactFlowNode(
                id=rel_path,
                type="customNode",
                position=NodePosition(x=float(x_pos), y=float(y_pos)),
                data=node_data
            ))

        # 4. Construct React Flow Edges with styles
        edges: List[ReactFlowEdge] = []
        for re in resolved_edges:
            color = EDGE_COLORS.get(re.relation_type, "#64748b")
            is_animated = re.animated or re.relation_type == "calls_api"

            edge_style = EdgeStyle(
                stroke=color,
                strokeWidth=2 if re.relation_type == "calls_api" else 1,
                strokeDasharray="5,5" if re.relation_type == "calls_api" else None
            )

            edges.append(ReactFlowEdge(
                id=re.id,
                source=re.source,
                target=re.target,
                label=re.label,
                relation_type=re.relation_type,
                animated=is_animated,
                style=edge_style
            ))

        return GraphDataResponse(
            repo_id=self.repo_id,
            repo_name=self.repo_name,
            nodes=nodes,
            edges=edges,
            layer_counts=layer_counts,
            total_nodes=len(nodes),
            total_edges=len(edges)
        )

    def _generate_tags(self, info: ParsedFileInfo, manifest: Optional[RepoFileManifest]) -> List[str]:
        tags: List[str] = []
        if info.layer == LayerType.FRONTEND:
            tags.append("UI")
        elif info.layer == LayerType.API_ROUTE:
            tags.append("API")
        elif info.layer == LayerType.DATA_MODEL:
            tags.append("Model")
        elif info.layer == LayerType.SERVICE:
            tags.append("Service")

        if info.endpoints:
            tags.append(f"{len(info.endpoints)} Routes")
        if info.symbols:
            components = sum(1 for s in info.symbols if s.symbol_type.value == "component")
            if components > 0:
                tags.append("React")

        return tags
