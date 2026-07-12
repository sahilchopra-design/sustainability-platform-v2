## 9 · Future Evolution

### 9.1 Evolution A — Materiality-weighted SDG scoring on real holdings (analytics ladder: rung 1 → 2)

**What.** The page is currently a thin tier-B frontend module with no backend, no MODULE_GUIDES entry, and three fully synthetic `sr()` datasets (120 companies × 17 SDG scores, 60 bonds, a 17-row exposure table where `target` and `exposure` are independent random draws). Evolution A builds its first backend vertical and replaces the documented methodological flaw — `overallSDG` as a flat unweighted 17-goal mean — with a materiality-weighted composite plus a "do no significant harm" veto gate, the two features §7.6 explicitly notes real frameworks (SDG Impact Standards, PRI) require.

**How.** (1) New `sdg_alignment` router with `POST /score` and `GET /portfolio/{id}/sdg-exposure`, reading holdings from `portfolios_pg` (the populated table) rather than `genCompanies`. (2) A `ref_sdg_sector_materiality` reference table (sector × SDG weight matrix, sourced from SASB/SDG-Compass mappings) so an Energy company can no longer score randomly on SDG 6. (3) Add the missing "Negative" contribution category with a DNSH veto: any SDG scored Negative caps `overallSDG`. (4) Make `gap = target − exposure` real by persisting user-set strategic targets instead of the current independent `sr()` anchors.

**Prerequisites.** Sector taxonomy alignment with `module_tags.json`; a seeded materiality matrix (17 SDGs × ~11 GICS sectors). **Acceptance:** two companies in different sectors with identical raw scores produce different weighted composites; a Negative-flagged SDG demonstrably caps the headline score.

### 9.2 Evolution B — SDG methodology copilot with consistency screening (LLM tier 1)

**What.** A copilot that answers "why is this portfolio's SDG score 52?" and "is this bond's SDG tagging coherent?" from this Atlas page and the module's computed state. Its most useful near-term job is exposing the page's own documented gap: bond SDG tags and `useOfProceeds` categories are drawn from independent seeds, so the copilot can flag thematically inconsistent pairs (e.g. "Affordable Housing" proceeds tagged only SDG 14) — a screening judgment that is language-shaped and well-suited to an LLM, referencing ICMA Green/Social/Sustainability Bond Principles.

**How.** Tier-1 pattern: `POST /api/v1/copilot/sdg-alignment-engine/ask`, system prompt assembled from this Atlas record (§7.2 parameter table + §7.6 limitations are the grounding corpus), prompt-cached. The consistency screen runs as a structured pass over the bond list in page state, emitting per-bond coherent/incoherent verdicts with a one-line rationale citing the proceeds→SDG mapping in the ICMA framework.

**Prerequisites.** Honest labelling: until Evolution A lands, every answer must state that companies, bonds, and exposures are synthetic session-generated data. **Acceptance:** the copilot correctly explains the unweighted-mean limitation when asked how `overallSDG` is computed, and refuses to state real-world SDG performance for any named company.
