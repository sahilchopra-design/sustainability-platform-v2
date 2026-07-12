## 9 · Future Evolution

### 9.1 Evolution A — Parameterised pitch over any portfolio, not just Nifty-50 (analytics ladder: rung 1 → 2)

**What.** §7 shows this is a presentation layer in good standing: a 10-section
printable India/Nifty-50 pitch over the real `indiaDataset.js` (NIFTY_50, CBAM
exposure, sector emissions, climate targets) plus `runIndiaEngines()`, with genuine
portfolio-KPI aggregation (WACI, scope totals, avgESG/ITR) — no guide↔code mismatch
because there is no guide. Its limitation is hard-coupling: one country, one index,
one dataset file. Evolution A generalises the deck into a parameterised pitch
generator: portfolio selector wired to `portfolios_pg` (the platform's populated
portfolio table), the same KPI aggregation computed over any holdings set, and the
scenario stress panel driven by the platform's NGFS scenario data rather than the
fixed multiplier — so the India deck becomes one instance of a reusable client-pitch
engine.

**How.** (1) Extract `portfolioKpis` into a shared utility taking any holdings array
with mcap/scopes/scores fields; the WACI formula (`(S1+S2)/mcap`) is already correct
and portable. (2) Section templates keep their India specialisations behind a
country-profile prop, with graceful omission (honest-nulls) when a dataset lacks CBAM
or targets equivalents. (3) Print-fidelity regression: the current Nifty-50 output
must render pixel-identical as the golden case.

**Prerequisites.** Portfolio holdings need the ESG/ITR/transition fields the KPI block
expects — gaps rendered as "—", never imputed; `runIndiaEngines()` clearly scoped as
India-only. **Acceptance:** selecting a `portfolios_pg` portfolio produces a complete
deck whose WACI reconciles to the platform's portfolio-analytics module for the same
holdings; the India golden case is unchanged.

### 9.2 Evolution B — Pitch narrative co-writer (LLM tier 2 → 3)

**What.** The deck's prose sections are where an LLM belongs: a co-writer that drafts
section narratives ("India transition story", "portfolio positioning") strictly from
the numbers the page has already computed — the KPI aggregates, sector rollups,
Paris-pathway overlay, and scenario stress outputs on screen — with per-client tone
controls. This is the roadmap's tier-3 render pattern in miniature: engine-sourced
numbers, LLM-drafted connective prose, report-studio-quality output.

**How.** Page state (all computed aggregates plus the dataset's cited constants)
passed as structured context; the no-fabrication validator is essential here because
pitch prose invites embellishment — every figure in generated text must match the
page's computed values, and claims about India policy must cite the dataset's
provenance fields. Draft-review-accept flow: the human keeps authorship, the LLM
proposes.

**Prerequisites.** Evolution A's generalisation multiplies the value but is not
blocking — the India deck's numbers are real today. A style corpus (2–3 approved past
pitches) for tone grounding. **Acceptance:** a generated section contains zero
numerics absent from page state; regenerating with a different tone changes prose but
not one number.
