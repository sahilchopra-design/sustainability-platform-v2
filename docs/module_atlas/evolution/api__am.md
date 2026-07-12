## 9 · Future Evolution

### 9.1 Evolution A — Regression-based attribution and QP optimisation (analytics ladder: rung 1 → 3)

**What.** The `am_engine` ("Asset Management Engine") is a clean tier-A vertical: six deterministic
sub-modules (ESG attribution, PACTA-style Paris alignment, ICMA/EU-GBS green-bond screening,
climate-adjusted spreads, LP liquidity analytics, ESG-tilted optimisation) over caller-supplied
data, no PRNG, no DB reads. But §7.5 documents where the math is stylised: factor attribution is a
*pro-rata allocation* of active return across FF-5 premia (×0.6 scaling, benchmark WACI hardcoded
180), not estimated betas; the implied-temperature function is a linear CI-ratio heuristic, not a
real ITR method; the optimiser is a one-pass heuristic whose "risk" ignores correlations (the
docstring itself says a full build would use scipy/cvxpy QP). Evolution A upgrades each: time-series
regression betas for attribution, a cumulative-emissions-budget ITR for Paris alignment, and a real
mean-variance QP optimiser with a covariance matrix.

**How.** `POST /esg-attribution` gains an optional returns-history input to estimate factor betas
(statsmodels, already in the environment); `/paris-alignment` adds a budget-based ITR alongside the
CI-ratio heuristic; `/optimise` calls scipy.optimize/cvxpy for true QP with a covariance input,
enforcing single-name and sector caps jointly rather than one-pass (fixing the documented cap-break).
Rung 3: calibrate the spread-model coefficients (×0.5 transition, /500 hazard) and greenium bps
against observed climate-spread and greenium literature the reference data already cites.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `/green-bond-screening` and
`/optimise` **failed** and four others **skipped**; the engine's outputs are only as good as the
caller's holdings (several frontend pages feed it synthetic seeds — those callers need real data).
**Acceptance:** the §7.4 climate-spread worked example (190.8 bps adjusted, 7.8% 1y downgrade)
reproduces; the QP optimiser respects both caps simultaneously; attribution betas are estimated when
history is supplied, falling back to the pro-rata heuristic otherwise.

### 9.2 Evolution B — Portfolio-manager analyst across the AM sub-modules (LLM tier 2)

**What.** A tool-calling analyst for asset managers: "attribute my portfolio's active return"
tool-calls `/esg-attribution` (Brinson-Fachler selection/allocation split), "what's my implied
temperature and who are the laggards?" calls `/paris-alignment`, "screen these bonds for EU GBS"
calls `/green-bond-screening`, "stress my fund's liquidity" calls `/lp-analytics` (LCR, HHI,
redemption stress), and "optimise with a 0.3 ESG tilt" calls `/optimise` — narrating the engine's
real deterministic outputs across a coherent PM workflow.

**How.** Tool schemas from the 6 POST + 1 GET operations (Pydantic-typed); the `/reference-data`
endpoint (factor premia, SBTi pathways, sector carbon intensity, greenium by rating) is ideal RAG
grounding for "why is my low-carbon tilt worth 30bps?" questions. The no-fabrication validator
checks every bps, °C and ratio against tool output. This module is also a natural node in a Financial
desk orchestrator (tier 3): "assess this fund" chains AM attribution + Paris alignment + LP liquidity
into one memo.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); the caller must
supply real holdings for outputs to be meaningful (§7.5); Atlas + reference-data corpus embedded
(roadmap D3). **Acceptance:** every numeric in an answer traces to an engine tool call; the implied
temperature cited matches `/paris-alignment` output exactly; a bond failing the 85% taxonomy floor
is correctly reported EU-GBS-ineligible with the reason.
