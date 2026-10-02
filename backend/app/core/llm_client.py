import time
import requests
import json
from typing import List, Dict, Tuple, Optional, Any
from app.config import settings
from app.schemas.chat import SourceReference, ChatMessage

SYSTEM_PROMPT = """You are CodeMap AI, an expert software architecture navigator and codebase explainer.
Your job is to help developers understand unfamiliar codebases by providing clear, accurate, and structured answers grounded strictly in the provided repository context and code snippets.

Guidelines:
1. Explain how components connect and trace data flow across layers (e.g. Frontend UI -> API Service -> Backend Route -> Database Model).
2. Always cite specific files and line numbers (e.g. `src/services/authService.js:L10-25`) when referring to implementation details.
3. Use markdown with bullet points, numbered flow steps, and code snippets where helpful.
4. If you don't find enough information in the provided context, state clearly what is known from the architecture and what remains unreferenced.
"""

class LLMClient:
    def __init__(self):
        self.ollama_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.default_model = settings.DEFAULT_LLM_MODEL

    def generate_explanation(
        self,
        question: str,
        references: List[SourceReference],
        repo_name: str = "Analyzed Repository",
        history: Optional[List[ChatMessage]] = None
    ) -> Tuple[str, str, float]:
        """Generates an answer using Ollama, Cloud LLM, or Smart Offline Synthesizer."""
        start_time = time.time()

        # Build Context String
        context_blocks = []
        for i, ref in enumerate(references, 1):
            context_blocks.append(
                f"--- [Reference {i}] {ref.relative_path} (Lines {ref.line_start}-{ref.line_end}) ---\n"
                f"{ref.snippet}\n"
            )
        context_str = "\n".join(context_blocks) if context_blocks else "No direct code references found."

        user_prompt = f"""Repository: {repo_name}

Relevant Code References:
{context_str}

User Question: {question}

Please provide a clear, step-by-step explanation with file references and line numbers:"""

        # 1. Attempt Local Ollama Call
        model_to_use = settings.DEFAULT_LLM_MODEL
        try:
            ollama_res = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": model_to_use,
                    "prompt": f"{SYSTEM_PROMPT}\n\n{user_prompt}",
                    "stream": False,
                    "options": {"temperature": 0.2, "top_p": 0.9}
                },
                timeout=60
            )
            if ollama_res.status_code == 200:
                data = ollama_res.json()
                answer = data.get("response", "").strip()
                if answer:
                    latency = round((time.time() - start_time) * 1000, 1)
                    return answer, f"Ollama ({model_to_use})", latency
        except Exception as e:
            # Ollama error or timeout, proceed to fallback
            pass

        # 2. Attempt Groq API if key present
        if settings.GROQ_API_KEY:
            try:
                groq_res = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.2
                    },
                    timeout=15
                )
                if groq_res.status_code == 200:
                    data = groq_res.json()
                    answer = data["choices"][0]["message"]["content"].strip()
                    latency = round((time.time() - start_time) * 1000, 1)
                    return answer, "Groq (Llama-3.1-8b)", latency
            except Exception:
                pass

        # 3. High-Quality Smart Offline Synthesizer (Zero-Failure Guarantee)
        answer = self._synthesize_offline_explanation(question, references, repo_name)
        latency = round((time.time() - start_time) * 1000, 1)
        return answer, "CodeMap Local Analyzer (Offline)", latency

    def _synthesize_offline_explanation(self, question: str, references: List[SourceReference], repo_name: str) -> str:
        """Generates a structured, grounded architectural answer directly from AST and RAG references."""
        q_lower = question.lower()
        files_involved = list(set([r.relative_path for r in references]))

        if not references:
            return (
                f"### Repository Analysis for *{repo_name}*\n\n"
                f"No specific code components directly matched the query **\"{question}\"**.\n\n"
                f"**Tip**: Try searching for specific filenames, component names, or API routes (e.g., `auth`, `tasks`, `login`, `models`)."
            )

        # Build structured step-by-step trace
        lines_output = []
        lines_output.append(f"### Architecture & Code Flow: {question}\n")

        if any(w in q_lower for w in ["auth", "login", "register", "token", "credential"]):
            lines_output.append("Based on the repository architecture and code scan, here is how the authentication flow operates:\n")
            step = 1
            for r in references:
                if "login.jsx" in r.relative_path.lower():
                    lines_output.append(f"{step}. **UI Form Submission** (`{r.relative_path}:L{r.line_start}-{r.line_end}`):\n"
                                        f"   - Captures user credentials and initiates the login request.")
                    step += 1
                elif "authservice" in r.relative_path.lower():
                    lines_output.append(f"{step}. **Client API Dispatch** (`{r.relative_path}:L{r.line_start}-{r.line_end}`):\n"
                                        f"   - Issues a HTTP request (`/api/auth/login`) with authorization headers.")
                    step += 1
                elif "auth.py" in r.relative_path.lower() or "auth" in r.relative_path.lower():
                    lines_output.append(f"{step}. **Backend Route & Token Generation** (`{r.relative_path}:L{r.line_start}-{r.line_end}`):\n"
                                        f"   - Validates input credentials and issues a session token/JWT.")
                    step += 1
                elif "user.py" in r.relative_path.lower():
                    lines_output.append(f"{step}. **Data Model Validation** (`{r.relative_path}:L{r.line_start}-{r.line_end}`):\n"
                                        f"   - Defines data schemas (`UserLogin`, `UserRegister`, `UserResponse`).")
                    step += 1

        elif any(w in q_lower for w in ["task", "todo", "data", "fetch", "list"]):
            lines_output.append("Based on the analyzed code relationships, here is the component and data flow:\n")
            step = 1
            for r in references:
                lines_output.append(f"{step}. **Component / Handler** (`{r.relative_path}:L{r.line_start}-{r.line_end}`):\n"
                                    f"   - Symbol: `{r.symbol_name or 'Module'}`\n"
                                    f"   - Implements data management and request handling logic.")
                step += 1

        else:
            lines_output.append(f"The following **{len(references)} relevant code segments** implement this functionality:\n")
            for i, r in enumerate(references, 1):
                sym_str = f" (`{r.symbol_name}`)" if r.symbol_name else ""
                lines_output.append(f"{i}. **`{r.relative_path}`** lines **{r.line_start}-{r.line_end}**{sym_str}\n"
                                    f"   ```\n   {r.snippet.splitlines()[0] if r.snippet else ''}\n   ```")

        lines_output.append("\n#### Source References:")
        for r in references:
            lines_output.append(f"- [`{r.relative_path}` (Lines {r.line_start}-{r.line_end})](file:///{r.file_path})")

        return "\n".join(lines_output)


# Global singleton
llm_client = LLMClient()
