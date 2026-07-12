# Api::Re_Clvar
**Module ID:** `api::re_clvar` · **Route:** `/api/v1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/re/clvar/calculate` | `calculate_re_clvar` | api/v1/routes/re_clvar.py |
| POST | `/api/v1/re/crrem/stranding` | `assess_crrem_stranding` | api/v1/routes/re_clvar.py |
| POST | `/api/v1/re/crrem/roadmap` | `generate_crrem_roadmap` | api/v1/routes/re_clvar.py |
| POST | `/api/v1/re/clvar/portfolio` | `calculate_portfolio_clvar` | api/v1/routes/re_clvar.py |
| GET | `/api/v1/re/crrem/pathways/{property_type}/{country_iso}` | `get_crrem_pathways` | api/v1/routes/re_clvar.py |

### 2.3 Engine `crrem_stranding_engine` (services/crrem_stranding_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CRREMStrandingEngine.get_pathway_intensity` | property_type, country_iso, scenario, year | Get CRREM pathway energy intensity for a given asset type, country, scenario and year. Uses linear interpolation between known data points. Args: property_type: "office", "retail", "industrial", or "multifamily" country_iso: ISO 3166-1 alpha-2 country code e.g. "GB", "DE", "US" scenario: "1.5C" or "2C" year: Target year (2020-2050) Returns: Decimal: Energy intensity in kWh/m2/yr (the CRREM pathway |
| `CRREMStrandingEngine.calculate_pathway_trajectory` | property_type, country_iso, scenario, start_year, end_year | Generate year-by-year CRREM pathway trajectory from start_year to end_year. Returns a list of dicts, one per year, with: - year: calendar year - pathway_kwh_m2: CRREM pathway threshold (kWh/m2/yr) - annual_reduction_vs_prev_year_pct: % reduction from prior year target |
| `CRREMStrandingEngine.assess_stranding` | profile, scenario | Assess stranding risk for an asset against the CRREM pathway. Algorithm: 1. Get current CRREM pathway threshold for the asset type, country, and current year. 2. If asset already exceeds pathway: is_already_stranded = True, stranding_year = current year. 3. Project asset energy intensity forward assuming no improvement (conservative baseline). 4. Find the year when the CRREM pathway descends below |
| `CRREMStrandingEngine.generate_decarbonisation_roadmap` | profile, target_scenario | Generate year-by-year decarbonisation action plan from current year to 2050. For each year: - CRREM pathway energy intensity target (kWh/m2/yr) - Asset vs pathway gap and compliance status - Recommended intervention type (deep_retrofit, medium_retrofit, light_refurbishment, operational_measures, maintain_compliance) - Estimated intervention cost per m2 and total - Major intervention trigger years: |
| `CRREMStrandingEngine.compare_scenarios` | profile | Compare stranding results across four CRREM-aligned scenarios. Scenarios: - 1.5C: IPCC SSP1-1.9 / IEA NZE 2050 steepest decarbonisation - 2C: IPCC SSP1-2.6 / IEA SDS - 2.5C: NDC-consistent pathway (scaled from 2C CRREM data) - 3C: Current policy trajectory (extrapolated from CRREM) Returns dict with stranding year, gap, urgency, and retrofit cost per scenario. |
| `CRREMStrandingEngine.build_validation_summary` | profile, result_data | Build a complete audit trail for CRREM stranding analysis. Includes methodology, input parameters, output summary, data quality ratings, and compliance statement for RICS VPS4 / IVS 2024 / TCFD disclosure. |
| `assess_asset_stranding` | property_type, country_iso, floor_area_m2, current_energy_kwh_m2, current_carbon_kgco2_m2, year_built, last_major_refurb, planned_refurb_year | Convenience wrapper for single-asset CRREM stranding analysis using primitive types. Args: property_type: "office", "retail", "industrial", or "multifamily" country_iso: ISO 3166-1 alpha-2 e.g. "GB", "DE", "US" floor_area_m2: Gross internal area in square metres current_energy_kwh_m2: Current annual energy intensity current_carbon_kgco2_m2: Current annual carbon intensity year_built: Year of const |

