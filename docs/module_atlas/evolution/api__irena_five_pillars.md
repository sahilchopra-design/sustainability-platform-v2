## 9 · Future Evolution

### 9.1 Evolution A — From self-reported rubric to data-anchored readiness (analytics ladder: rung 1 → 3)

**What.** The entire methodology lives in the route module (no separate engine), which
self-describes as "simplified from IRENA ETAF": a weighted five-pillar energy-transition
readiness score from caller-supplied 0–10 criterion scores across 25 criteria.
`pillar_pct = Σscores/Σmaxes × 100`, `overall = Σ(pillar_pct × weight)`, plus gap
analysis, recommendations, and country benchmark indices pulled live from
`dh_country_risk_indices` — though that table traces **db-empty** in §4.2, so the
benchmark context is currently hollow. Evolution A anchors the scores in real data.

**How.** (1) Pre-populate criterion scores from objective indicators where they exist —
renewable-share, grid-readiness, policy-strength indices the platform already ingests
(IRENA/IEA/World Bank reference data) — so the assessment isn't purely self-reported;
report `evidence_tier` per criterion (data-anchored vs assessor-supplied). (2) Seed
`dh_country_risk_indices` so `country_benchmarks` returns real peer context rather than
db-empty. (3) Move from a static rubric to a benchmarked one: express overall readiness
as a percentile against the country-index cohort, not just an absolute percentage. (4)
Extract the inline route logic into a testable engine and bench-pin the aggregation.

**Prerequisites.** `dh_country_risk_indices` populated (D0 seeding); objective indicator
sources mapped to the 25 criteria. **Acceptance:** `/assess` returns non-empty
`country_benchmarks`; data-anchored criteria carry an `evidence_tier`; overall readiness
includes a cohort percentile; aggregation bench-pinned.

### 9.2 Evolution B — Energy-transition readiness copilot (LLM tier 1 → 2)

**What.** A copilot that walks a user through the five-pillar assessment — explaining
each criterion from `/framework`, running `/assess`, and narrating the gap analysis and
recommendations the endpoint already returns — for a country, utility, or project.

**How.** Tier 1 is a rubric explainer grounded in `/framework` (the full weighted
criteria list) — no new backend. Tier 2 registers `/assess` so the copilot can score
interactively and re-run what-ifs ("if we raised our grid-flexibility criterion from 4
to 8, does our rating change?"). Because scores are caller-supplied, the copilot's honest
role is to structure and explain, being explicit that inputs are self-assessed until
Evolution A anchors them in data. Natural tier-3 node for an energy-desk country
screen.

**Prerequisites.** For credible benchmark narration, Evolution A's
`dh_country_risk_indices` seeding — otherwise the copilot cites empty peer context.
**Acceptance:** every pillar score, rating, and recommendation traces to a `/assess`
response; the copilot labels the assessment as self-reported (not data-verified) until
Evolution A ships; asking for a country benchmark while the index table is empty yields
an explicit "benchmark data not yet loaded" rather than a fabricated peer figure.
