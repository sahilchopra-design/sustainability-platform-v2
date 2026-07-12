# Api::Mas_Regulatory
**Module ID:** `api::mas_regulatory` · **Route:** `/api/v1/mas-regulatory` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/mas-regulatory/erm/principles` | `get_erm_principles` | api/v1/routes/mas_regulatory.py |
| POST | `/api/v1/mas-regulatory/erm/self-assessment` | `submit_erm_assessment` | api/v1/routes/mas_regulatory.py |
| GET | `/api/v1/mas-regulatory/notice-637/requirements` | `get_notice_637` | api/v1/routes/mas_regulatory.py |
| GET | `/api/v1/mas-regulatory/sgt/sectors` | `get_sgt_sectors` | api/v1/routes/mas_regulatory.py |
| POST | `/api/v1/mas-regulatory/sgt/check-activity` | `check_sgt_activity` | api/v1/routes/mas_regulatory.py |
| GET | `/api/v1/mas-regulatory/slgs/stages` | `get_slgs_stages` | api/v1/routes/mas_regulatory.py |
| POST | `/api/v1/mas-regulatory/slgs/application` | `track_slgs_application` | api/v1/routes/mas_regulatory.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `ICAAP`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `stranded`, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/mas-regulatory/erm/principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'url', 'principles'], 'n_keys': 3}`

**GET /api/v1/mas-regulatory/notice-637/requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'items'], 'n_keys': 2}`

**GET /api/v1/mas-regulatory/sgt/sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['taxonomy', 'url', 'sectors'], 'n_keys': 3}`

