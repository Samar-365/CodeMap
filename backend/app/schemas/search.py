from typing import List, Optional
from pydantic import BaseModel

class SearchResultItem(BaseModel):
    id: str
    name: str
    match_type: str  # "file", "symbol", "route", "component"
    file_path: str
    relative_path: str
    line_number: int = 1
    preview: str = ""
    layer: str = "unknown"
    node_id: str

class SearchResponse(BaseModel):
    query: str
    total_matches: int
    results: List[SearchResultItem]
