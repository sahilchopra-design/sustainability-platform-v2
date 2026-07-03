# Transition Risk Heatmap
**Module ID:** `transition-risk-heatmap` · **Route:** `/transition-risk-heatmap` · **Tier:** B (frontend-computed) · **EP code:** EP-CD2 · **Sprint:** CD

## 1 · Overview
10 sectors × 5 geographies × 3 NGFS scenarios risk matrix. 50-cell color-coded heatmap with sector and geographic averages, scenario sensitivity analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `GEOS`, `SCENARIOS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sectorAvg` | `SECTORS.map(s => ({ name: s, avg: Math.round(matrix[s].reduce((a, b) => a + b, 0) / Math.max(1, GEOS.length)) }));` |
| `geoAvg` | `GEOS.map((g, gi) => ({ name: g, avg: Math.round(SECTORS.reduce((s, sec) => s + matrix[sec][gi], 0) / Math.max(1, SECTORS.length)) }));` |
| `scenarioSensitivity` | `SECTORS.map(s => ({` |
| `avg` | `Math.round(matrix[sector].reduce((a, b) => a + b) / Math.max(1, GEOS.length));` |
| `avg` | `Math.round(SECTORS.reduce((s, sec) => s + matrix[sec][gi], 0) / Math.max(1, SECTORS.length));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GEOS`, `SCENARIOS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sectors | — | GICS | Energy, Materials, Industrials, Utilities, Consumer Disc, Consumer Staples, Healthcare, Technology, Financials |
| Geographies | — | NGFS | North America, Europe, Asia Pacific, Emerging Markets, Middle East |
| Scenario Multiplier (NZ) | — | Model parameter | Base scores scaled by 1.35 under Net Zero 2050 scenario |

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario-adjusted risk matrix
**Headline formula:** `risk(sector, geo, scenario) = baseScore(sector, geo) × scenarioMultiplier`
**Standards:** ['NGFS Phase 5', 'IPCC AR6']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).