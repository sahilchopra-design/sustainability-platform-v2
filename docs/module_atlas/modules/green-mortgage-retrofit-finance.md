# Green Mortgage & Retrofit Finance
**Module ID:** `green-mortgage-retrofit-finance` · **Route:** `/green-mortgage-retrofit-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EI3 · **Sprint:** EI

## 1 · Overview
8 green mortgage products with rate discount and EPC minimum requirements, 6 retrofit scheme analytics (UK ECO4/GBIS, EU Renovation Wave, France MaPrimeRénov, Germany BAFA/KfW, US IRA §25C), benefit calculator, and market forecast.

> **Business value:** Used by mortgage lenders structuring green products, housing associations accessing ECO4 grants, sustainability-linked bond issuers, and ESG advisory teams benchmarking green finance offerings.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEALS`, `KpiCard`, `MARKET_DATA`, `MORTGAGE_PRODUCTS`, `Pill`, `RETROFIT_SCHEMES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `rateSaving` | `0.0015 * epcImprovement;` |
| `annualInterestSaving` | `loanAmount * 1000 * rateSaving;` |
| `annualEnergySaving` | `energySaving * 0.15 * 100;` |
| `totalAnnual` | `annualInterestSaving + annualEnergySaving;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MORTGAGE_PRODUCTS`, `RETROFIT_SCHEMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EBA Green Mortgage rate discount | `For EPC A/B properties across 8 lenders` | EBA Green Mortgage Label Product Sheet 2023 | NatWest offers 60bps discount for EPC A; average across 8 tracked lenders is 28bps; linked to green bond fundi |
| UK ECO4 grant (max) | `For solid wall insulation in eligible households` | UK Government ECO4 Scheme 2022 | ECO4 targets lowest income and worst EPC D–G properties; fully funded by energy suppliers via obligation. |
| IRA §25C annual cap | `Per taxpayer per year for qualified efficiency improvements` | US IRS Notice 2023-29 | 30% credit (max $1,200 insulation/windows + $2,000 heat pump); first substantive residential retrofit incentiv |
- **EBA GML + UK ECO4/GBIS + EU Renovation Wave + IRA §25C + KfW BEG + MaPrimeRénov** → Green mortgage product comparison + retrofit scheme analytics + benefit calculator + market forecast → **Mortgage lenders, green bond issuers, housing associations, and property ESG advisory teams**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Mortgage Benefit
**Headline formula:** `MonthlySaving = (StandardRate − GreenRate) × LoanBalance / 12; EnergySaving = ΔEPCgrade × AvgEnergyBill; TotalAnnualBenefit = MonthlySaving × 12 + EnergySaving; Payback = RetrofitCost / TotalAnnualBenefit`
**Standards:** ['EBA Green Mortgage Label 2022', 'EU Renovation Wave Strategy 2020', 'IRA §25C Energy Efficiency Tax Credit 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).