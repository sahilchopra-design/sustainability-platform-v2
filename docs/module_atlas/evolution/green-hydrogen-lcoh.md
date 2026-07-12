## 9 · Future Evolution

### 9.1 Evolution A — Align HHV/LHV convention with the engine and add live-price learning curves (analytics ladder: rung 3 → 4)

**What.** §7 rates this LCOH engine deterministic and physically correct — explicit HHV (39.4 kWh/kg), CRF, and electricity term (60–70% of LCOH), no seeded jitter in the headline number, targeting the IEA <$2/kgH₂-by-2030 benchmark. The only flagged issue: the frontend's HHV/LHV convention must be aligned with `green_hydrogen_engine.py` so frontend and backend agree, and the regional/learning-curve overlays are illustrative. Evolution A resolves the convention mismatch (one authoritative HHV/LHV basis), then deepens the illustrative overlays into real ones: regional LCOH from live electricity prices (the dominant driver, via EIA/ENTSO-E wave-1 feeds) and a learning-curve CAPEX projection calibrated to the IEA electrolyser-cost trajectory the engine already references — moving the cost-parity-timeline from illustrative to data-backed predictive.

**How.** (1) Standardise the HHV/LHV basis across page and engine so `calculate_lcoh` and the client agree. (2) Regional LCOH overlay driven by live electricity prices rather than illustrative regional factors. (3) The learning-curve overlay computes CAPEX decline from the IEA trajectory (`cost(cum) = cost₀·(cum/cum₀)^(−b)`), giving a calibrated cost-parity year rather than a stylised curve.

**Prerequisites.** Agreement on HHV vs LHV convention (documented); regional electricity-price feeds; IEA CAPEX-trajectory reference. **Acceptance:** page and engine LCOH match under one HHV/LHV basis; the regional overlay responds to live electricity prices; the learning curve reproduces the IEA trajectory and yields a calibrated parity year.

### 9.2 Evolution B — LCOH sensitivity copilot (LLM tier 2)

**What.** A copilot for hydrogen developers: "at $25/MWh power and 50% capacity factor, what's my LCOH, and what electricity price hits the IEA $2/kg target?" tool-calls the engine's LCOH endpoint and runs the goal-seek, narrating the electricity-cost dominance and stack-replacement sensitivity.

**How.** Tier-2 tool-calling over the deterministic LCOH engine (the module is tier-A and physically correct — a strong tier-2 candidate now); the grounding corpus is §5/§7 (the CRF LCOH form, the electricity-cost share, the IEA target). Because the headline LCOH has no jitter, a tier-1 explainer over rendered state ships immediately; the tier-2 upgrade adds computed what-ifs and the $2/kg goal-seek. Every $/kg figure validated against engine output.

**Prerequisites.** Evolution A's convention alignment for consistent answers; corpus embedding. **Acceptance:** every LCOH figure traces to an engine tool call; the goal-seek returns an electricity price reproducing the $2/kg target from the CRF formula; page and engine agree under the standardised convention.
