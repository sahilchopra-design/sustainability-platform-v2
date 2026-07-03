# Green Building Code Finance
**Module ID:** `green-building-code-finance` · **Route:** `/green-building-code-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DM5 · **Sprint:** DM

## 1 · Overview
Analyses the financial implications of evolving building energy performance standards — EU Energy Performance of Buildings Directive (EPBD), US ASHRAE 90.1, and national net-zero building codes. Models compliance costs, retrofit investment requirements, and green building product market sizing.

> **Business value:** Essential for building product manufacturers, retrofit financing banks, real estate investors sizing EPBD compliance capex, and green bond issuers in the buildings sector. Provides EPBD compliance timeline modelling and retrofit investment economics for property portfolios.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPLIANCE_BUCKETS`, `JURISDICTIONS`, `JURISDICTION_NAMES`, `KpiCard`, `REGIONS`, `TABS`, `TARGET_YEARS_BUCKET`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `TARGET_YEARS_BUCKET` | `['Near (≤2030)', 'Mid (2031-2040)', 'Long (2041-2050)'];` |
| `codeVer` | `2010 + Math.floor(sr(i * 7) * 14);` |
| `nzTarget` | `2025 + Math.floor(sr(i * 11) * 25);` |
| `retrofitYr` | `2025 + Math.floor(sr(i * 13) * 15);` |
| `energyStd` | `Math.round(30 + sr(i * 17) * 170);` |
| `embodiedC` | `Math.round(100 + sr(i * 19) * 400);` |
| `greenCertShare` | `+(5 + sr(i * 23) * 65).toFixed(1);` |
| `compliance` | `+(30 + sr(i * 29) * 70).toFixed(1);` |
| `enforcement` | `+(2 + sr(i * 31) * 8).toFixed(1);` |
| `retrofitFund` | `+(0.2 + sr(i * 37) * 9.8).toFixed(1);` |
| `newBuildComp` | `+(40 + sr(i * 41) * 60).toFixed(1);` |
| `strandedStock` | `+(5 + sr(i * 43) * 45).toFixed(1);` |
| `carbonSavings` | `+(0.1 + sr(i * 47) * 4.9).toFixed(2);` |
| `avgEnergy` | `filtered.length ? Math.round(filtered.reduce((s, j) => s + j.energyEfficiencyStandard, 0) / filtered.length) : 0;` |
| `totalRetrofitFund` | `filtered.reduce((s, j) => s + j.retrofitFunding, 0).toFixed(1);` |
| `totalCarbonSavings` | `filtered.reduce((s, j) => s + j.carbonSavingsFromCode, 0).toFixed(2);` |
| `energyByRegion` | `REGIONS.map(r => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPLIANCE_BUCKETS`, `JURISDICTION_NAMES`, `REGIONS`, `TABS`, `TARGET_YEARS_BUCKET`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU EPBD Renovation Wave | — | European Commission EPBD 2023 | EU Energy Performance of Buildings Directive targets renovation of 35M worst-performing buildings by 2030 |
| Average Deep Retrofit Cost | — | JRC Building Stock Analysis 2023 | Deep energy retrofit cost in EU varies €150–400/m² depending on building type and depth of measures |
| NZEB Premium | — | ECOFYS NZEB Cost Study 2022 | Nearly zero energy building construction costs 3–8% more than standard — rapidly closing gap with scale |
- **National building stock EPC databases** → Compliance gap analysis → **Buildings failing upcoming MEPS and required upgrade cost**
- **Construction cost databases + retrofit project data** → Compliance cost modelling → **Total market investment required for EPBD compliance by 2030**
- **Green building product market sizing** → Market opportunity → **Insulation, heat pump, glazing, smart controls demand from EPBD**

## 5 · Intermediate Transformation Logic
**Methodology:** Building Code Compliance Cost Model
**Headline formula:** `ComplianceCost = Σ [UpgradeRequired_i × CostPerUpgrade_i × BuildingStock_i]; RetrofitROI = (EnergySavings + CarbonSavings × CarbonPrice + ValueUplift) / RetrofitCost`
**Standards:** ['EU Energy Performance of Buildings Directive (EPBD) 2023 Recast', 'IEA Energy Efficiency 2023', 'ASHRAE Standard 90.1-2022', 'World Green Building Council Net Zero Carbon Buildings Commitment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).