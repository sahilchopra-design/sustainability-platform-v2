## 9 · Future Evolution

### 9.1 Evolution A — Asset-coordinate hazard resolution and calibrated CLVaR (analytics ladder: rung 3 → 4)

**What.** Two v2.0.0 engines: `RECLVaREngine` computes real-estate Climate Value-at-Risk —
physical CLVaR over 7 hazards with depth-damage add-ons, transition CLVaR (EPC-gap brown
discount + retrofit capex + carbon-cost NPV), and a 10,000-path Monte Carlo — and
`CRREMStrandingEngine` computes CRREM v2.0 stranding year and retrofit urgency. This is already
rung-3 (Monte Carlo, CRREM-calibrated). The limitations: hazard severity uses banded value
multipliers with a fixed cross-correlation (`0.35·Σvᵢvⱼ`, `combined` correlation `0.45`), and
hazard inputs (flood depth, heat days, SLR) are caller-supplied rather than location-resolved.
Evolution A grounds hazards and calibrates the correlations.

**How.** (1) Resolve the 7 hazard drivers per-coordinate from the platform's physical-risk digital
twin (the same 5 populated `ref_*_zones` grids the `physical_risk_pricing` module uses) with a
reported `resolution_tier`, replacing caller-entered depth/heat/SLR. (2) Calibrate the
inter-hazard correlation coefficients (0.35 physical, 0.45 physical-transition) against observed
loss covariance rather than fixed constants — these drive the diversification in the CLVaR
aggregation. (3) Calibrate the CRREM pathways against the real CRREM v2.0 dataset (shared with
`glidepath`). (4) Bench-pin physical/transition/combined CLVaR and stranding year.

**Prerequisites.** Digital-twin grid linkage; a loss-covariance source for correlation
calibration; CRREM v2.0 pathway data. **Acceptance:** two properties at different coordinates
produce different physical CLVaR from real hazard grids with a resolution tier; correlation
coefficients carry calibration provenance; stranding year and CLVaR bench-pinned.

### 9.2 Evolution B — Real-estate climate-VaR copilot (LLM tier 2)

**What.** A copilot that runs `/clvar/calculate` and explains the number — "your total CLVaR is
−22%: −14% physical (flood and heat dominate) and −11% transition (EPC-D stranding by 2032 plus
retrofit capex), partially offset by diversification; VaR-99 is −31%" — each figure from a tool
call, with portfolio roll-up and CRREM roadmap.

**How.** Five endpoints (`/clvar/calculate`, `/crrem/stranding`, `/crrem/roadmap`,
`/clvar/portfolio`, `/crrem/pathways/...`) form the tool set; the `top_risk_drivers` and
`validation_summary` fields the engine returns let the copilot attribute CLVaR to specific
hazards and flag data-quality caveats. The Monte Carlo VaR-95/99 outputs support "what's my tail
loss?" questions. What-ifs ("what if we retrofit to EPC-B?") re-run statelessly. Core node for a
real-estate/lending desk, cross-linking to `green_premium_tenant` and `real_asset_decarb`.

**Prerequisites.** None hard — engines are Monte-Carlo-based and honest; stronger once Evolution A
grounds hazards in the digital twin. **Acceptance:** every CLVaR, VaR, and stranding figure traces
to a tool response; the copilot cites `top_risk_drivers` for attribution; it labels hazard inputs
as caller-supplied vs grid-resolved (per Evolution A) and refuses to present CLVaR as a market
valuation.
