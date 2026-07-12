"""Classify all 963 Module Atlas records into a sector / economic-activity taxonomy
+ a strategic-signal flag, mechanically from data already in atlas.json (title,
module_id, nav, engines, tables, blast_radius, tier, provenance) — no per-module
agent calls needed, since the classification signal is already captured.

Usage: python scripts/build_module_tags.py
Output: docs/module_atlas/module_tags.json
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "module_atlas")

atlas = json.load(open(os.path.join(OUT, "atlas.json"), encoding="utf-8"))

# ── Sector / economic-activity taxonomy ─────────────────────────────────────
# Ordered: first matching bucket wins. Keywords matched against a haystack of
# title + module_id + nav + engines + tables (lowercased, hyphens/underscores
# normalised to spaces).
SECTORS = [
    ("Carbon Markets & Credits", [
        "carbon credit", "carbon-credit", "vcm", "offset", "cc-", "cbam", "article6",
        "carbon price", "carbon market", "cdm", "verra", "gold standard", "ccts",
        "credit registry", "credit audit", "additionality", "baseline", "permanence",
        "avoided emissions", "cdr", "dac", "direct air capture", "carbon removal",
        "carbon storage", "ccus", "biochar", "beccs", "mrv", "carbon budget",
        "carbon wallet", "carbon economy", "carbon institutions",
    ]),
    ("Energy & Power", [
        "solar", "wind", "geothermal", "hydrogen", "nuclear", "smr", "reactor",
        "battery", "bess", "grid", "power-to-x", "renewable", "energy transition",
        "energy storage", "power plant", "utility", "fossil", "oil", "gas network",
        "electrification", "ppa", "energy security", "hydro", "gigafactory",
        "green ammonia", "polysilicon", "wafer",
    ]),
    ("Industrials & Heavy Manufacturing", [
        "steel", "cement", "concrete", "chemistry", "chemical", "industrial gas",
        "industrial ccs", "critical mineral", "supply chain", "manufacturing",
        "hard-to-abate", "green steel",
    ]),
    ("Transport & Mobility", [
        "aviation", "saf", "shipping", "maritime", "marine", "corsia", "ev-",
        "electric vehicle", "v2g", "urban mobility", "transport", "logistics",
        "fleet",
    ]),
    ("Real Estate & Built Environment", [
        "real-estate", "real estate", "crrem", "building", "construction",
        "property", "mortgage", "epc", "green building", "residential",
        "commercial-re", "commercial re", "re-portfolio", "re-climate",
        "gresb", "utility-physical",
    ]),
    ("Agriculture, Food & Land Use", [
        "agri", "agricultural", "food system", "food-supply", "land use",
        "land-use", "deforestation", "eudr", "forestry", "timber", "fisheries",
        "aquaculture", "regenerative", "commodity-deforestation",
    ]),
    ("Nature & Biodiversity", [
        "biodiversity", "nature", "tnfd", "ecosystem", "ocean", "blue carbon",
        "blue economy", "water-risk", "water risk", "water stress", "nbs-",
        "nature-based", "gbf", "encore", "sbtn",
    ]),
    ("Insurance & Catastrophe Risk", [
        "insurance", "reinsurance", "catastrophe", "natcat", "cat-bond",
        "parametric", "protection gap", "solvency",
    ]),
    ("Sovereign, Macro & Systemic Risk", [
        "sovereign", "central bank", "macro", "systemic", "geopolitic",
        "sanctions", "em-debt", "em-sovereign", "frontier market",
        "contagion", "cascading-default",
    ]),
    ("Financial Services & Capital Markets", [
        "credit-risk", "credit risk", "private-equity", "private equity",
        "private-credit", "private markets", "venture", "vc-impact",
        "structured-credit", "securiti", "green-bond", "green bond", "bond",
        "fund-of-funds", "co-investment", "lp-reporting", "wacc", "valuation",
        "m&a", "due-diligence", "banking", "portfolio-manager", "portfolio-optimizer",
        "asset-valuation", "capital-markets", "treasury", "quant-", "factor",
        "esg-portfolio", "esg-factor", "fixed-income", "trade-finance",
        "export-credit", "sustainable-trade",
    ]),
    ("Prudential Banking & Insurance Regulation", [
        "basel", "eba", "eiopa", "lgd", "ead", "ecl", "gar", "ifrs s1",
        "mifid", "priips", "prudential", "capital adequacy",
        "solvency capital", "regulatory capital",
    ]),
    ("Regulatory & Disclosure Infrastructure", [
        "csrd", "sfdr", "issb", "tcfd", "esrs", "xbrl", "gri-", "sasb",
        "taxonomy", "disclosure", "brsr", "uk-sdr", "sec-climate", "regulatory",
        "compliance", "assurance", "audit-trail", "esrs-datapoint", "priips",
        "mica", "eu-gbs", "reg-", "framework-interop", "multi-standard",
    ]),
    ("Governance, Social & Human Capital", [
        "governance", "board-", "executive-pay", "shareholder", "proxy-voting",
        "diversity", "human-rights", "forced-labour", "modern-slavery",
        "living-wage", "workplace", "just-transition", "community", "indigenous",
        "conflict-minerals", "csddd", "workforce",
    ]),
    ("Climate Physical & Transition Risk Science", [
        "physical-risk", "physical risk", "stranded-asset", "stranded asset",
        "transition-risk", "transition risk", "scenario", "ngfs", "stress-test",
        "damage-function", "heat-", "flood", "drought", "wildfire", "hazard",
        "compound-event", "climate-var", "climate-cvar", "tail-risk", "copula",
        "monte-carlo", "climate-adaptation", "adaptation", "resilience",
        "coastal", "climate-migration", "pandemic-climate",
    ]),
    ("ESG Data, Ratings & Analytics", [
        "esg-rating", "esg-data", "esg-screener", "esg-controvers", "esg-backtest",
        "esg-momentum", "esg-narrative", "esg-report", "esg-time-series",
        "esg-value-chain", "controversy", "sentiment", "greenwash",
        "peer-clustering", "peer-transition", "benchmarking", "sector-sustain",
        "credit-integrity", "rating-migration", "ratings-methodology",
    ]),
    ("PCAF, Financed Emissions & Carbon Accounting", [
        "pcaf", "financed-emission", "financed emission", "scope3", "scope 3",
        "scope4", "waci", "carbon-calculator", "carbon-footprint", "ghg-",
        "emissions-monitor", "carbon-adjusted", "temperature-alignment",
        "implied-temp",
    ]),
    ("AI, ML & Data Platform Infrastructure", [
        "dme-", "ml-", "ai-", "nlp", "ensemble-prediction", "anomaly-detection",
        "data-quality", "data-governance", "data-lineage", "data-reconcil",
        "data-source", "data-versioning", "data-capture", "data-hub",
        "data-infra", "db-explorer", "db-migration", "etl-pipeline",
        "llm-", "model-governance", "model-validation", "predictive-",
    ]),
    ("Platform Operations & Admin", [
        "admin", "auth", "rbac", "user-role", "platform-settings",
        "platform-analytics", "audit-log", "multi-tenancy", "api-gateway",
        "api-orchestration", "calculation-engine-monitor", "template-manager",
        "scheduled-reports", "report-generator", "report-quality",
        "reporting-hub", "client-portal", "client-pitch", "module-navigator",
        "reference-data", "public-reference", "advanced-report-studio",
        "db-explorer", "db-migration",
    ]),
    ("Entity, Counterparty & Reference Data Services", [
        "entity360", "entity-resolution", "entity resolution", "counterpart",
        "country-risk", "country risk", "organisation", "data-preview",
        "data-intake", "data-hub-catalog", "exports", "universal-exports",
        "financial-data", "emissions-data", "energy-data", "health-climate",
        "irena", "sasb-industry", "sector-calculators", "sector-assessments",
        "cdp-scoring", "esma-fund", "fund-management", "green-premium-tenant",
        "infrastructure-finance", "mining", "spatial", "uploads",
        "validation-summary", "violations", "scenario-data", "scenario-analysis",
        "scenario-builder", "scenarios", "attribution-benchmark",
        "peer-benchmark", "esg-ma",
    ]),
    ("Generic AI / Anomaly & Reporting Tooling", [
        "anomaly-detection", "ai-hub", "ai-engagement", "ai-data-live",
        "ai-compliance", "ai-sentiment", "predictive-analytics-hub",
        "predictive-esg", "narrative-intelligence", "document-similarity",
        "act-assessment", "assessment-", "abatement-cost-curve",
    ]),
    ("Climate & Blended Finance Instruments", [
        "blended-finance", "cdfi", "cpace", "climate-finance", "climate finance",
        "climate-fintech", "climate-tech", "climate-derivatives",
        "climate-financial-statements", "climate-data-marketplace",
        "big-climate-database", "cleantech-investment", "africa-climate",
        "asean-gcc", "china-india-transition", "impact-", "sdg-",
    ]),
    ("Circular Economy & Resource Efficiency", [
        "circular-economy", "circular economy", "resource-efficiency",
        "epr-compliance", "plastic", "recycled-content", "digital-product-passport",
        "waste-to-energy", "embodied-carbon",
    ]),
    ("Commodities & Trade Intelligence", [
        "commodity", "trade-carbon", "trade flow", "exchange-intelligence",
    ]),
    ("Corporate Climate Strategy & Intelligence Hubs", [
        "climate-health", "climate-litigation", "climate-patent",
        "climate-policy", "climate-claims", "climate-reserve",
        "climate-resilient-design", "climate-emissions-intelligence",
        "decarbonisation", "net-zero", "sbti", "transition-plan",
        "transition-planning", "just-transition-finance-hub",
        "city-climate", "city-net-zero", "conflict-stability",
        "employee-wellbeing", "anti-corruption", "change-management",
        "approval-workflows", "comprehensive-reporting", "double-materiality",
        "materiality", "credit-quality-screener", "covenant-breach",
        "decommissioning-cost", "em-climate-risk", "sl-finance",
        "real-asset-decarb", "project-finance", "portfolio-health",
        "portfolio_pg", "pe-portfolio", "rics-esg", "sub-parameter",
        "tpt-transition", "methane-fugitive", "dcm",
    ]),
    ("Health, Air Quality & Climate-Related Human Impact", [
        "air-quality", "heat-mortality", "health-adaptation",
        "mental-health-climate", "pandemic-climate",
    ]),
]

STRATEGIC_SIGNAL_HIGH_ENGINES = {
    "issb_s2_engine", "eu_taxonomy_engine", "eudr_engine", "insurance_climate_risk",
    "pcaf_sovereign_engine", "green_hydrogen_engine", "re_portfolio_engine",
    "vcm_integrity_engine", "water_stewardship_engine", "greenwashing_engine",
    "green_securitisation_engine", "corporate_nature_strategy_engine",
    "physical_risk_pricing_engine", "forced_labour_engine", "food_system_engine",
    "crypto_climate_engine", "critical_minerals_engine", "dme_contagion",
    "dme_nlp_pulse_engine", "sovereign_climate_risk_engine",
}


def norm(s):
    """Lowercase, collapse every non-alphanumeric separator (-, _, /, ::) to a
    single space, so both the haystack and keyword phrases end up in the same
    space-tokenized form and substring/word-boundary checks are consistent."""
    return re.sub(r"[^a-z0-9]+", " ", str(s or "").lower()).strip()


_KW_CACHE = {}


def kw_pattern(kw):
    if kw not in _KW_CACHE:
        nkw = norm(kw)
        # short/ambiguous keywords (<=3 chars, e.g. "gar", "ecl", "ai") need
        # word boundaries to avoid matching inside unrelated longer words
        if len(nkw.replace(" ", "")) <= 3:
            _KW_CACHE[kw] = re.compile(r"\b" + re.escape(nkw) + r"\b")
        else:
            _KW_CACHE[kw] = re.compile(re.escape(nkw))
    return _KW_CACHE[kw]


def classify_sector(mid, m):
    haystack = " ".join([
        norm(m.get("title")), norm(mid), norm(m.get("nav")),
        " ".join(norm(e) for e in (m.get("engines") or [])),
        " ".join(norm(t) for t in (m.get("tables") or [])[:10]),
    ])
    for sector, keywords in SECTORS:
        if any(kw_pattern(kw).search(haystack) for kw in keywords):
            return sector
    return "Cross-Cutting / Other"


def strategic_signal(mid, m):
    """A coarse 0-3 strategic-leverage score: how much this module's output
    ripples into the rest of the platform + how trustworthy that output is."""
    score = 0
    blast = m.get("blast_radius") or 0
    if blast >= 5:
        score += 2
    elif blast >= 2:
        score += 1
    if m.get("shared_engines"):
        score += 1
    engines = set(m.get("engines") or [])
    if engines & STRATEGIC_SIGNAL_HIGH_ENGINES:
        score += 1
    if m.get("tier") == "A" and "frontend-seed" not in (m.get("provenance") or []):
        score += 1
    title_l = norm(m.get("title"))
    if any(w in title_l for w in ("hub", "dashboard", "command center", "orchestrator")):
        score += 1
    return min(score, 4)


tags = {}
sector_counts = {}
for mid, m in atlas.items():
    sector = classify_sector(mid, m)
    signal = strategic_signal(mid, m)
    tags[mid] = {
        "sector": sector,
        "strategic_signal": signal,
        "blast_radius": m.get("blast_radius") or 0,
        "tier": m.get("tier"),
        "engines": m.get("engines") or [],
    }
    sector_counts[sector] = sector_counts.get(sector, 0) + 1

with open(os.path.join(OUT, "module_tags.json"), "w", encoding="utf-8") as f:
    json.dump(tags, f, indent=1)

print(f"tagged {len(tags)} modules across {len(sector_counts)} sectors")
for s, c in sorted(sector_counts.items(), key=lambda kv: -kv[1]):
    print(f"  {s}: {c}")
