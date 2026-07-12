## 9 · Future Evolution

### 9.1 Evolution A — Build the promised topic-level RMI on real DME scores (analytics ladder: rung 1 → 2)

**What.** The §7 flag is specific: the guide promises a Relative Materiality Index (`RMI = entity score / sector median × 100`) over topic-level materiality, but "no RMI, no topic-level materiality, and no water/digital-rights topics exist in the code." What actually runs is a legitimate five-dimension percentile composite (mid-rank empirical CDF over `GLOBAL_COMPANY_MASTER` sector cohorts) — real math, wrong model, with three honest defects: the governance dimension is a rescaled ESG score rather than a percentile, the MSCI/Sustainalytics/S&P ratings are synthetic mappings from the composite, and the trend line is `sRand()`-seeded. Evolution A implements the actual RMI server-side.

**How.** (1) New endpoint in the DME route family computing per-topic RMI from `dme-entity`/`dme-index` topic materiality scores, with cohort medians, P25/P75 bands, and the guide's 130/70 exposure/resilience flags. (2) Fix the composite's governance proxy by ranking a real governance input (board metrics exist in `esg-governance-scorer`). (3) Delete the synthetic third-party rating mappings — displaying fabricated "MSCI ratings" for named companies is a liability, not a feature; `esg-ratings-comparator` is the honest home for real ratings. (4) Persist score snapshots so the trend chart reads history instead of seeded deltas.

**Prerequisites.** DME topic-score persistence (shared with dme-alerts Evolution A); a documented sector-topic mapping (SASB Materiality Map is already the cited standard). **Acceptance:** RMI for a fixture entity reproduces the formula by hand against cohort medians; no `sRand()` in the rendered path; synthetic rating badges removed.

### 9.2 Evolution B — Competitive-positioning copilot for investor engagement prep (LLM tier 2)

**What.** The module's stated workflow ends with "export the competitive materiality report for strategy and investor engagement" — an LLM-native deliverable. A tool-calling analyst answers "where are we most exposed vs. peers and what should we pre-empt in the next investor ESG call?" by pulling the entity's RMI heat map, quartile position, and peer-distribution stats from Evolution A's endpoints, then drafting the positioning narrative with each claim pinned to a computed figure.

**How.** Tool surface = the new RMI endpoint plus the existing cohort/percentile computations promoted server-side; grounding corpus = this Atlas record's §5/§7 (the empirical-CDF percentile definition prevents the model mis-explaining ranks). Draft renders through the report-studio layer per the tier-3 output pattern. The validator enforces that every percentile, RMI value, and rank quoted matches a tool response; peer names come only from the cohort query, never from model memory (stale universes are a real hazard with a company master).

**Prerequisites (hard).** Evolution A — today the trend is seeded and the rating labels are synthetic, so a generated report would attribute invented ratings to real companies in an investor-facing document. **Acceptance:** a golden-fixture report contains zero numerics unmatched to tool outputs, and asking "what does MSCI rate us?" refuses with a pointer to the ratings-comparator module rather than echoing the removed synthetic mapping.
