## 9 · Future Evolution

### 9.1 Evolution A — Estimate carbon beta from real return/EUA series (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag is blunt: the promised
`Carbon Beta = Cov(Return, CarbonPrice)/Var(Return)` 3-year rolling regression, the
physical/transition premium decomposition, and the IFRS S2 disclosure output are all
unimplemented — the 80 companies are `sr()`-seeded, "climateBeta" is the display
transform `β × (1 + premium×10)`, and the generated `physicalRiskAdj`/`transitionRiskAdj`
never even enter `adjustedWacc`. Evolution A builds the estimator: rolling regressions
of sector equity returns on EUA price changes, feeding a WACC uplift whose components
actually sum.

**How.** (1) Backend vertical `POST /api/v1/climate-wacc/estimate`: statsmodels rolling
OLS of sector-index excess returns on EUA log-returns (EUA history is available via the
platform's market-data seed from the EA-hybrid-v3 sprint; sector indices from the same
layer), 36-month window, Newey-West errors. (2) Recompose the WACC identity so the
waterfall *is* an identity — §7.3 notes the current bars don't sum to the final bar —
with carbon beta entering through CAPM (`r_f + β_c·CRP`) and the physical/transition
premiums wired into `adjustedWacc` instead of display-only. (3) Fix or remove the
Capital Optimizer, whose carbon-liability term is numerically negligible (≈10⁻⁵) and
whose "optimum" is a tax-shield artifact with no distress cost (§7.5). (4) Benchmark
estimated sector betas against the Dietz et al. (2023) ranges §5 cites.

**Prerequisites (hard).** Purge the seeded 80-company universe from computed paths
(fabrication-guardrail conventions); EUA and sector return series must be in the DB
first. **Acceptance:** waterfall components sum to final WACC exactly; carbon beta
carries a t-statistic and window; high-carbon sector uplift lands inside (or is flagged
against) the guide's 120–180 bps oil-and-gas claim.

### 9.2 Evolution B — IFRS S2 cost-of-capital disclosure drafter (LLM tier 2)

**What.** The module's stated purpose — "IFRS S2-compliant cost of capital
disclosure" — has no output artifact today (§7.6). Evolution B closes that with an LLM
where drafting genuinely helps: after Evolution A computes the climate-adjusted WACC
and its decomposition, a tool-calling drafter produces the IFRS S2 paragraph-level
disclosure (current and anticipated effects of climate risk on cost of capital,
sensitivity table across the NGFS overlay scenarios), every figure pulled from the
`/estimate` response and the sensitivity grid, structured against the S2 requirement
text already ingestable via the refdata regulatory catalogs.

**How.** Tool schemas from Evolution A's endpoints; the drafter's system prompt maps
each S2 disclosure requirement to the module fields that evidence it, and emits
"insufficient data" for requirements the engine cannot support (e.g. anticipated
financing-cost effects beyond the modeled horizon) — honest-nulls carried into prose.
Rendering flows through the report-studio layer per the roadmap's output convention;
drafts are versioned with the engine version stamp for reproducibility.

**Prerequisites (hard).** Evolution A — drafting a regulatory disclosure from seeded
placeholder companies would be a compliance hazard, not a feature; S2 requirement text
in the corpus. **Acceptance:** a draft disclosure where every number matches a tool
output, every S2 requirement is either evidenced or explicitly marked unmet, and
regenerating with the same inputs yields the same figures.
