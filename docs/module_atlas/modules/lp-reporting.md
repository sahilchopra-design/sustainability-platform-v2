# LP Reporting
**Module ID:** `lp-reporting` · **Route:** `/lp-reporting` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Standardised ESG reporting module for private equity and real assets fund managers preparing investor (LP) sustainability reports aligned with ILPA ESG Data Convergence Initiative (EDCI), UN PRI, and AIFMD Article 23 requirements. Aggregates portfolio company-level ESG data, computes fund-level KPIs, and generates investor-ready report packs. Supports GHG intensity, diversity, and governance metric benchmarking against EDCI cohort data.

> **Business value:** Enables private equity managers to meet ILPA EDCI, UN PRI, and AIFMD LP reporting obligations efficiently, with standardised GHG, diversity, and safety KPIs that allow LPs to compare fund performance across the private markets universe.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLLECTION_STATUS`, `Card`, `EDCI_METRICS`, `EDCI_VALUES`, `FRAMEWORKS`, `FUNDS`, `LS_CONFIG`, `LS_TEMPLATES`, `PAI_INDICATORS`, `PIE_COLORS`, `SDG_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `selectAllFunds` | `() => setSelectedFunds(FUNDS.map(f => f.id));` |
| `totalCommit` | `useMemo(() => selFunds.reduce((s,f) => s + f.commitment_mn, 0), [selFunds]);` |
| `totalPossible` | `selFunds.length * 10;` |
| `completeness` | `totalPossible > 0 ? (metricsCollected / totalPossible * 100) : 0;` |
| `edciCompliance` | `completeness > 0 ? Math.min(completeness + 5, 100) : 0;` |
| `yoyData` | `useMemo(() => EDCI_METRICS.map(m => {` |
| `change` | `v.prior ? ((v.current - v.prior) / Math.abs(v.prior) * 100) : null;` |
| `keys` | `['EDCI-2','EDCI-3','EDCI-4','EDCI-7','EDCI-6'];` |
| `normCurrent` | `i === 4 ? Math.max(0, 100 - v.current * 20) : Math.min(100, v.current * (i === 0 ? 1 : 1));` |
| `normBench` | `i === 4 ? Math.max(0, 100 - (v.benchmark\|\|0) * 20) : Math.min(100, (v.benchmark\|\|0) * (i === 0 ? 1 : 1));` |
| `sdgs` | `Array.from({ length:17 }, (_, i) => i + 1);` |
| `rows` | `yoyData.map(d => `${d.id},${d.category},"${d.metric}",${d.current},${d.prior},${d.benchmark??''},${d.change?.toFixed(1)??''},${d.quality}`).join('\n')` |
| `blob` | `new Blob([header + rows], { type:'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(report, null, 2)], { type:'application/json' });` |
| `blob` | `new Blob([html], { type:'text/html' });` |
| `exportPDF` | `() => { exportHTML(); /* Triggers print-friendly HTML; user can print to PDF */ };` |
| `pct` | `(st.collected / st.total * 100);` |
| `missing` | `st.total - st.collected;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EDCI_METRICS`, `FRAMEWORKS`, `FUNDS`, `PAI_INDICATORS`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scope 1+2 GHG Intensity (tCO2e/$M rev) | — | EDCI / portfolio company data | AUM-weighted portfolio GHG intensity; enables LP-to-LP comparability via EDCI cohort |
| EDCI Data Coverage (%) | — | ILPA EDCI data submission | Proportion of portfolio companies reporting all six core EDCI KPIs |
| Board Gender Diversity (%) | — | EDCI Diversity KPI | Proportion of portfolio company board seats held by women across the fund |
| Lost-Time Injury Rate (per 200k hrs) | — | EDCI Health & Safety KPI | Employee injury frequency rate normalised to 200,000 working hours across portfolio |
- **Portfolio company ESG survey / EDCI template submissions** → Validate against EDCI schema; flag gaps; apply sector-median imputation for missing values → **Standardised portfolio company ESG data set with coverage and imputation flags**
- **EDCI cohort benchmark database** → Match fund strategy and vintage to peer cohort; extract quartile distributions per KPI → **Benchmark percentile ranking for each fund KPI against EDCI cohort**
- **PRI reporting templates** → Map fund and portfolio data to PRI module questions; assess alignment score → **PRI module responses and fund-level responsible investment assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** Fund-Level GHG Intensity
**Headline formula:** `GHG_fund = Σᵢ (GHGᵢ / Revenueᵢ) × (AUMᵢ / AUM_fund)`
**Standards:** ['ILPA EDCI Metrics 2023', 'UN PRI Reporting Framework 2023', 'GHG Protocol Private Equity Guidance', 'AIFMD Regulation EU 231/2013']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).