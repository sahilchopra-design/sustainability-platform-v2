## 9 · Future Evolution

### 9.1 Evolution A — Asset-level hazard resolution with calibrated EP curves (analytics ladder: rung 2 → 4)

**What.** Replace the engine's country-level peril baselines with per-coordinate hazard
lookups from the platform's own digital twin (`global_physical_risk_engine`, the 5
populated `ref_*_zones` PostGIS grids), then calibrate the return-period loss tables
against observed loss history (OpenFEMA NFIP claims already ingested; IBTrACS track
intensities already gridded). Today two Miami towers and a Houston tower differ only by
value and asset class — after this, they differ by actual micro-location exposure.

**How.** (1) `price_physical_risk()` gains a resolution cascade: coordinate → zone-level
driver values (magnitude/wind/FWI/depth/SLR) → fall back to country baseline with
`resolution_tier` reported, mirroring the GLEIF pattern. (2) The 6 return-period points
per peril become fitted exceedance curves (GPD tail fit where claims density supports
it, documented per Atlas §8 model-card convention). (3) Backtest: EAL predictions vs
NFIP claims by county-year; publish calibration error in the response payload.

**Prerequisites.** Flood/sea-level grids upgraded from named-city samples to gridded
coverage (FEMA NFHL bulk or JRC global flood maps); `bench_quant` pin extended with a
coordinate-resolution reference case. **Acceptance:** same-city assets with different
coordinates produce different EAL; calibration error reported, not hidden; country
fallback still honest via `resolution_tier`.

### 9.2 Evolution B — Underwriter copilot with tool-called repricing (LLM tier 2)

**What.** The E104 page's chat copilot answers "why is this premium 88bps?" by citing
the live engine decomposition (peril contributions, NGFS amplifier, insurance-gap
factor from its own response payload), and executes natural-language what-ifs — "move
horizon to 2040 under disorderly", "assume 60% insured share" — as tool calls against
`POST /price` and `/stranding`, never by generating numbers itself.

**How.** Tool schemas derived from this module's existing OpenAPI operations (8 routes,
read-only Pydantic-typed); per-module system prompt assembled from this Atlas page
(§5 formulas + §7.6 engine description are the grounding corpus); the fabrication
validator checks every numeric in the answer against the conversation's tool outputs.
The first shippable slice is explanation-only (tier 1) using the already-computed page
state — no new backend at all.

**Prerequisites (hard).** Close the documented §7 guide↔code mismatch first — the page
must render engine output, not its legacy seeded-random path, before an LLM narrates
it; otherwise the copilot would explain numbers the engine never produced.
**Acceptance:** every numeric in a copilot answer traceable to a §4.2-listed endpoint
response; refusal on questions outside the module's computed surface (e.g. asking for
PML confidence intervals the engine doesn't produce).
