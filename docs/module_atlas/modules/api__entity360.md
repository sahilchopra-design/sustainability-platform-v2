# Api::Entity360
**Module ID:** `api::entity360` · **Route:** `/api/v1/entity360` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/entity360/profile` | `entity360_profile` | api/v1/routes/entity360.py |
| POST | `/api/v1/entity360/counterparty-master` | `counterparty_master` | api/v1/routes/entity360.py |
| GET | `/api/v1/entity360/ref/module-registry` | `ref_module_registry` | api/v1/routes/entity360.py |
| GET | `/api/v1/entity360/ref/entity-types` | `ref_entity_types` | api/v1/routes/entity360.py |
| GET | `/api/v1/entity360/ref/sectors` | `ref_sectors` | api/v1/routes/entity360.py |
| GET | `/api/v1/entity360/by-lei/{lei}` | `entity360_by_lei` | api/v1/routes/entity360.py |

### 2.3 Engine `entity360_engine` (services/entity360_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `Entity360Engine.build_profile` | entity_name, entity_id, entity_type, sector, reporting_year, module_data | Build a 360 profile from module outputs. |
| `Entity360Engine._build_risk_profile` | module_data | Aggregate risk scores across modules. |
| `Entity360Engine._build_esg_profile` | module_data | Build ESG summary from module outputs. |
| `Entity360Engine._assess_regulatory` | module_data | Assess regulatory framework status. |
| `Entity360Engine._generate_recommendations` | module_data, gaps, risk | Generate actionable recommendations. |
| `Entity360Engine.build_counterparty_master` | counterparties | Build a counterparty master from input records. |
| `Entity360Engine.get_module_registry` |  |  |
| `Entity360Engine.get_entity_types` |  |  |
| `Entity360Engine.get_sectors` |  |  |

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

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `DB` *(shared)*, `__future__` *(shared)*, `all` *(shared)*, `assessments`, `db` *(shared)*, `fastapi` *(shared)*, `investees`, `module` *(shared)*, `module_data`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/entity360/by-lei/{lei}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/entity360/ref/entity-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 7, 'item0_keys': ['id', 'label']}`

**GET /api/v1/entity360/ref/module-registry** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['carbon_calculator', 'climate_risk', 'ecl_calculator', 'pcaf_calculator', 'nature_risk', 'taxonomy_alignment', 'scenario_analysis', 'sfdr_pai', 'real_estate', 'supply_chain'], 'n_keys': 10}`

**GET /api/v1/entity360/ref/sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['energy', 'financials', 'industrials', 'technology', 'healthcare', 'consumer', 'real_estate', 'materials', 'transport', 'agriculture', 'utilities', 'telecom'], 'n_keys': 12}`

**POST /api/v1/entity360/counterparty-master** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/entity360/profile** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `entity360_engine` — extracted transformation lines:**
```python
completeness = (modules_available / total_modules * 100) if total_modules > 0 else 0
credit_score = min(credit_score * 1000, 100)  # PD to 0-100 scale
reg_risk = (100 - tax_aligned) if tax_aligned is not None else None
composite = sum(s * w for s, w in zip(scores, weights)) / total_w
avg_quality = sum(r.data_quality_score for r in records) / len(records) if records else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::entity_resolution` | engine:entity_resolution_service |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/entity360` wraps the **Entity 360 Engine** (`backend/services/entity360_engine.py`),
which assembles a single cross-module profile for any counterparty/investee/issuer: per-module
data availability and quality, a composite risk score, an ESG summary rating, regulatory-framework
status flags, and a counterparty-master deduplication service. It is an **aggregation and scoring
engine over other modules' outputs** — it computes no primary risk quantities itself. Headline
formulas quoted from code:

```
data_completeness = modules_with_data / 10 registry modules × 100
credit_score      = min(PD_1yr × 1000, 100)                # PD → 0–100 scale
reg_risk          = 100 − taxonomy_aligned_pct
composite         = Σ w_i·score_i / Σ w_i   over available scores
                    (w: credit 0.3, climate 0.3, nature 0.2, regulatory 0.2; default 50 if none)
