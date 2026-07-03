# Regulatory Enforcement Monitor
**Module ID:** `regulatory-enforcement-monitor` · **Route:** `/regulatory-enforcement-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks ESG regulatory enforcement actions, fines, and sanctions globally, identifying sector exposure to supervisory scrutiny and greenwashing risk.

> **Business value:** Provides real-time regulatory enforcement intelligence, enabling compliance and legal teams to proactively manage greenwashing risk and benchmark against peer actions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTION_TYPES`, `ENFORCEMENT_ACTIONS`, `ENTITY_NAMES_200`, `KpiCard`, `PORTFOLIO_HOLDINGS`, `REGULATORS_25`, `SECTORS`, `STATUSES`, `TABS`, `VIOLATION_CATEGORIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACTION_TYPES` | `['Fine', 'Suspension', 'Cease-and-Desist', 'Consent Order', 'Criminal Referral', 'Mandatory Audit', 'Public Censure', 'License Revocation'];` |
| `VIOLATION_CATEGORIES` | `['Greenwashing', 'Failure-to-Disclose', 'Data Falsification', 'ESG Rating Manipulation', 'Climate Commitment Breach', 'Proxy Voting Failure', 'Product` |
| `regIdx` | `Math.floor(sr(i * 7 + 4000) * 25);` |
| `sectorIdx` | `Math.floor(sr(i * 11 + 4000) * 10);` |
| `actionTypeIdx` | `Math.floor(sr(i * 13 + 4000) * 8);` |
| `violationIdx` | `Math.floor(sr(i * 17 + 4000) * 10);` |
| `fineUSD` | `Math.round((sr(i * 19 + 4000) * 150 + 0.5) * 1e6 * (REGULATORS_25[regIdx].avgFineM / 50));` |
| `year` | `2018 + Math.floor(sr(i * 23 + 4000) * 6);` |
| `quarter` | `1 + Math.floor(sr(i * 29 + 4000) * 4);` |
| `statusIdx` | `Math.floor(sr(i * 31 + 4000) * 5);` |
| `deterrenceScore` | `Math.round(sr(i * 37 + 4000) * 80 + 10);` |
| `sectorIdx` | `Math.floor(sr(p * 59 + 5000) * 10);` |
| `complianceScore` | `Math.round(sr(p * 61 + 5000) * 70 + 20);` |
| `actions` | `ENFORCEMENT_ACTIONS.filter(a => a.portfolioHolding && Math.floor(sr(p * 67 + 5000) * 200) === a.id % 200).length;` |
| `weight` | `+(sr(p * 71 + 5000) * 0.05 + 0.005).toFixed(4);` |
| `label` | ``${yr}-Q${q}`;` |
| `violationDist` | `useMemo(() => VIOLATION_CATEGORIES.map(vc => ({` |
| `regulatorStats` | `useMemo(() => REGULATORS_25.map(r => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTION_TYPES`, `REGULATORS_25`, `SECTORS`, `STATUSES`, `TABS`, `VIOLATION_CATEGORIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Enforcement Actions (YTD) | — | Regulatory Database | Total ESG-related enforcement actions recorded across monitored jurisdictions year-to-date. |
| Total Fines (€M, YTD) | — | Enforcement Register | Cumulative fines issued for ESG-related violations across EU, UK, and US jurisdictions. |
| Greenwashing Actions (%) | — | Action Classification | Share of enforcement actions specifically categorised as greenwashing or misleading ESG disclosure. |
- **Regulatory press releases + enforcement databases + NLP classification** → Action classification; fine aggregation; sector exposure scoring → **Enforcement monitor dashboard with sector exposure and alert feeds**

## 5 · Intermediate Transformation Logic
**Methodology:** Enforcement Exposure Score
**Headline formula:** `EE = Σ(fine_amountᵢ × sector_relevanceᵢ) / peer_count`
**Standards:** ['ESMA Greenwashing Progress Report (2023)', 'FCA ESG Enforcement Database']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).