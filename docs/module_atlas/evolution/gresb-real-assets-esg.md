## 9 · Future Evolution

### 9.1 Evolution A — Enforce the GRESB 30/70 formula and real peer-quintile star ratings (analytics ladder: rung 1 → 2)

**What.** §7 flags that the displayed scores don't satisfy `score = 0.3×mgmt + 0.7×perf` — the 20 funds' `management`, `performance`, and `gresbScore` are independent `sr()` draws not linked by the GRESB formula, and the star rating is a per-fund random draw rather than a quintile of the fund's peer benchmark universe; only the component weights, trend series, and best-practice figures reflect real GRESB structure. Evolution A enforces the real methodology: compute `GRESB_Total = 0.30·Management + 0.70·Performance` so the total is a genuine function of its components, and derive star ratings as true quintiles and quartile ranks against the peer benchmark universe — turning a synthetic dashboard into a real benchmarking tool over sourced or user-entered fund data.

**How.** (1) Compute `gresbScore` from `0.3·management + 0.7·performance` (the components themselves from the seven performance/management aspects). (2) Star rating = quintile of the fund's score within its peer benchmark universe; quartile rank = percentile per §5. (3) Fund data sourced (GRESB disclosures) or user-supplied, replacing the seeded panel; the real benchmark distributions drive the peer ranking.

**Prerequisites.** Fund component data (sourced/user-entered); a peer benchmark universe (the real GRESB 2024 distributions the sibling `gresb-scoring` carries); the independent seeded scores replaced. **Acceptance:** `GRESB_Total` reconstructs exactly from `0.3·mgmt + 0.7·perf`; star ratings are peer-universe quintiles, not per-fund draws; no unlinked `sr()` score remains.

### 9.2 Evolution B — Real-assets ESG benchmarking copilot (LLM tier 1 → 2)

**What.** A copilot for real-asset fund managers: "how does our fund's GRESB score break down 30/70, and what star rating does that give against peers?" narrates the component structure and benchmark context from the atlas corpus, with tier-2 computing the score and peer quintile via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (the GRESB 30/70 split, star-rating quintiles, the seven aspects). The copilot's value is explaining score composition and peer positioning. Guardrail, pre-Evolution-A: scores are unlinked seeds and stars are random draws, so it must refuse fund-specific score/rating claims and answer only on GRESB structure. Tier 2 tool-calls the score/ranking endpoint. Every score and rating figure validated against tool output.

**Prerequisites.** Corpus embedding; Evolution A for the enforced formula and real peer ranking. **Acceptance:** post-Evolution-A, every score and star rating traces to a tool call reproducing the 30/70 formula and the peer quintile; pre-Evolution-A the copilot declines fund-specific figures.
