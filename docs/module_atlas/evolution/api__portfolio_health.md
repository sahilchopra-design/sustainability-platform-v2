## 9 · Future Evolution

### 9.1 Evolution A — Predictive health trajectory and calibrated alert thresholds (analytics ladder: rung 2 → 4)

**What.** A three-score sustainability pulse (Climate Health = `100 − avg_glidepath_deviation/
0.50×100`; Financial Resilience = `0.6·ecl_score + 0.4·dscr_score`; Transition Readiness =
`40·sbti_pct + 40·plan_pct + 20·dqs_pct`) plus a threshold-driven alert engine, modelled on a
WHOOP-style readiness score. Scores read live DB tables (`pcaf_time_series`, `ecl_exposures`,
`portfolios_pg`) and degrade to a neutral AMBER 50 when data is missing. The alert thresholds
(PCAF coverage, large-exposure %, stranding horizon) are static constants, and §4.2 shows
`platform_alerts` and `pcaf_time_series` history traces **db-empty**. Evolution A adds forecasting
and calibration.

**How.** (1) Add a health-trajectory forecast: from the `pcaf_time_series` history the module
already reads, project each score forward and flag portfolios trending toward a RAG downgrade
before they cross it (rung 4 predictive) — a "readiness trend", not just today's snapshot. (2)
Calibrate the alert thresholds (large-exposure %, coverage warning/critical) against portfolio
outcomes rather than fixed constants. (3) Populate `platform_alerts` and the time-series history
so `/history` and `/alerts` return real data. (4) Bench-pin the three score formulas and the
graceful-degradation neutral values.

**Prerequisites.** `pcaf_time_series` history and `platform_alerts` populated (D1); an outcome
set for threshold calibration. **Acceptance:** `/scores` includes a forward trajectory and a
pre-emptive downgrade flag; `/history` and `/alerts` return real-db data; alert thresholds carry
calibration provenance; bench pins reproduce the three scores.

### 9.2 Evolution B — Portfolio-readiness copilot with proactive alerts (LLM tier 2)

**What.** A copilot that reads a portfolio's three scores and explains them WHOOP-style — "your
Climate Health dropped to AMBER 58 because your utilities sleeve is 30% above the NZBA glidepath;
Financial Resilience is RED, driven by ECL Stage-2 migration; here's what to do" — each figure
tool-sourced, plus alert triage.

**How.** Read endpoints (`/scores`, `/alerts`, `/history`, `/unread-count`) form the tool set;
the score decomposition lets the copilot attribute a poor overall to the specific driver
(glidepath deviation vs ECL stage vs DQS). Alert read/mark actions (`PATCH .../read`,
`/read-all`) and `/refresh` are the gated write actions. The "what to do" action link each score
already carries becomes the copilot's remediation hook. This is a natural home-page/orchestrator
entry point routing to the underlying glidepath, ECL, and PCAF copilots.

**Prerequisites.** Evolution A's populated history/alerts for meaningful trend and alert answers.
**Acceptance:** every score, RAG, and alert traces to a tool response; the copilot names the
driver table behind each score; it discloses when a score is the neutral AMBER-50 fallback due to
missing data rather than a real reading; mark-read actions log to audit.
