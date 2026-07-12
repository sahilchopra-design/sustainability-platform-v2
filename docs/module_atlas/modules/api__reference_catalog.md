# Api::Reference_Catalog
**Module ID:** `api::reference_catalog` · **Route:** `/api/v1/reference-catalog` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/reference-catalog/` | `catalog` | api/v1/routes/reference_catalog.py |
| GET | `/api/v1/reference-catalog/domains` | `domains` | api/v1/routes/reference_catalog.py |
| GET | `/api/v1/reference-catalog/gaps` | `gaps` | api/v1/routes/reference_catalog.py |
| GET | `/api/v1/reference-catalog/module/{module_id}` | `module_reference_data` | api/v1/routes/reference_catalog.py |
| GET | `/api/v1/reference-catalog/dataset/{data_id}` | `dataset_detail` | api/v1/routes/reference_catalog.py |

### 2.3 Engine `reference_data_catalog` (services/reference_data_catalog.py)
| Function | Args | Purpose |
|---|---|---|
| `ReferenceDataCatalogEngine._build_module_usage` |  | Map each dataset to consuming modules (from lineage signatures). |
| `ReferenceDataCatalogEngine.get_catalog` | domain, include_missing | Get the full reference data catalog. Parameters: domain: Filter by domain (e.g., "emission_factors") include_missing: Include datasets with status "missing" Returns: ReferenceCatalogResult with all entries, domain summaries, and gaps |
| `ReferenceDataCatalogEngine.get_module_reference_data` | module_id | Get reference data used by a specific module. Parameters: module_id: Module identifier Returns: List of CatalogEntry for datasets used by the module |
| `ReferenceDataCatalogEngine.find_gaps` |  | Identify missing and stale reference datasets. Returns: GapReport with prioritized remediation actions |
| `ReferenceDataCatalogEngine.get_domains` |  | Get all reference data domains. |
| `ReferenceDataCatalogEngine.get_dataset` | data_id | Get a single dataset entry by ID. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/reference-catalog/** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_datasets', 'embedded_count', 'seed_data_count', 'missing_count', 'stale_count', 'coverage_pct', 'entries', 'domains', 'missing_critical', 'recommendations'], 'n_keys': 10}`

**GET /api/v1/reference-catalog/dataset/{data_id}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['error'], 'n_keys': 1}`

**GET /api/v1/reference-catalog/domains** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['emission_factors', 'financial_parameters', 'regulatory', 'sector_benchmarks', 'geographic', 'entity_master', 'insurance', 'agriculture', 'nature'], 'n_keys': 9}`

**GET /api/v1/reference-catalog/gaps** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_missing', 'total_stale', 'gaps', 'remediation_priority', 'estimated_effort'], 'n_keys': 5}`

