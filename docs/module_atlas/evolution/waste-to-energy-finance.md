## 9 · Future Evolution

### 9.1 Evolution A — Technology-conditioned economics via the sibling's project-finance engine (analytics ladder: rung 1 → 2)

**What.** The module is a 55-project synthetic directory whose two slider aggregates
(`gateRevenue`, `creditValue`) are its only reactive math; §7's flag documents that
the advertised NPV and biogas-yield formulas are unimplemented, and — the single
largest limitation per §7.5 — `lcoe` and `irr` are technology-*independent* random
draws, so the per-type LCOE chart "looks like a genuine technology cost comparison but
is statistical noise around a common mean". Evolution A conditions everything on
technology: LCOE/IRR distributions anchored to the sibling
`waste-to-energy-biogas-finance` module's 8-technology matrix (LFG ~$48/MWh vs Plasma
Arc ~$165/MWh), `energyOutput` derived from `wasteProcessed` and per-type conversion
efficiency (fixing §7.3's scatter that shows no correlation between causally-linked
quantities), and an EU-ETS-from-2026 carbon-cost term
(`fossilFraction × tonnage × EUA price`) so the module's headline regulatory story is
finally computed. Per its own §7.5 recommendation, project-level economics reuse the
sibling module's planned cash-flow waterfall engine rather than building a second one.

**How.** Point this page at the sibling's `POST /api/v1/wte-finance/project-model`
once built (or build it here first — the two modules share one §8 spec); the ETS term
is a pure frontend formula using the existing `carbonPrice` slider plus a per-type
biogenic-fraction constant (ISWA-cited).

**Prerequisites.** The sibling's engine (shared dependency, coordinate to avoid
duplication); biogenic-fraction reference values per technology. **Acceptance:** the
per-type LCOE chart shows LFG materially below Incineration by construction; the
waste-vs-energy scatter shows positive correlation; toggling ETS-2026 reduces
incineration project economics but not AD.

### 9.2 Evolution B — Market-sizing copilot for municipal procurement (LLM tier 1)

**What.** Unlike the sibling (deal-level screening), this module's aggregates are
portfolio/market-level — §7.4 itself notes the slider outputs are "an order-of-
magnitude market-sizing view". Evolution B leans into that: a copilot for municipal
waste authorities and market analysts that explains the filtered portfolio state —
"what does €80/t gate fee do to the EU incineration revenue pool?", "how much
carbon-credit value is at stake if EUA hits €100?" — by reading the current slider
values and filtered totals from page state, grounded in the Atlas record, with
clear labelling that the 55 projects are synthetic and the answer is directional.

**How.** Tier-1 stack per the roadmap: embed this page into `llm_corpus_chunks`;
`POST /api/v1/copilot/waste-to-energy-finance/ask`; system prompt carries §7.5's
limitations verbatim (synthetic projects, technology-independent draws until
Evolution A) so honesty is baked in. Upgrade to tier 2 only after Evolution A gives
it a real engine tool to call — before that, there is nothing trustworthy to execute.

**Prerequisites.** pgvector corpus (roadmap D3); coordination with the sibling
module's copilot so the two WtE assistants share grounding and don't give conflicting
technology figures. **Acceptance:** every figure in an answer matches page state
arithmetic; asked for a specific facility's real gate fee, the copilot states the
directory is synthetic; ETS questions cite the 2026 inclusion rule with the module's
reference framing, not invented EUA forecasts.
