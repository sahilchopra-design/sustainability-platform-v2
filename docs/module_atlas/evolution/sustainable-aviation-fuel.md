## 9 · Future Evolution

### 9.1 Evolution A — Real CORSIA/RED III lifecycle-CI engine and a corrected mandate-cost calculator (analytics ladder: rung 1 → 2)

**What.** The §7 deep-dive documents two defects that define this evolution's scope: (1) no per-MJ lifecycle carbon-intensity calculation exists — `PW_GHG` is a static %-reduction literal, not the guide's `CI = (GHG_feedstock + GHG_process + GHG_use) / MJ_fuel`; (2) the one genuine calculator, `calcMandateCost`, has a ~1,000× scaling defect (`safNeeded × 0.003` tCO₂/tonne vs a defensible ~2–3 tCO₂/tonne), making its carbon-offset value negligible (0.016% of premium cost in the §7.5 worked example). Evolution A fixes the defect and builds the CI engine.

**How.** (1) Correct `carbonSaved` to `safNeeded × 3.16 × PW_GHG[pathway]/100` (fossil Jet-A combustion baseline × pathway reduction share) — a one-line fix with an outsized display impact. (2) Seed the published CORSIA default life-cycle emissions values table (ICAO document, free) as a reference table keyed by pathway × feedstock, so CI in gCO₂e/MJ becomes a lookup + blend-weighted average rather than a literal, with the ≥10%-below-89 gCO₂e/MJ eligibility test computed. (3) Replace the cost-projection curve's `sr()`-randomised 4–6%/yr decline with a fixed, cited Wright's-Law learning rate per pathway, making the 2024–2035 sweep a real scenario tool.

**Prerequisites.** The 60 producers' `sr()`-seeded capacity/IRR figures remain labelled illustrative; the accurate 26-country `MANDATES` table is the asset to build on. **Acceptance:** the §7.5 example's carbon-offset value rises from $1,440 to ~$1.1–1.2M; CORSIA-ineligible blends (CI reduction <10%) are flagged; bench pin on one CI lookup per pathway.

### 9.2 Evolution B — Mandate-compliance copilot over the 26-country regulatory table (LLM tier 1 → 2)

**What.** The module's genuinely strong asset is real regulatory content: the 26-row `MANDATES` table (EU ReFuelEU, UK buy-out mechanism, US IRA credits, Brazil RenovaBio, with real 2030/2050 targets, e-fuel sub-quotas, and enforcement/penalty text) and the accurate `REFUELEU_TIMELINE`. A copilot answers airline-strategy questions — "what do I owe if I miss the 2030 EU 6% mandate on 200kt uplift?", "which jurisdictions have e-fuel sub-quotas before 2035?" — grounded in these rows and, at tier 2, calling the corrected mandate-cost calculator.

**How.** Tier 1: embed `MANDATES`, `REFUELEU_TIMELINE`, the pathway eligibility flags (`PW_CORSIA`/`PW_EURED`, which correctly reflect both schemes' approved-pathway lists per §7.6), and this Atlas page as the corpus; per the Tier-1 pattern the copilot cites the specific mandate row and refuses questions the table doesn't cover (e.g. bilateral CORSIA offset pricing). Tier 2: expose the mandate-cost calculation as a backend endpoint (it currently lives only in the React page) and auto-generate its tool schema, so what-ifs ("premium at $1,200/t, carbon at €90") are executed, not estimated.

**Prerequisites (hard).** Evolution A's `carbonSaved` fix must land first — narrating the current calculator would confidently explain numbers that understate carbon value ~1,000×. **Acceptance:** every $ figure in an answer traces to a tool call; penalty/enforcement quotes match `MANDATES` row text verbatim; the copilot notes producer figures are synthetic when asked about named companies.
