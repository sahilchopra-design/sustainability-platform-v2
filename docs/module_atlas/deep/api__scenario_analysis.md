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
