# Database Explorer
**Module ID:** `db-explorer` · **Route:** `/db-explorer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Visual SQL query builder for ad-hoc exploration of the ESG platform database, with schema browsing, query history, and result export. Non-technical analysts can construct queries using a drag-and-drop interface while advanced users have a full SQL editor. Results are displayable as tables or charts.

> **Business value:** Democratises data access for analysts and compliance teams by removing dependency on engineering for ad-hoc ESG data extraction. Governed access controls ensure exploration happens within data security boundaries while maintaining full audit logs.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_TABLES`, `DB_SCHEMA`, `DataLineageView`, `LINEAGE_MAP`, `MIGRATIONS`, `MigrationTracker`, `SQLQueryEditor`, `SQL_TEMPLATES`, `TABS`, `TOTAL_ROWS`, `TOTAL_SIZE_MB`, `TableBrowser`

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
| `name` | `asMatch ? asMatch[1] : p.replace(/.*\./, '').replace(/[()]/g,'').replace(/ROUND\|AVG\|COUNT\|SUM\|MAX\|MIN\|CASE\|WHEN\|THEN\|ELSE\|END/gi,'').trim().split(/\s+` |
| `rowCount` | `Math.floor(sr(seed*7)*40)+5;` |
| `hasJoin` | `/JOIN/i.test(sql);` |
| `hasGroup` | `/GROUP BY/i.test(sql);` |
| `hasWhere` | `/WHERE/i.test(sql);` |
| `hasOrder` | `/ORDER BY/i.test(sql);` |
| `hasLimit` | `/LIMIT/i.test(sql);` |
| `domainSizes` | `useMemo(()=>Object.entries(DB_SCHEMA).map(([domain,tables])=>({` |
| `seed` | `sql.length*7+sql.charCodeAt(0);` |
| `totalPages` | `results ? Math.ceil(results.rows.length/PAGE_SIZE) : 0;` |
| `coverageData` | `useMemo(()=>lineageKeys.map(k=>({` |

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
**Standards:** ['PostgreSQL EXPLAIN ANALYZE', 'ISO/IEC 9075 SQL Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).