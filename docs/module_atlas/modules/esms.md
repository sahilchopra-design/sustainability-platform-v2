# ESMS Platform
**Module ID:** `esms` · **Route:** `/esms` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Environmental and Social Management System platform supporting IFC Performance Standards compliance for project finance lenders, development finance institutions, and project sponsors. Provides a structured workflow for E&S policy development, impact screening, ESAP management, monitoring report intake, and grievance mechanism tracking. Aligns with IFC PS1â€“PS8, World Bank ESF, and ADB SPS requirements.

> **Business value:** Enables project finance lenders and sponsors to systematically manage IFC PS compliance obligations across project lifecycles, reduce disbursement risk from ESAP non-compliance, and demonstrate robust E&S governance to co-lenders, development finance partners, and ESG-mandated investors.

**How an analyst works this module:**
- Create project record and assign applicable IFC Performance Standards based on sector, geography, and impact category.
- Complete PS compliance matrix from ESIA findings and assign Compliant/Minor/Major status for each sub-requirement.
- Generate ESAP with corrective actions, owners, and milestones; track completion through construction and operations phases.
- Intake semi-annual independent monitoring reports; update compliance scores and trigger covenant breach alerts to lending syndicate.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRIES`, `Card`, `EP_SECTORS`, `ESMS_COMPONENTS`, `IFC_PS`, `Inp`, `KpiCard`, `MODULE_CODE`, `REGULATORY_FRAMEWORKS`, `REG_MATRIX`, `RISK_CATEGORIES`, `STATUS_OPTIONS`, `STATUS_SCORE`, `SectionTitle`, `Sel`, `TEMPLATES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 86 | `label` |
| `ESMS_COMPONENTS` | 17 | `name`, `desc`, `category` |
| `IFC_PS` | 9 | `name`, `requirements`, `components`, `gaps` |
| `TEMPLATES` | 9 | `desc`, `ps`, `pages` |
| `REGULATORY_FRAMEWORKS` | 7 | `name` |
| `ESMS_GROUPS` | 6 | `color`, `bg`, `border`, `ids` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `initComponents` | `() => ESMS_COMPONENTS.map(c => ({ ...c, status: 'Not Started', notes: '' }));` |
| `scores` | `components.map(c => STATUS_SCORE[c.status]);` |
| `avg` | `scores.reduce((a, b) => a + b, 0) / scores.length;` |
| `radarData` | `categories.map(cat => {` |
| `catAvg` | `catComps.length > 0 ? catComps.reduce((a, c) => a + STATUS_SCORE[c.status], 0) / catComps.length : 0;` |
| `barData` | `components.map(c => ({` |
| `months` | `pri === 'Critical' ? '1-3 months' : pri === 'High' ? '3-6 months' : '6-12 months';` |
| `groupComps` | `g.ids.map(id => components.find(c => c.id === id)).filter(Boolean);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `EP_SECTORS`, `ESMS_COMPONENTS`, `ESMS_GROUPS`, `IFC_PS`, `REGULATORY_FRAMEWORKS`, `RISK_CATEGORIES`, `STATUS_OPTIONS`, `TABS`, `TEMPLATES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESCS Overall (%) | — | IFC PS Audit | Weighted compliance score across all applicable PS sub-requirements; EP Category A projects require 90%+ at first review. |
| Major NC Count | — | ESIA/ESAP Audit | Number of unresolved Major Non-Conformances; any Major NC blocks disbursement per EP lender covenant. |
| Grievance Mechanism Response Rate (%) | — | IFC PS1 Â§28 | Proportion of community grievances receiving documented response within SLA (typically 30 days); IFC PS1 mandatory. |
| ESAP Completion Rate (%) | — | Monitoring Report | Proportion of Environmental and Social Action Plan items completed vs. schedule; covenant trigger if <80% at milestone. |
- **ESIA and ESAP documents** → Parse PS sub-requirements; classify compliance status from ESIA findings; auto-populate compliance matrix → **PS compliance matrix with Compliant/Minor/Major ratings and evidence references**
- **Independent monitoring reports (semi-annual)** → Ingest structured monitoring data; update ESAP closure status and PS compliance scores → **Updated ESCS, ESAP completion rate, and NC trend**
- **Grievance register (community complaints and company responses)** → Track grievance intake, categorisation, response, and resolution; compute SLA compliance rate → **Grievance resolution rate, average response time, and open grievance summary by PS category**

