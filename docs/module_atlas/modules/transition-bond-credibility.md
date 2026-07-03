# Transition Bond Credibility
**Module ID:** `transition-bond-credibility` · **Route:** `/transition-bond-credibility` · **Tier:** B (frontend-computed) · **EP code:** EP-CQ2 · **Sprint:** CQ

## 1 · Overview
20 SLB/transition bonds with KPI strength scoring, step-up probability, and use-of-proceeds verification.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `KPI_DIMS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Bond Universe','KPI Strength Scoring','Coupon Step-Up Probability','Use of Proceeds Verification','Issuer Transition Plan Cross-Check','Peer Compari` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BONDS`, `KPI_DIMS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Bonds | — | Market | SLB and transition bonds |
| Avg Step-Up | — | Prospectus data | Average coupon step-up if KPI missed |

## 5 · Intermediate Transformation Logic
**Methodology:** KPI credibility assessment
**Headline formula:** `P(miss) = P(KPI < target); ExpectedCost = P(miss) × StepUpBps`
**Standards:** ['ICMA SLB Principles']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).