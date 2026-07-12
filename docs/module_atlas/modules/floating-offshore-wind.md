# Floating Offshore Wind LCOE & Technology Analytics
**Module ID:** `floating-offshore-wind` · **Route:** `/floating-offshore-wind` · **Tier:** B (frontend-computed) · **EP code:** EP-DR2 · **Sprint:** DR

## 1 · Overview
Comprehensive floating offshore wind (FOW) technology and economics analytics. Covers LCOE breakdown by floater concept (Spar-Buoy, Semi-submersible, TLP, Barge), mooring system design, EPCI cost modelling, learning curve trajectory, supply chain risks, CfD/PPA structuring for deep-water sites, and country-by-country policy comparison across 18 analytical tabs.

> **Business value:** Designed for offshore wind developers evaluating floating wind feasibility, infrastructure fund investment committees, and policy makers designing CfD auction parameters. Covers the full LCOE and technology assessment for a floating offshore wind project — from floater concept selection and mooring design through EPCI planning, CfD structuring, and supply chain risk — in a unified 18-tab analytical environment.

**How an analyst works this module:**
- Set site parameters in the left panel: water depth (50-2000m) and distance to shore; depth determines eligible floater concepts shown in "Floater Technology" tab
- Choose floater concept (Spar-Buoy/Semi-sub/TLP/Barge) in the left Floater panel; CAPEX components update in "LCOE Breakdown" waterfall chart
- Configure CAPEX stack in the left panel: turbine $/kW, floater structure, mooring, EPCI, grid cable; "LCOE Breakdown" tab shows the full waterfall from turbine to LCOE
- Open "Floater Technology" tab for Spar vs Semi-sub vs TLP vs Barge comparison across depth range, installation method, motion response, and LCOE premium; radar chart shows 6-dimension performance profile
- Navigate to "Mooring System" tab for catenary vs taut-leg vs semi-taut comparison: material, anchor type, length, cost $/m, and fatigue life vs depth curves
- Check "Installation & EPCI" tab for tow-out installation timeline, vessel requirements, and port infrastructure needs; "AEP vs Distance" shows LCOE sensitivity to distance-to-shore
- Open "Cost Trajectory" tab for the LCOE learning curve 2024-2040 and component cost breakdown by year; "Technology Maturity" tab shows TRL by component with key milestones
- Review "Supply Chain Risk" tab for lead times, concentration risk, and bottleneck identification; "Country Pipeline" compares FOW targets across Norway, UK, France, Japan, South Korea, Portugal, USA, Australia
- Navigate "Corporate PPA & CfD" for CfD contract structure, payment formula, and corporate PPA offtake potential; "Policy & CfD" shows AR5/EU/IRA incentive comparison by country
- Use "Scenario Analysis" for 4 LCOE scenarios (base/high wind/low CAPEX/policy support); "Project Finance" and "Investment Summary" for full project economics and recommendation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `FLOATER_CONCEPTS`, `KpiCard`, `MONTHS`, `SUPPLY_CHAIN`, `SectionHeader`, `SelectRow`, `SliderRow`, `TABS`, `TRL_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 9 | `installed`, `pipeline`, `target`, `policy`, `tariff`, `project` |
| `FLOATER_CONCEPTS` | 5 | `depthMin`, `depthMax`, `mooringLines`, `installation`, `motionResp`, `mainAccess`, `trl`, `lcoePremium`, `color` |
| `SUPPLY_CHAIN` | 9 | `leadTime`, `concentration`, `risk` |
| `TRL_DATA` | 9 | `trl`, `milestone`, `achievable` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annualAEP` | `capacityMW * 1000 * (cfPct / 100) * 8760;` |
| `totalCapex` | `capexPerKw * capacityMW * 1000;` |
| `npvOpex` | `Array.from({ length: life }, (_, i) => opexPerKwYr * capacityMW * 1000 / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);` |
| `npvAEP` | `Array.from({ length: life }, (_, i) => annualAEP / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);` |
| `npv` | `cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);` |
| `dnpv` | `cashFlows.reduce((acc, cf, t) => acc - t * cf / Math.pow(1 + rate, t + 1), 0);` |
| `newRate` | `rate - npv / dnpv;` |
| `rotorDiameter` | `useMemo(() => Math.round(Math.sqrt(turbineRating / 15) * 236), [turbineRating]);` |
| `capexPerKw` | `useMemo(() => { const base = capexFloater + capexMooring + capexTurbine + capexInstall + capexGrid;` |
| `distAdj` | `1 + (distanceShore - 80) * 0.0015;` |
| `depthAdj` | `1 + (waterDepth - 200) * 0.0005;` |
| `conceptAdj` | `floaterConcept === 'Spar-Buoy' ? 1.0 : floaterConcept === 'Semi-submersible' ? 1.05 : floaterConcept === 'Tension Leg Platform' ? 1.15 : 1.25;` |
| `cfPct` | `useMemo(() => { const base = 38 + (latitude - 50) * 0.4 + (hubHeight - 120) * 0.05 - seaState * 0.5;` |
| `lcoe` | `useMemo(() => calcLCOE(capexPerKw, opex, farmCapacity, cfPct, projectLife, discountRate / 100), [capexPerKw, opex, farmCapacity, cfPct, projectLife, discountRate]);` |
| `totalCapexM` | `useMemo(() => Math.round(capexPerKw * farmCapacity * 1000 / 1e6), [capexPerKw, farmCapacity]);` |
| `irrVal` | `useMemo(() => { const capexTotal = capexPerKw * farmCapacity * 1000;` |
| `annualRev` | `annualAEP * 1000 * (strikePrice / 1000);` |
| `annualOpexTotal` | `opex * farmCapacity * 1000;` |
| `npvM` | `useMemo(() => { const capexTotal = capexPerKw * farmCapacity * 1000;` |
| `npvRev` | `Array.from({ length: projectLife }, (_, i) => annualRev / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);` |
| `npvOp` | `Array.from({ length: projectLife }, (_, i) => annualOpexTotal / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);` |
| `costBreakdownData` | `useMemo(() => [ { name: 'Turbine', value: Math.round(capexTurbine * (1 + contingency / 100) * farmCapacity * 1000 / 1e6), color: T.indigo }, { name: 'Floater', value: Math.round(capexFloater * (1 + contingency / 100) * farmCapacity * 1000 / 1e6), color: T.teal }, { name: 'Mooring', value: Math.round(capexMooring * (1 + contingency / 100) ` |
| `waterfallData` | `useMemo(() => { const opexNpv = Array.from({ length: projectLife }, (_, i) => opex * farmCapacity * 1000 / Math.pow(1 + discountRate / 100, i + 1)).reduce((a, b) => a + b, 0);` |
| `scale` | `npvAEP > 0 ? 1000 / npvAEP : 0;` |
| `distanceSensData` | `useMemo(() => Array.from({ length: 20 }, (_, i) => { const d = 20 + i * 24;` |
| `adjCapex` | `capexPerKw + (d - distanceShore) * 3.5;` |
| `adjOpex` | `opex + (d - distanceShore) * 0.18;` |
| `monthlyAEP` | `useMemo(() => MONTHS.map((m, i) => {` |
| `seasonal` | `1 + Math.sin((i - 2) * Math.PI / 6) * 0.25;` |
| `val` | `annualAEP * 1000 / 12 * seasonal;` |
| `scenarioData` | `useMemo(() => { const scenarios = [ { name: 'Base Case', capexMult: 1.0, cfAdj: 0, label: 'Base' }, { name: 'High Wind / Low CAPEX', capexMult: 0.85, cfAdj: 4, label: 'Bull' }, { name: 'Low Wind / High CAPEX', capexMult: 1.20, cfAdj: -5, label: 'Bear' }, { name: 'Policy Support', capexMult: 0.92, cfAdj: 1, label: 'Policy' }, ];` |
| `adjCf` | `Math.max(25, cfPct + s.cfAdj);` |
| `scenLcoe` | `calcLCOE(adjCapex, opex, farmCapacity, adjCf, projectLife, discountRate / 100);` |
| `capexTotal` | `adjCapex * farmCapacity * 1000;` |
| `adjAEP` | `farmCapacity * (adjCf / 100) * 8760;` |
| `irr` | `calcIRR(cf) * 100;` |
| `breakeven` | `scenLcoe > 0 ? +scenLcoe.toFixed(0) : 0;` |
| `dscrProfile` | `useMemo(() => { const debtPct = (100 - equityPct) / 100;` |
| `debtAmt` | `totalCapexM * debtPct;` |
| `debtRate` | `(discountRate / 100) * 0.65;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `FLOATER_CONCEPTS`, `MONTHS`, `SUPPLY_CHAIN`, `TABS`, `TAB_RENDERERS`, `TRL_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOE (floating, 2024) | `CAPEX + NPV(OPEX) / NPV(AEP)` | Industry benchmarks 2024 | vs $60–90/MWh for fixed-bottom offshore; declining at 12–18%/yr as supply chain scales; target $60–80/MWh by 2035 per IEA Net Zero trajectory |
| CAPEX (floating) | `Turbine + floater + mooring + installation + grid` | WindEurope/NREL 2024 | Hywind Scotland: ~$5,500/kW (2017 pioneer); Kincardine: ~$4,200/kW; target <$3,000/kW by 2030 with supply chain maturation |
| Water Depth Range | `Spar: >80m; Semi-sub: 60–2,000m; TLP: 50–500m` | DNV floater selection guide | Fixed-bottom limited to ~60m; floating unlocks 80% of global offshore wind resource in waters >60m depth |
| Mooring Cost | `Chain/wire/polyester mooring × lines × depth` | Mooring supplier data | Catenary mooring: heavier but cheaper at moderate depth; taut-leg: smaller footprint, requires anchors; polyester rope reduces weight at depth >300m |
| EPCI Cost Share | `Tow-out (self-install!) vs crane-based` | Floating advantage | Key advantage of floating: turbines assembled at quayside, towed to site (no expensive offshore crane vessel); reduces EPCI vs fixed-bottom by avoiding complex offshore heavy lifts |
| CfD Strike (floating) | `UK AR5 2024 allocation round` | DESNZ 2024 | UK Allocation Round 5 (2024): floating offshore wind strike price ~£225/MWh; France (Bretagne): €200–225/MWh; EU Innovation Fund support available for first movers |
- **Site depth/distance + floater concept → CAPEX $/kW model (turbine + floater + mooring + EPCI + grid)** → LCOE = (CAPEX + NPV(OPEX)) / NPV(AEP) → **LCOE by component, IRR, NPV**
- **Cumulative FOW deployed capacity (2024 baseline: ~0.5 GW) + learning rate** → Wright learning curve: LCOE(n) = LCOE₀ × n^(−b) → **LCOE trajectory to 2040, cost reduction per doubling**
- **CfD strike price vs reference market price (seeded by country)** → Settlement = (strike − spot) × gen; NPV over CfD term → **CfD value, IRR under CfD vs merchant**

