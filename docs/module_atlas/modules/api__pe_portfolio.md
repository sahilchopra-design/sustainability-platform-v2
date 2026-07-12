# Api::Pe_Portfolio
**Module ID:** `api::pe_portfolio` · **Route:** `/api/v1/pe-portfolio` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pe-portfolio/monitor-company` | `monitor_company` | api/v1/routes/pe_portfolio.py |
| POST | `/api/v1/pe-portfolio/monitor-portfolio` | `monitor_portfolio` | api/v1/routes/pe_portfolio.py |
| POST | `/api/v1/pe-portfolio/value-creation-plan` | `value_creation_plan` | api/v1/routes/pe_portfolio.py |
| GET | `/api/v1/pe-portfolio/kpi-template` | `get_kpi_template` | api/v1/routes/pe_portfolio.py |
| GET | `/api/v1/pe-portfolio/sector-levers` | `get_sector_levers` | api/v1/routes/pe_portfolio.py |
| POST | `/api/v1/pe-portfolio/db/companies` | `db_create_company` | api/v1/routes/pe_portfolio.py |
| GET | `/api/v1/pe-portfolio/db/companies` | `db_list_companies` | api/v1/routes/pe_portfolio.py |
| PATCH | `/api/v1/pe-portfolio/db/companies/{company_id}` | `db_update_company` | api/v1/routes/pe_portfolio.py |
| POST | `/api/v1/pe-portfolio/db/companies/{company_id}/exit` | `db_record_exit` | api/v1/routes/pe_portfolio.py |
| GET | `/api/v1/pe-portfolio/db/summary` | `db_portfolio_summary` | api/v1/routes/pe_portfolio.py |

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

### 2.3 Engine `pe_portfolio_monitor` (services/pe_portfolio_monitor.py)
| Function | Args | Purpose |
|---|---|---|
| `PEPortfolioMonitor.monitor_company` | inp | Monitor a single portfolio company's ESG KPIs. |
| `PEPortfolioMonitor.monitor_portfolio` | fund_id, companies | Monitor all portfolio companies and produce summary. |
| `PEPortfolioMonitor.get_kpi_template` |  | Return KPI collection template for portfolio companies. |
| `PEPortfolioMonitor._traffic_light` | current, prior, target, direction | Determine traffic light for a single KPI. |
| `PEPortfolioMonitor._overall_traffic_light` | green, amber, red, total | Overall company traffic light from KPI distribution. |
| `PEPortfolioMonitor._aggregate_kpis` | companies | Weighted-average KPIs across portfolio (by ownership %). |

### 2.3 Engine `pe_value_creation` (services/pe_value_creation.py)
| Function | Args | Purpose |
|---|---|---|
| `PEValueCreationEngine.generate_plan` | company_id, company_name, sector, ebitda_eur, entry_multiple, current_esg_score, revenue_eur | Generate a value creation plan for a portfolio company. |
| `PEValueCreationEngine.get_sector_levers` | sector | Return available ESG levers for a sector. |
| `PEValueCreationEngine.get_available_sectors` |  | Return sectors with defined ESG lever sets. |
| `PEValueCreationEngine._generate_milestones` | levers | Generate implementation milestones from levers. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DB` *(shared)*, `__future__` *(shared)*, `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `for` *(shared)*, `pe_portfolio_companies`, `portfolio` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pe-portfolio/db/companies** — status `passed`, provenance ['db-empty'], source tables: `pe_portfolio_companies`
Output: `{'type': 'object', 'keys': ['count', 'companies'], 'n_keys': 2}`

**GET /api/v1/pe-portfolio/db/summary** — status `passed`, provenance ['real-db'], source tables: `pe_portfolio_companies`
Output: `{'type': 'object', 'keys': ['total_companies', 'active_count', 'exited_count', 'total_invested_eur', 'total_nav_eur', 'total_exit_proceeds_eur', 'avg_esg_score', 'avg_esg_entry_score', 'by_sector'], 'n_keys': 9}`

**GET /api/v1/pe-portfolio/kpi-template** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['kpis'], 'n_keys': 1}`

