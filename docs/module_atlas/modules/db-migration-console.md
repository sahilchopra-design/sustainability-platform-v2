# DB Migration Console
**Module ID:** `db-migration-console` · **Route:** `/db-migration-console` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Alembic database migration management console providing schema version control, migration history, dry-run previews, and rollback capability. Displays the current migration head, pending migrations, and dependency graph. Designed for platform administrators managing schema changes across environments.

> **Business value:** Gives platform administrators authoritative visibility into schema state across all environments, preventing deployment mismatches that cause runtime errors. Dry-run and rollback capabilities reduce the risk of destructive schema changes in production.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `GROWTH`, `MIGRATIONS`, `MIGRATION_DESCRIPTIONS`, `SCHEMA_DIFFS`, `SPRINT_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `num` | `String(i + 1).padStart(3, '0');` |
| `isPending` | `i >= 60; // 061–087 pending` |
| `isCurrent` | `i === 66; // codebase head at 067` |
| `tables` | `1 + Math.floor(sr(i * 7) * 4);` |
| `columns` | `tables * (2 + Math.floor(sr(i * 7 + 1) * 6));` |
| `indices` | `Math.floor(sr(i * 7 + 2) * 3);` |
| `SCHEMA_DIFFS` | `Object.entries(MIGRATION_DESCRIPTIONS).map(([num, desc]) => {` |
| `idx` | `parseInt(num) - 1;` |
| `GROWTH` | `MIGRATIONS.reduce((acc, m, i) => {` |
| `prev` | `acc.length > 0 ? acc[acc.length - 1] : { migration: '000', tables: 0, columns: 0 };` |
| `totalTables` | `MIGRATIONS.reduce((s, m) => s + m.tables, 0);` |
| `totalColumns` | `MIGRATIONS.reduce((s, m) => s + m.columns, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Current Head (Codebase) | — | Alembic env.py | Latest migration revision present in the codebase migration chain |
| Applied Head (Database) | — | alembic_version table | Highest migration revision applied to the target database environment |
| Pending Migrations | — | Drift comparison | Count of migrations in the codebase chain not yet applied to the target environment |
| Last Migration Applied | — | alembic_version audit | Timestamp of the most recently applied migration in the target environment |
- **Alembic migration scripts (versions/ directory)** → Script parsing to extract DDL operations and dependency graph → **Migration inventory with risk classification (additive / destructive)**
- **alembic_version table in target database** → Comparison of applied revision against codebase head → **Pending migration list and drift score**
- **Migration execution engine** → Sequential DDL application with transaction wrapping and rollback on error → **Execution log with per-statement timing and error capture**

## 5 · Intermediate Transformation Logic
**Methodology:** Migration Drift Score
**Headline formula:** `MDS = |AppliedHead − CodebaseHead| × AvgMigrationRisk`
**Standards:** ['Alembic Migration Framework', 'PostgreSQL Schema Versioning']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).