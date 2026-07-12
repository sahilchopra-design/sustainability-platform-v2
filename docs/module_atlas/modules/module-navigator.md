# Platform Module Navigator
**Module ID:** `module-navigator` · **Route:** `/module-navigator` · **Tier:** A (backend vertical) · **EP code:** EP-NAV · **Sprint:** Platform

## 1 · Overview
Comprehensive navigation and discovery hub for all 745 platform modules, with full-text search, domain/sprint/status filtering, guided mode previews, recently viewed history, bookmarks, module dependency mapping, and related module recommendations. Acts as the central entry point for platform users discovering analytical capabilities.

> **Business value:** Used by all platform users — from first-time onboarders to power analysts — to discover relevant analytical modules, understand platform capabilities, and efficiently navigate the 745-module ecosystem.

**How an analyst works this module:**
- Search for modules by name, domain, topic, or standard
- Browse domain tree and filter by sprint, status, or data type
- View module dependency map to understand data flow prerequisites
- Bookmark frequently used modules and review recently visited history

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CompactTile`, `GridCard`, `GroupHeader`, `ItemGrid`, `ListRow`, `SPRINT_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `prefixes` | `Object.keys(SPRINT_COLORS).sort((a,b) => b.length - a.length);` |
| `accessibleGroups` | `useMemo(() => navGroups.map(g => ({ ...g, items: g.items.filter(i => canAccess(i.path)) })) .filter(g => g.items.length > 0), [navGroups, canAccess] );` |
| `allItems` | `useMemo(() => accessibleGroups.flatMap(g => g.items.map(item => ({ ...item, group: g.label, gIcon: g.icon, gColor: g.color, }))), [accessibleGroups]);` |
| `recentItems` | `useMemo(() => recent.slice(0,6).map(p => allItems.find(i => i.path === p)).filter(Boolean), [recent, allItems]);` |
| `badges` | `(item.badge\|\|'').split('·').map(s=>s.trim()).filter(Boolean);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/module-nav/favorites` | `list_favorites` | api/v1/routes/module_nav.py |
| POST | `/api/v1/module-nav/favorites` | `add_favorite` | api/v1/routes/module_nav.py |
| DELETE | `/api/v1/module-nav/favorites/{module_path:path}` | `remove_favorite` | api/v1/routes/module_nav.py |
| GET | `/api/v1/module-nav/recents` | `list_recents` | api/v1/routes/module_nav.py |
| POST | `/api/v1/module-nav/recents` | `record_visit` | api/v1/routes/module_nav.py |
| GET | `/api/v1/module-nav/sectors` | `get_sectors` | api/v1/routes/module_nav.py |
| GET | `/api/v1/module-nav/connections/{module_id}` | `get_connections` | api/v1/routes/module_nav.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `collections`, `db` *(shared)*, `fastapi` *(shared)*, `functools` *(shared)*, `pathlib` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*
**Shared context buses:** `AuthContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Module Coverage | `COUNT(routed_modules)` | App.js route registry | Full platform scope across 93+ domains; filtered by status (live/beta/planned) for production navigation. |
| Search Relevance Score | `BM25_score × semantic_similarity` | Module metadata corpus | Score >0.7 indicates strong match; used to rank top-10 results in search and recommendations. |
| Module Dependency Depth | `max_shortest_path_length in dependency DAG` | Module dependency graph | Deep dependency chains (>3 hops) indicate integration complexity; shown to users before enabling a module workflow. |
- **App.js route registry + module metadata store → searchable index** → BM25 + semantic retrieval → dependency graph traversal → recommendations → **Personalised module discovery experience with dependency-aware navigation**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/module-nav/connections/{module_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/module-nav/favorites** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/module-nav/recents** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/module-nav/sectors** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/module-nav/favorites** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**DELETE /api/v1/module-nav/favorites/{module_path:path}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/module-nav/recents** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Module Discovery & Dependency Mapping
**Headline formula:** `relevance_score = semantic_similarity(query, module_description) × status_weight × domain_weight`

Module discovery uses BM25 retrieval over module titles, descriptions, and tags for keyword search, supplemented by semantic similarity from BERT embeddings for conceptual queries. Dependency mapping tracks which modules consume each other's outputs (e.g., DMA feeds ESRS datapoint navigator; temperature score feeds portfolio analytics) using a directed graph that enables downstream impact analysis when data inputs change.

**Standards:** ['Platform module registry', 'Neo4j graph traversal (dependency DAG)', 'BM25 full-text retrieval']
**Reference documents:** Platform Architecture Documentation; App.js Route Registry; React Router v6 Navigation API

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **71** other module(s).

| Connected module | Shared via |
|---|---|
| `reference-data-explorer` | table:api, table:sqlalchemy |
| `credit-spread-climate-monitor` | table:api, table:sqlalchemy |
| `benchmark-analytics` | table:api, table:sqlalchemy |
| `real-estate-carbon-analytics` | table:api, table:sqlalchemy |
| `energy-transition-credit-portal` | table:functools, table:pathlib |
| `infra-debt-portfolio-manager` | table:functools, table:pathlib |
| `portfolio-stress-test-drilldown` | table:api |
| `portfolio-transition-alignment` | table:api |
| `portfolio-climate-pulse` | table:api |
| `portfolio-climate-var` | table:api |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes **BM25 full-text retrieval supplemented by
> BERT semantic-similarity embeddings**, a **Neo4j dependency DAG** for module data-lineage traversal,
> and a `relevance_score = semantic_similarity × status_weight × domain_weight` formula. **None of
> this exists.** Search is a plain case-insensitive `String.includes()` substring match across five
> fields; there is no embedding model, no graph database, no dependency edges, and no relevance
> scoring of any kind — results are either the raw filtered list or `Array.sort()` by label/code.
> Sections below document the (functionally solid, methodologically much simpler) navigator as built.

### 7.1 What the module computes

```js
// RBAC-filtered module list
accessibleGroups = navGroups.map(g => ({...g, items: g.items.filter(i => canAccess(i.path))}))
                            .filter(g => g.items.length > 0)
