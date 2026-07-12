## 9 · Future Evolution

### 9.1 Evolution A — Ground the three sector calculators in real hazard and pathway data (analytics ladder: rung 2 → 4)

**What.** Three sector-specific ESG calculators computed inline (no separate engine) with Postgres
persistence: data-centre efficiency (`carbon_intensity = grid_ef × PUE × fossil_share`), insurance
CAT risk (`AAL = value × base_rate(peril) × construction_mult × age_mult`, PML by return period),
and power-plant decarbonisation (gap to IEA NZE, stranding year, capex roadmap). The CAT PML uses a
generic log-curve (`PML(rp) = value × ln(rp/10+1) × 0.15 × construction_mult`) and the climate uplift
is a linear horizon scale. §4.2 shows the list endpoints are real-db but `/{assessment_id}` reads
trace **failed**. Evolution A grounds the physics and fixes persistence.

**How.** (1) Replace the CAT generic log-PML with peril-specific curves from the platform's
physical-risk digital twin (the populated hazard grids) and OpenFEMA-calibrated flood losses, so PML
reflects the asset's real location, not a formula. (2) Ground the power-plant IEA-NZE gap in the real
IEA pathway (shared with `glidepath`) and the data-centre grid emission factor in the location's
actual grid intensity. (3) Add scenario projection of stranding/AAL across NGFS horizons (rung 4).
(4) Fix the failing `/{assessment_id}` reads and bench-pin all three calculators.

**Prerequisites.** Digital-twin hazard grids and OpenFEMA linkage for CAT; IEA-NZE pathway data;
grid-intensity reference; the failed detail endpoints repaired. **Acceptance:** CAT PML/AAL derive
from location-resolved peril data; plant gap uses the real IEA pathway; `/{assessment_id}` returns
`passed`; the three calculators bench-pinned with scenario projections.

### 9.2 Evolution B — Sector-desk assessment copilot (LLM tier 2)

**What.** A copilot that runs the relevant calculator per sector — "assess this data centre's
efficiency and give me the PUE improvement target", "price the CAT risk on this insured portfolio",
"when does this coal plant strand and what's the retrofit capex?" — each figure from a tool call,
with persisted-assessment retrieval.

**How.** Three POST calculators plus list/detail read endpoints form the tool set; each calculator's
transparent formula (documented in §7.1) lets the copilot explain the drivers — PUE and fossil-share
for data centres, construction/age multipliers for CAT, degradation-vs-pathway for plants. What-ifs
re-run statelessly. Sector-specialised node for technology, insurance, and energy desks in the tier-3
orchestrator, cross-linking to `insurance_risk`, `physical_risk_pricing`, and `real_asset_decarb`.

**Prerequisites.** Evolution A's grounding for defensible CAT/stranding figures; the `/{id}` fix for
history. **Acceptance:** every intensity, AAL/PML, and stranding figure traces to a tool response;
the copilot labels CAT PML as generic-curve until Evolution A grounds it in hazard data; it refuses
to present AAL as an actuarial price and frames outputs as sector-screening estimates.
