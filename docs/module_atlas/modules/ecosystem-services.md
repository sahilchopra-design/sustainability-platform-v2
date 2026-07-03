# Ecosystem Services Valuation
**Module ID:** `ecosystem-services` · **Route:** `/ecosystem-services` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Natural capital accounting and ecosystem service valuation using TEEB, InVEST, and SEEA-EA methodologies. Quantifies the economic value of provisioning, regulating, cultural, and supporting services for corporate and portfolio nature-related risk assessment. Supports TNFD LEAP framework disclosure and CBD Kunming-Montreal targets.

> **Business value:** Enables companies to quantify their dependence on and impact to nature in monetary terms, meeting TNFD LEAP framework requirements and informing nature-positive strategy. Ecosystem service valuation provides the economic case for biodiversity conservation and habitat restoration investments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_SERVICES`, `Badge`, `Btn`, `Card`, `CustomTooltip`, `DEP_MATRIX`, `ECOSYSTEM_SERVICES`, `KpiCard`, `PIE_COLORS`, `RATING_BG`, `RATING_COLORS`, `RATING_SCORES`, `RATING_TEXT_COLORS`, `SBTN_STATUS_MAP`, `SECTORS_LIST`, `SERVICE_FINANCIAL`, `Section`, `SortHeader`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `totalScore` | `deps.reduce((s, d) => s + d.score, 0);` |
| `topService` | `deps.sort((a, b) => b.score - a.score)[0]?.service?.name \|\| 'N/A';` |
| `sbtnStatus` | `sbtnOptions[Math.floor(s * sbtnOptions.length)];` |
| `valAtRisk` | `Math.round(totalScore * (company.weight \|\| 0.01) * 42 + s * 50);` |
| `uniqueServices` | `new Set(allDeps.map(d => d.service.id));` |
| `vhTotal` | `scoredHoldings.reduce((s, h) => s + h.vhCount, 0);` |
| `avgScore` | `scoredHoldings.length ? Math.round(scoredHoldings.reduce((s, h) => s + h.totalScore, 0) / scoredHoldings.length) : 0;` |
| `topService` | `Object.entries(topServiceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| 'N/A';` |
| `topSector` | `Object.entries(sectorScores).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| 'N/A';` |
| `totalValAtRisk` | `scoredHoldings.reduce((s, h) => s + h.valAtRisk, 0);` |
| `totalReplacement` | `ALL_SERVICES.reduce((s, sv) => s + (SERVICE_FINANCIAL[sv.id]?.replacementCost \|\| 0), 0);` |
| `dataCoverage` | `scoredHoldings.length > 0 ? Math.round((scoredHoldings.filter(h => h.totalScore > 0).length / scoredHoldings.length) * 100) : 0;` |
| `represented` | `[...new Set(scoredHoldings.map(h => h.sector))];` |
| `deps` | `row.map((r, i) => ({ service: ALL_SERVICES[i]?.name, rating: r, score: RATING_SCORES[r] })).sort((a, b) => b.score - a.score);` |
| `depScore` | `row.reduce((s, r) => s + (RATING_SCORES[r] \|\| 0), 0);` |
| `impactScore` | `Math.round(depScore * 0.7 + s * 20);` |
| `lossMultiplier` | `scenarioDegradation / 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `SECTORS_LIST`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Ecosystem Service Value | — | ESV calculation (TEEB coefficients) | Annual monetary value of ecosystem services across all assets in the corporate footprint |
| Highest-Value Service | — | Service category breakdown | Ecosystem service category generating the largest attributed economic value |
| Dependencies on High-Risk Biomes | — | Biome dependency assessment | Share of total ESV drawn from biomes with ecosystem condition score below 0.50 |
| Biodiversity Intactness Index (Avg) | — | Natural History Museum BII data | Mean Biodiversity Intactness Index across all assessed asset locations; global safe boundary is 0.90 |
- **Asset location database (GPS coordinates or boundary polygons)** → Spatial overlay against global biome classification (WWF Ecoregions) → **Asset-biome mapping with area in hectares per biome type**
- **TEEB/de Groot (2012) ecosystem service coefficient database** → Biome-coefficient assignment and condition multiplier application → **ESV per service category, per asset, and portfolio total**
- **Remote sensing ecosystem condition data (ESA, NDVI, habitat maps)** → Condition score derivation and BII lookup for each asset location → **Condition-adjusted ESV with uncertainty bounds and TNFD dependency assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** Ecosystem Service Value
**Headline formula:** `ESV = Σᵢ (Areaᵢ × BiomeCoefficientᵢ × ConditionMultiplierᵢ)`
**Standards:** ['TEEB (2010) The Economics of Ecosystems and Biodiversity', 'SEEA EA (2021) System of Environmental-Economic Accounting', 'TNFD LEAP Framework v1.1']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).