# Climate Emissions Intelligence
**Module ID:** `climate-emissions-intelligence` · **Route:** `/climate-emissions-intelligence` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BADGE`, `COUNTRIES_LIST`, `FREE_DATA_SOURCES`, `FUEL_TYPES`, `KPICARD`, `MAC_OPTIONS`, `MONOBOX`, `NGFS_SCENARIOS`, `REGIONS`, `REGION_COLORS`, `SECTION`, `SECTORS`, `SEED_COUNTRIES`, `SPINNERBOX`, `TABLE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SEED_COUNTRIES` | `COUNTRIES_LIST.map((country, i) => ({` |
| `parsed` | `lines.slice(1, 5000).map(line => {` |
| `pop` | `parseFloat(c.population) / 1e6 \|\| (100 + sr(i * 7) * 1000);` |
| `gdpCap` | `parseFloat(c.gdp) / parseFloat(c.population) \|\| (1000 + sr(i * 11) * 40000);` |
| `energyInt` | `parseFloat(c.energy_per_gdp) \|\| (0.1 + sr(i * 37) * 0.4);` |
| `carbonInt` | `0.5 + sr(i * 43) * 1.5;` |
| `impliedCo2` | `(gdpCap / 1000) * energyInt * carbonInt;` |
| `residual` | `observed > 0 ? ((impliedCo2 - observed) / observed * 100).toFixed(1) : 'N/A';` |
| `tech` | `base * Math.pow(1 - 0.05, y);         // 5%/yr carbon intensity` |
| `eff` | `base * Math.pow(1 - 0.03, y);           // 3%/yr energy intensity` |
| `demand` | `base * Math.pow(1 - 0.01, y);        // 1%/yr GDP growth reduction` |
| `combined` | `base * Math.pow(1 - 0.025, y) * Math.pow(1 - 0.015, y) * Math.pow(1 - 0.005, y);` |
| `activity` | `(sr(i * 7) * 200 - 100).toFixed(1);` |
| `intensity` | `-(sr(i * 11) * 180).toFixed(1);` |
| `structure` | `(sr(i * 13) * 100 - 50).toFixed(1);` |
| `carbon` | `-(sr(i * 17) * 150).toFixed(1);` |
| `total` | `(parseFloat(activity) + parseFloat(intensity) + parseFloat(structure) + parseFloat(carbon)).toFixed(1);` |
| `omega` | `(0.001 + sr(i * 7) * 0.02).toFixed(4);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_LIST`, `FREE_DATA_SOURCES`, `FUEL_COLORS`, `FUEL_TYPES`, `MAC_OPTIONS`, `NGFS_SCENARIOS`, `OWID_COLS`, `SECTORS`, `SECTOR_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).