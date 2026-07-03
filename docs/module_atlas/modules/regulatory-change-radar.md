# Regulatory Change Radar
**Module ID:** `regulatory-change-radar` · **Route:** `/regulatory-change-radar` · **Tier:** B (frontend-computed) · **EP code:** EP-CR5 · **Sprint:** CR

## 1 · Overview
50 active regulatory changes tracked globally with consultations, effective dates, impact assessment, and response tracking.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHANGES`, `CONSULTATIONS`, `FEED`, `IMPACT_BY_CAT`, `IMPACT_COLORS`, `STATUS_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `jurisdictions` | `[...new Set(CHANGES.map(c => c.jurisdiction))];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHANGES`, `CONSULTATIONS`, `FEED`, `IMPACT_BY_CAT`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Changes | — | Global tracking | Regulatory developments in progress |
| Consultations Open | — | Various | Comment periods currently accepting input |

## 5 · Intermediate Transformation Logic
**Methodology:** Regulatory impact scoring
**Headline formula:** `Impact = Scope × Materiality × Urgency`
**Standards:** ['Policy trackers']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).