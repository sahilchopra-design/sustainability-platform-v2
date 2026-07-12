# Api::Methane_Fugitive
**Module ID:** `api::methane_fugitive` · **Route:** `/api/v1/methane-fugitive` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/methane-fugitive/gwp-impact` | `gwp_impact_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/eu-regulation` | `eu_regulation_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/ogmp-level` | `ogmp_level_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/super-emitters` | `super_emitters_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/abatement-curve` | `abatement_curve_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/ldar-compliance` | `ldar_compliance_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/methane-intensity` | `methane_intensity_endpoint` | api/v1/routes/methane_fugitive.py |
| GET | `/api/v1/methane-fugitive/ref/gwp-values` | `get_gwp_values` | api/v1/routes/methane_fugitive.py |
| GET | `/api/v1/methane-fugitive/ref/ogmp-levels` | `get_ogmp_levels` | api/v1/routes/methane_fugitive.py |
| GET | `/api/v1/methane-fugitive/ref/eu-methane-timeline` | `get_eu_methane_timeline` | api/v1/routes/methane_fugitive.py |

### 2.3 Engine `methane_fugitive_engine` (services/methane_fugitive_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | val, lo, hi |  |
| `_round` | val, digits |  |
| `_days_since` | date_str |  |
| `calculate_methane_gwp_impact` | entity_id, ch4_kt_pa, n2o_kt_pa |  |
| `assess_eu_methane_regulation` | entity_id, sector, ch4_emissions_t_pa, country_code, compliance_attestations, emissions_allowance_t_pa | Compliance requirement statuses are FACTS about the entity and cannot be inferred deterministically from sector/emissions alone. Supply ``compliance_attestations`` (a dict of requirement_key -> bool) to score real attested status; requirements not attested are reported as None ("insufficient_data") and excluded from the compliance score. ``penalty_risk_eur`` is only computed when ``emissions_allow |
| `assess_ogmp_level` | entity_id, measurement_approach, source_level_data, third_party_verified, company_level_data |  |
| `detect_super_emitters` | entity_id, facilities | A facility's CH4 emission rate is a measured ENTITY metric. Facilities that do not supply ``ch4_t_pa`` are reported with null metrics and data_status="insufficient_data" rather than having a value fabricated; they are excluded from super-emitter totals and counts. |
| `calculate_methane_abatement_curve` | entity_id, sector, total_ch4_kt_pa, methane_commodity_value_usd_per_t, carbon_price_usd_per_tco2e | Per-measure cost and abatement potential come from the published IEA MACC ranges in ABATEMENT_MEASURES (documented model calibration — the range midpoint is used, no random jitter). Recovered-commodity revenue and carbon value depend on live market prices, which are ENTITY/market inputs and are NOT fabricated. Supply ``methane_commodity_value_usd_per_t`` and/or ``carbon_price_usd_per_tco2e`` to co |
| `assess_ldar_compliance` | entity_id, facility_count, last_inspection_date, leak_detection_method |  |
| `compute_methane_intensity` | entity_id, sector, production_volume, production_unit, ch4_emissions_t_pa |  |

**Engine `methane_fugitive_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `GWP_100_CH4` | `29.8` |
| `GWP_100_N2O` | `273.0` |
| `GWP_20_CH4` | `82.5` |
| `GWP_20_N2O` | `273.0` |
| `SUPER_EMITTER_THRESHOLD_T_PA` | `100.0` |
| `SUPER_EMITTER_RATE_KG_HR` | `10.0` |
| `IMEO_SATELLITE_THRESHOLD_T_HR` | `25.0` |
| `EU_VENTING_PROHIBITION` | `{'oil_gas': 2025, 'coal': 2027, 'coalmine_methane': 2027}` |
| `OGMP_LEVEL_DESCRIPTIONS` | `{1: 'Company-level mass balance (emission factors, lowest accuracy)', 2: 'Source-level estimates using emission factors (no direct measurement)', 3: 'Source-level measurement for some significant sources (partial direct)', 4: 'Source-level measurement for all significant sources (no third-party)', 5` |
| `SECTOR_INTENSITY_BENCHMARKS` | `{'oil': (0.08, 'm3_CH4_per_boe', 'IEA best-in-class 2023'), 'gas': (0.1, 'pct_of_gas_produced', 'UNEP Global Methane Pledge target 0.2%'), 'coal': (5.5, 'm3_CH4_per_tonne_coal', 'IEA best-in-class 2023'), 'oil_gas': (0.09, 'm3_CH4_per_boe', 'IEA blended benchmark'), 'upstream': (0.12, 'pct_of_gas_pr` |
| `ABATEMENT_MEASURES` | `[{'measure': 'Flare capture (negative cost)', 'cost_lo': -20, 'cost_hi': 0, 'potential_pct': 8, 'payback_yrs': 1.5, 'sector': ['oil_gas', 'upstream']}, {'measure': 'LDAR programmes', 'cost_lo': -5, 'cost_hi': 20, 'potential_pct': 20, 'payback_yrs': 2.5, 'sector': ['oil_gas', 'gas', 'upstream', 'mids` |
| `DETECTION_METHOD_LEAK_RATES` | `{'ogi': 0.3, 'avo': 1.5, 'portable_analyzer': 0.8, 'continuous_monitoring': 0.15, 'drone_ogi': 0.2, 'satellite': 0.5}` |
| `EU_METHANE_COMPLIANCE_TIMELINE` | `{2024: 'EU Methane Regulation 2024/1787 entered into force', 2025: 'EMTS reporting mandatory; routine venting prohibited (oil/gas)', 2026: 'OGMP Level 3 minimum required', 2027: 'Routine venting prohibited (coal); LDAR quarterly for major equipment', 2028: 'OGMP Level 4 minimum required', 2030: 'Sup` |
| `PENALTY_PER_T_EUR` | `250.0` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `entry`, `fastapi` *(shared)*, `force` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/methane-fugitive/ref/eu-methane-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'official_title', 'scope', 'key_provisions', 'timeline', 'external_suppliers'], 'n_keys': 6}`

**GET /api/v1/methane-fugitive/ref/gwp-values** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'gwp_timeframes', 'notes'], 'n_keys': 3}`

