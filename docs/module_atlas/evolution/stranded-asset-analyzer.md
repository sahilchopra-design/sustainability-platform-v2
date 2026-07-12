## 9 · Future Evolution

### 9.1 Evolution A — Cap the hazard-rate PD and cite the sector stranding data (analytics ladder: rung 2 → 3)

**What.** This is one of the batch's better tier-B modules: an 8-sector hand-curated dataset (AUM, stranded-% by scenario, write-down timing, locked capex — all fixed, sector-appropriate constants, not `sr()`), a genuine exponential-approach write-down S-curve, a real half-life residual-value decay floored at the scenario-consistent terminal value, and a shared quant engine (`frontend/src/engines/climateRisk.js`) for the Default Risk tab. It matches its guide — no mismatch. But §7.6 documents two real weaknesses: the hazard-rate PD has no ceiling (once carbon price exceeds ~2× the threshold, 10-year PD saturates at ~100% for any α≥1 sector, overstating near-term default risk versus production credit models that cap annual hazard rates), and the function is labelled "Merton" in code but is actually a reduced-form/intensity model. Evolution A hardens the credit model and grounds the data.

**How.** (1) Cap the annual hazard rate (production intensity models bound it well below 1.0 even in severe stress) so 10-year PD doesn't spuriously saturate at 100%. (2) Correct the "Merton" naming, or add an actual Merton structural option (asset value, volatility, default barrier) as a complementary model alongside the reduced-form one, letting users compare structural vs intensity PD. (3) Cite the sector AUM and stranding percentages to a specific Carbon Tracker / IEA vintage (currently uncited). (4) Calibrate the write-down S-curve steepness (the fixed `−3` coefficient) per sector rather than one constant. (5) Bench-pin the write-down and PD calculations.

**Prerequisites.** Carbon Tracker / IEA sector-stranding data vintage; a hazard-rate ceiling parameter. **Acceptance:** 10-year PD no longer saturates at 100% under moderate carbon-price stress; the credit function is correctly named (or a real Merton model is added); sector data cites a source vintage.

### 9.2 Evolution B — Stranded-asset impairment copilot (LLM tier 1)

**What.** A copilot for the credit/impairment analyst: "what's the write-down schedule for coal power under Net Zero 2050?", "which sector strands fastest?", "what remediation pathway converts this coal asset and at what IRR?" — answered from the write-down S-curve, residual-value decay, the bubble-map exposure, and the remediation pathways (coal→battery storage etc.) the module already models.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/stranded-asset-analyzer/ask`, corpus = this Atlas record (the write-down and residual formulas, the hazard-rate model, IAS 36 / Carbon Tracker / NGFS framework notes) plus live page state (selected sector, scenario). Write-down and residual answers narrate the computed curves; remediation answers cite the pathway's CapEx and IRR. The copilot honestly labels the credit model as reduced-form (post-Evolution-A) and flags the write-down's front-loaded S-curve shape.

**Prerequisites.** Evolution A's PD cap so the copilot doesn't narrate spuriously-saturated 100% default probabilities. **Acceptance:** every write-down/residual/PD figure traces to the computed curves; remediation IRRs match the pathway data; a sector outside the 8 covered returns a scoped refusal.
