# Api::Climate_Mrv
**Module ID:** `api::climate_mrv` · **Route:** `/api/v1/climate-mrv` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-mrv/assess-mrv-system` | `post_assess_mrv_system` | api/v1/routes/climate_mrv.py |
| POST | `/api/v1/climate-mrv/score-satellite-coverage` | `post_score_satellite_coverage` | api/v1/routes/climate_mrv.py |
| POST | `/api/v1/climate-mrv/calculate-data-quality` | `post_calculate_data_quality` | api/v1/routes/climate_mrv.py |
| POST | `/api/v1/climate-mrv/assess-digital-maturity` | `post_assess_digital_mrv_maturity` | api/v1/routes/climate_mrv.py |
| POST | `/api/v1/climate-mrv/generate-report` | `post_generate_mrv_report` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/satellite-systems` | `get_satellite_systems` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/iso14064-checklist` | `get_iso14064_checklist` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/mrv-system-types` | `get_mrv_system_types` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/maturity-levels` | `get_maturity_levels` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/pcaf-dqs` | `get_pcaf_dqs` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/sector-emission-factors` | `get_sector_emission_factors` | api/v1/routes/climate_mrv.py |

### 2.3 Engine `climate_mrv_engine` (services/climate_mrv_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `assess_mrv_system` | entity_id, facility_name, sector, mrv_type, annual_emissions_tco2e, measured_accuracy_pct, measured_completeness_pct, measured_timeliness_score | Assess an MRV system: ISO 14064-3 level, data quality, digital MRV maturity index, verification readiness. Data-quality dimensions (accuracy / completeness / timeliness) are entity measurements: they are only reported when the caller supplies the measured values. Absent measurements yield an honest ``None`` plus a note rather than a fabricated figure. ``MRV_SYSTEM_TYPES`` accuracy/completeness ran |
| `score_satellite_coverage` | entity_id, lat, lng, facility_type, co2_detection_threshold_kt_yr | Score satellite coverage: TROPOMI/Sentinel-5P methane detection, GHGSat point-source resolution, CarbonMapper sensitivity, overpass frequency. Detection probability is computed deterministically from the facility's typical emission rate versus each sensor's methane detection threshold and a latitude coverage factor (no stochastic noise added). |
| `calculate_data_quality_score` | entity_id, data_sources, measured_timeliness_pct, measured_uncertainty_pct | Calculate PCAF DQS 1-5 mapping, CDP completeness, IPCC Tier level, uncertainty quantification — all derived deterministically from the supplied ``data_sources`` (coverage %, verified flag, source type). Optional parameters (default ``None``, backward-compatible): measured_timeliness_pct — reported timeliness/recency score (0-100) for the data-quality dimension breakdown. Omitted from the dimension |
| `assess_digital_mrv_maturity` | entity_id, current_systems, cost_overrides_usd | Assess digital MRV maturity: 5-level model (manual→autonomous), gap analysis, upgrade roadmap, cost estimate. The required maturity level for each capability is a definitional property of the maturity model (``CAPABILITY_REQUIRED_LEVEL``) — a documented model constant, not a per-entity draw. Upgrade costs are reported as the model's indicative planning bands (``MATURITY_UPGRADE_COST_BAND``) rather |
| `_roadmap_actions` | from_level, to_level |  |
| `generate_mrv_report` | entity_id, self_assessment | Generate comprehensive MRV compliance report: ISO 14064-3 checklist, EMAS requirements, UK SECR, EU ETS MRV Regulation 2018/2066. Compliance scores are entity self-assessment results, not computable from the regulatory reference text alone. They are reported only when supplied via ``self_assessment`` (default ``None``, backward-compatible); otherwise the report returns the reference requirements w |

**Engine `climate_mrv_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SATELLITE_SYSTEMS` | `{'TROPOMI': {'full_name': 'TROPOspheric Monitoring Instrument (Sentinel-5P)', 'operator': 'ESA / Copernicus', 'species': ['CH4', 'NO2', 'CO', 'SO2', 'O3'], 'spatial_resolution_km': 5.5, 'revisit_days': 1, 'detection_threshold_ppb': 5.0, 'methane_detection_kg_hr': 1000.0, 'coverage': 'global', 'free_` |
| `ISO_14064_3_CHECKLIST` | `[{'item': '1. Verification scope and boundary', 'standard_ref': 'ISO 14064-3 §5.2', 'weight': 0.08}, {'item': '2. GHG assertion completeness', 'standard_ref': 'ISO 14064-3 §5.3', 'weight': 0.1}, {'item': '3. Material misstatement risk assessment', 'standard_ref': 'ISO 14064-3 §5.4', 'weight': 0.1}, ` |
| `MRV_SYSTEM_TYPES` | `{'manual_spreadsheet': {'maturity': 1, 'accuracy_range': (60, 80), 'completeness_range': (55, 75)}, 'erp_module': {'maturity': 2, 'accuracy_range': (75, 88), 'completeness_range': (70, 85)}, 'dedicated_esg_platform': {'maturity': 3, 'accuracy_range': (82, 93), 'completeness_range': (80, 93)}, 'iot_i` |
| `MATURITY_LABELS` | `{1: 'Manual', 2: 'Automated', 3: 'Integrated', 4: 'Intelligent', 5: 'Autonomous'}` |
| `MATURITY_DESCRIPTIONS` | `{1: 'Manual data collection via spreadsheets; high risk of error; no audit trail', 2: 'System-driven data capture from ERP/accounting; basic workflow; some automation', 3: 'Dedicated ESG platform with cross-system integration; workflow management; API connections', 4: 'IoT sensor integration; near r` |
| `CAPABILITY_REQUIRED_LEVEL` | `{'Data collection automation': 2, 'API connectivity to source systems': 3, 'Third-party verification workflow': 3, 'Scope 3 supplier portal': 3, 'Real-time monitoring': 4, 'IoT sensor integration': 4, 'Uncertainty quantification': 4, 'AI anomaly detection': 5, 'Satellite data integration': 5, 'Block` |
| `MATURITY_UPGRADE_COST_BAND` | `{2: (50000.0, 150000.0), 3: (150000.0, 500000.0), 4: (500000.0, 2000000.0), 5: (2000000.0, 8000000.0)}` |
| `PCAF_DQS_MAPPING` | `{1: {'label': 'Verified primary data', 'confidence': 1.0, 'description': 'Third-party verified Scope 1/2/3 data per GHG Protocol'}, 2: {'label': 'Reported primary data', 'confidence': 0.9, 'description': 'Self-reported data not independently verified'}, 3: {'label': 'Physical activity based', 'confi` |
| `SECTOR_EMISSION_FACTORS` | `{'steel': {'scope1_intensity_tco2_t': 1.85, 'eu_ets_covered': True}, 'cement': {'scope1_intensity_tco2_t': 0.64, 'eu_ets_covered': True}, 'chemicals': {'scope1_intensity_tco2_t': 0.42, 'eu_ets_covered': True}, 'oil_gas_upstream': {'scope1_intensity_tco2_boe': 0.028, 'eu_ets_covered': True}, 'power_g` |
| `IPCC_TIER_UNCERTAINTY` | `{1: {'range_pct': (20.0, 60.0), 'representative_pct': 40.0}, 2: {'range_pct': (10.0, 25.0), 'representative_pct': 17.5}, 3: {'range_pct': (3.0, 12.0), 'representative_pct': 7.5}}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `mrv_assessments`, `mrv_data_streams`, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-mrv/ref/iso14064-checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'standard', 'count'], 'n_keys': 4}`

**GET /api/v1/climate-mrv/ref/maturity-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/climate-mrv/ref/mrv-system-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count'], 'n_keys': 3}`

**GET /api/v1/climate-mrv/ref/pcaf-dqs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'source'], 'n_keys': 3}`

**GET /api/v1/climate-mrv/ref/satellite-systems** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count'], 'n_keys': 3}`

