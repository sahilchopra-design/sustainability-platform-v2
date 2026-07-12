## 9 · Future Evolution

### 9.1 Evolution A — Implement permanence-adjusted pricing on disclosed purchase data (analytics ladder: rung 1 → 2)

**What.** §7 classifies this as a market-intelligence display: the guide's headline
formula (`Permanence_adjusted_price = Nominal · (1 − leakage·years)`) is **not
implemented**, and only two aggregations exist (`totalCommitment`, `avgMaxPrice` over
the 20 `BUYERS`). The seed economics are realistic but hand-typed and will stale.
Evolution A does two things: implements the advertised permanence-adjustment
calculation as a real function over the credit-type table (durability years, reversal
rate → risk-discounted price, benchmarked against the observed Tier-1-vs-Tier-3 price
gap the `PERMANENCE_SPECTRUM` already encodes), and re-bases the market data on
disclosed CDR purchases — the CDR.fyi public dataset and Frontier's published deals
(§5 already cites Stripe/Frontier 2024) give real transaction volumes and prices per
pathway.

**How.** (1) `ref_cdr_purchases(date, buyer, supplier, pathway, tonnes, price_usd_t,
source)` reference table from CDR.fyi exports; the OTC price-history chart switches
from hard-coded 2024 monthlies to aggregates over it. (2) `permanenceAdjust(nominal,
durability, leakage_rate)` implemented per the guide formula, unit-tested, with the
implied leakage rate back-solved from observed tier spreads as a calibration check.
(3) 2030 price columns clearly labelled as scenario projections, separated from
observed data.

**Prerequisites.** CDR.fyi licensing/attribution confirmed; mismatch flag clears when
the formula exists in code. **Acceptance:** the adjusted price of a 100-year biochar
credit reproduces the formula by hand; the price-history chart cites row counts per
month from the purchases table.

### 9.2 Evolution B — CDR procurement copilot (LLM tier 1)

**What.** A copilot for buyer-side questions the page's data can actually answer:
"which pathways fit a buyer with a $200/t cap and >1,000-year durability requirement?"
(a filter over `CREDIT_TYPES` × `PERMANENCE_SPECTRUM`), "what did comparable buyers
commit?" (the 20 buyer profiles), "why does DAC-Geo trade at 4x biochar?" (permanence
tiers, §5 Oxford Principles framing). Explanation and filter-narration only — the
module computes almost nothing today, and tier 2 requires Evolution A's functions.

**How.** Tier-1 pattern: atlas record plus the seed/reference tables in
`llm_corpus_chunks`; screening answers restate which rows pass stated constraints,
verifiable against the rendered tables; the prompt distinguishes observed-2024 data
from 2030 scenario columns explicitly.

**Prerequisites.** Evolution A's purchase table strongly preferred first — narrating
hand-typed prices as "market intelligence" is defensible only with the demo caveat
stated. **Acceptance:** every price cited matches a table cell with its
observed-vs-scenario status named; a request for a live quote is refused.
