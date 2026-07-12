# Api::Regulatory_Penalties
**Module ID:** `api::regulatory_penalties` · **Route:** `/api/v1/regulatory-penalties` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/regulatory-penalties/assess` | `run_full_assessment` | api/v1/routes/regulatory_penalties.py |
| POST | `/api/v1/regulatory-penalties/regulation-penalty` | `calculate_regulation_penalty` | api/v1/routes/regulatory_penalties.py |
| POST | `/api/v1/regulatory-penalties/whistleblower-risk` | `assess_whistleblower_risk` | api/v1/routes/regulatory_penalties.py |
| GET | `/api/v1/regulatory-penalties/assessments/{entity_id}` | `list_assessments` | api/v1/routes/regulatory_penalties.py |
| GET | `/api/v1/regulatory-penalties/assessment/{assessment_id}` | `get_assessment` | api/v1/routes/regulatory_penalties.py |
| GET | `/api/v1/regulatory-penalties/ref/regulations` | `get_regulations` | api/v1/routes/regulatory_penalties.py |
| GET | `/api/v1/regulatory-penalties/ref/enforcement-timeline` | `get_enforcement_timeline` | api/v1/routes/regulatory_penalties.py |
| GET | `/api/v1/regulatory-penalties/ref/authorities` | `get_authorities` | api/v1/routes/regulatory_penalties.py |

### 2.3 Engine `regulatory_penalties_engine` (services/regulatory_penalties_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RegulatoryPenaltiesEngine._compliance_to_violation_severity` | compliance_pct |  |
| `RegulatoryPenaltiesEngine._expected_penalty_factor` | compliance_pct, enforcement_intensity | Fraction of max penalty likely to be imposed, given compliance level. Deterministic: the non-compliance gap (a real input) is scaled by the enforcement intensity. When the caller does not supply an entity-specific `enforcement_intensity`, the documented model calibration constant DEFAULT_ENFORCEMENT_INTENSITY (0.40, midpoint of the observed 0.15–0.65 band) is used — a model constant, not a fabrica |
| `RegulatoryPenaltiesEngine.calculate_regulation_penalty` | entity_id, regulation, annual_turnover_mn, compliance_pct, violation_details, enforcement_intensity | Calculate penalty exposure for a single regulation. `enforcement_intensity` (optional): entity-specific fraction of the statutory maximum a supervisor is expected to impose. When omitted, the documented model calibration constant is used (see _expected_penalty_factor). |
| `RegulatoryPenaltiesEngine.assess_all_regulations` | entity_id, annual_turnover_mn, compliance_scores, enforcement_intensity | Assess penalty exposure across all 5 regulations. Only regulations for which a compliance score is supplied are assessed. Regulations without a score are reported as skipped (honest null) rather than assigned an invented compliance level. |
| `RegulatoryPenaltiesEngine.assess_whistleblower_risk` | entity_id, compliance_scores, sector, jurisdiction | Assess whistleblower / internal reporting risk. Deterministic: the risk score is derived from the average compliance score (real input), a fixed sector premium, and a jurisdiction premium driven by whether `jurisdiction` is a documented high-risk enforcement jurisdiction. When no compliance scores are supplied the risk score is an honest null (insufficient data) rather than a random draw. |
| `RegulatoryPenaltiesEngine.generate_remediation_priorities` | entity_id, penalty_assessment | Generate prioritised remediation actions from penalty assessment. Deterministic: action selection, effort, impact, timeframe and avoided penalty are all derived from violation severity — no random draws. |
| `RegulatoryPenaltiesEngine.run_full_assessment` | entity_id, entity_name, annual_turnover_mn, compliance_scores | Orchestrate full penalty assessment. Optional kwargs: `sector`, `jurisdiction`, `reporting_period`, `enforcement_intensity`. When `jurisdiction` is not supplied it is reported as None (honest null) rather than an invented country. |
| `RegulatoryPenaltiesEngine.get_reference_data` |  | Return all reference constants. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `SET` *(shared)*, `fastapi` *(shared)*, `individual`, `pydantic` *(shared)*, `regulatory_penalty_assessments`, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/regulatory-penalties/assessment/{assessment_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/regulatory-penalties/assessments/{entity_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/regulatory-penalties/ref/authorities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['supervisory_authorities'], 'n_keys': 1}`

**GET /api/v1/regulatory-penalties/ref/enforcement-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['enforcement_timeline', 'high_risk_jurisdictions'], 'n_keys': 2}`

**GET /api/v1/regulatory-penalties/ref/regulations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulations', 'violation_severity'], 'n_keys': 2}`

**POST /api/v1/regulatory-penalties/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/regulatory-penalties/regulation-penalty** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/regulatory-penalties/whistleblower-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_id', 'whistleblower_risk', 'risk_score', 'average_compliance_pct', 'risk_factors', 'mitigation_actions', 'eu_directive_coverage', 'assessed_at'], 'n_keys': 8}`

## 5 · Intermediate Transformation Logic

**Engine `regulatory_penalties_engine` — extracted transformation lines:**
```python
base_non_compliance = max(0, (100 - compliance_pct) / 100)
expected_penalty_mn = round(max_penalty_mn * enforcement_factor * severity_mult, 3)
effective_total = min(total_expected, annual_turnover_mn * 0.10)
avg_compliance = sum(compliance_scores.values()) / len(compliance_scores)
base_risk = 100 - avg_compliance
risk_score = min(100, base_risk + sector_premium + jurisdiction_premium)
avg_compliance = round(sum(compliance_scores.values()) / len(compliance_scores), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/regulatory_penalties_engine.py` (engine E35, `RegulatoryPenaltiesEngine`)
converts compliance scores (0–100%) and annual turnover into **expected EU ESG penalty
exposure** across five regimes — CSRD, SFDR, EU Taxonomy, EUDR, CSDDD — plus a whistleblower
risk score and a severity-driven remediation plan. Exposed via
`api/v1/routes/regulatory_penalties.py` (`POST /assess`, `/regulation-penalty`,
`/whistleblower-risk`; `GET /ref/regulations`, `/ref/authorities`, `/ref/enforcement-timeline`).

Core formulas quoted from code:

```
max_penalty = min(turnover × max_pct/100, fixed_max)         # fixed cap only where regime has one
enforcement_factor = intensity × (100 − compliance)/100      # intensity default 0.40
expected_penalty = max_penalty × enforcement_factor × severity_multiplier
enforcement_probability = clamp(enforcement_factor × 2, 0.02, 0.95)
violation_count (if not supplied) = ⌊(100 − compliance)/10⌋
total_expected (portfolio of regimes) = min(Σ expected, turnover × 10%)   # "no pile-on" cap
whistleblower score = min(100, (100 − avg_compliance) + sector_premium + jurisdiction_premium)
```

### 7.2 Parameterisation

**Statutory ceilings** (`REGULATION_CONFIGS`, each with cited article basis):

| Regime | Max % turnover | Fixed cap €M | Enforcement start | Articles |
|---|---|---|---|---|
| CSRD (2022/2464) | 5.0 | 10.0 | 2025-01-01 | 19a/29a/33b |
| SFDR (2019/2088) | 10.0 | 5.0 | 2021-03-10 | 3/4/6/14 |
| EU Taxonomy (2020/852) | 4.0 | 8.0 | 2022-01-01 | 8/22/23 |
| EUDR (2023/1115) | 4.0 | — | 2025-12-30 | 24/25/26 |
| CSDDD (2024/1760) | 5.0 | — | 2027-07-26 | 29/30/33 |

**Model calibrations** (explicitly documented in code as model constants, *not* entity data):
`DEFAULT_ENFORCEMENT_INTENSITY = 0.40` ("midpoint of the commonly-observed 15–65% band",
caller-overridable); `VIOLATION_SEVERITY` multipliers critical 1.00 / major 0.60 /
moderate 0.30 / minor 0.10; severity from compliance: <30% critical, <55% major, <75% moderate,
else minor; `PENALTY_AVOIDANCE_FRACTION` (share of penalty credible remediation avoids)
80/70/60/50% by severity; whistleblower sector premium 15 (financial/energy/chemicals/retail)
else 5; jurisdiction premium 15 for the 8 documented `HIGH_RISK_JURISDICTIONS`
(DE, FR, NL, SE, DK, AT, BE, IT — each with a rationale comment, e.g. "AMF greenwashing
enforcement"); whistleblower tiers ≤30 low / ≤60 medium / ≤100 high. A 13-event
`ENFORCEMENT_TIMELINE_2024_2030` and per-regime `SUPERVISORY_AUTHORITY_MAP` (BaFin, AMF, AFM,
CONSOB, CSSF…) serve the reference endpoints.

### 7.3 Calculation walkthrough

`run_full_assessment` orchestrates three passes. (1) `assess_all_regulations` iterates the five
regimes; a regime with **no supplied compliance score is skipped and listed in
`skipped_regulations`** — the engine's remediation notes state repeatedly that missing inputs
yield honest nulls, never invented scores. Regimes under 75% compliance are collected as
violations. The portfolio total is capped at 10% of turnover ("regulators typically don't pile
on full maxima"). (2) `assess_whistleblower_risk` averages the supplied scores, adds the two
premia, tiers the result, and assembles rule-based risk factors (e.g. SFDR < 70 → "greenwashing
allegations likely"). (3) `generate_remediation_priorities` sorts violations by expected
penalty, picks the first action from a per-regime playbook (4 canned actions each, e.g. CSRD →
"Commission ESRS gap analysis…"), assigns effort/impact/timeframe by severity, and computes
`penalty_avoided = expected × avoidance_fraction`; a generic steering-committee action pads the
list to ≥3. Overall risk level: avg compliance <40 Critical, <60 High, <80 Medium, else Low.

### 7.4 Worked example — SFDR leg for a €800M-turnover manager, compliance 50%

| Step | Computation | Result |
|---|---|---|
| Statutory max | min(800 × 10%, €5M fixed cap) | **€5.0M** (fixed cap binds) |
| Severity | 50% < 55 → major | ×0.60 |
| Enforcement factor | 0.40 × (100−50)/100 | 0.20 |
| Expected penalty | 5.0 × 0.20 × 0.60 | **€0.600M** |
| Enforcement probability | clamp(0.20 × 2) | 0.40 |
| Violation count | ⌊50/10⌋ | 5 |
| Remediation | major → "Update pre-contractual disclosures with SFDR Level 2 RTS templates", Immediate (0–3m), impact 70 | avoided = 0.600 × 0.70 = **€0.420M** |

If the same entity also scored CSRD 50% (max = min(800×5%, 10) = €10M → expected
10 × 0.20 × 0.60 = €1.2M), portfolio expected = €1.8M, well under the €80M (10%) cap; highest-
risk regulation = CSRD. With sector "financial" and jurisdiction DE: whistleblower score =
50 + 15 + 15 = **80 → high**.

### 7.5 Data provenance & limitations

- **No PRNG** — the engine header and inline comments document the random-as-data remediation:
  enforcement intensity, avoidance fractions and timeframes are labelled model calibrations;
  absent compliance scores produce `insufficient_data`/skipped outputs (e.g. missing
  jurisdiction stays `None`; empty scores make `overall_risk_level = "insufficient_data"`
  rather than a false "Critical" from a fabricated 0).
- Statutory ceilings are simplified: CSRD and Taxonomy penalty levels are set by **member-state
  transposition** (the directive/regulation ceilings modelled here are indicative, as the CSRD
  `notes` field itself concedes); SFDR Art 14 leaves sanctions to national law — the 10%/€5M
  pair is a stylisation. Taking `min(pct, fixed)` also makes the fixed cap bind for any large
  entity, which understates regimes where the law says "up to the higher of".
- Expected penalty is a single-period point estimate: no probability-weighted distribution,
  no recidivism escalation (EUDR's 3% recidivist floor is noted but not modelled), no
  litigation/civil-liability channel (CSDDD Art 29 named but unquantified).
- The 1-violation-per-10pp heuristic and the 2× probability scaling are unsourced model
  choices; remediation actions are static playbook text.

### 7.6 Framework alignment

- **CSRD (Directive (EU) 2022/2464)** — real penalty levels come from member-state
  transposition of Arts 19a/29a via the Accounting Directive's sanction regime; the engine
  encodes the commonly-quoted "up to €10M or 5% of turnover" ceiling and the FY2024→FY2026
  phase-in in its timeline.
- **SFDR (Regulation (EU) 2019/2088)** — Art 14 requires member states to lay down penalties;
  ESMA drives convergence. The engine's per-product penalty basis mirrors NCA practice.
- **EU Taxonomy (2020/852)** — Art 22 obliges effective, proportionate, dissuasive penalties
  for misleading Art 8 disclosures; modelled as 4%/€8M ceilings.
- **EUDR (2023/1115)** — Art 25 sets a *minimum* maximum fine of 4% of EU-wide turnover, plus
  confiscation and ≤12-month exclusion from public procurement — the only regime where the 4%
  figure is directly in the regulation text.
- **CSDDD (2024/1760)** — Art 27 requires pecuniary penalties with a maximum of not less than
  5% of net worldwide turnover; Groups 1–3 phase-in 2027–2029 as per the timeline.
- **EU Whistleblower Directive (2019/1937)** — cited as the frame for the internal-reporting
  channel mitigation (mandatory for >50-FTE entities).

## 9 · Future Evolution

### 9.1 Evolution A — Calibrate enforcement probabilities against real case data (analytics ladder: rung 2 → 4)

**What.** The E35 engine converts compliance scores and turnover into expected EU ESG penalty
exposure across five regimes (CSRD, SFDR, EU Taxonomy, EUDR, CSDDD), plus a whistleblower score
and remediation plan. Formulas: `expected_penalty = max_penalty × enforcement_factor × severity`,
`enforcement_factor = intensity × (100−compliance)/100` with a **default intensity of 0.40**, and
a portfolio "no-pile-on" cap at 10% of turnover. The enforcement intensity, severity multipliers,
sector/jurisdiction premiums, and even the imputed `violation_count = ⌊(100−compliance)/10⌋` are
platform assumptions. The persisted-assessment reads (`/assessment/{id}`, `/assessments/{entity}`)
trace **failed**. Evolution A grounds the probabilities and fixes persistence.

**How.** (1) Calibrate the enforcement intensity (0.40) and jurisdiction premiums against actual
EU ESG enforcement data — published fines and case frequencies per regulator — replacing the
uniform default with regime- and jurisdiction-specific base rates plus a model card. (2) Ground
severity multipliers in observed penalty-vs-violation relationships. (3) Add a predictive
enforcement-likelihood model layered on the enforcement-timeline data the module already serves
(rung 4). (4) Fix the assessment persistence path and bench-pin the expected-penalty and
whistleblower formulas.

**Prerequisites.** An EU enforcement-case dataset for calibration (external — may stay
literature/assumption-anchored with honest labelling); assessment persistence repaired.
**Acceptance:** enforcement factors are regime/jurisdiction-calibrated with provenance, not a flat
0.40; `/assessment/{id}` returns `passed`; expected-penalty and whistleblower scores bench-pinned;
the 10% turnover cap retained.

### 9.2 Evolution B — Regulatory-exposure copilot for compliance officers (LLM tier 2)

**What.** A copilot that runs `/assess` and explains exposure — "at 62% CSRD compliance your
expected penalty is €X (capped by the 10%-turnover pile-on limit); enforcement probability is
elevated in [jurisdiction]; here's the remediation priority order" — each figure from a tool call.

**How.** Three POST endpoints (`/assess`, `/regulation-penalty`, `/whistleblower-risk`) plus
reference GETs (regulations with statutory caps, authorities, enforcement-timeline) that ground
every regime's penalty basis and supervisory body. The copilot decomposes exposure per regime and
explains the enforcement-factor logic; what-ifs ("what if we raise SFDR compliance to 90%?") re-run
statelessly. Cross-links to the framework-completeness copilots (`regulatory_reports`, `sfdr_annex`)
that feed the compliance scores.

**Prerequisites.** Evolution A's calibration — narrating expected penalties from an uncalibrated
0.40 intensity as risk figures needs the honest caveat; persistence fix for saved assessments.
**Acceptance:** every penalty, probability, and premium traces to a tool response; the copilot
labels enforcement figures as assumption-calibrated until Evolution A; it cites the statutory cap
and authority per regime from the reference endpoints and refuses to give legal advice, framing
output as model-based exposure estimates.