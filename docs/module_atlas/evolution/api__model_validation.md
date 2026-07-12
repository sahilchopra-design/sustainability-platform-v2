## 9 · Future Evolution

### 9.1 Evolution A — Live model registry with real backtest telemetry and calibrated significance tests (analytics ladder: rung 3 → 4)

**What.** `ModelValidationFramework` is the platform's second-line MRM layer: a 17-model
inventory (PD/LGD/EAD, climate physical/transition, valuation, PCAF, VaR, CBAM…), a
generalised backtesting harness (MSE, R², KS statistic, Hosmer-Lemeshow-style grouped
chi-square, binomial calibration z-test), champion-challenger comparison with a paired
t-test, and a BCBS 239 / EBA GL/2023/04 / SR 11-7 dashboard. The honest limits: the
inventory is a hardcoded `MODEL_INVENTORY` constant, and several p-values are analytic
approximations (`p_value = 2·exp(−0.5·|t_stat|)`, `p_approx = exp(−chi_sq/(2·dof))`)
rather than true distribution tails. Evolution A makes the registry live and the tests
exact.

**How.** (1) Replace the static inventory with a generated engine registry — the roadmap
calls for exactly this (AST-scanned engine registry with version stamps); model
lifecycle state and validation history then persist, not reset per process. (2) Swap the
exponential p-value approximations for scipy.stats exact tails (t, chi-square, binomial),
which are already in the environment — MRM p-values must survive a regulator's
recomputation. (3) Feed backtests from real engine prediction logs (the bench_quant
harness and lineage traces are the data source) so `overdue_validations` and the
BCBS 239 compliance % reflect actual model runs. (4) Bench-pin every test statistic.

**Prerequisites.** The engine registry artifact (roadmap engine-platform work); a store
of model predictions vs realised outcomes. **Acceptance:** the inventory reflects the
real engine set with version stamps; p-values match scipy exact values within tolerance;
backtest inputs trace to logged predictions; test statistics bench-pinned.

### 9.2 Evolution B — Model-risk governance copilot for validators (LLM tier 2)

**What.** A copilot for the second line: "which models are overdue for validation and
what's our BCBS 239 compliance?" (calling `/dashboard`), "backtest the PD model against
this outcome set and tell me if it passes calibration" (calling `/backtest` and narrating
the KS/HL/binomial results), and "compare champion vs challenger" (`/compare-models`).

**How.** Five endpoints (`/backtest`, `/compare-models`, `/transition-lifecycle`,
`/inventory`, `/dashboard`) plus reference GETs (catalog, lifecycle-states/transitions,
validation-tests, regulatory-frameworks) that ground the MRM regime. The copilot explains
*which* statistical test failed and *why* (e.g. "KS = 0.42 indicates weak discrimination")
using the reference catalog. Lifecycle transitions are the gated tier-2 action (model
state changes inherit RBAC). This is the meta-module the tier-3 orchestrator consults to
report model provenance and version for any other copilot's answer.

**Prerequisites.** Evolution A's exact tests — a validator copilot narrating approximate
p-values as decisions would be indefensible in an audit. **Acceptance:** every statistic,
p-value, and compliance % traces to a tool response; the copilot names the regulatory
framework behind each test from the reference endpoint; lifecycle transitions require
confirmation and log to audit; it refuses to declare a model "validated" beyond what the
harness computes.
