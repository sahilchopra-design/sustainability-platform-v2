# Climate Migration Risk
**Module ID:** `climate-migration-risk` · **Route:** `/climate-migration-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-CG6 · **Sprint:** CG

## 1 · Overview
15 migration corridors with World Bank Groundswell projections (216M internal migrants by 2050), urban stress, and real estate demand shift.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `COLORS`, `CORRIDORS`, `COUNTRIES_50`, `DRIVERS`, `DRIVER_COLORS`, `LABOR_SECTORS`, `PROJECTIONS`, `RE_IMPACTS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `yearMult` | `(yearSlider-2025)/25;` |
| `projection` | `+(baseProj*rcpMult*yearMult).toFixed(2);` |
| `totals` | `DRIVERS.map((d,di)=>{` |
| `rows` | `sorted.map(c=>[c.name,c.region,c.projectionMn,c.seaLevel,c.drought,c.flooding,c.extremeHeat,c.cyclones,c.waterStress,c.annualDisplacement,c.gdpImpact,` |
| `blob` | `new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);` |
| `totalProjection` | `countries.reduce((a,c)=>a+c.projectionMn,0);` |
| `totalMigrants` | `CORRIDORS.reduce((s, c) => s + (scenario === 'optimistic' ? c.migrants2050 * 0.53 : scenario === 'pessimistic' ? c.migrants2050 * 1.43 : c.migrants205` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `COLORS`, `CORRIDORS`, `COUNTRIES_50`, `DRIVERS`, `DRIVER_COLORS`, `LABOR_SECTORS`, `PROJECTIONS`, `RE_IMPACTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Internal Migrants (2050) | `Pessimistic scenario` | World Bank | Under high-emissions, low-development scenario |
| Corridors | — | Geopolitical | Major climate-driven migration routes globally |

## 5 · Intermediate Transformation Logic
**Methodology:** Climate migration projection
**Headline formula:** `Migrants(scenario) = Population × ExposureFraction × MigrationPropensity`
**Standards:** ['World Bank Groundswell', 'IDMC', 'UNHCR']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).