# Transition Planning Hub
**Module ID:** `transition-planning-hub` · **Route:** `/transition-planning-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated climate transition planning platform consolidating scenario analysis, target setting, capital planning, supply chain decarbonisation and stakeholder communication into a single workflow.

> **Business value:** Integrated transition planning hubs reduce plan development time by 50% and improve inter-module consistency; key requirement for ISSB IFRS S2 and CSRD ESRS E1 compliance from 2024–2025.

**How an analyst works this module:**
- Establish baseline emissions and transition gap
- Model decarbonisation pathways under multiple scenarios
- Set science-based targets and interim milestones
- Align capital planning and supply chain programmes
- Communicate plan to investors, regulators and employees

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACT_GRADES`, `ANALYSTS`, `COMPANIES`, `COMPANY_NAMES`, `CRED_TIERS`, `PERIODS`, `PIE_COLORS`, `PRIORITIES`, `REPORT_SECTIONS`, `SECTORS`, `STAGES`, `STAGE_COLORS`, `SUB_MODULES`, `TABS`, `TOP_OPPS`, `TOP_RISKS`, `TPT_STATUSES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SUB_MODULES` | 6 | `icon` |
| `TOP_RISKS` | 6 | `text`, `severity`, `sector` |
| `TOP_OPPS` | 6 | `text`, `impact`, `sector` |

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
| `pipelineStats` | `useMemo(() => { const byStage = STAGES.map(s => ({ stage: s, count: engagements.filter(e => e.stage === s).length }));` |
| `byPriority` | `PRIORITIES.map(p => ({ priority: p, count: engagements.filter(e => e.priority === p).length }));` |
| `scatterData` | `useMemo(() => SECTORS.map((sec, i) => {` |
| `boardQuarterlyData` | `useMemo(() => { return ['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026'].map((q, i) => ({ quarter: q, readiness: Math.round(38 + i * 6 + sr(i * 71) * 5), tptCoverage: Math.round(20 + i * 8 + sr(i * 73) * 4), gfanzPct: Math.round(30 + i * 5 + sr(i * 79) * 6), nzPct: Math.round(35 + i * 7 + sr(i * 83) * 3), credibility: Math.round(40 + i ` |
| `rows` | `COMPANIES.map(c => [c.name, c.sector, c.tptStatus, c.actGrade, c.gfanzAligned ? 'Yes' : 'No', c.nzCommitted ? 'Yes' : 'No', c.credibilityTier, c.readiness]);` |
| `csv` | `[headers, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `tptDistribution` | `useMemo(() => TPT_STATUSES.map(s => ({` |
| `prevVal` | `typeof k.value === 'string' && !isNaN(parseFloat(k.value)) ? (parseFloat(k.value) - parseFloat(k.delta)).toFixed(1) : '--';` |
| `pct` | `((count / 150) * 100).toFixed(1);` |
| `curr` | `boardQuarterlyData[boardQuarterlyData.length - 1];` |
| `prev` | `boardQuarterlyData[boardQuarterlyData.length - 2];` |

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
**Frontend seed datasets:** `ACT_GRADES`, `ANALYSTS`, `COMPANY_NAMES`, `CRED_TIERS`, `PERIODS`, `PIE_COLORS`, `PRIORITIES`, `REPORT_SECTIONS`, `SECTORS`, `STAGES`, `STAGE_COLORS`, `SUB_MODULES`, `TABS`, `TOP_OPPS`, `TOP_RISKS`, `TPT_STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Transition Readiness Index | — | TRI Engine | Composite transition readiness score across all five dimensions; 75+ is considered transition-ready by institutional investors. |
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

**GET /api/v1/transition-plan/ref/gfanz-components** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['gfanz_components'], 'n_keys': 1}`

**GET /api/v1/transition-plan/ref/iigcc-nzif** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['iigcc_nzif_steps'], 'n_keys': 1}`

**GET /api/v1/transition-plan/ref/regulatory-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulatory_timeline'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Readiness Index
**Headline formula:** `TRI = Σ (Module Score × Weight) / 5`

Equal-weighted composite of five transition readiness dimensions: ambition, capital, operations, supply chain, and stakeholder engagement.

**Standards:** ['GFANZ Transition Finance Frameworks 2023', 'SBTi Corporate NZS 2021']
**Reference documents:** GFANZ Transition Finance Frameworks 2023; SBTi Corporate Net Zero Standard 2021; IEA NZE 2050 Pathway; CSRD ESRS E1 Climate Change

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

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry headlines a single **Transition
> Readiness Index (TRI) = "61/100"** computed as `TRI = Σ(Module Score × Weight) / 5` — an
> equal-weighted composite across 5 dimensions (ambition, capital, operations, supply chain,
> stakeholder engagement). **No such composite is computed anywhere in the code** (no `TRI` variable
> or 5-dimension weighted sum exists). What the page actually shows is a **10-card KPI dashboard**,
> each card an independent statistic over the same 150-company synthetic portfolio, with no single
> "TRI" figure aggregating them. The sections below document what the code actually computes.

### 7.1 What the module computes

150 synthetic companies (10 sectors × 15 each) are generated once via the seeded PRNG
`sr(s)=frac(sin(s+1)×10⁴)`, each carrying independent readiness, TPT status, ACT grade, GFANZ
alignment, net-zero commitment, and credibility-tier fields. `computeKPIs(period)` derives 10
headline statistics from this fixed population, adjusted by a **cosmetic period factor**:

```js
periodFactor = period==='Q' ? 1.0 : period==='YTD' ? 0.95 : 0.88   // arbitrary, not time-series-derived
avgCred = Σ readiness / 150
"Transition Readiness" = avgCred × periodFactor
"Credibility Score"    = avgCred × periodFactor × 0.85    // same underlying avgCred, arbitrary 0.85 scalar
```

### 7.2 Parameterisation

| Field | Formula | Provenance |
|---|---|---|
| `readiness` | `⌊20 + s×75⌋` where `s=sr(i×7+3)` | 20–95, synthetic |
| `tptStatus` | `TPT_STATUSES[⌊s×4⌋]` | Published/In Progress/Committed/Not Started, synthetic |
| `actGrade` | `ACT_GRADES[⌊s2×5⌋]` | A–E, synthetic |
| `gfanzAligned` | `s3 > 0.45` (~55% true) | Synthetic boolean |
| `nzCommitted` | `s4 > 0.35` (~65% true) | Synthetic boolean |
| `credibilityTier` | `CRED_TIERS[⌊s5×4⌋]` | High/Medium/Low/Very Low, synthetic |
| `periodFactor` | 1.0 / 0.95 / 0.88 for Q/YTD/1Y | **Fixed constants, not derived from any actual time-series** — selecting "1Y" simply multiplies every KPI by 0.88, mechanically producing a lower number for longer periods regardless of real trend direction |
| KPI card `delta` values | Hardcoded strings (e.g. `+3.2`, `+5.1`, `-3`) | **Static, not computed from any historical snapshot** — every KPI card always shows the same delta regardless of period selection or portfolio composition |

### 7.3 Calculation walkthrough

1. **KPI dashboard**: 10 cards computed from simple filters/means over the 150-company array
   (published-plan %, average ACT grade index, GFANZ %, net-zero %, average readiness, average
   green-capex ratio, laggard count, regulatory-readiness %), each scaled by the cosmetic
   `periodFactor`.
2. **Sector heatmap**: groups the 150 companies by sector, averaging readiness and computing
   TPT/GFANZ/NZ percentages per sector — a genuine (if synthetic-input) aggregation.
3. **Engagement pipeline**: 30 companies (every 5th company from the 150) assigned a stage
   (Identified→Resolved), priority, analyst, and next-action date via further independent PRNG
   draws; `pipelineStats` counts by stage and by priority.
4. **Board Report tab**: assembles the same KPI cards plus a fixed 5-quarter synthetic trend
   (`boardQuarterlyData`, each quarter's readiness/TPT/GFANZ/NZ/credibility figures independently
   `sr()`-seeded, not a rollout of the 150-company population over time) into a 6-section narrative
   report (`REPORT_SECTIONS`).
5. **Top Risks / Top Opportunities**: 5+5 hand-authored, sector-specific narrative bullets — static
   text, not generated from the underlying data (e.g. "Utilities sector 78% GFANZ aligned" is a
   fixed string, not a live computation against the 150-company `gfanzAligned` field for Utilities).

### 7.4 Worked example

For the default "Q" period (`periodFactor=1.0`):

| KPI | Formula | Illustrative outcome |
|---|---|---|
| Transition Readiness | `avgCred × 1.0` | ≈ mean of 150 uniform-ish draws in [20,95], so **≈57–58%** |
| Credibility Score | `avgCred × 1.0 × 0.85` | **≈49%** — always exactly 85% of the Transition Readiness figure, not an independently measured credibility construct |
| TPT Coverage | `published/150 × 100` | `TPT_STATUSES` has 4 roughly-equal categories, so **≈25%** |
| GFANZ Alignment | `gfanzCount/150 × 100` | `s3 > 0.45` → **≈55%** |
| NZ Commitment | `nzCount/150 × 100` | `s4 > 0.35` → **≈65%** |

Switching the period selector to "1Y" would multiply every one of the above by 0.88 uniformly —
e.g. Transition Readiness would drop to ≈51% — a mechanical artefact of the fixed period factor, not
a reflection of any actual year-over-year change in the underlying (static) 150-company population.

### 7.5 Companion analytics

- **Portfolio Transition View tab** — filterable/sortable table of all 150 companies with a radar
  chart per selected company across 5 sub-scores (Governance, Strategy, Metrics, Targets,
  Credibility — each independently `sr()`-seeded, unrelated to the company's top-level `readiness`).
- **Sub-module cards** — 5 tiles (Plan Builder, GFANZ Tracker, ACT Assessor, NZ Tracker,
  Credibility Engine) summarising the same 150-company population from different angles, positioned
  as if they were separate connected modules but all reading the same in-file array.

### 7.6 Data provenance & limitations

- **100% synthetic demo data.** All 150 companies, their sector/readiness/TPT/GFANZ/ACT/credibility
  fields, the 30-company engagement pipeline, and the 5-quarter board trend are generated by
  `sr(s)=frac(sin(s+1)×10⁴)`.
- **No TRI composite exists** despite being the guide's headline metric — see the mismatch flag
  above. A user cannot obtain the "61/100" figure the guide describes from anything in this file.
- **Period selector is cosmetic**: the Q/YTD/1Y toggle applies a fixed multiplicative discount
  (1.0/0.95/0.88) to every KPI uniformly, rather than recomputing from period-specific underlying
  data — this could visually suggest a real trend where none is modelled.
- **KPI card deltas are hardcoded**, not computed — they never change regardless of period, filter,
  or (hypothetically) real data updates.
- **Top Risks/Opportunities are static narrative text**, not generated from the live filtered data,
  so they can become inconsistent with whatever the KPI cards or heatmap actually show.

### 7.7 Framework alignment

- **GFANZ** (Glasgow Financial Alliance for Net Zero): `gfanzAligned` boolean and the GFANZ Tracker
  sub-module reference real GFANZ alignment as a concept; no actual GFANZ commitment criteria are
  evaluated.
- **ACT methodology** (Assessing low-Carbon Transition, ADEME/CDP): the A–E grading scale used for
  `actGrade` matches ACT's real letter-grade convention, though grades here are randomly assigned
  rather than derived from ACT's actual sector benchmarking methodology.
- **SBTi Corporate Net-Zero Standard**: `nzCommitted` references net-zero commitment status
  generically; no SBTi target-validation logic is implemented.
- **UK TPT Disclosure Framework**: `tptStatus` categories (Published/In Progress/Committed/Not
  Started) reflect the real language used to describe TPT-aligned transition-plan disclosure
  maturity.

## 9 · Future Evolution

### 9.1 Evolution A — A real TRI composite from live sub-module data, killing the cosmetic period factor (analytics ladder: rung 1 → 2)

**What.** The §7 flag: the guide's headline Transition Readiness Index (`TRI = Σ(Module Score × Weight)/5`, "61/100") is not computed anywhere — the page shows 10 independent KPI cards over 150 `sr()`-seeded companies, with three documented deceptions (§7.6): the Q/YTD/1Y period selector applies a fixed cosmetic multiplier (1.0/0.95/0.88) to every KPI rather than recomputing, "Credibility Score" is just `Transition Readiness × 0.85` (always exactly 85%, not an independent construct), and KPI card deltas are hardcoded strings that never change. This is a hub whose whole premise (integrating 5 dimensions into one index) is unimplemented.

**How.** (1) Implement the actual TRI: since the module shares `transition_plan_engine` with `transition-plan-builder` (§6) and that engine computes real 6-framework scores, aggregate them into the 5-dimension weighted composite the guide specifies. (2) Delete the cosmetic `periodFactor` — either compute period-over-period from real snapshots or remove the selector until snapshot history exists (§7.6 warns it fabricates a trend). (3) Make "Credibility Score" an independent measure, not a fixed 0.85 scalar of readiness. (4) Compute KPI deltas from an actual prior-period snapshot instead of hardcoded strings. (5) Generate Top Risks/Opportunities from the live filtered data (currently static text that can contradict the KPI cards, §7.3).

**Prerequisites.** Real assessed-company data (via the shared engine's `/assess`) replacing the 150 synthetic rows; a snapshot store for period comparisons. Blast radius touches `transition-plan-builder` via the shared engine. **Acceptance:** a real TRI figure exists and equals its weighted dimension rollup; the period selector recomputes from data or is removed; deltas move when the portfolio changes.

### 9.2 Executive-desk copilot for transition-plan portfolio oversight (LLM tier 2)

**What.** This hub's user is a portfolio-level overseer (§1: consolidating plan development across companies). A copilot answers "which sectors lag on TPT publication?", "draft the board-report transition section for Q2", and "which 10 holdings most need engagement?" — computing over the real assessed-company set and, at tier 2, calling the shared engine's assessment endpoints.

**How.** This is the roadmap's tier-3 desk-orchestration pattern applied within one hub: the copilot routes across the 5 sub-modules (Plan Builder, GFANZ Tracker, ACT Assessor, NZ Tracker, Credibility Engine) that today all read one in-file array but post-Evolution-A read real per-company assessments. Grounding corpus is this Atlas record plus the shared engine's 8 green reference GETs (`ref/scoring-rubrics`, `ref/regulatory-timeline`, etc.). Board-report drafting is the highest-value output — the copilot assembles the 6-section narrative from computed KPIs, replacing the current hardcoded deltas and static risk bullets with engine-sourced figures, every number provenance-traced. Pre-Evolution-A, it must label all portfolio statistics as synthetic (§7.6) and refuse to quote a "TRI" that doesn't exist.

**Prerequisites (hard).** Evolution A's real TRI and live data — a board report built on cosmetic period factors and hardcoded deltas would mislead the actual board. **Acceptance:** every board-report figure traces to a computed KPI or engine tool call; sector-lag claims reproduce from the live `tptStatus` field; the copilot refuses the guide's phantom "61/100 TRI" until it's real.