## 9 · Future Evolution

### 9.1 Evolution A — Real trade flows behind the sound CBAM cost model (analytics ladder: rung 2 → 3)

**What.** §7 confirms this is a correct, well-parameterised CBAM implementation: it uses the real CBAM formula (`cost = quantity × embedded_CO₂ × (EU_ETS_price − origin_carbon_price)`), real sector embedded-carbon intensities (worldsteel/IEA/IFA-sourced), the actual EU ETS reference price, and the correct 2026→2034 free-allocation phase-out. The only synthetic layer is the trade data: the 20 country instances are `sr()`-seeded (`steelExport = sr()×8`), anchored to a steel demo. The platform already has a UN Comtrade integration (per the data-sources work). Evolution A feeds the sound model with real trade flows.

**How.** (1) Real import volumes by CN code, sector, and country of origin from UN Comtrade (the platform's Comtrade integration provides exactly this), replacing the seeded `steelExport`/country exposures — so per-country CBAM exposure reflects actual EU import data. (2) Third-country carbon prices (the origin-price deduction) from the World Bank Carbon Pricing Dashboard, making the `(ETS − origin)` gap real per country. (3) EU ETS certificate price from live/recent data rather than a fixed €62. (4) Embedded-carbon intensities extended to the CBAM Delegated Act default values plus a path for verified-operator declarations. (5) Rung 3: benchmark computed liabilities against published CBAM impact assessments. Coordinate with the two sibling CBAM modules on shared trade/factor data.

**Prerequisites.** Comtrade trade-flow coverage for CBAM sectors; World Bank carbon-price data; the CBAM Delegated Act default-factor table. **Acceptance:** country exposures derive from real Comtrade flows; origin-price deductions use real third-country carbon prices; the ETS price is current; liabilities benchmark against published CBAM assessments.

### 9.2 Evolution B — CBAM exposure and strategy copilot (LLM tier 2)

**What.** Importers and EU producers ask "what's our 2030 CBAM liability on Chinese steel imports at €120/t ETS?", "how does relocating vs decarbonising vs buying certificates compare?", "which of our supply countries have carbon pricing that offsets CBAM?" — the copilot runs the Evolution-A CBAM cost model over real trade flows, reports liability by sector/country and the strategic-response comparison, every figure tool-traced.

**How.** Tool schemas over the Evolution-A CBAM-cost and scenario routes; grounding corpus is this Atlas record — the correct CBAM formula and phase-in timeline in §5/§7 are the copilot's explanation source, and the real sector intensities ground embedded-carbon answers. The copilot states the ETS-price scenario and phase-in year behind any liability figure (CBAM ramps 2026→2034 as free allocations phase out), and the origin-price deduction assumption per country. The strategic-response analysis (decarbonise/relocate/buy) presents the trade-offs with tool-computed costs. Feeds the trade/compliance desk view.

**Prerequisites.** Evolution A's real trade flows — a copilot quoting liabilities off seeded steel exports would misstate exposure, though the underlying formula is sound. **Acceptance:** every liability figure traces to a tool response over real trade data; each states its ETS scenario and phase-in year; origin-price deductions cite real third-country carbon prices.
