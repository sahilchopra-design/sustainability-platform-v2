# Api::Scenario_Analysis
**Module ID:** `api::scenario_analysis` · **Route:** `/api/v1/scenarios` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/scenarios/dashboard` | `get_dashboard` | api/v1/routes/scenario_analysis.py |
| POST | `/api/v1/scenarios/build` | `build_scenario` | api/v1/routes/scenario_analysis.py |
| GET | `/api/v1/scenarios/list` | `list_all_scenarios` | api/v1/routes/scenario_analysis.py |
| GET | `/api/v1/scenarios/properties` | `get_available_properties` | api/v1/routes/scenario_analysis.py |
| GET | `/api/v1/scenarios/{scenario_id}` | `get_scenario_by_id` | api/v1/routes/scenario_analysis.py |
| POST | `/api/v1/scenarios/compare` | `compare_scenarios` | api/v1/routes/scenario_analysis.py |
| POST | `/api/v1/scenarios/batch-create` | `batch_create_scenarios` | api/v1/routes/scenario_analysis.py |
| GET | `/api/v1/scenarios/templates/list` | `get_templates` | api/v1/routes/scenario_analysis.py |
| POST | `/api/v1/scenarios/templates/apply` | `apply_template` | api/v1/routes/scenario_analysis.py |

### 2.3 Engine `scenario_analysis_engine` (services/scenario_analysis_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `get_sample_properties` |  | Sample properties for scenario analysis. |
| `_get_db_engine` |  | Get or create database engine. |
| `save_scenario` | scenario_id, scenario_data | Save scenario to PostgreSQL. |
| `get_scenario` | scenario_id | Get scenario from PostgreSQL. |
| `list_scenarios` |  | List all scenarios from PostgreSQL. |
| `delete_scenario` | scenario_id | Delete scenario from PostgreSQL. |
| `calculate_value_direct_cap` | noi, cap_rate | Calculate property value using direct capitalization. |
| `calculate_noi` | gross_floor_area, rent_psf, vacancy_rate, expense_ratio | Calculate Net Operating Income. |
| `calculate_dcf_value` | noi, rent_growth, discount_rate, exit_cap, holding_years | Calculate DCF value and IRR. Returns (NPV, IRR estimate) |
| `ScenarioBuilderEngine.get_property` | property_id | Get property by ID. |
| `ScenarioBuilderEngine.calculate_property_value` | property_data | Calculate comprehensive property valuation. |
| `ScenarioBuilderEngine.apply_modification` | property_data, mod | Apply a single modification to property data. |
| `ScenarioBuilderEngine.build_scenario` | request | Build a custom scenario with modifications. |
| `ScenarioBuilderEngine.compare_scenarios` | base_property_id, scenario_ids, metrics | Compare multiple scenarios. |
| `SensitivityAnalysisEngine.analyze` | property_id, base_valuation, variables | Perform comprehensive sensitivity analysis. |
| `SensitivityAnalysisEngine._apply_variable_change` | property_data, var_name, value | Apply variable change to property data. |
| `SensitivityAnalysisEngine._generate_tornado_data` | sensitivities, base_value, variables | Generate tornado chart data. |
| `SensitivityAnalysisEngine._generate_spider_data` | property_data, variables | Generate spider chart data. |
| `WhatIfAnalysisEngine.analyze` | request | Perform what-if analysis. |
| `WhatIfAnalysisEngine._get_parameter_value` | prop, parameter | Get parameter value from property. |
| `WhatIfAnalysisEngine._set_parameter_value` | prop, parameter, value | Set parameter value in property. |
| `WhatIfAnalysisEngine._apply_cascading_effects` | prop, parameter, old_value, new_value | Apply cascading effects and return the impact. |
| `get_scenario_templates` |  | Get predefined scenario templates. |
| `InteractiveScenarioEngine.build_scenario` | request |  |
| `InteractiveScenarioEngine.compare_scenarios` | base_property_id, scenario_ids, metrics |  |
| `InteractiveScenarioEngine.analyze_sensitivity` | property_id, base_valuation, variables |  |
| `InteractiveScenarioEngine.what_if_analysis` | request |  |
| `InteractiveScenarioEngine.get_templates` |  |  |
| `InteractiveScenarioEngine.list_scenarios` |  |  |
| `get_ngfs_phase5_scenario` | scenario_name | Return NGFS Phase 5 parameters for a named scenario. |
| `get_ngfs_carbon_price` | scenario_name, year | Interpolate NGFS Phase 5 carbon price (USD/tCO2e) for a given year. |
| `list_ngfs_phase5_scenarios` |  | Return summary list of all 6 NGFS Phase 5 scenarios. |

**Engine `scenario_analysis_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SAMPLE_PROPERTY_UUIDS` | `{'office': '00000000-0000-0000-0000-000000000001', 'retail': '00000000-0000-0000-0000-000000000002', 'industrial': '00000000-0000-0000-0000-000000000003'}` |
| `NGFS_PHASE5_SCENARIOS` | `{'Net Zero 2050': {'description': 'Limits warming to 1.5°C with no or limited overshoot. Requires immediate, rapid decarbonisation.', 'temp_2100_c': 1.5, 'carbon_price': {2025: 65, 2030: 140, 2035: 220, 2040: 330, 2045: 440, 2050: 590}, 'gdp_loss_2050_pct': -0.5, 'orderly': True, 'physical_severity'` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `mock-sample`, `real-db`

**Database tables:** `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `highest`, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/scenarios/dashboard** — status `passed`, provenance ['real-db'], source tables: `scenarios`
Output: `{'type': 'object', 'keys': ['total_scenarios', 'total_analyses', 'recent_scenarios', 'most_impactful_variables', 'avg_value_swing_pct'], 'n_keys': 5}`

**GET /api/v1/scenarios/list** — status `passed`, provenance ['real-db'], source tables: `scenarios`
Output: `{'type': 'object', 'keys': ['items', 'total'], 'n_keys': 2}`

**GET /api/v1/scenarios/properties** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['properties'], 'n_keys': 1}`

**GET /api/v1/scenarios/templates/list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['templates', 'total'], 'n_keys': 2}`

**GET /api/v1/scenarios/{scenario_id}** — status `passed`, provenance ['real-db'], source tables: `scenarios`
Output: `{'type': 'object', 'keys': ['scenario_name', 'description', 'base_property_id', 'modifications', 'base_value', 'adjusted_value', 'value_change_pct', 'id', 'user_id', 'created_at'], 'n_keys': 10}`

**POST /api/v1/scenarios/batch-create** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/scenarios/build** — status `passed`, provenance ['real-db'], source tables: `scenarios`, `set`
Output: `{'type': 'object', 'keys': ['scenario_id', 'scenario_name', 'base_value', 'adjusted_value', 'value_change', 'value_change_pct', 'component_impacts', 'modifications_applied'], 'n_keys': 8}`

**POST /api/v1/scenarios/compare** — status `passed`, provenance ['db-empty'], source tables: `scenarios`
Output: `{'type': 'object', 'keys': ['comparison_table', 'best_scenario', 'worst_scenario', 'key_differentiators', 'base_value'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic

**Engine `scenario_analysis_engine` — extracted transformation lines:**
```python
pgi = Decimal(str(gross_floor_area)) * rent_psf
egi = pgi * (1 - vacancy_rate)
expenses = egi * expense_ratio
terminal_value = current_noi / float(exit_cap)
npv = sum(cf / ((1 + disc) ** (i + 1)) for i, cf in enumerate(cash_flows))
irr_estimate = disc + (growth * 0.5) + ((float(exit_cap) - disc) * 0.1)
impact = new_value - running_value
value_change = adjusted_value - base_value
worst_scenario = sorted_rows[-1].scenario_name
value_spread = max(r.value for r in comparison_rows) - min(r.value for r in comparison_rows)
step_size = (var.range.max - var.range.min) / (var.steps - 1)
current_value = var.range.min + (i * step_size)
change_from_base = new_value - base_valuation
swing = high_impact - low_impact
base_values = [v.base_value * 100 if v.base_value < 1 else v.base_value for v in variables]
new_value = old_value + change.change_value
new_value = old_value * (1 + change.change_value)
direct_impact = temp_value - base_value - cascading_impact
total_impact=direct_impact + cascading_impact,
total_change = final_value - base_value
vacancy_change = new_value - old_value
expense_change = new_value - old_value
rent_change_pct = (new_value - old_value) / old_value if old_value > 0 else 0
t = (year - y0) / (y1 - y0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/scenario_analysis_engine.py` (`InteractiveScenarioEngine`, composing
`ScenarioBuilderEngine`, `SensitivityAnalysisEngine`, `WhatIfAnalysisEngine`) is a real-estate
what-if laboratory: it values a property two ways, lets callers mutate assumptions
(scenarios, sensitivities, cascading what-ifs) and re-values after each mutation. Routes in
`api/v1/routes/scenario_analysis.py`: `POST /scenarios/build`, `/compare`, `/batch-create`;
`GET /scenarios/list`, `/{id}`, `/dashboard`, `/properties`, `/templates/list`.

```
NOI              = GFA × rent_psf × (1 − vacancy) × (1 − expense_ratio)
Direct cap value = NOI / cap_rate
DCF value        = Σ_{t=1..10} NOI×(1+g)^t/(1+r)^t + [NOI×(1+g)^10 / exit_cap]/(1+r)^10
Final value      = 0.6 × DCF + 0.4 × Direct cap
IRR (estimate)   = r + 0.5g + 0.1×(exit_cap − r)          # explicit approximation, not a solver
```

A late addition (2026-03-08) appends the **NGFS Phase 5 scenario block** (6 scenarios with
carbon-price paths, GDP loss and 2100 temperatures, linearly interpolated by
`get_ngfs_carbon_price`) consumed by the climate-transition-risk engine.

### 7.2 Parameterisation

**Sample properties** (fixed UUIDs `…0001/0002/0003` — deterministic synthetic fixtures):

| Property | GFA sf | NOI | Cap | Rent psf | Vac | Exp | g | r | Exit cap |
|---|---|---|---|---|---|---|---|---|---|
| Downtown Office Tower | 450,000 | $23.94M | 5.5% | $65 | 5% | 35% | 2.5% | 8.0% | 6.0% |
| Suburban Retail Center | 125,000 | $4.86M | 6.5% | $42 | 8% | 28% | 2.0% | 9.0% | 7.0% |
| Industrial Distribution Hub | 800,000 | $14.48M | 4.8% | $22 | 3% | 18% | 3.5% | 7.5% | 5.5% |

**Modification effects** (`apply_modification`): rate/ratio changes replace the parameter and
re-derive NOI where relevant; qualitative levers use fixed multipliers — certification: cap
rate ×0.98; retrofit: expenses ×0.95 and cap ×0.99; climate high_risk: cap ×1.05, low_risk:
cap ×0.98. **Cascading what-if effects**: expense ratio +>5pp → vacancy ×1.02; rent +>10% →
vacancy ×1.05; vacancy increases add a token collection-loss impact (×0.3 of the change).
**Five scenario templates**: Optimistic Growth, Recession Stress (vac 12%, cap 7.5%, exp 40%),
Green Building Upgrade, Rising Interest Rates, Value-Add Repositioning. **NGFS Phase 5** carbon
prices e.g. Net Zero 2050: $65→$590/t (2025→2050), Delayed Transition: $30→$640 with the
post-2030 shock, Current Policies: $20→$80; GDP-loss anchors −0.5% to −4.2% by 2050 (source
comment: NGFS Scenarios Portal).

### 7.3 Calculation walkthrough

`build_scenario` values the base property, then applies each modification **incrementally**,
re-valuing after every step so `component_impacts` attributes the marginal value change (and %)
to each lever in order — a waterfall decomposition (order-dependent by construction). Results
persist via `save_scenario` to PostgreSQL (`DATABASE_URL`, NullPool) with an in-memory
fallback; `compare_scenarios` re-loads stored scenarios, prepends the base case, and reports
best/worst plus differentiators (value spread $M, cap-rate range). `analyze_sensitivity` sweeps
each variable over `steps` equal increments of its range, re-valuing at each point, then builds
**tornado data** (low/high % impact and |swing| per variable, sorted by swing) and **spider
data** (optimistic = favourable range end per variable — min for cap/vacancy/expense/discount
rates, max otherwise; pessimistic mirrored). `what_if_analysis` applies absolute or percentage
changes with optional cascading effects and splits each change into direct vs cascading impact.

### 7.4 Worked example — office tower, recession cap-rate shock

Base (Downtown Office Tower): NOI $23.94M, cap 5.5%, g 2.5%, r 8%, exit 6%, 10y.

| Step | Computation | Result |
|---|---|---|
| Direct cap | 23.94 / 0.055 | $435.27M |
| DCF annuity leg | 24.539/0.055 × (1 − (1.025/1.08)¹⁰) = 446.2 × 0.4070 | $181.6M |
| Terminal leg | 23.94×1.025¹⁰/0.06 = 510.7 → /1.08¹⁰ | $236.6M |
| DCF value | 181.6 + 236.6 | $418.2M |
| Final value | 0.6×418.2 + 0.4×435.3 | **$425.0M** |
| IRR estimate | 0.08 + 0.5×0.025 + 0.1×(0.06−0.08) | 9.05% |
| Mod: cap_rate → 7.5% | direct cap = 23.94/0.075 = 319.2; DCF unchanged | final = 0.6×418.2 + 0.4×319.2 = **$378.6M** |
| Component impact | 378.6 − 425.0 | **−$46.4M (−10.9%)** |

Only the direct-cap leg reacts to `cap_rate` (DCF uses discount and exit-cap), so the 40%
weight dampens cap-rate shocks — a deliberate consequence of the 60/40 blend.

### 7.5 Persistence, dashboard & templates

Scenarios round-trip through a `scenario_store` table (JSON payload keyed by UUID) with
graceful degradation to an in-process dict when Postgres is unreachable — results survive
restarts only when the DB is up. `/dashboard` and `/properties` expose the three sample
properties; `/templates/list` returns the five canned scenario definitions for one-click runs.

### 7.6 Data provenance & limitations

- **No PRNG** — the three properties are hard-coded synthetic demo fixtures (values chosen so
  NOI/cap ≈ the stated `current_value`); everything else is deterministic on caller inputs.
  `get_property` **silently falls back to the office tower** for any unknown property id — a
  demo convenience that would mask bad ids in production.
- The IRR is an explicit closed-form *estimate* (`r + 0.5g + 0.1×(exit−r)`) — the code comment
  concedes "Newton-Raphson would be more accurate"; it should not be quoted as a true IRR.
- The 60/40 DCF/direct-cap blend, the certification/retrofit/climate multipliers and the
  cascading-effect coefficients (×1.02, ×1.05, 0.3) are unsourced model calibrations.
- Component impacts are path-dependent (waterfall order matters); the direct vs cascading
  impact split in what-if is approximate because `cascading_impact` for vacancy is a token
  scalar, not a re-valued effect.
- NGFS Phase 5 parameters are transcribed point estimates of the published scenario set;
  interpolation is linear between 5-year nodes.

### 7.7 Framework alignment

- **Income-approach valuation (RICS Red Book / IVS 105, Appraisal Institute practice)** —
  direct capitalisation (NOI/cap) and 10-year DCF with terminal value at exit cap are the two
  canonical income methods; blending them is common appraisal practice, though weights are
  entity-specific judgement (here fixed 60/40).
- **Tornado / spider sensitivity convention** — one-variable-at-a-time sweeps ranked by swing,
  the standard corporate-finance sensitivity presentation.
- **NGFS Phase 5 (Nov 2024 vintage naming: Net Zero 2050, Below 2°C, Divergent/Delayed,
  NDCs, Current Policies)** — carbon-price and GDP-loss anchors follow the NGFS scenario
  portal's orderly/disorderly/hot-house taxonomy; downstream climate engines consume
  `get_ngfs_carbon_price` for transition-cost projections.
- **TCFD scenario analysis** — the build/compare/what-if pattern supplies the quantitative
  "resilience under different scenarios" evidence TCFD Strategy (c) expects for real assets.

## 9 · Future Evolution

### 9.1 Evolution A — Real IRR solver, live properties, and probabilistic scenarios (analytics ladder: rung 2 → 4)

**What.** `InteractiveScenarioEngine` is a real-estate what-if laboratory composing scenario,
sensitivity, and cascading what-if engines: it values a property (`Final = 0.6·DCF + 0.4·direct-cap`),
mutates assumptions, and re-values. It's genuinely scenario-capable, with an appended NGFS Phase 5
block (6 scenarios, carbon-price paths). Two honest defects: the IRR is an explicit approximation
(`irr = r + 0.5g + 0.1(exit_cap − r)  # not a solver`), and `/properties` traces **mock-sample** —
the available-properties list is seeded, not real portfolio data. Evolution A fixes both and adds
distribution outputs.

**How.** (1) Replace the IRR approximation with a real numpy/scipy IRR solver over the projected
cash flows — a valuation module reporting a formulaic IRR is indefensible when the DCF is right
there. (2) Wire `/properties` to real `portfolios_pg`/`assets_pg` real-estate holdings instead of
the mock sample. (3) Add a Monte Carlo mode: distribute the mutated assumptions (rent, vacancy,
cap-rate, exit) and return a value distribution with percentiles (rung 4), generalising the NGFS
block's scenario grid. (4) Reconcile the appended NGFS block with the platform's canonical NGFS
source. (5) Bench-pin NOI, DCF, and the new IRR.

**Prerequisites.** `portfolios_pg` real-estate holdings for `/properties`; canonical NGFS source
linkage. **Acceptance:** IRR comes from a solver and matches a hand-computed value; `/properties`
returns real portfolio assets (provenance no longer mock-sample); scenarios return value
distributions with percentiles; core valuations bench-pinned.

### 9.2 Evolution B — Interactive valuation what-if copilot (LLM tier 2)

**What.** A copilot that drives the lab conversationally — "value this property, then show me what
happens if rents fall 10% and the exit cap widens 50bps" — building scenarios via `/build`,
comparing via `/compare`, and narrating the value swing and most-impactful variables the dashboard
already surfaces.

**How.** Multiple endpoints (`/build`, `/compare`, `/batch-create`, `/dashboard`, `/list`,
`/{id}`, `/templates`) form a rich tool set; the sensitivity/cascading-what-if outputs let the
copilot explain which assumption drives value most. The template endpoints support "apply the
disorderly-transition template". What-ifs are the core interaction — each mutation re-runs the
engine statelessly. Node for a real-estate investment desk, cross-linking to `re_clvar` for the
climate overlay.

**Prerequisites.** Evolution A's IRR solver — a copilot quoting the approximated IRR as a return
figure would mislead; real `/properties` for grounding. **Acceptance:** every NOI, value, and IRR
figure traces to a tool response; the copilot labels IRR as solver-computed (post-Evolution-A) vs
approximate, and properties as real vs sample; it refuses to present a scenario value as a market
appraisal.