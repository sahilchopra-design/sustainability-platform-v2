## 9 · Future Evolution

### 9.1 Evolution A — Build the certification-workflow engine and CRI (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's Certification Readiness Index (`CRI = Σ(evidence_i·w_i)/Σ w_i × (1 − days_to_deadline/365)`) and the whole certification workflow — evidence tracking, assessor assignment, renewal escalation — do not exist; the code renders a synthetic portfolio where certification attachment and levels are random `sr()` draws unlinked to any building attribute (a Grade-A office is no more likely to be certified than a warehouse), and derives a rent uplift / cap-rate valuation from those random certifications. Evolution A builds the actual workflow module: a real asset register with evidence-completion tracking per credit category, the CRI computed per §5, assessor assignment, and deadline-driven renewal alerts — turning a synthetic valuation display into the pipeline-management tool the guide describes.

**How.** (1) An asset/certification table (scheme, stage, assessor, evidence items with weights, renewal deadline). (2) `CRI` computed from evidence completion weighted by credit-category importance and discounted by time-to-deadline; assets >0.75 on-track, <0.50 within 90 days escalate. (3) Certification status driven by actual building attributes and evidence, not random attachment.

**Prerequisites.** A real asset register (user-supplied or imported); credit-category weights per scheme. The random certification attachment (§7-flagged) must be removed. **Acceptance:** CRI computes per the §5 formula from evidence-completion data; escalation alerts fire on the deadline/threshold rule; certification status reflects real building/evidence attributes, not `sr()`.

### 9.2 Evolution B — Certification pipeline copilot (LLM tier 2)

**What.** A copilot for sustainability/asset managers: "which assets are at risk of certificate lapse this quarter, and what evidence is outstanding for BREEAM renewal?" tool-calls the Evolution A CRI and evidence endpoints, ranks at-risk assets, and drafts the assessor-assignment and evidence-collection plan.

**How.** Tier-2 tool-calling over the workflow endpoints; the grounding corpus is §5/§7 (BREEAM/LEED/WELL/NABERS schemes, the CRI definition, renewal-workflow logic). The copilot's value is pipeline triage — surfacing lapse risk and outstanding evidence per asset. Guardrail, pre-Evolution-A: because the portfolio is synthetic with random certifications, it must refuse asset-specific readiness claims. Every CRI and deadline figure validated against tool output.

**Prerequisites.** Evolution A (no workflow engine today); RBAC-scoped asset register; corpus embedding. **Acceptance:** post-Evolution-A, every CRI and evidence-status figure traces to a tool call; the escalation list matches the deadline/threshold rule; pre-Evolution-A, asset-readiness questions are declined.
