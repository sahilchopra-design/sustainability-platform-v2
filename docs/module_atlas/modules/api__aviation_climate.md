# Api::Aviation_Climate
**Module ID:** `api::aviation_climate` · **Route:** `/api/v1/aviation-climate` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/aviation-climate/corsia` | `corsia` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/saf-compliance` | `saf_compliance` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/ira-45z` | `ira_45z` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/eu-ets` | `eu_ets` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/iata-nzc` | `iata_nzc` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/aircraft-stranding` | `aircraft_stranding` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/full-assessment` | `full_assessment` | api/v1/routes/aviation_climate.py |
| GET | `/api/v1/aviation-climate/ref/corsia-phases` | `ref_corsia_phases` | api/v1/routes/aviation_climate.py |
| GET | `/api/v1/aviation-climate/ref/saf-mandates` | `ref_saf_mandates` | api/v1/routes/aviation_climate.py |
| GET | `/api/v1/aviation-climate/ref/aircraft-intensity` | `ref_aircraft_intensity` | api/v1/routes/aviation_climate.py |
| GET | `/api/v1/aviation-climate/ref/iata-nzc-pathway` | `ref_iata_nzc_pathway` | api/v1/routes/aviation_climate.py |

### 2.3 Engine `aviation_climate_engine` (services/aviation_climate_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AviationClimateEngine.calculate_corsia_obligation` | entity_id, icao_designator, baseline_tco2, actual_tco2, phase, eligible_routes_pct, unit_sourcing_mix |  |
| `AviationClimateEngine.assess_saf_compliance` | entity_id, total_fuel_uplift_t, saf_blended_t, year, jurisdiction |  |
| `AviationClimateEngine.calculate_ira_45z` | entity_id, saf_volume_gge, saf_pathway, lifecycle_ci |  |
| `AviationClimateEngine.assess_eu_ets_aviation` | entity_id, intra_eea_co2_t, year, eua_price_eur |  |
| `AviationClimateEngine.assess_iata_nzc` | entity_id, current_intensity, fleet_mix, saf_pct, year |  |
| `AviationClimateEngine.model_aircraft_stranding` | entity_id, fleet_data |  |
| `AviationClimateEngine.generate_full_assessment` | entity_id, operator_data |  |

**Engine `aviation_climate_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `EUA_AVIATION_PRICE` | `65.0` |
| `CORSIA_CREDIT_PRICE` | `8.5` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/aviation-climate/ref/aircraft-intensity** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/aviation-climate/ref/corsia-phases** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/aviation-climate/ref/iata-nzc-pathway** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/aviation-climate/ref/saf-mandates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/aviation-climate/aircraft-stranding** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/aviation-climate/corsia** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/aviation-climate/eu-ets** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/aviation-climate/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `aviation_climate_engine` — extracted transformation lines:**
```python
growth_tco2 = max(0.0, actual_tco2 - baseline_tco2)
eligible_growth = growth_tco2 * eligible_routes_pct / 100.0
offsetting_obligation = eligible_growth * offset_factor
offset_cost_usd = offsetting_obligation * CORSIA_CREDIT_PRICE
blend_pct = saf_blended_t / max(total_fuel_uplift_t, 1.0) * 100.0
mandate_pct = REFUELEU_SAF_MANDATES[mandate_years[-1]]
compliance_gap_pct = max(0.0, mandate_pct - blend_pct)
gap_volume_t = compliance_gap_pct / 100.0 * total_fuel_uplift_t
penalty_per_tonne_gap = 50.0 * 44.0  # EUR/tonne gap
penalty_usd = gap_volume_t * penalty_per_tonne_gap * 1.10  # EUR to USD ~1.10
reduction_pct = max(0.0, (baseline_ci - lifecycle_ci) / baseline_ci * 100.0)
total_credit_usd = saf_volume_gge * credit_per_gge if eligible else 0.0
free_allocation = intra_eea_co2_t * free_alloc_pct / 100.0
surrender_gap = max(0.0, obligation_allowances - free_allocation)
cost_eur = surrender_gap * eua_price
pathway = IATA_NZC_PATHWAY[path_years[-1]]
pathway_target_intensity = baseline_2019 * (1.0 - total_reduction_needed_pct / 100.0)
delta = current_intensity - pathway_target_intensity
alignment_score = max(0.0, min(100.0, (1.0 - delta / max(baseline_2019, 1.0)) * 100.0))
efficiency_gap = max(0.0, current_intensity - efficiency_target)
offset_gap = max(0.0, delta - efficiency_gap - saf_gap * 0.5)
age = 2025 - build_year
years_to_stranding = max(0, stranding_year - 2025)
remaining_life_yrs = max(0, 25 - age)
residual_value = asset_value_usd * (remaining_life_yrs - years_to_stranding) / max(25.0, 1.0) * n_aircraft
avg_age = sum(ages) / len(ages) if ages else 0.0
high_emission_pct = high_emission_count / max(total_aircraft, 1) * 100.0
saf_pct = saf_t / max(total_fuel_t, 1.0) * 100.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Grounded in `backend/services/aviation_climate_engine.py` (pure computation, no DB calls) exposed
via `api/v1/routes/aviation_climate.py`. Seven sub-models cover the full aviation-decarbonisation
stack: CORSIA offsetting, ReFuelEU SAF blending, US IRA §45Z SAF credits, EU ETS aviation,
IATA Net Zero 2050 alignment, aircraft asset stranding, and a consolidated operator assessment.

