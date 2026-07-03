# Transition Planning Hub
**Module ID:** `transition-planning-hub` · **Route:** `/transition-planning-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated climate transition planning platform consolidating scenario analysis, target setting, capital planning, supply chain decarbonisation and stakeholder communication into a single workflow.

> **Business value:** Integrated transition planning hubs reduce plan development time by 50% and improve inter-module consistency; key requirement for ISSB IFRS S2 and CSRD ESRS E1 compliance from 2024–2025.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACT_GRADES`, `ANALYSTS`, `COMPANIES`, `COMPANY_NAMES`, `CRED_TIERS`, `PERIODS`, `PIE_COLORS`, `PRIORITIES`, `REPORT_SECTIONS`, `SECTORS`, `STAGES`, `STAGE_COLORS`, `SUB_MODULES`, `TABS`, `TOP_OPPS`, `TOP_RISKS`, `TPT_STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `dayOff` | `Math.floor(1 + s3 * 28);` |
| `avgAct` | `(COMPANIES.reduce((a, c) => a + ACT_GRADES.indexOf(c.actGrade), 0) / 150);` |
| `avgCred` | `COMPANIES.reduce((a, c) => a + c.readiness, 0) / 150;` |
| `avgGreenCapex` | `COMPANIES.reduce((a, c) => a + c.greenCapex, 0) / 150;` |
| `regReady` | `COMPANIES.reduce((a, c) => a + c.regReady, 0) / 150;` |
| `genSectorHeatmap` | `() => SECTORS.map((sec, i) => {` |
| `avgReady` | `cos.reduce((a, c) => a + c.readiness, 0) / cn;` |
| `tptPct` | `(cos.filter(c => c.tptStatus === 'Published').length / cn) * 100;` |
| `gfanzPct` | `(cos.filter(c => c.gfanzAligned).length / cn) * 100;` |
| `nzPct` | `(cos.filter(c => c.nzCommitted).length / cn) * 100;` |
| `byStage` | `STAGES.map(s => ({ stage: s, count: engagements.filter(e => e.stage === s).length }));` |
| `byPriority` | `PRIORITIES.map(p => ({ priority: p, count: engagements.filter(e => e.priority === p).length }));` |
| `scatterData` | `useMemo(() => SECTORS.map((sec, i) => {` |
| `rows` | `COMPANIES.map(c => [c.name, c.sector, c.tptStatus, c.actGrade, c.gfanzAligned ? 'Yes' : 'No', c.nzCommitted ? 'Yes' : 'No', c.credibilityTier, c.readi` |
| `csv` | `[headers, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `tptDistribution` | `useMemo(() => TPT_STATUSES.map(s => ({` |
| `prevVal` | `typeof k.value === 'string' && !isNaN(parseFloat(k.value)) ? (parseFloat(k.value) - parseFloat(k.delta)).toFixed(1) : '--';` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/transition-plan/assess` | `assess_transition_plan` | api/v1/routes/transition_plan.py |
| POST | `/api/v1/transition-plan/assess-targets` | `assess_targets` | api/v1/routes/transition_plan.py |
| POST | `/api/v1/transition-plan/assess-sector-pathway` | `assess_sector_pathway` | api/v1/routes/transition_plan.py |
| POST | `/api/v1/transition-plan/cross-framework-map` | `cross_framework_map` | api/v1/routes/transition_plan.py |
| POST | `/api/v1/transition-plan/csddd-compliance` | `csddd_compliance` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/tpt-framework` | `ref_tpt_framework` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/gfanz-components` | `ref_gfanz_components` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/iigcc-nzif` | `ref_iigcc_nzif` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/csddd-requirements` | `ref_csddd_requirements` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/esrs-e1-disclosures` | `ref_esrs_e1_disclosures` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/cdp-c4-questions` | `ref_cdp_c4_questions` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/cross-framework-mapping` | `ref_cross_framework_mapping` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/scoring-rubrics` | `ref_scoring_rubrics` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/sector-pathways` | `ref_sector_pathways` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/target-validation` | `ref_target_validation` | api/v1/routes/transition_plan.py |

### 2.3 Engine `transition_plan_engine` (services/transition_plan_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `TransitionPlanEngine.assess_transition_plan` | entity_name, sector, reporting_year, plan_data | Assess transition plan against all 6 frameworks. |
| `TransitionPlanEngine._assess_tpt` | plan_data |  |
| `TransitionPlanEngine._assess_gfanz` | plan_data |  |
| `TransitionPlanEngine._assess_iigcc` | plan_data |  |
| `TransitionPlanEngine._assess_csddd` | plan_data |  |
| `TransitionPlanEngine._assess_esrs_e1` | plan_data |  |
| `TransitionPlanEngine._assess_cdp_c4` | plan_data |  |
| `TransitionPlanEngine._score_dimension` | dimension, plan_data |  |
| `TransitionPlanEngine._avg_score` | assessment |  |
| `TransitionPlanEngine._calc_completeness` | plan_data |  |
| `TransitionPlanEngine._identify_gaps` | plan_data |  |
| `TransitionPlanEngine._build_roadmap` | result |  |
| `TransitionPlanEngine._assess_regulatory_readiness` | result |  |
| `TransitionPlanEngine.assess_target_credibility` | targets_data |  |
| `TransitionPlanEngine.assess_sector_pathway` | sector, current_metrics, target_year |  |
| `TransitionPlanEngine.map_cross_framework_datapoints` | plan_data |  |
| `TransitionPlanEngine.generate_csddd_compliance_report` | plan_data |  |
| `TransitionPlanEngine.get_tpt_framework` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ACT_GRADES`, `ANALYSTS`, `COMPANY_NAMES`, `CRED_TIERS`, `PERIODS`, `PIE_COLORS`, `PRIORITIES`, `REPORT_SECTIONS`, `SECTORS`, `STAGES`, `STAGE_COLORS`, `SUB_MODULES`, `TABS`, `TOP_OPPS`, `TOP_RISKS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Transition Readiness Index | — | TRI Engine | Composite transition readiness score across all five dimensions; 75+ is considered transition-ready by institu |
| Decarbonisation Pathways Modelled | — | Scenario Engine | Number of transition pathways modelled (NZE 2050, SDS, STEPS, Delayed Action). |
| Stakeholder Sign-off | — | Governance Tracker | Proportion of transition plan elements reviewed and approved by board or board sub-committee. |
- **Emissions Data, Capex Plans, Scenario Pathways, Stakeholder Engagement Records** → Multi-module integration + TRI computation + scenario modelling → **Transition planning dashboard, investor-grade plan documents, regulatory disclosures**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/transition-plan/ref/carbon-credit-quality** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['carbon_credit_quality_criteria'], 'n_keys': 1}`

**GET /api/v1/transition-plan/ref/cdp-c4-questions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cdp_c4_questions'], 'n_keys': 1}`

**GET /api/v1/transition-plan/ref/cross-framework-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework_mapping'], 'n_keys': 1}`

**GET /api/v1/transition-plan/ref/csddd-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['csddd_requirements'], 'n_keys': 1}`

**GET /api/v1/transition-plan/ref/esrs-e1-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esrs_e1_disclosures'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Readiness Index
**Headline formula:** `TRI = Σ (Module Score × Weight) / 5`
**Standards:** ['GFANZ Transition Finance Frameworks 2023', 'SBTi Corporate NZS 2021']

**Engine `transition_plan_engine` — extracted transformation lines:**
```python
score = round((provided / max(len(dps), 1)) * 100, 1)
score = round((provided_dps / max(total_dps, 1)) * 100, 1)
score = round((provided_dps / max(total_dps, 1)) * 100, 1)
score = round((provided / max(len(dps), 1)) * 100, 1)
score = round((provided / max(total, 1)) * 100, 1)
score = round((provided_dps / max(total_dps, 1)) * 100, 1)
ta.gap_to_pathway = round(((ta.reduction_pct - 50) / 50) * 100, 1)
result.gap_pct = round(((result.current_intensity - result.pathway_intensity_for_year) / result.pathway_intensity_for_year) * 100, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `transition_plan_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `transition-plan-builder` | engine:transition_plan_engine |