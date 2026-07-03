# DME Index
**Module ID:** `dme-index` · **Route:** `/dme-index` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sector-level ESG materiality indices derived from Dynamic Materiality Engine scores aggregated across all entities in each GICS sector. Indices track materiality momentum over time, enabling macro-level sustainability trend analysis and sector rotation signals for ESG investors. Custom index construction is supported.

> **Business value:** Enables ESG investors and risk managers to track aggregate materiality risk at the sector level, supporting top-down portfolio positioning and monitoring of systemic ESG trends across capital markets.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `ALERT_TIERS`, `DEFAULT_WEIGHTS`, `ENTITIES`, `ESG_W`, `FR_W`, `KpiGrid`, `PORT_TREND`, `REGIMES`, `SECTORS`, `TABS`, `TRANS_MATRIX`, `TabAlerts`, `TabBenchmark`, `TabComputation`, `TabESGComponent`, `TabFRComponent`, `TabHHI`, `TabHistory`, `TabOverview`, `TabRegime`, `TabVelocity`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hhi` | `(weights) => weights.reduce((s, w) => s + w * w, 0);` |
| `frVar` | `+(20 + sr(i * 3) * 75).toFixed(1);` |
| `frPd` | `+(15 + sr(i * 7) * 80).toFixed(1);` |
| `frWacc` | `+(25 + sr(i * 11) * 70).toFixed(1);` |
| `frLiq` | `+(10 + sr(i * 13) * 85).toFixed(1);` |
| `frScore` | `+(frVar * FR_W.var + frPd * FR_W.pd + frWacc * FR_W.wacc + frLiq * FR_W.liq).toFixed(2);` |
| `esgGov` | `+(20 + sr(i * 17) * 75).toFixed(1);` |
| `esgEnv` | `+(15 + sr(i * 19) * 80).toFixed(1);` |
| `esgSoc` | `+(25 + sr(i * 23) * 70).toFixed(1);` |
| `esgReg` | `+(10 + sr(i * 29) * 85).toFixed(1);` |
| `esgScore` | `+(esgGov * ESG_W.gov + esgEnv * ESG_W.env + esgSoc * ESG_W.soc + esgReg * ESG_W.reg).toFixed(2);` |
| `velScore` | `+(50 + (velHistory[velHistory.length - 1] \|\| 0) * 200).toFixed(2); // normalised 0-100 proxy` |
| `dmi` | `+(frScore * DEFAULT_WEIGHTS.fr + esgScore * DEFAULT_WEIGHTS.esg + Math.max(0, Math.min(100, velScore)) * DEFAULT_WEIGHTS.vel).toFixed(2);` |
| `emaLast` | `emaHistory[emaHistory.length - 1];` |
| `ema4ago` | `emaHistory[emaHistory.length - 5] \|\| emaLast;` |
| `vel4q` | `+((emaLast - ema4ago) / Math.max(0.0001, Math.abs(ema4ago))).toFixed(4);` |
| `vel8q` | `+((emaLast - (emaHistory[emaHistory.length - 9] \|\| emaLast)) / Math.max(0.0001, Math.abs(emaHistory[emaHistory.length - 9] \|\| emaLast))).toFixed(4);` |
| `accel` | `+((vel4q - vel8q) / 4).toFixed(5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIMES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Highest-Risk Sector Index | — | DME sector aggregation | GICS sector with the highest current sector materiality index value |
| Fastest-Rising Sector | — | DME momentum engine | Sector showing the largest absolute 12-month increase in sector materiality index |
| Index Universe Coverage | — | Entity universe | Total entities and GICS sectors included in the sector index calculation |
| Cross-Sector Dispersion (σ) | — | Index statistics | Standard deviation of sector materiality index values, measuring cross-sector risk differentiation |
- **DME entity materiality scores (all universe entities)** → Market-cap weighting and GICS sector aggregation → **Sector Materiality Index values and 12-month time series**
- **Market capitalisation data (daily)** → Float-adjusted market-cap weight calculation per entity within sector → **Entity weight in sector index**
- **Index momentum engine** → 12-month change calculation and cross-sector dispersion statistics → **Sector momentum ranking and dispersion report for ESG factor analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Sector Materiality Index
**Headline formula:** `SMIₛ = Σᵢ∈ₛ (EMSᵢ × MarketCapᵢ) / Σᵢ∈ₛ MarketCapᵢ`
**Standards:** ['GICS Sector Classification', 'MSCI ESG Index Methodology', 'SASB Materiality Map']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).