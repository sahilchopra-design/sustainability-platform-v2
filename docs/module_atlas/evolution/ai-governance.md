## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the engine + add SHAP explainability (analytics ladder: rung 3 → 4)

**What.** This is a genuine tier-A vertical: `ai_governance_engine` (E77) implements EU AI Act
2024/1689 tiering, NIST RMF, OECD Principles, energy/Scope-2 footprint, and a real disparate-
impact bias assessment (DIR < 0.80 EEOC 4/5 rule, SPD, equalized odds) — standards-grounded,
bench-passing (§4.2 shows `/assess`, `/bias-assessment`, `/energy-footprint` all pass). But §7.5
documents two gaps: the React page is **disconnected** — it renders seeded `sr()` systems and
makes zero API calls — and **SHAP is not implemented** despite the guide's headline
(`SHAP_i = Σ...·[f(S∪{i}) − f(S)]`), with explainability standing in as model-card completeness
only. Evolution A wires the page to the live engine and adds a real SHAP layer for the platform's
own ML models (greenwashing detector, ESG scorers), producing the waterfall/beeswarm the page
already has UI slots for.

**How.** Replace the page's PRNG system generation with calls to `POST /assess` and `/portfolio`;
add `POST /api/v1/ai-governance/explainability` computing SHAP values (the `shap` library over
the platform's sklearn models) and a fairness gap `max_group(acc) − min_group(acc)` alongside the
existing DIR. Rung 4 (predictive): a PSI drift monitor `PSI = Σ(actual% − expected%)·ln(actual/
expected)` over feature snapshots, triggering retraining alerts at PSI > 0.2 as the guide
specifies — the platform has model-inference history to baseline against.

**Prerequisites (hard).** Purge the disconnected page's `sr()` draws per the no-fabricated-random
guardrail; the engine's one-time training energy should be amortised (it notes this) before the
Environmental pillar treats it as annual. **Acceptance:** the §7.4 worked example (credit-scoring
system → ESG composite 69.9 "advanced") renders from a live `/assess` call, not a random draw;
a SHAP waterfall reproduces additive feature contributions summing to model output; PSI > 0.2
raises a retraining flag.

### 9.2 Evolution B — AI Act compliance copilot with tool-called assessment (LLM tier 2)

**What.** A copilot on the AI Governance Hub that runs real assessments in natural language:
"classify our credit-scoring model under the EU AI Act" tool-calls `/eu-ai-act` (→ high-risk,
Annex III essential-services, Art. 9–49 obligations); "what's its bias exposure?" calls
`/bias-assessment` (→ DIR per protected characteristic, 4/5-rule flags); "estimate its Scope 2"
calls `/energy-footprint`; "assemble the ISO 42001 model card" checks completeness and lists
missing blocking fields. It narrates the engine's real outputs and the fine-exposure calc
(`maxFine = max(30, revenue·0.06)` × unmet/total requirements) — the numbers the page already
computes from `euLive`.

**How.** Tool schemas from the engine's 6 POST operations + 4 `ref/*` endpoints (which already
pass the lineage harness); the no-fabrication validator checks every score, DIR and tCO₂e against
tool outputs. The four `ref/*` endpoints (EU AI Act tiers, NIST functions, OECD principles, bias
metrics) are the ideal RAG grounding for "what does Art. 11 require?" style questions — a tier-1
explainer wrapping a tier-2 operator.

**Prerequisites.** Atlas + `ref/*` corpus embedded (roadmap D3); RBAC so assessments run under the
user's session. **Acceptance:** every numeric in an answer traces to an engine tool call; asking
for a SHAP explanation before Evolution A returns a refusal noting explainability is currently
model-card completeness only; an out-of-scope system is correctly classified minimal-risk with no
fabricated obligations.
