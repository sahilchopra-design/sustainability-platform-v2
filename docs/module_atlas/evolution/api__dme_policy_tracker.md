## 9 · Future Evolution

### 9.1 Evolution A — Normalise component scales and auto-feed from policy data sources (analytics ladder: rung 1 → 3)

**What.** A policy-velocity index blending four component signals (carbon-price d(P)/dt × emissions,
stage-weighted regulatory pipeline, enforcement frequency + penalty magnitude, disclosure-mandate
diffusion) with ISIC-keyed sector weights — no PRNG, honest "no signal = 0" for missing components.
§7.5 names the core limitation: the four component velocities are **not normalised to a common scale**
before weighting (fractional price change ≈0.07 vs weighted bill count ≈1.9 vs log-penalty blend ≈1.6),
so the composite is an *uncalibrated index* meaningful only for like-for-like comparison, and the §7.4
example shows the pipeline term dominating a carbon-tilted sector purely from scale mismatch. Also:
carbon-price velocity ignores timestamp spacing, and the 5-ISIC weight matrix is DME-authored judgement.
Evolution A normalises each component to a common z-scale before the sector blend and auto-feeds the
inputs from real policy trackers.

**How.** Each component velocity is standardised (against its own historical distribution) before the
weighted sum, so the composite reflects sector weights rather than accidental unit magnitudes; carbon-
price velocity uses real timestamp spacing; the input blocks are auto-populated from the platform's
Climate Policy Radar / regulatory-calendar and litigation trackers instead of caller-supplied counts.
Rung 3: calibrate the sector weights and bill-stage/enforcement sub-weights against observed regulatory
transmission, and expand the ISIC matrix beyond 5 codes.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /composite-velocity` and
`/from-events` **skipped** (need input payloads to trace); the heterogeneous-scale issue must be
resolved for the composite to be interpretable. **Acceptance:** the §7.4 electric-power worked example
(composite 0.7577) reproduces under legacy scaling, then the normalised composite reflects the sector
weights (carbon term no longer swamped); carbon velocity respects timestamp spacing; the endpoints pass
the harness.

### 9.2 Evolution B — Policy-velocity feed for the dynamic-materiality copilots (LLM tier 2)

**What.** This engine's output is the regulatory-velocity z-score input to the DME dynamic-materiality
layer (`api::dme_dmi`). Its LLM role is a **feed/explainer tool**: a DME copilot answering "how fast is
policy changing for this electric utility?" tool-calls `/composite-velocity` and narrates the component
decomposition (carbon 0.45, pipeline 0.25, enforcement 0.10, disclosure 0.20 for ISIC 3510), or
`/from-events` to compute velocity from discrete policy events (including negative velocity for
deregulation via `direction = −1`). The decomposition directly answers "what's driving the regulatory
pressure?"

**How.** Tool schemas over the 2 POST + 2 GET operations; the `ref/sector-weights` and `ref/components`
endpoints ground "why is power weighted 0.45 on carbon?" questions. The no-fabrication validator checks
every component and composite velocity against tool output; because the composite is an uncalibrated
index (§7.5), the copilot must present it as a comparative index, not a probability or dollar quantity,
until Evolution A normalises it. The tier-3 DME orchestrator wires this composite as the
`velocity_adjustments` input to `dme_dmi`, making the cross-engine flow auditable.

**Prerequisites.** Evolution A's harness fixes and scale normalisation (an uncalibrated index is hard
to narrate honestly); Atlas corpus embedded (roadmap D3). **Acceptance:** every velocity cited traces
to an engine tool call; the component decomposition matches `/composite-velocity`; the composite is
labelled a comparative index (pre-Evolution A) and, once fed to `dme_dmi`, is cited as this engine's
output, not an invented z-score.
