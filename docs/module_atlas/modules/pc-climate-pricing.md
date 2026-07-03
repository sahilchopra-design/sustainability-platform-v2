# PC Climate Pricing
**Module ID:** `pc-climate-pricing` · **Route:** `/pc-climate-pricing` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses preferred creditor climate financing terms across multilateral development banks and development finance institutions, benchmarking concessional spreads, tenor extensions, and climate co-benefits.

> **Business value:** Enables development finance practitioners and climate investors to compare preferred creditor climate financing terms, optimise blended finance structures, and maximise concessionality for climate projects.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PERILS`, `PERIL_COLORS`, `PERIL_DATA`, `REGIONS`, `REINSURANCE_AVAIL`, `SCENARIOS`, `SCEN_MULTS`, `Sparkline`, `TabBtn`, `ZONES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PERILS` | `['Hurricane/Typhoon','Flood','Wildfire','Earthquake','Hail','Drought','Extreme Heat','Freeze/Ice Storm','Subsidence','Tsunami Risk'];` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Latin America','Middle East','Africa','Oceania'];` |
| `PERIL_DATA` | `PERILS.map((p, pi) => ({` |
| `perilidx` | `Math.floor(sr(i * 13 + 1) * 10);` |
| `regionIdx` | `Math.floor(sr(i * 13 + 2) * 7);` |
| `premiumRate` | `+(sr(i * 13 + 3) * 0.06 + 0.008).toFixed(4);` |
| `expenseRatio` | `+(sr(i * 13 + 4) * 0.15 + 0.20).toFixed(3);` |
| `lossRatio` | `+(sr(i * 13 + 5) * 35 + 40).toFixed(1);` |
| `catLoading` | `+(sr(i * 13 + 6) * 0.08 + 0.02).toFixed(3);` |
| `combinedRatio` | `+(+lossRatio + expenseRatio * 100).toFixed(1);` |
| `expLoss` | `+(sr(i * 13 + 7) * 0.035 + 0.005).toFixed(4);` |
| `techRate` | `+(expLoss + catLoading + expenseRatio * 0.5 + 0.02).toFixed(4);` |
| `min` | `Math.min(...data), max = Math.max(...data), range = max - min \|\| 1;` |
| `pts` | `data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');` |
| `avgAdequacy` | `filtered.reduce((s, z) => s + z.adequacyRatio, 0) / Math.max(1, filtered.length);` |
| `avgCombined` | `filtered.reduce((s, z) => s + z.combinedRatio, 0) / Math.max(1, filtered.length);` |
| `avgROE` | `filtered.reduce((s, z) => s + z.returnOnEquity, 0) / Math.max(1, filtered.length);` |
| `totalExposure` | `filtered.reduce((s, z) => s + z.exposureUSD, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PERILS`, `PERIL_COLORS`, `REGIONS`, `REINSURANCE_AVAIL`, `SCENARIOS`, `SCEN_MULTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| MDB Climate Finance (2022) | — | Joint MDB Climate Finance Report 2022 | Total climate finance mobilised by multilateral development banks globally in 2022 across mitigation and adapt |
| Typical PC Spread vs Market | — | OECD DAC 2023 | Typical spread benefit (concessionality) for preferred creditor climate loans relative to market-rate sovereig |
- **MDB annual reports, loan term sheets, OECD DAC aid statistics, Bloomberg fixed income data** → Term mapping, NPV calculation, CI computation, cross-institution benchmarking → **Concessionality dashboards, MDB term benchmarks, blended finance structure analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Concessionality Index
**Headline formula:** `CI = 1 – (NPV(ProjectTerms) / NPV(MarketTerms))`
**Standards:** ['OECD DAC Concessionality Measurement', 'World Bank MDB Climate Finance Tracking 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).