ESG score         = 50 + 10·[GHG < 100k t] + 10·[intensity < 100] + 10·[taxonomy > 20%] + 10·[PAI flags ≤ 2]
```

### 7.2 Parameterisation / scoring rubrics

**Module registry** (`MODULE_REGISTRY`, `GET /ref/module-registry`): 10 platform modules with
expected output lists — carbon_calculator, climate_risk, ecl_calculator, pcaf_calculator,
nature_risk, taxonomy_alignment, scenario_analysis, sfdr_pai, real_estate, supply_chain. Module
data quality: provided/expected outputs ≥ 80% → high, ≥ 50% → medium, else low; none → gap.

| Rubric | Thresholds |
|---|---|
| Risk band | composite ≤ 25 low · ≤ 50 medium · ≤ 75 high · > 75 very_high |
| ESG rating | score ≥ 80 A · ≥ 60 B · ≥ 40 C · ≥ 20 D · else NR (baseline 50 ⇒ C minimum in practice) |
| EU Taxonomy status | aligned ≥ 20% · partially_aligned > 0 · else not_assessed |
| SFDR PAI status | compliant ≤ 3 flags · else review_needed |
| CSRD E1 / TCFD | "data_available" if carbon_calculator / climate_risk data present |

**Counterparty-master data quality score** (additive, capped 100 — synthetic rubric): LEI +30,
sector +20, ≥ 3 modules linked +30 (≥ 1 → +15), country +10, parent/group +10; "low quality"
< 50. Duplicates are detected by exact match on lower-cased, space-stripped names; the first ID
in each collision group becomes canonical.

All thresholds and weights are **platform design choices** (no cited external calibration); the
engine header references CSRD double-materiality entity scope, PCAF counterparty attribution and
EBA Pillar 3 counterparty credit risk as framing.

### 7.3 Calculation walkthrough

- **`POST /profile`** — caller supplies `module_data` (list of `{module_id, values}`); the engine
  walks the 10-module registry, scores availability/quality, builds the risk profile (only
  available scores enter the weighted average — weights renormalise over what is present), ESG
  profile, regulatory status map, gaps, and up to 6 recommendations (e.g. "High composite risk —
  initiate enhanced due diligence"; missing-module prompts; low-completeness warning at > 5 gaps).
- **`POST /counterparty-master`** — batch of counterparty records → quality-scored master list,
  name-collision duplicate groups, sector and entity-type distributions, average quality and
  low-quality count.
- **`GET /by-lei/{lei}`** — the DB-powered path: validates 20-char LEI, calls
  `EntityResolutionService.build_entity_graph(lei)` (the shared cross-module spine over GLEIF +
  module tables), infers name/sector/type from the best available record (FI record forces
  `entity_type="fi"`, energy record forces `sector="energy"`), maps the first PCAF investee and
  first ECL assessment into `module_data`, then runs `build_profile` (reporting year hardcoded
  2025) and attaches a `cross_module_graph` presence summary (module_count, per-domain booleans,
  asset/investee/assessment counts).
- **`GET /ref/entity-types`** (7 archetypes) and **`GET /ref/sectors`** (12-sector label map)
  expose the classification vocabularies.

### 7.4 Worked example

Profile request with three modules populated: `ecl_calculator {pd_1yr: 0.03, …}` (6/6 outputs),
`climate_risk {combined_risk_score: 62, …}` (2/4 outputs), `taxonomy_alignment
{taxonomy_aligned_pct: 15}` (1/4 outputs).

| Step | Computation | Result |
|---|---|---|
| Credit score | min(0.03 × 1000, 100) | 30.0 |
| Climate score | pass-through | 62.0 |
| Regulatory risk | 100 − 15 | 85.0 |
| Composite | (30×0.3 + 62×0.3 + 85×0.2)/(0.3+0.3+0.2) | **55.75 → "high"** |
| Completeness | 3/10 × 100 | 30% (7 gap records) |
| Module quality | ECL high (100%), climate medium (50%), taxonomy low (25%) | — |
| EU Taxonomy status | 0 < 15 < 20 | partially_aligned |
| ESG score | 50 + 0 + 0 + 0 + 10 (0 PAI flags ≤ 2) | 60 → **rating B** |

Note the ESG-rating subtlety visible here: with no `sfdr_pai` data, `pai_count_flagged` defaults
to 0, which *passes* the ≤ 2 test — absence of PAI data improves the rating.

### 7.5 Data provenance & limitations

- **No PRNG or seeded demo data** — the engine only rearranges caller- or DB-supplied values.
  The `by-lei` path reads real ingested registries (GLEIF LEI, module tables) via
  `EntityResolutionService`.
- The PD→score mapping (×1000, cap 100) makes 10% PD the "maximum risk" saturation point —
  a linear convenience, not a calibrated transform; likewise the 0.3/0.3/0.2/0.2 weights and the
  ±10-point ESG rubric are illustrative.
- The ESG rating rewards missing data twice: default composite 50 when nothing is available, and
  the PAI-flag default noted above. Consumers should read `data_completeness_pct` alongside the
  rating.
- `by-lei` currently maps only sparse fields (ECL total, PCAF outstanding amount + an
  `asset_class_code: 1.0` existence sentinel) into module_data — most of the graph arrives as
  presence booleans, so DB-driven profiles typically score "low" module quality by construction.
- Duplicate detection is exact-normalised-name only — no fuzzy matching, no LEI-based merge.

### 7.6 Framework alignment

- **GLEIF / ISO 17442:** LEI is the join key for the DB-powered profile, consistent with the
  platform-wide entity-resolution spine.
- **EU Taxonomy Art. 8:** the ≥ 20% alignment threshold used for "aligned" status loosely mirrors
  the ambition levels discussed for green-ratio benchmarks; real taxonomy reporting is
  KPI-specific (turnover/CapEx/OpEx), not a single percentage.
- **SFDR PAI regime:** PAI indicators are counted as "flags"; the ≤ 3 compliance heuristic is a
  monitoring convention, not an SFDR rule (SFDR mandates disclosure, not thresholds).
- **CSRD/ESRS E1 & TCFD/ISSB:** status flags indicate data-readiness for these disclosure
  frameworks rather than assessed compliance.
- **PCAF:** counterparty-level attribution outputs (financed emissions, attribution factor, DQS)
  are first-class registry citizens, reflecting PCAF's borrower/investee-level accounting unit.
- **BCBS 239 (in spirit):** the counterparty-master dedup + data-quality scoring addresses risk
  data aggregation hygiene, though no formal lineage requirements are implemented.

## 9 · Future Evolution

### 9.1 Evolution A — Fix the data-absence-rewards-rating bug and enrich the by-LEI graph (analytics ladder: rung 1 → 2)

**What.** The Entity 360 Engine — a cross-module aggregation/scoring layer: per-module data
availability/quality, a weighted composite risk score, an ESG summary, regulatory-status flags, and a
counterparty-master dedup service. No primary risk math of its own, no PRNG. §7.5 names two real
defects, not just simplifications: the **ESG rating rewards missing data twice** — the default
composite is 50 when nothing is available, and `pai_count_flagged` defaults to 0 which *passes* the
≤2 test, so absence of PAI data *improves* the rating (§7.4 shows this producing a spurious B); and
the `by-lei` path maps only **sparse fields** (ECL total, PCAF outstanding + an `asset_class_code:1.0`
sentinel), so DB-driven profiles score "low" module quality by construction. Also, duplicate detection
is exact-normalised-name only (no fuzzy/LEI merge). Evolution A fixes the data-absence-rewards-rating
logic and enriches the by-LEI graph mapping.

**How.** The ESG rubric penalises (or marks NR for) missing PAI/composite data instead of defaulting
to a passing value, and always reports `data_completeness_pct` beside the rating; `by-lei` maps the
full cross-module graph (not just presence booleans) so DB-driven profiles reflect real module quality;
counterparty-master dedup uses the sibling `entity_resolution_service`'s fuzzy + LEI matching (0.85
threshold) rather than exact-name only. Rung 2: the composite weights and PD→score transform get a
documented rationale, and sensitivity to the weighting is surfaced.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `GET /by-lei/{lei}` **failed** and
`POST /profile`, `/counterparty-master` **skipped**; the missing-data-rewards-rating bug is a
correctness fix. **Acceptance:** the §7.4 worked example (composite 55.75 "high") reproduces, but an
entity with no PAI/ESG data no longer scores B — it scores NR or is penalised with completeness shown;
a by-LEI profile reflects real module quality, not "low" by construction; dedup catches a fuzzy-name
duplicate; the endpoints pass the harness.

### 9.2 Entity-profile copilot orchestrating cross-module data (LLM tier 2 → 3)

**What.** Entity 360 is the platform's cross-module entity aggregator — a natural tier-3 orchestration
surface. A copilot answers "give me the 360 profile for this counterparty by LEI" (`/by-lei` →
composite risk, ESG rating, regulatory status, gaps, recommendations) and "build a counterparty master
from these records" (`/counterparty-master` → dedup, quality scores) — narrating real aggregated
output. At tier 3 it composes the underlying modules: resolve LEI → pull ECL, PCAF, taxonomy, nature
data → synthesise the profile with recommendations.

**How.** Tool schemas over the endpoints plus the shared `entity_resolution_service` graph; the module
registry and rubrics ground "what modules feed a 360 profile?" questions. The no-fabrication validator
checks every score, rating and completeness % against tool output; crucially the copilot must report
`data_completeness_pct` alongside any rating (per the §7.5 caveat) so a high rating on thin data is
never presented as confident. Composable with `entity_resolution`, `data_hub_catalog` and the
financed-emissions engines.

**Prerequisites.** Evolution A's rating-bug fix and enriched by-LEI graph (so narrated ratings are
trustworthy) and harness fixes; Atlas corpus embedded (roadmap D3). **Acceptance:** every figure cited
traces to an engine tool call; a profile answer always pairs the ESG rating with completeness; a
thin-data entity is not presented as a confident B; the composite matches `/profile` output.