# Renewable Asset Management Analytics
**Module ID:** `renewable-asset-management` · **Route:** `/renewable-asset-management` · **Tier:** B (frontend-computed) · **EP code:** EP-DO6 · **Sprint:** DO

## 1 · Overview
Provides operational analytics for managing renewable energy asset portfolios — performance monitoring, O&M optimisation, degradation tracking, repowering economics, and SCADA data integration. Models asset life extension value, repowering IRR, and portfolio yield optimisation.

> **Business value:** Essential for renewable energy fund asset managers, independent power producers, and infrastructure investors managing operating wind/solar portfolios. Provides IEA/WindEurope best practice O&M analytics and repowering economics for yield optimisation and lender reporting.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSETS`, `ASSET_STATUS`, `KpiCard`, `MiniBar`, `OM_CONTRACTS`, `REGIONS`, `TABS`, `TECHNOLOGIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TECHNOLOGIES` | `['Solar PV','Wind Onshore','Wind Offshore','Battery Storage','Hybrid Solar+Wind'];` |
| `OM_CONTRACTS` | `['Full-Service O&M','Limited O&M','Self-Perform','Hybrid'];` |
| `tech` | `TECHNOLOGIES[Math.floor(sr(i*7+1)*TECHNOLOGIES.length)];` |
| `status` | `ASSET_STATUS[Math.floor(sr(i*11+2)*ASSET_STATUS.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*13+3)*REGIONS.length)];` |
| `omContract` | `OM_CONTRACTS[Math.floor(sr(i*17+4)*OM_CONTRACTS.length)];` |
| `capacityMw` | `Math.round(10 + sr(i*19+5)*490);` |
| `ageYears` | `parseFloat((0.5 + sr(i*23+6)*19.5).toFixed(1));` |
| `p50Gwh` | `parseFloat((capacityMw * 0.25 * 8760 / 1000 * (0.8 + sr(i*29+7)*0.4)).toFixed(1));` |
| `p90Gwh` | `parseFloat((p50Gwh * (0.75 + sr(i*31+8)*0.15)).toFixed(1));` |
| `actualGwh` | `parseFloat((p50Gwh * (0.85 + sr(i*37+9)*0.3)).toFixed(1));` |
| `degradationPct` | `parseFloat((0.3 + ageYears * (0.3 + sr(i*41+1)*0.4)).toFixed(2));` |
| `availability` | `parseFloat((90 + sr(i*43+2)*9).toFixed(1));` |
| `omCostMwh` | `parseFloat((8 + sr(i*47+3)*22).toFixed(1));` |
| `revenueM` | `parseFloat((actualGwh * (45 + sr(i*53+4)*35) / 1000).toFixed(1));` |
| `ebitdaMargin` | `parseFloat((55 + sr(i*59+5)*30).toFixed(1));` |
| `remainingLife` | `Math.round(25 - ageYears);` |
| `insuranceValue` | `parseFloat((capacityMw * (0.6 + sr(i*61+6)*0.6)).toFixed(0));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_STATUS`, `OM_CONTRACTS`, `REGIONS`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Solar Degradation Rate | — | NREL Degradation Study 2023 | c-Si solar module output degrades 0.5–0.7% per year — important for 25–30 year asset life modelling |
| Wind O&M Cost | — | WindEurope O&M 2023 | Onshore wind O&M cost €15–25/MWh representing 20–30% of LCOE over asset life |
| Repowering Value | — | BloombergNEF Repowering 2023 | Turbine repowering can increase capacity 30–50% on same grid connection and planning permission |
- **SCADA/inverter data (5-min intervals)** → Performance monitoring → **Actual vs expected generation, losses by category (shading, soiling, inverter)**
- **Component failure database + replacement costs** → O&M optimisation → **Predictive maintenance scheduling and budget optimisation**
- **Repowering cost models + updated energy yield assessment** → Repowering decision → **IRR improvement and capacity uplift from repowering options**

## 5 · Intermediate Transformation Logic
**Methodology:** Renewable Asset Performance
**Headline formula:** `PR_actual = ActualGeneration / (Irradiation × InstalledCapacity); Availability = OperatingHours / TotalHours; CapexPerMWh = LifetimeCapex / LifetimeGeneration`
**Standards:** ['IEA PVPS Task 13 — O&M Best Practices Solar PV', 'WindEurope O&M Best Practices 2023', 'IRENA Renewable Asset Management 2022', 'IEC 61400 Wind Turbine Performance Standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`