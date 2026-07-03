# Assessment Audit Trail
**Module ID:** `assessment-audit-trail-v2` · **Route:** `/assessment-audit-trail-v2` · **Tier:** B (frontend-computed) · **EP code:** EP-CW5 · **Sprint:** CW

## 1 · Overview
Score change log, version history, drift monitoring, data lineage, and ISAE 3000 compliance evidence pack.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CHANGE_LOG`, `Card`, `DRIFT_DATA`, `ENTITIES_LIST`, `KPI`, `LINEAGE`, `TABS`, `USERS`, `USER_ACTIVITY`, `VERSIONS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DRIFT_DATA` | `ENTITIES_LIST.map((e,i) => ({` |
| `USER_ACTIVITY` | `USERS.map((u,i) => ({` |
| `delta` | `c.newValue - c.oldValue;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES_LIST`, `LINEAGE`, `TABS`, `USERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Change Log Entries | — | Audit system | Timestamped score changes |
| Drift Threshold | — | Configurable | 3-month score change alert |

## 5 · Intermediate Transformation Logic
**Methodology:** Score lineage tracking
**Headline formula:** `Every score traced: Entity → TaxonomyNode → DataSource → RawDatapoint`
**Standards:** ['ISAE 3000', 'ISAE 3410']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).