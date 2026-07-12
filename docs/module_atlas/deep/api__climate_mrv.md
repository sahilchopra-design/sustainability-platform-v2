## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/services/climate_mrv_engine.py` ("Climate Data & MRV Engine — E73"), exposed at
`/api/v1/climate-mrv` via `backend/api/v1/routes/climate_mrv.py`.)*

### 7.1 What the module computes

Five deterministic, function-level assessments (no DB, no PRNG):

1. **MRV system assessment** (`POST /assess-mrv-system`) — grades a facility's
   measurement/reporting/verification setup: ISO 14064-3 assurance level, a data-quality score
   `DQS = mean(measured accuracy, completeness, timeliness)` computed **only from
   caller-measured dimensions** (honest `None` + explanatory note otherwise), digital-MRV
   maturity (1–5 from system type), verification readiness, CDP band, and EMAS/UK SECR/EU ETS
   applicability flags.
2. **Satellite coverage scoring** (`score_satellite_coverage`) — per-sensor methane detection
   probability:
   ```
   P_detect = clamp(5, 98, facility_rate_kg_hr / sensor_threshold_kg_hr × 60 × lat_factor)
   coverage_score = detectable_sensors / assessed_sensors × 100
   ```
3. **PCAF data-quality scoring** (`calculate_data_quality_score`) — PCAF DQS 1–5, IPCC tier,
   uncertainty, and a 4–5-dimension quality profile, all derived from the supplied
   `data_sources` list (coverage %, verified flag, source type).
4. **Digital MRV maturity** (`POST /assess-digital-maturity`) — 5-level maturity model with
   capability gap analysis, upgrade roadmap, indicative cost bands and timeline.
5. **MRV compliance report** (`generate_mrv_report`) — ISO 14064-3 12-item weighted checklist +
   EMAS/UK SECR/EU ETS requirement blocks; scores come only from a caller `self_assessment`
   (weighted mean renormalised over assessed items; `not_assessed` otherwise).

`GET /ref/*` endpoints expose the raw constant tables (checklist, maturity levels, PCAF DQS map,
satellite systems, sector emission factors, MRV system types).

### 7.2 Parameterisation

**ISO 14064-3 assurance mapping** (engine-authored): Level 1 Reasonable Assurance requires
maturity ≥4 and DQS ≥88; Level 2 Limited Assurance maturity ≥3 and DQS ≥75; else Level 3
Compilation; `insufficient_data` when no dimensions measured.

**Verification readiness:** ≥88 & maturity ≥3 → ready; ≥72 → nearly ready; ≥55 → preparatory;
else remediation. **CDP band on completeness:** ≥85 A-list eligible · ≥70 B · ≥55 C · else D.

**MRV system types → maturity** (with reference accuracy/completeness bands used only as
context): manual_spreadsheet 1 (60–80%), erp_module 2, dedicated_esg_platform 3, hybrid 3,
iot_integrated 4, ai_automated 5 (93–99%). Maturity labels: Manual/Automated/Integrated/
Intelligent/Autonomous.

**Satellite systems** (public sensor specs hard-coded): TROPOMI/Sentinel-5P 5.5 km, daily,
1,000 kg CH₄/hr threshold; GHGSat 25 m, 3-day, 50 kg/hr; CarbonMapper 3 m, 14-day, 10 kg/hr;
MethaneSAT 1 km, 7-day, 200 kg/hr; Landsat TIRS (no CH₄ threshold, excluded from probability).
Facility typical emission rates: power plant 10,000 · steel 8,000 · cement 6,000 · oil&gas
5,000 · chemicals 3,000 · coal mine 2,000 · landfill 1,500 · other 1,000 · wastewater 800 ·
agriculture 500 kg/hr (engine-authored). Latitude factor 1.0 (<60°), 0.85 (<70°), 0.65 (≥70°).

**PCAF DQS ladder** (per PCAF 2022 Data Quality Score framework; confidence weights
engine-assigned): 1 verified primary (1.00) · 2 reported primary (0.90) · 3 physical activity
(0.70) · 4 economic activity (0.50) · 5 revenue/asset proxy (0.30). Derivation: DQS 1 needs
≥50% verified sources AND ≥90% avg coverage; DQS 2 coverage ≥80 and ≥60% primary sources;
DQS 3 coverage ≥65; DQS 4 ≥45; else 5.

**IPCC tier uncertainty** (`IPCC_TIER_UNCERTAINTY`, commented as 2006 IPCC Guidelines Vol.1
Ch.3 ranges): Tier 1 20–60% (representative 40%), Tier 2 10–25% (17.5%), Tier 3 3–12% (7.5%) —
used as a *flagged methodology default* only when no measured uncertainty is supplied.

**Maturity upgrade cost bands** (USD, "indicative planning bands"): →L2 50–150k, →L3 150–500k,
→L4 0.5–2M, →L5 2–8M; step months 3/6/12/18; totals use band midpoints labelled
`indicative_band_midpoint` unless the caller overrides.

