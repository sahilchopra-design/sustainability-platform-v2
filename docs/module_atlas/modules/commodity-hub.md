# Commodity Intelligence Hub
**Module ID:** `commodity-hub` · **Route:** `/commodity-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Aggregates price analytics, supply chain climate exposure, and TCFD commodity risk signals across energy, metals, and agricultural raw materials. Integrates forward curve data with physical supply disruption probabilities and carbon intensity benchmarks for portfolio-level commodity risk management.

> **Business value:** Enables commodity risk officers and portfolio managers to identify which raw material exposures carry the highest climate-adjusted risk, prioritise supply chain diversification, and populate TCFD commodity risk sections of annual reports.

**How an analyst works this module:**
- Select commodity class from Energy, Metals, or Agriculture filter
- Review price analytics panel for historical and forward curve trends
- Switch to Supply Chain Exposure tab to view geographic concentration heat map
- Use TCFD Risk Composite tab to view scenario-weighted composite risk scores
- Export portfolio-level commodity risk summary for TCFD disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_TYPES`, `Badge`, `CARBON_MKTS`, `CRITICAL_MINERALS`, `Card`, `HEATMAP_COMMODITIES`, `HeatCell`, `KPICard`, `LS_PORT`, `MODULES`, `PIE_COLORS`, `REGS`, `RiskBadge`, `SCENARIO_PRESETS`, `SectionTitle`, `SortableTable`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODULES` | 21 | `name`, `path`, `icon`, `color`, `metrics`, `commodities`, `models`, `accuracy` |
| `REGS` | 8 | `articles`, `coverage`, `commodity`, `deadline`, `impactScore` |
| `CRITICAL_MINERALS` | 11 | `use`, `topProducer`, `geoRisk`, `supplyConc`, `demandGrowth`, `price`, `unit`, `reserveYears`, `recyclingRate` |
| `CARBON_MKTS` | 9 | `name`, `price`, `trend`, `coverage`, `region`, `volume`, `phase` |
| `HEATMAP_COMMODITIES` | 26 | `dim_financial`, `dim_esg`, `dim_climate`, `stages`, `extraction`, `processing`, `transport`, `storage`, `trading`, `endUse` |
| `ALERT_TYPES` | 11 | `count`, `severity`, `commodities`, `color`, `trend` |
| `SCENARIO_PRESETS` | 9 | `name`, `description`, `commodity`, `priceChange`, `portfolioImpact`, `carbonImpact`, `esgImpact` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `pct` | `(n) => n == null ? '\u2014' : `${Math.round(n)}%`;` |
| `fmtMn` | `(n) => n >= 1000 ? `$${(n/1000).toFixed(1)}Bn` : `$${Math.round(n)}Mn`;` |
| `fmtK` | `(n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : `${Math.round(n)}`;` |
| `commodityExposurePct` | `Math.round(5 + seed(s * 11) * 35);` |
| `topCommodity` | `['Oil & Gas','Metals','Agriculture','Chemicals','Mining','Energy','Materials','Tech Metals'][Math.floor(seed(s * 13) * 8)];` |
| `supplyChainsMapped` | `Math.ceil(seed(s * 17) * 12 + 2);` |
| `lcaProducts` | `Math.ceil(seed(s * 19) * 8 + 1);` |
| `financialFlowMn` | `Math.round(seed(s * 23) * 500 + 50);` |
| `externalityCostMn` | `Math.round(seed(s * 29) * 80 + 5);` |
| `esgVCScore` | `Math.round(25 + seed(s * 31) * 65);` |
| `lifecycleGHG` | `Math.round(seed(s * 37) * 200000 + 5000);` |
| `waterFootprint` | `Math.round(seed(s * 41) * 5000 + 200);` |
| `biodiversityImpact` | `Math.round(seed(s * 43) * 50 + 2);` |
| `circularScore` | `Math.round(15 + seed(s * 47) * 70);` |
| `eudrCompliance` | `Math.round(40 + seed(s * 53) * 55);` |
| `childLaborRisk` | `seed(s * 59) > 0.7 ? 'High' : seed(s * 61) > 0.4 ? 'Medium' : 'Low';` |
| `carbonExposure` | `Math.round(seed(s * 67) * 45 + 5);` |
| `strandedAssetRisk` | `Math.round(seed(s * 71) * 40);` |
| `compositeRisk` | `Math.round(20 + seed(s * 73) * 60);` |
| `mlConfidence` | `Math.round(75 + seed(s * 79) * 22);` |
| `dimensionFinancial` | `Math.round(30 + seed(s * 83) * 60);` |
| `dimensionESG` | `Math.round(20 + seed(s * 87) * 70);` |
| `dimensionClimate` | `Math.round(25 + seed(s * 89) * 65);` |
| `cbamExposure` | `Math.round(seed(s * 91) * 50);` |
| `oilPriceSens` | `Math.round(-5 + seed(s * 97) * 10);` |
| `waterStressScore` | `Math.round(10 + seed(s * 101) * 80);` |
| `dataCompletenessScore` | `Math.round(55 + seed(s * 103) * 40);` |
| `productPassportCoverage` | `Math.round(20 + seed(s * 107) * 75);` |
| `colors` | `{ 'Very High':'#dc2626', High:'#d97706', Medium:'#ca8a04', Low:'#16a34a', Positive:'#0d9488', 'N/A':'#9aa3ae' };` |
| `totalCommodityExp` | `portfolio.reduce((a, c) => a + c.commodityExposurePct, 0) / n;` |
| `totalExternalityMn` | `portfolio.reduce((a, c) => a + c.externalityCostMn, 0);` |
| `totalFinFlowMn` | `portfolio.reduce((a, c) => a + c.financialFlowMn, 0);` |
| `avgESGVC` | `portfolio.reduce((a, c) => a + c.esgVCScore, 0) / n;` |
| `totalGHG` | `portfolio.reduce((a, c) => a + c.lifecycleGHG, 0);` |
| `totalWater` | `portfolio.reduce((a, c) => a + c.waterFootprint, 0);` |
| `totalBio` | `portfolio.reduce((a, c) => a + c.biodiversityImpact, 0);` |
| `avgCircular` | `portfolio.reduce((a, c) => a + c.circularScore, 0) / n;` |
| `avgEUDR` | `portfolio.reduce((a, c) => a + c.eudrCompliance, 0) / n;` |
| `totalSC` | `portfolio.reduce((a, c) => a + c.supplyChainsMapped, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERT_TYPES`, `CARBON_MKTS`, `CRITICAL_MINERALS`, `HEATMAP_COMMODITIES`, `MODULES`, `PIE_COLORS`, `REGS`, `SCENARIO_PRESETS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Price Volatility (90d) | — | Bloomberg Commodity Index | Annualised 90-day realised volatility; energy commodities typically 30-55%, base metals 18-30% |
| Supply Disruption Probability | — | IEA / Oxford Economics | Probability of >10% supply shock within 24 months based on geopolitical and climate hazard models |
| Carbon Intensity | — | IPCC/IEA LCA Databases | Lifecycle GHG intensity per tonne of commodity produced and shipped to port |
| Commodity Climate VaR | — | NGFS/ECB | Value-at-risk attributable to climate physical and transition drivers at 95th percentile |
| Forward Curve Contango | — | CME/LME | Spot-to-12m futures spread indicating market expectation of supply/demand trajectory |
- **Bloomberg/CME price feeds** → Normalise to USD/tonne, compute 30/60/90d volatility → **PriceVol score per commodity**
- **IEA production region data** → Overlay IPCC hazard maps, compute disruption probability → **SupplyDisruption score**
- **GHG Protocol Scope 3 LCA databases** → Aggregate upstream extraction and transport emissions → **CarbonIntensity tCO₂e/t**

## 5 · Intermediate Transformation Logic
**Methodology:** TCFD Commodity Risk Composite
**Headline formula:** `CommodityRisk = w₁×PriceVol + w₂×SupplyDisruption + w₃×CarbonIntensity`

Price volatility is measured as 90-day realised vol scaled by commodity-specific VaR. Supply disruption probability is derived from geopolitical risk scores, climate hazard exposure of production regions, and logistics concentration indices. Carbon intensity (tCO₂e/tonne) follows GHG Protocol Scope 3 Category 1 for upstream raw material extraction.

**Standards:** ['TCFD 2021', 'IPCC AR6 WGII', 'IEA Commodity Markets']
**Reference documents:** TCFD Final Report 2021 â€” Commodity Risk Guidance; IEA Commodity Markets Review 2024; IPCC AR6 WGII Chapter 5 â€” Food, Fibre and Other Ecosystem Products; NGFS Phase 5 Scenarios â€” Physical Risk Transmission

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Make the composite a composite (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: the advertised TCFD composite
`CommodityRisk = w₁·PriceVol + w₂·SupplyDisruption + w₃·CarbonIntensity` is not
computed — `compositeRisk = 20 + seed(s·73)·60` is a single random draw, and all ~25
per-company metrics (externality cost, lifecycle GHG, CBAM exposure, ML confidence)
are independent PRNG draws. The hub's genuinely useful assets are its curated
reference tables (`CRITICAL_MINERALS`, `CARBON_MKTS`, `REGS`) and its registry of 21
child commodity modules. Evolution A builds the real composite from inputs the
platform already computes elsewhere, making the hub an aggregator instead of a
generator.

**How.** (1) PriceVol: 90-day realised vol from the EIA price series ingested for the
energy modules (wave 1). (2) SupplyDisruption: production-region concentration from
the curated `CRITICAL_MINERALS` supply-concentration fields plus hazard exposure from
the digital-twin composite scores of producing regions. (3) CarbonIntensity: the
per-commodity tCO₂e/tonne factors already living in the refdata emission-factor layer
(GHG Protocol Scope 3 Cat 1 basis, as the guide intends). (4) Documented default
weights w₁/w₂/w₃ with a UI override; delete every `seed()` company metric — portfolio
figures should come from actual holdings joined to commodity exposures, or display
honest empty states until a portfolio is loaded.

**Prerequisites (hard).** Full PRNG purge — this page is one of the heavier
fabrication surfaces in the slice (~25 seeded metrics/company); commodity exposure
mapping for portfolio companies must exist before company-level scores can be honest.
**Acceptance:** the composite decomposes into three cited sub-scores in the UI;
deleting the PRNG helpers breaks nothing rendered; a commodity's composite changes
when its underlying EIA vol series updates.

### 9.2 Evolution B — Commodity desk orchestrator across the 21 child modules (LLM tier 3)

**What.** The hub already holds a curated `MODULES` registry linking 21 specialist
commodity pages — it is architecturally the desk entry-point the roadmap's tier 3
describes. Evolution B makes it operational: "assess our copper exposure" routes to
`critical-minerals` for supply concentration, `commodity-derivatives-climate` for
hedging cost, `commodity-deforestation` for nature risk where relevant, and returns a
synthesized commodity risk memo with per-module citations — the hub's TCFD-export
promise fulfilled by composition rather than by a single page's seeds.

**How.** Routing knowledge per the roadmap: `module_tags.json` plus this hub's own
`MODULES` registry as the authoritative child list; each hop calls child-module
endpoints where they exist (several children are tier-B and contribute reference
context rather than computations — the orchestrator must distinguish, using each
child's Atlas provenance classes). Output renders through the report-studio layer as
the TCFD commodity-risk section. Every numeric carries its source module and endpoint.

**Prerequisites (hard).** Evolution A (the hub cannot orchestrate honestly while its
own composite is a random number); child-module endpoint coverage is uneven — the
orchestrator needs the Atlas endpoint map to know which children are callable versus
display-only. **Acceptance:** a copper memo whose every figure names its source
module; children without backends contribute only labelled reference facts; the
orchestrator refuses commodities absent from the registry.