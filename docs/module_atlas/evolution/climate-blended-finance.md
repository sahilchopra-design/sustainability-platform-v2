## 9 · Future Evolution

### 9.1 Evolution A — Build the structuring engine; fix the inconsistent leverage KPI (analytics ladder: rung 1 → 2)

**What.** §7 documents both a missing engine and an internal inconsistency: the guide
promises first-loss tranche sizing, guarantee mechanics, and a discounted
`BlendedIRR`, but the page is a browser over 50 synthetic transactions — and the
displayed `leverageRatio` is an independent random draw (`1 + sr(i·13)·9`) that
contradicts the public/private split shown in the same row. Evolution A ships the
structuring engine the guide describes: a tranche waterfall (first-loss → mezzanine →
senior) where loss scenarios propagate bottom-up, target-leverage tranche sizing
solved from a private investor's required risk/return, guarantee pricing as expected-
loss coverage, and `BlendedIRR` computed from discounted private cash flows.

**How.** (1) `sizeFirstLoss(dealSize, lossDist, seniorTargetRating)` and a waterfall
evaluator as pure functions; leverage derived as `private/catalytic` — the guide's own
formula — everywhere it appears, eliminating the inconsistent draw. (2) Transaction
browser re-based: either Convergence's published deal database (licensing permitting)
or internally consistent fixtures where leverage is computed from the splits.
(3) Scenario grid (rung 2): leverage achieved vs first-loss percentage × sector risk,
the chart DFI structuring teams actually need.

**Prerequisites (hard).** The self-contradicting leverage field is a defect to fix
regardless of the rest; loss-distribution assumptions per sector documented per §8
model-card convention. **Acceptance:** every displayed leverage equals
private/catalytic for that row; a fixture deal with a known loss distribution
reproduces a hand-computed first-loss size; the mismatch flag clears.

### 9.2 Evolution B — Deal-structuring copilot (LLM tier 2)

**What.** An assistant for DFI teams: "structure a $100M adaptation deal in
Sub-Saharan Africa to hit 4x leverage — what first-loss do I need?", "why does a
guarantee beat a concessional loan here?", "benchmark this leverage against comparable
transactions" — the sizing questions as tool calls into the Evolution A engine, the
benchmarking as filtered aggregations over the (fixed) transaction table, the
instrument-choice reasoning grounded in the OECD/IFC principles corpus §5 cites.

**How.** Client-side tool schemas over the waterfall/sizing functions (no backend
routes exist); the no-fabrication validator ties every ratio and IRR to invocations;
Convergence-style benchmark claims cite the transaction table's provenance status
explicitly (fixture vs sourced).

**Prerequisites (hard).** Evolution A first — today the only leverage numbers
available are the random draws §7 flagged, and structuring advice on top of them
would be malpractice-shaped. **Acceptance:** a recommended structure is reproducible
by re-running the sizing function with the stated parameters; the copilot refuses
country-risk pricing questions the engine doesn't model.
