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