**GET /api/v1/pe-portfolio/sector-levers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'levers', 'available_sectors'], 'n_keys': 3}`

**POST /api/v1/pe-portfolio/db/companies** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PATCH /api/v1/pe-portfolio/db/companies/{company_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/pe-portfolio/db/companies/{company_id}/exit** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/pe-portfolio/monitor-company** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `pe_portfolio_monitor` — extracted transformation lines:**
```python
yoy = current_val - prior_val
yoy_pct = round((current_val - prior_val) / abs(prior_val) * 100, 2)
total_all = total_g + total_a + total_r
pct_g = round(total_g / total_all * 100, 1) if total_all > 0 else 0
pct_a = round(total_a / total_all * 100, 1) if total_all > 0 else 0
pct_r = round(total_r / total_all * 100, 1) if total_all > 0 else 0
red_pct = red / total * 100
green_pct = green / total * 100
result[kpi_id] = round(totals[kpi_id] / weights[kpi_id], 4)
```

**Engine `pe_value_creation` — extracted transformation lines:**
```python
capex_mid = (capex_low + capex_high) / 2
rev_base = revenue_eur if revenue_eur > 0 else ebitda_eur * 4  # rough estimate
sav_mid_eur = rev_base * (sav_low + sav_high) / 2 / 100
ebitda_mid_eur = ebitda_eur * (ebitda_low + ebitda_high) / 2 / 100
roi = sav_mid_eur / capex_mid if capex_mid > 0 else 0.0
esg_improvement = min(len(levers) * 3.0, 20.0)  # ~3 points per lever, capped at 20
multiple_expansion = round(esg_improvement * ESG_MULTIPLE_EXPANSION_BPS / 10000, 2)
exit_mult = entry_multiple + multiple_expansion
exit_ebitda = ebitda_eur + total_ebitda
exit_ev = exit_ebitda * exit_mult
entry_ev = ebitda_eur * entry_multiple
value_creation = exit_ev - entry_ev
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::pe_deals` | engine:pe_db_service |

## 7 · Methodology Deep Dive

The `pe_portfolio` domain (`/api/v1/pe-portfolio`) combines two engines: **portfolio-company
ESG KPI monitoring** (`pe_portfolio_monitor.py`) and **ESG value-creation planning**
(`pe_value_creation.py`), with `pe_db_service.py` for persistence. It tracks ILPA ESG KPIs
with traffic-light status and projects exit-value uplift from ESG improvement levers.

### 7.1 What the module computes

**Monitoring:** for each portfolio company, per-KPI YoY change, target attainment and a
green/amber/red traffic light, rolled up to a company and portfolio verdict. **Value
creation:** sector-specific ESG levers with cost/benefit, an implementation timeline, and a
projected exit multiple:

```
exit_multiple = entry_multiple + esg_improvement × 25bps/10000
exit_ev       = (ebitda + Σ ebitda_uplift) × exit_multiple
value_created = exit_ev − entry_ev
```

### 7.2 Parameterisation / scoring rubric

**ILPA KPIs** (`ILPA_KPIS`, 12 metrics) — each with a direction (higher/lower is better) and
ILPA id: Scope 1/2 emissions (GHG-1/2), total energy (E-1), renewable share (E-2), water
(W-1), waste (WS-1/2), board/workforce diversity (D-1/2), injuries/fatalities (S-1/2),
independent board (G-1).

**Traffic-light rules** (`_traffic_light`): with a target, lower-is-better → green ≤target,
amber ≤target·1.2, else red (mirror for higher-is-better with ·0.8); no target but a prior →
trend-based (improve → green, flat → amber, worse → red); neither → amber. **Company overall**
(`_overall_traffic_light`): red if red-share ≥40%, green if green-share ≥60%, else amber.

**Value-creation levers** (`SECTOR_LEVERS`) — per sector, each lever carries a capex range,
annual-savings %, EBITDA-uplift %, and implementation months. Example (Industrials, IND_1
Energy Efficiency Retrofit): capex €0.5-5M, savings 8-20%, EBITDA uplift 2-5%, 18 months.
**Multiple expansion** (`ESG_MULTIPLE_EXPANSION_BPS = 25`): 0.25× per 1.0 ESG-score point.

**Provenance:** ILPA KPI definitions are the real convergence-initiative metrics; lever
cost/benefit ranges are McKinsey/BCG-style expert estimates encoded as constants.

### 7.3 Calculation walkthrough

`monitor_company` loops the 12 ILPA KPIs, computes YoY (`current − prior`, %), on-target
checks by direction, and the traffic light per KPI; counts green/amber/red and derives the
company verdict. `monitor_portfolio` aggregates green/amber/red percentages, best/worst
performers (by green/red count), and ownership-weighted aggregate KPIs. `generate_plan` reads
sector levers, computes mid-point capex/savings/EBITDA per lever (`rev_base·(sav%)`,
`ebitda·(uplift%)`), sums them, builds milestones, then projects exit value from the
score-improvement multiple expansion.

### 7.4 Worked example

Industrials company, EBITDA €20M, entry multiple 8.0×, three sector levers (IND_1/2/3).

- **Lever IND_1 EBITDA uplift:** mid `(2+5)/2 = 3.5%` → `20M·0.035 = €0.70M`.
- Summing three levers' uplifts → say `total_ebitda_uplift = €1.4M`.
- **ESG improvement:** `min(3 levers · 3.0, 20) = 9.0` points.
- **Multiple expansion:** `9.0 · 25 / 10,000 = 0.0225×` → exit multiple `8.0225×`.
- **Exit EV:** `(20 + 1.4) · 8.0225 = 21.4 · 8.0225 = €171.7M`; entry EV `20·8 = €160M` →
  **value created ≈ €11.7M**.

Monitoring: if a company reports 8 green, 2 amber, 2 red of 12 KPIs → green-share `8/12 = 67%
≥ 60%` → **overall GREEN**.

### 7.5 Data provenance & limitations

- Lever cost/benefit ranges and the 25bps multiple-expansion constant are **expert
  estimates**, not company-specific — projections are indicative, not underwriting-grade.
- **No `sr()` PRNG** — all outputs are deterministic functions of supplied KPI values and
  lever definitions. Missing KPIs are simply skipped (not fabricated).
- `rev_base` falls back to `ebitda × 4` when revenue is absent, a rough proxy.
- The multiple-expansion link (ESG score → turns) is a linear heuristic, not an econometric
  estimate of ESG-multiple correlation.

**Framework alignment:** **ILPA ESG Data Convergence Initiative** — the 12 monitored KPIs are
ILPA's standardised metrics with their official metric ids. **UN PRI** — portfolio-company
engagement/monitoring and value-creation planning follow PRI's active-ownership guidance.
**SFDR Art.7** — PAI-relevant KPIs (emissions, diversity, safety) support PAI reporting for
unlisted assets. **GHG Protocol** — Scope 1/2 (and implied Scope 3) emissions tracking aligns
with the corporate standard.

## 9 · Future Evolution

### 9.1 Evolution A — Ground the value-creation model and populate KPI history (analytics ladder: rung 2 → 4)

**What.** Two engines: ESG KPI monitoring (`pe_portfolio_monitor.py`) tracks 12 ILPA KPIs with
YoY change and green/amber/red status rolled up to portfolio verdicts, and value-creation
planning (`pe_value_creation.py`) projects exit uplift via `exit_multiple = entry_multiple +
esg_improvement × 25bps/10000`, `value_created = exit_ev − entry_ev`. The value-creation model
has honest shortcuts flagged in §5 — `rev_base = ebitda × 4 # rough estimate`,
`esg_improvement = min(len(levers) × 3.0, 20.0) # ~3 points per lever`, and a fixed
`ESG_MULTIPLE_EXPANSION_BPS`. The KPI store (`pe_portfolio_companies`) is largely db-empty.
Evolution A calibrates the multiple-expansion link and populates history.

