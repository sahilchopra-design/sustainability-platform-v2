## 9 · Future Evolution

### 9.1 Evolution A — Calibrate the nature-to-value channels and link real LEAP inputs (analytics ladder: rung 2 → 3)

**What.** `NatureREIntegrationEngine` bridges TNFD nature-risk into real-estate valuation
via three independent adjustment channels — water NOI adjustment, biodiversity cap-rate
add-on, and a nature haircut — plus a Biodiversity Net Gain capex estimate
(`bng_units = area_ha × 0.10 × (1 + bio_impact×0.1)`) and an EU Taxonomy DNSH screen. The
adjustment magnitudes all come from static property-type × risk-band lookup tables
(`NATURE_HAIRCUT_TABLE`, `WATER_NOI`, `BIO_CAP_RATE`) documented as "platform
calibrations". The BNG unit cost carries a `GBP→EUR approx ×1.17` hardcoded FX. Evolution
A calibrates the tables and wires real risk inputs.

**How.** (1) Feed the LEAP-score band that keys the haircut table from the `nature_risk`
module's actual LEAP assessment for the property's location, rather than a caller-supplied
band — closing the loop the module name promises. (2) Calibrate the water/cap-rate/haircut
schedules against transacted evidence or published nature-valuation studies with a
provenance date, replacing "platform calibration". (3) Replace the hardcoded 1.17 FX with
a live rate. (4) Add a scenario sweep so nature-adjusted value responds to a
degradation/restoration pathway, not a single band. (5) Bench-pin the income
capitalisation and portfolio roll-up.

**Prerequisites.** `nature_risk` LEAP output as an input (module exists); a nature-valuation
calibration source; live FX. **Acceptance:** haircut band derives from a computed LEAP
score, not caller input; adjustment tables carry provenance dates; BNG FX is live; bench
pin reproduces `nature_adj_value` and portfolio `avg_discount`.

### 9.2 Evolution B — Nature-adjusted valuation copilot for real-estate desks (LLM tier 2)

**What.** A copilot that runs `/assess` and explains the value bridge — "your market value
drops 14% after nature adjustments: 6% from the biodiversity cap-rate widening, 5% from the
LEAP-band haircut, 3% from water-stressed NOI; BNG compliance needs €X capex; the asset
fails EU Taxonomy DNSH on water" — each figure tool-sourced, with portfolio roll-up via
`/portfolio`.

**How.** Two POST endpoints plus five `/ref/*` tables (haircut, water-NOI, bio-cap-rate,
BNG costs, EU-tax-DNSH) that ground every adjustment. The three-channel decomposition lets
the copilot attribute the total discount to specific drivers; what-ifs ("what if we fund
BNG and cut the biodiversity impact score?") re-run statelessly. Cross-links to the
`green_premium_tenant` and `nature_risk` copilots for a full property ESG picture.

**Prerequisites.** None hard — engine is honest; stronger once Evolution A calibrates the
tables and links real LEAP scores. **Acceptance:** every adjustment and value figure
traces to a tool response; the copilot labels the adjustment magnitudes as platform-
calibrated (not market-observed) until Evolution A; DNSH pass/fail cites the
`/ref/eu-tax-dnsh` criteria; it refuses to present the nature-adjusted value as an
appraisal.
