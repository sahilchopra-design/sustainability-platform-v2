# Climate Solution Taxonomy
**Module ID:** `climate-solution-taxonomy` · **Route:** `/climate-solution-taxonomy` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides a structured IEA Net Zero-aligned taxonomy of climate technology and nature-based solutions, classifying investments by mitigation potential, technology readiness, and financial characteristics.

> **Business value:** Enables climate investors, green bond issuers, and taxonomy compliance teams to systematically identify, classify, and evaluate climate solutions against internationally recognised frameworks.

**How an analyst works this module:**
- Structure taxonomy hierarchy: sector → sub-sector → technology → solution
- Assign IEA NZE abatement potential, technology readiness level (TRL 1–9), and marginal abatement cost
- Map EU Taxonomy alignment and Paris Agreement Article 2.1(c) finance alignment criteria
- Enable filtering by investor type, geography, and ticket size for deal sourcing

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `CAT_MAP`, `COMPANIES`, `CustomTooltip`, `Kpi`, `PIE_COLORS`, `TABS`, `TAXONOMY_NAMES`, `TabAlignmentMatrix`, `TabCategoryExplorer`, `TabClassifier`, `TabPortfolioScreening`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CATEGORIES` | 13 | `name`, `icon`, `color`, `marketSize`, `growth`, `investReq`, `subCats`, `keyTech`, `desc` |
| `TABS` | 5 | `label`, `icon` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CAT_MAP` | `Object.fromEntries(CATEGORIES.map(c=>[c.id,c]));` |
| `name` | `prefixes[Math.floor(s1*prefixes.length)] + ' ' + suffixes[Math.floor(s2*suffixes.length)];` |
| `sector` | `sectors[Math.floor(sr(i*17+1)*sectors.length)];` |
| `mktCap` | `Math.round(500 + sr(i*19+2)*99500);` |
| `numCats` | `1 + Math.floor(sr(i*23+4)*4);` |
| `euAlign` | `Math.round(sr(i*41+3)*100);` |
| `cbiClass` | `['Aligned','Partially Aligned','Not Aligned','Under Review'][Math.floor(sr(i*43+5)*4)];` |
| `ftseGreen` | `Math.round(sr(i*47+7)*100);` |
| `propScore` | `Math.round(20+sr(i*53+9)*80);` |
| `trl` | `1+Math.floor(sr(i*59+11)*9);` |
| `greenRevPct` | `Math.round(catIds.reduce((sum,cid)=>sum+(revBreakdown[cid]\|\|0),0) * (sr(i*61+1)*0.5+0.3));` |
| `revenue` | `Math.round(50 + sr(i*63+13)*9950);` |
| `founded` | `1980 + Math.floor(sr(i*67+15)*43);` |
| `base` | `CATEGORIES[catIdx].marketSize * 0.4;` |
| `growth` | `CATEGORIES[catIdx].growth/100;` |
| `val` | `Math.round(base * Math.pow(1+growth, y-2020) + sr(catIdx*100+y)*50);` |
| `badge` | `(bg,fg)=>({ display:'inline-block', padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600, background:bg, color:fg\|\|T.text, marginRight:6, marginBottom:4 });` |
| `stackedData` | `useMemo(()=>{ return co.catIds.map(cid=>({ name:CAT_MAP[cid].name, value:co.revBreakdown[cid]\|\|0, fill:CAT_MAP[cid].color, }));` |
| `radarMetrics` | `useMemo(()=>[ {name:'EU Taxonomy', val:co.euAlign}, {name:'CBI Score', val:cbiNum(co)}, {name:'FTSE Green', val:co.ftseGreen}, {name:'Proprietary', val:co.propScore}, {name:'Tech Readiness', val:Math.round(co.trl/9*100)}, {name:'Green Rev %', val:co.greenRevPct}, ],[selCo]);` |
| `greenPct` | `wizRevStreams.filter(r=>greenCats.includes(r.cat)).reduce((s,r)=>s+r.pct,0);` |
| `totalPct` | `wizRevStreams.reduce((s,r)=>s+r.pct,0);` |
| `ftse` | `Math.round(Math.min(greenPct*0.9 + sr(888)*8, 100));` |
| `prop` | `Math.round(Math.min(greenPct*0.7 + 20 + sr(999)*10, 100));` |
| `catStats` | `useMemo(()=> CATEGORIES.map((cat,ci)=>{` |
| `avgGreen` | `cos.length? Math.round(cos.reduce((s,c)=>s+c.greenRevPct,0)/cos.length):0;` |
| `sorted` | `useMemo(()=>[...catStats].sort((a,b)=> sortBy==='growth'?b.growth-a.growth : sortBy==='companyCount'?b.companyCount-a.companyCount : b.marketSize-a.marketSize),[sortBy]);` |
| `comparisonData` | `useMemo(()=> catStats.map(c=>({name:c.name.length>16?c.name.slice(0,15)+'\u2026':c.name, 'Market ($B)':c.marketSize, 'Growth (%)':c.growth, Companies:c.companyCount})),[]);` |
| `spread` | `Math.max(...scores)-Math.min(...scores);` |
| `maxIdx` | `scores.indexOf(Math.max(...scores));` |
| `minIdx` | `scores.indexOf(Math.min(...scores));` |
| `avg` | `(arr,fn)=>arr.length?Math.round(arr.reduce((s,c)=>s+fn(c),0)/arr.length):0;` |
| `total` | `w.greenRev+w.euAlign+w.propScore+w.trl;` |
| `rows` | `screened.map(c=>[c.name,c.sector,c.country,c.greenRevPct,c.euAlign,c.cbiClass,c.ftseGreen,c.propScore,c.trl,c.mktCap,c.revenue,c.employees,c.founded,c.catIds.map(id=>CAT_MAP[id]?.name).join(';')]);` |
| `csv` | `[headers.join(','), ...rows.map(r=>r.map(v=>typeof v==='string'&&v.includes(',')?`"${v}"`:v).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `PIE_COLORS`, `TABS`, `TAXONOMY_NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Technologies Mapped | — | IEA NZE 2021 | Number of distinct climate solutions categorised in the taxonomy spanning energy, transport, buildings, industry, AFOLU, and CDR. |
| Required Clean Energy Investment (2030) | — | IEA NZE 2023 Update | Annual clean energy investment needed globally by 2030 to remain on a 1.5°C trajectory. |
- **IEA technology briefs, IPCC abatement cost data, EU Taxonomy technical annexes** → Taxonomy structuring, TRL assignment, abatement potential normalisation → **Searchable taxonomy browser, deal sourcing filters, mitigation potential rankings**

