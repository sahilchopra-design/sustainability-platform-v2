# Private Markets Hub
**Module ID:** `private-markets-hub` · **Route:** `/private-markets-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated analytics dashboard aggregating financial performance, ESG metrics, and climate risk signals across all private market allocations.

> **Business value:** Central command centre for private market investment teams, integrating financial performance with ESG and climate risk intelligence for holistic portfolio oversight.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADOPTION_TREND`, `DD_STAGES`, `ESG_BY_STRATEGY`, `ESG_CHAMPIONS`, `EVIDENCE`, `FRAMEWORK_COMPLETION`, `KpiCard`, `LP_METRICS`, `LP_SATISFACTION`, `RADAR_DATA`, `RED_FLAGS`, `REGULATIONS`, `REG_TIMELINE`, `REPORTING_TIME`, `RISK_DIMENSIONS`, `SCORE_IMPROVEMENT`, `STRATEGY_CARDS`, `STRATEGY_RISKS`, `STRESS_SCENARIO`, `SectionTitle`, `StatusBadge`, `TABS`, `TOP_CONCENTRATIONS`, `Tab1`, `Tab2`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RADAR_DATA` | `RISK_DIMENSIONS.map((dim, i) => ({` |
| `BADGE_ITEMS` | `['Hub', 'PE + Credit + Infra + RE + VC', '$8.4T AUM', 'ESG DD Engine', 'LP Reporting'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADOPTION_TREND`, `BADGE_ITEMS`, `DD_STAGES`, `ESG_BY_STRATEGY`, `ESG_CHAMPIONS`, `EVIDENCE`, `FRAMEWORK_COMPLETION`, `LP_METRICS`, `LP_SATISFACTION`, `RED_FLAGS`, `REGULATIONS`, `REG_TIMELINE`, `REPORTING_TIME`, `RISK_DIMENSIONS`, `SCORE_IMPROVEMENT`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total AUM (£Bn) | — | Portfolio Registry | Combined private market AUM across PE, RE, Infrastructure, and Private Debt. |
| IRR (Net, %) | — | Fund Accounting | Net internal rate of return across private market portfolio since inception. |
| Climate Risk Coverage (%) | — | Climate Screening | Share of portfolio AUM with climate risk assessment completed. |
- **Fund accounts + ESG data + climate risk scores** → Performance aggregation; ESG overlay; risk attribution → **Consolidated private markets analytics dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Private Markets Risk-Return Score
**Headline formula:** `RR = E(r)_net / σ_returns × ESG_adjustment`
**Standards:** ['Internal Private Markets Methodology']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).