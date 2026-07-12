# DB Migration Console
**Module ID:** `db-migration-console` · **Route:** `/db-migration-console` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Alembic database migration management console providing schema version control, migration history, dry-run previews, and rollback capability. Displays the current migration head, pending migrations, and dependency graph. Designed for platform administrators managing schema changes across environments.

> **Business value:** Gives platform administrators authoritative visibility into schema state across all environments, preventing deployment mismatches that cause runtime errors. Dry-run and rollback capabilities reduce the risk of destructive schema changes in production.

**How an analyst works this module:**
- Select target environment (dev / staging / prod) from the environment picker
- Review the pending migration list and click "Dry Run" to preview DDL without applying
- Apply pending migrations sequentially and monitor the execution log for errors
- Use the rollback function to revert to a named revision in a non-production environment

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

The drift score quantifies how far behind an environment is from the codebase migration head, weighted by the estimated schema risk of each unapplied migration (additive vs. destructive DDL). A score above zero indicates a deployment action is required.

**Standards:** ['Alembic Migration Framework', 'PostgreSQL Schema Versioning']
**Reference documents:** Alembic (2024) Official Documentation â€” Autogenerate and Migration Commands; PostgreSQL 15 â€” ALTER TABLE and DDL Locking Behaviour; Supabase (2024) Schema Migration Best Practices

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide describes a *Migration Drift Score* `MDS = |AppliedHead − CodebaseHead| × AvgMigrationRisk`
comparing a live `alembic_version` table against the codebase head, weighted by per-migration
destructive-DDL risk. **The code computes neither a live drift score nor migration risk.** It renders
a static, seeded model of the Alembic chain: numbered migrations, a fabricated schema-diff (tables/
columns/indices per migration via `sr()`), and a cumulative schema-growth chart. Head/pending state is
hard-coded (current head at index 66 = migration 067; 061–087 marked "pending"). The MDS is not
implemented; sections below document the display model.

### 7.1 What the module computes

```js
num       = String(i+1).padStart(3,'0')             // migration id 001…
isPending = i >= 60                                  // 061–087 flagged pending (static)
isCurrent = i === 66                                 // codebase head fixed at 067
tables    = 1 + ⌊sr(i·7)·4⌋                          // 1–4 tables added (synthetic)
columns   = tables × (2 + ⌊sr(i·7+1)·6⌋)             // 2–7 cols per table
indices   = ⌊sr(i·7+2)·3⌋                            // 0–2 indices
SCHEMA_DIFFS = MIGRATION_DESCRIPTIONS mapped to the seeded {tables,columns,indices}
GROWTH    = cumulative Σ tables, Σ columns across the chain
```

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Current head (codebase) | 067 (`i===66`) | code constant (note: guide text says 134) |
| Pending range | 061–087 | static flag |
| Tables per migration | 1 + ⌊sr·4⌋ | synthetic |
| Columns per table | 2 + ⌊sr·6⌋ | synthetic |
| Indices per migration | ⌊sr·3⌋ | synthetic |
| Migration descriptions | `MIGRATION_DESCRIPTIONS` map | real migration titles |

There is a documented inconsistency: the on-page head is **067** while the guide's data points cite
codebase head **134** and applied head **129**. The code's 067 reflects the era this page was written;
the platform migration chain later reached 134 (per platform_state / MEMORY). The console was not
updated to the live head.

### 7.3 Calculation walkthrough

Each migration index `i` yields a seeded schema-diff (`tables/columns/indices`). `SCHEMA_DIFFS` joins
those to `MIGRATION_DESCRIPTIONS`. `GROWTH` accumulates `tables` and `columns` left-to-right to draw
the schema-growth area chart. `totalTables = Σ m.tables`, `totalColumns = Σ m.columns` populate KPIs.
Head/pending status is read from the static `isCurrent`/`isPending` flags, not from any DB query.

### 7.4 Worked example

Migration 062 (`i = 61`, pending): `tables = 1 + ⌊sr(61·7)·4⌋`. If `sr(427) = 0.55`,
`tables = 1 + ⌊2.2⌋ = 3`; `columns = 3 × (2 + ⌊sr(428)·6⌋)`, with `sr(428)=0.30` → `3 × (2+1) = 9`;
`indices = ⌊sr(429)·3⌋`, `sr(429)=0.7` → 2. So the diff for 062 shows +3 tables, +9 columns, +2
indices — and `GROWTH` at 062 = the running totals through 061 plus this delta. None of these counts
reflect the real DDL of migration 062; they are seeded illustrations.

