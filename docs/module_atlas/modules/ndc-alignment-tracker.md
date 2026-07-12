# NDC Alignment Tracker
**Module ID:** `ndc-alignment-tracker` · **Route:** `/ndc-alignment-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks the ambition, conditionality, and implementation progress of National Determined Contributions across 190+ countries against Paris Agreement 1.5°C and 2°C compatible benchmarks.

> **Business value:** Provides investors, policy analysts, and climate negotiators with a rigorous, data-driven assessment of global NDC ambition and implementation to support sovereign risk and transition risk analysis.

**How an analyst works this module:**
- Ingest NDC submissions from UNFCCC registry; parse targets, base years, and conditionality
- Benchmark against CAT-compatible 1.5°C and 2°C national emission budgets
- Score implementation: policy coverage fraction, MRV quality, historical target adherence
- Track NDC revision cycles and score ambition improvement across successive submissions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_COLORS`, `COUNTRIES`, `COUNTRY_NAMES`, `G20`, `G20_HIST`, `IMPL_BASE`, `IMPL_GRADES`, `PARIS_BASE`, `PARIS_RATINGS`, `SECTORS`, `SECTOR_COLORS`, `SECTOR_TREND`, `TABS`, `YEARS_HIST`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YEARS_HIST` | `Array.from({length:14},(_,i)=>(2010+i).toString());` |
| `COUNTRIES` | `COUNTRY_NAMES.map((name,i)=>{` |
| `parisIdx` | `Math.min(PARIS_BASE[name]??Math.min(Math.floor(sr(s)*5),4),4);` |
| `implIdx` | `Math.min(IMPL_BASE[name]??Math.min(Math.floor(sr(s+7)*6),5),5);` |
| `ndcYear` | `sr(s+1)>0.5?2021:sr(s+1)>0.25?2022:sr(s+1)>0.1?2016:2015;` |
| `baselineYear` | `sr(s+2)>0.5?2010:sr(s+2)>0.2?2005:1990;` |
| `baselineEmissions` | `+(50+sr(s+3)*3000).toFixed(0);` |
| `currentEmissions` | `+(baselineEmissions*(0.7+sr(s+4)*0.5)).toFixed(0);` |
| `unconditionalTarget` | `-(10+parisIdx*5+sr(s+5)*30);` |
| `conditionalTarget` | `unconditionalTarget-(5+sr(s+6)*20);` |
| `projectedBAU2030` | `+(baselineEmissions*(1.0+sr(s+7)*0.4)).toFixed(0);` |
| `requiredForParis1p5` | `+(baselineEmissions*0.55).toFixed(0);` |
| `requiredForParis2p0` | `+(baselineEmissions*0.7).toFixed(0);` |
| `implementationScore` | `+(90-implIdx*14+sr(s+8)*10).toFixed(1);` |
| `financingGap` | `+(10+sr(s+9)*500).toFixed(1);` |
| `carbonPricingInPlace` | `sr(s+10)>0.5+parisIdx*0.1;` |
| `sectoralTargets` | `SECTORS.reduce((a,sec,si)=>({...a,[sec.toLowerCase()]:+(5+Math.max(0,50-parisIdx*8)+sr(s+12+si)*25).toFixed(1)}),{});` |
| `histEmissions` | `YEARS_HIST.map((yr,yi)=>+(currentEmissions*(0.65+yi*0.03+sr(s+20+yi)*0.08)).toFixed(0));` |
| `projections2030` | `+(currentEmissions*(1.0-Math.abs(unconditionalTarget)/100)).toFixed(0);` |
| `G20_HIST` | `YEARS_HIST.map((yr,yi)=>{` |
| `SECTOR_TREND` | `YEARS_HIST.map((yr,yi)=>({` |
| `ratingDist` | `PARIS_RATINGS.map(r=>({name:r,count:COUNTRIES.filter(c=>c.parisAlignmentRating===r).length,color:parisColor(r)}));` |
| `reqVsProj` | `COUNTRIES.slice(0,20).map(c=>({` |
| `sectorBar` | `SECTORS.map(sec=>({` |
| `gradeData` | `IMPL_GRADES.map(g=>({grade:g,count:COUNTRIES.filter(c=>c.implementationGrade===g).length,color:gradeColor(g)}));` |
| `gapData` | `[...COUNTRIES].sort((a,b)=>b.financingGapBnUSD-a.financingGapBnUSD).slice(0,12).map(c=>({name:c.name.length>10?c.name.slice(0,10)+'..':c.name,gap:c.financingGapBnUSD,impl:c.implementationScore}));` |
| `alignData` | `[...COUNTRIES].sort((a,b)=>b.implementationScore-a.implementationScore).slice(0,20).map(c=>({` |
| `compData` | `g20countries.filter(Boolean).map(c=>({` |
| `trendData` | `YEARS_HIST.map((yr,yi)=>({year:yr,emissions:selCountry.histEmissions[yi],proj:yi>=10?+(selCountry.currentEmissionsMtCO2*(1-(Math.abs(selCountry.unconditionalTarget)/100)*(yi-9)/4)).toFixed(0):null,bau:yi>=10?+(selCountry` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COUNTRY_NAMES`, `G20`, `IMPL_GRADES`, `PARIS_RATINGS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global NDC Ambition Gap (2030) | — | UNEP EGR 2023 | Aggregate gap between current NDC trajectories and 1.5°C-compatible emissions by 2030. |
| Countries with 1.5°C Compatible NDCs | — | Climate Action Tracker 2024 | Share of countries whose NDC commitments are rated as compatible with limiting warming to 1.5°C. |
- **UNFCCC NDC registry, CAT assessments, Climate Watch emissions data, IEA country energy data** → Target parsing, ambition gap calculation, implementation scoring → **Country NDC scorecards, ambition gap rankings, transition risk flags for sovereign analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** NDC Ambition Gap
**Headline formula:** `NAG = EmissionsProjected(CurrentNDC) – EmissionsRequired(1.5°C Pathway)`

Difference between emissions trajectory implied by a country's current NDC and the emissions level consistent with a 1.5°C global pathway in the same year.

**Standards:** ['Climate Action Tracker', 'UNEP Emissions Gap Report 2023']
**Reference documents:** UNFCCC NDC Registry; UNEP Emissions Gap Report 2023; Climate Action Tracker Country Assessments 2024; World Resources Institute Climate Watch NDC Database

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module matches its MODULE_GUIDES entry — an **NDC ambition/implementation tracker** for 80 countries
benchmarked against Paris 1.5 °C/2 °C pathways. It is a **hybrid**: the *Paris-alignment and
implementation ratings* are hand-curated per-country (Climate Action Tracker-style analyst judgement), and
those ratings then **anchor** otherwise-seeded emissions, targets, and financing figures. So the ordering
is real; the magnitudes are synthetic.

### 7.1 What the module computes

Per country, ratings drive targets and the Paris gap:

```js
parisIdx = PARIS_BASE[name] ?? floor(sr(s)·5)           // 0=1.5C … 4=Crit.Insufficient
implIdx  = IMPL_BASE[name]  ?? floor(sr(s+7)·6)          // 0=A … 5=F
unconditionalTarget = −(10 + parisIdx·5 + sr(s+5)·30)    // % below baseline (worse rating → weaker)
requiredForParis1p5 = baselineEmissions · 0.55           // 45% cut vs baseline
requiredForParis2p0 = baselineEmissions · 0.70           // 30% cut vs baseline
implementationScore = 90 − implIdx·14 + sr(s+8)·10
projections2030     = currentEmissions · (1 − |unconditionalTarget|/100)
```

The **NDC Ambition Gap** (guide's headline) is `projections2030 − requiredForParis1p5` — the difference
between the trajectory implied by the country's NDC and the 1.5 °C-compatible level.

### 7.2 Parameterisation / scoring rubric

| Construct | Basis | Provenance |
|---|---|---|
| `PARIS_BASE` (80 countries) | 0=1.5C … 4=Critically Insufficient | **Hand-curated, CAT-aligned** (Norway/Denmark/Sweden 0; Saudi/Egypt/Nigeria 4) |
| `IMPL_BASE` | 0=A … 5=F implementation grade | Hand-curated |
| `requiredForParis1p5` | baseline × 0.55 | **Real benchmark** — IPCC/UNEP ≈45 % cut by 2030 for 1.5 °C |
| `requiredForParis2p0` | baseline × 0.70 | Real benchmark — ≈30 % cut for 2 °C |
| unconditional/conditional target | −(10 + parisIdx·5 + noise); conditional deeper | Rating-anchored + seeded |
| baselineEmissions | `50 + sr(s+3)·3000` MtCO₂ | Synthetic |
| financingGap | `10 + sr(s+9)·500` $Bn | Synthetic |
| `SECTOR_TREND` | Energy 18,000 +200/yr, Transport 8,000 … | Hand-authored trend + `sr()` jitter |

The `parisAlignmentRating` (1.5C / 2C / NDC / Insufficient / Critically Insufficient) directly mirrors the
**Climate Action Tracker** five-category rating scheme, and the per-country base values reflect real CAT
assessments (e.g. Gulf states Critically Insufficient, Nordics 1.5 °C-compatible).

### 7.3 Calculation walkthrough

1. `COUNTRIES` builds each record: rating indices from the hand-curated bases (seeded fallback only for
   countries absent from the base maps), then rating-anchored targets and seeded emissions/financing.
2. `histEmissions` (2010–2023) is a seeded trajectory around `currentEmissions`.
3. Views: rating distribution, required-vs-projected gap (first 20 countries), sectoral bars, grade
   distribution, financing-gap ranking (top 12), alignment ranking (top 20 by implementation), G20 focus.

### 7.4 Worked example (Saudi Arabia)

`PARIS_BASE['Saudi Arabia'] = 4` (Critically Insufficient), `IMPL_BASE = 3`. With `baselineEmissions ≈
600 MtCO₂`:

| Metric | Computation | Result |
|---|---|---|
| unconditional target | `−(10 + 4·5 + sr·30)` ≈ | ≈ −35 % (weak, as rating implies) |
| required for 1.5 °C | `600 · 0.55` | 330 MtCO₂ |
| required for 2 °C | `600 · 0.70` | 420 MtCO₂ |
| implementation score | `90 − 3·14 + sr·10` ≈ | ≈ 53 (grade D) |
| rating | `PARIS_RATINGS[4]` | **Critically Insufficient** |

The weak unconditional target (−35 %) leaves `projections2030` well above the 330 MtCO₂ 1.5 °C requirement
— a large positive ambition gap, correctly reflecting Saudi Arabia's CAT rating.

### 7.5 Data provenance & limitations

- **Ratings are hand-curated and CAT-consistent**; emissions magnitudes, baselines, targets, financing
  gaps, and histories are **synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`) but *anchored* to the rating so the
  qualitative story is right even though the numbers are illustrative.
- The 1.5 °C requirement is a flat `baseline·0.55` for every country — real CAT/UNEP allocations differ by
  country responsibility, capability, and sector, not a uniform 45 % cut.
- No live UNFCCC NDC registry ingestion; NDC year/baseline year are seeded categorical draws.

**Framework alignment:** **Climate Action Tracker** — the five-category Paris-alignment rating scheme is
reproduced and per-country bases match CAT assessments. **UNEP Emissions Gap Report** — the ambition-gap
concept (`projected − 1.5 °C-required`) and the ≈45 %/30 % 2030 reduction benchmarks are correct.
**UNFCCC NDC registry / WRI Climate Watch** — named as the intended live sources.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Ratings are hand-set and emissions are seeded.
Below is the production NDC-alignment model.

### 8.1 Purpose & scope
Quantify each country's NDC ambition gap vs a fair 1.5 °C/2 °C pathway and score implementation credibility,
from live NDC and emissions data, for sovereign transition-risk and policy analysis.

### 8.2 Conceptual approach
Parse NDC targets, project the implied 2030 trajectory, and compare to a **fair-share national carbon
budget** (effort-sharing: responsibility + capability, per the Climate Equity Reference / CAT allocation).
Benchmarks: **Climate Action Tracker** (rating logic) and **UNEP EGR** (gap aggregation). Implementation
score from policy-coverage and historical target adherence.

### 8.3 Mathematical specification
`AmbitionGap_c = E_proj_c(2030 | NDC) − E_required_c(2030 | 1.5°C)`. `E_required_c` from a national budget
`B_c` allocated by effort-sharing weights `α_c` (grandfathering, capability, responsibility blend) applied
to the global 1.5 °C budget. `E_proj_c` = baseline × (1 − target%), conditional/unconditional split.
Implementation `I_c = Σ_k w_k·coverage_k` over policy domains, discounted by historical
(actual/target) adherence ratio. Rating = bucket of `AmbitionGap_c / E_baseline_c` combined with `I_c`.

| Parameter | Source |
|---|---|
| NDC targets | UNFCCC NDC registry |
| Historical emissions | Climate Watch / EDGAR / IEA |
| Global 1.5 °C budget | IPCC AR6 SPM |
| Effort-share weights α | Climate Equity Reference Project |
| Policy coverage | CAT policy database |

### 8.4 Data requirements
UNFCCC NDC submissions, Climate Watch emissions, IEA energy data, CAT policy assessments. Platform has
hand-curated CAT-style ratings as a starting spine; the gap is live ingestion.

### 8.5 Validation & benchmarking plan
Reconcile ratings against published CAT country ratings; aggregate ambition gap against UNEP EGR global gap
(~23 GtCO₂e 2030); backtest implementation scores against realised policy delivery.

### 8.6 Limitations & model risk
Effort-sharing allocation is ethically contested (choice of α drives results); NDC conditionality and
LULUCF accounting are hard to compare. Conservative fallback: report a range of fair-share allocations and
flag conditional-target dependence.

## 9 · Future Evolution

### 9.1 Evolution A — Replace anchored-synthetic magnitudes with real UNFCCC/Climate Watch data (analytics ladder: rung 2 → 4)

**What.** §7 characterises this as a hybrid: the per-country Paris-alignment and implementation ratings are genuinely hand-curated CAT-style (Norway/Denmark/Sweden rated 1.5°C-aligned, Saudi/Egypt/Nigeria Critically Insufficient), and the 1.5°C benchmark (`baseline × 0.55`, i.e. 45% cut) is a real IPCC/UNEP figure — but the emissions, targets, and financing magnitudes are `sr()`-seeded off those ratings. So the *ordering* is real and the *numbers* are synthetic. Evolution A replaces the synthetic magnitudes with the real datasets the module already names.

**How.** (1) Ingest WRI Climate Watch NDC data and UNFCCC registry submissions (both free/public and named in §5) into an `ndc_targets` table: actual base years, target years, unconditional/conditional pledges, and gas coverage per country. (2) Replace the seeded `unconditionalTarget`/`projections2030` with parsed pledge values, computing the NDC Ambition Gap (`projections2030 − requiredForParis1p5`) from real trajectories against the retained 0.55 benchmark. (3) Ladder to rung 4: layer the historical target-adherence scoring §1 describes (did past NDCs deliver?) using time-series of national emissions from the OWID CO2 data already in the platform — a genuine predictive signal for whether the current NDC is credible.

**Prerequisites.** Climate Watch ingestion as a new reference source; the hand-curated Paris ratings can stay as an analyst-judgment overlay but should be reconciled against live CAT assessments where available. **Acceptance:** each country's ambition gap derives from its actual NDC pledge, not `sr()`; adding a new NDC submission updates the gap without code changes; historical-adherence score reproduces from OWID emissions history.

### 9.2 Evolution B — Sovereign-transition-risk copilot for NDC analysis (LLM tier 1 → 2)

**What.** A copilot for the investor/negotiator users §1 targets: "how does Brazil's NDC compare to its 1.5°C budget?", "which G20 countries have the widest ambition gap?", "explain Indonesia's implementation grade" — grounded in the per-country ratings, the real 0.55 benchmark, and the UNFCCC/UNEP Emissions Gap/CAT references named in §5.

**How.** Tier 1: system prompt from this Atlas page plus the country ratings and benchmark logic; the copilot explains a country's Paris rating and ambition gap by decomposing the §7.1 formula, citing the CAT-style rating basis. Tier 2, after Evolution A: tool calls against the `ndc_targets` query endpoints for cross-country comparisons and the historical-adherence score, with the fabrication validator matching quoted gaps and percentages to query results. The copilot must distinguish curated analyst ratings (qualitative judgment) from computed gaps (data) in its provenance, and refuse to predict COP negotiation outcomes.

**Prerequisites.** Tier 1 works on current curated ratings but must disclose that magnitudes are illustrative until Evolution A; comparison/ranking answers need the real dataset. **Acceptance:** every ambition-gap figure traces to the benchmark computation or (post-Evolution-A) a real NDC pledge; ratings are labelled as analyst judgment; refusal on speculative geopolitical questions.