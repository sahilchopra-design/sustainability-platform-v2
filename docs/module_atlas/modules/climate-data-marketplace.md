# Climate Data Marketplace
**Module ID:** `climate-data-marketplace` · **Route:** `/climate-data-marketplace` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Curated catalogue and procurement hub for third-party climate and ESG data providers. Covers 60+ datasets across physical hazard, transition risk, company disclosures, carbon markets, and nature data. Includes data quality scoring, coverage assessment, and trial data access.

> **Business value:** Data quality composite = 30% coverage + 25% accuracy + 20% timeliness + 15% methodology + 10% price. Top-tier providers score 75–90; estimated-only providers typically 45–60.

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
| `catDistribution` | `useMemo(()=>CATEGORIES.map(c=>({` |
| `compProviders` | `selectedIds.map(id=>PROVIDERS[id]);` |
| `vals` | `PROVIDERS.filter(p=>cats.includes(p.category)).map(p=>p.quality[di]);` |
| `trendData` | `useMemo(()=>['Q1 2025','Q2 2025','Q3 2025','Q4 2025'].map((q,qi)=>({` |
| `scored` | `PROVIDERS.map(p=>({name:p.name,category:p.category,score:Math.round(c.dims.reduce((a,d)=>a+p.quality[d],0)/c.dims.length)}));` |
| `coverageByUseCase` | `useMemo(()=>GAP_MATRIX.map(g=>{` |
| `days` | `filteredByBudget.providers.reduce((a,p)=>a+p.integrationDays,0);` |
| `rows` | `filteredByBudget.providers.map(p=>`"${p.name}","${p.category}","${p.priority}",${p.qualityAvg},${p.annualCost},${p.integrationDays},"${p.coverage}","$` |
| `blob` | `new Blob([headers+rows],{type:'text/csv'});` |
| `startDay` | `filteredByBudget.providers.slice(0,i).filter(x=>x.priority===p.priority).reduce((a,x)=>a+Math.ceil(x.integrationDays*0.6),0);` |
| `barWidth` | `Math.max(5,p.integrationDays/Math.max(1,complexityScore.days)*100);` |
| `barLeft` | `startDay/Math.max(1,complexityScore.days+20)*100;` |

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
**Standards:** ['SFDR Annex I data requirements', 'TCFD Metrics & Targets', 'PCAF data quality score', 'ICVCM data standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).