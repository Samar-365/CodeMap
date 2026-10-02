from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.search import SearchResponse, SearchResultItem
from app.core.repo_manager import repo_manager

router = APIRouter(prefix="/search", tags=["Codebase Search"])

@router.get("/{repo_id}", response_model=SearchResponse)
async def search_symbols_and_files(repo_id: str, q: str = ""):
    """Fuzzy search files, classes, functions, and endpoints."""
    graph = repo_manager.get_graph(repo_id)
    if not graph:
        raise HTTPException(status_code=404, detail=f"Repository '{repo_id}' not found.")

    query = q.strip().lower()
    if not query:
        return SearchResponse(query=q, total_matches=0, results=[])

    results: List[SearchResultItem] = []

    for node in graph.nodes:
        data = node.data
        rel_path = data.relative_path
        filename = data.label

        # 1. Match File Name / Path
        if query in filename.lower() or query in rel_path.lower():
            results.append(SearchResultItem(
                id=f"file_{rel_path}",
                name=filename,
                match_type="file",
                file_path=data.file_path,
                relative_path=rel_path,
                line_number=1,
                preview=data.purpose_summary or f"File {filename}",
                layer=data.layer.value,
                node_id=data.id
            ))

        # 2. Match Symbols (Classes, Functions, Components)
        for sym in data.symbols:
            if query in sym.name.lower():
                results.append(SearchResultItem(
                    id=f"sym_{rel_path}_{sym.name}",
                    name=sym.name,
                    match_type=sym.symbol_type.value,
                    file_path=data.file_path,
                    relative_path=rel_path,
                    line_number=sym.line_start,
                    preview=sym.docstring or f"{sym.symbol_type.value} {sym.name}",
                    layer=data.layer.value,
                    node_id=data.id
                ))

        # 3. Match API Endpoints
        for ep in data.endpoints:
            if query in ep.path.lower() or query in ep.handler_name.lower():
                results.append(SearchResultItem(
                    id=f"ep_{rel_path}_{ep.method}_{ep.path}",
                    name=f"{ep.method} {ep.path}",
                    match_type="route",
                    file_path=data.file_path,
                    relative_path=rel_path,
                    line_number=ep.line_number,
                    preview=ep.summary or f"Endpoint handler {ep.handler_name}",
                    layer=data.layer.value,
                    node_id=data.id
                ))

    return SearchResponse(
        query=q,
        total_matches=len(results),
        results=results[:25]  # Top 25 results
    )

