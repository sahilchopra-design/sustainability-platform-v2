## 9 · Future Evolution

### 9.1 Evolution A — Marginal-PD term structure, EIR discounting, and NGFS-conditioned scenarios (analytics ladder: rung 2 → 4)

**What.** A climate-adjusted IFRS 9 ECL engine — probability-weighted multi-scenario ECL, a four-
channel climate PD uplift, SICR staging, and DB persistence to `ecl_assessments`/`ecl_exposures`/
`ecl_scenario_results` (largely harness-passing, real-db). Already rung 2 (baseline/adverse/severe
scenarios). §7.5 names the deepening targets: lifetime ECL is a **single-number `EAD × PD_life × LGD`**
— no marginal-PD term structure, **no EIR discounting** (which IFRS 9 requires), no EAD amortisation,
and `maturity_years` is accepted but unused; scenario multipliers apply **one flat factor to both 12m
and lifetime PD** rather than conditioning PD term structures on macro paths; the uplift coefficients
and sector sensitivities are synthetic calibrations; and the aggregate `ecl_scenario_results`
persistence uses only the **first exposure's** scenario ECLs (understating multi-exposure portfolios
in the DB, though the response payload is correct). Evolution A adds a discounted marginal-PD term
structure and NGFS-conditioned scenario PD paths.

**How.** `_compute_single_exposure` sums discounted marginal PD×LGD×EAD per period over the maturity
(finally using `maturity_years`) with EIR discounting; scenario PD adjustments come from NGFS-pathway-
conditioned term structures (via the `carbon_prices`/`analysis` domains) instead of a flat multiplier;
the portfolio persistence bug (first-exposure-only scenario totals) is fixed. Rung 4 (predictive): the
uplift coefficients are calibrated against observed climate-related credit deterioration, and PD paths
forecast per NGFS vintage.

**Prerequisites (hard).** Fix the harness failure — §4.2 shows `GET /assessments/{id}` **failed**
(db-empty); fix the documented portfolio-scenario persistence understatement. Preserve the honest
warning when no climate score is supplied ("ECL will equal baseline"). **Acceptance:** the §7.4 worked
example (£433,296 PW lifetime ECL, +60.5% climate uplift, Stage 2) reproduces under the legacy flat
model, then the discounted marginal-PD version differs for a long-maturity exposure; the DB scenario
totals reconcile with the response for a multi-exposure portfolio; the detail endpoint passes the
harness.

### 9.2 Evolution B — Climate-ECL analyst with tool-called provisioning (LLM tier 2)

**What.** A tool-calling analyst for credit-risk/provisioning teams: "compute climate-adjusted ECL for
this oil & gas exposure" (`/calculate` → PW 12m/lifetime ECL, climate uplift %, per-scenario
breakdown, SICR flags), "run our portfolio" (`/portfolio` → baseline vs climate-adjusted ECL, stage
distribution, sector breakdown), and "screen for SICR migrations" (`/sicr-screening` → recommended
action ladder) — narrating the engine's real IFRS 9 outputs and the four-channel uplift decomposition.

**How.** Tool schemas over the 5 endpoints; the no-fabrication validator checks every ECL £, PD, uplift
% and stage against tool output. The copilot explains *why* an exposure migrated to Stage 2 (the §7.4
insight: the absolute 50bp PD-increase test can trigger even in the baseline scenario) and surfaces
that the uplift coefficients are synthetic calibrations. Because ECL consumes EAD from the sibling
`ead` engine, this is a core node in a Financial-desk credit-risk orchestrator (`ead` → `ecl_climate`
→ `banking_risk` capital).

**Prerequisites.** Evolution A's harness fix and the persistence-bug fix; Atlas corpus embedded
(roadmap D3); RBAC so assessments persist under the user's session. **Acceptance:** every figure cited
traces to an engine tool call; the PW ECL and determined stage match `/calculate`; a SICR-screening
answer names the specific trigger (relative >100% or absolute >50bp) that fired; the copilot flags the
uplift coefficients as illustrative pending Evolution A calibration.
