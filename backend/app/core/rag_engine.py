import os
import re
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
from pydantic import BaseModel, Field

from app.config import settings
from app.schemas.chat import SourceReference
from app.schemas.graph import GraphDataResponse, NodeData, LayerType
from app.schemas.repo import RepoFileManifest

class CodeChunk(BaseModel):
    chunk_id: str
    file_path: str
    relative_path: str
    line_start: int
    line_end: int
    symbol_name: Optional[str] = None
    chunk_type: str = "block"
    header: str = ""
    raw_code: str = ""
    embedding_text: str = ""

class RAGEngine:
    def __init__(self):
        self._embedder = None
        self._indexes: Dict[str, Any] = {}          # repo_id -> faiss index or vector matrix
        self._chunks: Dict[str, List[CodeChunk]] = {} # repo_id -> list of CodeChunk
        self._initialized_model = False

    def _get_embedder(self):
        """Lazy load sentence-transformers model to save memory until needed."""
        if self._embedder is None and not self._initialized_model:
            try:
                from sentence_transformers import SentenceTransformer
                print(f"[RAGEngine] Loading embedding model: {settings.EMBEDDING_MODEL}")
                self._embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
                self._initialized_model = True
            except Exception as e:
                print(f"[RAGEngine] Note: SentenceTransformer fallback mode: {e}")
                self._embedder = None
                self._initialized_model = True
        return self._embedder

    def chunk_file(self, rel_path: str, abs_path: Path, node_data: Optional[NodeData] = None) -> List[CodeChunk]:
        """Splits source code into semantic, function/class-preserving chunks."""
        chunks: List[CodeChunk] = []
        if not abs_path.exists():
            return chunks

        try:
            with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
        except Exception:
            return chunks

        total_lines = len(lines)
        if total_lines == 0:
            return chunks

        # 1. If we have AST symbols, chunk around symbols
        if node_data and node_data.symbols:
            covered_ranges = set()
            for sym in node_data.symbols:
                s_start = max(1, sym.line_start)
                s_end = min(total_lines, max(sym.line_end, s_start + 1))
                covered_ranges.add((s_start, s_end))

                code_snippet = "".join(lines[s_start - 1:s_end])
                header = f"File: {rel_path} | {sym.symbol_type.value}: {sym.name} | Lines {s_start}-{s_end}"
                embedding_text = f"{header}\n{sym.docstring or ''}\n{code_snippet}".strip()

                chunks.append(CodeChunk(
                    chunk_id=f"{rel_path}:{s_start}-{s_end}",
                    file_path=str(abs_path),
                    relative_path=rel_path,
                    line_start=s_start,
                    line_end=s_end,
                    symbol_name=sym.name,
                    chunk_type=sym.symbol_type.value,
                    header=header,
                    raw_code=code_snippet,
                    embedding_text=embedding_text
                ))

            # Add file overview header chunk
            overview_lines = "".join(lines[:min(25, total_lines)])
            chunks.append(CodeChunk(
                chunk_id=f"{rel_path}:header",
                file_path=str(abs_path),
                relative_path=rel_path,
                line_start=1,
                line_end=min(25, total_lines),
                symbol_name=Path(rel_path).stem,
                chunk_type="file_overview",
                header=f"File: {rel_path} | Overview: {node_data.purpose_summary}",
                raw_code=overview_lines,
                embedding_text=f"File: {rel_path}\nPurpose: {node_data.purpose_summary}\n{overview_lines}"
            ))
            return chunks

        # 2. Fallback: Sliding window chunking (35 lines with 10 line overlap)
        chunk_size = 35
        overlap = 10
        start = 0
        while start < total_lines:
            end = min(total_lines, start + chunk_size)
            code_snippet = "".join(lines[start:end])
            header = f"File: {rel_path} | Lines {start + 1}-{end}"
            embedding_text = f"{header}\n{code_snippet}".strip()

            chunks.append(CodeChunk(
                chunk_id=f"{rel_path}:{start + 1}-{end}",
                file_path=str(abs_path),
                relative_path=rel_path,
                line_start=start + 1,
                line_end=end,
                symbol_name=None,
                chunk_type="block",
                header=header,
                raw_code=code_snippet,
                embedding_text=embedding_text
            ))

            if end == total_lines:
                break
            start += chunk_size - overlap

        return chunks

    def index_repository(self, repo_id: str, root_path: Path, manifest: List[RepoFileManifest], graph: Optional[GraphDataResponse] = None):
        """Builds semantic vector index for the repository."""
        node_map = {n.data.relative_path: n.data for n in graph.nodes} if graph else {}
        all_chunks: List[CodeChunk] = []

        for m in manifest:
            abs_path = root_path / m.relative_path
            node_data = node_map.get(m.relative_path)
            file_chunks = self.chunk_file(m.relative_path, abs_path, node_data)
            all_chunks.extend(file_chunks)

        self._chunks[repo_id] = all_chunks
        if not all_chunks:
            return

        embedder = self._get_embedder()
        texts = [c.embedding_text for c in all_chunks]

        if embedder is not None:
            try:
                import faiss
                embeddings = embedder.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
                dim = embeddings.shape[1]
                index = faiss.IndexFlatIP(dim)  # Inner Product on normalized vectors = Cosine Similarity
                index.add(embeddings.astype(np.float32))
                self._indexes[repo_id] = {"type": "faiss", "index": index}
                print(f"[RAGEngine] Indexed {len(all_chunks)} chunks with FAISS for repo {repo_id}")
                return
            except Exception as e:
                print(f"[RAGEngine] FAISS indexing error, falling back to lexical matcher: {e}")

        # Fallback lexical representation
        self._indexes[repo_id] = {"type": "lexical", "texts": [t.lower() for t in texts]}

    def retrieve(
        self,
        repo_id: str,
        query: str,
        top_k: int = 5,
        selected_node_id: Optional[str] = None
    ) -> List[SourceReference]:
        """Retrieves top-k relevant code snippets with exact line citations."""
        chunks = self._chunks.get(repo_id, [])
        if not chunks:
            return []

        # If a specific node is selected by user, prioritize chunks from that file
        boosted_chunks: List[Tuple[CodeChunk, float]] = []
        embedder = self._get_embedder()
        index_data = self._indexes.get(repo_id)

        if embedder is not None and index_data and index_data.get("type") == "faiss":
            try:
                query_vec = embedder.encode([query], convert_to_numpy=True, normalize_embeddings=True)
                index = index_data["index"]
                scores, indices = index.search(query_vec.astype(np.float32), min(len(chunks), top_k * 2))

                for score, idx in zip(scores[0], indices[0]):
                    if idx >= 0 and idx < len(chunks):
                        c = chunks[idx]
                        final_score = float(score)
                        if selected_node_id and (c.relative_path == selected_node_id or c.file_path == selected_node_id):
                            final_score += 0.3  # Boost active file
                        boosted_chunks.append((c, final_score))
            except Exception as e:
                print(f"[RAGEngine] Vector search error: {e}")

        # Lexical scoring fallback if needed
        if not boosted_chunks:
            q_tokens = set(re.findall(r'\w+', query.lower()))
            for c in chunks:
                c_text = c.embedding_text.lower()
                matches = sum(1 for tok in q_tokens if tok in c_text)
                score = matches / (len(q_tokens) + 1)
                if selected_node_id and (c.relative_path == selected_node_id or c.file_path == selected_node_id):
                    score += 0.5
                if score > 0:
                    boosted_chunks.append((c, score))

        # Sort by relevance score descending
        boosted_chunks.sort(key=lambda x: x[1], reverse=True)
        top_results = boosted_chunks[:top_k]

        references: List[SourceReference] = []
        for chunk, score in top_results:
            references.append(SourceReference(
                file_path=chunk.file_path,
                relative_path=chunk.relative_path,
                line_start=chunk.line_start,
                line_end=chunk.line_end,
                snippet=chunk.raw_code.strip(),
                relevance_score=round(float(score), 3),
                symbol_name=chunk.symbol_name
            ))

        return references

# Global singleton
rag_engine = RAGEngine()
