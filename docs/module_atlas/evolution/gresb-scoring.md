## 9 · Future Evolution

### 9.1 Evolution A — Real aspect data and the GRESB 30/70 weighting (analytics ladder: rung 1 → 2)

**What.** §7 documents a genuinely usable module: the total score is a real mean of 7 aspect scores (each 0–20, rescaled to 0–100), the default aspect scores are `sr()`-seeded but **user-overridable** with overrides persisting to localStorage, and the 19 peer-benchmark distributions are realistic GRESB 2024 figures driving genuine peer-relative ranking. The gap versus the guide is that the headline uses a flat mean of 7 aspects rather than the GRESB `0.3×Management + 0.7×Performance` weighting (Real Estate) or the Infrastructure custom weights. Evolution A implements the correct weighting and grounds the aspects: aggregate the 7 aspects into Management and Performance components weighted 30/70, and support importing real aspect scores from GRESB submissions rather than relying on seeded defaults.

**How.** (1) Map the 7 aspects into Management (policies/reporting/risk/stakeholder) and Performance (energy/water/waste/GHG/certifications) and compute `0.3·Mgmt + 0.7·Perf` for Real Estate, with the Infrastructure custom-weight variant. (2) An import path for real aspect scores (extending the existing override mechanism). (3) Keep the real 19-distribution peer benchmark for star rating and quartile rank.

**Prerequisites.** The aspect→component mapping; real aspect data (the override mechanism already supports it); the flat-mean replaced by the weighted formula. **Acceptance:** the total reproduces `0.3·Mgmt + 0.7·Perf` (not a flat 7-aspect mean); Infrastructure uses its custom weights; peer ranking uses the real distributions; user overrides flow into the weighted score.

### 9.2 Evolution B — GRESB submission-prep copilot (LLM tier 1 → 2)

**What.** A copilot for real-asset ESG teams: "given our aspect scores, what GRESB total and star rating do we get, and which aspect would most improve our peer ranking?" narrates the aspect structure and peer benchmarks from the atlas corpus, with tier-2 computing the weighted score and improvement levers via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (GRESB component structure, the 30/70 split, peer-relative star rating). Because the module supports real overrides and carries real benchmark distributions, a tier-1 explainer over user-entered scores ships early; the tier-2 upgrade adds the weighted computation and the "which aspect moves our quintile most" analysis. Every score and rank figure validated against tool output.

**Prerequisites.** Corpus embedding; Evolution A for the weighted formula. **Acceptance:** post-Evolution-A, every total/star/quartile figure traces to a tool call reproducing the GRESB weighting against the real peer distributions; the improvement-lever answer recomputes the ranking under the aspect change.
