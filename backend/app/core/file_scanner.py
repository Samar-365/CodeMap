import os
from pathlib import Path
from typing import List, Dict, Tuple, Any
from app.config import settings
from app.schemas.repo import RepoFileManifest

LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".java": "Java",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".md": "Markdown",
    ".html": "HTML",
    ".css": "CSS",
    ".sql": "SQL",
    ".go": "Go",
    ".rs": "Rust",
    ".cpp": "C++",
    ".c": "C",
    ".rb": "Ruby",
    ".php": "PHP",
    ".sh": "Shell"
}

def detect_language(ext: str) -> str:
    return LANGUAGE_MAP.get(ext.lower(), "Unknown")

def categorize_file(rel_path: str, ext: str) -> str:
    path_lower = rel_path.lower().replace("\\", "/")
    
    # Tests
    if "test" in path_lower or "spec" in path_lower or path_lower.endswith("_test.py"):
        return "test"
    
    # Documentation & Config
    if ext.lower() == ".md":
        return "documentation"
    if ext.lower() in [".json", ".yaml", ".yml", ".toml", ".ini", ".env.example"]:
        return "config"
    
    # Frontend components & views
    if ext.lower() in [".jsx", ".tsx"] or any(k in path_lower for k in ["/components/", "/pages/", "/views/", "/frontend/", "/src/ui/"]):
        return "frontend"
    
    # API Routes & Controllers
    if any(k in path_lower for k in ["/routes/", "/api/", "/controllers/", "/endpoints/"]):
        return "api_route"
    
    # Services & Business Logic
    if any(k in path_lower for k in ["/services/", "/helpers/", "/logic/", "/lib/"]):
        return "service"
    
    # Data Models & Schemas
    if any(k in path_lower for k in ["/models/", "/schemas/", "/entities/", "/database/", "/db/"]):
        return "data_model"
    
    # Utilities
    if any(k in path_lower for k in ["/utils/", "/common/", "/shared/"]):
        return "utility"
    
    return "general"

class FileScanner:
    def __init__(self, root_path: Path):
        self.root_path = Path(root_path).resolve()

    def scan(self) -> Tuple[List[RepoFileManifest], Dict[str, Any]]:
        manifest_list: List[RepoFileManifest] = []
        language_breakdown: Dict[str, int] = {}
        total_lines = 0
        total_size = 0

        if not self.root_path.exists():
            raise FileNotFoundError(f"Path does not exist: {self.root_path}")

        for root, dirs, files in os.walk(self.root_path):
            # Prune ignored directories in-place
            dirs[:] = [
                d for d in dirs
                if d not in settings.IGNORED_DIRS and not d.startswith(".")
            ]

            for file_name in files:
                # Skip hidden files and lockfiles
                if file_name.startswith(".") or file_name.lower() in settings.IGNORED_FILES:
                    continue

                file_path = Path(root) / file_name
                ext = file_path.suffix.lower()

                # Only include supported code/config extensions
                if ext not in settings.SUPPORTED_EXTENSIONS:
                    continue

                try:
                    rel_path = str(file_path.relative_to(self.root_path)).replace("\\", "/")
                    size_bytes = file_path.stat().st_size
                    
                    # Read lines safely
                    line_count = 0
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            line_count = sum(1 for _ in f)
                    except Exception:
                        line_count = 0

                    language = detect_language(ext)
                    category = categorize_file(rel_path, ext)

                    manifest = RepoFileManifest(
                        relative_path=rel_path,
                        file_name=file_name,
                        extension=ext,
                        language=language,
                        size_bytes=size_bytes,
                        line_count=line_count,
                        category=category
                    )
                    manifest_list.append(manifest)

                    # Accumulate statistics
                    total_lines += line_count
                    total_size += size_bytes
                    language_breakdown[language] = language_breakdown.get(language, 0) + 1

                except Exception as e:
                    print(f"Error scanning file {file_path}: {e}")
                    continue

        stats = {
            "file_count": len(manifest_list),
            "total_lines": total_lines,
            "total_size_bytes": total_size,
            "language_breakdown": language_breakdown
        }

        return manifest_list, stats
