# Regulatory Stress Submission
**Module ID:** `regulatory-stress-submission` · **Route:** `/regulatory-stress-submission` · **Tier:** B (frontend-computed) · **EP code:** EP-CH6 · **Sprint:** CH

## 1 · Overview
Regulatory submission workflow with ECB/BoE/APRA pre-formatted templates, data quality checks, audit trail, and approval workflow.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_TRAIL`, `BOE_TEMPLATE_FIELDS`, `Card`, `DATA_QUALITY_CHECKS`, `ECB_TEMPLATE_FIELDS`, `Pill`, `Ref`, `SUBMISSION_HISTORY`, `SUBMISSION_TRACKER`, `StatusBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `total` | `submissions.reduce((s, sub) => s + sub.completeness, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AUDIT_TRAIL`, `BOE_TEMPLATE_FIELDS`, `DATA_QUALITY_CHECKS`, `ECB_TEMPLATE_FIELDS`, `SUBMISSION_HISTORY`, `SUBMISSION_TRACKER`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DQ Checks | — | Validation engine | Completeness, consistency, plausibility, etc. |
| Submission Deadlines | — | Regulatory calendar | ECB Apr, BoE Jun, APRA Sep |

## 5 · Intermediate Transformation Logic
**Methodology:** Template-based submission validation
**Headline formula:** `Completeness = FilledFields / RequiredFields; DQ = pass/warning/fail per check`
**Standards:** ['ECB Reporting Templates', 'BoE CBES Data Dictionary']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).