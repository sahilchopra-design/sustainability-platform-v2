# NGFS Scenarios
**Module ID:** `ngfs-scenarios` · **Route:** `/ngfs-scenarios` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides an interactive exploration and application tool for the full Network for Greening the Financial System scenario suite, covering macro-financial variables, carbon price paths, and physical risk indicators across all six scenarios.

> **Business value:** Delivers a comprehensive NGFS scenario workbench enabling financial institutions to explore, compare, and apply all six canonical climate scenarios to portfolio risk and regulatory stress testing workflows.

**How an analyst works this module:**
- Load NGFS Phase IV scenario variable sets: GDP loss, carbon price, energy prices, physical risk indicators
- Enable scenario comparison across up to 3 simultaneous scenarios for selected macro variables
- Apply scenario paths to portfolio sector exposures to produce transition and physical loss estimates
- Support regulatory disclosure: compute scenario-conditional VaR and expected shortfall

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CAT_COLORS`, `MiniBar`, `Stat`, `TABS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `Tab6`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `chartData` | `NGFS_PHASE4.map(s => ({` |
| `years` | `CARBON_PRICE_PATHS.map(r => r.year);` |
| `sorted` | `[...SECTOR_PD_UPLIFT].sort((a, b) => (b[activeSid] \|\| 0) - (a[activeSid] \|\| 0));` |
| `maxUplift` | `Math.max(...SECTOR_PD_UPLIFT.map(r => r[activeSid] \|\| 0));` |
| `avgUplift` | `Math.round(SECTOR_PD_UPLIFT.reduce((a, r) => a + (r[activeSid] \|\| 0), 0) / SECTOR_PD_UPLIFT.length);` |
| `spreadData` | `NGFS_PHASE4.map(s => ({ name: s.name.replace('Net Zero 2050', 'NZ2050').replace('Low Energy Demand', 'LED').replace('Below 2°C', 'B2C').replace('Delayed Transition', 'Delayed').replace('Divergent Net Zero', 'Div NZ').rep` |
| `vals` | `selScens.map(s => Math.abs(s[key]));` |
| `coverageData` | `frameworks.map(f => ({ name: f.name.split(' ').slice(0, 2).join(' '), count: f.ngfsCount }));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/ngfs-scenarios` | `list_scenarios` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/phases` | `get_phases` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/temperature-ranges` | `get_temperature_ranges` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/filter` | `filter_scenarios` | api/v1/routes/ngfs_v2.py |
| POST | `/api/v1/ngfs-scenarios/search` | `search_scenarios` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/{scenario_id}` | `get_scenario` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/{scenario_id}/parameters` | `get_parameters` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/{scenario_id}/time-series` | `get_time_series` | api/v1/routes/ngfs_v2.py |
| POST | `/api/v1/ngfs-scenarios/compare` | `compare_scenarios` | api/v1/routes/ngfs_v2.py |
| POST | `/api/v1/ngfs-scenarios/seed` | `seed_scenarios` | api/v1/routes/ngfs_v2.py |

### 2.3 Engine `ngfs_seeder` (services/ngfs_seeder.py)
| Function | Args | Purpose |
|---|---|---|
| `seed_ngfs_scenarios` | db | Seed all 24 NGFS scenarios with parameters and time series. |

