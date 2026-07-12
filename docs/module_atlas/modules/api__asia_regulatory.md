# Api::Asia_Regulatory
**Module ID:** `api::asia_regulatory` · **Route:** `/api/v1/asia-regulatory` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/asia-regulatory/brsr/top-1000` | `brsr_top_1000_summary` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/brsr/{entity_id}/scorecard` | `get_brsr_scorecard` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/brsr/{entity_id}` | `get_brsr_disclosure` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/hkma/sector-benchmark` | `hkma_sector_benchmark` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/hkma/{entity_id}` | `get_hkma_assessment` | api/v1/routes/asia_regulatory.py |
| POST | `/api/v1/asia-regulatory/hkma/{entity_id}/stress-test` | `run_hkma_stress_test` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/boj/{entity_id}/scenarios` | `get_boj_entity_scenarios` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/boj/sector-impact/{sector}` | `get_boj_sector_impact` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/asean/member-states` | `list_asean_member_states` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/asean/focus-areas` | `list_asean_focus_areas` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/asean/member-state/{country_code}` | `get_asean_member_state_coverage` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/asean/{entity_id}/taxonomy` | `get_asean_entity_taxonomy` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/pboc/catalogue` | `pboc_gbepc_catalogue` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/pboc/categories` | `pboc_categories` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/pboc/{entity_id}/green-finance` | `get_pboc_green_finance` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/cbi/market-overview` | `cbi_market_overview` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/cbi/certified-bonds` | `cbi_certified_bonds` | api/v1/routes/asia_regulatory.py |
| POST | `/api/v1/asia-regulatory/cbi/refresh` | `cbi_refresh` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/cbi/sector-criteria` | `cbi_sector_criteria` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/cbi/pricing-report` | `cbi_pricing_report` | api/v1/routes/asia_regulatory.py |

### 2.3 Engine `asia_regulatory_engine` (services/asia_regulatory_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_exec_read` | sql, params | Execute a read query and return list-of-dicts. Fails silently → []. |
| `_exec_write` | sql, params | Execute a write query. Returns True on success. |
| `BRSRCoreEngine.get_brsr_disclosure` | entity_id |  |
| `BRSRCoreEngine.get_brsr_scorecard` | entity_id |  |
| `BRSRCoreEngine._normalise_reporter_row` | r | Add frontend-expected key aliases to a raw DB row. |
| `BRSRCoreEngine.get_top_1000_summary` |  |  |
| `BRSRCoreEngine._extract_core_kpis` | row |  |
| `BRSRCoreEngine._enrich` | row |  |
| `BRSRCoreEngine._band` | score | score is on 0-100 scale (weighted sum of P1-P9 × weights). |
| `HKMAEngine.get_assessment` | entity_id |  |
| `HKMAEngine.run_stress_test` | entity_id, scenarios |  |
| `HKMAEngine.get_sector_benchmark` |  |  |
| `HKMAEngine._enrich_assessment` | row |  |
| `HKMAEngine._format_stress` | entity, results, total_assets |  |
| `HKMAEngine._maturity_label` | score |  |
| `BOJScenarioEngine.get_entity_scenarios` | entity_id |  |
| `BOJScenarioEngine.get_sector_impact` | sector |  |
| `BOJScenarioEngine._build_reference_output` | entity_id |  |
| `ASEANTaxonomyEngine.get_entity_taxonomy` | entity_id |  |
| `ASEANTaxonomyEngine.get_member_state_coverage` | country_code |  |
| `ASEANTaxonomyEngine._summarise` | activities |  |
| `PBoCGreenFinanceEngine.get_entity_green_finance` | entity_id |  |
| `PBoCGreenFinanceEngine.get_gbepc_catalogue` |  |  |
| `PBoCGreenFinanceEngine._summarise` | records |  |

