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
