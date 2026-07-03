# C-PACE Climate Finance Analytics
**Module ID:** `cpace-climate-finance` · **Route:** `/cpace-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DY5 · **Sprint:** DY

## 1 · Overview
C-PACE (Commercial Property Assessed Clean Energy) financing analytics covering assessment lien structure, LTV impact, IPMVP energy savings verification, market volume by state, and lender consent requirements.

> **Business value:** Delivers end-to-end C-PACE financing analytics integrating IPMVP savings verification, LTV impact modelling, and state-specific programme comparison to support origination and underwriting decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `IMPROVEMENT_TYPES`, `Kpi`, `PACE_PROGRAMS`, `STATE_PROGRAMS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `maxLoan` | `propertyValue * (maxLtv / 100) - existingDebt;` |
| `annualPayment` | `loanAmount > 0 ? loanAmount * (rate / 100) / (1 - Math.pow(1 + rate / 100, -tenor)) : 0;` |
| `netAnnualBenefit` | `annSavings - annualPayment;` |
| `simplePayback` | `annSavings > 0 ? loanAmount / annSavings : Infinity;` |
| `annSavings` | `improvementCost * (annSavingsPct / 100) * electricityRate / 0.12;` |
| `totalVolume` | `STATE_PROGRAMS.reduce((s, p) => s + p.volume, 0);` |
| `securitizationData` | `PACE_PROGRAMS.filter(p => p.securitized).map(p => ({ name: p.name.split(' ')[0], rate: p.rate, tenor: p.tenor }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `IMPROVEMENT_TYPES`, `PACE_PROGRAMS`, `STATE_PROGRAMS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Savings-to-Investment Ratio | `NPV of projected energy savings over PACE term / PACE assessment amount` | IPMVP Option C measurement and verification | Ratio above 1.0 indicates positive net cash flow; lenders typically require 1.2x+ coverage for project approva |
| C-PACE Market Volume (US) | `Annual C-PACE origination volume (2023)` | PACENation Market Intelligence 2023 | Growing 20-30% annually; California, Florida, New York largest markets; 39 states with enabling legislation |
| LTV Combined (with PACE) | `(First mortgage + PACE assessment) / appraised property value` | Property appraisal + PACE lender calculation | Most mortgage lenders require combined LTV below 80%; PACE lien seniority creates lender consent requirement i |
- **Utility bills and energy audits** → Pre-retrofit energy consumption and costs → IPMVP baseline establishment → **Energy savings projection**
- **PACENation state programme databases** → State-specific PACE programme rates, terms, eligible improvements → product structuring → **Assessment payment schedule**
- **Commercial property appraisals** → As-is and as-improved property values → LTV calculation and lender consent analysis → **Combined LTV and consent requirement**

## 5 · Intermediate Transformation Logic
**Methodology:** C-PACE Debt Service and Energy Savings Modelling
**Headline formula:** `Net Cash Flow = Energy Savings - PACE Assessment Payment; Savings-to-Investment Ratio = NPV(Energy Savings) / PACE Loan Amount; LTV Impact = (First Mortgage + PACE) / Property Value`
**Standards:** ['ASTM E2797 Energy Assessment Standard for PACE', 'IPMVP Core Concepts 2023', 'PACENation Market Intelligence Report 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).