## 9 · Future Evolution

### 9.1 Evolution A — Deterministic demo seeding and multi-tenant isolation hardening (analytics ladder: rung 1 → 2)

**What.** This is the platform's multi-tenant control plane — CRUD over `OrganisationPG`,
`OrgUserPG`, `UserPG` with `require_role("admin")` writes — not a quant engine. Its one
computation is `demo_portfolio_seeder.py`, which provisions a 15-asset sample portfolio
(10 sectors, Bond/Loan/Equity, AAA→CCC) plus a pre-computed 3-scenario analysis run for
every new tenant. The §5 extract shows the seeder uses `rng.uniform` jitter on exposure,
market value, PD, and LGD — a deliberate demo-realism trick, but exactly the kind of
random-as-data the platform's guardrail (`check_no_fabricated_random.py`) polices
elsewhere. The atlas also shows `/{org_id}` and `/{org_id}/members` trace **db-empty**.
Evolution A makes seeding reproducible and tightens isolation.

**How.** (1) Make the demo seeder deterministic — seed the RNG from the org_id so a tenant's
demo book is stable across re-provisions (and clearly labelled synthetic-demo, keeping it
outside the fabrication guardrail's scope by construction). (2) Implement the D2 roadmap
item here: an `org_id` scoping audit across tenant tables plus Supabase RLS as
defense-in-depth under the app-layer RBAC. (3) Fix the `/{org_id}` GET (traces failed) and
members read path. (4) Add per-org row quotas.

**Prerequisites.** RLS policy rollout (roadmap D2); confirmation the demo seeder's synthetic
data is excluded from any analytics that feed real decisions. **Acceptance:** re-seeding an
org twice yields identical demo portfolios; cross-tenant reads are blocked at the DB layer,
not just the app; `/{org_id}` returns `passed`; per-org quotas enforced.

### 9.2 Evolution B — Tenant-admin copilot for onboarding and membership (LLM tier 2)

**What.** An admin copilot: "create an org for Acme, provision the demo portfolio, and add
these three users as analysts" — executing `POST /organisations/`,
`POST /{org_id}/seed-demo`, and `POST /{org_id}/members` under explicit confirmation and
strict RBAC inheritance.

**How.** This is a mutating tier-2 surface, so it is the roadmap's gated-tool pattern: read
endpoints (`/`, `/mine`, `/{org_id}`, `/members`) are freely callable, but org creation,
updates, and member-adds require confirmation and inherit the admin's session — never a
service account. The copilot narrates real membership state and never claims a user was
added without an `org_users` row confirming it. It's an internal platform-admin tool, not a
customer analytics copilot.

**Prerequisites.** Evolution A's isolation hardening before any cross-tenant admin action;
RBAC confirmation UX for the mutating endpoints (middleware already enforces `admin`).
**Acceptance:** every membership/org claim traces to a real DB row; write actions require
confirmation and log to the audit trail; a non-admin asking to create an org is refused by
inherited RBAC, and the copilot explains why rather than attempting it.
