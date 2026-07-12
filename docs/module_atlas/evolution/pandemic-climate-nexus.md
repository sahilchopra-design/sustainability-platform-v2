## 9 · Future Evolution

### 9.1 Evolution A — Build the compound-impact model over real spatial data (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide names a compound systemic-risk engine (`CompoundImpact = max(Pandemic, Climate) + Interaction_term × Correlation`), but no compound aggregation, correlation term, or portfolio double-hit P&L exists. The page renders a 40-country zoonotic-hazard table (deforestation, habitat fragmentation, wildlife trade, spillover risk — all `sr()`-seeded) plus a vector-borne-disease range projector (6 diseases × 3 RCP × 3 horizons, the one place with structured RCP×horizon dynamics, though still seeded). Evolution A builds the compound model and grounds the hazard drivers.

**How.** (1) Ground the zoonotic-hazard table in real data: deforestation/habitat-fragmentation from Global Forest Watch (joinable to the geographic layer), Global Health Security Index (a real published country index — replace the seeded `ghsIndex`), and wildlife-trade proxies from CITES/published datasets. (2) Implement the compound-impact formula the guide specifies: combine a pandemic-hazard score and a climate-hazard score (the latter available from the platform's physical-risk modules) with an interaction term, producing the compound systemic risk §1 describes. (3) Ground the vector-borne range projections in published disease-range-expansion models under RCP scenarios (IPCC AR6 WGII Ch.7, named in §5) rather than `sr()·popM` bands.

**Prerequisites.** GFW/GHS/disease-range data ingestion (mostly public; disease-range models are research-grade — document uncertainty per Atlas §8); cross-module wiring to physical-risk hazard scores. Remove `sr()` per platform rule. **Acceptance:** compound impact decomposes into pandemic, climate, and interaction terms; zoonotic drivers trace to GFW/GHS data; no `sr()` in hazard fields.

### 9.2 Evolution B — Compound-shock scenario copilot (LLM tier 1 → 2, scoped honestly)

**What.** Near-term, a One-Health/compound-risk guidance copilot grounded in the WHO Health & Climate, IPCC AR6 WGII Ch.7, and One Health HLEP references named in §5: "how does deforestation drive spillover?", "which regions face compound pandemic-climate risk?", "what's the One Health framework?" It must not quantify compound risk for the user's exposure until Evolution A exists, because today's country table and projections are seeded.

**How.** Tier 1 over the standards corpus (roadmap `llm_corpus_chunks`): the copilot explains the zoonotic-climate nexus, compound-event dynamics, and One Health integration with citations. System prompt encodes the honest current state so it refuses "quantify my portfolio's compound shock" with a pointer to the (post-Evolution-A) compound-impact endpoint — a hard refusal, since the current numbers are fabricated. Tier 2 with Evolution A: tool calls to the compound-impact and vector-range models, fabrication validator matching every score to outputs, provenance citing GFW/GHS/IPCC sources.

**Prerequisites.** Standards ingestion; explicit current-state statement. Quantification gated on Evolution A. **Acceptance:** framework answers cite named references; compound-risk quantification refuses until the engine exists, then traces to tool calls with source provenance.
