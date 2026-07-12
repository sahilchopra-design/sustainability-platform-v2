# Api::Data_Preview
**Module ID:** `api::data_preview` · **Route:** `/api/v1/data-preview` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/data-preview/tables` | `list_tables` | api/v1/routes/data_preview.py |
| GET | `/api/v1/data-preview/tables/{table_name}/preview` | `preview_table` | api/v1/routes/data_preview.py |
| GET | `/api/v1/data-preview/relationships` | `get_relationships` | api/v1/routes/data_preview.py |
| GET | `/api/v1/data-preview/datapoint-mappings` | `get_datapoint_mappings` | api/v1/routes/data_preview.py |
| GET | `/api/v1/data-preview/modules` | `get_modules` | api/v1/routes/data_preview.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `its`, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/data-preview/datapoint-mappings** — status `passed`, provenance ['real-db'], source tables: `information_schema.columns`, `information_schema.constraint_column_usage`, `information_schema.key_column_usage`, `information_schema.table_constraints`
Output: `{'type': 'object', 'keys': ['mappings', 'total_mappings', 'by_category', 'by_confidence', 'module_pair_summary'], 'n_keys': 5}`

**GET /api/v1/data-preview/modules** — status `passed`, provenance ['real-db'], source tables: `information_schema.tables`
Output: `{'type': 'object', 'keys': ['modules', 'total_modules'], 'n_keys': 2}`

**GET /api/v1/data-preview/relationships** — status `passed`, provenance ['real-db'], source tables: `information_schema.constraint_column_usage`, `information_schema.key_column_usage`, `information_schema.table_constraints`
Output: `{'type': 'object', 'keys': ['relationships', 'total_relationships', 'cross_module_count', 'module_adjacency'], 'n_keys': 4}`

**GET /api/v1/data-preview/tables** — status `passed`, provenance ['real-db'], source tables: `information_schema.columns`, `information_schema.key_column_usage`, `information_schema.table_constraints`, `information_schema.tables`, `public`
Output: `{'type': 'object', 'keys': ['tables', 'total_tables'], 'n_keys': 2}`

**GET /api/v1/data-preview/tables/{table_name}/preview** — status `failed`, provenance ['db-empty'], source tables: `information_schema.tables`
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/api/v1/routes/data_preview.py` at `/api/v1/data-preview` — the schema-introspection
and inter-table lineage-mapping service. All logic is in the route file; there is no services
engine and no domain mathematics.)*

### 7.1 What the module computes

Five endpoints that introspect the live Postgres catalog (`information_schema`) rather than any
business data:

| Endpoint | Behaviour |
|---|---|
| `GET /tables` | Every base table in the schema: exact `COUNT(*)`, column metadata (type, nullability, PK flag), `pg_total_relation_size`, and a module classification |
| `GET /tables/{name}/preview` | First ≤100 rows of any table with JSON-safe serialisation (non-primitive values stringified) |
| `GET /relationships` | All FK constraints, classified intra-module (`has_many`) vs cross-module (`references`), plus a module adjacency list |
| `GET /datapoint-mappings` | Column-level mapping graph: exact FK pairs + name-inferred `*_id` pairs, each tagged with a relationship *category* and *confidence* |
| `GET /modules` | Tables grouped by module classification |

The module's "methodology" is therefore **classification heuristics**, not numeric formulas.

### 7.2 Parameterisation — the two classifiers

**Module classifier** (`_classify_module`): a ~130-entry explicit `TABLE_MODULE_MAP`
(portfolio, carbon, cbam, ecl, pcaf, supply_chain, sector, regulatory, valuation, nature, csrd,
esrs, issb, fi, energy, data_hub, scenario, auth, audit, system) with a prefix-heuristic
fallback (`csrd_`→csrd, `pcaf_`→pcaf, `cat_risk_`→sector, `ngfs_`→scenario, `re_`→real_estate…)
and `other` as the default.

