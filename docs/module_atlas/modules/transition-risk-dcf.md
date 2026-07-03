# Transition Risk DCF Engine
**Module ID:** `transition-risk-dcf` · **Route:** `/transition-risk-dcf` · **Tier:** B (frontend-computed) · **EP code:** EP-CA1 · **Sprint:** CA

## 1 · Overview
DCF impairment engine for 8 portfolio assets under 5 NGFS scenarios. Computes climate-adjusted WACC, carbon cost pass-through in cash flows, NPV impairment waterfall, and stranded year identification.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `SCENARIOS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `baseRevenue` | `asset.book * 0.18 * Math.pow(0.98, i);` |
| `adjustedCFs` | `baseCFs.map((cf, i) => {` |
| `carbonCost` | `(asset.emissions_intensity / 1000) * cprice * asset.book * 0.001;` |
| `revenueImpact` | `cf.base_cf * asset.passthrough * (cprice / 100) * 0.1;` |
| `adjusted` | `cf.base_cf - carbonCost - revenueImpact;` |
| `waccAdjusted` | `asset.wacc_base + asset.beta_c * carbonPrice(scenario, 5);` |
| `discountBase` | `(cf, i) => cf.base_cf / Math.pow(1 + asset.wacc_base, i + 1);` |
| `discountAdj` | `(cf, i) => cf.adjusted_cf / Math.pow(1 + waccAdjusted, i + 1);` |
| `finalCfBase` | `adjustedCFs[adjustedCFs.length - 1]?.base_cf ?? 0;` |
| `finalCfAdj` | `adjustedCFs[adjustedCFs.length - 1]?.adjusted_cf ?? 0;` |
| `npvBase` | `adjustedCFs.reduce((acc, cf, i) => acc + discountBase(cf, i), 0) + tvBase;` |
| `npvAdj` | `adjustedCFs.reduce((acc, cf, i) => acc + discountAdj(cf, i), 0) + tvAdj;` |
| `impairment` | `npvBase - npvAdj;` |
| `totalBook` | `portfolioImpairment.reduce((s, a) => s + a.book, 0);` |
| `totalImpairment` | `portfolioImpairment.reduce((s, a) => s + a.impairment, 0);` |
| `total` | `ASSETS.reduce((acc, a) => acc + computeDcfImpairment(a, s, horizon).impairment, 0);` |
| `pct` | `(total / (totalBook \|\| 1)) * 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Price (NZ2050, 2030) | `P(t) = P₀·exp(g·t)·[1+α·sin(2πt/T)]` | NGFS Phase 5 | Deterministic carbon price trajectory under Net Zero 2050 scenario |
| WACC Adjustment | `β_carbon × P_carbon(t=5)` | Cross-sectional regression | Additional cost of capital reflecting carbon risk exposure |
| NPV Impairment | `NPV_adj / NPV_base - 1` | DCF model | Percentage decline in asset value due to carbon costs and WACC adjustment |
| Stranded Year | `First t where cumulative NPV < 0` | Model output | Year when the asset becomes economically unviable under given scenario |
| Pass-Through Rate | `Sector-specific` | Company filings | Fraction of carbon costs passed to customers (energy sector: 60-70%) |

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-adjusted DCF with carbon cost overlay
**Headline formula:** `WACC_adj = WACC_base + β_carbon × P_carbon(t=5)`
**Standards:** ['NGFS Phase 5', 'IAS 36', 'ISSB S2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).