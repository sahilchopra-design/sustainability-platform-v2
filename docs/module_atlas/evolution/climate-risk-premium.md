## 9 · Future Evolution

### 9.1 Evolution A — Implement the Fama-MacBeth estimator the guide already claims (analytics ladder: rung 1 → 3)

**What.** §7 carries an explicit guide↔code mismatch flag: the methodology promises
`CRP = α + β_phys·PhysRisk + β_trans·TransRisk + β_pol·PolicyUnc + ε` via Fama-MacBeth
cross-sectional regression, but no regression exists — the page algebraically *splits*
`sr()`-seeded spreads into phys/trans/residual components for 200 synthetic issuers.
Evolution A closes that gap: an actual premium estimator, so the module measures whether
climate risk is priced rather than asserting a decomposition.

**How.** (1) New endpoint `POST /api/v1/climate-risk/premium/estimate` running two-pass
Fama-MacBeth with statsmodels (already in the environment): time-series pass estimates
per-issuer betas against physical/transition factor returns; cross-sectional pass
estimates the priced premium per period with Newey-West errors. (2) Risk-factor inputs
come from the platform's own engines — `climate_physical_risk_engine.assess_entity` and
`TransitionRiskEngine.assess_entity` scores as the characteristic sorts — so the factor
construction is reproducible. (3) Benchmark the output against the Giglio et al. (2021)
and ECB/ESRB ranges §5 already cites; publish the comparison in the response payload.
(4) Replace the seeded `ISSUERS` array with the estimation sample; keep the term-structure
and greenium panels but drive them from residuals.

**Prerequisites.** A real spread panel (the market-data seed from EA-hybrid-v3 or a
bond-pricing ingest) — the estimator must refuse to run on synthetic issuers; the §7
mismatch flag removed only after code matches guide. **Acceptance:** regression output
includes t-statistics and sample size; estimated transition premium falls within (or is
honestly flagged against) the cited literature range.

### 9.2 Evolution B — Discount-rate copilot for valuation teams (LLM tier 1)

**What.** The stated workflow ends with "use premium estimates for climate-adjusted
discount rates in DCF valuations" — a judgment-heavy step the module leaves to the
analyst. Evolution B adds a copilot that explains what the premium panels mean for a
specific valuation: "what discount-rate uplift is defensible for an EU BBB utility?",
answering from the module's own decomposition logic, the §7.4 worked example
(24bp/48bp/128bp split, carbon beta 0.72), and the cited literature — with explicit
caveats that current issuer data is synthetic.

**How.** Tier-1 RAG per the roadmap: corpus is this Atlas record (§5 formula and
standards, §7 including the mismatch flag, §8 spec) embedded in `llm_corpus_chunks`;
served via `POST /api/v1/copilot/climate-risk-premium/ask` with the page's selected
sector/rating/geography state passed as context. The mismatch flag is load-bearing: the
system prompt must instruct the copilot to disclose that displayed premia are
constructed, not estimated, until Evolution A ships — honesty is the feature.

**Prerequisites.** Atlas corpus embedding pipeline (roadmap D3); no module code changes
needed. **Acceptance:** asked "is this premium estimated from market data?", the copilot
correctly answers no and cites §7; every quantitative claim cites either page state or a
referenced document; refusal on questions requiring the unbuilt regression.
