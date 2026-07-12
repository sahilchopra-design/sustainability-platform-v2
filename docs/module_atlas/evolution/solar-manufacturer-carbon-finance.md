## 9 · Future Evolution

### 9.1 Evolution A — Net CBAM liability with free-allocation offset and EPD-grade LCA inputs (analytics ladder: rung 1 → 2)

**What.** Like its developer sibling, this module uses no `sr()` for core data — 6 real named Indian manufacturers with hand-curated Scope 1/2/3 intensities, and three genuine calculation functions (`calcCbamCost`, `calcPliIncentive`, `calcCarbonPayback`). The `CBAM_TIMELINE`, `PLI_TRANCHES`, `GRID_EF_ROADMAP`, and `SCOPE_BREAKDOWN` (upstream polysilicon dominance at 92.9%) are all cited-accurate. But §7.6 flags a real quantitative error: `calcCbamCost` omits the free-allocation offset, so the module **overstates gross CBAM liability** relative to the net certificate obligation during the 2026–2034 phase-in — even though the correct free-allocation schedule (100%→25%→0%) is sitting right there in `CBAM_TIMELINE`. Evolution A fixes the CBAM math and upgrades the LCA inputs toward EPD grade.

**How.** (1) Correct `calcCbamCost` to net out free allocation by year: `net_liability = gross × (1 − free_allocation_pct[year])`, reading the schedule the module already carries — the single most impactful fix. (2) Add embedded-emissions determination per the CBAM methodology (default values vs verified installation-specific, which changes the liability materially). (3) Let module carbon intensity be sourced from an EPD (EN 15804) upload rather than a hand-set constant, supporting the procurement use case. (4) Scenario the EU ETS price path (the levy driver) so exporters see liability under a price range, not a point.

**Prerequisites.** CBAM default embedded-emission values need encoding; EPD parsing is a stretch input. **Acceptance:** CBAM cost for a 2027 shipment is lower than the current gross figure by exactly the free-allocation percentage; toggling verified vs default embedded emissions changes liability; ETS-price scenarios produce a liability band.

### 9.2 Evolution B — CBAM-compliance and decarbonisation-roadmap copilot (LLM tier 2)

**What.** A copilot for the manufacturer/procurement/trade-compliance users: "what's our net CBAM cost exporting 500MW to the EU in 2028?", "where are our Scope 3 hotspots and what reduces them most?", "does switching to RE-powered polysilicon change our CBAM exposure?" — calling `calcCbamCost`, `calcCarbonPayback`, and reading `SCOPE_BREAKDOWN`, narrating the results and the decarbonisation roadmap.

**How.** Tier-2 pattern: the three calculators become tools; the copilot passes user inputs, receives figures, and narrates CBAM liability, carbon-payback, and PLI incentives — with hotspot analysis driven by the real `SCOPE_BREAKDOWN` (polysilicon/wafer 53.2%). Roadmap suggestions are grounded in the `GRID_EF_ROADMAP` (manufacturing-grid decarbonisation) and the sibling LCA module's finding that manufacturing-site grid choice drives ~6× footprint variation. The no-fabrication validator checks every liability figure against tool output.

**Prerequisites (hard).** Evolution A's free-allocation fix — a copilot narrating the current `calcCbamCost` would confidently overstate every client's CBAM bill, an expensive error to put in an LLM's mouth. **Acceptance:** every CBAM and payback figure traces to a tool call using the corrected math; hotspot claims cite `SCOPE_BREAKDOWN` shares; a non-EU-export scenario yields "no CBAM exposure," correctly.
