## 9 · Future Evolution

### 9.1 Evolution A — Burn-in windows, irregular-interval handling, and calibrated thresholds (analytics ladder: rung 2 → 3)

**What.** A statistically sound CUSUM-based greenwashing detector: it credibility-weights marketing vs
operational scores (`W = raw × QualityWeight × Freshness`), then applies EMA smoothing, central-
difference velocity, acceleration, z-scores and a parallel CUSUM change-point statistic, firing only on
a **compound trigger** (gap large AND widening AND abnormally fast) — a genuinely rigorous design, no
PRNG, already rung 2 (scenario-aware statistical detection). §7.5 names the deepening targets: the
z-score mean/σ are computed over the **whole series including any contaminated recent segment** (no
burn-in window), biasing detection conservative; timestamps are accepted but **spacing is assumed
regular** (no irregular-interval handling); and the DQS→weight slope, 36-month half-life and EMA
α=0.08 are DME-authored calibrations. Evolution A adds a clean burn-in baseline window, irregular-
interval resampling, and threshold calibration.

**How.** `detect` computes the divergence baseline mean/σ over a burn-in prefix (excluding the segment
under test) so a widening gap isn't diluted into its own baseline; timestamps drive resampling to a
regular grid before velocity/CUSUM; the CUSUM constants (k=0.5σ, h=5σ — already textbook SPC) stay,
while the credibility slope and half-life are calibrated against labelled greenwashing cases. Rung 3:
validate the compound-trigger against known greenwashing enforcement actions (EU ESAs / SEC).

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /detect` and `/quick-scan`
**skipped** (need input payloads to trace); the ≥20-observation gate means short quarterly histories
never trigger detect (quick-scan is the documented fallback — preserve that). **Acceptance:** the §7.4
quick-scan worked example (0.29% gap → LOW, and the 87.6% HIGH counterfactual) reproduces; a widening
gap in the recent segment is detected without being diluted into its own baseline; irregularly-spaced
observations are handled; the endpoints pass the harness.

### 9.2 Evolution B — Greenwashing-surveillance copilot with tool-called detection (LLM tier 2)

**What.** A copilot for stewardship/surveillance teams: "is this entity greenwashing — does its
marketing outpace its operational evidence?" (`/detect` → compound trigger verdict, CUSUM alert,
credibility-weighted divergence), and "quick credibility-gap check" (`/quick-scan` → gap %, risk band)
— narrating the real statistical output and, crucially, *why* a glossy claim didn't register (the
§7.4 insight: low-quality/stale marketing evidence is deflated before comparison). The claims-vs-
evidence framing operationalises the EU ESAs' greenwashing definition.

**How.** Tool schemas over the 2 POST + 2 GET operations; the `ref/methodology` and `ref/config-
defaults` endpoints ground "what does WARNING vs CRITICAL mean?" questions. The no-fabrication
validator checks every z-score, gap % and verdict against tool output; the copilot must report
`INSUFFICIENT_DATA` honestly when <20 observations (never fabricating a verdict) and explain the
credibility-weighting so users understand a raw marketing–operational gap can vanish after quality
adjustment. Feeds the DME dynamic-materiality layer as a signal.

**Prerequisites.** Evolution A's harness fixes and burn-in improvement (so narrated verdicts are
reliable); Atlas corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine
tool call; a <20-observation history returns the engine's `INSUFFICIENT_DATA`, not a verdict; the
copilot explains the credibility-weighting when a raw gap and weighted gap diverge.
