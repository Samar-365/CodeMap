from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.schemas.repo import (
    RepoIngestRequest, RepoStatusResponse, RepoStatusEnum, SampleRepoInfo, RepoSummary, RepoInputType
)
from app.core.repo_manager import repo_manager

router = APIRouter(prefix="/repo", tags=["Repository Ingestion"])

@router.get("/samples", response_model=List[SampleRepoInfo])
async def list_sample_repositories():
    """List pre-configured sample projects for one-click testing."""
    return [
        SampleRepoInfo(
            id="task_flow_app",
            name="TaskFlow Fullstack (React + FastAPI + SQLite)",
            description="Complete multi-tier web application with auth flow, tasks API, and database models.",
            languages=["JavaScript", "Python", "JSON"],
            architecture_type="Fullstack Multi-Tier",
            file_count=8
        )
    ]

@router.post("/ingest", response_model=RepoStatusResponse)
async def ingest_repository(request: RepoIngestRequest):
    """Initiate analysis on a GitHub URL, Local Path, or Sample Repo."""
    if request.input_type == RepoInputType.SAMPLE:
        if not request.sample_name:
            raise HTTPException(status_code=400, detail="sample_name is required for sample ingestion.")
        summary, manifest = repo_manager.ingest_sample(request.sample_name)
    elif request.input_type == RepoInputType.GITHUB:
        if not request.url:
            raise HTTPException(status_code=400, detail="GitHub URL is required.")
        summary, manifest = repo_manager.ingest_github(request.url)
    elif request.input_type == RepoInputType.LOCAL:
        if not request.local_path:
            raise HTTPException(status_code=400, detail="local_path is required.")
        summary, manifest = repo_manager.ingest_local(request.local_path)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported input type: {request.input_type}")

    return RepoStatusResponse(
        repo_id=summary.repo_id,
        status=RepoStatusEnum.READY,
        progress_pct=100,
        stage_message=f"Scanned {summary.file_count} files ({summary.total_lines} lines of code)",
        summary=summary
    )

@router.post("/upload-zip", response_model=RepoStatusResponse)
async def upload_zip_repository(file: UploadFile = File(...)):
    """Upload and extract a ZIP archive codebase."""
    summary, manifest = repo_manager.ingest_zip(file)
    return RepoStatusResponse(
        repo_id=summary.repo_id,
        status=RepoStatusEnum.READY,
        progress_pct=100,
        stage_message=f"Unpacked and scanned {summary.file_count} files",
        summary=summary
    )

@router.get("/status/{repo_id}", response_model=RepoStatusResponse)
async def get_repository_status(repo_id: str):
    """Check background scanning & parsing status."""
    summary = repo_manager.get_repo(repo_id)
    if not summary:
        raise HTTPException(status_code=404, detail=f"Repository '{repo_id}' not found.")

    return RepoStatusResponse(
        repo_id=repo_id,
        status=summary.status,
        progress_pct=100,
        stage_message=f"Repository is ready with {summary.file_count} files.",
        summary=summary
    )

