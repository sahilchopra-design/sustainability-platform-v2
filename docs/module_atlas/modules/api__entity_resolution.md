# Api::Entity_Resolution
**Module ID:** `api::entity_resolution` · **Route:** `/api/v1/entity-resolution` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/entity-resolution/lei` | `search_lei` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/lei/{lei}` | `get_lei` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/sanctions` | `search_sanctions` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/sanctions/{sanction_id}` | `get_sanction` | api/v1/routes/entity_resolution.py |
| POST | `/api/v1/entity-resolution/screen` | `screen_entity` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/screening-results` | `list_screening_results` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/screening-results/{result_id}` | `get_screening_result` | api/v1/routes/entity_resolution.py |
| PUT | `/api/v1/entity-resolution/screening-results/{result_id}/review` | `review_screening_result` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/stats` | `entity_resolution_stats` | api/v1/routes/entity_resolution.py |
| POST | `/api/v1/entity-resolution/cross-module/resolve` | `cross_module_resolve` | api/v1/routes/entity_resolution.py |
| POST | `/api/v1/entity-resolution/cross-module/resolve/batch` | `cross_module_resolve_batch` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/cross-module/entity/{lei}` | `entity_graph` | api/v1/routes/entity_resolution.py |
| POST | `/api/v1/entity-resolution/cross-module/auto-link` | `auto_link_entities` | api/v1/routes/entity_resolution.py |

### 2.3 Engine `entity_resolution_service` (services/entity_resolution_service.py)
| Function | Args | Purpose |
|---|---|---|
| `normalise_name` | name | Lowercase, strip legal suffixes, collapse whitespace. |
| `fuzzy_score` | a, b | SequenceMatcher ratio on normalised names. |
| `EntityResolutionService.resolve_entity` | lei, name, isin | Find all records across modules that match the given identifiers. Priority: LEI > ISIN > fuzzy name. Self-healing live fallback: entity_lei (the "golden record" cache this resolver ultimately depends on for LEI/ISIN linkage) is only ever populated by the weekly bulk ingester (ingestion/gleif_ingester.py), which is capped at 10,000 records/run and does a blind, untargeted, country-filtered crawl -- |
| `EntityResolutionService._resolve_local` | lei, name, isin | Original resolve_entity() body: search ONLY the local entity_lei-linked tables (company_profiles, fi_entities, energy_entities, sc_entities, regulatory_entities, csrd_entity_registry, plus asset tables for LEI lookup). No live GLEIF call is made here -- that's resolve_entity()'s job. |
| `EntityResolutionService._live_gleif_fallback` | lei, name, isin | Live GLEIF lookup (by LEI, then ISIN, then fuzzy name completion) + immediate upsert into entity_lei + re-run of the local match. Reuses services/gleif_upsert.py's fetch+upsert helpers (the same ones behind gleif_graph.py's resolve-by-isin/resolve-by-bic endpoints) so this write path can never drift from the bulk ingester's schema mapping. Returns None if GLEIF has no match for any given identifie |
| `EntityResolutionService.build_entity_graph` | lei | Gather all cross-module data for an entity identified by LEI. Returns structured data ready for entity360_engine aggregation. |
| `EntityResolutionService.link_to_company_profile` | lei, name | Find or create a company_profiles record for the given LEI. Returns the company_profile UUID. |
| `EntityResolutionService.auto_link_unlinked` |  | Background job: scan all sector entity tables for records with LEI that don't yet have a company_profile_id, and link them. Returns counts of linked records per table. Requires migration 042 to have added company_profile_id columns to the sector entity tables listed below. |
| `EntityResolutionService.bulk_resolve` | records | Resolve a batch of records. Each dict may contain optional keys: ``lei``, ``name``, ``isin``. |
| `EntityResolutionService._find_by_lei` | lei |  |
| `EntityResolutionService._find_by_isin` | isin |  |
| `EntityResolutionService._find_by_fuzzy_name` | name | Scan entity master tables for names that fuzzy-match above threshold. Asset/investee tables are excluded to keep scan scope bounded. |

