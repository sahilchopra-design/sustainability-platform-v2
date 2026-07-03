# Climate M&A Due Diligence Engine
**Module ID:** `climate-ma-due-diligence` · **Route:** `/climate-ma-due-diligence` · **Tier:** B (frontend-computed) · **EP code:** EP-DD3 · **Sprint:** DD

## 1 · Overview
Climate M&A due diligence engine assessing target company physical and transition risk, stranded asset exposure, carbon liability quantification, climate-adjusted enterprise value, and TCFD-aligned due diligence checklist.

> **Business value:** Delivers systematic climate M&A due diligence integrating TCFD checklist, carbon liability quantification, stranded asset identification, and physical risk impairment into a climate-adjusted enterprise value.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `CRITERIA_WEIGHTS`, `DEAL_STATUS`, `SBTI_STATUS`, `SECTORS`, `SECTOR_COLORS`, `TABS`, `TARGETS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `revenue` | `ev * (0.3 + sr(i * 11) * 0.7);` |
| `ebitda` | `revenue * (0.08 + sr(i * 13) * 0.22);` |
| `scope1` | `sec === 'Energy' ? 500 + sr(i * 17) * 4500 : sec === 'Materials' ? 200 + sr(i * 17) * 1800 : 20 + sr(i * 17) * 480;` |
| `scope2` | `scope1 * (0.1 + sr(i * 19) * 0.3);` |
| `scope3` | `scope1 * (2 + sr(i * 23) * 8);` |
| `physicalRiskScore` | `sr(i * 29) * 85 + 10;` |
| `transitionRiskScore` | `sr(i * 31) * 80 + 15;` |
| `esgScore` | `25 + sr(i * 37) * 65;` |
| `strandedAssetPct` | `sec === 'Energy' ? 15 + sr(i * 41) * 45 : sec === 'Materials' ? 5 + sr(i * 41) * 25 : sr(i * 41) * 8;` |
| `fossilRevenuePct` | `sec === 'Energy' ? 40 + sr(i * 43) * 55 : sec === 'Materials' ? 10 + sr(i * 43) * 30 : sr(i * 43) * 10;` |
| `greenRevenuePct` | `100 - fossilRevenuePct - sr(i * 47) * (100 - fossilRevenuePct) * 0.5;` |
| `climateValAdj` | `-(physicalRiskScore * 0.05 + transitionRiskScore * 0.06 + strandedAssetPct * 0.04);` |
| `avgEv` | `filtered.length ? filtered.reduce((s, d) => s + d.ev, 0) / filtered.length : 0;` |
| `avgClimateAdj` | `filtered.length ? filtered.reduce((s, d) => s + d.climateValAdj, 0) / filtered.length : 0;` |
| `avgStranded` | `filtered.length ? filtered.reduce((s, d) => s + d.strandedAssetPct, 0) / filtered.length : 0;` |
| `sectorRiskProfile` | `useMemo(() => SECTORS.map(s => {` |
| `carbonLiabilityNpv` | `useMemo(() => filtered.slice(0, 12).map(d => {` |
| `scope12` | `d.scope1 + d.scope2;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `CRITERIA_WEIGHTS`, `DEAL_STATUS`, `SBTI_STATUS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Liability NPV | `Σ(Scope 1+2+3 emissions × shadow price trajectory) discounted to PV` | WBCSD ACE framework, SCC $51-220/t | Social cost of carbon $185/t (IWG 2021 update); internal carbon price trajectory fed through DCF model; domina |
| Stranded Asset Exposure | `Assets at risk of early retirement under 1.5°C / 2°C scenario / total PP&E` | IEA NZE scenario asset stranding analysis | Unburnable reserves plus fossil fuel infrastructure; quantified using IEA NZE remaining carbon budget by asset |
| Physical Risk Impairment | `Expected value of physical asset writedowns from climate hazards over holding period` | RMS/AIR physical risk model | Coastal, flood-prone, and water-stressed assets most vulnerable; key for real estate and infrastructure M&A |
- **Target company CDP disclosures and ESG reports** → Scope 1+2+3 emissions, climate governance, physical risk exposure → due diligence inputs → **Carbon liability and TCFD checklist**
- **IEA NZE scenario stranding database** → Asset-type retirement timelines by scenario → stranded asset quantification → **Stranded asset EV adjustment**
- **RMS / AIR physical risk platform** → Asset-level physical hazard exposure → impairment risk quantification → **Physical risk EV adjustment**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Enterprise Value
**Headline formula:** `Climate EV = Reported EV - Carbon Liability NPV - Stranded Asset Writedown - Physical Risk Impairment; Carbon Liability = Scope 1+2+3 × Shadow Carbon Price`
**Standards:** ['TCFD Recommendations 2017 + 2021 update', 'IFRS S2 Climate-related Disclosures 2023', 'ACE (Accounting for Carbon Emissions) Framework — WBCSD 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).