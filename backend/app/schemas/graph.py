from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class LayerType(str, Enum):
    FRONTEND = "frontend"
    API_ROUTE = "api_route"
    CONTROLLER = "controller"
    SERVICE = "service"
    DATA_MODEL = "data_model"
    DATABASE = "database"
    CONFIG = "config"
    UTILITY = "utility"
    UNKNOWN = "unknown"

class SymbolType(str, Enum):
    FUNCTION = "function"
    CLASS = "class"
    COMPONENT = "component"
    ROUTE_HANDLER = "route_handler"
    MODEL = "model"
    VARIABLE = "variable"
    INTERFACE = "interface"

class SymbolInfo(BaseModel):
    name: str
    symbol_type: SymbolType
    line_start: int
    line_end: int
    docstring: Optional[str] = None
    parameters: List[str] = []
    return_type: Optional[str] = None

class EndpointInfo(BaseModel):
    method: str  # GET, POST, PUT, DELETE, PATCH, etc.
    path: str
    handler_name: str
    line_number: int
    summary: Optional[str] = None

class NodeData(BaseModel):
    id: str
    label: str
    file_path: str
    relative_path: str
    layer: LayerType
    language: str
    line_count: int
    size_bytes: int
    purpose_summary: str = ""
    symbols: List[SymbolInfo] = []
    endpoints: List[EndpointInfo] = []
    imports: List[str] = []
    exports: List[str] = []
    dependencies: List[str] = []  # Outgoing file IDs
    callers: List[str] = []       # Incoming file IDs
    tags: List[str] = []

class NodePosition(BaseModel):
    x: float
    y: float

class ReactFlowNode(BaseModel):
    id: str
    type: str = "customNode"
    position: NodePosition
    data: NodeData

class EdgeStyle(BaseModel):
    stroke: Optional[str] = None
    strokeWidth: Optional[int] = 2
    strokeDasharray: Optional[str] = None

class ReactFlowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    relation_type: str = "imports"  # imports, calls_api, uses_model, configures
    animated: bool = False
    style: Optional[EdgeStyle] = None

class GraphDataResponse(BaseModel):
    repo_id: str
    repo_name: str
    nodes: List[ReactFlowNode]
    edges: List[ReactFlowEdge]
    layer_counts: Dict[str, int] = {}
    total_nodes: int = 0
    total_edges: int = 0

class NodeDetailResponse(BaseModel):
    node: NodeData
    source_code: str
    formatted_language: str
