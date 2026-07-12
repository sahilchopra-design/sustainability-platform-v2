# Api::Data_Hub_Catalog
**Module ID:** `api::data_hub_catalog` · **Route:** `/api/v1/data-hub-catalog` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/data-hub-catalog/sources` | `list_catalog_sources` | api/v1/routes/data_hub_catalog.py |
| GET | `/api/v1/data-hub-catalog/coverage` | `get_coverage` | api/v1/routes/data_hub_catalog.py |
| GET | `/api/v1/data-hub-catalog/search` | `cross_source_search` | api/v1/routes/data_hub_catalog.py |
| GET | `/api/v1/data-hub-catalog/entity/{identifier}` | `entity_360_view` | api/v1/routes/data_hub_catalog.py |
| GET | `/api/v1/data-hub-catalog/freshness` | `get_freshness` | api/v1/routes/data_hub_catalog.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `all` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_ca100_assessments` *(shared)*, `dh_country_risk_indices` *(shared)*, `dh_reference_data` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/data-hub-catalog/coverage** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`, `dh_climate_trace_emissions`, `dh_country_risk_indices`, `dh_ngfs_scenario_data`, `dh_owid_co2_energy`, `dh_reference_data`, `dh_sbti_companies`, `dh_sec_edgar_filings`, `dh_yfinance_market_data`, `entity_lei`
Output: `{'type': 'object', 'keys': ['coverage', 'total_records'], 'n_keys': 2}`

**GET /api/v1/data-hub-catalog/entity/{identifier}** — status `passed`, provenance ['db-empty'], source tables: `dh_sbti_companies`, `dh_sec_edgar_filings`, `dh_yfinance_market_data`, `entity_lei`, `entity_sanctions`
Output: `{'type': 'object', 'keys': ['identifier', 'sources', 'sources_found', 'source_count'], 'n_keys': 4}`

**GET /api/v1/data-hub-catalog/freshness** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`, `dh_climate_trace_emissions`, `dh_country_risk_indices`, `dh_ngfs_scenario_data`, `dh_owid_co2_energy`, `dh_reference_data`, `dh_sbti_companies`, `dh_sec_edgar_filings`, `dh_yfinance_market_data`, `entity_lei`
Output: `{'type': 'object', 'keys': ['freshness'], 'n_keys': 1}`

**GET /api/v1/data-hub-catalog/search** — status `passed`, provenance ['db-empty'], source tables: `dh_ca100_assessments`, `dh_climate_trace_emissions`, `dh_country_risk_indices`, `dh_owid_co2_energy`, `dh_sbti_companies`, `dh_sec_edgar_filings`, `dh_yfinance_market_data`, `entity_lei`, `entity_sanctions`
Output: `{'type': 'object', 'keys': ['query', 'total_hits', 'sources_matched', 'results'], 'n_keys': 4}`

