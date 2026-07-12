## 9 · Future Evolution

### 9.1 Evolution A — Real GSS+ issuance flow with a computed demand index (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's two headline metrics —
`Market Penetration = GSS+/Total Issuance` and
`Demand Pressure Index = OrderBookCoverage × GreenShare × −Greenium` — have no
denominator, no order-book data, and no index computation behind them; the page is a
100-instrument synthetic browser (`greenium = −(2 + sr(i·17)·22)`, always negative by
construction — a tell that the pricing is invented) plus a hard-coded ESG-index table,
30 synthetic investors, and eight prose strings labelled "regulatory insights".
Evolution A rebuilds the flow layer on observable data: GSS+ issuance volumes from the
CBI/ICMA published quarterly datasets §5 already cites, market penetration computed
against total bond issuance from public aggregates (SIFMA/BIS series), and greenium
handled honestly — reported only where a matched-pair study or disclosed pricing
exists, with sign free to be positive.

**How.** (1) `ref_gss_issuance(quarter, label, sector, region, volume_bn, source)`
ingested from the CBI market-intelligence releases; penetration becomes a real
quotient with both numerator and denominator sourced. (2) The demand-pressure index
implemented as specified but computed only for deals with disclosed book coverage
(new-issue press data), else null — honest-nulls beats fabricated completeness.
(3) The regulatory pipeline tab converted from prose strings to a dated milestone
table (EU GBS application dates, SEC rule status) with citations.

**Prerequisites.** CBI/ICMA data licensing; the synthetic instrument browser retired
or relabelled demo. **Acceptance:** market penetration reproduces
CBI-volume ÷ total-issuance for a pinned quarter; every greenium shown carries a
source; the mismatch flag clears.

### 9.2 Evolution B — Syndicate-desk intelligence copilot (LLM tier 1)

**What.** A copilot for origination and investor-relations questions the rebuilt data
can answer: "how did SLB issuance trend against green in 2024 and which sectors
drove it?", "what's the EU GBS status and what does it require of us as issuer?",
"where has greenium been observed in our sector?" — aggregation narration over the
issuance tables plus regulation citations from the milestone table. Tier 1: the
module's value is curated market intelligence, not computation, and the honest LLM
role is retrieval and synthesis with sources.

**How.** Atlas record, issuance aggregates, and the regulatory milestone table as
corpus/context; every volume cited with quarter and source; greenium answers must
carry the observation basis (matched-pair vs disclosed pricing) — the tiering from
Evolution A surfaces in prose. Refusal path for live pricing, allocations, and
forward-issuance forecasts.

**Prerequisites (hard).** Evolution A first — narrating the current synthetic browser
would present invented greeniums as market color to people who trade on such numbers.
**Acceptance:** every figure in an answer traces to a sourced table row; asked "what
greenium should we expect on our deal?", the copilot reports observed ranges with
caveats and declines to predict.