## 5 · Intermediate Transformation Logic
**Methodology:** LCOE Learning Curve + Floater CAPEX Model + CfD Contract Analytics
**Headline formula:** `LCOE = (CAPEX + NPV(OPEX)) / NPV(AEP); Floater_CAPEX = Turbine + Hull + Mooring + EPCI + Grid; Learning: LCOE(n) = LCOE₀ × n^(-b), b=log₂(LR)`

LCOE for floating offshore wind (2024): Spar-Buoy $140–180/MWh (deepest water, Hywind, most deployed); Semi-submersible $120–160/MWh (broadest depth range, most commercial pipeline); TLP $130–170/MWh (smallest water-plane area, requires good seabed); Barge $110–140/MWh (shallowest, most cost-sensitive to wave conditions). LCOE learning rate assumed 14–18% per doubling of cumulative deployed capacity. EPCI (Engineering, Procurement, Construction, Installation) cost is 25–35% of total CAPEX for floating vs 15–20% for fixed-bottom due to installation complexity.

**Standards:** ['IEA Wind TCP Task 37', 'DNV Energy Transition Outlook 2024', 'WindEurope Floating Offshore 2030']
**Reference documents:** WindEurope — Floating Offshore Wind: Making It Happen 2023; IEA Wind TCP Task 37 — Systems Engineering for Floating Offshore Wind (2024); DNV Energy Transition Outlook 2024 — Offshore Wind Chapter; NREL — 2022 Offshore Wind Energy Cost Analysis — Floating Systems; Carbon Trust — Floating Wind Joint Industry Project (FW JIP) Phase III

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Floating Offshore Wind module (EP-DT-family) is a **genuine engineering-economics calculator**: it
computes LCOE from discounted CAPEX+OPEX over discounted AEP, a Newton–Raphson project IRR, a
component CAPEX stack with site adjustments, and a capacity-factor model driven by latitude/hub-height/
sea-state. Most inputs are user sliders with realistic defaults; the country/floater/supply-chain
tables are curated. The code matches the guide's LCOE and CAPEX formulae closely — the one gap is the
**learning-curve trajectory, which is a hard-coded array rather than the guide's `LCOE(n)=LCOE₀·n^(−b)`
computed live** (§8).

