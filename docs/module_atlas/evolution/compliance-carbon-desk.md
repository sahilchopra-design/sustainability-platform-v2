## 9 · Future Evolution

### 9.1 Evolution A — LP-optimal compliance planning over live allowance prices (analytics ladder: rung 3 → 5)

**What.** The desk is a platform flagship done right: 13 hand-authored scheme extracts
with `approx`/`confidence` labelling, honest `None` prices for pre-market schemes
(HTTP 422 rather than fabrication), real CMA decision citations in the Article 6
rulebook, and deterministic calculators whose `methodology` blocks self-document —
§8 status "implemented". Its own docs name the two ceilings: the compliance-cost
optimizer is greedy ("not a full LP but optimal when eligibility sets rarely
overlap"), and the ~2025 price levels are approximate as-of snapshots. Evolution A
lifts both: true optimization and a live price feed.

**How.** (1) LP upgrade: replace the greedy offset-clipping loop in
`POST /compliance-cost` with scipy `linprog` over lots × schemes, respecting each
scheme's `limit_pct_of_obligation` and eligibility sets — exactly the overlapping-
eligibility case the greedy admits it can miss; keep the greedy as a cross-check and
report both when they diverge. (2) Multi-year: banking/borrowing across compliance
periods using the atlas's own cap trajectories (EU ETS LRF 4.3→4.4%/yr, Safeguard
4.9%/yr decline), turning single-period cost into a compliance *plan*. (3) Prices:
scheduled ingest of EU ETS (EEX/ICE public settlement) and CCA/RGGI auction results
into a price table with `as_of` stamps, replacing the approximate levels while keeping
the desk's labelling discipline for schemes without markets. (4) Pin the WCI 12,000 t
clipping worked example in `bench_quant.py`.

**Prerequisites.** Coordination with the shared `carbon_price_ets_engine` (blast
radius 21, used by 2 modules); an auction-result ingest owner. **Acceptance:** LP and
greedy agree on the non-overlapping default case; a constructed overlapping-
eligibility case shows the LP strictly cheaper; every price in a response carries its
`as_of` date.

### 9.2 Evolution B — Article 6 / multi-scheme compliance analyst (LLM tier 2)

**What.** This desk's 25 endpoints and honest reference layer make it the best-
grounded tier-2 candidate in the carbon domain. The analyst answers desk questions by
tool call: "what's my 2027 obligation across EU ETS and K-ETS if free allocation
halves?" → `POST /compliance-cost` with modified positions; "price an ITMO from a
Ghana cookstove programme with corresponding adjustment" → `POST /itmo-price`, then
explains the waterfall using the rulebook's own numbers (6.4's mandatory 5% SoP and 2%
OMGE, which the code carries as s=0.05/o=0.02); scheme questions ("can I use CCOs
beyond 6%?") answer from `GET /schemes`' `offset_rules` verbatim.

**How.** Tool schemas from the desk's OpenAPI operations plus the sibling
`carbon-price-ets` and `dcm` route families already mapped to this module; the
`methodology` blocks every calculator returns become the copilot's explanation
source — it quotes the engine's own assumptions rather than reconstructing them. The
scheme atlas's `confidence`/`notes` fields flow into answers so uncertainty labelling
survives the LLM hop. Fabrication validator on all $/t and tonnage figures.

**Prerequisites.** Complete harness fixtures for the three skipped POSTs
(`/compliance-cost`, `/cross-border`, `/itmo-price` were never swept live); prompt
rules preserving the desk's no-fabrication policy for pre-market schemes (the analyst
must relay the 422-with-override contract, not invent a China ETS2 price).
**Acceptance:** every numeric in an answer traces to a tool response or a quoted
scheme field; asked for a price the atlas holds as `None`, the analyst explains the
override requirement instead of estimating.