## 5 · Intermediate Transformation Logic
**Methodology:** Mitigation Potential Score
**Headline formula:** `MPS = AnnualAbatement(GtCO₂e) × TRL Weight × CostCurve Position`

Combines a solution's annual abatement potential with technology readiness level weight and marginal abatement cost position on the global cost curve.

**Standards:** ['IEA Net Zero by 2050 2021', 'IPCC AR6 WG3 Chapter 12']
**Reference documents:** IEA Net Zero by 2050 2021 and 2023 Update; IPCC AR6 WG3 Chapter 12 Cross-sector Perspectives; EU Taxonomy Regulation Technical Screening Criteria; BNEF New Energy Outlook 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide advertises a **Mitigation Potential Score**
> `MPS = AnnualAbatement(GtCO₂e) × TRL Weight × CostCurve Position`. **No MPS is computed anywhere in the
> code.** The page is a company/category *taxonomy browser*: it scores companies on EU-Taxonomy alignment,
> CBI classification, FTSE Green revenue, a proprietary score, TRL and green-revenue %, all `sr()`-seeded,
> and rolls them up by category. Abatement potential (GtCO₂e), MAC-curve position and TRL-weighted
> mitigation never appear. §8 specifies the MPS the guide names.

### 7.1 What the module computes

Per synthetic company, six alignment/readiness scores drive a radar and screening table:
```js
euAlign   = round(sr(i·41+3)·100)                     // EU Taxonomy alignment %
cbiClass  = ['Aligned','Partially Aligned','Not Aligned','Under Review'][floor(sr(i·43+5)·4)]
ftseGreen = round(sr(i·47+7)·100)                     // FTSE Green Revenues %
propScore = round(20 + sr(i·53+9)·80)                 // proprietary 20–100
trl       = 1 + floor(sr(i·59+11)·9)                  // TRL 1–9
greenRevPct = round( Σ_cat revBreakdown[cat] · (sr(i·61+1)·0.5+0.3) )
```
Category market projection (the only compound-growth calc):
```js
val = round( CATEGORIES[catIdx].marketSize·0.4 · (1+growth)^(year−2020) + sr(catIdx·100+year)·50 )
```
A wizard scores a hypothetical company's revenue streams: `greenPct = Σ green-category revenue %`, then
`ftse = min(greenPct·0.9 + sr·8, 100)`, `prop = min(greenPct·0.7 + 20 + sr·10, 100)`.

