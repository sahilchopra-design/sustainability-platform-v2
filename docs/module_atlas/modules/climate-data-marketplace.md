# Climate Data Marketplace
**Module ID:** `climate-data-marketplace` · **Route:** `/climate-data-marketplace` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Curated catalogue and procurement hub for third-party climate and ESG data providers. Covers 60+ datasets across physical hazard, transition risk, company disclosures, carbon markets, and nature data. Includes data quality scoring, coverage assessment, and trial data access.

> **Business value:** Data quality composite = 30% coverage + 25% accuracy + 20% timeliness + 15% methodology + 10% price. Top-tier providers score 75–90; estimated-only providers typically 45–60.

**How an analyst works this module:**
- Browse catalogue by data category: physical, transition, carbon, nature
- Provider Profile tab shows coverage, accuracy, and methodology summary
- Quality Comparison tab ranks providers on 5-dimension matrix
- Trial Access tab requests sample dataset for evaluation
- Procurement tab manages data licence agreements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CATEGORIES`, `Card`, `CoverageGapAnalyzer`, `DataCatalog`, `DataStackBuilder`, `FRESHNESS_LABELS`, `GAP_MATRIX`, `INTEGRATION_TYPES`, `MetricBox`, `PRICING`, `PROVIDERS`, `ProgressBar`, `QUALITY_DIMS`, `QualityAssessment`, `STACK_RECS`, `STRATEGIES`, `StatusDot`, `TABS`, `USE_CASES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PRICING` | `['Free Tier','$10K-25K/yr','$25K-75K/yr','$75K-150K/yr','$150K-300K/yr','$300K+/yr'];` |
| `FRESHNESS_LABELS` | `['Hourly','Daily','Weekly','Monthly','Quarterly','Semi-annual','Annual'];` |
| `avg` | `Math.round(qs.reduce((a,b)=>a+b,0)/qs.length);` |
| `intTypes` | `INTEGRATION_TYPES.filter((_,t)=>sr(i*31+t)>0.45);` |
| `providers` | `PROVIDERS.filter((_,pi)=>sr(ui*60+ri*5+pi)>0.7).slice(0,4).map(p=>p.name);` |
| `rec` | `PROVIDERS.filter((_,pi)=>sr(si*60+pi)>0.55).slice(0,10);` |
| `catCounts` | `useMemo(()=>{ const m={};PROVIDERS.forEach(p=>{m[p.category]=(m[p.category]\|\|0)+1;});return m;` |
| `catDistribution` | `useMemo(()=>CATEGORIES.map(c=>({` |
| `compProviders` | `selectedIds.map(id=>PROVIDERS[id]);` |
| `vals` | `PROVIDERS.filter(p=>cats.includes(p.category)).map(p=>p.quality[di]);` |
| `trendData` | `useMemo(()=>['Q1 2025','Q2 2025','Q3 2025','Q4 2025'].map((q,qi)=>({` |
| `bestInClass` | `useMemo(()=>{ const cases=[ {uc:'Portfolio Monitoring',dims:[0,2,3],desc:'Real-time coverage with high completeness for ongoing portfolio surveillance.'}, {uc:'Regulatory Reporting',dims:[4,6,7],desc:'Consistent, auditable data with robust methodology for disclosure compliance.'}, {uc:'Engagement Strategy',dims:[1,3,5],desc:'Accurate, gra` |
| `scored` | `PROVIDERS.map(p=>({name:p.name,category:p.category,score:Math.round(c.dims.reduce((a,d)=>a+p.quality[d],0)/c.dims.length)}));` |
| `freshnessHeatmap` | `useMemo(()=>{ return CATEGORIES.map(cat=>{ const catProviders=PROVIDERS.filter(p=>p.category===cat);` |
| `gapProviderRecs` | `useMemo(()=>{ return gap.requirements.filter(r=>r.status==='gap').map(r=>({ requirement:r.name,providers:r.providers,cost:r.costToFill,priority:r.priority,dataPoints:r.dataPoints }));` |
| `coverageByUseCase` | `useMemo(()=>GAP_MATRIX.map(g=>{` |
| `complexityScore` | `useMemo(()=>{ const days=filteredByBudget.providers.reduce((a,p)=>a+p.integrationDays,0);` |
| `rows` | `filteredByBudget.providers.map(p=>`"${p.name}","${p.category}","${p.priority}",${p.qualityAvg},${p.annualCost},${p.integrationDays},"${p.coverage}","${p.freshness}",${p.apiAvail?"Yes":"No"},"${p.sla}"`).join('\n');` |
| `blob` | `new Blob([headers+rows],{type:'text/csv'});` |
| `startDay` | `filteredByBudget.providers.slice(0,i).filter(x=>x.priority===p.priority).reduce((a,x)=>a+Math.ceil(x.integrationDays*0.6),0);` |
| `barWidth` | `Math.max(5,p.integrationDays/Math.max(1,complexityScore.days)*100);` |
| `barLeft` | `startDay/Math.max(1,complexityScore.days+20)*100;` |
| `apiCount` | `useMemo(()=>PROVIDERS.filter(p=>p.apiAvail).length,[]); const avgQuality=useMemo(()=>Math.round(PROVIDERS.reduce((a,p)=>a+p.qualityAvg,0)/PROVIDERS.length),[]);` |
| `totalRecords` | `useMemo(()=>{ const t=PROVIDERS.reduce((a,p)=>a+p.records,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `FRESHNESS_LABELS`, `INTEGRATION_TYPES`, `PRICING`, `QUALITY_DIMS`, `STRATEGIES`, `TABS`, `USE_CASES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Data Coverage Score | `Non-blank records / universe` | Provider trial data | Percentage of portfolio universe with non-missing data from provider |
| Accuracy vs CDP | `Provider estimate vs CDP reported` | Back-test | Correlation between estimated and self-reported Scope 1 for CDP disclosers |
| Data Vintage Lag | `Calendar months from year-end to release` | Provider specification | Time lag between reporting year-end and dataset availability |
| Composite Quality Score | `Weighted 5-dimension score` | Model output | Overall data quality ranking for provider comparison |
- **Provider trial APIs** → Sample records → coverage and accuracy test → **Quality scores by provider**
- **CDP disclosure database** → Self-reported Scope 1 → accuracy back-test → **Provider accuracy correlation**

## 5 · Intermediate Transformation Logic
**Methodology:** Data provider quality scoring matrix
**Headline formula:** `DataScore_p = 0.30×Coverage + 0.25×Accuracy + 0.20×Timeliness + 0.15×Methodology + 0.10×Price`

Coverage score = fraction of portfolio companies with non-blank data from provider. Accuracy assessed via back-test against Scope 1 disclosures where available (correlation with CDP reported data). Timeliness = lag between reporting year-end and data availability. Methodology score based on transparency of estimation model documentation. Price score inversely scales with per-record cost.

**Standards:** ['SFDR Annex I data requirements', 'TCFD Metrics & Targets', 'PCAF data quality score', 'ICVCM data standards']
**Reference documents:** SFDR Annex I Mandatory Indicator Data Requirements; TCFD Metrics and Targets Guidance 2021; PCAF Data Quality Score 1–5 Framework; ICVCM Data and Reporting Standards 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry specifies a weighted quality score
> `DataScore = 0.30×Coverage + 0.25×Accuracy + 0.20×Timeliness + 0.15×Methodology + 0.10×Price`,
> "accuracy assessed via back-test against Scope 1 disclosures (correlation with CDP)", and a
> "coverage = non-blank records / universe" metric. **None of that scoring is implemented.** The
> quality score in code is an **unweighted mean of 8 `sr()`-seeded dimension scores**, with no CDP
> back-test, no coverage-vs-universe calculation, and no price weighting. The provider *names and
> descriptions are real* (Planet Labs, MSCI ESG, Climate TRACE, Jupiter, Xpansiv CBL…), but every
> numeric quality/coverage/pricing/SLA field is fabricated. This module is a **curated provider
> directory with a synthetic scorecard**, not a data-quality benchmarking engine.

### 7.1 What the module computes

59 providers across 12 categories, each with 8 seeded quality dimensions:

```
quality[d]  = round( 55 + sr(i·8+d) × 40 )          for d ∈ 8 QUALITY_DIMS      (55–95, seeded)
qualityAvg  = round( Σ quality[d] / 8 )              (unweighted mean)
```

Portfolio-level aggregates:
```
apiCount     = count(apiAvail)
avgQuality   = round( Σ qualityAvg / N )
totalRecords = Σ records
catCounts[c] = count(providers in category c)
```

The 8 dimensions (`QUALITY_DIMS`) are Coverage, Accuracy, Timeliness, Completeness, Consistency,
Granularity, Auditability, Methodology — the guide's 5-weight formula uses only 4 of these plus
Price, and applies weights; the code uses all 8 equally weighted.

### 7.2 Parameterisation / provenance

| Field | Generation | Provenance |
|---|---|---|
| provider name / category / description / freshness | hand-authored | **Real vendors** (Planet, MSCI, CDP, Kayrros, Verra…) |
| `quality[8]` | `55 + sr(i·8+d)×40` | **Seeded** 55–95 |
| `pricing` | `PRICING[⌊sr(i·3)×5⌋+1]` | Seeded pick ($10K → $300K+/yr) |
| `apiAvail` | `sr(i·7) > 0.3` | Seeded boolean |
| `coverage` | Global/Regional/National/Asset-level | Seeded pick |
| `records` | `1e4 + sr(i·11)×5e6` | Seeded |
| `sla` / `latency` / `historyYears` / `customers` | seeded picks | Seeded |
| `certifications` | ISO 27001 / SOC 2 / PCAF / TCFD… filtered by `sr()` | Seeded subset |

`GAP_MATRIX`: 4 use cases × 12 data requirements; each requirement's `status` (gap/partial/covered)
and recommended providers are `sr()`-seeded.

### 7.3 Calculation walkthrough

1. `mkProviders` builds the 59-provider array with seeded quality/metadata.
2. **Data Catalog** filters/sorts by category, coverage, pricing; renders provider cards.
3. **Quality Assessment** shows per-category dimension averages (`vals = providers.map(quality[di])`)
   and a "best-in-class" pick per use case: `score = mean of selected dims[di]`.
4. **Coverage Gap Analyzer** maps use-case requirements to gap status and recommends providers.
5. **Data Stack Builder** sums integration days and cost for a selected budget-filtered provider set:
   `complexityScore.days = Σ integrationDays`; a Gantt-style bar per provider.

### 7.4 Worked example — a provider's quality score

Provider i with seeded dimension scores `[72, 88, 65, 90, 78, 55, 82, 70]`:

| Step | Computation | Result |
|---|---|---|
| Sum of 8 dims | 72+88+65+90+78+55+82+70 | 600 |
| qualityAvg | round(600 / 8) | **75** |
| vs guide formula | `0.30×72 + 0.25×88 + 0.20×65 + 0.15×70 + 0.10×price` | **not computed** |

The displayed 75 is a flat mean; the guide's weighted composite (which would emphasise Coverage and
Accuracy and include a price term) is never calculated.

### 7.5 Data provenance & limitations

- **Provider names/descriptions are real; all numeric fields are synthetic**, generated by
  `sr(seed) = frac(sin(seed+1)×10⁴)`. Quality scores, coverage, records, pricing, SLA, certifications
  and gap statuses are fabricated.
- **No CDP back-test / accuracy correlation** exists despite the guide — "Accuracy" is a seeded 55–95
  number, not `Pearson r` against disclosures.
- The quality score is an **unweighted mean**, not the guide's 5-weight composite; price never enters
  the score.
- The coverage-gap matrix's provider recommendations are seeded (`sr(...) > 0.7`), not derived from
  actual provider coverage of each requirement.

**Framework alignment:** The module *references* PCAF data-quality tiers, SFDR Annex I data
requirements, TCFD Metrics & Targets, and ICVCM data standards as certification tags and use-case
labels, but implements none of their scoring. It is a **procurement catalogue**; the quality
methodology it advertises is specified in §8.

## 8 · Model Specification — Climate Data-Provider Quality Scoring Engine

**Status: specification — not yet implemented in code.** The guide's weighted quality score and
CDP-back-tested accuracy are not implemented (all fields `sr()`-seeded); this specifies them.

### 8.1 Purpose & scope
Rank third-party climate/ESG data providers on a defensible, evidence-based quality composite for a
given portfolio universe and use case, to support data-procurement decisions.

### 8.2 Conceptual approach
An **empirical data-quality scorecard** combining measured coverage, back-tested accuracy, observed
timeliness, and a price-efficiency term — the approach data-management teams use when running vendor
bake-offs. Benchmarks: PCAF Data Quality Score (1–5 hierarchy) and CDP/FTSE data-quality assessments.

### 8.3 Mathematical specification
```
Coverage_p    = non-blank records for universe entities / |universe|
Accuracy_p    = corr( provider_estimate , disclosed_value )   over CDP-reporting subset
Timeliness_p  = 1 − min(1, vintageLag_months / 12)
Methodology_p = documentation transparency score (rubric 0–1)
Price_p       = 1 − min(1, costPerRecord_p / maxCostPerRecord)
DataScore_p   = 0.30·Coverage + 0.25·Accuracy + 0.20·Timeliness + 0.15·Methodology + 0.10·Price
```
| Parameter | Source |
|---|---|
| Universe entities | Client portfolio holdings |
| Disclosed values | CDP self-reported Scope 1/2/3 |
| Vintage lag | Provider release calendar |
| Cost per record | Provider licence / record count |
| Methodology rubric | Manual transparency assessment |

### 8.4 Data requirements
Trial datasets from each provider joined to the portfolio universe, CDP disclosures for the accuracy
back-test, provider release dates and pricing. The provider list and categories exist; the missing
inputs are the trial data and CDP join.

### 8.5 Validation & benchmarking plan
Cross-validate accuracy correlations on a hold-out disclosure set; check score stability across
universes; reconcile DataScore ranking against PCAF DQ tiers where both apply; sensitivity-test the
weight vector.

### 8.6 Limitations & model risk
CDP-subset accuracy may not generalise to non-disclosers; coverage is universe-dependent; weights are
judgemental. Conservative fallback: report the raw dimensions alongside the composite and flag any
provider scored on < 30 % universe overlap as low-confidence.

## 9 · Future Evolution

### 9.1 Evolution A — Sourced scorecard for the real provider directory (analytics ladder: rung 1 → 2)

**What.** §7's diagnosis: the 59 provider names and descriptions are real (Planet
Labs, MSCI ESG, Climate TRACE, Jupiter, Xpansiv…) but every numeric — quality
dimensions, coverage, pricing, SLA — is fabricated (`55 + sr(i·8+d)·40`), and the
guide's weighted composite (0.30 coverage + 0.25 accuracy + …) with CDP back-testing
is an unweighted mean of those seeds. Real names with invented scores is the
provenance pattern the platform treats as a defect. Evolution A rebuilds the scorecard
on assessable facts: documented coverage claims from provider methodology documents
(universe counts, geography, update frequency are published), integration facts the
platform itself can attest (the ~19 sources already ingested have known lag,
format, and auth characteristics), and a clearly-scoped "assessed vs vendor-claimed"
distinction per cell.

**How.** (1) `ref_data_providers(provider, dimension, value, basis, source_url,
as_of)` where `basis ∈ {platform-assessed, vendor-claimed, third-party}` — the
platform-assessed rows seeded from the data-sources wave's real findings (e.g. the
documented UCDP access change, Open-Meteo tier limits). (2) The guide's weighted
composite implemented over sourced dimensions only, with unsourced dimensions shown
as gaps that lower a completeness indicator rather than being invented. (3) Pricing
shown as published list bands or "on request" — never synthesized.

**Prerequisites (hard).** PRNG purge across all 472 dimension cells; provider facts
carry as-of dates (vendor capabilities change fast). **Acceptance:** every rendered
score cell shows its basis on hover; the composite recomputes when a sourced
dimension updates; zero `sr()` numerics remain.

### 9.2 Evolution B — Data-procurement advisor (LLM tier 1)

**What.** A copilot for build-vs-buy questions: "we need asset-level flood risk for
EU real estate — which catalogued providers cover it and what does the platform
already have?" — the second half answered from the platform's own source inventory
(the genuinely differentiating knowledge here: NASA POWER, Open-Meteo, OpenFEMA and
the twin's grids are already in-house), "compare the two ESG-disclosure providers on
assessed dimensions", "what did the coverage-gap analyzer find for our use case?".
Tier 1: directory reasoning and gap narration, no computation to fabricate.

**How.** Atlas record + the sourced provider table + the platform's ingested-source
inventory as corpus; recommendations must distinguish "platform already ingests this"
from "requires procurement" — a distinction with budget consequences; every provider
claim cites its basis field per Evolution A.

**Prerequisites (hard).** Evolution A first — advising procurement from fabricated
quality scores could steer real spending decisions on noise. **Acceptance:** a
recommendation lists provider facts with basis labels; asked "which provider is most
accurate?", the copilot reports only assessed/third-party evidence and says where
none exists.