# Infrastructure ESG
**Module ID:** `infrastructure-esg` · **Route:** `/infrastructure-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Monitors ESG performance across operating infrastructure portfolios spanning transport, energy, utilities, and digital sectors using GIIA Global ESG Reporting and Performance Framework indicators. Provides asset-level KPI tracking, carbon intensity benchmarking, safety performance monitoring, and regulatory compliance status.

> **Business value:** Enables infrastructure fund managers to monitor ESG performance across operating assets, identify environmental and safety underperformers, meet GIIA ESG reporting obligations, and demonstrate portfolio-level progress toward net-zero infrastructure aligned with IEA NZE sector pathways.

**How an analyst works this module:**
- Load the operating asset register with throughput, energy, water, and safety data for the reporting period.
- Review the GIIA ESG KPI dashboard comparing each asset against sector benchmarks and internal targets.
- Identify assets with carbon intensity above the IEA NZE pathway and flag for decarbonisation capex review.
- Generate the GIIA-format annual ESG performance report for GP/LP reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `COUNTRIES`, `CustomTooltip`, `DATA`, `IFC_CATEGORIES`, `PAGE_SIZE`, `RISK_LEVELS`, `SECTORS`, `STAGES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `n=>n>=1000?`$${(n/1000).toFixed(1)}B`:`$${n}M`;` |
| `sector` | `SECTORS[Math.floor(s1*SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `stage` | `STAGES[Math.floor(s3*STAGES.length)];` |
| `inv` | `Math.floor(100+s4*4900);` |
| `esgScore` | `Math.floor(30+s5*65);` |
| `gresbScore` | `s6>0.3?Math.floor(40+s7*55):null;` |
| `ifcPerf` | `Math.floor(40+s8*55);` |
| `riskLevel` | `RISK_LEVELS[Math.floor(s9*RISK_LEVELS.length)];` |
| `ifcCat` | `IFC_CATEGORIES[Math.floor(s10*IFC_CATEGORIES.length)];` |
| `carbonInt` | `Math.floor(20+sr(i*67+41)*480);` |
| `waterRisk` | `Math.floor(10+sr(i*71+43)*85);` |
| `bioImpact` | `Math.floor(5+sr(i*73+47)*90);` |
| `commScore` | `Math.floor(20+sr(i*79+53)*75);` |
| `safetyRate` | `Number((0.5+sr(i*83+59)*4.5).toFixed(2));` |
| `jobsCreated` | `Math.floor(50+sr(i*89+61)*4950);` |
| `compliance` | `sr(i*97+67)>0.5?'Full':sr(i*101+71)>0.3?'Partial':'Non-compliant';` |
| `sdgAlign` | `Math.floor(1+sr(i*103+73)*6);` |
| `badgeS` | `(bg,color)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg,border:`1px solid ${bg}33`});` |
| `csv` | `[keys.join(','),...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `sectorDist` | `useMemo(()=>{ const map={};filtered.forEach(r=>{map[r.sector]=(map[r.sector]\|\|0)+1;});` |
| `stageDist` | `useMemo(()=>{ const map={};filtered.forEach(r=>{map[r.stage]=(map[r.stage]\|\|0)+1;});` |
| `riskDist` | `useMemo(()=>{ const map={};filtered.forEach(r=>{map[r.riskLevel]=(map[r.riskLevel]\|\|0)+1;});` |
| `complianceDist` | `useMemo(()=>{ const map={};filtered.forEach(r=>{map[r.compliance]=(map[r.compliance]\|\|0)+1;});` |
| `scatterData` | `useMemo(()=>filtered.map(r=>({name:r.name,esg:r.esgScore,irr:r.irr,inv:r.inv,sector:r.sector})),[filtered]);` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({` |
| `avg` | `(key)=>filtered.reduce((a,r)=>a+r[key],0)/filtered.length;` |
| `countryInvData` | `useMemo(()=>{ const map={};filtered.forEach(r=>{map[r.country]=(map[r.country]\|\|0)+r.inv;});` |
| `sorted` | `[...filtered].sort((a,b)=>b.esgScore-a.esgScore);` |
| `qSize` | `Math.ceil(sorted.length/4);` |
| `qItems` | `sorted.slice(qi*qSize,(qi+1)*qSize);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRIES`, `IFC_CATEGORIES`, `RISK_LEVELS`, `SECTORS`, `STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Energy Infrastructure Carbon Intensity (gCO2/kWh) | — | GIIA KPI 4.1 / IEA | Grid electricity emission factor normalised by generation; renewables score <5 gCO2/kWh; gas peakers score 400â€“500; GIIA IEA NZE target is 30 gCO2/kWh by 2050. |
| Water Loss Rate (%) | — | IWA / GIIA KPI 3.2 | Non-revenue water as a percentage of total water produced; above 20% indicates significant infrastructure efficiency and environmental performance gap. |
| LTIFR (per million hours) | — | GIIA Safety KPI | Lost Time Injury Frequency Rate; infrastructure sector benchmark is below 1.0 for best-in-class operators; above 3.0 triggers social risk flag. |
| Renewable Energy Share (%) | — | GIIA KPI 4.2 | Proportion of portfolio electricity consumption from renewable sources; GIIA encourages 100% renewable electricity for own operations by 2030. |
- **Asset operational data (energy, water, throughput)** → Compute sector-specific carbon intensity, water loss rate, renewable share → **GIIA ESG KPIs by asset**
- **Health and safety incident records** → Calculate LTIFR and TRIFR, benchmark against sector peer data → **Safety performance dashboard**
- **IEA NZE pathway data by infrastructure sector** → Compare asset carbon intensity to pathway benchmark → **Decarbonisation gap by asset**

## 5 · Intermediate Transformation Logic
**Methodology:** Infrastructure Carbon Intensity
**Headline formula:** `CI_infra = Total_CO2e / Throughput_metric`

Normalises Scope 1 and 2 emissions by the sector-specific throughput metric (kWh generated for power, vehicle-km for transport, ML treated for water) to produce a comparable carbon intensity indicator. Intensity benchmarking against IEA NZE sector pathways identifies assets requiring accelerated decarbonisation investment.

**Standards:** ['GIIA ESG Reporting Framework KPI 4.1', 'GHG Protocol Scope 1/2/3 Standard', 'IEA NZE Sector Pathways']
**Reference documents:** GIIA â€” Global ESG Reporting and Performance Framework (2021); IEA Net Zero by 2050 (2021); IWA â€” Non-Revenue Water Handbook (2021); GHG Protocol â€” Scope 2 Guidance (2015)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a GIIA-framework **carbon
> intensity engine** — `CI_infra = Total_CO2e / Throughput_metric` — normalising Scope 1+2 by a
> sector throughput (kWh, vehicle-km, ML treated) and benchmarking against IEA NZE pathways.
> **The code computes no such intensity.** `carbonInt`, `esgScore`, `gresbScore`, `ifcPerf`,
> `waterRisk`, `safetyRate`, etc. are all **independent PRNG draws** — there is no throughput,
> no emissions total, no NZE benchmark. The module is a 50-project **synthetic ESG dashboard**
> (filter, paginate, chart, quartile-rank). Sections below document the code.

### 7.1 What the module computes

`genProjects(50)` fabricates 50 infrastructure projects. Every attribute is a scaled `sr()` draw
(`sr(s)=frac(sin(s+1)×10⁴)`), e.g.:

```js
inv       = floor(100 + s4*4900)                 // $M investment
esgScore  = floor(30 + s5*65)                    // 30–95
gresbScore= s6>0.3 ? floor(40 + s7*55) : null    // 70% coverage
ifcPerf   = floor(40 + s8*55)                    // IFC PS performance
carbonInt = floor(20 + sr(i*67+41)*480)          // 20–500 "gCO2/kWh" — a raw draw, NOT Total/Throughput
safetyRate= (0.5 + sr(i*83+59)*4.5).toFixed(2)   // LTIFR 0.5–5.0
compliance= sr(...)>0.5?'Full':sr(...)>0.3?'Partial':'Non-compliant'
```

The page then does honest aggregation over the filtered set: distribution counts by sector / stage /
risk / compliance, an ESG-vs-IRR scatter, a country-investment map, a four-quarter trend, and an
ESG-score quartile split (`sorted = [...filtered].sort(desc esgScore)`, quartile size `ceil(n/4)`).

### 7.2 Parameterisation / scoring rubric

| Attribute | Range / rule | Provenance |
|---|---|---|
| `esgScore`, `envScore`, `socScore`, `govScore` | 30–95 | Independent `sr()` draws — no pillar aggregation |
| `gresbScore` | 40–95 (30% null) | `sr()` draw; GRESB is *named* but not computed |
| `ifcPerf` / `ifcCat` | 40–95 / {A,B,C} | `sr()` draws mapped to IFC Performance Standard categories |
| `carbonInt` | 20–500 gCO₂/kWh | **Raw draw**, labelled as intensity but not `CO₂/throughput` |
| `waterRisk`, `bioImpact`, `commScore` | 10–95 / 5–95 / 20–95 | `sr()` draws |
| `safetyRate` (LTIFR) | 0.5–5.0 | `sr()` draw; guide benchmark <1.0 best-in-class |
| `compliance` | Full/Partial/Non-compliant | Two-threshold `sr()` gate |
| `sdgAlign` | 1–7 | `sr()` count of aligned SDGs |
| `esgColor` band | ≥75 green, ≥55 amber, else red | Display threshold |
| `riskColor` | Low/Med/High/Critical | Display threshold |

Sectors (8), countries (15), stages (4), risk levels (4), IFC categories (3) are fixed taxonomies.

### 7.3 Calculation walkthrough

1. `genProjects` seeds 10+ `sr()` variates per project → static 50-row `DATA`.
2. Filters (sector/country/stage/risk/search) produce `filtered`; `paged` slices 12/page.
3. Distribution memos bucket `filtered` by categorical fields for the pie/bar charts.
4. `scatterData` maps each project to `{esg, irr, inv}`; `trendData` averages quarterly score fields.
5. `countryInvData` sums `inv` by country; quartile view sorts by `esgScore` and splits into 4.
6. KPI cards report averages/counts over `filtered` (e.g. `avg(key) = Σ r[key]/filtered.length`).

### 7.4 Worked example

Take project *i = 0*: seeds `s5 = sr(17)`, etc. Suppose the draws give `esgScore = 72`,
`carbonInt = 210`, `safetyRate = 1.8`, `inv = $2,400M`, `irr = 9.2%`, `compliance = 'Partial'`.

| Output | Computation | Result |
|---|---|---|
| ESG band | 72 ∈ [55,75) | amber |
| Scatter point | `{esg:72, irr:9.2, inv:2400}` | plotted |
| Quartile | if 72 in top-25% of sorted esgScores | Q1/Q2 label |
| Contributes to KPI avg ESG | `+72` to Σ, `/n` at end | — |

There is **no** step where `carbonInt = 210` is derived from an emissions total ÷ throughput — it is
simply the draw `floor(20 + sr(41)·480)`. The IEA NZE 30 gCO₂/kWh target in the guide is never
compared.

### 7.5 Companion analytics on the page

- Sector/stage/risk/compliance **distribution** pies and bars over the filtered set.
- **ESG-vs-IRR scatter** (impact–return trade-off view) with sector colouring.
- **Country investment** aggregation; **quarterly trend** of mean `q1–q4Score`.
- CSV export of the full filtered table.

### 7.6 Data provenance & limitations

- **100 % synthetic** — every project attribute is `sr()`-seeded; no real asset operational data,
  emissions, throughput, or GRESB/IFC submission is ingested.
- The headline "carbon intensity" is a decorative random number, **not** a GIIA KPI 4.1 computation.
- ESG pillar scores are independent draws, not a weighted E/S/G aggregation, so the composite
  `esgScore` bears no arithmetic relationship to `envScore`/`socScore`/`govScore`.
- Compliance status and safety rate are unrelated to any incident or regulatory dataset.

**Framework alignment:** *GIIA Global ESG Reporting Framework* — the KPI vocabulary (carbon
intensity, NRW/water loss, LTIFR, renewable share) is referenced but none of the KPIs are computed to
GIIA definitions. *GRESB Infrastructure* — a `gresbScore` field exists but no GRESB assessment logic
(aspect weighting, validation) runs. *IFC Performance Standards* — projects carry an IFC category
label (A/B/C) and a performance draw, echoing IFC PS environmental & social risk categorisation, but
no PS screening is performed. *IEA NZE sector pathways* — cited as the intensity benchmark, absent
from code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute real, comparable GIIA-framework ESG KPIs for an operating infrastructure portfolio — above
all a **sector-normalised carbon intensity** benchmarked to IEA NZE pathways — plus a defensible
E/S/G composite, from asset operational data. Serves infra fund GP/LP ESG reporting.

### 8.2 Conceptual approach
Replace random draws with an **activity-data → emission-factor → throughput-normalisation** pipeline
(GHG Protocol Scope 1/2, location- and market-based) and a **weighted-pillar composite** benchmarked
against GRESB Infrastructure aspect scoring and MSCI/Sustainalytics ESG-rating construction. Intensity
gap = asset CI minus the sector NZE pathway value for the year.

### 8.3 Mathematical specification
For asset *a* in sector *k*:

```
Scope1_a = Σ_f Q_{a,f} · EF_f                          // fuels f, activity Q, emission factor EF
Scope2_a = E_a · GI_{grid(a),year}                     // purchased electricity × grid intensity (location) 
CI_a     = (Scope1_a + Scope2_a) / Throughput_{a,k}    // k-specific unit (kWh, veh-km, ML)
Gap_a    = CI_a − NZE_{k,year}                          // >0 ⇒ above pathway
ESG_a    = w_E·E_a + w_S·S_a + w_G·G_a                  // pillar scores 0–100, weights sum to 1
E_a      = f(CI percentile, water-loss, renewable share, biodiversity)  // GIIA env KPIs, benchmarked
S_a      = f(LTIFR, community, jobs)  ;  G_a = f(policy, board, disclosure)
```

| Parameter | Source |
|---|---|
| Fuel emission factors `EF_f` | IPCC AR6 / DEFRA 2023 |
| Grid intensity `GI` | IEA / eGRID by region-year |
| NZE sector pathways `NZE_{k,year}` | IEA Net Zero by 2050 sector trajectories |
| Pillar weights `w_E,w_S,w_G` | GIIA/GRESB materiality; sector-specific |
| Benchmark distributions | GRESB Infrastructure peer medians |

### 8.4 Data requirements
Per asset: fuel consumption by type, purchased electricity + contractual instruments (for
market-based), throughput metric, water produced/lost, H&S incident hours & counts, workforce, board/
policy attributes. Platform has: taxonomy scaffolding and `reference_data` for IEA/eGRID factors;
would need real asset operational feeds (currently absent).

### 8.5 Validation & benchmarking plan
Reconcile computed Scope 1+2 against assets' audited GHG inventories; benchmark CI distribution vs
GRESB peer medians; sensitivity of ESG composite to pillar weights; back-check NZE-gap sign against
known green vs fossil assets (renewables CI <5, gas peaker 400–500).

### 8.6 Limitations & model risk
Throughput-metric heterogeneity across sectors limits cross-sector CI comparability; market- vs
location-based Scope 2 divergence is material for renewable-PPA assets; pillar-weight subjectivity
drives composite rank instability. Conservative fallback: report CI per sector separately and the
ESG composite as a band, not a single cross-portfolio ranking.

## 9 · Future Evolution

### 9.1 Evolution A — Real GIIA KPI computation from asset operational data (analytics ladder: rung 1 → 2)

**What.** The §7 flag is total: all 50 projects are `genProjects` fabrications — `carbonInt` (20–500 "gCO₂/kWh") is a raw draw with no emissions total or throughput behind it, `esgScore` bears no arithmetic relation to its own pillar draws, `gresbScore` is a random number wearing a real framework's name, compliance status is a two-threshold coin flip. The guide's `CI_infra = Total_CO2e / Throughput_metric` and the IEA NZE 30 gCO₂/kWh benchmark are never computed. Evolution A builds the §8 pipeline as this module's first backend vertical: activity data × emission factors → Scope 1/2, normalised by sector-specific throughput (kWh, vehicle-km, ML treated), with the NZE-pathway gap per asset and a weighted E/S/G composite whose pillars actually aggregate.

**How.** (1) An asset-operational-data intake vertical (asset × period × fuel/electricity/throughput/water/safety-hours), the register the §1 workflow already assumes analysts "load". (2) Emission factors from IPCC/DEFRA and grid intensities from IEA/eGRID into refdata — partially present in the platform's emission-factor layers already. (3) `GET /infrastructure-esg/kpis` computing GIIA KPI 4.1 (CI), 3.2 (water loss), LTIFR and renewable share to GIIA definitions, honest nulls for missing activity data. (4) Validation per §8.5: renewables land <5 gCO₂/kWh, gas peakers 400–500; a computed portfolio reconciles against any audited GHG inventory entered.

**Prerequisites.** The `genProjects(50)` fabrication deleted — decorative random numbers labeled as GIIA/GRESB/IFC metrics is the module's core defect; the intake UX. **Acceptance:** every KPI decomposes into activity × factor ÷ throughput; assets without data show gaps, not draws; the NZE-gap sign check passes (green vs fossil assets).

### 9.2 Evolution B — GP/LP ESG reporting copilot with framework fidelity (LLM tier 2)

**What.** The stated workflow ends at "generate the GIIA-format annual ESG performance report" — a document-production task suited to tier 2 once real KPIs exist: "draft the GIIA annual report section for the transport assets", "which assets sit above their NZE pathway and by how much?", "explain why market-based and location-based Scope 2 diverge for the PPA-backed solar asset" (a real subtlety §8.6 flags as material).

**How.** Tool schemas over the Evolution A `/kpis` route; report sections map to GIIA framework indicators with each figure validated against tool output. Framework fidelity rules: KPI definitions quoted from GIIA (the §4.1 anchor table carries the thresholds — LTIFR <1.0 best-in-class, >3.0 social-risk flag; NRW >20% efficiency gap); GRESB numbers only if an actual GRESB submission is ingested — the copilot must never present an internal score as a GRESB result, which is exactly the confusion the current random `gresbScore` invites. Coverage candour opens each report section ("CI computed for 31 of 48 assets; 17 lack throughput data").

**Prerequisites (hard).** Evolution A — LP reporting from PRNG data would be fabricated disclosure. Phase 2 tool-calling. **Acceptance:** report figures 100% tool-traceable; framework labels used only where the underlying computation matches the framework's definition; coverage statistics present per section.