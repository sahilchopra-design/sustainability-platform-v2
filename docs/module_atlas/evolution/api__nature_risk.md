## 9 · Future Evolution

### 9.1 Evolution A — Replace mock biodiversity sites and linear financial mappings with grounded data (analytics ladder: rung 2 → 4)

**What.** The domain implements TNFD LEAP (`overall = 0.20·Locate + 0.25·Evaluate +
0.35·Assess + 0.20·Prepare`, each phase the mean of sub-components), WRI-Aqueduct-style
water risk projected to 2030/2040/2050, and Haversine biodiversity-overlap scoring. Two
honest defects surface in the atlas: `/biodiversity/sites` returns **mock-sample** data
(17 seeded sites, not real WDPA), and `csrd-entities/biodiversity|water` trace
**db-empty**. The financial translation is also crude linear scaling
(`capex_increase = risk_score × 2`, `revenue_at_risk = risk_score × 3`, `disruption_impact
= annual_water_cost × prob × 5`). Evolution A grounds both.

**How.** (1) Replace the mock biodiversity sites with the real WDPA layer from the
`nature_data` module (its `dh_wdpa_protected_areas` table) so overlap scoring uses actual
protected areas, and populate `esrs_e3_water`/`esrs_e4_biodiversity` so the CSRD-entity
endpoints return real disclosures. (2) Replace the linear `risk_score × k` financial
factors with calibrated damage functions tied to sector water-cost sensitivity and
transition-demand data. (3) Project water risk stochastically across the 2030/2040/2050
horizons the engine already scaffolds (rung 4). (4) Bench-pin the LEAP weighting and
Haversine scoring.

**Prerequisites.** `nature_data` WDPA integration; `esrs_e3_water`/`esrs_e4_biodiversity`
seeding (D0/D1); sector damage-function calibration source. **Acceptance:**
`/biodiversity/sites` returns real WDPA rows (provenance no longer `mock-sample`);
CSRD-entity endpoints return `passed` real-db; financial factors carry calibration
provenance; LEAP and water projections bench-pinned.

### 9.2 Evolution B — TNFD LEAP assessment copilot (LLM tier 2)

**What.** A copilot that walks an entity through LEAP — creating scenarios
(`POST /scenarios`), running `/leap-assessments/calculate`, and narrating the phase scores,
water-risk trajectory, and biodiversity overlaps — plus ENCORE dependency lookups via
`/encore/dependencies`, each figure tool-sourced.

**How.** The rich endpoint set (scenarios, LEAP assessments, ENCORE sectors/dependencies,
biodiversity sites, CSRD-entity screens) makes a strong tier-2 tool surface; the LEAP
phase-weight structure lets the copilot explain *why* Assess dominates the score. Scenario
creation and assessment persistence are the gated write actions. Strong tier-3 node in the
counterparty/supply-chain nature-screening chain alongside `nature_data` and
`nature_capital`.

**Prerequisites.** Evolution A's mock-sample fix is important — a copilot narrating
biodiversity overlaps against 17 seeded sites would present fabricated proximity as real.
Until then it must disclose the sample basis. **Acceptance:** every LEAP score, water
figure, and overlap traces to a tool response; the copilot discloses when biodiversity
data is mock-sample vs real WDPA; CSRD-entity questions against empty ESRS tables return
a coverage disclaimer, not invented disclosures.
