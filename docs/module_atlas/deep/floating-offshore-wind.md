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
