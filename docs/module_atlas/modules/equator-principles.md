# Equator Principles
**Module ID:** `equator-principles` · **Route:** `/equator-principles` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides a structured compliance workflow for EP IV (Equator Principles fourth edition) environmental and social due diligence in project finance transactions. Supports category assignment, ESAP tracking, stakeholder consultation documentation, and independent monitoring. Covers IFC Performance Standards PS1â€“PS8 and Equator Principles 1â€“10 for projects above the financial threshold in all industry sectors.

> **Business value:** Enables project finance lenders and EPFIs to manage EP IV compliance workflows across complex multi-lender transactions, reduce reputational and covenant risk from ESAP non-compliance, and satisfy EP10 public reporting obligations with minimal administrative overhead.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Alert`, `Btn`, `CHART_COLORS`, `COUNTRIES`, `Card`, `CategoryBadge`, `Checkbox`, `DESIGNATED_COUNTRIES`, `EP_PRINCIPLES`, `ESIA_STAGES`, `IFC_PS`, `Inp`, `KpiCard`, `SECTORS`, `Sel`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8000';` |
| `medRisk` | `['Manufacturing', 'Agriculture', 'Transport', 'Water/Sanitation'];` |
| `res` | `await fetch(`${API}/api/v1/export-credit-esg/equator-principles`, {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COUNTRIES`, `DESIGNATED_COUNTRIES`, `EP_GROUPS`, `EP_PRINCIPLES`, `ESIA_STAGES`, `IFC_PS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EP Category (A/B/C) | — | Equator Principles IV Â§3 | Project risk category; Category A = significant adverse E&S impacts; drives assessment scope and disclosure re |
| ESAP Closure Rate (%) | — | EPFI Monitoring Reports | Proportion of ESAP action items closed vs. total; below 80% at financial close raises covenant breach risk. |
| Stakeholder Consultation Events | — | EP Principle 5 | Number of documented free, prior, and informed consultation events; mandatory for affected communities in Cate |
| IFC PS Compliance Score (%) | — | IFC Performance Standards | Percentage of applicable PS sub-requirements rated Compliant or Minor Non-Conformance in ESIA review. |
- **Project information memorandum and ESIA documents** → Extract and categorise E&S impacts against IFC PS framework; auto-classify EP category → **EP category assignment and PS compliance gap matrix**
- **ESAP tracker (action items, owners, deadlines)** → Monitor completion status; flag overdue high-severity items and generate lender alerts → **ESAP closure rate and covenant compliance dashboard**
- **Independent E&S consultant monitoring reports** → Ingest semi-annual reports; update PS compliance scores and ESAP status → **Compliance trend and EP10 annual disclosure package**

## 5 · Intermediate Transformation Logic
**Methodology:** ESAP Compliance Score
**Headline formula:** `ESAP_score = (Closed_Actions / Total_Actions) × 100 − Σ(Severity_i × Overdue_i)`
**Standards:** ['Equator Principles IV 2020', 'IFC Performance Standards 2012', 'IFC EHS Guidelines 2019']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).