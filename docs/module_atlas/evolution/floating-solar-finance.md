## 9 · Future Evolution

### 9.1 Evolution A — Build the structural LCOE and evaporation models the guide names (analytics ladder: rung 1 → 2)

**What.** §7 flags that both headline formulae are unimplemented: `LCOE_FPV = LCOE_land × (1 + structural_premium) − cooling_benefit` and `Evap_savings = A_covered × ET_rate × shade_factor` are described but the code draws `lcoe`, `structuralPremiumPct`, `coolingBoostPct`, and `evaporationSavingML` as independent `sr()`-seeded fields — so LCOE is not derived from a land baseline and evaporation is not `area × ET × shade`. Only the revenue waterfall and cost-component breakdown use real arithmetic. Evolution A builds the two real models: LCOE constructed from a land-mounted baseline plus a structural premium minus a cooling yield benefit, and Penman-Monteith-based evaporation savings from covered area, local ET rate, and shade factor.

**How.** (1) A backend route (or a real `useMemo` chain replacing the seeds) computing `LCOE_FPV` from a land-LCOE input, the water-body-type structural premium, and a cooling boost tied to module-temperature reduction. (2) Evaporation savings from `waterBodyAreaHa × coveragePct`, a regional ET rate (from the platform's NASA-POWER climate data already wired in wave-1 sources), and a shade factor. (3) Keep the working revenue waterfall; replace flat $0.15/m³ and $55/MWh with editable, sourced assumptions.

**Prerequisites.** The 18 seeded projects replaced with parameter-driven inputs (all core metrics are §7-flagged synthetic); regional ET rates from NASA-POWER. **Acceptance:** two projects differing only in coverage/ET produce different evaporation savings reproducing `A×ET×shade`; LCOE responds to the land baseline and premium; no independent `sr()` LCOE field remains.

### 9.2 Evolution B — FPV siting-and-finance copilot (LLM tier 1 → 2)

**What.** A copilot for solar IPPs and water utilities: "for a 50 MW array on a water-stressed reservoir, what's the evaporation-saving value and does the cooling boost offset the structural premium?" Tier-1 narrates the cost-component breakdown and country pipeline plus the FPV cooling/evaporation literature from the atlas corpus; tier-2 runs the Evolution A models as tool calls to answer the trade-off quantitatively.

**How.** Tier 1 grounds on §5/§7 (IEA PVPS FPV roadmap, World Bank ESMAP guidance, the empirical 2–5% cooling boost and 15–25% premium ranges are documented there), and must disclose §7.5's caveat that current LCOE/evap numbers are seeded until Evolution A ships. Tier 2 wraps the LCOE/evaporation endpoints so the premium-vs-cooling trade-off is engine-computed, with the water-credit valuation shown as an explicit, editable assumption.

**Prerequisites.** Evolution A for any quantitative answer; corpus embedding. **Acceptance:** post-Evolution-A, every LCOE and evaporation figure traces to a tool call; pre-Evolution-A the copilot labels those outputs as illustrative and refuses to assert a bankable LCOE.
