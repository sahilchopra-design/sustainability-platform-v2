## 9 · Future Evolution

### 9.1 Evolution A — Real loan-book GAR over an issuer taxonomy-disclosure feed (analytics ladder: rung 1 → 2)

**What.** §7 gives this module unusual credit: the cascading eligibility → DNSH → minimum-safeguards → alignment logic is a genuine, correctly-structured implementation of the EU Taxonomy GAR methodology over 30 real NACE activity codes tagged with Climate Delegated Act technical screening criteria — a real model, unlike most B-tier peers. Its limitation is data: the 80 loan positions are `sr()`-seeded (borrower names are real listed companies used as labels only). Evolution A feeds the correct engine real data: replace the synthetic loan book with actual credit exposures joined to issuer-level taxonomy-alignment disclosures (CSRD Article 8 reporting), so the numerator (aligned exposures) and denominator (total covered assets minus trading/interbank/sovereign) are computed from a real book, and the 2024/2026 phase-in exemptions apply correctly.

**How.** (1) Wire the loan positions to the platform's credit exposure store (the shared FI loan tape) with per-borrower NACE codes. (2) Pull issuer taxonomy-alignment percentages from CSRD disclosures where available, with the DNSH/safeguards cascade applied per the existing correct logic. (3) The covered-asset denominator computed from the balance sheet per the EBA GAR definition, with phase-in flags.

**Prerequisites.** Real credit exposures with NACE tagging (shared FI spine, D0 demo acceptable); issuer taxonomy-disclosure data. **Acceptance:** the GAR recomputes from a real loan book reproducing the numerator/denominator definitions; the DNSH/safeguards cascade runs on sourced alignment data; no `sr()` position feeds the ratio.

### 9.2 Evolution B — GAR disclosure copilot (LLM tier 2)

**What.** A copilot for bank sustainability teams: "what's our GAR, which exposures are dragging it, and what would aligning our top-10 non-aligned borrowers do?" tool-calls the Evolution A GAR endpoint, decomposes the ratio by activity/borrower, and drafts the EBA Pillar 3 GAR disclosure with the phase-in caveats.

**How.** Tier-2 tool-calling over the GAR/decomposition endpoints; the grounding corpus is §5/§7, which correctly encode the EU Taxonomy GAR methodology, the covered-asset definition, and the transitional timeline. The copilot's value is disclosure-drafting plus the improvement-lever analysis (which borrowers' alignment would move the ratio most). Every percentage validated against tool output; because this is regulator-facing, the fabrication guard is strict.

**Prerequisites.** Evolution A (the copilot must narrate a real loan book, not seeded positions); RBAC-scoped exposures. **Acceptance:** every GAR figure in a disclosure draft traces to a tool call; the improvement-lever answer reproduces the recomputed GAR when the named borrowers are aligned; the phase-in exemption is stated correctly.
