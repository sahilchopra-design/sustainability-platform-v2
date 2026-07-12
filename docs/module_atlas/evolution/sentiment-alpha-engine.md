## 9 · Future Evolution

### 9.1 Evolution A — An honest backtest that can fail (analytics ladder: rung 1 → 3)

**What.** The module has a real backend (`sentiment_analysis_engine`, shared by 3 modules, with genuine credibility-weighting and exponential decay math) but its frontend backtest is constructed to succeed: §7.6 documents that the `−0.42`/`−0.52` mean offsets guarantee positive long-short returns for every signal, `maxDD` is randomised rather than computed from the cumulative path, the Sortino implementation is non-standard, and the headline IC/Sharpe figures are static constants never reconciled with `buildBacktest` output. Evolution A replaces the rigged simulation with a genuine event-study backtest over ingested sentiment history so a signal with no alpha shows no alpha.

**How.** (1) Persist `POST /process-batch` outputs into a `sentiment_signals_history` table (the engine already computes decayed, credibility-weighted scores — they are just not stored). (2) Compute IC as rank correlation between stored entity scores and subsequent realised returns (market data seeds from the EA-hybrid-v3 work provide the return side); derive Sharpe/Sortino/maxDD from the actual cumulative path, fixing the two §7.3 formula defects. (3) Delete the static `SIGNALS[].ic/.sharpe` constants — one source of truth, computed. (4) Report IC with confidence intervals so a 0.02 IC is visibly indistinguishable from noise.

**Prerequisites.** A real text feed for signal generation (GDELT is free/keyless and fits the existing ingester scaffold); the engine's seeded fallback path (`2654435761` hash) must be labelled or removed per platform anti-fabrication convention. **Acceptance:** a deliberately shuffled-label backtest produces IC ≈ 0 within CI; maxDD equals the drawdown of the plotted cumulative series.

### 9.2 Evolution B — Signal-desk analyst over the sentiment API (LLM tier 2)

**What.** The module already exposes a 10-route API (`/process-signal`, `/process-batch`, `/entity-score`, `/portfolio`, `/topic-trend`, `/module-feed`, plus four `/ref/*` config endpoints). Evolution B is a tool-calling analyst that operates it: "score this headline for Unilever," "what drove the portfolio sentiment dip in May," "show topic trend for greenwashing across my holdings" — each answered by calling the real endpoints and narrating returned scores, credibility weights, and decay factors. The LLM also becomes the classifier front-end: raw text in, structured signal (entity, polarity, confidence, source credibility) out, submitted to `/process-signal` for the deterministic weighting math.

**How.** Tool schemas from the module's OpenAPI spec (all read-only or compute-only); system prompt from this Atlas record with §5's weighting formula as grounding. The no-fabrication validator checks every IC/score in answers against tool outputs. The classifier path logs `(text, extracted signal, engine score)` triples into `llm_traces` — the Tier-4 flywheel's first sentiment corpus.

**Prerequisites (hard).** Evolution A's honest backtest first — an analyst narrating the current guaranteed-positive backtest would market fabricated alpha. **Acceptance:** every quantitative claim traces to a tool response; asking "what's this signal's true out-of-sample IC?" before sufficient history exists returns the coverage caveat, not a number.
