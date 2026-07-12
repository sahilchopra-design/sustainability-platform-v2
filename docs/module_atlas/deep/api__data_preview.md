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