### 7.1 What the module computes

**LCOE (real discounted-cash-flow form):**
```js
annualAEP = capacityMW × 1000 × (cfPct/100) × 8760          // MWh/yr
totalCapex= capexPerKw × capacityMW × 1000
npvOpex   = Σ_{i=1..life} opex·cap·1000 / (1+r)^i
npvAEP    = Σ_{i=1..life} annualAEP / (1+r)^i
LCOE      = (totalCapex + npvOpex) / npvAEP × 1000           // $/MWh
```
This is the correct IEA/NREL LCOE definition (levelised lifetime cost per MWh).

**CAPEX per kW (component stack × site adjustments):**
```js
base       = capexFloater + capexMooring + capexTurbine + capexInstall + capexGrid
distAdj    = 1 + (distanceShore − 80)×0.0015
depthAdj   = 1 + (waterDepth − 200)×0.0005
conceptAdj = Spar 1.00 · Semi-sub 1.05 · TLP 1.15 · Barge 1.25
capexPerKw = round(base × (1+contingency/100) × distAdj × depthAdj × conceptAdj)
```

**Capacity factor** (resource model):
```js
cfPct = 38 + (latitude−50)×0.4 + (hubHeight−120)×0.05 − seaState×0.5
```

**IRR** via Newton–Raphson on the annual cash-flow vector (`npv`, `dnpv`, up to 100 iterations,
convergence 1e-6) — a proper root-finder, not a lookup.

