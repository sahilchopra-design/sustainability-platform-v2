## 9 · Future Evolution

### 9.1 Evolution A — Compute graph-based risk propagation instead of hard-coded scenario impacts (analytics ladder: rung 1 → 3)

**What.** The §7 flag catches a double overstatement: the guide's `PropagatedRisk = SourceRisk × DependencyWeight × AttenuationFactor^tier` and the page's own in-app methodology footer (claiming CDP/Bloomberg SPLC data, "Bayesian network inference with conditional probability tables," and "Monte Carlo with 10,000 iterations") are **all unimplemented** — the four scenario impacts (35%, 42%, 28%, 25%) are hard-coded literals with no attenuation function, no CPTs, no Monte Carlo. The genuine content is a hand-authored 20-node/25-edge static graph. But three real calculations do exist: single-point-of-failure detection (`inLinks===1 && outLinks≥2`), a count-based HHI per category (correctly using DOJ/FTC 2500/5000 bands), and critical-path analysis. Blast radius 81. Evolution A builds the propagation model the page claims to have.

**How.** (1) Implement the `AttenuationFactor^tier` propagation the guide names: a disruption at any node propagates upstream through the DAG with per-tier attenuation and dependency weighting, computing portfolio revenue-at-risk — so scenario impacts are *derived from the graph*, not literals. (2) Make scenarios parameterisable (any node/severity), not just the 4 pre-scripted geopolitical events (China REE, DRC cobalt, Ukraine neon, Russia PGM). (3) Either implement the claimed Monte Carlo (propagation with uncertainty over dependency weights) or remove the false-precision "10,000 iterations" methodology claim. (4) Weight the HHI by revenue/spend where data allows (currently count-based). (5) Ground the graph in real supplier relationships via the shared backend.

**Prerequisites.** A DAG-propagation engine; real edge dependency weights; the shared compute-route fixes. **Acceptance:** scenario impact percentages are computed from graph propagation, not literals; a disruption at any node produces a propagated revenue-at-risk; the methodology footer's claims match the implementation.

### 9.2 Evolution B — Network-disruption war-gaming copilot (LLM tier 2)

**What.** A copilot for the supply-chain risk analyst: "simulate an REE export-control disruption and show the propagation through my network", "which nodes are single points of failure?", "where is my worst supplier concentration?" — driving the (Evolution-A) propagation model and narrating the cascade path, revenue-at-risk, SPOF nodes, and HHI concentration.

**How.** Tier-2 pattern once propagation is computed: the disruption-simulation and SPOF/HHI analytics become tools; the copilot narrates propagation with per-tier attenuation, cites the DOJ/FTC HHI bands for concentration verdicts, and identifies critical nodes from the real graph-structure calculations. The no-fabrication validator checks every impact figure against the propagation output; concentration claims cite the HHI thresholds.

**Prerequisites (hard).** Evolution A — with hard-coded scenario impacts and a falsely-claimed Monte Carlo, the copilot would present literal constants as simulation output with invented precision. **Acceptance:** every propagated-impact figure traces to a graph-propagation run; SPOF/HHI claims match the real structural calculations; a disruption at an off-graph node returns "not in network," not an estimate.
