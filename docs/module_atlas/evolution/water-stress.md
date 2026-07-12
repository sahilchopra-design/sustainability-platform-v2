## 9 · Future Evolution

### 9.1 Evolution A — Multiplicative Aqueduct formula with real CDP correlation (analytics ladder: rung 2 → 3)

**What.** The module already scores a real portfolio (`GLOBAL_COMPANY_MASTER`) against
real hand-curated country and sector reference tables — §7.5 credits this as a genuine
improvement over synthetic siblings — but four documented gaps remain. The formula is
additive over 2 factors while the guide specifies the multiplicative 4-factor Aqueduct
product; the country table's `drought_risk`/`flood_risk` labels are surfaced as badges
but never enter `waterRisk`; `revenueAtRisk`'s units are dimensionally ambiguous
(`pct × weight × 100` — §7.4's worked example yields 190 of nothing in particular);
and `cdpScore` is a random letter grade uncorrelated with computed risk, so an
"Extremely High" holding draws an A as easily as an F. Evolution A implements the
stated multiplicative form (baseline stress × interannual × seasonal × drought, using
the variability fields the platform's Aqueduct seed data carries for the sibling
`water-risk-analytics` module), fixes `revenueAtRisk` to a defined unit
(% of portfolio revenue, documented), and replaces the random CDP grade with either
real CDP public-response data where available or an engine-derived stewardship proxy
correlated with exposure — never an uncorrelated draw.

**How.** Move scoring into the shared `water_risk_engine` (this page is Tier B with no
backend calls today, despite the engine existing); pin the §7.4 India-Utilities worked
example in `bench_quant` after the formula change; keep the pricing-scenario slider,
re-based on the corrected intensity units.

**Prerequisites.** The random-CDP-grade fabrication acknowledged and removed; decision
on multiplicative weights documented. **Acceptance:** drought-labelled countries
score higher than identical non-drought peers; `revenueAtRisk` has a stated unit that
sums sensibly across the portfolio; CDP grades are sourced or explicitly proxied,
never random.

### 9.2 Evolution B — Portfolio water-engagement copilot (LLM tier 2)

**What.** The module's stated use is "informed engagement and investment decisions" —
an analyst workflow of ranking, questioning, and drafting engagement letters.
Evolution B is a tool-calling assistant over the corrected scoring: "rank our
holdings by water-stressed revenue exposure, show which lack credible CDP disclosure,
and draft an engagement letter for the worst three." It calls the new scoring
endpoint per holding, the pricing-scenario computation as a tool ("what if water
prices double in India?"), and drafts letters citing each company's computed
waterRisk, sector intensity benchmark, and disclosure gap — every figure traceable,
with the reference-table provenance (hand-curated Aqueduct-consistent constants, per
§7.2) stated when asked.

**How.** Tier-2 stack: tool schemas from Evolution A's endpoints; grounding corpus is
this Atlas page plus the country/sector reference tables themselves (already rendered
on-page, so user and copilot see the same constants). Engagement letters are drafts
for human review, logged to `llm_traces`.

**Prerequisites (hard).** Evolution A — engagement letters citing a random CDP grade
would be reputationally dangerous; portfolio data access under the user's RBAC scope.
**Acceptance:** letter figures all appear in tool outputs; a company whose CDP status
is proxied is described as such in the letter; asked for basin-level detail this
module doesn't hold, the copilot points to the water-risk-analytics module instead of
inventing it.
