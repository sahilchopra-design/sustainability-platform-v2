# Transition Plan Builder
**Module ID:** `transition-plan-builder` · **Route:** `/transition-plan-builder` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ISSB IFRS S2 and TCFD-aligned climate transition plan builder enabling companies to construct, document and stress-test comprehensive transition plans with science-based milestones and governance commitments.

> **Business value:** IFRS S2 mandatory from FY2024 for ISSB-adopting jurisdictions; transition plan quality is the most scrutinised element by institutional investors and proxy advisors in 2024–2025 reporting cycle.

**How an analyst works this module:**
- Define net zero commitment and target year
- Set interim science-based milestones by decade
- Document governance structure and board accountability
- Map capital allocation to transition activities
- Stress-test plan against NGFS scenarios and disclose under IFRS S2

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
| `pill` | `(color,text)=>({display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});` |
| `readinessScore` | `useMemo(()=>{ const totalFields=TPT_STEPS.reduce((acc,s)=>acc+STEP_FIELDS[s].length,0);` |
| `handleBack` | `()=>{if(step>0)setStep(step-1);};` |
| `sectorMetrics` | `useMemo(()=>SECTORS.map((s,i)=>{` |
| `capexChart` | `useMemo(()=>sectorMetrics.map(m=>({name:m.sector.length>8?m.sector.substring(0,8)+'..':m.sector,capex:m.capex,companies:m.companies})),[sectorMetrics]);` |
| `mul` | `sortDir==='asc'?1:-1;` |
| `top10` | `useMemo(()=>[...filtered].sort((a,b)=>b.readiness-a.readiness).slice(0,10),[filtered]);` |
| `bottom10` | `useMemo(()=>[...filtered].sort((a,b)=>a.readiness-b.readiness).slice(0,10),[filtered]);` |
| `sectorAvg` | `useMemo(()=>SECTORS.map(s=>{` |
| `quarterlyTrend` | `useMemo(()=>QUARTERS.map((q,qi)=>({` |
| `rows` | `filtered.map(c=>`"${c.name}","${c.sector}","${c.country}",${c.readiness},"${c.sbtiStatus}","${c.revenue}",${c.emissionsScope1},${c.emissionsScope2}`).join('\n');` |
| `blob` | `new Blob([header+rows],{type:'text/csv'});` |
| `cellKey` | ``${c.id}-${qi}`;` |

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
| GET | `/api/v1/transition-plan/ref/carbon-credit-quality` | `ref_carbon_credit_quality` | api/v1/routes/transition_plan.py |
| GET | `/api/v1/transition-plan/ref/regulatory-timeline` | `ref_regulatory_timeline` | api/v1/routes/transition_plan.py |

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
| `TransitionPlanEngine.get_gfanz_components` |  |  |
| `TransitionPlanEngine.get_iigcc_nzif_steps` |  |  |
| `TransitionPlanEngine.get_csddd_requirements` |  |  |
| `TransitionPlanEngine.get_esrs_e1_disclosures` |  |  |
| `TransitionPlanEngine.get_cdp_c4_questions` |  |  |
| `TransitionPlanEngine.get_cross_framework_mapping` |  |  |
| `TransitionPlanEngine.get_scoring_rubrics` |  |  |
| `TransitionPlanEngine.get_sector_pathways` |  |  |
| `TransitionPlanEngine.get_target_validation_criteria` |  |  |
| `TransitionPlanEngine.get_carbon_credit_quality_criteria` |  |  |
| `TransitionPlanEngine.get_regulatory_timeline` |  |  |

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

**GET /api/v1/transition-plan/ref/gfanz-components** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['gfanz_components'], 'n_keys': 1}`

**GET /api/v1/transition-plan/ref/iigcc-nzif** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['iigcc_nzif_steps'], 'n_keys': 1}`

**GET /api/v1/transition-plan/ref/regulatory-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulatory_timeline'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Plan Completeness Index
**Headline formula:** `TPCI = Populated Sections / Required Sections × 100`

Percentage of mandatory transition plan sections complete per IFRS S2 and TCFD requirements; below 75% triggers gap alert.

**Standards:** ['IFRS S2 Appendix A', 'TCFD Guidance on Transition Plans 2021']
**Reference documents:** IFRS S2 Climate-related Disclosures 2023; TCFD Guidance on Transition Plans 2021; GFANZ Transition Plan Elements 2023; SBTi Corporate Net Zero Standard 2021

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

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Two distinct calculation modes coexist in this module: (1) a **genuinely computed** Transition Plan
Completeness Index for the interactive "Plan Builder Wizard," and (2) a **synthetic demo portfolio**
of 150 companies with independently-seeded readiness/element/quarterly scores used for gap analysis
and benchmarking. Both match the guide's stated `TPCI = Populated Sections / Required Sections × 100`
formula in spirit, but only the wizard actually computes it live from user input.