**Rotor diameter** scales with turbine rating: `round(√(rating/15)×236)` (a 15 MW turbine → 236 m,
the IEA reference).

### 7.2 Parameterisation / scoring rubric

**Floater concepts** (`FLOATER_CONCEPTS`) carry TRL, depth range, mooring lines, and an LCOE premium:

| Concept | Depth (m) | TRL | LCOE premium | conceptAdj |
|---|---|---|---|---|
| Spar-Buoy | 100–800 | 8 | 0% | 1.00 |
| Semi-submersible | 50–1000 | 7 | +5% | 1.05 |
| Tension Leg Platform | 80–500 | 6 | +15% | 1.15 |
| Barge | 30–60 | 5 | +25% | 1.25 |

These TRLs and premia track real FOW project evidence (Hywind spar TRL 8; WindFloat semi-sub; TLP/barge
earlier-stage). **Country pipeline** (Norway Hywind Tampen, UK Pentland Firth £196/MWh CfD strike, etc.)
uses real project names and CfD/tariff levels. **Supply-chain** lead times (dynamic cable 48wk, subsea
transformer 60wk) and concentration reflect known FOW bottlenecks.

### 7.3 Calculation walkthrough

1. Sliders set site (depth, distance, sea-state, latitude), turbine (rating, hub height, farm MW),
   CAPEX components, OPEX, discount rate, CfD strike.