**Relationship classifier** (`_classify_relationship`): first-match-wins keyword rules on the
source column name:

| Category | Trigger keywords | Example |
|---|---|---|
| `identity_link` | `entity_id`, `entity_registry_id`, `company_id`, `counterparty_id`, or `*_id` containing "entity"/"registry" | csrd_kpi_values.entity_registry_id |
| `temporal_join` | date, timestamp, period, year, quarter | reporting_year |
| `financial_metric` | amount, eur, usd, premium, exposure, loss | outstanding_amount |
| `risk_indicator` | risk, pd, lgd, ead, ecl, var, score | pd_1yr |
| `classification` | type, category, sector, class, tier, rating | sector_gics |
| `spatial_join` | country, region, lat, lng, location | country_iso2 |
| `aggregation_source` | (default) | portfolio_id |

Mapping **confidence** tiers: `exact_fk` (from `information_schema` FK constraints) and
`inferred_name` (identical `*_id` column names across two tables, excluding
`id`/`created_at`/`updated_at`, capped at 500 candidate pairs). The Pydantic model declares a
third tier, `semantic_match`, which is **not implemented** — no mapping is ever emitted with
that confidence.

### 7.3 Calculation walkthrough

`/datapoint-mappings` first harvests every FK constraint (deduplicated by
`source.col->target.col` pair), categorises each with the keyword rules, then joins
`information_schema.columns` to itself on equal column names (`c1.table_name <
c2.table_name` avoids mirror duplicates) to add inferred links that share an `*_id` name
without a declared FK. It returns the raw mapping list plus three aggregates: counts
`by_category`, counts `by_confidence`, and a `module_pair_summary`
(`module_A <-> module_B → {count, categories}`). `/relationships` performs the FK harvest
only, marking `is_cross_module` when the two tables classify into different modules and
aggregating a directed `module_source -> module_target` adjacency with per-edge link counts and
`table.column -> table.column` samples — this powers the platform's data-lineage/relationship
visualisations.

### 7.4 Worked example — classifying one inferred mapping

Suppose `di_loan_portfolio_rows.counterparty_id` and `di_counterparty_emissions.counterparty_id`
share a name with no FK constraint. The name-join emits the pair with
`mapping_confidence = "inferred_name"`. Classification walks the keyword ladder:
not an entity/registry `_id`… but `counterparty_id` is in the explicit identity list →
**`identity_link`**. Both tables miss the explicit map but no prefix matches (`di_` is not in
the fallback list) → both classify as module `other`, and the pair rolls up under
`other <-> other` in `module_pair_summary`. This illustrates both the mechanism and its main
gap: newer `di_*`/`dh_*`/`ctp_*` table families all fall through to `other`.

### 7.5 Data provenance & limitations

- **No synthetic data, no PRNG** — everything derives from the live catalog and real table
  contents; the preview endpoint surfaces whatever rows exist (which elsewhere on the platform
  may themselves be seeded demo rows, but this module adds nothing).
- `TABLE_MODULE_MAP` is a manually curated snapshot; the platform has grown far beyond it
  (`di_*` intake, `dh_*` data-hub, `ctp_*` china-trade tables are absent), so module analytics
  increasingly lump tables under `other`. The prefix fallback mitigates only for listed prefixes.
- Keyword classification is first-match string matching — a column like `risk_type` classifies
  as `risk_indicator` before `classification`; precision is heuristic by design.
- `COUNT(*)` per table on `/tables` is exact but O(table) per request (the comment says
  "approximate for speed" but the SQL is an exact count) — expensive on large schemas; no
  caching.
- Table/schema names are quoted-interpolated into SQL for preview/count/size queries; the
  existence check gates `table_name`, and `schema` defaults to `public`, but the pattern relies
  on that validation.
- Name-based inference can produce false positives (same column name, unrelated semantics) and
  is capped at 500 joins, so very large schemas may truncate the inferred layer.

