## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is written directly from
`backend/services/ai_risk_engine.py` (E76, "AI & ML Risk Finance") and its router
`api/v1/routes/ai_risk.py`. No guide↔code mismatch to report.)*

### 7.1 What the domain computes

A rules-based **EU AI Act / NIST AI RMF compliance engine** with five deterministic functions and
five reference endpoints. Notably, this engine follows the platform's post-remediation "no
fabrication" convention: every quantitative output derives from caller-supplied inputs, and
missing inputs propagate as explicit `None` / `insufficient_data` rather than seeded randoms.

| Endpoint | Function | Output |
|---|---|---|
| `POST /classify-system` | `classify_ai_system` | AI Act risk tier + obligations + penalty exposure |
| `POST /assess-nist-rmf` | `assess_nist_rmf` | NIST AI RMF 1.0 maturity scoring + gap analysis |
| `POST /calculate-liability` | `calculate_ai_liability` | Expected-loss liability + insurance gap |
| `GET /ref/annex3-categories` etc. | reference data | Annex III (23 categories), Art 5 prohibitions (8), NIST functions, bias metrics, enforcement timeline |

(The engine also contains `detect_algorithmic_bias` and `score_explainability`, used by sibling
routes/modules.)

### 7.2 Reference data & parameterisation

- **`ANNEX3_HIGH_RISK_CATEGORIES` (23)** — Annex III high-risk use-case categories *plus* Annex I
  product-safety areas (medical devices per MDR 2017/745, vehicles, machinery, toys, lifts, PPE,
  marine, aviation …), each with the governing directive cited.
- **`PROHIBITED_PRACTICES` (8)** — Art 5(1)(a)–(h) verbatim mapping (subliminal manipulation,
  vulnerability exploitation, social scoring, real-time & retrospective remote biometric ID,
  workplace emotion recognition, biometric categorisation, individual crime prediction).
- **`NIST_RMF_FUNCTIONS`** — GOVERN (17 subcategories), MAP (18), MEASURE (16), MANAGE (12) = 63
  subcategory IDs mirroring NIST AI RMF 1.0.
- **`BIAS_METRICS` (6)** — demographic parity (thr 0.1), equalised odds (0.1), calibration (0.05),
  counterfactual fairness (0.15), individual fairness (0.2), statistical parity difference (0.1),
  each flagged for GDPR Art 22 relevance.
- **`SECTOR_AI_RISK_PROFILES` (12 sectors)** — baseline tier + primary Annex III categories +
  regulatory overlap (e.g. banking → high-risk, A3-04/05, CRR + EBA ML Guidelines + GDPR).
- **`ENFORCEMENT_TIMELINE` (8 milestones)** — the real AI Act phase-in: entry into force
  2024-08-01, Art 5 prohibitions 2025-02-02, GPAI obligations 2025-08-02, full application
  2026-08-02, Annex I embedded systems 2027-08-02.
- **Penalty ceilings** — prohibited 7 % / high-risk 3 % / limited 1.5 % / minimal 0 % of global
  turnover (per AI Act Art 99 tiering).
- **Damage severity rates** (liability) — physical 0.55, property 0.40, psychological 0.25,
  fundamental rights 0.325, data loss 0.20 — documented deterministic model parameters,
  caller-overridable.

### 7.3 Calculation walkthrough

1. **`classify_ai_system`** — keyword-scans the use-case text for prohibited practices (e.g.
   "social scoring", "facial recognition", "emotion"); else assigns high-risk if the sector
   profile or keywords ("credit", "hiring", "medical diagnosis" …) demand it; else limited
   ("chatbot", "recommendation" …) or minimal. High-risk yields the full Art 8–15 obligations
   dict (conformity assessment, technical docs, CE marking, post-market monitoring, human
   oversight …), with `notified_body_required` true only for biometric A3-09 (Art 43 + Annex
   VI/VII logic) and FRIA tied to `automated_decision_making`. GPAI systemic-risk is decided
   *only* from a caller-supplied `training_compute_flops > 1e25` (Art 51(2) presumption);
   `max_penalty_usd = turnover × pct/100` only when turnover supplied.
