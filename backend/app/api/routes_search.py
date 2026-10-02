from fastapi import APIRouter
from app.schemas.search import SearchResponse, SearchResultItem

router = APIRouter(prefix="/search", tags=["Codebase Search"])

@router.get("/{repo_id}", response_model=SearchResponse)
async def search_symbols_and_files(repo_id: str, q: str = ""):
    """Fuzzy search files, classes, functions, and endpoints."""
    return SearchResponse(
        query=q,
        total_matches=0,
        results=[]
    )
