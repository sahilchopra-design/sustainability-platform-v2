## 9 · Future Evolution

### 9.1 Evolution A — Real PCAF DQ engine + server-side live ingestion (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide promises a PCAF data-quality/lineage engine with
anomaly detection (`DQ_tier = f(source_type, verification, recency, coverage)`) — **none of
which exists**; and while four tabs are genuinely live-capable (GDELT, SEC EDGAR, OpenAlex,
World Bank), the six quant panels (Ensemble NLP, Event Study, Triangulation, Hawkes, Alpha)
are entirely seeded `sr()` draws. Evolution A builds the guide's actual engine: a PCAF DQ-tier
scorer mapping source type → tier 1–5 with verification/recency weighting, an isolation-forest
anomaly detector on ingested time series (sklearn is in the environment), and a lineage DAG
persisted per KPI — the platform's own `lineage_output/traces/` is the pattern to formalise.
Move the four live fetches server-side to kill the documented CORS fragility.

**How.** A `data_quality` engine with `POST /api/v1/live-data/dq-score` (source metadata → tier)
and `/anomalies` (series → flagged outliers >3σ from rolling 12-month mean); a server-side
ingestion job for GDELT/SEC/OpenAlex/World Bank writing to real tables with freshness
timestamps, so `Data Freshness Index = (1 − days_since/max_age)·100` is computed from actual
ingestion logs. Rung 3: calibrate the anomaly threshold against labelled data-error cases;
actually simulate the Hawkes intensity `λ(t) = μ + Σα·e^(−β(t−tᵢ))` rather than displaying its
parameters.

**Prerequisites (hard).** Purge the seeded CARs/correlations/IC curves per the no-fabricated-
random guardrail; note that today even successful GDELT/SEC fetches fill some fields (sentiment,
climateMentions) from the PRNG — those must come from the wire or an NLP pass. **Acceptance:**
DQ tier changes with source type; an injected outlier is flagged by the detector; the four live
tabs render server-fetched data with real freshness timestamps.

### 9.2 Evolution B — Multi-source ESG intelligence copilot with tool-called fetches (LLM tier 2)

**What.** This module's four public APIs make it a natural tier-2 analyst: "what's today's ESG
news tone for the energy sector?" tool-calls the GDELT fetch; "which companies filed climate
10-Ks this quarter?" calls SEC EDGAR full-text; "top-cited ESG-sentiment research this year?"
calls OpenAlex; "CO₂-per-capita for these countries?" calls World Bank — then the copilot
narrates real fetched results instead of the page's seeded fallbacks. The genuine quant scaffolding
(ensemble weighting, IC = rank-corr, IR = IC·√BR from the fundamental law) becomes explainable.

**How.** Tool schemas wrapping the four (now server-side, from Evolution A) fetch endpoints plus
the DQ/anomaly routes; the no-fabrication validator checks every numeric — tone, citation count,
CO₂ figure — against tool outputs. The copilot must surface the `LIVE`/`SEEDED` state per source
and refuse to present seeded fallback data as live. The 41-country CO₂ anchors (Qatar 31.2, USA
14.2, India 1.9) are the ideal grounding for a "is this figure realistic?" check.

**Prerequisites.** Evolution A's server-side fetches (client-side CORS makes reliable tool-calling
impossible); Atlas corpus embedded (roadmap D3). **Acceptance:** every figure in an answer traces
to a tool call whose `LIVE` flag is true, or is explicitly flagged as seeded fallback; asking for
a PCAF DQ score before Evolution A returns a refusal naming the absent engine.
