# Per-Module Refinement Workflow

How one teammate takes one module from frontend-only prototype to a
production-grade, DB-backed vertical — working in parallel with the rest of the
team and **without** touching the shared hotspot files everyone else is editing.

See also: `docs/MODULE_CONTRACT.md` (definition of done) and the approved plan
`.claude/plans/jazzy-watching-fairy.md`.

---

## Why this works in parallel

Adding/refining a module used to require editing four giant shared files
(`App.js` routes + `NAV_GROUPS`, `moduleGuides.js`, `moduleRegistry.js`,
`server.py`). The **auto-discovery layer** removed that: each module's metadata
lives in its own `module.config.js`, aggregated at build time by
`frontend/src/moduleRegistry.auto.js`; backend routers are auto-included by a
loop in `server.py`. So two people on two modules edit **disjoint files**.

The only two serialized touch-points remain:
1. `backend/db/base.py:init_db()` — one appended import line per new model.
2. The Alembic `down_revision` chain — claim the next revision id at assignment
   time (the Refinement Board stores it on the assignment row).

---

## Step-by-step

### 0. Get assigned
In `/admin → Refinement Board`, a lead assigns you a `module_path` and sets it
`in_progress`. The board claims your next Alembic revision id and records your
branch name.

### 1. Create your worktree
```bash
bash scripts/module-worktree.sh /real-estate-carbon-analytics <your-name>
# -> creates ../ra-worktrees/real-estate-carbon-analytics on branch module/real-estate-carbon-analytics
```

### 2. Scaffold the vertical
```bash
node scripts/scaffold-module.js /real-estate-carbon-analytics --entity properties
```
Generates: Alembic migration, `db/models/<module>.py` (+ the `init_db()` line to
add), Pydantic schema, `services/<module>_engine.py`, `api/v1/routes/<module>.py`,
`module.config.js`, and a `seed_<module>.py` stub.

### 3. Port the data
Export the page's current hardcoded constant to committed JSON, then make the
seed idempotent and run it against the existing Postgres DB:
```bash
python backend/scripts/seed_<module>.py
```

### 4. Wire the UI
Swap the page's `const X = [...]` for
`const { data: X = [] } = useModuleData('<moduleKey>', '<resource>', { fallback: X_SEED })`.
Point what-if calculators at the calc endpoint. Move the `MODULE_GUIDES` entry
into the manifest's `guide` field and delete the page's manual `App.js` route +
registry lines (auto-discovery now owns them).

### 5. Validate
```bash
node scripts/validate-module.js /real-estate-carbon-analytics
```
Must be green (bug-class greps + manifest completeness + build). The same script
runs in the pre-push hook and is called server-side before a maturity promotion.

### 6. Promote & merge
Push, open a PR into `remediation-v1`. In the Refinement Board move the module
`review → beta` (server-side validation gate runs). After second-reviewer
sign-off, `beta → production`. Merge; remove the worktree:
```bash
git worktree remove ../ra-worktrees/real-estate-carbon-analytics
```

---

## Conflict checklist (should be empty)
- Did you edit `App.js`, `moduleGuides.js`, or `moduleRegistry.js`? You shouldn't
  need to — only your `module.config.js`. (Deleting your own manual route line is
  the one allowed App.js edit.)
- Did you pick a revision id other than the one the board claimed for you? Don't.
- Two new models in `init_db()` conflicting? Append, don't reorder.
