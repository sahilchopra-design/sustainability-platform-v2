"""
lineage.runner — exercise a domain's endpoints in-process under the tracer.

Routes are auto-discovered from the live FastAPI app by path prefix, so the
same runner scales from one domain to every endpoint on the platform. Each
endpoint handler is invoked *directly* (single-threaded) so the setprofile
tracer captures the complete application call tree. Inputs are built
real-data-first: GET/list endpoints run first and their ids seed the
detail/compute endpoints; anything still required is mock-filled (tagged).
"""

import os
import sys
import json
import time
import asyncio
import inspect
import datetime

# make backend/ importable when run as a script
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from lineage.tracer import LineageTracer, Transaction   # noqa: E402
from lineage import mockgen                     # noqa: E402
from lineage import recorder                    # noqa: E402

# POST endpoints matching these are pure computation (safe to exercise);
# any other POST/PUT/PATCH/DELETE is treated as a mutation and skipped in the
# default read-only mode so we never write to the production database.
_COMPUTE_HINTS = (
    "calculate", "analysis", "analyse", "analyze", "compute", "comparison",
    "simulate", "score", "assess", "preview", "project", "estimate",
    "forecast", "optimize", "optimise", "whatif", "what-if", "stress",
    "scenario", "valuation", "evaluate", "screen", "benchmark",
)
_MUTATION_PREFIXES = ("create_", "add_", "update_", "delete_", "remove_",
                      "upsert_", "import_", "upload_", "sync_", "save_",
                      "register_", "generate_", "post_", "put_", "patch_")


def _is_mutation(method, path, handler_name):
    if method in ("DELETE", "PUT", "PATCH"):
        return True
    if method == "POST":
        blob = (path + " " + (handler_name or "")).lower()
        if any(h in blob for h in _COMPUTE_HINTS):
            return False
        if (handler_name or "").lower().startswith(_MUTATION_PREFIXES):
            return True
        return True   # default: treat unknown POST as a write -> skip for safety
    return False      # GET / HEAD are safe


def _is_pydantic(ann):
    return hasattr(ann, "model_fields") or hasattr(ann, "__fields__")


def _jsonable(obj):
    """Best-effort summary of a handler's output for the lineage record."""
    try:
        if hasattr(obj, "model_dump"):
            obj = obj.model_dump()
        elif hasattr(obj, "dict"):
            obj = obj.dict()
    except Exception:  # noqa: BLE001
        pass
    if isinstance(obj, dict):
        keys = list(obj.keys())
        return {"type": "object", "keys": keys[:25],
                "n_keys": len(keys)}
    if isinstance(obj, (list, tuple)):
        return {"type": "array", "len": len(obj),
                "item0_keys": (list(obj[0].keys())[:15]
                               if obj and isinstance(obj[0], dict) else None)}
    return {"type": type(obj).__name__, "repr": str(obj)[:200]}


def _harvest_ids(result):
    """Pull plausible identifiers out of a list response to seed detail calls."""
    ids = []
    try:
        data = result.model_dump() if hasattr(result, "model_dump") else (
            result.dict() if hasattr(result, "dict") else result)
    except Exception:  # noqa: BLE001
        data = result
    items = None
    if isinstance(data, dict):
        for k in ("items", "data", "results", "reserves", "plants", "assets"):
            if isinstance(data.get(k), list):
                items = data[k]
                break
    elif isinstance(data, list):
        items = data
    for it in (items or [])[:5]:
        if isinstance(it, dict):
            for k in ("id", "uuid", "reserve_id", "plant_id", "asset_id",
                      "scenario_id", "pathway_id"):
                if it.get(k):
                    ids.append(str(it[k]))
                    break
    return ids


