# Regional Carbon Market Hub
**Module ID:** `regional-carbon-market-hub` · **Route:** `/regional-carbon-market-hub` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Comparative analytics hub for major compliance carbon markets including EU ETS, UK ETS, California-Quebec, RGGI, Korea ETS, China NETs, Australia ERF, and Singapore carbon tax. Tracks current allowance prices, coverage rates, allocation methodology, MRV regime quality, and linking status for cross-market arbitrage and policy risk analysis.

> **Business value:** Used by carbon market traders, climate policy advisors, corporate treasury teams, and project developers to compare compliance carbon market dynamics and assess cross-market arbitrage and policy risk.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CBAM_EXPOSURE`, `CROSS_MARKET_COMPARE`, `INDIA_PAT_SECTORS`, `JCM_CORRIDORS`, `Kpi`, `MARKETS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Market Overview', 'EU ETS Deep Dive', 'India CCTS Deep Dive', 'Japan GX-ETS', 'Cross-Market Compare', 'India PAT / CCTS Sectors', 'CBAM Exposure (In` |
| `arbitrageSpread` | `dst.price2025 - src.price2025;` |
| `arbitrageRevenue` | `arbitrageSpread * carbonQty;` |
| `combinedPriceHistory` | `MARKETS.eu.priceHistory.map((d, i) => ({` |
| `combinedForward` | `MARKETS.eu.forwardCurve.map((d, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CBAM_EXPOSURE`, `CROSS_MARKET_COMPARE`, `INDIA_PAT_SECTORS`, `JCM_CORRIDORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Allowance Price (€/tCO2e) | `market spot price in EUR equivalent` | ICAP + ICE/EEX spot data | EU ETS ~€60-70 (2024); prices >€80 generally needed to drive fuel switching away from coal in power generation |
| Market Coverage (% of nat. GHG) | `covered_emissions / total_national_GHG × 100` | ICAP National Inventory Data | Higher coverage reduces carbon leakage risk and improves policy effectiveness; EU ETS covers ~45% of EU GHG em |
| Policy Risk Score | `compound(political_risk, reform_probability, banking_rule_stability)` | ICAP + national policy tracker | Score >70 indicates high regulatory uncertainty; significant for long-dated ETS forward pricing and project ca |
- **ICAP + World Bank + ICE/EEX price feeds → market parameters** → Currency normalisation → coverage calculation → policy risk scoring → **Cross-market carbon price and policy comparison dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-Market Carbon Price & Policy Analytics
**Headline formula:** `price_gap = ETS_price_i − shadow_carbon_price_SCC × coverage_discount_i`
**Standards:** ['ICAP Emissions Trading Worldwide Status Report 2024', 'World Bank Carbon Pricing Dashboard', 'IEA Carbon Market Review 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `Apr2026CarbonAnalytics`, `IndiaAdvancedAnalytics`, `IndiaGreenHybridFinance`