## 9 · Future Evolution

### 9.1 Evolution A — Real constituents under the existing (correct) tilt engine (analytics ladder: rung 2 → 3)

**What.** §7 rates this among the genuinely functional modules: a real PAB/CTB
pipeline — exclusion screens, the exponential carbon tilt
(`w_i·exp(−max(0, CI_i−target)/(target+1))` with renormalisation), achieved-reduction
computation, sector decomposition, tracking-error proxy, and the 7%/yr decarbonisation
pathways — whose only weakness is that the 300-constituent universe is `sr()`-seeded.
The math is right; the inputs are fiction. Evolution A swaps the universe for real
constituents: index membership and weights from public sources (e.g. iShares ETF
holdings files are freely downloadable proxies for major indices), carbon intensities
from disclosed emissions joined via the platform's GLEIF/OpenFIGI entity-resolution
spine, and fossil-revenue exclusion fields from disclosed segment data where available.

**How.** (1) `ref_index_constituents(index, ticker, lei, weight, as_of)` +
`ref_issuer_carbon(lei, scope12_intensity, fossil_rev_pct, source, year)` tables; the
existing tilt engine consumes them unchanged — this is a data evolution, not a math
rewrite. (2) Coverage honesty: constituents lacking disclosed CI are excluded with the
coverage ratio displayed, never imputed silently (EU BMR requires documented
estimation policies — state ours). (3) Backtest tab upgraded from synthetic to
point-in-time reconstruction where historical weights exist; otherwise labelled
inception-forward only.

**Prerequisites.** Licensing distinguishes redistribution vs internal analytics —
holdings-file terms checked; entity-resolution hit rate on constituents measured
first (GLEIF spine now populated). **Acceptance:** constructing a PAB from a real
universe achieves and displays ≥50% WACI reduction with per-constituent provenance;
the tilt engine's outputs on the old synthetic fixture are regression-pinned.

### 9.2 Evolution B — Benchmark-design analyst (LLM tier 2)

**What.** A tool-calling assistant for index designers: "build a CTB from this parent
with the utilities sector capped at parent weight", "why did constituent X get
down-weighted 60%?" (the exponential tilt is fully explainable — distance above
target CI drives the exponent), "what's the tracking-error cost of moving from 30% to
50% reduction?" — each executed against the existing construction pipeline as
client-side tools (or backend if Evolution A moves construction server-side), with
EU BMR rule checks (`EU_BMR_RULES` seed encodes the 1%/10% fossil thresholds) cited
per decision.

**How.** Tool schemas over the constructor functions (parent selection, exclusion
screen, tilt with target reduction, backtest); the no-fabrication validator ties every
WACI, weight, and TE figure to invocations; regulation questions answer from the §5
corpus (Regulation 2019/2089, EBA RTS) with article-level citations.

**Prerequisites.** Evolution A strongly preferred so recommendations concern real
benchmarks; pre-A the assistant must label outputs as synthetic-universe
demonstrations. **Acceptance:** a design conversation ends with a reproducible
parameter set (re-running yields identical weights); the assistant refuses to assert
BMR compliance — it reports which coded rule checks passed.
