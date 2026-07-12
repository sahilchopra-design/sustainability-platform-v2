## 9 · Future Evolution

### 9.1 Evolution A — Economic-capital risk weights replacing the transition-score proxy (analytics ladder: rung 2 → 3)

**What.** §7 rates this module methodologically sound: risk attribution (`exposure·(100−score)/Σ`), revenue efficiency, and marginal-contribution analysis are genuine RAROC-style mathematics over hand-set (not seeded) LoB data. Its two documented limitations are the linear `(100−score)` risk-intensity proxy and the 6-LoB illustrative granularity. Evolution A upgrades the risk weight to an economic-capital basis: each LoB's risk contribution derives from RWA (the `LOBS` array already carries an `rwa` field that the attribution ignores) blended with a climate-stress delta, and the marginal-contribution tab computes marginal RWA rather than a score-weighted average shift.

**How.** (1) Recompute `riskContrib` as `EC_L/ΣEC` where `EC_L = rwa_L·capital_ratio·(1 + climate_stress_L)`, with the stress multiplier taken from the NGFS PD multipliers already codified in the sibling `fi-taxonomy-pcaf-bridge` module. (2) Efficiency becomes revenue share over EC share — true return-on-economic-capital ranking. (3) LoB data moves to a small backend table so the FI desk modules share one consistent book (same spine as the fi-client-portfolio-analyzer evolution), with LoB granularity extendable beyond 6.

**Prerequisites.** Agreement on a platform capital ratio constant (or org setting); shared FI data spine seeded (roadmap D0). **Acceptance:** attribution percentages recompute from RWA fields and sum to 100; the marginal tab's ΔEC for +$100M in a named LoB is hand-verifiable from the documented formula.

### 9.2 Evolution B — CRO allocation-review copilot (LLM tier 1)

**What.** A copilot for the quarterly business-review use case: "which LoB is the least efficient user of risk capacity and what would rebalancing look like?" It narrates the module's own computed surface — efficiency ranking, radar comparison, the `actions` list (score<60 or efficiency<1 triggers) — and explains the methodology honestly, including §7's caveat that intensity is proxy-based until Evolution A lands.

**How.** Tier-1 RAG copilot per the roadmap pattern: system prompt assembled from this atlas page (§5 formula, §7.1 derivations, §7.5 limitations are the grounding corpus), answering strictly from rendered page state plus the atlas text. Because the module's math is already genuine, this is one of the CT-sprint pages where a copilot ships credibly before any backend work — the exemplar's "first shippable slice is explanation-only" pattern applies directly. Cross-references (e.g. "concentration detail lives in fi-concentration-monitor") come from the atlas interconnection graph, not model memory.

**Prerequisites.** pgvector corpus embedding of this module's atlas record; no backend prerequisite for tier 1. **Acceptance:** on the bench_llm golden set for this module, every efficiency/contribution figure quoted matches the page's computed values, and the copilot correctly states that LoB data is illustrative hand-set demo data when asked about data provenance.
