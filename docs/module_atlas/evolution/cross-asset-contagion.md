## 9 · Future Evolution

### 9.1 Evolution A — Build the propagation model: matrix, recursion, fire-sale loop (analytics ladder: rung 1 → 2)

**What.** §7's flag: the guide's contagion mechanism —
`Contagion_i(t) = Direct_shock_i + Σ_j w_ij·Contagion_j(t−1)` with an adjacency
matrix, steady-state iteration, and fire-sale amplification — does not exist. The
page decorates 40 curated asset-class link pairs with `sr()`-seeded correlations,
contagion scores, and amplification factors; no value on one tab feeds another; the
trend is a seeded sine wave. The curated link taxonomy and the 9 hand-set channel
weights are the only design assets. Evolution A implements the actual network model.

**How.** (1) Backend engine `contagion_network_engine`: a w_ij adjacency matrix over
the asset-class taxonomy (initially parameterized from the curated channel weights,
honestly labelled author-calibrated; upgradeable to estimated exposures later),
iterative propagation `x(t) = s + W·x(t−1)` to convergence with spectral-radius
checking (‖W‖ < 1 or explicit divergence reporting), and a fire-sale layer: price
impact proportional to distressed sales, feeding back as mark-to-market shocks —
the Greenwood-Landier-Thesmar structure, documented per the Atlas §8 convention.
(2) Direct shocks initialized from the platform's own scenario engines (NGFS
transition sector shocks, physical-risk EALs) instead of hand-typed values.
(3) Outputs: amplification factor = total/direct loss, per-node contagion paths, and
convergence diagnostics — replacing every seeded metric. (4) Numpy in the backend;
the 40-pair display becomes a view over the matrix.

**Prerequisites (hard).** Full PRNG purge; the w_ij parameterization must publish
its provenance (author-calibrated vs estimated) per cell; scenario-shock plumbing
from the stress-test engines. **Acceptance:** doubling one w_ij strictly increases
downstream contagion; the steady state satisfies the fixed-point equation to
tolerance; a zero-matrix run returns exactly the direct shocks.

### 9.2 Evolution B — Systemic-risk narrative for macro-prudential submissions (LLM tier 2)

**What.** The module's stated consumers — FSAP climate modules, G20 financial-
stability reporting — need the propagation *story*: which links carried the loss,
where fire-sale dynamics amplified, and what the second-round total means against
first-round losses. Evolution B drafts that narrative from the (post-Evolution A)
engine output: the shock initialization (traced to its source scenario), the top
contagion paths with their w_ij weights, the amplification decomposition
(network vs fire-sale), and the concentration findings — every number from the
solver payload, every mechanism claim tied to a matrix entry.

**How.** Tier-2 tool calls: run the propagation for a named scenario, retrieve path
decompositions, and iterate what-ifs ("mute the sovereign-bank link") as matrix
modifications the engine applies — sensitivity analysis as conversation. Grounding
corpus: §5's methodology block, the BIS WP-844 / ECB FSR references, and the
engine's model card. The fabrication validator covers loss figures and
amplification factors; mechanism language must match the engine's actual structure
(no invoking margin-call channels the model doesn't implement).

**Prerequisites (hard).** Evolution A in full — there is no model to narrate today,
and a systemic-risk narrative over seeded link scores would be indefensible in a
supervisory context. **Acceptance:** every figure in a draft matches solver output;
what-if deltas reproduce when re-run; the narrative names only transmission channels
present in the matrix parameterization.
