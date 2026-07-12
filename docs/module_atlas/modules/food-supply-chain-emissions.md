# Food Supply Chain Emissions
**Module ID:** `food-supply-chain-emissions` · **Route:** `/food-supply-chain-emissions` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies agricultural GHG emissions across the food value chain with Scope 3 Category 1 granularity, enabling SBTi FLAG (Forest, Land and Agriculture) target setting and supplier engagement. Covers enteric fermentation, fertiliser application, land-use change, and post-farm processing emissions using commodity-specific emission factors.

> **Business value:** Supports food, beverage, and retail companies in setting science-based FLAG targets, prioritising supplier decarbonisation investments, and meeting CSRD ESRS E1/E4 land-use disclosure requirements. Provides the evidentiary basis for CDP forests questionnaire responses and TNFD nature disclosures.

**How an analyst works this module:**
- Upload commodity procurement data by supplier and map each commodity to IPCC Tier 2 emission factor categories.
- Apply LUC multipliers for high-deforestation-risk commodities (soy, palm, beef, cocoa, timber).
- Compute FLAG intensity and compare against SBTi sector benchmark to determine target gap.
- Prioritise supplier engagement actions using the supplier risk matrix ranked by emission contribution and data quality score.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `COMPANIES`, `COUNTRIES`, `Card`, `EMISSION_STAGES`, `FLAG_SECTORS`, `FOOD_CATEGORIES`, `KPI`, `PROTEIN_SOURCES`, `Pill`, `STAGE_COLORS`, `TABS`, `WASTE_STAGES`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `EMISSION_STAGES` | `['Farm/Agriculture','Processing','Transport','Packaging','Retail','Consumer/Waste'];` |
| `WASTE_STAGES` | `['Farm','Post-Harvest','Processing','Distribution','Retail','Food Service','Household'];` |
| `category` | `FOOD_CATEGORIES[Math.floor(s1*FOOD_CATEGORIES.length)];` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `revenue` | `+(0.5+s3*25).toFixed(1);` |
| `totalEmissions` | `Math.floor(200+s4*9800);` |
| `intensity` | `+(0.5+s5*8.5).toFixed(2);` |
| `stageBreakdown` | `EMISSION_STAGES.map((_,si)=>{const raw=sr(i*23+si*11);return si===0?Math.floor(raw*40+30):Math.floor(raw*20+5);});` |
| `stageTotal` | `stageBreakdown.reduce((a,v)=>a+v,0);` |
| `stageNorm` | `stageBreakdown.map(v=>Math.floor(v/stageTotal*100));` |
| `yearlyEmissions` | `YEARS.map((_,yi)=>Math.floor(totalEmissions*(1-yi*0.02+sr(i*29+yi*13)*0.05)));` |
| `scope3Cat1` | `Math.floor(totalEmissions*0.6+sr(i*31)*totalEmissions*0.2);` |
| `flagTarget` | `sr(i*37+11)>0.4;` |
| `flagProgress` | `flagTarget?Math.floor(sr(i*41+13)*60+10):0;` |
| `deforestationFree` | `sr(i*43+15)>0.5;` |
| `proteinIntensity` | `+(2+sr(i*47+17)*18).toFixed(1);` |
| `wasteRate` | `+(5+sr(i*53+19)*25).toFixed(1);` |
| `sbtiStatus` | `['Committed','Target Set','No Target','In Progress'][Math.floor(sr(i*59+21)*4)];` |
| `waterIntensity` | `Math.floor(500+sr(i*61+23)*4500);` |
| `landUse` | `+(0.5+sr(i*67+25)*15).toFixed(1);` |
| `packagingRecycled` | `Math.floor(sr(i*71+27)*80);` |
| `supplierCount` | `Math.floor(50+sr(i*73+29)*950);` |
| `traceability` | `Math.floor(30+sr(i*79+31)*70);` |
| `dir` | `sortDir==='asc'?1:-1;` |
| `stats` | `useMemo(()=>{ const totalE=filtered.reduce((a,c)=>a+c.totalEmissions,0);` |
| `avgIntensity` | `filtered.length?+(filtered.reduce((a,c)=>a+c.intensity,0)/filtered.length).toFixed(2):0;` |
| `flagPct` | `filtered.length?Math.floor(filtered.filter(c=>c.flagTarget).length/filtered.length*100):0;` |
| `avgWaste` | `filtered.length?+(filtered.reduce((a,c)=>a+c.wasteRate,0)/filtered.length).toFixed(1):0;` |
| `defFreePct` | `filtered.length?Math.floor(filtered.filter(c=>c.deforestationFree).length/filtered.length*100):0;` |
| `scope3Total` | `filtered.reduce((a,c)=>a+c.scope3Cat1,0);` |
| `categoryBreakdown` | `useMemo(()=>FOOD_CATEGORIES.map(cat=>{const cos=filtered.filter(c=>c.category===cat);return{name:cat.length>18?cat.slice(0,18)+'...':cat,fullName:cat,count:cos.length,totalE:cos.reduce((a,c)=>a+c.totalEmissions,0),avgInt` |
| `stageAvg` | `useMemo(()=>EMISSION_STAGES.map((s,si)=>({name:s,pct:filtered.length?Math.floor(filtered.reduce((a,c)=>a+c.stageBreakdown[si],0)/filtered.length):0})),[filtered]);` |
| `yearTrend` | `useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),totalKt:Math.floor(filtered.reduce((a,c)=>a+c.yearlyEmissions[yi],0)/1000),avgIntensity:filtered.length?+(filtered.reduce((a,c)=>a+(c.yearlyEmissions[yi]/c.totalEmissions` |
| `PAGE_SIZE` | `12;const totalPages=Math.ceil(filtered.length/PAGE_SIZE);const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);` |
| `marketTrend` | `YEARS.map((y,yi)=>({year:y.toString(),animalProtein:Math.floor(280-yi*3+sr(yi*23)*5),plantProtein:Math.floor(35+yi*8+sr(yi*29)*4),cultivatedMeat:Math.floor(0.5+yi*1.5+sr(yi*31)*0.8)}));` |
| `companyProtein` | `filtered.filter(c=>['Beef & Cattle','Dairy','Poultry & Eggs','Pork','Seafood & Aquaculture'].includes(c.category)).slice(0,15).map(c=>({name:c.name.slice(0,14),intensity:c.proteinIntensity,category:c.category}));` |
| `wasteByStage` | `WASTE_STAGES.map((s,si)=>({stage:s,pctLost:Math.floor(3+sr(si*17+1)*12),emissionsKt:Math.floor(50+sr(si*23+3)*200),economicLoss:Math.floor(10+sr(si*29+5)*80)}));` |
| `totalWasteE` | `wasteByStage.reduce((a,w)=>a+w.emissionsKt,0);` |
| `reductionTargets` | `[{target:'SDG 12.3 (50% by 2030)',current:18,gap:32},{target:'Champions 12.3',current:22,gap:28},{target:'EU Farm-to-Fork',current:15,gap:35},{target:'UNEP Food Waste Index',current:20,gap:30}];` |
| `companyWaste` | `filtered.slice(0,20).map(c=>({name:c.name.slice(0,14),waste:c.wasteRate,category:c.category}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRIES`, `EMISSION_STAGES`, `FLAG_SECTORS`, `FOOD_CATEGORIES`, `PROTEIN_SOURCES`, `STAGE_COLORS`, `TABS`, `WASTE_STAGES`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| FLAG Intensity (tCO2e/$M revenue) | — | SBTi FLAG / IPCC AR6 | Commodity-weighted land-based emission intensity; food & beverage sector median is approximately 350 tCO2e/$M; values above 600 signal high deforestation-linked commodities. |
| LUC Emissions Share (%) | — | Pendrill et al. 2022 | Proportion of total FLAG emissions attributable to land-use change; soy, palm, and beef supply chains typically exceed 40%. |
| Supplier Coverage (%) | — | Internal procurement data | Percentage of Tier 1 spend with supplier-reported emissions data; below 60% triggers modelled estimation using spend-based proxies. |
| SBTi FLAG Target Gap (tCO2e/yr) | — | SBTi FLAG tool | Annual absolute emissions reduction required to achieve the FLAG pathway by 2030 relative to base year. |
- **Procurement spend data by commodity and supplier** → Map to HS codes, assign IPCC Tier 2 EFs, apply LUC multipliers → **FLAG emissions by commodity and supplier**
- **Supplier sustainability questionnaires** → Validate against third-party deforestation databases (Global Forest Watch) → **Supplier data quality scores**
- **SBTi FLAG pathway benchmarks** → Compare portfolio FLAG intensity to sector pathway → **Annual target gap in absolute tCO2e**

