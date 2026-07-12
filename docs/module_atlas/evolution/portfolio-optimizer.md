## 9 · Future Evolution

### 9.1 Evolution A — Ship the real mean-variance optimiser (analytics ladder: rung 1 → 5)

**What.** §7's mismatch flag: the guide claims a Lagrangian MVO (`max[E(r) − λσ² + γ·ESG]` s.t. carbon budget, `Σwᵢ=1`), but the code is a score-tilt heuristic — each holding gets a linear composite score (`esg·0.4 + (1−transition)·0.3 + sbtiBonus + sizeWeight`), weights set proportional to score, clipped to a max-position cap and renormalised. There is no covariance matrix, no variance term, no Lagrangian, no quadratic program; the "efficient frontier" sweeps an ESG threshold with proxy return/risk. The reported WACI/ESG/HHI/SBTi metrics are genuine. Evolution A builds the actual optimiser the module is named for — a canonical rung-5 prescriptive engine.

**How.** (1) Implement the real MVO with `scipy.optimize` (or cvxpy) — a quadratic program maximising `E(r) − λσ² + γ·ESG` subject to the carbon-budget hard constraint, long-only (`wᵢ≥0`), and `Σwᵢ=1`, over a real covariance matrix estimated from ingested return history. (2) The efficient frontier becomes a genuine λ-sweep of QP solutions, not an ESG-threshold proxy. (3) Real holdings and returns from `portfolios_pg` and market data via the 11 portfolio-analytics endpoints (the shared engine feeds 48 modules). The correct WACI/ESG/HHI metrics carry over as constraint/reporting terms.

**Prerequisites.** Return covariance from market history (the missing input — the current page has no Σ); scipy/cvxpy in the backend; the portfolio-analytics endpoints (auth-gated). Blast radius 48 via shared engine — pin first. A `bench_quant` case with a known QP optimum. **Acceptance:** the optimiser solves the QP (verifiable against a hand-solved small case); the carbon-budget constraint binds; the frontier is a real λ-sweep; tightening the ESG floor changes the optimum.

### 9.2 Evolution B — Portfolio-construction analyst (LLM tier 2)

**What.** A copilot: "optimise for max Sharpe with WACI 40% below benchmark and an ESG floor of 60", "show the efficient frontier under a 100 tCO₂/$M carbon budget", "how much return do I give up for the carbon constraint?" — executed against the (Evolution-A) MVO, presenting weights, frontier points, and the shadow cost of each sustainability constraint.

**How.** Tool calls to an optimise endpoint (constraint set as typed parameters) and the frontier generator; system prompt from this Atlas page's §5 objective and the Markowitz/MSCI references named in §5. The analyst explains which constraints bound and the return cost of each climate tilt from the QP's dual values, not intuition; the fabrication validator matches every weight/return/risk figure to a tool response. Saving an optimised portfolio (POST/PATCH holdings) gates behind confirmation + RBAC.

**Prerequisites (hard).** Evolution A — there is no MVO to call today; a copilot presenting the current score-tilt heuristic's output as "mean-variance optimal" would misrepresent it exactly as §7 flags. **Acceptance:** every weight/frontier figure traces to a QP solve; constraint shadow costs come from the optimiser's duals; the copilot refuses to claim optimality before the QP exists.
