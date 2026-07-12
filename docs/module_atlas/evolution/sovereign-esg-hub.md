## 9 · Future Evolution

### 9.1 Evolution A — Consolidate onto one sovereign-ESG source of truth with decomposable pillars (analytics ladder: rung 1 → 3)

**What.** The §7 flag exposes a platform-level problem: this tier-B hub carries a single hand-typed `esgScore` per country (no E/S/G sub-fields), and its 61-country `COUNTRIES` table **disagrees with the sibling `sovereign-esg` module's `SOVEREIGN_DB`** for the same countries (Germany: 90 there, 82 here) — the platform has no single source of truth for sovereign ESG. The guide's `(E×0.35)+(S×0.35)+(G×0.30)` composite isn't implemented because no pillar sub-scores exist. Evolution A makes this hub consume a canonical scoring pipeline rather than maintain a third independent table.

**How.** (1) Adopt the more granular `sovereign-esg` 3-pillar structure as the platform's canonical sovereign-ESG engine (its §9.1 Evolution A builds the live WGI/EPI/HDI computation) and have this hub read from it — one dataset, one composite, ending the cross-module divergence the §7 flag documents. (2) Compute the `(E×0.35)+(S×0.35)+(G×0.30)` composite the guide promises from those real pillars, applying user weights. (3) Clarify the ambiguous `carbonRev` field's definition (the deep-dive notes its units are undocumented — fossil revenue? carbon-tax revenue?) or drop it. (4) Join `PORTFOLIO` positions to the canonical `COUNTRIES` table rather than re-typing a subset of fields.

**Prerequisites.** Depends on the canonical sovereign-ESG engine (build in `sovereign-esg` first, or a shared `sovereign_esg_engine`); `carbonRev` needs an SME definition. **Acceptance:** Germany shows one ESG score across both modules; the composite recomputes from E/S/G pillars under the active weights; the portfolio view joins to the canonical table.

### 9.2 Evolution B — Portfolio sovereign-ESG copilot (LLM tier 1)

**What.** A copilot for the sovereign-fixed-income PM: "what's my portfolio's weighted ESG exposure and which holdings drag it down?", "why does this sovereign score 82?", "flag concentration in low-governance issuers" — answered from the canonical pillar scores and the portfolio weights, decomposing the weighted composite into per-holding contributions.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-esg-hub/ask`, corpus = this Atlas record plus the canonical pillar definitions and framework notes (MSCI Sovereign ESG, WGI, HDI, ND-GAIN). Portfolio answers narrate the exposure-weighted composite and per-holding attribution; score explanations cite the E/S/G pillar drivers. Refusal for sovereigns outside coverage.

**Prerequisites (hard).** Evolution A's consolidation — a copilot narrating scores that differ from the sibling module for the same country would surface the platform's own inconsistency as an authoritative answer. **Acceptance:** every score cited matches the canonical engine; portfolio attribution sums to the weighted composite; a holding absent from the canonical table is flagged, not scored.
