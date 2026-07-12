## 7 · Methodology Deep Dive

The Forestry & Timberland Finance suite (EP-DX3) is a **genuine timber-investment calculator**: a real
Newton–Raphson IRR/NPV engine over a mean-annual-increment (MAI) growth model, carbon-revenue overlay,
and FSC certification premium, plus curated real-world reference data (TIMOs, carbon methodologies,
return benchmarks). The IRR engine matches the guide. The one modelling simplification is the volume-
growth term, which compounds a standing-volume proxy geometrically (§7.4, §8). No PRNG in the core
economics.

### 7.1 What the module computes

`calcTimberIrr` builds a rotation cash-flow vector and solves for IRR/NPV:

```js
finalVolM3  = landHa × 250 × (1 + MAI/100)^rotatYr           // standing volume at harvest
timberRev   = finalVolM3 × timberPriceM3 × (1 + fscPrem/100) // timber + FSC premium
annCarbonRev= landHa × carbonSeqTha × carbonPriceT           // annual carbon income
cfs = [ −(landCost + plantCost),
        year 1..N−1: annCarbonRev − annMgmt,
        year N     : timberRev + annCarbonRev − annMgmt ]     // harvest in final year
IRR: Newton–Raphson on cfs (200 iters, tol 1e-8)
NPV = Σ cfs_t / (1 + wacc/100)^t
```

So the model is a classic **single-rotation forestry DCF**: buy land + plant, earn annual carbon
credits net of management, harvest timber (with FSC premium) at rotation end. IRR and NPV are solved
exactly.

### 7.2 Parameterisation / scoring rubric — forest types

`FOREST_TYPES` (6) carry realistic silvicultural parameters:

| Forest type | MAI % | Rotation (yr) | Carbon seq (t/ha/yr) | Timber $/m³ | FSC prem % |
|---|---|---|---|---|---|
| Temperate Softwood | 8.2 | 45 | 4.8 | 95 | 12 |
| Temperate Hardwood | 6.8 | 80 | 5.2 | 185 | 18 |
| Tropical Plantation | 12.5 | 7 | 6.8 | 65 | 20 |
| Tropical Natural | 4.2 | — | 8.5 | 380 | 35 |
| Boreal | 3.8 | 100 | 3.2 | 72 | 8 |
| Mangrove (Blue Carbon) | 9.5 | — | 14.2 | 0 | 45 |

These are silviculturally plausible (fast-rotation eucalyptus 7yr/12.5% MAI; boreal 100yr; mangrove
highest carbon at 14.2 t/ha/yr, no timber). **TIMOs** (`TIMOS_LIST`) are real firms with real AUM/IRR
(Hancock $14.5B, Weyerhaeuser REIT, New Forests impact mandate). **Carbon methodologies** are genuine
(VCS IFM, AR, REDD+/ART TREES, VM0033 blue carbon) with real price bands and permanence rules. **Return
benchmarks** cite NCREIF/IPD timberland returns and correlations (timberland low equity correlation
~0.08–0.12, high inflation hedge ~0.68–0.80) — accurate stylised facts.

### 7.3 Calculation walkthrough

1. Pick forest type + set land/plant/mgmt costs, carbon price, WACC.
2. `calcTimberIrr` → IRR, NPV, final volume, timber revenue, annual carbon revenue.
3. Carbon-price sensitivity: re-run IRR across carbon prices $0–60.
4. Carbon-revenue-by-forest-type and return-benchmark bars.

### 7.4 Worked example (temperate softwood, default)

Softwood: MAI 8.2%, rotation 45yr, timber $95/m³, FSC 12%, carbon 4.8 t/ha/yr; land 5,000 ha,
landCost $2,500/ha, plant $1,200/ha, mgmt $85/ha, carbon $18/t, WACC 6.5%:
```
finalVolM3 = 5000 × 250 × (1.082)^45 = 1.25M × 33.5 ≈ 41.9M m³
timberRev  = 41.9M × 95 × 1.12 ≈ $4,460M
annCarbonRev = 5000 × 4.8 × 18 = $432,000/yr
initial outlay = 5000×(2500+1200) = $18.5M
```
The `(1.082)^45 ≈ 33.5` compounding produces a very large final volume — this is the model's
simplification: it treats the `250 m³/ha` starting figure as a base that grows geometrically at the MAI
*percentage* for the full rotation, which overstates yield versus a real yield curve that plateaus at
canopy closure. The IRR the engine returns is therefore optimistic for long rotations; carbon revenue
and FSC premium then layer on top.

