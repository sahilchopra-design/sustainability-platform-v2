## 9 · Future Evolution

### 9.1 Evolution A — Real NLP pipeline feeding the analytics layer (analytics ladder: rung 1 → 4)

**What.** Per the §7 mismatch flag, no NLP runs here: every article, sentiment score, FinBERT
probability triple, confidence and forward return is an `sr()` draw. What the page *does*
genuinely implement is the analytics layer that would sit atop a real pipeline — EWMA smoothing
(`ewma = 0.15·v + 0.85·ewma`, the one real time-series calc), source-credibility weighting
(tier weights [1.0…0.40]), a 3-factor alpha combiner (SMF/SRS/CP) with IC-decay diagnostics, and
confidence-calibration bins. Evolution A supplies the missing pipeline: ingest real ESG news
(GDELT is already wired in the sibling ai-data-live module), run an actual FinBERT/ClimateBERT
inference pass for the sentiment triple, and derive the factor values from the sentiment
histories — SMF as `EWMA_now − EWMA_lag`, IC as realised Spearman rank-correlation vs forward
returns — instead of independent random draws.

**How.** A news ingester + an inference service (`POST /api/v1/ai-sentiment/score` running the
transformer, `GET /portfolio-sentiment` for the EWMA-smoothed entity series); the existing
analytics (credibility weighting, calibration, IC decay) consume real model outputs. Rung 4
(predictive): the alpha signal becomes a real backtest of sentiment-momentum vs forward returns
with honest IC/IR, replacing the synthetic positive drift baked into the current backtest
(−0.42 vs −0.47 pivots).

**Prerequisites (hard).** Purge the pervasive `sr()` draws per the no-fabricated-random
guardrail; the NLP benchmark table's F1/latency figures are fabricated-plausible (§7.6) and must
be replaced with measured values once models run; entity disambiguation needs a real linker
(the 50-record queue is seeded). **Acceptance:** the FinBERT triple and headline sentiment agree
(today they are uncoupled draws — §7.4 quirk); factor values recompute from EWMA histories;
backtest IC reflects realised, not built-in, predictive power.

### 9.2 Evolution B — Sentiment copilot grounded in entity-level scores (LLM tier 1 → 2)

**What.** A copilot answering "why did sentiment on Company X drop this month?" (walking the EWMA
series and the news that moved it), "which controversy types decay slowest?" (Board Misconduct
56d vs Tax Avoidance 18d from `FADE_RATES`), and "is my sentiment alpha signal calibrated?"
(reading the reliability-diagram bins). Grounded in the page's computed analytics; because the
underlying scores are synthetic today, the copilot must state that sentiment values and forward
returns are seeded until Evolution A's real pipeline lands.

**How.** Tier-1 roadmap pattern: §7.2 parameter table (EWMA λ, credibility weights, fade
half-lives, IC-decay framing) and §7.6 framework alignment (FinBERT, VADER, Grinold–Kahn IC)
embedded as the module corpus; page state (selected entity's EWMA history, factor weights) passed
as context; served via `POST /api/v1/copilot/ai-sentiment/ask` with the standard refusal path.
After Evolution A, graduate to tier 2: "score the latest news on X" tool-calls the real inference
endpoint, and the no-fabrication validator checks every sentiment figure against model output.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note so
the copilot never presents seeded FinBERT triples as real inference. **Acceptance:** every figure
cited matches page state with its synthetic status stated; a request to score a live headline
before Evolution A returns a refusal naming the absent NLP pipeline.
