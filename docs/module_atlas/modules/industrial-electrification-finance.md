# Industrial Electrification Finance
**Module ID:** `industrial-electrification-finance` · **Route:** `/industrial-electrification-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EG5 · **Sprint:** EG

## 1 · Overview
Financial analysis of industrial electrification technologies: Industrial Heat Pumps, Electric Boilers, EAF, Microwave/RF Heating, Induction Heating, and Thermal Storage. Covers 18 projects, simple payback calculator, ROI vs electricity price sensitivity, temperature profile, and grid flexibility benefits.

> **Business value:** Used by industrial companies evaluating electrification investments, utilities designing industrial demand response programmes, and investors in industrial electrification infrastructure and heat pump manufacturers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PROJECTS`, `Pill`, `TABS`, `TECH_AREAS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tech` | `TECH_AREAS[Math.floor(sr(i * 7 + 1) * TECH_AREAS.length)];` |
| `sectorName` | `['Food & Bev', 'Paper/Pulp', 'Chemical', 'Automotive', 'Plastics', 'Pharma', 'Textile'][Math.floor(sr(i * 11 + 2) * 7)];` |
| `country` | `['Germany', 'Netherlands', 'USA', 'Sweden', 'UK', 'France', 'Japan'][Math.floor(sr(i * 13 + 3) * 7)];` |
| `heatMWh` | `Math.round(5000 + sr(i * 17 + 4) * 95000);` |
| `status` | `['Operating', 'Construction', 'FID', 'Engineering', 'Feasibility'][Math.floor(sr(i * 19 + 5) * 5)];` |
| `capex` | `Math.round(tech.capex * heatMWh / 10000);` |
| `irr` | `parseFloat((6 + sr(i * 23 + 6) * 10).toFixed(1));` |
| `avgIrr` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalHeat` | `useMemo(() => filtered.reduce((s, p) => s + p.heatMWh, 0), [filtered]);` |
| `economicsComparison` | `useMemo(() => TECH_AREAS.map(t => {` |
| `electricCost` | `heatDemand * 1000 * elecPrice / t.elecFactor / 1e6;` |
| `gasCost` | `heatDemand * 1000 * gasPrice / 1000 * 0.033 / t.gasFactor;` |
| `carbonSaving` | `t.abatement / 100 * heatDemand * 0.2 * carbonPrice / 1e3;` |
| `netElec` | `electricCost - carbonSaving;` |
| `annualGasCost` | `heatDemand * 1000 * gasPrice / 1000 * 0.033 / t.gasFactor;` |
| `annualElecCost` | `heatDemand * 1000 * elecPrice / t.elecFactor / 1e6;` |
| `annualCarbonSaving` | `t.abatement / 100 * heatDemand * 0.2 * carbonPrice / 1e3;` |
| `netSaving` | `annualGasCost - annualElecCost + annualCarbonSaving;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `TECH_AREAS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Industrial heat pump COP | `Heat delivered / Electricity input at process temperature` | IEA Industrial Heat Pump Report | COP decreases with higher temperature; <100°C: COP 3–4; 100–200°C: COP 2–3; >200°C: COP <2; above 300°C: not v |
| Electric boiler efficiency | `Electrode/resistance type; near-perfect conversion` | IEA Industrial Decarbonisation Roadmap | Fuel switch from gas boiler (90% efficiency) to electric (98%); economics depend entirely on electricity/gas p |
| EAF energy consumption (MWh/t steel) | `Scrap-based EAF; varies with scrap quality` | worldsteel Energy Use Indicator | EAF uses 0.5–0.65 MWh/t vs BF-BOF indirect electricity of 0.1–0.15 MWh/t; direct emissions near-zero with rene |
- **IEA/IRENA industrial heat data + EAF energy intensity + heat pump COP data** → Payback calculator + ROI sensitivity + temperature profile + grid flexibility model → **Industrial companies evaluating fuel switching, utilities designing demand response, investors in industrial electrification**

## 5 · Intermediate Transformation Logic
**Methodology:** Industrial Electrification Payback
**Headline formula:** `Simple_payback = CAPEX / Annual_savings; Annual_savings = (Fossil_opex − Elec_opex) + Carbon_cost_avoided`
**Standards:** ['IEA Industrial Heat Roadmap 2023', 'IRENA Industrial Electrification Report 2023', 'EU Commission Electrification of Industry Study']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).