# Green Building Code Finance
**Module ID:** `green-building-code-finance` · **Route:** `/green-building-code-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DM5 · **Sprint:** DM

## 1 · Overview
Analyses the financial implications of evolving building energy performance standards — EU Energy Performance of Buildings Directive (EPBD), US ASHRAE 90.1, and national net-zero building codes. Models compliance costs, retrofit investment requirements, and green building product market sizing.

> **Business value:** Essential for building product manufacturers, retrofit financing banks, real estate investors sizing EPBD compliance capex, and green bond issuers in the buildings sector. Provides EPBD compliance timeline modelling and retrofit investment economics for property portfolios.

**How an analyst works this module:**
- Model building stock EPC distribution and compliance gap
- Calculate EPBD minimum standard compliance costs by 2030
- Assess retrofit ROI by building type and depth
- Size green building materials/services market opportunity
- Generate EU EPBD-aligned renovation investment plan

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPLIANCE_BUCKETS`, `JURISDICTIONS`, `JURISDICTION_NAMES`, `KpiCard`, `REGIONS`, `TABS`, `TARGET_YEARS_BUCKET`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `TARGET_YEARS_BUCKET` | `['Near (≤2030)', 'Mid (2031-2040)', 'Long (2041-2050)'];` |
| `codeVer` | `2010 + Math.floor(sr(i * 7) * 14);` |
| `nzTarget` | `2025 + Math.floor(sr(i * 11) * 25);` |
| `retrofitYr` | `2025 + Math.floor(sr(i * 13) * 15);` |
| `energyStd` | `Math.round(30 + sr(i * 17) * 170);` |
| `embodiedC` | `Math.round(100 + sr(i * 19) * 400);` |
| `greenCertShare` | `+(5 + sr(i * 23) * 65).toFixed(1);` |
| `compliance` | `+(30 + sr(i * 29) * 70).toFixed(1);` |
| `enforcement` | `+(2 + sr(i * 31) * 8).toFixed(1);` |
| `retrofitFund` | `+(0.2 + sr(i * 37) * 9.8).toFixed(1);` |
| `newBuildComp` | `+(40 + sr(i * 41) * 60).toFixed(1);` |
| `strandedStock` | `+(5 + sr(i * 43) * 45).toFixed(1);` |
| `carbonSavings` | `+(0.1 + sr(i * 47) * 4.9).toFixed(2);` |
| `avgEnergy` | `filtered.length ? Math.round(filtered.reduce((s, j) => s + j.energyEfficiencyStandard, 0) / filtered.length) : 0;` |
| `totalRetrofitFund` | `filtered.reduce((s, j) => s + j.retrofitFunding, 0).toFixed(1);` |
| `totalCarbonSavings` | `filtered.reduce((s, j) => s + j.carbonSavingsFromCode, 0).toFixed(2);` |
| `energyByRegion` | `REGIONS.map(r => {` |
| `scatterCompliance` | `filtered.map(j => ({ x: j.complianceRate, y: j.carbonSavingsFromCode, name: j.name }));` |
| `retrofitByCountry` | `[...JURISDICTIONS.reduce((acc, j) => {` |
| `strandedByRegion` | `REGIONS.map(r => {` |
| `subsidized` | `j.retrofitFunding * (1 + retrofitSubsidy / 100);` |
| `val` | `(j.carbonSavingsFromCode * 1000 * carbonPrice / 1000).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPLIANCE_BUCKETS`, `JURISDICTION_NAMES`, `REGIONS`, `TABS`, `TARGET_YEARS_BUCKET`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU EPBD Renovation Wave | — | European Commission EPBD 2023 | EU Energy Performance of Buildings Directive targets renovation of 35M worst-performing buildings by 2030 |
| Average Deep Retrofit Cost | — | JRC Building Stock Analysis 2023 | Deep energy retrofit cost in EU varies €150–400/m² depending on building type and depth of measures |
| NZEB Premium | — | ECOFYS NZEB Cost Study 2022 | Nearly zero energy building construction costs 3–8% more than standard — rapidly closing gap with scale |
- **National building stock EPC databases** → Compliance gap analysis → **Buildings failing upcoming MEPS and required upgrade cost**
- **Construction cost databases + retrofit project data** → Compliance cost modelling → **Total market investment required for EPBD compliance by 2030**
- **Green building product market sizing** → Market opportunity → **Insulation, heat pump, glazing, smart controls demand from EPBD**

