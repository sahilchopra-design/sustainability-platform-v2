# Preserve & Duplicate (Copy-on-Write) Sandbox Architecture

_Module isolation, per-developer sandboxing, and promotion gates for the A² Intelligence platform._
_Grounded in a measured dependency audit of the actual codebase (2026-07-02). Builds on the existing
per-module refinement system (commit `ed29582`): auto-discovery, ownership table, scaffolder, validator,
worktree workflow._

---

## Phase 1 — Dependency Mapping & Architectural Audit (measured, not assumed)

### 1.1 Scale

| Layer | Count |
|---|---|
| Frontend feature modules (`frontend/src/features/*`) | **820 dirs** (805 routed) |
| Backend route files (`api/v1/routes/*.py`) | **254** |
| Backend calculation engines (`services/*.py`) | **~293** |
| DB tables created by migrations | **257** (566 live incl. out-of-band) |
| …of which per-module verticals (`ep_*`) | **18** (the rest are shared/domain tables) |

### 1.2 Shared vs module-specific resources (the coupling map)

**Backend engines — LOW coupling (good news).**
305 engine imports across 254 route files resolve to 256 *distinct* engines → the platform is
overwhelmingly **1 route ↔ 1 engine**. Only **~15 engines are true shared resources**:

| Shared engine | Route fan-in |
|---|---|
| `assessment_methodology_manager` | 6 |
| `data_hub_client` | 5 |
| `portfolio_analytics_engine`, `maritime_engine`, `hydrogen_economy_engine`, `facilitated_emissions_engine`, `cdr_engine`, `cbam_calculator` | 4 each |
| `unified_valuation_engine`, `sustainability_calculator`, `just_transition_engine`, `crrem_stranding_engine`, `assessment_runner` | 3 each |
| `scope3_categories_engine`, `prudential_climate_risk_engine` (+7 engine-level callers) | 2 each |

**Frontend — excellent horizontal isolation, vertical hotspots.**
- **Zero cross-feature imports** (no feature imports another feature). Each page defines its own local
  `T` token object — theming is already copy-isolated.
- Coupling is **vertical**, through shared infrastructure:
  - `App.js` — **3,701-line routing monolith** (lazy imports + `<Route>`s + NAV_GROUPS). Every module
    addition/removal touches it *unless* the module uses auto-discovery (`module.config.js`), which only
    **1 of 820** modules has adopted so far.
  - **~12 shared context providers** (`AuthContext`, `PortfolioContext`, `CarbonCreditContext`,
    `ReferenceDataContext`, `ClimateRiskContext`, …) consumed by **35 features**.
  - `features/_shared/` — 8 shared analytics wrappers consumed by **42 features** (sprint families:
    EnergyAdvancedAnalytics, IndiaAdvancedAnalytics, AdvisoryToolkit, …).
  - `data/moduleGuides.js`, admin `moduleRegistry.js` — global registries.

**Database — the real single point of failure.**
One shared Postgres (Supabase). Only 18 tables follow the per-module `ep_<code>_<entity>` vertical
pattern; the remaining ~240+ are shared domain tables (`portfolios_pg`, `assets`, `reference_data`,
`calculation_parameters`, domain families). A schema or data change made "for one module" is visible to
every module reading that table. Alembic has a **branched history** (heads 054/135/refine01) and the
`down_revision` chain + `db/base.py:init_db()` are **serialized touch-points** (one-at-a-time edits).

### 1.3 Single points of failure (ranked)

1. **Shared Postgres schema + data** — a mutation by one developer is instantly live for all modules.
2. **The 15 shared engines** — an edit for module A silently changes results in 2–6 other modules
   (`prudential_climate_risk` has 7 additional engine-level callers).
3. **`App.js` / `moduleGuides.js` / `db/base.py` / Alembic chain** — the 4 merge-conflict hotspots;
   any malformed edit takes down *all* routes, not one.
4. **Shared contexts & `_shared` wrappers** — 35–42 module blast radius per change.
5. **`server.py` manual router includes** — same pattern as App.js on the backend (mitigated by the
   existing auto-include loop).

### 1.4 Overwrite-risk register

