# Aquaculture Climate Finance Analytics
**Module ID:** `aquaculture-climate-finance` · **Route:** `/aquaculture-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DZ3 · **Sprint:** DZ

## 1 · Overview
Aquaculture climate finance analytics covering sustainable aquaculture investment, ASC/BAP certification premiums, climate risk to production from sea temperature and ocean acidification, blue bond eligible capex, and insurance products.

> **Business value:** Provides integrated aquaculture climate finance analytics combining physical risk-adjusted returns, certification premium modelling, and blue bond eligibility assessment to support investment decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACID_SCENARIOS`, `CERTIFICATION_PREMIUM`, `FINANCE_INSTRUMENTS`, `Kpi`, `SECTORS`, `TABS`, `TEMP_STRESS_CURVE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annSaving` | `loanSize * (certPremium / 10000);` |
| `totalProduction` | `SECTORS.reduce((s, x) => s + x.productionMt, 0);` |
| `avgClimRisk` | `SECTORS.length > 0 ? SECTORS.reduce((s, x) => s + x.climRiskScore, 0) / SECTORS.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACID_SCENARIOS`, `CERTIFICATION_PREMIUM`, `FINANCE_INSTRUMENTS`, `SECTORS`, `TABS`, `TEMP_STRESS_CURVE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ASC Certification Premium | `Price premium for ASC-certified product vs standard at point of sale` | ASC market price survey 2023 | Premium varies by species and market; salmon 10-18%; shrimp 8-15%; critical for accessing EU and US premium re |
| Sea Surface Temperature Risk | `Production volume reduction under RCP 4.5 SST projections for salmon farming sites` | IPCC SROCC regional projections | Norwegian salmon sites face reduced optimal temperature window; tropical shrimp farms face increased disease p |
| Blue Bond Eligible CapEx Share | `Capex on sustainable feed systems, recirculating aquaculture, habitat restoration / total capex` | Blue bond framework eligibility criteria | RAS (recirculating aquaculture systems) and offshore cage technology qualify; feed mill upgrade eligible if us |
- **CMIP6 sea surface temperature projections (IPCC AR6)** → SST anomalies by site and RCP scenario → production risk model inputs → **Climate-adjusted production volume projections**
- **FAO and national aquaculture production statistics** → Historical production volumes by species, method, and country → baseline growth model → **Investment sizing and revenue projections**
- **ASC market data and price surveys** → Certification premium and market access data by species → revenue uplift from certification → **Climate-adjusted IRR calculation**

## 5 · Intermediate Transformation Logic
**Methodology:** Aquaculture Climate Risk-Adjusted Return
**Headline formula:** `Climate-Adjusted IRR = Base IRR - Physical Risk Discount + Certification Premium; Production Risk = f(SST Anomaly, pH Change, Extreme Event Frequency)`
**Standards:** ['Aquaculture Stewardship Council (ASC) Standard v3.0', 'FAO State of World Aquaculture 2022', 'Swiss Re Climate Risk in Aquaculture 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).