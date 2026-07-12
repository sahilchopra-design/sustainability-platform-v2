# Api::Pe_Deals
**Module ID:** `api::pe_deals` · **Route:** `/api/v1/pe-deals` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pe-deals/screen` | `screen_deal` | api/v1/routes/pe_deals.py |
| POST | `/api/v1/pe-deals/compare` | `compare_deals` | api/v1/routes/pe_deals.py |
| POST | `/api/v1/pe-deals/pipeline-summary` | `pipeline_summary` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/sector-heatmap` | `get_sector_heatmap` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/sub-dimensions` | `get_sub_dimensions` | api/v1/routes/pe_deals.py |
| POST | `/api/v1/pe-deals/db/screen-and-persist` | `db_screen_and_persist` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/db/deals` | `db_list_deals` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/db/deals/{deal_id}` | `db_get_deal` | api/v1/routes/pe_deals.py |
| PATCH | `/api/v1/pe-deals/db/deals/{deal_id}/stage` | `db_update_stage` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/db/pipeline-summary` | `db_pipeline_summary` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/db/sector-heatmap` | `db_sector_heatmap` | api/v1/routes/pe_deals.py |
| POST | `/api/v1/pe-deals/db/seed-heatmap` | `db_seed_heatmap` | api/v1/routes/pe_deals.py |

### 2.3 Engine `pe_db_service` (services/pe_db_service.py)
| Function | Args | Purpose |
|---|---|---|
| `PEDBService.create_deal` | deal_data | Create a new PE deal record. Args: deal_data: Dict with keys matching pe_deals columns. Returns: Created deal record. |
| `PEDBService.get_deal` | deal_id | Get a single deal by ID. |
| `PEDBService.list_deals` | fund_id, stage, sector, limit | List deals with optional filters. |
| `PEDBService.update_deal_stage` | deal_id, new_stage, notes | Update deal pipeline stage. |
| `PEDBService.persist_screening` | deal_id, screening_result | Persist ESG screening scores from pe_deal_engine.screen_deal() output. Args: deal_id: UUID of the deal. screening_result: Output from PEDealEngine.screen_deal() serialised. Returns: Summary with score_ids created. |
| `PEDBService.get_screening_scores` | deal_id | Get all screening scores for a deal. |
| `PEDBService.create_portfolio_company` | company_data | Create a portfolio company record (typically after deal closes). |
| `PEDBService.list_portfolio_companies` | fund_id, status, limit | List portfolio companies with optional filters. |
| `PEDBService.update_portfolio_company` | company_id, updates | Update a portfolio company (NAV, ESG score, exit data, etc.). Only updates provided fields. |
| `PEDBService.record_exit` | company_id, exit_date, exit_proceeds_eur | Record a portfolio company exit. |
| `PEDBService.seed_sector_heatmap` |  | Seed pe_sector_risk_heatmap from PEDealEngine's hardcoded data. Idempotent: skips sectors that already exist. |
| `PEDBService.get_sector_heatmap` |  | Get sector risk heatmap from DB. |
| `PEDBService.pipeline_summary` | fund_id | Generate pipeline analytics from pe_deals table. Returns counts by stage, sector, screening status, and totals. |
| `PEDBService.portfolio_summary` | fund_id | Generate portfolio company analytics from pe_portfolio_companies. |
| `PEDBService.screen_and_persist_deal` | deal_data, screening_input | Full workflow: create deal record → run ESG screening → persist scores. Args: deal_data: Dict for pe_deals columns. screening_input: Dict for PEDealEngine.screen_deal() input. Returns: Combined result with deal_id, screening scores, and status. |
| `_to_json` | val | Convert a Python object to JSON string for JSONB columns. |
| `_row_to_dict` | row | Convert a SQLAlchemy row mapping to a JSON-safe dict. |
| `_dataclass_to_dict` | obj | Recursively convert a dataclass to dict. |

### 2.3 Engine `pe_deal_engine` (services/pe_deal_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PEDealEngine.screen_deal` | deal | Run ESG screening on a single deal. |
| `PEDealEngine.compare_deals` | deals | Generate side-by-side comparison table for IC discussion. |
| `PEDealEngine.pipeline_summary` | deals | Aggregate pipeline analytics. |
| `PEDealEngine.get_sector_heatmap` |  | Return sector ESG risk heatmap reference data. |
| `PEDealEngine.get_sub_dimensions` |  | Return ESG sub-dimensions for screening scorecard. |
| `PEDealEngine._score_dimensions` | deal | Score each ESG dimension from deal's sub-dimension ratings. |
| `PEDealEngine._composite_score` | dimension_scores | Equal-weighted composite across all dimensions. 1=best, 5=worst risk. |
| `PEDealEngine._risk_band` | composite | Map composite score to risk band. Lower score = lower risk. |
| `PEDealEngine._detect_red_flags` | deal | Detect ESG red flags from deal attributes. |
| `PEDealEngine._recommendation` | composite, risk_band, red_flags, hard_count | Generate screening recommendation. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DB` *(shared)*, `__future__` *(shared)*, `db` *(shared)*, `deal`, `engine` *(shared)*, `fastapi` *(shared)*, `pe_deals`, `pe_sector_risk_heatmap`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pe-deals/db/deals** — status `passed`, provenance ['db-empty'], source tables: `pe_deals`
Output: `{'type': 'object', 'keys': ['count', 'deals'], 'n_keys': 2}`

**GET /api/v1/pe-deals/db/deals/{deal_id}** — status `failed`, provenance ['db-empty'], source tables: `pe_deals`
Output: `None`

**GET /api/v1/pe-deals/db/pipeline-summary** — status `passed`, provenance ['real-db'], source tables: `pe_deals`
Output: `{'type': 'object', 'keys': ['totals', 'by_stage', 'by_sector', 'by_screening_status'], 'n_keys': 4}`

**GET /api/v1/pe-deals/db/sector-heatmap** — status `passed`, provenance ['db-empty'], source tables: `pe_sector_risk_heatmap`
Output: `{'type': 'object', 'keys': ['count', 'sectors'], 'n_keys': 2}`

**GET /api/v1/pe-deals/sector-heatmap** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sectors'], 'n_keys': 1}`

