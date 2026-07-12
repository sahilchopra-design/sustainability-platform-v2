# Supervisory Scenario Runner
**Module ID:** `supervisory-scenario-runner` · **Route:** `/supervisory-scenario-runner` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BASELINE`, `Badge`, `Kpi`, `SCEN_COLOR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `lastIdx` | `years.length - 1;` |
| `abs` | `(val != null && baseVal != null) ? val - baseVal : null;` |
| `pct` | `(abs != null && baseVal) ? (abs / Math.abs(baseVal)) * 100 : null;` |
| `lastYear` | `extract?.years?.[extract.years.length - 1];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Supervisory Scenario Runner serves a **labeled, seeded extract of NGFS (Network for
Greening the Financial System) Phase 5 scenario paths** — carbon price, GDP impact,
CO₂ emissions, and primary-energy mix shares — across 6 scenarios × 4 regions × 6
five-year vintages (2025–2050), and computes a "stress delta" of every scenario
against the **Current Policies** (hot-house) baseline for a user-selected
region/variable.

The backend (`backend/api/v1/routes/ngfs_scenarios_extract.py`) is a pure read/filter
layer over a static JSON file (`backend/data/ngfs_phase5_extract.json`) — there is no
external API call and no computation server-side; every number the frontend renders
is looked up directly from that file. All arithmetic (the stress delta) happens
client-side in `SupervisoryScenarioRunnerPage.jsx`.

### 7.2 Data source and shape

`ngfs_phase5_extract.json._meta` states the provenance directly:
> "NGFS Phase 5, IIASA Scenario Explorer (`data.ene.iiasa.ac.at/ngfs`) ... Values
> approximate REMIND-MAgPIE 3.3-4.8 marker-model outputs ... EXTRACT FOR
> ILLUSTRATION — values are conservative approximations of published NGFS Phase 5
> paths, rounded and interpolated at 5-year steps. Refresh from
> data.ene.iiasa.ac.at/ngfs for production precision."

| Dimension | Values |
|---|---|
| Years | 2025, 2030, 2035, 2040, 2045, 2050 |
| Regions | World, EU, US, CN |
| Scenarios | Net Zero 2050 (1.4°C, Orderly) · Below 2°C (1.7°C, Orderly) · Delayed Transition (1.7°C, Disorderly) · Fragmented World (2.3°C, Too little too late) · NDCs (2.4°C, Hot house world) · Current Policies (2.9°C, Hot house world — baseline) |
| Variables | `carbon_price` (USD/tCO2), `gdp_impact_pct` (% deviation, negative=loss), `co2_emissions` (GtCO2/yr), `pe_fossil_share` / `pe_renewables_share` / `pe_nuclear_share` (% of primary energy) |

Each variable definition carries its own `ngfs_variable_path` (e.g. `Price|Carbon`)
and a `source` string, so provenance is traceable at the field level, not just the
file level.

### 7.3 Backend route mechanics

```python
@router.get("/scenarios")
def get_scenarios(scenario=None, region=None, variable=None):
    extract = _load_extract()          # @lru_cache(maxsize=1) — loaded once per process
    # validates scenario/region/variable ids against the extract's own id sets,
    # 404s on an unknown id, otherwise filters the nested data cube without
    # reshaping it, and returns {meta, years, scenarios, regions, variables, data}
