## 9 · Future Evolution

### 9.1 Evolution A — Proper experimental design and repaired scenario-hub reads (analytics ladder: rung 2 → 4)

**What.** The sensitivity/attribution toolkit layered on the scenario hub: every method perturbs a
scenario's trajectories and re-runs `builder_engine.calculate_impacts` — tornado (±20% swings),
what-if, leave-one-out attribution, elasticity (1% bump, banded), partial correlation (50 MC
samples, U(0.8,1.2) factors), and OLS attribution (80 samples, normal-equation OLS via Gaussian
elimination), plus CSV/JSON/PDF export. It's a real sensitivity lab, but the sample counts (50/80)
are small for stable correlation/OLS estimates, the OLS is hand-rolled, and §4.2 shows the
scenario-keyed reads (`/interactions/{id}`, tornado/waterfall visualizations, custom-scenario
key-drivers) all trace **failed / db-empty**. Evolution A hardens the statistics and the reads.

**How.** (1) Fix the failing `hub_scenarios`/`custom_scenarios_v2` reads so the visualization and
interaction endpoints work against stored scenarios. (2) Upgrade the sampling: Latin-hypercube or
Sobol sequences (the QMC pattern from Financial Modeling Studio the roadmap names) with convergence
diagnostics, replacing 50–80 uniform draws; swap the hand-rolled OLS for numpy/statsmodels with
standard errors. (3) Add global sensitivity indices (Sobol first-order/total) so interaction
effects are measured rigorously rather than via pairwise joint-run heuristics. (4) Bench-pin the
tornado swings and attribution normalisation.

**Prerequisites.** Scenario-hub reads repaired; numpy/statsmodels wiring (already in the
environment); the underlying `builder_engine` fidelity (its own Evolution A). **Acceptance:**
tornado/waterfall/interactions return `passed` for stored scenarios; correlation/OLS report
standard errors and converge under doubled samples; Sobol indices available; results bench-pinned.

### 9.2 Evolution B — Driver-analysis copilot over the scenario hub (LLM tier 2)

**What.** A copilot that answers the analyst's core question — "what drives this scenario's
outcome?" — by running the tornado (`/sensitivity-analysis`), attribution (`/attribution`), and
elasticity tools and narrating the ranked drivers: "temperature outcome is most sensitive to the
coal-phase-out trajectory (swing 0.4°C); carbon price is unit-elastic; the interaction between gas
and renewables shares is weak."

**How.** Seven analytical POST/GET methods form an ideal tier-2 tool set because each returns a
structured decomposition the copilot can rank and narrate; `/parameters` grounds what can be
analysed. The what-if endpoint powers conversational perturbations ("bump 2030 carbon price 20%")
and the auto-insights (|Δ%| > 5) seed the narrative. Export endpoints deliver the artifact. This
copilot naturally chains with the `scenario_builder_v2` copilot — build, then explain.

**Prerequisites.** Evolution A's read repairs (most scenario-keyed endpoints currently fail);
statistical hardening before narrating correlation/OLS attributions as findings. **Acceptance:**
every swing, elasticity, and contribution traces to a tool response; driver rankings match the
returned decomposition ordering; the copilot discloses sample sizes and uncertainty on
correlation/OLS attributions and refuses causal language for what are perturbation sensitivities.