**GET /api/v1/data-hub-catalog/sources** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`, `dh_climate_trace_emissions`, `dh_country_risk_indices`, `dh_ngfs_scenario_data`, `dh_owid_co2_energy`, `dh_reference_data`, `dh_sbti_companies`, `dh_sec_edgar_filings`, `dh_yfinance_market_data`, `entity_lei`
Output: `{'type': 'object', 'keys': ['sources', 'total_sources'], 'n_keys': 2}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/api/v1/routes/data_hub_catalog.py` at `/api/v1/data-hub-catalog` — the platform's
data-source discovery and entity-resolution layer. There is no services engine; every endpoint
is metadata + SQL/ORM aggregation over ingested tables, gated at `viewer` role minimum.)*

### 7.1 What the module computes

No risk mathematics — this is the **catalog and 360°-lookup layer over the platform's 14
registered public data sources** (the docstring says 13; `_SOURCE_REGISTRY` actually lists 14
entries because the four governance indices + GEM coal are itemised separately):

| Endpoint | Behaviour |
|---|---|
| `GET /sources` | Registry entries + live `COUNT(*)` row counts and last-sync timestamps |
| `GET /coverage` | Per-source coverage matrix (records, distinct entities/sectors/countries, year ranges) and a grand `total_records` sum |
| `GET /search?q=…` | Unified keyword search fanned out across up to 9 source blocks, grouped by source |
| `GET /entity/{identifier}` | Entity 360-view: resolve a LEI / ticker / name and pull GLEIF, sanctions, SEC EDGAR, yfinance and SBTi records for it |
| `GET /freshness` | `MAX(ingested_at)` + row count per source |

### 7.2 Parameterisation — the source registry

`_SOURCE_REGISTRY` hard-codes each source's name, category, backing table, optional
`table_filter`, and access method. The registered universe:

| Key | Source | Category | Table |
|---|---|---|---|
| gleif | GLEIF LEI Registry (ISO 17442) | Entity Resolution | `entity_lei` |
| sanctions | OpenSanctions (OFAC SDN, EU FSL, UN SC) | Entity Resolution | `entity_sanctions` |
| climate_trace | Climate TRACE satellite emissions | Emissions | `dh_climate_trace_emissions` |
| owid | Our World in Data CO₂/energy | Emissions | `dh_owid_co2_energy` |
| ngfs | NGFS Phase IV Scenario Explorer (IIASA) | Scenarios | `dh_ngfs_scenario_data` |
| sbti | SBTi Target Registry | Targets | `dh_sbti_companies` |
| sec_edgar | SEC EDGAR XBRL (10-K/10-Q/20-F) | Financial | `dh_sec_edgar_filings` |
| yfinance | yfinance/FMP market data incl. EVIC | Financial | `dh_yfinance_market_data` |
| ca100 | CA100+ Benchmark 2025 (169 companies, 10 indicators) | ESG | `dh_ca100_assessments` |
| cpi / fsi / fh_fiw / undp_gii | TI CPI 2023 · FfP FSI 2023 · Freedom House FIW 2013–2025 · UNDP GII | Governance/Social | `dh_country_risk_indices` (+ `index_name` filter) |
| gem_coal | GEM Coal Plant Tracker | Energy | `dh_reference_data` (source filter) |

Identifier-type heuristics in search/360-view (route constants): a query of exactly 20
alphanumeric characters is treated as an **LEI**; ≤6 alphabetic characters as a **ticker**
(≤8 with no dot in the 360-view); anything else falls back to `ILIKE %name%` matching.

### 7.3 Calculation walkthrough — entity 360-view resolution chain

`GET /entity/{identifier}` resolves progressively, each stage enriching the next:

1. **GLEIF** — exact LEI match or first `legal_name ILIKE` hit; on success stores
   `resolved_name` and parent-LEI linkage (direct/ultimate).
2. **Sanctions** — LEI-keyed lookup when available, else caption `ILIKE` on the resolved name;
   up to 5 hits, each explicitly labelled `"match_type": "potential"` (name-similarity, not a
   confirmed hit).
3. **SEC EDGAR** — ticker-keyed or name-keyed; latest 5 filings with revenue/net income/assets;
   back-fills `resolved_name` and the ticker if still unknown.
4. **yfinance** — latest `as_of_date` snapshot: market cap, enterprise value, **EVIC**, P/E,
   beta, ESG score. EVIC here feeds PCAF-style attribution elsewhere on the platform.
5. **SBTi** — up to 3 target records by resolved name.

The response reports `sources_found` / `source_count` so the frontend can render coverage
badges. `/search` applies the same per-source heuristics independently and returns
`total_hits = Σ len(results per source)`.

### 7.4 Worked example — resolution of a ticker

`GET /entity/MSFT`: `is_lei` false (4 chars), `is_ticker` true (≤8, alphabetic, no dot).
GLEIF step runs a name `ILIKE '%MSFT%'` (likely no hit — LEI records store legal names);
sanctions searches captions for "MSFT"; EDGAR filters `ticker = 'MSFT'` and returns the 5 most
recent fiscal years, setting `resolved_name = "MICROSOFT CORP"` (whatever the filing stores);
yfinance keys on the ticker for the newest snapshot; SBTi then searches
`company_name ILIKE '%MICROSOFT CORP%'`. A likely result: `source_count = 3–4` with GLEIF
missed because the ticker ≠ legal name — an inherent limitation of the heuristic chain (query
by LEI or full name to hit GLEIF).

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic fallback data** — every number is a live aggregate over ingested
  tables; empty tables yield zero counts, not fabricated rows. Registry metadata (names,
  descriptions, access methods) is the only hard-coded content.
- Entity resolution is heuristic string matching, not identifier graph resolution: no
  LEI↔ticker↔ISIN bridge table is consulted; GLEIF/SBTi joins rely on name substrings and can
  both miss (ticker vs legal name) and over-match (short names). Sanctions results are
  explicitly *potential* matches — no fuzzy-scoring threshold is applied, so they are a
  screening starting point, not KYC-grade adjudication.
- `COUNT(*)`/`MAX(ingested_at)` per request means the catalog reflects real-time DB state but
  performs full-table counts on every call (no caching/materialised views).
- Raw-SQL blocks interpolate table names/filters from the registry constants (safe because the
  registry is code-defined, but a pattern to preserve).
- The docstring's "13 sources" vs the registry's 14 entries is a benign documentation drift.

### 7.6 Framework alignment

- **ISO 17442 (LEI)** — GLEIF legal-entity identification incl. Level-2 parent relationships
  (direct/ultimate parent LEIs), the standard backbone for counterparty aggregation.
- **Sanctions compliance (OFAC SDN, EU consolidated list, UN Security Council)** via
  OpenSanctions' consolidated dataset — supports the screening step of KYC/AML workflows.
- **NGFS Phase IV scenarios** — IIASA Scenario Explorer variables (carbon price, emissions,
  GDP) as the platform's transition-scenario source of record.
- **SBTi** — validated science-based target statuses and ambition classes.
- **Climate Action 100+ Net Zero Benchmark** — 10-indicator company assessments.
- **SEC EDGAR XBRL** — structured financial fundamentals from statutory filings.
- **PCAF (implicitly)** — the yfinance `evic` field (Enterprise Value Including Cash) is the
  PCAF-prescribed attribution denominator for listed-equity financed emissions, consumed by the
  PCAF modules downstream.
- **Transparency International CPI · Fund for Peace FSI · Freedom House FIW · UNDP GII · GEM
  Coal Plant Tracker** — governance/social/energy reference indices catalogued for the
  country-risk domain.

## 9 · Future Evolution

### 9.1 Evolution A — Identifier-graph entity resolution and cached coverage (analytics ladder: rung 1 → 2)

**What.** The platform's data-source discovery and entity-360 layer over 14 registered public sources
(GLEIF, OpenSanctions, Climate TRACE, OWID, NGFS, SBTi, SEC EDGAR, yfinance, CA100+, TI CPI/FSI/FH/
GII, GEM coal) — no PRNG, live aggregates, honest zero-counts on empty tables. §7.5 names the core
limitation: **entity resolution is heuristic string matching, not identifier-graph resolution** — no
LEI↔ticker↔ISIN bridge is consulted, so the GLEIF/SBTi joins rely on name substrings and both miss
(ticker ≠ legal name, as the §7.4 MSFT example shows) and over-match (short names); sanctions results
are explicitly *potential* (no fuzzy-scoring threshold), a screening starting point not KYC-grade.
Evolution A adds an identifier-bridge table (LEI↔ticker↔ISIN↔CIK) so the 360-view resolves reliably,
and a fuzzy-match confidence score on sanctions hits.

**How.** A `identifier_xref` table (populated from GLEIF Level-1 + SEC CIK-ticker + OpenFIGI, all
already wired) lets `entity_360_view` resolve a ticker to its LEI and legal name before fanning out,
so GLEIF/SBTi joins hit; sanctions matches get a similarity score with a documented threshold.
Rung 2: cache the per-source `COUNT(*)`/`MAX(ingested_at)` via materialized views (roadmap D4) so the
catalog isn't full-table-counting on every request.

**Prerequisites.** The §4.2 harness shows `entity/{identifier}` and `search` returning `db-empty` for
some sources — populate the thin source tables (roadmap D1); fix the benign "13 vs 14 sources"
doc drift. **Acceptance:** the §7.4 MSFT resolution now hits GLEIF via the ticker→LEI bridge
(`source_count` rises); a sanctions hit carries a similarity score; coverage/freshness are served from
cached views, not per-request full counts.

### 9.2 Evolution B — Entity-resolution tool underpinning the desk orchestrators (LLM tier 2)

**What.** This domain is the platform's natural **entity-resolution and source-discovery tool** for
every desk copilot: "resolve ArcelorMittal to its LEI and pull all we know" tool-calls
`entity_360_view` (GLEIF + sanctions + EDGAR + yfinance EVIC + SBTi in one shot), "what sources cover
emissions?" calls `/sources`/`/coverage`, "how fresh is our SBTi data?" calls `/freshness`. It is the
front door that grounds cross-module entity references in one resolved identity — exactly the tier-3
desk-orchestrator routing step the roadmap describes ("assess this counterparty → GLEIF resolve →
sanctions screen → …").

**How.** Register the 5 endpoints as a shared resolution tool; the no-fabrication validator ensures
any entity attribute (EVIC, market cap, sanctions status, SBTi target) cited by a desk copilot traces
to a 360-view tool call with its source. The `evic` field is the PCAF attribution denominator, so a
financed-emissions copilot's attribution factor is grounded here. Sanctions hits are always surfaced
as "potential — screening only," never as adjudicated KYC.

**Prerequisites.** Evolution A's identifier-bridge (heuristic string matching is too unreliable for
tool-backed resolution) and populated source tables; Atlas + source-registry corpus embedded (roadmap
D3). **Acceptance:** an entity resolved by a desk copilot returns its LEI-anchored 360-view with
per-source provenance; an EVIC used in a PCAF attribution traces to the yfinance source via this tool;
a sanctions mention is labelled potential with its similarity score, never presented as confirmed.