# Private Markets ESG Hub
**Module ID:** `private-markets-esg-hub` · **Route:** `/private-markets-esg-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Unified ESG analytics platform for private markets including private equity, real estate, infrastructure, and private credit asset classes.

> **Business value:** Provides a single platform for ESG data collection, scoring, and reporting across all private market asset classes, supporting ILPA and GRESB compliance.

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
| Total Private AUM Covered (£Bn) | — | Portfolio Registry | Total private market AUM for which ESG data has been collected. |
| Data Coverage (%) | — | Data Collection Workflow | Proportion of portfolio companies/assets with ESG assessment complete. |
| ESG Composite Score | — | ILPA/GRESB | Portfolio-level weighted average ESG score across private market holdings. |
- **GP ESG reports + GRESB submissions + ILPA templates** → Class-specific ESG scoring; data normalisation; aggregation → **Unified private markets ESG dashboard and disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** Private Markets ESG Composite
**Headline formula:** `ESG_pm = Σ(AUMᵢ × ESGᵢ) / ΣAUMᵢ across PE+RE+Infra+PD`
**Standards:** ['ILPA ESG Assessment Framework', 'GRESB Infrastructure Assessment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).