**How.** (1) Replace the `~3 points per lever` and fixed multiple-expansion-bps with a
calibration against observed ESG-to-multiple evidence (or clearly label as an assumption set
with a sensitivity range) — the exit-multiple uplift is the model's headline claim and needs
defensibility. (2) Drop the `ebitda × 4` revenue proxy in favour of supplied or sourced
revenue. (3) Add a KPI-trajectory forecast: project whether a company reaches its ESG targets
from its monitored history (rung 4), not just current YoY. (4) Populate `pe_portfolio_companies`
and bench-pin the value-creation arithmetic.

**Prerequisites.** An ESG-multiple calibration source (thin — may stay a documented assumption
with sensitivity); KPI history populated (D1). **Acceptance:** multiple expansion carries
calibration/assumption provenance with a sensitivity range; revenue no longer defaults to
`ebitda × 4` when data exists; KPI trajectories forecast target attainment; bench pins pass.

### 9.2 Evolution B — Portfolio-monitoring and value-creation copilot (LLM tier 2)

**What.** A copilot for deal teams: "how are my portfolio companies tracking on ILPA ESG KPIs?"
(calling `/monitor-portfolio` and citing the traffic-light roll-up), and "build a value-creation
plan for this company" (calling `/value-creation-plan` and narrating the levers, capex, ROI, and
projected exit multiple) — each figure tool-sourced.

**How.** Three POST endpoints plus reference GETs (`/kpi-template` with the 12 ILPA KPIs,
`/sector-levers`) and DB read endpoints (`/db/companies`, `/db/summary`). The ILPA KPI structure
and green/amber/red logic let the copilot explain exactly which metric is red and why; the
value-creation levers drive an actionable plan. What-ifs ("what if we add these two levers?")
re-run statelessly. Pairs with the `pe_deals` copilot across the deal lifecycle.

**Prerequisites.** Evolution A's calibration for credible exit-value narration — presenting the
`~3 points per lever` uplift as a hard projection would overstate; KPI population for portfolio
answers. **Acceptance:** every KPI, traffic-light, and value-creation figure traces to a tool
response; the copilot labels exit-multiple uplift as an assumption-based projection with its
sensitivity; it refuses to present `value_created` as a guaranteed return.