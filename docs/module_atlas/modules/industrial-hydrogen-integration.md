# Industrial Hydrogen Integration Finance
**Module ID:** `industrial-hydrogen-integration` · **Route:** `/industrial-hydrogen-integration` · **Tier:** B (frontend-computed) · **EP code:** EP-EG2 · **Sprint:** EG

## 1 · Overview
H₂ demand and integration economics across 6 industrial sectors: Steel, Chemicals, Refining, Cement, Glass, and Ceramics. Models 2030/2050 demand projections, electrolyser CAPEX learning curves (PEM/AEL/SOEC), and abatement cost ($/tCO₂) by sector vs carbon price threshold.

> **Business value:** Used by industrial companies evaluating hydrogen investments, infrastructure investors sizing electrolyser deployment, and policy teams assessing sector decarbonisation feasibility and timelines.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PROJECTS`, `Pill`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `SECTORS[Math.floor(sr(i * 7 + 1) * SECTORS.length)];` |
| `capMt` | `parseFloat((0.2 + sr(i * 11 + 2) * 2.8).toFixed(1));` |
| `country` | `['Germany', 'Netherlands', 'USA', 'Japan', 'Sweden', 'UK', 'Australia', 'South Korea'][Math.floor(sr(i * 13 + 3) * 8)];` |
| `status` | `['Operating', 'Construction', 'FID', 'Engineering', 'Feasibility'][Math.floor(sr(i * 17 + 4) * 5)];` |
| `irr` | `parseFloat((5 + sr(i * 19 + 5) * 10).toFixed(1));` |
| `dscr` | `parseFloat((1.15 + sr(i * 23 + 6) * 0.75).toFixed(2));` |
| `h2Need` | `parseFloat((capMt * (8 + sr(i * 29 + 7) * 15)).toFixed(0));` |
| `avgIrr` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalH2Need` | `useMemo(() => filtered.reduce((s, p) => s + p.h2Need, 0), [filtered]);` |
| `demandChart` | `SECTORS.map(s => ({ name: s.id, demand2030: s.h2Demand2030, demand2050: s.h2Demand2050 }));` |
| `economicsTable` | `useMemo(() => SECTORS.map(s => {` |
| `carbonSaving` | `s.abatement / 100 * 1.85 * carbonPrice;` |
| `netCost` | `s.capex * 0.12 + s.h2Price * s.h2Demand2030 / s.h2Demand2030 * h2Price / s.h2Price - carbonSaving;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PEM Electrolyser CAPEX ($/kW) | `Current range; target <$300/kW by 2030` | IRENA Green H2 Report 2022 + BNEF | Learning rate ~13–18% per doubling; need 100× scale from 2022 levels to hit 2030 targets. |
| H₂ demand by 2050 for industry (Mt/yr) | `Industry (excl. transport) IEA NZE scenario` | IEA Net Zero by 2050 + Hydrogen Roadmap | Steel 25–30 Mt/yr; Chemicals 5–10 Mt/yr; Refining 5–8 Mt/yr under IEA Net Zero. |
| Electrolyser stack lifetime (hrs) | `PEM: 60k–80k; AEL: 80k–100k; SOEC: 30k–60k` | BNEF Electrolyser Technology Outlook | Stack replacement is 30–50% of CAPEX over project life; critical for LCOH modelling. |
- **IEA/BNEF H2 demand data + electrolyser learning curves + abatement cost model** → Sector demand model + electrolyser CAPEX curves + abatement cost engine → **Industrial companies evaluating H2 investments, investors sizing electrolyser markets, and policy teams**

## 5 · Intermediate Transformation Logic
**Methodology:** H₂ Abatement Cost ($/tCO₂)
**Headline formula:** `Abatement_cost = (H2_system_LCOH − Fossil_baseline_opex) / CO2_displaced`
**Standards:** ['IEA Hydrogen for Industry 2023', 'IRENA Green Hydrogen Cost Reduction 2022', 'BNEF Hydrogen Economy Outlook 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).