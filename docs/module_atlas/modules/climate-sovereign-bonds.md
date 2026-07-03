# Climate Sovereign Bonds
**Module ID:** `climate-sovereign-bonds` · **Route:** `/climate-sovereign-bonds` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses sovereign green, sustainability, and sustainability-linked bond issuances for use of proceeds alignment, NDC consistency, and credit-adjusted green premium (greenium) quantification.

> **Business value:** Provides fixed income investors and sovereign debt analysts with rigorous tools to evaluate climate sovereign bonds on both financial and impact dimensions, supporting green portfolio allocation decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_TYPES`, `COLORS`, `CREDIT_RISK_DATA`, `GREENIUM_DATA`, `ISSUERS`, `KpiCard`, `MARKET_TREND`, `RATINGS`, `REGIONS`, `REGULATORY_STANDARDS`, `SDG_ALLOCATION`, `TABS`, `TYPES_F`, `YIELD_CURVE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YIELD_CURVE` | `['2Y', '3Y', '5Y', '7Y', '10Y', '15Y', '20Y', '30Y'].map((t, i) => ({` |
| `GREENIUM_DATA` | `ISSUERS.filter(b => b.rating.startsWith('AA') \|\| b.rating.startsWith('AAA')).slice(0, 14).map((b, i) => ({` |
| `CREDIT_RISK_DATA` | `ISSUERS.slice(0, 20).map((b, i) => ({` |
| `REGIONS` | `['All', 'Europe', 'Asia-Pacific', 'Latin America', 'Africa', 'North America'];` |
| `TYPES_F` | `['All', ...BOND_TYPES.map(b => b.type)];` |
| `total` | `filtered.reduce((s, b) => s + b.outstanding, 0);` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_TYPES`, `COLORS`, `ISSUERS`, `RATINGS`, `REGIONS`, `REGULATORY_STANDARDS`, `SDG_ALLOCATION`, `TABS`, `TYPES_F`, `YIELD_CURVE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sovereign Green Bond Issuance (2023) | — | OECD Green Bond Monitor 2023 | Total sovereign green, social, and sustainability bond issuance in 2023 across 40+ issuing governments. |
| Average Sovereign Greenium | — | BIS 2021 / OECD 2023 | Range of yield concession on sovereign green bonds versus conventional comparators across primary markets. |
- **Bond prospectuses, yield curve data, NDC frameworks, post-issuance impact reports** → Use of proceeds alignment scoring, greenium calculation, issuer credibility assessment → **Bond league tables, greenium time series, NDC alignment heat maps**

## 5 · Intermediate Transformation Logic
**Methodology:** Greenium
**Headline formula:** `Greenium = YTM(Conventional) – YTM(Green)`
**Standards:** ['BIS Working Paper 2021', 'OECD Green Bond Monitor 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).