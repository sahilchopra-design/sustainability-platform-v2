"""Generate docs/ENGINE_CATALOG.md and docs/DATABASE_CATALOG.md from live scans."""
import ast, os, sys, json, collections, datetime

ROOT = r"C:\Users\SahilChopra\Documents\Risk Analytics"
SVC = os.path.join(ROOT, "backend", "services")
DOCS = os.path.join(ROOT, "docs")
sys.path.insert(0, os.path.join(ROOT, "backend"))
os.environ.setdefault("REQUIRE_AUTH", "false")
os.chdir(os.path.join(ROOT, "backend"))  # so load_dotenv finds .env

# ---------- Engine scan ----------
eng = []
for fn in sorted(os.listdir(SVC)):
    if not fn.endswith(".py") or fn == "__init__.py":
        continue
    p = os.path.join(SVC, fn)
    src = open(p, encoding="utf-8", errors="replace").read()
    loc = src.count("\n") + 1
    try:
        tree = ast.parse(src)
        doc = (ast.get_docstring(tree) or "").strip().split("\n")[0][:140]
        classes = [n.name for n in tree.body if isinstance(n, ast.ClassDef)]
        funcs = sum(1 for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)))
    except SyntaxError:
        doc, classes, funcs = "PARSE ERROR", [], 0
    eng.append({"file": fn, "doc": doc, "classes": classes[:4], "funcs": funcs, "loc": loc})

GROUPS = [
    ("Climate risk (physical & transition)", ["climate_", "physical_risk", "transition_risk", "stress_test", "scenario_", "ngfs", "stranded", "temperature", "hazard", "global_physical", "adaptation", "cvar", "catastrophe", "heat_"]),
    ("Carbon markets, credits & accounting", ["carbon_", "cdm_", "verra", "redd", "vcm", "article6", "cookstove", "offset", "ccts", "compliance_carbon", "internal_carbon", "cop_"]),
    ("PCAF / financed & avoided emissions", ["pcaf", "financed_emissions", "waci", "avoided_emissions", "scope3", "ghg"]),
    ("Prudential & banking regulation", ["basel", "frtb", "liquidity", "capital", "pillar", "eba_", "ecl_", "irrbb", "prudential", "banking"]),
    ("Insurance & actuarial", ["insurance", "eiopa", "solvency", "iorp", "underwriting", "actuarial", "cat_bond", "parametric", "reinsurance"]),
    ("Regulatory disclosure (CSRD/SFDR/ISSB/EU-Tax/XBRL/CBAM)", ["csrd", "esrs", "sfdr", "issb", "taxonomy", "xbrl", "disclosure", "eu_gbs", "regulatory", "brsr", "assurance", "cbam", "tcfd"]),
    ("Energy & power finance", ["energy", "renewable", "ppa", "hydrogen", "battery", "bess", "nuclear", "geothermal", "grid", "solar", "wind", "lcoe", "saf_", "biofuel", "power", "fuel"]),
    ("Capital markets, valuation & portfolio", ["dcm", "bond", "valuation", "dcf", "xva", "derivative", "equity", "credit_", "yieldco", "tax_equity", "project_finance", "financial_model", "var_", "portfolio", "securit", "quant", "market", "hybrid", "blended"]),
    ("Nature, biodiversity, water & land", ["nature", "biodiversity", "tnfd", "deforestation", "eudr", "agri", "food", "land_", "forest", "water", "ocean", "blue_", "gbif", "wdpa", "species"]),
    ("Real estate & built environment", ["real_estate", "crrem", "building", "epc", "hedonic", "property", "overture"]),
    ("Supply chain & trade", ["supply_chain", "trade", "comtrade", "maritime", "shipping", "critical_minerals", "commodity", "figi"]),
    ("Sovereign, macro & geopolitical", ["sovereign", "country_risk", "conflict", "ucdp", "macro", "india", "asia", "africa", "municipal", "policy"]),
    ("Entity & reference data services", ["entity", "gleif", "lei_", "sanctions", "reference_data", "refdata", "resolution", "violation"]),
    ("Data platform, lineage, AI/ML services", ["lineage", "ingest", "data_", "anomaly", "ml_", "nlp", "ai_", "sentiment", "document", "extraction", "similarity"]),
    ("Materiality, engagement & strategy", ["materiality", "dme", "engagement", "stewardship", "peer_benchmark", "transition_plan", "net_zero", "governance"]),
]

