# Human Rights Due Diligence
**Module ID:** `human-rights-dd` · **Route:** `/human-rights-dd` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
UN Guiding Principles on Business and Human Rights (UNGP) and EU CSDDD compliance. Covers salient rights identification, impact assessment, grievance mechanism review, and remediation tracking.

> **Business value:** The EU CSDDD creates mandatory HRDD obligations for large EU companies — civil liability for harm, penalties up to 5% of global turnover. This module provides the systematic process required to identify, prevent, and remediate adverse human rights and environmental impacts across the value chain.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BAR_COLORS`, `Badge`, `Btn`, `COUNTRY_NAMES`, `CSDDD_HR_ARTICLES`, `HEATMAP_COUNTRIES`, `HR_SALIENT_ISSUES`, `HumanRightsDDPage`, `KpiCard`, `MODERN_SLAVERY_REQS`, `REG_TIMELINE`, `SECTOR_RISK_PROFILES`, `Section`, `TOTAL_DD_WEIGHT`, `UNGP_DD_CHECKLIST`, `UNGP_PILLARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOTAL_DD_WEIGHT` | `UNGP_DD_CHECKLIST.reduce((s, c) => s + c.weight, 0);` |
| `fmt` | `n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n;` |
| `pct` | `n => n == null ? '-' : `${(n * 100).toFixed(0)}%`;` |
| `weight` | `c.weight_pct \|\| c.portfolio_weight \|\| 2 + (h % 6);` |
| `baseRisk` | `((forcedLabourRisk + childLabourRisk + foaRisk + ohsRisk) / 4) * 100 * sectorMult;` |
| `hrRiskScore` | `Math.min(100, Math.max(5, Math.round(baseRisk + (h % 15) - 7)));` |
| `ungpPct` | `ungpMax > 0 ? Math.round((ungpScore / ungpMax) * 100) : Math.max(15, 85 - hrRiskScore + (h % 20));` |
| `supplyChainRisk` | `Math.min(100, Math.max(10, hrRiskScore + (h % 20) - 10));` |
| `avgHR` | `(scoredHoldings.reduce((s, h) => s + h.hrRiskScore, 0) / scoredHoldings.length).toFixed(1);` |
| `avgUNGP` | `(scoredHoldings.reduce((s, h) => s + h.ungpPct, 0) / scoredHoldings.length).toFixed(0);` |
| `forcedExposure` | `(scoredHoldings.reduce((s, h) => s + h.forcedLabourRisk * (h.weight \|\| 2), 0) / scoredHoldings.reduce((s, h) => s + (h.weight \|\| 2), 0) * 100).toFixed` |
| `childExposure` | `(scoredHoldings.reduce((s, h) => s + h.childLabourRisk * (h.weight \|\| 2), 0) / scoredHoldings.reduce((s, h) => s + (h.weight \|\| 2), 0) * 100).toFixed(` |
| `avgSC` | `(scoredHoldings.reduce((s, h) => s + h.supplyChainRisk, 0) / scoredHoldings.length).toFixed(0);` |
| `grievancePct` | `((scoredHoldings.filter(h => h.hasGrievance).length / scoredHoldings.length) * 100).toFixed(0);` |
| `issueExposure` | `useMemo(() => HR_SALIENT_ISSUES.map(iss => {` |
| `totalWeight` | `exposed.reduce((s, h) => s + (h.weight \|\| 2), 0);` |
| `heatmapData` | `useMemo(() => HEATMAP_COUNTRIES.map(cc => {` |
| `rows` | `sortedHoldings.map(h => [h.company_name, h.isin, h.country, h.sector, h.hrRiskScore, h.ungpPct, h.forcedLabourRisk, h.childLabourRisk, h.topIssue, h.s` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BAR_COLORS`, `CSDDD_HR_ARTICLES`, `HEATMAP_COUNTRIES`, `HR_SALIENT_ISSUES`, `MODERN_SLAVERY_REQS`, `REG_TIMELINE`, `UNGP_DD_CHECKLIST`, `UNGP_PILLARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CSDDD Scope | — | EU CSDDD | Phase-in from 2027 for largest companies |
| Salient Rights Assessment | — | UNGP | International human rights standards |
| Remedy Mechanisms | — | UNGP Pillar 3 | Company-level grievance mechanism for rights holders |
- **Operations mapping** → Rights at risk identification → **Salient rights register**
- **Supply chain data** → Human rights hotspot analysis → **Value chain risk profile**
- **Grievance incidents** → Remediation action → **Rights impact mitigation**

## 5 · Intermediate Transformation Logic
**Methodology:** UNGP-aligned salient rights assessment
**Headline formula:** `SalientRisk = Impact_severity × Likelihood × Vulnerability_factor`
**Standards:** ['UN Guiding Principles on Business and Human Rights', 'EU CSDDD (CS3D)', 'OECD Due Diligence Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).