## 9 · Future Evolution

### 9.1 Evolution A — Live learning-curve projection and probabilistic LCOE (analytics ladder: rung 2 → 3)

**What.** §7 rates this a genuine engineering-economics calculator: real discounted LCOE (`(CAPEX + NPV(OPEX))/NPV(AEP)`), Newton–Raphson project IRR, a site-adjusted component CAPEX stack, and a latitude/hub-height/sea-state capacity-factor model — mostly user sliders with curated country/floater/supply-chain tables. The single flagged gap is the learning-curve trajectory, which is a hard-coded year→LCOE array rather than the guide's `LCOE(n) = LCOE₀·n^(−b)`, `b = log₂(LR)` computed live. Evolution A implements Wright's-Law projection from a learning rate and cumulative-deployment path, then adds a calibration step: benchmark the CAPEX defaults and CF model against published NREL/DNV floating-wind cost points so the base case is anchored to observed projects, not slider defaults.

**How.** (1) Replace `learningCurveData` with a computed curve: `LCOE₀·(cumMW/cumMW₀)^(−log₂(1/(1−LR)))`, LR a documented input (14–18% range cited in §5). (2) Wrap the existing `calcLCOE`/`calcIRR` in a scenario endpoint (the page already has a 4-scenario capex/CF multiplier structure) and add a Halton-QMC pass over uncertain CAPEX/CF/discount inputs for a P10–P90 LCOE band, reusing the platform's deterministic QMC pattern from financial-modeling-studio. (3) Pin the base LCOE against NREL reference cases in bench_quant.

**Prerequisites.** A cumulative-deployment reference series; NREL/DNV cost points as refdata. **Acceptance:** the learning curve responds to the LR input reproducing `LCOE₀·n^(−b)`; a bench case matches NREL floating LCOE within tolerance; the hard-coded array is gone.

### 9.2 Evolution B — Floating-wind feasibility copilot (LLM tier 2)

**What.** A copilot for developer/IC users driving the calculator by description: "100 MW semi-sub at 400 m depth, 60 km to shore, UK CfD at £196/MWh — is it bankable?" becomes tool calls to the LCOE/IRR/DSCR endpoints exposed in Evolution A, narrated with the module's own floater-concept, mooring, and TRL context (the 18-tab structure is a rich §7 grounding corpus).

**How.** Tool schemas wrap the run/scenario endpoints; the per-module system prompt draws on §5/§7 (IEA/NREL LCOE methodology, floater-depth eligibility, EPCI share, CfD auction design) so the copilot reasons about concept selection and depth constraints, not just arithmetic. Because LCOE/IRR are real today, a tier-1 explainer over rendered page state ships before the endpoint work; the tier-2 upgrade adds computed what-ifs. Every £/MWh and IRR figure is validated against tool output.

**Prerequisites.** Evolution A endpoints for computed what-ifs; prompt-caching for the large module context. **Acceptance:** a feasibility dialogue's LCOE/IRR/DSCR numerics all trace to tool calls; asked for a P50 seabed-risk cost (not modeled), the copilot refuses and points to the supply-chain/TRL tabs as the qualitative alternative.