**GET /api/v1/reference-catalog/module/{module_id}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['module_id', 'reference_data', 'total'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic

**Engine `reference_data_catalog` — extracted transformation lines:**
```python
available = embedded + seed
coverage = (available / total * 100) if total > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/reference_data_catalog.py` (`ReferenceDataCatalogEngine`) is a **data-
governance engine**, not a quant model: it maintains a hand-curated registry
(`REFERENCE_DATASETS`, ~38 datasets across 9 domains) of every reference/lookup table embedded
in the platform's engines, cross-references each dataset against the module-lineage graph, and
computes coverage and gap statistics:

```
coverage_pct     = (embedded + seed_data) / total_datasets × 100
used_by(dataset) = [module_id for module in MODULE_SIGNATURES
                    if dataset ∈ module.reference_data]           # lineage join
gap severity     = critical if status=='missing' and used_by non-empty
                   high     if missing/stale but tracked
                   medium   if no consuming module yet ("planned_modules")
estimated_effort = low ≤3 gaps · medium ≤8 · high >8
```

Five routes in `api/v1/routes/reference_catalog.py` expose it: `GET /` (full catalog,
filterable by `domain`/`include_missing`), `/dataset/{data_id}`, `/domains`, `/gaps`,
`/module/{module_id}`.

### 7.2 Registry parameterisation

Each dataset record carries: `label`, `domain`, `source` (authoritative publisher),
`source_url`, `update_frequency`, `last_known_update`, `record_count`, `status`
(`embedded | seed_data | missing | stale`) and free-text `notes`. Current census (from code):

| Domain | Count | Examples (source, vintage) |
|---|---|---|
| emission_factors | 7 | IPCC 2006/2019 Refinement EFs (850 rec), IEA grid EFs 2024 (195), DEFRA 2024 (1,200), AR5 GWP-100 (40), Scope-3 category EFs, EXIOBASE MRIO (7,800), IPCC AFOLU |
| financial_parameters | 9 | NGFS Phase IV params (6 scenarios, 2024), EBA climate stress params, CRR2 CCFs (Art 111), Moody's default study |
| regulatory | 8 | incl. EUDR country benchmarking (EC 2025/1093, 42 rec) |
| sector_benchmarks | 3 · geographic 3 · entity_master 3 · insurance 3 | — |
| agriculture | 1 · nature 1 | BNG Statutory Metric (Natural England, 38 rec) |

Status census at time of writing: **36 embedded, 2 seed_data (WRI Aqueduct Water Risk Atlas,
IBAT KBA/Protected Areas), 0 missing, 0 stale** — so `coverage_pct = 100%` and `find_gaps()`
currently returns an empty report with effort "low".

### 7.3 Calculation walkthrough

At construction the engine imports `MODULE_SIGNATURES` from `data_lineage_service` and inverts
it (`_build_module_usage`): each module signature lists its `reference_data` dependencies, so
the catalog knows, per dataset, exactly which modules consume it. `get_catalog()` then builds
`CatalogEntry` rows, tallies status counts, produces per-domain summaries
(`{label, count, embedded, missing}`), and emits rule-based recommendations: "N datasets
missing — acquire and integrate", "N stale — schedule refresh", "coverage X% — target 95%+",
plus up to 3 named acquisition priorities. `find_gaps()` filters to missing/stale, assigns the
severity rubric from §7.1, sorts critical → high → medium and prescribes an action string
("Acquire from {source}" vs "Refresh from {source}"). `get_module_reference_data(module_id)`
is the per-module view used by the Refinement Board tooling.

### 7.4 Worked example — one catalog request traced

`GET /api/v1/reference-catalog/?domain=emission_factors`:

1. Registry filter keeps the 7 emission-factor datasets.
2. Lineage join: e.g. `iea_grid_ef.used_by` = every module whose signature lists
   `"iea_grid_ef"` in `reference_data` (carbon calculators, PCAF engine, etc. —
   resolved at runtime from `MODULE_SIGNATURES`).
3. Counts: embedded = 7, seed = 0, missing = 0, stale = 0 → `coverage_pct = 7/7 × 100 =
   **100.0%**`; domain summary `{emission_factors: {count: 7, embedded: 7, missing: 0}}`.
4. Recommendations list is empty (no missing, no stale, coverage ≥ 90) →
   the UI renders a clean-bill-of-health card.

Had `wri_aqueduct` been marked `missing` with 4 consuming modules, `/gaps` would rank it
`critical` with action "Acquire from World Resources Institute".

### 7.5 Relationship to the other reference layers

Three distinct layers coexist and this catalog is the *metadata* one:
1. **This catalog** — registry *about* datasets (provenance, freshness, consumers); it stores
   no factor values itself.
2. **`api::public_reference_data` (`/api/v1/refdata`)** — the generic ingested Tier-1 store
   (OWID/World Bank/SBTi/Verra rows in Postgres).
3. **Curated in-code tables** (`reference_data_tables.py`, per-engine constants) — the values
   the catalog's `status: embedded` entries point at (several `notes` fields reference
   `reference_data_tables.py` explicitly).

### 7.6 Data provenance & limitations

- **No PRNG, no synthetic entities** — but the registry itself is hand-maintained metadata:
  `record_count` and `last_known_update` are transcribed claims, not derived by scanning the
  actual embedded tables, so they can drift from reality without any check failing.
- Freshness is **not** computed against `update_frequency` (despite the docstring's
  "configurable threshold"); a dataset only becomes `stale` if someone edits its status —
  there is no automated staleness clock.
