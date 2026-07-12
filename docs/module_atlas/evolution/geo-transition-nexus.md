## 9 · Future Evolution

### 9.1 Evolution A — Interaction-term risk model over sourced country indices (analytics ladder: rung 1 → 2)

**What.** §7 documents a simple but honest module: a linear convex blend `combined = (1−w)·transition + w·(100−geopolitical)` over a hand-curated 25-country seed table (no PRNG, but the numbers are literals not sourced from WGI/TPI/NGFS despite the on-page citation). Its flagged weaknesses: the blend has no interaction term (a country can't be penalised for being both fossil-dependent and unstable beyond the additive sum), `transition_delta` is a flat additive shift rather than a scenario-conditioned re-derivation, and the fossil-state screen is a single 30% threshold rather than a fiscal break-even model. Evolution A grounds the two axes in real data (transition axis from TPI management-quality/carbon-performance bands, geopolitical axis from the sibling `geopolitical-risk-index` WGI composite) and adds a multiplicative interaction so stranded-nation risk compounds.

**How.** (1) Wire the transition and geopolitical scores from real sources — the geopolitical axis can consume the CV1 index directly instead of a static literal. (2) Add `stranded_risk = f(fossil_rev_pct, instability)` with an interaction term, replacing the 30% hard threshold with a fiscal break-even/reserves-life screen. (3) Make policy-reversal `transition_delta` re-derive the combined score under the scenario, not shift it additively.

**Prerequisites.** The 25 seeded country rows replaced with sourced indices; CV1 wired as the geopolitical input. **Acceptance:** a country high on both fossil dependence and instability scores worse than the additive blend would give; policy-reversal scenarios re-rank countries; no unsourced literal drives the combined score.

### 9.2 Evolution B — Stranded-nation risk copilot (LLM tier 1 → 2)

**What.** A copilot for sovereign and transition-risk desks: "which fossil-dependent states in our portfolio are most exposed to a disorderly transition plus political instability, and what's the portfolio-weighted risk?" Tier-1 narrates the combined-score matrix and fossil-state screen from the atlas corpus; tier-2 runs the Evolution A scoring and scenario endpoints so what-ifs (geo-weight, policy reversal) are computed.

**How.** Tier 1 grounds on §5/§7 (NGFS orderly/disorderly logic, TPI, IRENA stranded-nation framing, V-Dem/WGI are cited), and since the blend is already deterministic an explainer ships early; its guardrail is disclosing that current country scores are demo literals pre-Evolution-A. Tier 2 tool-calls the scoring endpoint with geo-weight and scenario parameters; every score and portfolio-weighted-risk figure validated against tool output.

**Prerequisites.** Evolution A for sourced scores and interaction; corpus embedding. **Acceptance:** post-Evolution-A, every combined score and scenario delta traces to a tool call; the copilot cites the CV1/TPI source for each axis rather than asserting an unsourced figure.