### 7.5 Data provenance & limitations

- **Core economics are real** (Newton–Raphson IRR/NPV, cash-flow rotation); no PRNG.
- **Volume growth is geometric in MAI%**, not a species yield curve — overstates long-rotation volume.
- TIMO, carbon-methodology and benchmark tables are **curated real-world data** (accurate stylised facts).
- Carbon revenue assumes constant annual sequestration and a flat carbon price for the whole rotation;
  no buffer-pool deduction or permanence discount despite the methodologies listing 100-yr buffers.

**Framework alignment:** forestry DCF / Faustmann rotation economics (the cash-flow structure) · VCS
IFM/AR + ART TREES REDD+ + VM0033 blue carbon (carbon methodologies — VCS derives credits from a
baseline-vs-project carbon-stock difference minus a buffer-pool contribution for permanence) · FSC
certification premium · NCREIF/IPD timberland benchmarks (correlation + inflation-hedge properties).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Volume growth is geometric in MAI% and carbon
revenue omits buffer-pool/permanence discounting. Below is the production timber+carbon valuation model.

### 8.1 Purpose & scope
Value a timberland investment over one or more rotations, combining a species-specific yield curve,
timber price, FSC premium and carbon revenue net of buffer-pool and permanence risk — for TIMO/REIT
acquisition and carbon-project underwriting.

### 8.2 Conceptual approach
A **Faustmann/land-expectation-value** DCF with a **Chapman–Richards yield curve** (not geometric MAI),
benchmarked against **NCREIF Timberland Index** returns and **US Forest Service FVS** growth-and-yield
models, plus a carbon block following **VCS AFOLU** accounting (net credits = ΔC_stock − leakage −
buffer contribution).

### 8.3 Mathematical specification
```
Volume(t) = A·(1 − e^(−k·t))^p              Chapman–Richards yield curve (A=max yield, k,p shape)
TimberRev = Volume(T)·price·(1 + FSCprem)
CarbonCredits_t = ΔStock_t · (1 − leakage) · (1 − bufferPct)   VCS AFOLU net crediting
CarbonRev_t     = CarbonCredits_t · carbonPrice_t             carbonPrice may follow a forward curve
IRR: Σ_t CF_t/(1+IRR)^t = 0 ;  LEV = NPV_perpetual-rotation(Faustmann)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| A, k, p | yield-curve shape | US Forest Service FVS / regional yield tables |
| bufferPct | permanence buffer | VCS AFOLU non-permanence risk tool (10–40%) |
| leakage | activity-shifting loss | VCS methodology default |
| carbonPrice_t | credit forward curve | VCM price data (Ecosystem Marketplace) |
| price, FSCprem | timber price + premium | timber market indices, FSC premium studies |

### 8.4 Data requirements
Per stand: species, age, site index, standing volume, yield curve, timber price, carbon-stock time
series, buffer/leakage rates. Sources: FVS growth models (public), NCREIF/IPD (vendor), VCS registry
(public), Ecosystem Marketplace prices (on platform). Forest-type table supplies MAI/rotation seeds.

### 8.5 Validation & benchmarking plan
Reconcile IRR against NCREIF timberland realised returns (target within index range); validate yield
curve against FVS output; back out buffer-adjusted carbon credits against issued VCS AFOLU credits;
sensitivity-test carbon price and rotation length.

### 8.6 Limitations & model risk
Yield curves are region- and site-specific; carbon permanence risk (fire, pest, reversal) is hard to
price; timber prices are cyclical. Conservative fallback: apply the higher VCS buffer (40%), use a yield
curve plateau (not geometric growth), and stress carbon price to zero for the base timber-only IRR.