### 7.1 What the domain computes

| Sub-model | Core formula (quoted from code) |
|---|---|
| CORSIA obligation | `growth = max(0, actual_tco2 − baseline_tco2)`; `obligation = growth × eligible_routes_pct/100 × offset_factor`; `cost = obligation × 8.5 $/t` |
| SAF compliance | `blend% = saf_t / max(fuel_t, 1) × 100`; `gap% = max(0, mandate% − blend%)`; `penalty = gap_t × (50 €/GJ × 44 GJ/t) × 1.10 €→$` |
| IRA 45Z credit | `reduction% = (89.16 − lifecycle_CI)/89.16 × 100`; tiered `credit_per_gge` × volume if reduction ≥ 50% |
| EU ETS aviation | `free_alloc = CO2 × free%`; `surrender_gap = max(0, CO2 − free_alloc)`; `cost = gap × EUA price` |
| IATA NZC alignment | `target = 95 × (1 − Σ pathway levers %/100)`; `score = clamp((1 − (current − target)/95) × 100, 0, 100)` |
| Aircraft stranding | straight-line residual value at type-specific stranding year, summed over fleet |
| Full assessment | weighted 4-pillar compliance score (§7.3) + total cost exposure |

### 7.2 Parameterisation

**CORSIA phases** (ICAO Annex 16 Vol IV SARPs, cited in module docstring):

| Phase | Years | Offset factor | Mandatory | Eligible units |
|---|---|---|---|---|
| phase_1 | 2021–2023 | 0.00 (voluntary pilot) | No | VCS, GS, ACR, CAR, CDM |
| phase_2 | 2024–2026 | 0.85 | Yes (G20+ states) | + REDD+, ARB, SOCIALCARBON |
| phase_3 | 2027–2035 | 1.00 | Yes (all ICAO, excl. exemptions) | + CDM_CER |

Baseline year 2019 for all phases. CORSIA credit price constant: **$8.5/tCO₂**; EUA aviation
reference price: **€65/t** (both module-level published-market reference constants; the ETS
endpoint accepts a caller-supplied `eua_price_eur` override).

**ReFuelEU SAF mandates** (Regulation (EU) 2023/2405): 2025 → 2.0%, 2030 → 6.0%, 2035 → 20.0%,
2040 → 34.0%, 2045 → 42.0%, 2050 → 70.0%. Lookup takes the first mandate year ≥ assessment year.
Non-EU jurisdictions get `mandate = 0` ("No universal global mandate yet").

**IRA 45Z tiers** (26 USC §45Z; baseline CI 89.16 gCO₂e/MJ):

| Tier | Max lifecycle CI (gCO₂e/MJ) | Credit ($/GGE) |
|---|---|---|
| 50% reduction | 44.58 | 1.25 |
| 60% reduction | 35.66 | 1.50 |
| 80% reduction | 17.83 | 1.75 |
| 100% reduction | 0.0 | 1.75 (capped) |

**EU ETS aviation free-allocation phase-out** (Dir. 2003/87/EC as amended by EU 2023/958):
2024–25 → 85%, 2026 → 75%, 2027 → 50%, 2028 → 25%, 2029+ → 0% (intra-EEA scope only).

**IATA NZ2050 pathway levers** (% of 2019-baseline abatement, per IATA roadmap):

| Year | Efficiency | SAF | Removals | Offsets | Σ |
|---|---|---|---|---|---|
| 2030 | 3% | 5% | 0% | 3% | 11% |
| 2040 | 6% | 28% | 2% | 4% | 40% |
| 2050 | 13% | 65% | 10% | 19% | 107% (target floored at 1 gCO₂/pkm) |

**Aircraft reference tables** (labelled "ICAO 2023" for intensity): CO₂ intensity 60 (A350) to
120 gCO₂/pkm (B747 classic); NZ2050 stranding years 2028 (B747 classic) to 2038 (old turboprop).
SAF pathway cost premiums ($/t over Jet A-1): co-processing 600 · HEFA 800 · AtJ 1,200 · DSHC
1,500 · Fischer-Tropsch 1,800 · PtL 2,500. Ref-data GET endpoints expose these tables verbatim.