## 5 · Intermediate Transformation Logic
**Methodology:** E&S Compliance Score
**Headline formula:** `ESCS = (PS_Compliant + 0.5 × PS_Minor) / PS_Total × 100`

Scores each applicable IFC Performance Standard sub-requirement as Compliant, Minor Non-Conformance, or Major Non-Conformance. ESCS is the weighted completion ratio where Minor NC carries 50% weight and Major NC carries 0%. ESCS below 80% triggers mandatory corrective action plan before disbursement. Separate sub-scores are reported for each of PS1â€“PS8.

**Standards:** ['IFC Performance Standards 2012', 'World Bank ESF 2018', 'Equator Principles IV 2020']
**Reference documents:** IFC Performance Standards on Environmental and Social Sustainability 2012; World Bank Environmental and Social Framework 2018; ADB Safeguard Policy Statement 2009; Equator Principles IV 2020; IFC Environmental, Health, and Safety General Guidelines 2019

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **E&S Compliance Score**
> `ESCS = (PS_Compliant + 0.5·PS_Minor)/PS_Total × 100` with Compliant / Minor-NC / Major-NC ratings
> per IFC PS sub-requirement, disbursement blocking at Major NC, grievance-SLA and ESAP-completion
> KPIs. **The code implements none of that.** What the page actually runs is a **CMMI-style maturity
> self-assessment** over 16 ESMS components using a 4-level status scale, aggregated to a simple mean.
> There is no Compliant/Minor/Major taxonomy, no NC blocking logic, no grievance or ESAP tracker with
> live SLA computation. Documented below as coded.

### 7.1 What the module computes

Each of the 16 `ESMS_COMPONENTS` is assigned a workflow status; the status maps to a numeric score:

```js
STATUS_SCORE = { 'Not Started':0, 'In Progress':33, 'Implemented':67, 'Certified':100 }
scores = components.map(c => STATUS_SCORE[c.status])
avg    = scores.reduce((a,b)=>a+b,0) / scores.length      // overall ESMS maturity 0–100
```

The overall `avg` is bucketed into a 5-tier CMMI-like maturity ladder:

```js
maturityLevel(s): s≥91 Optimized · s≥76 Managed · s≥51 Defined · s≥26 Developing · else Initial
```

Two roll-ups feed the charts:
- **Radar** (`radarData`): mean status score per component `category` (Governance, Risk Management,
  Operations, Stakeholder, Monitoring, Environmental, Social).
- **Bar** (`barData`): per-component score for the gap view.
- **Priority** derives from status: `Not Started→Critical, In Progress→High, Implemented→Medium,
  Certified→Low`, with a `months` remediation-effort label (`Critical 1-3m, High 3-6m, else 6-12m`).

### 7.2 Parameterisation / scoring rubric

| Element | Values | Provenance |
|---|---|---|
| `STATUS_SCORE` | 0 / 33 / 67 / 100 | Hard-coded even-quartile maturity scale (editorial, not an IFC formula) |
| `maturityLevel` bands | 26 / 51 / 76 / 91 | Hard-coded; mirrors CMMI Initial→Optimized 5-level model |
| `ESMS_COMPONENTS` | 16 | **Real IFC ESMS elements** — the 8-element IFC "ESMS: Elements & Guidance" plus PS-specific topics (biodiversity, indigenous peoples, labour, resettlement, GHG) |
| `IFC_PS` | 8 (PS1–PS8) | **Real** IFC Performance Standards 2012 — requirement text + component mapping + typical gaps |
| Cross-framework map | IFC/EP/OECD/EU/GRI/ISO booleans | Editorial mapping of each component to 6 frameworks |
| `COUNTRIES` | 86 | ISO country picker (metadata only) |
| `TEMPLATES`, `REGULATORY_FRAMEWORKS`, `ESMS_GROUPS` | 9 / 7 / 6 | UI scaffolding for template library and grouping |

All component statuses are **user-entered** (initialised to "Not Started"); there is no seeded PRNG in
this module — the data is workflow state, not synthetic numeric estimates.

### 7.3 Calculation walkthrough

1. `initComponents()` seeds all 16 components at `Not Started` (score 0).
2. User sets each component's status via a dropdown (`STATUS_OPTIONS`).
3. `avg` recomputes the mean maturity; `maturityColor`/`maturityLevel` classify it.
4. `radarData` averages statuses within each category; `groupComps` resolves `ESMS_GROUPS[].ids` into
   component objects for the grouped board.
