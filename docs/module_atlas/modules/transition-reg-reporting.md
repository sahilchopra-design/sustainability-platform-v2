# Transition Regulatory Reporting
**Module ID:** `transition-reg-reporting` · **Route:** `/transition-reg-reporting` · **Tier:** B (frontend-computed) · **EP code:** EP-CE3 · **Sprint:** CE

## 1 · Overview
TCFD 4-pillar disclosure suite with 11 requirements, ISSB S2 compliance tracker (Para 10-39), CSRD ESRS E1 gap analysis, scenario board narratives, metrics register with source module traceability, and multi-format export centre.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EMISSIONS_TREND`, `ISSB_ITEMS`, `METRICS_TABLE`, `NARRATIVES`, `TABS`, `TCFD_PILLARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `Math.round((complete / total) * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EMISSIONS_TREND`, `ISSB_ITEMS`, `METRICS_TABLE`, `TABS`, `TCFD_PILLARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| TCFD Completeness | `11/12 disclosures complete` | Self-assessment | Only S3 (scenario resilience) partially complete |
| ISSB S2 Completeness | `7/9 paragraph groups` | Self-assessment | Para 17 (scenario) and Para 33 (Scope 3) in progress |
| CSRD ESRS E1 Gaps | `Cross-walk analysis` | EFRAG | Transition plan (E1-1), energy mix (E1-5), and Scope 3 Cat 11 (E1-6) |
| Metrics Register | `With source module trace` | Platform data | Each metric linked to its computation module (EP-code reference) |

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-framework disclosure automation
**Headline formula:** `Completeness = Σ(completed_disclosures) / Σ(required_disclosures) per framework`
**Standards:** ['TCFD 2017+2021', 'ISSB IFRS S2', 'CSRD ESRS E1', 'SFDR RTS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).