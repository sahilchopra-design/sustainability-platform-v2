# SMR Project Finance
**Module ID:** `smr-project-finance` · **Route:** `/smr-project-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DU2 · **Sprint:** DU

## 1 · Overview
Project finance structuring for small modular reactors covering factory fabrication economics, FOAK-to-NOAK learning, regulatory pathways across NRC/ONR/CNSC, IRA production tax credits and government guarantee structures.

> **Business value:** SMR project finance viability hinges on achieving NOAK cost targets via 10–15% learning rates, monetising IRA Section 45U PTCs at 2.6¢/kWh and securing DOE Title XVII loan guarantees to bridge FOAK risk.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `SMR_DESIGNS`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `learningReduction` | `Math.pow(nthOfAKind, -0.12);` |
| `adjCapex` | `capexKw * learningReduction;` |
| `capexAnn` | `adjCapex * w / (1 - Math.pow(1 + w, -lifetime));` |
| `idc` | `Math.pow(1 + w, 2); // 3-4yr construction` |
| `annMwh` | `cf / 100 * 8760;` |
| `capexTotal` | `capexKw * design.mw * 1000;` |
| `equityPct` | `(100 - debtPct) / 100;` |
| `equityCapex` | `-capexTotal * equityPct;` |
| `annualMwh` | `cf / 100 * 8760 * design.mw;` |
| `annRevenue` | `annualMwh * powerPrice;` |
| `annOpex` | `(opex * design.mw * 1000 + fuel * annualMwh);` |
| `annDebtService` | `capexTotal * debtPct / 100 * (wacc / 100 + 1 / 30);` |
| `net` | `annRevenue - annOpex - annDebtService;` |
| `projectIrr` | `useMemo(() => (irr(cashflows) * 100).toFixed(1), [cashflows]);` |
| `projectNpv` | `useMemo(() => (npv(cashflows, wacc / 100) / 1e6).toFixed(1), [cashflows, wacc]);` |
| `capexShock` | `1 + (sr(i * 7) - 0.5) * 0.3;` |
| `priceShock` | `1 + (sr(i * 11) - 0.5) * 0.4;` |
| `capexT` | `capexKw * design.mw * 1000 * capexShock;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SMR_DESIGNS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| FOAK-to-NOAK Learning Rate | `Cost_N = Cost_1 × N^(log(1−LR)/log(2))` | NEA SMR Report 2021 | Estimated cost reduction per doubling of cumulative factory output. |
| IRA Production Tax Credit | `PTC = 2.6¢ × Eligible Generation (MWh)` | IRS Section 45U | Advanced nuclear PTC under Inflation Reduction Act for facilities commencing construction pre-2033. |
| DOE Loan Guarantee Coverage | `Guaranteed Debt = Total Project Cost × Coverage Ratio` | DOE Loan Programs Office | Title XVII loan guarantee programme for innovative clean energy projects. |
- **Factory cost model** → Learning-rate curves × regulatory timeline → **DSCR and IRR sensitivity by FOAK/NOAK scenario**

## 5 · Intermediate Transformation Logic
**Methodology:** NOAK Learning Rate
**Headline formula:** `NOAK Cost = FOAK Cost × N^(log(1−LR)/log(2))`
**Standards:** ['NEA Cost Estimation for SMRs 2015', 'DOE Advanced Reactor Demonstration Program']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).