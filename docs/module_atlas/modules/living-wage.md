# Living Wage Analytics
**Module ID:** `living-wage` · **Route:** `/living-wage` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Living wage gap analysis across portfolio company workforces. Covers Anker living wage methodology, regional benchmarks, gender pay gap, and supply chain labour cost sustainability.

> **Business value:** Living wage is increasingly a material S-pillar metric. GRI 202, SASB social standards, and CSRD S1 require wage-related disclosures. Companies paying below living wage face reputational risk, regulatory scrutiny, and worker turnover costs. This module quantifies the gap and supports engagement.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRY_ILO_STATUS`, `ChartTooltip`, `FAIR_PAY_FRAMEWORK`, `ILO_CONVENTIONS`, `LIVING_WAGE_BY_COUNTRY`, `PIE_COLORS`, `SECTOR_WAGE_RISK`, `WAGE_GAP_TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seededRandom` | `(seed) => { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; }; };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `rng` | `seededRandom(idx * 241 + 73 + (holding.name \|\| '').charCodeAt(0));` |
| `workersAtRisk` | `Math.round(clamp(sectorRisk.workers_at_risk_pct + (rng() - 0.5) * 15, 0, 80));` |
| `genderGap` | `Math.round(clamp(sectorRisk.gender_gap_pct + (rng() - 0.5) * 10, 2, 40));` |
| `wageData` | `useMemo(() => portfolio.map((h, i) => genWageData(h, i)), [portfolio]);` |
| `wtSum` | `wageData.reduce((s, h) => s + wt(h), 0) \|\| 1;` |
| `wavg` | `(arr, fn) => arr.reduce((s, h) => s + fn(h) * wt(h), 0) / wtSum;` |
| `highRiskWt` | `highRisk.reduce((s, h) => s + wt(h), 0) / wtSum * 100;` |
| `uniqueCountries` | `new Set(wageData.filter(h => h.riskLevel === 'Very High' \|\| h.riskLevel === 'High').map(h => h.countryCode));` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))]` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `exportReport` | `() => exportCSV(filtered.map(h => ({` |
| `exportCountry` | `() => exportCSV(LIVING_WAGE_BY_COUNTRY.map(c => ({` |
| `portfolioWt` | `holdingsInCountry.reduce((s, h) => s + (h.weight \|\| h.portfolio_weight \|\| 0), 0);` |
| `sectorHeatData` | `useMemo(() => Object.entries(SECTOR_WAGE_RISK).map(([k, v]) => ({ sector: k.length > 16 ? k.slice(0, 14) + '..' : k, ...v })), []);` |
| `total` | `Object.values(groups).reduce((s, v) => s + v, 0) \|\| 1;` |
| `leaders` | `useMemo(() => [...wageData].sort((a, b) => b.fairPayScore - a.fairPayScore).slice(0, 5), [wageData]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FAIR_PAY_FRAMEWORK`, `ILO_CONVENTIONS`, `LIVING_WAGE_BY_COUNTRY`, `PIE_COLORS`, `WAGE_GAP_TREND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Regional Benchmarks | — | Anker/WageIndicator | Living wage reference values by region and city |
| Gender Pay Gap | — | ILO | Persistent global gender wage gap requiring disclosure |
| Supply Chain Labour Cost | — | Sector analysis | Labour cost share in supply chain varies widely by sector |
- **Company wage disclosures** → Anker benchmark comparison → **Living wage gap estimate**
- **Supply chain spend** → Labour cost proportion → **Supply chain wage sustainability**
- **Gender pay gap data** → Equity analysis → **Social pillar ESG score**

## 5 · Intermediate Transformation Logic
**Methodology:** Living wage gap calculation
**Headline formula:** `Gap = max(0, LivingWage_region - ActualWage); LivingWage = Anker_reference_value`
**Standards:** ['Anker Research Institute', 'Fair Wage Network', 'WageIndicator Foundation']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).