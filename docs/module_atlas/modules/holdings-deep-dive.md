# Holdings Deep Dive
**Module ID:** `holdings-deep-dive` · **Route:** `/holdings-deep-dive` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides granular position-level ESG analytics with full look-through across fund of fund structures, enabling issuer-level attribution of ESG score, carbon footprint, controversy exposure, and PAI indicator contributions. Supports portfolio managers in identifying specific holdings driving portfolio-level ESG underperformance.

> **Business value:** Enables portfolio managers and ESG analysts to perform root-cause analysis of portfolio ESG scores at the individual holding level, prioritise engagement or divestment decisions based on ESG contribution and controversy risk, and produce granular SFDR PAI disclosures from position-level data.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `CHART_COLORS`, `ChartTooltip`, `DataField`, `EngagementTag`, `HoldingsDeepDivePage`, `NavLink`, `ProgressBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `csv` | `[headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `pct` | `Math.min(100, Math.max(0, ((value \|\| 0) / max) * 100));` |
| `base` | `{ border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center'` |
| `dir` | `sortDir === 'asc' ? 1 : -1;` |
| `portfolioTotalScope1` | `useMemo(() => holdings.reduce((s, h) => s + (h.company?.scope1_mt \|\| 0), 0), [holdings]);` |
| `portfolioTotalScope2` | `useMemo(() => holdings.reduce((s, h) => s + (h.company?.scope2_mt \|\| 0), 0), [holdings]);` |
| `portfolioTotalScope12` | `portfolioTotalScope1 + portfolioTotalScope2;` |
| `portfolioWACI` | `useMemo(() => holdings.reduce((s, h) => { const gi = ghgIntensity(h); return s + (gi !== null ? (h.weight \|\| 0) / 100 * gi : 0); }, 0), [holdings]);` |
| `headers` | `['Ticker', 'Name', 'Sector', 'Weight%', 'ESG Score', 'GHG Intensity', 'T-Risk', 'SBTi', 'NZ Year', 'Scope1 Mt', 'Scope2 Mt'];` |
| `rows` | `selectedHoldings.map(h => {` |
| `headers` | `['Ticker', 'Name', 'Sector', 'Exchange', 'Weight%', 'Exposure USD Mn', 'ESG Score', 'GHG Intensity', 'T-Risk', 'SBTi', 'NZ Year'];` |
| `rows` | `holdings.map(h => {` |
| `attrScope1` | `af !== null ? af * (c.scope1_mt \|\| 0) : null;` |
| `attrScope2` | `af !== null ? af * (c.scope2_mt \|\| 0) : null;` |
| `attrScope12` | `af !== null ? af * ((c.scope1_mt \|\| 0) + (c.scope2_mt \|\| 0)) : null;` |
| `waciContrib` | `gi !== null ? (h.weight \|\| 0) / 100 * gi : null;` |
| `pctScope12` | `portfolioTotalScope12 > 0 ? (((c.scope1_mt \|\| 0) + (c.scope2_mt \|\| 0)) / portfolioTotalScope12) * 100 : null;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Score Range (portfolio) | — | MSCI ESG Ratings | Distribution of ESG scores across individual holdings; wide dispersion (>30 points range) indicates high stock |
| Top 5 Carbon Contributors (%) | — | PCAF / CDP data | Proportion of portfolio financed emissions attributable to the 5 largest carbon contributors; Pareto concentra |
| Controversy Flag Rate (%) | — | RepRisk / Sustainalytics | Percentage of holdings with active high-severity ESG controversies; above 15% indicates elevated reputational  |
| PAI Indicator Coverage (%) | — | SFDR portfolio reporting | Share of mandatory SFDR PAI indicators computable at holding level without estimation; higher coverage reduces |
- **Portfolio holdings (IBOR/ABOR)** → Apply fund look-through, map to ISIN ESG database → **Position-level ESG scores and PAI data**
- **MSCI/Sustainalytics ESG data feeds** → Compute position ESG contributions vs portfolio average → **ESG contribution waterfall by holding**
- **Carbon emissions data (CDP/PCAF)** → Weight financed emissions by portfolio weight and EVIC → **Position-level carbon footprint contributions**

## 5 · Intermediate Transformation Logic
**Methodology:** Position ESG Contribution
**Headline formula:** `ESG_contribution_i = w_i × (ESG_i - ESG_portfolio) / ESG_portfolio × 100`
**Standards:** ['MSCI ESG Fund Rating Methodology', 'SFDR Delegated Regulation Annex I', 'UNPRI Reporting Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).