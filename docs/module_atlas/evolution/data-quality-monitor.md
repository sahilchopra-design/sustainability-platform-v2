## 9 · Future Evolution

### 9.1 Evolution A — Sense the three placeholder dimensions (analytics ladder: rung 2 → 3)

**What.** §7 rates this "a real DQ engine, not a mock": completeness and
accuracy/validity are computed from real company records via genuine field-presence
checks and a real 9-rule engine, with PCAF tiering per company. The honest gaps:
timeliness is a fixed 85, uniqueness a fixed 98, consistency is
`80 + (India ? 10 : sr·10)` — "no cross-source consistency check actually compares
providers" — the trend series is a seeded ramp, and the code's 6-dimension weights
(0.25/0.20/0.20/0.15/0.10/0.10) silently deviate from the guide's four-bucket
0.30/0.30/0.25/0.15. Evolution A measures the placeholders.

**How.** (1) Timeliness: per-record data vintage (BRSR filing year, enrichment
fetch timestamp) against the reporting period — the capture layer stores
timestamps; score by documented age bands. (2) Uniqueness: actual duplicate
detection over the company master via the GLEIF/ISIN spine (the platform's entity
resolution exists) — measured duplicate rate replaces 98. (3) Consistency: compare
the same metric across the sources `company-profiles` actually holds (BRSR-reported
vs enrichment-fetched) with a documented divergence threshold — deleting the seeded
India bonus. (4) Weight reconciliation: publish one canonical weight set and update
guide or code to match. (5) Trend from stored monthly DQ snapshots instead of the
seeded ramp — giving stewards the degradation-over-time view the module's alerting
promise needs.

**Prerequisites.** Source timestamps propagated through the capture layer;
snapshot scheduling; coordination with `data-quality-dashboard`'s shared violations
store. **Acceptance:** a stale record moves its company's timeliness; a constructed
duplicate is caught by the uniqueness measure; consistency changes when a
provider's value diverges; zero static/seeded dimension values remain.

### 9.2 Evolution B — Remediation-dispatch assistant for data owners (LLM tier 1 → 2)

**What.** The module's workflow ends at "dispatch remediation tasks to data
owners" — currently manual reading of the worst-20 table. Evolution B drafts the
dispatch: for each flagged company/field, a remediation ticket naming the failing
rule (from the real rule engine's output), the current value and why it violates,
the recommended source from the module's own gap-plan mapping (NSE/BSE → BRSR
Supabase; scope gaps → EODHD + manual), and the PCAF-tier improvement the fix would
deliver — batched per data owner, prioritized by composite-score impact.

**How.** Tier 1 over the computed DQ payloads (all real for
completeness/accuracy/validity today); tier 2 when tickets persist server-side,
with dispatch as a gated write into the steward workflow shared with
`data-governance`. The prioritization is deterministic arithmetic (weight × gap)
the assistant explains rather than invents; every ticket's claims reproduce from
`computeCompanyDQ` output.

**Prerequisites.** Evolution A for tickets touching the placeholder dimensions
(a timeliness ticket against a fixed 85 would be fiction); ticket persistence for
tier 2. **Acceptance:** every ticket cites a real rule violation or measured gap;
priority ordering matches the documented weight×gap arithmetic; fixing the cited
field visibly moves the company's composite on the next computation.
