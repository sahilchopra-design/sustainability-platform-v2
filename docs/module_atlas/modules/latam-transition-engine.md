# Latam Transition Engine
**Module ID:** `latam-transition-engine` · **Route:** `/latam-transition-engine` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BRAZIL_ENERGY`, `CHILE_DATA`, `COLOMBIA_COAL`, `DEFORESTATION_DATA`, `LATAM_COUNTRIES`, `MEXICO_RISK`, `REDD_PIPELINE`, `REFERENCES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Regional Overview', 'Brazil Energy Matrix', 'Amazon Deforestation Finance Risk', 'Chile Lithium & Green H2', 'Colombia Coal Phase-Out', 'Mexico Ener` |
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLOMBIA_COAL`, `DEFORESTATION_DATA`, `LATAM_COUNTRIES`, `MEXICO_RISK`, `REDD_PIPELINE`, `REFERENCES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).