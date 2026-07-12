## 9 · Future Evolution

### 9.1 Evolution A — Geostatistical well-success and calibrated Monte Carlo (analytics ladder: rung 2 → 4)

**What.** §7 credits this tier-A module with genuine project-finance engineering: phased debt sizing, DSCR, Newton-Raphson equity IRR, project NPV, a well-success probability composite, a 200-path Monte-Carlo IRR distribution, and a dry-well contingency — no guide↔code mismatch. Its flagged weaknesses are the path to predictive rigour: the Monte-Carlo input variability is `sr()`-seeded (±15/20/10% uniform bands, a stylised envelope not a calibrated risk model), well-success is a weighted-average composite rather than a geostatistical P10/P50/P90 flow-rate distribution (the guide's GeothermEx reference implies the latter), and dry-well cost is a flat 0.55×0.4 heuristic. Evolution A upgrades the risk core: a resource-productivity distribution (P10/P50/P90 flow rates) driving the IRR Monte Carlo, and a stochastic drilling-programme simulation for dry-well cost — replacing the seeded uniform bands with calibrated, resource-grounded distributions.

**How.** (1) Replace the `sr()` uniform input bands with a productivity distribution parameterised from temperature-gradient/permeability inputs (P10/P50/P90), run through a deterministic QMC (Halton, per platform convention) instead of PRNG. (2) A drilling-programme simulation: sequential wells with per-well success probability, accumulating dry-well write-offs stochastically. (3) The IRR distribution and DSCR then reflect resource uncertainty, moving the module toward rung-4 predictive risk.

**Prerequisites.** Resource-productivity distribution parameters (ESMAP/IFC benchmarks acceptable, documented per §8); the `sr()` Monte-Carlo replaced by QMC to satisfy the platform's no-fabricated-random guardrail. **Acceptance:** the IRR distribution responds to P10/P50/P90 productivity inputs; dry-well cost emerges from a simulated drilling programme; bench_quant pins a reference case.

### 9.2 Evolution B — Geothermal financing-structure copilot (LLM tier 2)

**What.** A copilot for project-finance and DFI structuring teams: "size senior debt for a $300M geothermal project at 1.35× min DSCR, then show the equity-IRR distribution under P50 resource risk" tool-calls the debt-sizing, DSCR, and Monte-Carlo endpoints and narrates the ESMAP-phased capital structure and dry-well contingency.

**How.** Tier-2 tool-calling over the project-finance endpoints (debt sizing, IRR, Monte Carlo are natural tool surfaces); the grounding corpus is §5/§7 (World Bank ESMAP handbook, IFC GGSP concessional risk-sharing, Moody's-style credit tiers in `FINANCING_STRUCTURES`). The copilot's value is translating resource risk into financing terms — how dry-well probability drives the required contingency and concessional-finance need. Every DSCR, IRR, and percentile figure validated against tool output.

**Prerequisites.** Evolution A for resource-grounded IRR distributions (the current `sr()` envelope shouldn't back financing advice); RBAC-scoped deal data. **Acceptance:** every DSCR and IRR-percentile figure in a copilot answer traces to a tool call; asked for a bankable P90 IRR pre-Evolution-A, the copilot flags the current distribution as a stylised envelope, not a calibrated risk model.
