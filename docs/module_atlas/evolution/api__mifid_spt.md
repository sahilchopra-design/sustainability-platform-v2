## 9 · Future Evolution

### 9.1 Evolution A — Portfolio-construction under sustainability preferences (analytics ladder: rung 1 → 5)

**What.** The E12 `MiFIDSPTEngine` implements the MiFID II sustainability-preferences
suitability process (EC Delegated Reg 2021/1253): given a client's preferences across the
three legal categories (min Taxonomy %, min SFDR sustainable-investment %, PAI
consideration) and a product universe, it returns per-product match booleans, a weighted
0–100 match score, portfolio `match_rate_pct = matched/total×100`, and suitability-report
text. It is a deterministic matcher — it *screens* a given universe but does not
*construct* a compliant portfolio or handle the adjustment procedure quantitatively.
Evolution A adds construction and gap-closure.

**How.** (1) Add a portfolio-construction endpoint (rung 5 prescriptive): given the client
preferences and an investable universe, select weights maximising expected return subject
to the min-Taxonomy/min-SI/PAI constraints being met at portfolio level — scipy
constrained optimisation. (2) Quantify the adjustment procedure: when no product meets
stated preferences, compute the minimal preference relaxation that yields a suitable set,
rather than just flagging `adjustment_required`. (3) Wire product ESG metrics from the
platform's SFDR product-reporting and taxonomy modules so the match tests use computed,
not caller-asserted, alignment. (4) Bench-pin the match score and rate.

**Prerequisites.** Product ESG metrics sourced from the SFDR/taxonomy engines (they exist
on the platform); an investable-universe input with returns/risk. **Acceptance:** the
construction endpoint returns a preference-compliant weighted portfolio or a documented
minimal relaxation; product alignment traces to computed SFDR/taxonomy figures; bench pin
reproduces the match score.

### 9.2 Evolution B — Suitability-advisory copilot for sustainability preferences (LLM tier 2)

**What.** A copilot for advisers: "this client wants ≥30% Taxonomy-aligned and PAI
consideration — which of our products qualify, and what's the portfolio match rate?"
(calling `/assess/batch` and citing the per-category match booleans), then drafting the
MiFID suitability report via `/suitability-report`.

**How.** Batch assessment plus `/suitability-report` and five `/ref/*` endpoints
(preference-categories with legal citations, product-ESG-types, suitability-process,
cross-framework, timeline) that ground the regime. The cross-framework endpoint maps
preferences to SFDR Art 8/9, EU Taxonomy, and PAI RTS so the copilot explains *why* a
product qualifies. The generated report blocks become the tier-2 drafting action. Strong
node for a wealth/advisory desk.

**Prerequisites.** None hard — engine is honest and reference-complete; the
`/suitability-report` text generation exists today. **Acceptance:** every match boolean,
score, and report block traces to a tool response; the copilot cites the specific
Delegated Regulation article per preference category from the reference endpoint; it
refuses to state final suitability (an adviser judgement) and frames output as the
regulatory screening the engine computes.
