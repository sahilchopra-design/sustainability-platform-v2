## 9 · Future Evolution

### 9.1 Evolution A — Build the actual fairness engine the guide claims (analytics ladder: rung 1 → 2)

**What.** §7 flags a total guide↔code gap: the guide promises an AI model-governance fairness engine — Disparate Impact Ratio (`DIR = P(ŷ=1|A)/P(ŷ=1|B)`), the four-fifths rule, SHAP/LIME explainability, adversarial-robustness testing, EU AI Act Article-10 conformity — but the code renders a portfolio geopolitical + AI/tech-governance scorecard where each holding's AI-governance/cyber/data-breach scores are `sRand(seed(ticker))`-generated. No DIR, no SHAP, no fairness metric exists, and the page's body is byte-identical to `geopolitical-esg-hub`. Only `AI_REGS` (the EU AI Act penalty tiers) is genuinely sourced. Evolution A builds the module's first real vertical: a fairness engine that computes DIR over a model's actual predictions grouped by region/regime, applies the four-fifths rule, and generates SHAP feature attributions — operating on a real geopolitical model's outputs (e.g. the CV1 index) rather than seeded scores.

**How.** (1) A backend route taking a model's predictions and protected-group labels, returning DIR per group pair and a four-fifths pass/fail. (2) SHAP attributions via the `shap`/`sklearn` tooling the roadmap notes is in the environment, on a concrete geopolitical scoring model. (3) Adversarial robustness as structured scenario perturbations measuring score stability.

**Prerequisites.** A real model to govern (the platform's own geopolitical scorers are candidates); the seeded scorecard removed — it is a §7-flagged fabrication and must not masquerade as fairness data. The duplicate-code issue with `geopolitical-esg-hub` should be resolved so the two modules diverge. **Acceptance:** DIR is computed from real prediction rates and flags <0.80; SHAP attributions render for a named model; no `sRand()` governance score remains.

### 9.2 Evolution B — AI-governance conformity copilot (LLM tier 2)

**What.** A copilot for model-risk and compliance teams: "does our geopolitical scoring model pass the four-fifths rule across regions, and what EU AI Act obligations apply?" tool-calls the Evolution A DIR/SHAP endpoints and narrates the result against the genuinely-sourced `AI_REGS` regulatory facts (the €35M/7%-turnover tier, high-risk-system regime).

**How.** Tier-2 tool-calling over the fairness endpoints; the grounding corpus is §5/§7 plus the real `AI_REGS` dataset — the copilot's regulatory answers are credible because that table is sourced, while its fairness numbers come only from tool calls. Its critical guardrail, pre-Evolution-A: it must refuse to report any DIR/fairness figure because §7 shows none is computed, answering only the sourced regulatory questions. Post-Evolution-A, every DIR and attribution is validated against tool output.

**Prerequisites.** Evolution A (there is no fairness computation today); corpus embedding. **Acceptance:** regulatory answers cite the specific `AI_REGS` row; a DIR question pre-Evolution-A returns a documented refusal; post-Evolution-A every fairness figure traces to a tool call.