### 7.2 Parameterisation / scoring rubric

| Quantity | Generation | Provenance |
|---|---|---|
| `CATEGORIES` (13: marketSize, growth, investReq, TRL, keyTech) | seed schema | curated (IEA/IPCC solution taxonomy) |
| `euAlign`, `ftseGreen`, `propScore`, `trl` | `sr()` seeded | synthetic demo value |
| Radar metrics | EU/CBI/FTSE/Prop/TRL/GreenRev | composite display |
| Category `val` projection | 40% of market × (1+growth)^t | heuristic growth extrapolation |
| Screening weights `w` | greenRev+euAlign+propScore+trl | user-set composite |

### 7.3 Calculation walkthrough

Seeds → company name/sector/mktCap/categories/scores → `radarMetrics` per company →
`catStats` aggregates market size, growth, company count and average green-rev per category →
`comparisonData`/`sorted` bar+sort views → CSV export. The market projection compounds a category's
`marketSize·0.4` at its stored growth rate from a 2020 base.

### 7.4 Worked example

Category "Solar & Storage" with `marketSize = $200B`, `growth = 18%`, projected to 2030:
```
val = 200·0.4 · (1.18)^(2030−2020) + noise
    = 80 · (1.18)^10 ≈ 80 · 5.234 ≈ $419B  (+ ~$0–50 noise)
```
A company in this category with `greenRevPct = 65`, `euAlign = 80`, `ftseGreen = 72`, `propScore = 70`,
`trl = 8` renders a radar with `Tech Readiness = round(8/9·100) = 89`; its screening composite (equal-weight
of greenRev/euAlign/propScore/trl-normalised) ≈ (65+80+70+89)/4 ≈ **76**, placing it in the top screening
band.

### 7.5 Data provenance & limitations

- Company scores are **synthetic** (`sr()` PRNG); only the 13 `CATEGORIES` market-size/growth constants are
  curated from IEA/IPCC-style figures.
- No abatement quantification (GtCO₂e), no marginal-abatement-cost-curve position, no TRL *weighting* of
  abatement — so the taxonomy classifies but does not rank by mitigation potential as the guide implies.
- EU-Taxonomy alignment is a random % not a technical-screening-criteria assessment; CBI class is a random
  pick, not a Climate Bonds Taxonomy determination.

**Framework alignment:** IEA *Net Zero by 2050* (solution set, $4T/yr 2030 investment cited) · IPCC AR6 WG3
Ch.12 (cross-sector abatement) · EU Taxonomy technical-screening criteria (alignment metric it approximates)
· Climate Bonds Initiative Taxonomy (CBI classification field) · FTSE Green Revenues classification.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Rank climate solutions and the companies delivering them by *mitigation potential*
— abatement scale × readiness × cost-competitiveness — for deal sourcing and capital-allocation triage.

**8.2 Conceptual approach.** The guide's MPS operationalised as a **marginal-abatement-cost-curve (MACC)
weighting** (McKinsey/IEA MACC) combined with a TRL-based deployment-probability weight (IEA ETP), so that
low-cost, high-readiness, high-abatement solutions rank highest — mirroring IEA Energy Technology
Perspectives clean-tech prioritisation and BNEF technology-cost curves.

**8.3 Mathematical specification.**
```
MPS_s = AnnualAbatement_s(GtCO₂e/yr) · w_TRL(TRL_s) · w_cost(MAC_s)
w_TRL(k)  = k/9                                   (deployment-readiness weight)
w_cost(m) = 1 / (1 + exp((m − m0)/κ))             (logistic: cheap abatement weighted ↑; m0 = $0/t threshold)
Company_MPS = Σ_s revShare_company,s · MPS_s      (portfolio-weighted solution exposure)
```