allItems = accessibleGroups.flatMap(g => g.items.map(item => ({...item, group: g.label, ...})))

// "Search" — plain substring match, no ranking
filtered = allItems.filter(i =>
  i.label.toLowerCase().includes(q) || (i.code||'').toLowerCase().includes(q) ||
  (i.badge||'').toLowerCase().includes(q) || i.group.toLowerCase().includes(q) ||
  i.path.toLowerCase().includes(q)
)
// Sort options: 'default' (registry order), 'alpha' (label.localeCompare), 'code' (code.localeCompare)
```

`sprintColor(code)` resolves a module's badge colour by finding the **longest matching prefix** in
`SPRINT_COLORS` (26 entries, e.g. `'EP-DA'`, `'EP-DB'`, …, generic `'EP-'` fallback) — sorted by
prefix length descending so `'EP-DA'` is checked before the shorter `'EP-'` catches it.

### 7.2 Parameterisation

| Structure | Value | Provenance |
|---|---|---|
| `SPRINT_COLORS` | 26 sprint-code prefixes → [text-colour, bg-colour] pairs | Hand-assigned per sprint for visual differentiation in the module grid — a real, useful piece of UI taxonomy, not a scoring mechanism |
| `navGroups` (prop, not shown here) | Passed from `App.js`'s route registry | The actual source of the "745/805 modules" count cited elsewhere in platform memory — this page consumes, not computes, that registry |
| Recently viewed | `localStorage['_nav_recent']`, sliced to 6 | Real client-side history, not a recommendation algorithm |
| Ctrl+K shortcut | `useCtrlK` hook, `(e.ctrlKey||e.metaKey) && e.key==='k'` | Genuine, standard command-palette keybinding wired to focus the search input |

### 7.3 Calculation walkthrough

1. **RBAC filtering** — `canAccess(item.path)` (from `AuthContext`) genuinely gates which modules
   appear per user role — a real, meaningful computation, not a placeholder.
2. **Search** — as `query` state changes, `filtered` recomputes via the five-field substring match
   above; no field is weighted more than another, and there is no fuzzy matching, tokenization, or
   stemming (e.g. searching "carbon" will not match a module titled "CO₂" unless "carbon" literally
   appears as a substring).
3. **Domain filter + sort** — straightforward `Array.filter`/`Array.sort` over `allItems`.
4. **Grouped default view** — when no query/domain-filter/sort is active, items render grouped by
   their originating `navGroups` label (i.e. the platform's existing nav-group taxonomy from `App.js`,
   not a computed clustering).
5. **Recent items** — `recentItems = recent.slice(0,6).map(p => allItems.find(i => i.path === p))`,
   a simple lookup-by-path over the last 6 visited paths stored in `localStorage`.

### 7.4 Worked example

Searching `"carbon"` (`q = "carbon"`): every module whose `label`, `code`, `badge`, `group`, or `path`
literally contains the substring "carbon" matches — e.g. "Carbon Credit Quality Engine"
(`label.includes('carbon')` after lowercasing → true) would match, but a module titled "CO₂ Emissions
Tracker" with no "carbon" substring anywhere in its metadata would **not** match, even though it is
conceptually the same topic — illustrating exactly the gap the guide's claimed BM25/semantic-similarity
approach would close.

### 7.5 Companion analytics

- **Sprint-prefix badge colouring** — genuinely useful, correctly implemented longest-prefix-match
  logic giving each of the platform's ~30+ sprints a visually distinct, consistent colour across the
  entire navigator.
- **Bookmarks** (referenced in guide) — not found implemented in the reviewed portion of this file;
  likely UI-only or absent.

### 7.6 Data provenance & limitations

- **No search ranking exists.** Results preserve registry order (or explicit alpha/code sort) — there
  is no relevance scoring, so a query matching many modules returns them in an order unrelated to
  likely user intent.
- **No dependency graph exists** in this file — "module dependency mapping" claims in the guide are
  not implemented here (the *content* of dependencies is separately, and genuinely, captured in
  `model-governance`'s `MODEL_DEPENDENCIES` array for its 15 quant models, but that is a different,
  much narrower structure than a platform-wide 745-module DAG).
- Substring search will produce false negatives for any query that doesn't share literal text with a
  module's label/code/badge/group/path (synonyms, related concepts, misspellings all fail silently).

**Framework alignment:** This module doesn't implement a named external framework — it is internal UX
tooling. The guide's citations (BM25, BERT embeddings, Neo4j) describe search/graph technologies that
would need to be built, not standards the module currently follows.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Upgrade the substring-match search to genuine relevance-ranked retrieval so users can find modules by
concept, not just exact label text, across the platform's 745+ module registry.

### 8.2 Conceptual approach
**BM25** (Robertson & Zaragoza 2009) over module titles/descriptions/tags is the industry-standard,
lightweight first step (used by Elasticsearch/Algolia-style in-app search) — cheaper and more
maintainable than the guide's proposed BERT embedding layer, and sufficient for a few hundred short
documents; add semantic embeddings only if substring/BM25 recall proves inadequate in practice.

### 8.3 Mathematical specification

```
BM25(q, d) = Σ_{t∈q} IDF(t) × [f(t,d)×(k1+1)] / [f(t,d) + k1×(1−b+b×|d|/avgdl)]
   IDF(t) = ln[(N − n(t) + 0.5) / (n(t) + 0.5) + 1]
   k1 ≈ 1.2–2.0 (term-frequency saturation), b ≈ 0.75 (length normalization) — standard defaults

