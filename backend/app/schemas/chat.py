from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class SourceReference(BaseModel):
    file_path: str
    relative_path: str
    line_start: int
    line_end: int
    snippet: str
    relevance_score: float = 0.0
    symbol_name: Optional[str] = None

class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: Optional[str] = None
    references: List[SourceReference] = []

class ChatRequest(BaseModel):
    repo_id: str
    question: str
    selected_node_id: Optional[str] = None
    history: List[ChatMessage] = []
    stream: bool = False

class ChatResponse(BaseModel):
    repo_id: str
    answer: str
    references: List[SourceReference] = []
    model_used: str = "open-weight"
    latency_ms: float = 0.0
    suggested_followups: List[str] = []