## 5 · Intermediate Transformation Logic
**Methodology:** Building Code Compliance Cost Model
**Headline formula:** `ComplianceCost = Σ [UpgradeRequired_i × CostPerUpgrade_i × BuildingStock_i]; RetrofitROI = (EnergySavings + CarbonSavings × CarbonPrice + ValueUplift) / RetrofitCost`

Compliance cost models mandatory EPC minimum ratings escalating 2025–2030; retrofit ROI includes energy savings, carbon credits, and green premium on asset value

**Standards:** ['EU Energy Performance of Buildings Directive (EPBD) 2023 Recast', 'IEA Energy Efficiency 2023', 'ASHRAE Standard 90.1-2022', 'World Green Building Council Net Zero Carbon Buildings Commitment']
**Reference documents:** EU Energy Performance of Buildings Directive Recast (EU) 2023/1791; IEA Energy Efficiency 2023 — Buildings Chapter; World Green Building Council Net Zero Carbon Buildings Commitment; ASHRAE Standard 90.1-2022 Energy Standard for Buildings

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The MODULE_GUIDES entry (EP-DM5) advertises a **Building Code
> Compliance Cost Model** — `ComplianceCost = Σ[UpgradeRequired_i × CostPerUpgrade_i × BuildingStock_i]`
> and `RetrofitROI = (EnergySavings + CarbonSavings×CarbonPrice + ValueUplift)/RetrofitCost`. **Neither
> formula is implemented.** The page instead seeds ~jurisdiction records with random code/energy/
> compliance/retrofit-funding fields, aggregates them by region, and offers two live sliders
> (`carbonPrice`, `retrofitSubsidy`) that apply simple linear transforms. It is a **building-code
> landscape dashboard**, not a compliance-cost or ROI engine. §8 specifies the missing cost model.

### 7.1 What the module computes

Each jurisdiction is seeded, then two interactive transforms are applied:
```js
// carbon value of code-driven savings ($M, at slider carbonPrice $/t):
val        = (carbonSavingsFromCode · 1000 · carbonPrice / 1000)        // = MtCO₂ · $/t
// subsidy-boosted retrofit funding:
subsidized = retrofitFunding · (1 + retrofitSubsidy/100)
```
Regional roll-ups: `avgEnergy = mean(energyEfficiencyStandard | region)`,
`totalRetrofitFund = Σ retrofitFunding`, `totalCarbonSavings = Σ carbonSavingsFromCode`,
`strandedByRegion`, and a compliance-vs-carbon-savings scatter (`scatterCompliance`).

### 7.2 Parameterisation / seed rubric

| Field | Generator | Range | Provenance |
|---|---|---|---|
| `codeVersion` | `2010 + ⌊sr(i·7)·14⌋` | 2010–2023 | synthetic |
| `netZeroTarget` | `2025 + ⌊sr(i·11)·25⌋` | 2025–2049 | synthetic |
| `energyEfficiencyStandard` | `⌊30 + sr(i·17)·170⌋` | 30–200 kWh/m² | synthetic (plausible EPC range) |
| `embodiedCarbon` | `⌊100 + sr(i·19)·400⌋` | 100–500 kgCO₂/m² | synthetic |
| `greenCertShare` | `5 + sr(i·23)·65` | 5–70% | synthetic |
| `complianceRate` | `30 + sr(i·29)·70` | 30–100% | synthetic |
| `retrofitFunding` | `0.2 + sr(i·37)·9.8` | $0.2–10B | synthetic |
| `strandedStock` | `5 + sr(i·43)·45` | 5–50% | synthetic |
| `carbonSavingsFromCode` | `0.1 + sr(i·47)·4.9` | 0.1–5 MtCO₂ | synthetic |

