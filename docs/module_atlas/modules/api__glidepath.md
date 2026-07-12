# Api::Glidepath
**Module ID:** `api::glidepath` · **Route:** `/api/v1/glidepath` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/glidepath/sectors` | `list_glidepath_sectors` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/sector/{sector}` | `get_sector_glidepath` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/portfolio/{portfolio_id}/status-grid` | `get_glidepath_status_grid` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/nzba/{sector}` | `get_nzba_glidepath` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/crrem/{asset_type}` | `get_crrem_pathway` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/crrem/asset/{asset_id}` | `get_crrem_asset` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/dqs/{portfolio_id}` | `get_portfolio_dqs` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/dqs/{portfolio_id}/improve` | `get_dqs_improvement_plan` | api/v1/routes/glidepath.py |

### 2.3 Engine `data_hub_client` (services/data_hub_client.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_db_session` |  | Get a fresh database session from the shared engine. |
| `_safe_query` | fn | Decorator that wraps DB calls with try/except + session cleanup. |
| `get_emissions` | db, lei | Retrieve Scope 1/2/3 GHG emissions for a counterparty by GLEIF LEI. Queries: 1. GLEIF entity -> jurisdiction + legal_name 2. OWID country-level emissions as proxy 3. Climate TRACE sector data if available Returns dict with keys: lei, scope1, scope2, scope3, year, source, dqs None if LEI not found. |
| `get_glidepath` | db, sector, scenario | Retrieve the NZBA/IEA annual glidepath for a sector from NGFS data. Returns list of dicts: [{year, glidepath, source}, ...] None if no data found. |
| `get_crrem_pathway` | db, country, asset_type, scenario | Retrieve the CRREM carbon intensity pathway for a real estate asset. Queries dh_crrem_pathways (live data from A13 ingester) first. Falls back to hardcoded reference data if no live rows found. Returns list of dicts: [{year, intensity, source}, ...] |
| `get_carbon_price` | db, scenario, year | Retrieve the carbon price (USD/tCO2) for a given NGFS scenario and year. Returns float USD per tCO2, or None. |
| `get_sector_benchmark` | db, sector | Retrieve sector-level financial/emissions benchmarks from ingested data. Aggregates from yfinance market data, SEC EDGAR filings, and SBTi targets. |
| `get_dqs_summary` | db, portfolio_id | Exposure-weighted average PCAF Data Quality Score for a portfolio. Reads assets from assets_pg, uses the pcaf_dqs column if populated, otherwise infers DQS from data availability: DQS 1-2: verified/unverified primary data (scope1_tco2e + audit flag) DQS 3: scope1_tco2e populated (unaudited) DQS 4: entity_lei present (Data Hub lookup possible) DQS 5: sector average fallback Returns dict with: weigh |
| `health_check` |  | Always True -- same process, no network hop. |

