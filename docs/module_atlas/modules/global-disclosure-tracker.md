# Global Disclosure Tracker
**Module ID:** `global-disclosure-tracker` · **Route:** `/global-disclosure-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CR2 · **Sprint:** CR

## 1 · Overview
12 jurisdictions with cross-walk matrix, gap analysis, timeline, and compliance cost estimator.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CROSSWALK`, `DEADLINES`, `JURISDICTIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Jurisdiction Map','Requirement Cross-Walk','Gap Analysis','Timeline & Deadlines','Overlap Efficiency','Compliance Cost Estimator'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CROSSWALK`, `DEADLINES`, `JURISDICTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Jurisdictions | — | Regulatory mapping | Global coverage |
| Unique Requirements | — | Cross-walk | Requirements not shared with any other jurisdiction |

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-jurisdiction requirement mapping
**Headline formula:** `Overlap = SharedRequirements / UnionOfRequirements`
**Standards:** ['ISSB', 'EFRAG', 'SEC', 'HKEX']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).