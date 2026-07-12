## 7 · Methodology Deep Dive

The guide names a *Query Performance Score* `QPS = 1/(ExecutionTime × RowsScanned / IndexHitRate)`
implying live `EXPLAIN ANALYZE` cost modelling against Postgres. **No live database or execution plan
exists.** This is a client-side schema browser + mock SQL "runner" over a hard-coded model of the
platform's Supabase schema (Alembic 001–067). It parses the `SELECT` clause with regex, fabricates a
result set with the seeded PRNG, and renders schema/FK/growth analytics. The QPS formula is not
computed. Sections below document the actual behaviour.

### 7.1 What the module computes

```js
ALL_TABLES   = flatten(DB_SCHEMA)                         // domains → tables w/ cols, rows, size, indexes
TOTAL_ROWS   = Σ table.rows ; TOTAL_SIZE_MB = Σ parseFloat(table.size)
// mock query executor:
selectMatch  = sql.match(/SELECT ([\s\S]*?) FROM/i)      // extract projected columns
rowCount     = ⌊sr(seed·7)·40⌋ + 5                        // 5–44 fabricated rows
// per cell value seeded by sr(i·100 + ci·17)
flags        = {hasJoin, hasGroup, hasWhere, hasOrder, hasLimit} = regex tests on the SQL
```

The "query engine" does not evaluate SQL semantics — it parses the projection list (handling `AS`
aliases and stripping `ROUND/AVG/COUNT/SUM/...`), then emits `rowCount` rows of synthetic values. The
regex flags drive a cosmetic "query complexity" read-out.

### 7.2 Schema model & parameterisation

| Element | Value | Provenance |
|---|---|---|
| Domains | Emissions, Portfolio, Regulatory, … | real platform schema grouping |
| Tables | modelled with real names (`company_emissions`, `financed_emissions_v2`, `sfdr_pai_indicators`, `csrd_esrs_datapoints`…) | mirrors Alembic migrations |
| Columns | typed w/ pk/fk/unique flags | hand-transcribed from migrations |
| Row counts / sizes | e.g. csrd_esrs_datapoints 34,200 rows / 28.6 MB | plausible static estimates |
| SQL templates | 23 | canned example queries |
| Migrations | 68 (`MIGRATIONS`) | real migration chain 001–067 (head marked at 067) |
| Result rows | `⌊sr·40⌋+5` | synthetic |

FK relationships (`fkRelationships`) are extracted from the `fk:'table.col'` annotations on columns —
this is a **real** dependency graph of the modelled schema (e.g. `financed_emissions_v2.company_id →
company_profiles.id`).

### 7.3 Calculation walkthrough

Schema tab: `ALL_TABLES` powers a treemap sized by rows and a table list; `fkRelationships` renders
the join graph; `domainSizes` aggregates rows/size per domain. Query tab: user picks/edits a template,
the mock executor parses columns + flags and paginates `rowCount` synthetic rows (`PAGE_SIZE`).
Lineage tab: `coverageData` / `freshnessData` map lineage keys to seeded coverage/freshness. Migrations
tab: `totalTables = Σ m.tables.length`, `totalCols = Σ m.cols` across the 68-entry chain.

### 7.4 Worked example

Query `SELECT sector, ROUND(AVG(scope1_tco2e),2) AS avg_s1 FROM company_emissions GROUP BY sector`:
- `selectMatch[1] = "sector, ROUND(AVG(scope1_tco2e),2) AS avg_s1"` → columns parsed to
  `["sector", "avg_s1"]` (alias captured; `ROUND/AVG` stripped).
- `hasGroup = true`, `hasJoin = false`.
- `seed` from table index → `rowCount = ⌊sr(seed·7)·40⌋+5`, say 18 → 18 fabricated
  `{sector, avg_s1}` rows with `avg_s1 = f(sr(i·100+ci·17))`.
No aggregation actually runs; the output is illustrative structure only.

### 7.5 Data provenance & limitations

- **No live database.** Row counts, sizes and all query results are synthetic (`sr(seed) =
  frac(sin(seed+1)×10⁴)`); the schema itself is a hand-maintained model that can drift from the true
  migration state.
- SQL parsing is regex-only — no validation, no real EXPLAIN, no index-hit accounting; the guide's QPS
  cost model is unimplemented.
- FK graph and domain aggregates are faithful to the *modelled* schema, useful for orientation, not
  for governance decisions on the live DB.

**Framework alignment:** PostgreSQL `EXPLAIN ANALYZE` / ISO/IEC 9075 SQL — referenced conceptually
only; a production explorer would introspect `information_schema`/`pg_catalog` and run real plans under
Supabase RLS. The value here is educational schema navigation, not query governance.
