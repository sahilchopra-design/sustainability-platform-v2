## 9 · Future Evolution

### 9.1 Evolution A — Build the Biodiversity Footprint Score over real ENCORE/IBAT data (analytics ladder: rung 1 → 3)

**What.** §7 is severe: `NatureHubPage.jsx` is 94 lines rendering 55 companies (names recycled cyclically past index 54) where all 12 numeric fields are *independent* `sr()` draws — no field derives from another, so the "Biodiversity vs Revenue at Risk" scatter plots two unrelated randoms. None of the promised BFS formula (`BFS = Σ Impact Driver × Ecosystem Sensitivity × Area`), ENCORE dependency matrix, IBAT overlay, or LEAP logic exists. Evolution A builds the module's first real analytical vertical.

**How.** (1) Stand up `POST /api/v1/nature-hub/bfs` computing the documented product from actual inputs: company operational footprint (area by biome), ENCORE impact-driver intensities per sector, and IUCN/IBAT-derived ecosystem sensitivity weights — the sibling `nature-capital-accounting` module already exposes `/ref/encore-dependencies`, so reuse that reference layer rather than duplicating it. (2) Replace the 55-row PRNG table with a computed screen where `biodivScore`, `habitatLoss`, and `dependency` are algebraically linked through the BFS decomposition, so cross-field charts become meaningful. (3) Sector-resolve the real company names via the GLEIF/OpenFIGI layer to attach ENCORE materiality ratings.

**Prerequisites.** This is effectively a greenfield backend — the current page has zero salvageable computation; ENCORE licensing/attribution for redistribution; IBAT spatial data access (IBAT is subscription-gated — scope to sensitivity weights derivable from open IUCN threat categories if IBAT access is unavailable). **Acceptance:** BFS reproduces from visible driver/sensitivity/area inputs; no `sr()` remains; the biodiversity-vs-revenue relationship reflects a real dependency, not two independent randoms.

### 9.2 Evolution B — TNFD-LEAP guidance copilot (LLM tier 1, scoped honestly)

**What.** Given the module has essentially no real computation today, the near-term LLM value is a framework-guidance copilot: it walks a user through the TNFD LEAP steps and explains what ENCORE, IBAT, SBTN, and GBS each contribute — grounded in the TNFD v1.1, SBTN, and ENCORE reference documents named in §5. It must not pretend to score the user's portfolio until Evolution A exists.

**How.** Tier 1 over the standards corpus (roadmap `llm_corpus_chunks`): the copilot answers "what does the Locate step require?", "which ecosystem services does the beverage sector depend on per ENCORE?", "how does BFS relate to SBTN Step 1 scoping?" with citations to the framework texts. The system prompt must encode the module's honest current state so the copilot refuses "score my companies" with a pointer to the (post-Evolution-A) BFS endpoint — a hard refusal path, because the page's existing scatter plots would otherwise invite the LLM to narrate noise as insight.

**Prerequisites.** Standards-text ingestion; explicit current-capability statement in the system prompt. Any portfolio-scoring behaviour is strictly gated on Evolution A. **Acceptance:** every framework answer cites a named reference; asking the copilot to interpret the current 55-company table's numbers yields a refusal explaining they are placeholder values.
