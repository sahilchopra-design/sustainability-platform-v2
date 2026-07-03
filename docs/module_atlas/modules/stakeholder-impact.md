# Stakeholder Impact
**Module ID:** `stakeholder-impact` · **Route:** `/stakeholder-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Impact measurement platform covering all stakeholder groups using the S1000+ framework; quantifies social, environmental and economic outcomes attributable to corporate activities.

> **Business value:** Stakeholder impact analysis is required under ESRS double-materiality assessments; S1000+ provides the most granular multi-stakeholder accounting framework available.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `ESRS_MAP`, `KpiCard`, `LS_ENGAGE`, `LS_PORT`, `SDG_MAP`, `SECTOR_PROFILES`, `STAKEHOLDER_GROUPS`, `Section`, `Sel`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `totalPositive` | `Object.values(impactScores).reduce((s, g) => s + g.positive, 0);` |
| `totalNegative` | `Object.values(impactScores).reduce((s, g) => s + g.negative, 0);` |
| `netImpact` | `totalPositive - totalNegative;` |
| `totalChannels` | `STAKEHOLDER_GROUPS.reduce((s, g) => s + g.impact_channels.length, 0);` |
| `dataCoverage` | `Math.round((STAKEHOLDER_GROUPS.filter(g => impactScores[g.id]?.positive > 0).length / STAKEHOLDER_GROUPS.length) * 100);` |
| `portfolioValue` | `portfolio.reduce((s, c) => s + (c.market_cap_usd_mn \|\| 5000), 0);` |
| `posMn` | `Math.round(portfolioValue * sc.positive * 0.00008);` |
| `negMn` | `Math.round(portfolioValue * sc.negative * 0.00006);` |
| `radarData` | `STAKEHOLDER_GROUPS.map(g => ({` |
| `base` | `(impactScores[g.id]?.positive \|\| 40) - (impactScores[g.id]?.negative \|\| 25);` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });` |
| `noise` | `(sRand(seed(selectedCompany + g.id)) - 0.5) * 20;` |
| `net` | `sc.positive - sc.negative;` |
| `sorted` | `STAKEHOLDER_GROUPS.map(g => ({ ...g, score: (profile[g.id] \|\| 50) + Math.round((sRand(s + seed(g.id)) - 0.5) * 15) })).sort((a, b) => b.score - a.scor` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `ESRS_MAP`, `STAKEHOLDER_GROUPS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Stakeholder Groups Assessed | — | S1000+ Framework | Number of distinct stakeholder cohorts evaluated including employees, communities, suppliers, investors. |
| Positive Impact Score | — | IMS Engine | Aggregate positive impact rating across all stakeholder groups and material topics. |
| Negative Impact Coverage | — | Double Materiality Audit | Proportion of identified negative impacts with active mitigation measures in place. |
- **Stakeholder Surveys, Operational Data, ESG Assessments** → S1000+ scoring engine + SDG alignment mapping → **Impact materiality matrix, ESRS social disclosures, SDG contribution report**

## 5 · Intermediate Transformation Logic
**Methodology:** Impact Materiality Score
**Headline formula:** `IMS = Σ (Severity × Scale × Likelihood) / Stakeholder Weight`
**Standards:** ['S1000+ Standard 2023', 'GRI 3 Material Topics']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).