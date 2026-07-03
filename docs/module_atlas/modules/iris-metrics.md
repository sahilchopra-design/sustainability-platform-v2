# IRIS+ Metrics
**Module ID:** `iris-metrics` · **Route:** `/iris-metrics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive implementation of the GIIN IRIS+ system for impact measurement and management, covering all five impact dimensions of the Impact Management Project framework. Enables impact investors to select, calculate, and benchmark standardised metrics across thematic areas including climate, agriculture, health, education, and financial inclusion. Supports alignment with SDG targets and generates investor-ready impact reports.

> **Business value:** Provides impact fund managers with a rigorous, standardised framework for measuring and communicating portfolio impact, satisfying LP due diligence requirements and enabling credible comparison of impact performance across strategies.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_METRICS`, `Badge`, `Card`, `DIM_KEYS`, `GIIN_BENCHMARKS`, `IRIS_METRICS`, `KPI`, `LS_IRIS`, `SDG_COLORS`, `SDG_NAMES`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ALL_METRICS` | `DIM_KEYS.flatMap(dk => IRIS_METRICS[dk].metrics.map(m => ({ ...m, dimension: dk, dimName: IRIS_METRICS[dk].name, dimColor: IRIS_METRICS[dk].color })))` |
| `fmt` | `(v, d = 1) => v == null \|\| isNaN(v) ? '--' : Number(v).toFixed(d);` |
| `fmtK` | `v => { if (v == null \|\| isNaN(v)) return '--'; if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`; if (Math.abs(v) >= 1e3) return `${(v / 1e3).` |
| `seed` | `(company.company_id \|\| '').split('').reduce((s, c) => s + c.charCodeAt(0), 0);` |
| `rng` | `(off) => { let x = Math.sin(seed + off + 1) * 10000; return x - Math.floor(x); };` |
| `avgScore` | `DIM_KEYS.reduce((s, dk) => s + (scores[`_dim_${dk}`] \|\| 0), 0) / 5;` |
| `evidenceQual` | `scores['PI1595']?.value ? Math.round(scores['PI1595'].value / 20) \|\| 3 : 3;` |
| `data` | `useMemo(() => holdings.map(h => {` |
| `avgScore` | `data.reduce((s, d) => s + d.avgScore, 0) / (data.length \|\| 1);` |
| `totalRev` | `data.reduce((s, d) => s + (d.revenue_usd_mn \|\| 0), 0);` |
| `impactRevPct` | `totalRev > 0 ? data.reduce((s, d) => s + (d[ALL_METRICS.find(m => m.id === 'OI4114')?.id]?.value \|\| 0), 0) / totalRev * 100 : 0;` |
| `totalBeneficiaries` | `data.reduce((s, d) => s + (d['PI1104']?.value \|\| 0), 0);` |
| `totalGhg` | `data.reduce((s, d) => s + (d['OI8869']?.value \|\| 0), 0);` |
| `avgEvidence` | `data.reduce((s, d) => s + d.evidenceQual, 0) / (data.length \|\| 1);` |
| `radarData` | `useMemo(() => DIM_KEYS.map(dk => ({` |
| `header` | `['Company', 'Sector', ...ALL_METRICS.map(m => m.id + '_' + m.name.replace(/,/g, '')), 'Avg_Score', 'Evidence_Tier'].join(',');` |
| `rows` | `data.map(d => [d.company_name \|\| d.company_id, d.sector, ...ALL_METRICS.map(m => fmt(d[m.id]?.value, 2)), fmt(d.avgScore, 1), d.evidenceQual].join(','` |
| `blob` | `new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IRIS+ Metric Coverage | — | GIIN IRIS+ Catalogue 2023 | Number of standardised metrics available across 18 thematic areas |
| SDG Alignment Score | — | UN SDG indicator crosswalk | Proportion of reported metrics mapping to Priority SDG targets |
| Additionality Score | — | IMP Contribution dimension | Investor contribution rating distinguishing additionality from market-rate activity |
| Reach (beneficiaries) | — | IRIS PI9468 / OI7087 | Number of individuals or enterprises directly benefiting from investee activities |
- **Investee annual impact reports / survey data** → Map reported KPIs to IRIS+ catalogue identifiers; validate units and coverage period → **Standardised metric values per investee per reporting year**
- **GIIN Navigating Impact benchmark database** → Match sector and geography; extract peer-group quartile distributions → **Benchmark percentile ranking per metric per investee**
- **SDG indicator crosswalk table** → Link each reported IRIS+ metric to one or more SDG target codes → **SDG contribution map for fund-level impact narrative**

## 5 · Intermediate Transformation Logic
**Methodology:** Standardised Impact Metrics
**Headline formula:** `Impact Scoreᵢ = Σⱼ (wⱼ × Normalised Metricᵢⱼ)`
**Standards:** ['GIIN IRIS+ System 2023', 'Impact Management Project Five Dimensions', 'UN SDG Indicators Framework', 'Operating Principles for Impact Management']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).