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
