# FI Line of Business Risk
**Module ID:** `fi-line-of-business` · **Route:** `/fi-line-of-business` · **Tier:** B (frontend-computed) · **EP code:** EP-CT3 · **Sprint:** CT

## 1 · Overview
6 LoBs with risk attribution, revenue efficiency, and marginal contribution analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `LOBS`, `LOB_COLORS`, `TABS`, `TOTAL_EXPOSURE`, `TOTAL_REVENUE`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOTAL_EXPOSURE` | `LOBS.reduce((s, l) => s + l.exposure, 0);` |
| `TOTAL_REVENUE` | `LOBS.reduce((s, l) => s + l.revenue, 0);` |
| `lobsEnriched` | `useMemo(() => LOBS.map((l, i) => {` |
| `riskContrib` | `(l.exposure * (100 - l.score)) / LOBS.reduce((s, l2) => s + l2.exposure * (100 - l2.score), 0) * 100;` |
| `revShare` | `(l.revenue / TOTAL_REVENUE) * 100;` |
| `efficiency` | `revShare / riskContrib;` |
| `radarData` | `useMemo(() => ['Exposure', 'Revenue', 'Score', 'Clients', 'RWA', 'Efficiency'].map(dim => {` |
| `marginalData` | `useMemo(() => lobsEnriched.map(l => {` |
| `newExposure` | `l.exposure + marginalAmount;` |
| `oldPortScore` | `LOBS.reduce((s, lb) => s + lb.exposure * lb.score, 0) / TOTAL_EXPOSURE;` |
| `newPortScore` | `(LOBS.reduce((s, lb) => s + lb.exposure * lb.score, 0) + marginalAmount * l.score) / (TOTAL_EXPOSURE + marginalAmount);` |
| `benchmarkData` | `useMemo(() => lobsEnriched.map(l => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LOBS`, `LOB_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LoBs | — | Organizational | Business line decomposition |
| Highest Risk LoB | — | Attribution | 42% of total risk |

## 5 · Intermediate Transformation Logic
**Methodology:** LoB risk attribution
**Headline formula:** `RiskContribution = LoB_exposure × (100 - LoB_score) / Total; RevenueEfficiency = Revenue% / Risk%`
**Standards:** ['Basel IV', 'BCBS 239']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).