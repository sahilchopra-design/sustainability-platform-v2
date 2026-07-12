## 9 · Future Evolution

### 9.1 Evolution A — Implement the composite scores the guide publishes (analytics ladder: rung 1 → 2)

**What.** §7 shows only one of the guide's four formulas exists: the 30-year
cumulative net cash flow is real, but `PortfolioBCR = Σ(w_i × BCR_i)` is actually an
unweighted mean, and `Adaptation_Score = 0.4·PhysRiskReduction + 0.3·Community +
0.3·Cobenefits` and `Risk_Adjusted_IRR = IRR/√ClimateRiskScore` are absent — the
28 assets carry *independent* `sr()`-seeded bcr/adaptScore/irr/climateRisk fields, so
the risk-return scatter plots noise against noise. Evolution A implements the three
missing formulas and makes the asset attributes internally consistent: BCR derived
from each asset's own capex and benefit fields, adaptation score composed from
sub-scores (which then must exist as fields), risk-adjusted IRR computed, and the
portfolio aggregate capex-weighted as published.

**How.** (1) Asset schema extension: physical-risk-reduction, community-resilience,
and co-benefit sub-scores per asset — seeded from the benefit-attribution categories
the `ATTRIBUTION` table already names, or entered per real asset. (2) The three pure
functions with the guide's exact weights, unit-tested; the scatter re-keyed to
computed values so position finally means something. (3) The PRNG asset generator
replaced by a fixtures file with per-field provenance notes, per the platform's
random-as-data guardrail.

**Prerequisites.** Decision whether the 28 assets stay as labelled fixtures or connect
to real DFI project data (GCF/GFDRR project databases are public); mismatch flag
clears when all four formulas compute. **Acceptance:** portfolio BCR changes when
weights (capex) shift even with constituent BCRs fixed; an asset's scatter position
moves when and only when its underlying fields change.

### 9.2 Evolution B — Portfolio-construction copilot (LLM tier 2)

**What.** An assistant for adaptation fund managers: "build me a mix with portfolio
BCR ≥ 5 and ≥30% nature-based solutions", "why does the EWS asset dominate on
risk-adjusted IRR?" (post-Evolution A this has a real answer: low capex, high BCR —
the World Bank GFDRR pattern §5 cites), "walk through the benefit attribution for the
coastal cluster". Screening and evaluation run as client-side tool calls over the
Evolution A functions and the cash-flow accumulator — the module has no backend
routes.

**How.** Tool schemas over `portfolioBCR`, `adaptationScore`, `riskAdjustedIRR`, and
the filter/aggregate pipeline; every BCR/IRR/score in an answer validated against
invocations; GFDRR/GCF benchmark comparisons cited from the §5 corpus with the 6.1x
portfolio-average figure attributed to its report.

**Prerequisites (hard).** Evolution A first — an allocation recommendation computed
over independent random fields would be indistinguishable from advice and completely
ungrounded. **Acceptance:** a recommended allocation's stated portfolio BCR is
reproducible by re-running the function; the copilot refuses country-specific hazard
claims (that belongs to the digital-twin modules, not this catalogue).
