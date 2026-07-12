## 9 · Future Evolution

### 9.1 Evolution A — Fix the SWU formula defect, then calibrate to real market prices (analytics ladder: rung 1 → 3)

**What.** §7 documents a genuine code-correctness bug, not just a data gap: the module correctly implements the industry SWU value function `V(x) = (2x−1)·ln(x/(1−x))` and the feed/product mass balance `F/P = (xp−xt)/(xf−xt)`, but its two separative-work totals each use a *different, non-standard* combination — neither matches the textbook `SWU/P = V(xp) + (T/P)·V(xt) − (F/P)·V(xf)`. `calcSwu` uses `xf/xp` instead of `F/P`; `calcFuelCost` omits the `(T/P)·V(xt)` term. Traced with default sliders, both return negative SWU/kg, driving the Fuel Cost tab's total *negative* — contradicting the module's own cited $5–15/MWh benchmark. Evolution A fixes the formula first, then calibrates.

**How.** (1) Replace both SWU expressions with the correct three-term formula, computing tails-per-product `T/P = (xf−xp)/(xf−xt)` and feed-per-product `F/P` from the same mass balance — verified against a known worked example (e.g. WNA's standard 4.95%/0.711%/0.25% case yields ~7.0 SWU/kg). (2) Stop hard-coding `feedAssay/tailsAssay` to 0.711/0.3 in `calcFuelCost` while the sliders say otherwise (§7.1) — honor the inputs. (3) Calibrate SWU price, U₃O₈ price, and conversion fees to real EIA Uranium Marketing Annual and market SWU quotes (named in §5), stored dated in a reference table. (4) Add the HALEU premium (3–5× SWU per §1) as an explicit multiplier for Gen-IV fuel.

**Prerequisites.** A `bench_quant` pin with a hand-verified SWU case is mandatory — this bug would have been caught by one. EIA data ingestion. **Acceptance:** the standard 4.95% enrichment case returns ~7 SWU/kg positive; total fuel cost lands in $5–15/MWh; sliders actually affect `calcFuelCost`.

### 9.2 Evolution B — Fuel-cycle-economics copilot (LLM tier 2) — gated on the fix

**What.** A copilot answering "what's the $/MWh fuel cost at 5% enrichment and 0.2% tails?", "how much does the HALEU premium add for a Natrium core?", "compare once-through vs MOX at today's SWU price" — executed against the corrected fuel-cycle engine, decomposing cost into the front-end (U₃O₈, conversion, enrichment) and back-end stages per §5.

**How.** Tool calls to a `POST /fuel-cycle/cost` endpoint wrapping the (fixed) `calcSwu`/`calcFuelCost`; system prompt from this Atlas page's §5 formula and the WNA/EIA references named in §5 so enrichment economics are explained correctly. What-ifs (enrichment %, tails assay, SWU price, once-through vs MOX) are recomputations, not estimates; the fabrication validator matches every $/MWh and SWU figure to a tool response. The copilot must surface the tails-assay optimisation trade-off (lower tails = more SWU but less feed) that the corrected formula makes tractable.

**Prerequisites (hard).** Evolution A's formula fix — an LLM narrating the current engine would confidently report *negative* fuel costs, an obvious falsehood that would destroy trust; the copilot must not ship until the SWU math is correct and pinned. **Acceptance:** every quoted fuel cost is positive and traces to a tool call; the enrichment/tails sensitivity behaves monotonically; MOX comparison reflects real back-end cost differences.
