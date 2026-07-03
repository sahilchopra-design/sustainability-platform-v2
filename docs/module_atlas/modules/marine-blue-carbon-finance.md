# Marine Blue Carbon Project Finance
**Module ID:** `marine-blue-carbon-finance` · **Route:** `/marine-blue-carbon-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DX6 · **Sprint:** DX

## 1 · Overview
Marine blue carbon project finance for mangrove, seagrass, and saltmarsh restoration. Models carbon sequestration rates (mangrove 6-8 tCO2/ha/yr), ICROA methodology compliance, coastal protection co-benefit valuation, and blue carbon credit market dynamics.

> **Business value:** Delivers rigorous blue carbon project finance modelling integrating IPCC-standard sequestration accounting, coastal protection co-benefit valuation, and VM0033 credit issuance scheduling.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CREDIT_MARKET`, `ECOSYSTEMS`, `Kpi`, `METHODOLOGIES`, `MPA_PROJECTS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview', 'Ecosystems', 'MPA Finance', 'Credit Market', 'Methodologies', 'Additionality', 'Permanence', 'Project Valuation', 'Co-Benefits', 'Deal S` |
| `capex` | `areaHa * restCostHa;` |
| `pvRevenue` | `lifeYrs > 0 && discountRate > 0 ? annRevenue * (1 - Math.pow(1 + discountRate / 100, -lifeYrs)) / (discountRate / 100) : annRevenue * lifeYrs;` |
| `totalGlobalSeq` | `ECOSYSTEMS.reduce((s, e) => s + e.globalHaM * 1e6 * e.seqTco2HaYr / 1e9, 0);` |
| `score` | `Math.round(60 + sr(i * 13) * 30);` |
| `riskDiscount` | `Math.round(5 + sr(i * 7) * 15);` |
| `adjPrice` | `Math.max(8, e.creditPriceUsd - riskDiscount * e.creditPriceUsd / 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_MARKET`, `ECOSYSTEMS`, `METHODOLOGIES`, `MPA_PROJECTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Mangrove Sequestration Rate | `Above-ground + below-ground + soil organic carbon accumulation` | IPCC 2013 Wetlands Supplement defaults | Mangrove soil carbon (8-10× soil depth) drives high rates; seagrass 0.5-2 t/ha/yr; saltmarsh 1.5-3 t/ha/yr |
| Coastal Protection Co-benefit | `Avoided storm damage + avoided erosion based on replacement cost` | Natural Capital Project InVEST model | Often exceeds carbon revenue; enables project financing via coastal insurance premium reduction or municipal p |
| Blue Carbon Credit Price | `Market price for Verra VM0033 or Gold Standard mangrove credits` | Ecosystem Marketplace 2023 | Blue carbon premium over standard forestry credits; limited supply; tightening MRV standards may compress issu |
- **IPCC 2013 Wetlands Supplement** → Habitat-specific sequestration rates by region and soil type → carbon stock change calculations → **Annual carbon credit issuance estimate**
- **Natural Capital Project InVEST coastal model** → Wave attenuation, storm surge reduction by habitat type → coastal protection valuation → **Co-benefit revenue / avoided loss**
- **Ecosystem Marketplace blue carbon price data** → Historical transaction prices for blue carbon credits → price deck assumptions → **Project revenue sensitivity analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Blue Carbon Net Present Value
**Headline formula:** `Blue Carbon NPV = Σ[(Carbon Credits × Price + Coastal Protection Value) - Restoration Cost - Monitoring Cost] / (1+r)^t; Sequestration = Area × Rate × (1 - Buffer%)`
**Standards:** ['Verra VCS VM0033 Tidal Wetland and Seagrass Restoration', 'ICROA Blue Carbon Code of Best Practice', 'IPCC 2013 Wetlands Supplement']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).