# ESG Screener
**Module ID:** `esg-screener` · **Route:** `/esg-screener` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-provider ESG screening engine with positive/negative/norms-based filters. Covers MSCI, Sustainalytics, ISS ESG, and custom rule sets. Exclusion list management and audit trail.

> **Business value:** ESG screening is the first step in sustainable investment. This engine automates screening across multiple data providers and frameworks, reducing manual effort while maintaining full audit trail for client reporting and regulatory compliance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEFAULT_NEG`, `SECTOR_COLORS`, `T_RISK_ORDER`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `scores` | `bySector[sec].sort((a, b) => b - a);` |
| `failCount` | `screenedResults.length - passCount;` |
| `headers` | `'Company,Ticker,Exchange,Sector,T-Risk,DQS,GHG Intensity,Status,Reasons';` |
| `rows` | `displayRows.map(r => `"${r.name}","${r.ticker \|\| ''}","${r._displayExchange \|\| r.exchange \|\| ''}","${r.sector \|\| ''}","${r.transition_risk \|\| ''}","${` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Negative Screens | — | Platform | Weapons, tobacco, coal, gambling, adult content, etc. |
| Pass Rate | — | Typical universe | Fraction of investment universe passing all screens |
| Controversy Exclusions | — | News feeds | Auto-exclusion on severe controversy flags |
- **Company revenue data** → Threshold comparison → **Negative screen trigger**
- **ESG scores (MSCI/Sust.)** → Score threshold check → **Positive screen pass/fail**
- **Controversy flags** → Norms assessment → **Global Compact alignment**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG screening rule engine
**Headline formula:** `Pass = (∀ neg_filter: !triggered) AND (score ≥ min_threshold) AND (∀ norms: compliant)`
**Standards:** ['MSCI ESG Research', 'Sustainalytics', 'UN Global Compact']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).