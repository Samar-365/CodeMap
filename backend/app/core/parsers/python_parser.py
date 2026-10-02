import ast
from typing import List, Optional, Dict, Any
from app.core.parsers.base_parser import BaseParser, ParsedFileInfo
from app.schemas.graph import SymbolInfo, SymbolType, EndpointInfo, LayerType

class PythonASTParser(BaseParser):
    def can_parse(self, file_path: str) -> bool:
        return file_path.lower().endswith(".py")

    def parse(self, content: str, rel_path: str) -> ParsedFileInfo:
        imports: List[str] = []
        exports: List[str] = []
        symbols: List[SymbolInfo] = []
        endpoints: List[EndpointInfo] = []
        database_models: List[str] = []
        tags: List[str] = []
        purpose_summary = ""

        try:
            tree = ast.parse(content)
        except SyntaxError as e:
            return ParsedFileInfo(
                relative_path=rel_path,
                language="Python",
                layer=LayerType.UNKNOWN,
                purpose_summary=f"Python source file (Syntax error at line {e.lineno})",
                tags=["syntax_error"]
            )

        # 1. Module Docstring
        module_doc = ast.get_docstring(tree)
        if module_doc:
            purpose_summary = module_doc.strip().split("\n")[0]

        # 2. Walk AST Nodes
        for node in tree.body:
            # Imports
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                mod = node.module or ""
                if node.level and node.level > 0:
                    mod = "." * node.level + mod
                imports.append(mod)

            # Classes
            elif isinstance(node, ast.ClassDef):
                class_doc = ast.get_docstring(node) or ""
                base_names = [self._get_node_name(b) for b in node.bases]
                
                # Check for models / schemas
                is_model = any(b in ["BaseModel", "Model", "Base", "Entity", "Document", "Schema"] for b in base_names)
                if is_model or "model" in rel_path.lower() or "schema" in rel_path.lower():
                    database_models.append(node.name)
                    sym_type = SymbolType.MODEL
                else:
                    sym_type = SymbolType.CLASS

                symbols.append(SymbolInfo(
                    name=node.name,
                    symbol_type=sym_type,
                    line_start=node.lineno,
                    line_end=getattr(node, "end_lineno", node.lineno),
                    docstring=class_doc.split("\n")[0] if class_doc else None,
                    parameters=base_names
                ))
                exports.append(node.name)

            # Functions & Route Handlers
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_doc = ast.get_docstring(node) or ""
                endpoint_detected = self._extract_route_decorator(node)
                
                if endpoint_detected:
                    endpoints.append(endpoint_detected)
                    sym_type = SymbolType.ROUTE_HANDLER
                else:
                    sym_type = SymbolType.FUNCTION

                params = [arg.arg for arg in node.args.args]
                symbols.append(SymbolInfo(
                    name=node.name,
                    symbol_type=sym_type,
                    line_start=node.lineno,
                    line_end=getattr(node, "end_lineno", node.lineno),
                    docstring=func_doc.split("\n")[0] if func_doc else None,
                    parameters=params
                ))
                exports.append(node.name)

        # 3. Determine Layer
        layer = self._determine_layer(rel_path, endpoints, database_models, symbols)

        # 4. Generate purpose summary if not in docstring
        if not purpose_summary:
            purpose_summary = self._generate_summary(rel_path, layer, endpoints, database_models, symbols)

        return ParsedFileInfo(
            relative_path=rel_path,
            language="Python",
            layer=layer,
            purpose_summary=purpose_summary,
            imports=imports,
            exports=exports,
            symbols=symbols,
            endpoints=endpoints,
            database_models=database_models,
            tags=tags
        )

    def _get_node_name(self, node: ast.AST) -> str:
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_node_name(node.value)}.{node.attr}"
        return ""

    def _extract_route_decorator(self, func_node: ast.AST) -> Optional[EndpointInfo]:
        """Detects @app.get('/...'), @router.post('/...'), @auth_router.patch('/...')"""
        http_methods = {"get", "post", "put", "delete", "patch", "options", "head", "route"}
        for dec in func_node.decorator_list:
            if isinstance(dec, ast.Call):
                func = dec.func
                method = ""
                if isinstance(func, ast.Attribute) and func.attr.lower() in http_methods:
                    method = func.attr.upper()
                
                if method:
                    path = "/"
                    if dec.args and isinstance(dec.args[0], ast.Constant) and isinstance(dec.args[0].value, str):
                        path = dec.args[0].value
                    
                    doc = ast.get_docstring(func_node) or ""
                    return EndpointInfo(
                        method=method,
                        path=path,
                        handler_name=func_node.name,
                        line_number=func_node.lineno,
                        summary=doc.split("\n")[0] if doc else f"Handler for {method} {path}"
                    )
        return None

    def _determine_layer(self, rel_path: str, endpoints: List[EndpointInfo], models: List[str], symbols: List[SymbolInfo]) -> LayerType:
        path_lower = rel_path.lower().replace("\\", "/")
        if endpoints or any(k in path_lower for k in ["/routes/", "/api/", "/controllers/", "/endpoints/"]):
            return LayerType.API_ROUTE
        if models or any(k in path_lower for k in ["/models/", "/schemas/", "/entities/", "/db/"]):
            return LayerType.DATA_MODEL
        if any(k in path_lower for k in ["/services/", "/logic/", "/lib/"]):
            return LayerType.SERVICE
        if any(k in path_lower for k in ["/utils/", "/common/", "/helpers/"]):
            return LayerType.UTILITY
        if any(k in path_lower for k in ["config", "settings", "env"]):
            return LayerType.CONFIG
        if "main.py" in path_lower or "app.py" in path_lower:
            return LayerType.API_ROUTE
        return LayerType.SERVICE

    def _generate_summary(self, rel_path: str, layer: LayerType, endpoints: List[EndpointInfo], models: List[str], symbols: List[SymbolInfo]) -> str:
        filename = rel_path.split("/")[-1]
        if endpoints:
            routes_str = ", ".join([f"{e.method} {e.path}" for e in endpoints[:3]])
            if len(endpoints) > 3:
                routes_str += f" (+{len(endpoints)-3} more)"
            return f"Exposes API endpoints: {routes_str}"
        elif models:
            models_str = ", ".join(models[:4])
            return f"Defines data models & schemas: {models_str}"
        elif symbols:
            funcs_str = ", ".join([s.name for s in symbols[:4]])
            return f"Implements business logic: {funcs_str}"
        return f"Python module {filename}"
