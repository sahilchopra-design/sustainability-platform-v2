# ASEAN & GCC Transition Hub
**Module ID:** `asean-gcc-transition` · **Route:** `/asean-gcc-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-CJ2 · **Sprint:** CJ

## 1 · Overview
ASEAN traffic-light taxonomy, GCC net zero targets, JETP coal retirement, green sukuk, and hydrogen export hubs.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASEAN_COUNTRIES`, `COAL_PHASE`, `GCC_TARGETS`, `H2_PROJECTS`, `REFERENCES`, `SUKUK_PIPELINE`, `TABS`, `TAXONOMY_COMPARISON`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Regional Overview', 'ASEAN Taxonomy (Traffic Light)', 'GCC Net Zero Targets', 'Coal Retirement (VN/ID/PH)', 'Green Sukuk & Islamic Finance', 'Hydrog` |
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |
| `map` | `{ Green: T.green, Amber: T.amber, Red: T.red, 'Transitional': T.blue, 'Not covered': T.textMut, 'Limited': T.textMut, 'Amber/Green': T.sage };` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASEAN_COUNTRIES`, `GCC_TARGETS`, `H2_PROJECTS`, `REFERENCES`, `SUKUK_PIPELINE`, `TABS`, `TAXONOMY_COMPARISON`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| JETP Total | — | JETP Secretariats | South Africa + Indonesia + Vietnam |
| Green Sukuk Market | — | IsDB | Shariah-compliant green finance |

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-market policy alignment
**Headline formula:** `Taxonomy_status = Green/Amber/Red per activity per jurisdiction`
**Standards:** ['ASEAN Taxonomy Board', 'UAE NDC']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).