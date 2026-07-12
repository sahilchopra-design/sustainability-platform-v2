# Equator Principles
**Module ID:** `equator-principles` · **Route:** `/equator-principles` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides a structured compliance workflow for EP IV (Equator Principles fourth edition) environmental and social due diligence in project finance transactions. Supports category assignment, ESAP tracking, stakeholder consultation documentation, and independent monitoring. Covers IFC Performance Standards PS1â€“PS8 and Equator Principles 1â€“10 for projects above the financial threshold in all industry sectors.

> **Business value:** Enables project finance lenders and EPFIs to manage EP IV compliance workflows across complex multi-lender transactions, reduce reputational and covenant risk from ESAP non-compliance, and satisfy EP10 public reporting obligations with minimal administrative overhead.

**How an analyst works this module:**
- Create new project record and classify into EP category using the guided impact screening questionnaire.
- Upload ESIA documentation and map findings to IFC PS1â€“PS8 compliance matrix.
- Enter ESAP action items with owners, deadlines, and severity ratings; configure monitoring milestone alerts.
- Generate EP10 reporting package for annual disclosure and independent consultant sign-off workflow.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Alert`, `Btn`, `CHART_COLORS`, `COUNTRIES`, `Card`, `CategoryBadge`, `Checkbox`, `DESIGNATED_COUNTRIES`, `EP_PRINCIPLES`, `ESIA_STAGES`, `IFC_PS`, `Inp`, `KpiCard`, `SECTORS`, `Sel`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 69 | `value` |
| `EP_PRINCIPLES` | 11 | `name`, `desc`, `requirements` |
| `ESIA_STAGES` | 6 | `desc`, `docs`, `timeline` |
| `IFC_PS` | 9 | `name`, `scope` |
| `EP_GROUPS` | 5 | `color`, `bg`, `border`, `principles` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8000';` |
| `medRisk` | `['Manufacturing', 'Agriculture', 'Transport', 'Water/Sanitation'];` |
| `res` | `await fetch(`${API}/api/v1/export-credit-esg/equator-principles`, {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COUNTRIES`, `DESIGNATED_COUNTRIES`, `EP_GROUPS`, `EP_PRINCIPLES`, `ESIA_STAGES`, `IFC_PS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EP Category (A/B/C) | — | Equator Principles IV Â§3 | Project risk category; Category A = significant adverse E&S impacts; drives assessment scope and disclosure requirements. |
| ESAP Closure Rate (%) | — | EPFI Monitoring Reports | Proportion of ESAP action items closed vs. total; below 80% at financial close raises covenant breach risk. |
| Stakeholder Consultation Events | — | EP Principle 5 | Number of documented free, prior, and informed consultation events; mandatory for affected communities in Category A/B projects. |
| IFC PS Compliance Score (%) | — | IFC Performance Standards | Percentage of applicable PS sub-requirements rated Compliant or Minor Non-Conformance in ESIA review. |
- **Project information memorandum and ESIA documents** → Extract and categorise E&S impacts against IFC PS framework; auto-classify EP category → **EP category assignment and PS compliance gap matrix**
- **ESAP tracker (action items, owners, deadlines)** → Monitor completion status; flag overdue high-severity items and generate lender alerts → **ESAP closure rate and covenant compliance dashboard**
- **Independent E&S consultant monitoring reports** → Ingest semi-annual reports; update PS compliance scores and ESAP status → **Compliance trend and EP10 annual disclosure package**

## 5 · Intermediate Transformation Logic
**Methodology:** ESAP Compliance Score
**Headline formula:** `ESAP_score = (Closed_Actions / Total_Actions) × 100 − Σ(Severity_i × Overdue_i)`

Tracks the ratio of closed to total Environmental and Social Action Plan items, penalised by a weighted overdue factor where high-severity outstanding actions carry greater weight. Scoring aligns with the independent environmental and social consultant reporting cycle. Category A projects require formal ESIA; Category B require limited assessment; Category C require minimal assessment.

**Standards:** ['Equator Principles IV 2020', 'IFC Performance Standards 2012', 'IFC EHS Guidelines 2019']
**Reference documents:** Equator Principles IV 2020; IFC Performance Standards on Environmental and Social Sustainability 2012; IFC Environmental, Health, and Safety General Guidelines 2019; EP Association Annual Report 2023; OECD Guidelines for Multinational Enterprises 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The MODULE_GUIDES entry advertises an **ESAP Compliance Score**
> (`ESAP_score = Closed/Total×100 − Σ Severity_i×Overdue_i`) and an ESAP action-item tracker with
> owners, deadlines and monitoring alerts. **No ESAP tracker or ESAP scoring exists in this module.**
> What the code actually implements is a genuine, rule-based **EP-IV applicability & categorisation
> engine** — deriving Category A/B/C, designated-vs-non-designated-country treatment, and the
> required subset of Principles 1–10 — running on both the frontend (`deriveCategory`,
> `getPrincipleStatus`) and a real backend (`apply_equator_principles`). This is one of the few
> modules with **no synthetic PRNG anywhere**: everything is deterministic rule logic grounded in
> EP IV / OECD Common Approaches / IFC PS. The sections below document that real logic.

### 7.1 What the module computes

The core output is a **project category** and a **per-principle applicability status**. Frontend
`deriveCategory` (a quick client-side classifier):

```js
highRisk = [Energy, Mining, Infrastructure]; medRisk = [Manufacturing, Agriculture, Transport, Water/Sanitation]
if (highRisk.includes(sector) && value >= $10M) return 'A'
if (highRisk.includes(sector) || (medRisk.includes(sector) && value >= $50M)) return 'B'
if (medRisk.includes(sector)) return 'B'
return 'C'
```

`getPrincipleStatus(num)` then marks each of the 10 principles `required | conditional | not_required`
by category:
- **Category C** → only P1 (Review) required; P10 (Reporting) required only if value ≥ $100M.
- **Category A** → all 10 required; P7 (Indigenous Peoples) `conditional` unless `indigenousAffected`.
- **Category B** → P1–P6, P8, P10 required; P7 conditional on IP impact; **P9 (Independent
  Monitoring)** required only in **non-designated** countries, else conditional.

The authoritative version runs server-side (`POST /api/v1/export-credit-esg/equator-principles` →
`apply_equator_principles`), which additionally returns `ep_applicable`, ESIA scope, required
standards, and IESC-review flag.

### 7.2 Parameterisation / rubric (all named-standard, not synthetic)

| Rule | Value | Provenance |
|---|---|---|
| EP applicability threshold | $10 M project value | EP IV scope (`EP_APPLICABILITY_THRESHOLD_USD`) |
| High-risk sectors | Energy, Mining, Infrastructure | OECD Common Approaches sector risk |
| Designated countries | 23 high-income OECD (US, GB, DE, FR, JP, KR, AU, CA, …) | EP IV Annex — designated-country list |
| Category A | high-risk sector ≥ $10 M | OECD Category A (significant adverse E&S) |
| Category B | high-risk any value, or med-risk ≥ $50 M | OECD Category B (limited/site-specific) |
| Category C | remainder | OECD Category C (minimal/no impact) |
| Backend high-risk-B | Cat-B + (community ∨ indigenous affected) → full 10 | EP IV escalation for sensitive B |

Reference tables are all real EP IV content: `EP_PRINCIPLES` (all 10 with requirement checklists),
`IFC_PS` (PS1–PS8 with scope), `ESIA_STAGES` (Screening→Monitoring with document lists and
timelines).

### 7.3 Calculation walkthrough

1. User enters project name, value, country, sector and sensitivity flags (community / indigenous /
   cultural heritage / existing ESIA).
2. `autoCategory = deriveCategory(sector, value)`; user may override via `categoryOverride`.
3. `isDesignated = DESIGNATED_COUNTRIES.includes(country)` → picks IFC PS vs host-country law.
4. `getPrincipleStatus` walks 1–10 producing the required/conditional/not-required checklist.
5. On "Assess", the same inputs POST to the backend, which re-derives category via
   `_resolve_oecd_category`, sets `high_risk_b`, assembles `requirements[]` (ESIA commissioning,
   IFC-PS applicability, FPIC for IP, PS8 for heritage, IESC review for A/high-risk-B) and returns
   the applicable-principle detail objects plus a sample of EP signatory banks.

### 7.4 Worked example — $50 M energy project in India

Inputs: sector=Energy, value=$50 M, country=IN (non-designated), no IP impact.

| Step | Computation | Result |
|---|---|---|
| deriveCategory | Energy ∈ highRisk, $50M ≥ $10M | **Category A** |
| isDesignated | IN ∉ DESIGNATED_COUNTRIES | false → **IFC PS apply** |
| P1–P6, P8, P10 | Category A | required |
| P7 (Indigenous) | A but `indigenousAffected=false` | **conditional** |
| P9 (Monitoring) | Category A | required |
| Backend requirements | not-designated + A | "Commission full ESIA", "IFC PS apply", "IESC review required" |

Change the country to Germany (designated): category stays A (sector/value unchanged), but
`required_standards` flips to "Host Country Law" and P9 monitoring can relax to conditional in the
Category-B path. Everything is reproducible rule logic — no random draws.

### 7.5 Data provenance & limitations

- **No synthetic data.** Category, principle applicability, designated-country list, IFC-PS mapping
  and ESIA stages are all EP IV / OECD / IFC standard content. This is a compliance-workflow tool,
  not a statistical model.
- **The ESAP scoring the guide describes is absent** — there is no action-item tracker, no
  closed/total ratio, no overdue-severity penalty. A production build would add the ESAP register
  (see §8).
- `deriveCategory` is a coarse sector×threshold heuristic; real EP categorisation is impact-based
  (magnitude, reversibility, sensitivity of receptors) via full ESIA, which the module does not model.
- Designated-country list is hard-coded (23 entries) and would need periodic reconciliation with the
  EP Association's official list.

**Framework alignment:** **Equator Principles IV (2020)** — the 10-principle structure, $10 M
threshold, A/B/C categorisation and designated/non-designated split are implemented directly ·
**IFC Performance Standards (2012), PS1–PS8** — mapped in `IFC_PS` and invoked for non-designated
projects · **OECD Common Approaches** — the Category A/B/C criteria and ESIA-scope tiers · **IFC PS7
FPIC** for indigenous peoples and **PS8** for cultural heritage are triggered by the sensitivity
flags.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's ESAP Compliance Score has no
implementation; here is the production model for the ESAP monitoring the guide describes.

**8.1 Purpose & scope.** For an EP-financed project, quantify environmental-and-social action-plan
(ESAP) execution health across the financing life, so lenders can trigger covenant reviews and satisfy
EP10 annual public reporting.

**8.2 Conceptual approach.** A severity-weighted attainment score in the spirit of lender
independent-monitoring reporting cycles (EP Principles 8–9) and IFC ESMS performance-indicator
tracking — analogous to operational-risk overdue-action aging used in bank issue-management systems.

**8.3 Mathematical specification.**
- Base closure: `B = Closed / Total × 100`.
- Overdue penalty: `P = Σ_i sev_i · overdue_i · agingFactor(d_i)`, where `sev_i∈{Low 1, Med 2, High 3,
  Critical 5}`, `overdue_i∈{0,1}`, and `agingFactor(d) = 1 + min(1, d/90)` (linear aging to 2× at 90+
  days overdue).
- Score: `ESAP = max(0, B − P)`; covenant-breach flag when `ESAP < 80` at financial close (guide's
  stated threshold) or any `Critical` item overdue > 30 days.

| Parameter | Value / source |
|---|---|
| Severity weights 1/2/3/5 | IESC severity ratings (EP monitoring practice) |
| Aging cap 2× at 90 days | conservative issue-aging convention |
| Covenant threshold 80% | guide ("below 80% at financial close raises breach risk") |

**8.4 Data requirements.** ESAP register: action id, IFC-PS reference, owner, due-date, close-date,
severity, status. Sourced from the ESIA/ESMP and IESC monitoring reports; none currently stored in
the platform for this module.

**8.5 Validation & benchmarking plan.** Backtest ESAP score against realised covenant events;
sensitivity of score to severity-weight and aging-cap choices; reconcile against IESC semi-annual
report conclusions for the same projects.

**8.6 Limitations & model risk.** Severity ratings are judgemental (IESC-assigned); the aging factor
is a modelling convention; a single Critical item can be masked by many closed low-severity items
unless the hard Critical-overdue override is enforced.

## 9 · Future Evolution

### 9.1 Evolution A — Add the missing ESAP tracker to a genuinely clean rules engine (analytics ladder: rung 1 → 2)

**What.** §7's finding is unusually positive: this is "one of the few modules with no synthetic PRNG anywhere" — a real, deterministic EP-IV applicability and categorisation engine (Category A/B/C derivation, designated-country treatment, per-principle applicability across EP 1–10 and IFC PS1–8) running on both frontend and a real backend (`apply_equator_principles` under the export-credit-esg route). The gap is the guide's second half: the ESAP tracker and its score (`Closed/Total×100 − Σ Severity×Overdue`) — action items, owners, deadlines, monitoring alerts — don't exist. Evolution A builds the workflow layer the categorisation engine feeds.

**How.** (1) Tables `ep_projects` (categorised via the existing engine, persisted rather than recomputed ephemerally) and `ep_esap_actions` (item, PS reference, owner, deadline, severity, status) with CRUD endpoints. (2) Implement the guide's ESAP score exactly, computed server-side; the 80%-closure covenant-risk threshold from §4 becomes a real flag. (3) Consultation log per EP5 (events, dates, communities) and the semi-annual monitoring-report cycle as status snapshots — giving EP10 annual reporting a real data source. (4) Rung 2: category-sensitivity checks ("does this project flip to Category A if the sector reclassifies?") over the existing rule logic — cheap, because the classifier is already deterministic and fast.

**Prerequisites.** Reconcile the two classifiers (the quick client-side `deriveCategory` and the backend engine differ in granularity — one source of truth, the backend); note the page's hard-coded `API = localhost:8000` needs the standard env-based base URL. **Acceptance:** an ESAP item lifecycle (create → overdue → close) moves the score per the formula, verified by hand; the covenant flag fires below 80% at a fixture financial close; category assignments come from one engine.

### 9.2 Evolution B — E&S due-diligence assistant for project finance teams (LLM tier 2)

**What.** A tool-calling assistant for the EP workflow's document-heavy steps: given a project description, it runs the real categorisation engine, explains the verdict with the specific rule that fired (sector class × value threshold × designated-country status), lists the applicable Principles and IFC PS with their requirements from the reference data, and — post-Evolution-A — drafts the ESAP skeleton (typical action items per applicable PS) and the EP10 disclosure package from the tracked record.

**How.** Tools: `apply_equator_principles(project)` (exists today), `get_principle_requirements(id)`, `create_esap_items(project, items)` (gated mutation), `get_esap_status(project)`, `generate_ep10_data(project)`. Grounding corpus = this Atlas record's §7.1 rule logic and the EP IV / IFC PS reference tables — the assistant explains categorisation by quoting the actual thresholds, not paraphrasing the standard from memory. ESAP drafts are proposals requiring lender-analyst confirmation; the EP10 package contains only tracked data with gaps disclosed.

**Prerequisites.** Evolution A for anything ESAP/EP10-related; the categorisation-explanation slice works today against the existing backend and could ship as the first increment. **Acceptance:** categorisation explanations cite the exact rule branch that fired for a golden project set (verifiable against the code); drafted ESAP items map 1:1 to applicable PS; the EP10 package contains zero claims not present in tracker rows.