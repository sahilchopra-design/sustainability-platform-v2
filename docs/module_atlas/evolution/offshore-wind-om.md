## 9 · Future Evolution

### 9.1 Evolution A — Real reliability data and user-adjustable capacity factor (analytics ladder: rung 2 → 4)

**What.** §7 shows a correctly-built MTBF availability + OPEX model: technical/weather/planned-maintenance downtime decomposition, corrective/preventive/predictive strategy pricing, blade-erosion economics, all matching the guide. §7.2 flags the honest simplifications: capacity factor is hard-coded 0.42 (not user-adjustable in the AEP formula despite being a key driver), the component failure table (`COMPONENTS`, 11 rows) is modelled on ORE Catapult SPARTA taxonomy but uses seed values not live data, and `mttrCostPerK = 0.4` is explicitly flagged in-code as "simplified." Evolution A grounds the reliability data and adds predictive maintenance forecasting.

**How.** (1) Replace the hard-coded 0.42 CF with the actual capacity factor from the fleet's rated MW and the resource-module's AEP (cross-link to `offshore-wind-resource`), so lost-revenue reflects real generation. (2) Calibrate `COMPONENTS` base failure rates to the real ORE Catapult SPARTA database (named in §5) — SPARTA publishes offshore component reliability trends; store dated in a reference table. (3) Rung-4 predictive step: layer a condition-based-maintenance forecast that predicts component failure timing from age/failure-rate curves, quantifying the CBM-vs-time-based availability uplift the guide describes — the platform's forecasting tooling (statsmodels/sklearn) supports this.

**Prerequisites.** SPARTA reliability data (ORE Catapult — partially public); cross-module CF wiring; documenting the failure-forecast model per Atlas §8. **Acceptance:** CF is user-adjustable and flows to AEP/lost-revenue; component failure rates trace to SPARTA; the CBM uplift derives from a failure forecast, not a seed constant.

### 9.2 Evolution B — Asset-management O&M copilot (LLM tier 2)

**What.** A copilot for the offshore-wind asset-manager users §1 targets: "what's fleet availability under predictive maintenance for these 60 turbines?", "how much lost revenue from gearbox failures this year?", "is the blade-erosion coating upgrade NPV-positive?", "compare CBM vs time-based payback" — executed against the availability/OPEX/erosion engine, decomposing results into the technical/weather/planned downtime terms.

**How.** Tool calls to endpoints wrapping the availability model, OPEX waterfall, and blade-erosion NPV; system prompt from this Atlas page's §5 formulas and the DNVGL-RP-0416 / IEC 61400-26 / ORE Catapult references named in §5. Strategy comparisons (corrective/preventive/predictive) are tool calls returning real availability deltas; the coating-upgrade and CBM-payback questions are NPV recomputations. Fabrication validator matches every availability %, $/kW, and NPV to a tool response; the copilot frames outputs as operational-due-diligence-grade (§1 targets buy/sell/manage decisions), and must disclose the assumed capacity factor (until Evolution A makes it live).

**Prerequisites.** Compute endpoints; Evolution A for real reliability data and adjustable CF. **Acceptance:** every availability/OPEX/NPV figure traces to a tool call; strategy comparisons return real uplift deltas; the copilot states its CF assumption explicitly.