## 5 · Intermediate Transformation Logic
**Methodology:** FLAG Emissions Intensity
**Headline formula:** `FLAG_intensity = Σ(commodity_i × EF_i × LUC_multiplier_i) / Revenue_USD`

Aggregates land-based emissions across sourced commodities using IPCC Tier 2 emission factors adjusted for land-use change multipliers derived from Pendrill et al. deforestation attribution model. Results are normalised by revenue to produce FLAG intensity metrics comparable to SBTi sector benchmarks.

**Standards:** ['SBTi FLAG Guidance v1.0', 'IPCC AR6 Agriculture Chapter', 'GHG Protocol Scope 3 Standard']
**Reference documents:** SBTi FLAG Guidance v1.0 (2022); Pendrill et al. (2022) â€” Disentangling the Numbers Behind Agriculture-Based Deforestation; IPCC AR6 WG3 Chapter 7 â€” Agriculture, Forestry and Other Land Use; GHG Protocol Scope 3 Evaluator

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Wire the imported emission factors into a real FLAG intensity (analytics ladder: rung 1 → 2)

**What.** §7 flags a precise defect: the guide's `FLAG_intensity = Σ(commodity_i × EF_i × LUC_multiplier_i)/Revenue_USD` is not computed — each company's `intensity` is a single `sr()`-seeded field, `totalEmissions`/`scope3Cat1`/land-use-change are independent random draws, and although the module imports `EMISSION_FACTORS` from `referenceData` it never uses them for the core maths. Evolution A closes exactly that loop: take commodity procurement volumes as input, multiply by the IPCC Tier-2 emission factors already imported, apply LUC multipliers for high-deforestation commodities (soy/palm/beef/cocoa/timber per Pendrill et al.), and normalise by revenue — producing a real FLAG intensity comparable to the SBTi sector benchmark.

