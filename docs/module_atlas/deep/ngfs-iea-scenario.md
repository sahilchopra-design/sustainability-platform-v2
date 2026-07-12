## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **Integrated Transition
> Risk Score** (`ITRS = w₁×NGFSMacroImpact + w₂×IEAEnergyShift + w₃×PolicyCarbonPrice`) that maps
> energy intensity and carbon exposure to NGFS variable shocks to produce a **sector-level
> transition-risk score**. **No ITRS, no sector mapping, and no portfolio stress output exist in
> the code.** The page is a **scenario registry + carbon-price interpolator + ensemble-weighting
> calculator**: it catalogues 14 scenarios from 5 providers, draws carbon-price trajectories from a
> power-law interpolation, computes ensemble weights across scenarios, and displays four hard-coded
> NZ-vs-CP variable pathways. The sections below document that.

### 7.1 What the module computes

Three genuine calculations sit on the page; the rest is a display of the 14-row `SCENARIOS` table.

**(a) Carbon-price trajectory** — for each scenario, interpolate from a code-derived base to the
scenario's 2050 target on a convex (power-1.6) curve with a ±10% seeded wobble:
```js
base = 15 + sc.code.length * 2
t    = (yr − 2025) / 25
cpAt(sc, yr) = round( base + (sc.cp2050 − base) · t^1.6 · (0.9 + sr(sc.cp2050 + yr)·0.2) )
```

**(b) Ensemble weights** across the 14 scenarios, six selectable methods:
```js
equal:        wᵢ = 1/N
temperature:  raw_i = exp(−½·((Tᵢ − targetTemp)/σ)²),  σ=0.4;  wᵢ = raw_i / Σraw    (Gaussian kernel)
bma/skill/expert/performance:  raw_i = 0.02 + sr(i·77 + method.length)·0.15;  wᵢ = raw_i / Σraw
```
Only `equal` and `temperature` are real methods; **BMA, skill, expert and performance all resolve to
the same seeded-random branch** — they differ only through `method.length` perturbing the seed.

**(c) Variable projections** — four variables (CO₂ Gt, renewable GW, fossil EJ, GDP) each carry a
hard-coded `nz[]` and `cp[]` six-point array (2025→2050); the chart plots the NZ2050 vs Current
Policies pair.

### 7.2 Parameterisation / scenario registry

The 14-scenario table is the module's dataset. Key columns (provenance = provider's published figure
where a real number is used; otherwise illustrative):

| Scenario | Provider | Temp | CP 2030 ($/t) | CP 2050 ($/t) | Phys / Trans risk |
|---|---|---|---|---|---|
| Net Zero 2050 | NGFS P5 | 1.5 | 250 | 2 946 | Low / High |
| Below 2°C | NGFS P5 | 1.8 | 150 | 1 250 | Low-Med / High |
| Delayed Transition | NGFS P5 | 1.8 | 50 | 1 800 | Low-Med / V.High |
| NDC Policies | NGFS P5 | 2.5 | 45 | 95 | High / Low |
| Current Policies | NGFS P5 | 2.7 | 20 | 83 | V.High / None |
| Net Zero Emissions | IEA WEO24 | 1.5 | 210 | 2 500 | Low / High |
| Announced Pledges | IEA WEO24 | 1.7 | 130 | 800 | Low-Med / Med |
| Stated Policies | IEA WEO24 | 2.4 | 40 | 130 | High / Low |
| IPCC C1/C2/C3/C5 | IPCC AR6 | 1.5–2.4 | 50–300 | 200–3 000 | Low→High |
| IRENA 1.5°C | IRENA 2024 | 1.5 | 180 | 2 200 | Low / High |
| GFANZ Net Zero | GFANZ 2024 | 1.5 | 200 | 2 600 | Low / High |

The IEA NZE 2030 carbon price (~$130–210/t advanced economies) and NGFS scenario names/ordering are
faithful to the published sources; the `IPCC_CATS` C1–C7 counts (97/198/423/352/602/665/794) match
the AR6 WG3 scenario database category tallies. `ensemble σ = 0.4` and the power-1.6 CP curve shape
are modelling choices, not sourced constants. A banner cites *Kotz et al. 2024* damage-function
uprating (NGFS Phase 5 physical risk ≈4× Phase 4) — descriptive only; no damage function is computed.

### 7.3 Calculation walkthrough

1. **Registry tab:** filter `SCENARIOS` by provider and by the `ngfsDmg` (Phase-5) flag; KPI cards
   count 1.5 °C scenarios, high-physical-risk scenarios, and max carbon price ($2,946).
2. **Carbon-price tab:** `CP_DATA` builds one row per year in `CP_YEARS`, each column a scenario's
   `cpAt`. The convex power-1.6 shape delays most of the price rise to post-2035.
3. **Ensemble tab:** `computeWeights(method, targetTemp)` → normalised weight per scenario; the
   temperature-conditional kernel concentrates weight on scenarios whose `temp` is near `targetTemp`.
4. **Variable tab:** `VAR_DATA(selectedVar)` returns the NZ/CP pair for the chosen variable.

### 7.4 Worked example (temperature-conditional weighting, targetTemp = 1.5, σ = 0.4)

