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
