## 9 · Future Evolution

### 9.1 Evolution A — Refresh the module map and add semantic mapping (analytics ladder: rung 1 → 2)

**What.** A schema-introspection and inter-table lineage service over `information_schema` — five
endpoints (tables, preview, relationships, datapoint-mappings, modules) whose "methodology" is
classification heuristics, not numeric formulas; no PRNG, all live catalog data. §7.5 names the
concrete gaps: `TABLE_MODULE_MAP` is a **manually curated snapshot the platform has outgrown** —
`di_*` intake, `dh_*` data-hub and `ctp_*` china-trade table families all fall through to `other`, so
module analytics increasingly mislabel; the declared `semantic_match` confidence tier is **never
implemented** (only `exact_fk` and `inferred_name` are emitted); and `COUNT(*)` per table is exact but
O(table) per request with no caching. Evolution A regenerates the module map from the Atlas builder's
own table→module registry and adds the semantic mapping tier.

**How.** `_classify_module` sources `TABLE_MODULE_MAP` from the Atlas builder's authoritative
table-ownership data (which already knows every `di_*`/`dh_*`/`ctp_*` table's module) instead of a
hand-curated constant; a `semantic_match` tier uses column-comment/type similarity for links that
share meaning without a shared `*_id` name. Rung 2: cache `/tables` counts via `pg_class.reltuples`
estimates (or materialized views) so introspection scales.

**Prerequisites.** Fix the harness failure — §4.2 shows `GET /tables/{table_name}/preview` **failed**
(db-empty); regenerate the module map (the §7.4 example shows `di_*` pairs lumping under
`other <-> other`). **Acceptance:** `di_*`/`dh_*`/`ctp_*` tables classify to their real modules, not
`other`; a semantic mapping is emitted where columns match by meaning; the preview endpoint passes the
harness; large-schema `/tables` no longer full-table-counts.

### 9.2 Evolution B — Schema-lineage copilot for data governance (LLM tier 2)

**What.** A copilot for data engineers/governance answering "which tables belong to the PCAF module?"
(`/modules`), "what references `csrd_entity_registry`?" (`/relationships`), "trace the datapoint
lineage between CBAM and supply-chain tables" (`/datapoint-mappings` with the module-pair summary),
and "preview this table" (`/tables/{name}/preview`) — narrating the real FK + inferred mapping graph
that underpins the platform's lineage visualisations (BCBS 239-style traceability).

**How.** Tool schemas over the 5 endpoints; the relationship taxonomy (identity/financial/risk/
temporal/spatial/classification links) and module classification are the grounding. The
no-fabrication validator ensures any table/column/relationship cited comes from a tool call, not the
model's assumptions about schema. Read-only by construction — no mutating tools. This copilot supports
the platform's own maintenance (e.g. spotting cross-module coupling before a schema change) rather
than end-user analytics.

**Prerequisites.** Evolution A's refreshed module map (so relationships are attributed to real modules,
not `other`) and preview harness fix; Atlas corpus embedded (roadmap D3). **Acceptance:** every table,
column and relationship cited traces to an introspection tool call; a cross-module lineage question
resolves via the real FK/inferred graph with correct module labels; a preview returns actual rows,
never a fabricated schema.
