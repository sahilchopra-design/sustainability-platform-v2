## 9 · Future Evolution

### 9.1 Evolution A — A computed SROI engine behind the curated bond universe (analytics ladder: rung 1 → 2)

**What.** The page's strength is unusual for the impact family: the 15-bond `BONDS` table is hand-authored from real instruments (Peterborough SIB, Educate Girls DIB, IFFIm Vaccine Bond) with no PRNG anywhere. Its limitation, per §7.5, is that SROI is *stored, not modelled* — there is no monetisation, discount rate, deadweight or attribution behind the 3.2×/5.8× ratios, and additionality is a single undecomposed 0–100 score. Evolution A builds the SROI Network calculation §7.5 itself specifies: `SROI = Σ(outcome × financial proxy × (1−deadweight) × attribution × (1−drop-off), discounted) / investment`, so an analyst can rebuild a bond's ratio from its evaluation inputs and stress it.

**How.** (1) A first backend vertical with tables for bond outcomomes (bond × outcome metric × period × actual/target), financial proxies with sources, and adjustment factors (deadweight/attribution/drop-off per SROI convention). (2) `POST /impact-bonds/sroi` computing the ratio with each adjustment exposed as a line item; the stored per-bond `sroi` values become reconciliation targets — computed Peterborough should land near its published 3.2× or the divergence be explained. (3) Additionality decomposed into enterprise vs investor additionality per the IMP framing the guide cites. (4) Seed the engine with published evaluation data for 3–4 of the best-documented bonds (Educate Girls has a public evaluation).

**Prerequisites.** Bond-level evaluation source documents gathered and cited (the §7.5 caveat — indicative snapshots — must be closed with citations, not code). **Acceptance:** a computed SROI decomposes into cited proxies and adjustments; changing the deadweight assumption moves the ratio deterministically; stored vs computed values reconciled per bond.

### 9.2 Evolution B — Impact-bond structuring copilot over the universe (LLM tier 1)

**What.** A copilot for outcome funders and structurers: "why did DC Water's EIB underperform (78/80)?", "what distinguishes a DIB from a SIB payment trigger?", "which health bonds beat target and what was their SROI basis?" The module's value is precisely curated institutional knowledge — the strongest possible tier-1 grounding corpus since every fact is already in the `BONDS` table and this Atlas page's §7.2/§7.4 walk-throughs.

**How.** Tier 1 RAG: atlas record plus the bond table into `llm_corpus_chunks`; the type filter state passes as context so "these bonds" resolves to the filtered set. Discipline rules: SROI figures must be quoted as stored indicative values with the §7.5 caveat until Evolution A ships; the copilot must not extrapolate SROI to bonds outside the 15-instrument universe, and refuses "what would a new recidivism SIB return?" until the computed engine exists to run it as a what-if. Post-Evolution-A, tier 2 upgrades enable exactly that structuring question: hypothetical bond parameters submitted to `/sroi` as a tool call.

**Prerequisites.** Copilot router + pgvector corpus (Phase 1). **Acceptance:** every bond fact traceable to a `BONDS` row; questions beyond the universe get an explicit scope refusal; post-Evolution-A what-ifs show the full adjustment-factor arithmetic from the tool response.