For three scenarios with temps 1.5, 1.8, 2.7:
```
raw(1.5) = exp(−½·((1.5−1.5)/0.4)²) = exp(0)       = 1.000
raw(1.8) = exp(−½·((1.8−1.5)/0.4)²) = exp(−0.281)  = 0.755
raw(2.7) = exp(−½·((2.7−1.5)/0.4)²) = exp(−4.5)    = 0.011
Σraw = 1.766
w(1.5) = 1.000/1.766 = 0.566   w(1.8) = 0.428   w(2.7) = 0.006
```
The 1.5 °C scenario carries 57% of ensemble weight; the 2.7 °C Current-Policies scenario is all but
excluded — exactly the "focus the ensemble on the target outcome" behaviour a Gaussian kernel gives.

Carbon-price example — Net Zero 2050 (`code` length 10, `cp2050 = 2946`) at 2030:
```
base = 15 + 10·2 = 35 ;  t = (2030−2025)/25 = 0.2 ;  t^1.6 = 0.0761
cpAt ≈ 35 + (2946−35)·0.0761·(0.9 + sr(2976)·0.2) ≈ 35 + 221·(~1.0) ≈ $250/t   (≈ published NZ2050 2030 target)
```

### 7.5 Data provenance & limitations

- Scenario temperatures, names, IPCC category counts and headline IEA carbon prices are **real,
  published** figures; carbon-price *trajectories between anchor years* are synthetic power-law
  interpolations with a `sr(seed)=frac(sin(seed+1)×10⁴)` ±10% wobble.
- **Four of six ensemble methods are placeholders** — BMA, skill, expert and performance weights are
  seeded pseudo-random, not posterior model-averaging or backtested skill weights.
- Variable pathways are four hand-set six-point arrays; no IAM output is ingested, no regional or
  sectoral disaggregation, and no portfolio is stressed against any path.

**Framework alignment:** *NGFS Phase 5 (Nov 2024)* — the five canonical NGFS scenarios are catalogued
with correct ordering (orderly < disorderly < hot-house); the Kotz-et-al. damage uprating is
referenced but not implemented. *IEA WEO 2024 / NZE* — NZE, APS, STEPS captured with headline carbon
prices. *IPCC AR6 WG3* — the C1–C7 category framework (temperature outcome × overshoot, with 2100 net
CO₂) is reproduced as a summary table. Ensemble weighting nods to *Bayesian Model Averaging* — where,
properly, posterior weight ∝ scenario likelihood given historical macro outturns — but only the
Gaussian-kernel temperature method is genuinely calculated.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's Integrated Transition Risk
Score, the BMA/skill/expert ensemble weights, and any portfolio stress output are absent; below is
the production model the page implies.

### 8.1 Purpose & scope
Translate a chosen (or ensemble-weighted) NGFS/IEA scenario into sector- and portfolio-level
transition-risk impacts for capital planning and supervisory stress testing. Coverage: corporate
loan/equity portfolios mapped to ~20 NACE/GICS sectors across regions.

### 8.2 Conceptual approach
**(i) Scenario ensemble via true BMA** — mirroring *NGFS ensemble guidance* and academic BMA:
posterior weight ∝ prior × likelihood of each IAM given realised carbon-price / emissions history.
**(ii) Sector transition-risk transmission** — mirroring the *NGFS "expanded" transition module* and
*Aladdin Climate transition repricing*: pass scenario carbon-price and energy-mix shocks through a
sector cost-pass-through and demand-elasticity model to sector value/EBITDA impacts, then to
PD/spread via a structural credit link.

### 8.3 Mathematical specification
Ensemble weight:
```
wₖ ∝ πₖ · L(D | scenarioₖ) = πₖ · exp(−½ Σ_t ((x_t^obs − x_t^k)/s_t)²)     over macro vars x (CP, CO₂)
```
Sector transition impact for sector j under scenario k:
```
ΔEBITDA_{j,k}(t) = − CarbonCost_{j,k}(t)·(1−passthrough_j) − DemandLoss_{j,k}(t)·margin_j + GreenUpside_{j,k}(t)
CarbonCost_{j,k}(t) = CP_k(t) · Emissions_j(t) · (1 − freeAlloc_j)
ITRS_j = Σ_k w_k · ( a·|ΔEBITDA_{j,k}| + b·EnergyShift_{j,k} + c·CP_k(2030)/CP_max )     (a+b+c=1)
```

| Parameter | Value / source |
|---|---|
| CP_k(t) | NGFS Phase 5 / IEA WEO 2024 carbon-price paths |
| Emissions_j | Trucost / PCAF sector intensity × exposure |
| passthrough_j | sector cost pass-through 0.2–0.8 (ECB econometric est.) |
| freeAlloc_j | EU ETS free-allocation benchmarks |
| margin_j | sector EBITDA margin (S&P Capital IQ) |
| a,b,c | governance-set, default 0.5/0.3/0.2 |

### 8.4 Data requirements
Scenario variable paths (NGFS portal via IIASA — free; IEA WEO — vendor); realised macro history for
BMA likelihood (World Bank, IMF); sector emission intensities & exposures (platform reference_data +
PCAF layer); EU ETS free-allocation and cost pass-through parameters (ECB/EBA studies).

### 8.5 Validation & benchmarking plan
Reconcile ensemble-weighted sector impacts against the ECB 2022 economy-wide climate stress test and
NGFS-published sector GVA impacts. Backtest BMA weights out-of-sample on 2018–2024 carbon-price
history. Sensitivity of ITRS to σ, to pass-through, and to the a/b/c weighting.

### 8.6 Limitations & model risk
BMA likelihoods are weak with short macro history; pass-through and demand elasticities are the
dominant uncertainty. Physical-risk channel (Kotz damages) is out of scope here and must be added for
a complete stress. Conservative fallback: report the min-across-scenario (worst-case) impact
alongside the ensemble-weighted value.
