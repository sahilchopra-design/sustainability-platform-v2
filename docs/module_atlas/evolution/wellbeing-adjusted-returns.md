## 9 · Future Evolution

### 9.1 Evolution A — Shadow-price table and a real WAR/SROI construction (analytics ladder: rung 1 → 2)

**What.** Implement the module's advertised methodology, none of which exists: §7's
flag documents that `finalReturn` is a multiplicative uplift
(`grossReturn × (1 + wellbyScore/200)`) rather than the guide's additive
`WAR = Return + (Health + Social − Harm) × MonetisationRate`; `socialRoi` is an
independent random field, not a value/investment ratio; and — §7.3's sharpest finding
— `wellbyCostPerUnit` is generated and displayed but never multiplied against any
outcome, so the module's own monetisation field is decorative. Evolution A builds the
missing spine: a cited shadow-price table (NICE QALY threshold ~£20–30k, HM Treasury
Green Book WELLBY values, EPA social cost of carbon), an outcome-domain schema per
investment (health/social/environmental quantities), then
`TotalValue = Σ Outcome_i × ShadowPrice_i`, `SROI = TotalValue / Investment`, and the
additive WAR — retiring the multiplicative uplift. Fix `sdgAlignment` to map to the
actual 17 SDGs instead of 1–6. §7.5 notes the sibling `vc-impact` §8 spec is directly
reusable; the two modules should share one shadow-price reference table.

**How.** Backend route `POST /api/v1/wellbeing-returns/score` (module is Tier B,
EP-DP6) plus a `shadow_prices` refdata table shared with `vc_impact_engine`; the
worked §7.4 comparison (multiplicative 10.8% vs additive WAR) becomes the bench pin
demonstrating the methodology change.

**Prerequisites.** Outcome quantities must be inputtable (the current schema has
scores, not quantities); shadow prices cited to named publications with vintages.
**Acceptance:** SROI is reproducible as TotalValue/Investment from visible components;
a small high-score investment and a large low-score one rank differently under WAR
than under the old multiplier, matching the §7.4 analysis; every shadow price displays
its source.

### 9.2 Evolution B — SROI report drafter with assumption transparency (LLM tier 2)

**What.** SROI reporting (Social Value International methodology) is fundamentally a
narrative-plus-assumptions exercise: every monetised outcome needs a stated proxy,
deadweight, and attribution judgement. Evolution B is a tool-calling drafter for
impact investors and development banks: "produce the SROI statement for our Social
Housing sleeve" calls Evolution A's `POST /score` per investment, assembles the
value map (outcome → quantity → shadow price → total), and drafts the Green
Book-aligned report section — with an assumptions annex the LLM generates from the
tool payload's shadow-price citations, and sensitivity ranges computed by re-calling
the tool at ±30% on the top proxies (mirroring the vc-impact §8.5 test) rather than
asserted.

**How.** Tier-2 stack: read-only tool schemas from the new endpoint; grounding corpus
is this Atlas page plus the shadow-price table's source documents embedded in
`llm_corpus_chunks`. The validator enforces that every £ value and ratio appears in a
tool response; deadweight/attribution judgements are flagged as analyst inputs, not
model outputs.

**Prerequisites (hard).** Evolution A end-to-end — drafting SROI statements from the
current random `socialRoi` field would put fabricated impact claims into stakeholder
reports; RBAC on portfolio data. **Acceptance:** each monetised line in a drafted
report traces to a tool call and cites a named shadow-price source; the sensitivity
annex derives from actual re-runs; asked for an SROI the engine hasn't computed, the
drafter refuses and lists required outcome inputs.
