## 9 · Future Evolution

### 9.1 Evolution A — True joint simulation via the backend engine (analytics ladder: rung 2 → 3)

**What.** Close the module's documented single-variable gap. §7's mismatch flag: the page simulates only ONE variable at a time via Box-Muller, and the 4×4 `CORR_MATRIX` (carbon price, GDP, energy price, technology cost) is displayed but never Cholesky-decomposed — cross-correlation is faked by a single `corrAdj` volatility scalar. Meanwhile the platform's backend `monte_carlo_engine.py` (shared by 3 modules, exposed at `POST /api/v1/monte-carlo/run` and `/quick`, with a real Gelman-Rubin `rhat` convergence diagnostic already in its code) sits uncalled by this page.

**How.** (1) Move simulation server-side: the page posts its config (paths, horizon, distribution, and now the full `CORR_MATRIX`) to `/run`; the engine performs genuine 4-variable Cholesky-correlated draws, returning fan-chart percentiles and VaR/CVaR/ES it already structures via `PercentileResult`/`AssetLevelResult`. (2) Calibrate distribution parameters to the named sources — NGFS Phase 5 carbon-price vintages and IMF GDP shock distributions — loaded from the refdata layer rather than hardcoded means/vols. (3) Pin the engine in `bench_quant`: fixed-seed reference run asserting VaR95/CVaR99.5 within tolerance, plus an rhat < 1.1 convergence gate surfaced in the UI.

**Prerequisites.** The lineage sweep marks `POST /run` as `skipped` (needs a request-shape fixture) — exercise it under auth first; keep the client-side Box-Muller path as an offline fallback labelled as uncorrelated. **Acceptance:** setting the carbon↔energy correlation to 0 vs 0.8 measurably changes joint tail loss; identical seeds reproduce identical fan charts.

### 9.2 Evolution B — Scenario copilot with tool-called re-simulation (LLM tier 2)

**What.** A copilot on the EP-CH1 page answering "why is CVaR 99.5 so much worse under Student-t?" from the actual simulation output (fan-chart percentiles, tail statistics, distribution config), and executing what-ifs — "re-run with 10,000 paths under GEV", "compare disorderly vs hot-house carbon paths" — as tool calls against `POST /api/v1/monte-carlo/run` and `/quick`, never generating simulated numbers itself.

**How.** Tool schemas from the module's 3 OpenAPI operations (health/run/quick); system prompt from this Atlas page's §5 formulas and §7.1 walkthrough so the copilot explains Box-Muller, percentile-VaR, and the fan-chart bands correctly. Because Monte Carlo output is stochastic, the copilot must always report the seed and path count alongside any quoted statistic, and the no-fabrication validator matches quoted numerics against the session's tool responses. `/quick` (already `passed` in the lineage sweep) is the cheap first tool — scenario comparison without a full run.

**Prerequisites.** Evolution A preferred but not blocking — a tier-1 explainer over the current client-side results is shippable now, provided it discloses the single-variable limitation verbatim from §7 rather than describing the displayed correlation matrix as applied. **Acceptance:** every statistic in an answer traceable to a tool response; asking for cross-variable joint tail probabilities before Evolution A lands yields the honest "the current engine simulates one variable at a time" disclosure.
