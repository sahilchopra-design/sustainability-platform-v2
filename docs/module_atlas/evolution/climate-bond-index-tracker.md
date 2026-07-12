## 9 · Future Evolution

### 9.1 Evolution A — Compute returns from a real bond table (analytics ladder: rung 1 → 2)

**What.** §7's verdict is the bluntest in this family: "the code computes nothing" —
the 750-bond universe, +6.8% YTD, "+100bps outperformance", and $155B pipeline are all
hard-coded literals across five hand-typed seed tables; the guide's
`ExcessReturn = GreenIndex − BloombergAgg` has no arithmetic behind it. Evolution A
gives the tracker something to track: a `green_bond_universe` table of actual labelled
bonds (the Climate Bonds Initiative publishes certified-bond lists with ISIN, issuer,
size, coupon, maturity; the platform's entity spine can join issuers), an index-level
series computed from constituent prices where available or from a documented
yield-based total-return approximation where not, and the excess-return line computed
against a stored benchmark series rather than typed.

**How.** (1) CBI certified-bond list ingest (public database) into the universe table;
sector/geo allocation tabs become GROUP BY views — the current static percentages
retire. (2) Return computation honestly tiered: full total-return where price data
exists, `coupon-accrual + duration×Δyield` approximation elsewhere, with the method
per bond displayed (`resolution_tier` pattern). (3) New-issuance monitor fed by the
periodic CBI list refresh delta rather than five hand-typed deals.

**Prerequisites.** CBI data licensing (list access is public; redistribution terms
checked); a price/yield source decision — without one, the module ships allocation
and issuance analytics first and labels performance as approximate. **Acceptance:**
sector allocation reconciles to SQL over the universe table; the excess-return chart
is a computed difference of two stored series with sources named; zero hard-coded
headline metrics remain.

### 9.2 Evolution B — Green-bond market copilot (LLM tier 1)

**What.** Post-Evolution A, a copilot for market questions the data can answer:
"what's driving the energy sector's dominance of certified issuance?", "how has the
green-vs-conventional spread trended and what method computed it?", "which new deals
this month are CBI-certified?" — filter/aggregate narration over the universe and
issuance tables plus §5's CBI/ICMA framework corpus. Tier 1 is the honest ceiling: the
module's computations are index arithmetic, not decision engines.

**How.** Atlas record and universe-table aggregates as corpus/context per the tier-1
pattern; every volume and return figure cited with its computation method (full return
vs approximation — the tiering from Evolution A must surface in answers, not vanish
into prose); certification-criteria questions answer from the CBI standard text.

**Prerequisites (hard).** Evolution A first — today every number on the page is a
literal, and a copilot would be reciting a mock-up as market intelligence.
**Acceptance:** every figure in an answer traces to a table aggregate with method
labelled; asked to forecast next quarter's issuance, the copilot reports the pipeline
table and declines to extrapolate.
