## 7 · Methodology Deep Dive

The `nature_risk` domain (`/api/v1/nature-risk`) implements **TNFD LEAP** nature-risk
assessment plus WRI-Aqueduct-style water risk and Haversine biodiversity-overlap
analysis. Engines: `nature_risk_calculator.py`, `nature_risk_seed_data.py`,
`nature_risk_spatial.py`.

### 7.1 What the module computes

Three independent calculators, orchestrated by `PortfolioNatureRiskCalculator`:

1. **LEAP assessment** (`LEAPAssessmentCalculator`) — a 0–5 risk score for each of the
   four TNFD LEAP phases, combined by fixed weights:

   ```
   overall = 0.20·Locate + 0.25·Evaluate + 0.35·Assess + 0.20·Prepare
   ```

   Each phase score is the **mean of its sub-components** (each 0–5).
2. **Water risk** (`WaterRiskCalculator`) — a weighted composite of six Aqueduct-style
   indicators, projected to 2030/2040/2050.
3. **Biodiversity overlap** (`BiodiversityOverlapCalculator`) — Haversine distance from an
   asset to sample protected sites, scored by proximity band × site sensitivity.

### 7.2 Parameterisation / scoring rubric

**LEAP phase weights** (`PHASE_WEIGHTS`) — Locate 0.20, Evaluate 0.25, Assess 0.35,
Prepare 0.20. Assess is weighted highest, reflecting TNFD's emphasis on risk/opportunity
sizing. **Provenance:** platform-set weights consistent with TNFD LEAP guidance.

**Risk-rating thresholds** (`RISK_THRESHOLDS`): low <2, medium-low ≥2, medium ≥3,
medium-high ≥4, high ≥4.5, critical ≥5.

**Water composite weights** (`_calculate_composite_score`):

| Indicator | Weight |
|---|---|
| Water stress | 0.35 |
| Drought risk | 0.20 |
| Groundwater decline | 0.15 |
| Interannual variability | 0.10 |
| Seasonal variability | 0.10 |
| Flood risk | 0.10 |

Score capped at 5. Projection adds `stress_adjustment = (scenario_temp − 1.1)·0.3` to
water stress and `(temp−1.1)·0.2` to drought (1.1 °C = present warming baseline).

**Biodiversity severity** (`IMPACT_SEVERITY`): direct overlap 1.0, 5 km buffer 0.7, 10 km
0.4, 25 km 0.2. **Site sensitivity** (`SITE_SENSITIVITY`): World Heritage 1.0, Ramsar 0.9,
Key Biodiversity Area 0.85, Protected Area 0.8, IBA 0.75.

**ENCORE NACE amplifiers** (`_ENCORE_NACE_AMPLIFIERS`, 1.0–2.0): Agriculture (A) 1.80,
Mining (B) 1.60, Water/waste (E) 1.45, Manufacturing (C) 1.25, Finance (K) 1.00 — used to
amplify climate-integrated risk for nature-dependent sectors. Cited source: "ENCORE
database v2 / TNFD-LEAP calibration".

### 7.3 Calculation walkthrough

`calculate_portfolio_nature_risk(holdings, scenarios)` loops every holding × scenario:
`calculate_leap_assessment` → per-phase scores → weighted overall → rating. Then
`_calculate_nature_financial_impact` converts the risk score to financial deltas:

```
capex_increase%   = risk_score · 2       (2% per risk point)
opex_increase%    = risk_score · 1.5
revenue_at_risk%  = risk_score · 3
estimated_impact  = exposure · revenue_at_risk% / 100
collateral haircut% = min(risk_score · 5, 50)
```

Portfolio aggregate reports mean LEAP scores, high/critical counts, total exposure-at-risk,
and a dependency-frequency breakdown.

### 7.4 Worked example

Holding with `exposure = $100M`, biome_exposure = 3 exposed biomes, geolocated
(latitude set), value-chain coverage 0.6; ENCORE dependency avg 3.5, impact avg 3.0, two
material dependencies; physical acute/chronic 3.5/2.5, transition avg 3.0; has strategy but
no targets/metrics.

- **Locate:** biome `min(3·0.8,5)=2.4`; geo `5`; value-chain `0.6·5=3.0` → mean `3.47`.
- **Evaluate:** dependency 3.5, impact 3.0, materiality `min(2·1.5,5)=3.0` → mean `3.17`.
- **Assess:** physical `(3.5+2.5)/2=3.0`, transition 3.0, opportunities 2.5 → mean `2.83`.
- **Prepare:** strategy 4.0, targets 1.5, disclosure 1.0 → mean `2.17`.
- **Overall:** `0.20·3.47 + 0.25·3.17 + 0.35·2.83 + 0.20·2.17 = 2.91` → **rating "medium"**.
- **Financial:** revenue_at_risk `2.91·3 = 8.7%` → impact `$100M·0.087 = $8.7M`; collateral
  haircut `min(2.91·5,50)=14.6%`.

### 7.5 Water & biodiversity companion analytics

`calculate_water_risk` returns baseline + projected composite, key risk factors (flagged at
≥3), a financial impact estimate (`annual_water_cost = withdrawal·(1+baseline·0.1)`;
disruption = cost·min(baseline/10,0.5)·5), and recommendations. `calculate_overlaps` uses
the Haversine formula (R = 6371 km) to classify sites as direct (<1 km) or buffer overlaps,
scoring `Σ severity·sensitivity` capped at 5 and emitting mitigation requirements.

### 7.6 Data provenance & limitations

- **Seed data is illustrative.** `get_sample_biodiversity_sites` (17 real WDPA/Ramsar/KBA
  sites with genuine coordinates) and `get_sample_water_risk_locations` (10 sites with
  plausible Aqueduct-style scores) are curated demo values, not a live WDPA/Aqueduct feed.
  ENCORE dependency scores are a hand-built database keyed by 18 sector codes.
- No seeded-PRNG (`sr()`) fabrication here — all numbers are either curated constants or
  deterministic functions of caller inputs.
- Financial-impact coefficients (2%/1.5%/3% per risk point) are simplifying linear proxies,
  not calibrated damage functions.
- The default LEAP sub-scores (2.5 neutral) mean an under-specified entity returns a
  mid-range score rather than an error.

**Framework alignment:** **TNFD LEAP** — the four-phase Locate/Evaluate/Assess/Prepare
scaffold is implemented directly with phase weights. **ENCORE** — the WWF/UNEP-FI/Global
Canopy database of sector dependencies/impacts on ecosystem services is approximated by the
NACE amplifier table and per-sector dependency records. **WRI Aqueduct** — the six water
indicators and 0–5 stress bands mirror Aqueduct's baseline water-stress taxonomy. **GBF** —
Prepare-phase target-setting checks reference Kunming-Montréal Global Biodiversity Framework
target alignment (endpoint `/gbf-alignment/{entity_type}/{entity_id}`).
