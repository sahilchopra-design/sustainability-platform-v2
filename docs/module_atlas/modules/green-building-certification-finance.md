# Green Building Certification Finance
**Module ID:** `green-building-certification-finance` · **Route:** `/green-building-certification-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EI1 · **Sprint:** EI

## 1 · Overview
Green building certification economics and investment analysis: LEED/BREEAM/NABERS/DGNB/Green Star systems, sale premium and rent premium analytics, NPV/MOIC calculator with CAPEX and discount rate sliders, ROI waterfall by component, and market trend intelligence.

> **Business value:** Used by real estate investors underwriting green premium, lenders structuring green mortgages and CMBS, REIT ESG teams targeting GRESB Green Star, and sustainability teams assessing EU Taxonomy buildings compliance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUILDINGS`, `CERTIFICATIONS`, `KpiCard`, `MARKET_TREND`, `Pill`, `ROI_BREAKDOWN`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annualBenefit` | `capex * 0.08;` |
| `npv` | `Array.from({ length: 10 }, (_, t) => annualBenefit / Math.pow(1 + discountRate / 100, t + 1)).reduce((a, v) => a + v, 0) - capex;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERTIFICATIONS`, `ROI_BREAKDOWN`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LEED Platinum sale premium | `Over non-certified comparable assets` | JLL Green Building Premium Report 2023 | Premium narrows to 8–12% at LEED Gold; Platinum commands highest premium in financial centres. |
| BREEAM Outstanding vacancy benefit | `Lower vacancy rate vs non-certified` | RICS Sustainability Report 2023 | Certification reduces void periods; institutional tenants require minimum BREEAM Very Good from 2025 for ESG c |
| EU Taxonomy NZEB threshold | `Better than Nearly Zero Energy Building` | EU Taxonomy Delegated Act 2021/2800 | Buildings must perform 10% better than national NZEB to qualify as sustainable investment under Art. 7.7. |
- **LEED v4.1 + BREEAM 2018 + NABERS + DGNB + EU Taxonomy + GRESB** → NPV/MOIC calculator + certification analytics + ROI waterfall + market forecast + green finance guide → **Real estate investors, green building lenders, REIT ESG teams, and sustainability-linked loan structurers**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Building NPV
**Headline formula:** `NPV = Σ[(SalePremium + RentPremium + VacancyBenefit + EnergySaving) / (1+r)^t] − CAPEX; MOIC = TotalBenefit / CAPEX`
**Standards:** ['LEED v4.1 Reference Guide', 'BREEAM Technical Standards 2018', 'EU Taxonomy Art. 7.7 DNSH Buildings']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).