- Gap analysis can only see gaps that were pre-registered as `missing`; unknown-unknowns
  (a module hard-coding factors never added to the registry) are invisible.
- The lineage join depends entirely on the completeness of `MODULE_SIGNATURES` in
  `data_lineage_service`.

### 7.7 Framework alignment

- **BCBS 239 Principle 3 (Accuracy & Integrity)** — cited in the docstring; the principle
  requires banks to maintain accurate, documented data with single authoritative sources.
  The catalog implements the *inventory + source-traceability* half of this (each dataset →
  named authoritative source + URL); it does not implement reconciliation controls.
- **ISO 8000-61 (data quality management — provenance)** — the source/vintage/frequency fields
  per dataset are a lightweight provenance record in the ISO 8000 spirit.
- **EBA GL/2020/06 (ICT & security risk / SREP data management)** — supervisory expectation
  that risk-calculation inputs are governed; the `used_by` mapping shows which risk modules a
  stale dataset would contaminate.
- The catalogued sources themselves anchor the platform's methods to public standards: IPCC
  EF database & AR5 GWPs, IEA grid factors, UK DEFRA conversion factors, GHG Protocol Scope 3,
  EXIOBASE MRIO, NGFS Phase IV, EU CRR2, EUDR benchmarking, Natural England BNG metric.

## 9 · Future Evolution

### 9.1 Evolution A — Auto-generated catalog with live freshness from the reference layer (analytics ladder: rung 1 → 3)

**What.** A data-governance engine, not a quant model: `ReferenceDataCatalogEngine` maintains a
hand-curated registry (`REFERENCE_DATASETS`, ~38 datasets across 9 domains) of every reference
table embedded in the platform's engines, joins each against the module-lineage graph
(`MODULE_SIGNATURES`), and computes coverage/gap stats
(`coverage_pct = (embedded + seed) / total × 100`; gap severity critical if missing-and-used).
The limitation is that the registry is hand-maintained — it can drift from the actual embedded
tables and from the live `public_reference_data` store. Evolution A makes it self-updating and
freshness-aware.

**How.** (1) Generate the `REFERENCE_DATASETS` registry from an AST scan of the engines (the same
scan that powers ENGINE_CATALOG.md) plus the `reference_data_sources` registry table, so the
catalog reflects reality rather than manual curation — closing the drift risk. (2) Join to
`public_reference_data`'s `last_ingested_at`/`row_count` so `status` (embedded/seed/missing/stale)
is computed from live data currency, not a static flag — a dataset unrefreshed past its cadence
becomes `stale` automatically. (3) Rank gaps by blast radius (how many modules consume the missing
dataset) using the interconnection graph. (4) Bench-pin the coverage and gap-severity logic.

**Prerequisites.** AST engine-scan artifact (roadmap engine-registry work); `public_reference_data`
populated with `last_ingested_at` (its own Evolution A). **Acceptance:** the catalog regenerates
from code + the reference store rather than a hand-curated list; `stale` status derives from live
`last_ingested_at` vs cadence; gaps rank by consuming-module count; coverage bench-pinned.

### 9.2 Evolution B — Data-coverage copilot for platform governance (LLM tier 2)

**What.** A copilot that answers "what reference data are we missing and which modules does it
break?" (calling `/gaps` and citing severity and consuming modules), "what data does the PCAF
module depend on?" (`/module/{module_id}`), and "how complete is our emission-factor coverage?"
(`/domains`) — each figure tool-sourced.

**How.** Five read endpoints (catalog, dataset detail, domains, gaps, per-module) form the tool
set; the lineage join means the copilot can trace a missing dataset to the exact modules it
degrades — directly actionable for the platform team. This is an internal-governance meta-copilot,
pairing with the `ingestion`, `public_reference_data`, and `parameter_governance` copilots to give
the platform team a single view of data health.

**Prerequisites.** Evolution A's auto-generation for accuracy — a copilot reporting coverage from
a drifted hand-curated registry could understate or overstate gaps. **Acceptance:** every coverage
%, gap, and consuming-module list traces to a tool response; the copilot distinguishes
embedded/seed/missing/stale with live currency; it flags when the catalog itself is stale relative
to the code and refuses to assert coverage it can't source from the registry.