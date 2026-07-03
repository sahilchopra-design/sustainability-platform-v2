# Offset Portfolio Tracker
**Module ID:** `offset-portfolio-tracker` · **Route:** `/offset-portfolio-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CN5 · **Sprint:** CN

## 1 · Overview
25 credit positions with mark-to-market valuation, retirement schedule, performance tracking, and compliance reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENCHMARK_INDEX`, `BEZERO`, `COLORS`, `COUNTERPARTIES`, `COUNTRIES`, `HOLDINGS`, `METHOD_BENCHMARKS`, `OffsetPortfolioTrackerPage`, `PRICE_HISTORY`, `QUALITY_TIERS`, `REGIONS`, `REGISTRIES`, `RETIREMENT_SCHEDULE`, `SDGS`, `TABS`, `TRANSACTION_LOG`, `TYPES`, `VERIFIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `font` | `"'DM Sans','SF Pro Display',system-ui,sans-serif";` |
| `TYPES` | `['REDD+','ARR','IFM','Cookstove','DAC','Biochar','Renewable','Blue Carbon','Soil','CCS','Peatland','Waste','Mineralization','Methane'];` |
| `typeIdx` | `Math.floor(sr(i * 3) * TYPES.length);` |
| `vintage` | `2015 + Math.floor(sr(i * 7 + 1) * 10);` |
| `tonnes` | `Math.round(1000 + sr(i * 11 + 2) * 49000);` |
| `costBasis` | `Math.round((baseMult + sr(i * 13 + 3) * baseMult * 0.4) * 100) / 100;` |
| `priceMove` | `1 + (sr(i * 17 + 4) - 0.4) * 0.3;` |
| `currentPrice` | `Math.round(costBasis * priceMove * 100) / 100;` |
| `retiredPct` | `sr(i * 19 + 5) * 0.6;` |
| `retired` | `Math.round(tonnes * retiredPct);` |
| `scheduledPct` | `sr(i * 23 + 6) * 0.4;` |
| `scheduledRetire` | `Math.round((tonnes - retired) * scheduledPct);` |
| `registry` | `REGISTRIES[Math.floor(sr(i * 29 + 7) * REGISTRIES.length)];` |
| `qualityScore` | `Math.round(40 + sr(i * 31 + 8) * 60);` |
| `bezIdx` | `Math.min(BEZERO.length - 1, Math.floor((100 - qualityScore) / 10));` |
| `bufferPct` | `Math.round(5 + sr(i * 37 + 9) * 25);` |
| `reversalRisk` | `Math.round((1 + sr(i * 41 + 10) * 30) * 10) / 10;` |
| `planned` | `Math.round(3000 + sr(i * 61 + 20) * 4000);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BEZERO`, `COLORS`, `COUNTERPARTIES`, `COUNTRIES`, `QUALITY_TIERS`, `REGISTRIES`, `SDGS`, `TABS`, `TYPES`, `VERIFIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Positions | — | Portfolio | Across multiple credit types and vintages |
| Total MTM Value | — | Market pricing | Current portfolio market value |

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio mark-to-market
**Headline formula:** `MTM = Σ(holdings_i × current_price_i)`
**Standards:** ['Market data', 'PCAF']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).