**How.** (1) A commodity-procurement input model (supplier × commodity × volume) feeding the real `EMISSION_FACTORS` map. (2) LUC multipliers as a documented table keyed to commodity deforestation risk. (3) FLAG intensity and the SBTi target gap computed from these, replacing the seeded `intensity`; the stage split and Scope-3 share derived from the commodity mix rather than shaped random noise.

**Prerequisites.** The 60-company `genCompanies` panel replaced by real or user-entered procurement data (all §7-flagged synthetic); an LUC-multiplier reference (Pendrill attribution) in refdata. **Acceptance:** two companies with identical revenue but different commodity mixes produce different FLAG intensities reproducing the §5 formula from the imported EFs; no seeded `intensity` field feeds the headline.

### 9.2 Evolution B — FLAG target-setting and supplier-engagement copilot (LLM tier 2)

**What.** A copilot for food/beverage/retail sustainability teams: "what FLAG intensity target does SBTi imply for our dairy sourcing, and which suppliers should we engage first?" tool-calls the Evolution A intensity endpoint, ranks suppliers by emission contribution × data-quality (the supplier risk matrix the module already frames), and drafts the CSRD ESRS E1/E4 and CDP Forests disclosure narrative.

**How.** Tier-2 tool-calling over the FLAG intensity and supplier-ranking endpoints; the grounding corpus is §5/§7, which accurately encode SBTi FLAG v1.0, GHG Protocol Scope 3 Cat 1, EUDR deforestation-free commitments, and farm-stage LCA dominance. The copilot's value is translating a computed intensity gap into a prioritised supplier action list and disclosure-ready text, every tonne and intensity figure sourced from tool output and checked by the fabrication validator.

**Prerequisites.** Evolution A (no real intensities exist today); RBAC-scoped supplier data. **Acceptance:** every FLAG intensity, target, and supplier-contribution figure in the copilot's output traces to a tool call; asked for a commodity's exact emission factor, it returns the imported reference value, not an invented one.