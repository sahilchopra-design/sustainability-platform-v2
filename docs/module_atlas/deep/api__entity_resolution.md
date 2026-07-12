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
