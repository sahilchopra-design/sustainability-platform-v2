## 9 · Future Evolution

### 9.1 Evolution A — Exact Weibull integration and real wind data (analytics ladder: rung 2 → 4)

**What.** §7 confirms a genuine engineering pipeline: Weibull fitting, Jensen top-hat wake model, numerical AEP integration, and lognormal P50/P90 uncertainty decomposition — matching the guide. §7.2 flags two honest numerical shortcuts: the Weibull scale uses a power-based proxy for the gamma function `Γ(1+1/k)` plus an unexplained ×0.9 fudge factor (not exact), and the power curve is a pure cube law rather than a manufacturer S-curve. Both bias AEP. And all wind inputs are seed-table site constants, not real met data. Evolution A fixes the math and grounds the resource.

**How.** (1) Replace the Γ proxy with an exact gamma-function evaluation (trivial via `Math` lgamma or a Lanczos approximation) and drop the ×0.9 fudge — the Weibull scale then correctly reproduces the site mean wind speed. (2) Use manufacturer power curves (or an S-curve fit) instead of the cube law for the turbine models in `TURBINES`. (3) Ground site wind resource in real reanalysis data — ERA5/MERRA-2 (already named in §5 for the P90 interannual σ) provide free long-term wind time series per coordinate, replacing the seed-table `SITES`; this also makes the P50/P90 uncertainty decomposition data-driven. Rung-4: the P90 becomes a real probabilistic yield from historical interannual variability.

**Prerequisites.** ERA5/MERRA-2 ingestion (free, coordinate-keyed); a `bench_quant` pin comparing exact-Γ AEP against a hand-computed Weibull case (the current shortcut would fail it). **Acceptance:** Weibull scale reproduces the site mean to <1%; AEP uses a real power curve; P50/P90 derives from ERA5 interannual variability, not an assumed σ.

### 9.2 Evolution B — Resource-assessment copilot for pre-FEED diligence (LLM tier 2)

**What.** A copilot for the developer/IE/investor users §1 targets: "what's the net AEP for an 18MW turbine array at this North Sea site with Jensen wake k=0.04?", "how sensitive is yield to hub height?", "what's the P90 and its uncertainty breakdown?", "is this site IEC Class I suitable?" — executed against the Weibull/wake/AEP/P90 engine, decomposing net AEP into gross → wake-corrected → availability-adjusted.

**How.** Tool calls to endpoints wrapping the Weibull fit, Jensen wake, AEP integration, and P90 functions; system prompt from this Atlas page's §5 formulas and the IEC 61400-3 / DNVGL-ST-0437 references named in §5 so site-characterisation and turbine-class answers cite the right standard. Hub-height and wake-decay sensitivities are recomputations; the P90 uncertainty decomposition (interannual, measurement bias, wake, availability) comes from the engine's RSS combination. Fabrication validator matches every AEP/CF/P90 figure to a tool response; the copilot frames outputs as pre-FEED-grade (replacing Windographer/WAsP screening per §1, not a bankable energy assessment).

**Prerequisites.** Compute endpoints; Evolution A for exact-Γ AEP and real wind data before quoting bankable-looking yields. **Acceptance:** every AEP/P90 figure traces to a tool call; wake/hub-height sensitivities behave monotonically; IEC-class answers cite the standard; the copilot flags pre-FEED scope.
