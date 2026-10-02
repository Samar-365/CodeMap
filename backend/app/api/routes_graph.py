from fastapi import APIRouter, HTTPException
from app.schemas.graph import GraphDataResponse, NodeDetailResponse
from app.core.repo_manager import repo_manager

router = APIRouter(prefix="/graph", tags=["Architecture Graph"])

@router.get("/{repo_id}", response_model=GraphDataResponse)
async def get_architecture_graph(repo_id: str):
    """Retrieve nodes and edges for React Flow."""
    graph = repo_manager.get_graph(repo_id)
    if not graph:
        raise HTTPException(status_code=404, detail=f"Repository or graph for '{repo_id}' not found.")
    return graph

@router.get("/{repo_id}/node/{node_id:path}", response_model=NodeDetailResponse)
async def get_node_details(repo_id: str, node_id: str):
    """Get metadata and raw source code for a specific file node."""
    details = repo_manager.get_node_details(repo_id, node_id)
    if not details:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found in repository '{repo_id}'.")
    return details

