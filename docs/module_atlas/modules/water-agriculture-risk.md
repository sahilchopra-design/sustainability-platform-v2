# Water Agriculture Risk
**Module ID:** `water-agriculture-risk` · **Route:** `/water-agriculture-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Water stress impact on agricultural supply chains; quantifies crop yield risk, food price volatility and supply disruption from water scarcity across sourcing geographies using WRI Aqueduct Agricultural data.

> **Business value:** Water scarcity already reduces global crop yields by 7–14% annually; climate change will increase water-stressed agricultural area by 40% by 2050, with implications for food security and commodity price volatility.

**How an analyst works this module:**
- Map agricultural sourcing to originating river basins
- Apply WRI Aqueduct water stress scores by basin
- Weight by crop type water sensitivity and yield impact coefficients
- Compute AWRS and supply disruption VaR
- Report to TNFD and CSRD biodiversity and water disclosures

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AWS_LEVELS`, `Badge`, `COLORS`, `CROPS`, `Card`, `DROUGHT_SEVERITY`, `KPI`, `Pill`, `REGIONS`, `REGION_DATA`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Punjab, India','Murray-Darling, AU','Central Valley, US','Nile Delta, EG','North China Plain','Ogallala, US','Mekong Delta, VN','São Francisco, BR','Indus Basin, PK','Po Valley, IT','Ganges Plain, IN','Ebro Basin, ES',` |
| `waterStress` | `+(1+s1*4).toFixed(2);` |
| `agWithdrawal` | `Math.floor(40+s2*50);` |
| `irrigEfficiency` | `Math.floor(30+s3*55);` |
| `groundwaterDepletion` | `+(0+s4*8).toFixed(1);` |
| `annualRainfall` | `Math.floor(100+s5*1400);` |
| `irrigArea` | `Math.floor(5000+s6*95000);` |
| `primaryCrop` | `CROPS[Math.floor(sr(i*29+13)*CROPS.length)];` |
| `secondaryCrop` | `CROPS[Math.floor(sr(i*31+15)*CROPS.length)];` |
| `awsCert` | `AWS_LEVELS[Math.floor(sr(i*37+17)*AWS_LEVELS.length)];` |
| `droughtFreq` | `+(0.5+sr(i*41+19)*3.5).toFixed(1);` |
| `cropWaterBlue` | `Math.floor(200+sr(i*43+21)*1800);` |
| `cropWaterGreen` | `Math.floor(500+sr(i*47+23)*3500);` |
| `cropWaterGrey` | `Math.floor(50+sr(i*53+25)*450);` |
| `yieldRisk` | `Math.floor(5+sr(i*59+27)*45);` |
| `revenueAtRisk` | `Math.floor(10+sr(i*61+29)*200);` |
| `waterPrice` | `+(0.1+sr(i*67+31)*2.5).toFixed(2);` |
| `reductionTarget` | `Math.floor(10+sr(i*71+33)*30);` |
| `currentReduction` | `Math.floor(sr(i*73+35)*reductionTarget);` |
| `circularWater` | `Math.floor(sr(i*79+37)*40);` |
| `investmentNeeded` | `Math.floor(5+sr(i*83+39)*95);` |
| `yearlyStress` | `YEARS.map((_,yi)=>+(waterStress+sr(i*89+yi*17)*0.3*yi/YEARS.length).toFixed(2));` |
| `yearlyYield` | `YEARS.map((_,yi)=>Math.floor(100-yieldRisk*0.3+sr(i*97+yi*13)*10));` |
| `cropWaterData` | `CROPS.map((c,ci)=>({name:c,blue:Math.floor(200+sr(ci*17+1)*1800),green:Math.floor(500+sr(ci*23+3)*3500),grey:Math.floor(50+sr(ci*29+5)*450),total:0}));` |
| `dir` | `sortDir==='asc'?1:-1;` |
| `stats` | `useMemo(()=>{ const avgStress=filtered.length?+(filtered.reduce((a,r)=>a+r.waterStress,0)/filtered.length).toFixed(2):0;` |
| `totalIrrigArea` | `filtered.reduce((a,r)=>a+r.irrigArea,0);` |
| `avgEfficiency` | `filtered.length?Math.floor(filtered.reduce((a,r)=>a+r.irrigEfficiency,0)/filtered.length):0;` |
| `highRiskPct` | `filtered.length?Math.floor(filtered.filter(r=>r.waterStress>2.5).length/filtered.length*100):0;` |
| `totalRevAtRisk` | `filtered.reduce((a,r)=>a+r.revenueAtRisk,0);` |
| `avgDepletion` | `filtered.length?+(filtered.reduce((a,r)=>a+r.groundwaterDepletion,0)/filtered.length).toFixed(1):0;` |
| `riskDistribution` | `useMemo(()=>['Low','Medium','High','Extremely High'].map(r=>({name:r,value:filtered.filter(reg=>reg.riskLevel===r).length})),[filtered]);` |
| `stressTrend` | `useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),avgStress:filtered.length?+(filtered.reduce((a,r)=>a+r.yearlyStress[yi],0)/filtered.length).toFixed(2):0})),[filtered]);` |
| `PAGE_SIZE` | `12;const totalPages=Math.ceil(filtered.length/PAGE_SIZE);const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);` |
| `sorted` | `[...cropWaterData].sort((a,b)=>b.total-a.total);` |
| `impactData` | `filtered.slice(0,20).map(r=>{const base=r.yieldRisk;const sev=sevIdx*15;const dur=durMo*5;const impact=Math.min(95,Math.floor(base+sev+dur+sr(r.id*23)*10));return{name:r.name.length>18?r.name.slice(0,18)+'...':r.name,yie` |
| `scenarioMatrix` | `DROUGHT_SEVERITY.map((sev,si)=>[3,6,9,12].map(dur=>({severity:sev,duration:dur+'mo',avgYieldLoss:Math.floor(10+si*15+dur*2+sr(si*17+dur*11)*8)}))).flat();` |
| `historicalDroughts` | `[{year:'2012',region:'US Midwest',yieldImpact:-27,econLoss:35},{year:'2015',region:'India (El Niño)',yieldImpact:-18,econLoss:22},{year:'2018',region:'Europe Heat',yieldImpact:-20,econLoss:28},{year:'2019',region:'Austra` |
| `awsBreakdown` | `AWS_LEVELS.map(l=>({level:l,count:filtered.filter(r=>r.awsCert===l).length}));` |
| `targetProgress` | `filtered.map(r=>({name:r.name.length>18?r.name.slice(0,18)+'...':r.name,target:r.reductionTarget,current:r.currentReduction,gap:r.reductionTarget-r.currentReduction}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AWS_LEVELS`, `COLORS`, `CROPS`, `DROUGHT_SEVERITY`, `REGIONS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| High Water Stress Sourcing | — | WRI Aqueduct | Proportion of agricultural sourcing from basins with WRI Aqueduct score >3 (High or Extremely High stress). |
| Yield Loss Exposure | — | IPCC AR6 WG2 | Expected average crop yield reduction in sourcing basins under 2°C warming scenario by 2030. |
| Supply Disruption VaR | — | AWRS Model | Value at risk from agricultural supply disruption due to water stress at 95th percentile. |
- **Sourcing Geographies, WRI Aqueduct Data, Crop Yield Models, FAO AQUASTAT** → AWRS engine + yield impact modelling + supply disruption VaR → **Agricultural water risk dashboard, TNFD water disclosures, supply chain resilience report**

## 5 · Intermediate Transformation Logic
**Methodology:** Agricultural Water Risk Score
**Headline formula:** `AWRS = Water Stress × Crop Sensitivity × Sourcing Concentration`

Composite risk score combining basin-level water stress, crop-specific sensitivity to water deficit and supply chain sourcing concentration in stressed basins.

**Standards:** ['WRI Aqueduct Agriculture 2022', 'FAO AQUASTAT']
**Reference documents:** WRI Aqueduct Agricultural Water Risk Framework 2022; FAO AQUASTAT Global Water Statistics; IPCC AR6 WG2 Chapter 5: Food Systems; TNFD Beta Framework Water Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide names an "Agricultural Water Risk Score"
> (`AWRS = Water Stress × Crop Sensitivity × Sourcing Concentration`). **No `AWRS` variable exists in
> code.** The page has no engine and no `sourcingConcentration` field at all — every displayed metric
> (water stress, yield risk, revenue at risk, crop-water footprint) is an independent synthetic field
> per region, not the guide's multiplicative composite. The module is a 40-region agricultural
> water-risk directory with a drought-impact simulator.

### 7.1 What the module computes

40 named agricultural regions (Punjab, Murray-Darling, Central Valley, Nile Delta, North China Plain,
Ogallala, Mekong Delta, São Francisco, Indus Basin, Po Valley, etc.), each independently seeded:
`waterStress` (1.0–5.0), `agWithdrawal` (40–90%), `irrigEfficiency` (30–85%), `groundwaterDepletion`
(0–8), `annualRainfall`, `irrigArea`, `primaryCrop`/`secondaryCrop`, `awsCert` (AWS Alliance for
Water Stewardship certification level), `droughtFreq`, blue/green/grey crop-water footprints
(`cropWaterBlue/Green/Grey`), `yieldRisk` (5–50%), `revenueAtRisk` ($10M–$210M), `waterPrice`,
`reductionTarget`/`currentReduction`, `circularWater`, `investmentNeeded`, and a 6-year `yearlyStress`/
`yearlyYield` trend.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `waterStress` | 1.0–5.0 | `1 + s1×4`, synthetic uniform, independent of region name plausibility |
| `agWithdrawal` | 40–90% | `40 + s2×50` |
| `yieldRisk` | 5–50% | `5 + sr(i·59+27)×45` |
| `revenueAtRisk` | $10M–$210M | `10 + sr(i·61+29)×200` |
| `cropWaterBlue/Green/Grey` | 200–2,000 / 500–4,000 / 50–500 m³/t | Synthetic, but plausible relative ordering (green > blue > grey, consistent with real water-footprint literature convention) |
| `awsCert` | `AWS_LEVELS` random pick | Synthetic |

The `cropWaterData` table (aggregated by crop, not region) independently re-derives blue/green/grey
footprints per crop using a *different* seed formula (`sr(ci·17+1)` etc.) than the per-region fields —
two different code paths computing conceptually the same quantity with no cross-check between them.

### 7.3 Calculation walkthrough

1. `stats` aggregates `filtered` regions: `avgStress`, `totalIrrigArea`, `avgEfficiency`,
   `highRiskPct` (share with `waterStress > 2.5`), `totalRevAtRisk`, `avgDepletion`.
2. **Drought scenario simulator** (`impactData`): for a selected severity index `sevIdx` and duration
   `durMo`, `impact = min(95, floor(base + sevIdx×15 + durMo×5 + sr(id·23)×10))` where `base = r.yieldRisk`
   — a linear severity/duration additive model with random noise, applied per region.
3. `scenarioMatrix` (Drought Severity × Duration grid) uses a *separate* formula:
   `avgYieldLoss = floor(10 + si×15 + dur×2 + sr(si·17+dur·11)×8)` — similar structure but different
   coefficients than `impactData`, so the standalone matrix and the region-level simulator would give
   different yield-loss estimates for nominally the same severity/duration inputs.
4. `historicalDroughts` — 6 hardcoded real-world drought events (2012 US Midwest, 2015 India El Niño,
   2018 Europe Heat, 2019 Australia, etc.) with real-looking `yieldImpact`/`econLoss` figures — the
   only genuinely-sourced-looking data in the file, though no citation is given for the exact numbers.

### 7.4 Worked example

For a region with `yieldRisk = 25%` (`base`), drought severity index `sevIdx = 2` (of the
`DROUGHT_SEVERITY` scale) and duration `durMo = 6` months:

```
impact = min(95, floor(25 + 2×15 + 6×5 + noise)) = min(95, floor(25+30+30+noise)) ≈ min(95, 85+noise)
```

At `sevIdx=2`, the severity and duration terms alone (60 points) already dominate the base yield risk
(25 points) — meaning the simulator's output is driven far more by the two slider inputs than by any
region-specific characteristic, undermining the premise that different regions should respond
differently to the same drought severity/duration based on their real vulnerability.

### 7.5 Data provenance & limitations

- **All 40 regions are synthetic** despite using real basin/region names; no linkage to WRI Aqueduct
  Agriculture, FAO AQUASTAT, or any other named data source exists in the code — the guide's cited
  sources are text-only references, not live data feeds or hardcoded lookup tables.
- **No AWRS multiplicative composite exists** — the guide's core methodology is absent.
- **Two independent, inconsistent formulas** compute drought-impact yield loss (`impactData` vs
  `scenarioMatrix`), which would give different answers for nominally identical inputs — a
  reconciliation bug a model-validation review would flag immediately.
- `historicalDroughts` figures, while plausible, are not sourced/cited to a specific dataset (e.g.
  EM-DAT, USDA) in the code.

**Framework alignment:** WRI Aqueduct Agriculture 2022 and FAO AQUASTAT (both named in the guide) are
**not implemented** as data sources or calculations — see the `water-risk-analytics` module's deep
dive for how real WRI Aqueduct data has been successfully wired into a sibling module and could be
reused here for the `waterStress` field at minimum.

## 9 · Future Evolution

### 9.1 Evolution A — Real Aqueduct stress data and a single, reconciled drought model (analytics ladder: rung 1 → 2)

**What.** Three documented gaps define the work. First, the 40 regions use real basin
names (Punjab, Murray-Darling, Ogallala) but `waterStress` is `1 + sr()×4` — §7.5
notes WRI Aqueduct is a text-only citation, while the sibling `water-risk-analytics`
module has already wired real Aqueduct data and "could be reused here for the
waterStress field at minimum". Second, the guide's headline
`AWRS = Water Stress × Crop Sensitivity × Sourcing Concentration` doesn't exist —
there isn't even a sourcing-concentration field. Third, §7.3/§7.5 flag two
inconsistent drought-impact formulas (`impactData` vs `scenarioMatrix` use different
coefficients for the same severity/duration inputs) and §7.4 shows slider terms
dominate region-specific vulnerability. Evolution A: (1) join the 40 named basins to
the sibling's Aqueduct lookup so stress scores are real; (2) implement AWRS with a
crop-sensitivity table (FAO yield-response factors, Ky) and a user-supplied sourcing-
weight vector; (3) collapse the two drought formulas into one, rescaled so regional
`yieldRisk` drives at least half the variance.

**How.** Reuse the sibling's data path rather than a new ingester; a small
`GET /api/v1/water-ag-risk/basins` route serving the joined records with provenance;
`historicalDroughts` rows get citations (EM-DAT/USDA) or a "platform-authored" label.

**Prerequisites.** The dual-formula reconciliation bug acknowledged; basin-name →
Aqueduct-geometry mapping table (40 rows, manual curation acceptable). **Acceptance:**
Punjab and Po Valley show their actual Aqueduct stress ratings; the scenario matrix
and per-region simulator agree for identical inputs; AWRS output changes when sourcing
concentration changes.

### 9.2 Evolution B — Sourcing-risk copilot for TNFD/CSRD water disclosures (LLM tier 2)

**What.** The module's stated outputs are TNFD and CSRD water disclosures plus supply-
chain resilience reporting. Evolution B is a tool-calling assistant for a procurement
or sustainability analyst: "we source 40% of our wheat from Punjab and 25% from the
Murray-Darling — score the portfolio and draft the TNFD water section." It calls
Evolution A's `GET /basins` and a `POST /awrs` endpoint with the user's sourcing
weights, then drafts disclosure text where every stress score, AWRS value, and
yield-risk figure is tool-sourced, mapped to the TNFD LEAP vocabulary the framework
expects and honestly separating Aqueduct-sourced fields from platform-modelled ones.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; grounding corpus
is this Atlas page plus the sibling water modules' pages (shared basin vocabulary).
The system prompt carries §7.5's provenance table so pre-Evolution-A questions get
refusals rather than synthetic numbers narrated as WRI data.

**Prerequisites (hard).** Evolution A — a disclosure copilot must never cite `sr()`
draws as Aqueduct scores; that is precisely the fabrication pattern the platform
purged. **Acceptance:** drafted TNFD text contains only tool-sourced figures with
per-field provenance; asked about a basin outside the 40-region set, the copilot says
so and offers the nearest covered basin rather than inventing a score.