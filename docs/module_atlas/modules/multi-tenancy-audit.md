# Multi-Tenancy Audit
**Module ID:** `multi-tenancy-audit` · **Route:** `/multi-tenancy-audit` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Enterprise-grade audit and verification module for multi-tenant SaaS deployments, ensuring data isolation, access control integrity, configuration separation, and compliance boundary enforcement across tenant accounts. Validates row-level security policies, API key scoping, audit log completeness, and encryption key segregation. Generates SOC 2 Type II evidence artefacts and ISO 27001 access control audit reports.

> **Business value:** Gives platform security and compliance teams automated, continuous verification of multi-tenant isolation controls with auditable evidence supporting SOC 2 Type II and ISO 27001 certifications and regulatory data protection obligations.

**How an analyst works this module:**
- Run automated tenant isolation test suite to verify RLS policies, API key scoping, and session isolation
- Review audit log completeness report per tenant and identify any event type gaps
- Inspect encryption key segregation status to confirm per-tenant key derivation and storage isolation
- Simulate cross-tenant access attempts using the penetration test harness and review detected vs. blocked events
- Generate SOC 2 and ISO 27001 evidence packages from test results and audit log samples for external auditor submission

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DOMAIN_COLORS`, `ORGS`, `ORG_TIERS`, `PERMISSIONS`, `ROLES`, `TABLE_AUDIT`, `TIER_COLOR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ORGS` | 11 | `name`, `tier`, `users`, `portfolios`, `apiCalls`, `dataGb`, `createdAt`, `active` |
| `PERMISSIONS` | 9 | `read`, `write`, `delete` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `domains` | `[...new Set(TABLE_AUDIT.map(t => t.domain))];` |
| `tierBreakdown` | `ORG_TIERS.map(tier => ({` |
| `pieData` | `tierBreakdown.map(t => ({ name: t.tier, value: t.orgs }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ORGS`, `ORG_TIERS`, `PERMISSIONS`, `ROLES`, `TABLE_AUDIT`, `TIER_PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Tenant Isolation Score (%) | — | Automated isolation test suite | Proportion of isolation controls passing verification; below 95% triggers P0 escalation |
| Audit Log Completeness (%) | — | Log aggregation completeness check | Proportion of expected user and API events recorded in immutable audit log per tenant |
| RLS Policy Coverage (%) | — | Database row-level security audit | Proportion of data tables with enforced row-level security policies scoped to tenant ID |
| Cross-Tenant Data Leakage Events | — | Isolation penetration test results | Number of successful cross-tenant data access events detected in penetration testing |
- **Database schema and RLS policy definitions** → Enumerate all tenant-scoped tables; verify RLS policy presence and correctness via SQL test queries → **RLS coverage matrix with pass/fail per table and tenant**
- **API gateway access logs** → Parse API requests for cross-tenant key usage; flag any tenant ID mismatch between key and data accessed → **Cross-tenant access attempt log with blocked/passed status**
- **Immutable audit log store** → Compute expected vs. received event counts by type; identify gaps; verify tamper-evidence hashes → **Audit log completeness report and integrity verification certificate**

## 5 · Intermediate Transformation Logic
**Methodology:** Tenant Isolation Score
**Headline formula:** `TIS = (Passed Isolation Tests / Total Isolation Tests) × 100`

Tenant Isolation Score measures the proportion of isolation control tests passing automated verification. Tests cover row-level security bypass attempts, cross-tenant API call simulation, audit log gap analysis, encryption key cross-contamination, and configuration bleed detection. Scores below 95% indicate critical isolation failures requiring immediate remediation.

**Standards:** ['SOC 2 Trust Services Criteria 2017 â€” Logical Access Controls', 'ISO/IEC 27001:2022 â€” Information Security Management', 'NIST SP 800-53 Rev 5 â€” Access Control and Audit Controls', 'CSA Cloud Controls Matrix v4 2023']
**Reference documents:** AICPA SOC 2 Trust Services Criteria 2017; ISO/IEC 27001:2022 â€” Information Security Management Systems Requirements; NIST SP 800-53 Rev 5 â€” Security and Privacy Controls for Information Systems 2020; CSA Cloud Controls Matrix v4 2023; OWASP Testing Guide v4.2 â€” Business Logic Testing

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises an **automated tenant-isolation
> test suite** — a Tenant Isolation Score `TIS = passed/total × 100`, cross-tenant penetration
> simulation, audit-log completeness checks, encryption-key-segregation verification, and SOC 2 / ISO
> 27001 evidence generation. **None of that runs in the code.** The page is a **static architecture-audit
> reference**: a hand-maintained inventory of the platform's own database tables (which have `org_id` +
> RLS and which do not), an RBAC permission matrix, and an organisation registry. It computes counts and
> a tier pie chart — no tests execute, no TIS is calculated, no evidence package is produced. This is
> non-financial platform-security documentation.

### 7.1 What the module computes

The page renders four tabs over three hand-authored constants — no PRNG, no live queries:

- `ORGS` — 10 named demo tenants (Enterprise/Professional/Starter/Trial) with users, portfolios, API
  calls, data GB.
- `TABLE_AUDIT` — 21 database tables tagged `hasOrgId`, `rlsEnabled`, `coverage` (%), `domain`.
- `PERMISSIONS` — an 8-resource × 6-role RBAC read/write/delete matrix.

The only computations are aggregations:

```js
isolated = tenantTables.filter(t => t.hasOrgId && t.rlsEnabled).length
missing  = tenantTables.filter(t => !t.hasOrgId).length
tierBreakdown = ORG_TIERS.map(tier => ({ orgs, users, apiCalls }))   // group-by tier
```

`tenantTables` are those with `coverage !== null`; `referenceTables` (shared public data — `gleif_lei`,
`owid_co2_annual`, `ofac_sdn`, `sbti_targets`) are excluded from isolation scoring because they
correctly need no `org_id`.

### 7.2 Parameterisation / scoring rubric

| Constant | Content | Provenance |
|---|---|---|
| `TABLE_AUDIT` | 8 fully-isolated core tables (100 % coverage), 8 tenant tables with **0 % coverage** (DME, Quant, AI/ML, Real Assets…), 4 shared reference tables | Hand-curated real platform schema facts |
| Isolation gap banner | "`missing` tables lack `org_id`+RLS; migrations 086–087 pending; run `alembic upgrade head`" | Real remediation note |
| `PERMISSIONS` | e.g. `audit_logs` read = org_admin+compliance_officer, write/delete = [] (immutable); `reference_data` write = api_service only | Author-defined RBAC design |
| `ORGS` | 10 demo tenants | Synthetic demo (fictional AUM desks) |

There are **no seeded scores** in this module — every value is a static, deliberately-authored fact
about the platform's own architecture. The `coverage` field is binary in practice (100 or 0), not a
measured percentage.

### 7.3 Calculation walkthrough

Inputs (the three constants) → `tenantTables`/`referenceTables` partition → `isolated`/`missing` counts
→ headline KPI cards + the red "ISOLATION GAP" banner. The domain filter subsets `TABLE_AUDIT` for the
audit table. Tier pie/bar charts come straight from `tierBreakdown`. No test executes against a live
database; the audit results are asserted, not verified.

### 7.4 Worked example (isolation gap)

From `TABLE_AUDIT`: 8 tenant tables have `hasOrgId && rlsEnabled` (portfolios_pg … audit_logs) and 8
tenant tables have `hasOrgId:false` (dme_financial_risk_var, dme_pd_results, dme_index_scores,
greenium_signals, sentiment_signals, pe_deals, tech_risk_scores, residential_re_properties). So
`isolated = 8`, `missing = 8`, and the banner reports "8 tenant tables are missing `org_id` FK and RLS
policies (migrations 086–087 pending)." A true TIS over the 16 tenant tables would be `8/16 = 50 %` —
below the guide's 95 % P0 threshold — but the code never computes this number.

### 7.5 Data provenance & limitations

- **Static reference, not a live audit.** The table-coverage facts are hand-entered; they will drift
  from the real schema unless manually updated. There is no connection to `information_schema`,
  `pg_policies`, or the actual RLS configuration.
- No penetration test, no audit-log completeness check, no encryption-key verification, no SOC 2 / ISO
  27001 artefact generation — all four are guide claims with no code.
- `ORGS` are fictional demo tenants; the real production tenant list is not read.

**Framework alignment:** The RBAC matrix and immutable-audit-log design follow **SOC 2 Trust Services
Criteria** (logical access / CC6) and **ISO/IEC 27001:2022 Annex A.9** (access control). The `org_id` +
Postgres RLS isolation pattern is the standard **NIST SP 800-53 AC-3/AC-4** boundary-enforcement
approach. The module documents conformance intent; it does not test it.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's Tenant Isolation Score and test
suite do not exist. Below is the automated isolation-assurance model the module should run.

### 8.1 Purpose & scope
Continuously verify tenant data isolation across every tenant-scoped table and API path in the platform,
producing an auditable Tenant Isolation Score and SOC 2 / ISO 27001 evidence, and blocking releases when
isolation regresses.

### 8.2 Conceptual approach
An automated control-test harness (not a statistical model), benchmarked against **AWS/Azure multi-tenant
SaaS isolation guidance** and the **CSA Cloud Controls Matrix v4** test taxonomy, plus **OWASP business-
logic testing** for cross-tenant access. Each control is a deterministic pass/fail probe run in CI and
on a schedule.

### 8.3 Mathematical specification
`TIS = Σₜ wₜ·passₜ / Σₜ wₜ × 100`, over test families t ∈ {RLS-enforcement, cross-tenant-API,
audit-log-completeness, key-segregation, config-bleed}, weight `wₜ` by data sensitivity (PII/financial
tables higher). RLS test: for each tenant-table, assert `SELECT` under tenant A's JWT returns 0 rows of
tenant B (`ρ_leak = leaked_rows / probe_rows` must be 0; any leak → family fail). Audit-log completeness:
`C = received_events / expected_events` per tenant per event-type (target ≥0.999). Composite gate:
release blocked if `TIS < 95` **or** any P0 family (RLS, cross-tenant-API) fails.

| Parameter | Source |
|---|---|
| Sensitivity weights wₜ | Data-classification policy |
| Expected event counts | Instrumentation baseline per API route |
| Probe row counts | Seeded canary rows per tenant |
| Pass thresholds | SOC 2 CC6/CC7, ISO 27001 A.9/A.12 |

### 8.4 Data requirements
`pg_policies` / `pg_class` for live RLS state, per-tenant JWTs for probe execution, API-gateway access
logs, audit-log store event counts, KMS key-alias mapping per tenant. The static `TABLE_AUDIT` becomes
the *expected* baseline the live probes reconcile against.

### 8.5 Validation & benchmarking plan
Run probes against a seeded two-tenant fixture with known canary rows; assert zero leakage. Chaos test:
deliberately drop an RLS policy and confirm TIS drops and the release gate trips. Reconcile evidence
output against an external SOC 2 auditor's sample request.

### 8.6 Limitations & model risk
Probe coverage ≠ proof of isolation (untested query paths can still leak); static baselines drift.
Conservative fallback: default any table absent from the live `pg_policies` scan to `fail`, and treat a
missing audit event as a completeness failure rather than assuming benign loss.

## 9 · Future Evolution

### 9.1 Evolution A — Executable isolation tests replacing the static inventory (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide promises an automated tenant-isolation test suite with a computed `TIS = passed/total × 100`, but the page is a hand-maintained static inventory — 21 tables tagged `hasOrgId`/`rlsEnabled` in a JSX constant, 10 demo tenants, an 8×6 RBAC matrix, with only filter/count aggregations. Evolution A makes the audit real and self-updating: a backend that introspects the actual schema and executes cross-tenant access probes.

**How.** (1) New route `api/v1/routes/tenancy_audit.py`: `GET /table-audit` queries `information_schema` + `pg_policies` on the live Supabase instance to derive `hasOrgId` and `rlsEnabled` per table automatically — the platform has 577 tables, not the 21 hand-listed, and the roadmap's D2 stage (org_id audit + RLS defense-in-depth) is exactly this work; this module becomes its measurement instrument. (2) `POST /isolation-test` runs scripted probes: two test tenants, attempt cross-org reads through the API layer, assert 403/empty; compute the real TIS from pass counts. (3) Persist runs in an `isolation_test_runs` table so SOC 2 evidence has timestamps and history, replacing the currently fictional evidence-package claim.

**Prerequisites.** Requires test-tenant fixtures and a non-production target (Supabase branch DB per roadmap D1) for probe runs; the hand-curated reference-table exclusion list (`gleif_lei`, `owid_co2_annual`, `ofac_sdn`, `sbti_targets`) carries over as config. **Acceptance:** table audit reflects a schema migration within one refresh without hand-editing; a deliberately RLS-disabled test table drops the TIS and appears flagged.

### 9.2 Evolution B — Compliance-evidence copilot for auditor Q&A (LLM tier 1)

**What.** A copilot that answers auditor-style questions — "which tenant tables lack org_id?", "show the access matrix for the analyst role", "what SOC 2 CC6.1 evidence exists for logical access?" — from the module's audit data, and drafts evidence narrative sections mapping test results to SOC 2 Trust Services Criteria and ISO 27001 Annex A controls (both already the named standards in §5).

**How.** Tier 1 over existing content: system prompt from this Atlas page plus the serialized `TABLE_AUDIT`/`PERMISSIONS`/`ORGS` constants (post-Evolution A, the live `/table-audit` response instead). Control-mapping drafts are templated — each generated paragraph must reference a specific inventory row or test-run ID, with the criterion text quoted from the standard corpus, because auditors will check citations. Hard scoping rule: this is a security-sensitive surface, so the copilot must refuse to describe bypass techniques or enumerate weaknesses to non-admin roles — RBAC-gate the copilot endpoint itself to the platform-admin permission.

**Prerequisites.** Evolution A for any "current state" claims (the static 21-table list is already stale against 577 tables — a copilot asserting it as complete would be materially wrong); RBAC gating on the copilot route. **Acceptance:** every evidence paragraph cites a row/run ID; a non-admin session receives a permission refusal from the copilot endpoint itself.