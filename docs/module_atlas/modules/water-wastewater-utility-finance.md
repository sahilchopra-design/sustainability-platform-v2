# Water & Wastewater Utility Finance
**Module ID:** `water-wastewater-utility-finance` · **Route:** `/water-wastewater-utility-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EL2 · **Sprint:** EL

## 1 · Overview
Ofwat PR24/AMP8 framework for 12 global water utilities, totex efficiency benchmarking (allowed vs actual), asset serviceability grades (A–E) across 5 asset classes, Outcome Delivery Incentives (ODIs) performance vs target, RAB evolution by AMP period with WACC trends, 20-year water quality & leakage trend, and RAB-based regulatory valuation with dividend yield analysis.

> **Business value:** Used by water utility equity analysts modelling PR24 allowed returns, infrastructure debt investors assessing covenant headroom, and ESG analysts tracking ODI performance and leakage reduction targets.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_HEALTH`, `GradeBar`, `KpiCard`, `OUTCOMES`, `Pill`, `RAB_TREND`, `TOTEX_TREND`, `UTILITIES`, `WATER_QUALITY_TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `countries` | `['All', ...new Set(UTILITIES.map(u => u.country))];` |
| `totalRAB` | `useMemo(() => UTILITIES.reduce((s,u) => s+u.rab, 0), []);` |
| `avgDSCR` | `useMemo(() => (UTILITIES.reduce((s,u) => s+u.dscr, 0)/UTILITIES.length).toFixed(2), []);` |
| `avgLeakage` | `useMemo(() => Math.round(UTILITIES.reduce((s,u) => s+u.leakage, 0)/UTILITIES.length), []);` |
| `avgCmex` | `useMemo(() => Math.round(UTILITIES.reduce((s,u) => s+u.cmex, 0)/UTILITIES.length), []);` |
| `adjWACC` | `(util.wacc_real + waccAdj / 100).toFixed(2);` |
| `allowedReturn` | `(util.rab * +adjWACC / 100 / 1000).toFixed(2);` |
| `leakageSaving` | `Math.round(util.leakage * leakageTarget / 100 * 0.42);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_HEALTH`, `OUTCOMES`, `UTILITIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| UK water industry RAB (2024) | `Aggregate RAB across 9 WASCs + 12 WOCs` | Ofwat PR24 Final Determinations 2024 | AMP8 allowed totex £96Bn 2025-30; inflation indexation means RAB grows ~12% in nominal terms per 5yr period on |
| Average water gearing (UK) | `Aggregate regulated water company gearing` | Ofwat Water Company Performance 2023 | Ofwat considers 55-65% gearing "efficient"; Thames Water at 82% outside comfort zone; CMA precedent: Anglian 2 |
| Leakage target (UK average) | `AMP8 target per water company average` | Ofwat PR24 draft determinations 2024 | Industry-wide leakage must halve by 2050 (Net Zero Water); PR24 leakage ODIs worth £280M/yr incentive income t |
- **Ofwat PR24 + Environment Agency WFD + Water Industry Act + DWI annual report + S&P water utility rating criteria + Bloomberg water utility bond indices** → 12-utility RAB comparison + totex efficiency + serviceability grades + ODI tracker + WACC trend + leakage simulator + valuation model → **Water utility equity analysts, infrastructure debt investors, ESG-focused fixed income teams, and regulatory economists advising on PR29 strategy**

## 5 · Intermediate Transformation Logic
**Methodology:** Water Utility RAB Valuation & WACC
**Headline formula:** `WACC_real = Equity_Ratio × ROE + (1 − Equity_Ratio) × Cost_of_Debt × (1 − Tax); Allowed_Return = RAB × WACC_real; Totex_Efficiency = Actual_Totex / Allowed_Totex; Leakage_Saving_NPV = Reduction_Mld × 365 × £0.42/m³ × PV_Factor; ODI_Incentive = (Performance_Actual − PC_Target) × P_A_Rate`
**Standards:** ['Ofwat PR24 Final Determinations 2024', 'Water Industry Act 1991 (amended 2014)', 'Environment Agency Water Quality Report 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).