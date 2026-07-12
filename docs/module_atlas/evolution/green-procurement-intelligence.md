## 9 · Future Evolution

### 9.1 Evolution A — Build the discounted TCO and emission-factor differential (analytics ladder: rung 1 → 2)

**What.** §7 flags that neither headline model is computed: the guide's `GreenTCO = CapEx_green + Σ(OpEx_green + ExternalCost_green)/(1+r)^t` (with a carbon shadow price for true cost) and `CarbonProcurementReduction = Σ[Spend_i·(ConvEF_i − GreenEF_i)]` are absent — `co2SavedT` and `costSavingsMn` are pre-tabulated fields on the static `PROGRAMMES` set, and the page merely aggregates them (§8 marked "not yet implemented"). Evolution A builds both: a discounted total-cost-of-ownership model comparing green vs conventional procurement (capex + discounted opex + externalised carbon cost at a shadow price), and a carbon-reduction aggregation from emission-factor differentials across procurement categories — turning a static display into the TCO and abatement tool the guide describes.

**How.** (1) A backend route computing `GreenTCO` per the §5 formula from capex, opex path, discount rate, and a carbon shadow price; the green-vs-conventional TCO gap becomes a computed decision metric. (2) `CarbonProcurementReduction` from category spend × (conventional EF − green EF), using real emission factors (the platform's reference EF layer). (3) EU GPP criteria compliance flags per category.

**Prerequisites.** Emission factors by procurement category (reference EF layer); a carbon shadow-price input; the static `co2SavedT`/`costSavingsMn` reframed as model outputs. **Acceptance:** GreenTCO recomputes per §5 and responds to discount rate and shadow price; carbon reduction derives from EF differentials × spend; no pre-tabulated saving is presented as computed.

### 9.2 Evolution B — Procurement-decision copilot (LLM tier 2)

**What.** A copilot for public/corporate procurement teams: "over a 10-year horizon at €80/t shadow carbon, does the green fleet option beat conventional on TCO, and what's the carbon reduction?" tool-calls the Evolution A TCO and carbon-reduction endpoints, narrating the lifecycle cost comparison and EU GPP compliance.

**How.** Tier-2 tool-calling over the TCO/carbon endpoints; the grounding corpus is §5/§7 (Green Procurement TCO with external carbon cost, EU GPP criteria, emission-factor differentials). The copilot's value is true-cost procurement decisions incorporating externalised carbon. Guardrail, pre-Evolution-A: the TCO is unbuilt and savings pre-tabulated, so it must refuse TCO and carbon-reduction figures and answer only on GPP criteria facts. Every figure validated against tool output.

**Prerequisites.** Evolution A (no TCO model today); emission-factor data; corpus embedding. **Acceptance:** post-Evolution-A, every TCO and carbon-reduction figure traces to a tool call reproducing the §5 formulae; the shadow-price what-if moves the TCO; pre-Evolution-A the copilot declines quantitative TCO claims.