**Engine `ngfs_seeder` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SCENARIOS` | `[{'name': 'Orderly (Below 2°C)', 'slug': 'orderly-below-2c', 'phase': 1, 'phase_year': 2020, 'category': 'Orderly', 'temperature_target': 1.5, 'temperature_by_2100': 1.5, 'carbon_neutral_year': 2050, 'description': 'Immediate, ambitious climate action with smooth transition to a low-carbon economy.'` |
| `PARAMETER_DEFS` | `[{'name': 'carbon_price', 'display': 'Carbon Price', 'unit': 'USD/tCO2', 'category': 'pricing', 'min': 0, 'max': 700, 'step': 5}, {'name': 'emissions', 'display': 'CO2 Emissions', 'unit': 'Gt CO2/yr', 'category': 'emissions', 'min': -10, 'max': 50, 'step': 1}, {'name': 'temperature', 'display': 'Glo` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NGFS Scenarios | — | NGFS 2023 | Current canonical set: Net Zero 2050, Below 2°C, Delayed Transition, Divergent Net Zero, Nationally Determined Contributions, Current Policies. |
| Carbon Price Range (2030, across scenarios) | — | NGFS Phase IV 2023 | Span of modelled carbon prices across NGFS scenarios by 2030, illustrating the width of policy ambition uncertainty. |
- **NGFS scenario data portal via IIASA, REMIND and MESSAGEix IAM outputs** → Variable path ingestion, scenario comparison computation, portfolio loss estimation → **Interactive scenario explorer, sector loss tables, regulatory stress test outputs**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ngfs-extract/scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['meta', 'years', 'scenarios', 'regions', 'variables', 'data'], 'n_keys': 6}`

**GET /api/v1/ngfs-extract/variables** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['meta', 'variables', 'years', 'scenario_ids', 'region_ids'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario Divergence Index
**Headline formula:** `SDI = Σ |Variableₜ(ScenarioA) – Variableₜ(ScenarioB)| / Baselineₜ`

Measures cumulative deviation between scenario pairs across key macro variables (GDP, carbon price, energy demand), quantifying scenario uncertainty span.

**Standards:** ['NGFS Phase IV Technical Documentation 2023']
**Reference documents:** NGFS Climate Scenarios Phase IV Technical Documentation 2023; NGFS Scenarios Database (available via IIASA); FSB Supervisory Practices Report on Climate Risk 2022

**Engine `ngfs_seeder` — extracted transformation lines:**
```python
frac = (year - prev_y) / (next_y - prev_y)
val = ts_data[str(prev_y)] + frac * (ts_data[str(next_y)] - ts_data[str(prev_y)])
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **52** other module(s).

| Connected module | Shared via |
|---|---|
| `carbon-market-intelligence` | table:sqlalchemy |
| `reference-data-explorer` | table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:sqlalchemy |
| `supply-chain-esg-hub` | table:sqlalchemy |
| `geothermal-market-intelligence` | table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:sqlalchemy |
| `supply-chain-resilience` | table:sqlalchemy |
| `carbon-footprint-intelligence` | table:sqlalchemy |
| `carbon-reduction-projects` | table:sqlalchemy |
| `climate-underwriting-workbench` | table:sqlalchemy |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** The MODULE_GUIDES entry headlines a **Scenario Divergence Index**
> (`SDI = Σ|Variableₜ(A) − Variableₜ(B)| / Baselineₜ`). The page's Scenario Comparison tab does
> compute a cross-scenario **spread** per variable (`vals = selScens.map(s => |s[key]|)` → range),
> but not the normalised pairwise-difference SDI as written. It also promises "scenario-conditional
> VaR and expected shortfall" — no VaR/ES is computed. Otherwise the module is unusually
> well-grounded: it is a NGFS Phase IV **scenario workbench** built on curated (not `sr()`-random)
> scenario, carbon-price, and sector-PD data, plus **real OWID/IEA/EDGAR country-emissions** data.

### 7.1 What the module computes

The frontend is largely a *display* over three curated data tables imported from
`climateRiskDataService.js`, with a few live reductions:

- **NGFS_PHASE4** — 6 canonical scenarios, each with `carbonPrice2030/2050`, `gdpImpact2030/2050`,
  `physicalRiskScore`/`transitionRiskScore` (0–10), `renewableShare2050`, `stranded2050`,
  `unemploymentPeak`, `propertyPriceDrop`, `sovereignSpreadBp`.
- **SECTOR_PD_UPLIFT** — 20 NACE sectors × 6 scenarios, PD uplift in **basis points** vs baseline.
- **CARBON_PRICE_PATHS** — 6 anchor years (2025–2050) × 6 scenarios, $/tCO₂.

Live computations on the page:
```js
// Sector PD Migration tab
sorted     = [...SECTOR_PD_UPLIFT].sort((a,b) => (b[activeSid]||0) − (a[activeSid]||0))
maxUplift  = max( SECTOR_PD_UPLIFT.map(r => r[activeSid]||0) )
avgUplift  = round( Σ (r[activeSid]||0) / SECTOR_PD_UPLIFT.length )        // mean sector PD uplift bp
// Scenario Comparison tab
selScens = NGFS_PHASE4.filter(s => selected.includes(s.id))               // up to 3 scenarios
vals     = selScens.map(s => |s[key]|)                                     // spread for the chosen variable
```
The physical-risk composite (in the shared service, used by companion country views) is:
```js
raw = Σ_hazard ( EAL_hazard × PHYSICAL_MULTIPLIER[hazard][ssp] ) / 6
score = min(10, raw × 100 × (100 − adaptCapacity)/100 × 1.8)
```

### 7.2 Parameterisation / data provenance

| Table | Values | Provenance |
|---|---|---|
| Country CO₂ 2022 | 37,500 MtCO₂ world, top-10 emitters, per-capita 4.7 t | **Real** — OWID / IEA / EDGAR 2022 (`countryEmissions.js`, CC BY 4.0) |
| NGFS_PHASE4 carbon price 2030 | NZ2050 $190, B2C $95, DNZ $230, DT $30, NDC $20, CP $10 | Curated to NGFS Phase IV ranges |
| NGFS_PHASE4 GDP 2050 | −1.2% … −4.8% | Curated to NGFS-plausible magnitudes |
| SECTOR_PD_UPLIFT | Coal 850bp (NZ) → 1100bp (DT); Renewables −80bp (NZ) | Curated stylised uplifts (bp) |
| PHYSICAL_MULTIPLIERS | flood 1.0→2.4, wildfire 1.0→3.5, heatwave 1.0→4.2 across SSP1-2.6→SSP5-8.5 | Curated SSP scalars |
| adaptCapacity, ndGain | per-country 0–100 | ND-GAIN-style, curated |

The `SECTOR_PD_UPLIFT` ordering is economically coherent: fossil-extraction sectors carry the largest
transition PD uplift and it peaks under **Delayed Transition** (the disorderly scenario), while
Renewables show a *negative* uplift (credit improvement) under orderly scenarios — the correct sign.
Physical-heavy sectors (Agriculture, Real Estate, Water) flip to their worst uplift under **Current
Policies** (hot-house), reflecting physical-risk dominance. This is the same qualitative structure as
`climate-credit-integration`'s scenario ordering.

### 7.3 Backend seeder (`ngfs_seeder.py`)

The backend seeds **24 scenarios across NGFS Phases 1–4** into `NGFSScenario` /
`NGFSScenarioParameter` / `NGFSScenarioTimeSeries` (schema: `ngfs_v2`, route `api/v1/routes/ngfs_v2.py`).
Each scenario carries full time series (`carbon_price`, `emissions`, `temperature`, `gdp_impact`) on a
2025→2100 grid. Example — Phase 1 *Orderly (Below 2°C)*: carbon price 50→320 $/t, emissions 38→−3 Gt
(net-negative post-2050), temperature 1.2→1.5 °C, GDP impact −2.0% (2030 trough) → +3.0% (2100).
*Hot House World* runs carbon price flat at 5–15 $/t, emissions 42→36 Gt, temperature to 3.5 °C, GDP
to −8.0%. These are hand-curated to reproduce the published NGFS phase archetypes, not modelled IAM
output. The frontend, however, consumes the JS `NGFS_PHASE4` table, not this API, in the code read.

### 7.4 Worked example (Sector PD Migration, Delayed Transition)

Select scenario `dt`. For the sector table:
```
Mining & Coal   = 1100 bp   (largest)  → maxUplift = 1100
Oil & Gas       =  980 bp
Electricity     =  650 bp
Renewables      =  −40 bp   (credit improves even under DT)
...
avgUplift = round( (1100+980+650+720+680+580+420+780+540+310+620+480+290+220+90+80−40+120+350+280) / 20 )
          = round( 9750 / 20 ) = 488 bp
```
So under Delayed Transition the average sector sees ~+488 bp PD uplift, with coal extraction the
worst at +1,100 bp — a >10× dispersion across the loan book, which is the headline the tab surfaces.

Carbon price 2035, DNZ (Divergent Net Zero): `CARBON_PRICE_PATHS` row 2035 → dnz = $400/t; by 2050 it
reaches $800/t (the highest terminal price, because divergent policy forces the steepest catch-up).

### 7.5 Companion analytics & interconnections

- **Financial Stability tab** — plots `sovereignSpreadBp` (CP 160 bp vs NZ2050 15 bp) and
  `propertyPriceDrop` (CP −35% vs NZ −8%) per scenario, both curated fields.
- **Regulatory Alignment tab** — maps NGFS scenarios to disclosure frameworks (`frameworks[].ngfsCount`).
- The shared `climateRiskDataService` (NGFS_PHASE4, SECTOR_PD_UPLIFT, CARBON_PRICE_PATHS,
  SECTOR_LGD_UPLIFT, PHYSICAL_MULTIPLIERS, COUNTRY_PHYSICAL_RISK, SDA_PATHWAYS) is the same source
  feeding the platform's climate stress-test and physical-risk modules — this page is the canonical
  *explorer* over that layer.

### 7.6 Data provenance & limitations

- **Country emissions are real** (OWID/IEA/EDGAR 2022); the world total (37.5 GtCO₂), per-capita
  (4.7 t), and +65% since 1990 are correct published figures.
- **Scenario, sector-PD and carbon-price tables are curated** stylised values calibrated to NGFS
  Phase IV ranges — coherent and correctly ordered, but not the exact IIASA/REMIND/MESSAGEix numbers.
- The advertised **SDI** (normalised pairwise divergence) and **scenario-conditional VaR/ES** are not
  implemented; the comparison tab shows raw cross-scenario spreads only.
- Frontend reads the JS data tables, not the richer 24-scenario backend `ngfs_v2` API — the two are
  not yet wired together.

**Framework alignment:** *NGFS Climate Scenarios Phase IV (Nov 2023)* — the 6 canonical scenarios
(Net Zero 2050, Below 2 °C, Divergent Net Zero, Delayed Transition, NDC, Current Policies) with their
orderly/disorderly/hot-house taxonomy, carbon-price and GDP-impact structure. NGFS scenarios are
produced from three IAMs (REMIND-MAgPIE, MESSAGEix-GLOBIOM, GCAM) plus NiGEM macro and physical-risk
overlays; the module reproduces their *outputs*, not the IAM runs. *SSP framework* — physical
multipliers are indexed on SSP1-2.6→SSP5-8.5. *IFRS 9 / EBA stress-testing* — the sector PD-uplift
(bp) table is the input a bank would apply to baseline PDs, exactly the NGFS-scenario→ECL channel.

## 9 · Future Evolution

### 9.1 Evolution A — Implement true SDI and scenario-conditional VaR over the workbench (analytics ladder: rung 2 → 3)

**What.** §7 rates this an unusually well-grounded tier-A module: a real NGFS Phase IV workbench built on curated (not `sr()`) scenario, carbon-price, and 20-NACE-sector PD-uplift tables, plus real OWID/IEA/EDGAR country emissions, with 9 live backend endpoints (`/compare`, `/{id}/time-series`, `/filter`, etc.). Two documented gaps: the guide's Scenario Divergence Index (`SDI = Σ|Var(A)−Var(B)|/Baseline`) is only approximated as a per-variable spread, not the normalised pairwise difference; and the promised scenario-conditional VaR/expected shortfall is not computed at all.

**How.** (1) Implement SDI properly in `ngfs_v2.py`: normalised pairwise variable differences across the comparison set, returned by `/compare` so the workbench reports a single divergence metric per scenario pair rather than an unnormalised range. (2) Add the missing scenario-conditional VaR/ES: apply each scenario's `SECTOR_PD_UPLIFT` (already in bp per NACE sector) to a portfolio's sector exposures to produce a loss distribution, then VaR/ES — this reuses the sector-PD data the module already curates and connects it to `portfolios_pg`. (3) With 52 modules in blast radius consuming this workbench, expose these as versioned engine outputs so downstream modules inherit the calibration.

**Prerequisites.** Portfolio sector-mapping for the VaR path; regression pinning before any change given the 52-module blast radius (shared scenario data — edits propagate widely); the interpolation logic (`val = ts[prev] + frac·(ts[next]−ts[prev])`, §5) stays as-is. **Acceptance:** SDI matches the §5 normalised formula on a hand-computed scenario pair; scenario-conditional VaR responds to real portfolio sector exposure; downstream consumers see a version stamp.

### 9.2 Evolution B — NGFS scenario-application analyst (LLM tier 2, cross-module hub)

**What.** Given 52 modules depend on this workbench, it is a natural tier-2/tier-3 hub. The analyst answers "apply Disorderly to my energy book and give me scenario-conditional VaR", "compare carbon-price paths across all six scenarios at 2040", "which NACE sectors face the worst PD uplift under Delayed Transition" — executed against the 9 real endpoints (`/compare`, `/{id}/time-series`, `/{id}/parameters`, plus the Evolution-A VaR endpoint).

**How.** Tool schemas from the module's OpenAPI operations (mostly read-only GETs, already Pydantic-typed); system prompt from this Atlas page's §5/§7 and the NGFS Phase IV Technical Documentation named in §5. The analyst narrates real curated scenario data and computed VaR, never invented figures; because this workbench feeds 52 modules, its tool outputs are the grounding other desks' copilots should call (roadmap Tier-3 desk orchestration routes through it). Fabrication validator matches every carbon price, PD-uplift bp, and VaR figure to a tool response; provenance expander cites the NGFS scenario ID and vintage.

**Prerequisites.** Evolution A for the VaR/ES workflow; the compare/time-series GETs already function (lineage sweep shows the extract endpoints `passed`). **Acceptance:** every scenario figure traces to a named endpoint and NGFS vintage; asking for a non-NGFS scenario yields a refusal listing the six canonical scenarios; VaR answers cite the portfolio and scenario applied.