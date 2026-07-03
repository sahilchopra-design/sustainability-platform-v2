# Climate Value-at-Risk Engine
**Module ID:** `climate-var-engine` · **Route:** `/climate-var-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-CE1 · **Sprint:** CE

## 1 · Overview
Climate VaR engine decomposing risk into transition + physical + interaction components under 5 NGFS scenarios. Interactive AUM/horizon/confidence controls, loss distribution, Delta CoVaR, and 5×7 stress test matrix.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `SCENARIOS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `horizon_adj` | `Math.sqrt(horizon / 10);` |
| `z_adj` | `(NQ[confidence] ?? NQ[95]) / NQ[95]; // scale VaR linearly with confidence quantile` |
| `transVaR` | `aum * p.trans * horizon_adj * z_adj;` |
| `physVaR` | `aum * p.phys * horizon_adj * z_adj;` |
| `interVaR` | `totalVaR - transVaR - physVaR;` |
| `horizonSensitivity` | `[1, 2, 3, 5, 10, 15, 20, 30].map(h => {` |
| `std` | `Math.max(1, cvar.pct / z);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total CVaR | `Trans + Phys + ρ·Inter` | Model output | Total portfolio climate loss at 95% confidence, 10yr horizon, NZ2050 |
| Transition VaR | `AUM × transRate × √(T/10)` | NGFS parameters | Loss from carbon pricing, policy, technology disruption |
| Physical VaR | `AUM × physRate × √(T/10)` | IPCC projections | Loss from acute and chronic physical climate hazards |
| Interaction VaR | `ρ × √(Trans × Phys) × corrFactor` | Model parameter | Compound effect amplification |
| Delta CoVaR | `Sector contribution to systemic risk` | Adrian & Brunnermeier | Energy sector typically contributes 25-35% of systemic climate risk |

## 5 · Intermediate Transformation Logic
**Methodology:** Decomposed Climate VaR with interaction
**Headline formula:** `CVaR = CVaR_trans + CVaR_phys + ρ · √(CVaR_trans × CVaR_phys) × corrFactor`
**Standards:** ['NGFS Phase 5', 'ECB CST 2024', 'BoE CBES']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).