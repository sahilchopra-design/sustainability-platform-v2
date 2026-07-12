# Api::Insurance_Risk
**Module ID:** `api::insurance_risk` · **Route:** `/api/v1/insurance-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/insurance-risk/mortality` | `assess_mortality` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/liability-valuation` | `value_liabilities` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/climate-frequency` | `assess_climate_frequency` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/underwriting` | `assess_underwriting` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/retrocession` | `assess_retrocession` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/medical-trend` | `assess_medical_trend` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/comprehensive` | `comprehensive_assessment` | api/v1/routes/insurance_risk.py |
| GET | `/api/v1/insurance-risk/available-countries` | `available_countries` | api/v1/routes/insurance_risk.py |
| GET | `/api/v1/insurance-risk/available-perils` | `available_perils` | api/v1/routes/insurance_risk.py |
| GET | `/api/v1/insurance-risk/solvency2-countries` | `solvency2_countries` | api/v1/routes/insurance_risk.py |
| GET | `/api/v1/insurance-risk/climate-adjustments` | `climate_adjustments` | api/v1/routes/insurance_risk.py |

### 2.3 Engine `insurance_risk_engine` (services/insurance_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `InsuranceRiskEngine.assess_mortality` | country, sex, warming_c | Climate-adjusted mortality assessment. Applies WHO base mortality rates with climate overlays for heat stress, air quality, and disease vector shifts. Parameters: country: ISO3 country code (e.g., "GBR", "USA") sex: "male" or "female" warming_c: Degrees C warming above pre-industrial (default 1.5°C) Returns: MortalityResult with base and adjusted qx rates |
| `InsuranceRiskEngine.value_liabilities` | total_lives, avg_sum_assured_eur, avg_remaining_term_years, avg_age, discount_rate_pct, longevity_shock_bps, country | Life liability valuation under base and stressed longevity. Calculates PV of future obligations using WHO mortality tables and applies longevity stress per Solvency II ORSA requirements. Parameters: total_lives: Number of insured lives avg_sum_assured_eur: Average sum assured per life avg_remaining_term_years: Average remaining policy term avg_age: Average policyholder age discount_rate_pct: Risk- |
| `InsuranceRiskEngine.assess_natcat_exposure` | country, exposure_eur, perils, warming_c | Natural catastrophe exposure analysis with climate overlay. Uses Solvency II standard formula nat-cat factors from EIOPA Delegated Regulation, scaled by IPCC AR6 climate multipliers. Parameters: country: ISO2 country code (e.g., "DE", "FR", "GB") exposure_eur: Total sum insured in EUR perils: List of perils to analyse (default: all available) warming_c: Temperature warming scenario in degrees C Re |
| `InsuranceRiskEngine.assess_climate_frequency` | hazard_types, warming_scenario_c, base_loss_ratio_pct, expense_ratio_pct | Climate-adjusted loss frequency and severity analysis. Applies IPCC AR6 damage functions to extrapolate climate-driven changes in loss frequency and severity by hazard type. Parameters: hazard_types: Perils to analyse (default: all IPCC hazards) warming_scenario_c: Temperature warming in degrees C base_loss_ratio_pct: Current baseline loss ratio (%) expense_ratio_pct: Current expense ratio (%) Ret |
| `InsuranceRiskEngine.assess_underwriting` | gwp_eur, net_earned_premium_eur, claims_incurred_eur, expense_ratio_pct, portfolio_size, warming_c | Underwriting risk assessment with climate overlay. Decomposes combined ratio and applies climate-adjusted loss frequency/severity to derive technical pricing adequacy. Parameters: gwp_eur: Gross written premium net_earned_premium_eur: Net earned premium claims_incurred_eur: Total claims incurred expense_ratio_pct: Operating expense ratio (%) portfolio_size: Number of policies warming_c: Temperatur |
| `InsuranceRiskEngine.assess_retrocession` | gross_exposure_eur, ceded_premium_eur, layers, counterparty_default_prob_pct | Reinsurance retrocession chain analysis. Aggregates layer-by-layer retention, estimates cascade failure probability, and calculates counterparty credit risk. Parameters: gross_exposure_eur: Total gross exposure ceded_premium_eur: Total ceded reinsurance premium layers: List of layers [{name, attachment_eur, limit_eur}] counterparty_default_prob_pct: Reinsurer default probability Returns: Retrocess |
| `InsuranceRiskEngine.assess_medical_trend` | claim_cost_per_member_eur, medical_cpi_trend_pct, member_count, warming_c, pandemic_scenario | Health insurance medical trend analysis with climate overlay. Combines medical CPI inflation with climate-health effects (heat-related morbidity, air quality, disease expansion). Parameters: claim_cost_per_member_eur: Average annual claim cost per member medical_cpi_trend_pct: Medical cost inflation rate (%) member_count: Total insured members warming_c: Temperature warming for climate-health over |
| `InsuranceRiskEngine.comprehensive_assessment` | entity_name, country, warming_c, exposure_eur, own_funds_eur | Run all sub-modules and produce a comprehensive insurance risk summary. Parameters: entity_name: Name of the insurer country: Operating country (ISO3 for mortality, ISO2 for nat-cat) warming_c: Climate warming scenario exposure_eur: Total insured exposure own_funds_eur: Total eligible own funds (Solvency II) Returns: InsuranceRiskSummary with all sub-module results |
| `InsuranceRiskEngine._age_to_band` | age | Map numeric age to WHO age band key. |
| `InsuranceRiskEngine.get_available_countries` |  | List countries with embedded mortality tables. |
| `InsuranceRiskEngine.get_available_perils` |  | List perils with embedded damage functions. |
| `InsuranceRiskEngine.get_solvency2_countries` |  | List countries with Solvency II nat-cat factors. |
| `InsuranceRiskEngine.get_climate_adjustments` |  | Get climate-mortality adjustment parameters. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/insurance-risk/available-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/insurance-risk/available-perils** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['perils'], 'n_keys': 1}`

**GET /api/v1/insurance-risk/climate-adjustments** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['adjustments'], 'n_keys': 1}`

