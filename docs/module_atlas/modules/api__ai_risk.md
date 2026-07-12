# Api::Ai_Risk
**Module ID:** `api::ai_risk` · **Route:** `/api/v1/ai-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ai-risk/classify-system` | `classify_system` | api/v1/routes/ai_risk.py |
| POST | `/api/v1/ai-risk/assess-nist-rmf` | `assess_nist_rmf_endpoint` | api/v1/routes/ai_risk.py |
| POST | `/api/v1/ai-risk/detect-bias` | `detect_bias` | api/v1/routes/ai_risk.py |
| POST | `/api/v1/ai-risk/score-explainability` | `score_explainability_endpoint` | api/v1/routes/ai_risk.py |
| POST | `/api/v1/ai-risk/calculate-liability` | `calculate_liability` | api/v1/routes/ai_risk.py |
| GET | `/api/v1/ai-risk/ref/annex3-categories` | `get_annex3_categories` | api/v1/routes/ai_risk.py |
| GET | `/api/v1/ai-risk/ref/prohibited-practices` | `get_prohibited_practices` | api/v1/routes/ai_risk.py |
| GET | `/api/v1/ai-risk/ref/nist-functions` | `get_nist_functions` | api/v1/routes/ai_risk.py |
| GET | `/api/v1/ai-risk/ref/bias-metrics` | `get_bias_metrics` | api/v1/routes/ai_risk.py |
| GET | `/api/v1/ai-risk/ref/enforcement-timeline` | `get_enforcement_timeline` | api/v1/routes/ai_risk.py |

### 2.3 Engine `ai_risk_engine` (services/ai_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `classify_ai_system` | entity_id, system_name, use_case, sector, automated_decision_making, training_compute_flops, global_annual_turnover_usd |  |
| `assess_nist_rmf` | entity_id, system_name, functions, subcategory_scores |  |
| `detect_algorithmic_bias` | entity_id, model_type, protected_attributes, performance_metrics |  |
| `score_explainability` | entity_id, model_type, explanation_methods, compliance_attestations |  |
| `calculate_ai_liability` | entity_id, system_type, harm_scenarios, standard_policy_coverage_usd, damage_severity_rates, do_inputs |  |

**Engine `ai_risk_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ANNEX3_HIGH_RISK_CATEGORIES` | `[{'id': 'A3-01', 'category': 'Critical Infrastructure', 'description': 'Safety components of infrastructure (water, gas, electricity, transport)', 'examples': ['SCADA safety systems', 'traffic management', 'grid balancing']}, {'id': 'A3-02', 'category': 'Education & Vocational Training', 'descriptio` |
| `PROHIBITED_PRACTICES` | `[{'id': 'PP-01', 'practice': 'Subliminal Manipulation', 'article': 'Art 5(1)(a)', 'description': "AI techniques beyond a person's consciousness to distort behaviour causing harm", 'example': 'Subliminal advertising in recommendation systems'}, {'id': 'PP-02', 'practice': 'Vulnerability Exploitation'` |
| `NIST_RMF_FUNCTIONS` | `{'GOVERN': {'description': 'Establish AI risk governance culture and oversight', 'subcategories': ['GOV-1.1', 'GOV-1.2', 'GOV-1.3', 'GOV-1.4', 'GOV-1.5', 'GOV-1.6', 'GOV-1.7', 'GOV-2.1', 'GOV-2.2', 'GOV-3.1', 'GOV-3.2', 'GOV-4.1', 'GOV-4.2', 'GOV-5.1', 'GOV-5.2', 'GOV-6.1', 'GOV-6.2']}, 'MAP': {'des` |
| `BIAS_METRICS` | `[{'metric': 'demographic_parity', 'description': 'P(Y_hat=1\|A=0) = P(Y_hat=1\|A=1)', 'threshold': 0.1, 'gdpr_relevant': True}, {'metric': 'equalised_odds', 'description': 'Equal TPR and FPR across protected groups', 'threshold': 0.1, 'gdpr_relevant': True}, {'metric': 'calibration', 'description': ` |
| `SECTOR_AI_RISK_PROFILES` | `{'banking': {'baseline_risk': 'high_risk', 'primary_categories': ['A3-04', 'A3-05'], 'regulatory_overlap': ['CRR', 'EBA_ML_Guidelines', 'GDPR']}, 'insurance': {'baseline_risk': 'high_risk', 'primary_categories': ['A3-04'], 'regulatory_overlap': ['Solvency_II', 'IDD', 'GDPR']}, 'healthcare': {'baseli` |
| `ENFORCEMENT_TIMELINE` | `[{'date': '2024-08-01', 'milestone': 'AI Act entry into force', 'detail': 'Regulation (EU) 2024/1689 published in OJ; 24-month general application countdown begins'}, {'date': '2025-02-02', 'milestone': 'Prohibited practices apply', 'detail': '6-month phase: Art 5 prohibitions on subliminal manipula` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `AI`, `August`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ai-risk/ref/annex3-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'annex', 'categories_count', 'categories'], 'n_keys': 4}`

**GET /api/v1/ai-risk/ref/bias-metrics** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'regulatory_basis', 'metrics_count', 'metrics', 'intersectionality_note'], 'n_keys': 5}`

