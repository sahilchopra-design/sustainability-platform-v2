# Materiality Trends
**Module ID:** `materiality-trends` · **Route:** `/materiality-trends` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the historical evolution of ESG topic materiality by sector using longitudinal data from SASB standards revisions, investor engagement priorities, regulatory activity, and academic ESG materiality research. Identifies topics experiencing rapid materiality growth (emerging), declining relevance (fading), or structural shifts driven by regulatory catalysts. Informs dynamic materiality assessment and strategic ESG topic prioritisation.

> **Business value:** Equips ESG strategists and investor relations teams with a quantitative materiality trend database that anticipates where investor and regulatory attention is heading, enabling proactive disclosure investment and strategic ESG priority alignment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_DRIVERS`, `Badge`, `Btn`, `CHART_COLORS`, `CustomTooltip`, `ESRS_TOPICS`, `KpiCard`, `LS_PORT`, `LS_PREFS`, `SECTOR_SENSITIVITY`, `STRENGTH_COLOR`, `STRENGTH_LABEL`, `STRENGTH_MAP`, `Section`, `SortHeader`, `TREND_COLOR_MAP`, `TREND_DRIVERS`, `TREND_ICON`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `multiplied` | `d.category === 'regulatory' ? base * regMultiplier : base;` |
| `direction` | `d.trend === 'increasing' ? 1 : -1;` |
| `delta2035` | `y2035 - y2025;` |
| `keyDrivers` | `ALL_DRIVERS.filter(d => d.impact_topics.includes(t.id)).sort((a, b) => STRENGTH_MAP[b.strength] - STRENGTH_MAP[a.strength]).slice(0, 3);` |
| `avgStrength` | `(ALL_DRIVERS.reduce((s, d) => s + STRENGTH_MAP[d.strength], 0) / ALL_DRIVERS.length).toFixed(1);` |
| `mostDynamic` | `[...topicForecasts].sort((a, b) => Math.abs(b.delta2035) - Math.abs(a.delta2035))[0];` |
| `adjusted` | `Math.min(100, t.baseScore * mult);` |
| `base` | `Math.min(100, t.baseScore * mult);` |
| `score` | `forecastMateriality(t.id, base, ALL_DRIVERS, y - 2025, regMultiplier);` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => { const v = r[k]; return typeof v === 'object' ? `"${JSON.stringify(v)}"` : `"${v}"`; }).join(','))].j` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `blob` | `new Blob([md], { type: 'text/markdown' });` |
| `delta5yr` | `h.score2025 - h.score2020;` |
| `delta10yr` | `h.score2035 - h.score2025;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_DRIVERS`, `CHART_COLORS`, `ESRS_TOPICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| MTI Score (0–100) | — | Composite of investor, regulatory, and litigation signals | Current materiality trend strength; above 70 indicates a rapidly emerging or highly active topic |
| Trend Velocity (MTI/yr) | — | 12-month MTI delta | Rate of materiality change; high positive velocity signals accelerating investor and regulatory attention |
| Regulatory Catalyst Events | — | Legislative tracker database | Number of significant regulatory proposals or enactments affecting the topic in the past 12 months |
| Sector Materiality Consensus (%) | — | SASB cross-sector materiality map | Proportion of companies in the sector for which the topic is deemed financially material by SASB |
- **SASB standards revision history database** → Track topic additions, removals, and metric changes across standard revisions; code directionality → **Longitudinal materiality consensus time series by sector and topic**
- **Investor engagement letter tracker** → Classify letters by topic and AUM of signatory; aggregate monthly priority score → **Investor priority signal time series per topic**
- **Regulatory pipeline database** → Monitor legislative activity by topic and jurisdiction; compute regulatory activity score → **Regulatory catalyst event log and activity score time series**

## 5 · Intermediate Transformation Logic
**Methodology:** Materiality Trend Index
**Headline formula:** `MTIᵢₜ = (Investor Priority Scoreᵢₜ + Regulatory Activity Scoreᵢₜ + Litigation Risk Scoreᵢₜ) / 3`
**Standards:** ['SASB Standards Evolution Database', 'Harvard Law School Forum on Corporate Governance ESG Survey', 'Bloomberg ESG Engagement Trend Data', 'RepRisk Issue Severity Index']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).