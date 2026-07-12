## 9 · Future Evolution

### 9.1 Evolution A — Wire the console to the platform's real RBAC system (analytics ladder: rung 1 → 2)

**What.** The page is a fully synthetic admin console — 50 `sr()`-generated users, an
8-role × 43-domain random permission matrix, a static SOC 2 checklist unlinked to any
computed metric (§7.6: "100% synthetic... no corporate directory / IdP integration") —
while the platform already has a **real** RBAC system (migration 135
`add_rbac_system`, the admin panel, per-module access middleware the productization
roadmap relies on). Evolution A retires the synthetic datasets and binds the console
to live data: `USERS` from the real user table, the permission matrix from actual role
grants, MFA and login analytics from the `audit_*` tables (18 of them already capture
everything, per roadmap D4). Then implement the §8 specification's first slice:
compute `OverGrant_u` against a role-level peer baseline and the portfolio ACS, making
the guide's advertised Access Coverage Score real for the first time.

**How.** (1) New router `api/v1/routes/rbac_analytics.py` with `GET /users`,
`GET /permission-matrix`, `GET /access-risk` — read-only aggregations over existing
auth/RBAC/audit tables, admin-RBAC-gated. (2) SOC 2 checklist rows wired to computed
evidence (MFA coverage %, stale-account count from real `loginDate`). (3) Keep §8.3's
risk-weight ladder (view 1 → delete 5) as the scoring rubric.

**Prerequisites.** The §7 guide↔code mismatch (fictional 284 users / 18 roles / 7
gaps) resolved by computing real values; small-peer-group fallback per §8.6.
**Acceptance:** the user count on the page equals `SELECT count(*)` from the real user
table; disabling a role grant changes the matrix on reload; ACS is computed, not
asserted.

### 9.2 Evolution B — Access-review copilot for audit season (LLM tier 2)

**What.** Quarterly access reviews (SOC 2 CC6.1) are the concrete workflow this module
should serve. Evolution B is a tool-calling reviewer for the platform admin: "who
hasn't logged in for 90 days but retains edit rights?", "which External Auditor
accounts have grants beyond view?", "draft the CC6 evidence summary for Q3." It calls
Evolution A's `GET /users`, `GET /access-risk`, and audit-log query endpoints, and
produces a review packet: flagged accounts with `OverGrant` scores, recommended
revocations, and the SOC 2 control mapping — recommendations only; actual revocation
stays a human admin action behind the existing RBAC middleware.

**How.** Tier-2 stack with strictly read-only tools; mutating grant changes are
explicitly excluded from the tool schema (not merely confirmation-gated) because
access control is the platform's security boundary. System prompt grounded in this
Atlas page's §8 model spec so the copilot explains OverGrant/ACS methodology
accurately. Every flagged account cites the audit-log rows behind the finding via the
"show work" expander.

**Prerequisites (hard).** Evolution A — a copilot narrating today's synthetic
50-user directory would produce fictional audit evidence, the worst possible failure
mode for a compliance module; admin-only RBAC scope on the copilot route itself.
**Acceptance:** every flagged account exists in the real user table with the cited
grants; the copilot cannot invoke any state-changing endpoint (verified by tool-schema
audit); asked to revoke access, it refuses and points to the admin panel.
