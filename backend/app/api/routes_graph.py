from fastapi import APIRouter, HTTPException
from app.schemas.graph import GraphDataResponse, NodeDetailResponse, NodeData, LayerType

router = APIRouter(prefix="/graph", tags=["Architecture Graph"])

@router.get("/{repo_id}", response_model=GraphDataResponse)
async def get_architecture_graph(repo_id: str):
    """Retrieve nodes and edges for React Flow."""
    return GraphDataResponse(
        repo_id=repo_id,
        repo_name="Sample Project",
        nodes=[],
        edges=[],
        layer_counts={},
        total_nodes=0,
        total_edges=0
    )

@router.get("/{repo_id}/node/{node_id:path}", response_model=NodeDetailResponse)
async def get_node_details(repo_id: str, node_id: str):
    """Get metadata and raw source code for a specific file node."""
    return NodeDetailResponse(
        node=NodeData(
            id=node_id,
            label=node_id.split("/")[-1],
            file_path=node_id,
            relative_path=node_id,
            layer=LayerType.UNKNOWN,
            language="javascript",
            line_count=0,
            size_bytes=0,
            purpose_summary="Placeholder component node"
        ),
        source_code="// Source code preview will be loaded dynamically",
        formatted_language="javascript"
    )
