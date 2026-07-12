## 9 · Future Evolution

### 9.1 Evolution A — Complete, scenario-parameterised pathway service (analytics ladder: rung 2 → 3)

**What.** This is the read-only **pathway data service** feeding the `glidepath`
analytics domain: four GET endpoints serving NGFS sector glidepaths (normalised to the
first year: `value(yr)/value(first_year)`) and CRREM carbon-intensity pathways. The
atlas exposes a real defect — `/crrem/{country}/{asset_type}` traces as **failed /
db-empty**, meaning the primary CRREM table (`dh_crrem_pathways`) is unpopulated and the
endpoint falls through to (or fails past) its hardcoded 14-point reference fallback.
Evolution A makes the service DB-backed and scenario-complete.

**How.** (1) Run the A13 CRREM ingester so `dh_crrem_pathways` is populated for the
country/asset-type/scenario combinations the endpoint accepts (1.5C / 2.0C), and make
the fallback path explicit in the response (`pathway_source: "hardcoded_fallback"`)
rather than silently substituting. (2) Broaden NGFS extraction beyond the current
single variable-pattern mapping to expose scenario, region, and model as first-class
query params so the sibling `glidepath` engine can select disorderly/hot-house
pathways, not just the default. (3) Verify `/stats` row counts move from db-empty to
real-db across both source tables.

**Prerequisites.** A13 CRREM ingester run against the target DB; NGFS scenario data
(`dh_ngfs_scenario_data`) coverage across scenarios. **Acceptance:**
`/crrem/{country}/{asset_type}` returns status `passed` with `real-db` provenance for
the demo country set; every pathway response labels its source (db vs fallback);
`/stats` reports nonzero NGFS and CRREM record counts.

### 9.2 Evolution B — Pathway lookup as a shared copilot tool (LLM tier 1 → 2)

**What.** This module has no user-facing analytics of its own — it's reference data — so
its LLM value is as a *grounding tool* other copilots call. The `glidepath`,
`net_zero_targets`, and CRREM-stranding copilots should resolve "what's the NZBA path
for cement under NGFS Net Zero 2050?" through `/nze/{sector}` here rather than
recalling numbers, guaranteeing every pathway figure is sourced.

**How.** Tier 1 is a thin explainer over `/sectors` and `/stats` (what pathways exist,
from which source). Tier 2 registers the four GETs as read-only tools; because the
normalisation formula and CRREM DB-first/fallback logic are documented in §7.1, the
copilot can explain *why* two pathways differ (scenario, region, source). This module
is a canonical leaf-tool for the tier-3 Desk Orchestrator: any decarbonisation question
routes here for the reference series.

**Prerequisites.** Evolution A's db-empty fix is mandatory — a copilot serving pathway
numbers from a silently-failed CRREM endpoint would ground other modules' answers in a
hardcoded fallback presented as live data. **Acceptance:** every pathway value a
consuming copilot cites traces to a `/nze` or `/crrem` tool response carrying an honest
`pathway_source` label; requesting an unsupported scenario/country returns an explicit
"not in pathway library" rather than the fallback masquerading as coverage.
