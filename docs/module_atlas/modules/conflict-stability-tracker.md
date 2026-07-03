# Conflict & Stability Tracker
**Module ID:** `conflict-stability-tracker` · **Route:** `/conflict-stability-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CV4 · **Sprint:** CV

## 1 · Overview
ACLED conflict events, political stability trends, fragile states index, and asset proximity analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_PROXIMITY`, `FSI_TOP20`, `HOTSPOTS`, `INS_COLORS`, `RISK_COLORS`, `STABILITY_TREND`, `TABS`, `TREND_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TREND_COLORS` | `{ deteriorating: T.red, 'stable-low': T.amber, improving: T.green };` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_PROXIMITY`, `FSI_TOP20`, `HOTSPOTS`, `STABILITY_TREND`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Conflict Hotspots | — | ACLED | Countries with active conflict |
| Fragile States | — | Fund for Peace | Most fragile nations |

## 5 · Intermediate Transformation Logic
**Methodology:** Conflict proximity risk
**Headline formula:** `ProximityRisk = f(distance_to_conflict, conflict_intensity)`
**Standards:** ['ACLED', 'Fund for Peace FSI']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).