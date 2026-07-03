# Assessment Configuration
**Module ID:** `assessment-configuration` · **Route:** `/assessment-configuration` · **Tier:** B (frontend-computed) · **EP code:** EP-CS6 · **Sprint:** CS

## 1 · Overview
Configurable weights, rating thresholds, scenario parameters, data quality rules, and full audit trail.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_LOG`, `Card`, `NGFS_SCENARIOS`, `RATING_COLORS`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `actions` | `['Updated L1 weights', 'Changed A threshold to 80', 'Enabled NZE scenario', 'Set min DQ to 3', 'Updated B/C boundary', 'Added data quality rule', 'Res` |
| `users` | `['admin@risk-analytics.com', 'j.smith@bank.com', 'a.jones@bank.com'];` |
| `totalWeight` | `useMemo(() => Object.values(weights).reduce((a, b) => a + b, 0), [weights]);` |
| `weightData` | `useMemo(() => TAXONOMY_TREE.map(t => ({ code: t.code, name: t.name, weight: weights[t.code] })), [weights]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Weight Dimensions | — | L1 topics | Each adjustable 0-30% |
| Rating Bands | — | A-E | Configurable thresholds |

## 5 · Intermediate Transformation Logic
**Methodology:** Configuration management
**Headline formula:** `All changes logged with user, timestamp, and reason`
**Standards:** ['Governance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).