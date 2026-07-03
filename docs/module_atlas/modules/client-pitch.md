# Client Pitch
**Module ID:** `client-pitch` · **Route:** `/client-pitch` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Callout`, `DataTable`, `KpiCard`, `PALETTE`, `SECTION_IDS`, `SECTION_LABELS`, `SectionHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `unique` | `[...new Set(NIFTY_50.map(c => c.sector))];` |
| `totalMcap` | `arr.reduce((s, c) => s + (c.marketCap_usd_mn \|\| 0), 0);` |
| `totalScope1` | `arr.reduce((s, c) => s + (c.scope1_tco2e \|\| 0), 0);` |
| `totalScope2` | `arr.reduce((s, c) => s + (c.scope2_tco2e \|\| 0), 0);` |
| `totalScope3` | `arr.reduce((s, c) => s + (c.scope3_tco2e \|\| 0), 0);` |
| `avgEsg` | `arr.reduce((s, c) => s + (c.esgScore \|\| 0), 0) / n;` |
| `avgTemp` | `arr.reduce((s, c) => s + (c.temperatureAlignment_c \|\| 0), 0) / n;` |
| `avgTransition` | `arr.reduce((s, c) => s + (c.transitionScore \|\| 0), 0) / n;` |
| `avgPhysical` | `arr.reduce((s, c) => s + (c.physicalRiskScore \|\| 0), 0) / n;` |
| `avgWater` | `arr.reduce((s, c) => s + (c.waterStress \|\| 0), 0) / n;` |
| `waci` | `totalMcap > 0 ? (totalScope1 + totalScope2) / totalMcap : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PALETTE`, `SECTION_IDS`, `SECTION_LABELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).