| Risk | Scenario | Today's exposure |
|---|---|---|
| **R1 Shared-engine drift** | Dev "tunes" `cbam_calculator` for their module; 3 other modules' regulatory numbers silently change | HIGH — only 13 engines have bench_quant regression cases; guardrail CI covers only rng |
| **R2 Shared-table mutation** | Dev writes test rows / ALTERs a shared table from their module's seed script | HIGH — single DB, dev work happens against prod Supabase |
| **R3 Registry clobber** | Two devs edit App.js/moduleGuides/init_db concurrently → merge conflict or broken global router | MEDIUM — worktrees exist, but 819/820 modules still route manually |
| **R4 Context/API contract break** | Dev changes a shared context's shape or a shared wrapper's props | MEDIUM — 35–42 consumers, no contract tests |
| **R5 Migration-chain fork** | Two devs claim the same Alembic `down_revision` | KNOWN — already happened (branched heads) |

**Architectural conclusion:** the platform is *already* ~94% module-isolated horizontally. The
Copy-on-Write design therefore does **not** need to duplicate 500 environments — it needs to
(a) sandbox the 4 vertical hotspots, (b) shadow only a module's *own* data, (c) overlay only the
engines a developer actually touches, and (d) expose shared resources **read-only** to sandboxes.

---

## Phase 2 — The "Preserve & Duplicate" Architecture

### 2.0 Design principles

1. **The branch/worktree is the code copy; the sandbox is the runtime copy.** Git already gives us
   perfect code CoW (`scripts/module-worktree.sh` exists). What's missing is *runtime* isolation:
   data, engine resolution, and UI routing.
2. **Copy-on-write, not copy-everything.** At assignment time we copy only the module's *own* `ep_*`
   tables (small). Shared tables are exposed **read-only**. Engines are copied **only when the
   developer edits one** (overlay). This keeps 50 concurrent sandboxes from ballooning the DB.
3. **Prod is never routed through anything new.** Sandboxing is *additive*: a new schema, a new URL
   prefix, an overlay directory. If every sandbox artifact were deleted tonight, production wouldn't
   notice.
4. **One source of truth for access**: the `module_sandboxes` table (extends the existing
   `module_refinement_assignments` system), enforced by middleware — not by convention.

### 2.1 The sandbox lifecycle

```
ASSIGN (admin, Refinement Board)                     PROMOTE (admin, gated)
   │                                                      ▲
   ▼                                                      │
┌─────────────────────────────────────────────┐   validate-module.js PASS
│ 1. row in module_sandboxes (status=active)  │   bench/regression PASS
│ 2. pg schema sbx_<user>_<module> created;   │   guardrail PASS
│    module-owned tables copied into it       │   build PASS + diff review
│ 3. branch module/<route>/<user> + worktree  │        │
│ 4. features/<module>/ copied →              │        ▼
│    features/<module>--sbx-<user>/ with      │   merge branch → main
│    module.config.js (auto-discovered at     │   apply engine-overlay diff via PR
│    /sandbox/<user>/<route>)                 │   swap/merge shadow schema data
│ 5. engine overlay dir (empty = falls back)  │   drop sbx schema, delete overlay,
└─────────────────────────────────────────────┘   remove --sbx feature dir
```

### 2.2 Database: schema shadowing (not table suffixes)

Use a **Postgres schema per sandbox**, not `_v2`/`_dev_user` table suffixes — suffixes force every
query in the module to be rewritten; a schema swap requires **zero query changes** because SQLAlchemy
2.0 supports `schema_translate_map` on the connection.

- On assignment: `CREATE SCHEMA sbx_<user>_<module>`; for each table in the module's manifest
  (`ep_*` verticals): `CREATE TABLE sbx.… (LIKE public.… INCLUDING ALL); INSERT … SELECT`.
- **Shared tables** (reference_data, portfolios_pg, domain tables): *not copied*. The sandbox DB role
  gets `SELECT`-only grants on `public` — reads work transparently, writes to shared state are
  **rejected by the database itself**, not just by convention.
- Requests carrying a valid sandbox context get a Session whose connection uses
  `schema_translate_map={None: "sbx_<user>_<module>"}` with fallback search_path
  `sbx_…, public` — module tables resolve to the shadow, shared tables resolve to prod (read-only).
