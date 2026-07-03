# Big Climate Database
**Module ID:** `big-climate-database` · **Route:** `/big-climate-database` · **Tier:** B (frontend-computed) · **EP code:** EP-DATA2 · **Sprint:** Platform

## 1 · Overview
Explorer for the Big Climate Database covering 2,700+ food system product lifecycle emission records across agriculture, processing, packaging, transport, and retail stages. Uses EU JRC EF3.0 methodology for environmental footprint calculation, enabling product carbon footprint comparison and supply chain emission hotspot identification.

> **Business value:** Used by food & beverage companies, retailers, sustainable procurement teams, and policy researchers to benchmark product carbon footprints and identify the highest-impact supply chain interventions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAT_COLORS`, `COUNTRY_COLORS`, `Card`, `KPI`, `PHASES`, `PHASE_COLORS`, `PHASE_LABELS`, `Select`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `uniqueNames` | `useMemo(() => [...new Set(db.products.map(p => p.name))].sort(), [db.products]);` |
| `avgTotal` | `all.length > 0 ? (all.reduce((s, p) => s + p.total, 0) / all.length) : 0;` |
| `highest` | `all.length > 0 ? [...all].sort((a, b) => b.total - a.total)[0] : null;` |
| `lowest` | `all.length > 0 ? [...all].sort((a, b) => a.total - b.total)[0] : null;` |
| `catAvg` | `db.categories.map(cat => {` |
| `catAvgSorted` | `[...catAvg].sort((a, b) => b.avg - a.avg);` |
| `pieData` | `Object.entries(phaseSum).map(([name, value]) => ({ name, value: +value.toFixed(2) }));` |
| `totalPages` | `Math.max(1, Math.ceil(sorted.length / PER_PAGE));` |
| `safePage` | `Math.min(page, totalPages - 1);` |
| `pageItems` | `sorted.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);` |
| `grouped` | `comparison.length > 0 ? comparison.map(p => ({` |
| `countryAvg` | `db.countries.map(c => {` |
| `sorted` | `[...items].sort((a, b) => b.total - a.total);` |
| `top10` | `sorted.slice(0, 10).map(p => ({ name: (p.name.length > 30 ? p.name.slice(0, 27) + '...' : p.name) + ` (${p.country})`, total: p.total }));` |
| `bottom10` | `[...items].sort((a, b) => a.total - b.total).slice(0, 10).map(p => ({ name: (p.name.length > 30 ? p.name.slice(0, 27) + '...' : p.name) + ` (${p.count` |
| `radarData` | `PHASE_LABELS.map((label, i) => ({` |
| `totals` | `items.map(p => p.total);` |
| `maxT` | `totals.length > 0 ? Math.max(...totals) : 1;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAT_COLORS`, `PHASES`, `PHASE_LABELS`, `PROTEIN_CATS`, `TABS`
**Shared context buses:** `BigClimateDbContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Product Carbon Footprint (kgCO2e/kg) | `Σ(stage_emissions) from farm to retail` | EF3.0 LCA records + GLEAM 2.0 | Beef: 14-100 kgCO2e/kg (land use variation); milk: 1.2-3.2 kgCO2e/L; tofu: 1.6-3.5 kgCO2e/kg; wheat: 0.3-1.1 k |
| Land Use Change Emission Share (%) | `LUC_emissions / total_product_CF × 100` | Pendrill et al. (2022) LUC emission database | For beef from deforestation-risk regions, LUC can constitute 40-80% of product footprint; key screen for EUDR  |
| Supply Chain Stage Hotspot | `stage_with_max_emission_share` | EF3.0 stage breakdown | Agriculture dominates for animal products (>70%) and rice (>85%); packaging dominates for highly processed sna |
- **EF3.0 LCA records + GLEAM 2.0 + Pendrill LUC database** → Stage emission aggregation → product carbon footprint → hotspot identification → **Food product carbon footprint database for procurement, labelling, and supply chain decarbonisation**

## 5 · Intermediate Transformation Logic
**Methodology:** Food System LCA via EF3.0 Methodology
**Headline formula:** `product_CF = Σ(stage_i_emissions) = agriculture + processing + packaging + transport + retail + FLOSS`
**Standards:** ['EU JRC Environmental Footprint EF3.0 (2019)', 'IPCC AR6 Chapter 5 Food Systems', 'FAO GLEAM 2.0 Livestock GHG Model']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).