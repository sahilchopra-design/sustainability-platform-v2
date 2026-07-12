## 9 · Future Evolution

### 9.1 Evolution A — Climate-stressed yield and probabilistic IRR on the real timber model (analytics ladder: rung 2 → 3)

**What.** This module is a genuine engineering-finance calculator: it computes IAS 41 biological-asset value, a mean-annual-increment growth model (`finalVolM3 = landHa·250·(1+MAIR)^rotatYr`), FSC-premium-adjusted timber revenue, dual carbon-timber cash flows, and a real DCF NPV over the rotation. Its overview promises climate-risk stress-testing of yield (drought/fire/pest) and IRR sensitivity, but the digest shows the yield model is deterministic — climate risk is not yet applied to the growth curve. Evolution A adds the stress layer: a hazard-adjusted MAIR that reduces the increment under drought/fire/pest scenarios, driven by the platform's own physical-risk digital twin (the wildfire and drought grids already populated), plus a Monte Carlo (deterministic QMC) pass over price, yield, and hazard inputs for an IRR distribution rather than a point estimate.

**How.** (1) Introduce `MAIR_stressed = MAIR·(1 − hazard_loss)` where hazard_loss comes from the coordinate's wildfire FWI / drought index in the digital twin. (2) The existing `carbonSensData` sensitivity generalises to a 2D price×hazard grid. (3) A Halton-QMC wrapper over the DCF (reusing the platform's PRNG-free QMC pattern) yields P10–P90 IRR and NPV.

**Prerequisites.** Timberland coordinates to look up hazard grids; the curated `FOREST_TYPES`/`CARBON_METHODOLOGIES` tables kept as defaults. **Acceptance:** a plantation in a high-FWI location shows lower stressed yield and IRR than an identical low-hazard one; IRR renders as a distribution with hazard as a driver.

### 9.2 Evolution B — Timberland investment-committee copilot (LLM tier 1 → 2)

**What.** A copilot for TIMO and infra-fund users: "value this 10,000 ha eucalyptus plantation with FSC premium and IFM carbon at $20/t, then stress it for fire risk" — tier-1 narrates the IAS 41 valuation, FSC premium, and carbon-methodology comparison from the atlas corpus; tier-2 runs the Evolution A DCF/stress endpoints so the valuation and IRR sensitivity are computed.

**How.** Tier 1 grounds on §5/§7 (IAS 41 fair-value approach, VCS IFM methodology, FSC/PEFC premiums, the return-benchmark table are all documented), and since the DCF is already real, an explanation-only copilot ships before backend work. Tier 2 wraps the NPV/IRR and hazard-stress endpoints; carbon-price and hazard what-ifs are engine-computed. Every $/ha, IRR, and NPV figure validated against tool output.

**Prerequisites.** Evolution A for stress what-ifs; corpus embedding. **Acceptance:** valuation and IRR figures in a copilot answer trace to tool calls or rendered page state; asked for a species-specific pest-mortality probability the model doesn't produce, the copilot refuses and points to the hazard-stress sensitivity as the supported view.
