## 9 · Future Evolution

### 9.1 Evolution A — Real portfolio inputs for a genuinely competent risk console (analytics ladder: rung 2 → 3)

**What.** The §7 verdict: "the maths below is genuine; the *inputs* are seeded." The page is a bank-treasury console — historical-simulation VaR/CVaR over a 252-day window, Basel III LCR/NSFR, IFRS 9 ECL with staging, DV01/duration, BIA operational capital, NGFS stress — but the 40 entities' returns are `(sr(i·1000+d)−0.5)·0.04` draws, and the guide's promised EFRS topic-magnitude mapping doesn't exist. Evolution A swaps fabricated inputs for platform data and pins the math.

**How.** (1) Entities and weights come from `portfolios_pg` holdings (the platform's critical-rule table); daily returns from the real market-data seed layer ingested in EA-hybrid-v3, replacing seeded return vectors so hist-sim VaR is computed on observed series. (2) The formula set moves to `services/dme_financial_risk_engine.py` with endpoints per tab (market-risk, liquidity, ECL, WACC, NGFS) — tier-B today, so this is the module's first backend. (3) Implement the guide's `EFRS = Σ Materiality × Magnitude × Likelihood` as the bridge the module was named for: topic scores from `dme_topic_scores` (dme-entity Evolution A) × sector magnitude benchmarks (NGFS scenario deltas already tabulated in-page) → EBITDA-at-risk waterfall. (4) Calibration: pin VaR/ECL/LCR reference cases into `bench_quant.py` and backtest VaR exceptions (Basel traffic-light) against the realized series — that backtest is what earns rung 3.

**Prerequisites.** Demo portfolio seeded at realistic scale (the D0 credibility-gap item); market-data coverage audit for the chosen universe. **Acceptance:** VaR exception count over the backtest window falls in the Basel green zone for the fixture portfolio; every tab's numbers reproduce from engine endpoints; zero seeded returns.

### 9.2 Evolution B — CRO analyst that runs the console via tools (LLM tier 2)

**What.** A tool-calling analyst for the questions this console exists to answer: "which names breach their VaR limit under Delayed Transition, and what does that do to portfolio LCR?" It chains Evolution A's endpoints — NGFS stress → per-entity VaR/ECL deltas → limit comparison against the 16-row `RISK_LIMITS` register — and drafts the breach memo with each figure traced to a tool response, including the ECL staging changes that drive IFRS 9 P&L.

**How.** Tool schemas from the new engine's OpenAPI spec; grounding corpus = this Atlas record's §5/§7 formula blocks (hist-sim definition, LCR/NSFR ratios, ECL staging rules) so explanations match the implemented math rather than textbook variants. Limit-breach narration is read-only; any limit *change* is a gated mutation behind explicit confirmation per tier-2 RBAC. The no-fabrication validator covers bps and ratio figures — treasury users will quote these downstream.

**Prerequisites (hard).** Evolution A first: today there are no endpoints, and the current page would have the copilot attributing seeded Basel ratios to a synthetic book. **Acceptance:** for a golden portfolio, the analyst's stress-breach list matches a scripted endpoint replay exactly; asking for intraday liquidity (not computed) triggers refusal.