def classify(fn):
    for name, keys in GROUPS:
        if any(k in fn for k in keys):
            return name
    return "Other / cross-cutting"

by = collections.defaultdict(list)
for e in eng:
    by[classify(e["file"])].append(e)

order = [g[0] for g in GROUPS] + ["Other / cross-cutting"]
today = datetime.date.today().isoformat()
L = [
    "# Calculation Engine Catalog",
    "",
    f"*Generated {today} by AST scan of `backend/services/` — {len(eng)} engine modules, "
    f"{sum(e['loc'] for e in eng):,} lines of code, {sum(e['funcs'] for e in eng):,} functions. "
    "Grouping is filename-keyword heuristic (first match wins); the Module Atlas "
    "(`docs/module_atlas/`, §2.3 per module) is authoritative for any single engine. "
    "Regenerate with `python <scratchpad>/gen_catalogs.py` or ask Claude.*",
    "",
    "## Summary by domain",
    "",
    "| Domain | Engines | LOC |",
    "|---|---|---|",
]
for g in order:
    if g in by:
        L.append(f"| {g} | {len(by[g])} | {sum(i['loc'] for i in by[g]):,} |")
L.append(f"| **Total** | **{len(eng)}** | **{sum(e['loc'] for e in eng):,}** |")
L.append("")
for g in order:
    items = by.get(g)
    if not items:
        continue
    L.append(f"## {g}  ({len(items)} engines)")
    L.append("")
    L.append("| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |")
    L.append("|---|---|---|---|---|")
    for i in sorted(items, key=lambda x: -x["loc"]):
        doc = (i["doc"] or "(no docstring)").replace("|", "/")
        cls = ", ".join(i["classes"]) or "(functions only)"
        L.append(f"| `{i['file']}` | {doc} | {cls} | {i['funcs']} | {i['loc']} |")
    L.append("")
open(os.path.join(DOCS, "ENGINE_CATALOG.md"), "w", encoding="utf-8").write("\n".join(L))
print(f"ENGINE_CATALOG.md: {len(L)} lines")
for g in order:
    if g in by:
        print(f"  {len(by[g]):>3}  {g}")

# ---------- DB scan ----------
from db.base import engine as db_engine
from sqlalchemy import text

with db_engine.connect() as conn:
    rows = conn.execute(text(
        "SELECT relname, n_live_tup FROM pg_stat_user_tables "
        "WHERE schemaname='public' ORDER BY relname"
    )).fetchall()
    tables = [{"table": r[0], "rows": int(r[1])} for r in rows]
    geo = {r[0] for r in conn.execute(text(
        "SELECT f_table_name FROM geometry_columns"
    )).fetchall()}

