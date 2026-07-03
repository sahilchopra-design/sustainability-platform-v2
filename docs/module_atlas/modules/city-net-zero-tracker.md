# City Net Zero Tracker
**Module ID:** `city-net-zero-tracker` · **Route:** `/city-net-zero-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-DM6 · **Sprint:** DM

## 1 · Overview
Tracks progress of major cities toward net zero targets — monitoring sectoral emissions pathways, policy implementation, and alignment with 1.5°C science-based city targets. Benchmarks against C40, Race to Zero, and IPCC AR6 urban emission reduction requirements.

> **Business value:** Applicable to city sustainability officers benchmarking against peers, sovereign investors assessing municipal credit quality, and impact investors funding urban climate solutions. SBT4C certification and C40 alignment are increasingly required for city green bond credibility.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `KpiCard`, `REGIONS`, `SECTOR_OPTIONS`, `TABS`, `TARGET_BUCKETS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `pop` | `+(0.3 + sr(i * 3) * 19.7).toFixed(1);` |
| `tgtYr` | `[2030, 2035, 2040, 2050][Math.floor(sr(i * 7) * 4)];` |
| `baseline` | `+(2 + sr(i * 11) * 28).toFixed(1);` |
| `redPct` | `+(10 + sr(i * 13) * 60).toFixed(1);` |
| `current` | `+(baseline * (1 - redPct / 100)).toFixed(2);` |
| `onTrack` | `sr(i * 17) > 0.4;` |
| `sectorCount` | `2 + Math.floor(sr(i * 19) * 4);` |
| `offsetReliance` | `+(5 + sr(i * 23) * 45).toFixed(1);` |
| `finGap` | `+(0.5 + sr(i * 29) * 19.5).toFixed(1);` |
| `implScore` | `Math.round(20 + sr(i * 31) * 80);` |
| `c40` | `sr(i * 37) > 0.5;` |
| `rtz` | `sr(i * 41) > 0.35;` |
| `avgReduction` | `filtered.length ? (filtered.reduce((s, c) => s + c.reductionToDate, 0) / filtered.length).toFixed(1) : '0';` |
| `onTrackPct` | `filtered.length ? (filtered.filter(c => c.onTrack).length / filtered.length * 100).toFixed(0) : '0';` |
| `totalFinGap` | `filtered.reduce((s, c) => s + c.financeGap, 0).toFixed(1);` |
| `topReduction` | `[...filtered].sort((a, b) => b.reductionToDate - a.reductionToDate).slice(0, 20)` |
| `scatterImpl` | `filtered.map(c => ({ x: c.implementationScore, y: c.financeGap, name: c.name }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `REGIONS`, `SECTOR_OPTIONS`, `TABS`, `TARGET_BUCKETS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cities with Net Zero Targets | — | Race to Zero Cities 2024 | Over 1,100 cities globally have committed to net zero — representing 1Bn+ people |
| Urban Emissions Share | — | C40 Cities 2023 | Cities generate 70% of global CO2 emissions while housing 55% of population — primary decarbonisation battlegr |
| SBT4C 1.5°C Cities | — | SBT4C Progress Report 2023 | 108 cities have certified science-based targets aligned with 1.5°C — growing 40% yr-on-yr |
- **CDP Cities emissions disclosure data** → Progress tracking → **Annual city emissions by sector vs target pathway**
- **C40/ICLEI climate action plan databases** → Policy tracking → **Committed policies vs required actions for net zero**
- **SBT4C pathway data by city type and region** → Alignment gap calculation → **Annual permitted emissions vs actual trajectory**

## 5 · Intermediate Transformation Logic
**Methodology:** City Net Zero Progress Score
**Headline formula:** `NZProgress = Σ [w_sector × (TargetReduction - ActualReduction) / TargetReduction]; AlignmentGap = CityEmissions - CityNetZeroPathway_t`
**Standards:** ['C40 City Climate Action Planning 2023', 'Science Based Targets for Cities (SBT4C)', 'IPCC AR6 WGIII Chapter 8 — Urban Systems', 'Race to Zero Campaign — Cities']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).