### 2.3 Engine `cbi_data_client` (services/cbi_data_client.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_db` |  |  |
| `_exec_read` | sql, params |  |
| `_exec_write` | sql, params |  |
| `CBIDataClient.get_market_overview` | force_refresh | Returns aggregate market stats. Checks DB cache first; falls back to CBI API; falls back to reference. |
| `CBIDataClient.get_certified_bonds` | limit, country, sector, label, issuer | Returns list of CBI-certified bonds. Checks cbi_certified_bonds DB table first, then falls back to reference. |
| `CBIDataClient.refresh` |  | Force refresh from CBI API and store in DB. |
| `CBIDataClient.get_sector_criteria` |  |  |
| `CBIDataClient.get_pricing_report` |  | Green Bond Pricing in the Primary Market — latest available. |
| `CBIDataClient._fetch_live_market` |  | Attempt to fetch from CBI API. Returns None if unreachable. NOTE: CBI publishes periodic CSV/Excel files at the data endpoint. We attempt HTTP GET and parse; on error, return None gracefully. |
| `CBIDataClient._fetch_live_bonds` |  | Fetch bond-level data from CBI API. |
| `CBIDataClient._parse_market_response` | raw | CBI publishes data as CSV. We parse column headers and aggregate. If format is unrecognised, returns None so caller falls back. |
| `CBIDataClient._normalise_market` | data |  |
| `CBIDataClient._normalise_bond` | b |  |
| `CBIDataClient._get_latest_snapshot` |  |  |
| `CBIDataClient._store_snapshot` | data |  |
| `CBIDataClient._store_bonds` | bonds |  |
| `CBIDataClient._format_overview` | data |  |

**Engine `cbi_data_client` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `CBI_BASE_URL` | `'https://www.climatebonds.net/cbi/pub/data'` |
| `CACHE_TTL_SECS` | `3600` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `CBI`, `DB` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/asia-regulatory/asean/focus-areas** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['focus_areas'], 'n_keys': 1}`

**GET /api/v1/asia-regulatory/asean/member-state/{country_code}** — status `passed`, provenance ['db-empty'], source tables: `asean_entities`, `asean_taxonomy_activities`
Output: `{'type': 'object', 'keys': ['country_code', 'total_activities', 'green_pct', 'amber_pct', 'red_pct', 'activities'], 'n_keys': 6}`

**GET /api/v1/asia-regulatory/asean/member-states** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['member_states'], 'n_keys': 1}`

**GET /api/v1/asia-regulatory/asean/{entity_id}/taxonomy** — status `passed`, provenance ['db-empty'], source tables: `asean_entities`, `asean_taxonomy_activities`
Output: `{'type': 'object', 'keys': ['error', 'entity_id'], 'n_keys': 2}`

**GET /api/v1/asia-regulatory/boj/sector-impact/{sector}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'scenarios', 'methodology'], 'n_keys': 3}`

**GET /api/v1/asia-regulatory/boj/{entity_id}/scenarios** — status `passed`, provenance ['db-empty'], source tables: `boj_scenario_results`
Output: `{'type': 'object', 'keys': ['entity_id', 'source', 'results', 'methodology'], 'n_keys': 4}`

**GET /api/v1/asia-regulatory/brsr/top-1000** — status `passed`, provenance ['db-empty'], source tables: `brsr_disclosures`
Output: `{'type': 'object', 'keys': ['total_entities', 'top_reporters', 'disclosures'], 'n_keys': 3}`

**GET /api/v1/asia-regulatory/brsr/{entity_id}** — status `passed`, provenance ['db-empty'], source tables: `brsr_disclosures`
Output: `{'type': 'object', 'keys': ['error', 'entity_id'], 'n_keys': 2}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is written directly from
`backend/services/asia_regulatory_engine.py` (729 lines), `cbi_data_client.py`, and
`api/v1/routes/asia_regulatory.py`. No guide↔code mismatch to report.)*

### 7.1 What the domain computes