```js
// Wizard (live, user-driven):
readinessScore = min(100, round(filledFields / totalRequiredFields × 100))

// Demo portfolio (synthetic, sr()-seeded):
company.readiness = floor(sr(i×23+17) × 100)          // independent of company.elements
company.elements[k] = sr(i×31+k×7) > 0.3 ? floor(v×100) : 0   // per-TPT-element score, 30% chance of 0
```

### 7.2 Parameterisation

| Element | Structure | Provenance |
|---|---|---|
| `TPT_STEPS` | Ambition, Action, Accountability, Governance, Basis (5 steps, 4 fields each = 20 required fields) | Matches the UK Transition Plan Taskforce's real 5-pillar Disclosure Framework structure |
| `TPT_ELEMENTS` | 12 elements (Net Zero Target, Interim Milestones, Scope 1/2/3 Plans, CapEx/Revenue Alignment, Just Transition, Board Oversight, Risk Management, Metrics & KPIs, Verification) | Platform-curated checklist consistent with IFRS S2/TCFD transition-plan disclosure expectations |
| `SECTOR_TEMPLATES` | 10 sectors × {milestones, phase-out date, decarbonisation levers, capex estimate, baseline intensity} | Hand-authored, directionally realistic sector figures (e.g. Steel DRI-EAF pilot 2027, capex $3.8Bn/12yr, baseline intensity 1.85 tCO2/t-steel — broadly consistent with real steel-sector transition cost literature) |
| `STEP_FIELDS` | 4 input fields per TPT step (20 total), each `select`/`number`/`text` | Platform-designed wizard schema |
| 150 synthetic companies | sector, name, readiness (0–100), 12-element scores, 12-quarter tracking series, SBTi status, Scope 1/2 emissions | All `sr()`-seeded, generated once at module load |
| 30 `PRE_PLANS` | status (Draft/Submitted/Approved/Under Review), readiness (40–100), completed-steps count | Synthetic pipeline-tracking demo records |

### 7.3 Calculation walkthrough

1. **Wizard readiness score** (the only live-computed metric on the page): counts non-empty form
   fields across all 5 steps and 20 total required fields, expressed as a percentage — this is a
   genuine, correctly implemented completeness metric.
2. **Step validation**: `validateStep()` blocks navigation to the next step if any of that step's
   required fields are empty — enforces sequential completion.
3. **Sector template auto-fill**: selecting a sector in the wizard surfaces that sector's
   `SECTOR_TEMPLATES` milestones/levers/capex/intensity as reference context (not auto-populated
   into the form fields).
4. **150-company demo portfolio**: each company's top-level `readiness` (0–100) and its 12
   `elements` scores are drawn from **separate, unrelated PRNG seeds** — a company can show high
   overall readiness (e.g. 90) while having several individual TPT elements at 0 (30% chance each),
   because the two are not arithmetically linked (unlike the wizard, where readiness is *literally*
   the completion fraction).
5. **Gap Analysis tab**: for the demo portfolio, computes `top10`/`bottom10` companies by readiness,
   sector-level average readiness, and a 12-quarter portfolio-wide trend line (`quarterlyTrend`,
   averaging each company's `qData` per quarter).
6. **Portfolio Readiness tab**: sector heatmap of average readiness plus a capex-vs-readiness
   scatter, all over the synthetic 150-company set.

### 7.4 Worked example

**Wizard**: a user who has filled 14 of the 20 required fields across all 5 steps sees
`readinessScore = round(14/20 × 100) = 70%`.

**Demo portfolio, Company #1 (`i=0`)**:

| Step | Computation | Result |
|---|---|---|
| Sector | `⌊sr(3)×10⌋` | (per formula; sector name depends on exact `sr(3)` draw) |
| Top-level readiness | `⌊sr(23+17)×100⌋ = ⌊sr(40)×100⌋` | independent random 0–100 value |
| Element scores (12) | `sr(31+k×7) > 0.3 ? ⌊v×100⌋ : 0` for k=0..11 | ~70% of elements populated with a 0–100 score, ~30% forced to 0 |

Because the top-level `readiness` field and the 12 `elements` scores are drawn from unrelated seeds,
a company's headline readiness number in the Gap Analysis / Portfolio Readiness tabs should not be
read as a rollup of its element-level detail — they are two independent synthetic signals about the
same fictional company.

### 7.5 Companion analytics

- **Sector Templates tab** — displays the 10 hand-authored sector transition templates (milestones,
  phase-out timeline, capex, baseline intensity) as static reference content.
- **Plan pipeline** (`PRE_PLANS`) — 30 synthetic plan records with status/readiness/completed-steps,
  used to populate a "recent plans" list in the wizard.

### 7.6 Data provenance & limitations

- The **wizard's readiness score is the one genuinely useful, correctly-implemented calculation** in
  the module — it directly reflects user data-entry completeness, which is a legitimate (if basic)
  proxy for disclosure readiness.
- The **150-company demo portfolio is entirely synthetic** (`sr()`-seeded) and its two readiness
  signals (top-level score vs. per-element detail) are statistically independent of each other,
  which would be misleading if presented as real benchmarking data — the Gap Analysis and Portfolio
  Readiness tabs should be read as illustrative UI demonstrations, not real transition-readiness
  intelligence.
- Sector template figures (capex, baseline intensity, milestone years) are hand-authored
  approximations without per-figure source citations, though they are broadly consistent with
  publicly known industry decarbonisation cost estimates for each sector.

### 7.7 Framework alignment

- **UK Transition Plan Taskforce (TPT) Disclosure Framework**: the 5-step wizard structure
  (Ambition, Action, Accountability, Governance, Basis of preparation) is a faithful implementation
  of the TPT's actual 5-element framework structure, and the reporting-framework field options
  (TPT, TCFD, ISSB, CDP, GRI) correctly enumerate the real overlapping disclosure regimes a
  transition plan might be filed under.
- **IFRS S2 (ISSB) transition-plan disclosure requirements** and **TCFD Guidance on Transition
  Plans (2021)**: cited as governing standards; the wizard's field set (net-zero target year,
  scope coverage, interim targets, verification approach) covers the substance of what both
  standards require issuers to disclose.
