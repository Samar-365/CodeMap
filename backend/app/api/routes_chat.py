from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["AI Assistant"])

@router.post("", response_model=ChatResponse)
async def chat_with_codebase(request: ChatRequest):
    """Answer questions about the codebase using RAG + Open-Weight AI."""
    return ChatResponse(
        repo_id=request.repo_id,
        answer=f"AI context retrieval is ready. Question received: '{request.question}'. Full RAG pipeline will be linked in Phase 4.",
        references=[],
        model_used="gemma2:2b",
        latency_ms=12.5,
        suggested_followups=[
            "How does authentication work?",
            "Where is the database connection created?",
            "Which files handle API routing?"
        ]
    )
