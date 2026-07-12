# Api::Rbac_Admin
**Module ID:** `api::rbac_admin` · **Route:** `/api/v1/admin/rbac` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/admin/rbac/users` | `list_users` | api/v1/routes/rbac_admin.py |
| POST | `/api/v1/admin/rbac/users` | `create_user` | api/v1/routes/rbac_admin.py |
| PATCH | `/api/v1/admin/rbac/users/{user_id}` | `update_user` | api/v1/routes/rbac_admin.py |
| DELETE | `/api/v1/admin/rbac/users/{user_id}/revoke` | `revoke_user` | api/v1/routes/rbac_admin.py |
| GET | `/api/v1/admin/rbac/presets` | `list_presets` | api/v1/routes/rbac_admin.py |
| POST | `/api/v1/admin/rbac/presets` | `create_preset` | api/v1/routes/rbac_admin.py |
| PATCH | `/api/v1/admin/rbac/presets/{preset_id}` | `update_preset` | api/v1/routes/rbac_admin.py |
| DELETE | `/api/v1/admin/rbac/presets/{preset_id}` | `delete_preset` | api/v1/routes/rbac_admin.py |
| POST | `/api/v1/admin/rbac/invites` | `create_invite` | api/v1/routes/rbac_admin.py |
| GET | `/api/v1/admin/rbac/invites` | `list_invites` | api/v1/routes/rbac_admin.py |
| DELETE | `/api/v1/admin/rbac/invites/{invite_id}/revoke` | `revoke_invite` | api/v1/routes/rbac_admin.py |
| GET | `/api/v1/admin/rbac/module-access/{user_id}` | `get_module_access` | api/v1/routes/rbac_admin.py |
| POST | `/api/v1/admin/rbac/module-access/{user_id}` | `add_module_override` | api/v1/routes/rbac_admin.py |
| DELETE | `/api/v1/admin/rbac/module-access/{user_id}/{module_path:path}` | `remove_module_override` | api/v1/routes/rbac_admin.py |

### 2.3 Engine `email_service` (services/email_service.py)
| Function | Args | Purpose |
|---|---|---|
| `_invite_html` | invite_url, recipient_email, role, org, expires_days | Return (subject, html_body) for an invite email. |
| `send_invite_email` | to_email, invite_url, role, org, expires_days | Send an invite email. Returns True on success, False if not configured or failed. Never raises — failures are logged as warnings so they don't break invite creation. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `an` *(shared)*, `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/admin/rbac/invites** — status `passed`, provenance ['real-db'], source tables: `rbac_access_invites`
Output: `{'type': 'object', 'keys': ['invites'], 'n_keys': 1}`

**GET /api/v1/admin/rbac/module-access/{user_id}** — status `failed`, provenance ['db-empty'], source tables: `users_pg`
Output: `None`

**GET /api/v1/admin/rbac/presets** — status `passed`, provenance ['real-db'], source tables: `rbac_role_presets`
Output: `{'type': 'object', 'keys': ['presets'], 'n_keys': 1}`

**GET /api/v1/admin/rbac/users** — status `passed`, provenance ['real-db'], source tables: `rbac_user_profiles`, `users_pg`
Output: `{'type': 'object', 'keys': ['users', 'total', 'limit', 'offset'], 'n_keys': 4}`