A five-regime **Asian regulatory analytics engine** whose header states its design principle:
*"All computation is deterministic against real DB rows; falls back to curated reference data
when rows are absent."* The exposed routes cover three of the five sub-engines:

| Route family | Sub-engine | Data tables |
|---|---|---|
| `/brsr/top-1000`, `/brsr/{entity_id}` | `BRSRCoreEngine` (SEBI BRSR, India) | `brsr_disclosures` (migration 009; 1,323 Indian companies per the orchestration registry) |
| `/boj/{entity_id}/scenarios`, `/boj/sector-impact/{sector}` | `BOJScenarioEngine` | `boj_scenario_results` (migration 028) + reference table |
| `/asean/member-states`, `/asean/member-state/{cc}`, `/asean/{entity_id}/taxonomy`, `/asean/focus-areas` | `ASEANTaxonomyEngine` | `asean_entities`, `asean_taxonomy_activities` |
| (engine-internal) | `HKMAEngine` (GS-1) · PBoC Green Finance | `hkma_*`, `pboc_*` tables |

### 7.2 Parameterisation

**BRSR Core (SEBI LODR 2023).** Nine principles P1–P9 with weights
`P1 0.10 · P2 0.12 · P3 0.12 · P4 0.08 · P5 0.10 · P6 0.18 · P7 0.08 · P8 0.10 · P9 0.12`
(environment P6 heaviest — a platform weighting choice; SEBI itself does not publish principle
weights). DB scores are 0–10, normalised ×10 to 0–100. Readiness bands:
`≥ 85 Leader · ≥ 70 Advanced · ≥ 55 Developing · ≥ 35 Emerging · else Initial`.
Core KPIs extracted per the BRSR Core assurance set: Scope 1/2/3 tCO₂e, energy GJ, renewable %,
water intensity (m³/₹cr revenue), waste intensity, CSR spend, women in management %, attrition,
median wage ratio, training hours, independent directors %, board meetings, cyber incidents.

**HKMA GS-1.** A reference **sector × scenario credit-loss table** labelled "HKMA 2023 exercise":
e.g. Energy credit loss 3.5 % (< 2 °C) → 5.2 % (2–3 °C) → 8.1 % (> 3 °C); Real Estate 1.2/2.9/5.8 %.
Derived impacts: `NII impact = −assets × loss% × 0.15` and `CAR impact = −loss% × 8.5 bps`.
Maturity labels on the 4-pillar assessment (governance/strategy/risk-mgmt/metrics, 0–5):
`≥ 4.5 Leading · ≥ 3.5 Advanced · ≥ 2.5 Developing · ≥ 1.5 Initial`.

**BoJ scenarios.** A 4-scenario reference cube ("BoJ 2023 exercise"): Transition 1.5C/2C at
2030/2050, Physical 2C/4C at 2050/2100, × 5 sectors, each with `pd_bps`, `lgd_bps`,
`credit_loss_pct`, `roe_pp`. Ordering is internally coherent: transition stress is front-loaded
and worst under 1.5 °C (Energy 2050: 4.5 % loss at 1.5C vs 3.2 % at 2C), physical stress
back-loaded and worst under 4 °C (Agriculture 2100: 10.7 % loss, PD +380 bps).

**ASEAN Taxonomy v3 (March 2024).** Five focus areas (mitigation, adaptation,
ecosystems/biodiversity, circular economy, social inclusion), 10 member states, two tiers
(Foundation / Plus) and the traffic-light system (Green/Amber/Red) — matching the published
framework structure.

### 7.3 Calculation walkthrough

1. **BRSR scorecard** — lookup by UUID or fuzzy name; per-principle score ×10;
   `overall = Σ P_i × w_i`; band label; section A/C completeness from status ∈
   {published, submitted, approved}; assurance flag/provider/standard passed through. The
   top-1000 summary computes population stats (complete-reporting count, assured %, average P6,
   average readiness) over all rows with `reporting_year ≥ 2022` and returns the top 25 by
   readiness, with column aliases normalised for the frontend radar/grid.
