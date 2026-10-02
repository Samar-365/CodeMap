from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.schemas.graph import SymbolInfo, EndpointInfo, LayerType

class ParsedFileInfo(BaseModel):
    relative_path: str
    language: str
    layer: LayerType = LayerType.UNKNOWN
    purpose_summary: str = ""
    imports: List[str] = Field(default_factory=list)
    exports: List[str] = Field(default_factory=list)
    symbols: List[SymbolInfo] = Field(default_factory=list)
    endpoints: List[EndpointInfo] = Field(default_factory=list)
    database_models: List[str] = Field(default_factory=list)
    calls_endpoints: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    callers: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class BaseParser(ABC):
    @abstractmethod
    def can_parse(self, file_path: str) -> bool:
        """Check if this parser supports the given file extension."""
        pass

    @abstractmethod
    def parse(self, content: str, rel_path: str) -> ParsedFileInfo:
        """Parse source code string and extract structured metadata."""
        pass
