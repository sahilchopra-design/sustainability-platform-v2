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
