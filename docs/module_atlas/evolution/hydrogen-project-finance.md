## 9 · Future Evolution

### 9.1 Evolution A — Endogenous LCOH-driven revenue and correlated risk (analytics ladder: rung 2 → 3)

**What.** §7 rates this one of the platform's genuinely-modelled finance pages — real Newton-Raphson IRR, NPV, DSCR, annuity debt service, Monte-Carlo overlay, subsidy stacking. Its documented gaps: revenue (€120M/yr) and opex are direct user inputs with no LCOH build-up, so "electricity cost is the primary IRR lever" is asserted but not wired; degradation is a flat 2%/yr revenue haircut rather than a stack-replacement capex event; and the 200-draw MC uses uniform, independent seeded shocks ignoring capex↔revenue correlation. Evolution A closes all three: revenue derived as `annual_h2_kg × (offtake price + subsidies)` with `annual_h2_kg` from the shared `hydrogen_economy_engine.calculate_lcoh` production math (electricity price and capacity factor become the actual levers), a stack-replacement capex at the electrolyser lifetime-hours boundary, and correlated sampling via the QMC/scenario-matrix pattern already built for the Financial Modeling Studio.

**How.** (1) Move `buildCashflows` server-side as `POST /hydrogen/project-finance` composing the engine's LCOH components with the DCF core — additive to the shared engine (5-module blast radius, §6). (2) Rank-correlated shocks (capex↔revenue via electricity price) replacing independent uniforms. (3) Calibration: the 6-project comparables band (NEOM, HIF Matagorda, AREH…) becomes a §8.5-style sanity check — default-input IRR must fall inside it; the §7.4 worked example (DSCR 1.92×, bear-case 0.91× breach) pins in bench_quant.

**Prerequisites.** None blocking; regression tests on sibling hydrogen modules before the shared-engine merge. **Acceptance:** moving the electricity-price slider changes IRR through the LCOH chain; MC P10–P90 IRR band reported with the correlation matrix disclosed.

### 9.2 Evolution B — Structuring analyst for bankability screening (LLM tier 2)

**What.** A tool-calling analyst for project sponsors and lenders: "at what H₂ price does DSCR breach 1.25×?", "how much EU H₂ Bank subsidy makes this Spanish project investment-grade?", "compare 70/30 vs 60/40 gearing at 6.5% debt." These are root-finding and comparison loops over the DCF — mechanical once the model is a backend endpoint, and dangerous as LLM arithmetic, which is exactly what tier 2 prevents.

**How.** Tool schemas over the Evolution A `POST /hydrogen/project-finance` route plus the existing `/eu-h2-bank` endpoint (its `subsidy_eur_kg`/`total_subsidy_eur` fields answer the subsidy questions directly). Breakeven questions execute as bisection over repeated tool calls, with the answer showing the bracketing points. System prompt grounded in this page's §7.2 defaults table and §7.6 caveats — the analyst must flag that MC shocks are screening-grade and that IRA §45V is modelled at the $2/kg Tier-1 rate, not the full $3/kg schedule. Covenant answers quote the 1.25×/1.40× thresholds from §4.1's cited project-finance standards.

**Prerequisites.** Evolution A's backend route (the DCF currently lives only in the frontend, so there is nothing to tool-call yet); Phase 2 tool-calling infrastructure. **Acceptance:** a breakeven answer's bisection trail is fully logged; every IRR/DSCR figure matches a tool response to the reported precision.
