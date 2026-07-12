## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's headline is a SBTi-FLAG intensity computation
> `FLAG_intensity = Σ(commodity_i × EF_i × LUC_multiplier_i) / Revenue_USD`. **This is not computed.**
> Each company's `intensity` is a single `sr()`-seeded field (`0.5 + sr()·8.5`), and `totalEmissions`,
> `scope3Cat1`, `flagProgress`, land-use-change, etc. are all independent random draws — there is no
> commodity × emission-factor × LUC-multiplier chain. The module imports `EMISSION_FACTORS` from
> `referenceData` but does not use them to build intensities. The sections below document the
> descriptive aggregation over 60 synthetic food companies.

### 7.1 What the module computes

`genCompanies(60)` builds a synthetic food-company panel; the page filters and aggregates:

```js
totalE      = Σ totalEmissions                                  // tCO₂e
avgIntensity= Σ intensity / n                                   // tCO₂e/$M (seeded, averaged)
flagPct     = #flagTarget / n × 100
avgWaste    = Σ wasteRate / n
defFreePct  = #deforestationFree / n × 100
scope3Total = Σ scope3Cat1
categoryBreakdown / stageAvg / yearTrend: group sums & means
```

The only **derived-from-derived** quantities are the stage normalisation and the yearly trend, both
computed from seeded primitives:

```js
stageNorm[si]  = floor( stageBreakdown[si] / stageTotal × 100 )     // % per farm-to-fork stage
yearlyEmissions[yi] = floor( totalEmissions × (1 − yi·0.02 + sr(...)·0.05) )  // ~2%/yr decline + noise
scope3Cat1     = floor( totalEmissions × 0.6 + sr()×totalEmissions×0.2 )      // 60–80% is Scope-3 Cat1
```

### 7.2 Parameterisation / scoring rubric

**Company generation** (all `sr()`-seeded):

| Field | Formula | Range |
|---|---|---|
| revenue | `0.5 + s3·25` | $0.5–25.5 Bn |
| totalEmissions | `200 + s4·9800` | 200–10,000 ktCO₂e |
| intensity | `0.5 + s5·8.5` | 0.5–9.0 tCO₂e/$M |
| stageBreakdown[0] (Farm) | `raw·40 + 30` | 30–70 (weighted highest) |
| stageBreakdown[1–5] | `raw·20 + 5` | 5–25 each |
| flagTarget | `sr(i·37+11) > 0.4` | ~60% true |
| deforestationFree | `sr(i·43+15) > 0.5` | ~50% true |
| proteinIntensity | `2 + sr()·18` | 2–20 |
| wasteRate | `5 + sr()·25` | 5–30% |
| sbtiStatus | 4-way random pick | Committed/Target Set/No Target/In Progress |

The **stage weighting is methodologically correct in shape**: the Farm/Agriculture stage gets the
highest band (30–70%), reflecting the well-established fact that on-farm emissions (enteric fermentation,
fertiliser, land-use change) dominate food-system GHG. But the values are random, not from `EMISSION_FACTORS`.

`riskLevel` bands intensity: >5 High, >2.5 Medium, else Low. FLAG companies get a `reductionTarget`
(20–50%) and `targetYear` (2030–2034).

### 7.3 Calculation walkthrough

1. `genCompanies(60)` seeds the panel.
2. Filter by category/country/search; sort by chosen field.
3. `stats`: portfolio totals and %s.
4. `categoryBreakdown`: total & mean intensity per food category (Beef highest by design of the seed
   distribution, since higher intensities cluster there statistically, not deterministically).
5. `stageAvg`: mean farm-to-fork stage %; `yearTrend`: 8-year emission path.

### 7.4 Worked example (Scope-3 and stage split)

