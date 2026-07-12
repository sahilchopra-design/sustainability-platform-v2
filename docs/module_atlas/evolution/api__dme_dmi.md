## 9 · Future Evolution

### 9.1 Evolution A — Asset-class-aware PCAF, computed HHIs, and bounded velocity (analytics ladder: rung 1 → 3)

**What.** The Dynamic Materiality Index engine — a stateless, velocity-aware ESG calculator: PCAF
attribution, confidence-weighted factor aggregation `S = Σ(w·c·x)/Σ(w·c)`, and a multiplicative
concentration penalty over single-name/sector/geo HHIs. No PRNG, pure function of inputs. §7.5 names
the deepening targets: PCAF attribution uses **EVIC uniformly** (correct for listed equity/bonds but
PCAF prescribes total-equity+debt for private companies and property value for mortgages); the
velocity overlay is **linear and unbounded** (`S × (1 + z̄ × 0.3)` can push DMI above 100); and the
concentration penalty treats **HHIs as exogenous inputs** rather than computing them from holdings.
Evolution A adds asset-class-aware PCAF denominators, computes HHIs from the holdings themselves, and
bounds the velocity adjustment.

**How.** `pcaf_attribution` branches on asset class for the denominator (EVIC / equity+debt / property
value per PCAF); `portfolio_dmi` computes sector/geo HHIs from the holdings' own concentration instead
of accepting them as inputs; the velocity overlay uses a bounded transform (e.g. tanh) so adjusted DMI
stays in range. Rung 3: calibrate the DQS→confidence map, λ=0.2/yr decay and α-penalty slopes (all
DME-authored) against observed materiality-signal reliability, and pin the §7.4 worked example (base
DMI 72.85, final 57.39) in bench_quant.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /entity`, `/pcaf-attribution`,
`/portfolio` all **skipped** (they need input payloads to trace); the DME-authored calibrations must
stay documented as such. **Acceptance:** the §7.4 two-holding worked example reproduces; a private-
company holding uses the equity+debt denominator; HHIs are computed from holdings, not supplied; a
large positive velocity z-score no longer pushes DMI above 100.

### 9.2 Evolution B — Dynamic-materiality analyst orchestrating the DME engines (LLM tier 2 → 3)

**What.** The DMI engine is the aggregation hub of the DME cluster (it consumes velocity z-scores from
`dme_policy_tracker`, factor definitions from `dme_factor_registry`, and PCAF confidence). A tier-2
analyst answers "what's this entity's dynamic materiality score and what's driving it?" (`/entity`
with factor scores + velocity), "compute our portfolio DMI with concentration penalties" (`/portfolio`),
and "what's our financed-emissions attribution?" (`/pcaf-attribution`) — narrating the confidence-
weighted decomposition (which shows how high-quality holdings pull the score). At tier 3 it orchestrates
the DME cluster: pull policy velocities from the tracker, factor metadata from the registry, and
greenwashing signals to assemble a full dynamic-materiality profile.

**How.** Tool schemas over the endpoints plus the `ref/pcaf-confidence` grounding; the no-fabrication
validator checks every score, attribution factor and penalty against tool output. Because the engine
doesn't derive velocities itself (§7.5 — callers own the z-scores), the tier-3 orchestrator wires
`dme_policy_tracker`'s composite velocity as the `velocity_adjustments` input, making the cross-engine
data flow explicit and auditable.

**Prerequisites.** Evolution A's harness fixes; the sibling DME engines' tool exposure; Atlas corpus
embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool call; the DMI
decomposition shows the confidence-weighting effect; a tier-3 profile cites which engine produced the
velocity z-score feeding the adjustment, not an invented value.
