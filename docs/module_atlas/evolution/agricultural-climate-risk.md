## 9 · Future Evolution

### 9.1 Evolution A — Probabilistic crop EAL with real hazard and price inputs (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide's EAL integral
`EAL_crop = Σ[P(event_i) × YieldLoss_i × Price_i × Area_i]` and the drought composite
`DroughtExposure = AIR × WaterStressScore` are **not computed** — the 48 regions' yield
changes, physical-risk scores and portfolio losses are all seeded PRNG draws whose only real
structure is the RCP ordering imposed by construction. The genuine agronomic content lives in
two hand-authored tables (CROP_SCI heat thresholds/CO₂ uplift; ADAPT_MEASURES). Evolution A
builds the real EAL: crop-vulnerability functions × hazard exceedance-probability curves ×
commodity price × planted area, plus the AQUEDUCT-based drought×water-stress composite the
guide specifies — the platform already has a physical-risk digital twin (wildfire/flood/
cyclone grids) to source hazard probabilities.

**How.** `POST /api/v1/agri-climate/eal` (crop, area, coordinates, SSP → EAL by hazard,
insurance gap) sourcing hazard exceedance from the existing `ref_*_zones` PostGIS grids and
WRI Aqueduct water-stress scores; CROP_SCI vulnerability parameters become the damage
functions; adaptation ROI computed as `f(capex, yieldRecovery, price)` instead of a static
seed field. Rung 3 calibration: backtest modelled yield losses against FAO GAEZ historical
anomalies and Swiss Re Sigma agricultural loss ratios (the 35%-insured anchor the page cites).

**Prerequisites (hard).** Purge the pervasive `sr()` draws per the no-fabricated-random
guardrail; source commodity prices and planted-area data (currently entirely absent);
reuse the digital-twin hazard grids rather than re-deriving. **Acceptance:** two regions with
identical crop but different Aqueduct water stress produce different drought exposure; EAL
scales with planted area and price; adaptation ROI recomputes from capex and recovery.

### 9.2 Evolution B — Agri physical-risk copilot on the loan book (LLM tier 1)

**What.** A chat panel answering "why is coffee flagged VERY HIGH vulnerability?" (heatThresh
30°C < 33 rule from CROP_SCI), "which regions are high physical risk under RCP 8.5?", and
"what's the insurance protection gap for this wheat portfolio?" — grounded in the page's
computed KPIs (avg yield Δ, high-risk count, total exposure) and the crop-science table. Since
the loss numbers are synthetic scenario curves today, the copilot must state that expected-
loss and NPL figures are seeded scenario paths, not credit-risk computations (§7.5).

**How.** Tier-1 roadmap pattern: §7.1 field table, §7.2 crop-science parameters and §7.6
framework alignment (IPCC AR6 WGII Ch.5, FAO GAEZ, WRI Aqueduct, NGFS) embedded as the module
corpus; page state (crop/scenario filter, portfolio subset) passed as context so answers cite
the actual on-screen aggregates; served via `POST /api/v1/copilot/agricultural-climate-risk/
ask` with a refusal path for un-computed asks. After Evolution A, graduates to tier 2 by
tool-calling `POST /agri-climate/eal` for real per-portfolio loss what-ifs.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note.
**Acceptance:** cited aggregates match the §7.4 worked example (−22.6% avg yield Δ, 2 high-
risk regions, $250M exposure); asking for a probabilistic EAL before Evolution A returns a
refusal naming the absent exceedance-curve/price/area inputs.
