# Regenerative Agriculture
**Module ID:** `regenerative-agriculture` · **Route:** `/regenerative-agriculture` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies soil carbon sequestration, biodiversity uplift, and water quality improvements from regenerative farming practices aligned to Verra VM0042 and SBTi FLAG.

> **Business value:** Provides the quantification infrastructure for regenerative agriculture carbon and biodiversity credit generation, aligned to Verra and SBTi FLAG standards.

**How an analyst works this module:**
- Register farm parcels and baseline soil carbon measurements.
- Record regenerative practice adoption (cover crops, no-till, etc.).
- Input annual soil sample and biodiversity monitoring data.
- Generate carbon credit and co-benefit quantification report.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CARBON_REGISTRIES`, `CERT_TYPES`, `COUNTRIES`, `CROP_TYPES`, `Card`, `KPI`, `MRV_METHODS`, `OPS`, `PRACTICES`, `Pill`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CROP_TYPES` | `['Wheat','Corn/Maize','Soybeans','Rice','Cotton','Coffee','Cocoa','Palm Oil','Sugarcane','Barley'];` |
| `MRV_METHODS` | `['Remote Sensing + Soil Sampling','Soil Core Lab Analysis','Eddy Covariance Flux Tower','Biogeochemical Modelling (DNDC)','Practice-Based Default Factors','Hybrid MRV Stack'];` |
| `crop` | `CROP_TYPES[Math.floor(s1*CROP_TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `hectares` | `Math.floor(s3*4500+50);` |
| `adoptedPractices` | `PRACTICES.filter((_,pi)=>sr(i*37+pi*7)>0.45);` |
| `soilCarbon` | `+(1.2+s4*3.8).toFixed(2);` |
| `annualSeq` | `+(0.3+s5*2.7).toFixed(2);` |
| `yieldImpact` | `+(-5+s6*25).toFixed(1);` |
| `inputCostChange` | `+(-30+s7*15).toFixed(1);` |
| `certifications` | `CERT_TYPES.filter((_,ci)=>sr(i*41+ci*11)>0.65);` |
| `creditRevenue` | `Math.floor(s8*120+10);` |
| `adoptionYear` | `2018+Math.floor(sr(i*43+17)*7);` |
| `soilOrgMatter` | `+(1.5+sr(i*47+19)*4.5).toFixed(1);` |
| `waterRetention` | `Math.floor(20+sr(i*53+21)*60);` |
| `biodivScore` | `Math.floor(30+sr(i*59+23)*70);` |
| `mrvMethod` | `MRV_METHODS[Math.floor(sr(i*61+25)*MRV_METHODS.length)];` |
| `registry` | `CARBON_REGISTRIES[Math.floor(sr(i*67+27)*CARBON_REGISTRIES.length)];` |
| `yearlyCarbon` | `YEARS.map((_,yi)=>+(soilCarbon+sr(i*71+yi*13)*0.5*yi).toFixed(2));` |
| `yearlyYield` | `YEARS.map((_,yi)=>{const base=100+yieldImpact*0.5;return Math.floor(base+sr(i*73+yi*17)*15*yi/YEARS.length);});` |
| `dir` | `sortDir==='asc'?1:-1;` |
| `stats` | `useMemo(()=>{ const totalHa=filtered.reduce((a,o)=>a+o.hectares,0);` |
| `avgSeq` | `filtered.length?+(filtered.reduce((a,o)=>a+o.annualSeq,0)/filtered.length).toFixed(2):0;` |
| `totalSeq` | `Math.floor(filtered.reduce((a,o)=>a+o.annualSeq*o.hectares,0));` |
| `avgScore` | `filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.practiceScore,0)/filtered.length):0;` |
| `advancedPct` | `filtered.length?Math.floor(filtered.filter(o=>o.transitionStage==='Advanced').length/filtered.length*100):0;` |
| `avgYieldImpact` | `filtered.length?+(filtered.reduce((a,o)=>a+o.yieldImpact,0)/filtered.length).toFixed(1):0;` |
| `certifiedPct` | `filtered.length?Math.floor(filtered.filter(o=>o.certifications.length>0).length/filtered.length*100):0;` |
| `totalCredRev` | `Math.floor(filtered.reduce((a,o)=>a+o.creditRevenue*o.hectares/1000,0));` |
| `practiceAdoption` | `useMemo(()=>PRACTICES.map(p=>({name:p,count:filtered.filter(o=>o.practices.includes(p)).length,pct:filtered.length?Math.floor(filtered.filter(o=>o.practices.includes(p)).length/filtered.length*100):0})).sort((a,b)=>b.cou` |
| `cropBreakdown` | `useMemo(()=>CROP_TYPES.map(c=>{const ops=filtered.filter(o=>o.crop===c);return{name:c,count:ops.length,avgSeq:ops.length?+(ops.reduce((a,o)=>a+o.annualSeq,0)/ops.length).toFixed(2):0,totalHa:ops.reduce((a,o)=>a+o.hectare` |
| `countryBreakdown` | `useMemo(()=>COUNTRIES.map(c=>{const ops=filtered.filter(o=>o.country===c);return{name:c,count:ops.length,totalHa:ops.reduce((a,o)=>a+o.hectares,0)};}).filter(c=>c.count>0).sort((a,b)=>b.totalHa-a.totalHa),[filtered]);` |
| `stageBreakdown` | `useMemo(()=>['Early','Intermediate','Advanced'].map(s=>({name:s,value:filtered.filter(o=>o.transitionStage===s).length})),[filtered]);` |
| `yearTrend` | `useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),avgCarbon:filtered.length?+(filtered.reduce((a,o)=>a+o.yearlyCarbon[yi],0)/filtered.length).toFixed(2):0,totalSeq:Math.floor(filtered.reduce((a,o)=>a+o.yearlyCarbon[yi]*o` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `paged` | `filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);` |
| `mrvBreakdown` | `MRV_METHODS.map(m=>{const ops=filtered.filter(o=>o.mrvMethod===m);return{name:m.length>25?m.slice(0,25)+'...':m,fullName:m,count:ops.length,avgSeq:ops.length?+(ops.reduce((a,o)=>a+o.annualSeq,0)/ops.length).toFixed(2):0,` |
| `carbonDepthProfile` | `[{depth:'0-10cm',stock:35},{depth:'10-30cm',stock:28},{depth:'30-50cm',stock:18},{depth:'50-100cm',stock:12},{depth:'100-150cm',stock:7}];` |
| `seqByPractice` | `PRACTICES.map((p,pi)=>({name:p.length>12?p.slice(0,12)+'...':p,avgSeq:+(0.5+sr(pi*23+7)*2.5).toFixed(2),maxSeq:+(1.5+sr(pi*29+11)*3.5).toFixed(2),minSeq:+(0.1+sr(pi*31+13)*1.0).toFixed(2)}));` |
| `paybackData` | `filtered.map(o=>({name:o.name.slice(0,15),payback:+o.paybackYears,yieldImpact:o.yieldImpact,inputSaving:-o.inputCostChange,creditRev:o.creditRevenue}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_REGISTRIES`, `CERT_TYPES`, `COLORS`, `COUNTRIES`, `CROP_TYPES`, `MRV_METHODS`, `PRACTICES`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg SOC Change (tCO₂e/ha/yr) | — | Soil Sampling Programme | Mean annual soil carbon accumulation rate across enrolled regenerative agriculture parcels. |
| Biodiversity Score Uplift | — | LIFE Biodiversity Index | Improvement in field-level biodiversity index score after regenerative practice adoption (3-year avg). |
| Water Quality Improvement (%) | — | Catchment Monitoring | Reduction in nitrate runoff from enrolled fields versus conventional control parcels. |
- **Soil sample data + satellite land cover + practice records** → SOC stock change calculation; biodiversity scoring; water quality modelling → **Carbon sequestration certificates and co-benefit impact report**

## 5 · Intermediate Transformation Logic
**Methodology:** Soil Carbon Stock Change
**Headline formula:** `ΔSOC = (SOC_t1 – SOC_t0) × BD × d × (44/12)`

Change in soil organic carbon stock converted to CO₂ equivalent using bulk density and soil depth measurements.

**Standards:** ['IPCC 2006 GL Vol. 4 Agriculture', 'Verra VM0042']
**Reference documents:** Verra VM0042 Improved Agricultural Land Management Methodology; SBTi FLAG Guidance v1.0 (2022); IPCC 2006 Guidelines for National GHG Inventories Volume 4

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is **"Soil Carbon Stock
> Change"**: `ΔSOC = (SOC_t1 − SOC_t0) × BD × d × (44/12)` — the IPCC 2006 Guidelines Vol. 4 Tier-1
> method, converting a measured change in soil organic carbon concentration to CO₂e using bulk
> density (`BD`), sampling depth (`d`), and the CO₂:C molecular-weight ratio (44/12 ≈ 3.667). **None
> of this formula exists in the code.** There is no `bulkDensity` or `samplingDepth` field, no
> `SOC_t0`/`SOC_t1` baseline-vs-current comparison, and no `×44/12` conversion anywhere in the
> file — `soilCarbon` and `annualSeq` are independent seeded-random draws per farm, not derived
> from any stock-change calculation. The sections below document what the code actually computes:
> a descriptive practice-adoption tracker with randomly-assigned sequestration, yield, and
> carbon-credit-revenue figures.

### 7.1 What the module computes

80 synthetic farm operations across 10 crops and 20 countries each adopt a random subset of 10
regenerative practices, then carry independently-seeded soil, yield, economic and MRV attributes:

```js
adoptedPractices = PRACTICES.filter(p => sr(seed) > 0.45)                // ~55% adoption chance per practice
soilCarbon  = 1.2 + s4×3.8            // %  (t0 snapshot, not a stock-change delta)
annualSeq   = 0.3 + s5×2.7            // tCO2e/ha/yr — direct random draw
yieldImpact = -5 + s6×25              // % change vs conventional (-5% to +20%)
practiceScore = adoptedPractices.length / 10 × 100
transitionStage = practices≥5 'Advanced' : ≥3 'Intermediate' : else 'Early'
paybackYears = 1 + sr()×8             // years to breakeven on transition capex
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Practice adoption threshold | `sr(seed) > 0.45` (~55% chance per practice, independent per practice) | Synthetic — no correlation between practices (e.g. adopting No-Till doesn't raise the odds of adopting Cover Crop, though in reality these are frequently bundled) |
| `soilCarbon` range | 1.2–5.0% | Synthetic — plausible order of magnitude for topsoil SOC%, not tied to any baseline survey |
| `annualSeq` range | 0.3–3.0 tCO2e/ha/yr | Synthetic — the *range* overlaps published regenerative-ag sequestration literature (typically 0.1–3 t/ha/yr depending on practice/soil/climate), but the value here is drawn independently of `soilCarbon`, adopted practices, or crop type |
| `yieldImpact` range | −5% to +20% | Synthetic — directionally consistent with regen-ag literature showing yield can dip short-term then recover/improve, but not derived from `adoptionYear` or transition stage |
| `paybackYears` range | 1–9 years | Synthetic |
| `carbonPrice` range | $15–60/t | Synthetic — broadly in range of voluntary soil-carbon credit prices (Verra/Gold Standard agricultural methodologies typically $10–40+/t) |
| Transition stage thresholds | ≥5 practices Advanced, ≥3 Intermediate, else Early | UI heuristic, not sourced to a named maturity framework |

### 7.3 Calculation walkthrough

1. **Per-farm generation** (80 rows, `genOps(80)`): 8 base seeds (`s1`–`s8`) drive crop, country,
   hectares, practice adoption (10 independent threshold draws), soil carbon %, annual
   sequestration, yield impact, input cost change, certifications (8 independent threshold draws),
   credit revenue, adoption year. A further ~10 seeds set soil organic matter, water retention,
   biodiversity score, MRV method, registry, 8-year `yearlyCarbon`/`yearlyYield` trajectories,
   payback years, carbon price, insetting eligibility, verification status, and lat/long.
2. **`practiceScore`**: simple count-based completeness score (`adoptedPractices.length/10×100`),
   not weighted by which practices are adopted (No-Till and Agroforestry count equally despite very
   different real-world sequestration potential).
3. **`yearlyCarbon`** (8-year trajectory, 2019–2026): `soilCarbon + sr(seed)×0.5×yearIndex` — an
   upward-drifting noise series anchored to the farm's own `soilCarbon` snapshot, not a genuine
   annual re-measurement.
4. **`yearlyYield`**: `base=100+yieldImpact×0.5` then drifts up by `sr()×15×yi/8` — again an
   assumed improving trend, not measured.
5. **Filters & aggregates**: crop/country/practice/MRV-method/payback-max filters subset `OPS`
   before every KPI (`totalHa`, `avgSeq`, `totalSeq = Σ(annualSeq×hectares)`, `avgScore`,
   `advancedPct`, `avgYieldImpact`, `certifiedPct`, `totalCredRev = Σ(creditRevenue×hectares/1000)`).
6. **Practice adoption breakdown**: count and % of filtered farms adopting each of the 10
   practices, sorted descending.
7. **`seqByPractice`** (Economic Analysis tab): an *independently seeded* per-practice avg/max/min
   sequestration table (`0.5+sr(pi×23+7)×2.5` etc.) — disconnected from any individual farm's own
   `annualSeq`, i.e. two separate, non-reconciled sequestration figures exist for the same
   practices (per-farm random draw vs per-practice random draw).

### 7.4 Worked example

Farm `i=0` (`s1=sr(1)`, `s4=sr(7)`, `s5=sr(9)`, `s6=sr(11)`):

| Field | Formula | Illustrative result |
|---|---|---|
| `crop` | `CROP_TYPES[floor(sr(1)×10)]`, `sr(1)=frac(sin(2)×10⁴)≈0.9200` | index 9 → **Barley** |
| `hectares` | `floor(sr(5)×4500+50)` | e.g. **2,100 ha** |
| `soilCarbon` | `1.2+sr(7)×3.8` | `sr(7)≈0.6570` → `1.2+2.50=` **3.70%** |
| `annualSeq` | `0.3+sr(9)×2.7` | `sr(9)≈0.4121` → `0.3+1.11=` **1.41 tCO2e/ha/yr** |
| `yieldImpact` | `-5+sr(11)×25` | `sr(11)≈0.6603` → `-5+16.5=` **+11.5%** |
| `adoptedPractices` | 10 independent `sr(37+pi×7)>0.45` checks | e.g. 6 of 10 adopted |
| `practiceScore` | `6/10×100` | **60** |
| `transitionStage` | `6≥5` | **Advanced** |
| Farm sequestration (portfolio contribution) | `annualSeq × hectares` | `1.41 × 2,100 =` **2,961 tCO2e/yr** |
| Credit revenue | `creditRevenue × hectares / 1000` | e.g. at `creditRevenue=$70/ha`: `70×2,100/1000=` **$147k/yr** |

### 7.5 Certification & MRV rubric (descriptive, not scored)

| Category | Options |
|---|---|
| Certifications (0–8 possible per farm) | Organic USDA, Regenerative Organic Certified, Rainforest Alliance, Fair Trade, Carbon Verified, Soil Health Certified, EU Organic, Demeter Biodynamic |
| MRV method (1 of 6, random) | Remote Sensing+Soil Sampling, Soil Core Lab Analysis, Eddy Covariance Flux Tower, Biogeochemical Modelling (DNDC), Practice-Based Default Factors, Hybrid MRV Stack |
| Carbon registry (1 of 7, random) | Verra VCS, Gold Standard, ACR, CAR, Puro.earth, CarbonCure, Nori |

No MRV-method-specific uncertainty or confidence discount is applied to `annualSeq` despite the
6 listed methods having materially different real-world measurement precision (e.g. eddy
covariance flux towers are far more precise, and expensive, than practice-based default factors).

### 7.6 Companion analytics

Practice Tracker (filterable 80-farm table + practice adoption bar), Soil Carbon Calculator
(8-year trajectory chart, depth-profile illustration, MRV breakdown), Economic Analysis
(per-practice sequestration min/avg/max, payback vs yield-impact vs input-saving scatter, credit
revenue), Certification & Markets (registry/certification distribution).

### 7.7 Data provenance & limitations

- **All 80 farms are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; farm names are
  templated (`{name} {n}`), not real operations.
- No IPCC Tier-1 SOC stock-change formula (`ΔSOC×BD×d×44/12`) is implemented despite being the
  guide's own named methodology — soil carbon, sequestration rate, and yield impact are each
  independent random draws with no causal link to which practices a farm has actually adopted.
- The 8-year `yearlyCarbon`/`yearlyYield` trajectories assume improvement is guaranteed (drift is
  always upward), which does not reflect real transition risk (yield dips, sequestration
  saturation after ~10-20 years per IPCC guidance, weather variability).
- Per-farm `annualSeq` and the separate per-practice `seqByPractice` table are not reconciled —
  a farm practicing No-Till + Cover Crop does not have its `annualSeq` built from those two
  practices' individual contributions.
- MRV method is cosmetic — no measurement-uncertainty discount is applied despite real MRV methods
  varying enormously in precision and cost.

**Framework alignment:** IPCC 2006 Guidelines Vol. 4 (Agriculture) — the Tier-1 stock-change
formula is named in the guide but not implemented; a real implementation would need baseline
(`SOC_t0`) vs current (`SOC_t1`) paired soil samples, bulk density, and sampling depth, none of
which exist in this schema · Verra VM0042 (Improved Agricultural Land Management) — registry name
appears in the dropdown list, methodology (baseline stratification, dynamic/static baselines,
uncertainty deductions) is not implemented · SBTi FLAG — referenced in the guide as sector
guidance context, not computed against any farm's emissions/land-use pathway in this file.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the IPCC Tier-1 SOC stock-change chain (analytics ladder: rung 1 → 2)

**What.** §7's flag is total: the guide's own methodology — `ΔSOC = (SOC_t1 − SOC_t0) × BD × d × (44/12)`, IPCC 2006 Vol. 4 Tier 1 — is absent; there is no bulk-density or depth field, no baseline comparison, no 44/12 conversion. `soilCarbon` and `annualSeq` are independent draws with no causal link to which practices a farm adopted, the per-practice `seqByPractice` table is unreconciled with per-farm totals, the 8-year trajectories drift upward unconditionally (ignoring the sequestration saturation IPCC documents at ~10–20 years), and the MRV method is cosmetic with no uncertainty discount. Evolution A implements the stock-change chain with practice-derived sequestration and MRV-tiered uncertainty.

**How.** (1) Farm schema gains the missing physical fields: `soc_t0_pct`, `soc_t1_pct`, `bulk_density`, `sampling_depth_cm`, sample dates; `POST /api/v1/regen-ag/soc-change` computes the Tier-1 formula exactly, per parcel. (2) Where measurements are absent, `annualSeq` builds bottom-up from adopted practices via a documented per-practice factor table (IPCC/VM0042 default factors), reconciling the two currently disconnected data structures — a No-Till + Cover Crop farm's total is the sum of its parts with a declared interaction cap. (3) Each MRV method carries an uncertainty percentage applying a VM0042-style conservativeness deduction to creditable tonnes. (4) Trajectories gain saturation (asymptotic to an equilibrium SOC) instead of unconditional drift.

**Prerequisites.** Practice-factor table curated with citations; the seeded farm book demoted to fixtures. **Acceptance:** a bench parcel with SOC 1.8%→2.1%, BD 1.3, depth 30cm reproduces the hand-computed ΔSOC×3.667; creditable tonnes decrease when a lower-precision MRV method is selected.

### 9.2 Evolution B — MRV documentation copilot for credit programmes (LLM tier 1 → 2)

**What.** Regenerative-ag credit generation is document-heavy: VM0042 monitoring reports, practice evidence, baseline justifications. The copilot supports programme managers: "what evidence does VM0042 require for our no-till claim on parcel 12?", "draft the monitoring-report section for this year's soil sampling round, flagging parcels where measured ΔSOC diverges from the practice-based estimate" — the divergence check being a genuinely useful computed comparison Evolution A makes possible.

**How.** Tier 1: RAG over this Atlas record plus VM0042/SBTi-FLAG methodology texts (§5 cites them) via the standard router; requirement answers cite methodology sections. Tier 2: parcel-specific questions call `POST /soc-change` and the practice-estimate endpoint, and the measured-vs-modelled divergence table is a canned tool. Drafted monitoring text quotes computed tonnes with their MRV uncertainty deduction attached — the copilot's standing rule is that creditable and measured quantities are never conflated. Before Evolution A, no quantitative copilot: today's sequestration figures are random draws attributed to templated farms.

**Prerequisites.** Evolution A; methodology texts licensed/chunked (Verra methodologies are public). **Acceptance:** monitoring-report numbers match endpoint output including deductions; evidence-requirement answers cite VM0042 clause anchors; divergent parcels are listed with both figures side by side.