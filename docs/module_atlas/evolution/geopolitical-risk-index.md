## 9 · Future Evolution

### 9.1 Evolution A — Live WGI ingestion with percentile confidence bands and calibrated weights (analytics ladder: rung 2 → 3)

**What.** §7 rates CV1 one of the more faithful CV-sprint implementations: a genuine weighted-mean composite `round(govScore·0.7 + (100−riskPenalty)·0.3)` over the six WGI dimensions plus sanctions/conflict/trade penalties, with user-adjustable weights. Its flagged gaps: all 51 country rows are static synthetic demo values (not live WGI/OFAC/ACLED pulls despite the citation), `trend[]` is a 5-point hand-set series, the 0.7/0.3 split is hard-coded rather than empirically calibrated, and WGI's real percentile-rank confidence intervals are collapsed to point estimates. Evolution A makes the index real: ingest live WGI (World Bank publishes it via API), carry the percentile confidence bands WGI provides, back sanctions/conflict penalties with OFAC/ACLED feeds, and calibrate the governance-vs-risk split against sovereign spread/default outcomes.

**How.** (1) A WGI ingester writing the six dimensions with their published standard errors to a `wgi_scores` table; the composite carries a confidence band. (2) Sanctions penalty from OFAC SDN breadth, conflict from ACLED event intensity — real feeds replacing the static scalars. (3) Calibrate the 0.7/0.3 weight (and optionally the penalty decomposition into primary/secondary sanctions, inter/intrastate conflict) against a sovereign-spread panel, documented per §8.

**Prerequisites.** WGI/OFAC/ACLED ingesters; a sovereign-spread reference series for calibration; the static country table retired. **Acceptance:** the index reproduces live WGI within tolerance and shows confidence bands; the calibrated split is documented with its fit; no static literal drives a country score.

### 9.2 Evolution B — Country-risk analyst copilot (LLM tier 2)

**What.** A copilot for sovereign and country-risk desks: "rank our exposure countries by geopolitical risk if I weight rule-of-law double, and explain what drives Nigeria's score" tool-calls the CV1 scoring endpoint with custom weights and narrates the six-dimension decomposition, sanctions/conflict penalties, and trend from real WGI data.

**How.** Tier-2 tool-calling over the (Evolution A) scoring endpoint with the weight vector as a tool parameter — the module's custom-weights feature becomes a natural tool surface. The grounding corpus is §5/§7, which accurately describe WGI's unobserved-components construction, so the copilot explains what each dimension measures and why a country scores as it does. Because the composite is already a genuine weighted mean, a tier-1 explainer over rendered rankings ships before the ingestion work. Every score validated against tool output; confidence bands surfaced honestly post-Evolution-A.

**Prerequisites.** Evolution A for live data and bands (custom-weight what-ifs work on the current static table for tier 1); corpus embedding. **Acceptance:** re-weighted rankings in a copilot answer match the scoring endpoint for the given weights; the copilot reports WGI confidence intervals post-Evolution-A rather than presenting scores as exact.