2. **HKMA stress test** — prefers stored `hkma_stress_scenarios` rows; otherwise expands the
   reference table across requested scenarios, scaling NII/CAR impacts by the entity's real
   `total_assets_hkd`.
3. **BoJ entity scenarios** — DB rows if present (`source: "db"`), else the full 4×2×5 reference
   cube flattened to 30 rows (`source: "reference_table"`) — the source field makes the fallback
   explicit to callers.
4. **ASEAN coverage** — joins entities to activities per member state; computes Green/Amber
   percentages as simple activity-count shares; entity view returns activities with
   `eligible_pct` / `aligned_pct` and a tier/traffic-light summary.
5. **CBI client** (`cbi_data_client.py`) — fetches/caches Climate Bonds Initiative certified-bond
   data used by the ASEAN/green-finance views.

### 7.4 Worked example (BRSR overall score)

Entity with principle scores (0–10): P1 8.2, P2 7.5, P3 8.0, P4 6.5, P5 7.0, P6 8.8, P7 6.0,
P8 7.2, P9 7.8 → normalised ×10:

| Step | Computation | Result |
|---|---|---|
| Weighted sum | 82·0.10 + 75·0.12 + 80·0.12 + 65·0.08 + 70·0.10 + 88·0.18 + 60·0.08 + 72·0.10 + 78·0.12 | 8.2+9.0+9.6+5.2+7.0+15.84+4.8+7.2+9.36 |
| Overall score | Σ | **76.2** |
| Band | 70 ≤ 76.2 < 85 | **Advanced** |

The 0.18 weight makes P6 (environment) the swing factor: ±1 point (0–10 scale) moves the overall
score ±1.8.

### 7.5 Data provenance & limitations

- **Primary path is real DB data**: BRSR disclosures were seeded from the platform's Supabase
  BRSR database (1,323 companies, migration 009); HKMA/BoJ/ASEAN/PBoC tables come from migration
  028 seeds. The engine never fabricates per-entity values — absent rows return errors or
  clearly-labelled reference output.
- The HKMA and BoJ **reference tables are hand-encoded approximations** of the published 2023
  supervisory exercises. Their orderings and magnitudes are consistent with the published
  aggregate findings, but individual cell values should be treated as curated calibrations, not
  verbatim regulator numbers.
- The BRSR principle weights and readiness bands are platform conventions; SEBI mandates
  disclosure (and BRSR Core reasonable assurance for the top-150 glide path) but no composite
  score.
- HKMA derived impacts use flat scalars (NII = 15 % of credit loss; CAR = 8.5 bps per loss-%),
  which compress balance-sheet structure into two constants.
- `_normalise_reporter_row` maps some KPIs across labels (e.g. energy GJ surfaced under a kWh
  key, water intensity under a consumption key) and hardcodes `section_b_complete = True` —
  display conveniences that slightly blur units.

### 7.6 Framework alignment

- **SEBI BRSR / BRSR Core (LODR amendment 2023)** — India's mandatory ESG disclosure for the
  top-1000 listed companies (FY 2022-23 onward), with BRSR Core defining a subset of ~49
  assured KPIs; the engine's core-KPI extraction and assurance flags mirror this two-layer
  design.
- **HKMA SPM GS-1 (2021, upd. 2023)** — supervisory expectations across governance, strategy,
  risk management and metrics; the engine's 4-pillar maturity + sectoral climate stress test
  reflects the HKMA's 2023 sector-level climate stress-testing exercise.
- **Bank of Japan climate scenario analysis (2022/2023)** — joint FSA/BoJ pilot examining
  transition and physical risk on major banks' credit portfolios; the PD/LGD/credit-loss/ROE
  impact vocabulary matches the exercise's disclosed dimensions.
