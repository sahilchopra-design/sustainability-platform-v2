## 9 · Future Evolution

### 9.1 Evolution A — Real news ingestion with reconciled composite scoring (analytics ladder: rung 1 → 3)

**What.** The backend (`sentiment_analysis_engine`, shared by 3 modules) genuinely implements credibility weighting and exponential decay, but the page runs on 200 `sr()`-synthetic companies and a 20-headline article pool, and carries a documented guide↔code mismatch: the guide specifies pillar weights 0.4/0.35/0.25 while the code computes an unweighted `(e+s+g)/3`. §7.6 adds that the article stream and company profiles are two disconnected synthetic sources, and `priceCorr`/`ic` are random draws posing as return-derived statistics. Evolution A makes the entity scores real: ingest an actual news feed and drive the page from the module's own six POST endpoints.

**How.** (1) One-line fix first: apply the documented pillar weights (or update the guide — pick one source of truth). (2) A GDELT ingester (free, keyless, already listed in the page's own `SOURCES_DATA` taxonomy) feeding `POST /process-batch`; persist outputs to a `sentiment_signals_history` table shared with `sentiment-alpha-engine`'s Evolution A. (3) Replace the synthetic company array with `GET /entity-score` responses so "recent articles" and "sentiment trend" finally correlate because they share one pipeline. (4) Drop `priceCorr`/`ic` from this page entirely (they belong to the alpha module) or compute them from stored history.

**Prerequisites.** Entity resolution from GDELT organisation names to platform entities (the populated `entity_lei` table is the join key); the engine's seeded fallback (`2654435761` hash) must be labelled as fallback in responses. **Acceptance:** a headline visible in the article feed moves the referenced entity's score through the documented decay math; composite score matches the guide formula exactly.

### 9.2 Evolution B — Controversy-monitoring analyst (LLM tier 2)

**What.** A tool-calling analyst for the controversy workflow the overview describes: "flag controversy spikes and deliver portfolio-level sentiment heatmaps." It answers "what happened to Company X this week?" by calling `POST /entity-score` and `POST /topic-trend`, summarising the underlying articles (real ones, post-Evolution-A), and classifying severity against the RepRisk-style taxonomy the module already mirrors. For portfolios, it calls `POST /portfolio` and narrates which holdings drive the aggregate move.

**How.** Tool schemas from the module's 10 OpenAPI routes (6 POST compute + 4 GET ref); system prompt from this Atlas record with the §5 weighting formula and source-tier table as grounding. Article summarisation quotes source and date; the no-fabrication validator checks every score against tool outputs. Alert drafting reuses `GET /ref/alert-config` thresholds rather than letting the LLM pick cutoffs.

**Prerequisites (hard).** Evolution A's real feed — summarising the current fixed 20-headline synthetic pool would manufacture news. **Acceptance:** every article referenced in an answer exists in the ingested corpus with a retrievable URL; entity scores quoted match `/entity-score` responses byte-for-byte.
