# Regional Climate Impact Engine
**Module ID:** `regional-climate-impact` · **Route:** `/regional-climate-impact` · **Tier:** B (frontend-computed) · **EP code:** EP-CG2 · **Sprint:** CG

## 1 · Overview
20 regions × 8 perils × 4 SSP scenarios with GDP shock transmission, sector-specific impacts, and labor productivity loss.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `PERILS`, `REGIONS`, `SSP`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Regional Heatmap','Hazard Probability Matrix','GDP Impact Transmission','Sector-Specific Impacts','Labor Productivity Loss','Infrastructure Vulnerab` |
| `SSP` | `['SSP1-2.6','SSP2-4.5','SSP3-7.0','SSP5-8.5'];` |
| `regionsAdj` | `useMemo(() => REGIONS.map(r => ({` |
| `sorted` | `useMemo(() => [...regionsAdj].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : a[sortBy] - b[sortBy]), [regionsAdj, sortBy]);` |
| `top10Gdp` | `[...regionsAdj].sort((a, b) => a.gdpImpact - b.gdpImpact).slice(0, 10);` |
| `laborData` | `regionsAdj.slice(0, 12).map(r => ({ name: r.name.length > 12 ? r.name.slice(0, 12) + '..' : r.name, loss: r.laborLoss }));` |
| `priority` | `d.exposure * 0.3 + d.criticality * 0.4 + d.adaptGap * 0.3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PERILS`, `REGIONS`, `SSP`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Regions | — | IPCC | Sub-continental resolution |
| Perils | — | IPCC AR6 | TC, flood, wildfire, storm, drought, winter storm, heat, SLR |
| WBGT Productivity Loss | `f(WBGT)` | ISO 7933 | Labor output decline above 25°C WBGT |

## 5 · Intermediate Transformation Logic
**Methodology:** Regional hazard-GDP transmission
**Headline formula:** `GDP_impact = DirectLoss + SupplyChainDisruption + InsuranceGap + FiscalCost`
**Standards:** ['IPCC AR6 WGI Table 12.12', 'World Bank']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).