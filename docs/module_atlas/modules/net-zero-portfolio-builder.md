# Net Zero Portfolio Builder
**Module ID:** `net-zero-portfolio-builder` · **Route:** `/net-zero-portfolio-builder` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Constructs investment portfolios explicitly targeting net-zero alignment by 2050 through constrained optimisation across emissions pathways, financial objectives, and climate solution tilts.

> **Business value:** Enables institutional investors to systematically construct Paris-aligned portfolios that deliver competitive financial returns while following a credible science-based pathway to net zero by 2050.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ATTRIBUTION_ITR`, `ATTRIBUTION_SECTOR`, `BENCHMARKS`, `BENCHMARK_MULTI`, `CLIMATE_FACTORS`, `COLORS`, `ENGAGEMENT_DATA`, `FACTOR_RETURNS`, `FRONTIER`, `HOLDINGS`, `KpiCard`, `NAMES`, `OPT_FRONTIER`, `PAGE`, `PATHWAY_DATA`, `SECS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `itr` | `+(sr(i * 11) * 3.2 + 0.7).toFixed(1);` |
| `ret` | `+((sr(i * 17) - 0.3) * 22).toFixed(1);` |
| `vol` | `+(sr(i * 19) * 18 + 4).toFixed(1);` |
| `ATTRIBUTION_SECTOR` | `['Technology','Financials','Healthcare','Consumer','Industrials','Materials','Energy','Utilities'].map((sec, i) => ({` |
| `BENCHMARK_MULTI` | `['ITR°C','WACI/10','Green Rev%','SBTi Cov%','Carbon Fpt/10','ESG Score','Paris Algn%'].map((metric, i) => ({` |
| `itrLimit` | `+(3.8 - i * 0.15).toFixed(1);` |
| `count` | `Math.min(200, Math.round(60 + i * 8.5 + sr(i * 7) * 5));` |
| `ret` | `+(6.8 - i * 0.18 + sr(i * 7) * 0.15).toFixed(1);` |
| `vol` | `+(12.5 - i * 0.22 + sr(i * 11) * 0.1).toFixed(1);` |
| `paged` | `useMemo(() => constrained.slice((page - 1) * PAGE, page * PAGE), [constrained, page]);` |
| `totalPages` | `Math.ceil(constrained.length / PAGE);` |
| `totalWt` | `Math.max(0.01, d.reduce((s, r) => s + r.weightPct, 0));` |
| `totalWt` | `Math.max(0.01, d.reduce((s, r) => s + r.weightPct, 0));` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `totalWt` | `Math.max(0.01, sh.reduce((s, r) => s + r.weightPct, 0));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ATTRIBUTION_ITR`, `ATTRIBUTION_SECTOR`, `BENCHMARKS`, `BENCHMARK_MULTI`, `CLIMATE_FACTORS`, `COLORS`, `NAMES`, `SECS`, `SECTORS`, `SECT_LIST`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Emission Reduction vs Benchmark (5yr) | — | PAII Framework 2021 | Minimum absolute emissions reduction target set for net-zero portfolio relative to benchmark over a 5-year rol |
| Green Revenue Minimum Tilt | — | PAII 2021 | Recommended minimum green revenue exposure to ensure portfolio alignment with climate solution provision. |
- **Universe emissions data, SBT registry, green revenue taxonomies, return/risk factor data** → Screen and constrained optimisation, glide path modelling, PAII criteria scoring → **Net-zero portfolio weights, emission trajectory, annual reporting metrics**

## 5 · Intermediate Transformation Logic
**Methodology:** Net Zero Construction Score
**Headline formula:** `NZCS = α×FinancialScore + β×ClimateAlignmentScore + γ×GreenRevenueScore`
**Standards:** ['Paris Aligned Investment Initiative', 'PAII Net Zero Investment Framework 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).