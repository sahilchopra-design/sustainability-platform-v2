## 9 · Future Evolution

### 9.1 Evolution A — Auto-generated catalog with live freshness from the reference layer (analytics ladder: rung 1 → 3)

**What.** A data-governance engine, not a quant model: `ReferenceDataCatalogEngine` maintains a
hand-curated registry (`REFERENCE_DATASETS`, ~38 datasets across 9 domains) of every reference
table embedded in the platform's engines, joins each against the module-lineage graph
(`MODULE_SIGNATURES`), and computes coverage/gap stats
(`coverage_pct = (embedded + seed) / total × 100`; gap severity critical if missing-and-used).
The limitation is that the registry is hand-maintained — it can drift from the actual embedded
tables and from the live `public_reference_data` store. Evolution A makes it self-updating and
freshness-aware.

**How.** (1) Generate the `REFERENCE_DATASETS` registry from an AST scan of the engines (the same
scan that powers ENGINE_CATALOG.md) plus the `reference_data_sources` registry table, so the
catalog reflects reality rather than manual curation — closing the drift risk. (2) Join to
`public_reference_data`'s `last_ingested_at`/`row_count` so `status` (embedded/seed/missing/stale)
is computed from live data currency, not a static flag — a dataset unrefreshed past its cadence
becomes `stale` automatically. (3) Rank gaps by blast radius (how many modules consume the missing
dataset) using the interconnection graph. (4) Bench-pin the coverage and gap-severity logic.

**Prerequisites.** AST engine-scan artifact (roadmap engine-registry work); `public_reference_data`
populated with `last_ingested_at` (its own Evolution A). **Acceptance:** the catalog regenerates
from code + the reference store rather than a hand-curated list; `stale` status derives from live
`last_ingested_at` vs cadence; gaps rank by consuming-module count; coverage bench-pinned.

### 9.2 Evolution B — Data-coverage copilot for platform governance (LLM tier 2)

**What.** A copilot that answers "what reference data are we missing and which modules does it
break?" (calling `/gaps` and citing severity and consuming modules), "what data does the PCAF
module depend on?" (`/module/{module_id}`), and "how complete is our emission-factor coverage?"
(`/domains`) — each figure tool-sourced.

**How.** Five read endpoints (catalog, dataset detail, domains, gaps, per-module) form the tool
set; the lineage join means the copilot can trace a missing dataset to the exact modules it
degrades — directly actionable for the platform team. This is an internal-governance meta-copilot,
pairing with the `ingestion`, `public_reference_data`, and `parameter_governance` copilots to give
the platform team a single view of data health.

**Prerequisites.** Evolution A's auto-generation for accuracy — a copilot reporting coverage from
a drifted hand-curated registry could understate or overstate gaps. **Acceptance:** every coverage
%, gap, and consuming-module list traces to a tool response; the copilot distinguishes
embedded/seed/missing/stale with live currency; it flags when the catalog itself is stale relative
to the code and refuses to assert coverage it can't source from the registry.
