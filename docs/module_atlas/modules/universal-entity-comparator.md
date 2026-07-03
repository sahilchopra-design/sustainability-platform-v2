# Universal Entity Comparator
**Module ID:** `universal-entity-comparator` · **Route:** `/universal-entity-comparator` · **Tier:** B (frontend-computed) · **EP code:** EP-CW1 · **Sprint:** CW

## 1 · Overview
15 entities (FI/Energy/Corporate) compared side-by-side across 8 L1 taxonomy topics.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `ENTITIES`, `ENTITY_COLORS`, `KPI`, `L1_LABELS`, `L1_TOPICS`, `L2_DATA`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Side-by-Side','Taxonomy Comparison','Score Spider','Gap Analysis','Historical Comparison','Export'];` |
| `radarData` | `useMemo(() => L1_TOPICS.map(t => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES`, `ENTITY_COLORS`, `L1_TOPICS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Entities | — | Cross-type | 5 FIs, 5 energy, 5 corporates |

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-entity radar comparison
**Headline formula:** `Gap = EntityA_score - EntityB_score per topic`
**Standards:** ['Taxonomy assessment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).