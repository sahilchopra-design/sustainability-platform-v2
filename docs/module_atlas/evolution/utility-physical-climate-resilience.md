## 9 · Future Evolution

### 9.1 Evolution A — Derived hardening ROI on the platform's hazard grids (analytics ladder: rung 1 → 2)

**What.** Only two of the guide's five formulas are real today (`AAEL = RAV ×
AEP_loss%` and `Insurance_Gap = RAV × (1−coverage)`); §7 flags that `Hardening_ROI`,
`Adaptation_BCR`, and SAIDI improvement are hardcoded per-row fields — changing an
asset's `hardening_capex` never moves its displayed `adaptation_roi` — and the 10
hardening measures have no linkage to the 15 assets. Evolution A implements the §8
spec's core loop: `AAL_after = AAL × (1 − RiskReduction_m)` per applicable
asset-measure pair, discounted at regulatory WACC into `BCR = NPV_avoided / Capex`,
with an asset-to-measure applicability matrix (flood barriers don't apply to the
Mojave solar site). Peril scores stop being author-assigned: geocode the 15 assets and
resolve flood/wind/wildfire drivers from the platform's populated `ref_*_zones`
digital-twin grids (real USGS/IBTrACS/GWIS/OpenFEMA sources), keeping heat/ice as
curated values until sources exist.

**How.** New backend `utility_resilience_engine` (module is Tier B, EP-EL5) with
`POST /aal`, `POST /hardening-rank`; RCP loss trajectories re-derived from
peril-conditioned AAL scaling rather than the current smoothed random-walk curves
(§7.3 step 4). Pin the Coastal Gas Terminal I worked example in `bench_quant`.

**Prerequisites.** The random-walk LOSS_TIMELINE acknowledged and replaced; asset
geocodes added to the seed data; flood grid coverage caveat (48 rows, named-city
samples) stated in output metadata. **Acceptance:** editing `hardening_capex` changes
BCR on the page; each measure's ranked list only contains applicable assets; bench pin
reproduces AAEL $24.96M for the gas terminal.

### 9.2 Evolution B — Resilience-capex copilot for TCFD filings and PUC dockets (LLM tier 2)

**What.** The module's users (utility climate risk officers, infrastructure lenders)
need defendable narratives: "justify the $X hardening programme to the regulator" or
"write the TCFD physical-risk section for our T&D segment." Evolution B is a
tool-calling assistant over Evolution A's endpoints: it runs `POST /hardening-rank`
for the portfolio, cites each asset's AAL, insurance gap, and measure-level BCR from
tool outputs, and drafts the filing text mapped to the module's real reference
frameworks (NERC CIP-014, EPRI Grid Resilience Investment Framework, EU Taxonomy
adaptation criteria) — including honest statements about which perils are grid-sourced
versus curated.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; system prompt
assembled from this Atlas page with the §7.5 limitations block included so the copilot
states, for example, that SAIDI benefits use regulator-published VoLL assumptions.
Adaptation-finance instrument templates (the 6 illustrative deals on the Finance tab)
are presented as comps, never as live pricing.

**Prerequisites (hard).** Evolution A's engine — narrating today's hardcoded
`adaptation_roi` fields would launder author-assigned numbers into regulatory filings.
**Acceptance:** every $ figure and BCR in a drafted filing traces to a tool call;
asked for a cat-model PML the engine doesn't compute, the copilot refuses and names
the AAL metric it does have.
