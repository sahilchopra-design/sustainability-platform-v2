## 9 · Future Evolution

### 9.1 Evolution A — Backend unification with real portfolio positions (analytics ladder: rung 2 → 3)

**What.** Connect this page's genuinely well-built client-side simulator (§7 confirms real Cholesky over the 11-sector GICS correlation matrix, full revaluation per path, proper VaR/CVaR tail statistics) to the platform's backend `monte_carlo_engine.py` — a separate, real, Vasicek-VaR/NGFS-PD-calibrated engine exposed at `POST /api/v1/monte-carlo/run` that this page never calls — and run it over actual `portfolios_pg` holdings instead of manually entered sector exposures. The guide's ICAAP/ORSA and factor-attribution claims live only in that unconnected backend today.

**How.** (1) Add a portfolio selector reading `portfolios_pg` (the populated table; `portfolios` is empty) and mapping holdings to the 11 GICS sectors for exposure vectors. (2) Route simulation through `/run` so the Vasicek/NGFS calibration, the engine's Gelman-Rubin convergence diagnostic (`rhat` computation visible in §5's extracted lines), and asset-level results (`AssetLevelResult`) replace the browser loop for portfolios above a size threshold; keep the client path for instant small-N exploration, labelled as the uncalibrated variant. (3) Calibrate the `SECTOR_CORRELATIONS` matrix from ingested market-data history rather than hardcoded values, with the estimation window documented per Atlas §8 model-card convention.

**Prerequisites.** `POST /run` currently `skipped` in the lineage sweep — exercise under auth with a portfolio-shaped fixture; correlation-matrix recalibration changes every VaR number, so pin a fixed-seed reference case in `bench_quant` before switching. **Acceptance:** same portfolio via client and backend paths reported side-by-side with documented divergence; VaR responds to real holding changes in `portfolios_pg`.

### 9.2 Evolution B — Risk-desk analyst with tool-called stress runs (LLM tier 2)

**What.** A tool-calling analyst that operates the simulator conversationally: "run 10,000 paths on the growth portfolio at 99% over 3 years", "which sector drives the tail?", "how much does halving energy exposure cut CVaR?" — executed as calls to `POST /api/v1/monte-carlo/run` and `/quick`, with answers narrating only returned statistics. Factor attribution comes from the engine's per-sector loss decomposition, not from the LLM's intuition about which sectors are risky.

**How.** Tool schemas from the module's 3 OpenAPI operations; system prompt from this page's §5/§7.1 methodology (Cholesky mechanics, percentile-VaR definitions) so explanations are technically correct for an ICAAP audience. Stochastic-output discipline: every quoted VaR carries seed, path count, and engine version in a "show work" expander (roadmap Tier-2 provenance UX); comparisons between runs must hold the seed fixed or disclose sampling error. The no-fabrication validator matches all numerics against tool outputs in-session.

**Prerequisites.** Evolution A's backend wiring (the analyst should drive the calibrated engine, not the browser loop); engine version stamps in `/run` responses per the roadmap's engine-registry work. **Acceptance:** every numeric traceable to a tool call; asking for ICAAP capital numbers the engine does not produce (e.g. Pillar 2 add-on) yields a refusal with a pointer to what it does compute.
