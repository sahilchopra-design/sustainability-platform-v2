# Energy Transition Dashboard
**Module ID:** `energy-transition-dashboard` · **Route:** `/energy-transition-dashboard` · **Tier:** A (backend vertical) · **EP code:** EP-CU6 · **Sprint:** CU

## 1 · Overview
Executive KPIs, asset portfolio score, decarbonization pathway, supplier risk, and peer ranking.

**How an analyst works this module:**
- Executive KPIs shows 6 metrics with trends
- Decarbonization Pathway compares actual vs IEA NZE

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_SCORES`, `DECARB_PATHWAY`, `KPIs`, `PEERS`, `RADAR_DIMS`, `STATUS_COLORS`, `SUPPLIER_RISK`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSET_SCORES` | 12 | `score`, `count`, `contribution` |
| `DECARB_PATHWAY` | 9 | `actual`, `nze`, `target` |
| `PEERS` | 7 | `score`, `rank` |
| `RADAR_DIMS` | 7 | `DemoCo`, `PeerAvg` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `aggregateScore` | `useMemo(() => { const totalCount = ASSET_SCORES.reduce((s, a) => s + a.count, 0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/energy-transition/fleet-transition` | `fleet_transition` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/grid-ef-projection` | `grid_ef_projection` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/avoided-emissions` | `avoided_emissions` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/country-comparison` | `country_comparison` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/fuel-types` | `ref_fuel_types` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/nze-milestones` | `ref_nze_milestones` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/replacement-options` | `ref_replacement_options` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/grid-ef-countries` | `ref_grid_countries` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/grid-ef-scenarios` | `ref_grid_scenarios` | api/v1/routes/energy_transition.py |

### 2.3 Engine `generation_transition` (services/generation_transition.py)
| Function | Args | Purpose |
|---|---|---|
| `GenerationTransitionPlanner.plan_transition` | fleet_name, plants, target_year, replacement_tech, carbon_price_eur_t, base_year | Generate a fleet transition plan. |
| `GenerationTransitionPlanner._auto_replace` | fuel_type | Select replacement technology based on original fuel type. |
| `GenerationTransitionPlanner._interpolate_nze` | year, base_emissions, base_year | Interpolate NZE target emissions for a given year. |
| `GenerationTransitionPlanner.get_fuel_types` |  |  |
| `GenerationTransitionPlanner.get_nze_milestones` |  |  |
| `GenerationTransitionPlanner.get_replacement_options` |  |  |

**Engine `generation_transition` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `REPLACEMENT_PRIORITY` | `['solar_pv', 'wind_onshore', 'wind_offshore', 'battery', 'gas_ccgt', 'gas_ccgt_ccs', 'hydro', 'nuclear']` |

### 2.3 Engine `grid_ef_trajectory` (services/grid_ef_trajectory.py)
| Function | Args | Purpose |
|---|---|---|
| `GridEFTrajectoryEngine.project_grid_ef` | country, scenario, start_year, end_year | Project grid EF trajectory for a country under a scenario. |
| `GridEFTrajectoryEngine.avoided_emissions` | country, scenario, annual_generation_mwh, start_year, project_lifetime_years | Calculate avoided emissions for a renewable project. |
| `GridEFTrajectoryEngine.compare_countries` | countries, scenario | Compare grid EF trajectories across countries. |
| `GridEFTrajectoryEngine._interpolate_ef` | year, ef_base, scen, base_year | Interpolate grid EF for a given year using scenario target factors. |
| `GridEFTrajectoryEngine.get_countries` |  |  |
| `GridEFTrajectoryEngine.get_scenarios` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `renewable` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_SCORES`, `DECARB_PATHWAY`, `PEERS`, `RADAR_DIMS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio CI | — | Calculated | Output-weighted average across 30 assets |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/energy-transition/ref/fuel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coal_subcritical', 'coal_supercritical', 'coal_usc', 'gas_ocgt', 'gas_ccgt', 'gas_ccgt_ccs', 'oil', 'biomass', 'nuclear', 'wind_onshore', 'wind_offshore', 'solar_pv', 'hydro', 'battery'], 'n_keys': 14}`

