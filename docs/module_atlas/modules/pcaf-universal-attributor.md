# PCAF 8/8 Universal Attributor
**Module ID:** `pcaf-universal-attributor` · **Route:** `/pcaf-universal-attributor` · **Tier:** B (frontend-computed) · **EP code:** EP-CI6 · **Sprint:** CI

## 1 · Overview
Complete PCAF 8-class attribution with formulas, data quality heatmap, WACI benchmarking, and SBTi target tracking.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DQ_COLORS`, `DQ_SCORES`, `PCAF_CLASSES`, `TABS`, `TARGET_YEARS`, `WACI_SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DQ_SCORES` | `{ 1: 'Audited GHG data', 2: 'Reported unverified', 3: 'Physical activity data', 4: 'Revenue-based estimate', 5: 'Asset class proxy' };` |
| `totalExposure` | `PCAF_CLASSES.reduce((s, c) => s + c.exposure, 0);` |
| `totalEmissions` | `PCAF_CLASSES.reduce((s, c) => s + c.emissions, 0);` |
| `year` | `2020 + i;` |
| `target` | `100 * Math.pow(0.93, i);` |
| `actual` | `100 * Math.pow(0.95, i) * (1 + (sr(i * 31 + 10) * 2 - 1) * 0.025);` |
| `portfolioWACI` | `WACI_SECTORS.reduce((s, sec) => s + sec.waci * sec.weight / 100, 0);` |
| `benchmarkWACI` | `WACI_SECTORS.reduce((s, sec) => s + sec.benchmark * sec.weight / 100, 0);` |
| `TABS` | `['Universal Attribution Dashboard', 'All 8 Asset Classes', 'Data Quality Heatmap', 'Attribution Formula Reference', 'Portfolio-Level WACI', 'Target Tr` |
| `avgDQ` | `+(PCAF_CLASSES.reduce((s, c) => s + c.dq * c.exposure, 0) / totalExposure).toFixed(1);` |
| `classChartData` | `PCAF_CLASSES.map(c => ({` |
| `dqMatrix` | `PCAF_CLASSES.map(c => ({` |
| `filteredClasses` | `dqFilter === 'All' ? PCAF_CLASSES : PCAF_CLASSES.filter(c => Math.round(c.dq) === +dqFilter);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PCAF_CLASSES`, `TABS`, `WACI_SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PCAF Coverage | — | PCAF Standard | Full coverage of all PCAF asset classes |
| Portfolio WACI | `Weighted average` | Calculated | Across all 8 asset classes |

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF 8-class attribution formulas
**Headline formula:** `AF varies by class: EVIC (Class 1-2), 100% (Class 3), Loan/Value (Class 4-6), GDP-based (Class 7)`
**Standards:** ['PCAF Global GHG Standard v3']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).