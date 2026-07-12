## 9 · Future Evolution

### 9.1 Evolution A — Real PCAF insurance attribution, fix BEV zeroing, and calibrated factors (analytics ladder: rung 2 → 3)

**What.** A PCAF Part C (facilitated) + Part B (insurance-associated) emissions engine — deal-type
attribution factors (the ÷3 33% weighting matching PCAF 2023), LoB-routed insurance emissions, DB
persistence, PCAF DQS. Real-db, harness-passing, no PRNG. §7.6 names the deepening targets and defects:
every factor table (sector intensities, vehicle, EPC, LoB) is an **uncited platform calibration**, not
an official PCAF Annex; **BEV fleets compute zero emissions** because the gCO₂/km table entry is 0
despite the scope-2 comment (a real defect — BEVs have scope-2 grid emissions); the life/health proxy
**produces a number contradicting PCAF's disclosure-only stance** (flagged via warning); and the
insurance attribution uses activity/premium **proxies** of the real PCAF formula (customer emissions ×
premium/customer-revenue). Evolution A implements the real PCAF insurance attribution, fixes the BEV
scope-2 zeroing (grid-EF based), and calibrates the factor tables.

**How.** `_calc_commercial` uses `customer_emissions × (premium / customer_revenue)` per the PCAF
Insurance-Associated Emissions Standard where customer data exists (falling back to the premium proxy
with a DQS penalty); motor BEV emissions compute scope 2 from the grid EF (from the ENTSO-E/EIA
ingesters) × km × kWh/km rather than the 0 gCO₂/km entry; life/health returns disclosure-only (no
fabricated number) unless the caller opts in. Rung 3: the sector-intensity, vehicle, EPC and LoB factor
tables are calibrated against published PCAF/CDP/MSCI values with citations.

**Prerequisites.** The engine is harness-passing; the work is fidelity and defect-fixing, not endpoint
repair. Fix the overloaded `attribution_factor` field semantics (§7.5 — it means different things per
LoB; consumers must read `attribution_method`) by reporting a typed factor. **Acceptance:** the §7.4
bond-underwriting worked example (AF 0.083333, 125,000 tCO₂e facilitated) reproduces; a BEV fleet policy
computes non-zero scope-2 emissions from the grid EF; commercial insurance uses the real PCAF
premium/revenue attribution where customer data exists; life/health returns disclosure-only by default.

### 9.2 Evolution B — Facilitated/insurance-emissions analyst with tool-called calculation (LLM tier 2)

**What.** A tool-calling analyst for capital-markets and insurance sustainability teams: "compute
facilitated emissions for this bond underwriting" (`/deals` → AF by deal type, per-scope facilitated
tCO₂e, DQS, methodology note), "run our deal book" (`/deals/batch` → summary by deal type/sector),
"compute insurance-associated emissions for this motor policy" (`/insurance` → LoB-routed emissions),
and "summarise our insurance portfolio" (`/insurance/summary`) — narrating real PCAF outputs and the
audit trail (warnings + method strings the engine already emits).

**How.** Tool schemas over the create/list/summary/reference endpoints; write actions (create deal/
policy) render a confirmation before persisting (audit-logged). The reference endpoints (deal types,
insurance LoBs, sector/vehicle/building/LoB factors) are exceptional RAG grounding for "what's the ÷3
factor for bond underwriting?" or "what's the EPC-C building factor?" questions. The no-fabrication
validator checks every tCO₂e, AF and DQS against tool output; the copilot surfaces the methodology note
per deal (the AF formula) and flags the uncited factor calibrations. Feeds `pcaf_unified` (shared
engine) and composes into a financed-emissions desk alongside `emissions_data` and `dme_dmi`.

**Prerequisites.** Evolution A's BEV/insurance-attribution fixes (so narrated emissions are correct);
Atlas + reference corpus embedded (roadmap D3); RBAC so writes run under the user's session.
**Acceptance:** every figure cited traces to an engine tool call; the facilitated emissions match
`/deals`; a BEV fleet no longer reports zero; the copilot surfaces the per-deal methodology note and
flags factor calibrations as platform values pending Evolution A.
