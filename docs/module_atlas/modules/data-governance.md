# Data Governance Hub
**Module ID:** `data-governance` · **Route:** `/data-governance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages ESG data governance policies, stewardship workflows, data quality controls, and metadata standards across the sustainability data platform. Tracks data ownership, access controls, quality KPIs, and policy compliance to ensure reliable, auditable sustainability disclosures.

> **Business value:** Enables data stewards and sustainability teams to maintain the data quality standards needed for defensible regulatory disclosures, providing auditors and regulators with evidence that sustainability data is managed with appropriate governance and controls.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `DATA_FIELDS_CLASSIFICATION`, `DATA_OWNERS`, `DEFAULT_MATURITY`, `DEFAULT_VENDORS`, `GOVERNANCE_POLICIES`, `LS_EXCEPTIONS`, `LS_KEY`, `LS_MATURITY`, `LS_PORTFOLIO`, `LS_VENDOR`, `MATURITY_DIMS`, `QUANT_MODELS`, `REG_ALIGNMENT`, `TREND_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `today` | `new Date('2025-05-15');` |
| `DEFAULT_MATURITY` | `MATURITY_DIMS.map(d => ({ dimension: d, score: 3 }));` |
| `cmp` | `typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));` |
| `categories` | `useMemo(() => ['All', ...new Set(GOVERNANCE_POLICIES.map(p => p.category))], []);` |
| `cycleMonths` | `p.review_cycle === 'Quarterly' ? 3 : p.review_cycle === 'Semi-Annual' ? 6 : 12;` |
| `nextDue` | `new Date(rev); nextDue.setMonth(nextDue.getMonth() + cycleMonths);` |
| `cycleMonths` | `p.review_cycle === 'Quarterly' ? 3 : p.review_cycle === 'Semi-Annual' ? 6 : 12;` |
| `nextDue` | `new Date(rev); nextDue.setMonth(nextDue.getMonth() + cycleMonths);` |
| `auditFindings` | `QUANT_MODELS.reduce((s, m) => s + m.findings, 0);` |
| `policyCompliance` | `useMemo(() => GOVERNANCE_POLICIES.map(p => {` |
| `cycleMonths` | `p.review_cycle === 'Quarterly' ? 3 : p.review_cycle === 'Semi-Annual' ? 6 : 12;` |
| `nextDue` | `new Date(rev); nextDue.setMonth(nextDue.getMonth() + cycleMonths);` |
| `cycleMonths` | `p.review_cycle === 'Quarterly' ? 3 : p.review_cycle === 'Semi-Annual' ? 6 : 12;` |
| `nextDue` | `new Date(rev); nextDue.setMonth(nextDue.getMonth() + cycleMonths);` |
| `radarData` | `useMemo(() => maturity.map(m => ({ dimension: m.dimension, score: m.score, fullMark: 5 })), [maturity]);` |
| `maturityAvg` | `useMemo(() => maturity.reduce((s, m) => s + m.score, 0) / maturity.length, [maturity]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `DATA_FIELDS_CLASSIFICATION`, `DATA_OWNERS`, `DEFAULT_VENDORS`, `GOVERNANCE_POLICIES`, `MATURITY_DIMS`, `QUANT_MODELS`, `REG_ALIGNMENT`, `TABS`, `TREND_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Platform DQ Score | — | Internal DQ engine | Overall ESG data quality score across all data categories and sources |
| Data Completeness | — | Internal tracking | Proportion of required ESG data fields populated with non-null values across reporting period |
| Policy Compliance Rate | — | Governance audit | Percentage of data handling workflows compliant with platform governance policies |
| Open Data Quality Issues | — | Issue tracker | Number of unresolved DQ flags requiring steward resolution before disclosure |
| Data Lineage Coverage | — | Lineage tracker | Proportion of disclosed metrics with documented end-to-end data lineage from source to output |
- **All platform data sources and ESG databases** → Apply DQ rules per dimension (completeness, accuracy, timeliness, consistency) → **Data quality score per domain and metric**
- **Governance policy database** → Check workflows against policy requirements, flag violations → **Policy compliance rate and exception log**
- **User access log and permission registry** → Audit access patterns against data classification, flag anomalies → **Access control compliance report**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Data Quality Score
**Headline formula:** `DQ_score = 0.30×Completeness + 0.25×Accuracy + 0.25×Timeliness + 0.20×Consistency`
**Standards:** ['DAMA DMBOK2', 'EFRAG ESRS Data Quality Tiers', 'ISO 8000 Data Quality']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).