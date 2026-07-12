# Impact Weighted Accounts
**Module ID:** `impact-weighted-accounts` · **Route:** `/impact-weighted-accounts` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements the Harvard Impact Weighted Accounts (IWA) methodology to translate environmental and social impacts into financial equivalents, enabling comparison of impact performance across companies. Covers employment quality adjustments, product impact (including health and environmental harm), and environmental profitability (EP) calculations.

> **Business value:** Enables investors and companies to quantify the true profitability of business activities after accounting for hidden environmental costs and social value creation, supporting investment decisions, impact reporting, and corporate environmental liability analysis beyond what standard financial accounts reveal.

**How an analyst works this module:**
- Select the company or portfolio and load financial statements, emissions, water, and employment data.
- Apply the IWA environmental cost module using social cost of carbon, water scarcity pricing, and land use valuations.
- Compute employment quality adjustments by comparing actual wages to living wage benchmarks by operating country.
- Generate the integrated IWA report showing financial, environmental, and social profitability in a unified P&L presentation.

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
| `totalImpact` | `Math.round((employmentImpact+productImpact+envImpact+totalSocialValue)*10)/10;` |
| `impactWeightedProfit` | `Math.round((opProfit+totalImpact)*10)/10;` |
| `weight` | `Math.round((sr(i*97+650)*3+0.1)*100)/100;` |
| `qFactor` | `0.85+sr(i*11+q*17+660)*0.3;` |
| `tradReturn` | `Math.round((sr(i*101+670)*20-5)*100)/100;` |
| `impactReturn` | `Math.round((tradReturn+(totalImpact/revenue)*5)*100)/100;` |
| `csv` | `[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `tabs` | `['Impact P&L','Environmental Costs','Social Value','Impact-Weighted Returns'];` |
| `agg` | `useMemo(()=>{ const totRev=Math.round(companies.reduce((a,c)=>a+c.revenue,0));` |
| `totOp` | `Math.round(companies.reduce((a,c)=>a+c.opProfit,0));` |
| `totIW` | `Math.round(companies.reduce((a,c)=>a+c.impactWeightedProfit,0));` |
| `totEnv` | `Math.round(companies.reduce((a,c)=>a+c.totalEnvCost,0));` |
| `totSoc` | `Math.round(companies.reduce((a,c)=>a+c.totalSocialValue,0));` |
| `avgAlpha` | `Math.round(companies.reduce((a,c)=>a+c.impactAlpha,0)/companies.length*100)/100;` |
| `portTrendData` | `QUARTERS.map((q,qi)=>{` |
| `tradSum` | `companies.reduce((a,c)=>a+(c.trendData[qi]?.tradProfit\|\|0),0);` |
| `iwSum` | `companies.reduce((a,c)=>a+(c.trendData[qi]?.iwProfit\|\|0),0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `QUARTERS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Environmental Profitability Margin (%) | — | Harvard IWA database | EP as a percentage of revenue; heavily polluting industries (cement, steel, coal) typically show deeply negative EP (-20% to -40%); clean tech can show positive EP above 5%. |
| Employment Quality Wage Premium ($bn) | — | Harvard IWA Employment Module | Additional compensation paid to employees above living wage benchmarks across all employment tiers, representing positive employment impact. |
| Product Impact Score | — | Harvard IWA Product Module | Net impact of products on health, environment, and access; tobacco scores deeply negative; vaccine manufacturers score highly positive. |
| Social Cost of Carbon ($/tCO2e) | — | US IWG / Rennert et al. 2022 | Monetisation coefficient for GHG emissions in environmental profitability calculations; Rennert et al. 2022 updated estimate is $185/tCO2e. |
- **Company financial statements (income statement, headcount)** → Extract EBIT, revenue, wages by geography → **Financial baseline for IWA**
- **Environmental data (emissions, water, land use)** → Apply SCC, water scarcity value, land use coefficients → **Monetised environmental cost by impact category**
- **Employment data (wages by tier and country)** → Compare to ILO living wage benchmarks by country → **Employment quality impact in dollars**

## 5 · Intermediate Transformation Logic
**Methodology:** Environmental Profitability
**Headline formula:** `EP = Financial_EBIT - Environmental_Cost`

Computes environmental profitability by deducting monetised environmental costs (GHG emissions at social cost of carbon, water consumption, land use, air pollutants) from reported EBIT. A positive EP indicates the company creates more financial value than it destroys in environmental terms; negative EP implies hidden environmental losses exceeding reported profit.

**Standards:** ['Harvard IWA Framework (2021)', 'Social Cost of Carbon (US IWG 2021)', 'WHO DALY Monetisation']
**Reference documents:** Harvard Business School â€” Impact Weighted Accounts Framework (2021); Rennert et al. (2022) â€” Comprehensive Evidence Implies a Higher Social Cost of Carbon; US Interagency Working Group â€” Social Cost of Carbon (2021); Serafeim et al. â€” Impact Weighted Financial Accounts (2019)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module implements the **Harvard Impact-Weighted Accounts (IWA)** structure — adding monetised
environmental costs and social value to operating profit to derive an *impact-weighted profit*. The
accounting *skeleton* is faithful to IWA; every monetary input, however, is a synthetic fraction of a
synthetic revenue figure. Code and guide agree on structure, so no mismatch flag — but §8 specifies the
real monetisation the guide's Social-Cost-of-Carbon framing requires.

### 7.1 What the module computes

For 80 generated companies (`genCompanies(80)`), the IWA P&L bridge:

```js
opProfit           = revenue × (sr()·0.25 + 0.05)                 // 5–30% margin
totalEnvCost       = carbonCost + waterCost + wasteCost + biodiversityCost
totalSocialValue   = jobsQuality + livingWage + healthSafety + diversity
envImpact          = −totalEnvCost
totalImpact        = employmentImpact + productImpact + envImpact + totalSocialValue
impactWeightedProfit = opProfit + totalImpact
```

Each cost/value line is a signed fraction of revenue, e.g.:

```js
carbonCost   = sr()·revenue·0.08                                  // up to 8% of revenue
waterCost    = sr()·revenue·0.02 ; wasteCost = sr()·revenue·0.015 ; biodiversityCost = sr()·revenue·0.01
jobsQuality  = sr()·revenue·0.03 − revenue·0.01                   // can be negative
employmentImpact = sr()·revenue·0.05 − revenue·0.01
productImpact    = sr()·revenue·0.04 − revenue·0.015
```

**Impact-weighted return / alpha**:

```js
impactReturn = tradReturn + (totalImpact/revenue)·5
impactAlpha  = impactReturn − tradReturn
```

### 7.2 Parameterisation / scoring rubric

| IWA line | Coefficient on revenue | Sign | Provenance |
|---|---|---|---|
| Carbon cost | ×0.08 | negative | Synthetic; IWA uses SCC × tonnes, not % revenue |
| Water cost | ×0.02 | negative | Synthetic |
| Waste cost | ×0.015 | negative | Synthetic |
| Biodiversity cost | ×0.01 | negative | Synthetic |
| Jobs quality | ×0.03 − 0.01 | ± | Synthetic (living-wage gap proxy) |
| Employment impact | ×0.05 − 0.01 | ± | Synthetic |
| Product impact | ×0.04 − 0.015 | ± | Synthetic |
| `impactReturn` uplift | (totalImpact/revenue)×5 | ± | Ad-hoc scaling — no basis |

The four environmental categories and three social/product categories mirror the **real IWA taxonomy**
(environmental intensity, employment, product impact); only the monetisation is synthetic (a % of
revenue rather than SCC × emissions, living-wage-gap × headcount, etc.).

### 7.3 Calculation walkthrough

`genCompanies` builds each company's revenue, margin, four env-cost lines, four social-value lines,
employment and product impacts, then sums to `totalImpact` and `impactWeightedProfit`. An 8-quarter
trend applies a quarterly factor (`0.85 + sr()·0.3`)/4 to profit/cost/value. `agg` sums portfolio
revenue, operating profit, impact-weighted profit, env cost, social value and average impact alpha.
`portTrendData` sums traditional vs impact-weighted profit per quarter.

### 7.4 Worked example (one company)

Take `revenue = $1 000M`, margin draw → `opProfit = $150M`; env-cost draws → carbon $50M, water $12M,
waste $9M, biodiversity $6M; social/product draws → social value $20M, employment $25M, product $10M:

| Step | Computation | Result |
|---|---|---|
| totalEnvCost | 50+12+9+6 | **$77M** |
| envImpact | −77 | **−$77M** |
| totalImpact | 25 + 10 − 77 + 20 | **−$22M** |
| impactWeightedProfit | 150 + (−22) | **$128M** |
| impactReturn uplift | (−22/1000)×5 | −0.11 pts on return |

A company whose environmental externalities ($77M) exceed its positive impacts sees reported profit
($150M) reduced to $128M on an impact-weighted basis — exactly the IWA "hidden environmental loss"
narrative from the guide, though here driven by synthetic percentages.

### 7.5 Data provenance & limitations

- **All financials are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`), including revenue and every
  cost/value line. Company names are PRNG prefix+suffix, not real issuers.
- **Monetisation is % of revenue, not physical** — the real IWA multiplies *quantities* (tCO₂e, m³
  water, headcount below living wage) by *monetisation coefficients* (SCC, water scarcity value,
  wage gap). This module skips the physical layer entirely.
- The `impactReturn` uplift (×5 on impact/revenue) has no methodological basis.

## 8 · Model Specification — Harvard Impact-Weighted Environmental & Social Accounts

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce an audit-defensible impact-weighted P&L: monetise a company's environmental and employment/
product externalities and integrate them with financial accounts, enabling like-for-like comparison of
"true" profitability across a portfolio.

### 8.2 Conceptual approach
Direct implementation of the **Harvard Business School IWA** methodology (Serafeim et al.) for
environmental intensity and employment; monetisation coefficients drawn from the **US IWG / Rennert et
al. (2022) Social Cost of Carbon** and **ILO living-wage** benchmarks — the same references the guide
cites. Benchmarks: HBS IWA published company scores; Trucost/S&P natural-capital valuations.

### 8.3 Mathematical specification
```
EnvCost   = Σ_p  Quantity_p · MonetCoeff_p
          = E_CO2e·SCC + Water_m3·WaterValue_region + WasteEmissions·EF + LandUse·LandValue
EmployQuality = Σ_tier headcount_tier · max(0, LivingWage_country − Wage_tier)          (wage-gap)
ProductImpact = Σ RevenueSegment · (HealthAccessScore − HarmScore)                       (IWA product module)
IW_Profit = EBIT − EnvCost + EmployQuality + ProductImpact
EP_margin = (EBIT − EnvCost)/Revenue
```

| Parameter | Value / source |
|---|---|
| SCC | $185/tCO₂e (Rennert et al. 2022); scenario $51–190 (US IWG) |
| Water scarcity value | Region-specific $/m³ (WRI Aqueduct + Trucost) |
| Living wage | ILO / WageIndicator by country |
| Air-pollutant coefficients | US EPA benefit-per-tonne |
| Land-use value | Natural Capital Protocol / TEEB |

### 8.4 Data requirements
Company Scope 1–3 emissions, water withdrawal by basin, waste tonnage, headcount and wage bands by
country, revenue by product segment. Platform holds sector taxonomies and emissions contexts; SCC and
living-wage tables would need ingestion into `reference_data`.

### 8.5 Validation & benchmarking plan
Reconcile EP-margin ranking against HBS IWA published dataset (rank correlation); sensitivity of
IW-profit to SCC ($51 vs $185); backtest that heavy industry (cement/steel) shows deeply negative EP
and clean tech positive, per HBS findings. Stability across SCC vintages.

### 8.6 Limitations & model risk
Monetisation coefficients are contested (SCC spans 4× across authorities) — always disclose the SCC
used and present an EP range. Scope-3 emissions data is sparse and low-quality; flag DQ. Product-impact
scoring is judgemental and hardest to standardise — treat as indicative.

**Framework alignment:** Harvard IWA Framework (2021) · Rennert et al. (2022) / US IWG Social Cost of
Carbon · ILO living-wage benchmarks · WHO DALY monetisation (health). The current module reproduces the
IWA *account structure* but replaces physical-quantity monetisation with synthetic revenue percentages.

## 9 · Future Evolution

### 9.1 Evolution A — Physical-quantity monetisation replacing revenue-percentage draws (analytics ladder: rung 1 → 2)

**What.** The IWA accounting skeleton is faithful — the P&L bridge `impactWeightedProfit = opProfit + totalImpact` mirrors Harvard's structure — but §7.5 identifies the substantive gap: monetisation is a synthetic `sr()` percentage of a synthetic revenue (carbon cost = `sr()·revenue·0.08`) rather than the real IWA method of *quantities × coefficients* (tCO₂e × SCC, m³ × water-scarcity value, headcount × living-wage gap), and the 80 companies are PRNG-named. The `impactReturn` uplift (×5 on impact/revenue) has no basis at all. Evolution A implements the §8 spec: `EnvCost = E_CO2e·SCC + Water·WaterValue + …`, `EmployQuality = Σ headcount·max(0, LivingWage − Wage)`, on real issuers.

**How.** (1) Ingest the monetisation coefficient tables §8.3 names into the refdata layer: SCC ($185/tCO₂e Rennert 2022, with the $51–190 US IWG scenario band exposed as a parameter), WRI Aqueduct water-scarcity values, ILO/WageIndicator living wages — the platform's living-wage module family already touches this data. (2) A backend vertical `POST /iwa/compute` taking company physical quantities (scope 1–2 from `GLOBAL_COMPANY_MASTER`; water/waste/wages from an intake path with honest nulls) and returning the full IWA bridge with per-line coefficient citations. (3) Validation per §8.5: cement/steel issuers show deeply negative EP-margin, clean tech positive — rank-correlated against the published HBS IWA dataset. (4) The ad-hoc `impactReturn` uplift deleted.

**Prerequisites.** The `genCompanies(80)` fabrication removed; SCC/living-wage refdata ingestion. **Acceptance:** an IWA P&L decomposes into quantity × cited coefficient per line; switching SCC $51→$185 moves EP-margin deterministically and the SCC used is disclosed in the output.

### 9.2 Evolution B — "True profitability" explainer and SCC-sensitivity analyst (LLM tier 2)

**What.** IWA's central communication problem — explaining to an IC why reported profit of $150M becomes $128M impact-weighted — is a language task over structured arithmetic, ideal for a copilot. Evolution B answers "walk me through this company's IWA bridge", "why is its EP-margin −22%?", "how sensitive is the ranking to the SCC choice?" — with every dollar from the Evolution A endpoint and every methodological claim from this page's §8 spec and the Harvard framework citations.

**How.** Tier 2: tool schema over `/iwa/compute`; SCC-sensitivity questions execute as paired tool calls at $51 and $185 with the delta narrated — operationalising §8.6's instruction to always disclose the SCC and present ranges. The system prompt encodes two discipline rules: (a) contested-coefficient candour — SCC spans 4× across authorities and the copilot says so whenever monetised environmental cost is quoted; (b) data-quality flags — Scope-3 and wage-band gaps surface as coverage caveats per holding, mirroring the honest-nulls convention. Serves the sibling `impact-hub` rollup (which the deep-dive designates as this module's consumer) as the authoritative IWA source.

**Prerequisites (hard).** Evolution A — narrating the current revenue-percentage draws would give fabricated externalities a credible voice. **Acceptance:** every monetised figure traces to a tool call with its coefficient vintage; SCC-sensitivity answers show both scenario results, never a single point.