**POST /api/v1/admin/rbac/invites** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**DELETE /api/v1/admin/rbac/invites/{invite_id}/revoke** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/admin/rbac/module-access/{user_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**DELETE /api/v1/admin/rbac/module-access/{user_id}/{module_path:path}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`api/v1/routes/rbac_admin.py` is an **access-control domain, not a quant engine** — its one real
"algorithm" is the effective-permission resolution in `_resolve_effective_paths`:

```
effective_paths(user) =
    None                                   if rbac_role == 'super_admin'   # unrestricted
    (preset.module_paths ∪ grants) − denies    otherwise
```

where `grants`/`denies` are per-user `RbacModuleAccessPG` overrides filtered to those with
`expires_at` null or in the future, and the result is returned sorted. `None` is the sentinel
for "all modules"; a user with no profile resolves to `[]` (no access). Everything else in the
domain is CRUD over four tables: users (`UserPG` + `RbacUserProfilePG`), role presets
(`RbacRolePresetPG`), per-module overrides (`RbacModuleAccessPG`) and invite links
(`RbacAccessInvitePG`).

### 7.2 Authorisation rubric & parameters

| Rule | Value | Provenance |
|---|---|---|
| Endpoint guard | every route `Depends(_require_super_admin)` | session token → `_validate_session` → profile `rbac_role == 'super_admin'` else 403 |
| Roles (email template registry) | super_admin, team_member, partner, demo, viewer | `_invite_html` role_display map |
| Default role on create | `viewer` | `CreateUserBody.rbac_role` default |
| Invite token | `secrets.token_urlsafe(32)` (~256 bits) | CSPRNG — cryptographically random by design |
| Invite validity | 7 days (`timedelta(days=7)`) | hard-coded in `create_invite` |
| Access expiry | `now + access_duration_days` when supplied | set at create/update; enforced downstream at login/middleware |
| Invite statuses | pending / accepted / expired / revoked | `list_invites` filter docstring |
| User list pagination | limit 1–500 (default 50), offset ≥ 0 | Query validators |
| Override semantics | `access_type ∈ {grant, deny}`, unique per (user, module_path); re-POST updates in place | `add_module_override` upsert |

Deletion is soft everywhere: `revoke_user` and `delete_preset` set `is_active=False`;
`revoke_invite` sets `status='revoked'`. Only module-access overrides are hard-deleted.

### 7.3 Flow walkthrough — invite lifecycle

1. `POST /invites` writes an `RbacAccessInvitePG` row carrying the *future* profile (role,
   preset, org, duration, `module_overrides`) plus a URL-safe token, and builds
   `full_invite_url = {PLATFORM_BASE_URL}/invite/{token}` (env default `http://localhost:3000`).
2. It then calls `services/email_service.py::send_invite_email` inside a bare
   `try/except: pass` — email is explicitly **best-effort**; the response reports `email_sent`
   but invite creation never fails on mail errors.
3. `email_service` picks a backend in order: **SendGrid** (`SENDGRID_API_KEY`, POST to
   `api.sendgrid.com/v3/mail/send` via stdlib urllib) → **SMTP with STARTTLS**
   (`SMTP_HOST/PORT/USER/PASSWORD`, port default 587) → **not configured** (logs the invite URL
   at INFO and returns False). It renders a branded HTML email (A² Intelligence header, access-
   details card, CTA button, "link can only be used once" notice). All secrets come from env —
   nothing hard-coded (per the security scrub in commit 9e3dd74).
4. Acceptance itself (token → account creation) lives in the auth domain, not this router;
   this router only lists (`GET /invites?status=`) and revokes invites.

### 7.4 Worked example — effective module access

User `user_ab12` has: preset "Carbon Analyst" with
`module_paths = [/carbon-credit, /vcm-integrity, /pcaf-financed-emissions]`; overrides:
grant `/paris-alignment` (no expiry), grant `/sat-coal` (expired yesterday), deny
`/pcaf-financed-emissions` (no expiry). Resolution at `GET /module-access/user_ab12`:

| Step | Set |
|---|---|
| Base (preset) | {carbon-credit, vcm-integrity, pcaf-financed-emissions} |
| + live grants | ∪ {paris-alignment} (sat-coal dropped — `expires_at ≤ now`) |
| − live denies | − {pcaf-financed-emissions} |
| Effective (sorted) | **[/carbon-credit, /paris-alignment, /vcm-integrity]** |

The response also echoes the raw override rows so the admin UI can display grant/deny chips.
Deny beats grant for the same path because subtraction is applied last.

### 7.5 Interconnections

- `RbacUserProfilePG.access_expires_at` and the effective-path list are consumed by the auth
  middleware / login flow (`api/auth_pg.py`) to gate module routes at request time — this router
  is the *write* side of that contract.
- The Admin Panel frontend (RBAC admin pages, 2026-04-07 session) is the sole intended client;
  every endpoint requires a super_admin session token.
- `PLATFORM_BASE_URL`, `INVITE_FROM_EMAIL`, `INVITE_FROM_NAME` env vars couple this domain to
  deployment configuration.

### 7.6 Data provenance & limitations

- **No synthetic data and no `sr()` PRNG** — all state is operator-created; the only randomness
  is the CSPRNG invite token and `uuid4`-derived user ids (`user_` + 12 hex chars).
- Invite expiry is stored but this router never transitions `pending → expired`; enforcement
  must happen at acceptance time (not visible in this file).
- `list_users` issues one profile query per user (N+1 pattern) — acceptable at ≤500 rows/page.
- `create_invite` does not de-duplicate pending invites for the same email, and does not check
  whether the email is already registered.
- Passwords are hashed via the shared `_hash_pw` from `api/auth_pg.py`; hashing scheme is
  outside this file's evidence.
- `module_overrides` captured on an invite are stored on the invite row; their application to
  the created user happens in the acceptance flow (not in this router).

### 7.7 Framework alignment

- **RBAC (NIST SP 800-207 / classic role-based access control)** — implements role + preset
  (role template) + per-object exception lists; the grant/deny-with-deny-precedence model mirrors
  standard ACL evaluation order.
- **Least privilege** — non-admin users start from an empty set and gain only preset/grant
  paths; super_admin is the single unrestricted role.
- **OWASP ASVS session/invite practice** — single-use, expiring, 256-bit URL-safe tokens via
  `secrets`; secrets and SMTP credentials sourced exclusively from environment variables.
- **SOC 2-style auditability (partial)** — `created_by`/`updated_by`/timestamps are recorded on
  profiles, presets and invites, but there is no immutable audit log of permission changes.

## 9 · Future Evolution

### 9.1 Evolution A — Auditable, time-boxed access with attestation reporting (analytics ladder: rung 1 → 2)

**What.** An access-control domain, not a quant engine: its one real algorithm is
`_resolve_effective_paths` — `effective_paths = None (super_admin) else (preset.module_paths ∪
grants) − denies`, with grants/denies filtered to non-expired `RbacModuleAccessPG` overrides.
CRUD over four tables (user profiles, role presets, per-module overrides, invite links), every
route guarded by `_require_super_admin`. The §4.2 trace shows `/module-access/{user_id}` traces
**failed / db-empty**, so the per-user effective-permission introspection isn't working
end-to-end. Evolution A makes access governance auditable and self-documenting.

**How.** (1) Fix `/module-access/{user_id}` so an admin can see any user's resolved effective
paths (grants ∪ preset − denies) — essential for access reviews. (2) Add an access-attestation
report: who can reach which modules, which grants are expiring, which users are dormant —
computed over the four tables, the kind of periodic recert SOC 2 / ISO 27001 require. (3)
Enforce and surface `expires_at` on all overrides so access is time-boxed by default, not
permanent. (4) Log every permission change to the audit trail with before/after effective paths.

**Prerequisites.** The failed module-access endpoint repaired; audit-log integration for
permission diffs. **Acceptance:** `/module-access/{user_id}` returns `passed` with resolved
paths; an attestation report enumerates effective access per user with expiry flags; every
grant/deny change writes a before/after audit entry.

### 9.2 Evolution B — Access-administration copilot for super-admins (LLM tier 2)

**What.** A copilot for the super-admin: "who can access the prudential-risk modules?", "grant
this analyst the PCAF modules until quarter-end", "which invites are still pending?" — reads via
the list endpoints, writes via the gated create/update/revoke actions under confirmation.

**How.** This is a strictly-gated mutating surface: every route already requires super_admin, so
the copilot inherits that session and can never escalate. Read endpoints (users, presets,
invites, module-access) are the grounding; user/preset/override mutations and invite creation
require explicit confirmation and log to audit. The copilot must narrate real effective-access
resolution (via `_resolve_effective_paths`) and never claim a grant took effect without the
`RbacModuleAccessPG` row. Internal platform-admin tool, not customer-facing.

**Prerequisites.** Evolution A's introspection fix and time-boxing; the four-eyes principle for
sensitive grants (a super_admin shouldn't self-grant without a second approver for high-privilege
changes). **Acceptance:** every access claim traces to a resolved-paths tool response; grants
require confirmation, honour `expires_at`, and log before/after to audit; the copilot refuses to
grant super_admin without the configured second-approver step and explains why.