2. `capexPerKw` = component stack × contingency × site adjustments.
3. `cfPct` from the resource model.
4. `lcoe = calcLCOE(capexPerKw, opex, farmCap, cfPct, life, r)`.
5. Cost-breakdown, distance-sensitivity, seasonal AEP, scenario (capex/CF multipliers), IRR and
   project-finance tabs all reuse `calcLCOE`/`calcIRR` with adjusted inputs.

### 7.4 Worked example (default site LCOE)

Defaults: components 650+280+900+480+320 = `base 2,630 $/kW`; contingency 12%; distance 80 (distAdj 1.0);
depth 200 (depthAdj 1.0); Semi-sub (conceptAdj 1.05):
```
capexPerKw = round(2630 × 1.12 × 1.0 × 1.0 × 1.05) = round(3,092) ≈ $3,092/kW
```
Capacity factor at lat 57, hub 140, sea-state 3.5:
`cf = 38 + (57−50)·0.4 + (140−120)·0.05 − 3.5·0.5 = 38 + 2.8 + 1.0 − 1.75 = 40.05%`.
For a 500 MW farm, 25-yr life, r=8%, opex $120/kW-yr, the discounted-AEP LCOE lands around **$120–135/MWh**
— consistent with the module's learning-curve 2024 floating LCOE anchor of $130/MWh and with published
FOW LCOE estimates.

### 7.5 Companion analytics & limitations

- **Learning curve** (`learningCurveData`) is a **hard-coded year→LCOE array** (2024 floating $130 →
  declining), not the guide's `LCOE₀·n^(−b)` computed from a learning rate — this is the one place the
  code narrates a formula it does not run.
- **Scenario analysis** applies capex/CF multipliers to the real `calcLCOE`.
- Curated country/floater/supply-chain data is realistic but not a live feed.
- `sr()` PRNG is defined; seasonal-AEP uses a deterministic seasonal shape, so randomness is minimal.

**Framework alignment:** IEA/NREL LCOE methodology (discounted lifetime cost / discounted generation) ·
CfD/auction contract design (UK AR, the £196/MWh strike) · Wright's Law / experience-curve theory
(learning rate) named in the guide · TRL scale (NASA/EU 1–9) for technology maturity. The LCOE, CAPEX
and IRR are correctly implemented; only the learning-curve projection is stylised.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The learning-curve trajectory is hard-coded
rather than derived from a learning rate, and LCOE is a deterministic point estimate. Below is the
production probabilistic-LCOE + experience-curve model.

### 8.1 Purpose & scope
Project FOW LCOE and its uncertainty through 2035, and the deployment volume needed to hit a target
cost, for investment and CfD-strike setting — per farm and per country pipeline.

### 8.2 Conceptual approach
Combine the existing discounted-LCOE engine with (i) a **Wright's-Law experience curve** (LCOE falls a
fixed % per doubling of cumulative capacity) benchmarked against **NREL ATB** and **BVG Associates /
IEA** FOW cost studies, and (ii) a **Monte-Carlo** over CAPEX, CF and OPEX to produce an LCOE
distribution rather than a point.

