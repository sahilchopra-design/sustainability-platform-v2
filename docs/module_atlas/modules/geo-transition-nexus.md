# Geo-Transition Nexus
**Module ID:** `geo-transition-nexus` · **Route:** `/geo-transition-nexus` · **Tier:** B (frontend-computed) · **EP code:** EP-CV5 · **Sprint:** CV

## 1 · Overview
Combined geopolitical + transition risk scoring with fossil state risk identification and policy reversal scenarios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `FOSSIL_STATES`, `POLICY_REVERSALS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FOSSIL_STATES` | `COUNTRIES.filter(c => c.fossil_rev_pct > 30).sort((a, b) => b.fossil_rev_pct - a.fossil_rev_pct);` |
| `TABS` | `['Combined Score Matrix','Correlation Analysis','Scenario What-If','Portfolio Overlay','Fossil State Risk','Climate Policy Reversal'];` |
| `score` | `Math.round((1 - w) * c.transition + w * (100 - c.geopolitical));` |
| `wRisk` | `+(c.portfolio_exp * (100 - c.combined) / 100).toFixed(2);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `POLICY_REVERSALS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Geo Weight | — | Configurable | Geopolitical contribution to combined score |
| Fossil States | — | Analysis | Countries at risk of stranded state |

## 5 · Intermediate Transformation Logic
**Methodology:** Combined risk scoring
**Headline formula:** `Combined = (1-w)×TransitionScore + w×GeoScore (w default 0.15)`
**Standards:** ['Model', 'NGFS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).