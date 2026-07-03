# PE/VC ESG Analytics
**Module ID:** `pe-vc-esg` · **Route:** `/pe-vc-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrates ESG performance monitoring and impact measurement across PE and VC portfolios, supporting LP reporting, fund-level ESG scoring, and portfolio company improvement tracking.

> **Business value:** Provides PE and VC fund managers with a comprehensive ESG performance monitoring system aligned with EDCI, GRESB, and LP reporting standards, supporting responsible investment and fund-raising commitments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_DD_ITEMS`, `DEAL_PIPELINE_INIT`, `LS_DEALS_KEY`, `LS_KEY`, `PE_DD_CHECKLIST`, `PIE_COLORS`, `SDG_COLORS`, `SDG_NAMES`, `STAGES`, `STAGE_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d=1) => n == null ? '-' : Number(n).toFixed(d);` |
| `fmtI` | `n => n == null ? '-' : Math.round(n).toLocaleString();` |
| `fmtM` | `n => n == null ? '-' : `$${Number(n).toFixed(1)}M`;` |
| `pct` | `n => n == null ? '-' : `${Number(n).toFixed(1)}%`;` |
| `badge` | `(label, color, bg) => ({ display:'inline-block', padding:'2px 8px', borderRadius:9999, fontSize:11, fontWeight:600, color, background:bg, marginRight:` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))]` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `SECTORS` | `[...new Set(DEAL_PIPELINE_INIT.map(d => d.sector))].sort();` |
| `GEOS` | `[...new Set(DEAL_PIPELINE_INIT.map(d => d.geography))].sort();` |
| `FUNDS` | `[...new Set(DEAL_PIPELINE_INIT.map(d => d.fund))].sort();` |
| `totalVal` | `deals.reduce((s, d) => s + d.dealSize_mn, 0);` |
| `avgESG` | `active.length ? active.reduce((s, d) => s + d.esgScore, 0) / active.length : 0;` |
| `avgIRR` | `active.length ? active.reduce((s, d) => s + d.irrTarget, 0) / active.length : 0;` |
| `wESG` | `totalVal > 0 ? deals.reduce((s, d) => s + d.esgScore * d.dealSize_mn, 0) / totalVal : 0;` |
| `totalCO2` | `deals.reduce((s, d) => s + (d.impactMetrics.co2_avoided_t \|\| 0), 0);` |
| `totalJobs` | `deals.reduce((s, d) => s + (d.impactMetrics.jobs_created \|\| d.impactMetrics.green_jobs_created \|\| d.impactMetrics.livelihoods_created \|\| 0), 0);` |
| `ddItems` | `deals.length * 30;` |
| `scatterData` | `useMemo(() => deals.map(d => ({ name: d.company, esg: d.esgScore, irr: d.irrTarget, size: d.dealSize_mn })), [deals]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_DD_ITEMS`, `DEAL_PIPELINE_INIT`, `FUNDS`, `GEOS`, `PIE_COLORS`, `SECTORS`, `STAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG KPIs Tracked | — | ESG Data Convergence Initiative 2023 | Core ESG metrics tracked across PE/VC portfolios under the ESG Data Convergence Initiative (EDCI) protocol. |
| EDCI Signatory AUM | — | EDCI 2024 | Total AUM represented by EDCI signatories who have committed to standardised ESG data collection and reporting |
- **Portfolio company ESG questionnaires, EDCI data submissions, financial ownership data** → EDCI KPI aggregation, capital-weighted scoring, GRESB benchmark comparison → **Fund ESG scorecards, LP reporting packs, portfolio improvement heat maps**

## 5 · Intermediate Transformation Logic
**Methodology:** Fund ESG Score
**Headline formula:** `FES = Σ wᵢ × CompanyESGᵢ`
**Standards:** ['GRESB Private Equity Assessment 2023', 'PRI Reporting Framework 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).