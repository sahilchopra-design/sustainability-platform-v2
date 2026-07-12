# Master Access & Per-Module Team Permissions

This describes the RBAC system that powers `/admin` — the console for granting
team members "Master Access" (full platform) or hand-picked module access.

> Deploy-webhook verification marker: 2026-07-12. If you're reading this on the
> live site and the sidebar module count still doesn't match this repo's
> current module count, the Railway service's GitHub auto-deploy webhook is
> not firing on new commits — reconnect the source (Settings → Source →
> Disconnect, then Connect Repo again) rather than clicking "Redeploy" on an
> old deployment entry, which just re-runs the same pinned commit.

## Concepts

- **Master Access** = the existing `super_admin` RBAC role. It is not a new
  role — it already means "every module, no restrictions" everywhere the
  backend computes effective access (`backend/api/rbac_utils.py`). The admin
  panel now surfaces it as an explicit toggle instead of a role-dropdown value
  to make it obvious.
- **Custom access** = any other role (`team_member`, `partner`, `demo`,
  `viewer`), whose modules come from an optional preset plus/minus per-user
  grant/deny overrides: `effective = preset.module_paths ∪ grants − denies`.
- Access is enforced twice: server-side in
  `backend/middleware/auth_middleware.py` (the real gate — blocks API calls),
  and client-side in `frontend/src/components/auth/ProtectedRoute.jsx` (UX —
  hides pages the user can't call anyway). `/admin` itself is now wrapped in
  `ProtectedRoute`, so only Master Access users can reach the console at all.

## One-time bootstrap: your first Master Access user

The RBAC tables ship with a seeded preset row but **no user is super_admin by
default** — someone has to be promoted once via direct SQL before anyone can
log into `/admin`. Run this against the Postgres database (Supabase SQL editor
or `psql`), after that person has already signed in at least once so their row
exists in `users_pg`:

```sql
INSERT INTO rbac_user_profiles (id, user_id, rbac_role, is_active, created_by, updated_by, created_at, updated_at)
SELECT gen_random_uuid()::text, user_id, 'super_admin', true, 'bootstrap', 'bootstrap', now(), now()
FROM users_pg WHERE email = 'you@company.com'
ON CONFLICT (user_id) DO UPDATE SET rbac_role = 'super_admin', is_active = true, updated_at = now();
```

From then on, that person can promote/demote everyone else from the UI.

## Granting access to a team member

Two paths, both in the `/admin` console:

1. **Invite a new person** (Invites tab → "+ Send Invite"): pick a role, an
   optional preset, and use "Edit Modules" to hand-pick exactly which modules
   they'll have on top of/instead of the preset. Their picks are applied the
   moment they accept the invite and set a password.
2. **Edit an existing user** (Users tab → click a row → drawer): flip the
   "Master Access" toggle for full platform access, or leave it off and use
   the Access/Advanced tabs to assign a preset and pick-and-choose additional
   granted/denied modules. Saving calls the backend immediately — there is no
   separate "publish" step.

The **Module Manager** tab gives the same pick-and-choose picker keyed off a
user dropdown, plus a heatmap of who has access to what across the team.

## What changed under the hood

The admin panel UI already existed but its mutating actions (create user, save
profile edits, send invite, revoke, suspend/activate, preset CRUD) only wrote
to a local mock store — none of it reached Postgres, even though the panel
displayed real data. This pass wires every mutation to the real API
(`backend/api/admin_rbac.py`, mounted at `/api/admin/*`) and adds:

- `PUT /api/admin/users/{id}/modules` — replace a user's entire grant/deny
  override set in one call (`{grants: [...], denies: [...]}`), backing the
  pick-and-choose module picker.
- `POST /api/admin/users/{id}/activate` — reactivate a suspended user
  (the drawer's Suspend/Activate toggle needed both directions; only
  deactivate existed before).
- A fix in `backend/api/auth_pg.py`'s invite-accept handler: it previously
  read every field off an invite *except* `module_overrides`, so per-module
  picks made when sending an invite were silently dropped on acceptance. They
  are now applied as grant overrides when the invite is accepted.
- Two pre-existing frontend/backend endpoint mismatches (invite revoke, preset
  deactivate) that would have 404'd once the UI actually started calling them.

When the backend is unreachable, the panel falls back to its local demo store
(shown as "● LOCAL MODE" in the header) so it still works for previewing the
UI without a database.
