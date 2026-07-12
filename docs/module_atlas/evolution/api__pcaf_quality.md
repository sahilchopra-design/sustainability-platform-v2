## 9 · Future Evolution

### 9.1 Evolution A — Portfolio uncertainty propagation and DQS-improvement optimisation (analytics ladder: rung 3 → 5)

**What.** A PCAF Data Quality Score engine that scores holdings across five weighted
dimensions (`weighted_dqs = 0.35·emissions + 0.25·completeness + 0.15·timeliness +
0.15·granularity + 0.10·methodology`), aggregates exposure-weighted portfolio DQS, computes
SFDR PAI 1/2/3, and maps to eight frameworks. It's solid rung-3 PCAF-standard work but the
improvement roadmap is a simple `improvement_potential = dqs_level - max(1, dqs_level-1)`
per-holding hint, not a portfolio-level optimisation. Evolution A adds uncertainty
propagation and prescriptive data-upgrade sequencing.

**How.** (1) Propagate DQS into a portfolio-level financed-emissions confidence interval
(Monte Carlo per the roadmap's QMC pattern), so the portfolio number carries a band, not just
an average DQS. (2) Turn the improvement roadmap into a prescriptive optimiser (rung 5): given
a data-acquisition cost per holding, sequence the upgrades that most reduce portfolio-level
emissions uncertainty per euro spent — the exact "which data upgrade matters most" question
banks face. (3) Cross-check the DQS methodology against the sibling `pcaf_asset_classes` auto-DQS
so the platform has one consistent scoring path. (4) Bench-pin the five-dimension weighting and
PAI aggregation.

**Prerequisites.** A DQS→variance mapping for propagation; a per-holding data-cost input for
the optimiser. **Acceptance:** portfolio DQS output includes a financed-emissions confidence
interval; the improvement roadmap returns a cost-ranked upgrade sequence maximising
uncertainty reduction; DQS matches the `pcaf_asset_classes` engine for shared holdings; bench
pins pass.

### 9.2 Evolution B — Data-quality assurance copilot (LLM tier 2)

**What.** A copilot that runs `/score-portfolio` and explains the quality verdict — "your
portfolio DQS is 3.4; the 25%-weighted completeness dimension drags it because 40% of holdings
lack Scope-3; here's the cheapest path to DQS 2.5" — each figure tool-sourced, with SFDR PAI
readiness.

**How.** Three POST endpoints (`/score-holding`, `/score-portfolio`, `/assess-data-quality`)
plus rich reference GETs (asset-classes, dqs-levels, quality-dimensions, emission-factors,
attribution-methods, benchmarks, cross-framework) that ground every PCAF constant. The
five-dimension decomposition lets the copilot attribute a poor DQS to specific gaps; the
cross-framework map answers "how does this feed my SFDR PAI disclosure?". What-ifs re-run
statelessly. Core node for a financial-institution disclosure desk alongside
`pcaf_asset_classes` and `pcaf_regulatory`.

**Prerequisites.** None hard — engine is PCAF-aligned and reference-complete; stronger with
Evolution A's confidence intervals. **Acceptance:** every DQS, dimension score, and PAI figure
traces to a tool response; the copilot cites the specific PCAF data-quality table from the
reference endpoint; it presents DQS as a data-confidence measure (not emissions accuracy) and
refuses precision claims the score doesn't support.
