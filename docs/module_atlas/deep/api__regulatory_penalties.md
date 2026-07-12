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
