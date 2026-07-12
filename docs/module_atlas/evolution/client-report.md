## 9 · Future Evolution

### 9.1 Evolution A — Real data binding with a computed completeness gate (analytics ladder: rung 1 → 2)

**What.** §7 is unambiguous: the guide sells an automated report engine (data-binding
layer, `Completeness = FilledSections/Total`, SFDR PAI auto-population of 18
indicators, <80% flags) but the code is a static preview studio rendering hard-coded
demo numbers (WACI 285, ITR 2.8°C, Scope 1/2/3 = 45.2/3.1/180 Mt) into toggleable
sections with five pre-written paragraphs. Evolution A builds the binding layer for
real: report sections declare their required data fields; a resolver pulls them from
the platform's portfolio-analytics endpoints for a selected `portfolios_pg` portfolio;
per-section completeness is computed from actually-resolved fields; and sections below
the 80% threshold render with an explicit data-gap panel instead of demo numbers.

**How.** (1) A binding manifest per section (e.g. TCFD Metrics section requires WACI,
scope totals, ITR; SFDR appendix requires the PAI indicator set) — the completeness
formula becomes real arithmetic over resolved vs required fields. (2) PAI table
populated from portfolio data where the platform computes those indicators, with
unpopulated indicators shown as honest gaps, never defaults — partial PAI coverage is
the true state and must be visible. (3) The hard-coded demo numbers survive only in an
explicitly-labelled "sample report" mode.

**Prerequisites.** Portfolio-analytics endpoint health (post the 2026-07-05 500-fix
sweep); a mapping audit of which PAI indicators the platform genuinely computes today
— the number is less than 18 and the module must say so. **Acceptance:** selecting a
real portfolio produces a report whose every figure matches its source endpoint;
completeness reflects removed data (unbind a field, watch the score drop); the
mismatch flag clears.

### 9.2 Evolution B — Grounded narrative generation (LLM tier 2)

**What.** Replace the five pre-written paragraphs with LLM-drafted, regulator-safe
narrative generated strictly from the bound data: "portfolio WACI of X is Y% above
benchmark, driven by the utilities allocation" — where X and Y come from the binding
layer, and the prose templates follow TCFD/SFDR/CSRD framing per the report type. This
is the roadmap's designated render-layer role for report modules, and the highest-
stakes no-fabrication surface on the platform: regulatory filings must contain zero
invented numbers.

**How.** Per-section generation with the section's bound fields as the only numeric
context; the post-response validator rejects any draft containing numerics absent from
the binding payload (hard fail, not a log line); framework-language templates from the
§5 standards corpus (SFDR RTS Annex I, ESRS Set 1, TCFD 2017); human review-and-edit
before export, with an audit trail of draft versions.

**Prerequisites (hard).** Evolution A is strictly first — narrative generation over
hard-coded demo numbers would automate the production of fictional regulatory
documents. **Acceptance:** 100% of numerics in generated narrative appear in the
binding payload (validator-enforced); a section with failed bindings generates a data-
gap disclosure, not prose that papers over it.
