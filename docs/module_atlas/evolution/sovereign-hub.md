## 9 · Future Evolution

### 9.1 Evolution A — A real six-dimension composite fed by the sibling sovereign engines (analytics ladder: rung 1 → 3)

**What.** The §7 flag shows the gap between promise and code: the hub advertises a "Composite Sovereign Risk Index" over six dimensions (climate, ESG, debt, physical, social, nature) but computes **only a portfolio-weighted mean of a single hand-typed `esg` field** — no six-dimension composite exists, and the in-page tooltip claiming `esg` is a live 40/30/30 aggregate is not reproducible from this file. The 41-country `COUNTRY_DATA` table is genuinely hand-curated with plausible real figures (Sweden $120/t carbon price, HDI 0.947), and it correctly uses `n = length` as the denominator (fixing the historical `/60` bug in the sibling family). Evolution A makes the hub the real aggregation node it claims to be.

**How.** (1) Wire the hub to the six sibling engines it names — pull the climate score from `sovereign-climate-risk`, ESG from the canonical `sovereign-esg` pipeline, debt from `sovereign-debt-sustainability`, physical from `sovereign-physical-risk`, nature from `sovereign-nature-risk`, social from the social index — and compute the `Σ(dimension × weight)` composite for real. (2) Replace the static `esg` literal and other hand-typed fields with live pulls, adding the data-vintage tags the deep-dive notes are absent. (3) Implement the "top-5 risk drivers per country" pillar attribution the workflow promises. (4) Fix the "40 nations" caption to match the 41 rows (or vice versa).

**Prerequisites.** The six sibling engines must expose consumable per-country scores (several are themselves tier-B; this hub's value depends on their Evolution-A work); the composite weights need documenting. **Acceptance:** the composite is a real weighted sum of six sourced dimensions; each dimension carries a source vintage; the top-5 driver attribution reflects the actual dimension contributions.

### 9.2 Evolution B — Master sovereign-risk desk orchestrator (LLM tier 3)

**What.** The hub is explicitly the "master sovereign risk dashboard" — the natural home for a desk-level orchestrator. Evolution B routes across the six sovereign modules to answer "give me a full risk profile for this sovereign", "which of my holdings face the worst combined climate-plus-debt risk", "build a sovereign-risk memo for the investment committee" — sequencing calls across the composed engines and synthesising a report-studio artifact.

**How.** Tier-3 pattern: the orchestrator uses `module_tags.json` and the sovereign-module interconnection graph to route (assess climate → ESG → debt → physical → nature → social), each call returning real engine output, composed into a memo with per-dimension provenance. Portfolio-level questions apply the AUM weights the hub already holds. Every figure carries its source engine and vintage; the six-dimension composite is asserted only when all dimensions resolve.

**Prerequisites (hard).** Evolution A — an orchestrator narrating a "six-dimension composite" that the hub computes from one ESG field would fabricate five-sixths of its own headline. **Acceptance:** every dimension score in a memo traces to a specific engine call; the composite appears only when all six dimensions are sourced; a sovereign missing a dimension is flagged, not silently averaged.