TGROUPS = [
    ("Reference data layer (Tier-1 public)", ["reference_data", "refdata", "gri_", "csrd_esrs", "esrs_"]),
    ("Data hub (dh_*) — ingested source mirrors", ["dh_"]),
    ("Spatial / physical-risk digital twin", ["ref_", "spatial_", "hazard"]),
    ("Entity & counterparty golden source", ["entity_", "lei", "gleif", "sanctions", "counterpart", "ownership"]),
    ("Portfolios & holdings", ["portfolio", "holding", "asset", "exposure_"]),
    ("Carbon & credits", ["carbon", "credit_", "verra", "cdm_", "offset", "vcm", "ccts", "article6", "cookstove"]),
    ("Climate scenarios & stress", ["ngfs", "scenario", "stress", "climate_"]),
    ("Regulatory & disclosure (CSRD/SFDR/ISSB/EU/BRSR)", ["sfdr", "issb", "eu_", "brsr", "cbam", "taxonomy", "regulatory", "disclosure", "xbrl", "compliance"]),
    ("DME (Dynamic Materiality Engine)", ["dme_"]),
    ("Energy & power", ["energy", "ppa", "grid", "hydrogen", "battery", "nuclear", "power", "renewable", "ctp_"]),
    ("Financial instruments & markets", ["bond", "instrument", "market", "fi_", "loan", "dcm", "deal"]),
    ("Auth, RBAC, audit & platform ops", ["user", "auth", "session", "invite", "audit", "rbac", "role", "module_", "sync_", "job", "schedule", "api_"]),
    ("Hub / analysis workspaces", ["hub_", "analysis", "comparison", "upload", "report"]),
]

def tclassify(t):
    for name, keys in TGROUPS:
        if any(t.startswith(k) or k in t for k in keys):
            return name
    return "Domain-specific module tables"

tby = collections.defaultdict(list)
for t in tables:
    tby[tclassify(t["table"])].append(t)

torder = [g[0] for g in TGROUPS] + ["Domain-specific module tables"]
total = sum(t["rows"] for t in tables)
empty = sum(1 for t in tables if t["rows"] == 0)
D = [
    "# Database Catalog — public schema",
    "",
    f"*Generated {today} from live `pg_stat_user_tables` (row counts are planner "
    f"estimates, exact enough for inventory). Supabase project `kytzcbipsghprsqoalvi`, "
    f"PostGIS 3.3.7. **{len(tables)} tables · ~{total:,} rows · {empty} empty "
    f"({empty*100//len(tables)}%)**. Empty is often BY DESIGN (write-side tables for "
    "mutation endpoints, awaiting-first-use module verticals, deferred sources like "
    "WDPA) — see docs/CRITICAL_REVIEW_UAT_AUDIT.md B2 before treating any empty table "
    "as a bug. Schema largely predates tracked Alembic migrations (created via direct "
    "DDL); `geometry` marks PostGIS tables.*",
    "",
    "## Summary by group",
    "",
    "| Group | Tables | Rows | Populated |",
    "|---|---|---|---|",
]
for g in torder:
    if g in tby:
        ts = tby[g]
        D.append(f"| {g} | {len(ts)} | {sum(t['rows'] for t in ts):,} | {sum(1 for t in ts if t['rows']>0)}/{len(ts)} |")
D.append(f"| **Total** | **{len(tables)}** | **{total:,}** | **{len(tables)-empty}/{len(tables)}** |")
D.append("")
for g in torder:
    ts = tby.get(g)
    if not ts:
        continue
    pop = [t for t in ts if t["rows"] > 0]
    emp = [t for t in ts if t["rows"] == 0]
    D.append(f"## {g}  ({len(ts)} tables, {sum(t['rows'] for t in ts):,} rows)")
    D.append("")
    if pop:
        D.append("| Table | Rows |")
        D.append("|---|---|")
        for t in sorted(pop, key=lambda x: -x["rows"]):
            gmark = " *(geometry)*" if t["table"] in geo else ""
            D.append(f"| `{t['table']}`{gmark} | {t['rows']:,} |")
        D.append("")
    if emp:
        names = ", ".join(f"`{t['table']}`" for t in sorted(emp, key=lambda x: x["table"]))
        D.append(f"**Empty ({len(emp)}):** {names}")
        D.append("")
open(os.path.join(DOCS, "DATABASE_CATALOG.md"), "w", encoding="utf-8").write("\n".join(D))
print(f"DATABASE_CATALOG.md: {len(D)} lines | {len(tables)} tables, {total:,} rows, {empty} empty")
for g in torder:
    if g in tby:
        print(f"  {len(tby[g]):>3}  {g}  ({sum(t['rows'] for t in tby[g]):,} rows)")
