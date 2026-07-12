# Database Explorer
**Module ID:** `db-explorer` · **Route:** `/db-explorer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Visual SQL query builder for ad-hoc exploration of the ESG platform database, with schema browsing, query history, and result export. Non-technical analysts can construct queries using a drag-and-drop interface while advanced users have a full SQL editor. Results are displayable as tables or charts.

> **Business value:** Democratises data access for analysts and compliance teams by removing dependency on engineering for ad-hoc ESG data extraction. Governed access controls ensure exploration happens within data security boundaries while maintaining full audit logs.

**How an analyst works this module:**
- Browse the schema tree to locate the table or view relevant to your analysis
- Build a query using the visual builder or write SQL directly in the editor tab
- Run the query, review results in the data grid, and switch to the chart view for quick visualisation
- Save the query to the shared library and schedule it as a recurring report if needed

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_TABLES`, `DB_SCHEMA`, `DataLineageView`, `LINEAGE_MAP`, `MIGRATIONS`, `MigrationTracker`, `SQLQueryEditor`, `SQL_TEMPLATES`, `TABS`, `TOTAL_ROWS`, `TOTAL_SIZE_MB`, `TableBrowser`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SQL_TEMPLATES` | 23 | `sql` |
| `MIGRATIONS` | 68 | `id`, `name`, `tables`, `cols`, `status`, `date` |
| `TABS` | 5 | `label`, `icon` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ALL_TABLES` | `Object.entries(DB_SCHEMA).flatMap(([domain,tables])=>tables.map(t=>({...t,domain})));` |
| `TOTAL_ROWS` | `ALL_TABLES.reduce((a,t)=>a+t.rows,0);` |
| `TOTAL_SIZE_MB` | `ALL_TABLES.reduce((a,t)=>a+parseFloat(t.size),0);` |
| `seed` | `i*100+ci*17;` |
| `selectMatch` | `sql.match(/SELECT\s+([\s\S]*?)\s+FROM/i);` |
| `parts` | `selectMatch[1].split(',').map(s=>s.trim());` |
| `asMatch` | `p.match(/\bAS\s+(\w+)/i);` |
| `name` | `asMatch ? asMatch[1] : p.replace(/.*\./, '').replace(/[()]/g,'').replace(/ROUND\|AVG\|COUNT\|SUM\|MAX\|MIN\|CASE\|WHEN\|THEN\|ELSE\|END/gi,'').trim().split(/\s+/)[0];` |
| `rowCount` | `Math.floor(sr(seed*7)*40)+5;` |
| `hasJoin` | `/JOIN/i.test(sql);` |
| `hasGroup` | `/GROUP BY/i.test(sql);` |
| `hasWhere` | `/WHERE/i.test(sql);` |
| `hasOrder` | `/ORDER BY/i.test(sql);` |
| `hasLimit` | `/LIMIT/i.test(sql);` |
| `fkRelationships` | `useMemo(()=>{ return ALL_TABLES.flatMap(t=>t.cols.filter(c=>c.fk).map(c=>({from:t.name,fromCol:c.n,to:c.fk.split('.')[0],toCol:c.fk.split('.')[1]})));` |
| `domainSizes` | `useMemo(()=>Object.entries(DB_SCHEMA).map(([domain,tables])=>({` |
| `totalPages` | `results ? Math.ceil(results.rows.length/PAGE_SIZE) : 0;` |
| `coverageData` | `useMemo(()=>lineageKeys.map(k=>({` |
| `freshnessData` | `useMemo(()=>lineageKeys.map(k=>{` |
| `totalTables` | `MIGRATIONS.reduce((a,m)=>a+m.tables.length,0);` |
| `totalCols` | `MIGRATIONS.reduce((a,m)=>a+m.cols,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MIGRATIONS`, `SQL_TEMPLATES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Tables Available | — | Schema introspection | Count of tables visible to the current user role in the platform database |
| Saved Queries | — | Query library | Total queries saved to the shared library across all users |
| Avg Query Execution Time | — | Query telemetry | Mean wall-clock execution time across all queries run in the last 7 days |
| Row Export Limit | — | Platform policy | Maximum rows exportable per query to CSV or Excel without DBA approval |
- **Platform PostgreSQL database (Supabase)** → Schema introspection via information_schema and pg_catalog → **Table, column, and index metadata for query builder**
- **Query editor input** → SQL parsing, execution plan generation, and query execution → **Result set with metadata and execution statistics**
- **Query library (shared storage)** → Save, tag, and schedule query jobs → **Reusable query catalogue with version history**

## 5 · Intermediate Transformation Logic
**Methodology:** Query Performance Score
**Headline formula:** `QPS = 1 / (ExecutionTime × RowsScanned / IndexHitRate)`

The query performance score penalises slow, full-table-scan queries and rewards indexed lookups. The explorer surfaces execution plans and suggests index creation where scans dominate, helping analysts write efficient queries without DBA intervention.

**Standards:** ['PostgreSQL EXPLAIN ANALYZE', 'ISO/IEC 9075 SQL Standard']
**Reference documents:** PostgreSQL 15 Documentation â€” EXPLAIN ANALYZE; ISO/IEC 9075:2023 SQL Standard; Supabase (2024) Row Level Security and Role Configuration

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Introspect the live schema; execute real read-only queries (analytics ladder: rung 1 → 2)

**What.** §7's finding: no live database exists behind this explorer — the schema
is a hand-transcribed model (frozen at Alembic 001–067, while the platform chain
now runs far past that), the "query engine" regex-parses the SELECT list and
fabricates 5–44 seeded rows, and the guide's Query Performance Score
(`1/(Time × RowsScanned / IndexHitRate)`) has no `EXPLAIN` behind it. The FK
graph and domain treemap are genuinely useful orientation tools — over a schema
model that drifts from reality. Evolution A makes it real and safe.

**How.** (1) Live introspection: a backend route reading
`information_schema`/`pg_catalog` (tables, columns, PK/FK, row estimates from
`pg_class.reltuples`, sizes from `pg_total_relation_size`) — the schema tree,
treemap, and FK graph then reflect the actual 577-table state with zero manual
transcription. (2) Governed execution: a read-only query endpoint running
statements under a restricted role (SELECT-only grants, statement timeout, row
limit, RBAC + AuditMiddleware logging) — the "democratised access with governance"
the overview promises, done with database-level enforcement rather than trust.
(3) Real plans: `EXPLAIN (ANALYZE, BUFFERS)` on demand, surfacing scan types and
suggesting indexes — the QPS becomes computable from actual plan numbers.
(4) Delete the mock executor and seeded results entirely.

**Prerequisites (hard).** The restricted read-only role and RLS/org-scoping
review (an explorer is an exfiltration surface — the D2 multi-tenancy hardening
must gate this); statement-timeout and cost-limit policy. **Acceptance:** the
schema tree matches a live `information_schema` query; a real query returns real
rows with the audit log recording actor and statement; a full-scan query's plan
displays with its index suggestion.

### 9.2 Evolution B — Natural-language-to-SQL analyst with schema grounding (LLM tier 2)

**What.** The visual builder serves non-technical analysts; the LLM serves them
better: "average Scope 1 by sector for portfolio companies with SBTi commitments"
→ generated SQL against the live schema, shown for confirmation before execution,
results explained. The live introspection layer makes this grounded — the model
sees actual table/column names and FK paths, not guesses — and the read-only role
makes it safe by construction: the worst hallucinated SQL can do is return wrong
rows or time out.

**How.** Tier-2: schema context assembled from the introspection route (relevant
tables selected by embedding similarity over table/column descriptions); generated
SQL always displayed and user-confirmed before the execution tool runs it;
results paired with the executed statement for auditability. Failed queries
(errors, empty results) trigger one grounded revision attempt, then honest
failure. Query+confirmation pairs log to `llm_traces` for the flywheel; saved
queries join the shared library the overview promises.

**Prerequisites (hard).** Evolution A in full — NL-to-SQL over the stale
hand-modelled schema would generate confidently wrong queries; the restricted
role is the safety boundary that makes the feature shippable. **Acceptance:** on
a 20-question benchmark over platform tables, ≥80% of generated queries execute
and return correct results; every execution shows its SQL first; no statement
ever runs outside the read-only role.