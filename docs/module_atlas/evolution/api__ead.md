## 9 · Future Evolution

### 9.1 Evolution A — Full SA-CCR, calibrated climate drawdown, and asset-class-faithful CCFs (analytics ladder: rung 2 → 3)

**What.** A Basel III/IV Exposure-at-Default engine (v2.0.0) with a climate drawdown overlay — CCF
conversion of undrawn commitments, guarantee/LC handling, an SA-CCR add-on, and the correct exclusion
of the maturity adjustment from EAD (a documented in-code fix that previously overstated EAD ~70%).
Already rung 2 (scenario multipliers optimistic→severe). §7.6 names the deepening targets: SA-CCR is
**heavily simplified** (no replacement cost — MtM assumed 0, no netting sets, no margining, single
supervisory factor per class) versus the full BCBS d279 `EAD = α(RC + PFE)` with hedging-set
aggregation; the climate drawdown factors and scenario multipliers are **synthetic expert-judgement**
values motivated by but not published in EBA GL/2022/16; and the per-asset-class CCF refinements are
platform choices within the Basel ladder. Evolution A implements full SA-CCR and calibrates the
climate overlay.

**How.** `_calculate_saccr_addon` gains replacement cost, netting sets and margining per d279;
`_get_climate_drawdown_stress` factors are calibrated against observed crisis-period drawdown data
(the platform has facility utilisation history via `data_intake`); the CCF table is reconciled
cell-by-cell against the ITS. Rung 3: the climate overlay conditions on NGFS scenario paths rather
than flat optimistic/base/adverse/severe multipliers, tying it to the platform's scenario data.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /calculate` and
`/calculate-batch` both **failed** (need input payloads to trace); preserve the documented
maturity-adjustment exclusion (it belongs in the RWA risk-weight, not EAD). **Acceptance:** the §7.4
worked example (Oil & Gas revolving, £95M regulatory EAD under adverse) reproduces at legacy climate
factors; full SA-CCR produces a different add-on than the PFE-only simplification for a margined
derivative; the failing POST endpoints pass the harness.

### 9.2 Evolution B — EAD/credit-exposure analyst with tool-called calculation (LLM tier 2)

**What.** A tool-calling analyst for credit-risk teams: "compute EAD for this revolving facility under
an adverse climate scenario" (`/calculate` → undrawn CCF conversion + climate uplift + methodology
audit trail), "run our whole loan book" (`/calculate-batch` up to 10,000 exposures → undrawn-weighted
CCF, EAD by asset class/facility type), and "what CCF applies to a standby LC?" (the reference
endpoints) — narrating the engine's real Basel outputs and its step-by-step `methodology_notes`.

**How.** Tool schemas over the 2 POST + 5 GET operations; the reference endpoints (CCF matrix,
climate-stress factors, facility types, asset classes) are ideal RAG grounding for "what's the Basel
IV CCF for an unconditionally cancellable commitment?" questions. The no-fabrication validator checks
every EAD, CCF and uplift against tool output. Because EAD feeds the sibling ECL engine
(`ECL = PD×LGD×EAD`), this is a natural node in a Financial-desk credit-risk orchestrator alongside
`ecl_climate` and `banking_risk`.

**Prerequisites.** Evolution A's harness fixes (working calculate endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool
call; the EAD matches `/calculate` including the climate uplift; the copilot surfaces the
methodology-notes audit trail and states that climate drawdown factors are illustrative until
Evolution A calibrates them.
