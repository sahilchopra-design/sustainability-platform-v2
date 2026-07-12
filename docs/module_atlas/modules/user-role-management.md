# User Role Management
**Module ID:** `user-role-management` · **Route:** `/user-role-management` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Platform role-based access control (RBAC), permissions management and user administration; configures who can view, edit and approve ESG data, reports and module configurations.

> **Business value:** Least-privilege access control is foundational to ESG platform security; GDPR Article 25 requires data protection by design including role-based data minimisation for personal and sensitive ESG data.

**How an analyst works this module:**
- Define role hierarchy and permission matrix
- Assign users to roles based on function and data access requirements
- Configure module-level and data-domain permissions
- Conduct periodic access reviews and remove stale accounts
- Generate access reports for internal audit and GDPR/SOC 2 compliance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIONS`, `API_KEYS_DATA`, `COLORS`, `DOMAINS`, `FIRST_NAMES`, `IP_WHITELIST`, `LAST_NAMES`, `MODULES_PER_DOMAIN`, `ROLES`, `ROLE_PERMS`, `SECURITY_EVENTS`, `SESSION_DATA`, `SOC2_CHECKLIST`, `STATUSES`, `TABS`, `TEAMS`, `TEAM_DATA`, `TIERS`, `TOTAL_MODULES`, `USERS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SOC2_CHECKLIST` | 13 | `control`, `desc`, `status`, `evidence` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `LAST_NAMES` | `['Chen','O\'Brien','Nakamura','Patel','Kowalski','Williams','Garcia','Kim','Johansson','Al-Rashid','Thompson','Dubois','Santos','Andersson','Nguyen','Rivera','Schmidt','Yamamoto','Okonkwo','Murphy','Petrov','Chang','Hans` |
| `ROLES` | `['Super Admin','Platform Admin','ESG Analyst','Portfolio Manager','Risk Officer','Compliance Officer','Read-Only Viewer','External Auditor'];` |
| `role` | `ROLES[Math.floor(sr(i*7)*8)];` |
| `team` | `TEAMS[Math.floor(sr(i*11)*6)];` |
| `status` | `STATUSES[Math.floor(sr(i*13)*10)];` |
| `tier` | `TIERS[Math.floor(sr(i*17)*10)];` |
| `daysAgo` | `Math.floor(sr(i*23)*90);` |
| `loginDate` | `new Date(2026,2,29-daysAgo);` |
| `sessCount` | `Math.floor(sr(i*29)*200+10);` |
| `modulesAccessed` | `Math.floor(sr(i*31)*40+5);` |
| `TOTAL_MODULES` | `DOMAINS.reduce((a,_,i)=>a+MODULES_PER_DOMAIN[i],0);` |
| `base` | `sr(ri*100+di*7);` |
| `IP_WHITELIST` | `['10.0.0.0/8','172.16.0.0/12','192.168.1.0/24','203.0.113.0/24','198.51.100.0/24','100.64.0.0/10'];` |
| `pagedUsers` | `useMemo(()=>filteredUsers.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filteredUsers,page]);` |
| `totalPages` | `Math.ceil(filteredUsers.length/PAGE_SIZE);` |
| `roleDistribution` | `useMemo(()=>ROLES.map(r=>({name:r,count:USERS.filter(u=>u.role===r).length})),[]);` |
| `teamDistribution` | `useMemo(()=>TEAMS.map(t=>({name:t,count:USERS.filter(u=>u.team===t).length})),[]);` |
| `statusDistribution` | `useMemo(()=>['Active','Suspended','Invited'].map(s=>({name:s,count:USERS.filter(u=>u.status===s).length})),[]);` |
| `mfaStats` | `useMemo(()=>[{name:'MFA Enabled',value:USERS.filter(u=>u.mfaEnabled).length},{name:'MFA Disabled',value:USERS.filter(u=>!u.mfaEnabled).length}],[]);  const loginTrend=useMemo(()=>Array.from({length:30},(_,i)=>({ day:`Mar ${i+1}`, logins:Math.floor(sr(i*600)*80+20), failed:Math.floor(sr(i*601)*8), unique:Math.floor(sr(i*603)*35+10), })),[]` |
| `handleSort` | `(col)=>{if(sortCol===col)setSortDir(d=>-d);else{setSortCol(col);setSortDir(1);}};` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTIONS`, `COLORS`, `DOMAINS`, `FIRST_NAMES`, `IP_WHITELIST`, `LAST_NAMES`, `MODULES_PER_DOMAIN`, `ROLES`, `SEC_TABS`, `SOC2_CHECKLIST`, `STATUSES`, `TABS`, `TEAMS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Configured Users | — | User Directory | Total platform users with active role assignments across all modules and data domains. |
| Roles Defined | — | RBAC Engine | Number of distinct role definitions spanning Viewer, Analyst, Manager, Admin, Auditor and custom roles. |
| Permission Gaps | — | Access Audit | Users with incomplete or conflicting role assignments flagged for immediate resolution. |
- **Corporate Directory / IdP, Module Access Logs, Role Definitions** → RBAC engine + permission matrix + access audit tools → **Role assignment reports, access gap alerts, audit logs, GDPR/SOC 2 evidence**

## 5 · Intermediate Transformation Logic
**Methodology:** Access Coverage Score
**Headline formula:** `ACS = Configured Users / Total Users × Role Assignment Completeness`

Proportion of platform users with fully configured role assignments and permission sets; gaps create compliance and data security risk.

**Standards:** ['NIST RBAC Standard SP 800-162', 'ISO/IEC 27001 A.9']
**Reference documents:** NIST Special Publication 800-162 RBAC; ISO/IEC 27001:2022 Clause A.9 Access Control; GDPR Article 25 Data Protection by Design; SOC 2 Type II CC6 Logical Access

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry names an "Access Coverage Score" formula
> (`ACS = Configured Users / Total Users × Role Assignment Completeness`) and cites fixed KPIs
> (284 configured users, 18 roles defined, 7 permission gaps). **None of this is computed in code.**
> The page never calculates an ACS, never counts "permission gaps," and defines 8 roles, not 18. What
> the code actually implements is a fully synthetic RBAC admin console: a 50-user directory, an
> 8-role × 43-domain permission matrix, team rosters, a SOC 2 control checklist and login-activity
> analytics — all generated by the seeded PRNG. The sections below document the code as it behaves.

### 7.1 What the module computes

The page has no backend engine and no live directory integration. Four synthetic datasets are
built once at module load and then filtered/aggregated client-side:

- **`USERS`** (50 records): name, `role` (8 values), `team` (6 values), `status`
  (weighted `['Active'×7,'Suspended','Invited','Active']`), `tier`, `mfaEnabled` (`sr(i·19)>0.3`,
  i.e. ~70% MFA-enabled), session/login metadata, `securityScore = ⌊sr(i·53)·30+70⌋` (70–100).
- **`ROLE_PERMS`** — for each of the 8 roles × 43 `DOMAINS`, a boolean permission tuple
  `{view, edit, export, delete, approve}` derived from role rank `ri` and a per-cell random draw
  `base = sr(ri·100+di·7)`, e.g. `edit = ri≤3 || (ri===4 && base>0.3) || (ri===5 && base>0.5)`.
  This encodes a **rank-monotonic RBAC hierarchy**: lower `ri` (more senior role, e.g. Super Admin)
  always has edit/delete/approve; mid-tier roles get partial, randomised access; junior roles
  (Read-Only Viewer, External Auditor, `ri` 6–7) get view-only unless the random draw clears a
  threshold.
- **`TEAM_DATA`** — 6 teams with member counts and coverage stats.
- **`SOC2_CHECKLIST`** — 13 static SOC 2 CC6 (logical access) controls with hardcoded status/evidence
  strings (not derived from `USERS`).

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Roles | 8 (Super Admin → External Auditor) | Synthetic demo taxonomy, loosely NIST RBAC-shaped |
| Domains | 43 named ESG/risk domains | Mirrors the platform's actual module-family list |
| Modules/domain | 6 flat for every domain (`MODULES_PER_DOMAIN`) | Synthetic constant, not measured from the real route count |
| MFA threshold | `sr(i·19) > 0.3` → ~70% enabled | Arbitrary demo split |
| Security score range | 70–100 | Arbitrary demo range, not a scoring rubric |
| Permission draw thresholds (0.1/0.3/0.4/0.5/0.6) | — | Hand-picked to keep senior roles more permissive; no cited standard |

### 7.3 Calculation walkthrough

1. `USERS` is generated once (`Array.from({length:50}, ...)`), seeded by `sr(i·k)` at distinct
   primes/multipliers per field so fields vary independently for the same user index.
2. `ROLE_PERMS` is built by iterating `ROLES × DOMAINS` and evaluating boolean rules per cell —
   this is the "Role & Permission Matrix" tab's data source.
3. Table/dashboard views (User Directory, Team Management, Security & Compliance) filter/sort/paginate
   `USERS` and `TEAM_DATA` client-side; there is no aggregation into a single coverage or gap metric
   anywhere in the file.
4. `TOTAL_MODULES = Σ MODULES_PER_DOMAIN` (43 × 6 = 258) is displayed as a static "modules governed"
   count — decorative, not derived from the live route table.

### 7.4 Worked example

For `i = 12` (13th synthetic user): `role = ROLES[⌊sr(12·7)·8⌋]`, `team = TEAMS[⌊sr(12·11)·6⌋]`,
`mfaEnabled = sr(12·19) > 0.3`. Because `sr` is deterministic (`sin(seed+1)` fractional part), the
same user always renders identically across sessions — useful for demo stability, but it means no
two runs of the app ever reflect a real access-review outcome; the "13th user" is not a real employee.

### 7.5 Companion analytics on the page

- **SOC 2 checklist** (13 CC6 controls) — static strings, not wired to `USERS.mfaEnabled` or any
  other computed access metric, so a change in the synthetic MFA rate never moves the compliance tab.
- **Login trend** (30-day series) — independent `sr()` draws for logins/failed/unique, unconnected
  to `USERS.loginCount`.

### 7.6 Data provenance & limitations

- **100% synthetic.** Every user, role assignment, team roster and SOC 2 evidence string is generated
  by `sr(seed) = frac(sin(seed+1)×10⁴)`; there is no corporate directory / IdP integration despite
  the guide's `dataLineage` claiming one.
- No aggregate KPI (ACS, permission-gap count, MFA coverage %) is actually computed — the guide's
  headline numbers (284 users, 18 roles, 7 gaps) do not correspond to anything in `USERS.length` (50)
  or `ROLES.length` (8).
- Permission matrix logic is illustrative rank-ordering, not a real least-privilege policy engine —
  there's no support for custom roles, attribute-based access control, or time-boxed grants.

**Framework alignment:** NIST SP 800-162 (RBAC) — approximated by the rank-ordered `ri≤n` permission
rules, not a formal role-engineering exercise. ISO/IEC 27001:2022 Annex A.9 (access control) and
SOC 2 CC6 — represented only as a static, unlinked checklist. GDPR Art. 25 (data protection by
design) is named in the guide's `valueSummary` but has no corresponding control in code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production Access Coverage & Least-Privilege Risk model would give platform security teams a single,
defensible metric for SOC 2 / ISO 27001 audits: what fraction of active users have a role assignment
consistent with least-privilege, and where are the highest-risk over-permissioned accounts. Scope:
all platform users × all domain-level permission grants.

### 8.2 Conceptual approach
Two industry-standard techniques combine: (1) **role-mining / entitlement-certification** as used in
SailPoint IdentityIQ and Saviynt access-governance platforms — periodically compare granted
entitlements against a peer-group baseline to flag outliers; (2) **NIST SP 800-162 RBAC conformance
scoring** — measure the gap between assigned permissions and the minimum permission set required by
a user's job function ("role mining distance"). Benchmarks: SailPoint's Identity Security Cloud
access-outlier score, and Microsoft Entra ID Governance's access-review risk signal.

### 8.3 Mathematical specification
For user *u* with granted entitlement set `G_u` (domain × action pairs) and peer-baseline minimum
set `M_u` (derived from role-mining over all users sharing `u.role` and `u.team`):

```
OverGrant_u   = |G_u \ M_u| / |G_u|              // % of grants beyond peer baseline
UnderGrant_u  = |M_u \ G_u| / |M_u|              // % of baseline missing (productivity risk)
RiskWeight_a  = {view:1, export:2, edit:3, approve:4, delete:5}   // action severity
AccessRiskScore_u = Σ_{(d,a) ∈ G_u\M_u} RiskWeight_a / Σ_{a} RiskWeight_a · |DOMAINS|
ACS_portfolio = 1 − (Σ_u OverGrant_u · w_u) / N        // w_u = MFA-off multiplier (1.5× if MFA disabled)
```

| Parameter | Calibration source |
|---|---|
| `RiskWeight_a` severity ladder | ISO 27001 A.9.2 principle of least privilege; ordinal, platform-defined |
| MFA-off multiplier (1.5×) | NIST SP 800-63B — MFA absence materially raises compromise-impact severity |
| Peer-baseline `M_u` | Role-mining over ≥30-day entitlement snapshots (SailPoint methodology) |
| Review cadence | Quarterly, per SOC 2 CC6.1 access-review requirement |

### 8.4 Data requirements
Real corporate IdP/SSO entitlement export (Okta/Entra ID/OneLogin SCIM feed), module-level audit
logs (actual `view/edit/export/delete/approve` events, not declarative grants), MFA enrolment status
per user, and a role-to-job-function crosswalk. The platform's existing `USERS`/`ROLE_PERMS`
structures are directly reusable as the schema shape; only the data source needs to change from
`sr()` to a live SCIM/audit-log ingestion pipeline.

### 8.5 Validation & benchmarking plan
Backtest against known incident data (did AccessRiskScore flag the accounts later implicated in an
access-related incident?); stability test — re-run role-mining monthly and confirm `M_u` churn stays
below 10% absent org changes; reconcile aggregate ACS against SailPoint/Saviynt outlier counts on a
shared sample tenant if available.

### 8.6 Limitations & model risk
Role-mining baselines are sensitive to small peer groups (a team of 2 has no meaningful "baseline");
fall back to role-level (not team-level) baseline when peer group `< 5`. Static permission snapshots
miss just-in-time/temporary elevation; a production system should timestamp grants and treat
un-expired temporary access as an explicit risk flag, not silently merge it into `G_u`.

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