**UK SECR threshold:** 4,000 tCO₂e (and 400 MWh energy in the reference block); EU ETS
applicability keyed off `SECTOR_EMISSION_FACTORS` (steel 1.85 tCO₂/t, cement 0.64, chemicals
0.42, power 0.45 tCO₂/MWh… with `eu_ets_covered` flags).

### 7.3 Calculation walkthrough

For `/assess-mrv-system`, the caller supplies facility metadata, MRV system type and Scope 1
emissions; measured accuracy/completeness/timeliness and per-item ISO checklist scores are
optional. Maturity comes from the system-type lookup; DQS from measured dimensions; ISO level,
readiness and CDP band from the §7.2 thresholds; the GHG inventory sums Scope 1 + supplied
Scope 2/3 (total omitted, with a note, when components are missing). For data quality, the
source list drives coverage/verified/primary counts → DQS, tier, uncertainty and the dimension
profile (`accuracy = 95 − 7·(5 − DQS)`, granularity = primary share, verifiability = verified
share); `overall_dqs_score` is the plain mean of present dimensions. For maturity, keyword
matching on `current_systems` (e.g. "iot", "blockchain") sets the current level; target =
`min(5, current+2)`; capability gaps compare current level to each capability's definitional
required level.

### 7.4 Worked example — satellite coverage, agriculture facility at 65°N

`facility_rate = 500 kg/hr`, `lat_factor = 0.85` (60° ≤ |lat| < 70°):

| Sensor | Threshold | 500/thr × 60 × 0.85 | P_detect | Detectable (>50)? |
|---|---|---|---|---|
| TROPOMI | 1,000 | 25.5 | 25.5% | No |
| GHGSat | 50 | 510 → cap 98 | 98.0% | Yes |
| CarbonMapper | 10 | 2,550 → cap 98 | 98.0% | Yes |
| MethaneSAT | 200 | 127.5 → cap 98 | 98.0% | Yes |

Coverage score = 3/4 × 100 = **75.0 → high_coverage**; mean overpass = (1+3+14+7)/4 =
**6.3 days**; a monitoring-gap note fires for the high latitude.

Data-quality default demo (the engine's fallback source list: utility bills 75%, fuel invoices
85%, meter readings 60%, none verified): avg coverage 73.3% → **PCAF DQS 3** (confidence 0.70);
3/3 primary but coverage <80 → **IPCC Tier 2**, representative uncertainty **17.5%**; dimensions
completeness 73.3, accuracy 95−14 = 81.0, granularity 100, verifiability 0 → overall
(73.3+81+100+0)/4 = **63.6**.

### 7.5 Data provenance & limitations

- **No `sr(seed)` PRNG anywhere** — this engine was explicitly refactored to the
  "honest null" pattern: unmeasured quantities return `None` with an explanatory note
  (`data_completeness_note`, `assessment_note`, `cost_basis`, `uncertainty_basis`) instead of
  fabricated values.
- Satellite sensor specs match published instrument characteristics, but the detection-probability
  formula (`rate/threshold × 60`, capped 5–98) is a heuristic, not a plume-model (no wind,
  albedo, cloud-cover, or observation-count statistics); facility emission rates are
  order-of-magnitude class defaults.
- ISO 14064-3 "levels" are an engine construct — the standard distinguishes limited vs
  reasonable assurance engagements, not numbered levels; CDP banding on completeness alone is a
  strong simplification of CDP's scored questionnaire.
- The default data-source list (75/85/60% coverage) is a demo fallback when the caller sends
  none; PCAF confidence weights per DQS are engine-assigned, not from the PCAF standard.
- Maturity costs/timelines are labelled indicative planning bands, not vendor quotes.

### 7.6 Framework alignment

- **ISO 14064-3:2019** — the 12-item checklist tracks the standard's verification clauses
  (scope §5.2, materiality §7.2 at 5%, opinion §8.1…); weights (0.07–0.10) are engine-authored.
- **PCAF Data Quality Score (2022)** — PCAF's real 1–5 ladder ranks financed-emissions data from
  verified reported emissions (1) down to economic-proxy estimates (5); the engine derives the
  score from source coverage/verification/type shares.
- **IPCC 2006 Guidelines (Vol.1 Ch.3)** — tier-based uncertainty ranges used as documented
  methodology defaults.
- **EU ETS MRV Regulation 2018/2066** — monitoring-plan, tier methodology, March 31 reporting,
  accredited verification (EN ISO 14065), €100/tCO₂ excess-emissions penalty.
- **UK SECR (SI 2018/1155)** — 4,000 tCO₂e/400 MWh thresholds, Scope 1+2 + intensity ratio in
  the Directors' Report.
- **EMAS Regulation 1221/2009** — EMS + verified environmental statement, 3-year cycle.
- **CDP** — banding heuristic mapping completeness to A/B/C/D score ranges.
- **GHG Protocol Corporate Standard** — Scope 1/2 (location & market) / 3 inventory structure.
