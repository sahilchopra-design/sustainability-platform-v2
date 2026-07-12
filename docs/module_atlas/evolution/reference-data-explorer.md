## 9 · Future Evolution

### 9.1 Evolution A — The entity-matching cascade the guide already describes (analytics ladder: rung 1 → 2)

**What.** The module is genuinely real-data-grounded (§7.7): OWID CO₂/energy, CEDA, CBAM, SBTi, Big Climate Database via `ReferenceDataContext`, plus live `reference_data` endpoints (IRENA LCOE, CRREM pathways, grid EFs). Its gap is the guide's own headline: no LEI/ISIN/GICS entity-matching cascade, no corporate-action tracking, no computed Entity Match Rate — and `sbtiInCountry` uses a naive substring match on free-text location that a real entity-resolution layer would fix. With the GLEIF golden-source expansion complete platform-side (the silently-broken bulk ingester found and fixed; `entity_lei` now populated), Evolution A builds the matching layer this explorer promises.

**How.** (1) `POST /api/v1/reference-data/entity-match`: name/ISIN/LEI in → resolution cascade (exact LEI → ISIN via mapping → fuzzy name against `entity_lei` with score) → matched record with `match_tier`, mirroring the platform's existing GLEIF resolution pattern and the `entity_resolution` route's machinery (reuse, don't duplicate — §2.2 shows that route already exists platform-side). (2) Computed KPIs: `entities_with_LEI / total × 100` over any uploaded portfolio, making the guide's Entity Match Rate and GICS coverage real numbers. (3) Fix `sbtiInCountry` by resolving SBTi company names through the cascade to LEI-registered legal addresses. (4) Publish the CBAM `vulnerabilityIndex` methodology (weights are authored upstream and underivable from code, per §7.7) as a source-card annexe.

**Prerequisites.** GLEIF ingest kept fresh (scheduled); ISIN↔LEI mapping source (GLEIF publishes this mapping file freely). **Acceptance:** a 100-name test portfolio yields a match rate that recomputes from stored match tiers; SBTi country counts change measurably vs the substring method, with diffs explainable.

### 9.2 Evolution B — Data-provenance concierge (LLM tier 1 → 2)

**What.** This explorer is where analysts ask "can I trust this number?" — the right copilot is a provenance concierge: "which source should I use for Brazil's grid EF and how fresh is it?", "why do OWID and CEDA disagree on this country's intensity?" (the cross-source tab already juxtaposes them), "what does a CBAM vulnerability of 0.7 mean methodologically?" — grounded in the source catalogue, the per-source cards, and the published methodology annexes.

**How.** Tier 1: RAG over the Atlas record plus source-card metadata (provider, vintage, licence, record counts from `GET /reference-data/stats`); cross-source disagreement answers cite both sources' vintages and scope definitions rather than adjudicating truth. Tier 2: entity questions become `POST /entity-match` tool calls ("resolve these 15 counterparties and tell me which lack LEIs"), and freshness questions read live stats. The concierge is also the natural router for the desk-orchestration tier — other modules' copilots delegate "which reference table backs this?" here via the atlas interconnection graph.

**Prerequisites.** Source cards complete with vintage/licence fields; Evolution A for entity tooling. **Acceptance:** every source recommendation cites vintage and licence from the catalogue; unresolved entities are reported as unmatched with their best fuzzy candidates, never silently auto-matched.