**GET /api/v1/pe-deals/sub-dimensions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dimensions'], 'n_keys': 1}`

**POST /api/v1/pe-deals/compare** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PATCH /api/v1/pe-deals/db/deals/{deal_id}/stage** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `pe_deal_engine` — extracted transformation lines:**
```python
sector_overall = round(sum(sector_risk.values()) / max(len(sector_risk), 1))
red_flag_count=result.hard_flag_count + result.soft_flag_count,
overall = round(sum(risks.values()) / len(risks))
avg_deal_size_eur=round(total_size / n, 2),
avg_esg_score=round(total_esg / n, 2),
overall = round(sum(risks.values()) / len(risks))
avg = total / assessed if assessed > 0 else 3.0  # Default to neutral if not assessed
avg = sum(assessed_vals) / len(assessed_vals)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::pe_portfolio` | engine:pe_db_service |

## 7 · Methodology Deep Dive

The `pe_deals` domain (`/api/v1/pe-deals`) is a **PE/VC deal-pipeline + ESG-screening engine**
(`pe_deal_engine.py`, with `pe_db_service.py` for persistence). It scores each deal across five
ESG dimensions, detects hard/soft red flags, contextualises with a sector risk heatmap, and
issues a proceed/conditions/reject recommendation.

### 7.1 What the module computes

For each deal: a composite ESG score (1 best … 5 worst risk), a risk band, a red-flag list, a
screening recommendation, and sector context. The composite is an equal-weighted mean of five
dimension scores, each the mean of its assessed sub-dimensions:

