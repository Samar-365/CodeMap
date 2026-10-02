# CodeMap AI — Detailed Implementation Plan with Sub-Phases

**Project**: CodeMap AI (Visual Codebase Navigator)  
**Target**: Hacktoberfest 2026 — “Build for a Friend”  
**Repository**: `https://github.com/Samar-365/CodeMap.git`  
**SRS Reference**: [srs.txt](file:///c:/Users/samar/Desktop/projects/Hacktoberfest/week1/CodeMap/srs.txt)

---

## 1. System Architecture Overview

```
                      ┌────────────────────────────────────────────────────────┐
                      │              Frontend (React + Vite)                   │
                      │  ┌───────────────────┐        ┌─────────────────────┐  │
                      │  │ React Flow Graph  │        │ AI Chat & Drawer    │  │
                      │  │ (Interactive Map) │        │ (Context Explainer) │  │
                      │  └─────────┬─────────┘        └──────────┬──────────┘  │
                      └────────────┼─────────────────────────────┼─────────────┘
                                   │ REST / WebSocket / SSE      │
                      ┌────────────▼─────────────────────────────▼─────────────┐
                      │                 FastAPI Backend                        │
                      │                                                        │
                      │  ┌───────────────────┐        ┌─────────────────────┐  │
                      │  │ Repo Ingestion    │        │ Graph Builder       │  │
                      │  │ (Git Clone / ZIP) │        │ (Nodes & Edges)     │  │
                      │  └─────────┬─────────┘        └──────────▲──────────┘  │
                      │            │                             │             │
                      │  ┌─────────▼─────────┐        ┌──────────┴──────────┐  │
                      │  │ Code Parser (AST) ├───────►│ Dependency Resolver │  │
                      │  │ (JS/TS, Py, Java) │        │ (Imports, APIs, DB) │  │
                      │  └─────────┬─────────┘        └─────────────────────┘  │
                      │            │                                           │
                      │  ┌─────────▼─────────┐        ┌─────────────────────┐  │
                      │  │ Semantic Chunking ├───────►│ RAG Engine (FAISS)  │  │
                      │  └───────────────────┘        └──────────┬──────────┘  │
                      │                                          │             │
                      │                               ┌──────────▼──────────┐  │
                      │                               │ Open-Weight LLM     │  │
                      │                               │ (Ollama / Gemma)    │  │
                      │                               └─────────────────────┘  │
                      └────────────────────────────────────────────────────────┘
```

---

## 2. Granular Sub-Phase Breakdown

---

### 🔹 Phase 1: Foundation & Setup

#### Sub-phase 1.1: Git & Repository Structure Configuration
- **Objective**: Configure project roots, directory layout, and security boundary.
- **Tasks**:
  - Configure root `.gitignore` (ignore `node_modules`, `venv`, `__pycache__`, `.env`, temp cloned repos in `backend/temp_repos/`).
  - Create directory structure for `backend/` and `frontend/`.
  - Add initial `README.md` and license.
- **Deliverable**: Clean, isolated workspace ready for multi-tier development.

#### Sub-phase 1.2: Backend Environment & FastAPI Initialization
- **Objective**: Build the core backend container with health check and configuration loader.
- **Tasks**:
  - Create `backend/requirements.txt` (`fastapi`, `uvicorn`, `pydantic`, `sentence-transformers`, `faiss-cpu`, `requests`, `python-multipart`, `aiofiles`).
  - Set up `backend/app/main.py` with FastAPI instance, CORS middleware, and global error handlers.
  - Implement `backend/app/config.py` for model paths, temp directories, upload size limits, and LLM endpoints.
- **Deliverable**: Running FastAPI server at `http://localhost:8000` with `/api/health`.

#### Sub-phase 1.3: Frontend React + Vite Bootstrap & Tooling
- **Objective**: Initialize the modern frontend workspace with necessary libraries.
- **Tasks**:
  - Bootstrap React with Vite in `frontend/`.
  - Install core frontend libraries: `@xyflow/react` (or `reactflow`), `lucide-react`, `dagre`, `prismjs`, `clsx`, `axios`.
  - Configure `vite.config.js` with proxy to `http://localhost:8000/api`.
- **Deliverable**: Running Vite dev server at `http://localhost:5173`.

#### Sub-phase 1.4: API Communication Bridge
- **Objective**: Establish unified HTTP client and type contracts between frontend and backend.
- **Tasks**:
  - Define backend Pydantic schemas in `backend/app/schemas/` (`RepoInput`, `RepoStatus`, `GraphData`, `NodeDetails`, `ChatRequest`, `ChatResponse`).
  - Create `frontend/src/services/api.js` with standardized client methods and error handling.
- **Deliverable**: End-to-end connected frontend-backend pipeline.

---

### 🔹 Phase 2: Code Parsing & Dependency Resolution Engine

#### Sub-phase 2.1: Repository Ingestion & Scanner
- **Objective**: Handle GitHub URLs, ZIP archives, and local folders securely.
- **Tasks**:
  - Implement `backend/app/core/repo_manager.py`:
    - Git clone for GitHub URLs (shallow clone with depth 1).
    - ZIP file unpacker with path traversal (`..` sanitization) protection.
    - Local directory loader.
  - Implement `backend/app/core/file_scanner.py`:
    - Recursive scanner filtering out `.git`, `node_modules`, `dist`, `build`, `venv`, `.env`.
    - Language classifier based on extensions (`.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.java`, `.json`, `.yaml`, `.md`).
    - File metadata collection (size, line count, relative path).
- **Deliverable**: Ingestion service that produces a validated file manifest of any codebase.

#### Sub-phase 2.2: Python AST Code Parser
- **Objective**: Extract rich structural metadata from Python files.
- **Tasks**:
  - Implement `backend/app/core/parsers/python_parser.py` using Python's native `ast` module:
    - Imports extraction (`import foo`, `from bar import baz`).
    - Classes & methods extraction (with docstrings and line ranges).
    - Functions extraction.
    - Web route detection (FastAPI `@app.get/post`, Flask `@app.route`, Django URL patterns).
    - Database model detection (SQLAlchemy models, Pydantic schemas).
- **Deliverable**: Structured symbol tree for any Python module.

#### Sub-phase 2.3: JavaScript / TypeScript Code Parser
- **Objective**: Extract structural metadata and component graphs from JS/TS codebases.
- **Tasks**:
  - Implement `backend/app/core/parsers/js_ts_parser.py`:
    - Import / export resolution (ES6 `import { X } from './Y'`, CommonJS `require()`).
    - React component detection (functional components, JSX return structures, hook usage).
    - Backend route detection (Express `app.get()`, `router.post()`, NestJS decorators).
    - Client API call detection (`fetch('/api/...')`, `axios.get('/api/...')`).
- **Deliverable**: Structured symbol tree for JS/TS frontend and backend files.

#### Sub-phase 2.4: Cross-Layer Dependency Resolver & Data Flow Linker
- **Objective**: Connect components across folders and tiers.
- **Tasks**:
  - Resolve relative file imports (`../services/auth` -> `src/services/auth.js`).
  - Match frontend API client requests (`/api/login`) to backend route definitions (`@app.post("/api/login")` or `router.post('/login')`).
  - Link controllers to services and database models.
- **Deliverable**: Comprehensive relationship graph connecting all files and tiers.

---

### 🔹 Phase 3: Architecture Graph Generation & Layout

#### Sub-phase 3.1: Architectural Classification & Layer Grouping
- **Objective**: Categorize files into intuitive architectural tiers.
- **Tasks**:
  - Implement automatic role classification in `backend/app/core/graph_builder.py`:
    - `Frontend UI` (Components, Pages, Views).
    - `API Routes / Controllers` (Endpoints, Request Handlers).
    - `Services / Business Logic` (Services, Helpers, Utils).
    - `Data Layer / Models` (Schemas, Database entities, ORM).
    - `Configuration` (`package.json`, `.env.example`, `docker-compose.yml`, config files).
- **Deliverable**: Categorized node collections with tier assignments.

#### Sub-phase 3.2: React Flow Graph Schema Generator
- **Objective**: Convert parsed relationships into React Flow compatible node and edge structures.
- **Tasks**:
  - Generate node objects: `id`, `type` (`serviceNode`, `fileNode`), `data` (file path, label, layer, metrics, symbols, purpose preview).
  - Generate edge objects: `id`, `source`, `target`, `label` (`imports`, `calls_api`, `uses_model`), `animated` flag, edge styling.
- **Deliverable**: Clean JSON payload for direct rendering in React Flow.

#### Sub-phase 3.3: Dynamic Layout Calculation with Dagre
- **Objective**: Position nodes automatically without overlapping or tangled edges.
- **Tasks**:
  - Implement Dagre hierarchical graph positioning in `frontend/src/utils/layout.js` (supporting Top-to-Bottom and Left-to-Right layout toggles).
  - Add clustering bounds for multi-tier visual containers.
- **Deliverable**: Perfectly organized, visually appealing node coordinates.

#### Sub-phase 3.4: Graph REST APIs & Caching
- **Objective**: Expose graph endpoints with session caching.
- **Tasks**:
  - Implement `backend/app/api/routes_graph.py`:
    - `GET /api/graph/{repo_id}`: Full architecture graph.
    - `GET /api/graph/{repo_id}/node/{node_id}`: Detailed node metadata and file source code.
- **Deliverable**: High-speed graph retrieval endpoints.

---

### 🔹 Phase 4: Local RAG Pipeline & Open-Weight AI Assistant

#### Sub-phase 4.1: Semantic Code Chunking & Metadata Enrichment
- **Objective**: Split code into context-preserving units for vector retrieval.
- **Tasks**:
  - Implement `backend/app/core/rag_engine.py` chunking logic:
    - Chunk by function, class, or logical block with file path and line number headers.
    - Generate summary docstrings and symbol headers for each chunk.
- **Deliverable**: Clean code chunks enriched with file paths and line number bounds.

#### Sub-phase 4.2: Vector Store & Embeddings Indexing (FAISS)
- **Objective**: Create fast local semantic search for codebase questions.
- **Tasks**:
  - Generate embeddings using `sentence-transformers` (`all-MiniLM-L6-v2` or fast local model).
  - Store embeddings in an in-memory or persisted FAISS index per analyzed repository.
  - Implement similarity search to retrieve top relevant code snippets for any user prompt.
- **Deliverable**: Sub-50ms code snippet retriever for natural language queries.

#### Sub-phase 4.3: Open-Weight Model Integration (Ollama / Gemma)
- **Objective**: Local privacy-preserving LLM inference with cloud API fallback.
- **Tasks**:
  - Integrate Ollama API connector (`http://localhost:11434/api/generate`) with models: `gemma2:2b` / `gemma2:9b`, `llama3.2`, `qwen2.5-coder`.
  - Add fallback provider interface (OpenRouter/Groq/Gemini API key support if local Ollama is not installed).
- **Deliverable**: Flexible LLM client capable of 100% offline or hybrid operation.

#### Sub-phase 4.4: Grounded Prompting & Line-Number Citation Engine
- **Objective**: Produce accurate explanations with clickable file and line-number references.
- **Tasks**:
  - Design system prompts that inject architectural context, AST relations, and retrieved code chunks.
  - Structure AI outputs to include structured citations (`references: [{ file: "src/auth.js", lines: "10-45" }]`).
  - Implement `POST /api/chat` with SSE (Server-Sent Events) streaming response.
- **Deliverable**: Context-aware AI answers with accurate file citations.

---

### 🔹 Phase 5: High-Aesthetic Interactive UI (React Flow + Glassmorphism)

#### Sub-phase 5.1: Core Design System & Theme Tokens
- **Objective**: Create a state-of-the-art cyber-dark glassmorphism visual design.
- **Tasks**:
  - Build `frontend/src/index.css` with dark palette, glowing accents (cyan, purple, emerald), glass surfaces (`backdrop-filter: blur()`), and sleek scrollbars.
  - Configure typography using modern sans fonts (Inter / Outfit).
- **Deliverable**: Polished styling foundation.

#### Sub-phase 5.2: Top Navbar & Repository Ingestion Modal
- **Objective**: Seamless repository loading experience.
- **Tasks**:
  - Build `Navbar.jsx`: Active repository title, analysis status badge, search bar trigger, AI chat toggle, layout orientation switcher.
  - Build `RepoInputModal.jsx`: Tabs for GitHub URL input, ZIP file drag-and-drop, and quick-load buttons for built-in sample projects with live progress indicators.
- **Deliverable**: Intuitive repository loader with progress feedback.

#### Sub-phase 5.3: Interactive React Flow Canvas & Custom Nodes
- **Objective**: Immersive visual codebase navigation.
- **Tasks**:
  - Build `GraphView.jsx` with Zoom, Pan, FitView, MiniMap, and Background grid.
  - Create `ServiceNode.jsx` & `FileNode.jsx` custom nodes featuring:
    - Glowing category badges (Frontend, API, Service, Model, Config).
    - File name, line count, export tags.
    - Click-to-select and hover highlight states (highlights upstream dependencies and downstream callers).
- **Deliverable**: High-performance interactive architecture graph.

#### Sub-phase 5.4: Node Details Inspector & Code Viewer Drawer
- **Objective**: In-depth inspection of selected components.
- **Tasks**:
  - Build `NodeDetailDrawer.jsx`:
    - Summary of component purpose and role in architecture.
    - List of imported modules and dependent files.
    - Detected API endpoints and database models.
    - Full syntax-highlighted source code preview with PrismJS and line numbers.
    - "Ask AI about this file" shortcut button.
- **Deliverable**: Detailed side inspector drawer.

#### Sub-phase 5.5: AI Assistant Drawer & Interactive Chat
- **Objective**: Conversational codebase explainer.
- **Tasks**:
  - Build `AIChatDrawer.jsx`:
    - Message history with Markdown rendering.
    - Quick-prompt chips ("Explain authentication flow", "Where is the DB configured?", "What does this file do?").
    - Clickable source file reference badges that open the file in the code inspector.
    - Streaming message animations.
- **Deliverable**: Full-featured AI codebase chat companion.

#### Sub-phase 5.6: Codebase Search & Quick Finder
- **Objective**: Instant search across files, functions, classes, and endpoints.
- **Tasks**:
  - Build `SearchBar.jsx` with keyboard shortcut (`Cmd/Ctrl + K`).
  - Search filter by category (All, Files, Routes, Functions, Classes).
  - Instant focus/pan to the matching node on the React Flow canvas upon selection.
- **Deliverable**: Global fuzzy search and canvas navigation.

---

### 🔹 Phase 6: Sample Projects, Polish & Hacktoberfest Submission

#### Sub-phase 6.1: Multi-Tier Sample Demonstration Repository
- **Objective**: Offline demo repository showcasing full architecture capabilities out of the box.
- **Tasks**:
  - Build `sample_repos/task_flow_app/` with:
    - React Frontend (`Login.jsx`, `Dashboard.jsx`, `apiClient.js`).
    - FastAPI Backend (`main.py`, `routes/auth.py`, `routes/tasks.py`, `services/task_service.py`, `models/user.py`).
    - Config files (`package.json`, `requirements.txt`).
- **Deliverable**: Ready-to-analyze fixture repository.

#### Sub-phase 6.2: End-to-End Testing & Error Handling Polish
- **Objective**: Ensure robustness and smooth error recovery.
- **Tasks**:
  - Test invalid Git URLs, empty repositories, malformed syntax files.
  - Verify graceful fallbacks when AI model or GPU is offline.
  - Validate UI responsiveness on different screen resolutions.
- **Deliverable**: Stable, error-resilient full-stack application.

#### Sub-phase 6.3: Documentation & Hacktoberfest Submission Guide
- **Objective**: Complete documentation for judges, teammates, and open-source contributors.
- **Tasks**:
  - Write detailed `README.md` with features, screenshots/diagrams, architecture overview, installation steps, and Hacktoberfest "Build for a Friend" storyline.
  - Provide a single-command startup script or clear instructions (`run.bat` / `run.sh` / `npm start`).
- **Deliverable**: Comprehensive open-source documentation.

---

## 3. Implementation Sequence & Phase Matrix

| Phase | Sub-Phases | Primary Focus | Output Artifacts |
|---|---|---|---|
| **Phase 1** | 1.1 — 1.4 | Setup & Scaffolding | `.gitignore`, FastAPI backend skeleton, React+Vite frontend skeleton, API schemas |
| **Phase 2** | 2.1 — 2.4 | Code Parsing Engine | Repo Manager, AST/Regex Parsers (Py, JS/TS), Cross-tier Linker |
| **Phase 3** | 3.1 — 3.4 | Graph Builder | Categorizer, React Flow schema builder, Dagre auto-layout, Graph APIs |
| **Phase 4** | 4.1 — 4.4 | RAG & AI Assistant | Semantic chunker, FAISS vector index, Ollama/Open-weight LLM client, Citation engine |
| **Phase 5** | 5.1 — 5.6 | UI & Visual Navigator | Glassmorphic React Flow UI, Custom Nodes, Inspector Drawer, AI Chat Drawer, Search Bar |
| **Phase 6** | 6.1 — 6.3 | Sample, Polish & Docs | Sample demo repo, E2E validation, README & Hacktoberfest submission kit |
