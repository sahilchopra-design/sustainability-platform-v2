# BECCS Project Finance Analytics
**Module ID:** `beccs-project-finance` · **Route:** `/beccs-project-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DX2 · **Sprint:** DX

## 1 · Overview
BECCS project finance analytics covering negative emissions credit revenue, CCS CAPEX/OPEX, biomass supply chain risk, 45Q tax credit (USA), and EU ETS interaction for carbon-negative bioenergy projects.

> **Business value:** Enables rigorous BECCS project finance modelling incorporating 45Q incentives, RED II sustainability constraints, and full supply chain carbon accounting to determine project viability and LCONE.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BECCS_PROJECTS`, `CCS_TECHNOLOGIES`, `FINANCING_STRUCTURES`, `POLICY_ROADMAP`, `REVENUE_STREAMS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `netPowerMw` | `powerMw * (1 - energyPenaltyPct / 100);` |
| `annMwh` | `netPowerMw * (cf / 100) * 8760;` |
| `annCaptureMt` | `annMwh * biomassCo2tMwh * (captureRatePct / 100) / 1e6;` |
| `energyRevMyr` | `annMwh * energyRevMwh / 1e6;` |
| `cdRevMyr` | `annCaptureMt * co2PriceT;` |
| `totalRevMyr` | `energyRevMyr + cdRevMyr;` |
| `totalCapexM` | `capexBn * 1e3 + annCaptureMt * ccsCapexMtCO2;` |
| `annuity` | `w / (1 - Math.pow(1 + w, -lifetime));` |
| `capexAnnM` | `totalCapexM * annuity;` |
| `cfs` | `[-totalCapexM, ...Array.from({ length: lifetime }, () => totalRevMyr - opexMyr - capexAnnM * 0)];` |
| `projectIrr` | `irr([-totalCapexM, ...Array.from({ length: lifetime }, () => totalRevMyr - opexMyr)]);` |
| `dscr` | `(totalRevMyr - opexMyr) / (capexAnnM * 0.7);` |
| `co2Sensitivity` | `useMemo(() => [20, 40, 60, 85, 100, 130, 160, 200].map(price => {` |
| `projectChart` | `useMemo(() => BECCS_PROJECTS.map(p => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BECCS_PROJECTS`, `CCS_TECHNOLOGIES`, `FINANCING_STRUCTURES`, `POLICY_ROADMAP`, `REVENUE_STREAMS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCONE | `(CAPEX×CRF + OPEX - Energy Rev - 45Q) / Net CO2 negative` | IEA BECCS cost database | Current LCONE $80-200/tCO2; 45Q credit ($85-180/t) can make projects cash-positive; EU ETS drives additional r |
| 45Q Tax Credit Value | `IRA 2022 enhanced 45Q for captured and geologically stored CO2` | US IRS 45Q guidance | IRA raised 45Q from $50 to $85/t geological; $60/t utilisation; direct pay option available for 5 years |
| Biomass Supply Chain Emissions | `Well-to-gate lifecycle emissions per MWh biomass input` | RED II lifecycle methodology | Must be below 70% GHG saving vs fossil baseline per RED II; typically 0.1-0.3 tCO2/MWh for sustainable sources |
- **IEA BECCS cost database** → Technology cost assumptions by feedstock and CCS type → CAPEX/OPEX model inputs → **LCONE calculation**
- **US IRS 45Q guidance and IRA text** → Credit rates, eligible technologies, direct pay rules → tax credit revenue stream → **After-tax project IRR**
- **RED II biomass sustainability registry** → Feedstock sustainability certification → lifecycle GHG calculation and net negativity verification → **Net CO2 removal per MWh**

## 5 · Intermediate Transformation Logic
**Methodology:** BECCS Levelised Cost of Negative Emissions
**Headline formula:** `LCONE = (CAPEX × CRF + OPEX - Electricity Revenue - 45Q) / Annual Net CO2 Negative Emissions; Net Emissions = CO2 Stored - Biomass Supply Chain Emissions`
**Standards:** ['IEA BECCS in Clean Energy Transitions 2021', 'US 45Q Tax Credit (IRA 2022 enhanced)', 'EU ETS Article 7 — Biogenic CO2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).