**GET /api/v1/insurance-risk/solvency2-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**POST /api/v1/insurance-risk/climate-frequency** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/insurance-risk/comprehensive** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/insurance-risk/liability-valuation** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/insurance-risk/medical-trend** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `insurance_risk_engine` — extracted transformation lines:**
```python
remaining = max(0, 85 - midpoint)
le_delta = round(-delta_sum * 10, 2)  # Simplified scaling
reserve_impact = round((adj_avg - base_avg) / base_avg * 100, 2) if base_avg > 0 else 0.0
total_sa = total_lives * avg_sum_assured_eur
r = discount_rate_pct / 100.0
discount = (1 + r) ** (-t)
prob_death_t = base_qx * (1 + 0.01 * t)  # Aging adjustment
shock = longevity_shock_bps / 10000.0
stressed_qx = base_qx * (1 - shock) * (1 + 0.01 * t)
annuity_adj = 1.0 + longevity_shock_bps / 10000.0 * 5.0  # Simple annuity factor
pv_stressed_final = pv_stressed * annuity_adj
own_funds = total_sa * 0.08  # 8% of sum assured as own funds (simplified)
surplus_base = own_funds - pv_base
surplus_stressed = own_funds - pv_stressed_final
solvency_base = round(own_funds / pv_base, 4) if pv_base > 0 else 999.0
solvency_stressed = round(own_funds / pv_stressed_final, 4) if pv_stressed_final > 0 else 999.0
longevity_shock_impact_eur=round(pv_stressed_final - pv_base, 2),
eal = exposure_eur * f_200yr / 200 * freq_mult * sev_mult
pml_100 = exposure_eur * f_200yr * 1.41 * freq_mult * sev_mult
pml_250 = exposure_eur * f_200yr * 1.12 * 1.41 * freq_mult * sev_mult
sum_sq = sum(v**2 for v in pml_values)
diversified_pml = math.sqrt(sum_sq + cross) if (sum_sq + cross) > 0 else pml_100_total
div_benefit = round((1 - diversified_pml / pml_100_total) * 100, 1) if pml_100_total > 0 else 0.0
tail_var = exposure_eur * sum(
freq_stressed[hazard] = round(base_freq * freq_multiplier, 4)
avg_freq_mult = sum(freq_stressed.values()) / len(freq_stressed)
avg_sev_mult = sum(sev_mult.values()) / len(sev_mult)
loss_ratio_climate = base_loss_ratio_pct * avg_freq_mult * avg_sev_mult
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine docstrings are the methodology narrative; no guide↔code reconciliation is required.)*

### 7.1 What the module computes

`backend/services/insurance_risk_engine.py` (class `InsuranceRiskEngine`) spans four lines of business with climate overlays, exposed via `api/v1/routes/insurance_risk.py`:

| Sub-module | Endpoint | Headline outputs |
|---|---|---|
| Life mortality/longevity | (in `/comprehensive`) | climate-adjusted qx per age band, life-expectancy delta, reserve impact % |
| Life liability valuation | `POST /liability-valuation` | PV of obligations base vs longevity-stressed, solvency ratios |
| P&C nat-cat exposure | (in `/comprehensive`) | EAL, PML 100/250yr, diversification benefit, nat-cat SCR |
| P&C climate frequency | `POST /climate-frequency` | frequency/severity multipliers per hazard, combined-ratio delta |
| P&C underwriting | (in `/comprehensive`) | loss/expense/combined ratios, price adequacy, climate-adjusted CR |
| Reinsurance retrocession | (in `/comprehensive`) | layer exhaustion, cascade failure prob., counterparty credit risk |
| Health medical trend | `POST /medical-trend` | projected claim costs 1/3yr, premium & IBNR adequacy |
| Comprehensive | `POST /comprehensive` | total SCR, solvency ratio, rule-based recommendations |

Reference lookups (`GET /available-countries`, `/available-perils`, `/climate-adjustments`, `/solvency2-countries`) expose the embedded tables in `services/reference_data_tables.py`.

### 7.2 Parameterisation

**Climate-mortality multipliers** (`CLIMATE_MORTALITY_ADJUSTMENTS`, per-°C, applied as `multiplier^warming_c` to WHO base qx — in-code citations shown):

| Driver | qx multiplier /°C | Age bands affected | Cited source |
|---|---|---|---|
| heat_stress | 1.04 | 65-74, 75-84, 85+ | Lancet Countdown 2024 |
| air_quality | 1.02 | 0-1, 1-4, 65-74, 75-84, 85+ | IPCC AR6 WG2 Ch7.3.1 |
| disease_vector | 1.015 | 0-1 … 35-44 | IPCC AR6 WG2 Ch7.3.2 |

**IPCC AR6 damage functions** (`IPCC_AR6_DAMAGE_FUNCTIONS`, 8 hazards with confidence flags), e.g. wildfire freq ×1.40/°C sev ×1.25 (high confidence), river_flood ×1.15/×1.08 (high), tropical_cyclone ×1.07/×1.12 (medium), winter_storm ×0.90/×0.95 (low — warming *reduces* it). **Solvency II nat-cat factors** (`SOLVENCY2_NAT_CAT_FACTORS`, 13 EU countries × 4 perils, `factor_200yr` = 1-in-200yr loss as fraction of sum insured, attributed to EIOPA Delegated Regulation 2015/35), e.g. DE windstorm 0.0038, IT earthquake 0.0055, NL flood 0.0045. Peril cross-correlations default to 0.25 when a pair is missing from `SOLVENCY2_PERIL_CORRELATIONS`.

Other notable constants: own funds = 8% of sum assured (liability module), annuity adjustment `1 + shock×5`, P&C LOB diversification benefit fixed at 15.0%, health climate overlay 3%/°C, pandemic surge +35%, premium loading 25%, aggregate SCR market add-on = 1% of exposure, retrocession commission haircut 0.7 — all in-code "simplified" demo calibrations.

### 7.3 Calculation walkthrough

**Mortality:** for each WHO age band, `adj_qx = qx × Π(driver_multiplier^warming_c)` over drivers whose age bands include the band, capped at 1.0. Life-expectancy delta `= −Σ[(adj_qx − qx) × max(0, 85 − band_midpoint)] × 10` (self-labelled "simplified scaling"). Reserve impact = % change in mean qx over insured bands 25–84.

**Liability PV:** with constant base qx (from age band) and aging drift `×(1 + 0.01t)`, `PV = Σ_t SA_total × qx_t × (1+r)^-t` over the remaining term; longevity stress lowers qx by `shock_bps/10⁴`, then the result is *raised* by the annuity adjustment (`×(1 + shock×5)`) so that lower mortality increases liabilities as in annuity business. Solvency ratio = own funds / PV.

**Nat-cat:** per peril, `EAL = exposure × factor_200yr / 200 × freq_mult × sev_mult`; `PML₁₀₀ = exposure × factor_200yr × 1.41 × climate` (1.41 ≈ √2 return-period scaling); `PML₂₅₀ = PML₁₀₀ × 1.12`. Nat-cat SCR = correlation-aggregated PML₁₀₀: `√(Σ PMLᵢ² + 2Σ ρᵢⱼ PMLᵢ PMLⱼ)`; diversification benefit = 1 − diversified/sum.

**Climate frequency → underwriting:** stressed loss ratio `= base_LR × avg_freq_mult × avg_sev_mult` (plain average over hazards); combined-ratio delta = the LR delta (expenses unchanged); `price_adequacy = 100/combined × 100`.

**Retrocession:** default 4-layer programme (QS 30%, XL 1st 50→200M, XL 2nd 200→500M, Cat XL 500M xs 500M). Per layer `exhaust_prob = max(0.5, (1 − attachment/exposure)×100) × 0.1`; cascade probability = product of layer exhaustion probabilities; counterparty risk = ceded limits × default prob.

**Comprehensive SCR:** `total_SCR = natcat_SCR + |longevity_shock_impact| + 0.01×exposure`; solvency = own funds / SCR; five threshold rules generate recommendations (solvency < 1.5, mortality reserve impact > 3%, PML₂₅₀ > 5% exposure, climate CR > 100%, health premium adequacy < 1).

### 7.4 Worked example — German nat-cat, windstorm + flood, 2 °C

`assess_natcat_exposure(country="DE", exposure_eur=1e9, perils=["windstorm","flood"], warming_c=2.0)`. Windstorm has no IPCC entry keyed "windstorm" → climate multipliers default to 1.0; flood likewise (the damage-function keys are `river_flood` etc., so climate scaling is inert for S2 peril names — a real wiring gap):

| Step | Windstorm (f=0.0038) | Flood (f=0.0024) |
|---|---|---|
| EAL = 1e9 × f / 200 | €19,000 | €12,000 |
| PML₁₀₀ = 1e9 × f × 1.41 | €5.358M | €3.384M |
| PML₂₅₀ = PML₁₀₀ × 1.12 | €6.001M | €3.790M |

Aggregation with ρ(windstorm, flood) from the correlation table (0.25 fallback if absent): diversified PML = √(5.358² + 3.384² + 2×0.25×5.358×3.384) = √(28.71 + 11.45 + 9.07) = √49.23 ≈ **€7.016M** vs undiversified €8.742M → diversification benefit ≈ **19.7%**. Tail VaR 99.5% = 1e9 × (0.0038+0.0024) = **€6.2M**.

### 7.5 Data provenance & limitations

- **No seeded PRNG** — deterministic formulas throughout; but most inputs have hard-coded demo defaults (10,000 lives, €500M GWP, 65% loss ratio, €2bn gross exposure), so `/comprehensive` without a caller-supplied book is a synthetic illustration, not an entity measurement.
- Reference tables carry genuine in-code citations (WHO GHO life tables, Lancet Countdown 2024, IPCC AR6 WG2, EIOPA 2015/35), but the numeric values are platform re-encodings — e.g. the real Annex X windstorm factor for DE is a zonal calculation, here collapsed to one scalar per country.
- **Peril-name mismatch:** S2 perils (windstorm/flood/earthquake/hail) don't match IPCC damage-function keys (tropical_cyclone/river_flood/…), so the intended climate scaling of nat-cat losses is a no-op for the default peril set (multipliers fall back to 1.0).
- Liability model uses constant qx with a linear 1%/yr aging drift, no lapse/expense cash flows, no yield curve (flat discount); the annuity adjustment double-signs the longevity stress by construction.
- Retrocession exhaustion probabilities are an ad-hoc affine function of attachment, not frequency-severity simulation; cascade probability assumes independence.
- Combined-ratio climate stress averages multipliers equally across hazards regardless of exposure mix.

### 7.6 Framework alignment

- **Solvency II (Directive 2009/138/EC + Delegated Reg 2015/35):** the real standard formula computes nat-cat SCR from zonal sums insured × country/peril factors, aggregated with prescribed correlation matrices at 99.5% VaR over one year — the engine mirrors the factor-times-exposure-with-correlation-aggregation shape at country granularity; longevity stress in the real SF is a permanent −20% shock to mortality rates, echoed here by the `longevity_shock_bps` mechanism.
- **ORSA (Own Risk & Solvency Assessment):** approximated by the comprehensive run + recommendation rules (forward-looking solvency vs a 150% internal target).
- **IPCC AR6 WG2:** per-°C frequency/severity multipliers are a compact-form encoding of AR6 hazard projections, applied exponentially in warming.
- **WHO Global Health Observatory:** abridged life tables (11 age bands) provide base qx.
- **IAIS climate application papers (2021/2024):** the LOB-spanning climate overlay design (mortality, nat-cat, underwriting, health) follows the supervisory expectation of climate integration across the balance sheet, in illustrative form.

## 9 · Future Evolution

### 9.1 Evolution A — Replace simplified actuarial factors with calibrated models (analytics ladder: rung 2 → 4)

**What.** `InsuranceRiskEngine` spans life mortality/longevity, life liability valuation,
P&C nat-cat, climate frequency, underwriting, retrocession, and health medical trend with
climate overlays. It is genuine scenario-capable work (frequency/severity multipliers,
PML 100/250yr, diversified PML via `√(Σsq + cross)`), but §5 is honest about shortcuts:
`le_delta = -delta_sum × 10  # Simplified scaling`, `own_funds = total_sa × 0.08 # 8%…
simplified`, `annuity_adj = 1 + shock/10000 × 5 # Simple annuity factor`, and aging as a
flat `qx × (1 + 0.01·t)`. Evolution A calibrates the load-bearing factors.

