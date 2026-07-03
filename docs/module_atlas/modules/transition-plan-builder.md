# Transition Plan Builder
**Module ID:** `transition-plan-builder` · **Route:** `/transition-plan-builder` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ISSB IFRS S2 and TCFD-aligned climate transition plan builder enabling companies to construct, document and stress-test comprehensive transition plans with science-based milestones and governance commitments.

> **Business value:** IFRS S2 mandatory from FY2024 for ISSB-adopting jurisdictions; transition plan quality is the most scrutinised element by institutional investors and proxy advisors in 2024–2025 reporting cycle.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `GapAnalysis`, `PRE_PLANS`, `PlanBuilderWizard`, `PortfolioReadiness`, `QUARTERS`, `SECTORS`, `SECTOR_TEMPLATES`, `STEP_FIELDS`, `SectorTemplates`, `TPT_ELEMENTS`, `TPT_STEPS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `name` | `prefixes[Math.floor(s2*prefixes.length)]+' '+suffixes[Math.floor(s3*suffixes.length)];` |
| `readiness` | `Math.floor(s4*100);` |
| `elements` | `TPT_ELEMENTS.map((_,ei)=>{const v=sr(i*31+ei*7);return v>0.3?Math.floor(v*100):0;});` |
| `qData` | `QUARTERS.map((_,qi)=>Math.floor(sr(i*41+qi*11)*100));` |
| `pill` | `(color,text)=>({display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,border:`1px solid ${c` |
| `totalFields` | `TPT_STEPS.reduce((acc,s)=>acc+STEP_FIELDS[s].length,0);` |
| `handleBack` | `()=>{if(step>0)setStep(step-1);};` |
| `sectorMetrics` | `useMemo(()=>SECTORS.map((s,i)=>{` |
| `capexChart` | `useMemo(()=>sectorMetrics.map(m=>({name:m.sector.length>8?m.sector.substring(0,8)+'..':m.sector,capex:m.capex,companies:m.companies})),[sectorMetrics]` |
| `mul` | `sortDir==='asc'?1:-1;` |
| `top10` | `useMemo(()=>[...filtered].sort((a,b)=>b.readiness-a.readiness).slice(0,10),[filtered]);` |
| `bottom10` | `useMemo(()=>[...filtered].sort((a,b)=>a.readiness-b.readiness).slice(0,10),[filtered]);` |
| `sectorAvg` | `useMemo(()=>SECTORS.map(s=>{` |
| `quarterlyTrend` | `useMemo(()=>QUARTERS.map((q,qi)=>({` |
| `rows` | `filtered.map(c=>`"${c.name}","${c.sector}","${c.country}",${c.readiness},"${c.sbtiStatus}","${c.revenue}",${c.emissionsScope1},${c.emissionsScope2}`).` |
| `blob` | `new Blob([header+rows],{type:'text/csv'});` |

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
**Frontend seed datasets:** `QUARTERS`, `SECTORS`, `TABS`, `TPT_ELEMENTS`, `TPT_STEPS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Plan Completeness | — | TPCI Engine | Current transition plan completeness score against IFRS S2 mandatory disclosure requirements. |
| Science-Based Milestones | — | Plan Builder | Number of interim science-based milestones defined between current year and 2050 net zero target. |
| Capital Aligned to Plan | — | Capex Analysis | Proportion of 5-year capex budget allocated to activities consistent with transition plan objectives. |
- **Corporate Strategy Documents, Capex Budgets, SBTi Commitments, NGFS Pathways** → Plan completeness engine + scenario stress-test + IFRS S2 mapping → **IFRS S2 transition plan disclosures, TCFD reports, investor-grade plan summaries**

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
**Methodology:** Transition Plan Completeness Index
**Headline formula:** `TPCI = Populated Sections / Required Sections × 100`
**Standards:** ['IFRS S2 Appendix A', 'TCFD Guidance on Transition Plans 2021']

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
| `transition-planning-hub` | engine:transition_plan_engine |