```
`GET /variables` returns just the variable/scenario/region metadata (no data cube) —
used by the frontend only for populating dropdowns, though in practice the page
fetches `/scenarios` once and derives everything from that single payload.

### 7.4 Stress-delta calculation (frontend)

```js
const lastIdx = years.length - 1;                 // 2050
const baseVal = extract.data[BASELINE][region][variable][lastIdx];   // BASELINE = 'current_policies'
abs = val - baseVal;
pct = (abs / Math.abs(baseVal)) * 100;
```
For every non-baseline scenario, the delta is computed **only at the final vintage
(2050)** against Current Policies, for whichever region/variable the user has
selected — a simple, fully transparent point-in-time comparison, not a
scenario-consistent macro re-simulation.

### 7.5 Worked example — carbon price stress delta, World, 2050

From the extract's `data.net_zero_2050.World.carbon_price` and
`data.current_policies.World.carbon_price` series (both length-6, ending 2050):

| Scenario | 2050 carbon price (USD/tCO2) | Δ abs vs Current Policies | Δ % |
|---|---|---|---|
| Current Policies (baseline) | 15 | — | — |
| Net Zero 2050 | 630 | +615 | **+4,100%** |
| Below 2°C | 300 | +285 | +1,900% |
| Delayed Transition | 500 | +485 | +3,233% |
| Fragmented World | 210 | +195 | +1,300% |
| NDCs | 80 | +65 | +433% |

Hand-check for Net Zero 2050: `abs = 630 − 15 = 615`; `pct = 615 / |15| × 100 =
4,100%`. This large percentage is a direct artefact of the Current Policies
baseline's carbon price staying near-zero through 2050 (only $5→$15 across the whole
horizon) — the denominator is small, so even a modest absolute reading elsewhere
translates into a very large relative delta. This is exactly the intended
"supervisory stress" reading: orderly-transition carbon pricing diverges from a
frozen-policy world by more than 40× by mid-century.

A second worked example on `gdp_impact_pct` (World, 2050): Net Zero 2050 = −6.3%,
Current Policies = −13.9%. `abs = −6.3 − (−13.9) = +7.6`; `pct = 7.6 / |−13.9| × 100
= 54.7%`. Read correctly: Net Zero 2050 has a **smaller** GDP loss than Current
Policies by 2050 (−6.3% vs −13.9%), so the positive delta here means "less bad,"
not "more stress" — the sign convention flips depending on which variable is
selected, since `gdp_impact_pct` is already a negative-is-worse quantity. The page
does not relabel this per-variable, so a reader must know that a green Δ on GDP
impact means avoided damage, while a green (negative) Δ on carbon price would mean
a cheaper transition — worth noting as a UX/interpretation caveat rather than a
code bug.

### 7.6 Companion elements

- Per-scenario trajectory chart plots all 6 scenarios' full 2025–2050 path for the
  chosen region/variable (`LineChart`, Current Policies rendered as a thicker dashed
  reference line).
- Bar chart mirrors the delta table (`abs` value per scenario, horizontal layout).
- Footer literally states the extract's shape: "N scenarios × N regions × N
  variables from the seeded NGFS Phase 5 extract" — computed from
  `extract.scenarios.length` etc., not hard-coded.

### 7.7 Data provenance & limitations

- **Seeded, not live**: unlike the GLEIF/NESO/FRED/trade.gov proxies elsewhere in
  this batch, there is no upstream API call at all here — NGFS Phase 5 publishes
  its full scenario database only via the IIASA Scenario Explorer web UI/bulk
  download, not a public REST API, so this module ships a hand-extracted, rounded,
  5-year-stepped JSON snapshot instead of a live proxy.
  the extract JSON's own `_meta.disclaimer` says this explicitly and points to
  `data.ene.iiasa.ac.at/ngfs` for production-precision refresh.
- Only 4 regions and 6 variables are extracted out of NGFS's much larger variable
  set (hundreds of paths across dozens of regions) — this is a headline-variable
  subset, not the full REMIND-MAgPIE output.
- The stress delta is a **static end-year comparison**, not a path-integrated or
  NPV-style stress metric, and it does not risk-weight by scenario probability.
- If `data.ene.iiasa.ac.at/ngfs` is refreshed, note the file's disclaimer that
  current values are "conservative approximations ... rounded and interpolated" —
  production use should pull exact IIASA figures rather than trust the 5-year
  linear steps implied here.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Give supervisors/risk teams a fast, auditable read on how
far a disorderly or hot-house climate pathway diverges from an orderly one, across
the headline NGFS Phase 5 transition and physical-risk variables, without requiring
a live connection to IIASA's scenario database.

**8.2 Conceptual approach.** A static, versioned data extract (JSON) stands in for a
live NGFS feed; the backend is a thin filter/validation layer; all comparative
analytics (the stress delta) are computed client-side from the single payload
fetched once per page load.

**8.3 Mathematical specification.**
```
Δ_abs(scenario, region, variable) = X_scenario[region][variable][2050]
                                     − X_current_policies[region][variable][2050]