**Engine `data_hub_client` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_JURISDICTION_TO_ISO3` | `{'US': 'USA', 'GB': 'GBR', 'DE': 'DEU', 'FR': 'FRA', 'NL': 'NLD', 'JP': 'JPN', 'CN': 'CHN', 'IN': 'IND', 'BR': 'BRA', 'CA': 'CAN', 'AU': 'AUS', 'CH': 'CHE', 'SE': 'SWE', 'NO': 'NOR', 'DK': 'DNK', 'FI': 'FIN', 'IE': 'IRL', 'IT': 'ITA', 'ES': 'ESP', 'AT': 'AUT', 'BE': 'BEL', 'KR': 'KOR', 'SG': 'SGP', ` |

### 2.3 Engine `pcaf_time_series_engine` (services/pcaf_time_series_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `compute_rag` | actual, target | Returns (rag_status, deviation_pct). |
| `interpolate_glidepath` | glidepath, year | Linear interpolation between known glidepath years. |
| `PCAFTimeSeriesEngine.get_sector_glidepath` | portfolio_id, sector, time_series_rows, data_hub_glidepath |  |
| `PCAFTimeSeriesEngine.get_crrem_asset` | asset_id, asset_name, asset_type, country, actual_by_year, crrem_pathway | Compute CRREM pathway comparison for a single real estate asset. |
| `PCAFTimeSeriesEngine.build_status_grid` | portfolio_id, sectors, time_series_rows | Build sector × year RAG status grid for the tracker table. |
| `PCAFTimeSeriesEngine.get_available_sectors` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `Data`, `__future__` *(shared)*, `api` *(shared)*, `assets_pg` *(shared)*, `collections` *(shared)*, `csrd_entity_registry` *(shared)*, `db` *(shared)*, `dh_crrem_pathways` *(shared)*, `esrs_e1_ghg_emissions`, `exc` *(shared)*, `fastapi` *(shared)*, `real` *(shared)*, `real_estate`, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `upgrading`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/glidepath/crrem/asset/{asset_id}** — status `passed`, provenance ['db-empty'], source tables: `dh_crrem_pathways`
Output: `{'type': 'object', 'keys': ['asset_id', 'asset_name', 'stranding_year', 'current_intensity_kgco2_m2', 'pathway_source', 'data_points'], 'n_keys': 6}`

**GET /api/v1/glidepath/crrem/{asset_type}** — status `passed`, provenance ['db-empty'], source tables: `dh_crrem_pathways`
Output: `{'type': 'object', 'keys': ['asset_type', 'country', 'metric', 'source', 'pathway'], 'n_keys': 5}`

**GET /api/v1/glidepath/dqs/{portfolio_id}** — status `passed`, provenance ['db-empty'], source tables: `assets_pg`
Output: `{'type': 'object', 'keys': ['portfolio_id', 'weighted_dqs', 'dqs_distribution', 'coverage_pct', 'total_assets', 'total_exposure', 'improvement_actions', 'note'], 'n_keys': 8}`

**GET /api/v1/glidepath/dqs/{portfolio_id}/improve** — status `passed`, provenance ['db-empty'], source tables: `assets_pg`
Output: `{'type': 'object', 'keys': ['portfolio_id', 'current_weighted_dqs', 'improvement_plan', 'note'], 'n_keys': 4}`

**GET /api/v1/glidepath/nzba/{sector}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'metric', 'source', 'glidepath'], 'n_keys': 4}`

**GET /api/v1/glidepath/portfolio/{portfolio_id}/status-grid** — status `passed`, provenance ['db-empty'], source tables: `assets_pg`, `csrd_entity_registry`, `esrs_e1_ghg_emissions`
Output: `{'type': 'object', 'keys': ['portfolio_id', 'sectors', 'years', 'grid'], 'n_keys': 4}`

**GET /api/v1/glidepath/sector/{sector}** — status `passed`, provenance ['db-empty'], source tables: `assets_pg`, `csrd_entity_registry`, `dh_ngfs_scenario_data`, `esrs_e1_ghg_emissions`
Output: `{'type': 'object', 'keys': ['sector', 'portfolio_id', 'current_rag', 'glidepath_source', 'data_points', 'data_available', 'waci_rows_found'], 'n_keys': 7}`

**GET /api/v1/glidepath/sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sectors', 'source'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `data_hub_client` — extracted transformation lines:**
```python
co2_total = float(owid.co2 or 0) * 1_000_000  # Mt -> t
per_entity = co2_total / max(entity_count, 1)
scope1 = round(per_entity * 0.6, 2)
scope2 = round(per_entity * 0.25, 2)
scope3 = round(per_entity * 0.15, 2)
scope2 = round(float(ct.emissions_quantity) * 0.3, 2)
closest = min(records, key=lambda r: abs(r.year - year))
weighted_dqs = round(weighted_sum / total_exposure, 2) if total_exposure > 0 else 5.0
coverage_pct = round(covered_exposure / total_exposure * 100, 1) if total_exposure > 0 else 0.0
```

**Engine `pcaf_time_series_engine` — extracted transformation lines:**
```python
deviation = (actual - target) / target  # positive = above = worse
frac = (year - y1) / (y2 - y1)
years = sorted(set(list(range(2020, 2051, 5)) + list(actual_by_year.keys())))
iea_nze = target * 0.90 if target is not None else None
years = sorted(set(list(range(2020, 2051, 5)) + list(actual_by_year.keys())))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded in
`backend/services/pcaf_time_series_engine.py`, `backend/services/data_hub_client.py`, and
`backend/api/v1/routes/glidepath.py`. A sibling read-only domain, `glidepath_serve`, serves the
Data-Hub-stored pathway tables that this engine consumes.)*

### 7.1 What the domain computes

Three analytics over portfolio decarbonisation:

**1. Sector glidepath tracking** (`GET /sector/{sector}`, `/portfolio/{pid}/status-grid`):
portfolio **WACI** per sector-year is compared to an NZBA/IEA-NZE reference pathway with a
red-amber-green rule:

```
WACI(sector, yr) = Σᵢ (exposureᵢ / Σexposure) × (scope1ᵢ + scope2_marketᵢ) / net_turnover_M€ᵢ
deviation = (actual − glidepath) / glidepath
RAG: GREEN if deviation ≤ 0 · AMBER if ≤ +10% · RED if > +10% · GREY if target = 0 or no data
IEA NZE reference = NZBA target × 0.90    (code comment: "slightly more ambitious")
```

Targets between anchor years are **linearly interpolated** (`interpolate_glidepath`), clamped at
the endpoints.

**2. CRREM real-estate stranding** (`GET /crrem/{asset_type}`, `/crrem/asset/{asset_id}`): asset
kgCO₂/m² vs a CRREM-style pathway; **stranding year** = first year the asset goes RED, reset to
`None` if a later year returns to GREEN/AMBER (i.e. only a *persistent* terminal breach counts).

**3. PCAF data-quality score** (`GET /dqs/{pid}`, `/dqs/{pid}/improve`): exposure-weighted DQS
with a prioritised improvement roadmap:

```
weighted_DQS = Σ exposureᵢ × dqsᵢ / Σ exposureᵢ
dqsᵢ = pcaf_dqs column if 1–5, else 3 (reported scope 1) / 4 (LEI → Data Hub lookup) / 5 (sector avg)
improvement impact of asset i = exposureᵢ × (dqsᵢ − (dqsᵢ − 1)) / Σ exposure
```

### 7.2 Parameterisation — reference pathways

**NZBA fallback glidepaths** (WACI tCO₂e/M€ revenue; code cites NZBA 2021 Guidelines + IEA WEO
2023; used when the Data Hub pathway tables are offline):

| Sector | 2020 | 2030 | 2040 | 2050 | Sector | 2020 | 2030 | 2040 | 2050 |
|---|---|---|---|---|---|---|---|---|---|
| Power | 220 | 80 | 10 | 0 | Aviation | 850 | 600 | 250 | 0 |
| Oil & Gas | 680 | 460 | 200 | 0 | Cement | 620 | 400 | 140 | 0 |
| Steel | 1850 | 1200 | 400 | 0 | Aluminium | 1100 | 650 | 200 | 0 |
| Shipping | 1120 | 750 | 300 | 0 | Real Estate | 55 | 32 | 12 | 0 |
| Other | 300 | 190 | 80 | 0 | | | | | |

**CRREM fallback** (kgCO₂/m²·yr, "European office" style): Office 45→25→9→1.5,
Retail 55→30→11→2.0, Residential 40→20→6→0.5, Industrial 60→34→12→1.8, Hotel 65→36→14→2.5
(2020→2030→2040→2050).

**Thresholds:** AMBER band +10%; DQS improvement priority HIGH if weighted-impact > 0.05,
MEDIUM > 0.01; roadmap upgrades one DQS notch per asset, skips assets already at DQS ≤ 2, caps
the plan at top-20 and the "potential DQS" at the top-5 actions.

### 7.3 Calculation walkthrough

`/sector/{sector}` first tries the Data-Hub pathway (`data_hub_client.get_glidepath`), falling
back to the hardcoded table (`glidepath_source` records which). Actuals come from
`_compute_waci_rows`: a SQL join of `assets_pg` (exposure, sector) → `csrd_entity_registry`
(net turnover) → `esrs_e1_ghg_emissions` (scope 1 + market-based scope 2), weighted by exposure
share **across the whole portfolio** (so sector WACIs are portfolio-weight scaled, not
renormalised within the sector). Data points span 2020–2050 in 5-year steps plus any reported
years; `current_rag` is the most recent year with an actual.

### 7.4 Worked example — Steel sector, 2027 actual

Portfolio steel WACI reported for 2027 = 1,500 tCO₂e/M€.

| Step | Computation | Result |
|---|---|---|
| Interpolated NZBA target 2027 | 1600 + (2027−2025)/(2030−2025) × (1200−1600) | **1,440** |
| IEA NZE reference | 1,440 × 0.90 | 1,296 |
| Deviation | (1500 − 1440)/1440 | **+4.2% → AMBER** |

DQS cross-check: assets €60M @ DQS 5, €40M @ DQS 2 → weighted DQS = (60×5+40×2)/100 = **3.8**;
the roadmap proposes upgrading the DQS-5 asset to 4 (impact = 60×1/100 = 0.60 → HIGH priority;
potential DQS 3.2) and flags "Add LEI codes … (DQS 5 → 4)"; the DQS-2 asset is skipped.

### 7.5 RAG semantics & stranding rubric

- GREEN means **at or below** pathway (any negative deviation), not merely "close" — matching
  NZBA target-setting practice where the pathway is a ceiling.
- `target = 0` (the 2050 endpoint) returns GREY, avoiding division by zero — so end-state years
  are never scored.
- CRREM stranding is *last-crossing* logic: temporary breaches that later recover do not strand;
  the true CRREM methodology defines stranding as the first crossing of the asset's intensity
  line with the decarbonisation pathway, so this implementation is more lenient for
  non-monotonic actuals.

### 7.6 Data provenance & limitations

- No `sr(seed)` PRNG. Actuals derive from stored CSRD/ESRS emissions and portfolio tables;
  pathway numbers are Data-Hub-served when available, otherwise the **hardcoded fallback tables
  above — stylised transcriptions of NZBA/IEA/CRREM shapes, not licensed CRREM v2 data**
  (real CRREM pathways are country × asset-type specific; the fallback is one European-style
  curve per type; `country` is accepted but unused in fallback mode).
- IEA NZE = NZBA × 0.90 is an admitted approximation, not an IEA series.
- WACI uses (S1 + market-based S2) only — no scope 3, and the join requires exact
  `legal_name = company_name` matches; unmatched assets silently drop from actuals.
- Sector WACI is weighted by *portfolio-wide* exposure share; a small sector's WACI is deflated
  relative to a within-sector weighting (affects RAG severity for small books).
- DQS ladder inference (3/4/5 from data availability) is a heuristic; PCAF's actual DQS depends
  on scorecard options per asset class. The status grid always uses fallback pathways (never
  Data Hub).

### 7.7 Framework alignment

- **NZBA (Net-Zero Banking Alliance, 2021 Guidelines)** — sectoral intensity glidepaths to 2050
  with 5-year interim points; NZBA requires 2030 intermediate targets on IEA-NZE-consistent
  pathways — precisely the shape of the fallback tables and the RAG deviation test.
- **IEA Net Zero Emissions by 2050** — referenced as the more ambitious overlay (approximated at
  90% of NZBA here); in the real NZE, sector trajectories come from the IEA scenario model, not
  a scalar of NZBA.
- **CRREM (Carbon Risk Real Estate Monitor)** — asset-level kgCO₂/m² decarbonisation pathways
  and the "stranding year" concept (year the asset's intensity exceeds its pathway); CRREM
  derives country/type pathways by downscaling a 1.5°C global budget via SDA — this module
  consumes stored or fallback curves rather than deriving them.
- **PCAF Global GHG Accounting Standard §4 (data quality)** — the 1–5 DQS ladder,
  exposure-weighted portfolio DQS, and the improvement-roadmap framing (PCAF encourages
  disclosing weighted DQS and improving it over time); WACI itself follows the TCFD/PCAF
  intensity formula.

## 9 · Future Evolution

### 9.1 Evolution A — Probabilistic stranding and forward WACI projection (analytics ladder: rung 2 → 4)

**What.** The domain does honest deterministic tracking today: portfolio WACI per
sector-year vs an NZBA/IEA-NZE pathway with a RAG rule (`deviation ≤ 0` GREEN, `≤ +10%`
AMBER, else RED), CRREM real-estate stranding, and linear interpolation between anchor
years. Two limitations are visible in the atlas: several lineage traces run against
empty tables (`dh_crrem_pathways` db-empty; `esrs_e1_ghg_emissions` unpopulated), and
the IEA-NZE reference is a flat `target × 0.90` shortcut. Evolution A adds a forward
projection layer and a probabilistic stranding year.

**How.** (1) Project each asset/sector's own emissions trajectory from its history
(`pcaf_time_series_engine` already builds actual-by-year series) using a decarbonisation
rate fit, then compute stranding year as the crossing of the projected path and the
CRREM pathway — with a confidence band from the fit residuals, not a single
deterministic year. (2) Replace `iea_nze = target × 0.90` with the real IEA-NZE series
per sector. (3) Seed the empty `dh_crrem_pathways` and `esrs_e1_ghg_emissions` tables so
status-grid and DQS endpoints stop returning db-empty. (4) Bench-pin the RAG classifier
and interpolation.

**Prerequisites.** Seed CRREM pathways (A13 ingester) and ESRS E1 emissions
(shared with the platform D0 seeding); real IEA-NZE reference data. **Acceptance:**
`crrem/asset/{id}` returns a stranding year with a confidence interval; no
glidepath endpoint returns db-empty for the demo portfolio; bench pin reproduces
deviation and RAG band.

### 9.2 Evolution B — Decarbonisation-tracking analyst with improvement planning (LLM tier 2)

**What.** A copilot that reads a portfolio's status grid and answers "which sectors are
RED and by how much are we off the NZBA path?" (citing the deviation and RAG from
`/portfolio/{id}/status-grid`), then "what's the cheapest way to improve our data
quality score?" by calling `/dqs/{id}/improve` and narrating the returned improvement
actions.

**How.** Eight read-only GET endpoints filtered per module make the tool set: sector
glidepath, status grid, NZBA/CRREM pathways, DQS and DQS-improvement. The RAG semantics
and the WACI/deviation formulas from this Atlas page's §7.1 are the grounding corpus.
The DQS-improvement endpoint is the natural tier-2 action — it already returns a
prioritised action list, so the copilot orchestrates "show me the plan, then re-score
assuming we close the top three" as sequential tool calls.

**Prerequisites.** The db-empty traces from §4.2 must be resolved first (Evolution A's
seeding) — a copilot narrating a status grid built on empty CRREM tables would report
GREY/no-data for everything and mislead. **Acceptance:** every deviation and RAG label
in an answer matches a status-grid tool response; a DQS-improvement narrative lists only
actions returned by `/dqs/{id}/improve`; the copilot refuses to project stranding years
until Evolution A ships that capability.