```
dimension_avg  = mean(assessed sub-dimension ratings)   (default 3.0 if none assessed)
composite      = mean(5 dimension_avgs)
risk_band      = LOW ≤2 · MEDIUM ≤3 · HIGH ≤4 · CRITICAL >4
```

### 7.2 Parameterisation / scoring rubric

**Five ESG dimensions** (`ESGDimension`): environmental, social, governance, transition_risk,
physical_risk — each with four sub-dimensions (`ESG_SUB_DIMENSIONS`), e.g. environmental =
carbon_intensity, resource_efficiency, pollution_prevention, biodiversity_impact.

**Sector ESG risk heatmap** (`SECTOR_ESG_RISK`, 1-5 per dimension) — selected rows:

| Sector | Env | Social | Gov | Transition | Physical |
|---|---|---|---|---|---|
| Energy | 5 | 3 | 3 | 5 | 4 |
| Utilities | 4 | 2 | 3 | 5 | 4 |
| Financials | 1 | 2 | 4 | 3 | 1 |
| Technology | 2 | 3 | 3 | 1 | 1 |

**Red-flag rules** (`_detect_red_flags`): **hard** (deal-breakers) = controversial weapons,
sanctions hit, UNGC violation, child-labour risk. **soft** (mitigation) = high-carbon sector
without transition plan, severe environmental incident, tax-haven structure, or any assessed
dimension averaging >4.0. **High-carbon sectors** (`HIGH_CARBON_SECTORS`): Energy, Utilities,
Materials.

**Recommendation** (`_recommendation`): any hard flag → **reject**; CRITICAL band → reject;
soft flags or HIGH band → **proceed_with_conditions**; else **proceed**.

**Provenance:** the heatmap and sub-dimension taxonomy are platform-authored, referenced to
ILPA ESG Data Convergence, UN PRI, SFDR Art.7 and TCFD for unlisted assets.

### 7.3 Calculation walkthrough

`screen_deal`: `_score_dimensions` averages the deal's supplied sub-ratings per dimension
(unassessed → 3.0 neutral); `_composite_score` equal-weights the five; `_risk_band` maps to a
band; `_detect_red_flags` runs the rule set; `sector_overall = round(mean(sector heatmap
row))`; `_recommendation` combines flags + band. `pipeline_summary` aggregates deals by stage
and sector, average deal size and ESG score, red-flag and deal-breaker counts, and a full
sector heatmap.

### 7.4 Worked example

Buyout in **Energy**, no transition plan, sub-ratings supplied: environmental avg 4.5, social
3.0, governance 2.5, transition_risk 4.0, physical_risk 3.5. No hard-flag booleans set.

- **Dimension avgs:** 4.5, 3.0, 2.5, 4.0, 3.5.
- **Composite:** `(4.5+3.0+2.5+4.0+3.5)/5 = 17.5/5 = 3.5` → **HIGH** band (≤4).
- **Red flags:** Energy ∈ high-carbon AND no transition plan → soft `RF_NO_TRANSITION`;
  environmental avg 4.5 > 4.0 → soft `RF_HIGH_ENVIRONMENTAL`. No hard flags.
- **Sector context:** Energy row sums (5+3+3+5+4)=20 → overall `round(20/5)=4`.
- **Recommendation:** no hard flag, HIGH band + soft flags → **proceed_with_conditions**, with
  the transition-plan and env-DD conditions attached.

### 7.5 Data provenance & limitations

- The sector heatmap and red-flag rules are **expert-judgement constants**, not a live ESG
  data feed; there is no `sr()` PRNG.
- Unassessed sub-dimensions default to a **neutral 3.0**, so a lightly-screened deal lands
  mid-band rather than erroring — this can understate risk for genuinely un-diligenced deals.
