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
