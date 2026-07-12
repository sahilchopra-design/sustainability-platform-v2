## 9 · Future Evolution

### 9.1 Evolution A — Executable isolation tests replacing the static inventory (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide promises an automated tenant-isolation test suite with a computed `TIS = passed/total × 100`, but the page is a hand-maintained static inventory — 21 tables tagged `hasOrgId`/`rlsEnabled` in a JSX constant, 10 demo tenants, an 8×6 RBAC matrix, with only filter/count aggregations. Evolution A makes the audit real and self-updating: a backend that introspects the actual schema and executes cross-tenant access probes.

**How.** (1) New route `api/v1/routes/tenancy_audit.py`: `GET /table-audit` queries `information_schema` + `pg_policies` on the live Supabase instance to derive `hasOrgId` and `rlsEnabled` per table automatically — the platform has 577 tables, not the 21 hand-listed, and the roadmap's D2 stage (org_id audit + RLS defense-in-depth) is exactly this work; this module becomes its measurement instrument. (2) `POST /isolation-test` runs scripted probes: two test tenants, attempt cross-org reads through the API layer, assert 403/empty; compute the real TIS from pass counts. (3) Persist runs in an `isolation_test_runs` table so SOC 2 evidence has timestamps and history, replacing the currently fictional evidence-package claim.

**Prerequisites.** Requires test-tenant fixtures and a non-production target (Supabase branch DB per roadmap D1) for probe runs; the hand-curated reference-table exclusion list (`gleif_lei`, `owid_co2_annual`, `ofac_sdn`, `sbti_targets`) carries over as config. **Acceptance:** table audit reflects a schema migration within one refresh without hand-editing; a deliberately RLS-disabled test table drops the TIS and appears flagged.

### 9.2 Evolution B — Compliance-evidence copilot for auditor Q&A (LLM tier 1)

**What.** A copilot that answers auditor-style questions — "which tenant tables lack org_id?", "show the access matrix for the analyst role", "what SOC 2 CC6.1 evidence exists for logical access?" — from the module's audit data, and drafts evidence narrative sections mapping test results to SOC 2 Trust Services Criteria and ISO 27001 Annex A controls (both already the named standards in §5).

**How.** Tier 1 over existing content: system prompt from this Atlas page plus the serialized `TABLE_AUDIT`/`PERMISSIONS`/`ORGS` constants (post-Evolution A, the live `/table-audit` response instead). Control-mapping drafts are templated — each generated paragraph must reference a specific inventory row or test-run ID, with the criterion text quoted from the standard corpus, because auditors will check citations. Hard scoping rule: this is a security-sensitive surface, so the copilot must refuse to describe bypass techniques or enumerate weaknesses to non-admin roles — RBAC-gate the copilot endpoint itself to the platform-admin permission.

**Prerequisites.** Evolution A for any "current state" claims (the static 21-table list is already stale against 577 tables — a copilot asserting it as complete would be materially wrong); RBAC gating on the copilot route. **Acceptance:** every evidence paragraph cites a row/run ID; a non-admin session receives a permission refusal from the copilot endpoint itself.
