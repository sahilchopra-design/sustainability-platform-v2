# Admin Panel
**Module ID:** `admin-panel` · **Route:** `/admin-panel` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (3 files)
**Components/functions:** `ALL_MODULE_PATHS`, `ANALYST_MODULES`, `AuditLogTab`, `Avatar`, `Btn`, `Card`, `DEMO_MODULES`, `DashboardTab`, `Drawer`, `Inp`, `InvitesTab`, `KpiCard`, `Label`, `MAIN_TABS`, `MATURITY_ACTIONS`, `MATURITY_COLORS`, `MATURITY_LABELS`, `MODULE_REGISTRY`, `MaturityTab`, `Modal`, `ModuleManagerTab`, `ModulePicker`, `PARTNER_MODULES`, `PERMISSIONS`, `PresetsTab`, `REFINE_STATUSES`, `ROLES`, `ROLE_MAP`, `RefinementBoardTab`, `RoleBadge`, `RoleMatrixTab`, `STORE_KEY`, `SearchBar`, `Sel`, `SettingsTab`, `SeverityDot`, `StatusBadge`, `TOTAL_MODULES`, `Tabs`, `UserProfileDrawer`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODULE_REGISTRY` | 107 | `icon`, `color`, `modules`, `path`, `label` |
| `ROLES` | 6 | `label`, `color`, `description`, `moduleAccess`, `canManageUsers`, `canManageRoles`, `canManageModules`, `canViewAudit`, `canInvite`, `canExport` |
| `PERMISSIONS` | 7 | `label` |
| `SECTION_GROUPS` | 11 | `items`, `getValue` |
| `MAIN_TABS` | 11 | `label`, `icon` |
| `MATURITY_ACTIONS` | 5 | `label`, `from`, `to` |
| `REFINE_STATUSES` | 5 | `label`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `known` | `new Set(MODULE_REGISTRY.flatMap(g => g.modules.map(m => m.path)));` |
| `res` | `await axios.post('/api/admin/users', data);` |
| `ROLE_MAP` | `Object.fromEntries(ROLES.map(r => [r.id, r]));` |
| `diff` | `Date.now() - ts;` |
| `groupPaths` | `MODULE_REGISTRY.find(g => g.group === group)?.modules.map(m => m.path) \|\| [];` |
| `gpaths` | `group.modules.map(m => m.path);` |
| `ago` | `Math.floor((now - e.ts) / dayMs);` |
| `moduleDistData` | `useMemo(() => MODULE_REGISTRY.slice(0, 8).map(g => ({` |
| `pct` | `Math.round((eff.length / TOTAL_MODULES) * 100);` |
| `heatmapData` | `useMemo(() => MODULE_REGISTRY.map(g => ({` |
| `opacity` | `Math.round(pct * 100 + 20);` |
| `actionTypes` | `[...new Set(auditLog.map(e => e.action))];` |
| `selectAll` | `() => setSelected(new Set(filtered.map(m => m.path)));` |
| `tabsWithCounts` | `MAIN_TABS.map(t => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEMO_MODULES`, `MAIN_TABS`, `MATURITY_ACTIONS`, `MODULE_REGISTRY`, `PARTNER_MODULES`, `PERMISSIONS`, `REFINE_STATUSES`, `ROLES`, `SECTION_GROUPS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Governance analytics over the live audit trail (analytics ladder: rung 1 → 2)

**What.** This is a platform-governance module, not a quant engine — it already runs on
live admin APIs (users, presets, invites, access overrides, maturity review, refinement
assignments) with no PRNG data. Its honest analytics gap is that the numbers it derives are
static registry arithmetic (`pct = eff/TOTAL_MODULES`, group heatmap opacity) while the
platform's 18 `audit_*` tables capture everything and surface here only as a filterable
list. Evolution A turns the Audit Log tab into real usage analytics: materialized views
(roadmap D4) computing module DAU, access-denial hot spots, invite conversion, maturity-
transition velocity (draft→production lead time from `MATURITY_ACTIONS` events), and
refinement-board cycle time per assignee.

**How.** New `GET /api/admin/analytics/usage` and `/analytics/maturity-funnel` endpoints
backed by scheduled aggregations over `audit_*`; the Dashboard tab's module-distribution
chart gains an activity overlay (granted vs actually-used modules — the gap is the
license-hygiene signal). Also close the §7.6-documented drift risk: a nightly check
comparing the client-side hard-coded `ROLES` matrix against backend RBAC rules, surfaced
as a dashboard warning when they diverge, plus flagging modules invisible to coverage math
(no `module.config.js` manifest and absent from the curated registry).

**Prerequisites.** Materialized-view migration; audit retention policy defined before
aggregating (D4); server-side append-only guarantee documented since §7.7 notes the trail
has no tamper-evidence. **Acceptance:** dashboard shows per-module 30-day active users
sourced from audit tables; an artificial client/server role-matrix divergence triggers the
drift warning.

### 9.2 Evolution B — Access-governance copilot over the admin API (LLM tier 2)

**What.** A tool-calling assistant for super-admins answering "who can see the carbon
desk?", "which Partner users touched physical-risk modules this month?", and "draft an
invite for an analyst needing the insurance group for 30 days" — by calling the existing
admin surface (`GET /api/admin/users`, `/modules/status`, `/maturity-map`, access
override and invite endpoints) and the Evolution A analytics routes, then answering with
real grant/audit data instead of an admin manually cross-referencing the role matrix
against 107 registry groups.

**How.** Tool schemas from `useAdminApi.js`'s operations; **read-only tools auto-execute,
mutating tools (role changes, grants/denies, invites, deactivation, bulk maturity review)
always render a confirmation card with the exact API payload before firing** — the RBAC
middleware already requires a super_admin Bearer token and the copilot inherits the
session, never a service account. Every copilot-initiated mutation is itself audit-logged
with an `initiated_by: copilot` marker so the trail distinguishes assisted from manual
actions.

**Prerequisites.** RBAC scoping verified so the copilot endpoint is super-admin-only;
prompt-injection review because tool inputs include user-supplied names/notes from the
invite and refinement tables. **Acceptance:** a non-admin session gets a 403 from the
copilot route; "revoke X's access" produces a confirmation card and no API call until
confirmed; every answer about access states cites the endpoint it queried.