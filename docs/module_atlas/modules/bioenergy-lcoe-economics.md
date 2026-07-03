# Bioenergy LCOE Economics
**Module ID:** `bioenergy-lcoe-economics` · **Route:** `/bioenergy-lcoe-economics` · **Tier:** B (frontend-computed) · **EP code:** EP-DX3 · **Sprint:** DX

## 1 · Overview
Bioenergy LCOE analysis covering dedicated biomass, co-firing, biogas, and biomethane pathways. Models feedstock cost ($/GJ), conversion efficiency, RED II sustainability certification, and LCOE benchmarking against wind and solar. Data from IRENA.

> **Business value:** Delivers granular bioenergy LCOE decomposition across pathways with RED II sustainability compliance checking and competitive benchmarking against solar/wind, enabling investment decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FEEDSTOCK_TYPES`, `LCOE_COMPARISON`, `POLICY_SUPPORT`, `SUSTAINABILITY_CRITERIA`, `TABS`, `TECH_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annMwh` | `powerMw * (cf / 100) * 8760;` |
| `capexTotal` | `capexMwh * powerMw * 1000;` |
| `annuity` | `w / (1 - Math.pow(1 + w, -lifetime));` |
| `capexAnn` | `capexTotal * annuity;` |
| `opexAnn` | `opexMwyr * powerMw * 1000;` |
| `feedstockGjMwh` | `heatRate / (efficiency / 100);` |
| `feedstockAnn` | `annMwh * feedstockGjMwh * feedstockUsd / 1000;` |
| `lcoe` | `annMwh > 0 ? (capexAnn + opexAnn + feedstockAnn) / annMwh : 0;` |
| `feedstockShare` | `feedstockAnn / (capexAnn + opexAnn + feedstockAnn);` |
| `npv` | `cashflows.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);` |
| `dnpv` | `cashflows.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);` |
| `annMwh` | `parseFloat(lcoeResult.annMwh) * 1000;` |
| `annCreds` | `annMwh * (fossilBaseline - bioEmissions) / 1000;` |
| `creditRevMyr` | `annCreds * carbonPrice / 1e6;` |
| `adjustedLcoe` | `parseFloat(lcoeResult.lcoe) - creditRevMyr * 1e6 / (annMwh \|\| 1);` |
| `annMwh` | `powerMw * (tech.cf / 100) * 8760;` |
| `revenue` | `annMwh * parseFloat(lcoeResult.lcoe) / 1000 + parseFloat(carbonCredits.creditRevMyr) * 1e6;` |
| `opex` | `parseFloat(lcoeResult.opexAnn) * 1e6 + parseFloat(lcoeResult.feedstockAnn) * 1e6;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEEDSTOCK_TYPES`, `LCOE_COMPARISON`, `POLICY_SUPPORT`, `SUSTAINABILITY_CRITERIA`, `TABS`, `TECH_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Dedicated Biomass LCOE | `(CAPEX×CRF + Fixed OPEX) / AEP + Feedstock / Efficiency` | IRENA LCOE database 2023 | Range $80-160/MWh depending on feedstock cost; competitive vs gas peaker but above solar/wind |
| Feedstock Cost Share | `Feedstock cost component / total LCOE` | IRENA biomass cost analysis | Dominant cost driver; pellet prices $200-300/t (2023 volatility); supply chain diversification critical |
| RED II GHG Saving | `Life-cycle GHG saving vs 35.7 gCO2e/MJ fossil fuel comparator` | RED II calculation methodology | Minimum 70% required for existing plants post-2021; 80% for new plants post-2026; determines subsidy eligibili |
- **IRENA LCOE database** → Technology-specific CAPEX, OPEX, capacity factor data by region → LCOE calculation → **LCOE benchmarking table**
- **Feedstock market data (S&P Commodity Insights, Argus)** → Pellet, chip, and biogas feedstock prices by region → feedstock cost component → **LCOE sensitivity to feedstock price**
- **RED II GHG calculation tool (EC)** → Lifecycle emission factors by feedstock and conversion pathway → sustainability check → **RED II eligibility determination**

## 5 · Intermediate Transformation Logic
**Methodology:** Bioenergy LCOE Decomposition
**Headline formula:** `LCOE = (CAPEX × CRF + Fixed OPEX) / AEP + Variable OPEX + Feedstock Cost / Efficiency; Feedstock Cost Share = (Feedstock $/GJ / Efficiency) / LCOE`
**Standards:** ['IRENA Renewable Power Generation Costs 2023', 'EU RED II Directive — Bioenergy Sustainability', 'IEA World Energy Outlook 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).