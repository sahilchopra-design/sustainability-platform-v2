# VC Impact
**Module ID:** `vc-impact` · **Route:** `/vc-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Venture capital impact investment measurement and reporting platform; tracks impact KPIs across portfolio companies against IMP, IRIS+ and SDG frameworks with financial return attribution.

> **Business value:** Impact VC has grown from $2B to ≄18B AUM 2015–2023; GIIN reports median VC impact funds achieve 3.0× IMM while delivering competitive financial returns to conventional venture benchmarks.

**How an analyst works this module:**
- Define impact thesis and target SDGs at fund level
- Onboard portfolio companies with IRIS+ KPI framework
- Collect quarterly impact data and validate against IRIS+ standards
- Compute IMM using sector-appropriate monetisation coefficients
- Report to LPs against IMP five dimensions and UN SDG targets

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `DATA`, `NAMES`, `STAGE_PROFILE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.cre` |
| `sector` | `SECTORS[Math.floor(s(23)*SECTORS.length)];` |
| `risk` | `RISK_LEVELS[Math.floor(s(29)*RISK_LEVELS.length)];` |
| `volume` | `Math.floor(10+s(83)*490); // capital invested/deployed ($M) — same figure already shown on page as "Deployed"` |
| `riskAdj` | `risk==='Critical'?0.3:risk==='High'?0.55:risk==='Medium'?0.8:1.0; // downside adjustment for realised outcome` |
| `grossMultiple` | `Math.max(0.05,(profile.multMin+s(151)*(profile.multMax-profile.multMin))*riskAdj);` |
| `interimYear` | `Math.max(1,Math.floor(years/2));` |
| `totalDistribution` | `volume*grossMultiple; // total cash returned to LPs over the hold period` |
| `interimDist` | `totalDistribution*0.25;` |
| `finalDist` | `totalDistribution-interimDist;` |
| `cashFlows` | `Array(years+1).fill(0);` |
| `moic` | `totalDistribution/volume; // MOIC = total distributions / total invested capital` |
| `irr` | `calcIRR(cashFlows)*100; // IRR = discount rate that zeroes NPV of the cash-flow series` |
| `filtered` | `useMemo(()=>{let d=[...DATA];if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)\|\|r.sector.toLowerCase().includes(s)\|\|r.category.toLowerCase().includes(s)\|\|r.region.toLowerCase().includes(s));}if(fCat!=='All')d=d.filter(r=>r.category===fCat);if(fSector!=='All')d=d.filter(r=>r.sector===fSector);if(fRisk!=` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgScore:0,avgIRR:0,avgMOIC:0,totalVol:0,highRisk:0};return{count:d.length,avgScore:d.reduce((a,r)=>a+r.score,0)/d.length,avgIRR:d.reduce((a,r)=>a+r.irr,0)/d.leng` |
| `catDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.category]=(m[r.category]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value})).sort((a,b)=>b.value-a.value);},[fi` |
| `riskDist` | `useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.risk===l).length})),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;return[{axis:'Env',value:avg('envScore')},{axis:'Social',value:avg('socScore')},{axis:'Gov',value:avg('govScore')},{` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,score:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]);` |
| `sectorScore` | `useMemo(()=>{const m={};const c={};filtered.forEach(r=>{m[r.sector]=(m[r.sector]\|\|0)+r.score;c[r.sector]=(c[r.sector]\|\|0)+1;});return Object.entries(m).map(([name,sum])=>({name,score:sum/c[name],env:filtered.filter(r=>r.` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio IMM | — | IMM Engine | Average impact multiple of money across active VC impact portfolio; 2×+ considered impact-additive. |
| Companies with IRIS+ KPIs | — | IRIS+ Database | Proportion of portfolio companies with standardised IRIS+ impact metrics tracked quarterly. |
| SDG Contribution Score | — | SDG Mapping | Average SDG contribution score across portfolio; mapped to primary and secondary SDGs by sector. |
- **Portfolio Company Impact Data, IRIS+ Metrics, SDG Mapping, Financial Returns** → IMM computation + IRIS+ aggregation + SDG contribution scoring → **LP impact reports, IRIS+ dashboards, SDG contribution statements, IMP disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** Impact Multiple of Money
**Headline formula:** `IMM = Impact Value Created / Capital Invested`

Ratio of monetised social/environmental impact to capital invested; complements financial IRR with impact return measure.

**Standards:** ['IMP Five Dimensions', 'IRIS+ Metrics Catalogue']
**Reference documents:** IMP Five Dimensions of Impact 2019; IRIS+ Metrics Catalogue (GIIN); UN SDG Impact Standards for Private Equity 2021; Impact Frontiers Contribution Thesis 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an "Impact Multiple of Money"
> methodology (`IMM = Impact Value Created / Capital Invested`) benchmarked against IRIS+ and IMP
> Five Dimensions, headlining "Portfolio IMM 3.2×" and "94% of companies with IRIS+ KPIs." **None of
> this exists in code.** There is no `IMM` variable, no IRIS+ metric catalogue, and no SDG mapping
> table. The fields labelled "IRR%" and "MOIC" in the KPI row are literally the generic
> `completion`/`compliance` random fields relabelled — they are not derived from cash flows. The
> module is a 50-row synthetic VC portfolio directory with ESG/impact scores; the sections below
> document that as-built behaviour.

### 7.1 What the module computes

`genData(50)` builds 50 synthetic investments, each independently seeded, across `category` (8
verticals: Climate Tech, Health Tech, …), `sector` (6 funding stages: Seed → Late Stage), and `risk`
(4-level). Per investment: `score` (composite "Impact," 20–95), `envScore`/`socScore`/`govScore`
(15–95), six unlabelled metrics `m1`–`m6` (displayed as "Jobs," "CO2 Saved," "SDG Align,"
"Beneficiaries," "Green Rev%," "Multiple" in different table views but never defined or computed
consistently), `completion` (displayed as "IRR%," range 20–98%), `compliance` (displayed as "MOIC,"
range 30–98%), `volume`/`exposure` (deployed capital / valuation, $10M–$500M), quarterly score trend
`q1`–`q4`, `region`, `status`.

```js
score        = Math.floor(20 + s(31)*75)          // labelled "Impact"
completion   = Math.floor(20 + s(73)*78)          // labelled "IRR%" in the KPI row and table
compliance   = Math.floor(30 + s(79)*68)          // labelled "MOIC" in the KPI row and table
```

### 7.2 Parameterisation

| Field (code name → UI label) | Range | Provenance |
|---|---|---|
| `score` → "Impact" | 20–95 | `20 + s(31)·75`, synthetic uniform |
| `completion` → "IRR%" | 20–98% | `20 + s(73)·78` — **not an IRR calculation; no cash-flow series exists anywhere in the file** |
| `compliance` → "MOIC" | 30–98% | `30 + s(79)·68` — **a MOIC is normally a multiple (e.g. 2.1×), not a percentage; the field is mislabelled** |
| `volume` → "Deployed $M" | $10M–$500M | `10 + s(83)·490` |
| `m1`–`m6` (Jobs/CO2/SDG/Beneficiaries/GreenRev/Multiple) | Various | Independent `s()` draws with no defined unit or methodology |

### 7.3 Calculation walkthrough

1. Filters (search, `fCat`, `fSector`, `fRisk`) reduce `DATA` to `filtered`, sorted/paginated.
2. `kpis` computes unweighted means of `score`, `completion`, `compliance` and a sum of `volume`
   across `filtered` — rendered as "Avg Impact," "Avg IRR," "Avg MOIC," "Total Deployed."
3. `catDist`/`riskDist` count `filtered` into vertical/risk buckets.
4. `radarData` averages `envScore`, `socScore`, `govScore`, `completion`, `compliance`, `score` into
   a 6-axis radar — mixing genuinely impact-related fields (env/soc/gov) with the mislabelled
   financial-sounding fields (completion/compliance) on the same 0–100 scale.
5. `trendData` averages `q1`–`q4` (which track `score`, not a return series) across `filtered`.
6. `sectorScore` groups by `sector` (funding stage) and averages `score`/`env`/`soc`/`gov`.

### 7.4 Worked example

For the KPI row, if `filtered.length = 10` with `completion` values summing to 650, the "Avg IRR" KPI
shows `65.0%`. This number has **no relationship to any actual internal rate of return** — there is
no cash-flow schedule (capital calls, distributions, terminal valuation) anywhere in the file for an
IRR solver to operate on. A reader interpreting "Avg IRR: 65.0%" as a real fund performance metric
would be materially misled; it is a uniformly-distributed random number in the 20–98 range.

### 7.5 Data provenance & limitations

- **All 50 investments are synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`; no portfolio
  company, cash-flow, or IRIS+ metric data underlies any row.
- **The "IRR%" and "MOIC" labels are cosmetic relabelling of generic random fields** (`completion`,
  `compliance`) — this is the most significant fabrication-risk finding in the module: a user could
  reasonably believe these are computed financial returns.
- **No IMM, IRIS+ catalogue, or SDG mapping exists** despite being the guide's headline methodology —
  `m3` is labelled "SDG Align" in one table view but is just `s(59)·50`, unconnected to any of the 17
  UN SDGs.
- No impact monetisation/shadow-pricing step (the core of any real IMM calculation) is present.

**Framework alignment:** IMP Five Dimensions of Impact and GIIN IRIS+ (both named in the guide) are
**not implemented** — there is no What/Who/How-Much/Contribution/Risk assessment and no IRIS+ metric
selection anywhere in the code. See §8 for the production design that would actually deliver the
guide's stated methodology.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production VC Impact Measurement model gives fund managers and LPs a defensible Impact Multiple of
Money and a real cash-flow-based IRR/MOIC, aligned to GIIN IRIS+ metrics and the IMP Five Dimensions,
for quarterly LP reporting and impact-adjusted portfolio construction. Scope: all active VC portfolio
companies with tracked IRIS+ KPIs and cash-flow history.

### 8.2 Conceptual approach
Separate the **financial return calculation** from the **impact calculation** entirely — this is the
standard practice at GIIN-aligned funds and mirrored in the Golden Gate University / Impact Frontiers
"blended value" methodology, and in Cambridge Associates' impact-fund benchmarking. Financial IRR/MOIC
use the actual capital-call and distribution cash-flow ledger (Newton-Raphson IRR solver, standard PE
convention). Impact uses IRIS+ metric selection per portfolio company's theory of change, monetised
via sector-appropriate shadow prices (cf. Wellbeing-Adjusted Returns module's HM Treasury Green Book
approach) to produce IMM.

### 8.3 Mathematical specification

```
IRR:   Σ_t CF_t / (1+IRR)^t = 0                         // CF_t = capital calls (−), distributions (+), NAV at t=T
MOIC:  (Σ Distributions + NAV_current) / Σ Capital_Called
IMM:   Σ_company Σ_metric (IRISPlusValue_metric × ShadowPrice_metric) / Σ Capital_Invested
SDGAlign_company = Σ_sdg Relevance_sdg × ContributionWeight_sdg / 17          // 0-1 normalised, IMP "Contribution" dimension
PortfolioIMM = Σ_company (IMM_company × Capital_Invested_company) / Σ Capital_Invested   // capital-weighted
```

| Parameter | Calibration source |
|---|---|
| IRIS+ metric catalogue | GIIN IRIS+ System (public, versioned) |
| `ShadowPrice_metric` | Sector-specific: tCO2e avoided → EPA social cost of carbon; jobs created → ILO decent-work wage differential; HM Treasury Green Book wellbeing valuations for social metrics |
| IMP Five Dimensions scoring | Impact Management Project public framework (What/Who/How Much/Contribution/Risk) |
| SDG relevance mapping | UN SDG Impact Standards for Private Equity 2021 sector-to-SDG crosswalk |

### 8.4 Data requirements
Actual capital-call/distribution ledger per investment (fund administrator data), quarterly IRIS+ KPI
submissions from portfolio companies, sector-to-SDG crosswalk, and shadow-price tables. The platform's
existing Wellbeing-Adjusted Returns module (`wellbeing-adjusted-returns`) already implements a
comparable shadow-pricing pattern and its `WELLBY`-style categories could be reused as the
`ShadowPrice_metric` source for overlapping social/health metrics.

### 8.5 Validation & benchmarking plan
Reconcile fund-level IRR/MOIC against the fund administrator's official quarterly capital account
statements (should match exactly, since it's the same cash-flow ledger); benchmark PortfolioIMM
against GIIN's published median VC impact-fund IMM (~3.0×) for sanity, not as a target to reverse-
engineer; sensitivity-test IMM to ±30% shadow-price assumption changes on the top-3 impact-driving
metrics per company.

### 8.6 Limitations & model risk
Shadow pricing embeds significant valuation judgement (is a job created in a low-income region worth
the same shadow price as one in a high-income region — most frameworks say no, and require regional
wage-differential adjustment). IRR on illiquid/early-stage positions depends heavily on NAV marks
that are themselves estimates, not realised prices — flag any portfolio IRR where >50% of NAV is
unrealised as "provisional" rather than presenting it with the same confidence as a realised return.

## 9 · Future Evolution

### 9.1 Evolution A — Real cash-flow IRR/MOIC and a first IMM calculation (analytics ladder: rung 1 → 2)

**What.** Remove the module's most serious documented fabrication risk, then build the
advertised methodology. §7.5 flags that the "IRR%" and "MOIC" KPIs are cosmetic
relabels of generic random fields (`completion`, `compliance`) — there is no cash-flow
series anywhere in the file, and "Avg IRR: 65.0%" is a uniform draw a user could
reasonably mistake for fund performance. Evolution A implements §8's separation:
(1) a per-investment capital-call/distribution ledger with a Newton-Raphson IRR solver
and `MOIC = (distributions + NAV) / called` — note the page already contains partial
scaffolding (`calcIRR(cashFlows)`, `grossMultiple`, `totalDistribution` appear in §2's
derived-values map) that the KPI row simply doesn't use; (2) a first IMM slice:
IRIS+ metric selection per company with shadow prices (tCO2e → social cost of carbon;
social metrics reusing the `wellbeing-adjusted-returns` module's Green Book pattern,
per §8.4), giving `IMM = Σ(metric × shadow price) / capital invested`, capital-weighted
to portfolio level.

**How.** Backend `vc_impact_engine` with `POST /returns` and `POST /imm`; new tables
`vc_cashflows`, `vc_iris_kpis`; the m1–m6 unlabelled random metrics replaced by typed
IRIS+ fields. Flag any IRR with >50% unrealised NAV as provisional, per §8.6.

**Prerequisites.** The mislabelled fields acknowledged and deleted (not re-skinned);
shadow-price table seeded with cited sources. **Acceptance:** KPI-row IRR changes when
a distribution is edited in the ledger; MOIC renders as a multiple (2.1×), not a
percentage; a fixture portfolio's IRR matches a spreadsheet XIRR to 1bp.

### 9.2 Evolution B — LP-reporting copilot over the IMM engine (LLM tier 2)

**What.** Quarterly LP impact reports are the module's stated deliverable, and they're
narrative-heavy: IMP Five Dimensions commentary (What/Who/How Much/Contribution/Risk)
wrapped around computed figures. Evolution B is a tool-calling drafter: "prepare the
Q3 LP letter's impact section for Fund II" calls `POST /returns` and `POST /imm` per
company, then composes the letter with each IMM, IRR, MOIC, and IRIS+ metric value
traced to tool output, the SDG contribution mapping from the engine's crosswalk, and
provisional-IRR flags carried through verbatim rather than smoothed away.

**How.** Tier-2 stack: read-only tool schemas from Evolution A's OpenAPI operations;
grounding corpus is this Atlas page plus the GIIN IRIS+ definitions embedded in
`llm_corpus_chunks`. Shadow-price sensitivity (§8.5's ±30% test) is exposed as a tool
so the copilot can answer "how robust is our 3.1× IMM?" with a computed range instead
of reassurance.

**Prerequisites (hard).** Evolution A complete — drafting LP letters from today's
random "IRR" fields would put fabricated performance figures into investor
communications, the exact failure the platform's no-fabrication contract exists to
prevent. **Acceptance:** every numeric in a drafted letter appears in a tool response;
provisional flags on unrealised-NAV-heavy IRRs are preserved in the text; asked for a
benchmark the engine lacks (e.g. Cambridge Associates quartile), the copilot refuses
and names the GIIN median comparison it can compute.