### 8.3 Mathematical specification
```
LCOE(n)   = LCOE₀ · (n / n₀)^(−b) ,   b = −log₂(LR)          Wright's Law; LR = learning rate
n_target  = n₀ · (LCOE_target / LCOE₀)^(−1/b)                 capacity to reach target LCOE
LCOE_MC   = calcLCOE(CAPEX~, OPEX~, CF~, life, r)             CAPEX~,CF~ drawn from distributions
P50/P90   = percentiles of the LCOE_MC sample
IRR_dist  = calcIRR( revenue(strike, CF~) − OPEX~ − debt service )
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| LR | learning rate (0.85–0.90 → 10–15%/doubling) | NREL ATB, BVG Associates FOW studies |
| n₀, LCOE₀ | current cumulative GW & LCOE | GWEC / IEA FOW installed base |
| CAPEX~, CF~, OPEX~ | input distributions | project data + engineering ranges |
| r | WACC | project-finance structure (equity/debt split) |

### 8.4 Data requirements
Cumulative global FOW capacity time series, current LCOE, per-farm CAPEX component ranges, site
resource (wind speed, bathymetry), CfD strike prices. Sources: GWEC, IEA, NREL ATB (public), 4C
Offshore project database (vendor). Site sliders already exist in the module.

### 8.5 Validation & benchmarking plan
Reconcile projected LCOE against NREL ATB and IEA FOW trajectories (target within published range);
backtest the experience curve against realised fixed-bottom offshore cost declines; validate P50 LCOE
against auction-clearing CfD strikes; sensitivity-test LR (±0.02) and WACC.

### 8.6 Limitations & model risk
Learning rates from fixed-bottom may not transfer to floating; supply-chain bottlenecks can reverse the
curve; site heterogeneity is large. Conservative fallback: present LCOE as a P50–P90 band and use the
lower learning rate (slower decline) for investment decisions.

## 9 · Future Evolution

### 9.1 Evolution A — Live learning-curve projection and probabilistic LCOE (analytics ladder: rung 2 → 3)

**What.** §7 rates this a genuine engineering-economics calculator: real discounted LCOE (`(CAPEX + NPV(OPEX))/NPV(AEP)`), Newton–Raphson project IRR, a site-adjusted component CAPEX stack, and a latitude/hub-height/sea-state capacity-factor model — mostly user sliders with curated country/floater/supply-chain tables. The single flagged gap is the learning-curve trajectory, which is a hard-coded year→LCOE array rather than the guide's `LCOE(n) = LCOE₀·n^(−b)`, `b = log₂(LR)` computed live. Evolution A implements Wright's-Law projection from a learning rate and cumulative-deployment path, then adds a calibration step: benchmark the CAPEX defaults and CF model against published NREL/DNV floating-wind cost points so the base case is anchored to observed projects, not slider defaults.

**How.** (1) Replace `learningCurveData` with a computed curve: `LCOE₀·(cumMW/cumMW₀)^(−log₂(1/(1−LR)))`, LR a documented input (14–18% range cited in §5). (2) Wrap the existing `calcLCOE`/`calcIRR` in a scenario endpoint (the page already has a 4-scenario capex/CF multiplier structure) and add a Halton-QMC pass over uncertain CAPEX/CF/discount inputs for a P10–P90 LCOE band, reusing the platform's deterministic QMC pattern from financial-modeling-studio. (3) Pin the base LCOE against NREL reference cases in bench_quant.

**Prerequisites.** A cumulative-deployment reference series; NREL/DNV cost points as refdata. **Acceptance:** the learning curve responds to the LR input reproducing `LCOE₀·n^(−b)`; a bench case matches NREL floating LCOE within tolerance; the hard-coded array is gone.

### 9.2 Evolution B — Floating-wind feasibility copilot (LLM tier 2)

**What.** A copilot for developer/IC users driving the calculator by description: "100 MW semi-sub at 400 m depth, 60 km to shore, UK CfD at £196/MWh — is it bankable?" becomes tool calls to the LCOE/IRR/DSCR endpoints exposed in Evolution A, narrated with the module's own floater-concept, mooring, and TRL context (the 18-tab structure is a rich §7 grounding corpus).

**How.** Tool schemas wrap the run/scenario endpoints; the per-module system prompt draws on §5/§7 (IEA/NREL LCOE methodology, floater-depth eligibility, EPCI share, CfD auction design) so the copilot reasons about concept selection and depth constraints, not just arithmetic. Because LCOE/IRR are real today, a tier-1 explainer over rendered page state ships before the endpoint work; the tier-2 upgrade adds computed what-ifs. Every £/MWh and IRR figure is validated against tool output.

**Prerequisites.** Evolution A endpoints for computed what-ifs; prompt-caching for the large module context. **Acceptance:** a feasibility dialogue's LCOE/IRR/DSCR numerics all trace to tool calls; asked for a P50 seabed-risk cost (not modeled), the copilot refuses and points to the supply-chain/TRL tabs as the qualitative alternative.