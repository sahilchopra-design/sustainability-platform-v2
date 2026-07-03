# DME Financial Risk
**Module ID:** `dme-financial-risk` · **Route:** `/dme-financial-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantification of financial risks arising from material ESG topics identified by the Dynamic Materiality Engine. Maps material topics to balance sheet, income statement, and valuation impacts using scenario-based magnitude estimation. Outputs feed TCFD financial risk disclosures and internal stress testing.

> **Business value:** Translates abstract ESG materiality scores into quantified balance sheet and earnings impacts that financial risk managers and CFOs can act on. Provides the financial risk quantification backbone for TCFD and ESRS SBM-3 disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENTITIES`, `KpiGrid`, `NGFS_DATA`, `NGFS_SC`, `PNL_HIST`, `RATE_SHOCKS`, `RATINGS`, `REGIONS`, `RISK_LIMITS`, `SECTORS`, `TABS`, `TabConcentration`, `TabECL`, `TabIRRisk`, `TabLimits`, `TabLiquidity`, `TabMarketRisk`, `TabNGFS`, `TabOperational`, `TabOverview`, `TabWACC`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `(str) => str.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 5381);` |
| `dv01` | `(dur, price) => dur * price / 10000;` |
| `lcr` | `(hqla, netOutflows) => netOutflows > 0 ? hqla / netOutflows * 100 : 999;` |
| `nsfr` | `(asf, rsf) => rsf > 0 ? asf / rsf * 100 : 999;` |
| `eclCalc` | `(pd, lgd, ead, df) => pd * lgd * ead * (df \|\| 1);` |
| `REGIONS` | `["North America","Europe","Asia-Pacific","Emerging Markets","Middle East"];` |
| `rating` | `RATINGS[Math.floor(sr(i * 3) * RATINGS.length)];` |
| `region` | `REGIONS[Math.floor(sr(i * 5) * REGIONS.length)];` |
| `weight` | `+(0.015 + sr(i * 7) * 0.035).toFixed(4);` |
| `returns` | `Array.from({ length: 252 }, (_, d) => (sr(i * 1000 + d) - 0.5) * 0.04);` |
| `sorted` | `[...returns].sort((a, b) => a - b);` |
| `var95` | `+Math.abs(sorted[Math.floor(252 * 0.05)]).toFixed(5);` |
| `var99` | `+Math.abs(sorted[Math.floor(252 * 0.01)]).toFixed(5);` |
| `var10d` | `+(var95 * Math.sqrt(10)).toFixed(5);` |
| `cvar95` | `+Math.abs(sorted.slice(0, Math.floor(252 * 0.05)).reduce((s, v) => s + v, 0) / Math.max(1, Math.floor(252 * 0.05))).toFixed(5);` |
| `beta` | `+(0.6 + sr(i * 11) * 1.2).toFixed(3);` |
| `climPrem` | `+(0.005 + sr(i * 13) * 0.025).toFixed(4);` |
| `creditSp` | `+(0.01 + sr(i * 17) * 0.04).toFixed(4);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS_SC`, `RATE_SHOCKS`, `RATINGS`, `REGIONS`, `RISK_LIMITS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Financial Risk Exposure | — | DME financial risk engine | Aggregate financial magnitude of all material ESG risks across all topics at 70th percentile severity |
| Highest Risk Topic | — | Topic risk attribution | Material topic contributing the largest financial exposure to the aggregate EFRS |
| EBITDA at Risk (1.5°C scenario) | — | Scenario engine | Estimated EBITDA reduction under an orderly 1.5°C transition scenario over a 5-year horizon |
| Risk-Weighted Materiality Score | — | EFRS calculation | Materiality score weighted by financial exposure magnitude across all active topics |
- **DME materiality scores (financial materiality dimension per topic)** → Topic selection filter: financial material topics only → **Financial material topic list with base materiality scores**
- **Scenario-based magnitude library (sector benchmarks, NGFS data)** → Topic-to-financial-impact mapping with magnitude percentage ranges by scenario → **Magnitude estimates in $ and % EBITDA per topic per scenario**
- **Risk aggregation engine** → Monte Carlo aggregation with topic correlation adjustments → **EFRS distribution with P50, P70, P90 percentile exposures and topic waterfall**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Financial Risk Score
**Headline formula:** `EFRS = Σᵢ Materialityᵢ × Magnitudeᵢ × Likelihoodᵢ`
**Standards:** ['TCFD 2021 Risk Quantification', 'ESRS 2 SBM-3', 'ECB Climate Risk Taxonomy']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).