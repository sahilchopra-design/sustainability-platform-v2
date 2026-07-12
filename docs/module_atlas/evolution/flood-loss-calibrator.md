## 9 · Future Evolution

### 9.1 Evolution A — Portfolio EP curves and GPD tail fits over the live NFIP data (analytics ladder: rung 3 → 4)

**What.** §7 makes clear this is one of the platform's honest live modules: not a model in its data layer but a real client for OpenFEMA `FimaNfipClaims` v2 (verified reachable), aggregating an empirical per-claim paid-loss distribution server-side and letting the user back-test their own modelled EP-curve points against observed history — a genuine calibration workflow with an explicit "API did not respond" branch and no seeded fallback. Its documented limitations are the ones to attack: results are per-claim (not portfolio EP), and high-volume states suffer recency bias from the 20,000-record most-recent-first cap. Evolution A adds a portfolio-level exceedance curve with a fitted tail: aggregate claims to annual portfolio losses, fit a GPD to the tail (the same technique the physical-risk-pricing exemplar proposes), and produce true return-period losses rather than per-claim percentiles.

**How.** (1) Extend `openfema_claims.py` to bin claims by year and geography and compute an annual-aggregate loss series, paging beyond the 20,000 cap with year-window chunking to remove the recency bias §7 flags. (2) Fit a GPD tail where claim density supports it; report the fit and its standard error. (3) The deviation table gains a portfolio EP-curve comparison alongside the existing per-claim one, clearly labelled.

**Prerequisites.** Higher OpenFEMA paging volume (politeness/rate management); a documented minimum-sample gate below which only the empirical curve shows. **Acceptance:** for a state, the module reports both per-claim percentiles and a portfolio return-period curve with a fitted tail and error bars; the recency-bias caveat is resolved for large states via chunked paging.

### 9.2 Evolution B — Calibration-analyst copilot (LLM tier 2)

**What.** A copilot for cat-modelers: "does my 100-year modelled loss for Florida look high against NFIP history, and by how much?" tool-calls the claims-summary endpoint, compares the user's modelled EP points to the observed distribution, and narrates the deviation with the module's own per-claim-vs-portfolio caveat front and centre so the analyst doesn't misread a per-claim percentile as a portfolio metric.

**How.** Tier-2 tool-calling over the OpenFEMA summary and the Evolution A EP-curve endpoints; the grounding corpus is §7, which precisely documents the data's provenance, the per-claim distinction, and the sampling caveats — the copilot's differentiator is refusing to let the user misapply P99. Every deviation figure is computed by the tool, not the model.

**Prerequisites.** Corpus embedding; Evolution A for portfolio-level comparisons (per-claim comparisons work today). **Acceptance:** every percentage-deviation figure traces to a tool response; asked to compare against a portfolio VaR, the copilot flags the per-claim/portfolio mismatch per §7 rather than answering naively.