5. Priority + `months` produce a remediation roadmap sorted by criticality.

### 7.4 Worked example

Suppose a project has completed 4 components to *Certified*, 4 *Implemented*, 4 *In Progress*, 4 *Not
Started*:

| Bucket | Count | Score each | Subtotal |
|---|---|---|---|
| Certified | 4 | 100 | 400 |
| Implemented | 4 | 67 | 268 |
| In Progress | 4 | 33 | 132 |
| Not Started | 4 | 0 | 0 |
| **avg** | 16 | — | **800/16 = 50.0** |

`avg = 50` → `maturityLevel = "Developing"` (26 ≤ 50 < 51), coloured amber. The four *Not Started*
components flag as **Critical** priority with a 1–3-month remediation window. Note this is a flat
completion mean — it does **not** weight PS1 (assessment/management) above, say, PS8 (cultural
heritage), and a single Major non-conformance cannot veto the score the way the guide's ESCS requires.

### 7.5 IFC PS ↔ component linkage & cross-framework view

`IFC_PS[n].components` lists which of the 16 ESMS components evidence each Performance Standard, so the
tool can render a PS-level readiness view by averaging the linked components' scores. A
`CROSSWALK`-style boolean map (per component × {IFC, EP, OECD, EU, GRI, ISO}) drives a coverage matrix
showing which frameworks each component satisfies — this is the module's genuinely useful artefact for
a project-finance E&S officer.

### 7.6 Data provenance & limitations

- **No synthetic data** — statuses are user inputs, so no `sr()` PRNG concern here.
- **Simplistic aggregation**: an unweighted mean of even-spaced status scores. It cannot represent the
  guide's ESCS (Minor-NC 50% weight, Major-NC 0%) nor the *disbursement-blocking* logic that a real
  Equator Principles covenant needs (any open Major NC = block).
- **No live grievance-SLA or ESAP-completion computation**; those KPIs from the guide have no code.
- Cross-framework booleans are editorial judgements, not maintained regulatory crosswalks.

**Framework alignment:** The 16 components operationalise **IFC's ESMS: Elements and Guidance** (the
canonical E&S Policy · Risk & Impact ID · Management Programs · Capacity · Emergency Response ·
Stakeholder Engagement · Grievance · Monitoring/Reporting set) and the **IFC Performance Standards
2012** (PS1–PS8). PS1 governs the ESMS itself; PS2 labour/ILO core conventions; PS3 resource
efficiency/pollution; PS4 community H&S; PS5 land acquisition & resettlement; PS6 biodiversity; PS7
indigenous peoples/FPIC; PS8 cultural heritage. These map onward to **Equator Principles IV**, **World
Bank ESF**, and **ADB SPS**. The maturity ladder borrows the **CMMI Initial→Optimized** framing.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's headline **ESCS** and its
disbursement-blocking, grievance-SLA and ESAP-completion KPIs are absent; the code shows only a
maturity mean. Below is the production compliance model.

**8.1 Purpose & scope.** Produce an auditable IFC-PS compliance score per project that drives Equator
Principles lending decisions: endorsement, ESAP conditions, and disbursement gating across the project
lifecycle (appraisal → construction → operations).

**8.2 Conceptual approach.** A conformance-weighted scorecard mirroring **IFC/EP independent E&S review**
practice and **ISO 19011 audit** conformity grading, not a maturity self-rating. Each PS
sub-requirement is graded Compliant / Minor-NC / Major-NC by an assessor against ESIA evidence; the
score is a weighted completion ratio with a hard Major-NC veto — the standard lender-covenant design.

**8.3 Mathematical specification.**

```
For each applicable PS_p with sub-requirements R_{p,i} graded g ∈ {C, minor, major}:
  s(C)=1, s(minor)=0.5, s(major)=0
  ESCS_p   = Σ_i w_{p,i}·s(g_{p,i}) / Σ_i w_{p,i} × 100
  ESCS     = Σ_p W_p·ESCS_p / Σ_p W_p          (project-weighted across applicable PS)
Gate:  disburse ⇔ (count of open Major-NC = 0) AND ESCS ≥ threshold(category)
threshold: Category A ≥ 90 at first review; B ≥ 80; C ≥ 75
Grievance_SLA% = grievances_responded_within_SLA / total_grievances
ESAP_completion% = actions_closed_on_schedule / actions_due
```

