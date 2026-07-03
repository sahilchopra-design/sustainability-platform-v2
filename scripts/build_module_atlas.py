"""
Module Atlas builder — function map + interconnections + end-to-end data lineage
for every frontend module. Output feeds the Notion wiki and lives in-repo as the
canonical machine-readable source.

Fuses five evidence layers:
  1. MODULE_GUIDES (human-authored: title, methodology, per-metric formula/source)
  2. App.js routing + feature-dir code scan (components, API calls, computed values)
  3. Backend route files (endpoints, engine imports, SQL tables)
  4. Engine AST (function signatures, docstrings, arithmetic transformation lines)
  5. Lineage harness traces (269 domains: provenance, source tables, call trees)

Usage (from repo root):  python scripts/build_module_atlas.py
Outputs: docs/module_atlas/atlas.json + docs/module_atlas/modules/<id>.md
"""
import ast
import json
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FE = os.path.join(ROOT, "frontend", "src")
BE = os.path.join(ROOT, "backend")
OUT = os.path.join(ROOT, "docs", "module_atlas")
os.makedirs(os.path.join(OUT, "modules"), exist_ok=True)

sys.stdout.reconfigure(encoding="utf-8")


def read(p):
    try:
        with open(p, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


# ── 1. Guides ────────────────────────────────────────────────────────────────
GUIDES = json.load(open(os.path.join(OUT, "module_guides.json"), encoding="utf-8"))

# ── 2. App.js: route -> component -> feature dir ────────────────────────────
app_src = read(os.path.join(FE, "App.js"))
lazy_map = {}   # ComponentName -> feature dir
for m in re.finditer(r"const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(['\"]\./features/([^/'\"]+)", app_src):
    lazy_map[m.group(1)] = m.group(2)
route_map = {}  # feature_dir -> route path
for m in re.finditer(r'path="/([^"]+)"[^>]*element=\{[^}]*?<(\w+)', app_src):
    comp = m.group(2)
    if comp in lazy_map:
        route_map.setdefault(lazy_map[comp], "/" + m.group(1))

# ── 3. Backend route files ───────────────────────────────────────────────────
ROUTES_DIR = os.path.join(BE, "api", "v1", "routes")
SQL_TBL_RX = re.compile(r"\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-z_][a-z0-9_]*)", re.I)
backend_routes = {}  # file stem -> record
for fn in sorted(os.listdir(ROUTES_DIR)):
    if not fn.endswith(".py"):
        continue
    src = read(os.path.join(ROUTES_DIR, fn))
    prefix_m = re.search(r"APIRouter\([^)]*prefix\s*=\s*['\"]([^'\"]+)", src)
    prefix = prefix_m.group(1) if prefix_m else ""
    eps = []
    for m in re.finditer(
        r"@router\.(get|post|put|delete|patch)\(\s*['\"]([^'\"]*)['\"][^)]*\)\s*\n(?:@[^\n]*\n)*\s*(?:async\s+)?def\s+(\w+)",
        src,
    ):
        eps.append({"method": m.group(1).upper(), "path": prefix + m.group(2), "handler": m.group(3)})
    engines = sorted(set(re.findall(r"from services\.([a-z0-9_]+)", src)))
    tables = sorted({t for t in SQL_TBL_RX.findall(src)
                     if t not in {"information_schema", "pg_catalog", "select", "the", "a", "as"}})
    tables += sorted(set(re.findall(r"__tablename__\s*=\s*['\"]([a-z0-9_]+)", src)))
    backend_routes[fn[:-3]] = {
        "file": f"api/v1/routes/{fn}", "prefix": prefix,
        "endpoints": eps, "engines": engines, "tables": sorted(set(tables)),
    }

# ── 4. Engine AST detail (lazy cache) ───────────────────────────────────────
_engine_cache = {}
FORMULA_RX = re.compile(r"^\s{4,}(\w[\w.\[\]'\"]*)\s*=\s*(.{4,120}[*/+\-].{2,})$")


def engine_detail(name):
    if name in _engine_cache:
        return _engine_cache[name]
    path = os.path.join(BE, "services", f"{name}.py")
    src = read(path)
    rec = {"name": name, "file": f"services/{name}.py", "functions": [], "formulas": []}
    if src:
        try:
            tree = ast.parse(src)
        except SyntaxError:
            tree = None
        if tree:
            def visit(node, cls=None):
                for n in ast.iter_child_nodes(node):
                    if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        if n.name.startswith("__"):
                            continue
                        doc = (ast.get_docstring(n) or "").strip().split("\n")[0][:160]
                        args = [a.arg for a in n.args.args if a.arg not in ("self", "cls")]
                        rec["functions"].append({
                            "name": (f"{cls}." if cls else "") + n.name,
                            "args": args[:10], "doc": doc,
                        })
                    elif isinstance(n, ast.ClassDef):
                        visit(n, cls=n.name)
            visit(tree)
        for line in src.splitlines():
            m = FORMULA_RX.match(line)
            if m and not any(s in line for s in ('"', "'", "append(", "format(", "join(", "f-", "get(")):
                rec["formulas"].append(line.strip()[:160])
        rec["formulas"] = rec["formulas"][:25]
        rec["functions"] = rec["functions"][:40]
    _engine_cache[name] = rec
    return rec


# ── 5. Lineage traces ────────────────────────────────────────────────────────
TRACES_DIR = os.path.join(BE, "lineage_output", "traces")
traces = {}
if os.path.isdir(TRACES_DIR):
    for fn in os.listdir(TRACES_DIR):
        if fn.endswith(".json"):
            traces[fn[:-5]] = os.path.join(TRACES_DIR, fn)


def flatten_tree(node, out, depth=0):
    if not isinstance(node, dict) or depth > 6 or len(out) >= 14:
        return
    nm = node.get("fn") or node.get("name") or node.get("function")
    if nm:
        out.append(("  " * depth) + str(nm))
    for c in (node.get("children") or node.get("calls") or [])[:6]:
        flatten_tree(c, out, depth + 1)


def load_trace(module_id):
    p = traces.get(module_id)
    if not p:  # fuzzy: normalized match against trace domain names
        n = module_id.replace("_", "-").lower()
        for dom, path in traces.items():
            dn = dom.replace("_", "-").lower()
            if dn == n or (len(n) >= 6 and len(dn) >= 6 and (dn.startswith(n) or n.startswith(dn))):
                p = path
                break
    if not p:
        return None
    try:
        txs = json.load(open(p, encoding="utf-8"))
    except Exception:
        return None
    if isinstance(txs, dict):
        txs = txs.get("transactions", [])
    out = []
    for t in txs[:12]:
        chain = []
        flatten_tree(t.get("tree") or {}, chain)
        out.append({
            "label": t.get("label", ""), "status": t.get("status", ""),
            "provenance": t.get("provenance", []),
            "source_tables": (t.get("source_tables") or [])[:10],
            "output_summary": str(t.get("output_summary", ""))[:300],
            "call_chain": chain,
        })
    return out


# ── 6. Frontend feature scan ─────────────────────────────────────────────────
API_RX = re.compile(r"['\"`](/api/[A-Za-z0-9/_\-${}.]+)")
COMPONENT_RX = re.compile(r"(?:^|\n)(?:export\s+)?(?:function|const)\s+([A-Z]\w{2,})\s*[=(]")
COMPUTED_RX = re.compile(r"^\s*(?:const|let)\s+(\w{3,})\s*=\s*(.{6,150}(?:[*/+\-]|\.reduce\(|\.map\(|Math\.).{2,})[,;]?\s*$")
CTX_RX = re.compile(r"from\s+['\"][^'\"]*context[s]?/(\w+)['\"]", re.I)
SHARED_RX = re.compile(r"from\s+['\"][^'\"]*_shared/(\w+)")
SEED_RX = re.compile(r"^\s*(?:export\s+)?const\s+([A-Z][A-Z0-9_]{2,})\s*=\s*\[", re.M)

FEATURES = os.path.join(FE, "features")
modules = {}
for feat in sorted(os.listdir(FEATURES)):
    fdir = os.path.join(FEATURES, feat)
    if feat == "_shared" or not os.path.isdir(fdir):
        continue
    comps, apis, computed, ctxs, shared, seeds, files = [], [], [], [], [], [], 0
    for dirpath, _d, fns in os.walk(fdir):
        for fn in fns:
            if not fn.endswith((".jsx", ".js")):
                continue
            files += 1
            src = read(os.path.join(dirpath, fn))
            comps += COMPONENT_RX.findall(src)
            apis += API_RX.findall(src)
            ctxs += CTX_RX.findall(src)
            shared += SHARED_RX.findall(src)
            seeds += SEED_RX.findall(src)
            for line in src.splitlines():
                m = COMPUTED_RX.match(line)
                if m and "<" not in m.group(2) and "//" not in m.group(2)[:3]:
                    computed.append({"name": m.group(1), "expr": m.group(2).strip()[:150]})
    route = route_map.get(feat, "/" + feat)
    modules[feat] = {
        "module_id": feat, "route": route, "files": files,
        "components": sorted(set(comps))[:25],
        "api_calls": sorted(set(apis))[:20],
        "computed": computed[:30],
        "contexts": sorted(set(ctxs)),
        "shared_wrappers": sorted(set(shared)),
        "seed_constants": sorted(set(seeds))[:15],
        "guide": GUIDES.get(route),
    }

# ── 7. Match modules -> backend routes ───────────────────────────────────────
# by endpoint prefix, exact stem, or fuzzy slug (strip -engine/-page/-dashboard)
def norm(s):
    s = s.replace("_", "-").lower()
    for suf in ("-engine", "-page", "-dashboard", "-analytics"):
        if s.endswith(suf):
            s = s[: -len(suf)]
    return s

stem_index = {}
prefix_slug = {}   # normalized prefix slug -> stems
for stem, rec in backend_routes.items():
    for ep in rec["endpoints"]:
        stem_index.setdefault(ep["path"].split("{")[0].rstrip("/"), set()).add(stem)
    if rec["prefix"]:
        prefix_slug.setdefault(norm(rec["prefix"].split("/")[-1]), set()).add(stem)
    prefix_slug.setdefault(norm(stem), set()).add(stem)

def match_backend(mod):
    hits = set()
    n = norm(mod["module_id"])
    hits.update(prefix_slug.get(n, ()))
    # containment fuzzy (len>=6 to avoid noise)
    if not hits and len(n) >= 6:
        for slug, stems in prefix_slug.items():
            if len(slug) >= 6 and (slug == n or slug.startswith(n) or n.startswith(slug)):
                hits.update(stems)
    for call in mod["api_calls"]:
        base = call.split("${")[0].rstrip("/")
        for eppfx, stems in stem_index.items():
            if eppfx and (base.startswith(eppfx) or eppfx.startswith(base)):
                hits.update(stems)
    return sorted(hits)[:4]

for mod in modules.values():
    stems = match_backend(mod)
    mod["backend_routes"] = [backend_routes[s] for s in stems]
    mod["engines"] = sorted({e for s in stems for e in backend_routes[s]["engines"]})
    mod["tables"] = sorted({t for s in stems for t in backend_routes[s]["tables"]})
    mod["trace"] = load_trace(mod["module_id"])
    mod["tier"] = "A" if mod["backend_routes"] else "B"

# ── 8. Interconnection graph ─────────────────────────────────────────────────
by_engine, by_table, by_ctx, by_wrap = defaultdict(set), defaultdict(set), defaultdict(set), defaultdict(set)
for mid, mod in modules.items():
    for e in mod["engines"]:
        by_engine[e].add(mid)
    for t in mod["tables"]:
        by_table[t].add(mid)
    for c in mod["contexts"]:
        by_ctx[c].add(mid)
    for w in mod["shared_wrappers"]:
        by_wrap[w].add(mid)

for mid, mod in modules.items():
    inter = defaultdict(set)
    for e in mod["engines"]:
        for other in by_engine[e]:
            if other != mid:
                inter[other].add(f"engine:{e}")
    for t in mod["tables"]:
        if len(by_table[t]) > 1 and len(by_table[t]) < 60:  # skip ubiquitous core tables in per-module lists
            for other in by_table[t]:
                if other != mid:
                    inter[other].add(f"table:{t}")
    mod["interconnections"] = [
        {"module": k, "via": sorted(v)[:6]} for k, v in
        sorted(inter.items(), key=lambda kv: -len(kv[1]))[:10]
    ]
    mod["shared_engines"] = sorted(e for e in mod["engines"] if len(by_engine[e]) > 1)
    mod["shared_tables"] = sorted(t for t in mod["tables"] if len(by_table[t]) > 1)
    mod["blast_radius"] = len(inter)

# ── 9. Provenance rollup + engine detail attach ──────────────────────────────
for mod in modules.values():
    prov = set()
    if mod["trace"]:
        for t in mod["trace"]:
            prov.update(t.get("provenance") or [])
    if mod["seed_constants"]:
        prov.add("frontend-seed")
    if not prov:
        prov.add("frontend-computed")
    mod["provenance"] = sorted(prov)
    mod["engine_detail"] = [engine_detail(e) for e in mod["engines"][:6]]

# ── 10. Markdown wiki page per module ────────────────────────────────────────
def md_page(mod):
    g = mod.get("guide") or {}
    L = []
    title = g.get("title") or mod["module_id"].replace("-", " ").title()
    L.append(f"# {title}")
    L.append(f"**Module ID:** `{mod['module_id']}` · **Route:** `{mod['route']}` · "
             f"**Tier:** {'A (backend vertical)' if mod['tier']=='A' else 'B (frontend-computed)'} · "
             f"**EP code:** {g.get('epCode','—')} · **Sprint:** {g.get('sprint','—')}")
    if g.get("description"):
        L.append(f"\n## 1 · Overview\n{g['description']}")
    if g.get("valueSummary"):
        L.append(f"\n> **Business value:** {g['valueSummary']}")

    # Function map
    L.append("\n## 2 · Function Map")
    L.append(f"\n### 2.1 Frontend ({mod['files']} files)")
    if mod["components"]:
        L.append("**Components/functions:** " + ", ".join(f"`{c}`" for c in mod["components"]))
    if mod["computed"]:
        L.append("\n**Derived values computed in the UI layer:**\n")
        L.append("| Variable | Expression |")
        L.append("|---|---|")
        for c in mod["computed"][:18]:
            L.append(f"| `{c['name']}` | `{c['expr'].replace('|','\\|')}` |")
    if mod["backend_routes"]:
        L.append("\n### 2.2 Backend endpoints")
        L.append("| Method | Path | Handler | Route file |")
        L.append("|---|---|---|---|")
        for br in mod["backend_routes"]:
            for ep in br["endpoints"][:15]:
                L.append(f"| {ep['method']} | `{ep['path']}` | `{ep['handler']}` | {br['file']} |")
        for ed in mod["engine_detail"]:
            if ed["functions"]:
                L.append(f"\n### 2.3 Engine `{ed['name']}` ({ed['file']})")
                L.append("| Function | Args | Purpose |")
                L.append("|---|---|---|")
                for fn in ed["functions"][:18]:
                    L.append(f"| `{fn['name']}` | {', '.join(fn['args'][:6])} | {fn['doc'].replace('|','/')} |")

    # Data sources
    L.append("\n## 3 · Data Sources & Provenance")
    L.append(f"**Provenance classes:** {', '.join('`'+p+'`' for p in mod['provenance'])}")
    if mod["tables"]:
        shared = set(mod["shared_tables"])
        L.append("\n**Database tables:** " + ", ".join(
            f"`{t}`{' *(shared)*' if t in shared else ''}" for t in mod["tables"][:20]))
    if mod["seed_constants"]:
        L.append("**Frontend seed datasets:** " + ", ".join(f"`{s}`" for s in mod["seed_constants"]))
    if mod["contexts"]:
        L.append("**Shared context buses:** " + ", ".join(f"`{c}`" for c in mod["contexts"]))

    # Lineage
    L.append("\n## 4 · End-to-End Data Lineage (source → transformation → UI)")
    dps = (g.get("dataPoints") or [])
    if dps:
        L.append("\n### 4.1 UI metrics — where every number comes from")
        L.append("| UI metric | Formula | Source | Interpretation |")
        L.append("|---|---|---|---|")
        for d in dps[:16]:
            L.append("| {} | {} | {} | {} |".format(
                d.get("name","")[:60], f"`{d['formula']}`" if d.get("formula") else "—",
                d.get("source","—")[:60], (d.get("interpretation","") or "")[:110].replace("|","/")))
    for dl_ in (g.get("dataLineage") or [])[:8]:
        L.append(f"- **{dl_.get('source','')}** → {dl_.get('flow','')} → **{dl_.get('output','')}**")
    if mod["trace"]:
        L.append("\n### 4.2 Traced backend call chains (lineage harness)")
        for t in mod["trace"][:5]:
            L.append(f"\n**{t['label']}** — status `{t['status']}`, provenance {t['provenance']}, "
                     f"source tables: {', '.join('`'+s+'`' for s in t['source_tables']) or '—'}")
            if t["call_chain"]:
                L.append("```\n" + "\n".join(t["call_chain"]) + "\n```")
            if t["output_summary"]:
                L.append(f"Output: `{t['output_summary'][:220]}`")

    # Transformation logic
    eng_forms = [(ed["name"], ed["formulas"]) for ed in mod["engine_detail"] if ed["formulas"]]
    ce = g.get("calculationEngine") or {}
    if ce or eng_forms:
        L.append("\n## 5 · Intermediate Transformation Logic")
        if ce.get("methodology"):
            L.append(f"**Methodology:** {ce['methodology']}")
        if ce.get("formula"):
            L.append(f"**Headline formula:** `{ce['formula']}`")
        if ce.get("standards"):
            L.append(f"**Standards:** {ce['standards']}")
        for name, forms in eng_forms[:3]:
            L.append(f"\n**Engine `{name}` — extracted transformation lines:**")
            L.append("```python\n" + "\n".join(forms[:14]) + "\n```")

    # Interconnections
    L.append("\n## 6 · Interconnections & Change Risk")
    L.append(f"**Blast radius:** changes here can affect **{mod['blast_radius']}** other module(s).")
    if mod["shared_engines"]:
        L.append("**Shared engines (edits propagate!):** " + ", ".join(
            f"`{e}` (used by {len(by_engine[e])} modules)" for e in mod["shared_engines"]))
    if mod["interconnections"]:
        L.append("\n| Connected module | Shared via |")
        L.append("|---|---|")
        for ic in mod["interconnections"]:
            L.append(f"| `{ic['module']}` | {', '.join(ic['via'])} |")
    if mod["shared_wrappers"]:
        L.append("**Shared UI wrappers:** " + ", ".join(f"`{w}`" for w in mod["shared_wrappers"]))
    return "\n".join(L)


for mid, mod in modules.items():
    with open(os.path.join(OUT, "modules", f"{mid}.md"), "w", encoding="utf-8") as f:
        f.write(md_page(mod))

# atlas.json (drop bulky engine detail duplicates)
slim = {}
for mid, mod in modules.items():
    slim[mid] = {k: v for k, v in mod.items() if k != "guide"}
    slim[mid]["title"] = (mod.get("guide") or {}).get("title") or mid.replace("-", " ").title()
    slim[mid]["nav"] = (mod.get("guide") or {}).get("sprint") or ""
    slim[mid]["ep_code"] = (mod.get("guide") or {}).get("epCode") or ""
with open(os.path.join(OUT, "atlas.json"), "w", encoding="utf-8") as f:
    json.dump(slim, f, indent=1)

# ── 11. Backend API domains not matched to any frontend module ───────────────
matched_stems = {br["file"].split("/")[-1][:-3] for m in modules.values() for br in m["backend_routes"]}
backend_domains = {}
for stem, rec in backend_routes.items():
    if stem in matched_stems or not rec["endpoints"]:
        continue
    dom = {
        "module_id": f"api::{stem}", "route": rec["prefix"] or f"(router {stem})",
        "layer": "backend", "files": 1, "components": [], "computed": [],
        "api_calls": [], "contexts": [], "shared_wrappers": [], "seed_constants": [],
        "guide": None, "backend_routes": [rec],
        "engines": rec["engines"], "tables": rec["tables"],
        "trace": load_trace(stem.replace("_", "-")),
        "tier": "A",
    }
    dom["engine_detail"] = [engine_detail(e) for e in dom["engines"][:6]]
    dom["shared_engines"] = sorted(e for e in dom["engines"] if len(by_engine.get(e, [])) >= 1
                                   and sum(1 for r in backend_routes.values() if e in r["engines"]) > 1)
    dom["shared_tables"] = sorted(t for t in dom["tables"]
                                  if sum(1 for r in backend_routes.values() if t in r["tables"]) > 1)
    inter = defaultdict(set)
    for e in dom["engines"]:
        for other_stem, r in backend_routes.items():
            if other_stem != stem and e in r["engines"]:
                inter[f"api::{other_stem}"].add(f"engine:{e}")
    dom["interconnections"] = [{"module": k, "via": sorted(v)[:6]}
                               for k, v in sorted(inter.items(), key=lambda kv: -len(kv[1]))[:10]]
    dom["blast_radius"] = len(inter)
    prov = set()
    if dom["trace"]:
        for t in dom["trace"]:
            prov.update(t.get("provenance") or [])
    dom["provenance"] = sorted(prov) or ["untraced"]
    backend_domains[dom["module_id"]] = dom

for mid, dom in backend_domains.items():
    safe = mid.replace("::", "__")
    with open(os.path.join(OUT, "modules", f"{safe}.md"), "w", encoding="utf-8") as f:
        f.write(md_page(dom))
    slim[mid] = {k: v for k, v in dom.items() if k != "guide"}
    slim[mid]["title"] = f"API Domain: {mid.split('::')[1]}"
    slim[mid]["nav"] = "Backend API Domain"
    slim[mid]["ep_code"] = ""
with open(os.path.join(OUT, "atlas.json"), "w", encoding="utf-8") as f:
    json.dump(slim, f, indent=1)

tierA = sum(1 for m in modules.values() if m["tier"] == "A")
traced = sum(1 for m in modules.values() if m["trace"])
print(f"frontend modules: {len(modules)} | tier-A (backend vertical): {tierA} | with lineage trace: {traced}")
print(f"backend-only API domains: {len(backend_domains)} "
      f"(traced: {sum(1 for d in backend_domains.values() if d['trace'])})")
print(f"guides matched: {sum(1 for m in modules.values() if m['guide'])}")
print(f"total atlas records: {len(slim)}")
print("output: docs/module_atlas/atlas.json + modules/*.md")
