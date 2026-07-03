"""
lineage.tracer — deep function-level call-tree tracer + DB source capture.

Usage:
    tr = LineageTracer(project_root)
    with tr.trace("stranded-assets", "GET /dashboard") as txn:
        ... invoke the endpoint handler ...
    record = txn.to_dict()   # full lineage tree + sources + provenance

Design notes
------------
* `sys.setprofile` fires on every Python call/return. We only *record* frames
  whose source file lives under one of `include_roots` (application code), but
  we keep a per-frame map so filtered frames never imbalance the stack.
* SQLAlchemy `before/after_cursor_execute` events capture the *source* of the
  data: the SQL text, target tables, row counts and timing. Each SQL is linked
  to the application function that was on top of the call stack when it ran, so
  lineage reads "function X read N rows from table Y".
* Hard caps (max_nodes / max_depth / repr length) keep records bounded; when a
  cap trips we set a flag on the transaction so truncation is never silent.
"""

import os
import re
import sys
import time
import threading
from contextlib import contextmanager

# ── tunables ───────────────────────────────────────────────────────────────
MAX_NODES = 4000          # per-transaction cap on recorded call nodes
MAX_DEPTH = 60            # per-transaction cap on call-tree depth
MAX_REPR = 240            # max chars per arg/return repr
MAX_SQL = 2000            # per-transaction cap on captured SQL statements

# application-code path fragments we consider "interesting" to record.
DEFAULT_INCLUDE = (
    os.sep + "services" + os.sep,
    os.sep + "api" + os.sep,
    os.sep + "schemas" + os.sep,
    os.sep + "db" + os.sep,
    os.sep + "engines" + os.sep,
    "risk_engine",
    "calculation_engine",
    os.sep + "models",
)
# never record frames from these (noise / our own harness)
DEFAULT_EXCLUDE = (
    os.sep + "site-packages" + os.sep,
    os.sep + "lib" + os.sep,
    os.sep + "lineage" + os.sep,
    "<string>", "<frozen",
)

_TABLE_RE = re.compile(
    r"\b(?:from|join|into|update)\s+\"?([a-zA-Z_][a-zA-Z0-9_\.]*)\"?",
    re.IGNORECASE,
)
# tables belonging to the public reference-data layer (provenance tagging)
REFERENCE_TABLES = {
    "reference_data_sources", "reference_data_points", "reference_data_records",
}


def _safe_repr(value, maxlen=MAX_REPR):
    try:
        r = repr(value)
    except Exception as exc:  # noqa: BLE001
        try:
            r = f"<{type(value).__name__} repr-error: {exc}>"
        except Exception:  # noqa: BLE001
            r = "<unreprable>"
    r = r.replace("\n", " ")
    if len(r) > maxlen:
        r = r[: maxlen - 1] + "…"
    return r


def _rel(path, root):
    try:
        return os.path.relpath(path, root).replace("\\", "/")
    except Exception:  # noqa: BLE001
        return path


class _Node:
    __slots__ = ("id", "name", "qual", "file", "line", "args", "ret",
                 "t0", "dur_ms", "children", "depth", "sql_ids", "error")

    def __init__(self, nid, name, qual, file, line, args, depth):
        self.id = nid
        self.name = name
        self.qual = qual
        self.file = file
        self.line = line
        self.args = args
        self.ret = None
        self.t0 = time.perf_counter()
        self.dur_ms = None
        self.children = []
        self.depth = depth
        self.sql_ids = []      # indices into transaction.sources issued by this fn
        self.error = None

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "qual": self.qual,
            "file": self.file,
            "line": self.line,
            "args": self.args,
            "ret": self.ret,
            "dur_ms": round(self.dur_ms, 3) if self.dur_ms is not None else None,
            "sql": self.sql_ids,
            "error": self.error,
            "children": [c.to_dict() for c in self.children],
        }


class Transaction:
    """One E2E lineage record."""

    def __init__(self, domain, label, root_dir):
        self.domain = domain
        self.label = label
        self.root_dir = root_dir
        self.root = _Node(0, label, label, "<entry>", 0, {}, -1)
        self.sources = []         # captured SQL events (the data sources)
        self.started = None
        self.dur_ms = None
        self.status = "pending"
        self.http_status = None
        self.error = None
        self.output_summary = None
        self.inputs = {}          # arg provenance (real id / default / mock)
        self.truncated = []       # which caps tripped (never silent)
        self.node_count = 0

    # provenance ------------------------------------------------------------
    def provenance(self):
        used_ref = any(s["is_reference"] for s in self.sources)
        real_rows = any((s.get("rowcount") or 0) > 0 for s in self.sources)
        ran_sql = len(self.sources) > 0
        used_sample = self._used_sample(self.root)
        tags = []
        if used_ref:
            tags.append("reference-data")
        if real_rows:
            tags.append("real-db")
        elif ran_sql:
            tags.append("db-empty")
        if used_sample:
            tags.append("mock-sample")
        if not tags:
            tags.append("computed")  # pure transform, no DB read
        return tags

    def _used_sample(self, node):
        n = (node.qual or node.name or "").lower()
        if "sample" in n or "demo" in n or "mock" in n:
            return True
        return any(self._used_sample(c) for c in node.children)

    def source_tables(self):
        t = set()
        for s in self.sources:
            t.update(s.get("tables", []))
        return sorted(t)

    def to_dict(self):
        return {
            "domain": self.domain,
            "label": self.label,
            "status": self.status,
            "http_status": self.http_status,
            "error": self.error,
            "dur_ms": round(self.dur_ms, 3) if self.dur_ms is not None else None,
            "node_count": self.node_count,
            "provenance": self.provenance(),
            "source_tables": self.source_tables(),
            "sources": self.sources,
            "inputs": self.inputs,
            "output_summary": self.output_summary,
            "truncated": self.truncated,
            # the lineage tree (children of the synthetic entry node)
            "tree": [c.to_dict() for c in self.root.children],
        }


