## 9 · Future Evolution

### 9.1 Evolution A — Compute the PRI from measured telemetry; probe connectivity for real (analytics ladder: rung 1 → 2)

**What.** §7's finding: the registry content is real (10 detailed provider records
with correct endpoints and auth types, a genuine engine-lineage map, a working
Levenshtein field-mapping canvas), but all dynamic telemetry — status codes,
latency, error logs, sync sparklines, rate-limit headers — is `sr()`-seeded, no
live API calls are made, and the guide's
`PRI = (1−ErrorRate) × Availability × Freshness` is absent. Evolution A measures
what the page currently fakes.

**How.** (1) Telemetry: per-provider error rates and latency from the platform's
real ingestion runs (data-hub sync logs) and the audit tables — the same D4
materialized views `data-infra-hub`'s evolution builds; one telemetry layer, many
consumers. (2) Connectivity: a scheduled lightweight health probe per registered
source (status endpoint or cheapest GET), recording uptime and real rate-limit
headers — replacing seeded 500s. (3) PRI computed daily per the guide's formula,
with freshness = observed refresh lag vs stated cadence; PRI feeds default
priority ranks into `data-reconciliation`'s election, closing the loop the two
modules' guides both describe. (4) Mapping canvas upgrade: add a curated synonym
layer over the edit-distance heuristic (§7.5 notes `Highlights.Revenue` vs
`revenue_usd_mn` scores low) — a small ontology table, not ML.

**Prerequisites.** Probe scheduling with credential handling (secrets stay
server-side); the shared telemetry views; seed purge. **Acceptance:** killing a
provider's key flips its live status within one probe cycle; PRI reproduces from
logged error/uptime/freshness numbers; reconciliation's default ranks update when
PRI shifts.

### 9.2 Evolution B — Onboarding copilot for new data sources (LLM tier 2)

**What.** Adding a provider is the module's core workflow and its most manual:
endpoint discovery, auth configuration, field mapping. Evolution B accelerates the
last mile: given a sample API response, the copilot proposes canonical-schema
mappings with rationale — the semantic matching the Levenshtein canvas can't do
("`Highlights.MarketCapitalization` → `market_cap_inr_cr`, unit conversion
needed: USD → INR crore") — plus unit/currency conversion flags and a draft
pipeline-template selection from the 16 existing templates. Proposals land in the
mapping canvas for confirmation, never auto-applied.

**How.** Tier-2 with gated writes into the mapping config: prompts ground on the
canonical schema's field definitions and the existing mappings as few-shot
exemplars; deterministic validation (type compatibility, unit-dimension checks)
runs on every proposal. Confirmed mappings accumulate as the synonym layer
Evolution A wants — the flywheel again.

**Prerequisites.** Evolution A's canonical schema service; sample-response
capture in the tester. **Acceptance:** on a held-out provider schema, ≥80% of
proposed mappings confirmed unchanged; every proposal names its unit conversion
or states none; nothing maps without human confirmation.
