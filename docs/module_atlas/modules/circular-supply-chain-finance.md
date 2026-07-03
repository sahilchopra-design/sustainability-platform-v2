# Circular Supply Chain Finance
**Module ID:** `circular-supply-chain-finance` · **Route:** `/circular-supply-chain-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EJ6 · **Sprint:** EJ

## 1 · Overview
6 circular levers with impact/cost/scalability radar, 22-company circular scorecard (CE score/take-back/recycled input), 6 cSCF finance instruments (cSCF/CE Bond/Impact-Linked Loan/Reverse Factoring/Reman WH Finance/Circular Leasing), value leakage map, and market maturity trends.

> **Business value:** Used by corporate treasury teams structuring cSCF programmes, SCF providers building circular finance products, and ESG analysts quantifying circular economy performance for ESRS E5 disclosure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CE_RADAR_DATA`, `CIRCULAR_LEVERS`, `FINANCE_INSTRUMENTS`, `KpiCard`, `MATURITY_DATA`, `Pill`, `SUPPLY_CHAINS`, `TABS`, `VALUE_LEAKAGE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CE_RADAR_DATA` | `CIRCULAR_LEVERS.map(l => ({` |
| `sectors` | `['All', ...new Set(SUPPLY_CHAINS.map(s => s.sector))];` |
| `sortedChains` | `useMemo(() => [...filteredChains].sort((a, b) => b[sortField] - a[sortField]), [filteredChains, sortField]);` |
| `avgCircularScore` | `SUPPLY_CHAINS.reduce((a, b) => a + b.circularScore, 0) / SUPPLY_CHAINS.length;` |
| `avgRecycledInput` | `SUPPLY_CHAINS.reduce((a, b) => a + b.recycledInputPct, 0) / SUPPLY_CHAINS.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CIRCULAR_LEVERS`, `FINANCE_INSTRUMENTS`, `MATURITY_DATA`, `TABS`, `VALUE_LEAKAGE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CE value at stake by 2030 | `Global circular economy opportunity (EMF)` | Ellen MacArthur Foundation 2023 | Largest opportunities in construction ($1.3Tn), food ($700Bn), and mobility ($550Bn) sectors; finance can unlo |
| ING cSCF rate benefit | `Reduction for circular KPI performance` | ING Circular Economy Finance Framework 2023 | Rate benefit tied to 3 KPIs: recycled content %, take-back rate, CE revenue %; annual independent verification |
| End-of-life value leakage | `Of product value lost at end of life` | McKinsey CE Value Model 2023 | Contrast: design stage only 8% leakage; addressing end-of-life recovery is single largest circular economy opp |
- **ING cSCF Framework + ISO 59000 + EMF CE100 + EU CEAP + ESRS E5 + GRI 306 + CBI CE Criteria** → 6 lever radar + company scorecard + cSCF instruments + value leakage + market maturity chart → **Treasury teams, SCF providers, impact investors, ESG analysts, and corporate circular economy officers**

## 5 · Intermediate Transformation Logic
**Methodology:** Circular SCF KPI
**Headline formula:** `Circular_Score = (RC_pct/50 × 30 + TakeBack_pct/60 × 25 + CE_Revenue_pct/40 × 25 + SupplierVisibility × 20); cSCF_Rate = SOFR + BaseSpread − min(CircularBonus, 40bps) × I(KPI_met); Value_Leakage = Σ(StageRevenue × LeakagePct_stage)`
**Standards:** ['ING Circular Economy Finance Framework 2023', 'ISO 59000 CE Standards 2024', 'EU Circular Economy Action Plan 2020']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).