class LineageRunner:
    def __init__(self, allow_writes=False):
        from db.base import engine, SessionLocal
        self.engine = engine
        self.SessionLocal = SessionLocal
        self.allow_writes = allow_writes      # default read-only (no DB writes)
        self.tracer = LineageTracer(BACKEND_DIR)
        self.tracer.attach_engine(engine)

    # ── route discovery (from a directly-imported router) ───────────────────
    def discover(self, router):
        routes = []
        for r in getattr(router, "routes", []):
            path = getattr(r, "path", "")
            methods = getattr(r, "methods", None) or set()
            endpoint = getattr(r, "endpoint", None)
            if endpoint:
                for m in sorted(methods - {"HEAD", "OPTIONS"}):
                    routes.append((m, path, r))
        # GETs first so list endpoints seed ids for detail/compute endpoints
        routes.sort(key=lambda x: (x[0] != "GET", x[1]))
        return routes

    # ── argument construction (real-data-first) ─────────────────────────────
    def _build_args(self, endpoint, path, seeds, input_log):
        kwargs = {}
        sig = inspect.signature(endpoint)
        for name, param in sig.parameters.items():
            ann = param.annotation
            default = param.default
            # Depends(get_db) -> inject a real session
            if default is not inspect.Parameter.empty and \
                    default.__class__.__name__ == "Depends":
                dep = getattr(default, "dependency", None)
                if dep is not None and getattr(dep, "__name__", "") == "get_db":
                    kwargs[name] = self.SessionLocal()
                    input_log[name] = "<real db session>"
                continue
            # request-body pydantic models
            if _is_pydantic(ann):
                overrides = {}
                data = mockgen.build(ann, overrides=overrides, seed=name)
                try:
                    kwargs[name] = ann(**data)
                except Exception:                       # validation fallback
                    try:
                        kwargs[name] = ann.model_construct(**data)
                    except Exception:  # noqa: BLE001
                        kwargs[name] = ann.construct(**data) \
                            if hasattr(ann, "construct") else data
                input_log[name] = f"<{getattr(ann, '__name__', 'model')} (mock)>"
                continue
            # path param needing a real id
            if "{" + name + "}" in path:
                seeded = seeds.get("ids")
                if seeded:
                    kwargs[name] = seeded[0]
                    input_log[name] = f"{seeded[0]} (real id)"
                else:
                    kwargs[name] = "550e8400-e29b-41d4-a716-446655440001"
                    input_log[name] = f"{kwargs[name]} (mock id)"
                continue
            # query params: FastAPI markers (Query/Path/...) carry the *real*
            # default in `.default`. Direct invocation bypasses FastAPI's
            # resolution, so we must pass that value explicitly (passing the
            # marker object itself breaks the DB driver).
            if default is not inspect.Parameter.empty:
                real = getattr(default, "default", default)
                required = (real is Ellipsis or
                            real.__class__.__name__ in
                            ("PydanticUndefinedType", "UndefinedType", "ellipsis"))
                if not required:
                    kwargs[name] = real
                    input_log[name] = f"{real!r} (default)"
                    continue
                kwargs[name] = mockgen._mock_scalar(
                    ann if ann is not inspect.Parameter.empty else str, name)
                input_log[name] = f"{kwargs[name]!r} (mock-required)"
                continue
            kwargs[name] = mockgen._mock_scalar(
                ann if ann is not inspect.Parameter.empty else str, name)
            input_log[name] = f"{kwargs[name]!r} (mock)"
        return kwargs

    def _invoke(self, endpoint, kwargs):
        if inspect.iscoroutinefunction(endpoint):
            return asyncio.run(endpoint(**kwargs))
        res = endpoint(**kwargs)
        if inspect.iscoroutine(res):
            return asyncio.run(res)
        return res

    # ── domain run ───────────────────────────────────────────────────────────
    def run_domain(self, domain, module_path, attr="router"):
        import importlib
        router = getattr(importlib.import_module(module_path), attr)
        routes = self.discover(router)
        return self._run_routes(domain, routes,
                                {"module": module_path,
                                 "router_prefix": getattr(router, "prefix", "")})

    def run_app_subset(self, domain, predicate):
        """Sweep routes from the live server.app that match predicate(method, path).

        Used for the non-/api/v1 legacy surface (inline @app endpoints + routers
        with non-v1 prefixes) now that server.app assembles correctly."""
        from server import app
        routes = []
        for r in app.routes:
            path = getattr(r, "path", "")
            methods = getattr(r, "methods", None) or set()
            endpoint = getattr(r, "endpoint", None)
            if not endpoint:
                continue
            for m in sorted(methods - {"HEAD", "OPTIONS"}):
                if predicate(m, path):
                    routes.append((m, path, r))
        routes.sort(key=lambda x: (x[0] != "GET", x[1]))
        return self._run_routes(domain, routes, {"source": "server.app", "predicate": domain})

    def _run_routes(self, domain, routes, meta_extra):
        from sqlalchemy.orm import Session
        seeds = {"ids": []}
        transactions = []
        for method, path, route in routes:
            endpoint = route.endpoint
            label = f"{method} {path}"
            # read-only safety: do not exercise mutating endpoints
            if not self.allow_writes and _is_mutation(method, path,
                                                      getattr(endpoint, "__name__", "")):
                sk = Transaction(domain, label, BACKEND_DIR)
                sk.status = "skipped"
                sk.error = "mutation endpoint — skipped in read-only mode (protects production DB)"
                transactions.append(sk)
                print(f"  [skip  ] {label:48} (mutation; read-only mode)")
                continue
            input_log = {}
            kwargs = {}
            with self.tracer.trace(domain, label) as txn:
                try:
                    kwargs = self._build_args(endpoint, path, seeds, input_log)
                    result = self._invoke(endpoint, kwargs)
                    txn.status = "passed"
                    txn.http_status = 200
                    txn.output_summary = _jsonable(result)
                    if method == "GET" and "{" not in path:
                        for i in _harvest_ids(result):
                            if i not in seeds["ids"]:
                                seeds["ids"].append(i)
                except Exception as exc:                       # noqa: BLE001
                    txn.status = "failed"
                    txn.error = f"{type(exc).__name__}: {exc}"[:400]
                    txn.http_status = getattr(exc, "status_code", 500)
                finally:
                    for v in kwargs.values():                  # close db sessions
                        if isinstance(v, Session):
                            try:
                                v.close()
                            except Exception:  # noqa: BLE001
                                pass
            txn.inputs = input_log
            print(f"  [{txn.status:6}] {label:48} "
                  f"fns={txn.node_count:4} sql={len(txn.sources):2} "
                  f"{','.join(txn.provenance())}")
            transactions.append(txn)

        # rollup
        passed = sum(1 for t in transactions if t.status == "passed")
        failed = sum(1 for t in transactions if t.status == "failed")
        skipped = sum(1 for t in transactions if t.status == "skipped")
        functions = sum(t.node_count for t in transactions)
        sqls = sum(len(t.sources) for t in transactions)
        meta = {"ts": datetime.datetime.now().isoformat(timespec="seconds"),
                "endpoints": len(transactions), **meta_extra}
        recorder.write_domain(domain, transactions, meta)
        recorder.update_summary({domain: {
            "prefix": meta_extra.get("router_prefix", meta_extra.get("source", "")),
            "transactions": len(transactions),
            "passed": passed, "failed": failed, "skipped": skipped,
            "functions_traced": functions, "sql_statements": sqls,
            "ts": meta["ts"],
        }})
        return {"domain": domain, "endpoints": len(transactions),
                "passed": passed, "failed": failed, "skipped": skipped,
                "functions_traced": functions, "sql_statements": sqls}
