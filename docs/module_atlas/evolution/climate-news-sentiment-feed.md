## 9 · Future Evolution

### 9.1 Evolution A — Real ingestion under the real analytics (analytics ladder: rung 1 → 2)

**What.** §7's split verdict: the aggregation layer is genuinely correct
(index/momentum/volatility arithmetic over article scores) but everything it consumes
is fabricated — 200 template-generated headlines with `sr()`-drawn sentiment,
relevance, and "portfolio impact"; no NLP, no ingestion, no sources despite the
guide's 15k-articles/day FinBERT pipeline claim. Evolution A builds a modest, honest
pipeline: RSS ingestion from a curated list of climate/regulatory feeds (GDELT's free
API and public RSS from regulators and trade press are keyless), entity matching
against the platform's GLEIF-backed entity spine, and sentiment scored server-side —
where the platform's LLM tier does this credibly: a Haiku-tier classification call
per article (sentiment, topic, entities) is cheaper and better than shipping a
FinBERT sidecar, and its outputs are cacheable and auditable.

**How.** (1) A 20th ingester: `news_articles(url, published_at, source, title,
entities, topic, sentiment, model_version)` on a 15-minute cycle over ~30 feeds —
thousands/day honestly, not "15,000+". (2) The existing aggregation functions
(rolling net-sentiment index `SS = (pos−neg)/total×100`, momentum, volatility)
re-pointed at real rows unchanged — the §7-praised math survives intact.
(3) Threshold alerting per the guide, with alert events persisted and auditable.
(4) Guide rewritten to the shipped scale and method.

**Prerequisites (hard).** Synthetic `NEWS_ITEMS` purge; feed licensing (headlines +
links are safe; full-text storage is not — store snippets and URLs); LLM
classification cost ceiling and `llm_traces` logging per the platform pattern.
**Acceptance:** every rendered item links to a real URL with a fetch timestamp;
sentiment carries model version; the index recomputes correctly as new articles
arrive; zero template headlines remain.

### 9.2 Evolution B — Signal-triage copilot (LLM tier 2)

**What.** With real articles in place, the natural assistant is a triage analyst:
"why did the utilities sentiment index drop 20 points this week?" answered by
retrieving the driving articles (the aggregation identifies them; the LLM summarises
with links), "which portfolio holdings had negative litigation-topic coverage this
month?", "draft a morning briefing of climate-regulatory signals". Summaries cite
article URLs; index moves cite the aggregation math; the copilot never scores
sentiment itself in conversation — scores come from the ingestion pipeline's logged
classifications.

**How.** Tool schemas over article search/aggregate endpoints; the validator ties
every index value and count to tool outputs; briefing drafts follow a fixed structure
(movers, drivers, watch items) with per-item links; the classification model version
is disclosed so users can discount appropriately.

**Prerequisites (hard).** Evolution A first — a triage copilot over template
headlines would fabricate market intelligence in the most literal sense.
**Acceptance:** every article referenced in an answer resolves to a stored URL; an
index-move explanation lists the articles whose scores arithmetically drove it;
briefings regenerate identically for a frozen window.
