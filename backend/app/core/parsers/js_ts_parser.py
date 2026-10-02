import re
from typing import List, Optional, Dict, Any, Set
from app.core.parsers.base_parser import BaseParser, ParsedFileInfo
from app.schemas.graph import SymbolInfo, SymbolType, EndpointInfo, LayerType

class JsTsParser(BaseParser):
    SUPPORTED_EXTENSIONS = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"}

    def can_parse(self, file_path: str) -> bool:
        return any(file_path.lower().endswith(ext) for ext in self.SUPPORTED_EXTENSIONS)

    def parse(self, content: str, rel_path: str) -> ParsedFileInfo:
        imports: List[str] = []
        exports: List[str] = []
        symbols: List[SymbolInfo] = []
        endpoints: List[EndpointInfo] = []
        calls_endpoints: List[str] = []
        database_models: List[str] = []
        tags: List[str] = []
        
        lines = content.split("\n")
        ext = "." + rel_path.split(".")[-1].lower()
        is_react = ext in [".jsx", ".tsx"] or "react" in content.lower()

        # 1. Extract Imports
        # ES6: import ... from '...'; or import '...';
        es6_imports = re.findall(r'''import\s+(?:(?:[\w*\s{},]+)\s+from\s+)?['"]([^'"]+)['"]''', content)
        for imp in es6_imports:
            if imp not in imports:
                imports.append(imp)

        # CommonJS: require('...')
        cjs_imports = re.findall(r'''require\s*\(\s*['"]([^'"]+)['"]\s*\)''', content)
        for imp in cjs_imports:
            if imp not in imports:
                imports.append(imp)

        # 2. Extract Exports
        # export default function/class/identifier
        exp_defaults = re.findall(r'export\s+default\s+(?:function|class)?\s*([A-Za-z0-9_$]+)', content)
        for exp in exp_defaults:
            exports.append(f"default:{exp}")

        # export function/class/const
        exp_named = re.findall(r'export\s+(?:const|let|var|function|class|type|interface)\s+([A-Za-z0-9_$]+)', content)
        for exp in exp_named:
            if exp not in exports:
                exports.append(exp)

        # 3. Extract Client API Calls (fetch / axios)
        # fetch('/api/...') or fetch(`/api/...`)
        fetch_calls = re.findall(r'''fetch\s*\(\s*[`'"]([/a-zA-Z0-9_\-:${}]+)[`'"]''', content)
        for call in fetch_calls:
            if call not in calls_endpoints:
                calls_endpoints.append(call)

        # axios.get('/api/...') or axios.post('/api/...')
        axios_calls = re.findall(r'''axios\.(?:get|post|put|delete|patch)\s*\(\s*[`'"]([/a-zA-Z0-9_\-:${}]+)[`'"]''', content)
        for call in axios_calls:
            if call not in calls_endpoints:
                calls_endpoints.append(call)

        # 4. Extract Backend Route Endpoints (Express / Fastify / Nest)
        # router.get('/path', ...), app.post('/path', ...)
        route_pattern = re.compile(r'''(?:app|router|server)\.(get|post|put|delete|patch|options)\s*\(\s*['"`]([^'"`]+)['"`]''', re.IGNORECASE)
        for i, line in enumerate(lines, 1):
            match = route_pattern.search(line)
            if match:
                method = match.group(1).upper()
                path = match.group(2)
                endpoints.append(EndpointInfo(
                    method=method,
                    path=path,
                    handler_name=f"route_{method.lower()}_{path.replace('/', '_').strip('_')}",
                    line_number=i,
                    summary=f"Express endpoint: {method} {path}"
                ))

        # 5. Extract Functions, Classes & React Components
        # Functions: function ComponentName(...) or const ComponentName = (...) =>
        func_pattern = re.compile(r'(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)')
        arrow_pattern = re.compile(r'(?:export\s+)?(?:const|let)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>')
        class_pattern = re.compile(r'(?:export\s+)?class\s+([A-Za-z0-9_$]+)(?:\s+extends\s+([A-Za-z0-9_$]+))?')

        for i, line in enumerate(lines, 1):
            # Regular function
            f_match = func_pattern.search(line)
            if f_match:
                name = f_match.group(1)
                params = [p.strip() for p in f_match.group(2).split(",") if p.strip()]
                # React component heuristic: Starts with uppercase letter
                is_comp = name[0].isupper() and is_react
                symbols.append(SymbolInfo(
                    name=name,
                    symbol_type=SymbolType.COMPONENT if is_comp else SymbolType.FUNCTION,
                    line_start=i,
                    line_end=i + 1,
                    parameters=params
                ))

            # Arrow function
            a_match = arrow_pattern.search(line)
            if a_match:
                name = a_match.group(1)
                params = [p.strip() for p in a_match.group(2).split(",") if p.strip()]
                is_comp = name[0].isupper() and is_react
                symbols.append(SymbolInfo(
                    name=name,
                    symbol_type=SymbolType.COMPONENT if is_comp else SymbolType.FUNCTION,
                    line_start=i,
                    line_end=i + 1,
                    parameters=params
                ))

            # Class
            c_match = class_pattern.search(line)
            if c_match:
                name = c_match.group(1)
                base = c_match.group(2) or ""
                symbols.append(SymbolInfo(
                    name=name,
                    symbol_type=SymbolType.CLASS,
                    line_start=i,
                    line_end=i + 1,
                    parameters=[base] if base else []
                ))

        # TypeScript Interfaces & Types
        if ext in [".ts", ".tsx"]:
            type_pattern = re.compile(r'(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_$]+)')
            for i, line in enumerate(lines, 1):
                t_match = type_pattern.search(line)
                if t_match:
                    name = t_match.group(1)
                    database_models.append(name)
                    symbols.append(SymbolInfo(
                        name=name,
                        symbol_type=SymbolType.INTERFACE,
                        line_start=i,
                        line_end=i + 1
                    ))

        # 6. Determine Architectural Layer
        layer = self._determine_layer(rel_path, is_react, endpoints, calls_endpoints, symbols)

        # 7. Generate Purpose Summary
        purpose_summary = self._generate_summary(rel_path, layer, symbols, endpoints, calls_endpoints)

        return ParsedFileInfo(
            relative_path=rel_path,
            language="TypeScript" if ext in [".ts", ".tsx"] else "JavaScript",
            layer=layer,
            purpose_summary=purpose_summary,
            imports=imports,
            exports=exports,
            symbols=symbols,
            endpoints=endpoints,
            database_models=database_models,
            calls_endpoints=calls_endpoints,
            tags=tags
        )

    def _determine_layer(
        self,
        rel_path: str,
        is_react: bool,
        endpoints: List[EndpointInfo],
        calls_endpoints: List[str],
        symbols: List[SymbolInfo]
    ) -> LayerType:
        path_lower = rel_path.lower().replace("\\", "/")

        if endpoints:
            return LayerType.API_ROUTE

        if any(s.symbol_type == SymbolType.COMPONENT for s in symbols) or any(k in path_lower for k in ["/components/", "/pages/", "/views/", "/frontend/"]):
            return LayerType.FRONTEND

        if calls_endpoints or any(k in path_lower for k in ["/services/", "/api/", "/clients/"]):
            return LayerType.SERVICE

        if any(k in path_lower for k in ["/models/", "/types/", "/schemas/", "/interfaces/"]):
            return LayerType.DATA_MODEL

        if any(k in path_lower for k in ["/utils/", "/helpers/", "/common/"]):
            return LayerType.UTILITY

        if any(k in path_lower for k in ["vite.config", "webpack", "package.json", "tsconfig", "tailwind", "postcss"]):
            return LayerType.CONFIG

        if is_react:
            return LayerType.FRONTEND

        return LayerType.SERVICE

    def _generate_summary(
        self,
        rel_path: str,
        layer: LayerType,
        symbols: List[SymbolInfo],
        endpoints: List[EndpointInfo],
        calls_endpoints: List[str]
    ) -> str:
        filename = rel_path.split("/")[-1]
        components = [s.name for s in symbols if s.symbol_type == SymbolType.COMPONENT]
        
        if components:
            return f"React UI component: {', '.join(components[:3])}"
        elif endpoints:
            routes_str = ", ".join([f"{e.method} {e.path}" for e in endpoints[:3]])
            return f"Backend API Router exposing: {routes_str}"
        elif calls_endpoints:
            return f"Client service making API calls to: {', '.join(calls_endpoints[:3])}"
        elif symbols:
            return f"Module defining functions: {', '.join([s.name for s in symbols[:3]])}"
        return f"JavaScript/TypeScript module {filename}"
