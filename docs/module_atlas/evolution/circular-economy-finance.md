## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own real engine; purge the fabricated screener (analytics ladder: rung 1 → 2)

**What.** §7 documents the platform's classic wiring gap in its sharpest form: a real
tier-A backend (`circular_economy_engine.py` — EMF MCI, WBCSD CTI, ESRS E5, EPR
compliance costing, CRM risk, LCA) is live behind eight
`POST /api/v1/circular-economy/*` routes plus two passing ref GETs (`ref/crm-list`,
`ref/epr-rates`), while `CircularEconomyFinancePage.jsx` never issues a single fetch —
its 65 companies and every metric including the 0–100 circularity score are seeded-PRNG
draws (`circularityScore = 20 + sr(i·3)·75`). Evolution A deletes the fabricated
company book and rebuilds the page as a working client of its own engine: input panels
posting to `/mci`, `/wbcsd-cti`, `/esrs-e5`, `/epr-compliance`, and `/overall-
circularity`, with the EPR cost calculator (packaging/e-waste/battery tonnes × real
directive rates) as the finance-page centrepiece.

**How.** (1) Replace the screener with an entity-based workflow: user-entered or
seeded-fixture product systems, each scored by the engine, results persisted.
(2) Lineage harness upgrade: the six `skipped` POSTs in §4.2 get request fixtures so
the sweep exercises them. (3) The guide's unimplemented `CircularValue` revenue formula
either implemented as a small addition to the engine or excised from the guide —
the mismatch flag must clear one way.

**Prerequisites (hard).** The `sr()` company fabrication is a documented defect class
(random-as-data) and its removal is the point, not a side effect; REQUIRE_AUTH posture
for POSTs applies. **Acceptance:** zero PRNG-derived metrics remain on the page; every
rendered score matches an engine response payload; lineage sweep shows the 8 POSTs
`passed`.

### 9.2 Evolution B — Circularity analyst over the engine's tool surface (LLM tier 2)

**What.** This domain is unusually tier-2-ready: eight Pydantic-typed POST endpoints
already exist. An analyst assistant that runs them conversationally — "compute MCI for
a product with 40% recycled input, 60% waste recovery, 1.3x lifetime", "what would EPR
compliance cost us in Germany for 2,000t packaging?", "screen our material basket
against the EU CRM list" — narrating only engine responses, with the CRM/EPR ref
endpoints supplying the regulatory context.

**How.** Tool schemas auto-generated from the OpenAPI spec filtered to this module's
routes per the atlas endpoint map; the no-fabrication validator checks every score,
cost, and percentage against tool outputs; "show work" expander lists the engine calls
made. The per-module system prompt draws on §5's real engine transformation lines
(utility factor, raw MCI, benchmark gap) so explanations match the implementation.

**Prerequisites.** Evolution A's page rewiring is not strictly blocking (the endpoints
work today), but the guide's phantom CircularValue formula must be corrected before
entering the corpus. **Acceptance:** every numeric in an answer appears in a logged
engine response; asked for a company's circularity score without running the engine,
the assistant runs it or refuses — it never estimates.
