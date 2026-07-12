## 9 · Future Evolution

### 9.1 Evolution A — Backend MACC engine with real annualisation (analytics ladder: rung 1 → 2)

**What.** Today this is a tier-B frontend-only page: 30 hand-authored measures in a constant
`MEASURES` array, MAC values pre-baked (the §5 formula `MAC = ΔAnnualised_cost / ΔAnnual_abatement`
is never actually computed), and a header KPI (38.4 Gt) that contradicts the seed sum (49.9 Gt).
Evolution A builds the module's first backend vertical: an `abatement_measures` reference table
with per-measure capex/opex/lifetime/abatement fields and per-row citations (IEA WEO, AR6 WGIII
Ch.6 price bands), plus a MACC engine that derives MAC properly — capex annuity at a
user-supplied discount rate plus opex delta, divided by annual abatement.

**How.** New route pair `GET /api/v1/macc/measures` and `POST /api/v1/macc/curve` accepting
`{discount_rate, year, sector_filter, carbon_price_grid}`; the engine returns the ranked curve
with cumulative potential (so bar width can finally encode potential, fixing the stylised-MACC
caveat in §7.3) and the viability-vs-price supply curve the page currently computes client-side.
Rung 2 arrives via parameter sweeps: discount-rate sensitivity (3–12%) and year-indexed MACs
using simple learning-curve declines for CCS/DAC/H₂.

**Prerequisites.** Fix the 38.4-vs-49.9 header reconciliation and the "50+ measures" guide claim
during migration; Alembic migration for the reference table; per-measure source citations are
mandatory (the current footer attribution is decorative). **Acceptance:** portfolio MAC for the
§7.4 worked example reproduces −13 $/tCO₂e at the legacy assumptions, and changing the discount
rate from 5% to 10% visibly reorders at least the capital-intensive measures.

### 9.2 Evolution B — MACC copilot grounded in the measure library (LLM tier 1)

**What.** A chat panel answering "why is heat-pump deployment +35 $/t while insulation is −45?",
"what carbon price unlocks 20 Gt?", and "what's excluded from this curve?" strictly from this
Atlas page and the live page state — the sorted curve, the Tab 4 supply-curve array, and the
Portfolio Builder selection. Because the module currently exposes zero endpoints, tier 1
(explanation-only) is the honest scope; the copilot must volunteer the documented limitations
(no discount rate, no measure interaction/overlap deflation, static MACs) rather than imply
McKinsey-grade rigor.

**How.** Per-module system prompt assembled from this page's §5/§7 sections embedded in
`llm_corpus_chunks` per the roadmap Tier-1 pattern; page state (selected measures, active
carbon-price scenario) passed as structured context so answers cite actual on-screen numbers;
served via `POST /api/v1/copilot/abatement-cost-curve/ask` with the standard refusal path for
questions the module cannot answer (e.g. company-specific MACs). Once Evolution A ships, the
same panel graduates to tier 2 by tool-calling `POST /macc/curve` for what-ifs ("re-rank at 8%
discount rate").

**Prerequisites.** Atlas corpus embedded (roadmap D3 pgvector tables); the copilot's grounding
must note that measure values are synthetic literature-order-of-magnitude, not sourced datapoints,
until Evolution A's cited table lands. **Acceptance:** every numeric in an answer traces to the
page state or an Atlas section; asking "what is the MAC of offshore wind in Germany?" produces a
refusal naming the module's global-static scope.
