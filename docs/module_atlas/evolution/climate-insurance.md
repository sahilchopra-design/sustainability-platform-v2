## 9 · Future Evolution

### 9.1 Evolution A — Wire the 10 tabs to the E79 engine (analytics ladder: rung 2 → 3)

**What.** §7's verdict is that this tier-A module's gap is wiring, not methodology:
the backend engine (E79) genuinely implements the guide — climate-loaded AAL
(`climate_adj = 1 + rcp85_loading×(years/26)`), PML-100/250 with climate loading,
gross premium build-up, IAIS pillar scoring, parametric basis-risk guidance — behind
8 endpoints with 4 passing ref GETs, while the page imports no HTTP client and
recomputes everything client-side from seeded data (30 insurers, hand-coded perils).
Evolution A connects them: the Cat Modelling, Solvency, and pricing tabs become
clients of the engine's endpoints, the frontend's duplicate formulas are deleted
(two implementations of one methodology is a drift bug waiting to happen), and the
peril/NatCat inputs come from the engine's `ref/natcat-profiles` payload —
which already carries real country profiles and sources.

**How.** (1) Fetch layer + response binding per tab; the client-side PGR/SCR math
retired in favour of engine responses, with a regression pin proving parity first.
(2) Lineage fixtures so the four POST paths move to `passed`. (3) One genuine
deepening: the engine's protection-gap ref data joined with the platform's OpenFEMA/
IBTrACS ingested history so the PGR trend is observable per peril-region, not a
static ratio.

**Prerequisites.** REQUIRE_AUTH posture for POSTs; the 30 seeded insurers relabelled
as fixtures (real insurer names with seeded solvency ratios is the
fabrication-on-real-names pattern). **Acceptance:** every premium/AAL/PML figure on
the page matches an engine response; deleting the frontend formula duplicates changes
nothing rendered (parity proven); lineage shows POSTs passed.

### 9.2 Evolution B — Underwriting and supervision analyst (LLM tier 2)

**What.** With 8 real endpoints, this module is tier-2-ready at the API level today:
an assistant that prices coverage conversationally ("pure premium for $500M coastal
exposure, RCP8.5, 2040 horizon, 20% loading"), explains the climate loading's linear
horizon mechanics (the `/26.0` to-2050 factor from §5's extracted lines), runs IAIS
pillar assessments, and answers protection-gap questions from the ref data — every
number a tool response, mirroring the physical-risk-pricing exemplar module's copilot
pattern one domain over.

**How.** Tool schemas from the module's OpenAPI routes; per-module system prompt from
this atlas page (§5 formulas + §7 engine description); the no-fabrication validator
on all premiums, AALs, and solvency figures; basis-risk explanations for parametric
products grounded in the `ref/parametric-triggers` taxonomy.

**Prerequisites.** Evolution A's wiring so the copilot and the page describe the same
numbers (pre-wiring, the page shows client-side values the engine never produced —
exactly the narration hazard the exemplar flags). **Acceptance:** a quoted premium
reproduces via direct endpoint call; the copilot refuses casualty/life pricing
outside the engine's P&C scope.
