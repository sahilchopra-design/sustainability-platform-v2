# EGS Project Analytics
**Module ID:** `enhanced-geothermal-systems` · **Route:** `/enhanced-geothermal-systems` · **Tier:** B (frontend-computed) · **EP code:** EP-DV6 · **Sprint:** DV

## 1 · Overview
Enhanced Geothermal Systems analytics covering hot dry rock hydraulic stimulation, reservoir engineering, induced seismicity risk management, flow rate and temperature targets, DOE FORGE programme results and LCOE pathway to $45/MWh by 2035.

> **Business value:** EGS targets ≥10 kg/s flow rates and ≥175°C reservoir temperatures to reach $45/MWh LCOE by 2035; DOE FORGE is demonstrating feasibility at Utah with induced seismicity managed below ML 2.0 thresholds.

**How an analyst works this module:**
- Characterise reservoir using temperature gradient, permeability and stress field data
- Design hydraulic stimulation programme with induced seismicity monitoring protocol
- Model flow rate and temperature uncertainty across P10/P50/P90 scenarios
- Project LCOE reduction pathway using learning-curve model toward $45/MWh target

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EGS_PROJECTS`, `GEOVIVSION_SCENARIOS`, `KpiCard`, `STIMULATION_TECHNIQUES`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EGS_PROJECTS` | 9 | `location`, `mw`, `depth`, `temp`, `stage`, `capex`, `tech`, `partner` |
| `STIMULATION_TECHNIQUES` | 6 | `cost`, `risk`, `effectiveness`, `seismicRisk`, `suitable` |
| `GEOVIVSION_SCENARIOS` | 5 | `costReduction`, `lcoe2050`, `capacity`, `investment` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `wellCost` | `depthKm * wellCostPerKm * 1e6 * 2; // injection + production` |
| `totalDrill` | `numWellPairs * wellCost;` |
| `totalStim` | `numWellPairs * stimCostPerWell * 1e6;` |
| `surfacePlant` | `powerMw * 1.8e6; // $1.8M/MW ORC plant` |
| `totalCapex` | `totalDrill + totalStim + surfacePlant;` |
| `annMwh` | `powerMw * cf / 100 * 8760;` |
| `capexAnn` | `totalCapex * w / (1 - Math.pow(1 + w, -lifetime));` |
| `opexAnn` | `opexMwyr * powerMw * 1000;` |
| `revMyr` | `annMwh * ppa / 1e6;` |
| `egsIrr` | `useMemo(() => irr([-totalCapex / 1e6, ...Array(lifetime).fill(revMyr - opex * powerMw * 1000 / 1e6)]) * 100, [totalCapex, revMyr, opex, powerMw, lifetime]);` |
| `drillCost` | `wellPairs * depth * wellCostKm * 2;` |
| `stimTotalCost` | `wellPairs * stimCost;` |
| `plantCost` | `powerMw * 1.8;` |
| `wellCostByCurve` | `useMemo(() => { return Array.from({ length: 15 }, (_, i) => { const d = 1 + i * 0.5;` |
| `flowRiskData` | `useMemo(() => Array.from({ length: 20 }, (_, i) => { const flowVar = flowRate * (0.5 + sr(i * 7) * 0.8);` |
| `tempVar` | `temp * (0.92 + sr(i * 13) * 0.16);` |
| `powerOut` | `flowVar * 4.2 * (tempVar - 70) / 3600 * 0.1;` |
| `learningCurve` | `useMemo(() => Array.from({ length: 15 }, (_, i) => { const nProjects = (i + 1) * 3;` |
| `reduction` | `Math.pow(nProjects / 3, -Math.log2(1 / 0.85));` |
| `scenarios2050` | `useMemo(() => GEOVIVSION_SCENARIOS.map(s => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EGS_PROJECTS`, `GEOVIVSION_SCENARIOS`, `STIMULATION_TECHNIQUES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Flow Rate Target | `Flow Rate = Reservoir Permeability × ΔP / Fluid Viscosity` | DOE FORGE Results 2023 | Minimum commercial threshold; FORGE achieving 5–8 kg/s at Utah site as of 2023. |
| Temperature Target | `T_reservoir = Surface Temperature + Geothermal Gradient × Depth` | DOE EGS Targets | Minimum reservoir temperature for viable flash or binary power generation. |
| EGS LCOE Target | `Target = DOE EGS Shot Learning Curve Projection` | DOE Enhanced Geothermal Shot 2022 | Requires 90% reduction in stimulation and drilling costs from current $100–$200/MWh baseline. |
- **DOE FORGE field data + drilling cost benchmarks** → LCOE learning-curve model → induced seismicity risk dashboard → **EGS project analytics platform**

## 5 · Intermediate Transformation Logic
**Methodology:** EGS LCOE Pathway
**Headline formula:** `LCOE_EGS(t) = Base_LCOE × (1 − LR)^(log₂(Cumulative_Wells(t)))`

Learning-curve LCOE projection targeting $45/MWh by 2035 through drilling cost reduction.

**Standards:** ['DOE — EGS Shot 2024', 'MIT — The Future of Geothermal Energy 2006']
**Reference documents:** DOE — Enhanced Geothermal Shot: A 2024 Liftoff Report; MIT Energy Initiative — The Future of Geothermal Energy (2006 + 2019 update); DOE FORGE — Frontier Observatory for Research in Geothermal Energy Results 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide (`LCOE_EGS(t) = Base_LCOE × (1−LR)^log₂(Cumulative_Wells)`, learning-curve pathway to
$45/MWh by 2035) is faithfully implemented, and the module goes further: it contains a genuine
**bottom-up EGS LCOE engine** (drilling + stimulation + surface plant capex, annuitised) plus a
Wright's-law learning curve and Newton-Raphson IRR. This is one of the more quantitatively sound
modules in the atlas; the only synthetic elements are the seeded project set and the flow-risk Monte
Carlo.

### 7.1 What the module computes

**Bottom-up LCOE** (`calcEgsLcoe`) — real capex build-up and capital-recovery annuity:
```js
wellCost     = depthKm × wellCostPerKm × 1e6 × 2       // injection + production well
totalDrill   = numWellPairs × wellCost
totalStim    = numWellPairs × stimCostPerWell × 1e6
surfacePlant = powerMw × 1.8e6                          // $1.8M/MW ORC plant
totalCapex   = totalDrill + totalStim + surfacePlant
annMwh       = powerMw × cf/100 × 8760
capexAnn     = totalCapex × w / (1 − (1+w)^(−lifetime)) // annuity, w = wacc/100
opexAnn      = opexMwyr × powerMw × 1000
LCOE ($/kWh) = (capexAnn + opexAnn) / annMwh
```

**Learning curve** (Wright's law, 15% learning rate):
```js
reduction = (nProjects/3)^(−log₂(1/0.85))              // exponent = −log₂(1/0.85) ≈ 0.234
lcoe_t    = lcoe × 1000 × reduction                    // $/MWh at cumulative deployment
```

**Flow-risk Monte Carlo** (20 paths): `power = flow × 4.2 × (temp−70)/3600 × 0.1` — a physically
motivated thermal-power proxy (4.2 kJ/kg·K water heat capacity, ΔT above 70 °C reinjection).

**IRR** via Newton-Raphson (200 iterations with analytic derivative).

### 7.2 Parameterisation / scoring rubric

| Parameter | Default | Provenance |
|---|---|---|
| Well cost per km | user slider | drilling-cost driver (DOE EGS Shot target) |
| Stimulation cost/well | user slider | hydraulic-stimulation capex |
| Surface plant | $1.8M/MW | ORC binary-plant cost (inline comment) |
| Water heat capacity | 4.2 kJ/kg·K | physical constant |
| Reinjection temp | 70 °C | thermal-cycle floor |
| Learning rate | 15% (0.85 factor) | consistent with DOE EGS Shot cost-down |
| LCOE target | $45/MWh by 2035 | DOE Enhanced Geothermal Shot |

`EGS_PROJECTS`, `STIMULATION_TECHNIQUES`, `GEOVISION_SCENARIOS` seed sets carry the project pipeline
and cost-reduction scenarios; project-level flow/temp variation is `sr()`-seeded around user inputs.

### 7.3 Calculation walkthrough

User sets depth, well-pairs, power, WACC, capacity factor, drilling/stim cost → `calcEgsLcoe` builds
total capex, annuitises it, and divides by annual generation → the learning curve projects LCOE down
as cumulative wells grow → the flow-risk MC shows the power-output distribution from flow/temperature
uncertainty → 2050 scenarios apply each GEOVISION cost-reduction to the base LCOE.

### 7.4 Worked example

A project: `depthKm = 4`, `wellCostPerKm = $5M/km`, `numWellPairs = 3`, `stimCostPerWell = $8M`,
`powerMw = 25`, `opexMwyr = $45k/MW·yr`, `wacc = 8%`, `lifetime = 30`, `cf = 90%`.
```
wellCost   = 4 × 5e6 × 2 = $40M/pair
totalDrill = 3 × 40e6 = $120M
totalStim  = 3 × 8e6  = $24M
surface    = 25 × 1.8e6 = $45M
totalCapex = 120 + 24 + 45 = $189M
annMwh     = 25 × 0.90 × 8760 = 197,100 MWh
w = 0.08 ; annuity = 0.08 / (1 − 1.08^−30) = 0.08 / 0.9006 = 0.0888
capexAnn   = 189e6 × 0.0888 = $16.79M/yr
opexAnn    = 45,000 × 25 = $1.125M/yr  (opexMwyr × powerMw × 1000)
LCOE = (16.79e6 + 1.125e6) / 197,100 MWh = $90.9/MWh
```
So a first-of-kind 25 MW EGS plant prices at ≈$91/MWh — roughly double the DOE 2035 target of $45/MWh.
The learning curve then shows how it converges: at 45 cumulative wells (15 projects × 3),
`reduction = (45/3)^−0.234 = 15^−0.234 = 0.53`, giving ≈$48/MWh — the module's core message that
drilling-cost learning is the path to the DOE target.

### 7.5 Companion analytics

- **Geological viability:** temperature-gradient/depth tables by basement region (UK Granite, etc.).
- **Induced-seismicity risk management:** stimulation-technique comparison (the EGS-specific hazard).
- **2050 GEOVISION scenarios:** cost-reduction pathways applied to the base LCOE.

### 7.6 Data provenance & limitations

- **The LCOE, learning-curve and IRR engines are genuine** and correctly specified; the surface-plant
  and thermal constants are physically grounded.
- **Project-level flow/temperature variation is synthetic**, seeded by `sr()`; the seed project set is
  editorial.
- The learning curve uses a single fixed 15% rate applied to a `nProjects/3` cumulative proxy, not
  actual global cumulative-capacity data.

**Framework alignment:** **DOE Enhanced Geothermal Shot (2024)** — the $45/MWh-by-2035 target and the
drilling-cost-reduction learning thesis; **MIT "The Future of Geothermal Energy" (2006)** — the EGS
hot-dry-rock resource and stimulation framing; **Wright's law / experience curves** — the (correctly
implemented) `(1−LR)^log₂(cumulative)` cost-decline model.

## 9 · Future Evolution

### 9.1 Evolution A — Server-side EGS engine with FORGE-anchored calibration (analytics ladder: rung 2 → 3)

**What.** §7 rates this "one of the more quantitatively sound modules in the atlas": a genuine bottom-up LCOE engine (per-well-pair drilling + stimulation + $1.8M/MW ORC plant, capital-recovery annuity), Wright's-law learning curve matching the guide's formula, and Newton-Raphson IRR — real interactive engineering economics, already rung 2 via its sliders and P10/P50/P90 framing. The synthetic parts: the 9-project `EGS_PROJECTS` set and the flow-risk "Monte Carlo" (20 `sr()`-seeded samples around slider values, not a distributional simulation). Evolution A ports the engine server-side and calibrates it against the DOE data it cites.

**How.** (1) `services/egs_economics_engine.py` porting the LCOE/IRR math verbatim, with `bench_quant` pins (a worked FORGE-like case: 2 well pairs, 3 km, 175°C). (2) Replace the seeded project set with the real, small universe — FORGE Utah, Fervo Cape Station, Eavor projects are publicly documented with depth/temperature/capacity — each row sourced. (3) Upgrade the flow-risk tab to an honest uncertainty model: proper Monte Carlo over flow-rate and temperature distributions parameterized from published FORGE results (5–8 kg/s achieved vs ≥10 target), reporting true P10/P50/P90 power output with the thermal-power formula already in code (`ṁ·cp·ΔT·η`). (4) Rung 3: calibrate the learning-curve base and rate against DOE EGS Shot liftoff-report cost trajectories; publish the fit alongside the $45/MWh target line.

**Prerequisites.** DOE/FORGE data extraction (reports, not APIs — one-time curation with citations); seeded flow-risk chart replaced, not decorated. **Acceptance:** bench pin reproduces the LCOE build-up by hand; the P50 power output for FORGE-published parameters is consistent with its reported range; every project row carries a public source.

### 9.2 Evolution B — Reservoir-economics copilot for developers and DOE-watchers (LLM tier 2)

**What.** A tool-calling copilot for the module's engineering-finance loop: "at what flow rate does a 3.5 km, 190°C doublet clear a $70/MWh PPA — and how much drilling cost-down does $45/MWh need?" It runs Evolution A's engine endpoints (LCOE at given parameters, IRR at given PPA, learning-curve solve-for-inputs), and explains results using the module's real physics chain — flow × heat capacity × ΔT → thermal power → net MWh — citing the DOE FORGE benchmarks from the reference corpus for context.

**How.** Tools: `compute_lcoe(params)`, `compute_irr(params, ppa)`, `solve_learning_gap(target_lcoe)`, `run_flow_uncertainty(params)`. Grounding corpus = this Atlas record's §7.1 formula block and the §4 threshold rows (≥10 kg/s, ≥175°C, $45/MWh with their DOE provenance). Inverse questions ("what drilling cost gets me to X?") are solver calls, not model arithmetic. Induced-seismicity questions answer from the stimulation-techniques reference data with its risk ratings, refusing site-specific seismic hazard claims the module doesn't compute.

**Prerequisites (hard).** Evolution A's engine port (no endpoints exist today) and the honest uncertainty model — a copilot quoting the current seeded "Monte Carlo" would present fabricated P-values for drilling decisions. **Acceptance:** golden solve-for cases reproduce from scripted calls; every $/MWh and kg/s figure traces to a tool response or a cited DOE benchmark; site-seismicity questions refuse with the module's scope statement.