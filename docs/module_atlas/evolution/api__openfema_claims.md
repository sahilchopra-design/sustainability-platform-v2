## 9 · Future Evolution

### 9.1 Evolution A — From live proxy to empirical flood-loss calibration layer (analytics ladder: rung 1 → 3)

**What.** A thin but genuinely-real-data module: two GET endpoints proxy the free/keyless
OpenFEMA NFIP Redacted Claims API (~2.72M records). `/claims-summary?state=XX` performs
server-side aggregation — claim counts, total/mean paid loss, severity percentiles
(P10–P99), a loss histogram, by-year series, and top flood events — with a 6h TTL cache
and a `sample_truncated` flag when a state (e.g. FL) exceeds the 20k-record fetch cap. The
atlas shows `/claims-summary` traces **failed** under the harness (likely the live fetch or
a required param), so the headline endpoint isn't reliably working end-to-end. Evolution A
hardens it into a calibration service the platform's flood models consume.

**How.** (1) Fix and harden `/claims-summary` (resilient paging, error handling, honest
`sample_truncated` reporting) so it returns `passed`. (2) Fit empirical loss-severity
distributions per state/flood-zone from the claims (GPD tail on the P90–P99 region) and
expose them as calibration inputs to `physical_risk_pricing` and the flood grid in the
digital twin — this is the module's stated purpose ("Empirical Flood Loss Calibrator") but
the fitting isn't built yet. (3) Add county/ZIP resolution (the API carries finer geography)
so calibration is sub-state. (4) Cache aggregates to a table so repeat calls don't re-fetch
2.72M rows.

**Prerequisites.** OpenFEMA API availability and paging headroom (the cache mitigates); a
persisted aggregate store. **Acceptance:** `/claims-summary` returns `passed` with honest
truncation flags; a fitted severity distribution per state is exposed and consumed by the
flood-pricing engine; percentiles reproduce a hand-computed reference.

### 9.2 Evolution B — Flood-loss evidence tool for pricing copilots (LLM tier 1 → 2)

**What.** This module's LLM value is as a *real-loss-evidence tool*: when the
physical-risk or insurance copilots answer "what have historical flood losses looked like
in Florida?", they call `/claims-summary` and cite actual NFIP percentiles and top events,
never invented loss figures — the strongest possible antidote to hallucinated cat-loss
numbers.

**How.** Tier 1 explains `/states` coverage. Tier 2 registers `/claims-summary` as a
read-only tool; the copilot narrates the returned percentiles, histogram, and top flood
events, always surfacing `sample_truncated` when the state exceeds the cap. This is a
grounding leaf-tool for the tier-3 desk's flood-risk chain and directly backstops the
`physical_risk_pricing` copilot's EAL explanations with observed loss history.

**Prerequisites.** Evolution A's `/claims-summary` fix is mandatory — a copilot narrating
flood losses from a failing endpoint would fabricate. **Acceptance:** every loss figure,
percentile, and flood-event name traces to a `/claims-summary` response; truncated samples
are always disclosed; the copilot refuses to state a forward flood-loss estimate (this
module reports history, not projections) and redirects to the pricing engine.
