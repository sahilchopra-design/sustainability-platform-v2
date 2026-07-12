## 9 · Future Evolution

### 9.1 Evolution A — Fill the grid and calibrate scores against loss history (analytics ladder: rung 2 → 4)

**What.** This is a genuine tier-A digital twin: `global_physical_risk_engine` scores 5 perils (earthquake/cyclone/wildfire/flood/sea-level) on a 2×2° PostGIS grid from real sources (USGS ANSS, NOAA IBTrACS, GWIS/EFFIS, OpenFEMA, IPCC AR6), with disciplined missing-data-aware composite re-normalisation (a missing hazard is never scored 0 — weights renormalise over available data). Its honest limitation, documented in the platform memory, is coverage: flood has ~48 rows and sea-level ~152 (named-city samples), versus thousands for earthquake/cyclone/wildfire — so `get_coverage_stats` exists precisely as a "build progress" metric. Evolution A completes the grid (gridded flood/sea-level from JRC global flood maps or FEMA NFHL, IPCC AR6 SLR projections) and calibrates the normalisation constants (the current `fwi/50`, `magnitude/9`, `wind/200`, `depth/5` scalings) against observed loss/event frequency, then adds return-period predictive layers from the ingested history.

**How.** (1) Bulk-ingest gridded flood and sea-level coverage to match the other three perils' density. (2) Calibrate each score's clamp denominator against observed damage/exceedance data rather than expert-set constants, documenting per §8. (3) Add hazard trend layers (e.g. cyclone intensity from IBTrACS seasons, FWI trend) to move toward rung-4 predictive, per the roadmap ladder.

**Prerequisites.** Flood/sea-level bulk sources (JRC/FEMA/IPCC); a loss-calibration reference (OpenFEMA claims are already ingested by the sibling flood-loss-calibrator). **Acceptance:** flood and sea-level coverage reach grid parity with the other perils; `get_coverage_stats` shows near-complete build; calibration error is reported per hazard, not hidden.

### 9.2 Evolution B — Point-and-portfolio hazard copilot (LLM tier 2)

**What.** A copilot over the atlas endpoints: "profile the physical risk of these 200 asset coordinates and tell me which perils drive the portfolio composite" tool-calls `get_point_hazard_profile` per asset and `get_region_summary`/composite for the batch, narrating the result with the engine's own `build_risk_narrative` and, crucially, its data-availability flags so gaps aren't read as low risk.

**How.** Tier-2 tool-calling over the four engine operations (point, region, composite, coverage); the grounding corpus is §5/§7 (the five source datasets, the re-normalisation rule, the per-hazard scoring formulas). The copilot's integrity backbone is the engine's missing-data discipline — it must report `data_availability` per hazard and never present a missing-coverage point as low-risk, exactly the trap the engine is built to avoid. Every score validated against tool output.

**Prerequisites.** Evolution A coverage for credible flood/sea-level answers (the copilot must currently disclose those perils' sparse coverage); prompt-caching for the engine context. **Acceptance:** every hazard score in a copilot answer traces to an engine tool call; a point lacking flood coverage is reported as "no data" not "low risk"; the composite reflects only populated hazards per the re-normalisation rule.
