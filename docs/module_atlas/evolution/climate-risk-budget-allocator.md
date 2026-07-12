## 9 · Future Evolution

### 9.1 Evolution A — Real-portfolio MRC decomposition and risk-budget optimizer (analytics ladder: rung 2 → 5)

**What.** The backend vertical is real — `assessment_runner`, `climate_physical_risk_engine`
(5-stage CVaR pipeline), `climate_transition_risk_engine` (NGFS carbon pricing, stranded
assets), and `climate_integrated_risk` all exist behind 21 `/api/v1/climate-risk/*`
routes — but the allocator page never calls them: every asset's `carbonBeta`, `totalVaR`,
`physVaR`, eigenvalues and hedging numbers are `sr()`-seeded in the UI. Evolution A wires
the MRC math (`MC-CVaRᵢ = ∂CVaRₚ/∂wᵢ`) to real engine output over real holdings, then adds
the missing prescriptive step: a risk-budget optimizer producing the rebalancing trade
list the overview promises.

**How.** (1) New endpoint `POST /api/v1/climate-risk/budget/allocate` that loads holdings
from `portfolios_pg`, runs `assess_portfolio` on both engines per entity, and computes
Euler-decomposed marginal contributions from the resulting CVaR vector plus a factor
covariance estimated from the per-scenario results (replacing the seeded `CORR_MATRIX`
and `FACTOR_VARIANCE`). (2) scipy SLSQP equal-risk-contribution / budget-constrained
optimizer (the roadmap names risk allocation as a natural rung-5 mover) emitting weight
deltas per asset. (3) Frontend swaps `BASE_ASSETS` for the endpoint payload.

**Prerequisites.** Fix the lineage-harness failures on `GET /assessments*` (status
`failed`, output `None`) before layering allocation on the runner; seed the 200–500
holding demo portfolio (roadmap D0). **Acceptance:** sum of reported MRCs equals
portfolio CVaR within 1%; optimizer output satisfies budget constraints; zero `sr()`
calls remain in the allocation path.

### 9.2 Evolution B — Budget-breach analyst with rebalancing what-ifs (LLM tier 2)

**What.** A tool-calling analyst on the allocator page answering "which positions are
consuming my climate risk budget and what trade fixes it?" by invoking the module's own
endpoints — `POST /assessments/run`, `GET /assessments/{run_id}/drill-down`, and the
Evolution A `/budget/allocate` — and narrating real MRC decompositions, never inventing
betas. Follow-ups like "re-run under Delayed Transition with a 20% utilities cap" become
parameterized tool calls against the methodology system (`create_methodology` →
`run_assessment`), exploiting the draft/publish lifecycle that already exists in
`assessment_methodology_manager`.

**How.** Tool schemas filtered from the 21 OpenAPI operations via this Atlas endpoint
map; read-only first, with `POST /assessments/run` gated behind explicit confirmation
since runs persist. System prompt grounded in §5 (MRC formula, MSCI Climate VaR / TCFD
standards) and §7; the no-fabrication validator checks each numeric against
tool outputs. The "show work" expander lists run_id, methodology version, and scenario
set, which `get_run` already returns.

**Prerequisites.** Evolution A (otherwise the copilot can only describe seeded UI
numbers); the failed `GET /assessments` routes fixed so run retrieval works.
**Acceptance:** an end-to-end "breach → explain → propose trade" conversation where
every figure traces to a run_id; refusal when asked for asset classes not in the
portfolio.
