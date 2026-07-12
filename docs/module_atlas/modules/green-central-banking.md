# Green Central Banking
**Module ID:** `green-central-banking` · **Route:** `/green-central-banking` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses central bank climate risk frameworks, NGFS membership analytics, green quantitative easing (QE) programme design, and climate-aligned collateral frameworks. Tracks progress of 130+ NGFS member central banks against climate-related financial risk supervisory expectations and green monetary policy tool adoption.

> **Business value:** Enables climate researchers and financial institutions to track the evolution of green monetary policy, assess central bank supervisory expectations for climate risk management, and anticipate collateral framework changes that may affect funding costs for green and brown asset classes.

**How an analyst works this module:**
- Select the central bank jurisdiction and review its NGFS commitment level and climate risk framework implementation status.
- Analyse the green QE tilting score and collateral eligibility breakdown for the selected central bank.
- Compare climate stress test methodologies and scenario assumptions across major central banks.
- Review the supervisory expectations tracker for climate-related prudential guidance issued to financial institutions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CBS`, `KPI`, `PAGE_SIZE`, `QE_DATA`, `REGIONS`, `TABS`, `TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `QE_DATA` | 6 | `instrument`, `volume`, `share`, `growth` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#059669';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `_BCR_MAP` | `Object.fromEntries(BANK_CAPITAL_RATIOS.map(b => [b.country, b]));` |
| `_CLE_MAP` | `Object.fromEntries(CLIMATE_LOAN_EXPOSURE.map(cl => [cl.country, cl]));` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,greenQeVol:Math.round(100+i*15+sr(i*7)*80),cbsActive:Math.round(8+i*0.6+sr(i*11)*3),stressTests:Math.round(3+sr(i*13)*8` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...CBS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(regF!=='All')d=d.filter(r=>r.region===regF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,regF,sortCol,sortDir]); const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(CBS.reduce((s,c)=>s+c[k],0)/CBS.length);const ngfs=CBS.filter(c=>c.ngfsMemb==='Yes').length;const activeQe=CBS.filter(c=>c.greenQe==='Active').length;const mandatory=CBS.filter(c=>c` |
| `regChart` | `useMemo(()=>{const m={};CBS.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,avg:0,n:0};m[c.region].avg+=c.greenScore;m[c.region].n++;});return Object.values(m).map(s=>({...s,avg:Math.round(s.avg/s.n)}));},[]);` |
| `qeDist` | `useMemo(()=>{const m={};CBS.forEach(c=>{m[c.greenQe]=(m[c.greenQe]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `radarData` | `useMemo(()=>{const dims=['greenScore','taxonomyAdoption','supervisoryExpect','macroprudential','reserveGreening','greenBondPurchase'];const avg=(k)=>Math.round(CBS.reduce((s,c)=>s+c[k],0)/CBS.length);return dims.map(d=>(` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `QE_DATA`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NGFS Member Central Banks | — | NGFS membership register 2024 | Number of central banks and supervisors that have joined the Network for Greening the Financial System; covers approximately 90% of global GDP. |
| ECB Green Bond Share (% CSPP) | — | ECB CSPP portfolio disclosure | Share of ECB Corporate Sector Purchase Programme holdings in labelled green bonds; reflects post-2021 climate tilt in corporate bond purchases. |
| Eligible Green Collateral (%) | — | Central bank collateral frameworks | Proportion of eligible collateral universe meeting green criteria under expanded central bank collateral eligibility frameworks. |
| Climate Stress Test Coverage (%) | — | NGFS survey results 2023 | Share of NGFS member central banks that have conducted or are planning climate stress tests of the banking system. |
- **NGFS member commitment disclosures** → Classify by implementation tier (committed/implementing/advanced) → **NGFS progress dashboard by central bank**
- **Central bank asset purchase portfolio data** → Compute green share, compare to market benchmark → **Green QE tilting scores**
- **Collateral eligibility frameworks** → Extract green criteria, map to eligible bond universe → **Green collateral share by central bank**

## 5 · Intermediate Transformation Logic
**Methodology:** Green QE Tilting Score
**Headline formula:** `Tilt_score = (GreenShare_portfolio - GreenShare_market) / GreenShare_market × 100`

Measures the degree to which a central bank's asset purchase programme overweights green bonds and underweights carbon-intensive issuers relative to the market benchmark. A positive tilt score indicates active green tilting; a score of zero indicates market-neutral (proportional) purchasing as per the ECB pre-2021 approach.

**Standards:** ['NGFS Recommendations for Central Banks (2021)', 'ECB Climate Action Plan (2021)', 'BIS Working Papers â€” Green QE']
**Reference documents:** NGFS â€” Recommendations for Central Banks and Supervisors on Climate-Related Financial Risks (2021); ECB Climate Action Plan (2021); BIS Working Paper 818 â€” Green Central Banking (2020); Bank of England â€” Climate Biennial Exploratory Scenario (CBES) 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises a **Green QE Tilting Score** —
> `Tilt = (GreenShare_portfolio − GreenShare_market)/GreenShare_market × 100`. **No tilt score is
> computed in the code.** There is no portfolio green-share, no market benchmark, no tilt ratio. The page
> is a **cross-central-bank scorecard**: it ranks ~central banks on a set of pre-assigned dimension
> scores (green score, taxonomy adoption, supervisory expectation, macroprudential, reserve greening,
> green-bond purchase), computes simple averages and a radar profile, and shows a seeded 24-month trend.
> Sections below document the scorecard; §8 specifies the actual QE-tilt model.

### 7.1 What the module computes

The core dataset `CBS` holds per-central-bank fields; the page produces:
```js
kpis:  avg(k) = ⌊ Σ CBS[k] / CBS.length ⌋   for each dimension
       ngfs = count(ngfsMemb == 'Yes')
       activeQe = count(greenQe == 'Active')
       mandatory = count(disclosure mandatory)
regChart:  per-region mean greenScore
qeDist:    histogram of greenQe status
radarData: 6-dimension portfolio-average profile
           (greenScore, taxonomyAdoption, supervisoryExpect, macroprudential,
            reserveGreening, greenBondPurchase)
```
Every headline is a **mean or count over the CBS scorecard** — there is no derived monetary-policy metric.

### 7.2 Parameterisation / provenance

| Element | Nature | Provenance |
|---|---|---|
| `CBS` dimension scores | pre-assigned 0–100 per central bank | curated/synthetic scorecard (values not code-visible here) |
| `ngfsMemb`, `greenQe`, disclosure flags | categorical labels | curated against NGFS/ECB public status |
| `QE_DATA` (6 rows) | instrument, volume, share, growth | static reference table |
| `TREND` (24 months) | `greenQeVol = 100+i·15+sr·80`; `cbsActive = 8+i·0.6+sr·3`; `stressTests` | **seeded** synthetic trend |
| `radarData` | mean of 6 dimensions | derived from CBS |

The scorecard *labels* (NGFS membership, active green QE) map to real public status; the numeric dimension
scores are an analyst scoring, and the time trend is seeded, not observed.

### 7.3 Calculation walkthrough

`CBS` → filter (search/region), sort → paged table. KPIs average the dimension columns and count
categorical flags. `regChart` groups by region and means `greenScore`. `radarData` averages the 6
dimensions across all central banks for the composite profile. The `TREND` chart is independent seeded data.

### 7.4 Worked example

Suppose the filtered CBS set has `greenScore` values {80, 60, 70, 90, 50} across 5 banks.
`avg(greenScore) = ⌊(80+60+70+90+50)/5⌋ = ⌊350/5⌋ = 70`. If 4 of 5 have `ngfsMemb == 'Yes'`, the NGFS KPI
shows 4; if 2 have `greenQe == 'Active'`, `activeQe = 2`. The radar plots 70 on the greenScore axis
alongside the means of the other five dimensions. These are transparent descriptive statistics — accurate
as displayed, but they are inputs a human assigned, not a computed monetary-policy quantity.

### 7.5 Data provenance & limitations

- Dimension scores are a **curated/analyst scorecard**; the 24-month `TREND` is **synthetic seeded** data
  (`sr(seed)=frac(sin(seed+1)·10⁴)`).
- The guide's flagship tilt score is **not implemented** — the module cannot say how green a central
  bank's asset purchases are versus the market.
- No collateral-eligibility computation, no reserve-greening quantification beyond a score.

**Framework alignment:** NGFS *Recommendations for Central Banks and Supervisors* (2021) — the membership
and supervisory-expectation flags; ECB Climate Action Plan (2021) — the CSPP green-tilt context the guide's
metric targets; BIS green-QE working papers; BoE CBES. A real "green tilt" is the deviation of a purchase
programme's green weight from a market-cap-neutral benchmark (ECB's post-2021 CSPP tilt is the canonical
example) — specified in §8.

## 8 · Model Specification — Central-Bank Green-QE Tilt & Collateral-Greenness Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Quantify, per central bank, (a) the green tilt of its asset-purchase programme relative to a market-neutral
benchmark, and (b) the greenness of its eligible-collateral universe — to track green monetary policy and
anticipate funding-cost effects for green vs brown issuers.

### 8.2 Conceptual approach
Portfolio-attribution of green weight against a benchmark, mirroring **ECB CSPP tilt disclosure** and
**NGFS "greening monetary policy" analysis**: compute the programme's holdings-weighted green share, compare
to the eligible-universe (market-cap-neutral) green share, and express the difference as a tilt; repeat for
collateral eligibility.

### 8.3 Mathematical specification
```
GreenShare_portfolio = Σ_i w_i^port · green_i        (w = market value weights, green_i∈{0,1} or [0,1])
GreenShare_market    = Σ_i w_i^mkt · green_i         (market-cap-neutral eligible universe)
Tilt = (GreenShare_portfolio − GreenShare_market) / GreenShare_market · 100      (%)
Carbon-intensity tilt = WACI_portfolio − WACI_market                             (tCO₂e/$M)
Collateral greenness = eligible-green MV / total-eligible MV
Funding-cost effect (indicative) = −κ · Tilt · duration    (spread compression for green issuers)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `w^port` | programme holdings weights | central-bank holdings disclosure (CSPP/APP) |
| `w^mkt` | market-neutral eligible weights | index provider / eligible-universe data |
| `green_i` | green label / taxonomy alignment | CBI/ICMA labels, EU Taxonomy |
| `WACI` | weighted avg carbon intensity | issuer emissions / EVIC (PCAF) |
| `κ` | tilt→spread sensitivity | event studies on CSPP tilt announcements |

### 8.4 Data requirements
Programme holdings (ISIN-level MV), eligible-universe composition, green labels and issuer carbon
intensity, collateral hairc60t schedules. Sources: central-bank holdings disclosures (free), index data
(vendor), CBI/ICMA labels, emissions (Trucost/CDP). The platform holds green-label taxonomies and
issuance seeds; holdings-level data is not present.

### 8.5 Validation & benchmarking plan
Reconcile computed ECB tilt against ECB's own published CSPP tilt; validate WACI against PCAF-consistent
issuer emissions; sensitivity of tilt to green-label definition (labelled-only vs taxonomy-aligned);
event-study the spread effect around tilt announcements.

### 8.6 Limitations & model risk
Green labelling choice (labelled bonds vs taxonomy alignment) swings the tilt materially — report both.
Holdings disclosures lag and are partial. The funding-cost link `κ` is empirically weak. Conservative
fallback: report GreenShare_portfolio and GreenShare_market separately when the benchmark universe is
uncertain, rather than a single tilt number.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the Green QE tilting score and source the trend data (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's Green QE Tilting Score (`Tilt = (GreenShare_portfolio − GreenShare_market)/GreenShare_market × 100`) is not computed — there's no portfolio green-share, market benchmark, or tilt ratio; the page is a cross-central-bank scorecard ranking ~130 NGFS members on pre-assigned dimension scores (a curated/analyst scorecard), with the 24-month `TREND` synthetically `sr()`-seeded. Evolution A builds the tilt score for real: model a central bank's asset-purchase portfolio green-share against a market benchmark green-share, computing the tilt per §5 — turning the descriptive scorecard into an analytical tool that quantifies how far a CB's purchases deviate from market-neutral (the ECB pre-2021 baseline). It also replaces the seeded trend with a sourced time series of NGFS supervisory-progress milestones.

**How.** (1) A backend route computing tilt from a CB's holdings green-share vs a benchmark green-share (both parameterisable, sourced from CB disclosures where available). (2) The scorecard dimension scores kept as curated reference, but the trend backed by dated NGFS milestone data rather than `sr()`. (3) Collateral-framework and green-QE-design analytics tied to the computed tilt.

**Prerequisites.** CB portfolio green-share and benchmark data (curated to start); NGFS milestone dates for the trend. The seeded `TREND` (§7-flagged) replaced. **Acceptance:** the tilt score computes per §5 from portfolio and benchmark green-shares; the trend is a sourced milestone series, not `sr()`; the scorecard remains curated reference with provenance.

### 9.2 Evolution B — Central-bank climate-policy copilot (LLM tier 1 → 2)

**What.** A copilot for policy analysts and CB watchers: "how does the ECB's green-QE tilt compare to the BoE's, and which NGFS members lag on supervisory expectations?" narrates the cross-CB scorecard and NGFS membership analytics from the atlas corpus, with tier-2 computing tilt scores via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (NGFS framework, green-QE design, climate-aligned collateral, the ECB pre/post-2021 approach). The copilot's value is comparative central-bank analysis — where each CB sits on supervisory expectations and monetary-tool adoption. Guardrail, pre-Evolution-A: the tilt score isn't computed and the trend is seeded, so it must present scorecard dimensions as curated analyst judgement and refuse tilt figures. Tier 2 tool-calls the tilt endpoint. Every figure validated against tool output.

**Prerequisites.** Corpus embedding; Evolution A for computed tilt. **Acceptance:** post-Evolution-A, every tilt figure traces to a tool call; the scorecard comparisons cite the curated dimension data; pre-Evolution-A the copilot declines tilt-score questions.