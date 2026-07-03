# Net Zero Portfolio Alignment
**Module ID:** `net-zero-portfolio-alignment` · **Route:** `/net-zero-portfolio-alignment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Measures the alignment of investment portfolios with science-based net-zero trajectories using implied temperature rise, sector decarbonisation benchmarks, and portfolio temperature score methodologies.

> **Business value:** Provides asset owners and managers with a standardised, science-based framework to measure, report, and improve portfolio temperature alignment in line with Paris Agreement commitments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES_NZ`, `DECARBONIZATION_PATHS`, `ENGAGEMENT_OUTCOMES`, `HOLDINGS`, `HOLDINGS_N`, `KpiCard`, `SBT_STATUS`, `SECTORS_NZ`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `SECTORS_NZ[Math.floor(sr(i * 7 + 1) * SECTORS_NZ.length)];` |
| `s3u` | `sr(i * 17 + 4) * 800000 + 2000;` |
| `s3d` | `sr(i * 19 + 5) * 600000 + 1500;` |
| `rev` | `sr(i * 23 + 6) * 5000 + 200; // $M` |
| `evic` | `rev * (sr(i * 29 + 7) * 3 + 0.5);` |
| `itr` | `sr(i * 31 + 8) * 3 + 1.5;` |
| `sbt` | `SBT_STATUS[Math.floor(sr(i * 37 + 9) * SBT_STATUS.length)];` |
| `eng` | `ENGAGEMENT_OUTCOMES[Math.floor(sr(i * 41 + 10) * ENGAGEMENT_OUTCOMES.length)];` |
| `rawW` | `sr(i * 43 + 11) * 0.02 + 0.001;` |
| `totalW` | `HOLDINGS.reduce((s, x) => s + x.weight, 0);` |
| `HOLDINGS_N` | `HOLDINGS.map(h => ({ ...h, weight: h.weight / totalW }));` |
| `scope` | `scopeSelect === '1+2+3' ? 'all' : scopeSelect === '1+2' ? '12' : scopeSelect;` |
| `engagedPortion` | `engagementPct / 100;` |
| `improvement` | `engagedPortion * 0.1; // 0.1°C per engagement level` |
| `scale` | `h.revenueUSD > 0 ? h.weight / h.revenueUSD : 0;` |
| `avgITR` | `holdings.length ? holdings.reduce((s, h) => s + h.temperature, 0) / holdings.length : 0;` |
| `tw2` | `sh.reduce((s, h) => s + h.weight, 0);` |
| `waci2` | `sh.reduce((s, h) => s + (h.weight / tw2) * ((h.scope1 + h.scope2) / (h.revenueUSD \|\| 1)), 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_NZ`, `ENGAGEMENT_OUTCOMES`, `SBT_STATUS`, `SECTORS_NZ`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Average Listed Equity Portfolio Temperature | — | MSCI 2023 | Average portfolio temperature score for a global equity index portfolio before climate-aligned rebalancing. |
| Net Zero Asset Owner Alliance Target | — | NZAOA Target Setting Protocol v3 2022 | Interim and long-term temperature alignment targets committed to by NZAOA member asset owners. |
- **Company emissions data, SBT registry, sector carbon budgets, portfolio weights** → ITR computation, portfolio aggregation, benchmark gap analysis → **Portfolio temperature dashboards, sector decarbonisation heat maps, rebalancing recommendations**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio Temperature Score
**Headline formula:** `PTS = Σ wᵢ × ITRᵢ`
**Standards:** ['TCFD Portfolio Alignment 2021', 'MSCI Climate Value-at-Risk']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).