# 🗺️ CodeMap AI — Visual Codebase Navigator

[![Hacktoberfest 2026](https://img.shields.io/badge/Hacktoberfest-2026%20Build%20for%20a%20Friend-orange.svg)](https://hacktoberfest.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![React 18+](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)

> **CodeMap AI** is an AI-powered visual codebase navigator that automatically analyzes unfamiliar software repositories and generates an interactive, multi-layer architecture map. Developers can visually explore dependencies, inspect code files, and ask natural language questions grounded in the repository context with line-number citations.

Built for the **Hacktoberfest 2026 "Build for a Friend"** challenge to help developers, teammates, and students instantly understand complex codebases without spending hours tracing imports manually.

---

## 🌟 Key Features

- 🔍 **Multi-Source Ingestion**: Ingest codebases via GitHub URL, ZIP archive, or local folders.
- 🌳 **Multi-Language AST Parsing**: Static analysis of Python, JavaScript, TypeScript, and Java files to extract classes, functions, imports/exports, API endpoints, and database models.
- 🗺️ **Interactive Architecture Graph**: Multi-tier visual map powered by React Flow and Dagre layout (Frontend UI, API Routes, Services, Data Models, Config).
- ⚡ **Cross-Layer Data Flow**: Automatically connects frontend API calls (`fetch`/`axios`) to backend route handlers (`@app.get`, Express routes).
- 🤖 **Privacy-First Local RAG**: Semantic vector retrieval using FAISS + SentenceTransformers, powered by open-weight LLMs (Ollama / Gemma) or cloud API fallback.
- 📑 **Line-Number Citations**: AI responses cite exact source files and line ranges with interactive jump-to-file previews.
- 💎 **Glassmorphism UI**: High-aesthetic cyber-dark theme with glowing badges, pan/zoom canvas, and instant fuzzy symbol search (`Cmd/Ctrl + K`).

---

## 🏗️ Architecture

```
                      ┌────────────────────────────────────────────────────────┐
                      │              Frontend (React + Vite)                   │
                      │  ┌───────────────────┐        ┌─────────────────────┐  │
                      │  │ React Flow Graph  │        │ AI Chat & Drawer    │  │
                      │  │ (Interactive Map) │        │ (Context Explainer) │  │
                      │  └─────────┬─────────┘        └──────────┬──────────┘  │
                      └────────────┼─────────────────────────────┼─────────────┘
                                   │ REST / SSE API
                      ┌────────────▼─────────────────────────────▼─────────────┐
                      │                 FastAPI Backend                        │
                      │  ┌───────────────────┐        ┌─────────────────────┐  │
                      │  │ Repo Ingestion    │        │ Graph Builder       │  │
                      │  │ (Git / ZIP)       │        │ (Nodes & Edges)     │  │
                      │  └─────────┬─────────┘        └──────────▲──────────┘  │
                      │            │                             │             │
                      │  ┌─────────▼─────────┐        ┌──────────┴──────────┐  │
                      │  │ Code Parser (AST) ├───────►│ Dependency Resolver │  │
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

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) [Ollama](https://ollama.ai/) with `gemma2:2b` or `llama3.2` for offline AI inference

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
Backend will be available at `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## 📜 Documentation
- [System Requirements Specification (SRS)](srs.txt)
- [Implementation Plan & Roadmap](IMPLEMENTATION_PLAN.md)

---

## 📄 License
MIT © 2026 CodeMap AI Contributors
