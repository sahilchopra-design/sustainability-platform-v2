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
