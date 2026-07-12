## 9 · Future Evolution

### 9.1 Evolution A — Ranked retrieval and a real dependency graph (analytics ladder: rung 1 → 3)

**What.** Replace the navigator's plain `String.includes()` substring match with genuinely ranked retrieval, and make the "dependency map" real. §7's mismatch flag is blunt: the guide's BM25 + BERT embeddings + Neo4j DAG and `relevance_score` formula do not exist — search is a five-field substring filter and sort is `localeCompare`. Yet the platform already owns the data a real version needs: the Module Atlas interconnection graph (§6 blast-radius edges, used by `GET /api/v1/module-nav/connections/{module_id}`) and `module_tags.json`.

**How.** (1) Implement BM25 over module labels, Atlas overviews, and tags server-side in `api/v1/routes/module_nav.py` — a small pure-Python scorer over the ~963-doc corpus, no new infrastructure; benchmark against the current substring match on a golden query set ("financed emissions", "flood risk pricing") where substring demonstrably fails. (2) When the Tier-1 copilot's pgvector corpus lands (roadmap D3), add embedding similarity as a re-ranker over BM25's top-50 — reusing `llm_corpus_chunks`, not standing up a separate vector store. (3) Surface the existing `connections` endpoint's edges in the search results ("modules that feed this one"), replacing the guide's fictional Neo4j with the Atlas edge list that already exists.

**Prerequisites.** The lineage sweep shows `favorites`/`recents`/`sectors`/`connections` GETs currently `failed` — likely auth-related; fix before layering ranking on top. **Acceptance:** golden-query set where BM25 ranks the intended module top-3 and substring match does not; ranking function unit-pinned.

### 9.2 Evolution B — Natural-language platform concierge (LLM tier 3 entry point)

**What.** The navigator is the natural front door for the roadmap's Desk Orchestrator: a chat box that turns "I need to assess a German utility counterparty's climate exposure" into a routed, ordered module itinerary — GLEIF resolve → physical-risk point profile → financed emissions → transition alignment — with one-click navigation into each, using `record_visit`/`favorites` (POST endpoints already exist) to persist the trail.

**How.** Routing knowledge is exactly what the roadmap §Tier-3 prescribes and this module already serves: `module_tags.json` sector taxonomy, the Atlas interconnection graph behind `/connections/{module_id}`, and the RBAC-filtered `accessibleGroups` (the copilot must only recommend modules the user's session can access — §7.1 shows `canAccess` filtering is already applied client-side; enforce it server-side in the recommendation endpoint too). First shippable slice is recommendation-only (tier 1: no execution, just ranked module cards with "why" text citing tags and connections); full tier 3 hands off to each module's own analyst.

**Prerequisites.** Evolution A's ranked retrieval (the concierge's candidate generator); fixed module-nav GET endpoints; copilot infrastructure from the roadmap's Phase 1. **Acceptance:** for 10 scripted personas/tasks, the recommended itinerary contains only RBAC-accessible modules and every recommendation carries a machine-checkable justification (tag match or graph edge), not free-text assertion.
