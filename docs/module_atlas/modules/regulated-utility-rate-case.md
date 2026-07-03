# Regulated Utility Rate Case Analytics
**Module ID:** `regulated-utility-rate-case` · **Route:** `/regulated-utility-rate-case` · **Tier:** B (frontend-computed) · **EP code:** EP-EL3 · **Sprint:** EL

## 1 · Overview
Cost-of-service framework for 12 US investor-owned utilities (IOUs) across FERC and state PUC jurisdictions, detailed rate base build-up (original cost, ADIT, CWIP), revenue requirement decomposition, 16-year allowed vs earned ROE history with Fed Funds overlay, case timeline visualisation (41-week standard process), 10-year capex forecast by programme, and WACC calculator with equity ratio sensitivity.

> **Business value:** Used by utility equity analysts modelling allowed return evolution, rate case expert witnesses preparing cost-of-capital testimony, and fixed income investors assessing regulatory compact quality across US state PUC jurisdictions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPEX_FORECAST`, `CASE_TIMELINE`, `KpiCard`, `Pill`, `RATE_BASE_COMPONENTS`, `REGULATORY_RADAR`, `REVENUE_REQUIREMENT`, `ROE_HISTORY`, `UTILITIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `wacc` | `(equityRatio/100 * roeAssumption + (1-equityRatio/100) * debtCost * (1-0.21)).toFixed(2);` |
| `allowedReturn` | `(util.rate_base * +wacc / 100 / 1000).toFixed(2);` |
| `lagCost` | `Math.round(util.rate_base * (util.allowed_roe - util.earned_roe) / 100 / 1000 * util.lag_days / 365 * 1000);` |
| `avgROE` | `(UTILITIES.reduce((s,u) => s+u.allowed_roe, 0)/UTILITIES.length).toFixed(2);` |
| `avgLag` | `Math.round(UTILITIES.reduce((s,u) => s+u.lag_days, 0)/UTILITIES.length);` |
| `totalRateBase` | `UTILITIES.reduce((s,u) => s+u.rate_base, 0);` |
| `settlementRate` | `Math.round(UTILITIES.filter(u=>u.settlement).length/UTILITIES.length*100);` |
| `tabs` | `['Utility Universe', 'Rate Base Build-Up', 'Revenue Requirement', 'ROE Trends', 'Case Timeline', 'Capex Recovery', 'WACC Calculator'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CASE_TIMELINE`, `RATE_BASE_COMPONENTS`, `REGULATORY_RADAR`, `REVENUE_REQUIREMENT`, `UTILITIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Median allowed ROE (US electric) | `2023 NARUC annual survey; 12-month rolling` | NARUC Rate Case Survey Q4 2023 | Range 9.3-10.2% across states; historically 11.5% pre-2012 rate cycle; decline tracking 10yr UST compression + |
| Median regulatory lag (US) | `Filing to new rates effective — contested cases` | EEI Rate Case Activity 2023 | Settlement cases average 240 days; litigated full cases 420+ days; FERC formula rates have zero lag — key adva |
| Capex recovery mechanisms | `Estimated share of spend recovered outside base rates` | Edison Electric Institute 2023 | Reduces effective regulatory lag for capex; FERC formula rates cover all transmission capex; state riders vary |
- **NARUC Rate Case Survey + FERC USoA + EEI Financial Review + SNL Energy Rate Case Database + Moody's utility rating methodology + S&P regulated utility scorecard** → 12-IOU rate case table + rate base build + revenue requirement + ROE history + case timeline + capex forecast + WACC calculator → **Utility equity analysts, rate case expert witnesses, utility bond investors assessing allowed return trajectory, and regulatory economists preparing testimony**

## 5 · Intermediate Transformation Logic
**Methodology:** Rate Case Cost of Service & WACC
**Headline formula:** `Revenue_Req = (Rate_Base × WACC_after_tax) + Depreciation + O&M + Taxes + Revenue_Grossup; WACC_AT = Eq_Ratio × ROE + (1 − Eq_Ratio) × Cost_LTD × (1 − Tax_Rate); Reg_Lag_Cost = Rate_Base × (ROE_allowed − ROE_earned) × Lag_Days/365; AFUDC_Equity = CWIP × Equity_AFUDC_Rate`
**Standards:** ['FERC Uniform System of Accounts 18 CFR Part 101', 'Edison Electric Institute Rate Case Summary 2023', 'NARUC Utility Rate Design Manual']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).