# Corporate Governance Analytics
**Module ID:** `corporate-governance` · **Route:** `/corporate-governance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses board quality, audit committee effectiveness, executive remuneration alignment with sustainability targets, and shareholder rights across portfolio companies. Benchmarks governance scores against ICGN principles and supports proxy voting decisions with quantitative governance risk flags.

> **Business value:** Enables governance analysts and engagement teams to identify companies with structural governance weaknesses that elevate long-term risk, support proxy voting decisions, and engage boards on remuneration alignment with climate and sustainability commitments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_INDICATORS`, `Badge`, `Btn`, `COLORS`, `COUNTRY_GOVERNANCE`, `COUNTRY_LABELS`, `DEFAULT_SECTOR`, `DIM_KEYS`, `GOV_FRAMEWORK`, `GOV_REGULATIONS`, `KpiCard`, `LS_GOV`, `LS_PORT`, `SECTOR_GOV_BASELINE`, `Section`, `SortIcon`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `esgBoost` | `((c.esg_score \|\| 50) - 50) * 0.3;` |
| `countryBoost` | `((cg.cpi_score \|\| 50) - 50) * 0.25;` |
| `noise` | `(sRand(s + di * 7) - 0.5) * 18;` |
| `overall` | `DIM_KEYS.reduce((acc, dk) => acc + dims[dk] * (GOV_FRAMEWORK[dk].weight / 100), 0);` |
| `boardIndep` | `clamp(Math.round(40 + sRand(s + 100) * 40), 20, 95);` |
| `ceoChairSplit` | `sRand(s + 101) > 0.35;` |
| `esgLinkedComp` | `clamp(Math.round(sRand(s + 102) * 35), 0, 40);` |
| `whistleblower` | `sRand(s + 103) > 0.2;` |
| `dataBreaches` | `Math.floor(sRand(s + 104) * 4);` |
| `taxHavens` | `Math.floor(sRand(s + 105) * 6);` |
| `corruptionIncidents` | `Math.floor(sRand(s + 106) * 3);` |
| `dualClass` | `sRand(s + 107) > 0.75;` |
| `poisonPill` | `sRand(s + 108) > 0.8;` |
| `sayOnPay` | `sRand(s + 109) > 0.25;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `GOV_REGULATIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Board Independence | — | Proxy filings | Percentage of board members classified as independent; ICGN recommends majority independence |
| Gender Diversity (Board) | — | Company reports | Proportion of board seats held by women; EU targets 40% for listed companies by 2026 |
| ESG in Executive LTI | — | Remuneration report | Percentage weighting of ESG/climate KPIs in CEO/CFO long-term incentive plan |
| CEO Pay Ratio | — | Annual report | Ratio of CEO total remuneration to median employee pay; >200× raises ISS concern |
| Governance QualityScore | — | ISS | ISS Governance QualityScore decile rank; 1 = highest governance quality |
- **Proxy filing and annual report data** → Parse board bios, extract independence/tenure/diversity metrics → **Board composition scorecard per company**
- **ISS/Glass Lewis governance databases** → Extract QualityScore, voting recommendations, remuneration flags → **Governance risk flags per company**
- **Remuneration report analysis** → Extract LTI plan structure, identify ESG KPI weighting → **Remuneration sustainability alignment score**

## 5 · Intermediate Transformation Logic
**Methodology:** Governance Quality Score
**Headline formula:** `GovScore = 0.30×Board + 0.25×Audit + 0.25×Remuneration + 0.20×Shareholder`
**Standards:** ['ICGN Global Governance Principles 2023', 'ISS Governance QualityScore', 'UK Corporate Governance Code']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).