- Sandbox migrations run **only inside the sandbox schema** (alembic `-x sandbox=<id>` wrapper); the
  public Alembic chain is untouched until promotion.

Cost control: a sandbox costs only its module's rows (typically ≤ a few thousand). A nightly reaper
drops schemas whose `module_sandboxes.status ∈ (promoted, abandoned)` or idle > N days.

### 2.3 Calculation engines: resolver + overlay (true CoW)

Shared engines are never edited in place by a sandbox. A one-file indirection layer resolves engines
per-request:

- `backend/sandbox/engine_resolver.py` — `resolve_engine(name)` checks the active sandbox's overlay
  package `backend/sandbox_overlays/<sandbox_id>/<name>.py` first; falls back to `services/<name>`.
- The developer's copy step is literal CoW: the overlay dir starts **empty** (module runs on shared
  engines); the dev runs `scripts/sandbox-engine.sh <sandbox> <engine>` to copy
  `services/<engine>.py` into their overlay *only when they need to modify it*.
- The other 2–6 modules importing the shared engine are untouched — they import `services.<engine>`
  directly and never see the overlay.
- At promotion, the overlay diff vs the current shared engine is reviewed like any engine PR and must
  pass `bench_quant.py` + the fabrication guardrail.

### 2.4 API routes: sandbox mount + middleware

- Prod routes stay exactly where they are (`/api/v1/<route>/…`).
- A single `sandbox_router` mounts every sandboxed module's (branch-side) router under
  `/api/v1/sandbox/{sandbox_id}/<route>/…`.
- `SandboxMiddleware` (or dependency) validates: sandbox exists, is `active`, and the authenticated
  user **is the assigned developer** (admins pass). It then sets `request.state.sandbox`, which the
  `get_db` dependency uses to hand out the schema-translated Session, and which the engine resolver
  reads. No sandbox header/path → plain prod behavior, byte-identical to today.

### 2.5 Frontend: duplicated feature dir + auto-discovery (zero App.js edits)

Because features have **zero cross-imports**, UI duplication is a directory copy:

- `features/<module>/` → `features/<module>--sbx-<user>/`, with a generated `module.config.js`
  declaring route `/sandbox/<user>/<route>`, nav hidden (or under a "My Sandboxes" group), and
  `sandboxId`.
- The existing `moduleRegistry.auto.js` (require.context glob) discovers it — **no App.js edit**, so
  R3 (registry clobber) is eliminated for sandbox work.
- A tiny `SandboxBoundary` wrapper (in `_shared`) reads `sandboxId` from the config and mounts an
  axios interceptor scoped to that subtree adding `X-Sandbox-Id` — all the page's existing API calls
  transparently hit the sandbox mount. A visible "SANDBOX — <user>" ribbon prevents confusion.
- Live UI at `/<route>` is untouched; maturity gating (existing `module_review_status` tiers) keeps
  sandbox routes invisible to partner/viewer roles.

### 2.6 Shared frontend infrastructure rules

- Shared contexts and `_shared` wrappers are **read-only for sandbox work** by policy + CI: the
  validator fails a sandbox branch that diffs `context/`, `contexts/`, `features/_shared/`, `App.js`,
  or `data/moduleGuides.js` (unless the assignment row carries `write_permissions: ["shared_ui"]`,
  which is an explicit admin grant).
- If a sandbox needs a changed wrapper, it copies the wrapper *into its own feature dir* (CoW again)
  and the promotion review decides whether the improvement graduates into `_shared`.

---

## Phase 3 — Access Criteria & Permission Layer

### 3.1 Access-control source of truth

Extend the existing system: `module_refinement_assignments` (ownership, exists) + new
`module_sandboxes` (runtime isolation state). Admin endpoints live beside the existing
`/api/admin/refinement/*` family; the Refinement Board kanban gains a "Create sandbox" action.