class LineageTracer:
    def __init__(self, project_root, include_roots=DEFAULT_INCLUDE,
                 exclude_roots=DEFAULT_EXCLUDE):
        self.root_dir = project_root
        self.include = include_roots
        self.exclude = exclude_roots
        self._txn = None
        self._stack = []           # active _Node stack
        self._frames = {}          # id(frame) -> _Node (only recorded frames)
        self._nid = 0
        self._installed_sql = False
        self._engine = None

    # ── DB source listeners ────────────────────────────────────────────────
    def _record_sql(self, statement, cursor, conn, error):
        """Record one SQL statement against the active transaction (the source)."""
        if self._txn is None:
            return
        try:
            t0 = conn.info.get("_lin_t0", []).pop()
        except Exception:  # noqa: BLE001
            t0 = time.perf_counter()
        if len(self._txn.sources) >= MAX_SQL:
            if "sql" not in self._txn.truncated:
                self._txn.truncated.append("sql")
            return
        tables = sorted(set(m.group(1).lower()
                            for m in _TABLE_RE.finditer(statement or "")))
        rowcount = None
        if cursor is not None:
            try:
                rowcount = cursor.rowcount
            except Exception:  # noqa: BLE001
                rowcount = None
        sid = len(self._txn.sources)
        self._txn.sources.append({
            "id": sid,
            "sql": _safe_repr(" ".join((statement or "").split()), 400),
            "tables": tables,
            "rowcount": rowcount,
            "dur_ms": round((time.perf_counter() - t0) * 1000, 3),
            "is_reference": any(t in REFERENCE_TABLES for t in tables),
            "error": error,
        })
        if self._stack:                          # link SQL to issuing function
            self._stack[-1].sql_ids.append(sid)

    def attach_engine(self, engine=None):
        """Listen on the SQLAlchemy Engine class so ALL engines/sessions are
        captured (services may use their own engine), including failed SQL."""
        from sqlalchemy import event
        from sqlalchemy.engine import Engine
        self._engine = engine

        def _before(conn, cursor, statement, parameters, context, executemany):
            conn.info.setdefault("_lin_t0", []).append(time.perf_counter())

        def _after(conn, cursor, statement, parameters, context, executemany):
            self._record_sql(statement, cursor, conn, error=None)

        def _on_error(ctx):
            try:
                conn = ctx.connection
                self._record_sql(getattr(ctx, "statement", None),
                                 getattr(ctx, "cursor", None), conn,
                                 error=_safe_repr(ctx.original_exception, 200))
            except Exception:  # noqa: BLE001
                pass

        event.listen(Engine, "before_cursor_execute", _before)
        event.listen(Engine, "after_cursor_execute", _after)
        event.listen(Engine, "handle_error", _on_error)
        self._installed_sql = True

    # ── profile hook ───────────────────────────────────────────────────────
    def _interesting(self, filename):
        if not filename:
            return False
        for ex in self.exclude:
            if ex in filename:
                return False
        for inc in self.include:
            if inc in filename:
                return True
        return False

    def _profile(self, frame, event, arg):
        txn = self._txn
        if txn is None:
            return
        if event == "call":
            code = frame.f_code
            fn = code.co_filename
            if not self._interesting(fn):
                return
            if txn.node_count >= MAX_NODES:
                if "nodes" not in txn.truncated:
                    txn.truncated.append("nodes")
                return
            depth = len(self._stack)
            if depth >= MAX_DEPTH:
                if "depth" not in txn.truncated:
                    txn.truncated.append("depth")
                return
            # snapshot call args (positional + kw arg names only)
            args = {}
            try:
                nargs = code.co_argcount + code.co_kwonlyargcount
                for name in code.co_varnames[:nargs]:
                    if name in ("self", "cls"):
                        continue
                    if name in frame.f_locals:
                        args[name] = _safe_repr(frame.f_locals[name])
            except Exception:  # noqa: BLE001
                pass
            self._nid += 1
            qual = getattr(code, "co_qualname", code.co_name)
            node = _Node(self._nid, code.co_name, qual,
                         _rel(fn, self.root_dir), code.co_firstlineno, args, depth)
            parent = self._stack[-1] if self._stack else txn.root
            parent.children.append(node)
            self._stack.append(node)
            self._frames[id(frame)] = node
            txn.node_count += 1
        elif event == "return":
            node = self._frames.pop(id(frame), None)
            if node is None:
                return
            node.dur_ms = (time.perf_counter() - node.t0) * 1000
            node.ret = _safe_repr(arg)
            if self._stack and self._stack[-1] is node:
                self._stack.pop()
        elif event == "exception":
            node = self._frames.get(id(frame))
            if node is not None and node.error is None:
                try:
                    node.error = _safe_repr(arg[1])
                except Exception:  # noqa: BLE001
                    node.error = "exception"

    # ── public API ──────────────────────────────────────────────────────────
    @contextmanager
    def trace(self, domain, label):
        txn = Transaction(domain, label, self.root_dir)
        self._txn = txn
        self._stack = []
        self._frames = {}
        txn.started = time.perf_counter()
        prev = sys.getprofile()
        sys.setprofile(self._profile)
        try:
            yield txn
        finally:
            sys.setprofile(prev)
            txn.dur_ms = (time.perf_counter() - txn.started) * 1000
            # close any frames left open (e.g. on exception)
            for node in list(self._frames.values()):
                if node.dur_ms is None:
                    node.dur_ms = (time.perf_counter() - node.t0) * 1000
            self._txn = None
            self._stack = []
            self._frames = {}