A company with `totalEmissions = 5,000 kt`, `sr()` draw 0.5 for Scope-3:
```
scope3Cat1 = floor(5000×0.6 + 0.5×5000×0.2) = floor(3000 + 500) = 3,500 kt   (70% of total)
```
For its stage split, suppose raw farm band = 55, and stages 2–6 sum to 60, total 115:
```
stageNorm[Farm] = floor(55/115×100) = 47%   → farm dominates, per food-system reality
```
So farm-stage ≈47% of footprint and Scope-3 Cat-1 ≈70% of total — both directionally correct for the
food sector, though the specific figures are random.

### 7.5 Data provenance & limitations

- **All 60 companies are synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`.
- The **SBTi-FLAG intensity, commodity emission factors and LUC multipliers are not implemented** —
  intensity is a random field; `EMISSION_FACTORS` is imported but unused for the core maths.
- Stage split and Scope-3 share are shaped to be realistic (farm-heavy, high Scope-3) but random.
- Yearly trend embeds a fixed ~2%/yr decline plus ±5% noise, not a target-driven pathway.

**Framework alignment (named, not computed):** SBTi FLAG (Forest, Land and Agriculture) sector guidance
(the flagTarget/reductionTarget framing) · GHG Protocol Scope 3 Category 1 (purchased goods — the
scope3Cat1 field) · deforestation-free supply-chain commitments (EUDR-aligned) · food-system LCA
(farm-stage dominance). The correct FLAG intensity requires commodity volumes × IPCC/GHGP emission
factors × land-use-change multipliers, which this module references but does not run.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Company intensities and FLAG progress are
`sr()`-random. Below is the production SBTi-FLAG emissions model.

### 8.1 Purpose & scope
Compute food-company FLAG (land-based) emissions intensity and Scope-3 Category-1 financed/purchased
emissions from commodity purchase volumes, for SBTi FLAG target-setting and supplier engagement.

### 8.2 Conceptual approach
A **commodity-level bottom-up emissions model** benchmarked against **SBTi FLAG guidance**, the
**GHG Protocol Land Sector and Removals Guidance**, and **Poore & Nemecek (2018)** life-cycle emission
factors — with land-use-change (LUC) amortised per GHGP/PAS 2050.

### 8.3 Mathematical specification
```
FLAG_intensity_c = Σ_i ( Volume_{i,c} · EF_i · LUC_mult_{i,region} ) / Revenue_c
   EF_i = cradle-to-gate LCA factor for commodity i (kgCO₂e/kg)
   LUC_mult = 1 + amortisedLUC_i / directEmissions_i          (deforestation risk uplift)
Scope3Cat1_c = Σ_i Spend_{i,c} · EF_spend_i                    spend-based fallback (EEIO)
   or Σ_i Volume_{i,c} · EF_i                                  activity-based (preferred)
Target_c = Base_c · (1 − FLAG_reduction_rate)^(t−t₀)           SBTi 1.5°C FLAG pathway (−3.03%/yr abs)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| EF_i | commodity LCA emission factor | Poore & Nemecek 2018 / Agribalyse / GHGP |
| LUC_mult | land-use-change uplift | GHGP Land Sector Guidance, Trase deforestation data |
| EF_spend_i | spend-based EEIO factor | EXIOBASE / USEEIO |
| FLAG_reduction_rate | annual FLAG cut | SBTi FLAG 1.5°C (−3.03%/yr) |

### 8.4 Data requirements
Per company: commodity purchase volumes (or spend) by commodity and sourcing region, revenue,
deforestation-risk sourcing. Sources: supplier data, Trase (commodity-deforestation, public),
Poore & Nemecek EF (public), EXIOBASE (public). None currently wired to the seeded intensities.

### 8.5 Validation & benchmarking plan
Reconcile FLAG intensity against CDP-disclosed food-company footprints (target ±20%); backtest Scope-3
Cat-1 activity-based vs spend-based; validate LUC uplift against Trase deforestation exposure; check
target pathway matches the SBTi FLAG tool.

### 8.6 Limitations & model risk
Commodity EFs vary widely by production system; LUC allocation is contested; spend-based fallback is
coarse. Conservative fallback: use activity-based EFs where volumes exist, spend-based elsewhere, and
apply the higher LUC multiplier for high-deforestation-risk regions.
