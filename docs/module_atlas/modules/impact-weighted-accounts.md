# Impact Weighted Accounts
**Module ID:** `impact-weighted-accounts` · **Route:** `/impact-weighted-accounts` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements the Harvard Impact Weighted Accounts (IWA) methodology to translate environmental and social impacts into financial equivalents, enabling comparison of impact performance across companies. Covers employment quality adjustments, product impact (including health and environmental harm), and environmental profitability (EP) calculations.

> **Business value:** Enables investors and companies to quantify the true profitability of business activities after accounting for hidden environmental costs and social value creation, supporting investment decisions, impact reporting, and corporate environmental liability analysis beyond what standard financial accounts reveal.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `QUARTERS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24'];` |
| `pIdx` | `Math.floor(s1*COMPANY_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*COMPANY_SUFFIXES.length);` |
| `secIdx` | `Math.floor(s3*SECTORS.length);` |
| `revenue` | `Math.round((sr(i*31+530)*5000+200)*10)/10;` |
| `opProfit` | `Math.round(revenue*(sr(i*37+540)*0.25+0.05)*10)/10;` |
| `carbonCost` | `Math.round((sr(i*43+550)*revenue*0.08)*10)/10;` |
| `waterCost` | `Math.round((sr(i*47+560)*revenue*0.02)*10)/10;` |
| `wasteCost` | `Math.round((sr(i*53+570)*revenue*0.015)*10)/10;` |
| `biodiversityCost` | `Math.round((sr(i*61+580)*revenue*0.01)*10)/10;` |
| `totalEnvCost` | `Math.round((carbonCost+waterCost+wasteCost+biodiversityCost)*10)/10;` |
| `jobsQuality` | `Math.round((sr(i*67+590)*revenue*0.03-revenue*0.01)*10)/10;` |
| `livingWage` | `Math.round((sr(i*71+600)*revenue*0.02-revenue*0.005)*10)/10;` |
| `healthSafety` | `Math.round((sr(i*29+610)*revenue*0.01-revenue*0.003)*10)/10;` |
| `diversity` | `Math.round((sr(i*23+620)*revenue*0.015-revenue*0.002)*10)/10;` |
| `totalSocialValue` | `Math.round((jobsQuality+livingWage+healthSafety+diversity)*10)/10;` |
| `employmentImpact` | `Math.round((sr(i*83+630)*revenue*0.05-revenue*0.01)*10)/10;` |
| `productImpact` | `Math.round((sr(i*89+640)*revenue*0.04-revenue*0.015)*10)/10;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `QUARTERS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Environmental Profitability Margin (%) | — | Harvard IWA database | EP as a percentage of revenue; heavily polluting industries (cement, steel, coal) typically show deeply negati |
| Employment Quality Wage Premium ($bn) | — | Harvard IWA Employment Module | Additional compensation paid to employees above living wage benchmarks across all employment tiers, representi |
| Product Impact Score | — | Harvard IWA Product Module | Net impact of products on health, environment, and access; tobacco scores deeply negative; vaccine manufacture |
| Social Cost of Carbon ($/tCO2e) | — | US IWG / Rennert et al. 2022 | Monetisation coefficient for GHG emissions in environmental profitability calculations; Rennert et al. 2022 up |
- **Company financial statements (income statement, headcount)** → Extract EBIT, revenue, wages by geography → **Financial baseline for IWA**
- **Environmental data (emissions, water, land use)** → Apply SCC, water scarcity value, land use coefficients → **Monetised environmental cost by impact category**
- **Employment data (wages by tier and country)** → Compare to ILO living wage benchmarks by country → **Employment quality impact in dollars**

## 5 · Intermediate Transformation Logic
**Methodology:** Environmental Profitability
**Headline formula:** `EP = Financial_EBIT - Environmental_Cost`
**Standards:** ['Harvard IWA Framework (2021)', 'Social Cost of Carbon (US IWG 2021)', 'WHO DALY Monetisation']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).