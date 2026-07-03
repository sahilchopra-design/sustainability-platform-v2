# Climate Credit Pricing Analytics
**Module ID:** `climate-credit-pricing` · **Route:** `/climate-credit-pricing` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Comprehensive carbon credit and ETS allowance pricing analytics covering supply/demand balance modelling, policy risk pricing, VCM benchmark prices by methodology and vintage, and corporate internal carbon price (ICP) adoption tracking. Models the gap between current market prices and shadow carbon prices consistent with Paris Agreement pathways.

> **Business value:** Used by carbon traders, corporate treasury, climate strategists, and sustainability teams to price carbon risk, benchmark VCM procurement, and set internally consistent carbon pricing signals.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BORROWER_SECTORS`, `CREDIT_VAR_PARAMS`, `PORTFOLIO_LOANS`, `RISK_COMPONENTS`, `SCENARIO_PREMIA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `noise` | `sr(i * 17 + 3) * 40 - 20;` |
| `physPrem` | `(physRiskScore / 100) * 25 * scMult;` |
| `transPrem` | `(transRiskScore / 100) * 35 * scMult;` |
| `carbonPrem` | `Math.max(0, carbonPrice - 50) * 0.08 * (transRiskScore / 100);` |
| `totalSpr` | `baseSpr + physPrem + transPrem + carbonPrem;` |
| `annInterest` | `loanM * totalSpr / 10000;` |
| `climateAddon` | `loanM * (physPrem + transPrem + carbonPrem) / 10000;` |
| `rcwa` | `Math.min(1.5, 0.75 + (physRiskScore + transRiskScore) / 400);` |
| `baseVar` | `portfolio.reduce((s, l) => s + l.loanM * (l.baseSpr / 10000) * 0.08, 0);` |
| `physVar` | `portfolio.reduce((s, l) => s + l.loanM * (l.physPrem / 10000) * horizonMult * confMult, 0);` |
| `transVar` | `portfolio.reduce((s, l) => s + l.loanM * (l.transPrem / 10000) * horizonMult * confMult, 0);` |
| `totalVar` | `baseVar + physVar + transVar;` |
| `climateShare` | `(physVar + transVar) / totalVar * 100;` |
| `scenarioComparison` | `useMemo(() => SCENARIO_PREMIA.map(s => ({` |
| `sectorScatter` | `useMemo(() => BORROWER_SECTORS.map(s => ({` |
| `ratingGrid` | `useMemo(() => ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB'].map((r, i) => ({` |
| `totalSpr` | `l.baseSpr + l.physPrem + l.transPrem;` |
| `addon` | `Math.round(l.loanM * (l.physPrem + l.transPrem) / 10000 * 1000);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BORROWER_SECTORS`, `CREDIT_VAR_PARAMS`, `RISK_COMPONENTS`, `SCENARIO_PREMIA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ETS Allowance Fair Value (€/tCO2) | `MAC_curve_intersection + banking_premium` | MAC modelling + EEX forward curve | Provides anchor for ETS allowance trading decisions; significant deviations from fair value indicate short-ter |
| VCM Price by Methodology ($/tCO2) | `transaction-weighted median price by methodology family` | Trove Intelligence + ACX exchange data | Nature-based avoidance ~$5-15; technological removal (DACCS) ~$200-600; gap reflects permanence and scalabilit |
| Corporate ICP Adoption Rate | `companies_with_ICP / Fortune_500_total × 100` | CDP Corporate Action Score survey | CDP data shows ~30% of Fortune 500 use ICP for internal decision-making; higher ICP adoption correlates with S |
- **EEX/ICE ETS forward curves + Trove VCM transactions + CDP ICP survey** → MAC curve modelling → fair value estimation → ICP gap analysis → **Carbon price analytics dashboard for trading, procurement, and strategic planning**

## 5 · Intermediate Transformation Logic
**Methodology:** ETS Allowance Price & VCM Benchmark Modelling
**Headline formula:** `fair_value = f(net_long_position, banking_demand, policy_signal, MAC_curve_intersection)`
**Standards:** ['EU ETS Market Stability Reserve Regulation 2018/842', 'Trove Intelligence VCM Price Benchmarks', 'Fortune 500 ICP Survey (CDP 2024)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).