2. **`assess_nist_rmf`** — averages caller-supplied per-subcategory scores (0–1) within each of
   the four functions; unsupplied subcategories are `None` and excluded. Overall score maps to
   risk tier (≥ 0.8 low · ≥ 0.6 medium · ≥ 0.4 high · else critical); zero scores supplied →
   `risk_tier: "insufficient_data"`. Gap analysis lists the 10 lowest-scoring subcategories with
   target = score + 0.3 (capped 1.0); `iso_42001_gap_pct = (1 − overall)·100`.
3. **`calculate_ai_liability`** — per harm scenario,
   `expected_loss = probability × harm_magnitude × severity_rate` and
   `strict_liability_exposure = harm_magnitude × rate` (no fault under PLD 2023/2853);
   scenarios missing probability/magnitude are counted and nulled. Insurance gap
   `max(0, Σ expected_loss − policy_limit)` with recommended additional coverage = gap × 1.2,
   only when a policy limit is supplied. Fault-based routing: fundamental-rights/psychological
   harms → AI Liability Directive (presumption of causality); physical/property/data-loss →
   strict liability under the PLD.
4. **`detect_algorithmic_bias`** — looks up `{attr}_{metric}` (fallback bare metric) in supplied
   performance metrics; `violation = value > threshold`; severity escalates at 2× and 3×
   threshold; per-metric mitigation menus (reweighing, Hardt et al. 2016 post-processing, Platt
   scaling, counterfactual augmentation). Regulatory exposure: GDPR Art 22 flag on any relevant
   violation, EU equality-directive flag if disparate-impact ratio < 0.8 (the four-fifths rule).
5. **`score_explainability`** — detects XAI methods (SHAP/LIME/attention/gradient/counterfactual/
   prototype/rule) from the supplied list; `method_coverage = min(count/4, 1)`; Annex XII and
   GDPR Recital 71 checklists filled from caller attestations (default false = "not
   demonstrated"); combined = 0.4·coverage + 0.35·annex12 + 0.25·rec71 → CMMI-style maturity 1–5.

### 7.4 Worked example (liability)

Scenario: credit-scoring system, one harm scenario `{harm_type: "fundamental_rights",
probability: 0.08, harm_magnitude_usd: 5,000,000}`, policy limit $200k.

| Step | Computation | Result |
|---|---|---|
| Severity rate | fundamental_rights | 0.325 |
| Expected loss | 0.08 × 5,000,000 × 0.325 | **$130,000** |
| Strict-liability exposure | 5,000,000 × 0.325 | $1,625,000 (but PLD strict liability does *not* attach — fundamental rights routes fault-based) |
| Coverage gap | max(0, 130,000 − 200,000) | **$0 → gap_exists = false** |
| Fault-based likely | harm_type ∈ {fundamental_rights, psychological} | true (AILD presumption of causality applies) |

### 7.5 Data provenance & limitations

- Reference data is **hand-encoded from the actual legal texts** (Regulation (EU) 2024/1689,
  COM/2022/496 AILD proposal, Directive (EU) 2023/2853, NIST AI RMF 1.0) and is broadly accurate;
  the AILD milestone (2025-01-01) reflects the *proposal* — the directive was subsequently
  withdrawn by the Commission in 2025, so this row is stale.
- Classification is keyword-heuristic: use-case phrasing outside the keyword lists can
  misclassify (e.g. "loan underwriting" without the word "credit" would miss the high-risk
  keyword path, though the banking sector profile would still catch it).
- Severity rates and the ×1.2 insurance uplift are judgment parameters, not actuarial estimates.
- No persistence: assessments are stateless request/response; nothing is written to the DB.

### 7.6 Framework alignment

- **EU AI Act (2024/1689)** — risk pyramid (prohibited/high/limited/minimal), Annex III scoping,
  Art 43 conformity routes, Art 50 transparency, Art 99 penalty tiers and the phase-in calendar
  are all faithfully encoded.
- **NIST AI RMF 1.0** — GOVERN/MAP/MEASURE/MANAGE with subcategory-level scoring; NIST itself
  prescribes no numeric scoring — the 0–1 scale and tier cutpoints are the platform's overlay.
- **GDPR Art 22 / Recital 71** — automated-decision safeguards mapped to concrete checklist items
  (meaningful information, logic explanation, contest rights, human review).
- **ISO/IEC 42001** — AI management system readiness proxied as `1 − NIST overall score`; a real
  ISO 42001 gap assessment would audit clause-by-clause controls.
- **Four-fifths rule (EEOC/EU equality practice)** — disparate-impact ratio < 0.8 triggers the
  equality-directive exposure flag.
