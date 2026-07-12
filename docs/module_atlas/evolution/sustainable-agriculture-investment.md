## 9 · Future Evolution

### 9.1 Evolution A — First backend vertical: the VM0042 ROI engine specified in §8 (analytics ladder: rung 1 → 2)

**What.** This is a tier-B, frontend-only module whose §7 deep-dive documents that neither of the guide's named formulas (`ROI_regen`, `SoilCarbonSeq = ΔSOC × BulkDensity × Depth × Area`) is computed anywhere in the 419-line file — the `REGEN_PRACTICES` table's `carbonSeq` and `payback` columns are typed-in literals, and there is no SBTi FLAG screener. Evolution A implements the §8 model specification as the module's first backend vertical: a per-hectare regenerative-transition calculator with practice-level scenario sweeps.

**How.** (1) New route (e.g. `POST /api/v1/agriculture/regen-roi`) implementing §8.3 exactly: VM0042 stock-change carbon quantity (with the 44/12 conversion and 10–20% non-permanence buffer), partial-budget ROI, and payback — replacing the 9 static practice rows' `payback` with computed values from cost/yield/carbon-price inputs. (2) Scenario capability: sensitivity grid over carbon price (±30%) and yield impact (±20%) per §8.5, rendered in the existing ROI Analytics tab. (3) SBTi FLAG applicability screen (>25% land-use Scope 3 threshold) as a simple deterministic check. (4) Replace the Impact tab's hard-coded headline KPIs ("12.4 MtCO₂/yr") with aggregations over actual calculator runs, or remove them.

**Prerequisites.** The 18-fund/`GREEN_BONDS` `sr()`-seeded financials stay clearly labelled illustrative — they are out of scope. Yield-trial reference data (USDA NASS/FAO, free) seeded per practice. **Acceptance:** Agroforestry's displayed payback is reproducibly derived from its $180/ha cost and stated inputs; a bench pin covers one worked example per practice.

### 9.2 Evolution B — Regenerative-transition underwriting copilot (LLM tier 1 → 2)

**What.** A copilot for agricultural lenders answering "which practice gives the fastest payback for a 500-ha corn operation at $40/tCO₂?" — grounded first (tier 1) in this Atlas page's practice table, §7.3 reference figures, and the named standards corpus (VM0042, SBTi FLAG 2022, IPCC AR6 WGIII Ch.7), then (tier 2) calling Evolution A's `regen-roi` endpoint to run real comparisons.

**How.** Tier 1 ships immediately against the existing static content: the copilot explains practice trade-offs (agroforestry's 3.8 tCO₂e/ha/yr vs 7.8-yr payback), cites IPCC's 1.5–3.0 tCO₂e/ha/yr range, and — critically — discloses that current table values are static literals, not site-specific calculations (§7.6 is in its corpus). Tier 2 adds one tool: the ROI endpoint, letting the copilot sweep all 9 practices for the user's acreage/prices and rank by computed ROI, with every figure traceable to a tool response. FLAG-screening questions ("must this food company set a FLAG target?") route to the deterministic threshold check.

**Prerequisites (hard).** Tier 2 is blocked on Evolution A — there is currently no endpoint to call, and a tool-calling copilot over static literals would launder them into apparent computations. **Acceptance:** tier-1 answers distinguish reference values from calculations explicitly; tier-2 rankings reproduce endpoint outputs exactly; asking for a farm-specific SOC measurement yields a refusal (the module has no MRV data).