### 7.3 Calculation walkthrough

- **CORSIA:** only *growth above the 2019 baseline* is offsettable — the sectoral-growth design of
  CORSIA. Per-scheme allocation is honest-null: with no operator `unit_sourcing_mix` the engine
  reports `unallocated_tco2` + `insufficient_data` note rather than fabricating a split; with a
  mix, tonnes are pro-rated across only the phase-approved schemes.
- **SAF penalty:** ReFuelEU Art. 12 fines are "at least twice" the SAF–kerosene price gap; the code
  simplifies to a flat 50 €/GJ × 44 GJ/t ≈ **€2,200 per tonne of SAF shortfall**, converted at 1.10.
- **IATA score:** the alignment score is linear in the intensity shortfall against the pathway
  target, normalised by the 95 gCO₂/pkm 2019 baseline. `overall_aligned = score ≥ 75`. Companion
  gaps: `saf_gap = pathway SAF% − actual SAF%`; `efficiency_gap = current − 95×(1−eff%)`;
  `offset_gap = max(0, delta − efficiency_gap − 0.5×saf_gap)` (residual heuristic).
- **Stranding:** `residual = value × (max(0, 25 − age) − years_to_stranding)/25 × count`, floored
  at 0 — i.e. book value the operator would still carry at the stranding date under a 25-year
  straight-line life, evaluated from a hard-coded 2025 "today". `high_emission_pct` counts types
  with intensity > 95 gCO₂/pkm.
- **Full assessment:** `overall_compliance_score = 0.25×(100 if CORSIA obligation = 0 else 60)
  + 0.25×(100 if SAF compliant else 40) + 0.25×IATA score + 0.25×(100 if ETS gap = 0 else 50)`.
  Total cost exposure = CORSIA cost + SAF penalty + ETS cost×1.10 (all USD). IRA 45Z runs only if
  the operator supplies a certified `lifecycle_ci` (honest-null otherwise); SAF tonnes convert to
  GGE at `t × 1000 / 2.84` kg/GGE.

### 7.4 Worked example (default full-assessment operator, 2025)

Defaults: baseline 500,000 t; actual 550,000 t; fuel 200,000 t; SAF 4,000 t; intra-EEA 120,000 t;
intensity 78 gCO₂/pkm.

| Step | Computation | Result |
|---|---|---|
| CORSIA growth | 550,000 − 500,000 | 50,000 t |
| Obligation (phase 2) | 50,000 × 1.00 × 0.85 | **42,500 t** |
| Offset cost | 42,500 × $8.5 | **$361,250** |
| SAF blend | 4,000/200,000 | 2.0% = 2025 mandate → **compliant**, penalty $0 |
| EU ETS free alloc (2025) | 120,000 × 85% | 102,000 EUA |
| Surrender gap | 120,000 − 102,000 | 18,000 EUA |
| ETS cost | 18,000 × €65 | **€1,170,000** |
| IATA target (2030) | 95 × (1 − 0.11) | 84.55 gCO₂/pkm |
| Alignment score | (1 − (78 − 84.55)/95) × 100, clamped | 106.9 → **100.0**, aligned |
| Compliance score | 0.25×60 + 0.25×100 + 0.25×100 + 0.25×50 | **77.5** |
| Total cost exposure | 361,250 + 0 + 1,170,000×1.10 | **$1,648,250** |

### 7.5 Data provenance & limitations

- **No synthetic PRNG data** — the engine is deterministic in caller inputs; the only embedded
  data are regulatory reference tables (offset factors, mandates, phase-out schedules) and two
  price constants which are point-in-time snapshots (EUA €65, CORSIA $8.5), not live feeds.
- CORSIA is simplified: real CORSIA uses a *sectoral* growth factor (share of global sector growth
  attributed to each operator, transitioning to individual growth) — here growth is purely
  operator-own vs 2019.
- ReFuelEU penalty is a flat 50 €/GJ heuristic; the regulation's Art. 12 formula (≥2× price gap,
  set by member states) is not reproduced. EUR→USD fixed at 1.10.
- IATA "gap" decomposition (esp. `offset_gap` with the 0.5×SAF haircut) is a heuristic residual,
  not from the IATA roadmap. 2050 lever sum >100% means the 2050 target floors at 1 gCO₂/pkm.
- Stranding years per type are scenario assumptions (no citation in code); valuation ignores
  discounting, part-out/freighter-conversion value, and uses fixed 2025 valuation date.
- Fleet-level defaults in `generate_full_assessment` are demo conveniences; production calls
  should supply full operator data.

### 7.6 Framework alignment

