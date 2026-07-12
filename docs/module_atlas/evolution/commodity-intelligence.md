## 9 · Future Evolution

### 9.1 Evolution A — Real price history by default, honest prediction intervals (analytics ladder: rung 1 → 4)

**What.** This terminal has a rare property in the slice: its OLS regression and R²
are *real statistics* — but they run on a seeded random walk (`genPriceHistory`)
unless an optional EODHD API key is configured, and §7.5 notes the one-step linear
extrapolation with `confidence = |r²|·100` is "a heuristic, not a statistical
prediction interval". Evolution A inverts the default: ingested real price series
always, synthetic never, and a forecaster whose uncertainty is statistically meant.

**How.** (1) Data: route energy commodities through the already-integrated EIA series
(wave 1) and the rest through a scheduled EODHD/stooq EOD ingest into a
`commodity_price_history` table — page reads the DB, so no per-user API key is needed
and the seeded-walk path is deleted. (2) Forecasting: replace one-step OLS with
statsmodels ARIMA/ETS on ≥250-day windows, emitting genuine 80/95% prediction
intervals in place of the clamped pseudo-confidence; backtest with rolling-origin
evaluation and publish MAPE per commodity — the rung-4 discipline of the roadmap
(never black-box, model cards per Atlas §8). (3) The seeded overlays §7.5 flags
(`betaOil`, `riskReturn`, alert thresholds) either compute from the real series
(rolling beta vs Brent) or disappear. (4) `COMMODITY_UNIVERSE` YTD/vol fields derive
from the ingested history instead of curated constants.

**Prerequisites (hard).** Price ingest job with a refresh owner; PRNG purge of
`genPriceHistory` and the seeded overlays (guardrail conventions). **Acceptance:**
with the network off, the page shows honest empty states, never a synthetic walk;
backtested interval coverage ≈ nominal (95% PI covers ~95% of held-out closes);
rolling oil beta recomputes when new closes arrive.

### 9.2 Evolution B — Position-aware market brief copilot (LLM tier 1 → 2)

**What.** A copilot for the treasury/buy-side users the overview names: "brief me on
my commodity book" reads the portfolio-linkage tab (holdings mapped via
`SECTOR_COMMODITY_EXPOSURE`), the category movers, and the forecast panel, and writes
a morning-note-style summary — best/worst performers with their actual YTD figures,
forecast direction with the *interval*, EUDR-flagged commodities in the book — every
number from page state, every forecast caveated with its backtested error.

**How.** Tier 1 against page state plus this Atlas record (§5's demand-model
framing, §7.2's provenance table so the copilot knows curated universe fields from
computed ones). Tier 2 adds tool calls once Evolution A's ingest/forecast lands as
backend endpoints: "re-run the copper forecast excluding the squeeze week" or "shock
my book at −15% oil" become parameterized calls to the forecast and price-slider
operations rather than in-context arithmetic. The fabrication validator is essential:
price forecasts are the canonical hallucination surface.

**Prerequisites (hard).** Evolution A's real data — a market brief over synthetic
walks would be professionally embarrassing at best; forecast endpoints for tier 2.
**Acceptance:** every price, YTD and forecast figure in a brief matches page state or
a tool response; the copilot always quotes the prediction interval, never the point
alone; it refuses intraday questions (the data is EOD).
