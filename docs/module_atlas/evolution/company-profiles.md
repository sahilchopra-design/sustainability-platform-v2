## 9 · Future Evolution

### 9.1 Evolution A — Compute the composite, fix the broken profile fetch, widen the universe (analytics ladder: rung 1 → 3)

**What.** This hub's data is unusually real — 80 Indian companies from SEBI BRSR Core
P6, NSE/BSE, CDP, MSCI, Sustainalytics, SBTi, no PRNG anywhere (§7.6) — but §7 flags
that the advertised composite (`ESG_profile = 0.40×E + 0.35×S + 0.25×G` with −1/−5/−15
controversy penalties) is never computed: vendor grades are displayed side-by-side,
never blended. And the harness shows `GET /company-profiles/{profile_id}` status
`failed` — the single-profile fetch, the module's core read path, is broken. With a
blast radius of 53 modules, this hub deserves the investment.

**How.** (1) Fix the failed `GET /{profile_id}` first (likely the same class of live
500 found in the deployment-prep sweep — NULL fields or wrong column). (2) Composite
engine: compute E/S/G sub-scores from the *underlying* real fields (carbon intensity,
board metrics, BRSR indicators) rather than blending vendor letter grades — with the
0.40/0.35/0.25 weights and controversy penalty applied per the guide, and the method
documented per Atlas §8 so the platform score is never confused with MSCI's.
(3) Benchmarked (rung 3): percentile the composite within GICS peers using the
existing `peer_benchmark_engine` pattern; cross-validate rank ordering against the
displayed vendor ratings and report the correlation honestly. (4) Universe widening:
seed non-Indian issuers through `POST /seed-from-engine` and the GLEIF entity spine
(`entity_lei` now populated), so the 53 dependent modules get global coverage.

**Prerequisites (hard).** The `{profile_id}` fix; agreement that the platform
composite is clearly labelled as such alongside vendor scores. **Acceptance:**
`GET /{profile_id}` passes the lineage sweep; the composite reproduces by hand for one
issuer; a controversy status change moves the composite by exactly its documented
penalty.

### 9.2 Evolution B — Issuer-intelligence copilot with extraction pipeline (LLM tier 2)

**What.** The route already exposes `POST /extract-from-reports` — an LLM-shaped
endpoint waiting for an LLM. Evolution B makes this hub the platform's issuer Q&A
surface: "summarize Company X's ESG posture and open engagement items" reads the
profile via `GET /{profile_id}`, cites the vendor ratings verbatim with their
`SourceBadge` provenance, and pulls engagement-log history; "ingest this annual
report" drives the extraction pipeline, mapping report claims to profile fields with
page-level citations and writing via `PUT /{profile_id}` only after user confirmation
(mutation gating per the roadmap's tier-2 contract).

**How.** Tool schemas from the 5 existing operations — this module needs almost no new
backend for tier 2, which is why it should be an early pilot. Grounding: §7.2's field
provenance table so the copilot always attributes ratings to their vendor and never
presents an MSCI grade as a platform judgment; the enrichment service's
`EnrichPill` completeness state tells the copilot what it doesn't know. The
no-fabrication validator checks numerics against the profile payload.

**Prerequisites (hard).** Evolution A's `{profile_id}` fix (the copilot's primary tool
currently 500s); RBAC pass-through for the `PUT` path. **Acceptance:** an issuer
summary where every rating carries its source attribution; extraction proposals show
report page references and require explicit confirmation before write; questions about
issuers not in the universe return "no profile" rather than a generic sketch.