The only real-world anchors are the guide's reference points (EU EPBD "35M buildings by 2030",
deep-retrofit €150–400/m², NZEB +3–8%) — these are documentation, not code constants.

### 7.3 Calculation walkthrough

Seed jurisdictions → filter (region/target-year bucket) → aggregate. The `carbonPrice` slider scales the
carbon value of code-driven savings (`val`); the `retrofitSubsidy` slider inflates each jurisdiction's
retrofit funding (`subsidized`). Regional charts (`energyByRegion`, `strandedByRegion`,
`retrofitByCountry`) are means/sums over the filtered set.

### 7.4 Worked example

Jurisdiction with `carbonSavingsFromCode = 2.5 MtCO₂`, `retrofitFunding = $4.0B`, sliders
`carbonPrice = $80/t`, `retrofitSubsidy = 25%`:
`val = 2.5·1000·80/1000 = 2.5·80 = $200M` carbon value of the code's annual savings;
`subsidized = 4.0·(1 + 25/100) = 4.0·1.25 = $5.0B` subsidy-boosted funding. Both are one-line linear
scalings of seeded inputs — there is no building-stock × upgrade-cost convolution behind them.

### 7.5 Data provenance & limitations

- **All jurisdiction data is synthetic**, generated by `sr(seed)=frac(sin(seed+1)·10⁴)`.
- No compliance-cost model: the guide's `Σ[UpgradeRequired × CostPerUpgrade × Stock]` is absent, so the
  dashboard cannot answer "what will EPBD compliance cost this stock?".
- No retrofit ROI: energy saving, carbon value and value uplift are never combined against retrofit cost.
- Carbon `val` uses a single portfolio carbon price with no marginal-abatement or vintage structure.

**Framework alignment:** EU EPBD 2023 recast (renovation wave, MEPS, NZEB-from-2030), ASHRAE 90.1-2022,
WorldGBC Net-Zero Carbon Buildings Commitment, IEA Energy Efficiency — all named as the policy context the
seeded fields represent. EPC (A–G) and MEPS are the binding instruments; the module tracks their *presence*
(`codeVersion`, `complianceRate`) but not their *financial consequence*, which §8 supplies.

## 8 · Model Specification — Building-Code Compliance-Cost & Retrofit-ROI Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Quantify (a) the aggregate capital cost for a building stock to comply with escalating MEPS/EPBD minimum
ratings, and (b) the ROI of a deep retrofit at asset level. Serves lenders sizing EPBD compliance capex,
retrofit-financing banks, and green-bond issuers in the buildings sector.

