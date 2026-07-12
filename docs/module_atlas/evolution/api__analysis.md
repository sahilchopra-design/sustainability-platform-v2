## 9 · Future Evolution

### 9.1 Evolution A — Trajectory-parameterised impact instead of lossy category mapping (analytics ladder: rung 2 → 4)

**What.** This is the platform's scenario workbench — a genuine tier-A domain persisting
comparisons, gap analyses, consistency checks and custom scenarios over real ingested NGFS/IEA
trajectories, running a 10k-path Monte-Carlo climate credit engine. It is already rung 2. But §7.5
documents its central weakness: the category→engine mapping is **lossy** — all scenario richness
(carbon-price path, sectoral detail) collapses into 3 discrete stress presets, so two different
1.5°C scenarios produce *identical* credit impacts, and the extracted multipliers are displayed but
never parameterise the PD/LGD shocks. Evolution A feeds the actual trajectory values (carbon price
by year, emissions path, temperature) into the credit engine's shock calibration, so scenario
specificity flows through to expected loss and VaR.

**How.** Extend `run_impact_calculation` to accept the extracted multipliers as shock parameters,
not just the 3-bucket category; the substring alias matcher (`"policy" in category`) is replaced by
a structured scenario-metadata join so novel labels don't misroute. Rung 4 (predictive): remove the
fixed `random_seed=42` in favour of reported Monte-Carlo confidence intervals, and let the
consistency-check engine forecast whether a blended custom scenario's dependent variables stay
coherent.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `GET /comparisons/{id}`,
`/data`, and `/reports/download/{filename}` **failed** (db-empty); seed a demo comparison so the
detail paths return data (roadmap D0). The flat `correlation=0.3` should become an asset-class
correlation input. **Acceptance:** two distinct 1.5°C scenarios now produce different EL/VaR (they
are identical today); a blended NZE-price-over-STEPS-emissions scenario is flagged by the
consistency check; the detail endpoints pass the harness.

### 9.2 Evolution B — Scenario-analysis analyst driving the workbench (LLM tier 2)

**What.** A tool-calling analyst executing the TCFD/ISSB S2 scenario-analysis workflow in natural
language: "compare NGFS Net Zero, Delayed Transition and Current Policies for my portfolio"
tool-calls `/compare` and `/impact`, "where's my biggest gap under disorderly?" calls
`/gap-analysis`, "is this custom scenario internally consistent?" calls `/consistency-check`, and
"generate the report" calls `/reports/generate` — narrating real engine outputs and the extracted
scenario multipliers (carbon price, emissions change, 2050 temperature) alongside the credit
results.

**How.** Tool schemas from the domain's ~19 endpoints; the custom-scenario blending
(`build_custom_scenario`) with its per-trajectory source lineage is ideal for LLM-assisted "build me
a scenario that's NZE power but delayed transport" workflows — the LLM composes the override list,
the engine executes and stamps provenance. The no-fabrication validator checks every EL, VaR and
gap figure against tool output; the "show work" expander surfaces which scenario trajectories and
Monte-Carlo settings produced each number.

**Prerequisites.** Evolution A (so narrated impacts actually reflect scenario specificity);
harness-passing endpoints; Atlas corpus embedded (roadmap D3). **Acceptance:** every numeric in an
answer traces to a workbench tool call; a copilot-built custom scenario carries the same auditable
`{base, overrides}` lineage the engine already stamps; the report generated matches the impact-run
figures exactly.
