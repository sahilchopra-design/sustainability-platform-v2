# Deforestation Risk Analytics
**Module ID:** `deforestation-risk` · **Route:** `/deforestation-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Commodity-linked deforestation risk for 8 forest-risk commodities. Covers EUDR compliance, satellite monitoring, supply chain exposure, and No Deforestation, No Peat, No Exploitation (NDPE) policy tracking.

> **Business value:** Deforestation drives 10-15% of global GHG emissions and is a Scope 3 material risk for food, retail, and finance sectors. The EUDR creates direct legal risk for EU-market companies. This module provides EUDR compliance infrastructure and supply chain deforestation risk management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_RISK`, `Card`, `DEFORESTATION_COMMODITIES`, `DEFORESTATION_TREND`, `EUDR_CHECKLIST`, `KpiCard`, `PIE_COLORS`, `Section`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_FAO_MAP` | `Object.fromEntries(FAO_FOREST_AREA_2020.map(d => [d.country, d]));` |
| `_COMM_DEF_MAP` | `Object.fromEntries(COMMODITY_DEFORESTATION_RISK.map(d => [`${d.commodity}::${d.country}`, d]));` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `avgRisk` | `exposedCommodities.reduce((s, c) => s + c.risk_score, 0) / exposedCommodities.length;` |
| `avgScore` | `scoredHoldings.length > 0 ? Math.round(scoredHoldings.reduce((s, h) => s + h.score, 0) / scoredHoldings.length) : 0;` |
| `exposedPct` | `scoredHoldings.length > 0 ? Math.round((scoredHoldings.filter(h => h.score > 20).length / scoredHoldings.length) * 100) : 0;` |
| `totalForestLoss` | `DEFORESTATION_COMMODITIES.reduce((s, c) => s + c.area_loss_mha, 0);` |
| `portfolioForestLoss` | `scoredHoldings.reduce((s, h) => {` |
| `sectors` | `[...new Set(scoredHoldings.map(h => h.sector).filter(Boolean))].slice(0, 10);` |
| `row` | `{ sector: sector.length > 16 ? sector.substring(0, 14) + '..' : sector };` |
| `rows` | `scoredHoldings.map(h => [` |
| `csv` | `[headers.join(','), ...rows.map(r => r.join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `data` | `{ exportDate: new Date().toISOString(), holdings: scoredHoldings.map(h => ({ name: h.name \|\| h.ticker, sector: h.sector, score: h.score, commodities: ` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `attributed` | `exposure.reduce((s, h) => s + c.area_loss_mha * (h.weight \|\| 0.01), 0);` |
| `attributed` | `exposed.reduce((s, c) => s + c.area_loss_mha * (h.weight \|\| 0.01) * 1000, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_RISK`, `DEFORESTATION_COMMODITIES`, `DEFORESTATION_TREND`, `EUDR_CHECKLIST`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forest-Risk Commodities | — | EUDR | Cattle, cocoa, coffee, palm oil, soya, wood, rubber + derivatives |
| EUDR Deadline | — | EU Regulation | Dec 2025 for SMEs |
| High-Risk Countries | — | GFW | Countries with high deforestation exposure |
- **Supply chain sourcing data** → Country and commodity mapping → **Deforestation exposure**
- **GFW satellite data** → Forest cover change detection → **EUDR compliance alert**
- **EUDR due diligence** → Geolocation verification → **Deforestation-free declaration**

## 5 · Intermediate Transformation Logic
**Methodology:** Deforestation risk scoring
**Headline formula:** `DefoRisk = SourceCountry_risk × Commodity_sensitivity × ProducerVerification`
**Standards:** ['EU Deforestation Regulation', 'GFW Global Forest Watch', 'RSPO', 'RTRS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).