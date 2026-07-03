# Green Securitisation Analytics
**Module ID:** `green-securitization` · **Route:** `/green-securitization` · **Tier:** B (frontend-computed) · **EP code:** EP-DW5 · **Sprint:** DW

## 1 · Overview
Green securitisation analytics covering green ABS (solar/EV/PACE), green RMBS (energy-efficient mortgages), green CLO (green loans), use-of-proceeds waterfall, SPV structuring, greenium quantification and EU Green Bond Standard applicability.

> **Business value:** Green securitisation commands a 5–10 bps greenium across solar ABS, EV lease ABS and energy-efficient RMBS; EU Green Bond Standard applicability requires full EU Taxonomy alignment of the underlying asset pool, raising the bar versus ICMA GBP self-labelling.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `CREDIT_ENHANCE`, `GREEN_FRAMEWORKS`, `INVESTOR_BASE`, `MARKET_ISSUANCE`, `TABS`, `TRANCHES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annLoss` | `poolBal * (cdrPct / 100) * (lgdPct / 100);` |
| `annPrepay` | `poolBal * (cprPct / 100);` |
| `totalInterest` | `poolBal * (poolYield / 100);` |
| `notional` | `poolBal * t.size / 100;` |
| `lossRate` | `notional > 0 ? absorbed / notional : 0;` |
| `coupon` | `t.couponSpr !== null ? notional * (t.couponSpr / 10000) : 0;` |
| `excessSpread` | `Math.max(0, totalInterest - results.reduce((s, r) => s + r.coupon * 1000, 0)) / 1e6;` |
| `seniorNotional` | `poolM * 0.82;` |
| `mezzNotional` | `poolM * 0.165;` |
| `equityNotional` | `poolM * 0.015;` |
| `seniorCost` | `seniorNotional * (seniorSpr - greeniumBps * greenPct / 100) / 10000;` |
| `mezzCost` | `mezzNotional * mezzSpr / 10000;` |
| `wac` | `(seniorCost + mezzCost) / (poolM * 0.985);` |
| `greenBenefit` | `poolM * greeniumBps * greenPct / 100 / 10000;` |
| `pricing` | `useMemo(() => calcGreenPricing({ poolM: poolM * 1e6, greenPct: asset.greenPct, framework, wacc: 5.5, seniorSpr, mezzSpr }), [poolM, asset, framework, ` |
| `trancheChart` | `useMemo(() => TRANCHES.map(t => ({` |
| `poolComposition` | `useMemo(() => ASSET_CLASSES.map((a, i) => ({` |
| `arrangementFee` | `poolM * 1e6 * arrangementBps / 10000 / 1e3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `CREDIT_ENHANCE`, `GREEN_FRAMEWORKS`, `INVESTOR_BASE`, `MARKET_ISSUANCE`, `TABS`, `TRANCHES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenium (Green Premium) | `Greenium = YTM_Conv − YTM_Green on matched-maturity, same-credit tranches` | ICMA STS Green ABS / Bloomberg data | Investor demand premium for labelled green securitisations; varies by asset class and ESG mandate penetration. |
| Solar ABS Green Eligibility | `Eligibility = Loan Purpose × Taxonomy SC Check` | ICMA GBP + EU GBS Criteria | Solar consumer loans and leases are core eligible asset class; EU GBS requires Taxonomy alignment. |
| EV Lease ABS Green Eligibility | `Eligibility = Vehicle Category × Emissions Standard` | EU Taxonomy 6.5 + ICMA GBP | BEV and FCEV lease receivables fully eligible; PHEV eligibility dependent on utility factor methodology. |
- **Loan-level asset pool data + ICMA/EU GBS eligibility criteria** → Use-of-proceeds waterfall → greenium pricing model → **Green securitisation structuring and analytics dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Greenium Calculation
**Headline formula:** `Greenium = YTM_Conventional_Comparable − YTM_Green_Equivalent (bps)`
**Standards:** ['ICMA — Green Bond Principles 2021', 'EBA — Discussion Paper on Green Bonds (2020)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).