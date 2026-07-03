# Solar Developer Carbon Finance
**Module ID:** `solar-developer-carbon-finance` · **Route:** `/solar-developer-carbon-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EA2 · **Sprint:** EA

## 1 · Overview
Carbon finance analytics for solar energy developers, covering CDM/VCS ACM0002 methodology application, avoided emission calculations (tCO2/MWh × grid emission factor), carbon revenue stacking on top of PPA income, India REC and carbon credit bundling, and CCTS (Carbon Credit Trading Scheme) eligibility assessment.

> **Business value:** Used by solar developers, project finance advisors, and carbon credit brokers to quantify and monetise carbon value in Indian solar projects and structure blended carbon + REC revenue streams.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CREDIT_METHODOLOGIES`, `GRID_EF_HISTORY`, `IPPS`, `Kpi`, `PROJECT_FINANCE_WATERFALL`, `REC_DATA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annGenMwh` | `gwInstalled * 1000 * plf * 8760;` |
| `grossCredits` | `annGenMwh * gridEf / 1000;` |
| `netCredits` | `grossCredits * (1 - discountPct / 100);` |
| `revenue` | `netCredits * creditPrice;` |
| `calc` | `calcCarbonCredits({ gwInstalled: gwInput, plf: plfInput / 100, gridEf: gridEfInput / 100, discountPct: discountInput, creditPrice: creditPriceInput })` |
| `totalInstalledGw` | `IPPS.reduce((s, i) => s + i.installedGw, 0);` |
| `totalPipelineGw` | `IPPS.reduce((s, i) => s + i.pipelineGw, 0);` |
| `totalGreenBonds` | `IPPS.reduce((s, i) => s + i.greenBondIssuedGbn, 0);` |
| `annCreditsKt` | `(i.installedGw * 1000 * i.plf * 8760 * 0.82 * 0.97 / 1e6).toFixed(0);` |
| `jcmRevenue` | `(Number(annCreditsKt) * 0.7 * 18).toFixed(1);` |
| `annRev` | `gwInput * 1000 * plfInput / 100 * 8760 * gridEfInput / 100 / 1000 * 0.97 * cp;` |
| `irrUplift` | `(annRev / 1e6 * 0.8).toFixed(1);` |
| `mwh` | `gwInput * 1000 * v.plf * 8760;` |
| `tco2` | `mwh * v.gridEf * (1 - v.discount);` |
| `mwh` | `gwInput * 1000 * v.plf * 8760;` |
| `tco2` | `mwh * v.gridEf * (1 - v.discount);` |
| `mwh` | `gwInput * 1000 * (plfInput / 100) * 8760;` |
| `tco2` | `mwh * (gridEfInput / 100) * (1 - discountInput / 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_METHODOLOGIES`, `GRID_EF_HISTORY`, `IPPS`, `PROJECT_FINANCE_WATERFALL`, `REC_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avoided Emissions (tCO2e/yr) | `AEP_MWh × EF_grid_tCO2/MWh` | CEA Grid Emission Factors + project AEP | A 100MW solar plant at 25% CF and 0.82 tCO2/MWh avoids ~180,000 tCO2/yr; basis for CDM/VCS credit issuance. |
| Carbon Revenue Uplift (INR/unit) | `credit_price_INR / credits_per_MWh` | VCM price + REC market price | At $5/tCO2 VCM price and 0.82 credits/MWh, carbon revenue adds ~INR 0.35/kWh; material for merchant and lower- |
| CCTS Eligibility Score | `methodology_compliance × registry_recognition × vintage_eligibility` | MoEF CCTS Framework 2023 | Scores >70 indicate strong CCTS eligibility; India's CCTS may mandate grid-connected RE projects use domestic  |
- **CEA grid emission factors + project AEP forecast + VCM/REC prices** → ACM0002 avoided emission formula → credit volume → revenue model → **Carbon finance revenue stack model for solar project IRR enhancement**

## 5 · Intermediate Transformation Logic
**Methodology:** ACM0002 Avoided Emission Calculation
**Headline formula:** `avoided_tCO2 = AEP × (EF_grid − EF_project) × capacity_factor × hours`
**Standards:** ['CDM ACM0002 v19.0', 'Verra VCS VM0038 Methodology', 'BEE/CEA India Grid Emission Factor']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `Apr2026CarbonAnalytics`, `IndiaAdvancedAnalytics`, `IndiaGreenHybridFinance`