- **ICAO CORSIA (Annex 16 Vol IV)** — real CORSIA computes offsetting requirements as
  `operator emissions × growth factor` on international routes between participating states,
  phased voluntary→mandatory; the module implements the phase structure, 2019 baseline, and
  85%/100% factors, approximating the growth factor with operator-own growth.
- **ReFuelEU Aviation (EU) 2023/2405** — blending mandate trajectory reproduced exactly;
  penalty regime simplified.
- **US IRA §45Z (Clean Fuel Production Credit)** — real 45Z scales the credit by an emissions
  factor `(50 − CI×?)/50`-type formula with prevailing-wage multipliers; the module approximates
  with four discrete CI tiers capped at $1.75/gal.
- **EU ETS aviation chapter (2023/958)** — free-allocation phase-out to full auctioning by 2026
  in law is here stretched to 2029; scope correctly intra-EEA.
- **IATA Net Zero 2050 roadmap** — lever shares (efficiency/SAF/removals/offsets) mirror IATA's
  published waterfall; alignment scoring itself is a platform construct.
- **TCFD / ISSB transition-risk lens** — the stranding sub-model is a transition-scenario
  stranded-asset estimate consistent with TCFD's "stranded asset" metric concept, not a formal
  standard calculation.

## 9 · Future Evolution

### 9.1 Evolution A — Live carbon prices, sectoral CORSIA growth, and real §45Z formula (analytics ladder: rung 1 → 3)

**What.** A clean tier-A domain: seven deterministic sub-models (CORSIA offsetting, ReFuelEU SAF
blending, IRA §45Z credits, EU ETS aviation, IATA NZ2050 alignment, aircraft stranding, full
assessment) with regulatory reference tables faithfully encoded and honest-null handling (no
`unit_sourcing_mix` → `unallocated_tco2` + `insufficient_data`, not a fabricated split). §7.5
documents the simplifications to lift: the two price constants (EUA €65, CORSIA $8.5) are
point-in-time snapshots not live feeds; CORSIA uses operator-own growth vs 2019 rather than the
real *sectoral* growth factor; the ReFuelEU penalty is a flat 50 €/GJ heuristic; §45Z is four
discrete CI tiers rather than the continuous emissions-factor formula; and EUR→USD is fixed at
1.10. Evolution A wires live carbon/EUA prices, implements the sectoral CORSIA growth factor and
the continuous §45Z formula, and adds a live FX rate.

**How.** Price constants become inputs sourced from a market-data ingester (the platform already
wires EIA/ENTSO-E-style feeds); `calculate_corsia_obligation` gains the sectoral-vs-individual
growth blend the scheme actually phases in; `calculate_ira_45z` implements the continuous
`(50 − CI)/50`-style credit with prevailing-wage multipliers. Rung 3: calibrate the aircraft
stranding years (currently uncited scenario assumptions) and SAF-pathway cost premiums against
published fleet-transition and BNEF SAF data.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `POST /full-assessment`
**failed** and `/corsia`, `/eu-ets`, `/aircraft-stranding` **skipped**; the fixed 2025 valuation
date in stranding should be parameterised. **Acceptance:** the §7.4 worked example ($1,648,250 total
exposure) reproduces at legacy price constants; changing the live EUA price moves the ETS cost;
CORSIA obligation reflects sectoral growth; the failing POST endpoints pass the harness.

### 9.2 Evolution B — Aviation-decarbonisation analyst with tool-called assessment (LLM tier 2)

**What.** A tool-calling analyst for airline sustainability and aviation-finance teams: "what's our
CORSIA offsetting cost this year?" (calls `/corsia`), "are we ReFuelEU-compliant and what's the
penalty exposure?" (`/saf-compliance`), "value our §45Z SAF credits" (`/ira-45z`), "model stranding
risk for our A320 fleet" (`/aircraft-stranding`), and "give me the full compliance score" (`/full-
assessment`) — narrating the engine's real deterministic outputs across the whole aviation-
decarbonisation stack.

**How.** Tool schemas from the 7 POST + 4 GET operations; the four `ref/*` endpoints (CORSIA
phases, SAF mandates, aircraft intensity, IATA pathway) are ideal RAG grounding for "what's the
2035 ReFuelEU mandate?" questions — a tier-1 explainer over a tier-2 operator. The no-fabrication
validator checks every tonne, dollar and score against tool output; the honest-null design (§45Z
runs only with a certified `lifecycle_ci`) means the copilot must ask for missing certified inputs
rather than assume them.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas + `ref/*`
corpus embedded (roadmap D3). **Acceptance:** every numeric in an answer traces to an engine tool
call; the compliance score cited matches `/full-assessment` exactly; a §45Z query without lifecycle
CI returns the engine's honest-null with the copilot requesting the certified figure, not inventing
one.