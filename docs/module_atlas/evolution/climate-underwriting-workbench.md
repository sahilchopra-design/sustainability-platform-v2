## 9 · Future Evolution

### 9.1 Evolution A — Book-level underwriting with calibrated decision thresholds (analytics ladder: rung 2 → 3)

**What.** The workbench is one of the platform's cleanest compositions — three live
engines (`insurance_climate_risk`, `physical_risk_pricing_engine` via the pricing
routes, `pcaf_unified_engine`) with per-section Live/Demo badges and a §8 status of
"implemented" — but it underwrites **one counterparty at a time**, and the
ACCEPT/REFER/DECLINE verdict is a client-side `useMemo` heuristic. Evolution A scales
to the book: batch the three engine calls across a submission portfolio, aggregate CAT
accumulation by peril/geography, and calibrate the decision thresholds against loss
experience instead of hand-set cutoffs.

**How.** (1) New `POST /api/v1/insurance/underwrite-book` orchestrating the existing
`insurance/calculate`, `physical-risk-pricing/price`, and `pcaf-module/calculate/*`
per position, persisting to the existing `insurance_climate_assessments` /
`insurance_climate_entities` tables so runs are retrievable. (2) Accumulation control:
sum net 1-in-100 by peril-region cell and flag against reinsurance limits — the engine
already computes `ri_gap` per risk; the book view is a reduction over it.
(3) Calibration: benchmark the CAT multipliers (Swiss Re sigma / EIOPA CCRST sourced)
against the platform's ingested OpenFEMA/IBTrACS loss history where perils overlap, and
move the premium-adequacy threshold from heuristic to a documented percentile of the
calibration set; pin the §7.5 Mekong Delta worked example (174.58% solvency post-addon,
60.0% protection gap) in `bench_quant.py`.

**Prerequisites.** Blast radius 90 — `insurance_climate_risk` is shared by 5 modules,
so multiplier recalibration needs the shared-engine change protocol; server-side
persistence of the decision summary moves the ACCEPT/REFER logic out of `useMemo`.
**Acceptance:** book run of N positions equals N single runs (no aggregation drift);
worked example reproduces; threshold provenance documented in the response.

### 9.2 Evolution B — Underwriting desk orchestrator across the three engines (LLM tier 3)

**What.** The workbench already *is* a manual desk orchestration — an underwriter
composing Solvency II capital, physical pricing, and PCAF financed emissions. Evolution
B automates the composition: "work up Mekong Delta Logistics, flood, 2C/2050" triggers
the full chain — `POST /insurance/calculate`, `/physical-risk-pricing/price`,
`/pcaf-module/calculate/business_loans`, plus `GET /open-meteo/historical-extremes`
for location context — and drafts the underwriting file: exposure summary, capital
impact, premium adequacy, emissions footprint, and the referral rationale, every figure
tool-traced.

**How.** This is the platform's lowest-risk tier-3 pilot because the routing is fixed
(the page's own compose order, documented in §7.1) rather than open-ended; tool schemas
come from the 24 mapped OpenAPI operations. The decision heuristic stays code, not
LLM — the orchestrator narrates and evidences the verdict, never overrides it. Referral
memos render through the report-studio layer; the per-section Live/Demo badge state
passes into the prompt so the draft discloses any demo-sourced numbers.

**Prerequisites.** Evolution A's persistence (memos must reference a stored
`assessment_id`); RBAC pass-through so the orchestrator inherits the underwriter's
session per the roadmap's Tier-2 contract. **Acceptance:** a generated file for the
DEFAULT_INPUTS case matches the §7.5 traced values exactly; the orchestrator refuses to
issue an ACCEPT/DECLINE that differs from the computed heuristic and instead flags the
disagreement for human review.
