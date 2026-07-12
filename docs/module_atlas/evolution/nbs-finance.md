## 9 · Future Evolution

### 9.1 Evolution A — Wire the IUCN/VCMI engine into the UI, retire the seeded scores (analytics ladder: rung 2 → 3)

**What.** §7's partial mismatch: this tier-A route has a real backend (`nbs_finance_engine.py`) implementing IUCN NbS Global Standard v2.0 (8 weighted criteria — criterion_1 weight 0.14, criterion_3 "Biodiversity Net Gain" 0.15), the VCMI Core Carbon Claims tiering, and GBF Target 2 alignment, reachable via `POST /assess` and `/blended-finance`. But the rendered page derives its IUCN scores, sequestration, price, and VCMI tier from the `seed()` PRNG (`IUCN score = seed(...)·range + floor`), not the engine. Evolution A connects them and grounds the carbon economics.

**How.** (1) Replace the seeded biome×project score generation with `POST /assess` calls — the engine's real `_iucn_composite` (8 weighted criteria) and `composite = Σ raw[k]·weights[k]` per §5's extracted lines, with tier assignment (Transformative/Effective/Adequate/Basic) computed server-side; the four reference GETs (`/ref/iucn-criteria`, `/ref/nbs-categories`, `/ref/gbf-target-2`, `/ref/vcmi-claims`, all `passed`) drive the input pickers. (2) Ground sequestration in IPCC Tier 2 land-use factors (`annual_seq = seq_rate × area_ha`, `creditable_seq = total_seq × (1−buffer)` per §5) rather than `seed()·8+2`. (3) Feed the engine's real credit volumes into the NbS-ROC formula so return-on-conservation reflects methodology, not randoms.

**Prerequisites.** `POST /assess` currently `failed` and `/blended-finance` `skipped` in the lineage sweep — fix the live errors and REQUIRE_AUTH POST gating first; blast radius is 46 modules (shared engine) so pin regression cases before edits. **Acceptance:** IUCN composite reproduces the engine's weighted sum; no `seed()` call remains in rendered scores; page matches direct `/assess` output.

### 9.2 Evolution B — Blended-finance structuring analyst (LLM tier 2)

**What.** A tool-calling analyst for conservation-fund and DFI users: "assess this mangrove project against IUCN GS v2.0, size a blended-finance structure with 30% first-loss grant, and give me the NbS-ROC" → orchestrates `/assess` (IUCN + VCMI + GBF) then `/blended-finance`, presenting a structuring memo where the tier, criteria gaps, credit volumes, and return are all engine outputs.

**How.** Tool schemas from the module's OpenAPI operations; system prompt from this Atlas page's §5 methodology plus the IUCN GS 2020 and Taskforce on Nature Markets references named in §5. The two-step composition (assess → structure) is the tier-2 value: the analyst explains which IUCN criteria scored low and how the blended structure de-risks them, with a "show work" trail of both calls (roadmap Tier-2 provenance UX). The no-fabrication validator matches every criterion score, credit volume, and ROC figure to a tool response; the engine's honest null-handling must surface as "insufficient data" rather than an invented score.

**Prerequisites (hard).** Evolution A — the copilot must drive the engine, not the seeded frontend; the `/assess` and `/blended-finance` endpoints must return 200s under auth. **Acceptance:** every number in a structuring memo traces to a named endpoint call; requesting assessment for an NbS category outside `/ref/nbs-categories` yields a refusal.