**GET /api/v1/energy-transition/ref/grid-ef-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['DE', 'FR', 'NL', 'PL', 'ES', 'IT', 'GB', 'SE', 'US', 'CN', 'IN', 'JP', 'AU', 'BR', 'ZA', 'KR', 'CA', 'MX', 'ID', 'SA', 'AE', 'NG', 'EG', 'TH', 'VN'], 'n_keys': 25}`

**GET /api/v1/energy-transition/ref/grid-ef-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['current_policies', 'stated_policies', 'nze_2050', 'ngfs_orderly', 'ngfs_disorderly', 'ngfs_hot_house'], 'n_keys': 6}`

**GET /api/v1/energy-transition/ref/nze-milestones** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [2025, 2030, 2035, 2040, 2050], 'n_keys': 5}`

**GET /api/v1/energy-transition/ref/replacement-options** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': None}`

**POST /api/v1/energy-transition/avoided-emissions** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/energy-transition/country-comparison** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/energy-transition/fleet-transition** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Energy company KPI aggregation
**Headline formula:** `Portfolio_CI = Σ(asset_CI_i × output_i) / Σ(output_i)`

6 KPIs: Green Revenue Ratio, CapEx Alignment, Portfolio Carbon Intensity, Decom Gap, Supplier Score, ITR.

**Standards:** ['IEA NZE', 'SBTi']
**Reference documents:** IEA NZE; SBTi SDA

**Engine `generation_transition` — extracted transformation lines:**
```python
p.annual_generation_mwh = p.capacity_mw * 8760 * p.capacity_factor_pct / 100
years_available = target_year - base_year
retire_year = base_year + int((i + 1) * years_available / num_fossil) if num_fossil > 0 else base_year
age = retire_year - plant.commissioning_year
co2_avoided = plant.annual_generation_mwh * ef
remaining_life = max(0, plant.commissioning_year + expected_life - retire_year)
stranded_frac = remaining_life / expected_life if expected_life > 0 else 0
stranded_value = plant.book_value_eur * stranded_frac
rep_cap = plant.capacity_mw * multiplier
yr_emissions = current_emissions - cumulative_saved
frac = (year - y0) / (y1 - y0) if y1 > y0 else 0
ef_yr = ef0 + (ef1 - ef0) * frac
```