Δ_pct(scenario, region, variable) = Δ_abs / |X_current_policies[region][variable][2050]| × 100
```
No scenario-probability weighting, path integration, or discounting is applied —
this is a single-point, single-year contrast by design (documented in the UI as a
"stress delta @ {lastYear}").

| Parameter | Source |
|---|---|
| Scenario categories & warming outcomes (1.4°C–2.9°C) | NGFS Phase 5 official scenario framework (Orderly / Disorderly / Too little too late / Hot house world) |
| Marker model | REMIND-MAgPIE 3.3-4.8 (NGFS Phase 5 marker) |
| Damage function | Kotz, Levermann & Wenz (2024) — NGFS Phase 5 GDP-impact update combining transition + chronic physical effects |

**8.4 Data requirements.** None beyond the shipped JSON — no reference-data joins,
no live credentials. A production refresh would require pulling the IIASA Scenario
Explorer bulk CSV/API export and re-deriving the 5-year-step interpolation (or
switching to the extract's native annual resolution).

**8.5 Validation & benchmarking.** Every scenario/variable/region combination
carries its own `source` string traceable to "NGFS Phase 5, IIASA Scenario
Explorer"; spot-checking against published NGFS Phase 5 summary tables (e.g.
Current Policies carbon price staying in single digits through 2050, Net Zero 2050
carbon price reaching several hundred USD/tCO2 by mid-century) confirms the extract
is directionally and order-of-magnitude consistent with the public NGFS narrative.

**8.6 Limitations & model risk.** Treat this as an **illustrative, rounded**
extract, not a production NGFS feed — the file's own disclaimer says so. Because
the comparison is a single end-year point rather than a full-path stress test, it
can understate or overstate divergence for variables with non-monotonic trajectories
between 2025 and 2050 (the extract only samples 6 vintages, so intra-period swings
are invisible). GDP-impact deltas require sign-aware interpretation, which the UI
does not annotate per-variable.

## 9 · Future Evolution

### 9.1 Evolution A — Live IIASA refresh, full variable cube, and a path-integrated stress metric (analytics ladder: rung 2 → 3)

**What.** This module is honest and functional: it serves a labelled, seeded extract of NGFS Phase 5 scenario paths (carbon price, GDP impact, CO₂, primary-energy shares) across 6 scenarios × 4 regions × 6 vintages, computes a stress delta against the Current Policies baseline, and the backend is a clean read/filter layer over a static JSON whose `_meta` disclaimer states its provenance directly ("EXTRACT FOR ILLUSTRATION — conservative approximations of published NGFS Phase 5 paths, rounded and interpolated... refresh from data.ene.iiasa.ac.at/ngfs for production precision"). Its limits are exactly what that disclaimer says: it's a hand-extracted snapshot of headline variables (4 regions, 6 of NGFS's hundreds of variable paths), and the stress delta is a static end-year comparison, not path-integrated or probability-weighted. Evolution A upgrades it toward production precision.

**How.** (1) Build an ingestion path from the IIASA Scenario Explorer bulk download (NGFS publishes no public REST API, so a periodic bulk-refresh job replacing the hand-rounded JSON is the mechanism) with vintage stamps, so values are the actual REMIND-MAgPIE marker outputs rather than approximations. (2) Expand the variable cube beyond 6 headline variables and 4 regions toward the fuller NGFS set the ingestion makes available. (3) Replace the end-year stress delta with a path-integrated metric (cumulative deviation or NPV-style discounting over 2025–2050) and optionally probability-weight scenarios. (4) Keep the honest `_meta` provenance discipline the module already models.

**Prerequisites.** IIASA bulk-download parsing and a refresh cadence; the path-integrated metric needs a discounting convention. **Acceptance:** values match a named IIASA vintage rather than "conservative approximations"; the variable cube exceeds the current 6×4 subset; the stress metric integrates over the path, not just the end year.

### 9.2 Evolution B — NGFS scenario-navigation copilot (LLM tier 1)

**What.** A copilot for the supervisory/risk analyst: "what's the carbon-price path for the EU under Delayed Transition?", "how much larger is the GDP hit under Fragmented World versus Below 2°C at 2040?", "which scenario has the fastest fossil phase-out?" — answered directly from the seeded (or Evolution-A live) NGFS extract, narrating the scenario paths and the stress deltas the module computes.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/supervisory-scenario-runner/ask`, corpus = this Atlas record plus the `GET /variables` metadata and the extract's `_meta` provenance. Path questions read the data cube directly; comparison answers narrate the computed stress delta; the copilot carries the extract's own disclaimer forward (illustrative approximations pre-Evolution-A) so users know the precision level. Refusal for variables/regions outside the extracted cube.

**Prerequisites.** None hard — the data and read layer already exist and are honestly labelled; Evolution A lets the copilot drop the "approximation" caveat once values are IIASA-sourced. **Acceptance:** every path value cited matches the extract; scenario comparisons match the computed delta; a variable or region outside the cube returns "not in the extract," with a pointer to the IIASA source.