**GET /api/v1/ai-risk/ref/enforcement-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'entry_into_force', 'general_application', 'milestones', 'penalty_regime'], 'n_keys': 5}`

**GET /api/v1/ai-risk/ref/nist-functions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'version', 'published', 'total_subcategories', 'functions'], 'n_keys': 5}`

**GET /api/v1/ai-risk/ref/prohibited-practices** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'article', 'effective_date', 'practices_count', 'practices'], 'n_keys': 5}`

**POST /api/v1/ai-risk/assess-nist-rmf** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ai-risk/calculate-liability** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ai-risk/classify-system** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `ai_risk_engine` — extracted transformation lines:**
```python
max_penalty_usd = round(global_annual_turnover_usd * max_penalty_pct_global_turnover / 100, 0)
func_avg = round(func_sum / func_count, 3) if func_count else None
overall_score = total_score / total_count
attr_avg_bias = round(attr_bias_sum / attr_measured, 4) if attr_measured else None
overall_bias_score = round(overall_bias_sum / overall_bias_count, 4) if overall_bias_count else None
method_coverage_score = min(method_count / 4, 1.0)
annex12_score = sum(annex12_requirements.values()) / len(annex12_requirements)
gdpr_rec71_score = sum(gdpr_rec71_compliance.values()) / len(gdpr_rec71_compliance)
combined_score = (method_coverage_score * 0.4 + annex12_score * 0.35 + gdpr_rec71_score * 0.25)
damage_category_rates = {**DEFAULT_DAMAGE_SEVERITY_RATES, **(damage_severity_rates or {})}
expected_loss = probability * harm_magnitude_usd * rate
strict_liability_exposure = harm_magnitude_usd * rate  # no fault needed
coverage_gap_usd = round(max(0.0, total_liability_usd - float(standard_policy_coverage_usd)), 0)
recommended_additional_coverage_usd = round(coverage_gap_usd * 1.2, 0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Persist assessments and calibrate liability parameters (analytics ladder: rung 1 → 3)

**What.** This is a clean tier-A backend vertical: `ai_risk_engine` (E76) is a rules-based EU AI
Act / NIST AI RMF compliance engine that already follows the no-fabrication convention — every
output derives from caller inputs, missing inputs propagate as `None`/`insufficient_data` (§7.1),
and the reference data (Annex III 23 categories, Art 5 prohibitions, NIST 63 subcategories,
enforcement timeline) is hand-encoded from the actual legal texts. Its honest gaps: classification
is keyword-heuristic (§7.5 — "loan underwriting" without "credit" could misclassify), the severity
rates and ×1.2 insurance uplift are judgment parameters not actuarial estimates, and it is stateless
(nothing persists). Evolution A adds persistence (an `ai_risk_assessments` table so classifications
are auditable and trend over time), replaces the keyword classifier with a more robust use-case
matcher, and calibrates the liability severity rates against observed AI-harm settlement data.

**How.** Wire the engine to the `ai_risk_assessments` table for write-side persistence (the
platform's D1 write-side activation pattern); `POST /classify-system` stores each result with the
enforcement-timeline phase it falls under. Rung 3: the damage-severity rates (physical 0.55,
property 0.40, fundamental-rights 0.325) become calibrated against a reference dataset of AI
liability cases rather than fixed priors; the four-fifths-rule bias threshold stays as-is (it is a
real legal standard).

**Prerequisites (hard).** Fix the lineage-harness failures first — §4.2 shows `POST /assess-nist-rmf`
and `/calculate-liability` **failed** and `/classify-system` **skipped**; refresh the stale AILD
milestone (the directive was withdrawn in 2025, §7.5). **Acceptance:** the §7.4 liability worked
example ($130k expected loss, $0 coverage gap) reproduces; a classification is persisted and
retrievable; the three currently-failing POST endpoints pass the harness.

### 9.2 Evolution B — EU AI Act compliance analyst with tool-called classification (LLM tier 2)

**What.** This engine's typed endpoints and legally-grounded reference data make it an ideal tier-2
analyst target: "classify our resume-screening model" tool-calls `/classify-system` (→ high-risk
Annex III employment, Art 8–15 obligations, penalty ceiling), "what's our liability exposure?" calls
`/calculate-liability` (expected loss + insurance gap under PLD vs AILD routing), "score our NIST
maturity" calls `/assess-nist-rmf`, and "explain Annex III category A3-04" reads the reference
endpoints. The copilot narrates the engine's real deterministic output — never inventing obligations
or penalties.

**How.** Tool schemas from the 5 POST + 5 GET operations (already Pydantic-typed and mostly passing
the harness); the five `ref/*` endpoints (Annex III, prohibited practices, NIST functions, bias
metrics, enforcement timeline) are ideal RAG grounding for "what does Art 5 prohibit?" questions —
a tier-1 explainer wrapping the tier-2 operator. The no-fabrication validator checks every penalty
figure and score against tool output; the keyword-classification caveat means the copilot should
surface *why* a system was classified (which keyword/sector-profile fired) so a user can correct a
borderline case.

**Prerequisites.** Evolution A's harness fixes (a tool-calling agent needs working endpoints); Atlas
+ `ref/*` corpus embedded (roadmap D3). **Acceptance:** every numeric in an answer traces to an
engine tool call; a prohibited-practice system (e.g. "social scoring") is correctly classified
unacceptable with the Art 5 citation; asking for a penalty figure without supplying turnover returns
the honest "penalty ceiling requires turnover" the engine already produces.