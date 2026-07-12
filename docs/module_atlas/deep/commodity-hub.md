## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide advertises a **TCFD Commodity Risk Composite**
> `CommodityRisk = w₁·PriceVol + w₂·SupplyDisruption + w₃·CarbonIntensity`, with price vol as 90-day
> realised, disruption from geopolitical+hazard models, and Scope-3-Cat-1 carbon intensity. **The page does
> not compute that composite.** It generates ~25 per-portfolio-company metrics (commodity exposure,
> externality cost, ESG-VC score, lifecycle GHG, water, biodiversity, CBAM, stranded-asset, composite risk)
> entirely from its own PRNG `seed(s)=frac(sin(s+1)·10⁴)`, then sums them. `compositeRisk` is a single
> random draw, not a weighted PriceVol/Disruption/CarbonIntensity blend. §8 specifies the intended composite.

### 7.1 What the module computes

Per portfolio company (`s`-seeded), a battery of independent metrics:
```js
commodityExposurePct = round(5 + seed(s·11)·35)
externalityCostMn    = round(seed(s·29)·80 + 5)
esgVCScore           = round(25 + seed(s·31)·65)
lifecycleGHG         = round(seed(s·37)·200000 + 5000)
carbonExposure       = round(seed(s·67)·45 + 5)
strandedAssetRisk    = round(seed(s·71)·40)
compositeRisk        = round(20 + seed(s·73)·60)      // ← single random draw, NOT a weighted composite
mlConfidence         = round(75 + seed(s·79)·22)
cbamExposure         = round(seed(s·91)·50)
```
Portfolio roll-ups are simple means/sums: `avgESGVC = Σ esgVCScore/n`, `totalExternalityMn = Σ`,
`totalGHG = Σ lifecycleGHG`, etc.

### 7.2 Parameterisation / scoring rubric

| Quantity | Generation | Provenance |
|---|---|---|
| All ~25 company metrics | `seed(s·prime)·range + offset` | synthetic demo value |
| `compositeRisk` | `20 + seed(s·73)·60` | synthetic (not a w-weighted blend) |
| `MODULES` (21) | seed schema | curated module registry (hub links out to 21 commodity modules) |
| `CRITICAL_MINERALS` (11: geoRisk, supplyConc, reserveYears, recyclingRate) | seed schema | curated (critical-minerals reference) |
| `CARBON_MKTS` (9: price, coverage, region, phase) | seed schema | curated ETS/carbon-market reference |
| `HEATMAP_COMMODITIES` (26: dim_financial/esg/climate, lifecycle stages) | seed schema | curated 3-dimension heatmap |

### 7.3 Calculation walkthrough

Each portfolio company is seeded into ~25 metrics → three dimension scores (`dimensionFinancial/ESG/Climate`)
feed the heatmap → `childLaborRisk` is a threshold pick on two seeds → portfolio aggregates compute averages
(exposure, ESG-VC, circular, EUDR) and sums (externality, financial flow, GHG, water, biodiversity, supply
chains). The hub also surfaces curated `CRITICAL_MINERALS`, `CARBON_MKTS`, `REGS`, `ALERT_TYPES` and
`SCENARIO_PRESETS` reference tables and links to the 21 child modules in `MODULES`.

### 7.4 Worked example

Portfolio of `n = 10` companies. Company with seed `s`: `commodityExposurePct = round(5 + seed(s·11)·35)`;
if `seed(s·11) = 0.6` → `5 + 21 = 26%`. `externalityCostMn` with `seed(s·29) = 0.5` → `round(0.5·80+5) = 45`.
Portfolio `totalExternalityMn = Σ = ` (sum of 10 such draws, e.g. ≈ $420M); `avgESGVC = Σ esgVCScore/10`.
Note `compositeRisk` for this company is an independent `20 + seed(s·73)·60` — it bears no arithmetic
relationship to that company's exposure, carbon or ESG scores, illustrating the missing composite logic.

### 7.5 Data provenance & limitations

- **All company-level metrics are synthetic** (`seed()` PRNG). Only the curated reference tables
  (`CRITICAL_MINERALS`, `CARBON_MKTS`, `MODULES`, `REGS`) hold real-flavoured constants.
- `compositeRisk` is a standalone random number, so the guide's weighted TCFD composite is not implemented;
  the three `dimension*` scores are also independent draws, not derived from underlying metrics.
- No 90-day realised vol, no geopolitical/hazard disruption model, no GHG-Protocol Scope-3-Cat-1 computation
  — those are the guide's intended methods, absent from code.

**Framework alignment:** TCFD (commodity risk disclosure framing) · GHG Protocol Scope 3 Category 1 (the
intended carbon-intensity basis) · IEA commodity-market and critical-minerals context · NGFS/ECB climate-VaR
(the 8–22% VaR range cited). CBAM exposure references EU Regulation 2023/956.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** A genuine TCFD commodity-risk composite per portfolio commodity exposure, combining
price volatility, supply-disruption probability and carbon intensity, for portfolio-level commodity risk and
TCFD disclosure.

**8.2 Conceptual approach.** Weighted composite (guide's formula) with each input properly estimated:
90-day realised vol (Bloomberg Commodity Index), disruption probability from a geopolitical + climate-hazard
production-concentration model (IEA/Oxford Economics), and Scope-3-Cat-1 carbon intensity (LCA databases) —
benchmarked against NGFS/ECB climate-VaR and MSCI commodity risk.

**8.3 Mathematical specification.**
```
PriceVol_c = annualised 90-day realised vol of commodity c
SupplyDisruption_c = 1 − Π_region (1 − p_disrupt_region)^{ProductionShare_region}
   p_disrupt_region = f(GeopoliticalRisk, ClimateHazardExposure, LogisticsConcentration)
CarbonIntensity_c = Σ_stage upstream_EF_stage (tCO₂e/t)   (GHG Protocol Scope 3 Cat 1)
CommodityRisk_c = w1·z(PriceVol) + w2·z(SupplyDisruption) + w3·z(CarbonIntensity)   (z = standardised)
Portfolio composite = Σ_c exposure_c · CommodityRisk_c
```

| Parameter | Source |
|---|---|
| Realised vol | Bloomberg Commodity Index / CME-LME prices |
| Geopolitical risk | Oxford Economics / Caldara-Iacoviello GPR index |
| Hazard exposure of production | IPCC AR6 hazard maps × IEA production regions |
| Carbon intensity EFs | ecoinvent / IEA LCA databases |

**8.4 Data requirements.** Commodity price series, production-region shares, LCA EFs, portfolio exposures.
Free: OWID/IEA summaries, GPR index; vendor: Bloomberg, ecoinvent.

**8.5 Validation & benchmarking.** Reconcile PriceVol against BCOM 18–55%; disruption vs realised supply
shocks; composite vs NGFS/ECB 8–22% climate-VaR; weight sensitivity.

**8.6 Limitations & model risk.** Disruption probabilities hard to calibrate; LCA EF uncertainty; weight
choice subjective. Fallback: equal-weight z-score composite with documented weights when calibration data is
thin.
