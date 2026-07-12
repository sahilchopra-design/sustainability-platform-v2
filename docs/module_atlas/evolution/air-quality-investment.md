## 9 · Future Evolution

### 9.1 Evolution A — Real health co-benefit and clean-cooking NPV engine (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag (EP-DP3), the guide's engine — `HealthCoBenefit = ΔPM2.5 ×
PopulationExposed × DoseResponse × VSL` and a clean-cooking NPV — is **not implemented**; the one
genuine formula is a pollution-drag-on-returns `adjReturn = grossReturn × (1 − pm25/200)`, an
invented linear haircut with no cited elasticity (§7.5), over 55 synthetic regions whose health
costs and premature deaths are drawn independently of PM2.5. Evolution A builds the guide's actual
co-benefit engine: intervention ΔPM2.5 input → population-weighted exposure → WHO/World Bank
dose-response → VSL monetisation, plus a clean-cooking investment case (technology cost, health +
climate + productivity benefits, NPV) — the health-climate-nexus tool the guide describes for MDB
programming.

**How.** `POST /api/v1/aq-investment/co-benefit` (ΔPM2.5, population, VSL, discount rate → monetised
health co-benefit) and `/clean-cooking-npv`; the pollution-drag factor is replaced by a cited
productivity/mortality damage function (World Bank *Cost of Air Pollution* 2022). Rung 2 via the
climate-air-quality synergy the guide names (`ClimateInvestment × PM2.5ReductionCoefficient ×
HealthValuePerµg`) as a scenario sweep across EV-transition and coal-phaseout pathways. Rung 3:
calibrate against IEA WEO clean-cooking and HEI State of Global Air figures.

**Prerequisites (hard).** Purge the `sr()` region generator per the no-fabricated-random guardrail;
fix the documented seed collisions at small indices (Beijing's fields all reuse `sr(0)`) and the
stale NO₂ 40 µg/m³ limit (2021 annual guideline is 10); source real VSL and dose-response
coefficients. **Acceptance:** health co-benefit scales with ΔPM2.5, population and VSL (not an
independent draw); the clean-cooking NPV responds to technology cost and beneficiary count; the
pollution drag is replaced by a cited damage function.

### 9.2 Evolution B — Health-climate-nexus investment copilot (LLM tier 1 → 2)

**What.** A copilot answering "what's the health co-benefit of $1M in EV transition here?", "which
regions offer the best clean-air investment case?", and "how does air-quality benefit strengthen
this green bond's use-of-proceeds?" — grounded in the page's computed KPIs (the health-adjusted
return is the one live cause→effect) and, post-Evolution A, the co-benefit engine. Since health
costs are currently independent of pollution, the tier-1 copilot must disclose the figures are demo
values, and that the guide's headline citations (7M deaths/yr, $2.45Tn co-benefits) are real but
appear nowhere in the computation.

**How.** Tier-1 roadmap pattern: §7.1 formulas, §7.2 parameter table and §7.6 framework alignment
(WHO AQG 2021, IPCC AR6 WGIII, IEA WEO, World Bank) embedded as the module corpus; page state
(region-type filter, PM2.5 slider) as context; served via `POST /api/v1/copilot/air-quality-
investment/ask` with the standard refusal path. After Evolution A, graduates to tier 2 by tool-
calling `POST /co-benefit` and `/clean-cooking-npv`, with the no-fabrication validator checking
every dollar and DALY figure.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note.
**Acceptance:** every figure cited matches page state with its synthetic status stated; a request
for a monetised co-benefit before Evolution A returns a refusal naming the absent
dose-response/VSL inputs.
