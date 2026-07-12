## 9 · Future Evolution

### 9.1 Evolution A — One ELRS, computed by the engine, rendered by the page (analytics ladder: rung 1 → 2)

**What.** §7 finds three competing scoring stories: the guide's ELRS
(`w₁·Disclosure + w₂·EmissionsTrajectory + w₃·GreenwashSignal + w₄·Jurisdiction`,
"calibrated to historical outcomes"), the page's different fixed-weight composite
(disclosure/physical/transition/precedent/reputational over `sr()`-seeded inputs),
and the backend engine's genuine methodology (attribution science, 8 SEC-style
disclosure triggers, jurisdiction risk scoring) that the page never calls for its
scores. Evolution A collapses the three into one: the engine's
`compute_litigation_exposure` aggregation (25/30/20/15/10 weighted contributions per
its extracted lines) becomes the single ELRS; the page's parallel composite is
deleted; the guide is rewritten to describe the engine's actual four inputs —
greenwashing flags, disclosure triggers, fiduciary breaches, attribution share plus
jurisdiction — which are close cousins of its advertised dimensions.

**How.** (1) Page rewired to POST entity profiles to
`/api/v1/climate-litigation/litigation-exposure` and render the returned
contribution decomposition; seeded entity universe replaced by user-entered or
fixture profiles with explicit fields (emissions, claims, jurisdictions, targets).
(2) "Calibrated to historical outcomes" made honest: either back-test the weights
against Sabin-recorded outcomes for scoreable entities (the legal-intelligence
sibling's Evolution A supplies the case table) and report fit, or delete the
calibration claim. (3) P0-flag threshold documented and tested.

**Prerequisites (hard).** PRNG entity purge; coordination with the climate-litigation
module (same engine — one wiring pattern, applied twice). **Acceptance:** the page's
ELRS equals the engine's aggregation for identical inputs; the weight vector appears
in exactly one place (engine); the calibration claim is either evidenced or gone.

### 9.2 Evolution B — Entity-screening analyst (LLM tier 2)

**What.** A screening assistant for portfolio-wide use: "score our 30 energy holdings
for litigation exposure and flag P0s" — batch tool calls to the engine per entity,
with the assistant assembling a ranked table where each score expands into its
contribution decomposition (which red flags, which disclosure triggers, what
attribution share). The interview mode fills missing entity fields by asking the user
targeted questions keyed to the engine's input schema rather than accepting vague
descriptions.

**How.** Tool schemas over the six litigation POSTs; the validator on every score and
contribution; ranked outputs carry per-entity input provenance so a challenged score
can be re-derived; the legal-advice disclaimer and refusal on named-case outcome
prediction apply as in the sibling module.

**Prerequisites (hard).** Evolution A first — screening against the page's current
seeded composite would rank noise; RBAC scoping for portfolio entity data.
**Acceptance:** a batch screen reproduces entity-by-entity via direct POSTs; a P0
flag always decomposes into cited rule contributions; entities with insufficient
inputs return "insufficient data", never a guessed score.
