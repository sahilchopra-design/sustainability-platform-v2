## 9 · Future Evolution

### 9.1 Evolution A — Co-optimised revenue stacking under battery physics (analytics ladder: rung 1 → 3)

**What.** §7 documents that `annualRevCalc` stacks three BESS revenue streams (energy arbitrage, ancillary services like FCR/FFR/DCR at $50–150/MW/hr, capacity market) but the stacking is additive with no de-rating — a MW allocated to FCR and simultaneously earning arbitrage is double-counted — the 52-week price series is `sr()`-seeded, and the service definitions/country capacities/engine prices are hard-coded reference values (§8 marked "not yet implemented"). Evolution A builds the production model the guide names: co-optimise the revenue streams under battery physics (power/energy constraints, state-of-charge, round-trip efficiency, cycle limits), so a MW committed to frequency response cannot also be dispatched for arbitrage in the same interval, and drive it with real market prices rather than a seeded series.

**How.** (1) A co-optimisation engine (linear program, scipy per the roadmap) allocating battery power/energy across FCR/FFR/DCR, arbitrage, and capacity subject to SoC and cycle constraints — replacing additive stacking. (2) Real wholesale and ancillary-service prices from market feeds (ENTSO-E/EIA) replacing the seeded 52-week series. (3) Degradation/cycle costs netted so the flexibility value reflects battery wear.

**Prerequisites.** Wholesale and ancillary-service price feeds by market; battery-physics parameters (power/energy/efficiency/cycle life); the seeded price series and additive stacking replaced. **Acceptance:** revenue stacking respects the physics (no MW double-committed across services in an interval); the annual revenue derives from co-optimisation under real prices; degradation is netted; no `sr()` price feeds the model.

### 9.2 Evolution B — BESS revenue-stacking copilot (LLM tier 2)

**What.** A copilot for storage developers and traders: "for a 100 MW/200 MWh battery on GB markets, what's the optimal revenue stack across FFR, arbitrage, and capacity, and how does it change if FFR prices halve?" tool-calls the Evolution A co-optimisation endpoint and narrates the optimal allocation and its sensitivity.

**How.** Tier-2 tool-calling over the co-optimisation endpoint (a prescriptive tool surface per the roadmap ladder); the grounding corpus is §5/§7 (the flexibility-value model, service definitions, revenue-stack structure). The copilot's value is optimal-dispatch strategy and price-sensitivity analysis under battery constraints. Guardrail, pre-Evolution-A: stacking is additive and prices seeded, so it must refuse revenue-stack figures and flag the double-counting limitation. Every revenue and allocation figure validated against tool output.

**Prerequisites.** Evolution A (no co-optimisation today); market price feeds; corpus embedding. **Acceptance:** post-Evolution-A, every revenue and allocation figure traces to a co-optimisation tool call respecting battery physics; the price-sensitivity what-if re-optimises; pre-Evolution-A the copilot declines revenue-stack claims and notes the additive-stacking limitation.
