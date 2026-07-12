## 9 · Future Evolution

### 9.1 Evolution A — Geocoded EAL from the digital twin, replacing the misnamed "VaR" (analytics ladder: rung 1 → 3)

**What.** §7.7 is unambiguous: 100% synthetic (procedural asset codes, `sr()` hazard scores), the "VaR" label is a misnomer for a composite-to-loss-rate transform plus additive noise, and the guide's named outputs — expected annual loss, insurance-affordability cliff, mortgage default-probability uplift — don't exist. Yet the promised workflow (geocode → SSP/horizon → per-peril exposure → EAL) is exactly what the platform's Physical Risk Digital Twin was built for. Evolution A implements the §8 EAL spec on that infrastructure rather than inventing another scoring heuristic.

**How.** (1) Property intake with geocoding; per-peril hazard resolution against the populated `ref_*_zones` grids via `global_physical_risk_engine`, with `resolution_tier` honesty for coarse coverage. (2) EAL per the §8 spec: hazard intensity → damage-ratio curve per peril/property-type → EAL = Σ (event frequency × damage ratio × value), replacing the unsourced 0.30/0.25/0.20/0.10/0.15 weights with documented per-peril curves (the atlas notes `physical-hazard-map`/`catastrophe-modelling` already carry hazard-specific loss curves — reuse them). (3) Mortgage default uplift as a documented add-on: EAL and insurance-cost stress feeding a DTI/LTV-based PD adjustment, clearly labelled a modelling assumption with citation. (4) The NGFS selector maps to scenario-differentiated hazard scaling per peril, not three flat coefficient sets.

**Prerequisites.** Flood-grid coverage upgrade (sparse today) or tier-flagged fallback; damage-curve provenance documented per Atlas §8 convention. **Acceptance:** two assets in different flood zones produce different EALs from coordinates alone; the word "VaR" disappears unless a percentile of a loss distribution is actually computed.

### 9.2 Evolution B — Lending-desk climate screen copilot (LLM tier 2)

**What.** The module's audience — mortgage lenders under the ECB climate guide, valuers under RICS — needs per-asset answers with provenance: "what drives this collateral's EAL and how confident is the flood component?", "list assets where the insurance-cost stress exceeds 1% of value under SSP5-8.5 2050", "explain to credit committee why this margin add-on is 35bps". The copilot serves these from the Evolution-A endpoints, always quoting each peril's resolution tier and damage-curve source.

**How.** Tier-2 tool schemas over the EAL/portfolio endpoints; system prompt embeds the §7.7 lineage so pre-Evolution-A the copilot cannot exist here (every current number is fabricated), and post-A it must attach the coverage caveat for coarse-tier assets. Margin-add-on explanations decompose mechanically: EAL → expected-loss bps → add-on, with the PD-uplift assumption flagged as such. Divest/engage screening runs as filtered tool queries, never as model judgement about specific addresses — the copilot ranks by computed metrics and leaves the decision framing to the user.

**Prerequisites (hard).** Evolution A; per-response provenance fields (tier, curve source) in the API payload. **Acceptance:** every EAL and bps figure in an answer traces to a tool response including its resolution tier; asked about a hazard the grids don't cover at the asset's location, the copilot reports the coverage gap.