| Parameter | Source |
|---|---|
| Sub-requirement weights w | IFC PS Guidance Notes materiality; assessor judgement |
| PS applicability W_p | Category (A/B/C) + sector + geography screening |
| Category thresholds | Equator Principles IV lender covenants |
| Grievance SLA (30 days) | IFC PS1 §28 |

**8.4 Data requirements.** ESIA/ESAP documents (parsed to PS sub-requirement grades); independent
semi-annual monitoring reports; grievance register with intake/response timestamps; ESAP action
tracker with owners/milestones. Platform already holds the PS→component structure; needs a grades
table and grievance/ESAP entities (new migration).

**8.5 Validation & benchmarking plan.** Reconcile scored projects against independent E&S consultant
review conclusions; test that no project with an open Major NC ever clears the gate; sensitivity of
ESCS to sub-requirement weighting; track grievance-SLA and ESAP-completion against covenant triggers.

**8.6 Limitations & model risk.** Grading is inherently judgemental — require dual assessor sign-off
and evidence links per grade. Category mis-screening propagates to wrong thresholds; validate category
against OECD Common Approaches §4 criteria. Conservative fallback: any unassessed applicable PS scores
0 (treated as Major-NC-equivalent) until evidenced.

## 9 · Future Evolution

### 9.1 Evolution A — From maturity self-assessment to the ESCS compliance engine (analytics ladder: rung 1 → 2)

**What.** The §7 flag: the guide promises `ESCS = (Compliant + 0.5·Minor)/Total × 100` with per-PS sub-requirement ratings, Major-NC disbursement blocking, grievance SLA tracking, and ESAP completion — "the code implements none of that." What runs is a CMMI-style maturity self-assessment over 16 ESMS components on a 4-level scale with a simple mean. That self-assessment is legitimately useful (policy-development maturity is a real ESMS concern) — but the compliance engine is the module's charter. Evolution A adds it, sharing infrastructure with the sibling `equator-principles` module rather than duplicating.

**How.** (1) Tables `esms_projects`, `esms_ps_requirements` (the IFC PS1–8 sub-requirement catalog, seeded from the real standards — the page's `IFC_PS` data is a start), `esms_compliance_ratings` (Compliant/Minor/Major with evidence link and reviewer), `esms_grievances` (intake date, category, response date → SLA computation per PS1 §28), and shared `ep_esap_actions` from equator-principles' Evolution A (one ESAP tracker, two consumers). (2) `services/esms_engine.py`: the ESCS formula per PS and overall; Major-NC and <80% flags as covenant alerts. (3) Monitoring-report intake as period snapshots so NC trends are real. (4) The existing maturity self-assessment stays as its own tab, persisted, honestly labeled self-assessment. (5) Rung 2: readiness what-ifs ("ESCS if the 3 open Minor NCs close before the review").

**Prerequisites.** Sub-requirement catalog curation (the granularity decision — PS-level vs paragraph-level — drives everything); equator-principles Evolution A sequencing. **Acceptance:** a fixture project's ESCS reproduces the formula from its ratings; a Major NC raises the disbursement flag; grievance SLA rate computes from stored dates; the maturity mean and the ESCS are visibly distinct scores.

### 9.2 Evolution B — Monitoring-report intake assistant (LLM tier 2)

**What.** The workflow's bottleneck is semi-annual independent monitoring reports — long PDFs whose findings must update dozens of compliance ratings. A tool-calling assistant that ingests the report, proposes rating changes per PS sub-requirement with quoted supporting passages ("IESC notes wastewater treatment now operational → PS3 §Res-Efficiency proposed Minor→Compliant"), flags new findings as candidate ESAP items, and updates the grievance register from the report's community-engagement section — every change a proposal requiring the E&S officer's confirmation before ESCS recomputes.

**How.** Tools: `parse_monitoring_report(document)`, `propose_rating_change(requirement, status, evidence)`, `create_esap_item(finding)` and `log_grievance(entry)` (all gated mutations), `recompute_escs(project)`. The extraction pattern follows `esg-report-parser`'s span-fidelity rule: proposals carry verbatim quotes and page references; the officer approves, the engine scores. Covenant-relevant changes (anything touching a Major NC) get prominent flagging since disbursement decisions hang on them.

**Prerequisites (hard).** Evolution A's compliance schema — there is nothing to update today; and the mutation-gating is non-negotiable given lender covenant consequences. **Acceptance:** a golden monitoring report yields proposals each carrying a quote and page reference; no rating changes without confirmation; post-approval ESCS matches hand recomputation; unsupported report claims (no evidence passage) are never proposed.