- **ASEAN Taxonomy v3 (2024)** — the two-tier (Foundation/Plus) structure with traffic-light
  classification and five environmental-social focus areas is encoded verbatim; Foundation tier
  enables lower-capacity members to classify via principles rather than technical screening
  criteria.
- **PBoC Green Bond Endorsed Project Catalogue (2021) + Common Ground Taxonomy** — covered by the
  fifth sub-engine over `pboc_*` tables (not exposed under the traced routes).

## 9 · Future Evolution

### 9.1 Evolution A — Populate the empty regime tables and calibrate the stress cubes (analytics ladder: rung 2 → 3)

**What.** A five-regime Asian regulatory engine (SEBI BRSR, HKMA GS-1, BoJ scenarios, ASEAN
Taxonomy v3, PBoC green finance) built on the honest principle in its own header: "all computation
is deterministic against real DB rows; falls back to curated reference data when rows are absent."
BRSR runs on 1,323 real Indian companies (migration 009). But §4.2 shows most routes returning
`db-empty` — the ASEAN, BoJ and HKMA tables are seeded thin, so the engine serves its hand-encoded
reference cubes (labelled `source: "reference_table"`, honestly) rather than entity data. §7.5 also
notes the HKMA/BoJ stress tables are curated approximations of the 2023 exercises, and HKMA derived
impacts use flat scalars (NII = 15% of credit loss, CAR = 8.5 bps/loss-%). Evolution A populates
the empty regime tables with real entity data and calibrates the stress-loss cells against the
published supervisory findings.

**How.** Ingesters/seeders for `asean_entities`/`asean_taxonomy_activities`, `boj_scenario_results`
and `hkma_stress_scenarios` (roadmap D1 write-side activation against a Supabase branch); the
reference cubes remain as the labelled fallback. Rung 3: replace the flat NII/CAR scalars with a
balance-sheet-structure-aware calculation, and cite each HKMA/BoJ stress cell to its published
source magnitude.

**Prerequisites.** The `db-empty` provenance across ASEAN/BoJ/BRSR-detail routes (§4.2) is the
headline gap — seed real rows so `/{entity_id}` paths stop returning `{error, entity_id}`; the BRSR
principle weights (P6 environment 0.18) and readiness bands are platform conventions to document as
such (SEBI publishes no composite). **Acceptance:** an ASEAN entity taxonomy query returns real
activities not an error; the §7.4 BRSR worked example (76.2 → Advanced) reproduces; HKMA impacts
respond to balance-sheet structure, not two flat scalars.

### 9.2 Evolution B — Asian-regulatory analyst copilot across the five regimes (LLM tier 2)

**What.** A tool-calling analyst answering "what's this Indian company's BRSR readiness?" (calls
`/brsr/{id}/scorecard`), "run the HKMA climate stress test" (`/hkma/{id}/stress-test`), "how does
this activity classify under ASEAN Taxonomy?" (`/asean/{id}/taxonomy`), and "what green-bond
criteria apply?" (CBI endpoints) — narrating real DB rows where present and clearly flagging when
the engine falls back to reference tables (the `source` field makes this explicit).

**How.** Tool schemas over the ~20 endpoints; the reference data (BRSR P1–P9 weights, ASEAN
traffic-light tiers, BoJ scenario cube, HKMA maturity bands) is ideal RAG grounding for "what does
BRSR Core assurance require?" questions — a tier-1 explainer over a tier-2 operator. The
no-fabrication validator checks every score and loss-% against tool output; because fallbacks are
labelled `source: "reference_table"`, the copilot must state when a figure is a regime reference
value versus a real entity disclosure.

**Prerequisites.** Evolution A's seeded tables (so more answers are real-entity, not reference
fallback); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure cited
carries its `source` (db vs reference) provenance; a BRSR query for a real company returns its
actual P6/readiness; asking about an unpopulated regime returns the labelled reference output, not a
fabricated entity value.