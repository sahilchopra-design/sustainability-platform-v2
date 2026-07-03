# CEDA Emission Factors Database
**Module ID:** `ceda-emission-factors` · **Route:** `/ceda-emission-factors` · **Tier:** B (frontend-computed) · **EP code:** EP-DATA1 · **Sprint:** Platform

## 1 · Overview
Comprehensive Environmentally-Extended Input-Output (EEIO) emission factors database covering 400 sectors across 149 countries, providing supply-chain emission intensity values (kgCO2e/USD) for scope 3 category mapping and enabling comparison between EEIO and process-based LCA approaches. Integrates Exiobase, WIOD, and CEDA 2025 v1.

> **Business value:** Used by corporate GHG inventory teams, scope 3 data providers, and consultants to generate spend-based scope 3 estimates where primary supplier data is unavailable, and to validate process-based LCA results.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Kpi`, `PALETTE`, `SearchInput`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => v === null \|\| v === undefined ? '--' : typeof v === 'number' ? v.toFixed(4) : v;` |
| `maxBucket` | `15; // kgCO2e/USD` |
| `idx` | `Math.min(19, Math.floor(ef / maxBucket * 20));` |
| `histData` | `buckets.map((count, i) => ({` |
| `countryAvgs` | `ceda.countries.map(c => {` |
| `avg` | `efs.length > 0 ? efs.reduce((a, b) => a + b, 0) / efs.length : 0;` |
| `highest` | `[...countryAvgs].sort((a, b) => b.avg - a.avg)[0] \|\| { name: '--', avg: 0 };` |
| `lowest` | `[...countryAvgs].filter(c => c.avg > 0).sort((a, b) => a.avg - b.avg)[0] \|\| { name: '--', avg: 0 };` |
| `avg` | `allEFs.length > 0 ? allEFs.reduce((s, e) => s + e.ef, 0) / allEFs.length : 0;` |
| `mostIntensive` | `topSectors[0] \|\| { name: '--', ef: 0 };` |
| `leastIntensive` | `allEFs.length > 0 ? [...allEFs].sort((a, b) => a.ef - b.ef)[0] : { name: '--', ef: 0 };` |
| `region` | `ceda.getCountryRegion(selCountry) \|\| '--';` |
| `chartData` | `topSectors.map(s => ({` |
| `sectorInfo` | `ceda.sectorMap[selSector] \|\| { code: selSector, name: '--', desc: '' };` |
| `globalAvg` | `allEFs.length > 0 ? allEFs.reduce((s, c) => s + c.ef, 0) / allEFs.length : 0;` |
| `maxB` | `Math.max(...allEFs.map(c => c.ef), 1);` |
| `idx` | `Math.min(14, Math.floor(c.ef / maxB * 15));` |
| `histData` | `buckets.map((count, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PALETTE`, `TABS`
**Shared context buses:** `CedaContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Emission Intensity (kgCO2e/USD) | `f_i × (I-A)^(-1)_ij` | Exiobase 3.8.2 + WIOD 2016 | Higher intensities in coal (8-10 kgCO2e/$), steel (2-4), cement (1.5-3); used for spend-based scope 3 category |
| Scope 3 Category Coverage | `GHG Protocol scope 3 categories coverable by EEIO` | ISO 14069 + GHG Protocol Scope 3 Standard | EEIO covers categories 1, 2, 4, 5, 6, 7, 8, 11, 12 reasonably well; categories 10/13/14/15 require process LCA |
| EEIO vs Process LCA Divergence (%) | `abs(EEIO_estimate − process_LCA_estimate) / process_LCA_estimate × 100` | Harmonisation studies | Average divergence ~40-60%; EEIO systematically higher for manufacturing (upstream capture) vs process LCA whi |
- **Exiobase + WIOD tables + national emission inventories → EEIO model** → Leontief inverse computation → emission intensity per sector/country → **kgCO2e/USD emission factor database for scope 3 spend-based estimation**

## 5 · Intermediate Transformation Logic
**Methodology:** EEIO Supply-Chain Emission Intensity
**Headline formula:** `scope3_emissions = Σ(spend_category_i × EF_i_kgCO2e_USD)`
**Standards:** ['CEDA 2025 v1 (Carnegie Mellon EIO-LCA)', 'Exiobase 3.8.2', 'ISO 14069 Scope 3 GHG Accounting']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).