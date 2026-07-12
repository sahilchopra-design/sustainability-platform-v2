## 9 · Future Evolution

### 9.1 Evolution A — Live grid-intensity and seasonal load calibration (analytics ladder: rung 2 → 3)

**What.** §7 rates this a genuine tier-A engineering-economics module (backed by `/api/v1/geothermal/assess` and the `dh_irena_lcoe` table): real GHP COP economics and district-heating LCOH, a Lindal-diagram cascade, and CO₂-savings comparison, with no PRNG in the load-bearing maths. Its flagged simplifications are all calibration opportunities: COP is treated as constant (no seasonal/ambient degradation), grid emissions use a single 0.233 scalar rather than live/marginal intensity, DH LCOH assumes a flat 85% load factor, and there's no dry-well/drilling-risk contingency in the DH capex. Evolution A calibrates against real data: variable COP by ambient temperature, marginal grid emission factors from the platform's grid-carbon data (the sibling `grid-carbon-intelligence` module and ENTSO-E feed wired in wave-1), and a seasonal DH demand profile replacing the flat load factor.

**How.** (1) COP as a function of source/ambient temperature rather than a constant, so payback and CO₂ savings reflect seasonal reality. (2) Swap the 0.233 scalar for a location/time-resolved grid EF from the platform's grid-intensity layer. (3) A seasonal DH load curve (heating-degree-day shaped) replacing the 85% flat factor. (4) Add a drilling-risk contingency to DH capex, cross-referencing the project-finance sibling's dry-well model.

**Prerequisites.** Grid-intensity data keyed by region/hour (available via ENTSO-E/grid-carbon module); HDD reference series. **Acceptance:** GHP CO₂ savings vary with the chosen grid EF and season; DH LCOH responds to a seasonal load profile; the constant-COP and flat-load-factor simplifications are removed or explicitly retained as toggles.

### 9.2 Evolution B — Direct-heat feasibility copilot (LLM tier 2)

**What.** A copilot for district-heating and industrial-heat developers: "at 90°C resource and €40/t carbon, is geothermal direct heat cheaper than gas for a greenhouse cluster, and what's the COP advantage over a heat pump?" tool-calls the GHP/LCOH endpoints and narrates the Lindal cascade match and payback-by-carbon-price sensitivity.

**How.** Tier-2 tool-calling over the geothermal assess endpoints; the grounding corpus is §5/§7 (EGEC market report, IEA geothermal-heat roadmap, Lindal diagram, EU RED III district-heating provisions are cited). Because the economics are already real, a tier-1 explainer over rendered page state ships first; the tier-2 upgrade adds computed carbon-price and COP what-ifs. Every LCOH, payback, and CO₂ figure validated against tool output.

**Prerequisites.** None hard for tier 1; Evolution A's grid/seasonal calibration strengthens tier-2 answers. **Acceptance:** every LCOH and payback figure in a copilot answer traces to a tool call or rendered state; asked for a project-specific dry-well probability (not in this module), it refuses and points to the project-finance sibling.