### 7.5 Data provenance & limitations

- **No connection to a database.** Applied head, drift, and per-migration schema deltas are synthetic
  (`sr(seed) = frac(sin(seed+1)×10⁴)`). Only the migration *titles* are real.
- Head is stale (067 in code vs 134 live) — the console would mislead an operator about true drift.
- No destructive-vs-additive DDL classification, no dry-run, no real rollback — the buttons are UI
  affordances over a static model.

**Framework alignment:** Alembic migration framework — the console mirrors Alembic's revision-chain and
head concepts (`alembic_version` head vs codebase head) but does not query them. A production console
would read `alembic_version` on each environment, diff against `alembic heads`, parse `versions/*.py`
for `op.drop_*` (destructive) vs `op.add_*/create_*` (additive) to weight risk, and offer a real
`alembic upgrade --sql` dry-run. PostgreSQL DDL-locking behaviour would inform the risk weighting the
guide's MDS envisions.

## 9 · Future Evolution

### 9.1 Evolution A — Read the real revision state; classify real DDL risk (analytics ladder: rung 1 → 2)

**What.** §7 documents a console that would actively mislead an operator: the
displayed head is frozen at 067 while the live chain reached 134+ (the guide's own
data points cite 134/129), pending status is a static `i >= 60` flag, per-migration
schema deltas are `sr()`-seeded, and the platform's *actual* migration pain — the
known two-head Alembic state (054/135) whose merge has been repeatedly deferred —
is invisible to the one module that exists to show it. The guide's Migration Drift
Score is uncomputed. Evolution A makes this the real console.

**How.** (1) Live state: a backend route running `alembic heads`/`alembic current`
equivalents — read `alembic_version` from the DB and parse the `versions/`
directory for the codebase chain, exposing applied head(s), codebase head(s), and
the pending list; the two-head condition renders as the prominent warning it
deserves, with the documented merge+stamp remediation. (2) Real diffs: parse each
migration file's operations (`op.create_table`, `op.add_column`, `op.drop_*`) —
deterministic AST work the platform's Atlas builder already does elsewhere —
classifying additive vs destructive DDL and computing the guide's MDS with a
documented risk weight per operation type. (3) Dry run: `alembic upgrade --sql`
output rendered as the preview; apply/rollback actions gated by environment and
RBAC (destructive operations in prod require confirmation, or are display-only).
(4) Delete the seeded diff generator and static flags.

**Prerequisites (hard).** Careful permission design — a migration console is the
most dangerous admin surface on the platform; read-only first, mutations later if
ever. The two-head merge itself remains a platform task this console should
surface, not perform silently. **Acceptance:** the console shows the true current
head(s) including the two-head state; a migration adding a table classifies
additive, one dropping a column destructive; the pending list matches
`alembic history` output exactly.

### 9.2 Evolution B — Migration-review copilot for schema changes (LLM tier 1)

**What.** Before applying a pending migration, operators want a plain-language
answer to "what does this do and what could it break?" Evolution B reads the
(post-Evolution A) parsed operations and drafts the review: tables/columns
touched, destructive operations highlighted with lock-behavior notes (Postgres
DDL locking is exactly the arcana §7's framework-alignment section names),
downstream modules affected via the Atlas table→module map, and a
go/no-go-considerations checklist — grounded in the parsed diff, never in the
migration's filename optimism.

**How.** Tier-1 over the parsed operation lists plus the Atlas interconnection
data (which modules read each table — the blast-radius map already exists);
lock-behavior notes from a curated Postgres DDL reference. The copilot reviews and
explains; applying remains a human action through the console's gated controls.
Reviews attach to the migration record for the audit trail.

**Prerequisites.** Evolution A's parser and live state (reviewing seeded diffs is
noise); the table→module map from the Atlas. **Acceptance:** a review of a real
pending migration lists exactly the parsed operations; destructive ops are never
summarized as safe; affected-module lists match the Atlas map for the touched
tables.