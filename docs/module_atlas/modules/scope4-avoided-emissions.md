# Scope 4 Avoided Emissions
**Module ID:** `scope4-avoided-emissions` · **Route:** `/scope4-avoided-emissions` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scope 4 and enabled emissions quantification measuring emission reductions achieved by products and services compared to a defined baseline scenario.

> **Business value:** Quantifies the positive climate contribution of products and services beyond the corporate operational boundary.

**How an analyst works this module:**
- Define functional unit and system boundary for each product or service.
- Establish baseline scenario representing the most likely alternative technology or service.
- Calculate full lifecycle emissions of the assessed product.
- Report avoided emissions as baseline minus product emissions with sensitivity analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BASELINES`, `Badge`, `CATEGORIES`, `CATEGORY_DATA`, `COMPANIES`, `CRITERIA`, `Card`, `METHODOLOGIES`, `Metric`, `QUARTERS`, `SECTORS`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `['Renewable Energy','EVs','Plant-Based Food','Insulation','LED Lighting','Teleconferencing','Recycling Tech','Water Purification','Precision Agriculture','Carbon Capture'];` |
| `METHODOLOGIES` | `['WRI/WBCSD Avoided Emissions','ICF Comparative Assessment','Project Frame Protocol','GHG Protocol Scope 4','ISO 14064-2 Project','Gold Standard Methodology','SBTi Beyond Value Chain','Custom Internal'];` |
| `CRITERIA` | `['Baseline Transparency','Additionality','Conservative Assumptions','Third-Party Verification','No Double-Counting','Temporal Boundaries','Geographic Scope','Rebound Adjustment'];` |
| `QUARTERS` | `Array.from({length:12},(_,i)=>{const y=2022+Math.floor(i/4);const q=i%4+1;return `Q${q} ${y}`;});` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `category` | `CATEGORIES[Math.floor(s2*CATEGORIES.length)];` |
| `emitted` | `0.5+s3*12;` |
| `avoidedRaw` | `0.2+s4*18;` |
| `ratio` | `avoidedRaw/emitted;` |
| `quarterData` | `QUARTERS.map((_,qi)=>{const base=avoidedRaw*(0.6+sr(i*53+qi*11)*0.8);return parseFloat(base.toFixed(3));});` |
| `CATEGORY_DATA` | `CATEGORIES.map((cat,ci)=>{` |
| `totalAvoided` | `companies.reduce((a,c)=>a+c.avoided,0);` |
| `avgPerUnit` | `parseFloat((sr(ci*97)*2.5+0.1).toFixed(3));` |
| `base` | `totalAvoided*(0.3+yi*0.06+sr(ci*101+yi*7)*0.15);` |
| `grossAvoided` | `useMemo(()=>parseFloat(((unitsSold*(baselineEF-productEF))/1e6).toFixed(4)),[unitsSold,baselineEF,productEF]);` |
| `netAvoided` | `useMemo(()=>parseFloat((grossAvoided*(attribution/100)*(1-rebound/100)).toFixed(4)),[grossAvoided,attribution,rebound]);` |
| `avoidedToEmitted` | `useMemo(()=>{const e=COMPANIES[selCompany].emitted;return e>0?parseFloat((netAvoided/e).toFixed(2)):0;},[netAvoided,selCompany]);` |
| `portPageData` | `useMemo(()=>filteredPortfolio.slice(portPage*25,(portPage+1)*25),[filteredPortfolio,portPage]);` |
| `portTotalPages` | `Math.ceil(filteredPortfolio.length/25);` |
| `portTotalEmitted` | `useMemo(()=>filteredPortfolio.reduce((a,c)=>a+c.emitted,0),[filteredPortfolio]);` |
| `portTotalAvoided` | `useMemo(()=>filteredPortfolio.reduce((a,c)=>a+c.avoided,0),[filteredPortfolio]);` |
| `tierDist` | `useMemo(()=>TIERS.map(t=>({name:t,value:COMPANIES.filter(c=>c.tier===t).length})),[]);` |
| `redFlags` | `useMemo(()=>COMPANIES.filter(c=>c.tier==='Unverified'\|\|c.criteriaScores.some(s=>s===0)).map(c=>({` |
| `header` | `'Company,Sector,Tier,'+CRITERIA.join(',')+',Overall Score\n';` |
| `rows` | `COMPANIES.map(c=>{` |
| `total` | `c.criteriaScores.reduce((a,v)=>a+v,0);` |
| `blob` | `new Blob([header+rows],{type:'text/csv'});` |
| `pct` | `parseFloat((sr(selCategory*113+si*17)*60+5).toFixed(1));` |
| `val` | `parseFloat((CATEGORY_DATA[selCategory].totalAvoided*delta).toFixed(2));` |
| `avg` | `COMPANIES.reduce((a,c)=>a+c.criteriaScores[ci],0)/COMPANIES.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BASELINES`, `CATEGORIES`, `CRITERIA`, `DONUT_COLORS`, `METHODOLOGIES`, `SECTORS`, `TABS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Products Assessed | — | Product register | Number of products or services with completed avoided emission assessments. |
| Total Avoided | — | Calculated | Aggregate avoided emissions across all assessed products in the reporting year. |
| Avoided-to-Footprint Ratio | — | Calculated | Ratio of total avoided emissions to company operational (Scope 1+2) footprint. |
- **Product lifecycle data, baseline scenario parameters, emission factors** → LCA calculation, baseline comparison, sensitivity analysis → **Avoided emission reports, ratio analytics, scenario comparisons**

## 5 · Intermediate Transformation Logic
**Methodology:** Avoided Emissions
**Headline formula:** `Baseline Scenario Emissions – Product/Service Lifecycle Emissions`

Net emission benefit of a product or service versus the counterfactual baseline it replaces, expressed in tCO₂e.

**Standards:** ['WRI Scope 4 Guidance', 'GHG Protocol']
**Reference documents:** WRI Guidance on Scope 4 Avoided Emissions 2021; GHG Protocol Product Life Cycle Standard; ISO 14040/44 LCA Methodology; WBCSD Vision 2050 Enabled Solutions

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

120 synthetic companies (`COMPANIES`, seeded via `sr(s)=frac(sin(s+1)×10⁴)`) each carry a baseline vs.
product emission factor pair, unit sales, a verification tier and 8 credibility-criteria scores. The
interactive "Avoided Emissions Calculator" (Tab 1) implements the genuine WRI/GHG-Protocol avoided
emissions formula on live slider inputs:

```js
grossAvoided = unitsSold × (baselineEF − productEF) / 1e6                   // tCO2e → Mt
netAvoided   = grossAvoided × (attribution/100) × (1 − rebound/100)
avoidedToEmitted = netAvoided / company.emitted                              // ratio vs own footprint
```

`attribution` (default 80%) and `rebound` (default 10%) are user-adjustable sliders, not fixed constants —
this mirrors the real-world avoided-emissions adjustment chain (gross delta → attributable share →
rebound-effect discount).

### 7.2 Parameterisation

| Field | Range / formula | Provenance |
|---|---|---|
| `emitted` (company's own footprint) | `0.5 + sr()×12` Mt | Synthetic |
| `avoidedRaw` | `0.2 + sr()×18` Mt | Synthetic |
| `baselineEF` | `0.4 + sr()×0.8` | Synthetic — plausible tCO₂e/unit range |
| `productEF` | `0.05 + sr()×0.3` | Synthetic, always < baselineEF ceiling by construction of the ranges (not enforced, coincidental) |
| `tier` (High/Medium/Low/Unverified) | `s5` quartile bands 0.25/0.55/0.8 | Synthetic threshold cuts, not scored from criteria |
| `criteriaScores[8]` | `sr()` banded 0/1/2/3 (Missing/Weak/Adequate/Strong) | Synthetic, independent of `tier` |
| `verified` boolean | `s5 < 0.55` | Same seed (`s5`) as `tier`, so `verified` and `tier` are correlated but not causally linked in code |
| 8 `CRITERIA` (Baseline Transparency, Additionality, Conservative Assumptions, Third-Party Verification, No Double-Counting, Temporal Boundaries, Geographic Scope, Rebound Adjustment) | fixed list | Matches WRI/WBCSD Avoided Emissions Guidance's own quality-assessment dimensions |
| 8 `METHODOLOGIES` | fixed list (WRI/WBCSD, ICF, Project Frame, GHG Protocol Scope 4, ISO 14064-2, Gold Standard, SBTi BVCM, Custom) | Real named frameworks; assignment to a company is `sr()`-random, not evaluated |

### 7.3 Calculation walkthrough

1. **Calculator tab**: user selects a company (pre-fills `unitsSold`/`baselineEF`/`productEF` from that
   company's synthetic record, all overridable), sets `attribution` and `rebound` sliders, and the three
   formulas above recompute live via `useMemo`. `runCalc` is a cosmetic 1.2s `setTimeout` — no actual async
   computation occurs, it just gates the "done" state for UI sequencing.
2. **Category Analysis** (`CATEGORY_DATA`, computed once at module load): for each of the 10 product
   categories, sums `avoided` across all companies tagged with that category, and builds a synthetic 16-year
   (2020–2035) growth curve `totalAvoided × (0.3 + yearIndex×0.06 + sr()×0.15)` — a monotonically increasing
   trend by construction (`yearIndex×0.06` term), not a modelled adoption S-curve.
   `additionality` (High/Medium/Low) and `doubleCounting` (boolean) per category are independent `sr()`
   draws, not derived from the criteria scores.
3. **Portfolio Avoided Emissions** (Tab 3): filters `COMPANIES` by sector/tier/minimum ratio, sorts by any
   column, and aggregates `portTotalEmitted`/`portTotalAvoided` — guarded reduces over the filtered array.
4. **Credibility & Verification** (Tab 4): flags "red flags" as `tier === 'Unverified' || any criteriaScore
   === 0`, and exports a CSV of all 8 criteria scores per company plus an `avg` per criterion across all 120
   companies.

### 7.4 Worked example

Company with `unitsSold = 250,000`, `baselineEF = 0.75`, `productEF = 0.12`, `attribution = 80%`,
`rebound = 10%`, `emitted = 4.2 Mt`:

| Step | Computation | Result |
|---|---|---|
| Gross avoided | `250,000 × (0.75−0.12) / 1e6` | 0.1575 Mt |
| Net avoided | `0.1575 × 0.80 × (1−0.10)` | **0.1134 Mt** |
| Avoided-to-emitted ratio | `0.1134 / 4.2` | **0.027×** (2.7% of own footprint offset) |

### 7.5 Companion analytics on the page

- **Product Category growth curves** — 16-year synthetic trajectories per category, useful only as
  illustrative shape, not a forecast.
- **Red-flag scanner** (Tab 4) — a rule-based screen (`Unverified` tier OR any criterion scored 0),
  operationalising a subset of the WRI/WBCSD 8-criteria checklist as a binary pass/fail gate.
- **Verifier roster** — 8 real audit/assurance firms (DNV, Bureau Veritas, SGS, TÜV SÜD, ERM, Deloitte,
  PwC, "None") assigned by `sr()`; presence of a real verifier name is cosmetic realism, not an actual
  third-party check.

### 7.6 Data provenance & limitations

- **All 120 companies, their emission factors, criteria scores, and category growth curves are synthetic**,
  generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; company names, product descriptions, and verifier names are
  invented/illustrative.
- The interactive Calculator (Tab 1) is the one part of the page implementing a *real, editable* formula —
  users can substitute real `unitsSold`/EF values and get a correct avoided-emissions figure, but the
  slider ranges are pre-seeded from synthetic company data, not sourced reference EFs
  (`GWP_VALUES`/`EMISSION_FACTORS` are imported from `referenceData.js` but not visibly wired into the
  default EF values shown here).
- `tier` and `verified` share a seed (`s5`) but `criteriaScores` are independently drawn — a company can show
  `tier: 'High'` while having a `Missing` (0) score on "No Double-Counting," which a real credibility
  framework would not permit (High tier should require passing all 8 criteria at Adequate+).
- Category-level `additionality`/`doubleCounting` flags are decorative random draws, not computed from the
  company-level criteria data that exists in the same dataset.
- Consistent with the GHG Protocol Avoided Emissions Framework's own guidance (also implemented honestly in
  `backend/services/scope3_analytics_engine.py::calculate_avoided_emissions`, unused by this page), avoided
  emissions must never be netted against Scope 1/2/3 inventory — the page reports them as a standalone ratio
  (`avoidedToEmitted`), which is the correct presentation.

**Framework alignment:** WRI/WBCSD Avoided Emissions Guidance (Scope 4 concept, gross/net/attribution/
rebound formula chain, and the 8-criteria credibility checklist reproduced verbatim as `CRITERIA`) · GHG
Protocol Scope 4 (unofficial category name) · ISO 14064-2 (project-level GHG quantification, referenced as
one of the 8 methodology options) · SBTi Beyond Value Chain Mitigation (BVCM) — named as a methodology
option, reflecting the correct principle that avoided emissions are supplementary to, not a substitute for,
value-chain target achievement.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the calculator to the real backend engine and reference EFs (analytics ladder: rung 1 → 2)

**What.** Today this is a tier-B frontend-only page: the Tab-1 calculator implements the genuine WRI gross→attribution→rebound formula chain, but its default EFs come from 120 `sr()`-synthetic companies, and the platform's own honest implementation (`backend/services/scope3_analytics_engine.py::calculate_avoided_emissions`) sits unused. Evolution A gives the module its first backend vertical: persisted product assessments, sourced emission factors, and scenario sweeps over attribution/rebound assumptions.

**How.** (1) New router `POST /api/v1/scope4/assess` delegating to `calculate_avoided_emissions`, with an `avoided_emissions_assessments` table (product, functional unit, baseline scenario, EF pair, attribution, rebound). (2) Replace slider pre-seeds with `GWP_VALUES`/`EMISSION_FACTORS` from `referenceData.js` — already imported by the page but not wired to the default EF values. (3) Add a sensitivity grid (attribution 50–100% × rebound 0–30%) so a single assessment returns a scenario table, not a point estimate. (4) Fix the documented tier/criteria inconsistency: `tier: 'High'` must require all 8 `CRITERIA` at Adequate+, computed from `criteriaScores` instead of the independent `s5` draw.

**Prerequisites.** The §7.6 finding that category-level `additionality`/`doubleCounting` flags are decorative random draws must be resolved (derive from criteria data) before any persisted output. **Acceptance:** an assessment stored via the API round-trips to the UI with identical netAvoided; default EFs traceable to `referenceData.js` entries, not `sr()` draws.

### 9.2 Evolution B — Credibility-checklist copilot (LLM tier 1)

**What.** A chat panel answering "is this avoided-emissions claim credible?" and "why is the ratio 0.027×?" grounded in this Atlas page's §5 formula, the 8-criteria WRI/WBCSD checklist (`CRITERIA`, reproduced verbatim in the module), and the current calculator state — never inventing numbers. It explains the standing rule the page already enforces correctly: avoided emissions are reported as a standalone `avoidedToEmitted` ratio, never netted against Scope 1/2/3 inventory.

**How.** Per the Tier-1 pattern: embed this module's Atlas record into `llm_corpus_chunks`, serve via `POST /api/v1/copilot/scope4-avoided-emissions/ask` with a prompt-cached system prompt assembled from §5/§7. The copilot reads the live calculator inputs (unitsSold, EF pair, attribution, rebound) from page state and narrates the three-step §7.4 walkthrough for the user's actual values. Refusal path required for questions the module doesn't compute (e.g. project-level additionality tests, verified baselines).

**Prerequisites.** Must ship with an explicit synthetic-data disclosure: the 120 companies, tiers, and verifier names are `sr()`-generated, so the copilot must label any company-roster answer as illustrative until Evolution A lands. **Acceptance:** every numeric cited traces to page state or the Atlas §7.4 worked example; asking "what is Company X's verified 2024 avoided total?" yields a refusal, not a number.