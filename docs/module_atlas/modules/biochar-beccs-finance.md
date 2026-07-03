# Biochar & BECCS Finance Platform
**Module ID:** `biochar-beccs-finance` · **Route:** `/biochar-beccs-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EH3 · **Sprint:** EH

## 1 · Overview
Biomass carbon removal finance: pyrolysis biochar (100–300 yr permanence) and bioenergy with CCS (geological permanence). 22 seeded projects covering 6 feedstocks, IRA §45Q eligibility matrix, project IRR/NPV engine (Newton-Raphson), permanence-LCOC trade-off, and advance buyer intelligence.

> **Business value:** Used by biochar producers optimising pyrolysis economics, BECCS developers structuring CCS integration, carbon buyers evaluating permanence, and investors analysing biomass CDR project returns.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FEEDSTOCKS`, `IRA_BREAKDOWN`, `KpiCard`, `LCOC_COMPARISON`, `MARKET_FORECAST`, `PROJECTS`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `npv` | `cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);` |
| `dnpv` | `cashflows.reduce((acc, cf, t) => t === 0 ? acc : acc - t * cf / Math.pow(1 + rate, t + 1), 0);` |
| `next` | `rate - npv / dnpv;` |
| `capex` | `50; // $M` |
| `annualCDR` | `10000; // tCO₂` |
| `revenue` | `annualCDR * carbonPrice;` |
| `opex` | `annualCDR * feedstockCost * 0.5;` |
| `ebitda` | `revenue - opex;` |
| `cfs` | `[-capex * 1e6, ...Array.from({ length: 20 }, () => ebitda)];` |
| `npv` | `cfs.reduce((acc, cf, t) => acc + cf / Math.pow(1.08, t), 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEEDSTOCKS`, `IRA_BREAKDOWN`, `LCOC_COMPARISON`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Biochar stable carbon fraction | `H:Corg ratio <0.7 → >70% stable; <0.4 → >90% stable` | EBC European Biochar Certificate Standard | H:Corg is key permanence proxy; Puro requires H:Corg <0.7; EBC Premium requires <0.4; measured via elemental a |
| BECCS geological storage cost ($/tCO₂) | `Saline aquifer or depleted reservoir injection cost` | IEA CCS Roadmap + IEAGHG | Transport + injection: $10–25/tCO2; monitoring $3–8/tCO2/yr; reduces net LCOC of BECCS by $15–30/tCO2 vs DAC. |
| IRA §45Q BECCS power ($/tCO₂) | `Bioenergy power plant with CCS geological storage` | IRS §45Q Final Regulations 2024 | Eligible for $85/t if >80% capture efficiency; DAC-equivalent ($180/t) not applicable to BECCS unless integrat |
- **Puro.earth + EBC standards + IRA §45Q statute + IEA BECCS data** → IRR/NPV project finance engine + 22 projects + §45Q eligibility + permanence scatter → **Biochar producers, BECCS developers, carbon buyers, and investors evaluating biomass CDR economics**

## 5 · Intermediate Transformation Logic
**Methodology:** Biochar Carbon Removal (tCO₂/t feedstock)
**Headline formula:** `CDR = Feedstock_mass × Carbon_yield × (1 − labile_fraction) × stable_C_fraction`
**Standards:** ['Puro.earth Biochar Methodology', 'IBI/EBC Biochar Standard', 'IPCC AR6 WG3 Ch.7 Biomass']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).