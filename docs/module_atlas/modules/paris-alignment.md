# Paris Alignment Score
**Module ID:** `paris-alignment` · **Route:** `/paris-alignment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio-level Paris Agreement 1.5°C alignment assessment using Implied Temperature Rise (ITR) methodology. Includes sector decomposition, forward emissions trajectory, and engagement prioritisation.

> **Business value:** The core metric for institutional investors to demonstrate Paris Agreement alignment. ITR enables "temperature-tagging" of portfolios and is increasingly required by regulators, clients, and net-zero alliances including NZAM and GFANZ.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CARBON_BUDGET`, `COUNTRY_PARIS`, `Card`, `HISTORICAL_EMISSIONS`, `ISO2_TO_ISO3`, `KpiCard`, `LS_PORTFOLIO`, `NZ_QUALITY_TIERS`, `SECTOR_BENCHMARKS`, `STOCKTAKE_FINDINGS`, `Section`, `SortTh`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `_CDP_PA` | `Object.fromEntries((CDP_COMPANY_EMISSIONS\|\|[]).map(c=>[(c.name\|\|'').toLowerCase(),c]));` |
| `annualEmissions` | `cdp ? (cdp.scope1_2_total_mtco2e\|\|0)*1e6 : ((h.scope1_co2e \|\| 50000) + (h.scope2_co2e \|\| 20000));` |
| `budgetUsed` | `+(20 + s * 60).toFixed(1);` |
| `nzYear` | `h.carbon_neutral_target_year \|\| (sbti?.y) \|\| (s > 0.3 ? (2035 + Math.floor(s * 25)) : null);` |
| `nzQuality` | `nzYear && hasSBTi ? (s > 0.7 ? 'Law-Backed' : 'SBTi-Verified') : nzYear ? 'Pledged' : 'None';` |
| `budgetShare` | `+(annualEmissions / 40e9 * 100).toFixed(6);` |
| `_wDenom` | `enriched.reduce((s, e) => s + (e.weight \|\| 1/n), 0);` |
| `wtdITR` | `_wDenom ? enriched.reduce((s, e) => s + e.itr * (e.weight \|\| 1/n), 0) / _wDenom : 0;` |
| `sbtiPct` | `enriched.filter(e => e.hasSBTi).length / n * 100;` |
| `nzPct` | `enriched.filter(e => e.nzYear).length / n * 100;` |
| `totalEmissions` | `enriched.reduce((s, e) => s + e.annualEmissions, 0);` |
| `portfolioBudgetShare` | `totalEmissions / 40e9 * 100;` |
| `yearsUntilExhaust` | `Math.max(0, Math.round(CARBON_BUDGET.remaining_1_5.gt / (totalEmissions / 1e9)));` |
| `ndcAligned` | `enriched.filter(e => e.ndcAligned).length / n * 100;` |
| `sectors` | `useMemo(() => ['All', ...new Set(enriched.map(e => e.sector))].sort(), [enriched]);` |
| `countries` | `useMemo(() => ['All', ...new Set(enriched.map(e => e.country))].sort(), [enriched]);` |
| `current` | `Math.max(0, CARBON_BUDGET.remaining_1_5.gt - t * CARBON_BUDGET.current_annual_global);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_PARIS`, `HISTORICAL_EMISSIONS`, `NZ_QUALITY_TIERS`, `SECTOR_BENCHMARKS`, `STOCKTAKE_FINDINGS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio ITR | `AUM-weighted` | PACTA | Current portfolio temperature alignment |
| 1.5°C Aligned % | `Holdings with ITR ≤ 1.5` | Screening | Fraction of portfolio aligned to Paris 1.5°C |
| High-Carbon Exposure | `AUM in ITR > 3°C companies` | Portfolio data | Exposure to severely misaligned companies |
- **Company emissions data** → ITR calculation → **Portfolio temperature score**
- **Carbon budget allocation** → Sector pathway → **Alignment gap**
- **Engagement register** → Escalation trigger → **Stewardship actions**

## 5 · Intermediate Transformation Logic
**Methodology:** Implied Temperature Rise (ITR)
**Headline formula:** `ITR = GlobalBudget_remaining × (PortfolioEmissions / GlobalEmissions) / PortfolioShare_globalGDP`
**Standards:** ['PACTA 2.0', 'CA100+ Net Zero Benchmark', 'Paris Agreement Art. 2.1(a)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).