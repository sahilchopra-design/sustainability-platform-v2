## 9 · Future Evolution

### 9.1 Evolution A — Connect the page to its rigorous Rio-marker engine (analytics ladder: rung 1 → 2, engine already at 2)

**What.** §7 documents the engine↔page divergence precisely: the backend
(`climate_finance_engine.py`, E78) is genuinely rigorous — OECD CRS Rio-marker
counting (principal 100%/significant 50%), DAC mobilisation multipliers, an explicit
honest-NULL policy, real CPI 2023/NCQG reference data behind four passing ref GETs —
while the hub page builds 60 `sr()`-seeded projects over real fund names (GCF, AF,
GEF, CIF) with fabricated approved/disbursed figures and never calls the engine.
Evolution A is a wiring evolution: the page becomes a client of
`track_climate_finance` and the ref endpoints, with an instrument-entry workflow
(amount, ccm/cca markers, channel) whose attribution the engine computes, and the
fund tables re-seeded from the funds' published annual reports (GCF portfolio data is
public) instead of PRNG draws against real fund names.

**How.** (1) Frontend fetch layer to the existing routes; the SLL step-down and
blended-finance tabs either call engine functions (the engine's extracted lines show
guarantee/equity mobilisation logic exists) or display the ref data explicitly.
(2) `ref_fund_portfolios(fund, year, pledged, disbursed, source)` from published
replenishment/annual-report figures. (3) Lineage fixtures so the POST paths move from
`skipped` to `passed` in the harness.

**Prerequisites (hard).** Fabricated-figures-on-real-funds purge (the same defect
class as real-company fabrication); REQUIRE_AUTH posture for POSTs. **Acceptance:**
a Rio-marker attribution on the page reproduces the engine's principal/significant
arithmetic exactly; fund figures cite report vintages; zero `sr()` project rows
remain.

### 9.2 Evolution B — Climate-finance accounting analyst (LLM tier 2)

**What.** The engine's domain — Rio-marker attribution — is genuinely confusing to
practitioners, and a tool-calling analyst adds real value: "how much of this $50M
loan counts as climate finance with ccm=1, cca=2?" (engine call, answer decomposed
into the 50%/100% rules with the OECD handbook citation), "what mobilisation can an
IFC guarantee claim?" (the DAC multiplier logic), "how does the NCQG structure change
what counts?" (the `/ref/ncqg-structure` payload). Every attribution from tool calls
against the live endpoints.

**How.** Tool schemas from this module's OpenAPI routes (4 ref GETs + the engine
POSTs once exposed); the honest-NULL engine policy propagates into copilot behaviour
— unreported markers mean "not countable", and the assistant must say so rather than
estimate; framework questions cite the OECD DAC handbook corpus.

**Prerequisites.** Engine POST routes exposed and fixture-tested (Evolution A);
the guide already matches the engine, so corpus risk is low. **Acceptance:** an
attribution answer reconciles to a direct engine call; an instrument with marker 0
yields "does not count" with the rule cited, never a guessed percentage.