### 2.3 Engine `re_clvar_engine` (services/re_clvar_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RECLVaREngine._get_time_horizon_band` | h |  |
| `RECLVaREngine._interpolate_carbon_price` | scenario, yr | Linear interpolation of carbon price for any target year. |
| `RECLVaREngine._interpolate_slr` | scenario, yr | Linear interpolation of sea level rise for any target year. |
| `RECLVaREngine._epc_numeric` | r |  |
| `RECLVaREngine._epc_gap` | current, required | Return EPC grades below required minimum (0 = compliant). |
| `RECLVaREngine._flood_severity` | zone, depth |  |
| `RECLVaREngine._heat_severity` | days |  |
| `RECLVaREngine._wildfire_severity` | km |  |
| `RECLVaREngine._slr_severity` | ckm, slr |  |
| `RECLVaREngine._subsidence_severity` | risk |  |
| `RECLVaREngine._drought_severity` | wsi |  |
| `RECLVaREngine.calculate_physical_clvar` | inputs, scenario, time_horizon | Calculate physical climate risk value impact per hazard. Flood: depth-damage function addon = max(-(depth*0.15+0.05)*0.5, -0.10) for Zone A/B. Heat: cooling cost uplift = heat_days * 0.0015 * blending factor 0.3. Wildfire: proximity-based severity (<5km=catastrophic, <15km=high, etc.). SLR: time-scaled by ratio of horizon-year SLR to 2050 SLR baseline. All hazards amplified by CLIMATE_AMPLIFICATIO |
| `RECLVaREngine.calculate_transition_clvar` | inputs, val_inputs, scenario, time_horizon | Calculate transition risk: EPC stranding, retrofit capex, carbon cost. 1. Applicable EPC minimum: 2030 standard if horizon < 2033, else 2033 standard. 2. Brown discount from BROWN_DISCOUNT_TABLE by EPC grade gap. 3. Retrofit capex: DEFRA/JLL benchmarks scaled by feasibility factor (high=1.0x, medium=1.20x, low=1.55x, not_feasible=2.0x notional). 4. Stranding year: not_feasible assets strand at reg |
| `RECLVaREngine.run_monte_carlo` | physical_inputs, transition_inputs, val_inputs, scenario, time_horizon, n_simulations, random_seed | Monte Carlo simulation for probabilistic CLVaR distribution. Stochastic parameters: - Flood depth: log-normal, sigma=0.20 (approx +/-20%) - Carbon price: log-normal, sigma=0.30 (approx +/-30%) - Retrofit cost: normal, scale=0.25 clipped [0.5, 2.0] (approx +/-25%) - EPC compliance: uniform [0.85, 1.15] (approx +/-15%) - Heat days: normal, scale=20% of mean - SLR: log-normal, sigma=0.15 (approx +/-1 |
| `RECLVaREngine.calculate_clvar` | physical_inputs, transition_inputs, val_inputs, scenario, time_horizon, run_mc, mc_simulations | Full CLVaR calculation orchestrator. Execution order: 1. Physical CLVaR (deterministic: depth-damage + amplification) 2. Transition CLVaR (EPC gap + retrofit capex + carbon NPV) 3. Combined CLVaR (two-asset VaR at rho=0.45, net of green premium) 4. Monte Carlo percentile distribution (if run_mc=True) 5. RICS VPS4 / IVS 2024 compliant validation summary Args: physical_inputs: Physical hazard exposu |
| `RECLVaREngine._build_validation_summary` | pi, ti, vi, scenario, time_horizon, phys, trans, cpct | Build RICS VPS4 / IVS 2024 compliant validation and audit trail. |
| `RECLVaREngine._assess_data_quality` | pi, ti, vi | Rate data quality per input category, scale 1-5 (5 = highest). |
| `calculate_clvar_for_asset` | flood_zone, flood_depth_100yr_m, heat_days_above_35c, wildfire_proximity_km, coastal_proximity_km, subsidence_risk, water_stress_score, current_epc_rating | Convenience wrapper for single-asset CLVaR using primitive Python types. Maps string scenario/property_type to enums and delegates to RECLVaREngine.calculate_clvar(). Scenario options: "NZE_1.5C", "BELOW_2C", "NDC_2.5C", "CURRENT_POLICIES_3C". |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `combined`, `decimal` *(shared)*, `defaults`, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/re/crrem/pathways/{property_type}/{country_iso}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['property_type', 'country_iso', 'pathway', 'source', 'validation_summary'], 'n_keys': 5}`

**POST /api/v1/re/clvar/calculate** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['property_id', 'scenario', 'horizon_years', 'physical_clvar_pct', 'transition_clvar_pct', 'total_clvar_pct', 'physical_clvar_gbp', 'transition_clvar_gbp', 'total_clvar_gbp', 'var_95_pct', 'var_99_pct', 'stranding_risk_year', 'risk_rating', 'top_risk_drivers', 'validation_`