**Engine `entity_resolution_service` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_FUZZY_THRESHOLD` | `0.85` |
| `_LIVE_FALLBACK_THRESHOLD` | `0.5` |
| `_ENTITY_SOURCES` | `[{'table': 'company_profiles', 'id_col': 'id', 'lei_col': 'entity_lei', 'name_col': 'legal_name', 'isin_col': 'isin_primary'}, {'table': 'fi_entities', 'id_col': 'id', 'lei_col': 'lei', 'name_col': 'legal_name', 'isin_col': 'isin'}, {'table': 'energy_entities', 'id_col': 'id', 'lei_col': 'lei', 'nam` |
| `_ASSET_SOURCES` | `[{'table': 'assets_pg', 'id_col': 'id', 'lei_col': 'entity_lei', 'name_col': None}, {'table': 'pcaf_investees', 'id_col': 'id', 'lei_col': 'lei', 'name_col': 'investee_name'}, {'table': 'ecl_assessments', 'id_col': 'id', 'lei_col': 'legal_entity_identifier', 'name_col': 'borrower_name'}]` |

### 2.3 Engine `gleif_reference_registries` (services/gleif_reference_registries.py)
| Function | Args | Purpose |
|---|---|---|
| `_fetch_all_pages` | path | Paginate through a GLEIF code-list endpoint, collecting every page. |
| `_load_registry` | name, path | Return the cached {id: attributes} index for a registry, fetching (and re-caching for _REGISTRY_TTL) on first use or after expiry. |
| `_legal_forms` |  |  |
| `_registration_authorities` |  |  |
| `_jurisdictions` |  |  |
| `decode_legal_form` | code | {code, name, country} for a GLEIF Entity Legal Form (ELF) code. Returns {code, name: None, country: None} if the code is set but unknown to the registry (rather than raising), and None if code is blank. |
| `decode_registration_authority` | ra_id | {id, name, jurisdiction} for a GLEIF Registration Authority (RA) code. |
| `decode_jurisdiction` | code | Human-readable jurisdiction name for a GLEIF jurisdiction code. |

**Engine `gleif_reference_registries` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `GLEIF_BASE` | `'https://api.gleif.org/api/v1'` |
| `_HEADERS` | `{'Accept': 'application/vnd.api+json'}` |
| `_TIMEOUT` | `30` |
| `_PAGE_SIZE` | `200` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/entity-resolution/cross-module/entity/{lei}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/entity-resolution/lei** — status `passed`, provenance ['real-db'], source tables: `entity_lei`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/entity-resolution/lei/{lei}** — status `failed`, provenance ['db-empty'], source tables: `entity_lei`
Output: `None`

**GET /api/v1/entity-resolution/sanctions** — status `passed`, provenance ['real-db'], source tables: `entity_sanctions`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/entity-resolution/sanctions/{sanction_id}** — status `failed`, provenance ['db-empty'], source tables: `entity_sanctions`
Output: `None`

**GET /api/v1/entity-resolution/screening-results** — status `passed`, provenance ['real-db'], source tables: `entity_screening_results`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'results'], 'n_keys': 4}`

**GET /api/v1/entity-resolution/screening-results/{result_id}** — status `failed`, provenance ['db-empty'], source tables: `entity_screening_results`
Output: `None`

**GET /api/v1/entity-resolution/stats** — status `passed`, provenance ['real-db'], source tables: `entity_lei`, `entity_sanctions`, `entity_screening_results`
Output: `{'type': 'object', 'keys': ['lei_records', 'sanctions_entities', 'screening_results', 'pending_reviews', 'confirmed_matches'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic

**Engine `gleif_reference_registries` — extracted transformation lines:**
```python
_registry_cache[name] = (now + _REGISTRY_TTL, indexed)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::entity360` | engine:entity_resolution_service |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/entity-resolution` combines two related capabilities in one domain:

1. **Registry & sanctions data access + screening** (route-level logic over the ingested GLEIF
   LEI registry, an OpenSanctions-shaped sanctions table, and a screening-results audit table).
2. **Cross-module entity resolution** (`backend/services/entity_resolution_service.py`): resolves
   one real-world entity across the platform's siloed tables using a strict identifier waterfall —
   **LEI exact > ISIN exact > fuzzy name** — and assembles the full cross-module "entity graph"
   consumed by Entity 360.

Matching logic quoted from code:

```
LEI match   (len==20):  confidence = 1.0,  method = "lei"
ISIN match  (len==12):  confidence = 0.95, method = "isin"
Fuzzy name:             confidence = max SequenceMatcher.ratio(normalise(a), normalise(b))
                        accepted only if ratio ≥ 0.85 (_FUZZY_THRESHOLD), method = "fuzzy_name"
normalise(name): lowercase → strip legal suffixes (ltd|plc|inc|ag|sa|nv|bv|gmbh|se|…|group|
                 holdings|co|the) → strip punctuation → collapse whitespace
```

Sanctions screening (`POST /screen`, compliance role) uses a different, cheaper scorer
(`_simple_similarity`): exact match → 1.0; substring containment → `len(query)/len(target)`;
otherwise word-set overlap `|q∩t| / |q|`. Match method is recorded as `"ilike_substring"`.

### 7.2 Parameterisation / source-table registry

**Entity sources scanned** (`_ENTITY_SOURCES`): `company_profiles` (LEI col `entity_lei`, ISIN
`isin_primary`), `fi_entities`, `energy_entities`, `sc_entities` (no ISIN), `regulatory_entities`
(no ISIN), `csrd_entity_registry`. **Asset sources** (`_ASSET_SOURCES`, LEI-only lookups):
`assets_pg` (`entity_lei`), `pcaf_investees` (`lei`), `ecl_assessments`
(`legal_entity_identifier`). Fuzzy scans cover only the six entity masters — asset tables are
excluded "to keep scan scope bounded".

| Constant | Value | Provenance |
|---|---|---|
| `_FUZZY_THRESHOLD` | 0.85 | Platform choice (SequenceMatcher ratio) |
| LEI length gate | 20 chars | ISO 17442 |
| ISIN length gate | 12 chars | ISO 6166 |
| ISIN confidence | 0.95 | Heuristic (security-level id can map to multiple listings/issuers) |
| Screening statuses | pending, confirmed_match, false_positive, pending_review, escalated | Case-management vocabulary |

### 7.3 Calculation walkthrough / API surface

- **`GET /lei` / `GET /lei/{lei}`** — search the ingested GLEIF registry (name ILIKE,
  jurisdiction, status) and fetch single records exposing GLEIF Level-1/Level-2 fields incl.
  `direct_parent_lei` / `ultimate_parent_lei` and managing LOU.
- **`GET /sanctions` / `GET /sanctions/{id}`** — search the OpenSanctions-shaped table (caption
  ILIKE, schema_type Person/Company/LegalEntity, datasets such as `us_ofac_sdn`, `eu_fsf`);
  records expose names/aliases, nationalities, identifiers, sanction programs, topics and an
  optional LEI.
- **`POST /screen`** (compliance role) — ILIKE substring search of the caption, up to 20 matches;
  each match is persisted as an `EntityScreeningResult` (score, method, matched caption/schema/
  datasets, status `pending`, optional portfolio/asset linkage) — an auditable screening trail.
  **`PUT /screening-results/{id}/review`** transitions status (allowed set above), stamping
  `reviewed_by` (user email) and `reviewed_at` — the human-in-the-loop disposition step.
- **`GET /screening-results[ /{id}]`** — case queue with status/portfolio filters;
  **`GET /stats`** — LEI/sanctions/screening counts plus pending and confirmed tallies.
- **`POST /cross-module/resolve[ /batch]`** — the waterfall resolver; returns match method,
  confidence, canonical name (first linked record's name), company_profile_id and all linked
  records `(table, id, lei, name, isin)`.
- **`GET /cross-module/entity/{lei}`** — `build_entity_graph`: one row each from the six entity
  masters plus all portfolio assets, PCAF investees and ECL assessments for the LEI, with a
  `module_count` (counts the five sector masters, not company_profiles).
- **`POST /cross-module/auto-link`** (admin) — background linker: for each sector table having a
  `company_profile_id` column (migration 042), finds LEI-bearing unlinked rows, finds-or-creates
  a minimal `company_profiles` record (`data_source='auto_resolution'`), and writes the FK back;
  returns per-table linked counts.

### 7.4 Worked example (fuzzy resolution)

`resolve_entity(name="Ørsted A/S")` with a stored master name "Orsted":

| Step | Computation | Result |
|---|---|---|
| Normalise input | lowercase, strip suffixes/punct | "ørsted as" → punctuation stripped → "ørsted as" |
| Normalise target | "orsted" | "orsted" |
| SequenceMatcher ratio | similarity of the two strings | ≈ 0.71 → **below 0.85, no match** |
| With LEI supplied | `W9NG6WMZIYEU8VEDOG48` (20 chars) exact hit | confidence 1.0, method "lei", all tables linked |

The example shows the design intent: fuzzy matching is a conservative fallback (diacritics and
"A/S" — a suffix not in the strip list — depress scores), while LEI is the canonical join key.
Screening scorer contrast: query "gazprom" vs caption "PJSC GAZPROM" → substring hit, score
7/12 = **0.583**, persisted as a pending case.

### 7.5 Data provenance & limitations

- **Real ingested registries, no PRNG**: GLEIF LEI records and an OpenSanctions-style
  consolidated sanctions feed (datasets like OFAC SDN, EU FSF) are read from Postgres; screening
  results are user-generated audit rows.
- The screening matcher is **substring/word-overlap only** — no phonetics (Soundex/Metaphone),
  no transliteration, no alias-field search (it queries `caption` only, though `names` aliases
  are stored), and no score threshold before persisting; production sanctions screening
  (e.g. OFAC's own matcher) uses weighted fuzzy algorithms across all name forms.
- `_simple_similarity` penalises long captions (a correct short-name hit inside a long caption
  scores low) and ignores word order.
- Fuzzy resolution loads **all rows** of each master table per call (full scan, Python-side
  scoring) — bounded only by table size; fine at seeded scale, not indexed for production.
- `module_count` excludes `company_profiles`, so an entity present only there reports 0 modules.
- Legal-suffix stripping list is Western-Europe-centric (no "A/S", "KK", "OOO", etc.).

### 7.6 Framework alignment

- **GLEIF / ISO 17442 (LEI):** exact-match primary key including Level-2 parent relationships
  (direct/ultimate parent LEI) — the "who is who / who owns whom" backbone GLEIF publishes.
- **ISO 6166 (ISIN):** security-level secondary identifier, correctly de-prioritised below LEI.
- **OpenSanctions data model (FollowTheMoney schema):** `schema_type`, `caption`, `datasets`,
  `topics` fields mirror the OpenSanctions consolidated-entity export; datasets referenced
  include OFAC SDN and the EU Financial Sanctions Files.
- **AML/CFT screening practice (FATF Rec. 1/10 spirit, OFAC/EU list screening):** the
  screen → pending → human review (confirmed/false-positive/escalated) workflow with reviewer
  identity and timestamps implements the audit-trail expectations of sanctions-compliance
  programmes, albeit with simplified matching.
- **BCBS 239 (risk data aggregation):** LEI-keyed auto-linking of siloed sector tables into a
  single `company_profiles` spine is the platform's practical implementation of "single view of
  counterparty".

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