**GET /api/v1/mas-regulatory/slgs/stages** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['programme', 'description', 'stages'], 'n_keys': 3}`

**POST /api/v1/mas-regulatory/erm/self-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/mas-regulatory/sgt/check-activity** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/mas-regulatory/slgs/application** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. There is no engine file — the full methodology lives in the route module `api/v1/routes/mas_regulatory.py`, a compact Singapore (MAS) regulatory toolkit built on four embedded reference lists.)*

### 7.1 What the module computes

Four Singapore-regulatory workflows for financial institutions:

| Workflow | Endpoints | Reference data |
|---|---|---|
| MAS ERM Guidelines self-assessment | `GET /erm/principles`, `POST /erm/self-assessment` | `MAS_ERM_PRINCIPLES` — 6 principles from the MAS Guidelines on Environmental Risk Management (Banks) 2022, with the official MAS URL |
| Notice 637 environmental-risk items | `GET /notice-637/requirements` | `MAS_NOTICE_637_ITEMS` — 5 items across Pillar 2 ICAAP/ILAAP, Pillar 3 and SREP |
| Singapore Green & Transition Taxonomy screening | `GET /sgt/sectors`, `POST /sgt/check-activity` | `SGT_SECTORS` — 7 sectors ≈ 33 eligible activities (SGT v2.0, 2024) |
| SLGS application tracking | `GET /slgs/stages`, `POST /slgs/application` | `SLGS_STAGES` — 5-stage "Green Lane for Sustainability" pipeline |

Only two endpoints compute anything: the ERM score and the SLGS progress tracker. The rest are static reference lookups plus a string-matching taxonomy check.

### 7.2 Parameterisation / scoring rubric

**ERM principles (weight-equal, 6 items):** board & senior-management oversight, policies & procedures, client/counterparty risk assessment, scenario analysis & stress testing (ICAAP integration), TCFD-aligned disclosure ("MAS expects annual climate reporting by 2025"), data & metrics (financed emissions, climate VaR, sector limits). Caller responds per principle with `Compliant / Partial / Not Started`.

**ERM score and RAG bands:**

```
score_pct = (compliant + 0.5 × partial) / 6 × 100
```

| score_pct | Status | RAG |
|---|---|---|
| ≥ 80 | Largely Compliant | GREEN |
| 50–79 | Partially Compliant | AMBER |
| < 50 | Not Compliant | RED |

The 0.5 partial-credit weight and the 80/50 bands are platform conventions (MAS publishes no scoring formula — the guidelines are principles-based). Gaps = principles answered `Not Started` **or unanswered** (missing responses are treated as gaps, but note they still shrink neither numerator nor denominator — the denominator is always 6, so omissions penalise the score).

**SGT activity check:** case-insensitive bidirectional substring match between the requested activity and the sector's eligible list; unmatched sector → HTTP 404; result is a binary GREEN ("qualifies for SGT classification") / RED verdict plus the full eligible list. Notable taxonomy entries: nuclear is "(conditional)", CCUS-enabled fossil fuels are tagged "(transition)" — mirroring the SGT's traffic-light green/transition design.

**SLGS tracker:** `completion_pct = current_stage / 5 × 100`; a 3-item outstanding checklist fires for missing `tcfd_report_year` ("Publish TCFD-aligned annual report"), `financed_emissions_baseline_year` ("PCAF methodology") and `net_zero_commitment_year` ("with interim 2030 target"); `on_track = checklist empty`.

### 7.3 Calculation walkthrough

1. `POST /erm/self-assessment` counts `Compliant` and `Partial` values in the response map, computes `score_pct`, assigns RAG band, and returns the gap principles verbatim (id, section, title, description) for remediation display.
2. `POST /sgt/check-activity` resolves the sector row, then substring-matches; e.g. activity "solar" matches "Solar PV generation" because `"solar" in "solar pv generation"`.
3. `POST /slgs/application` echoes current/next stage records from `SLGS_STAGES`, computes the linear completion %, and derives the milestone checklist from the three optional year fields.

No persistence — all three POST endpoints are stateless calculators.

### 7.4 Worked example — ERM self-assessment

Responses: `erm_1=Compliant, erm_2=Compliant, erm_3=Partial, erm_4=Partial, erm_5=Not Started` (erm_6 omitted).

| Quantity | Computation | Result |
|---|---|---|
| compliant / partial | 2 / 2 | — |
| score_pct | (2 + 0.5×2) / 6 × 100 | **50.0** |
| Status / RAG | 50 ≥ 50 | **Partially Compliant / AMBER** |
| not_started_count | 6 − 2 − 2 | 2 |
| gaps | erm_5 (Not Started) + erm_6 (unanswered) | 2 principles |

A parallel SLGS example: stage 3 with a 2023 TCFD report but no emissions baseline or net-zero year → completion 60%, checklist = ["Establish financed emissions baseline (PCAF methodology)", "Make public net-zero commitment with interim 2030 target"], `on_track = false`.

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic entities, no DB** — reference lists are hand-curated condensations of real MAS publications (both MAS URLs are embedded), and all assessments are caller-supplied self-declarations.
- The ERM guidelines' actual text runs to dozens of expectations across governance, risk management and disclosure; the 6-principle condensation and the numeric score are platform simplifications for dashboarding, not a MAS-endorsed metric.
- Notice 637 is Singapore's full risk-based capital framework (hundreds of pages); the 5 items here isolate only its environmental-risk-relevant Pillar 2/3/SREP touchpoints, paraphrased.
- The SGT check is lexical, not criteria-based: the real taxonomy applies quantitative technical screening criteria (e.g. emissions-intensity thresholds, sunset dates for transition activities) and a traffic-light system (green/amber/red); a substring match can only confirm the activity *category* exists.
- "SLGS — Singapore Green Lane for Sustainability" is described in-code as "simplified tracking" of an MAS incentive programme; the 5 stages are a platform workflow model, and this label should not be treated as an official MAS programme definition.

### 7.6 Framework alignment

- **MAS Guidelines on Environmental Risk Management (Banks), 2020/2022:** principles-based supervisory expectations for board oversight, risk policies, due diligence, scenario analysis, disclosure and metrics — the 6-item checklist mirrors this structure; MAS assesses maturity through supervisory engagement, not a published score.
- **MAS Notice 637 (Risk-Based Capital Adequacy):** Singapore's Basel implementation; the module surfaces the Pillar 2 (ICAAP/ILAAP climate integration), Pillar 3 (TCFD-aligned disclosure) and SREP touchpoints where environmental risk enters the capital framework.
- **Singapore-Asia / Singapore Green and Transition Taxonomy (v2.0, 2024):** the multi-sector taxonomy with an explicit *transition* (amber) category alongside green — the module encodes the sector/activity structure and flags conditional/transition activities in the labels, but omits the quantitative technical screening criteria.
- **TCFD & PCAF:** named milestone requirements in the SLGS checklist — TCFD's four-pillar disclosure report and PCAF's financed-emissions accounting (attribution-factor methodology with data-quality scoring) as the baseline evidence MAS-style programmes expect.

## 9 · Future Evolution

### 9.1 Evolution A — SGT activity screening with real taxonomy logic and traffic-light gradation (analytics ladder: rung 1 → 2)

**What.** A compact Singapore-regulatory toolkit with no engine file — the methodology
lives in the route module over four embedded reference lists: MAS ERM Guidelines (6
principles), Notice 637 items (5), Singapore Green & Transition Taxonomy (7 sectors ≈ 33
activities, SGT v2.0), and the SLGS "Green Lane" 5-stage pipeline. Only two endpoints
compute (ERM self-assessment score, SLGS progress tracker); the rest serve static
reference data. Evolution A builds out the SGT screening, which is where the analytical
value is, and formalises the ERM scoring.

**How.** (1) Implement `/sgt/check-activity` as a real traffic-light classifier: the SGT
v2.0 is explicitly a *transition* taxonomy with green/amber/red gradation and
sunset-clause dates — encode those thresholds so an activity returns green/amber/red with
the applicable measure and expiry, not just an eligibility boolean. (2) Extract the inline
ERM scoring into a testable engine with weighted principles and a maturity band, mirroring
the platform's other framework engines (IFRS S1/S2). (3) Cross-wire SGT screening to the
EU Taxonomy and SFDR modules so a Singapore-domiciled activity's dual-classification is
visible. (4) Bench-pin the ERM score and SGT classification.

**Prerequisites.** SGT v2.0 threshold/sunset data encoded from the official taxonomy
(reference lists exist; gradation logic does not). **Acceptance:** `/sgt/check-activity`
returns green/amber/red with a sunset date, not a boolean; ERM scoring is engine-backed
and bench-pinned; the POST endpoints (currently `/erm/self-assessment` traces `failed`)
return `passed`.

### 9.2 Evolution B — MAS compliance copilot for Singapore FIs (LLM tier 2)

**What.** A copilot that guides a Singapore financial institution through the four
workflows — "which MAS ERM principles are we weak on?", "is this coal-power activity
SGT-eligible and until when?", "what's the next SLGS stage and its requirements?" — each
answer grounded in the embedded reference lists and computed via the ERM/SGT endpoints.

**How.** Seven endpoints (two POST computational, five GET reference) form the tool set;
the reference endpoints carry official MAS URLs and citations, so the copilot links every
answer to source. `/sgt/check-activity` becomes the tier-2 action for eligibility
questions; `/erm/self-assessment` for maturity scoring. This is a jurisdiction-specific
node the tier-3 Desk Orchestrator routes to for Singapore counterparties, cross-linking
to the EU/UK regulatory copilots for multi-jurisdiction firms.

**Prerequisites.** Evolution A's SGT gradation for credible eligibility answers —
otherwise the copilot can only say "listed/not listed" rather than the green/amber/red
status the transition taxonomy actually assigns. **Acceptance:** every principle, activity
status, and stage requirement traces to a reference or compute endpoint; SGT answers cite
the official taxonomy URL; the copilot refuses to give legal-compliance assurance and
frames outputs as MAS-guidance screening.