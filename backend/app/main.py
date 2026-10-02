from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.routes_repo import router as repo_router
from app.api.routes_graph import router as graph_router
from app.api.routes_chat import router as chat_router
from app.api.routes_search import router as search_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize workspace directories on startup
    settings.init_directories()
    print(f"[{settings.PROJECT_NAME}] Starting up. Directories initialized.")
    yield
    print(f"[{settings.PROJECT_NAME}] Shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for CodeMap AI — Visual Codebase Navigator (Hacktoberfest 2026)",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(repo_router, prefix=settings.API_V1_STR)
app.include_router(graph_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(search_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "Welcome to CodeMap AI API",
        "docs": "/docs",
        "version": settings.VERSION,
        "status": "online"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "default_model": settings.DEFAULT_LLM_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL,
        "supported_extensions": list(settings.SUPPORTED_EXTENSIONS)
    }