**GET /api/v1/climate-mrv/ref/sector-emission-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count'], 'n_keys': 3}`

**POST /api/v1/climate-mrv/assess-digital-maturity** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/climate-mrv/assess-mrv-system** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `climate_mrv_engine` — extracted transformation lines:**
```python
data_quality_score = round(sum(measured_dims) / len(measured_dims), 1)
overall_score = round((detectable_count / len(satellite_results)) * 100.0, 1) if satellite_results else 0.0
avg_coverage = total_coverage / n_sources if n_sources else 50.0
third_party_verified = verified_sources >= n_sources * 0.5
target_level = min(5, current_level + 2)
step_cost = round((cost_low + cost_high) / 2.0, 0)
overall_compliance_score = round(sum(_assessed) / len(_assessed), 1) if _assessed else None
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Plume-model satellite detection and persisted assessments (analytics ladder: rung 1 → 3)

**What.** A clean tier-A MRV engine (E73): five deterministic assessments (MRV system grading,
satellite coverage, PCAF data-quality, digital-MRV maturity, compliance report) — a model of the
honest-null pattern (unmeasured accuracy/completeness/timeliness return `None` with an explanatory
note, never a fabricated figure). §7.5 names the deepening targets: the satellite detection-
probability formula (`rate/threshold × 60`, capped 5–98) is a **heuristic, not a plume model** — no
wind, albedo, cloud-cover, or observation-count statistics — and facility emission rates are
order-of-magnitude class defaults; the ISO 14064-3 "levels" are an engine construct; and the
default data-source list is a demo fallback. Evolution A upgrades satellite scoring to a real
plume-detection model and persists assessments to the `mrv_assessments`/`mrv_data_streams` tables.

**How.** `score_satellite_coverage` incorporates wind speed, cloud-cover climatology and
observation-count statistics per sensor (the platform has NASA-POWER/Open-Meteo weather feeds) so
detection probability reflects real observability; assessments persist to the existing MRV tables so
maturity and data-quality trend over time (roadmap D1 write-side activation). Rung 3: calibrate the
PCAF-DQS-to-confidence weights and IPCC tier uncertainty against the published PCAF/IPCC ranges
(already cited) and validate detection probabilities against known super-emitter events.

**Prerequisites.** The engine is harness-passing; the main work is fidelity and persistence, not
endpoint repair. Preserve the honest-null discipline — new plume inputs default to null, not
fabricated weather. **Acceptance:** the §7.4 satellite worked example (75.0 coverage score at 65°N)
reproduces under the class-default rate, but adding real cloud-cover changes detection probability;
an MRV assessment persists and is retrievable; the data-quality dimensions match `/calculate-data-
quality` output.

### 9.2 Evolution B — MRV-readiness copilot with tool-called assessment (LLM tier 2)

**What.** A tool-calling analyst for sustainability/verification teams: "assess our MRV system's
verification readiness" (`/assess-mrv-system` → ISO 14064-3 level, DQS, CDP band), "what satellites
can detect our cement plant?" (`/score-satellite-coverage`), "what's our PCAF data-quality score?"
(`/calculate-data-quality`), "what's our digital-MRV maturity and upgrade roadmap?" (`/assess-
digital-maturity`), and "generate the compliance report" (`/generate-report` → ISO/EMAS/SECR/EU-ETS
blocks) — narrating the engine's real outputs and its honest nulls (an unmeasured data-quality
dimension is reported as not-measured, not zero).

**How.** Tool schemas from the 5 POST + 6 GET operations (all passing the harness); the reference
endpoints (satellite systems, ISO 14064-3 checklist, MRV system types, maturity levels, PCAF DQS,
sector emission factors) are ideal RAG grounding for "what does ISO 14064-3 §7.2 materiality
require?" questions — a tier-1 explainer over a tier-2 operator. The no-fabrication validator checks
every score, probability and cost band against tool output; the copilot presents upgrade costs as
the engine's indicative planning bands, not vendor quotes.

**Prerequisites.** Atlas + reference corpus embedded (roadmap D3); the copilot's grounding carries
the honest-null discipline so it never presents an unmeasured dimension as a computed value.
**Acceptance:** every figure cited traces to an engine tool call; the maturity level and gap analysis
match `/assess-digital-maturity`; an MRV-system query with no measured dimensions returns the
engine's honest-null with the copilot requesting the measurements, not inventing a DQS.