- **NGFS/IEA scenario references** (in the "Basis" step's `scenario` field: IEA NZE 2050, NGFS
  Orderly/Disorderly): correct real scenario names used as selectable options, though no scenario
  modelling is actually performed on the selection.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the wizard to the 6-framework backend engine (analytics ladder: rung 1 → 3)

**What.** This module has a genuinely strong backend — `transition_plan_engine.py` scores a plan against all 6 frameworks (TPT, GFANZ, IIGCC NZIF, CSDDD, ESRS E1, CDP C4), with 17 mapped routes and 8 reference GETs tracing green. But §7.1 documents that the frontend only computes a basic field-completeness `readinessScore` in the wizard, and the 150-company Gap Analysis / Portfolio Readiness tabs are `sr()`-seeded with a documented incoherence: each company's top-level `readiness` and its 12 element scores are drawn from unrelated seeds, so a company can show 90% readiness with several TPT elements at 0 (§7.4). The rich `POST /assess`, `/assess-targets`, `/assess-sector-pathway`, `/csddd-compliance` engine capabilities aren't called.

**How.** (1) Wire the wizard's completed plan to `POST /transition-plan/assess` — replacing the naive field-count with the engine's real 6-framework completeness/gap scoring (`_calc_completeness`, `_identify_gaps`, `_build_roadmap`). (2) Add target-credibility and sector-pathway analysis via `/assess-targets` and `/assess-sector-pathway` (the engine computes `gap_to_pathway` against SBTi SDA). (3) Replace the synthetic 150-company portfolio with real assessed plans, or make each company's `readiness` an actual rollup of its element scores so the two signals cohere (§7.6). (4) Surface CSDDD compliance via `/csddd-compliance` — a real EU regulatory requirement the engine already handles.

**Prerequisites.** The `/assess` POST endpoints exercised (the 8 GETs trace green; POSTs weren't in the traced sample — verify live). Note the shared `transition_plan_engine` also powers `transition-planning-hub` (§6). **Acceptance:** the wizard produces a real 6-framework score, not a field count; company readiness equals its element rollup; CSDDD compliance is computed from plan data.

### 9.2 Evolution B — Transition-plan drafting and gap-closing copilot (LLM tier 2)

**What.** Building an IFRS S2 transition plan is the platform's highest-value LLM use case — a structured drafting + assessment workflow. The copilot guides a company through the TPT 5-pillar wizard, drafts disclosure text per pillar, runs `POST /assess` to score the draft against all 6 frameworks, and narrates the specific gaps ("your plan lacks the interim Scope 3 milestone ESRS E1 requires") with the roadmap to close them.

**How.** Tier 2 is exceptionally well-supported here: the engine exposes 8 reference GETs (all green) that are ideal grounding — `ref/tpt-framework`, `ref/esrs-e1-disclosures`, `ref/csddd-requirements`, `ref/scoring-rubrics`, `ref/cross-framework-mapping` — so the copilot cites exact disclosure requirements, and `POST /assess`/`/assess-targets` are the scoring tools. The no-fabrication contract fits: completeness and gap scores come from the engine, not LLM judgment; the copilot drafts qualitative narrative but every score and gap traces to a tool call. This is the roadmap's tier-3 report-render pattern in miniature — the report-studio modules become the layer that turns the LLM-drafted, engine-scored plan into an IFRS S2 filing.

**Prerequisites.** Evolution A's `/assess` wiring; a persisted plan record so drafts survive the session. **Acceptance:** every completeness/gap figure traces to an engine tool call; disclosure-requirement citations match the `ref/*` payloads; the copilot drafts narrative but never invents a framework score or a milestone the user didn't enter.