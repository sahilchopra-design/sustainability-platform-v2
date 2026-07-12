## 9 · Future Evolution

### 9.1 Evolution A — Time-normalised two-term ROI on entered consumption data (analytics ladder: rung 1 → 2)

**What.** §7 documents the gaps: no revenue/production field exists, so the guide's `ResourceIntensity = Consumption / Revenue` is uncomputable; the ROI drops the guide's carbon-savings term (`roi = savings/capex` only) and, worse, conflates cumulative savings with a point investment with no time horizon — non-comparable across project vintages (§7.6); and all 70 companies are independently seeded, so the capex-vs-savings scatter shows no real relationship. Evolution A implements the module's own workflow claim ("input company resource consumption data") with the two-term, time-normalised economics.

**How.** (1) Intake: per-entity annual consumption by resource type (energy MWh, water m³, materials t, waste t) plus revenue/production — the fields the intensity ratio needs; a `resource_efficiency_entries` table with period keys. (2) `POST /api/v1/resource-efficiency/roi`: annualised two-term ROI — `(annual resource savings × price + annual CO₂ savings × carbon price) / capex`, with resource prices from refdata (energy/water benchmarks) and the carbon price a scenario parameter; horizon explicit (simple payback and NPV variants), fixing the vintage-comparability defect. (3) Intensity trends computed per entity-year with EU Resource Efficiency Scoreboard benchmark bands as cited comparison lines. (4) The seeded 70-company book becomes a labelled demo fixture; SBTN guidance content stays as curated reference.

**Prerequisites.** Resource-price reference rows; carbon-intensity factors per resource type (refdata EF tables). **Acceptance:** a bench project's ROI reproduces by hand with both terms visible; intensity requires revenue and shows an honest null without it; two projects with equal savings but different horizons rank differently under the NPV variant.

### 9.2 Evolution B — Efficiency-investment case-builder copilot (LLM tier 2)

**What.** Sustainability officers pitch efficiency capex internally. The copilot builds the case: "we're replacing compressed-air systems at two sites — compute the ROI with carbon value at €85/t, compare our post-project intensity against the EU scoreboard band, and draft the CFO memo", each figure a tool call over the Evolution-A endpoints, the memo composed via report studio.

**How.** Tier-2 tool schemas over the ROI/intensity/benchmark endpoints; drafted memos carry the calculation's stated assumptions (prices, carbon price, horizon) in an assumptions box the copilot fills from the tool payload — decision documents without visible assumptions are the failure mode to design against. Benchmark claims cite the scoreboard vintage. SBTN questions answer from the curated guidance content at tier 1 (documentary, legitimately real today). Guardrails: no savings estimates the user hasn't entered or the engine hasn't computed; sensitivity ("ROI at €50–120/t carbon") runs as a parameter sweep tool call, not model interpolation.

**Prerequisites (hard).** Evolution A's entry data and engine — case-building on the current uncorrelated seeded book would fabricate payback evidence; benchmark vintage fields. **Acceptance:** memo figures match tool responses including the assumptions box; sweeps enumerate actual endpoint calls; benchmark comparisons carry the scoreboard year.