**POST /api/v1/re/clvar/portfolio** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scenario', 'horizon_years', 'total_properties', 'per_property', 'portfolio_weighted_clvar_pct', 'total_portfolio_clvar_gbp', 'risk_distribution', 'validation_summary'], 'n_keys': 8}`

**POST /api/v1/re/crrem/roadmap** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re/crrem/stranding** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['property_id', 'property_type', 'country_iso', 'scenario', 'stranding_year', 'is_stranded_today', 'current_energy_intensity_kwh_m2', 'current_carbon_intensity_kgco2_m2', 'pathway_intensity_2030_kwh_m2', 'pathway_intensity_2050_kwh_m2', 'gap_to_pathway_today_pct', 'annual_`

## 5 · Intermediate Transformation Logic

**Engine `crrem_stranding_engine` — extracted transformation lines:**
```python
t = (year - y0) / (y1 - y0)
interp = pathway[y0] + t * (pathway[y1] - pathway[y0])
yoy_reduction = (float(prev_intensity) - float(intensity)) / float(prev_intensity) * 100
gap         = current_ei - pw_now
gap_pct     = (gap / pw_now * 100) if pw_now > 0 else 0.0
years_to_1_5c = (sy_1_5c - current_year) if sy_1_5c is not None else None
years_to_2050 = max(1, 2050 - current_year)
total_reduction_needed = (current_ei - pw_2050) / current_ei
annual_reduction_pct = (1 - (pw_2050 / current_ei) ** (1 / years_to_2050)) * 100
total_retro = retro_m2 * floor_area
annual_carbon_cost = (carbon_kgco2 * floor_area / 1000.0) * self.CARBON_PRICE_EUR_TCO2
red_pct    = max(0.0, (current_ei - target_ei) / current_ei * 100) if current_ei > 0 else 0.0
ann_red    = max(0.0, prev_target - target_ei)
gap_yr     = max(0.0, current_ei - target_ei)
ic_tot = ic_m2 * float(profile.floor_area_m2)
ic_tot = ic_m2 * float(profile.floor_area_m2)
```

**Engine `re_clvar_engine` — extracted transformation lines:**
```python
hyear = datetime.utcnow().year + time_horizon
dda = max(-(depth * 0.15 + 0.05) * 0.5, -0.10)
hi[HazardType.FLOOD] = max(bflood + dda, -0.45)
cool  = max(-(inputs.heat_days_above_35c * 0.0015), -0.06) * 0.3
hi[HazardType.HEAT] = max(bheat + cool, -0.15)
hi[HazardType.SEA_LEVEL_RISE] = slrbase * (slrm / slr2050 if slr2050 > 0 else 1.0)
ss = sum(v ** 2 for v in neg)
cx = 0.35 * sum(neg[a] * neg[b] for a in range(len(neg)) for b in range(len(neg)) if a != b)
agg = -math.sqrt(max(ss + cx, ss * 0.5))
hyear = cyear + time_horizon
rcrm = bc * fm
rtot = rcrm * fa
rpct = -(rtot / mv) if mv > 0 else 0.0
ctpa   = (ci * fa) / 1000.0
cp    = self._interpolate_carbon_price(scenario, cyear + yr)
impv  = max(0.5, (1 - 0.02) ** yr)
cpct = -(npvc / mv) if mv > 0 else 0.0
tv = (carbon_pct_mv := cpct) * 0.4 if gapp == 0 else (
yts = max(0, sy - cyear)
tv = max(tv, -0.60)
hyear = cyear + time_horizon
hd_s  = rng.normal(bhd, max(bhd * 0.20, 1.0),   n_simulations).clip(0)
fv  = max(fv, -0.45)
ss = sum(v**2 for v in nv)
cx = 0.35 * sum(nv[a]*nv[b] for a in range(len(nv)) for b in range(len(nv)) if a!=b)
pv = -math.sqrt(max(ss+cx, ss*0.5))
pv  = max(pv * amp, -0.60)
bv  = -min(bbd * ep_s[i], 0.60)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Two engines back the `/api/v1/re/...` routes:

- **`re_clvar_engine.py`** (`RECLVaREngine`, "CLVaR-Engine-v2.0.0") — Real-estate Climate
  Value-at-Risk: physical CLVaR (7 hazards via severity-banded value multipliers + depth-damage
  add-on), transition CLVaR (EPC gap → brown discount, retrofit capex, carbon-cost NPV), and a
  10,000-path Monte Carlo distribution. Serves `POST /re/clvar/calculate` and `/re/clvar/portfolio`.
- **`crrem_stranding_engine.py`** (`CRREMStrandingEngine`, "CRREM-Engine-v2.0.0") — CRREM v2.0
  stranding year, pathway-gap and retrofit-urgency analysis. Serves `GET /re/crrem/pathways/...`,
  `POST /re/crrem/stranding` and `/re/crrem/roadmap`.

Headline formulas (quoted from code):

```
physical  = −√( Σvᵢ² + 0.35·Σᵢ≠ⱼ vᵢvⱼ )       over negative amplified hazard impacts, floor −0.60
transition = −(bd·0.50) + (retrofit%MV·0.30) + (carbonNPV%MV·0.20)  [+ stranding penalty], floor −0.60
            (if EPC-compliant: transition = carbonNPV%MV × 0.4)
combined  = −√(p² + t² + 2·0.45·|p|·|t|) + green_premium              floor −0.80
stranding year (CRREM) = first year the pathway kWh/m² drops below the asset's intensity
annual reduction req.  = (1 − (pathway₂₀₅₀/EI_now)^(1/years-to-2050)) × 100
```

### 7.2 Parameterisation

**Hazard value multipliers** (`PHYSICAL_RISK_MULTIPLIERS`, 6 severity bands each; worst band):
flood −35%, heat −12%, wildfire −28%, sea-level rise −45%, subsidence −20%, drought −10%,
cyclone −30% (cyclone is hard-set to 0 in the deterministic path). Severity is banded from
inputs: flood zone A/B/C/X × depth; heat days ≥60/40/25/15/5; wildfire distance <5/10/15/25/40 km;
SLR by coastal km × projected rise; drought by WRI Aqueduct score ≥4.5/4.0/3.0/2.0/1.0.

**Transition tables:** `BROWN_DISCOUNT_TABLE` by EPC-grade gap {0:0, 1:3.5%, 2:7.5%, 3:12%,
4:18%, 5:25%, 6:32%} (cited "RICS/JLL/Knight Frank ESG Research 2024"); `GREEN_PREMIUM_BY_CERT`
(BREEAM Outstanding +10% … EPC A +2.5%; "CBRE/C&W Green Premium Study 2023");
`RETROFIT_CAPEX_PER_M2` by gap {1:£85 … 6:£750} scaled by feasibility {high 1.0, medium 1.20,
low 1.55, not_feasible 2.0} ("DEFRA Green Finance Taskforce 2024 / JLL Retrofit Report 2024").
Carbon-price trajectories per scenario (NZE 1.5C: $65→$900/t 2024–2050; Current Policies 3C:
$28→$130), linearly interpolated; SLR projections per scenario (NZE 0.28 m vs CP3C 0.62 m by
2050; validation cites IPCC AR6 WGI Ch. 9 / UKCP18); climate amplification by horizon band
(short ≤5y / medium ≤15y / long): NZE 1.05/1.12/1.20 up to CP3C 1.28/1.60/2.10. Carbon NPV uses
a 5% real discount rate and 2% p.a. intensity improvement (floored at 0.5).

**CRREM pathways** (`CRREM_PATHWAY_DATA`): kWh/m²/yr thresholds for 4 property types ×
4–5 countries (GB/DE/US/FR/+NL office) × {1.5C, 2C} at 5-year nodes 2020–2050, linearly
interpolated. The in-file note is explicit: "approximate CRREM Phase 2 values … replace with
exact CRREM v2.0 data from www.crrem.eu". Retrofit-depth costs: light £85, medium £220,
deep £420, full £680, not_feasible £950/m²; carbon cost uses a flat €75/tCO₂e (EU ETS
2024-25 average). Urgency: ≤0y immediate, ≤5y within_5yr, ≤10y within_10yr, else low.

### 7.3 Calculation walkthrough

`calculate_clvar` orchestrates: (1) physical — each hazard is severity-banded, flood gets a
depth-damage add-on `max(−(depth×0.15+0.05)×0.5, −0.10)` in zones A/B, SLR is time-scaled by
`SLR(horizon)/SLR(2050)`, all impacts are multiplied by the scenario amplification factor, then
aggregated with the ρ=0.35 covariance formula; (2) transition — the applicable MEES minimum is
the 2033 standard when the horizon year ≥2033, else the 2030 standard; the EPC gap indexes the
brown-discount and retrofit tables; stranding year is set for `not_feasible` (2030/2033) or
`low` feasibility (2033) with a penalty of −25%/−15%/−8% by years-to-stranding ≤2/≤5/>5;
(3) combination at ρ=0.45 net of any green premium; (4) Monte Carlo (numpy
`default_rng(seed=42)`): flood depth lognormal σ=0.20, carbon price lognormal σ=0.30, retrofit
cost normal ±25% clipped [0.5,2], EPC compliance uniform [0.85,1.15], heat days normal ±20%,
SLR lognormal σ=0.15, water stress normal σ=0.3; physical and transition combined per path at
ρ=0.50, path floor −0.80; reports p5/p25/p50/p75/p95, `var_95 = p5`, `var_99 = p1`. With
`run_mc=False`, percentiles are approximated analytically from `sd = |CLVaR|×0.30`.
CRREM `assess_stranding` compares current intensity (assumed flat — "no improvement,
conservative baseline") against the descending pathway to 2070; `compare_scenarios` derives
2.5C/3C rows by scaling the 2C result (+5y/+12y stranding delay, gap ×0.70/×0.45 etc.).

### 7.4 Worked example — transition CLVaR (GB office, NZE 1.5C, 10-year horizon)

Asset: EPC E, 10,000 m², MV £50M, carbon intensity 45 kgCO₂e/m², feasibility medium, MEES
minima C (2030) / B (2033). Horizon year 2036 ≥ 2033 → applicable minimum **B**.

| Step | Computation | Result |
|---|---|---|
| EPC gap | E(5) − B(2) | 3 grades |
| Brown discount | table[3] | 12.0% |
| Retrofit cost | £290/m² × 1.20 × 10,000 | £3.48M → −6.96% of MV |
| Annual emissions | 45 × 10,000 / 1000 | 450 tCO₂e |
| Carbon NPV | Σ₁¹⁰ 450·CP(yr)·0.98^t / 1.05^t (CP interp. $115→$356) | ≈ £0.674M → −1.35% of MV |
| Weighted transition | −(0.12×0.50) + (−0.0696×0.30) + (−0.0135×0.20) | **−8.36%** |
| Stranding penalty | feasibility medium → none | 0 |

If physical CLVaR were −6.0%, combined = −√(0.0836² + 0.06² + 2·0.45·0.0836·0.06) = **−12.4%**
(≈ −£6.2M on £50M) before any green premium.

### 7.5 CRREM staging rubric & scenario comparison

Retrofit depth from gap%: ≤10% (and not stranded) light; ≤25% medium; ≤50% deep; else full
(or not_feasible). The roadmap generator marks intervention years {2030, 2035, 2040, 2045, 2050,
planned refurb} and costs non-intervention years at £2/m² (compliant) or £8/m² (operational
measures). Note two code quirks: `compare_scenarios` populates the 2C row's
`years_to_stranding` from the result field named `years_to_stranding_1_5c` (the field is
scenario-generic in that call), and the 2.5C/3C rows are **heuristic rescalings** of the 2C
result, not real CRREM pathways.

### 7.6 Data provenance & limitations

- **No `sr()` PRNG** — the only randomness is the seeded numpy Monte Carlo (seed 42,
  reproducible). All asset inputs come from the caller.
- CRREM pathway numbers are self-declared **approximations** of CRREM v2.0 Phase 2; brown
  discounts, green premia and retrofit costs cite named 2023-24 industry studies but are
  transcribed constants (not verifiable from code alone).
- Fixed correlations (0.35 hazard-hazard, 0.45/0.50 physical-transition) are modelling
  assumptions; real CRREM/CLVaR practice would estimate them or run joint scenarios.
- Deterministic transition weighting (50/30/20) and the flat €75/t CRREM carbon price are
  simplifications; the CLVaR engine's own trajectory is used only inside the NPV term.
- CRREM analysis assumes zero energy-intensity improvement absent retrofit; MC does not sample
  wildfire/subsidence (held static per severity band).

### 7.7 Framework alignment

- **CRREM v2.0 Phase 2 (2023)** — the real CRREM tool publishes country × property-type energy
  and GHG intensity pathways derived from IEA/IPCC carbon budgets; stranding = the year an
  asset's intensity crosses the descending pathway. The engine reproduces this mechanic with
  interpolated approximate thresholds (energy intensity only; the GHG-intensity pathway is not
  implemented).
- **RICS VPS4 / Red Book & IVS 2024** — the `validation_summary` audit trail (methodology,
  inputs, assumptions, data quality 1–5, disclaimers incl. "requires review by a qualified RICS
  valuer") implements VPS4's requirement to treat climate risk as a material valuation
  consideration with documented basis.
- **UK MEES (Energy Act 2011 regime)** — EPC minimum C by 2030 / B by 2033 (proposed) drives
  the stranding/penalty logic; these dates are stated assumptions, still subject to legislation.
- **TCFD / EU Taxonomy 2020/852** — scenario-conditioned quantification and disclosure framing;
  the four scenarios map to SSP1-1.9/SSP1-2.6/SSP2-4.5/SSP5-8.5 (IPCC AR6) and IEA NZE/SDS/STEPS.
- **NGFS Phase 4 / IEA WEO** — cited as carbon-price sources for the scenario trajectories.

## 9 · Future Evolution

### 9.1 Evolution A — Asset-coordinate hazard resolution and calibrated CLVaR (analytics ladder: rung 3 → 4)

**What.** Two v2.0.0 engines: `RECLVaREngine` computes real-estate Climate Value-at-Risk —
physical CLVaR over 7 hazards with depth-damage add-ons, transition CLVaR (EPC-gap brown
discount + retrofit capex + carbon-cost NPV), and a 10,000-path Monte Carlo — and
`CRREMStrandingEngine` computes CRREM v2.0 stranding year and retrofit urgency. This is already
rung-3 (Monte Carlo, CRREM-calibrated). The limitations: hazard severity uses banded value
multipliers with a fixed cross-correlation (`0.35·Σvᵢvⱼ`, `combined` correlation `0.45`), and
hazard inputs (flood depth, heat days, SLR) are caller-supplied rather than location-resolved.
Evolution A grounds hazards and calibrates the correlations.

**How.** (1) Resolve the 7 hazard drivers per-coordinate from the platform's physical-risk digital
twin (the same 5 populated `ref_*_zones` grids the `physical_risk_pricing` module uses) with a
reported `resolution_tier`, replacing caller-entered depth/heat/SLR. (2) Calibrate the
inter-hazard correlation coefficients (0.35 physical, 0.45 physical-transition) against observed
loss covariance rather than fixed constants — these drive the diversification in the CLVaR
aggregation. (3) Calibrate the CRREM pathways against the real CRREM v2.0 dataset (shared with
`glidepath`). (4) Bench-pin physical/transition/combined CLVaR and stranding year.

**Prerequisites.** Digital-twin grid linkage; a loss-covariance source for correlation
calibration; CRREM v2.0 pathway data. **Acceptance:** two properties at different coordinates
produce different physical CLVaR from real hazard grids with a resolution tier; correlation
coefficients carry calibration provenance; stranding year and CLVaR bench-pinned.

### 9.2 Evolution B — Real-estate climate-VaR copilot (LLM tier 2)

**What.** A copilot that runs `/clvar/calculate` and explains the number — "your total CLVaR is
−22%: −14% physical (flood and heat dominate) and −11% transition (EPC-D stranding by 2032 plus
retrofit capex), partially offset by diversification; VaR-99 is −31%" — each figure from a tool
call, with portfolio roll-up and CRREM roadmap.

**How.** Five endpoints (`/clvar/calculate`, `/crrem/stranding`, `/crrem/roadmap`,
`/clvar/portfolio`, `/crrem/pathways/...`) form the tool set; the `top_risk_drivers` and
`validation_summary` fields the engine returns let the copilot attribute CLVaR to specific
hazards and flag data-quality caveats. The Monte Carlo VaR-95/99 outputs support "what's my tail
loss?" questions. What-ifs ("what if we retrofit to EPC-B?") re-run statelessly. Core node for a
real-estate/lending desk, cross-linking to `green_premium_tenant` and `real_asset_decarb`.

**Prerequisites.** None hard — engines are Monte-Carlo-based and honest; stronger once Evolution A
grounds hazards in the digital twin. **Acceptance:** every CLVaR, VaR, and stranding figure traces
to a tool response; the copilot cites `top_risk_drivers` for attribution; it labels hazard inputs
as caller-supplied vs grid-resolved (per Evolution A) and refuses to present CLVaR as a market
valuation.