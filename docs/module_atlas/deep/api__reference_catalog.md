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
