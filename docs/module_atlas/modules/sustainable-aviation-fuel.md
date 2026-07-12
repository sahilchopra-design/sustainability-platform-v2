# Sustainable Aviation Fuel
**Module ID:** `sustainable-aviation-fuel` · **Route:** `/sustainable-aviation-fuel` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
SAF production analytics, blending mandate tracking and lifecycle GHG assessment platform covering HEFA, e-fuel and advanced biofuel pathways against CORSIA and EU ReFuelEU mandates.

> **Business value:** Aviation contributes 3.5% of effective radiative forcing; SAF is the primary decarbonisation pathway as electric and hydrogen aircraft remain decades away for long-haul routes.

**How an analyst works this module:**
- Inventory SAF production pathways and feedstocks
- Calculate lifecycle carbon intensity per RED III/CORSIA methodology
- Track blending volumes and mandate compliance
- Generate CORSIA Sustainable Aviation Fuel Report (SAFR)
- Model cost and availability scenarios for 2030/2050 blending mandates

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `KPI`, `MANDATES`, `PATHWAYS`, `PW_CAP_2024`, `PW_CAP_2030`, `PW_CORSIA`, `PW_COST`, `PW_DESC`, `PW_EURED`, `PW_FEED`, `PW_GHG`, `PW_INV`, `PW_TRL`, `REFUELEU_TIMELINE`, `REGIONS`, `REG_COLORS`, `REG_SHARE`, `TABS`, `ToolTipC`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MANDATES` | 26 | `country`, `code`, `type`, `current`, `t2030`, `t2050`, `enforcement`, `penalty`, `sub_fossil`, `sub_efuel_2030`, `sub_efuel_2050` |
| `REFUELEU_TIMELINE` | 8 | `year`, `milestone`, `pct` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(v,d=1)=>v>=1e9?(v/1e9).toFixed(d)+'B':v>=1e6?(v/1e6).toFixed(d)+'M':v>=1e3?(v/1e3).toFixed(d)+'K':v.toFixed(d);` |
| `pct` | `(v)=>(v*100).toFixed(1)+'%';` |
| `PATHWAYS` | `['HEFA','Fischer-Tropsch','AtJ','DSHC','Co-processing','e-Kerosene/PtL','Pyrolysis','Gasification'];` |
| `PW_FEED` | `{'HEFA':'Used cooking oil, tallow, camelina','Fischer-Tropsch':'Forestry residues, MSW, ag waste','AtJ':'Corn ethanol, cellulosic ethanol, isobutanol','DSHC':'Sugarcane, corn sugars, cellulosic sugars','Co-processing':'V` |
| `PW_CORSIA` | `{HEFA:true,'Fischer-Tropsch':true,AtJ:true,DSHC:true,'Co-processing':true,'e-Kerosene/PtL':true,Pyrolysis:false,Gasification:true};` |
| `PW_EURED` | `{HEFA:true,'Fischer-Tropsch':true,AtJ:true,DSHC:true,'Co-processing':false,'e-Kerosene/PtL':true,Pyrolysis:false,Gasification:true};` |
| `PW_GHG` | `{HEFA:65,'Fischer-Tropsch':85,AtJ:70,DSHC:72,'Co-processing':50,'e-Kerosene/PtL':95,Pyrolysis:60,Gasification:80};` |
| `PW_TRL` | `{HEFA:9,'Fischer-Tropsch':7,AtJ:7,DSHC:6,'Co-processing':9,'e-Kerosene/PtL':5,Pyrolysis:5,Gasification:6};` |
| `PW_COST` | `{HEFA:1.8,'Fischer-Tropsch':3.2,AtJ:2.6,DSHC:3.5,'Co-processing':1.3,'e-Kerosene/PtL':5.5,Pyrolysis:2.9,Gasification:3.0};` |
| `PW_CAP_2024` | `{HEFA:4.2,'Fischer-Tropsch':0.3,AtJ:0.15,DSHC:0.02,'Co-processing':0.8,'e-Kerosene/PtL':0.01,Pyrolysis:0.05,Gasification:0.08};` |
| `PW_CAP_2030` | `{HEFA:15,'Fischer-Tropsch':4.5,AtJ:3.0,DSHC:0.8,'Co-processing':3.5,'e-Kerosene/PtL':2.0,Pyrolysis:1.5,Gasification:2.5};` |
| `PW_INV` | `{HEFA:8,'Fischer-Tropsch':18,AtJ:12,DSHC:6,'Co-processing':3,'e-Kerosene/PtL':45,Pyrolysis:8,Gasification:14};` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Middle East','Latin America','Africa'];` |
| `cap` | `Math.round(50+s*1200);` |
| `opPct` | `s2>0.6?1:s2>0.3?0.5+s3*0.4:0;` |
| `idx` | `q.length;const s=sr(idx*11+5);` |
| `base` | `0.1+idx*0.035+s*0.02;` |
| `price` | `2800-idx*25+s*300;` |
| `airlines` | `['United Airlines','Delta Air Lines','American Airlines','Lufthansa Group','Air France-KLM','British Airways','Singapore Airlines','Qantas','ANA Holdings','Japan Airlines','Emirates','Cathay Pacific','SAS Scandinavian','` |
| `vol` | `Math.round(20+s*280);const dur=Math.round(3+s2*12);` |
| `start` | `2023+Math.round(s*3);` |
| `agreements` | `useMemo(()=>genAgreements(30),[]);  const totalProd=useMemo(()=>producers.reduce((a,p)=>a+p.capacity_kt*p.operational_pct,0),[producers]);` |
| `totalCap` | `useMemo(()=>producers.reduce((a,p)=>a+p.capacity_kt,0),[producers]);` |
| `totalInv` | `useMemo(()=>producers.reduce((a,p)=>a+p.investment_m,0),[producers]);` |
| `operational` | `useMemo(()=>producers.filter(p=>p.stage==='Operational').length,[producers]);  const sortedProducers=useMemo(()=>{ return [...producers].sort((a,b)=>(a[sortCol]>b[sortCol]?1:-1)*sortDir);` |
| `sortedMandates` | `useMemo(()=>{ return [...MANDATES].sort((a,b)=>(a[mandateSort]>b[mandateSort]?1:-1)*mandateSortDir);` |
| `regionDonut` | `useMemo(()=>REGIONS.map((r,i)=>({name:r,value:Math.round(REG_SHARE[i]*totalProd)})),[totalProd]);` |
| `radarData` | `useMemo(()=>{ return ['Cost Competitiveness','Scalability','Feedstock Availability','GHG Reduction','Technology Readiness','Certification'].map((dim,di)=>{ const obj={dimension:dim};` |
| `costProjections` | `useMemo(()=>{ return Array.from({length:12},(_,i)=>{ const yr=2024+i;const obj={year:yr};` |
| `investmentFlow` | `useMemo(()=>{ return Array.from({length:10},(_,i)=>{ const yr=2019+i;const obj={year:yr};let total=0;` |
| `val` | `+(base*growth).toFixed(1);` |
| `rows` | `producers.map(p=>[p.name,p.country,p.pathway,p.capacity_kt,p.stage,p.investment_m,p.irr_est.toFixed(1),p.offtake_pct].join(','));` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `safNeeded` | `calcFuel*(m.t2030/100);const premCost=safNeeded*pricePremium;const carbonSaved=safNeeded*0.003*80;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MANDATES`, `PATHWAYS`, `PW_COLORS`, `REFUELEU_TIMELINE`, `REGIONS`, `REG_COLORS`, `REG_SHARE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SAF Blend Rate | — | Fuel Uplift Records | Current fleet-weighted SAF blending ratio; EU ReFuelEU mandates 2% by 2025, 6% by 2030. |
| Lifecycle CI | — | CORSIA Methodology | Weighted average carbon intensity of SAF portfolio; 69% reduction vs fossil baseline. |
| CORSIA Offset Credit | — | CORSIA Registry | CORSIA Eligible Fuel credits generated from SAF use, offsetting international aviation emissions. |
- **Fuel Uplift Records, SAF Certificates, Feedstock Data** → Lifecycle CI engine + mandate compliance tracker + CORSIA credit calculator → **SAFR reports, blending compliance status, 2030 gap analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** SAF Lifecycle GHG Intensity
**Headline formula:** `CI = (GHGₚₐₜₕ + GHGₚ⬿ₐₜ + GHGₑⵔₑ) / MJ₟⭃⻿`

Well-to-wake carbon intensity in gCO2e/MJ; eligible SAF must achieve ≥10% reduction vs fossil Jet-A baseline of 89 gCO2e/MJ.

**Standards:** ['ICAO CORSIA Methodology', 'EU RED III Annex V']
**Reference documents:** ICAO CORSIA Methodology 2023; EU ReFuelEU Aviation Regulation 2023/2405; EU RED III Annex V Lifecycle Methodology; ASTM D7566 SAF Blending Standard

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is a lifecycle carbon-intensity
> formula, `CI = (GHG_feedstock + GHG_process + GHG_use) / MJ_fuel`, well-to-wake gCO₂e/MJ per
> CORSIA/RED III methodology. **No such per-MJ carbon-intensity calculation exists in the code.**
> The `PW_GHG` table stores a **% GHG-reduction figure** (65–95%) per pathway relative to fossil jet
> fuel — a different, coarser unit than the guide's absolute gCO₂e/MJ intensity, and it is a static
> literal, not computed from feedstock/process/combustion emission components. The one genuine
> calculator on the page (`calcMandateCost`, §7.4) has its own scaling issue that understates
> realistic carbon savings per tonne of SAF by roughly an order of magnitude — documented below.

### 7.1 What the module computes

4 tabs (Market Overview, Pathway Comparison, Mandate Tracker, Investment & Offtakes) built on: 8 SAF
production pathways (HEFA, Fischer-Tropsch, AtJ, DSHC, Co-processing, e-Kerosene/PtL, Pyrolysis,
Gasification) each with static feedstock description, CORSIA/EU-RED eligibility flags, GHG-reduction
%, technology-readiness level (TRL), production cost ($/gal), and 2024/2030 capacity; 60 named
real-world producers (Neste, World Energy, Montana Renewables, LanzaTech, Shell SAF, etc.) with
`sr()`-seeded capacity/operational-%/investment/IRR; a genuinely detailed 26-country mandate table
(`MANDATES` — EU ReFuelEU, UK, US IRA tax credit, Japan, Korea, India, Brazil RenovaBio, etc., with
real 2030/2050 targets and enforcement mechanisms); the accurate EU ReFuelEU blending timeline
(2%→70% by 2050, with synthetic-fuel sub-quotas); and 30 airline-producer offtake agreements.

### 7.2 Genuine calculations

```js
totalProd = Σ producers.capacity_kt × producers.operational_pct        // weighted operational output
totalCap  = Σ producers.capacity_kt
totalInv  = Σ producers.investment_m
regionDonut[r] = round(REG_SHARE[r] × totalProd)                       // fixed regional share, not geocoded
```

`operational_pct` is itself a tiered synthetic function of a random draw (`s2>0.6→100% operational,
s2>0.3→50-90%, else 0%`), not derived from `stage`/`capacity` in a causal way — but the aggregation
arithmetic (weighted sum, region-share allocation) is correct given those inputs.

### 7.3 Pathway comparison radar & cost curves

```js
CostCompetitiveness(pw) = round(100 − PW_COST[pw]×15 + noise)     // inverse of $/gal cost
Scalability(pw)         = round(PW_CAP_2030[pw]/15×70 + noise)    // normalised to a 15Mt/yr ceiling
FeedstockAvailability   = round(40 + noise×55)                    // pure random, no feedstock-supply model
GHGReduction(pw)         = PW_GHG[pw]                              // static literal, verbatim
TechReadiness(pw)        = PW_TRL[pw] × 10                         // TRL 1-9 rescaled to 10-90
Certification(pw)        = PW_CORSIA[pw] ? 80+noise×20 : 30+noise×20

