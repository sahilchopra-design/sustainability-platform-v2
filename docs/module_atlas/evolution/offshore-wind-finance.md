## 9 · Future Evolution

### 9.1 Evolution A — Real CfD/market data behind the project-finance engine (analytics ladder: rung 2 → 3)

**What.** §7 confirms a full, correctly-built project-finance model: a self-implemented Newton-Raphson IRR solver (tolerance 1e-8), CfD revenue mechanics, 25-year DSCR schedule with covenant flags (cash trap 1.10×, min 1.20×), LCOE, and Monte Carlo IRR distribution — closely matching the guide, with correct tax guarding and divide-by-zero sentinels. The `COUNTRIES` table models real UK/EU/US regimes (AR5 ~£82/MWh, US IRA PTC $27.50/MWh). The gap is that reference prices and CAPEX are demo inputs. Evolution A grounds them and makes the Monte Carlo calibrated.

**How.** (1) Wire real reference prices: UK AR strike prices (DESNZ auction results, named in §5), N2EX/SEMO day-ahead index history for the merchant tail, and real PTC values — dated in a reference table so a UK 2029-COD project auto-populates its actual AR5 strike. (2) Calibrate the Monte Carlo generation distribution to real P50/P90 wind-yield data rather than assumed spreads — the sibling `offshore-wind-resource` module already computes P50/P90 lognormal yield; consume it so the finance model's generation uncertainty is engineering-sourced, not assumed. (3) CAPEX stack from NREL/BNEF cost benchmarks (named in §5), dated. This is a rung-3 calibration step; the rung-2 scenario engine (Base/Bull/Bear/Stress) already exists.

**Prerequisites.** DESNZ/NREL/BNEF data (partially public); cross-module wiring to `offshore-wind-resource` P50/P90; a `bench_quant` pin on the IRR solver and DSCR schedule for a known cash-flow case. **Acceptance:** a UK project auto-loads its real AR strike; Monte Carlo generation draws from resource-module P50/P90; IRR reproduces the pinned reference.

### 9.2 Evolution B — Project-finance structuring analyst (LLM tier 2)

**What.** A copilot for the offshore-wind PF banker users §1 targets: "what's the equity IRR for a 1GW UK fixed-bottom project at £82/MWh strike and 65% gearing?", "does the base case breach the 1.20× DSCR covenant?", "run the stress scenario and give me the breach probability" — executed against the IRR/DSCR/Monte Carlo engine, decomposing results into the cash-flow waterfall terms.

**How.** Tool calls to endpoints wrapping the Newton-Raphson IRR, DSCR schedule, and Monte Carlo functions; system prompt from this Atlas page's §5/§7.1 formulas and the UK CfD / S&P PF-rating references named in §5 so covenant and CfD mechanics are explained correctly. Scenario runs (Base/Bull/Bear/Stress) and sensitivity (tornado) are tool calls returning real distributions; the DSCR-breach-probability answer comes from the Monte Carlo, not estimation. Fabrication validator matches every IRR/DSCR/£/MWh to a tool response; the "show work" expander lists the cash-flow assumptions (roadmap Tier-2 provenance UX).

**Prerequisites.** Compute endpoints; Evolution A for real strike/CAPEX/yield inputs (the covenant and IRR mechanics work today on demo inputs). **Acceptance:** every IRR/DSCR figure traces to a tool call; scenario breach probabilities come from Monte Carlo runs; the copilot cites the CfD reference for settlement mechanics.
