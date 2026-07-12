## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/spatial-hazard` (`spatial_hazard_service.py`) is a **hazard-profile lookup service** for a
lat/lng + country, designed as the auto-population source for the CLVaR physical-risk inputs.
Its architecture is explicitly phased (docstring): **Phase 1 (current)** = deterministic
country-level hazard profiles with latitude modifiers; Phase 2 (planned) = PostGIS raster queries;
Phase 3 (planned) = external APIs (JBA flood, WRI Aqueduct, GFED wildfire).

```
profile          = COUNTRY_HAZARD_PROFILES[country]  (else _DEFAULT_PROFILE)
heat_days'       = heat_days × latitude heat multiplier
wildfire_km'     = wildfire_km / latitude wildfire multiplier   (closer = riskier)
water_stress'    = min(5, water_stress + latitude adder)
coastal_km'      = 5 km hard override for small island states (SG, MT, CY, MV, BH)
```

### 7.2 Parameterisation

**Country profiles** — 15 countries (GB, DE, NL, FR, ES, IT, US, AU, SG, IN, CN, BR, JP, AE, CA),
each with 10 hazard fields; sources cited in the header comment: *JRC PESETA IV, EEA, EA, WRI
Aqueduct, EM-DAT*. Representative rows:

| ISO | Flood zone | 100-yr depth | Heat days > 35 °C | Wildfire km | Water stress (0–5) | SLR 2050 cm | Cyclone |
|---|---|---|---|---|---|---|---|
| NL | 3a | 1.2 m | 5 | 100 | 2.5 | 35 | none (subsidence "high" — polders) |
| ES | 2 | 0.6 m | 25 | 15 | 3.5 | 30 | none |
| IN | 3a | 1.0 m | 60 | 50 | 4.2 | 35 | high |
| AE | 1 | 0.2 m | 120 | 200 | 4.8 | 35 | low |
| US | X (FEMA) | 0.3 m | 15 | 25 | 2.5 | 30 | moderate |

Unknown countries take `_DEFAULT_PROFILE` (flood zone 2, 0.5 m, 10 heat days, stress 2.0,
SLR 30 cm). Inline comments anchor several values to real events/geography ("post-2022/2023
heatwaves" FR, "Var, Gironde fires", "Venice, Po Delta" subsidence, "southern Spain severe
stress").

**Latitude modifiers** (`_latitude_modifier`): tropical <23.5° → heat ×1.5, cyclone ×1.3,
wildfire ×0.8; subtropical <35° → heat ×1.2, wildfire ×1.3, water-stress +0.5; temperate <55° →
neutral; sub-polar/polar → heat ×0.3, permafrost ×2.0, wildfire ×0.5. (The cyclone and permafrost
multipliers are computed but never applied — those fields are categorical strings.)

**Flood-zone vocabulary** mixes UK Environment Agency zones (1/2/3a/3b) and FEMA NFIP zones
(A/AE/V/X) per `get_hazard_schema()`; water stress uses the WRI Aqueduct 0–5 scale.

### 7.3 Calculation walkthrough

1. `POST /profile` → `get_hazard_profile(lat, lng, country)`: country lookup, then latitude
   modifiers if a latitude is supplied; when both coordinates are present, precision is upgraded
   from `country`/confidence `low` to `coordinate_adjusted`/`medium`, and the small-island coastal
   override may apply.
2. `POST /auto-populate` → `auto_populate_physical_inputs`: returns the CLVaR `PhysicalInputs`-
   compatible dict with `_meta {data_source, spatial_precision, confidence_band}`; caller
   overrides always win and flip `data_source` to `user_override`.
3. **Phase-2 stubs**: `query_nearby_protected_areas`, `query_flood_zone_by_location`,
   `query_wildfire_proximity` contain the intended PostGIS SQL in their docstrings but *return
   empty/None* — the live spatial joins are served by the separate `api::spatial` domain.
4. `GET /ref/countries`, `/ref/profiles`, `/ref/schema` expose the reference tables verbatim.

### 7.4 Worked example — Chennai, India (13.08 N, 80.27 E)

| Step | Computation | Result |
|---|---|---|
| Base profile (IN) | flood 3a / 1.0 m; heat 60 d; wildfire 50 km; stress 4.2; SLR 35 cm; cyclone high | — |
| Latitude band | \|13.08\| < 23.5 → tropical | heat ×1.5, wildfire ×0.8 |
| Heat days | int(60 × 1.5) | **90 days/yr** |
| Wildfire proximity | 50 / 0.8 | **62.5 km** (division moves it *farther*, i.e. lower tropical wildfire risk) |
| Water stress | 4.2 + 0 (no tropical adder) | 4.2 |
| Metadata | both coordinates present | `coordinate_adjusted`, confidence `medium`, source `country_profile_v1` |

Note the tropical `cyclone_multiplier 1.3` has no effect — `cyclone_exposure` stays the
categorical "high".

### 7.5 Data provenance & limitations

- **Deterministic reference data, no PRNG** — the header for the profile block says "Phase 1:
  deterministic reference data, upgradeable to spatial rasters". But the profiles are
  **country-average syntheses**, hand-authored to be directionally consistent with the cited
  sources (PESETA IV, WRI Aqueduct, EM-DAT) rather than extracted from them; every location in a
  country shares one profile. The service is honest about this via `spatial_precision: "country"`
  and `confidence_band: "low"`.
- Latitude adjustment is a coarse climate-band heuristic; longitude is unused except for the
  5-country island override. Two computed modifiers (cyclone, permafrost) are dead parameters.
- Phase-2/3 integrations (JBA, Aqueduct, GFED, `dh_wdpa_protected_areas`,
  `dh_flood_risk_extent`) are documented stubs returning empty results.
- Values have a fixed vintage (e.g. SLR-2050 centimetres, post-2023 heat-day counts) with no
  scenario dimension — a single implicit central pathway.

### 7.6 Framework alignment

- **IPCC AR6 WG2 Ch.4 Hazard–Exposure–Vulnerability framing** — cited as the conceptual model;
  this service supplies the *hazard* leg only, for downstream CLVaR exposure/vulnerability maths.
- **UK EA flood zones** (1/2/3a/3b: <0.1 %, 0.1–1 %, >1 % annual fluvial probability, functional
  floodplain) and **FEMA NFIP zones** (A/AE 1 % zones, V coastal wave action, X minimal) — both
  vocabularies are supported in the schema; profiles assign a single national modal zone.
- **WRI Aqueduct** — the 0–5 baseline water-stress scale is adopted directly (e.g. AE 4.8
  "extremely high" matches Aqueduct's Gulf classification).
- **JRC PESETA IV / EEA / EM-DAT** — named as calibration sources for European flood depths,
  heat-day counts and disaster exposure.
- **TCFD / ISSB IFRS S2 physical-risk disclosure** — auto-populated, provenance-tagged hazard
  inputs (with user-override precedence) support the auditability expected of disclosure-grade
  physical-risk inputs.
