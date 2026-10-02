import os
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional, Any
from pydantic import BaseModel, Field

from app.core.parsers.base_parser import ParsedFileInfo
from app.schemas.graph import ReactFlowEdge, EdgeStyle, LayerType

class ResolvedEdge(BaseModel):
    id: str
    source: str
    target: str
    relation_type: str  # "imports", "calls_api", "uses_model", "configures"
    label: str
    animated: bool = False

class DependencyResolver:
    def __init__(self, parsed_files: Dict[str, ParsedFileInfo], root_dir: Path):
        self.parsed_files = parsed_files
        self.root_dir = Path(root_dir)
        self.all_rel_paths = set(parsed_files.keys())

    def resolve_all(self) -> Tuple[Dict[str, ParsedFileInfo], List[ResolvedEdge]]:
        edges: List[ResolvedEdge] = []
        edge_set: Set[str] = set()

        # 1. Resolve relative module imports
        for rel_path, info in self.parsed_files.items():
            for imp in info.imports:
                target_rel = self._resolve_import_path(rel_path, imp)
                if target_rel and target_rel in self.parsed_files:
                    edge_id = f"e_{rel_path}->{target_rel}"
                    if edge_id not in edge_set and rel_path != target_rel:
                        edge_set.add(edge_id)
                        
                        target_layer = self.parsed_files[target_rel].layer
                        rel_type = "uses_model" if target_layer == LayerType.DATA_MODEL else "imports"
                        
                        edges.append(ResolvedEdge(
                            id=edge_id,
                            source=rel_path,
                            target=target_rel,
                            relation_type=rel_type,
                            label=rel_type,
                            animated=False
                        ))
                        
                        # Populate dependencies / callers
                        if target_rel not in info.dependencies:
                            info.dependencies.append(target_rel)
                        if rel_path not in self.parsed_files[target_rel].callers:
                            self.parsed_files[target_rel].callers.append(rel_path)

        # 2. Resolve Cross-Layer API Client Calls (Frontend -> Backend Routes)
        endpoint_map = self._build_endpoint_map()
        for rel_path, info in self.parsed_files.items():
            for call_url in info.calls_endpoints:
                target_rel = self._match_endpoint_to_file(call_url, endpoint_map)
                if target_rel and target_rel in self.parsed_files and rel_path != target_rel:
                    edge_id = f"api_{rel_path}->{target_rel}"
                    if edge_id not in edge_set:
                        edge_set.add(edge_id)
                        edges.append(ResolvedEdge(
                            id=edge_id,
                            source=rel_path,
                            target=target_rel,
                            relation_type="calls_api",
                            label=f"API {call_url}",
                            animated=True  # Pulsing animation for active network call
                        ))

                        if target_rel not in info.dependencies:
                            info.dependencies.append(target_rel)
                        if rel_path not in self.parsed_files[target_rel].callers:
                            self.parsed_files[target_rel].callers.append(rel_path)

        return self.parsed_files, edges

    def _resolve_import_path(self, current_file: str, import_str: str) -> Optional[str]:
        """Resolves relative and package imports to actual file path in repo."""
        cur_dir = Path(current_file).parent

        # 1. Relative import (e.g. './services/authService' or '../models/user')
        if import_str.startswith("."):
            # Clean up dots
            target_base = (cur_dir / import_str).as_posix().replace("//", "/")
            # Handle normalized relative path
            target_norm = os.path.normpath(target_base).replace("\\", "/")
            
            candidates = [
                target_norm,
                f"{target_norm}.js", f"{target_norm}.jsx",
                f"{target_norm}.ts", f"{target_norm}.tsx",
                f"{target_norm}.py",
                f"{target_norm}/index.js", f"{target_norm}/index.jsx",
                f"{target_norm}/index.ts", f"{target_norm}/index.tsx",
                f"{target_norm}/__init__.py"
            ]
            for cand in candidates:
                cand_clean = cand.lstrip("./")
                if cand_clean in self.all_rel_paths:
                    return cand_clean

        # 2. Python package import (e.g. 'models.user' or 'routes.auth')
        py_path = import_str.replace(".", "/")
        py_candidates = [
            f"{py_path}.py",
            f"{py_path}/__init__.py"
        ]
        # Also check inside common subdirectories like 'backend/' or 'src/'
        for p in list(py_candidates):
            py_candidates.append(f"backend/{p}")
            py_candidates.append(f"src/{p}")

        for cand in py_candidates:
            if cand in self.all_rel_paths:
                return cand

        # 3. Fuzzy basename match for clean imports
        base_name = import_str.split("/")[-1].split(".")[-1]
        for rel in self.all_rel_paths:
            stem = Path(rel).stem
            if stem.lower() == base_name.lower() and stem not in ["__init__", "index"]:
                # If current file and target file are in same project tree
                if Path(current_file).parts[0] == Path(rel).parts[0]:
                    return rel

        return None

    def _build_endpoint_map(self) -> Dict[str, str]:
        """Maps normalized endpoint paths and file stems to file paths."""
        endpoint_to_file: Dict[str, str] = {}
        for rel_path, info in self.parsed_files.items():
            file_stem = Path(rel_path).stem.lower().replace("_router", "").replace("routes_", "").replace("_routes", "")
            for ep in info.endpoints:
                clean_path = ep.path.strip("/")
                # Direct route
                endpoint_to_file[clean_path] = rel_path
                endpoint_to_file[f"api/{clean_path}"] = rel_path
                # Prefixed with file stem (e.g. auth + /login -> api/auth/login)
                if file_stem and file_stem != "main" and file_stem != "app":
                    prefixed_1 = f"{file_stem}/{clean_path}".strip("/")
                    endpoint_to_file[prefixed_1] = rel_path
                    endpoint_to_file[f"api/{prefixed_1}"] = rel_path
        return endpoint_to_file

    def _match_endpoint_to_file(self, call_url: str, endpoint_map: Dict[str, str]) -> Optional[str]:
        """Matches a client fetch/axios url like '/api/auth/login' to backend route file."""
        clean_url = call_url.split("?")[0].strip("`'\"/").replace("${taskId}", "").rstrip("/")
        
        # 1. Exact match in built endpoint map
        if clean_url in endpoint_map:
            return endpoint_map[clean_url]

        # 2. Token-based path segment matching (e.g. 'auth' in 'api/auth/login')
        url_segments = set([s.lower() for s in clean_url.split("/") if s and s != "api"])
        best_match = None
        best_score = 0

        for rel_path, info in self.parsed_files.items():
            if info.layer in [LayerType.API_ROUTE, LayerType.CONTROLLER, LayerType.SERVICE] or "route" in rel_path.lower():
                stem = Path(rel_path).stem.lower().replace("_router", "").replace("routes_", "").replace("_routes", "")
                score = 0
                if stem in url_segments:
                    score += 5
                for ep in info.endpoints:
                    ep_parts = set([p.lower().strip("{} :") for p in ep.path.split("/") if p])
                    overlap = len(ep_parts.intersection(url_segments))
                    score += overlap * 2
                
                if score > best_score:
                    best_score = score
                    best_match = rel_path

        if best_match and best_score >= 3:
            return best_match

        return None

