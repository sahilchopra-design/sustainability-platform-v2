## 9 · Future Evolution

### 9.1 Evolution A — Rolling-window z-scores and short-series robustness (analytics ladder: rung 1 → 3)

**What.** The DME Velocity Engine — an EWMA-based rate-of-change monitor: a 6-stage pipeline
(velocity, EWMA, percentage velocity, z-score, acceleration, regime classification) with a compound
alert (`V > k·σ AND A > 0` per the internal FRS §3.1 spec). Pure calculator, no seed data. §7.6 names
the deepening targets: the z-score uses the **whole submitted series** as the normalisation window —
`lookback_days=252` is declared in config but **never consumed** in `process_series`, so there's no
time-varying rolling z; and the **<20-observation fallback silently reports NORMAL/0σ**, which can
mask genuine spikes in short series. Evolution A implements the declared rolling window and makes
short-series handling explicit rather than silently null.

**How.** `process_series` computes z against a rolling `lookback_days` window (time-varying z, as a
production monitor requires) instead of the whole series; the <20-observation case returns an explicit
`INSUFFICIENT_HISTORY` status with a confidence flag rather than a silent NORMAL, so consumers (the
`dme_dmi` velocity adjustment) know the z is unreliable. Rung 3: the compound-alert thresholds
(1.5/2/3/4σ — internal FRS design choices) get calibrated against labelled materiality-shift events.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /process-series`,
`/process-single`, `/classify-alert` all **skipped** (need input payloads to trace); wire the
declared `lookback_days`. **Acceptance:** the §7.4 process-single worked example (velocity +6.0,
z 2.50, CRITICAL) reproduces; a rolling window produces time-varying z (a late spike after a calm
period registers, where whole-series normalisation dilutes it); a <20-point series returns an explicit
insufficient-history status, not a silent NORMAL.

### 9.2 Evolution B — Velocity-monitoring feed for the DME dynamic-materiality layer (LLM tier 2)

**What.** This engine produces the raw velocity/regime signals the DME dynamic-materiality layer
consumes. Its LLM role is a **monitoring/explainer tool**: a DME copilot answering "is this entity's
ESG-signal materiality accelerating?" tool-calls `/process-series` (regime distribution, latest z,
sigma label) or `/classify-alert` (the compound-condition tier), and narrates *why* an alert did or
didn't fire (the §7.4 insight: a CRITICAL regime with negative acceleration produces no alert, because
the metric is decelerating after a jump).

**How.** Tool schemas over the 3 POST + 2 GET operations; the `ref/regimes` and `ref/config-defaults`
endpoints ground "what's the difference between the regime ladder and the alert ladder?" questions.
The no-fabrication validator checks every velocity, z-score and regime against tool output; the copilot
must respect the insufficient-history status (post-Evolution A) rather than presenting a 0σ NORMAL as
a genuine calm reading. Feeds `dme_dmi` as the velocity z-score source, making the cross-engine flow
auditable.

**Prerequisites.** Evolution A's harness fixes and rolling-window/short-series robustness; Atlas
corpus embedded (roadmap D3). **Acceptance:** every velocity/regime cited traces to an engine tool
call; the compound-alert explanation matches `/classify-alert` (including the acceleration gate); a
short-series reading is flagged low-confidence, not presented as a confident NORMAL.
