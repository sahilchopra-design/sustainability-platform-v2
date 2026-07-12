## 9 · Future Evolution

### 9.1 Evolution A — Verify the ×20 rescaling, label provenance per field, and go live via the engine (analytics ladder: rung 2 → 3)

**What.** This is the batch's best-grounded water module: all 40 basins carry real
WRI Aqueduct 4.0 values for the six core risk fields via the `BASIN_COUNTRY` →
`WRI_AQUEDUCT_WATER_RISK` overlay (GAP-015). Three documented issues remain. First,
§7.4 flags a possible display-compression bug: the `×20` rescaling of
`drought_risk`/`riverine_flood_risk`/`groundwater_depletion` is only correct if the
source fields are 0–5 — if they're 0–1 fractional, every rescaled value maxes at 20
instead of 100; this must be verified against the seed file's actual ranges. Second,
§7.5 notes real and synthetic fields render "with the same visual weight" — supply/
demand/deficit, desalCapacity, waterPrice, and the whole Projections tab are
illustrative but unlabelled. Third, the real data is a static frontend import; the
module never calls the shared `WaterRiskEngine` despite listing its 16 endpoints.
Evolution A: verify/fix the rescale, add per-field provenance badges (real WRI vs
illustrative), and route basin scoring through `POST /aqueduct-risk` so the engine's
`proxied_indicators` transparency reaches the UI — also replacing the synthetic
Projections tab with the engine's calibrated `physical_risk_scenarios` RCP tables
(fixing that route's currently-failed harness status).

**How.** A range assertion in the seed loader; a `provenance` field per basin metric;
`bench_quant` pin on the Ganges lookup.

**Prerequisites.** The ×20 question resolved first — calibrating on a compressed
scale would be wrong; physical-risk-scenarios route repaired. **Acceptance:** rescaled
values span the full 0–100 range where the source justifies it; every displayed metric
shows real/illustrative provenance; the Projections tab's deltas match the engine's
`_RCP_SCENARIO_CENTRAL` tables.

### 9.2 Evolution B — Basin-evidence copilot for ESRS E3/TNFD reporting (LLM tier 2)

**What.** The module's stated output is "ESRS E3, TNFD and CDP Water with basin-level
evidence" — and uniquely in this family, it actually has real basin evidence to cite.
Evolution B is a tool-calling assistant: "which of our 40 basins are Extremely High
stress with worsening groundwater, and what does that mean for our E3 disclosure?"
It queries the basin dataset (exposed as `GET /api/v1/water-risk/basins` in Evolution
A), calls `POST /esrs-e3` and `POST /physical-risk-scenarios` for entity-level
assessments, and drafts basin-evidence paragraphs where each stress score cites WRI
Aqueduct 4.0 with the country-mapping caveat (basin values are country-level
Aqueduct records, not HydroBASINS level-6 catchments — the §4.1 claim the page
doesn't actually meet).

**How.** Tier-2 stack over the existing 16-route surface plus the new basins route;
grounding corpus is this Atlas page whose §7.2 real-vs-synthetic table becomes the
copilot's provenance map. Answers must attribute every figure to WRI-real, engine-
computed, or illustrative — three-way labelling, enforced by the validator.

**Prerequisites (hard).** Evolution A's provenance fields (the copilot cannot label
what the data layer doesn't distinguish); pgvector corpus. **Acceptance:** a drafted
E3 paragraph cites only WRI-real or engine-computed figures; asked about desalination
capacity, the copilot flags it as illustrative; basin questions outside the 40-name
set are refused with the coverage list.