```sql
CREATE TABLE module_sandboxes (
    sandbox_id        TEXT PRIMARY KEY,          -- sbx_<user>_<module-slug>
    module_id         TEXT NOT NULL,             -- feature route, e.g. 'cbam-exposure'
    version           TEXT NOT NULL DEFAULT 'copy'    CHECK (version IN ('prod','copy')),
    assigned_developer TEXT NOT NULL,            -- FK users
    branch            TEXT NOT NULL,             -- module/<route>/<user>
    db_schema         TEXT NOT NULL,             -- sbx_<user>_<module>
    data_scope_restrictions JSONB NOT NULL DEFAULT
        '{"shared_tables":"read_only","row_filter":null}',
    write_permissions JSONB NOT NULL DEFAULT
        '{"module_tables": true, "shared_tables": false, "shared_engines": false, "shared_ui": false}',
    status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','validating','promoted','abandoned')),
    created_at        TIMESTAMPTZ DEFAULT now(),
    promoted_at       TIMESTAMPTZ
);
```

(`access_control.json` is generated *from* this table for CI consumption — the DB row is authoritative;
a JSON file alone can't be enforced at runtime.)

### 3.2 Enforcement layers (defense in depth)

| Layer | Mechanism |
|---|---|
| **Git** | Branch protection on `main`; sandbox branches `module/<route>/<user>`; CODEOWNERS maps `features/<module>/**`, `api/v1/routes/<module>.py`, `services/<module>_engine.py` to the assignee, and the 4 hotspot files + shared engines to platform owners |
| **CI** | `validate-module.js --strict` fails the branch if the diff leaves the module's allowed paths (computed from the assignment row); guardrail + bench + build required checks |
| **Runtime API** | SandboxMiddleware: sandbox endpoints require assignee identity; **prod write endpoints reject `role=developer` for modules that have an active sandbox** (write-freeze on the module being enhanced is optional per assignment) |
| **Database** | Sandbox DB role: `SELECT` on `public`, `ALL` on own `sbx_*` schema only — a stray `UPDATE public.reference_data` fails at the DB, not in code review |

### 3.3 Promotion / merge-back criteria (the gate)

An enhanced copy may overwrite the production baseline only when **all** pass:

1. `scripts/validate-module.js <route> --strict --build` — zero HARD findings (undefined T tokens,
   manifest completeness, build).
2. **Engine regression**: if the overlay contains any engine, `benchmark/bench_quant.py` passes and a
   *new* bench case covering the changed formula is included (same bar as the remediation campaign).
3. **Fabrication guardrail** (`tools/check_no_fabricated_random.py`) — no new rng-as-data.
4. **Data migration review**: sandbox-schema diff vs public rendered as an Alembic migration claiming
   the next `down_revision` via the Refinement Board (serialization point, by design).
5. **Contract check**: response field names of the module's endpoints unchanged, or the change is
   flagged breaking + frontend updated in the same branch.
6. Diff review + approval by a platform owner (CODEOWNERS enforces this for shared-file touches).

Then: merge branch → `main`; engine overlay applied to `services/`; shadow-schema data merged or
discarded per the review; sandbox row → `promoted`; reaper drops the schema and `--sbx` feature dir.

---

## Phase 4 — Blueprint, Branching, Pilot

### 4.1 Copy-on-Write blueprint for ONE module

Everything below is additive; nothing in prod imports it.

**(a) `backend/sandbox/context.py` — request-scoped sandbox context**

```python
"""Sandbox context: resolves an incoming request to an active sandbox row."""
from contextvars import ContextVar
from fastapi import Depends, Header, HTTPException
from sqlalchemy import text

_current_sandbox: ContextVar[dict | None] = ContextVar("current_sandbox", default=None)

def current_sandbox() -> dict | None:
    return _current_sandbox.get()

async def require_sandbox(
    sandbox_id: str,
    x_user=Depends(get_current_user),          # existing auth dependency
    db=Depends(get_admin_db),
):
    row = db.execute(text("""
        SELECT sandbox_id, module_id, assigned_developer, db_schema,
               write_permissions, status
        FROM module_sandboxes WHERE sandbox_id = :sid
    """), {"sid": sandbox_id}).mappings().first()
    if not row or row["status"] != "active":
        raise HTTPException(404, "Sandbox not found or not active")
    if x_user.role != "admin" and x_user.username != row["assigned_developer"]:
        raise HTTPException(403, "Sandbox is assigned to another developer")
    _current_sandbox.set(dict(row))
    return dict(row)
```

**(b) `backend/sandbox/db.py` — schema-translated sessions (zero query rewrites)**

```python
"""Hands out Sessions routed to the sandbox schema; shared tables fall back read-only."""
from sqlalchemy.orm import sessionmaker
from db.base import engine  # existing prod engine

def sandbox_session(db_schema: str):
    # Module-owned tables resolve to the shadow schema; anything not present there
    # falls back to public via search_path — where the sandbox role is SELECT-only.
    conn = engine.connect().execution_options(
        schema_translate_map={None: db_schema}
    )
    conn.exec_driver_sql(f'SET search_path TO "{db_schema}", public')
    return sessionmaker(bind=conn)()

def get_db_sandbox_aware():
    """Drop-in replacement for get_db inside sandbox-mounted routers."""
    sbx = current_sandbox()
    if sbx is None:
        yield from get_db()                    # prod path: byte-identical to today
        return
    s = sandbox_session(sbx["db_schema"])
    try:
        yield s
    finally:
        s.close()
```

**(c) `backend/sandbox/engine_resolver.py` — engine overlay (copy only what you change)**

```python
"""resolve_engine('cbam_calculator') -> overlay module if the sandbox copied it, else shared."""
import importlib, importlib.util, os

OVERLAY_ROOT = os.path.join(os.path.dirname(__file__), "..", "sandbox_overlays")

def resolve_engine(name: str):
    sbx = current_sandbox()
    if sbx:
        path = os.path.join(OVERLAY_ROOT, sbx["sandbox_id"], f"{name}.py")
        if os.path.exists(path):               # CoW: exists only if the dev copied it
            spec = importlib.util.spec_from_file_location(
                f"sandbox_overlays.{sbx['sandbox_id']}.{name}", path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            return mod
    return importlib.import_module(f"services.{name}")
```

**(d) `backend/api/v1/routes/sandbox_mount.py` — the sandbox URL space**

```python
router = APIRouter(prefix="/api/v1/sandbox/{sandbox_id}",
                   dependencies=[Depends(require_sandbox)])
# The module's own router is included here on its branch. Prod mounts are untouched.
# Module route files swap two lines when sandbox-converted:
#   db: Session = Depends(get_db)          ->  Depends(get_db_sandbox_aware)
#   from services.cbam_calculator import X ->  X = resolve_engine("cbam_calculator").X
```

**(e) Provisioning — `scripts/create-sandbox.py <module-route> <developer>`**

```python
# 1. INSERT module_sandboxes row (sandbox_id = f"sbx_{dev}_{slug}")
# 2. CREATE SCHEMA sbx_...;
#    for t in manifest.module_tables:   # the module's ep_* verticals only
#        CREATE TABLE sbx.t (LIKE public.t INCLUDING ALL); INSERT ... SELECT;
# 3. GRANT SELECT ON ALL TABLES IN SCHEMA public TO role_sandbox_dev;
#    GRANT ALL ON SCHEMA sbx_... TO role_sandbox_dev;
# 4. bash scripts/module-worktree.sh <route> <developer>      # existing script
# 5. cp -r frontend/src/features/<route> features/<route>--sbx-<dev>/
#    write module.config.js {route: f"/sandbox/{dev}/{route}", sandboxId, hidden nav}
# 6. mkdir backend/sandbox_overlays/<sandbox_id>/              # empty = shared engines
```

**(f) Frontend — `features/<module>--sbx-<dev>/module.config.js`**

```js
module.exports = {
  route: '/sandbox/jane/cbam-exposure',
  title: 'CBAM Exposure — SANDBOX (jane)',
  navGroup: 'My Sandboxes',
  sandboxId: 'sbx_jane_cbam-exposure',   // SandboxBoundary adds X-Sandbox-Id to axios
  component: () => import('./pages/CbamExposurePage'),
};
```

Auto-discovery (`moduleRegistry.auto.js`, already shipped) picks this up — **no App.js edit**, no
registry conflict, prod route untouched.

### 4.2 Git / workspace branching strategy

**Recommendation: monorepo + worktrees + generated CODEOWNERS.** (Not micro-repos — 820 modules would
mean 820 repos and shared-engine changes spanning dozens of them. Not Nx/Turborepo — the frontend is a
single CRA app and the isolation problem is runtime/data, not build orchestration. The
`module.config.js` auto-discovery IS the workspace boundary.)

```
main (protected)  ── production baseline; required checks: build, validator,
                     bench_quant, fabrication guardrail
│
├── module/<route>/<user>     ← THE sandbox copy (one per assignment)
│     created by create-sandbox.py via existing module-worktree.sh;
│     dev works in a git worktree → hotspot files never conflict locally
│
├── shared/<engine-or-infra>  ← explicit, admin-approved shared-resource work
│     (requires write_permissions.shared_engines; CODEOWNERS routes to platform owners)
│
└── release/*                 ← optional staging cut
```

- **Branch protection on `main`**: no direct pushes; PR + required checks + CODEOWNERS review.
- **CODEOWNERS (generated from `module_sandboxes`)**: `features/<route>/**` + its route/engine files →
  assignee; `App.js`, `moduleGuides.js`, `db/base.py`, `alembic/versions/**`, `services/<the 15 shared
  engines>.py`, `context*/`, `features/_shared/**` → platform owners.
- **Diff-scope CI**: a job diffs the PR against the assignment's allowed paths and fails on any file
  outside them (the `write_permissions` JSON is the source).
- Alembic `down_revision` IDs are claimed at assignment time through the Refinement Board (existing
  convention) — eliminates the migration-fork failure mode.

### 4.3 Pilot migration guide (3–5 modules, phased)

**Pilot cohort — chosen to cover every coupling class:**

| Pilot | Module | Why |
|---|---|---|
| P1 | `real-estate-carbon-analytics` | Already the refinement-system reference conversion (ep_ table + useModuleData + validator PASS) — fastest proof |
| P2 | A dedicated-engine module (1:1 route↔engine, own `ep_*` table) | The 94% common case |
| P3 | A `cbam_calculator` consumer | Shared-engine overlay test: prove the other 3 consumers are unaffected |
| P4 | A `PortfolioContext`/`_shared`-consuming module | Shared-UI read-only rule + wrapper CoW test |
| P5 | A UI-only module (no own tables) | Degenerate case: sandbox = branch + feature-dir copy only |

**Week 1 — Foundation (no module touched):**
1. Migration: `module_sandboxes` table (+ claim revision id via the Board).
2. Land `backend/sandbox/` (context, db, engine_resolver, sandbox_mount) — additive, imported by
   nothing in prod. Smoke test: prod boots byte-identical; `/api/v1/sandbox/*` 404s cleanly.
3. `create-sandbox.py` / `destroy-sandbox.py`; sandbox DB role with SELECT-only public grants.
4. CI: diff-scope check + generated CODEOWNERS; wire into the existing required checks.

**Week 2 — P1 + P2 (happy path):**
5. Provision P1 for a real developer. Verify the four isolation properties:
   (a) prod route + API + data unchanged (diff the lineage-harness trace before/after);
   (b) sandbox UI at `/sandbox/<user>/<route>` reads/writes only `sbx_*` schema;
   (c) `UPDATE public.reference_data` from the sandbox **fails at the DB**;
   (d) destroy-sandbox leaves zero residue.
6. Repeat on P2 including one sandbox-side migration (column add) that never touches public.

**Week 3 — P3 + P4 (the hard cases):**
7. P3: dev copies `cbam_calculator.py` into the overlay, changes a factor; assert the sandbox result
   changes while the other 3 CBAM consumers (hit via lineage harness) are bit-identical.
8. P4: assert validator fails a sandbox diff touching `_shared/`; then do the sanctioned wrapper-copy
   CoW and pass.

**Week 4 — Promotion + P5:**
9. Promote P2 through the full gate (validator → bench → guardrail → migration claim → review →
   merge) and confirm prod picks up the enhancement with the sandbox reaped.
10. P5 quick-run; write `docs/SANDBOX_RUNBOOK.md` from what was learned; only then schedule the
    fleet rollout (module.config adoption batch-by-batch, nav-group at a time — never all 500).

**Rollback safety at every step:** every artifact is additive (new schema / new dir / new branch /
new mount). Full abort = `destroy-sandbox.py` × N + revert the two foundation commits.