- Composite scoring is equal-weighted across dimensions (no materiality weighting by sector).
- Persistence (`db/deals`, pipeline summary, sector heatmap) is via `pe_db_service.py`; the
  scoring engine itself is stateless.

**Framework alignment:** **ILPA ESG Data Convergence Initiative** — the five-dimension /
sub-dimension scorecard mirrors ILPA's standardised PE ESG metrics. **UN PRI** — the
red-flag + recommendation flow implements PRI's ESG-integration-in-due-diligence guidance.
**SFDR Art.7** — PAI consideration for PE/VC funds is reflected in the environmental/social
dimensions. **TCFD** — dedicated transition_risk and physical_risk dimensions apply TCFD's
risk taxonomy to unlisted assets. Hard exclusions (weapons, sanctions, UNGC) follow standard
responsible-investment exclusion policy.

## 9 · Future Evolution

### 9.1 Evolution A — Evidence-linked ESG screening and populated pipeline (analytics ladder: rung 2 → 3)

**What.** A PE/VC deal-pipeline and ESG-screening engine that scores each deal across five
ESG dimensions (environmental, social, governance, transition_risk, physical_risk — four
sub-dimensions each), detects hard/soft red flags, contextualises with a sector risk heatmap
(`SECTOR_ESG_RISK`), and issues proceed/conditions/reject. The composite is an equal-weighted
mean of dimension means, defaulting sub-dimensions to a neutral 3.0 when unassessed. The
scoring is caller-asserted ratings, the sector heatmap is static, and §4.2 shows the persisted
pipeline (`pe_deals`, `pe_sector_risk_heatmap`) is largely **db-empty** with `/db/deals/{id}`
tracing **failed**. Evolution A grounds the screen and activates persistence.

**How.** (1) Pre-populate ESG sub-dimension ratings from the platform's own signals where the
target is identifiable — GLEIF/entity resolution → GDELT controversy score, physical-risk grid
exposure, sector transition risk — so screening isn't purely manual, reporting an
`evidence_tier` per dimension. (2) Replace the equal-weight composite with sector-materiality
weighting (the SASB/heatmap data supports it) so governance vs physical risk matter
differently by sector. (3) Fix the DB persistence path so `/db/deals/{id}` returns `passed`
and the pipeline populates. (4) Bench-pin the composite and red-flag logic.

**Prerequisites.** Entity-resolution linkage for auto-signals; `pe_deals` write path repaired
(D1); sector-materiality weights. **Acceptance:** identifiable targets get auto-populated ESG
signals with an evidence tier; the composite is sector-weighted; `/db/deals/{id}` returns
`passed`; bench pin reproduces the composite and risk band.

### 9.2 Evolution B — Deal-screening copilot for investment teams (LLM tier 2)

**What.** A copilot that screens an inbound deal — "score this target, flag red flags, and
tell me if it's a proceed" (calling `/screen` and citing the five-dimension breakdown and
sector context), compares deals via `/compare`, and summarises the pipeline via
`/pipeline-summary` — each figure tool-sourced.

**How.** Multiple POST endpoints (`/screen`, `/compare`, `/pipeline-summary`,
`/db/screen-and-persist`) plus `/sub-dimensions` and `/sector-heatmap` reference data. The
five-dimension decomposition lets the copilot explain *why* a deal is HIGH risk and which
sub-dimension drives it; the red-flag list drives a diligence checklist. Stage updates
(`PATCH /db/deals/{id}/stage`) are the gated write action. Cross-links to `pe_portfolio` for
post-acquisition value creation. Strong node for a PE desk.

**Prerequisites.** Evolution A's persistence fix for pipeline-level answers; RBAC on the
mutating stage/persist endpoints. **Acceptance:** every dimension score, red flag, and
recommendation traces to a tool response; the copilot discloses when a rating is
neutral-defaulted (3.0) vs assessed; stage changes require confirmation and log to audit; it
refuses to assert investment merit beyond the ESG screen the engine computes.