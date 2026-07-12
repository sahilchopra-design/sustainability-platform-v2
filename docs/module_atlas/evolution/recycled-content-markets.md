## 9 · Future Evolution

### 9.1 Evolution A — Executable premium/gap formulas over disclosed buyer data (analytics ladder: rung 1 → 2)

**What.** The module's reference layer is unusually good — curated material/certification tables with three headline figures verifiably matching cited sources (ICIS, IAI, Textile Exchange) — but §7.7 flags two problems: buyer RC achievement/target figures are `sr()`-seeded yet attributed to 20 real named companies (a citation risk the atlas explicitly warns against), and no `RCVolume` field exists, so the guide's own `RC_Premium_Cost`, `Demand_Gap`, and `GHG_Saving` formulas cannot execute as written. Also the 2027 forecast is a flat ×1.4 factor inconsistent with each material's own 2024→2030 path. Evolution A adds the missing volume dimension and replaces the fabricated buyer figures with disclosed ones.

**How.** (1) Schema: per-buyer `rc_volume_tonnes` and per-material user-entered procurement volumes, enabling `POST /api/v1/recycled-content/premium-cost` computing `(recycledPrice − virginPrice) × volume`, the compliance gap vs PPWR 2030 mandates, and `GHG_Saving = volume × co2Saving` — three small, honest calculations. (2) Buyer table repopulated from public commitments (Ellen MacArthur Global Commitment progress reports publish exactly these RC-target/achieved figures for the named brands, annually and freely) with source-year stamps; seeded rows deleted. (3) The 2027 interpolation derived per-material from its own 2024→2030 CAGR. (4) Price history retained as curated reference with dates and source labels.

**Prerequisites.** EMF report ingestion (annual PDF/data release — modest parsing effort); volume-input UX for procurement users. **Acceptance:** a bench buyer's premium cost and PPWR gap reproduce by hand from its row; every buyer figure carries a source-year; the 2027 point lies on each material's own growth path.

### 9.2 Evolution B — Procurement sourcing copilot (LLM tier 1 → 2)

**What.** Brand procurement teams ask exactly the questions this module's tables answer jointly: "we need 12kt of food-grade rPET in EU — what premium should we budget, which certifications do customers recognize, and what does it save in CO₂?" The copilot composes material prices, certification scopes (GRS/ISCC+/RecyClass recognition matrix), and the new premium-cost endpoint into a sourcing brief.

**How.** Tier 1 ships on the curated reference tables (legitimately real content, unlike most B-tier siblings) via the standard copilot router, with the §7.7 caveat encoded: buyer-specific performance claims only from disclosed-source rows, never presented as insider knowledge of named brands. Tier 2 adds the `POST /premium-cost` tool call for volume-specific budgeting and PPWR-gap checks. Certification answers cite the specific standard's scope row (e.g. ISCC+ mass-balance for chemical recycling streams); regulatory answers cite PPWR articles from the corpus. Price answers always carry the price-series date — recycled-content spreads move with oil, as the module's own ICIS note explains, and the copilot must surface staleness.

**Prerequisites.** Evolution A for buyer data and volume math; PPWR text chunked. **Acceptance:** a sourcing brief's premium, gap, and CO₂ figures match endpoint output; every buyer claim carries its disclosure source; stale prices are flagged with their as-of date.
