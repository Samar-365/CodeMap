import os
import shutil
import zipfile
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from fastapi import UploadFile, HTTPException

from app.config import settings
from app.schemas.repo import (
    RepoInputType, RepoSummary, RepoStatusEnum, RepoFileManifest
)
from app.core.file_scanner import FileScanner
from app.core.graph_builder import GraphBuilder
from app.schemas.graph import GraphDataResponse, NodeDetailResponse, NodeData, LayerType

class RepoManager:
    def __init__(self):
        self._repos: Dict[str, Dict[str, Any]] = {}

    def get_repo(self, repo_id: str) -> Optional[RepoSummary]:
        repo_entry = self._repos.get(repo_id)
        if not repo_entry:
            return None
        return repo_entry.get("summary")

    def get_repo_path(self, repo_id: str) -> Optional[Path]:
        repo_entry = self._repos.get(repo_id)
        if not repo_entry:
            return None
        return repo_entry.get("path")

    def get_manifest(self, repo_id: str) -> List[RepoFileManifest]:
        repo_entry = self._repos.get(repo_id)
        if not repo_entry:
            return []
        return repo_entry.get("manifest", [])

    def get_graph(self, repo_id: str) -> Optional[GraphDataResponse]:
        repo_entry = self._repos.get(repo_id)
        if not repo_entry:
            return None
        
        # If not already built, build it now
        if "graph" not in repo_entry:
            summary: RepoSummary = repo_entry["summary"]
            root_path: Path = repo_entry["path"]
            manifest: List[RepoFileManifest] = repo_entry["manifest"]
            builder = GraphBuilder(repo_id, summary.repo_name, root_path, manifest)
            repo_entry["graph"] = builder.build_graph()

        return repo_entry["graph"]

    def get_node_details(self, repo_id: str, node_id: str) -> Optional[NodeDetailResponse]:
        graph = self.get_graph(repo_id)
        if not graph:
            return None

        # Find matching node in graph
        target_node: Optional[NodeData] = None
        for node in graph.nodes:
            if node.id == node_id or node.data.relative_path == node_id:
                target_node = node.data
                break

        if not target_node:
            return None

        root_path = self.get_repo_path(repo_id)
        source_code = "// Unable to load source code."
        if root_path:
            file_abs = root_path / target_node.relative_path
            if file_abs.exists() and file_abs.is_file():
                try:
                    with open(file_abs, "r", encoding="utf-8", errors="ignore") as f:
                        source_code = f.read()
                except Exception as e:
                    source_code = f"// Error reading file: {e}"

        # Map language to prism identifier
        lang_map = {
            "Python": "python",
            "JavaScript": "javascript",
            "JavaScript (React)": "jsx",
            "TypeScript": "typescript",
            "TypeScript (React)": "tsx",
            "JSON": "json",
            "YAML": "yaml",
            "Markdown": "markdown",
            "HTML": "html",
            "CSS": "css",
            "SQL": "sql"
        }
        prism_lang = lang_map.get(target_node.language, "javascript")

        return NodeDetailResponse(
            node=target_node,
            source_code=source_code,
            formatted_language=prism_lang
        )


    def ingest_github(self, url: str) -> Tuple[RepoSummary, List[RepoFileManifest]]:
        if not url or not (url.startswith("http://") or url.startswith("https://") or url.startswith("git@")):
            raise HTTPException(status_code=400, detail="Invalid GitHub repository URL.")

        # Clean repo name from URL
        clean_name = url.rstrip("/").split("/")[-1].replace(".git", "")
        repo_id = f"gh-{clean_name}-{uuid.uuid4().hex[:6]}"
        target_dir = settings.TEMP_REPOS_DIR / repo_id

        try:
            # Clone with depth 1 for speed and low bandwidth
            cmd = ["git", "clone", "--depth", "1", url, str(target_dir)]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if result.returncode != 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to clone repository: {result.stderr.strip() or result.stdout.strip()}"
                )

            scanner = FileScanner(target_dir)
            manifest, stats = scanner.scan()

            if not manifest:
                raise HTTPException(status_code=400, detail="No analyzable code files found in repository.")

            summary = RepoSummary(
                repo_id=repo_id,
                repo_name=clean_name,
                source_type=RepoInputType.GITHUB,
                source_origin=url,
                file_count=stats["file_count"],
                total_lines=stats["total_lines"],
                language_breakdown=stats["language_breakdown"],
                created_at=datetime.utcnow().isoformat() + "Z",
                status=RepoStatusEnum.READY
            )

            self._repos[repo_id] = {
                "summary": summary,
                "manifest": manifest,
                "path": target_dir,
                "stats": stats
            }

            return summary, manifest

        except subprocess.TimeoutExpired:
            if target_dir.exists():
                shutil.rmtree(target_dir, ignore_errors=True)
            raise HTTPException(status_code=408, detail="Cloning repository timed out.")
        except Exception as e:
            if target_dir.exists():
                shutil.rmtree(target_dir, ignore_errors=True)
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error ingesting repository: {str(e)}")

    def ingest_zip(self, file: UploadFile) -> Tuple[RepoSummary, List[RepoFileManifest]]:
        clean_name = Path(file.filename or "upload").stem
        repo_id = f"zip-{clean_name}-{uuid.uuid4().hex[:6]}"
        target_dir = settings.UPLOADS_DIR / repo_id
        target_dir.mkdir(parents=True, exist_ok=True)
        zip_path = target_dir / "archive.zip"

        try:
            with open(zip_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                # Security: prevent zip-slip path traversal
                for member in zip_ref.namelist():
                    extracted_path = Path(target_dir / member).resolve()
                    if not str(extracted_path).startswith(str(target_dir.resolve())):
                        raise HTTPException(status_code=400, detail="Malicious ZIP file structure detected.")
                
                zip_ref.extractall(target_dir)

            # Remove the archive file after extraction
            if zip_path.exists():
                zip_path.unlink()

            # If zip has a single root directory, step into it
            subdirs = [p for p in target_dir.iterdir() if p.is_dir()]
            scan_path = subdirs[0] if len(subdirs) == 1 and not any(p.is_file() for p in target_dir.iterdir()) else target_dir

            scanner = FileScanner(scan_path)
            manifest, stats = scanner.scan()

            if not manifest:
                raise HTTPException(status_code=400, detail="No supported code files found in ZIP archive.")

            summary = RepoSummary(
                repo_id=repo_id,
                repo_name=clean_name,
                source_type=RepoInputType.ZIP,
                source_origin=file.filename or "uploaded.zip",
                file_count=stats["file_count"],
                total_lines=stats["total_lines"],
                language_breakdown=stats["language_breakdown"],
                created_at=datetime.utcnow().isoformat() + "Z",
                status=RepoStatusEnum.READY
            )

            self._repos[repo_id] = {
                "summary": summary,
                "manifest": manifest,
                "path": scan_path,
                "stats": stats
            }

            return summary, manifest

        except zipfile.BadZipFile:
            shutil.rmtree(target_dir, ignore_errors=True)
            raise HTTPException(status_code=400, detail="Invalid or corrupt ZIP archive.")
        except Exception as e:
            shutil.rmtree(target_dir, ignore_errors=True)
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to process ZIP archive: {str(e)}")

    def ingest_local(self, local_path_str: str) -> Tuple[RepoSummary, List[RepoFileManifest]]:
        local_path = Path(local_path_str).resolve()
        if not local_path.exists() or not local_path.is_dir():
            raise HTTPException(status_code=400, detail=f"Directory path does not exist: {local_path_str}")

        repo_name = local_path.name
        repo_id = f"local-{repo_name}-{uuid.uuid4().hex[:6]}"

        scanner = FileScanner(local_path)
        manifest, stats = scanner.scan()

        if not manifest:
            raise HTTPException(status_code=400, detail="No analyzable code files found in directory.")

        summary = RepoSummary(
            repo_id=repo_id,
            repo_name=repo_name,
            source_type=RepoInputType.LOCAL,
            source_origin=str(local_path),
            file_count=stats["file_count"],
            total_lines=stats["total_lines"],
            language_breakdown=stats["language_breakdown"],
            created_at=datetime.utcnow().isoformat() + "Z",
            status=RepoStatusEnum.READY
        )

        self._repos[repo_id] = {
            "summary": summary,
            "manifest": manifest,
            "path": local_path,
            "stats": stats
        }

        return summary, manifest

    def ingest_sample(self, sample_name: str) -> Tuple[RepoSummary, List[RepoFileManifest]]:
        sample_path = settings.SAMPLE_REPOS_DIR / sample_name
        if not sample_path.exists():
            raise HTTPException(status_code=404, detail=f"Sample repository '{sample_name}' not found.")

        repo_id = f"sample-{sample_name}"
        scanner = FileScanner(sample_path)
        manifest, stats = scanner.scan()

        summary = RepoSummary(
            repo_id=repo_id,
            repo_name=sample_name.replace("_", " ").title(),
            source_type=RepoInputType.SAMPLE,
            source_origin=f"sample://{sample_name}",
            file_count=stats["file_count"],
            total_lines=stats["total_lines"],
            language_breakdown=stats["language_breakdown"],
            created_at=datetime.utcnow().isoformat() + "Z",
            status=RepoStatusEnum.READY
        )

        self._repos[repo_id] = {
            "summary": summary,
            "manifest": manifest,
            "path": sample_path,
            "stats": stats
        }

        return summary, manifest

# Global singleton
repo_manager = RepoManager()
