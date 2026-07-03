# Sector Benchmarking
**Module ID:** `sector-benchmarking` · **Route:** `/sector-benchmarking` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG and climate performance benchmarking comparing company metrics against sector peers using percentile ranking, z-scores and best-in-class thresholds.

> **Business value:** Positions each portfolio holding on ESG and climate metrics relative to sector peers to guide engagement and portfolio construction.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Chip`, `ComparisonTable`, `EXCHANGE_COLORS`, `EXCHANGE_FLAGS`, `GHGIntensityChart`, `ParisAlignmentPanel`, `RISK_C`, `SECTOR_COLORS`, `SECTOR_DESCRIPTIONS`, `StatCard`, `ValuationScatter`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `EXCHANGE_COLORS` | `Object.fromEntries(EXCHANGES.map(e => [e.id, e.color]));` |
| `EXCHANGE_FLAGS` | `Object.fromEntries(EXCHANGES.map(e => [e._displayExchange \|\| e.label, e.flag]));` |
| `fmtB` | `(v) => v == null ? '—' : `$${(v/1000).toFixed(1)}B`;` |
| `fmtCO2` | `n => n == null ? '—' : n >= 1e9 ? `${(n/1e9).toFixed(2)} Gt` : n >= 1e6 ? `${(n/1e6).toFixed(1)} Mt` : `${(n/1000).toFixed(0)} Kt`;` |
| `mean` | `arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;` |
| `peValues` | `companies.map(c => c.pe_ratio).filter(Boolean);` |
| `ghgValues` | `companies.map(c => c.ghg_intensity_usd_mn \|\| c.ghg_intensity_tco2e_cr).filter(Boolean);` |
| `isHighPE` | `medPE && c.pe_ratio > medPE * 1.5;` |
| `med` | `median(data.map(d => d.value));` |
| `gap` | `c.ghg_int - target;` |
| `pctGap` | `(gap / target) * 100;` |
| `barWidth` | `Math.min(100, Math.max(4, (c.ghg_int / (target * 3)) * 100));` |
| `mktcaps` | `companies.map(c => c.market_cap_usd_mn).filter(Boolean);` |
| `revenues` | `companies.map(c => c.revenue_usd_mn).filter(Boolean);` |
| `pe_vals` | `companies.map(c => c.pe_ratio).filter(Boolean);` |
| `roe_vals` | `companies.map(c => c.roe_pct).filter(Boolean);` |
| `ghg_vals` | `companies.map(c => c.scope1_co2e).filter(Boolean);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Peers Benchmarked | — | Peer universe | Total companies in active sector benchmarking peer groups. |
| Avg ESG Percentile | — | Calculated | Portfolio-weighted average ESG percentile rank across all benchmarked holdings. |
| Best-in-Class Share | — | Threshold model | Holdings ranked in top quartile of sector ESG performance. |
- **ESG scores from data vendors, GICS classification, portfolio weights** → Peer group construction, percentile ranking, z-score calculation → **Sector benchmarking reports, heatmaps, laggard flags**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Percentile Rank
**Headline formula:** `Count(Peers with Lower ESG Score) ÷ (Total Peers – 1) × 100`
**Standards:** ['MSCI ESG', 'Sustainalytics', 'Bloomberg ESG']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).