# ML Governance Dashboard
**Module ID:** `ml-governance-dashboard` · **Route:** `/ml-governance-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CX6 · **Sprint:** CX

## 1 · Overview
Model inventory with PSI drift detection, SHAP explainability, Fed SR 11-7 compliance, and EU AI Act alignment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPLIANCE_CHECKLIST`, `Card`, `EU_AI_ACT`, `KPI`, `MODELS`, `PERF_TREND`, `SHAP_FEATURES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PERF_TREND` | `['2025-Q1','2025-Q2','2025-Q3','2025-Q4','2026-Q1'].map((q,i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPLIANCE_CHECKLIST`, `EU_AI_ACT`, `MODELS`, `PERF_TREND`, `SHAP_FEATURES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Models Deployed | — | Registry | Active production models |
| PSI Threshold | — | Industry standard | Drift detection trigger |
| SR 11-7 Compliance | — | Self-assessment | 87.5% checklist complete |
| EU AI Act | — | Assessment | 87.5% requirement alignment |

## 5 · Intermediate Transformation Logic
**Methodology:** Model risk governance
**Headline formula:** `PSI = Σ((Actual_i - Expected_i) × ln(Actual_i / Expected_i))`
**Standards:** ['Fed SR 11-7', 'EU AI Act', 'Lundberg (2017)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).