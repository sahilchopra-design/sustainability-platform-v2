# Private Credit
**Module ID:** `private-credit` · **Route:** `/private-credit` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG and climate integration framework for private credit origination, covering borrower ESG assessment, covenant design, and sustainability-linked loan pricing.

> **Business value:** Embeds ESG and climate risk assessment into private credit origination workflows, supporting SLL structuring and PCAF-aligned financed emissions reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CREDIT_PORTFOLIO_INIT`, `ESG_TIER_COLORS`, `LMA_PRINCIPLES`, `LS_KEY`, `PIE_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d=1) => n == null ? '-' : Number(n).toFixed(d);` |
| `fmtI` | `n => n == null ? '-' : Math.round(n).toLocaleString();` |
| `fmtM` | `n => n == null ? '-' : `$${Number(n).toFixed(1)}M`;` |
| `pct` | `n => n == null ? '-' : `${Number(n).toFixed(1)}%`;` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))]` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `SECTORS` | `[...new Set(CREDIT_PORTFOLIO_INIT.map(f => f.sector))].sort();` |
| `RATINGS` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC+','CCC'];` |
| `COUNTRIES` | `[...new Set(CREDIT_PORTFOLIO_INIT.map(f => f.country))].sort();` |
| `totalCommit` | `facilities.reduce((s, f) => s + f.commitment_mn, 0);` |
| `totalDrawn` | `facilities.reduce((s, f) => s + f.drawn_mn, 0);` |
| `wtdSpread` | `totalDrawn > 0 ? facilities.reduce((s, f) => s + f.spread_bps * f.drawn_mn, 0) / totalDrawn : 0;` |
| `avgESG` | `n > 0 ? facilities.reduce((s, f) => s + f.esg_score, 0) / n : 0;` |
| `esgLinked` | `facilities.filter(f => f.covenant_type === 'ESG-linked').length;` |
| `esgLinkedPct` | `n > 0 ? (esgLinked / n * 100) : 0;` |
| `totalEL` | `facilities.reduce((s, f) => s + f.el_mn, 0);` |
| `avgPD` | `n > 0 ? facilities.reduce((s, f) => s + f.pd_pct, 0) / n : 0;` |
| `avgLGD` | `n > 0 ? facilities.reduce((s, f) => s + f.lgd_pct, 0) / n : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `CREDIT_PORTFOLIO_INIT`, `CURRENCIES`, `FACILITY_TYPES`, `LMA_PRINCIPLES`, `PIE_COLORS`, `RATINGS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Due Diligence Score | — | Internal DD Framework | Composite ESG assessment score from pre-origination due diligence questionnaire. |
| Climate Risk Tier | — | Hazard Screening Tool | Borrower physical and transition risk classification from screening model. |
| SLL KPI Coverage (%) | — | Deal Registry | Percentage of new originations including at least one sustainability-linked pricing KPI. |
- **Borrower ESG data + deal terms + KPI targets** → ESG scoring; climate screening; SLL structuring analysis → **ESG assessment report + SLL KPI framework + pricing adjustments**

## 5 · Intermediate Transformation Logic
**Methodology:** Sustainability-Linked Margin Step
**Headline formula:** `δspread = KPI_miss × step_bps; KPI_hit × (–step_bps)`
**Standards:** ['LMA/APLMA/LSTA SLL Principles (2023)', 'PCAF Private Debt Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).