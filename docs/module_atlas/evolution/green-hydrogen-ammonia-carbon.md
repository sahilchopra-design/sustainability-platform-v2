## 9 · Future Evolution

### 9.1 Evolution A — Extend the real engine to the ammonia and fuel layers (analytics ladder: rung 2 → 3)

**What.** §7 documents a split: the hydrogen GHG/LCOH/RFNBO layer rests on the same real `green_hydrogen_engine.py` (authoritative EU-law/IEA/ISO constants), but the ammonia, carbon-credit, and SIGHT layers are frontend formulas over `sr()`-seeded `DEVELOPERS`/`COST_CURVE` data. The ammonia cost model itself (`LCOP_NH3 = LCOH/0.178 + Haber-Bosch_CAPEX×CRF/output + OPEX`) is a real formula. Evolution A extends the trustworthy engine to the ammonia and fuel-comparison layers: compute LCOP_NH3 server-side from the engine's LCOH plus electrified Haber-Bosch capex/opex, and ground the IMO-2023 GHG-fuel-mix comparison in real fuel carbon intensities — so the ammonia and shipping-fuel economics inherit the hydrogen engine's rigour instead of sitting on seeded developer data.

**How.** (1) Add an ammonia method to the engine: `LCOP_NH3` from the engine LCOH (17.6 wt% H₂ → /0.178), Haber-Bosch capex ($400–800/tNH3/yr) × CRF, and opex, with carbon intensity 0.0 vs grey 1.6 tCO₂e/t. (2) The IMO GHG-fuel-mix comparison over real fuel carbon intensities. (3) Replace the seeded `DEVELOPERS`/`COST_CURVE` with engine-computed or sourced project economics; the carbon-credit layer computed from real intensities.

**Prerequisites.** Haber-Bosch capex/opex benchmarks; IMO fuel carbon-intensity data; the seeded developer/cost-curve data replaced (§7-flagged). **Acceptance:** LCOP_NH3 recomputes from the engine LCOH reproducing §5; the IMO fuel comparison uses real intensities; no `sr()` value drives the ammonia or fuel figures.

### 9.2 Evolution B — Carbon-neutral-fuels copilot (LLM tier 2)

**What.** A copilot for shipping and fuel-transition analysts: "what's the LCOP of green ammonia at $3/kg green H₂, and how does it compare to e-methanol under IMO 2023 GHG targets?" tool-calls the Evolution A ammonia/fuel endpoints (built on the real hydrogen engine) and narrates the cost and carbon-intensity comparison.

**How.** Tier-2 tool-calling over the hydrogen engine plus the new ammonia/fuel methods; the grounding corpus is §5/§7, which encode the ammonia cost model, electrified Haber-Bosch economics, and IMO 2023 targets. The copilot's value is fuel-pathway comparison grounded in the engine's real hydrogen LCOH. Guardrail, pre-Evolution-A: the ammonia/credit layers are seeded, so it must anchor answers on the trustworthy hydrogen engine and refuse ammonia-cost figures until Evolution A. Every figure validated against tool output.

**Prerequisites.** Evolution A (ammonia/fuel layers seeded today); corpus embedding. **Acceptance:** post-Evolution-A, every LCOP and fuel-comparison figure traces to an engine tool call; pre-Evolution-A the copilot answers hydrogen questions from the real engine and declines ammonia-cost claims.