relevance_score = BM25(q, module) × status_weight(module)     // e.g. down-weight 'planned' modules
```

| Parameter | Calibration source |
|---|---|
| k1, b | Standard BM25 defaults (Robertson & Zaragoza 2009); tune empirically on a small labelled query set |
| Document fields | title (highest weight), description, tags/acronyms, sprint code |
| status_weight | live=1.0, beta=0.8, planned=0.4 (deprioritise incomplete modules in default ranking) |

### 8.4 Data requirements
Module title/description/tag text already exists in `navGroups`/route metadata and in the
`MODULE_GUIDES` entries this very Atlas project is built from — no new data source needed, just an
indexing step (e.g. a small client-side inverted index built at build time, or a lightweight search
library like `lunr.js`/`flexsearch`).

### 8.5 Validation & benchmarking plan
Compile a small set of representative queries with expected top-3 modules (e.g. "carbon credits" →
`carbon-credit-quality`, `vcm-integrity`, `cc-*` family) and verify BM25 ranking places them above
substring-only matches; measure query latency to ensure client-side indexing stays sub-100ms for the
current module count.

### 8.6 Limitations & model risk
BM25 still won't catch true synonyms ("CO2" vs "carbon") without a synonym dictionary or embeddings;
if adopted, keep the synonym list small and hand-curated (climate/ESG domain terms) rather than
introducing a full embedding pipeline's operational complexity for a few-hundred-document corpus.

## 9 · Future Evolution

### 9.1 Evolution A — Ranked retrieval and a real dependency graph (analytics ladder: rung 1 → 3)

**What.** Replace the navigator's plain `String.includes()` substring match with genuinely ranked retrieval, and make the "dependency map" real. §7's mismatch flag is blunt: the guide's BM25 + BERT embeddings + Neo4j DAG and `relevance_score` formula do not exist — search is a five-field substring filter and sort is `localeCompare`. Yet the platform already owns the data a real version needs: the Module Atlas interconnection graph (§6 blast-radius edges, used by `GET /api/v1/module-nav/connections/{module_id}`) and `module_tags.json`.

**How.** (1) Implement BM25 over module labels, Atlas overviews, and tags server-side in `api/v1/routes/module_nav.py` — a small pure-Python scorer over the ~963-doc corpus, no new infrastructure; benchmark against the current substring match on a golden query set ("financed emissions", "flood risk pricing") where substring demonstrably fails. (2) When the Tier-1 copilot's pgvector corpus lands (roadmap D3), add embedding similarity as a re-ranker over BM25's top-50 — reusing `llm_corpus_chunks`, not standing up a separate vector store. (3) Surface the existing `connections` endpoint's edges in the search results ("modules that feed this one"), replacing the guide's fictional Neo4j with the Atlas edge list that already exists.

**Prerequisites.** The lineage sweep shows `favorites`/`recents`/`sectors`/`connections` GETs currently `failed` — likely auth-related; fix before layering ranking on top. **Acceptance:** golden-query set where BM25 ranks the intended module top-3 and substring match does not; ranking function unit-pinned.

### 9.2 Evolution B — Natural-language platform concierge (LLM tier 3 entry point)

**What.** The navigator is the natural front door for the roadmap's Desk Orchestrator: a chat box that turns "I need to assess a German utility counterparty's climate exposure" into a routed, ordered module itinerary — GLEIF resolve → physical-risk point profile → financed emissions → transition alignment — with one-click navigation into each, using `record_visit`/`favorites` (POST endpoints already exist) to persist the trail.

**How.** Routing knowledge is exactly what the roadmap §Tier-3 prescribes and this module already serves: `module_tags.json` sector taxonomy, the Atlas interconnection graph behind `/connections/{module_id}`, and the RBAC-filtered `accessibleGroups` (the copilot must only recommend modules the user's session can access — §7.1 shows `canAccess` filtering is already applied client-side; enforce it server-side in the recommendation endpoint too). First shippable slice is recommendation-only (tier 1: no execution, just ranked module cards with "why" text citing tags and connections); full tier 3 hands off to each module's own analyst.

**Prerequisites.** Evolution A's ranked retrieval (the concierge's candidate generator); fixed module-nav GET endpoints; copilot infrastructure from the roadmap's Phase 1. **Acceptance:** for 10 scripted personas/tasks, the recommended itinerary contains only RBAC-accessible modules and every recommendation carries a machine-checkable justification (tag match or graph edge), not free-text assertion.