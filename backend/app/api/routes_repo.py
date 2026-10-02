from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.schemas.repo import (
    RepoIngestRequest, RepoStatusResponse, RepoStatusEnum, SampleRepoInfo, RepoSummary, RepoInputType
)

router = APIRouter(prefix="/repo", tags=["Repository Ingestion"])

@router.get("/samples", response_model=List[SampleRepoInfo])
async def list_sample_repositories():
    """List pre-configured sample projects for one-click testing."""
    return [
        SampleRepoInfo(
            id="task_flow_app",
            name="TaskFlow Fullstack (React + FastAPI + SQLite)",
            description="Complete multi-tier web application with auth flow, tasks API, and database models.",
            languages=["JavaScript", "Python", "SQL"],
            architecture_type="Fullstack Multi-Tier",
            file_count=8
        ),
        SampleRepoInfo(
            id="ecommerce_microservices",
            name="ShopSphere Backend (Express + Redis + PostgreSQL)",
            description="Microservices architecture with product catalog, cart service, and payment webhook.",
            languages=["TypeScript", "JavaScript", "SQL"],
            architecture_type="Microservices & APIs",
            file_count=12
        )
    ]

@router.post("/ingest", response_model=RepoStatusResponse)
async def ingest_repository(request: RepoIngestRequest):
    """Initiate analysis on a GitHub URL, Local Path, or Sample Repo."""
    # Placeholder response during Phase 1
    return RepoStatusResponse(
        repo_id="demo-repo-001",
        status=RepoStatusEnum.READY,
        progress_pct=100,
        stage_message="Repository ready for graph generation"
    )

@router.post("/upload-zip", response_model=RepoStatusResponse)
async def upload_zip_repository(file: UploadFile = File(...)):
    """Upload and extract a ZIP archive codebase."""
    return RepoStatusResponse(
        repo_id="zip-repo-001",
        status=RepoStatusEnum.READY,
        progress_pct=100,
        stage_message="ZIP unpacked and ready"
    )

@router.get("/status/{repo_id}", response_model=RepoStatusResponse)
async def get_repository_status(repo_id: str):
    """Check background scanning & parsing status."""
    return RepoStatusResponse(
        repo_id=repo_id,
        status=RepoStatusEnum.READY,
        progress_pct=100,
        stage_message="Analysis completed"
    )
