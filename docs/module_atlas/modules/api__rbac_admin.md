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
| `send_invite_email` | to_email, invite_url, role, org, expires_days | Send an invite email. Returns True on success, False if not configured or failed. |

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

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).