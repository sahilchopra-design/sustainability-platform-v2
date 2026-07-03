# Climate-Nature Repository
**Module ID:** `climate-nature-repo` · **Route:** `/climate-nature-repo` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Serves as a unified data repository integrating climate risk metrics and nature/biodiversity data to support dual climate-nature risk assessment and TNFD-aligned reporting.

> **Business value:** Provides a single source of truth for combined climate and nature risk data, reducing duplication across modules and enabling consistent dual-risk disclosure under TCFD and TNFD.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_COMMODITY_DATA`, `BII_DATA`, `Btn`, `COMMODITIES`, `DEFORESTATION_COUNTRIES`, `DEFORESTATION_HOTSPOTS`, `KPI`, `NATURE_IMPACTS`, `PLANETARY_BOUNDARIES`, `SCOPE3_CATEGORIES`, `STAGES`, `Sec`, `WATER_STRESS_REGIONS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `BII_DATA` | `COMMODITIES.map((name, ci) => {` |
| `base` | `ci * 11 + 900;` |
| `base` | `ci * 31 + 7;` |
| `ALL_COMMODITY_DATA` | `COMMODITIES.map((name, ci) => {` |
| `totalGHG` | `stages.reduce((s, st) => s + st.ghg, 0);` |
| `totalWater` | `stages.reduce((s, st) => s + st.water, 0);` |
| `totalLand` | `stages.reduce((s, st) => s + st.land, 0);` |
| `totalBio` | `stages.reduce((s, st) => s + st.biodiversity, 0);` |
| `totalDefor` | `stages.reduce((s, st) => s + st.deforestation, 0);` |
| `totalPollution` | `stages.reduce((s, st) => s + st.pollution, 0);` |
| `totalWaste` | `stages.reduce((s, st) => s + st.waste, 0);` |
| `recyclingRate` | `Math.round(seed(ci * 19 + 3) * 60 + 10);` |
| `circularScore` | `Math.round(seed(ci * 19 + 4) * 50 + 20);` |
| `SCOPE3_CATEGORIES` | `COMMODITIES.slice(0, 15).map((name, i) => ({` |
| `learner1` | `extractionIntensity * 180 + 2000;` |
| `residual1` | `processingMethod * -50 + 1500;` |
| `residual2` | `recyclingRate * -120 + 800;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMODITIES`, `DEFORESTATION_COUNTRIES`, `DEFORESTATION_HOTSPOTS`, `NATURE_IMPACTS`, `PLANETARY_BOUNDARIES`, `STAGES`, `WATER_STRESS_REGIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Datasets Integrated | — | Internal Registry | Number of distinct climate and nature datasets harmonised in the repository spanning biodiversity, water, land |
| TNFD Coverage | — | TNFD v1.0 2023 | Repository spans TNFD's four natural realms and six biome categories enabling LEAP-aligned disclosure. |
- **IPBES, WRI, GBIF, satellite land-cover, NGFS climate hazard grids** → Spatial harmonisation, taxonomy linkage, dual risk scoring → **Integrated risk layers, TNFD-ready disclosures, API endpoints for portfolio modules**

## 5 · Intermediate Transformation Logic
**Methodology:** Integrated Risk Index
**Headline formula:** `IRI = α×ClimateRisk + β×NatureRisk`
**Standards:** ['TNFD LEAP Framework', 'IPBES Global Assessment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).