# 📋 CodeMap AI — Development & Activity Log

**Project**: CodeMap AI (Visual Codebase Navigator)  
**Target**: Hacktoberfest 2026 — “Build for a Friend”  
**Repository**: [https://github.com/Samar-365/CodeMap.git](https://github.com/Samar-365/CodeMap.git)  
**Specification**: [`srs.txt`](srs.txt) | **Plan**: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)

---

## 📅 Timeline & Completed Activity Log

### 🔹 [2026-10-02] Phase 1: Foundation & Setup
- **Sub-phase 1.1: Git & Repository Structure** (`Commit fa71e4c`)
  - Configured root `.gitignore` to protect environment secrets (`.env`), virtual environments (`venv/`), dependencies (`node_modules/`), and temp repos.
  - Added MIT `LICENSE` and comprehensive `README.md`.
  - Initialized Git repository on branch `main` linked to `https://github.com/Samar-365/CodeMap.git`.
- **Sub-phase 1.2: Backend Environment & FastAPI Init** (`Commit 4f68c28`)
  - Created `backend/requirements.txt` (`fastapi`, `uvicorn`, `pydantic-settings`, `sentence-transformers`, `faiss-cpu`, `python-multipart`, `aiofiles`).
  - Built `backend/app/config.py` for path resolution, upload limits, and LLM configuration.
  - Built `backend/app/main.py` with lifespan handlers, CORS middleware, and `/api/health` check endpoint.
  - Added `backend/run.py` server runner.
- **Sub-phase 1.3: Frontend React + Vite Bootstrap** (`Commit 2630af5`)
  - Scaffolded React 19 + Vite project in `frontend/`.
  - Installed `@xyflow/react`, `lucide-react`, `dagre`, `prismjs`, `clsx`, `axios`.
  - Configured `vite.config.js` with proxy forwarding `/api` to `http://localhost:8000`.
  - Added Google Fonts (Outfit, Inter, Fira Code) in `index.html`.
- **Sub-phase 1.4: API Communication Bridge & Schemas** (`Commit 0f58d6c`)
  - Defined Pydantic models in `backend/app/schemas/`: `repo.py`, `graph.py`, `chat.py`, `search.py`.
  - Built centralized Axios client `frontend/src/services/api.js`.
  - Registered route endpoints for `/api/repo`, `/api/graph`, `/api/chat`, `/api/search`.

---

### 🔹 [2026-10-02] Phase 2: Code Parsing & Dependency Resolution Engine
- **Sub-phase 2.1: Repository Ingestion & Scanner** (`Commit 192c41e`)
  - Built `backend/app/core/file_scanner.py`: Recursive scanner with language detection, line counts, and architectural layer classification.
  - Built `backend/app/core/repo_manager.py`: Ingestion for GitHub URLs (`git clone --depth 1`), ZIP archives (with zip-slip path protection), local folders, and sample projects.
  - Created multi-tier test fixture `sample_repos/task_flow_app` (React UI + FastAPI backend + SQLite auth & task flow).
- **Sub-phase 2.2: Python AST Code Parser** (`Commit e18f062`)
  - Created `backend/app/core/parsers/base_parser.py` and `ParsedFileInfo` interface.
  - Built `backend/app/core/parsers/python_parser.py` using Python's native `ast` engine to extract functions, classes, docstrings, `@app.get/post` routes, and Pydantic/SQLAlchemy data models.
- **Sub-phase 2.3: JavaScript / TypeScript Code Parser** (`Commit 993fe79`)
  - Built `backend/app/core/parsers/js_ts_parser.py`: Extracts ES6/CommonJS imports, React functional components, hooks, Express routes, and frontend `fetch`/`axios` client calls.
- **Sub-phase 2.4: Cross-Layer Dependency Resolver** (`Commit 4a32801`)
  - Built `backend/app/core/dependency_resolver.py`: Resolves intra-module imports, data models, and links frontend API calls to backend route handlers across tiers (`Login.jsx -> authService.js -> routes/auth.py -> models/user.py`).

---

### 🔹 [2026-10-02] Phase 3: Architecture Graph Generation & Layout
- **Sub-phase 3.1 & 3.2: Graph Builder & Schemas** (`Commit 5f298ee`)
  - Built `backend/app/core/graph_builder.py`: Generates React Flow nodes with metadata, purpose summaries, and animated typed edges (`calls_api`, `uses_model`, `imports`).
- **Sub-phase 3.3: Dynamic Dagre Hierarchical Layout** (`Commit 5f298ee`)
  - Built `frontend/src/utils/layout.js`: Automated hierarchical positioning supporting both Left-to-Right (`LR`) and Top-to-Bottom (`TB`) orientations.
