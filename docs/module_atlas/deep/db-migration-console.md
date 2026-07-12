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
