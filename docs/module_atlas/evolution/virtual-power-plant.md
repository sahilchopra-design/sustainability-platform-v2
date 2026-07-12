## 9 · Future Evolution

### 9.1 Evolution A — Fix the 144× annualisation defect, then a real dispatch optimiser (analytics ladder: rung 2 → 3)

**What.** The revenue-stacking structure is genuinely implemented (per-asset
FCR/aFRR/mFRR/Arbitrage streams with market-eligibility gates and live sliders — real
what-if capability), but §7.4 documents two arithmetic defects that make the headline
KPI unusable: `calcDispatchRevenue` divides an already-monthly price by 12 while
`revenueByAsset` multiplies by 12 — a 144× (12²) discrepancy between the Overview KPI
and the Revenue Stack chart for identical inputs — and the Arbitrage term never
divides `arbitragePct` by 100, inflating it ~100×. Evolution A fixes both with the §8.5
prescribed "chart total equals KPI" unit test, then implements the §8 spec's MILP
slice: per-settlement-period dispatch maximising `Σ Price × Dispatch` subject to
state-of-charge (the `ASSETS` schema already carries `rte`, `e_mwh`, `flex_up/down`,
`resp_ms`), with BESS degradation cost from cycle-life data, replacing the static
slider allocation with an optimised one users can still override.

**How.** Backend `vpp_dispatch_engine` (module is Tier B, EP-DT6) with
`POST /optimise` (scipy linprog / PuLP — standard tooling per the roadmap's rung-5
guidance); market prices stay author-calibrated UK levels initially, provenance-
labelled, with an ENTSO-E/Elexon feed as the calibration upgrade (the platform's
ENTSO-E ingestion from data-sources wave 1 is the natural source).

**Prerequisites.** The two §7.4 bugs fixed and regression-pinned in `bench_quant`
before any optimisation work — optimising on broken revenue math would be worse than
useless. **Acceptance:** Overview KPI equals the Revenue Stack chart total to the
pound; `arbPct=70` means 70%; the optimiser's allocation beats the default sliders'
revenue on the same price inputs.

### 9.2 Evolution B — Bid-strategy analyst over the dispatch engine (LLM tier 2)

**What.** VPP operators iterate bid strategy questions all day: "if FCR clears 20%
lower next quarter, where should Pillswood's 196MW go?", "what's the revenue cost of
reserving 30MW for the TfL fleet's charging window?". Evolution B is a tool-calling
analyst over Evolution A's `POST /optimise` plus a `GET /markets` reference route: it
runs counterfactual optimisations, compares revenue stacks, and narrates the binding
constraints from the solver output (SoC limits, response-time eligibility, market
exclusivity) — the explanation layer a MILP badly needs, since raw shadow prices mean
nothing to most users.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; grounding corpus
is this Atlas page including §7.2's market table and §7.5's provenance caveats (asset
names are real UK projects, Minety/Pillswood/Hornsea 3, but prices are author-
calibrated). Every £ figure in an answer must appear in a tool response; the "show
work" expander lists the optimiser run parameters and engine version.

**Prerequisites (hard).** Evolution A complete — the copilot must never narrate the
current KPI, which is off by 144× from the module's own chart; solver runs bounded
(timeout + asset-count cap) so conversational what-ifs stay interactive.
**Acceptance:** counterfactual answers cite two optimiser runs (base + shocked) with
the delta computed from their payloads; asked for real current FCR clearing prices,
the analyst states the calibration provenance and refuses to present platform
constants as live market data.
