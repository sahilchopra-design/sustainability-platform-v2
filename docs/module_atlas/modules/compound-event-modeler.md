# Compound Event Modeler
**Module ID:** `compound-event-modeler` · **Route:** `/compound-event-modeler` · **Tier:** B (frontend-computed) · **EP code:** EP-CG5 · **Sprint:** CG

## 1 · Overview
10 compound event pairs with copula-based joint probability, loss amplification factors (1.5-3x), and historical precedents.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPOUND_PAIRS`, `HISTORICAL_COMPOUND`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ampData` | `COMPOUND_PAIRS.map(p => ({` |
| `jointProbData` | `COMPOUND_PAIRS.map(p => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPOUND_PAIRS`, `HISTORICAL_COMPOUND`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Event Pairs | — | IPCC | e.g., drought+wildfire, heatwave+drought, flood+landslide |
| Amplification Factor | `Historical calibration` | Zscheischler (2020) | Compound loss relative to sum of individual losses |

## 5 · Intermediate Transformation Logic
**Methodology:** Copula-based joint probability
**Headline formula:** `P(A∩B) = C(F_A(a), F_B(b); θ) where C is Clayton/Gumbel copula`
**Standards:** ['IPCC AR6 WGI Ch.11', 'Zscheischler et al.']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).