### 7.6 Framework alignment

No regulatory framework is implemented — this is **data-governance infrastructure**. Its intent
maps to industry practice rather than a named standard:

- **Data lineage / BCBS 239-style traceability** — the FK + inferred mapping graph gives
  datapoint-level provenance across modules, the foundation the platform's lineage harness and
  "relationships" dashboards build on.
- **Data cataloguing** — `/tables` + `/modules` provide the catalog inventory (schema, size,
  ownership-by-module) that tools like a data catalog or dbt docs would supply.
- The relationship categories (identity/financial/risk/temporal/spatial/classification) are a
  platform-authored taxonomy; they are not drawn from an external metadata standard.

## 9 · Future Evolution

### 9.1 Evolution A — Refresh the module map and add semantic mapping (analytics ladder: rung 1 → 2)

**What.** A schema-introspection and inter-table lineage service over `information_schema` — five
endpoints (tables, preview, relationships, datapoint-mappings, modules) whose "methodology" is
classification heuristics, not numeric formulas; no PRNG, all live catalog data. §7.5 names the
concrete gaps: `TABLE_MODULE_MAP` is a **manually curated snapshot the platform has outgrown** —
`di_*` intake, `dh_*` data-hub and `ctp_*` china-trade table families all fall through to `other`, so
module analytics increasingly mislabel; the declared `semantic_match` confidence tier is **never
implemented** (only `exact_fk` and `inferred_name` are emitted); and `COUNT(*)` per table is exact but
O(table) per request with no caching. Evolution A regenerates the module map from the Atlas builder's
own table→module registry and adds the semantic mapping tier.

**How.** `_classify_module` sources `TABLE_MODULE_MAP` from the Atlas builder's authoritative
table-ownership data (which already knows every `di_*`/`dh_*`/`ctp_*` table's module) instead of a
hand-curated constant; a `semantic_match` tier uses column-comment/type similarity for links that
share meaning without a shared `*_id` name. Rung 2: cache `/tables` counts via `pg_class.reltuples`
estimates (or materialized views) so introspection scales.

**Prerequisites.** Fix the harness failure — §4.2 shows `GET /tables/{table_name}/preview` **failed**
(db-empty); regenerate the module map (the §7.4 example shows `di_*` pairs lumping under
`other <-> other`). **Acceptance:** `di_*`/`dh_*`/`ctp_*` tables classify to their real modules, not
`other`; a semantic mapping is emitted where columns match by meaning; the preview endpoint passes the
harness; large-schema `/tables` no longer full-table-counts.

### 9.2 Evolution B — Schema-lineage copilot for data governance (LLM tier 2)

**What.** A copilot for data engineers/governance answering "which tables belong to the PCAF module?"
(`/modules`), "what references `csrd_entity_registry`?" (`/relationships`), "trace the datapoint
lineage between CBAM and supply-chain tables" (`/datapoint-mappings` with the module-pair summary),
and "preview this table" (`/tables/{name}/preview`) — narrating the real FK + inferred mapping graph
that underpins the platform's lineage visualisations (BCBS 239-style traceability).

**How.** Tool schemas over the 5 endpoints; the relationship taxonomy (identity/financial/risk/
temporal/spatial/classification links) and module classification are the grounding. The
no-fabrication validator ensures any table/column/relationship cited comes from a tool call, not the
model's assumptions about schema. Read-only by construction — no mutating tools. This copilot supports
the platform's own maintenance (e.g. spotting cross-module coupling before a schema change) rather
than end-user analytics.

**Prerequisites.** Evolution A's refreshed module map (so relationships are attributed to real modules,
not `other`) and preview harness fix; Atlas corpus embedded (roadmap D3). **Acceptance:** every table,
column and relationship cited traces to an introspection tool call; a cross-module lineage question
resolves via the real FK/inferred graph with correct module labels; a preview returns actual rows,
never a fabricated schema.