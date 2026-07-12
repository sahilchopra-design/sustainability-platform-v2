## 9 · Future Evolution

### 9.1 Evolution A — Live WGI 6-dimension governance and full 80-country coverage (analytics ladder: rung 1 → 3)

**What.** This is one of the batch's most extensively researched hand-authored tables — `SOVEREIGN_DB` (no `sr()` anywhere) carries real macro, real ND-GAIN vulnerability/readiness sub-indices, genuine Climate Action Tracker 5-tier ratings, real CPI/press-freedom/rule-of-law/HDI/Gini values, and a composite verified as `(climate+social+governance)/3`. But two §7 gaps limit it: it covers **40 countries, not the 80** the guide claims, and the governance/climate/social pillar scores are **pre-computed constants embedded in the seed**, not calculated from sub-indicators — in particular the WGI 6 dimensions (Voice, Stability, Effectiveness, Regulatory, Rule of Law, Corruption) the guide names don't exist as separate fields. Evolution A computes the pillars from real sub-indicators and extends coverage.

**How.** (1) Ingest the actual WGI dataset (World Bank, free) and compute the governance pillar as the real 6-dimension average, exposing each sub-dimension — delivering the "WGI Dimensions tab" the guide promises. (2) Compute the environmental pillar from EPI + carbon intensity and the social pillar from HDI + Gini + social protection as the guide describes, rather than hand-typed constants — so the composite responds to real data updates. (3) Extend to 80 sovereigns (the guide's claim; WGI/EPI/ND-GAIN cover far more). (4) Preserve the genuinely-correct CAT rating integration and ND-GAIN two-axis structure. (5) Keep the custom-weights feature but apply it to computed pillars.

**Prerequisites.** WGI/EPI/HDI/Gini ingestion (all free public sources); the composite arithmetic already works, only the pillar inputs change. **Acceptance:** the WGI tab shows 6 computed sub-dimensions; changing a source indicator moves the pillar and composite; coverage reaches 80 countries.

### 9.2 Evolution B — Sovereign-ESG allocation copilot (LLM tier 1)

**What.** A copilot for the $5T+ sovereign-fixed-income use case the module targets: "rank my sovereign universe by ESG composite under a governance-tilted weighting", "why does this country score poorly on governance?", "which sovereigns fail a 1.5°C-compatible CAT screen for exclusion?" — answered from the computed pillars, the real CAT ratings, and the WGI sub-dimensions.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-esg/ask`, corpus = this Atlas record (the pillar structure, the composite formula, WGI/EPI/CAT framework notes) plus live page state including the user's custom weights. Governance explanations cite the specific WGI sub-dimension (post-Evolution-A); exclusion screens read the real CAT category; rankings narrate deterministic sorts under the chosen weights. Refusal for sovereigns outside coverage.

**Prerequisites.** Evolution A's computed pillars so governance explanations can cite real WGI sub-dimensions rather than a single opaque constant. **Acceptance:** every pillar/composite figure matches the page's computation under the active weights; governance explanations reference WGI sub-dimensions; a CAT-based screen uses the country's real tracker rating.
