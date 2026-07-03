# EPR Compliance Intelligence
**Module ID:** `epr-compliance-intelligence` · **Route:** `/epr-compliance-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-EJ5 · **Sprint:** EJ

## 1 · Overview
8-jurisdiction EPR regulation landscape (EU PPWR/UK/France/Germany/USA/Canada/Japan/Korea), 26-company compliance scorecard with risk rating, gap vs EU PPWR targets, fee trend 2018–2026, regulatory timeline 2024–2030, and compliance risk assessment framework.

> **Business value:** Used by corporate regulatory affairs teams managing multi-jurisdiction EPR compliance, M&A teams conducting EPR due diligence, and fintech platforms building EPR management solutions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `COMPLIANCE_RADAR`, `EPR_REGULATIONS`, `FEE_TREND`, `GAP_DATA`, `KpiCard`, `Pill`, `TABS`, `TIMELINE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sortedCompanies` | `useMemo(() => [...COMPANIES].sort((a, b) => b[sortField] - a[sortField]), [sortField]);` |
| `avgCompliance` | `COMPANIES.reduce((a, b) => a + b.complianceScore, 0) / COMPANIES.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPLIANCE_RADAR`, `EPR_REGULATIONS`, `GAP_DATA`, `TABS`, `TIMELINE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU PPWR max penalty | `Per violation for large producers` | EU PPWR Commission Impact Assessment 2022 | Individual member state transposition may set higher penalties; France fines up to €75K/violation; Germany €50 |
| EPR compliance rate (EU avg) | `PRO registration and fee payment compliance` | EXPRA EPR Compliance Survey 2023 | Registration compliance high (88%); data quality compliance lower (64%); recycled content verification lowest  |
| Global EPR fee revenue 2025E | `Total producer responsibility fee collection` | CEFLEX EPR Finance Report 2024 | Growing 28% YoY; EU accounts for ~45% of global EPR fees; UK EPR from 2025 adds ~$2Bn annually. |
- **EU PPWR + UK EPR 2023 + VerpackG + CA SB 54 + Federal EPR CA + Japan CPL + K-EPR** → Regulation landscape + company compliance scorecard + gap analysis + fee trend + regulatory timeline → **Corporate regulatory affairs, ESG analysts, M&A due diligence teams, and compliance fintech platforms**

## 5 · Intermediate Transformation Logic
**Methodology:** EPR Compliance Score
**Headline formula:** `Compliance_Score = (RC_achieved / RC_target × 40 + Collection_achieved / Collection_target × 35 + Reporting_quality × 25); Fee_Liability = Σ(Tonnage_j × EPR_Rate_j) across all jurisdictions; Penalty_Exposure = P(non-compliance) × Max_Penalty`
**Standards:** ['EU PPWR 2024', 'UK EPR Regulations 2023', 'EU Packaging Directive 94/62/EC']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).