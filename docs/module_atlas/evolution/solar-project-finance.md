## 9 · Future Evolution

### 9.1 Evolution A — Bench-pin the engine, fix the ITC/tax double-count, and back the frontend with an API (analytics ladder: rung 2 → 3)

**What.** This is the batch's most rigorously implemented project-finance engine — a ~2,500-line, 20-tab model with genuinely correct primitives: Newton-Raphson IRR (200 iter, 1e-8 tol), capital-recovery-factor LCOE, official IRS MACRS 5-yr/15-yr schedules (exact match), the correct ITC half-basis MACRS reduction rule, and a real Box-Muller Monte Carlo (1,000 runs) over 6 uncertainty sources — already at rung 2. Two things hold it back: §7 references an ITC/tax double-count bug in the cash-flow build, and despite the sophistication it is a tier-B frontend module (no backend), so nothing persists or is server-validated. Evolution A hardens it into a calibrated, bench-pinned engine.

**How.** (1) Fix the documented tax double-count in the annual cash-flow build (the §7.6 "net of the tax double-count bug" caveat). (2) Add bench_quant golden cases: a known deal (fixed inputs → expected IRR/DSCR/LCOE) pinned in CI so refactors can't silently break the math — this is the platform's rung-3 gate. (3) Lift the engine into a backend route (`POST /api/v1/solar-pf/model`) so results are reproducible, auditable, and consumable by other modules; the frontend becomes a display like `slb-structurer`. (4) Replace illustrative `CF_BY_LOC` capacity factors with values sourced from the sibling `solar-resource-performance` module's NASA POWER integration, closing the loop between resource assessment and project finance.

**Prerequisites.** The tax double-count fix is the gate before bench-pinning (pin the correct numbers); backend lift needs the engine ported from JS to the Python service layer or exposed via a compute endpoint. **Acceptance:** bench_quant reproduces the golden deal's IRR/DSCR/LCOE within tolerance; the double-count is gone (equity IRR changes by the corrected tax amount); capacity factors trace to NASA POWER.

### 9.2 Evolution B — Solar-deal structuring analyst (LLM tier 2)

**What.** A tool-calling analyst over the (backend-lifted) engine: "model a 200MW ERCOT project at $1.10/Wdc with 65% debt", "what does adding the energy-community adder do to equity IRR?", "run the tail scenario and give me DSCR breach probability" — each a call to the model endpoint, with the analyst narrating IRR/DSCR/LLCR/MOIC and the Monte Carlo P10/P50/P90 bands, never computing project finance itself.

**How.** Tool schema from the model endpoint (post-Evolution-A); grounding corpus = this Atlas record (§7.1 primitives, MACRS tables, the ITC/§45Y structure). What-if requests re-run the engine with modified inputs and narrate deltas; scenario requests invoke the 4-scenario stress engine. The no-fabrication validator checks every IRR/DSCR against the tool response; the "show work" expander surfaces the cash-flow build and engine version.

**Prerequisites (hard).** Evolution A's backend lift (tool-calling needs a server endpoint) and the double-count fix (an analyst must not narrate a known-wrong IRR). **Acceptance:** every financial metric in an answer traces to a model-endpoint call with a stated engine version; scenario answers invoke the real stress engine, not LLM estimation.
