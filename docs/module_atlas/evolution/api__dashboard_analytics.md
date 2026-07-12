## 9 · Future Evolution

### 9.1 Evolution A — Real portfolio weighting and calibrated EL/tornado coefficients (analytics ladder: rung 2 → 3)

**What.** This domain exists to replace frontend synthetic seeds with SQL aggregates over live
ingested tables (SBTi, CA100+, country-risk indices, CSRD KPIs, company profiles, portfolios, NGFS)
— all real-db, no PRNG, honest-degradation (`_safe_scalar` returns 0 on SQL failure). But §7.5 is
candid that several *transformation constants* are synthetic: the $500M base exposure, the ÷1000
carbon scaling, the 0.3–1.0 risk multiplier and every tornado elasticity (×8…×15) are engine-authored
proxies, so the expected-loss trajectory is an **indexed proxy, not a modelled portfolio loss**; SBTi
sector counts stand in for portfolio exposure with no holdings weighting; and CA100+ alignment uses
only indicators 1–3 treating string 'Yes' as full credit. Evolution A grounds the dashboard in real
`portfolios_pg` holdings and calibrates the EL/tornado coefficients.

**How.** `_compute_portfolio_exposure` and the EL time-series weight by actual `portfolios_pg`
holdings and their financed-emissions (from the PCAF modules) instead of SBTi sector counts; the EL
product's carbon-scaling and risk-multiplier are replaced by the platform's real transition-risk
engine outputs (the `analysis` domain's Monte-Carlo credit engine), so the dashboard reflects modelled
loss, not an index. Rung 3: the tornado elasticities are calibrated to observed driver sensitivities;
CA100+ alignment uses all 10 indicators with partial-credit scoring.

**Prerequisites.** The engine is harness-passing; the work is fidelity, not repair. Resolve the
documented FH_FIW normalisation ambiguity (`(14−score)/14` assumes a 0–14 combined scale — must match
how ingestion stored it; the sibling `country_risk` route calls it 1–7 per-dimension). **Acceptance:**
the §7.4 EL worked example ($50.75M at 2040) reproduces under legacy constants, then reflects real
holdings-weighted loss; the governance composite (78.1 in the example) reconciles with the
`country_risk` domain's scale; portfolio exposure derives from `portfolios_pg`, not SBTi counts.

### 9.2 Executive copilot over the live platform dashboard (LLM tier 2)

**What.** A copilot for executives/CSOs answering "what's our platform-wide SBTi alignment?", "which
sectors are Paris-aligned?", "what's the expected-loss trajectory under Net Zero 2050?", and "which
macro driver has the biggest swing?" — tool-calling the eight dashboard aggregators and narrating real
figures across KPIs, climate, emissions, governance, time-series and the sensitivity tornado.

**How.** Tool schemas over the 8 GET endpoints (all real-db, harness-passing); the no-fabrication
validator checks every count, rate and EL figure against tool output. Because several constants are
synthetic proxies (§7.5), the copilot must label the EL trajectory and tornado as indexed proxies
until Evolution A grounds them in real loss modelling. This is the natural top-level surface for a
desk orchestrator's executive summary, composing the underlying domains' outputs.

**Prerequisites.** Atlas corpus embedded (roadmap D3); the copilot's grounding carries §7.5's proxy
caveats. **Acceptance:** every figure in an answer traces to a dashboard tool call; the EL and tornado
are presented as indexed proxies (pre-Evolution A) with the synthetic scaling disclosed; the SBTi/
CA100+/governance counts match the `/analytics/kpis` output exactly.
