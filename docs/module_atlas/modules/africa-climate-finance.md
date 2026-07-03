# Africa Climate Finance
**Module ID:** `africa-climate-finance` · **Route:** `/africa-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-CJ5 · **Sprint:** CJ

## 1 · Overview
Africa electrification pathways, climate finance flows vs $250B need, loss & damage, and green minerals opportunity.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADAPTATION_MATRIX`, `AFRICA_REGIONS`, `CLIMATE_FINANCE`, `ELECTRIFICATION`, `GREEN_MINERALS`, `LOSS_DAMAGE`, `REFERENCES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPTATION_MATRIX`, `AFRICA_REGIONS`, `GREEN_MINERALS`, `REFERENCES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Without Electricity | — | IEA/World Bank | Primarily Sub-Saharan Africa |
| Finance Gap | — | UNEP | $250B need - $30B flow |

## 5 · Intermediate Transformation Logic
**Methodology:** Electrification economics
**Headline formula:** `LCOE_minigrid vs LCOE_grid_extension per location`
**Standards:** ['IRENA Africa', 'AfDB']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).