**Engine `grid_ef_trajectory` — extracted transformation lines:**
```python
reduction = (1 - ef_2050 / ef_base) * 100 if ef_base > 0 else 0
yr = start_year + i
avoided = annual_generation_mwh * ef
avg_ef = ef_sum / project_lifetime_years if project_lifetime_years > 0 else 0
frac = (year - base_year) / (2030 - base_year) if 2030 > base_year else 0
factor = 1 + (f_2030 - 1) * frac
frac = (year - 2030) / 20
factor = f_2030 + (f_2050 - f_2030) * frac
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **3** other module(s).
**Shared engines (edits propagate!):** `generation_transition` (used by 4 modules), `grid_ef_trajectory` (used by 4 modules)

| Connected module | Shared via |
|---|---|
| `energy-transition-credit-portal` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `energy-transition-analytics` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `energy-transition-lending` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |

## 7 · Methodology Deep Dive

This is an **executive rollup** dashboard aggregating the CU-sprint energy modules (asset registry,
segments, suppliers, revenue split, decommissioning). It matches its guide's intent (6 KPIs, portfolio
carbon-intensity aggregation, decarb pathway, peer ranking), but nearly all headline numbers are
**static, hand-authored KPI cards** rather than live computations from the sibling modules. The one
genuine calculation is the asset portfolio score. The named framework score — **Implied Temperature
Rise (2.2 °C)** — is displayed with no derivation in code; §8 specifies it.

### 7.1 What the module computes

The single live calculation is the count-weighted asset portfolio score:
```js
aggregateScore = round( Σ (score_i × count_i) / Σ count_i )
```
over 11 asset types (`ASSET_SCORES`), each with a transition `score` (0–100) and a `count`.

Everything else — the six executive KPIs, the decarb pathway series, supplier-risk breakdown, peer
ranking, and radar dimensions — is **stored data**, echoing values that originate in the sibling
CU modules (revenue-split 13.1% green revenue, decom $4.1B gap, supplier avg 51, ITR 2.2 °C).

### 7.2 Parameterisation / scoring rubric

Executive KPIs (static, hand-authored):

| KPI | Value | Target | Status | Source module |
|---|---|---|---|---|
| Green Revenue Ratio | 13.1% | 15% | amber | energy-revenue-split |
| CapEx Alignment | 41.6% | 50% (IEA NZE) | amber | energy-revenue-split |
| Portfolio Carbon Intensity | 285 tCO₂/GWh | <200 | red | energy-asset-registry |
| Decom Liability Gap | $4.1B | <$2B | red | energy-decommissioning-liability |
| Supplier Avg Score | 51/100 | >60 | amber | energy-supplier-network |
| Implied Temp Rise | 2.2 °C | <1.8 °C | red | (no computation) |

Asset scores (transition-readiness by type): Coal 18, Gas 52, Nuclear 75, Hydro 82, Wind 92, Solar 95,
Biomass 70, Refineries 28, LNG 45, Pipelines 35, Mines 15 — with `count` and a `contribution` (signed
weight to the portfolio score). Peer ranking: Equinor 72, Total 65, Shell 58, DemoCo 52, BP 48,
Eni 42 (realistic ordinal, editorial values).

### 7.3 Calculation walkthrough

Load static KPIs → compute `aggregateScore` from the count-weighted asset scores → render six tabs:
executive KPI grid (status-coloured), asset-portfolio-score bar (with signed contributions), decarb
pathway (actual vs NZE vs target intensity to 2050), supplier-risk categories, peer ranking, and a
board-report scaffold. The decarb pathway shows `actual` only through 2025 (nulls thereafter),
projecting NZE and company-target intensity to 2050.

### 7.4 Worked example

`aggregateScore` over the 11 asset types. Weighted sum = Σ score×count:
```
Coal 18×6=108, Gas 52×2=104, Nuclear 75×2=150, Hydro 82×2=164, Wind 92×4=368,
Solar 95×3=285, Biomass 70×2=140, Refineries 28×3=84, LNG 45×2=90,
Pipelines 35×3=105, Mines 15×2=30
Σ score×count = 1,628 ;  Σ count = 31
aggregateScore = round(1628 / 31) = round(52.5) = 53
```
A portfolio score of ≈53/100 reflects the drag from coal (6 plants at score 18) and mines/refineries
against the lift from wind/solar (7 assets at 92–95). The `contribution` column pre-attributes this:
coal −22, mines −18 vs wind +18, solar +15.

### 7.5 Companion analytics

- **Decarbonization pathway:** company carbon intensity (52.2 → 42.5 tCO₂/GWh actual 2020–2025) vs the
  IEA NZE pathway (to 0 by 2050) and an intermediate company target — the alignment gap widens post-2030.
- **Supplier risk:** 35% of suppliers below score 40, category HIGH/MEDIUM/LOW flags (echoes
  energy-supplier-network).
- **Peer ranking & radar:** DemoCo vs peer-average across 6 transition dimensions.
- **Board report:** a report scaffold, not generated content.

### 7.6 Data provenance & limitations

- **KPIs and most series are static editorial data** — they represent, but are not live-linked to,
  the sibling CU modules. The dashboard does not recompute them from source.
- Only `aggregateScore` is computed at runtime. The **ITR (2.2 °C) has no derivation** in code — it is
  a displayed figure.
- Peer values (Equinor 72, Shell 58…) are plausible-but-editorial.

**Framework alignment:** **IEA NZE 2050** — the decarb-pathway benchmark and the 50% green-capex bar;
**SBTi SDA (Sectoral Decarbonization Approach)** — the intended basis for the implied-temperature and
carbon-intensity convergence view. The **Implied Temperature Rise** metric (guide + KPI) maps a
portfolio's projected emissions pathway to the warming it implies if globally replicated — the method
specified in §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute the displayed Implied Temperature Rise (ITR) for the energy company from its emissions pathway
vs a science-based benchmark, so the "2.2 °C" KPI is derived, not asserted.

### 8.2 Conceptual approach
Adopt the **SBTi / TCFD Portfolio Alignment Team** temperature-rating method: cumulative over/under-shoot
of the company's projected emissions vs an aligned sectoral pathway is converted to a warming outcome
via a Transient Climate Response to Cumulative Emissions (TCRE) coefficient. Benchmarks: **SBTi
Temperature Scoring**, **MSCI Implied Temperature Rise**, **CDP-WWF Temperature Rating**.

### 8.3 Mathematical specification
```
Overshoot = Σ_{t=base}^{2050} (E_company,t − E_aligned,t)        // cumulative GtCO₂ gap
ITR = T_benchmark + TCRE × Overshoot
E_aligned,t = SDA sectoral pathway (power/O&G) anchored to 1.5°C or WB2°C
TCRE ≈ 0.45 °C per 1000 GtCO₂ (IPCC AR6 central)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Company emissions pathway | `E_company,t` | company targets + BAU projection |
| Aligned sectoral pathway | `E_aligned,t` | SBTi SDA / IEA NZE power & O&G |
| TCRE | `TCRE` | IPCC AR6 (~0.45 °C/1000 GtCO₂) |
| Benchmark temperature | `T_benchmark` | 1.5 °C or 2 °C anchor |

