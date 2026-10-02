from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RepoInputType(str, Enum):
    GITHUB = "github"
    ZIP = "zip"
    LOCAL = "local"
    SAMPLE = "sample"

class RepoStatusEnum(str, Enum):
    IDLE = "idle"
    SCANNING = "scanning"
    PARSING = "parsing"
    BUILDING_GRAPH = "building_graph"
    INDEXING = "indexing"
    READY = "ready"
    ERROR = "error"

class RepoIngestRequest(BaseModel):
    input_type: RepoInputType = RepoInputType.GITHUB
    url: Optional[str] = Field(None, description="GitHub repository URL")
    local_path: Optional[str] = Field(None, description="Absolute local directory path")
    sample_name: Optional[str] = Field(None, description="Preset sample repository name")

class RepoFileManifest(BaseModel):
    relative_path: str
    file_name: str
    extension: str
    language: str
    size_bytes: int
    line_count: int
    category: str = "general"

class RepoSummary(BaseModel):
    repo_id: str
    repo_name: str
    source_type: RepoInputType
    source_origin: str
    file_count: int
    total_lines: int
    language_breakdown: Dict[str, int] = {}
    created_at: str
    status: RepoStatusEnum = RepoStatusEnum.READY

class RepoStatusResponse(BaseModel):
    repo_id: str
    status: RepoStatusEnum
    progress_pct: int = 0
    stage_message: str = ""
    error_message: Optional[str] = None
    summary: Optional[RepoSummary] = None

class SampleRepoInfo(BaseModel):
    id: str
    name: str
    description: str
    languages: List[str]
    architecture_type: str
    file_count: int
