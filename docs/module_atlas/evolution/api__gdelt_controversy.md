## 9 · Future Evolution

### 9.1 Evolution A — Calibrated controversy scoring with trend detection (analytics ladder: rung 1 → 4)

**What.** The route layer is read-only over three ingested tables (`dh_gdelt_events`,
`dh_gdelt_gkg`, `dh_controversy_scores`); the score itself is computed at ingest as
`neg_ratio×40 + tone_severity×35 + volume_factor×25` with platform-calibration-uncited
weights, and — the honest defect worth naming — the `trend` field is hardcoded
`"Stable"`. Evolution A calibrates the weights against outcomes and computes a real
trend from the time series the tables already hold.

**How.** (1) Replace the hardcoded `trend` with a slope over the entity's monthly
controversy-score history (the `/controversy/entity/{name}` endpoint already pulls
recent scores; the timeline endpoints prove the series exists) — direction + momentum,
honest null when <3 months of data. (2) Layer a predictive escalation flag: a simple
change-point / EWMA on mention-volume and tone that fires before the composite crosses a
severity band, using statsmodels already in the environment. (3) Calibrate the 40/35/25
weights and the 1000-mention saturation cap against a labelled set of known ESG
controversies rather than leaving them synthetic, and document the fit as a §8 model
card.

**Prerequisites.** Sufficient historical GDELT depth per entity (ingest cadence must
retain months, not just latest); a labelled controversy set for weight calibration.
**Acceptance:** `trend` reflects the actual score slope and varies across entities; an
escalation flag fires on a backtested known controversy before the severity-band cross;
weight provenance moves from "uncited" to a documented calibration.

### 9.2 Evolution B — Controversy monitoring analyst with grounded entity dossiers (LLM tier 2)

**What.** A copilot that answers "what's driving Acme's High controversy rating?" by
calling `/controversy/entity/{name}` and narrating the real component decomposition
(neg-ratio, tone, volume) plus the top-5 GKG themes and the 10 most-recent events the
endpoint returns — then supports comparative and ranking queries via
`/controversy/rankings` and `/events/search`.

**How.** Eleven read-only GET endpoints make a clean tier-2 tool surface: entity detail,
rankings (SQL `RANK() OVER controversy_score`), event/GKG search, timelines, and stats.
The E/S/G pillar proration (`env_score = env_flags/total_flags × composite`) gives the
copilot a defensible way to answer "is this an environmental or governance issue?".
The no-fabrication validator is essential here — controversy narratives are exactly
where an ungrounded LLM would invent incidents; every event cited must map to a returned
`dh_gdelt_events` row with its GDELT source URL.

**Prerequisites.** Evolution A's real `trend` first — a copilot narrating "trend:
Stable" for every entity (the current hardcoded value) would mislead on the single
question analysts care about most. **Acceptance:** every incident, theme, and score
component in a dossier traces to a tool response row; asking for events outside the
ingested window returns a coverage disclaimer, not fabricated recent news; "trend"
statements match the computed slope.