costProjections[year][pw] = PW_COST[pw] × (1 − decline)^yearsSince2024,  decline = 4-6%/yr (sr-seeded)
```

The cost-decline curve applies a **learning-curve-style exponential decay** (4–6%/yr, itself
randomised per pathway/year rather than a fixed learning rate) to each pathway's static 2024 cost —
a reasonable functional form for technology cost projection, though the decline rate is not derived
from a cited experience-curve elasticity (e.g. a learning rate tied to cumulative capacity doublings,
the standard Wright's Law approach used in IEA/BNEF cost-projection work).

### 7.4 Mandate compliance cost calculator (with a scaling defect)

```js
safNeeded  = totalFuelDemand × mandate_t2030_pct/100
premCost   = safNeeded × pricePremium          // $/tonne SAF-vs-Jet premium
carbonSaved = safNeeded × 0.003 × 80
carbonOffsetValue = carbonSaved × carbonPrice/80    // simplifies to safNeeded×0.003×carbonPrice
netCost    = premCost − carbonOffsetValue
```

The `×80` in `carbonSaved` and `÷80` in `carbonOffsetValue` cancel algebraically, so the calculation
reduces to `carbonOffsetValue = safNeeded × 0.003 × carbonPrice` — implying **0.003 tCO₂ saved per
tonne of SAF**. This is roughly **1,000× too low**: jet fuel's combustion emissions alone are
~3.16 tCO₂/tonne, and at the pathway table's own 65–95% GHG-reduction range, a tonne of SAF should
displace on the order of **2–3 tCO₂**, not 0.003. Given `0.003 × 80 = 0.24`, it's possible the
intended constant was meant to read as "0.003 kt CO₂ per tonne fuel × factor" and the units were
mismatched during construction — but as written, the mandate-cost calculator's `carbonOffsetValue`
column materially understates the emissions-value offset against the premium cost, systematically
making SAF mandate compliance look far more expensive net of carbon value than the underlying
GHG-reduction assumptions would imply.

### 7.5 Worked example

At `calcFuel=100,000` (tonnes jet fuel demand), `pricePremium=$1,500/t`, `carbonPrice=$80/tCO₂`, for
the EU ReFuelEU mandate (`t2030=6`): `safNeeded = 100,000×0.06 = 6,000t`. `premCost =
6,000×1,500 = $9.0M`. `carbonSaved = 6,000×0.003×80 = 1,440`; `carbonOffsetValue =
1,440×80/80 = $1,440`... more precisely `= 6,000×0.003×80 = $1,440` (already in dollars given the
`×carbonPrice/80` collapses to `×0.003×carbonPrice=6000×0.003×80=$1,440`). `netCost = 9,000,000 −
1,440 ≈ $8,998,560` — the carbon-value offset is **negligible** (0.016% of the premium cost) because
of the scaling defect in §7.4, when using a defensible reduction assumption (e.g. 2.5 tCO₂/tonne SAF
× $80/tCO₂ = $200/tonne = $1.2M for 6,000t) the offset should be roughly **800× larger** and would
meaningfully reduce net mandate-compliance cost in the display.

### 7.6 Data provenance & limitations

- **Producer capacities, IRRs, and offtake-agreement terms are `sr()`-seeded synthetic figures**
  attached to real company names (Neste, Shell, bp, TotalEnergies, LanzaTech etc.) — treat as
  illustrative market-sizing, not actual disclosed capacity/financials.
- **Mandate table content (`MANDATES`, `REFUELEU_TIMELINE`) is accurate, real regulatory content** —
  EU ReFuelEU's 2%/2025→70%/2050 trajectory with synthetic-fuel sub-quotas, UK SAF mandate + buy-out
  mechanism, US IRA blenders' tax credit, matches published regulatory text.
- No lifecycle CI (gCO₂e/MJ) calculation exists; `PW_GHG` is a static %-reduction literal per
  pathway, not derived from feedstock/process/combustion emission factors.
- The mandate-cost calculator's carbon-offset-value term is scaled incorrectly (§7.4) — this should
  be corrected before the tool is used for any real compliance-cost decision.

**Framework alignment:** ICAO CORSIA eligibility (`PW_CORSIA`) and EU RED III/ReFuelEU eligibility
(`PW_EURED`) are represented as accurate per-pathway boolean flags matching each scheme's actual
approved-pathway lists (both schemes currently exclude Pyrolysis as ineligible, correctly reflected).
ASTM D7566 (the SAF blending/certification standard referenced in the guide) is not represented in
code at all — no blend-ratio or fit-for-purpose certification logic exists.

## 9 · Future Evolution

### 9.1 Evolution A — Real CORSIA/RED III lifecycle-CI engine and a corrected mandate-cost calculator (analytics ladder: rung 1 → 2)

**What.** The §7 deep-dive documents two defects that define this evolution's scope: (1) no per-MJ lifecycle carbon-intensity calculation exists — `PW_GHG` is a static %-reduction literal, not the guide's `CI = (GHG_feedstock + GHG_process + GHG_use) / MJ_fuel`; (2) the one genuine calculator, `calcMandateCost`, has a ~1,000× scaling defect (`safNeeded × 0.003` tCO₂/tonne vs a defensible ~2–3 tCO₂/tonne), making its carbon-offset value negligible (0.016% of premium cost in the §7.5 worked example). Evolution A fixes the defect and builds the CI engine.

**How.** (1) Correct `carbonSaved` to `safNeeded × 3.16 × PW_GHG[pathway]/100` (fossil Jet-A combustion baseline × pathway reduction share) — a one-line fix with an outsized display impact. (2) Seed the published CORSIA default life-cycle emissions values table (ICAO document, free) as a reference table keyed by pathway × feedstock, so CI in gCO₂e/MJ becomes a lookup + blend-weighted average rather than a literal, with the ≥10%-below-89 gCO₂e/MJ eligibility test computed. (3) Replace the cost-projection curve's `sr()`-randomised 4–6%/yr decline with a fixed, cited Wright's-Law learning rate per pathway, making the 2024–2035 sweep a real scenario tool.

**Prerequisites.** The 60 producers' `sr()`-seeded capacity/IRR figures remain labelled illustrative; the accurate 26-country `MANDATES` table is the asset to build on. **Acceptance:** the §7.5 example's carbon-offset value rises from $1,440 to ~$1.1–1.2M; CORSIA-ineligible blends (CI reduction <10%) are flagged; bench pin on one CI lookup per pathway.

### 9.2 Evolution B — Mandate-compliance copilot over the 26-country regulatory table (LLM tier 1 → 2)

**What.** The module's genuinely strong asset is real regulatory content: the 26-row `MANDATES` table (EU ReFuelEU, UK buy-out mechanism, US IRA credits, Brazil RenovaBio, with real 2030/2050 targets, e-fuel sub-quotas, and enforcement/penalty text) and the accurate `REFUELEU_TIMELINE`. A copilot answers airline-strategy questions — "what do I owe if I miss the 2030 EU 6% mandate on 200kt uplift?", "which jurisdictions have e-fuel sub-quotas before 2035?" — grounded in these rows and, at tier 2, calling the corrected mandate-cost calculator.

**How.** Tier 1: embed `MANDATES`, `REFUELEU_TIMELINE`, the pathway eligibility flags (`PW_CORSIA`/`PW_EURED`, which correctly reflect both schemes' approved-pathway lists per §7.6), and this Atlas page as the corpus; per the Tier-1 pattern the copilot cites the specific mandate row and refuses questions the table doesn't cover (e.g. bilateral CORSIA offset pricing). Tier 2: expose the mandate-cost calculation as a backend endpoint (it currently lives only in the React page) and auto-generate its tool schema, so what-ifs ("premium at $1,200/t, carbon at €90") are executed, not estimated.

**Prerequisites (hard).** Evolution A's `carbonSaved` fix must land first — narrating the current calculator would confidently explain numbers that understate carbon value ~1,000×. **Acceptance:** every $ figure in an answer traces to a tool call; penalty/enforcement quotes match `MANDATES` row text verbatim; the copilot notes producer figures are synthetic when asked about named companies.