**How.** (1) Replace the flat mortality-improvement and simplified annuity factor with a
proper actuarial projection (e.g. a Lee-Carter-style improvement fit or standard
projection table), sourced and documented as a §8 model card. (2) Calibrate the PML
return-period factors (currently fixed 1.41/1.12 multipliers on a 200-yr base) and
nat-cat frequency multipliers against the platform's ingested peril grids (IBTrACS,
OpenFEMA claims) rather than static constants. (3) Make longevity/nat-cat SCR components
traceable to Solvency II modules instead of the `× 0.08` own-funds proxy. (4) Bench-pin
liability-valuation and PML.

**Prerequisites.** Ingested claims/peril data linkage (available in the platform);
actuarial projection reference tables. **Acceptance:** longevity stress no longer uses
the `×5` annuity shortcut; PML factors trace to a fitted return-period curve; bench pins
reproduce base vs stressed PV and diversified PML.

### 9.2 Evolution B — Actuarial and cat-risk copilot (LLM tier 2)

**What.** A copilot that runs `/comprehensive` for an insurer and explains the drivers —
"your combined ratio deteriorates 4pts under the disorderly climate-frequency scenario;
diversification benefit is 18%; longevity stress erodes solvency from 1.4 to 1.1" — each
figure from a tool call, plus what-ifs across the seven sub-modules.

**How.** Seven POST endpoints (mortality, liability-valuation, climate-frequency,
underwriting, retrocession, medical-trend, comprehensive) plus reference GETs
(available-countries/perils, climate-adjustments, solvency2-countries) that ground the
parameter space. The copilot narrates the real decomposition (frequency vs severity,
asset vs liability) and re-runs stressed scenarios statelessly. The engine's simplified
factors mean the copilot must caveat outputs as indicative pending Evolution A.

**Prerequisites.** Several POST endpoints trace `failed` in §4.2 (e.g.
`/climate-frequency`) under the harness — confirm payloads before wiring as tools.
**Acceptance:** every ratio, PML, and solvency figure traces to a tool response; the
copilot labels longevity/annuity outputs as "simplified actuarial basis" until Evolution
A recalibrates; asking for a granular reserving figure the engine doesn't compute is
refused.