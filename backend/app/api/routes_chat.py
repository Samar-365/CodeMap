from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse
from app.core.repo_manager import repo_manager
from app.core.rag_engine import rag_engine
from app.core.llm_client import llm_client

router = APIRouter(prefix="/chat", tags=["AI Assistant"])

@router.post("", response_model=ChatResponse)
async def chat_with_codebase(request: ChatRequest):
    """Answer questions about the codebase using RAG + Open-Weight AI."""
    summary = repo_manager.get_repo(request.repo_id)
    if not summary:
        raise HTTPException(status_code=404, detail=f"Repository '{request.repo_id}' not found.")

    root_path = repo_manager.get_repo_path(request.repo_id)
    manifest = repo_manager.get_manifest(request.repo_id)
    graph = repo_manager.get_graph(request.repo_id)

    # 1. Ensure RAG index exists
    if request.repo_id not in rag_engine._chunks:
        rag_engine.index_repository(request.repo_id, root_path, manifest, graph)

    # 2. Retrieve top matching chunks
    references = rag_engine.retrieve(
        repo_id=request.repo_id,
        query=request.question,
        top_k=5,
        selected_node_id=request.selected_node_id
    )

    # 3. Generate grounded AI response
    answer, model_used, latency_ms = llm_client.generate_explanation(
        question=request.question,
        references=references,
        repo_name=summary.repo_name,
        history=request.history
    )

    # 4. Generate intelligent suggested follow-ups based on repo content
    suggested = [
        "How does authentication work?",
        "Which files depend on this component?",
        "Where are API endpoints defined?",
        "What data models are used in this project?"
    ]

    return ChatResponse(
        repo_id=request.repo_id,
        answer=answer,
        references=references,
        model_used=model_used,
        latency_ms=latency_ms,
        suggested_followups=suggested
    )

