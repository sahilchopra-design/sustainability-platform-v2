## 9 · Future Evolution

### 9.1 Evolution A — A real signal-construction and backtest engine (analytics ladder: rung 1 → 3)

**What.** §7 shows the page is a screener over 50 synthetic "strategies" whose metrics are independent `sr()` draws — internally inconsistent by construction (the §7.4 example proves a strategy's drawn Sharpe of 1.30 coexists with alpha/vol = 0.29). The guide's signal `S = α·ΔESG_momentum + β·ESG_level + γ·controversy_penalty`, IC analysis, and 10-year backtest are absent. Evolution A builds the smallest honest version: a backend signal constructor and walk-forward backtester over data the platform actually holds, replacing the fabricated strategy book.

**How.** (1) `api/v1/routes/quant_esg.py`: `POST /signal` (composite score from user-weighted momentum/level/controversy components over the platform's company master ESG scores), `POST /backtest` (quantile long-short portfolio formation, monthly rebalance, rank-IC per period, turnover) — using ingested market-data history where the platform has it, and honestly refusing horizons it doesn't (the EA-hybrid-v3 market-data seed is the starting corpus). (2) Derived metrics become internally consistent by construction: Sharpe computed from the backtest return series, never drawn. (3) The screener UI survives as the results browser for saved signal configurations (a `quant_signal_runs` table), so the workflow §1 describes — define weights, backtest, monitor — becomes real.

**Prerequisites.** Return-history coverage audit first (an ESG backtest without survivorship-clean prices is worse than none — document the universe and window); controversy component stubbed as null until a real event source exists. **Acceptance:** for any saved run, reported Sharpe equals (mean−rf)/σ of the stored return series; IC is a real cross-sectional rank correlation, reproducible from the run's stored panel.

### 9.2 Evolution B — Signal-research copilot (LLM tier 2, gated)

**What.** Once real backtests exist, the natural copilot is a research assistant over runs: "compare my 60/30/10 momentum-heavy config against equal weights — where does the IC decay differ?", "why did the long-short spread collapse in 2022 in this backtest?" — answered by tool calls to `POST /backtest` and reads of stored run panels, with the copilot narrating regime differences from the computed period-by-period ICs, never asserting market history from memory.

**How.** Tier-2 tool schemas over the Evolution-A endpoints; system prompt grounded in this Atlas record plus the AQR replication-crisis paper the guide already cites — the copilot's standing instruction is skeptical framing (in-sample vs walk-forward, multiple-testing caveats when a user sweeps many configs). A config-sweep request executes as batched backtest calls with the copilot reporting the best config *and* the number of configs tried, a deliberate anti-p-hacking disclosure. No-fabrication validator on every performance statistic.

**Prerequisites (hard).** Evolution A shipped; before it, there is nothing real to research and the copilot must not exist here — the current book is noise. Golden Q&A from a pinned reference backtest. **Acceptance:** every quoted Sharpe/IC matches a stored run; sweep answers disclose trial count; questions about live deployment (not built) are refused.
