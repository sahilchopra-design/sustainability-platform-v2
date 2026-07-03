# Macro Transition Risk
**Module ID:** `macro-transition` · **Route:** `/macro-transition` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Macroeconomic transition risk analysis. Covers GDP growth impacts under NGFS scenarios, employment effects, sectoral output changes, trade flow shifts, and fiscal implications of carbon pricing.

> **Business value:** Macro transition risks are systemic — they affect entire economies, not just individual sectors. Understanding GDP, employment, and fiscal impacts enables policymakers, central banks, and investors to assess whether net-zero pathways are economically viable and politically sustainable.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_TRANSITION`, `CRITICAL_MINERALS`, `Card`, `IEA_SCENARIOS`, `KpiCard`, `LS_KEY`, `PIE_COLORS`, `Section`, `SortTh`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `renScore` | `Math.min(c.renewable_pct, 100) * 0.30;` |
| `evScore` | `Math.min(c.ev_sales_pct, 100) * 0.15;` |
| `gridScore` | `c.grid_readiness * 0.20;` |
| `investScore` | `Math.min((c.clean_energy_investment_bn / (c.clean_energy_investment_bn + c.fossil_subsidy_bn)) * 100, 100) * 0.20;` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `avgReadiness` | `useMemo(() => Math.round(countriesWithScores.reduce((s, c) => s + c.transition_readiness, 0) / countriesWithScores.length), [countriesWithScores]);` |
| `totalFossilPct` | `useMemo(() => Math.round(countriesWithScores.reduce((s, c) => s + c.fossil_pct, 0) / countriesWithScores.length), [countriesWithScores]);` |
| `readiness` | `ctry ? computeTransitionReadiness(ctry) : Math.round(30 + seed(i + 99) * 50);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_TRANSITION`, `CRITICAL_MINERALS`, `IEA_SCENARIOS`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| GDP Change (Orderly NZ) | — | NGFS/IMF | Net GDP benefit of orderly transition vs delayed action |
| GDP Change (Disorderly) | — | NGFS | Disruption from abrupt policy shock |
| Green Jobs Created (2030) | — | IRENA | New jobs in clean energy across all sectors |
- **NGFS scenario parameters** → Macro model simulation → **GDP and employment paths**
- **Sector output changes** → Trade flow analysis → **Trade impact by commodity**
- **Carbon revenue** → Fiscal policy analysis → **Just transition financing capacity**

## 5 · Intermediate Transformation Logic
**Methodology:** Macro climate transition model
**Headline formula:** `GDP_impact = Direct + Indirect + Productivity_loss; Employment = Fossil_lost - Green_gained`
**Standards:** ['NGFS Macro Scenarios', 'IMF Climate Macro', 'Cambridge Econometrics E3ME']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).