| Parameter | Source |
|---|---|
| AnnualAbatement_s | IEA NZE / IPCC AR6 sector abatement potentials |
| MAC_s | McKinsey MACC / IEA cost curves ($/tCO₂e) |
| m0, κ | calibrated to carbon-price and cost-curve slope |
| TRL_s | IEA ETP technology readiness assessment |

**8.4 Data requirements.** Per-solution abatement, MAC, TRL; company revenue-by-solution split; EU-Taxonomy
technical criteria. Free: IEA NZE tables, IPCC AR6; vendor: BNEF cost curves, FTSE Green Revenues.

**8.5 Validation & benchmarking.** Reconcile solution MPS ranking against IEA ETP priority technologies;
sensitivity on cost-curve slope; check company MPS correlates with realised green-revenue growth.

**8.6 Limitations & model risk.** Abatement potentials scenario-dependent; MAC curves volatile with input
prices; double-counting across overlapping solutions. Fallback: rank by abatement × TRL only when reliable
MAC data is missing.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the advertised Mitigation Potential Score from curated abatement data (analytics ladder: rung 1 → 2)

**What.** §7 flags a guide↔code mismatch: the promised
`MPS = AnnualAbatement(GtCO₂e) × TRL Weight × CostCurve Position` is never computed —
the page is a taxonomy browser whose company scores (`euAlign`, `ftseGreen`,
`propScore`, `trl`, CBI class) are all `sr()`-seeded. Evolution A implements the MPS
honestly: extend the 13 curated `CATEGORIES` (the only real data on the page) with
per-technology abatement potential, MAC-curve position, and TRL from IPCC AR6 WG3
Ch.12 and IEA NZE tables, then rank solutions by computed mitigation potential under
selectable pathway scenarios (NZE vs APS).

**How.** (1) Curate a `solution_abatement` reference table (technology, GtCO₂e/yr
potential by 2030/2050, MAC $/tCO₂, TRL) — ~60 rows from published IPCC/IEA figures,
loaded via the refdata layer like the ESRS/GRI catalogs. (2) Frontend computes MPS from
that table with a documented TRL weight vector and normalized MAC position, replacing
the seeded `propScore`. (3) Purge the `sr()` company scores or explicitly relabel the
company screen as illustrative; the wizard's revenue-stream scorer keeps its real
`greenPct` summation. (4) Scenario toggle switches the abatement column between IEA
pathways — the rung-2 step.

**Prerequisites.** The seeded-random company scores are a documented defect
(§7.5) and must be removed or quarantined before MPS ships next to them —
`check_no_fabricated_random.py` conventions apply to the JS seed pattern too.
**Acceptance:** MPS ranking reproduces a hand-computed spot check for 3 technologies;
switching NZE→APS changes rankings; zero `sr()` calls feed any displayed score.

### 9.2 Evolution B — Deal-sourcing taxonomy copilot (LLM tier 1)

**What.** The overview promises "filtering by investor type, geography, and ticket size
for deal sourcing" — a classification task LLMs do well when grounded. Evolution B adds
a copilot that maps a described company or deal ("Series B, grid-scale iron-air
storage, EU revenue 70%") onto the module's taxonomy: category, indicative TRL band,
EU-Taxonomy technical-screening criteria that would apply, and — after Evolution A —
its category's computed MPS context, always labelled as a screening aid, not an
alignment determination.

**How.** Tier-1 RAG: corpus is the 13 `CATEGORIES` constants, the Evolution A
`solution_abatement` table, the EU Taxonomy TSC references §5 cites, and this Atlas
record, embedded per the roadmap's `llm_corpus_chunks` design. The system prompt
encodes the module's own honesty flag: current company-level EU-alignment percentages
are synthetic, so the copilot must never quote one as an assessment. Output is a
structured classification card the existing screening table can render.

**Prerequisites.** Evolution A's reference table (otherwise the copilot has only
category names and market sizes to ground on); embedding pipeline (D3).
**Acceptance:** 10 hand-labelled test companies classify to the correct category ≥8/10;
the copilot refuses to state a company's EU-Taxonomy alignment percentage and instead
lists the TSC that would need assessment.