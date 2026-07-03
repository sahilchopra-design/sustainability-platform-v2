# Sustainable Agriculture Investment
**Module ID:** `sustainable-agriculture-investment` · **Route:** `/sustainable-agriculture-investment` · **Tier:** B (frontend-computed) · **EP code:** EP-DG4 · **Sprint:** DG

## 1 · Overview
Evaluates sustainable and regenerative agriculture investment opportunities including soil carbon sequestration, precision agriculture technology, sustainable supply chain finance, and nature-positive farming transition economics.

> **Business value:** Directly applicable to agricultural finance institutions, food company CFOs setting SBTi FLAG targets, and investors in nature-based solutions. Provides bankable analysis of regenerative agriculture economics and enables corporate land-use emissions target setting under SBTi FLAG guidance.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `FUNDS`, `GREEN_BONDS`, `KpiCard`, `REGEN_PRACTICES`, `RETURN_SERIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RETURN_SERIES` | `[2018, 2019, 2020, 2021, 2022, 2023, 2024].map((yr, i) => ({` |
| `fundTypes` | `['All', ...new Set(FUNDS.map(f => f.type))];` |
| `totalAUM` | `useMemo(() => filteredFunds.reduce((a, f) => a + +f.aum, 0), [filteredFunds]);` |
| `avgReturn` | `useMemo(() => filteredFunds.length > 0 ? (filteredFunds.reduce((a, f) => a + f.actualReturn, 0) / filteredFunds.length).toFixed(1) : '–', [filteredFun` |
| `avgImpact` | `useMemo(() => filteredFunds.length > 0 ? (filteredFunds.reduce((a, f) => a + f.impactScore, 0) / filteredFunds.length).toFixed(1) : '–', [filteredFund` |
| `sortedPractices` | `useMemo(() => [...REGEN_PRACTICES].sort((a, b) => b[practiceSort] - a[practiceSort]), [practiceSort]);` |
| `gbData` | `useMemo(() => GREEN_BONDS.map(b => ({ name: b.issuer.split(' ').slice(0, 2).join(' '), volume: b.volume, greenium: b.greeniumBps })), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGEN_PRACTICES`, `RETURN_SERIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Soil Carbon Sequestration Potential | — | IPCC AR6 WGIII Chapter 7 | Annual sequestration rate from regenerative agricultural practices on degraded soils |
| Precision Agriculture Yield Uplift | — | McKinsey Global Food Initiative 2023 | Technology-enabled precision agriculture improves yields 10–15% while reducing input costs 20% |
| SBTi FLAG Target Coverage | — | SBTi FLAG 2022 | Forest, Land and Agriculture targets now required for 60+ companies with >25% land-use Scope 3 |
- **Farm management data (practices, inputs, yields)** → Regenerative transition modelling → **Farm P&L impact, soil carbon accumulation, carbon credit revenue**
- **SBTi FLAG screener (sector, revenue, land use %)** → Target-setting compliance → **FLAG target pathway and required removals/reductions by year**
- **Soil carbon measurement data (SOC, bulk density)** → VM0042 carbon credit calculation → **Verified carbon credits from improved land management**

## 5 · Intermediate Transformation Logic
**Methodology:** Regenerative Agriculture ROI
**Headline formula:** `ROI_regen = (YieldMaintained × Price + CarbonCredit × CarbonPrice + WaterSavings × WaterPrice - TransitionCost) / TransitionCost; SoilCarbonSeq = ΔSOC × BulkDensity × Depth × Area`
**Standards:** ['Rodale Institute Regenerative Agriculture Research', 'SBTi FLAG Guidance 2022', 'Verra Verified Carbon Standard VM0042', 'IPCC AR6 WGIII Chapter 7 Agriculture AFOLU']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).