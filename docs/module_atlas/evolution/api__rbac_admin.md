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
