## 9 · Future Evolution

### 9.1 Evolution A — Weighted composite + real SLR exposure (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide specifies a weighted composite (`PortRisk = w_P·PhysicalHazard + w_T·TransitionRisk + w_O·OperationalDisruption`) and a multiplicative `PhysicalExposure = SLR_penetration × InfrastructureVulnerability × TradeValue`, but the code uses only an unweighted mean of four hazard scores; transition risk, SLR penetration, and infrastructure vulnerability never enter any formula, and every hazard/capex value is an independent `sr()` draw over real port names. Evolution A builds the documented models over real hazard data.

**How.** (1) Implement the weighted composite with the transition and operational-disruption terms the guide names: transition risk from a port's fossil-fuel-throughput share (real port throughput data — UNCTAD Review of Maritime Transport named in §5 has commodity splits), operational disruption from extreme-weather frequency at the port's coordinates. (2) Implement `PhysicalExposure = SLR_penetration × vulnerability × trade_value` using the Physical Risk Digital Twin's sea-level and cyclone grids for real SLR/storm exposure at each port's location, port infrastructure vulnerability by asset type, and real trade value. (3) The PIANC/World Bank adaptation plan (§1) then keys to the actual highest-exposure hazards, not seeded capex.

**Prerequisites.** Real port throughput/trade data (UNCTAD/OECD-ITF named in §5); the digital-twin sea-level grid is thin (152 rows) — caveat SLR coverage per port; remove `sr()`. **Acceptance:** PortRisk decomposes into the three weighted terms; PhysicalExposure is the documented product over real SLR data; two ports at different coordinates/throughput profiles score differently.

### 9.2 Evolution B — Port-risk-diligence copilot (LLM tier 1 → 2)

**What.** A copilot for the port-operator/infra-fund/trade-finance users §1 targets: "what's the climate risk for Rotterdam under SSP5-8.5?", "how exposed is this port's revenue to shipping decarbonisation?", "what adaptation capex does the PIANC framework recommend?" — grounded, post-Evolution-A, in the weighted composite and the PIANC/World Bank/UNCTAD references named in §5.

**How.** Near-term tier-1 is framework-only (explaining port climate-adaptation approaches from the standards corpus), because today's port hazard/capex numbers are seeded and must not be narrated as a port's real risk. Post-Evolution-A: tool calls to the PortRisk composite and PhysicalExposure engine, decomposing each port's score into physical/transition/operational terms with the fabrication validator matching every figure to outputs; the adaptation plan drafts from the computed exposure. Provenance cites the SLR-grid vintage and coverage tier per port.

**Prerequisites.** Tier 1 needs the standards corpus + explicit current-state disclosure; port scoring gated on Evolution A. **Acceptance:** framework answers cite PIANC/World Bank; port risk scores (post-Evolution-A) trace to the weighted-composite tool with the three-term decomposition; the copilot refuses to score ports from the current seeded data.
