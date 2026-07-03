# CDM Methodology Calculator
**Module ID:** `cdm-methodology-calculator` · **Route:** `/cdm-methodology-calculator` · **Tier:** B (frontend-computed) · **EP code:** EP-DQ1 · **Sprint:** DQ

## 1 · Overview
Implements the UN Clean Development Mechanism (CDM) methodology suite for calculating emission reductions. Covers ACM0002 (grid electricity), ACM0014 (industrial energy efficiency), AMS-I.D (grid-connected renewables), TOOL07 project emissions tool, and real-time carbon registry pricing for CER, ERU, and voluntary offsets.

> **Business value:** Essential for project developers seeking CDM/Article 6.4 registration, carbon credit buyers conducting due diligence, and carbon market analysts. Provides UNFCCC-grade emission reduction calculations using TOOL07 v4 with IPCC AR6 GWP100 values.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Badge`, `COUNTRIES_DATA`, `FormulaBox`, `GRID_EF`, `GWP_TABLE`, `KpiCard`, `METHODOLOGIES`, `PRICE_CURVES`, `PROJECTS`, `PROJ_NAMES`, `REGISTRIES`, `REG_PRICE`, `RegBox`, `SECTORS`, `SliderRow`, `TABS`, `VVBs`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODOLOGIES` | `['ACM0002','ACM0001','ACM0014','ACM0022','ACM0018','AMS-I.D','AMS-I.F','AMS-II.C','AMS-III.F','AMS-III.G','AR-ACM0003','AM0029','AM0031','AM0067','AMS` |
| `SECTORS` | `['Energy Industries','Energy Distribution','Energy Demand','Manufacturing','Chemical Industries','Construction','Transport','Mining/Mineral','Metal Pr` |
| `PROJ_NAMES` | `['Rajasthan Wind Farm Bundle','Sichuan Hydropower CDM','Amazon REDD+ Conservation','Rift Valley Geothermal','Sumatra Biogas Recovery','Mekong Solar Ir` |
| `price` | `base + sr(i * 7 + 3) * range;` |
| `annualER` | `5000 + sr(i * 11 + 2) * 195000;` |
| `creditingYrs` | `7 + Math.floor(sr(i * 5 + 1) * 14);` |
| `vintage` | `2016 + Math.floor(sr(i * 3 + 4) * 9);` |
| `issued` | `annualER * (1 + Math.floor(sr(i * 9 + 6) * 6)) * (0.88 + sr(i * 17 + 1) * 0.1);` |
| `TABS` | `['Portfolio Dashboard','ACM0002 Calculator','ACM0014 Waste Sector','AMS Small-Scale Suite','IPCC GWP & EFs','Vintage & Pricing','Monitoring Compliance` |
| `fmt` | `(n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });` |
| `fmtM` | `n => `$${(n / 1e6).toFixed(2)}M`;` |
| `totalER` | `PROJECTS.reduce((s, p) => s + p.annualER_tCO2e, 0);` |
| `totalWgt` | `PROJECTS.reduce((s, p) => s + p.annualER_tCO2e * p.carbonPrice_USD, 0);` |
| `erY` | `beY - peY - leY;` |
| `base` | `wasteTonnes * docFraction * DOCf * F * (16 / 12) * mcf * (1 - oxidFactor);` |
| `totalNPV` | `portfolioNPV.reduce((s, p) => s + p.npv, 0);` |
| `efCm` | `parseFloat((wOm * countryEf.om + (1 - wOm) * countryEf.bm).toFixed(4));` |
| `monStatus` | `MON_CHECKS.map((_, ci) => sr(monIdx * 100 + ci) > 0.25);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_DATA`, `GRID_EF`, `GWP_TABLE`, `METHODOLOGIES`, `MON_CHECKS`, `PROJ_NAMES`, `REGISTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CDM Registered Projects | — | UNFCCC CDM Registry 2024 | CDM registered 8,200+ projects issuing 2.1Bn CERs — Africa 3%, Asia 82%, Latin America 14% |
| CER Current Price | — | ERCX Carbon Markets 2024 | CERs tradeable on secondary markets at $0.5–2/tCO2e — Article 6.4 mechanism successor prices $5–30 |
| TOOL07 Accuracy | — | CDM Methodological Tool TOOL07 v4 | TOOL07 combined margin method accuracy for grid emission factor — requires ≥3yr operating margin data |
- **National grid generation mix by fuel + output data** → TOOL07 combined margin EF → **Grid emission factor OM, BM, CM (tCO2e/MWh)**
- **Project metered generation data (MWh/yr)** → Emission reduction calculation → **Annual ER_y by project with uncertainty range**
- **CER/ERU/VCU registry price feeds** → Carbon revenue modelling → **Project carbon revenue NPV under spot and forward prices**

## 5 · Intermediate Transformation Logic
**Methodology:** CDM Emission Reduction
**Headline formula:** `ER_y = BE_y - PE_y - LE_y; BE_y = EG_y × EF_grid,y; EF_grid,y = (OM_y × w_OM + BM_y × w_BM) / (w_OM + w_BM)`
**Standards:** ['CDM EB47 Annex II — Combined Margin Methodology', 'IPCC AR6 GWP100 Values (CH4=27.9, N2O=273)', 'ACM0002 v20 Grid Electricity Methodology', 'TOOL07 v4 — Tool to Calculate the Emission Factor for an Electricity System']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).