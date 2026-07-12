## 7 · Methodology Deep Dive

> ℹ️ No MODULE_GUIDES entry exists for this route. This is a **platform-governance module**, not
> a quantitative analytics module — its "methodology" is an RBAC + module-lifecycle model.
> Documented from `AdminPanelPage.jsx`, `data/moduleRegistry.js` and `hooks/useAdminApi.js`.

### 7.1 What the module computes

Three governed inventories, all keyed on route paths:

1. **Module registry** (`moduleRegistry.js`) — a hand-curated grouped list of platform modules
   which, at import time, merges in auto-discovered `module.config.js` manifests (`AUTO_NAV`),
   additive and de-duplicated by path:
   `known = new Set(MODULE_REGISTRY.flatMap(g => g.modules.map(m => m.path)))`. After the merge
   the registry spans ~107 nav groups; `TOTAL_MODULES = ALL_MODULE_PATHS.length` is the derived
   platform-wide module count used as the denominator of every coverage statistic.
2. **RBAC model** — 5 static roles × 6 admin permissions plus a module-access mode:

| Role | moduleAccess | Manage Users/Roles/Modules | View Audit | Invite | Export |
|---|---|---|---|---|---|
| Super Admin | all | ✓ / ✓ / ✓ | ✓ | ✓ | ✓ |
| Team Member | preset | ✗ | ✗ | ✗ | ✓ |
| Partner | preset | ✗ | ✗ | ✗ | ✓ |
| Demo User | preset | ✗ | ✗ | ✗ | ✗ |
| Viewer | preset | ✗ | ✗ | ✗ | ✗ |

3. **Module lifecycle state** — per-path maturity (`draft → review → beta → production`) and a
   refinement-assignment board (`unassigned / in_progress / in_review / done`).

### 7.2 Parameterisation — workflows and rubrics

**Maturity state machine** (`MATURITY_ACTIONS`):

| Action | From | To |
|---|---|---|
| submit | draft | review |
| approve | review | beta |
| promote | beta | production |
| reject | * (any) | draft |

Promotion can be gated by `validateModule(module_path, build)` →
`POST /api/admin/refinement/validate` returning `{ pass, findings, buildOk }` — the per-module
refinement system's validation gate.

**Backend API surface** (`useAdminApi.js`, all requiring a super_admin Bearer token):
Users (`GET/POST /api/admin/users`, `PUT …/{id}/role`, `POST …/{id}/deactivate`), Presets,
Invites (create/revoke), Access overrides (`/api/admin/access/grant|deny`, `DELETE
/access/{id}`), Module review (`PUT /api/admin/modules/review`, `bulk-review`, `feedback`,
`GET /modules/status`, `maturity-map`) and Refinement assignments
(`/api/admin/refinement/assignments`, `/validate`). Initial load uses `Promise.allSettled`
over five GETs so one failing endpoint does not blank the panel.

### 7.3 Calculation walkthrough — the derived numbers

- **Access coverage per preset/user:** `pct = round(eff.length / TOTAL_MODULES × 100)` where
  `eff` is the effective allowed-path set (preset paths ± grant/deny overrides).
- **Group heatmap:** per registry group, coverage fraction `pct` mapped to a fill opacity
  `round(pct × 100 + 20)` — a purely visual scale (darker = more of the group granted).
- **Module distribution chart:** first 8 registry groups by module count.
- **Audit-log analytics:** entries carry timestamps; recency is bucketed by
  `ago = floor((now − e.ts) / dayMs)` and action types are the distinct set
  `[...new Set(auditLog.map(e => e.action))]` for the filter dropdown.
- **Role matrix (Tab 3):** `SECTION_GROUPS` renders Administration permissions from
  `ROLE_MAP[r.id][p.id]` plus nine descriptive Domain Access rows (Disclosure, Climate
  Alignment, Portfolio, Physical Risk, Carbon Markets, Insurance, ESG, Nature, …) — the domain
  rows are presentational groupings, not separately enforced permissions.

### 7.4 Worked example — effective access percentage

A Partner user on a preset containing 120 module paths, with 3 admin `grant` overrides and 5
`deny` overrides, on a platform where `TOTAL_MODULES = 805`:

| Step | Computation | Result |
|---|---|---|
| Effective set | 120 + 3 − 5 | 118 paths |
| Coverage | round(118 / 805 × 100) | **15%** |
| Group heatmap opacity (a group 40% covered) | round(0.40 × 100 + 20) | 60 |

The dashboard reports this user as having 15% platform coverage; the heatmap shades each nav
group by its own within-group fraction.

### 7.5 Companion features

- **Bulk maturity review:** multi-select (`selectAll = set(filtered paths)`) then one
  `bulk-review` call applies submit/approve/promote/reject to every selected path.
- **Refinement Board:** assignment form capturing `module_path, assignee_id, status,
  branch_name, alembic_revision_claim, target_maturity, notes` — the operational anchor of the
  per-module ownership system (each teammate refines one module end-to-end; the Alembic
  revision claim prevents migration-number collisions between parallel branches).
- **Invites/Presets:** role-scoped invite issuance with optional module overrides, expiry
  (`access_duration_days`) and display organisation.

### 7.6 Data provenance & limitations

- **No synthetic PRNG data** — all live data comes from the admin API; the file retains a
  legacy localStorage mock store (`a2_admin_store`) as a fallback code path.
- The 5 roles and 6 permissions are hard-coded client-side; the server is the actual enforcement
  point (client rendering of the matrix is informational). Any drift between the client ROLES
  table and backend RBAC rules would not be detected by this page.
- Domain-access rows in the role matrix are static labels, not computed from real grants.
- `TOTAL_MODULES` depends on the auto-discovery merge executing at import time; modules without
  a `module.config.js` manifest and absent from the curated list are invisible to coverage math.

### 7.7 Framework alignment

- **RBAC (NIST-style role-based access control)** — roles bundle permissions; per-user
  grant/deny overrides implement exception-based access on top of role presets (comparable to
  NIST RBAC "permission assignment" with per-object ACL overrides).
- **Software release management** — the draft/review/beta/production ladder with a validation
  gate mirrors standard stage-gate release governance (build check + findings review before
  promotion).
- **Audit logging** — timestamped, actor-attributed action records support the traceability
  expectations of SOC 2-style access-control auditing; the page provides filtering/recency
  views but no tamper-evidence (a production audit trail would be append-only server-side).
