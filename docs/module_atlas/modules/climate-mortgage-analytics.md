# Climate Mortgage Analytics
**Module ID:** `climate-mortgage-analytics` · **Route:** `/climate-mortgage-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DE3 · **Sprint:** DE

## 1 · Overview
Integrates physical and transition climate risks into mortgage portfolio analysis. Models climate-adjusted LTV, probability of default (PD) uplift, loss given default (LGD) impact, and regulatory capital implications under Basel IV climate risk add-ons.

> **Business value:** Directly supports ECB supervisory expectations for banks' climate risk integration into credit risk frameworks. Enables IFRS 9 climate-adjusted provisioning, Pillar 2 capital add-on quantification, and EBA climate stress test submissions for mortgage books.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COASTAL_SURCH`, `Card`, `EPC`, `FLOOD_SURCH`, `GREEN_DISC`, `KpiCard`, `MORTGAGES`, `PRODUCTS`, `REGIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PRODUCTS` | `['Standard','Green Mortgage','Buy-to-Let','Right-to-Buy','Shared Ownership'];` |
| `epc` | `EPC[Math.floor(sr(i*7) * EPC.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11) * REGIONS.length)];` |
| `product` | `PRODUCTS[Math.floor(sr(i*13) * PRODUCTS.length)];` |
| `propVal` | `Math.round(150000 + sr(i*3) * 1350000);          // £` |
| `ltv` | `parseFloat((0.50 + sr(i*17) * 0.35).toFixed(3)); // 50–85%` |
| `loanAmt` | `parseFloat((propVal * ltv / 1000).toFixed(1));   // £k` |
| `origYear` | `2018 + Math.floor(sr(i*19) * 7);` |
| `tenor` | `20 + Math.floor(sr(i*23) * 10);                  // 20–30yr` |
| `baseRate` | `parseFloat((4.5 + sr(i*37) * 2.0).toFixed(2));  // %` |
| `greenDisc` | `GREEN_DISC[epc] / 100;` |
| `floodSurch` | `floodZone  ? FLOOD_SURCH  / 100 : 0;` |
| `coastSurch` | `coastalZone ? COASTAL_SURCH / 100 : 0;` |
| `climateRate` | `parseFloat((baseRate - greenDisc + floodSurch + coastSurch).toFixed(2));` |
| `adjPropVal` | `propVal * (1 - strandHaircut);` |
| `adjLtv` | `parseFloat((loanAmt * 1000 / adjPropVal).toFixed(3));` |
| `basePd` | `parseFloat((0.005 + sr(i*41) * 0.025).toFixed(4));` |
| `climPdUp` | `(floodZone ? 0.003 : 0) + (epcIdx >= 4 ? 0.005 : 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EPC`, `PRODUCTS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate ECL Uplift | — | EBA Climate Stress Test 2023 | Mortgage ECL increases 8–22% under 3°C disorderly transition scenario by 2050 |
| EPC Premium on Collateral | — | Bank of England Research 2022 | EPC A/B properties carry 12% collateral premium; EPC E/F/G carry 15% discount in stressed LTV |
| Flood Zone PD Uplift | — | ECB Working Paper 2785 (2023) | Flood-zone mortgages show 34 bps higher realised default rate controlling for LTV and income |
- **Mortgage loan tape (EPC, geocode, LTV, PD)** → Climate risk overlay engine → **Loan-level climate PD/LGD uplift**
- **Property value indices + EPC transaction data** → Collateral revaluation → **Climate-adjusted LTV distribution**
- **EBA/ECB scenario parameters** → Capital calculation → **Pillar 2 add-on estimates**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted PD / LGD
**Headline formula:** `PD_climate = PD_base × (1 + β_physical × HazardScore + β_transition × EPC_gap); LGD_climate = max(LGD_base, 1 - ClimateAdjustedLTV)`
**Standards:** ['ECB Guide on Climate and Environmental Risks 2020', 'EBA Climate Risk Stress Testing 2023', 'Basel III/IV BCBS Pillar 2 Guidance', 'Bank of England SS3/19']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `BuiltEnvironmentAdvancedAnalytics`