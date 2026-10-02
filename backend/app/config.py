import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CodeMap AI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Base directories
    BACKEND_DIR: Path = Path(__file__).resolve().parent.parent
    ROOT_DIR: Path = BACKEND_DIR.parent
    TEMP_REPOS_DIR: Path = BACKEND_DIR / "temp_repos"
    UPLOADS_DIR: Path = BACKEND_DIR / "uploads"
    VECTOR_CACHE_DIR: Path = BACKEND_DIR / "vector_cache"
    SAMPLE_REPOS_DIR: Path = ROOT_DIR / "sample_repos"

    # File & Repo limits
    MAX_REPO_SIZE_MB: int = 150
    MAX_FILE_SIZE_KB: int = 1000
    SUPPORTED_EXTENSIONS: set = {
        ".js", ".jsx", ".ts", ".tsx",
        ".py", ".java", ".json", ".yaml",
        ".yml", ".md", ".html", ".css", ".sql"
    }
    IGNORED_DIRS: set = {
        ".git", "node_modules", "venv", ".venv", "env",
        "__pycache__", "dist", "build", ".next", ".nuxt",
        "coverage", ".idea", ".vscode", "target", "bin", "obj"
    }
    IGNORED_FILES: set = {
        "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
        "poetry.lock", "Pipfile.lock", "composer.lock"
    }

    # CORS settings
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]

    # LLM Settings (Open-Weight / Ollama / Cloud fallback)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    DEFAULT_LLM_MODEL: str = os.getenv("DEFAULT_LLM_MODEL", "gemma2:2b")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    
    # Optional Cloud fallback API keys (Groq / Gemini / OpenRouter)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

    def init_directories(self):
        """Ensure runtime directories exist."""
        self.TEMP_REPOS_DIR.mkdir(parents=True, exist_ok=True)
        self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        self.VECTOR_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        self.SAMPLE_REPOS_DIR.mkdir(parents=True, exist_ok=True)

    class Config:
        case_sensitive = True
        env_file = str(Path(__file__).resolve().parent.parent / ".env")

settings = Settings()
