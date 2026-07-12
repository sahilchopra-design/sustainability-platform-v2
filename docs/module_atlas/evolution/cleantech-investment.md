## 9 · Future Evolution

### 9.1 Evolution A — Compute the InvestScore over sourced sector benchmarks (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's composite —
`InvestScore = TRL/9·0.3 + Abatement/Max·0.3 + MarketSize/GDP·0.2 + LearningRate·0.2`
— is never formed: the page renders a 60-company `sr()`-seeded universe through
scatter/histogram/rollup views, with only the sector abatement benchmarks hard-coded
from real sources. Evolution A implements the score at the honest level of granularity:
**sector × TRL-stage** scoring first (where the real benchmark data lives — IEA Net
Zero technology-guide abatement potentials, published learning rates per technology,
BNEF market sizing from §5's reference list), with per-company scores only for
user-entered companies whose TRL/market inputs are real.

**How.** (1) `ref_cleantech_benchmarks(sector, abatement_gt, learning_rate, market_bn,
source, vintage)` reference table replacing in-page constants; the 10-sector list is
already the page's organizing axis. (2) The composite as a pure function with the
guide's weights; a user-entered company form (TRL, target market, geography) produces
a scored, comparable result. (3) The synthetic 60-company universe re-labelled as
demonstration fixtures or removed — the scatter (abatement cost vs IRR) keeps working
over whatever universe is loaded, but its provenance must be displayed.

**Prerequisites.** Benchmark licensing check for BNEF figures (IEA/IPCC values are
public); the `CleanTechAdvancedAnalytics` shared panel's overlays unaffected
(regression-checked). **Acceptance:** a TRL-9 solar company in a large market scores
above a TRL-3 CCS venture under default weights, with each term traceable to a
benchmark row; the mismatch flag clears.

### 9.2 Evolution B — Thesis-drafting analyst (LLM tier 2)

**What.** The module's stated endpoint is "export investment thesis with IPCC pathway
alignment evidence" — a natural LLM deliverable. An analyst assistant that takes a
company profile (sector, TRL, geography), calls the Evolution A scoring function and
benchmark lookups as tools, and drafts a structured thesis: score decomposition,
sector abatement context from the reference table, learning-curve trajectory, SFDR
Article-9 impact framing — every numeric from tool calls, every framework claim cited
to the §5 corpus (IEA NZE, IPCC AR6 WGIII Ch.16, Breakthrough TRL framework).

**How.** Client-side tool schemas over the scoring/benchmark functions (no backend
routes exist); the thesis renders through the platform's report-studio layer per the
tier-3 output pattern; the no-fabrication validator checks the draft's numbers against
tool outputs — particularly important here because investment-thesis prose is exactly
where an LLM would otherwise improvise multiples and market sizes.

**Prerequisites (hard).** Evolution A first: a thesis generator over PRNG-fabricated
company IRRs would produce authoritative-sounding fiction. **Acceptance:** every
figure in a generated thesis traces to a benchmark row or tool return; asked to
predict a company's exit valuation, the assistant refuses and offers the computed
score decomposition instead.
