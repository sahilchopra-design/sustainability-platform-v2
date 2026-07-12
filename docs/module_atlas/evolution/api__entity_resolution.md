## 9 · Future Evolution

### 9.1 Evolution A — Weighted fuzzy screening, SQL-side scoring, and a scaled GLEIF golden source (analytics ladder: rung 1 → 3)

**What.** The platform's entity-resolution spine: registry/sanctions access, a screen→review audit
workflow, and a cross-module resolver on a strict LEI > ISIN > fuzzy-name waterfall — real ingested
GLEIF/OpenSanctions data, no PRNG. §7.5 names the real limitations: the sanctions screening matcher is
**substring/word-overlap only** (no phonetics, transliteration, or alias-field search — it queries
`caption` only despite storing aliases, and persists with no score threshold), which is well below
OFAC-grade fuzzy matching; fuzzy resolution loads **all rows per call** (full Python-side scan,
unindexed); the legal-suffix strip list is **Western-Europe-centric** (misses "A/S", "KK", "OOO" — the
§7.4 Ørsted example fails at 0.71); and `module_count` excludes `company_profiles`. Critically, the
docstring itself flags the **golden-source weakness**: `entity_lei` is populated only by a weekly bulk
ingester capped at 10,000 records/run doing a blind country-filtered crawl (memory confirms this was a
silently-broken ingester found and fixed). Evolution A adds weighted fuzzy screening, SQL-side scoring,
a broader suffix list, and a targeted GLEIF golden-source strategy.

**How.** Screening uses a weighted fuzzy algorithm across all name/alias forms (Jaro-Winkler +
phonetics) with a persist threshold; fuzzy resolution pushes scoring into SQL (trigram/pg_trgm indexes)
instead of full scans; the suffix-normalisation list is internationalised; the GLEIF golden source is
populated by a **targeted** resolver (the self-healing live GLEIF fallback already exists —
`_live_gleif_fallback` upserts on demand) rather than relying on the capped blind crawl. Rung 3:
calibrate the fuzzy/screening thresholds against a labelled match set.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `GET /lei/{lei}`, `/sanctions/{id}`,
`/screening-results/{id}`, and `/cross-module/entity/{lei}` all **failed** (db-empty / lookup); the
capped bulk ingester is the documented golden-source bottleneck. **Acceptance:** the §7.4 Ørsted case
resolves via an internationalised suffix list or the live GLEIF fallback; a sanctions screen uses
weighted fuzzy matching across aliases with a persist threshold; fuzzy resolution uses a SQL index;
the detail endpoints pass the harness.

### 9.2 Entity-resolution and sanctions-screening tool for the desk orchestrators (LLM tier 2)

**What.** This is the platform's counterparty-identity backbone — its LLM role is the **resolution and
screening tool** every desk copilot calls: "resolve this entity across our data" (`/cross-module/
resolve` → LEI/ISIN/fuzzy match with confidence), "screen this counterparty against sanctions"
(`/screen` → matches persisted as reviewable cases), "who owns whom?" (`/lei/{lei}` Level-2 parent
graph). It is the tier-3 orchestrator's first step ("assess this counterparty → GLEIF resolve →
sanctions screen → …").

**How.** Tool schemas over the resolve/screen/registry endpoints; screening writes are audit-logged and
land as `pending` cases requiring human review (the disposition workflow — confirmed/false-positive/
escalated — inherits the compliance-role RBAC). The no-fabrication validator ensures any match, LEI or
sanctions hit a copilot cites traces to a tool call with its confidence and method (`lei`/`isin`/
`fuzzy_name`/`ilike_substring`); sanctions matches are always surfaced as screening candidates for human
review, never as adjudicated KYC.

**Prerequisites (hard).** Evolution A's weighted screening and scaled golden source (substring matching
is too weak to back tool-driven sanctions screening); harness fixes; Atlas corpus embedded (roadmap
D3). **Acceptance:** every match cited carries its confidence and method; a sanctions screen produces
reviewable pending cases, never an auto-confirmed hit; a resolution answer distinguishes an exact-LEI
match from a fuzzy-name candidate.
