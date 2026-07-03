# Scenario Blending Optimizer
**Module ID:** `scenario-blending-optimizer` · **Route:** `/scenario-blending-optimizer` · **Tier:** B (frontend-computed) · **EP code:** EP-CH2 · **Sprint:** CH

## 1 · Overview
Bayesian Model Averaging with posterior probability weights for NGFS scenarios. Custom blend builder and orderly vs disorderly comparison.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `NGFS`, `OBSERVED_EMISSIONS`, `Pill`, `Ref`, `SCENARIO_PATHS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `lastObs` | `observed[observed.length - 1].obs;` |
| `diffs` | `Object.entries(SCENARIO_PATHS).map(([k, path]) => {` |
| `diff` | `matchYear ? Math.abs(matchYear.value - lastObs) : 10;` |
| `totalLike` | `diffs.reduce((s, d) => s + d.likelihood, 0);` |
| `years` | `SCENARIO_PATHS.current_policies.map(p => p.year);` |
| `total` | `Object.values(customWeights).reduce((s, v) => s + v, 0);` |
| `weightTotal` | `Object.values(customWeights).reduce((s, v) => s + v, 0);` |
| `prob` | `Math.max(0.02, Math.min(0.95, 0.5 - (temp - 2.2) * 0.25 + (yr - 2040) * 0.008));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `OBSERVED_EMISSIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| BMA Weights | `Posterior probability` | Calibration | Based on 2020-2024 observed emissions trajectory |

## 5 · Intermediate Transformation Logic
**Methodology:** Bayesian Model Averaging
**Headline formula:** `P(Scenario_i|Data) ∝ L(Data|Scenario_i) × P(Scenario_i)`
**Standards:** ['Raftery et al. BMA', 'Global Carbon Project']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).