- **Sub-phase 3.4: Graph REST APIs & Search Engine** (`Commit 5f298ee`)
  - Live endpoints: `GET /api/graph/{repo_id}`, `GET /api/graph/{repo_id}/node/{node_id}`, and `GET /api/search/{repo_id}` with fuzzy multi-category symbol searching.

---

### 🔹 [2026-10-02] Phase 4: Local RAG Pipeline & Open-Weight AI Assistant
- **Sub-phase 4.1: Semantic Code Chunking** (`Commit e20ad80`)
  - Built `backend/app/core/rag_engine.py`: Function/class-preserving chunking with line-range boundary headers.
- **Sub-phase 4.2: Vector Store Indexing (FAISS)** (`Commit e20ad80`)
  - Indexed code chunks using `sentence-transformers` (`all-MiniLM-L6-v2`) with cosine similarity vector search.
- **Sub-phase 4.3: Open-Weight LLM Connector** (`Commit e20ad80`)
  - Built `backend/app/core/llm_client.py`: Supports local Ollama (`gemma2:2b`, `llama3.2`), cloud API fallback (Groq), and a high-quality offline architectural synthesizer.
- **Sub-phase 4.4: Grounded Citation Chat API** (`Commit e20ad80`)
  - `POST /api/chat` returns structured step-by-step explanations citing exact files and line ranges with interactive jump links.

---

### 🔹 [2026-10-02] Phase 5: Interactive UI & Launch Scripts
- **Sub-phase 5.1: Flat & Clean Dark Design System**
  - Built `frontend/src/index.css`: Re-engineered UI into a simple, dark, and flat design system (Linear / VS Code style) using solid background layers (`#09090b`, `#121215`, `#18181b`), subtle 1px borders (`#27272a`), refined typography, and high-contrast layer indicators.
- **Sub-phase 5.2 — 5.6: Interactive Frontend Components** (`Commit 61af856`)
  - Built `Navbar.jsx`: Top controls, active repo metrics, layout orientation toggle, and search trigger.
  - Built `RepoInputModal.jsx`: Ingestion modal supporting Samples, GitHub URL, ZIP upload, and Local folders.
  - Built `GraphView.jsx` & `CodeNode.jsx`: React Flow canvas with custom flat dark nodes, crisp layer badges, animated API edges, and MiniMap.
  - Built `NodeDetailDrawer.jsx`: Side inspector displaying component purpose, caller tree, exposed endpoints, and PrismJS syntax-highlighted code with flat tabs.
  - Built `AIChatDrawer.jsx`: AI conversation drawer with clean message bubbles, quick prompt chips, and clickable source references.
  - Built `SearchBar.jsx`: Global `Ctrl + K` fuzzy search modal across files, routes, classes, and components.
  - Assembled main application in `App.jsx`.
- **Runner Scripts** (`Commit c95e85c`)
  - Added `run_app.bat` (Windows) and `run_app.sh` (Linux/macOS) for single-command full-stack startup.
- **UI Refresh: Flat Dark Theme Polish**
  - Eliminated distracting heavy glows and glassmorphism blurs in favor of a clean, developer-focused, high-contrast dark aesthetic.

---

## 📊 Feature Status Matrix

| Feature | Requirement | Status | Verification |
|---|---|---|---|
| **Multi-Source Ingestion** | FR-01, FR-02 | ✅ Ready | GitHub URL, ZIP upload, local directory, sample preset |
| **Code Parsing (Python & JS/TS)** | FR-03, FR-04 | ✅ Ready | AST parsing for classes, functions, imports, routes, models |
| **Cross-Layer Data Flow** | FR-05 | ✅ Ready | UI -> API Service -> Backend Route -> DB Model linking |
| **Interactive Graph Map** | FR-06, FR-07 | ✅ Ready | React Flow + Dagre layout with pan, zoom, and MiniMap |
| **Node Inspection & Code Preview** | FR-08 | ✅ Ready | Drawer with syntax highlighting and dependency caller tree |
| **Local RAG & Embeddings** | FR-09, FR-11 | ✅ Ready | FAISS vector store with SentenceTransformers |
| **Grounded AI Explainer** | FR-10, FR-12 | ✅ Ready | Context-aware Q&A with exact file & line citations |
| **Global Codebase Search** | FR-13 | ✅ Ready | `Ctrl+K` fuzzy search for files, routes, symbols, models |
| **Privacy & Security** | NFR-02, NFR-03 | ✅ Ready | Local processing, zip-slip sanitization, shallow clone |