**GET /api/v1/methane-fugitive/ref/ogmp-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'administrator', 'eu_requirements', 'levels'], 'n_keys': 4}`

**POST /api/v1/methane-fugitive/abatement-curve** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/methane-fugitive/eu-regulation** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/methane-fugitive/gwp-impact** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/methane-fugitive/ldar-compliance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/methane-fugitive/methane-intensity** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `methane_fugitive_engine` — extracted transformation lines:**
```python
ch4_gwp100 = ch4_kt_pa * GWP_100_CH4  # kt CO2e
ch4_gwp20 = ch4_kt_pa * GWP_20_CH4
n2o_gwp100 = n2o_kt_pa * GWP_100_N2O
n2o_gwp20 = n2o_kt_pa * GWP_20_N2O
total_gwp100 = ch4_gwp100 + n2o_gwp100  # kt CO2e
total_gwp20 = ch4_gwp20 + n2o_gwp20
short_term_ratio = _round(total_gwp20 / total_gwp100, 3) if total_gwp100 > 0 else 1.0
significance_flag = (total_gwp20 * 1000) >= GHG_SIGNIFICANT_SOURCE_THRESHOLD_T_CO2E_PA
excess_t = max(0.0, ch4_emissions_t_pa - emissions_allowance_t_pa)
gap_to_eu_min = max(0, eu_min_2026 - current_level)
ch4_kg_hr = ch4_t_pa * 1000 / 8760
satellite_detectable = ch4_kg_hr > (IMEO_SATELLITE_THRESHOLD_T_HR * 1000 / 1)  # >25 t/hr
satellite_prob = _round(min(0.95, ch4_kg_hr / (IMEO_SATELLITE_THRESHOLD_T_HR * 1000) * 0.8), 3)
total_ch4_t = total_ch4_kt_pa * 1000
capex = max(0.0, cost_per_t * potential_t)
revenue = (methane_commodity_value_usd_per_t * potential_t) if have_methane_price else None
zero_cost_pct = _round(zero_cost_t / total_ch4_t * 100, 1) if total_ch4_t > 0 else 0.0
total_potential_pct = _round(min(75.0, total_potential_t / total_ch4_t * 100), 1) if total_ch4_t > 0 else 0.0
overdue_inspections = max(0, int(days_since / required_freq_days) - 1)
next_due = last + timedelta(days=required_freq_days)
next_due = date.today() + timedelta(days=30)
intensity_current = _round(ch4_emissions_t_pa / production_volume, 6)
intensity_target = 0.002 * production_volume / max(ch4_emissions_t_pa, 1)  # 0.2% UNEP target proxy
gap_to_benchmark = _round(intensity_current - intensity_benchmark, 6)
abatement_to_benchmark_t = _round(max(0.0, (intensity_current - intensity_benchmark) * production_volume), 2)
abatement_to_target_t = _round(max(0.0, ch4_emissions_t_pa - production_volume * target_intensity_unep), 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine header ("E58: Methane & Fugitive Emissions Engine") is the methodology narrative; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/methane_fugitive_engine.py` implements seven function-level sub-modules, five of which are wired through `api/v1/routes/methane_fugitive.py` (`POST /gwp-impact`, `/eu-regulation`, `/methane-intensity`, `/abatement-curve`, `/ldar-compliance`; `GET /ref/{gwp-values, ogmp-levels, eu-methane-timeline}`):

1. **GWP impact** — CH₄/N₂O tonnage → CO₂e under GWP-100 vs GWP-20.
2. **EU Methane Regulation 2024/1787 assessment** — scope, LDAR frequency, venting/flaring status, attestation-based compliance score, €250/t excess-emission penalty risk.
3. **OGMP 2.0 level assessment** — current level 1–5, gap to EU minimums (L3 by 2026, L4 by 2028), uplift actions.
4. **Super-emitter detection** — per-facility flags vs UNEP IMEO thresholds, remediation priorities.
5. **Methane abatement curve** — sector-filtered MACC with capex, commodity-recovery and carbon-value economics.
6. **LDAR compliance** — inspection cadence vs EPA OOOOa/OOOOb quarterly rule, detection-method adequacy.
7. **Methane intensity** — intensity vs sector benchmark and the 0.2% UNEP/Global-Methane-Pledge target.

### 7.2 Parameterisation

**GWP values** (cited in-code to IPCC AR6 WG1 Table 7.SM.7 — these are the AR6 fossil-CH₄ values): GWP-100 CH₄ = 29.8, N₂O = 273; GWP-20 CH₄ = 82.5, N₂O ≈ 273.

**Thresholds & constants:** super-emitter > 100 t CH₄/event **or** > 10 kg/hr continuous; IMEO satellite detectability 25 t/hr; EU penalty €250/t excess methane; venting prohibition years oil_gas 2025, coal 2027; EU OGMP minimums L3 (2026), L4 (2028); LDAR required frequency 90 days ("quarterly as conservative default", EPA OOOOa/OOOOb).

**Sector intensity benchmarks** (with in-code source strings): oil 0.08 m³CH₄/boe ("IEA best-in-class 2023"), gas 0.10% of gas produced ("UNEP Global Methane Pledge target 0.2%"), coal 5.5 m³CH₄/t, oil_gas 0.09, upstream 0.12%, midstream 0.08%; unknown sector → (0.15, "fraction", "IEA 2023").

**Abatement measures** (8-row MACC, "published IEA MACC ranges" per docstring — cost $/tCH₄ lo–hi, potential % of total CH₄, payback yrs): flare capture −20–0 / 8% / 1.5y · LDAR −5–20 / 20% / 2.5y · pneumatic replacement 0–10 / 15% / 3y · compressor seals 10–30 / 12% / 4.5y · venting reduction 5–15 / 18% / 3.5y · pipeline repair 15–45 / 10% / 6y · coal-mine recovery 5–25 / 22% / 4y · pre-drainage 20–50 / 15% / 5.5y. **Detection-method leak rates:** continuous monitoring 0.15%, drone-OGI 0.2%, OGI 0.3%, satellite 0.5%, portable 0.8%, AVO 1.5%.

### 7.3 Calculation walkthrough

**GWP:** `kt CO₂e = kt gas × GWP`; `short_term_ratio = GWP20_total / GWP100_total` (≈ 2.77 for pure CH₄). *(The `significance_flag` compares GWP-20 to 10% of GWP-100 — always true for any CH₄ > 0, so it is effectively a constant.)*

**EU regulation:** scope = sector in {oil, gas, coal, up/mid/downstream} or substring match. Per docstring, operational compliance is "FACTS about the entity" — statuses come from caller `compliance_attestations`; unattested items are `None`/insufficient_data and **excluded** from `compliance_score = met/assessed × 100`. Venting is auto-`True` only while the prohibition year is in the future. Penalty = `max(0, emissions − allowance) × €250`, only when an allowance is supplied.

**OGMP:** decision ladder — third-party-verified + source-level → L5; source-level + direct measurement → L4; partial → L3; source-level only → L2; else L1. Gap and uplift actions derive from EU minimums.

**Super-emitters:** `kg/hr = t_pa × 1000 / 8760`; facilities without `ch4_t_pa` get null metrics (never invented). Portfolio `satellite_detection_probability = 1 − Π(1 − pᵢ)` over measured facilities, with per-facility `p = min(0.95, kg_hr / 25,000 × 0.8)`. Regulatory risk bands on super-emitter CH₄ total: > 1000 t Critical, > 200 High, > 50 Medium. *(Note: the per-facility `satellite_detectable` compares kg/hr to 25,000 kg/hr — i.e. 25 t/hr as coded — an extremely high bar; nearly all annualised facilities are below it.)*

**Abatement curve:** cost per measure = range **midpoint** (docstring: "no random jitter"); `potential_t = total_CH₄ × potential% `; capex = max(0, cost × potential); revenue/carbon value only with caller-supplied prices (`carbon_value = potential_t × 29.8 × carbon_price`, reported ÷1000); total potential capped at 75%; zero-cost share = potential from measures with midpoint cost ≤ 0.

**LDAR:** `overdue = max(0, ⌊days_since/90⌋ − 1)`; adequate methods = {OGI, drone-OGI, continuous}; status Compliant / Partially Compliant / Non-Compliant.

**Intensity:** `intensity = CH₄_t / production`; performance tiers vs benchmark: ≤ benchmark Best-in-Class; gap < 0.5× Above Average; < 1× Average; < 2× Below Average; else Laggard. `abatement_to_target = max(0, CH₄ − production × 0.002)` (UNEP 0.2% target).

### 7.4 Worked example — abatement curve, upstream operator, 12 kt CH₄/yr, carbon price $80/tCO₂e

Total CH₄ = 12,000 t. Sector `upstream` matches four measures:

| Measure | Cost mid ($/t) | Potential (t) | Capex ($) | Carbon value ($) |
|---|---|---|---|---|
| Flare capture | −10 | 960 | 0 | 960 × 29.8 × 80 / 1000 ≈ **2,289k** |
| LDAR | 7.5 | 2,400 | 18,000 | ≈ 5,722k |
| Pneumatic replacement | 5 | 1,800 | 9,000 | ≈ 4,291k |
| Venting reduction | 10 | 2,160 | 21,600 | ≈ 5,149k |

Totals: potential 7,320 t = 61% of emissions (< 75% cap); capex $48,600; zero-cost share 8% (flare capture only); carbon value ≈ $17.45M → `net_cost ≈ −$17.4M` (deeply NPV-positive at $80/t) and payback ≈ 48,600 / 17.45M ≈ **0.0 yrs**. GWP cross-check: 12 kt CH₄ = 357.6 kt CO₂e (GWP-100) vs 990 kt CO₂e (GWP-20), short-term ratio 2.768.

### 7.5 Data provenance & limitations

- **No PRNG** — the engine is explicitly refactored to remove jitter ("range midpoint is used, no random jitter") and refuses to fabricate entity facts (attestations, facility measurements, market prices → `insufficient_data`).
- GWP constants are genuine AR6 values; thresholds (100 t / 10 kg-hr super-emitter, €250/t penalty, L3/L4 timeline) are stated as EU-Methane-Regulation-derived but are simplified single numbers for a regulation whose implementing acts are still being finalised — treat the timeline map as indicative.
- Known code quirks a reader should not mistake for methodology: the GWP `significance_flag` is tautological; `satellite_detectable` uses a 25 t/hr bar expressed in kg/hr that annualised facility totals essentially never reach; `intensity_target`/`gap_to_target_pct` mix units (0.2% is a share of *gas produced*, applied here to arbitrary production units); abatement `payback` divides capex by carbon value + 1 rather than by annual net savings.
- MACC costs/potentials are IEA-style ranges but embedded, not live IEA Methane Tracker data; measure potentials are additive shares of total CH₄ (no interaction effects), hence the 75% cap.
- LDAR uses a single 90-day cadence; real OOOOb frequencies vary by facility type and emissions.

### 7.6 Framework alignment

- **EU Methane Regulation 2024/1787:** in-scope-sector definition, EMTS-style reporting, LDAR (Arts 14–18 cited), routine venting/flaring prohibitions with the 2025/2027 dates, super-emitter notification (Art. 19 cited) and an excess-emissions penalty mechanism — the module encodes each as a checkable requirement; the €250/t figure is a platform parameter (the regulation leaves penalties to member states).
- **OGMP 2.0 (UNEP):** the real framework's 5 reporting levels — from company-level emission factors (L1) up to source-level measurement reconciled with site-level measurement and third-party verification (L5) — are reproduced in `OGMP_LEVEL_DESCRIPTIONS` and drive the ladder logic.
- **IPCC AR6 WG1:** GWP-100/GWP-20 characterisation factors, correctly showing methane's ~2.8× near-term forcing multiple.
- **EPA 40 CFR 60 OOOOa/OOOOb:** quarterly OGI-based LDAR as the US benchmark cadence.
- **UNEP IMEO / IEA Methane Tracker / Global Methane Pledge:** satellite detection thresholds, best-in-class intensity benchmarks, and the 0.2%-of-production intensity target used as the abatement goalpost.

## 9 · Future Evolution

### 9.1 Evolution A — Satellite-grounded super-emitter detection and prescriptive MACC (analytics ladder: rung 2 → 5)

**What.** The E58 engine implements seven methane sub-modules: GWP-100 vs GWP-20 impact,
EU Methane Regulation 2024/1787 compliance (€250/t excess penalty), OGMP 2.0 level gaps,
super-emitter detection vs UNEP IMEO thresholds (`satellite_detectable = ch4_kg_hr >
25 t/hr`), a sector-filtered abatement curve with commodity-recovery economics, and LDAR
inspection cadence. It's strong scenario/economic work but the super-emitter detection is
a threshold rule on self-reported tonnage, and the MACC ranks abatement without
optimising a budget. Evolution A grounds detection in observations and makes the curve
prescriptive.

**How.** (1) Wire super-emitter detection to real satellite observation feeds (UNEP IMEO
/ TROPOMI plume data) so `satellite_detectable` reflects actual detections against a
facility, not just a computed probability from reported emissions. (2) Turn the abatement
curve into a prescriptive optimiser (rung 5): given a capex budget and the
`methane_commodity_value` recovery credit, select the abatement portfolio maximising
tonnes-abated subject to budget — scipy optimisation, the roadmap's named first-mover
pattern for MACC engines. (3) Bench-pin GWP impact, EU penalty, and the MACC selection.

**Prerequisites.** Satellite plume feed integration (external data — the IMEO threshold
logic exists but no live feed is wired); a facility-to-observation matching key.
**Acceptance:** super-emitter flags cite an observation source when available (falling
back to the computed probability with a tier label); `/abatement-curve` returns an
optimal budget-constrained portfolio, not just a sorted list; bench pins pass.

### 9.2 Evolution B — Methane compliance and abatement copilot (LLM tier 2)

**What.** A copilot for oil-and-gas operators: "are we OGMP L3-compliant by the 2026 EU
minimum, and what's our penalty exposure?" (calling `/ogmp-level` and `/eu-regulation`),
and "what's the cheapest way to cut our methane intensity to the 0.2% target?" (calling
`/abatement-curve` and narrating the zero-cost vs paid measures).

**How.** Five computational POST endpoints plus three reference GETs (GWP values, OGMP
levels, EU methane timeline) that ground every regulatory threshold and date. The engine's
rich economic outputs (capex, commodity revenue, zero-cost %) let the copilot build a
credible abatement narrative. What-ifs ("if gas price rises, how much abatement turns
cash-positive?") re-run statelessly. Natural node for an energy-desk emissions review.

**Prerequisites.** Several POST endpoints trace `skipped` in §4.2 under the harness —
confirm callable before wiring. **Acceptance:** every tonnage, penalty, and abatement
figure traces to a tool response; compliance-date claims cite the `/ref/eu-methane-timeline`
endpoint; the copilot labels abatement recommendations as pre-optimisation ranked (not
budget-optimal) until Evolution A ships the optimiser, and refuses to assert regulatory
compliance beyond the computed score.