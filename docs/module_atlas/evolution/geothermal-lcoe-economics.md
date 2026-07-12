## 9 · Future Evolution

### 9.1 Evolution A — Probabilistic LCOE with dry-well write-off and real learning curve (analytics ladder: rung 2 → 3)

**What.** §7 rates this one of the platform's better-grounded tier-A modules: a genuine CRF annuity LCOE model (`calcGeothermalLcoe`) mirroring the backend `/api/v1/geothermal/assess` engine, anchored to IRENA plant-type bands, with no guide↔code mismatch. Its flagged limitations are the deepening targets: the deterministic path ignores dry-well write-off (P10/P50/P90 productivity lives only in the project-finance sibling), `carbonAdj` uses a fixed 38 gCO₂/kWh with a scaling that makes the credit negligible, the `TECH_TYPES` values are curated benchmarks not project-specific, and merchant-price scatter uses `sr()` for illustrative volatility. Evolution A brings probabilistic LCOE into this module: incorporate exploration dry-well probability as an expected-cost loading on the drilling programme, add a reservoir-productivity-decline provision, and replace the hard-coded learning curve with a Wright's-Law curve from cumulative deployment.

**How.** (1) `E[LCOE]` loads the drilling capex by `1/(1−p_dry)` and adds a decline-provision term, exposing P10/P50/P90 via a QMC pass (deterministic Halton per platform convention) over productivity and dry-well inputs. (2) Fix the `carbonAdj` scaling and let the flash-plant intensity vary by tech. (3) The learning curve computes `LCOE₀·(cumMW/cumMW₀)^(−b)` from a documented learning rate. (4) Optionally source `TECH_TYPES` capex from real project data.

**Prerequisites.** Dry-well probability and productivity ranges (curated from IRENA/ThinkGeoEnergy is acceptable, documented per §8); the `sr()` merchant scatter relabelled illustrative. **Acceptance:** LCOE renders as a P10–P90 band responding to dry-well probability; the learning curve responds to the learning-rate input; the carbon credit is correctly scaled.

### 9.2 Evolution B — Geothermal LCOE structuring copilot (LLM tier 2)

**What.** A copilot for developers and IC members: "compare binary ORC vs flash LCOE at 3 km depth and 180°C, and show the WACC sensitivity" tool-calls the LCOE endpoint across tech types and the sensitivity grid, narrating drilling-cost-by-depth and CF assumptions from the atlas corpus.

**How.** Tier-2 tool-calling over the geothermal assess/sensitivity endpoints (the `calcGeothermalLcoe` sensitivity table is a natural tool surface); the grounding corpus is §5/§7 (IRENA technology brief, IEA electricity-cost data, the ≤100 gCO₂/kWh Paris gate). Since the LCOE model is already real and CI-consistent, a tier-1 explainer ships first. Every $/MWh and IRR figure validated against tool output; the copilot distinguishes deterministic LCOE (this module) from probabilistic project risk (the finance sibling).

**Prerequisites.** None hard for tier 1; Evolution A for probabilistic answers. **Acceptance:** LCOE and sensitivity figures in a copilot answer trace to tool calls; asked for financing DSCR (not in this module), the copilot points to `geothermal-project-finance`.
