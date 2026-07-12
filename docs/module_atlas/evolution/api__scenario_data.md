## 9 · Future Evolution

### 9.1 Evolution A — Complete NGFS coverage and unify the platform's scenario sources (analytics ladder: rung 1 → 2)

**What.** A reference-data access layer (no modelling engine) serving two ingested datasets with
SQL filtering: the NGFS scenario time-series (`dh_ngfs_scenario_data` — carbon price, CO₂,
temperature, GDP by model/scenario/variable/region/year, from the IIASA Explorer) and the SBTi
target registry (`dh_sbti_companies`). All endpoints are `viewer`-gated. The `/ngfs` search traces
**real-db** (good), but `/ngfs/compare`, `/scenarios`, `/models`, and `/variables` trace
**db-empty** — the grouping/distinct endpoints return nothing, suggesting partial ingestion.
Critically, this is one of *three* NGFS surfaces on the platform (alongside
`ngfs_scenarios_extract`'s JSON and `glidepath_serve`'s reads). Evolution A completes coverage and
consolidates.

**How.** (1) Fully populate `dh_ngfs_scenario_data` so the distinct/compare endpoints return real
scenario, model, and variable lists — the grouping endpoints are how consumers discover what's
available. (2) Make this the platform's single NGFS source of truth: retire or back the
`ngfs_scenarios_extract` JSON seed and `glidepath_serve`'s reads onto this table so every module
draws the same numbers. (3) Add vintage tagging (Phase 4 vs 5) for reproducibility. (4) Similarly
verify SBTi registry coverage. (5) No formulas to bench-pin, but validate row counts and
distinct-value completeness.

**Prerequisites.** Full IIASA NGFS ingestion into `dh_ngfs_scenario_data`; a consolidation plan
across the three NGFS surfaces. **Acceptance:** `/ngfs/compare`, `/scenarios`, `/models`,
`/variables` return `passed` with real-db data; other NGFS-consuming modules read this table;
vintages tagged; SBTi endpoints return real coverage.

### 9.2 Evolution B — Scenario and target-registry lookup tool (LLM tier 1 → 2)

**What.** As a reference layer, this module's LLM value is as the canonical *NGFS + SBTi lookup
tool* other copilots call: "what's the NGFS Net Zero carbon-price path for the EU?" via
`/ngfs/compare`, or "has this company set a validated 1.5°C SBTi target?" via `/sbti` — real rows,
never recalled.

**How.** Tier 1 explains the discovery endpoints (`/ngfs/scenarios`, `/variables`, `/models`,
`/sbti/sectors`). Tier 2 registers the filterable search/compare endpoints as read-only tools;
because both datasets cite their source (IIASA Explorer, SBTi registry), the copilot always
attributes. This is a foundational leaf-tool for the tier-3 Desk Orchestrator — transition-risk,
net-zero-target, and stress-test copilots ground their scenario and target lookups here.

**Prerequisites.** Evolution A's population — a copilot serving scenario comparisons from db-empty
grouping endpoints would return nothing useful; the honest interim is to report the coverage gap.
**Acceptance:** every scenario value and SBTi status a consuming copilot cites traces to a tool
response with its source; the copilot discloses which NGFS vintage; queries against unpopulated
scenario/variable combinations return an explicit "not in dataset" rather than a guess.
