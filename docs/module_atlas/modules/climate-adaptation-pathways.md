# Adaptation Pathways Engine
**Module ID:** `climate-adaptation-pathways` · **Route:** `/climate-adaptation-pathways` · **Tier:** B (frontend-computed) · **EP code:** EP-CF1 · **Sprint:** CF

## 1 · Overview
8 adaptation strategies across 6 sectors with full cost-benefit analysis (BCR 3.8-14x), maladaptation risk assessment, UNEP adaptation finance gap analysis ($124B/yr), and SSP scenario sensitivity.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADAPTATION_FINANCE`, `MALADAPT_CASES`, `RADAR_DATA`, `STRATEGIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Strategy Catalogue', 'Cost-Benefit Analysis', 'Maladaptation Risk', 'Adaptation Finance Gap', 'Scenario Sensitivity'];` |
| `sortedByBcr` | `useMemo(() => [...STRATEGIES].sort((a, b) => b.bcr - a.bcr), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPTATION_FINANCE`, `MALADAPT_CASES`, `RADAR_DATA`, `STRATEGIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg BCR | `Investment-weighted` | Model output | Every $1 invested in adaptation returns $5.6 in avoided losses |
| Adaptation Finance Gap | `Need - Flow` | UNEP 2024 | Gap between developing country adaptation needs and current flows |
| Maladaptation Risk | `Per strategy` | IPCC AR6 WGII Ch.16 | Risk that adaptation action increases vulnerability or shifts risk |
| NbS BCR | — | Costanza et al. | Nature-based solutions deliver highest BCR due to co-benefits |

## 5 · Intermediate Transformation Logic
**Methodology:** Cost-benefit analysis with SSP sensitivity
**Headline formula:** `BCR = NPV_Benefits / NPV_Costs; SSP_BCR = BCR × scenario_hazard_multiplier`
**Standards:** ['UNEP Adaptation Gap Report', 'IPCC AR6 WGII', 'Global Commission on Adaptation']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).