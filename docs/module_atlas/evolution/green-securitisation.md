## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the real engine and upgrade climate VaR to a loss distribution (analytics ladder: rung 2 → 4)

**What.** §7 documents a strong latent asset with a wiring failure: `green_securitisation_engine.py` implements real EU-GBS compliance scoring (2023/2631 Art 19), climate-VaR pass-through under NGFS scenarios (physical + transition VaR, climate-adjusted PD/LGD, credit-enhancement uplift), and RMBS EPC/CRREM assessment — but the page's `catch` swallows backend failures and renders `seed()`-PRNG KPIs (GBS scores, greenium, VaR, EPC bands) with no user-visible warning. The engine itself is a heuristic sensitivity model, not a cash-flow waterfall (VaR is a scalar sensitivity × scenario-multiplier with √T horizon scaling and a 5%-capped CE uplift, no Monte-Carlo loss distribution or asset correlation). Evolution A does both: wire the page to always render engine output (fail loudly, not silently to seed data), and upgrade the climate VaR from a scalar sensitivity to a Monte-Carlo loss distribution with asset correlation across the pool.

**How.** (1) Remove the silent seed-data fallback; surface a clear error when the engine is unreachable, never synthetic KPIs. (2) Replace the scalar VaR with a Monte-Carlo (deterministic QMC per platform convention) loss distribution incorporating PD/LGD correlation and the NGFS scenario multipliers, producing a real percentile VaR and CE uplift. (3) The green-tranche isolation and EU-GBS compliance read from the engine.

**Prerequisites.** The silent `catch`→seed path removed (§7-flagged fabrication); QMC replacing the scalar proxy; pool asset data. **Acceptance:** page KPIs always equal engine output or show an explicit error (never `seed()` values); climate VaR is a percentile from a loss distribution with correlation, not a scalar product; CE uplift is uncapped by construction where the distribution warrants.

### 9.2 Evolution B — Green-securitisation structuring copilot (LLM tier 2)

**What.** A copilot for structured-finance desks: "assess this green RMBS pool's EU-GBS compliance and climate VaR under NGFS disorderly, and size the green tranche for over-collateralisation" tool-calls the engine's GBS, climate-VaR, and RMBS-EPC endpoints, narrating the compliance gaps and required credit enhancement.

**How.** Tier-2 tool-calling over the engine's real operations (the module is tier-A with a genuine engine); the grounding corpus is §5/§7 (EU GBS Art 19, green-tranche isolation, NGFS climate-VaR, CRREM v2.0). The copilot's value is compliance-plus-risk structuring — GBS gaps, climate VaR, and green-tranche over-collateralisation. Guardrail: it must call the engine (not narrate the seeded page) and report when the engine is unreachable rather than using seed KPIs. Every score and VaR figure validated against engine output.

**Prerequisites.** Evolution A's loud-fail wiring (the copilot must never narrate seed data); RBAC-scoped deal data. **Acceptance:** every GBS score and VaR figure traces to an engine tool call; the copilot reports engine-unavailable explicitly rather than answering from seed values; the green-tranche sizing satisfies the over-collateralisation rule.
