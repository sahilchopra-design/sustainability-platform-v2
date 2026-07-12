# Impact Measurement Hub
**Module ID:** `impact-measurement-hub` · **Route:** `/impact-measurement-hub` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `ENGAGEMENT_STATUSES`, `ENGAGEMENT_TYPES`, `QUARTERS`, `REPORT_SECTIONS`, `SDG_COLORS`, `SDG_NAMES`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `REPORT_SECTIONS` | `['Executive Summary','Impact KPI Dashboard','SDG Portfolio Coverage','Impact Attribution Analysis','Theory of Change Progress','Impact-Weighted Accounts','Additionality Assessment','Board Recommendations'];` |
| `pIdx` | `Math.floor(s1*COMPANY_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*COMPANY_SUFFIXES.length);` |
| `secIdx` | `Math.floor(s3*SECTORS.length);` |
| `sdgCoverage` | `Math.floor(sr(i*31+1030)*8+4);` |
| `impactScore` | `Math.round(sr(i*43+1050)*50+35);` |
| `additionalityScore` | `Math.round(sr(i*53+1060)*50+30);` |
| `iwaProfitAdj` | `Math.round((sr(i*67+1070)*200-80)*10)/10;` |
| `invested` | `Math.round((sr(i*71+1080)*50+5)*10)/10;` |
| `impactPerM` | `Math.round(sr(i*29+1090)*60+10);` |
| `co2Avoided` | `Math.round(sr(i*37+1100)*10000+500);` |
| `jobsCreated` | `Math.round(sr(i*41+1110)*500+20);` |
| `livesImproved` | `Math.round(sr(i*47+1120)*2000+100);` |
| `typeIdx` | `Math.floor(sr(i*73+1200)*alertTypes.length);` |
| `sevIdx` | `Math.floor(sr(i*41+1210)*3);` |
| `statusIdx` | `Math.floor(sr(i*41+1310)*ENGAGEMENT_STATUSES.length);` |
| `csv` | `[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `kpis` | `useMemo(()=>{ const totInvested=Math.round(holdings.reduce((a,h)=>a+h.invested,0));` |
| `avgImpact` | `Math.round(holdings.reduce((a,h)=>a+h.impactScore,0)/holdings.length);` |
| `avgAdditionality` | `Math.round(holdings.reduce((a,h)=>a+h.additionalityScore,0)/holdings.length);` |
| `totIWAdj` | `Math.round(holdings.reduce((a,h)=>a+h.iwaProfitAdj,0));` |
| `totCO2` | `holdings.reduce((a,h)=>a+h.co2Avoided,0);` |
| `totJobs` | `holdings.reduce((a,h)=>a+h.jobsCreated,0);` |
| `totLives` | `holdings.reduce((a,h)=>a+h.livesImproved,0);` |
| `avgToC` | `Math.round(holdings.reduce((a,h)=>a+h.tocProgress,0)/holdings.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `ENGAGEMENT_STATUSES`, `ENGAGEMENT_TYPES`, `QUARTERS`, `REPORT_SECTIONS`, `SDG_COLORS`, `SDG_NAMES`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this route — sections below document the code directly.)*

An **impact-measurement hub**: it generates a synthetic portfolio of holdings, each carrying an impact
score, additionality score, impact-weighted profit adjustment, per-$M impact efficiency and three
headline impact metrics (CO₂ avoided, jobs created, lives improved), plus theory-of-change progress,
alerts and engagement status. All quantities are seeded PRNG; the module is a reporting/aggregation
layer, not a measurement model.

### 7.1 What the module computes

Per holding (index `i`), via `sr(s)=frac(sin(s+1)×10⁴)` with large seed offsets:

```js
sdgCoverage        = floor(sr(i·31+1030)·8 + 4)          // 4–11 SDGs
impactScore        = round(sr(i·43+1050)·50 + 35)        // 35–85
additionalityScore = round(sr(i·53+1060)·50 + 30)        // 30–80
iwaProfitAdj       = round((sr(i·67+1070)·200 − 80)·10)/10   // −80 … +120 $Mn
invested           = round((sr(i·71+1080)·50 + 5)·10)/10  // $5–55M
impactPerM         = round(sr(i·29+1090)·60 + 10)        // 10–70
co2Avoided         = round(sr(i·37+1100)·10000 + 500)    // 500–10 500 tCO₂e
jobsCreated        = round(sr(i·41+1110)·500 + 20)
livesImproved      = round(sr(i·47+1120)·2000 + 100)
```

Portfolio KPIs are straight reductions:

```js
totInvested = round(Σ invested)
avgImpact   = round(Σ impactScore / n)
avgAdditionality = round(Σ additionalityScore / n)
totIWAdj = round(Σ iwaProfitAdj) ;  totCO2 = Σ co2Avoided ;  totJobs = Σ jobsCreated
avgToC   = round(Σ tocProgress / n)
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Range | Provenance |
|---|---|---|
| `impactScore` | 35–85 | Synthetic |
| `additionalityScore` | 30–80 | Synthetic |
| `iwaProfitAdj` | −80 … +120 $Mn | Synthetic (IWA-style profit adjustment, can be negative) |
| `impactPerM` | 10–70 | Synthetic impact efficiency |
| `co2Avoided` | 500–10 500 tCO₂e | Synthetic |
| Company identity | prefix+suffix+sector from PRNG indices | Synthetic |
| Alerts / engagement status | random type/severity/status index | Synthetic |

The report-section list, IRIS+ framing and IWA vocabulary are real; every number is PRNG.

### 7.3 Calculation walkthrough

Holdings are generated (company identity from `pIdx`/`sIdx`/`secIdx` PRNG index draws over
prefix/suffix/sector arrays), each enriched with the scores above and a per-company alert/engagement
record. `kpis` reduces the holdings to portfolio totals and averages. `trendData` builds an 8-quarter
series. Charts show impact-score distribution, additionality, IWA adjustment and impact-per-$M scatter.

### 7.4 Worked example (portfolio of 40, illustrative)

If the 40 holdings average `impactScore = 60`, `additionalityScore = 55`, `invested = $30M` each,
`co2Avoided = 5 500` each:

| KPI | Computation | Result |
|---|---|---|
| totInvested | 40 × 30 | **$1 200M** |
| avgImpact | Σ/40 | **60** |
| avgAdditionality | Σ/40 | **55** |
| totCO2 | 40 × 5 500 | **220 000 tCO₂e** |

### 7.5 Data provenance & limitations

- **Every quantity is synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)` with +1030…+1310 seed offsets to
  decorrelate metric streams). Company names are PRNG-assembled, not real issuers.
- There is **no measurement model** — impact score, additionality, IWA adjustment and impact-per-$M are
  independent draws with no causal or accounting relationship to one another.
- Theory-of-change progress, alerts and engagement status are cosmetic workflow scaffolding.

**Framework alignment:** the module *references* the IMP five dimensions, GIIN IRIS+ metric catalogue,
Harvard Impact-Weighted Accounts and additionality (IMP counterfactual) as vocabulary. None is computed:
a production version would consume the monetisation model specified in `impact-weighted-accounts` §8 and
the additionality/verification logic in `impact-verification` §8, aggregating real investee-reported
KPIs rather than PRNG draws.

## 9 · Future Evolution

### 9.1 Evolution A — First backend vertical: a KPI intake and measurement store (analytics ladder: rung 1 → 2)

**What.** This is a thin tier-B page with no MODULE_GUIDES entry and no measurement model: §7.5 records that every quantity — `impactScore`, `additionalityScore`, `iwaProfitAdj` (−80…+120 $Mn), `co2Avoided`, `jobsCreated` — is an independent `sr()` draw with decorrelating seed offsets, over PRNG-assembled company names; alerts, ToC progress and engagement status are cosmetic scaffolding. Evolution A gives the module its first real substance: an investee-KPI intake vertical (holding × IRIS+ metric × period × value × evidence source) with a reporting-completeness model, so the hub measures *actual reported data* rather than inventing it. Scores stay out of scope until data exists — the honest first rung is a data layer with coverage analytics, not another synthetic composite.

**How.** (1) Tables `impact_kpi_submissions` and `impact_engagements`; routes `POST /impact-measurement/kpi` and `GET /impact-measurement/portfolio-rollup`. (2) The dashboard KPIs recompute from stored submissions: `totCO2` = Σ reported CO₂-avoided values with period and source shown; `avgToC` from actual stage records entered through the engagement workflow the page already sketches. (3) Alerts become rule-driven (missing quarterly submission, metric regression vs prior period) instead of random type/severity draws. (4) A MODULE_GUIDES entry is written as part of this work, aligning the module to the `impact-weighted-accounts` §8 monetisation and `impact-verification` §8 VCS specs it should eventually consume.

**Prerequisites.** The `sr()` holding generation deleted; portfolio spine from `portfolios_pg`. **Acceptance:** every dashboard number traces to a stored submission row; a portfolio with no submissions renders an honest empty state, not a populated dashboard.

### 9.2 Evolution B — Board-report copilot over reported KPIs only (LLM tier 2)

**What.** The page's `REPORT_SECTIONS` list (Executive Summary → Board Recommendations) is a ready-made deliverable skeleton. Evolution B drafts it: "prepare the Q3-25 impact KPI dashboard section", "which holdings regressed on jobs-created and what engagement is open?", "summarise SDG coverage honestly, including what's unverified." Every figure comes from the Evolution A rollup endpoint; every verification claim defers to the impact-verification module's status rather than asserting credibility itself.

**How.** Tier 2: tool schemas over `/impact-measurement/portfolio-rollup` and the KPI query routes; the report skeleton maps to `REPORT_SECTIONS` with per-section numeric validation by the no-fabrication checker. The copilot's distinguishing rule is coverage candour: each section opens with data coverage ("14 of 40 holdings reported CO₂-avoided this quarter") because impact reporting that hides sparsity is impact-washing — the exact failure mode the sibling module's `IMPACT_WASHING_FLAGS` taxonomy catalogues. Board recommendations must be grounded in rule-driven alerts, not model speculation.

**Prerequisites (hard).** Evolution A — drafting board reports from the current PRNG dashboard would formalise fabricated impact claims. Copilot infrastructure (Phase 1–2). **Acceptance:** generated sections contain zero numerics absent from tool responses; every section header carries its coverage statistic.