### 8.2 Conceptual approach
Bottom-up stock model in the style of the **JRC EU Building Stock Observatory** and **IEA Energy
Efficiency** analysis: segment the stock by EPC band and archetype, compute the upgrade needed to clear
each future MEPS threshold, cost it from a retrofit-measure cost curve, and net the retrofit against energy,
carbon and asset-value benefits (mirroring CRREM's stranding-avoidance economics).

### 8.3 Mathematical specification
```
Per archetype/EPC-band segment s, for MEPS threshold at year y:
  Gap_s = max(0, EUI_s − MEPS_y)                                      (kWh/m² to close)
  UpgradeCost_s = f_cost(Gap_s) · Area_s        f_cost from measure cost curve (€/m²)
ComplianceCost(y) = Σ_s 1[EUI_s > MEPS_y] · UpgradeCost_s
Retrofit ROI (asset):
  EnergySaving = ΔEUI · Area · P_energy
  CarbonValue  = ΔEUI · Area · EF_grid · CarbonPrice
  ValueUplift  = ρ_green · AssetValue            (green premium on compliance)
  ROI = (EnergySaving·AF + CarbonValue·AF + ValueUplift) / RetrofitCost − 1     (AF = annuity factor)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `MEPS_y` | future minimum EUI | EPBD recast timeline / national MEPS |
| `f_cost` | €/m² by retrofit depth | JRC deep-retrofit cost study (€150–400/m²) |
| `EF_grid` | grid emission factor | IEA / national grid factors (platform refdata) |
| `CarbonPrice` | shadow/market price | EU ETS / internal (slider today) |
| `ρ_green` | value uplift on compliance | JLL/RICS green premium |
| `AF` | annuity factor | discount rate + horizon |

### 8.4 Data requirements
Stock: EPC-band distribution, floor area, archetype per jurisdiction (EU Building Stock Observatory —
free; national EPC registries). Costs: retrofit measure cost curves (JRC/BPIE). Benefits: energy price
forecasts (IEA), grid factors (platform), green-premium coefficients. The module currently seeds all of
these; real sources listed replace the seeds.

### 8.5 Validation & benchmarking plan
Reconcile aggregate ComplianceCost against published EPBD renovation-wave cost estimates (EC impact
assessment); validate retrofit ROI against realised deep-retrofit project economics; sensitivity to energy
price and carbon price; benchmark stranding-avoidance value against CRREM.

### 8.6 Limitations & model risk
Archetype segmentation drives everything — coarse EPC bands understate heterogeneity. Cost curves are
country- and time-specific and fall fast with scale. Rebound effects reduce realised energy savings.
Conservative fallback: bound ComplianceCost with low/high cost-curve scenarios and treat value uplift as
optional (report ROI with and without it).

## 9 · Future Evolution

### 9.1 Evolution A — Build the compliance-cost and retrofit-ROI models (analytics ladder: rung 1 → 2)

**What.** §7 flags that both headline formulae are absent: the guide's `ComplianceCost = Σ[UpgradeRequired_i × CostPerUpgrade_i × BuildingStock_i]` and `RetrofitROI = (EnergySavings + CarbonSavings × CarbonPrice + ValueUplift)/RetrofitCost` are not implemented — each jurisdiction's data is `sr()`-seeded and only two lightweight interactive transforms are applied, with the §8 model spec marked "not yet implemented in code." Evolution A builds both models over real building-code data: compliance cost from the mandatory EPC-minimum-rating escalation (EPBD 2025–2030, ASHRAE 90.1) applied to real building stock by upgrade type, and retrofit ROI aggregating energy savings, carbon-credit value, and green-premium value uplift against retrofit cost — grounding the building stock in the platform's EPC dataset (wave-1) rather than seeded jurisdiction rows.

**How.** (1) A backend route computing compliance cost per the §5 sum over building-stock segments and required upgrades, with EPC-minimum escalation schedules per jurisdiction. (2) Retrofit ROI from energy savings (EUI reduction × energy price), carbon savings × a carbon-price input, and value uplift, over retrofit cost. (3) Building stock and EPC distributions from the EPC feed by jurisdiction/type.

**Prerequisites.** Building-stock and EPC-distribution data by jurisdiction (wave-1 EPC source); upgrade-cost and escalation-schedule references. The seeded jurisdiction data (§7-flagged) replaced. **Acceptance:** compliance cost recomputes from the §5 stock sum; retrofit ROI reproduces its formula from energy/carbon/uplift inputs; changing the carbon price moves ROI; no `sr()` jurisdiction figure remains.

### 9.2 Evolution B — Building-code compliance copilot (LLM tier 2)

**What.** A copilot for real-estate and policy analysts: "what will EPBD minimum-rating escalation cost our EU portfolio by 2030, and which retrofits clear a positive ROI at €80/t carbon?" tool-calls the Evolution A compliance-cost and retrofit-ROI endpoints, narrating the cost trajectory and prioritised retrofits.

**How.** Tier-2 tool-calling over the compliance/ROI endpoints; the grounding corpus is §5/§7 (EU EPBD, US ASHRAE 90.1, national net-zero codes, the retrofit-ROI components). The copilot's value is translating regulatory escalation into a costed retrofit programme with carbon-price sensitivity. Guardrail, pre-Evolution-A: the guide's models are unbuilt and data seeded, so it must refuse compliance-cost and ROI figures. Every figure validated against tool output.

**Prerequisites.** Evolution A (no models today); EPC/stock data; corpus embedding. **Acceptance:** post-Evolution-A, every compliance-cost and ROI figure traces to a tool call; the carbon-price what-if reproduces the ROI formula; pre-Evolution-A the copilot declines quantitative asks and answers only on regulatory facts.