### 8.4 Data requirements
Company Scope 1+2(+3) emissions history and forward targets, production forecast, sector code, and the
SBTi/IEA aligned pathway. Sources: company disclosures, SBTi target database, IEA NZE (free). Platform
already holds NZE milestones and grid-EF pathways (energy-transition engines).

### 8.5 Validation & benchmarking plan
Reconcile the ITR against SBTi's published temperature score for the same company (if rated) and
against MSCI ITR for peers; the peer ordinal (Equinor < Shell < BP) should be reproduced. Sensitivity:
vary TCRE ±0.1 and confirm ITR shifts <0.3 °C.

### 8.6 Limitations & model risk
ITR is highly sensitive to the Scope-3 boundary and the chosen benchmark pathway; small pathway
changes swing the rating across the 1.5/2 °C thresholds. Conservative fallback: absent a validated
company pathway, default to the sector-average temperature score (worse of company/sector), never the
optimistic tail.

## 9 · Future Evolution

### 9.1 Evolution A — Executive KPIs computed from the sibling verticals, not authored tables (analytics ladder: rung 1 → 2)

**What.** The module is tier-A on paper — it shares the real `generation_transition` and `grid_ef_trajectory` engines (9 endpoints, ref data lineage-`passed`) — but the page renders authored seed tables: `ASSET_SCORES` (12 rows), `DECARB_PATHWAY` (9 hand-set actual-vs-NZE points), `PEERS` ranks, and a radar for "DemoCo," with exactly one computed value (the count-weighted `aggregateScore`). The executive dashboard is a mock over a genuine engine family. Evolution A computes each tile from its owning vertical.

**How.** (1) Portfolio CI and asset scores from `energy-asset-registry`'s real rows (its stated formula — output-weighted CI over the fleet — matches this page's §4 claim, so wire it rather than restate it). (2) Decarbonization pathway: actuals from the registry's emissions history, NZE line from `GET /ref/nze-milestones` + `_interpolate_nze` — the engine that already exists for exactly this chart. (3) Supplier risk tile from `energy-supplier-network`'s Evolution-A records; peer ranking from `energy-revenue-split`'s filings-based peer table (one peer dataset platform-wide, not three divergent editorial ones). (4) Rung 2: the dashboard gains a scenario toggle — NZE/APS/STEPS pathway comparison via `POST /grid-ef-projection` — making the "actual vs target" gap scenario-aware.

**Prerequisites.** The sibling modules' Evolutions A (registry, supplier network, revenue split) — this dashboard is pure downstream and should be sequenced last in the CU-family remediation. **Acceptance:** every KPI tile traces to a named sibling endpoint in a lineage sweep; deleting the five authored seed tables breaks nothing; the pathway chart's NZE line matches `ref/nze-milestones` interpolation.

### 9.2 Evolution B — Executive briefing copilot over live tiles (LLM tier 1)

**What.** An executive dashboard's LLM need is narrative: "summarize our transition position for the board — where are we vs NZE, what moved this quarter, what's the biggest supplier risk?" A tier-1 copilot answers from the dashboard-summary payload assembled in Evolution A, citing each figure's owning module ("portfolio CI 412 tCO₂/GWh, from the asset registry's output-weighted mean") and drafting the two-paragraph board note — explanation and composition only, no new computation.

**How.** Tier-1 RAG per the roadmap: this Atlas record plus the sibling modules' §5 formula summaries embedded as corpus (the copilot must explain *whose* methodology produced each tile); the live dashboard payload passed as structured context. Because every tile now has a provenance edge, the copilot's citations are checkable mechanically — the answer's module attributions must match the payload's source fields. Refusal path: forward-looking questions ("will we hit the 2030 target?") get the pathway-gap arithmetic and an honest "the module projects scenarios, it does not forecast compliance."

**Prerequisites (hard).** Evolution A — narrating the current authored tables would brief executives on a fictional company's fictional progress with real confidence. **Acceptance:** golden board-note draft cites every figure with its correct owning module; numbers match the payload exactly; the NZE-gap explanation reproduces the interpolation arithmetic.