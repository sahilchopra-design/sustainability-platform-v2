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
