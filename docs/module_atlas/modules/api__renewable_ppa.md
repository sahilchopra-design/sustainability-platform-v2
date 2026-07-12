# Api::Renewable_Ppa
**Module ID:** `api::renewable_ppa` · **Route:** `/api/v1/renewable-ppa` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/renewable-ppa/lcoe` | `lcoe` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/turbine-classes` | `ref_turbine_classes` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/solar-ghi` | `ref_solar_ghi` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/solar-defaults` | `ref_solar_defaults` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/credit-ratings` | `ref_credit_ratings` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/price-structures` | `ref_price_structures` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/ppa-risk-weights` | `ref_ppa_risk_weights` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/curtailment-risk` | `ref_curtailment_risk` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/regulatory-risk` | `ref_regulatory_risk` | api/v1/routes/renewable_ppa.py |

### 2.3 Engine `ppa_risk_scorer` (services/ppa_risk_scorer.py)
| Function | Args | Purpose |
|---|---|---|
| `PPARiskScorer.score_ppa` | inp | Score a PPA across all risk dimensions. |
| `PPARiskScorer.get_credit_ratings` |  |  |
| `PPARiskScorer.get_price_structures` |  |  |
| `PPARiskScorer._make_dim` | dim_id, label, raw_score |  |
| `PPARiskScorer._tenor_score` | years |  |

### 2.3 Engine `renewable_project_engine` (services/renewable_project_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RenewableProjectEngine.wind_yield` | turbine_class, region, num_turbines, wake_loss_pct, availability_pct | Calculate wind energy yield with P50/P75/P90 confidence levels. |
| `RenewableProjectEngine._wind_capacity_factor` | k, lam, turb | Estimate capacity factor from Weibull distribution and power curve. |
| `RenewableProjectEngine.solar_yield` | country, capacity_kwp, performance_ratio, degradation_pct_yr | Calculate solar energy yield with P50/P75/P90. |
| `RenewableProjectEngine.lcoe` | technology, total_capex_eur, annual_opex_eur, annual_generation_mwh, wacc_pct, lifetime_years, degradation_pct_yr | Calculate Levelised Cost of Energy. |
| `RenewableProjectEngine.assess_project` | project_name, technology, turbine_class, region, num_turbines, country, capacity_kwp, ppa_price_eur_mwh | Full project finance assessment with IRR, NPV, LCOE. |
| `RenewableProjectEngine.get_turbine_classes` |  |  |
| `RenewableProjectEngine.get_wind_regions` |  |  |
| `RenewableProjectEngine.get_solar_ghi_data` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/renewable-ppa/ref/credit-ratings** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'unrated_ig', 'unrated_sub_ig', 'unrated', 'sovereign', 'utility'], 'n_keys': 12}`

**GET /api/v1/renewable-ppa/ref/curtailment-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['low', 'moderate', 'high', 'very_high'], 'n_keys': 4}`

**GET /api/v1/renewable-ppa/ref/ppa-risk-weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['counterparty_credit', 'price_structure', 'tenor', 'curtailment', 'regulatory'], 'n_keys': 5}`

**GET /api/v1/renewable-ppa/ref/price-structures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['fixed', 'fixed_escalation', 'cap_floor', 'indexed_power', 'indexed_gas', 'partial_merchant', 'full_merchant', 'subsidy_cfd', 'feed_in_tariff'], 'n_keys': 9}`

**GET /api/v1/renewable-ppa/ref/regulatory-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['stable', 'moderate', 'high', 'very_high'], 'n_keys': 4}`

**GET /api/v1/renewable-ppa/ref/solar-defaults** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['capex_eur_per_kwp', 'opex_eur_per_kwp_yr', 'performance_ratio', 'degradation_pct_yr', 'lifetime_years', 'temp_coeff_pct_per_c', 'avg_module_temp_above_stc_c'], 'n_keys': 7}`

**GET /api/v1/renewable-ppa/ref/solar-ghi** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['DE', 'FR', 'ES', 'IT', 'PT', 'NL', 'GB', 'SE', 'PL', 'GR', 'US', 'IN', 'AU', 'BR', 'ZA', 'AE', 'SA', 'JP', 'CN', 'MX'], 'n_keys': 20}`

**GET /api/v1/renewable-ppa/ref/turbine-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['onshore_2mw', 'offshore_5mw', 'offshore_8mw', 'onshore_4mw', 'offshore_12mw'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic

**Engine `ppa_risk_scorer` — extracted transformation lines:**
```python
price_score = min(100, price_score + int(inp.merchant_exposure_pct * 0.5))
reg_score = min(100, reg_score + 20)
weighted_score=round(raw_score * weight, 2),
```

**Engine `renewable_project_engine` — extracted transformation lines:**
```python
mean_ws = lam * math.gamma(1 + 1 / k)
cf_net = cf * (1 - wake_loss_pct / 100) * (availability_pct / 100)
p50 = total_cap * cf_net * hours
p75 = p50 * (1 - 0.674 * uncertainty_std_pct / 100)
p90 = p50 * (1 - 1.282 * uncertainty_std_pct / 100)
eflh = cf_net * hours
capacity_factor_pct=round(cf_net * 100, 1),
partial_fraction = (p_below_rated - p_below_cut_in) * 0.45
rated_fraction = (p_below_cut_out - p_below_rated) * 1.0
cf = partial_fraction + rated_fraction
effective_pr = pr * (1 - temp_loss)
specific_yield = ghi * effective_pr
p50_yr1 = capacity_kwp * specific_yield / 1000  # MWh
p75_yr1 = p50_yr1 * (1 - 0.674 * uncertainty_std_pct / 100)
p90_yr1 = p50_yr1 * (1 - 1.282 * uncertainty_std_pct / 100)
avg_deg_factor = 1 - deg / 100 * (lifetime - 1) / 2
p50_lifetime = p50_yr1 * avg_deg_factor
cf = p50_yr1 * 1000 / (capacity_kwp * 8760) * 100  # %
r = wacc_pct / 100
crf = r * (1 + r) ** n / ((1 + r) ** n - 1)
lcoe_base = (total_capex_eur * crf + annual_opex_eur) / annual_generation_mwh
d = degradation_pct_yr / 100
disc_energy = sum(annual_generation_mwh * (1 - d) ** (t - 1) / (1 + r) ** t
disc_cost = total_capex_eur + sum(annual_opex_eur / (1 + r) ** t
lcoe_deg = disc_cost / disc_energy if disc_energy > 0 else lcoe_base
cap_kw = yield_res.total_capacity_mw * 1000
annual_revenue = p50_gen * ppa_price_eur_mwh
co2_avoided = p50_gen * grid_ef_tco2_mwh
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Two engines back `/api/v1/renewable-ppa`:

- **`renewable_project_engine.py`** (`RenewableProjectEngine`) — Weibull-based wind yield,
  GHI-based solar yield (both with P50/P75/P90), LCOE via capital-recovery factor, and full
  project IRR/NPV with and without carbon revenue (`POST /wind-yield`, `/solar-yield`, `/lcoe`,
  `/project-assess`).
- **`ppa_risk_scorer.py`** (`PPARiskScorer`) — a 5-dimension weighted PPA risk score with
  bankability rating (`POST /ppa-risk`). Nine `GET /ref/*` endpoints serve the underlying
  lookup tables.

Formulas quoted from code:

```
mean wind speed = λ · Γ(1 + 1/k)                                  # Weibull mean
CF_gross = [F(rated) − F(cut_in)]·0.45 + [F(cut_out) − F(rated)]·1.0 ,  F(v)=1−e^−(v/λ)^k ; cap 65%
CF_net   = CF_gross × (1 − wake%) × availability%
P50 = capacity × CF_net × 8760 ;  P75 = P50×(1 − 0.674σ) ;  P90 = P50×(1 − 1.282σ)
solar specific yield = GHI × PR_effective ,  PR_eff = PR × (1 − |−0.35%|×15°C)
LCOE = (capex × CRF + opex) / E ,   CRF = r(1+r)^n / ((1+r)^n − 1)
LCOE_degraded = [capex + Σ opex/(1+r)^t] / [Σ E₁(1−d)^(t−1)/(1+r)^t]   # NREL/IEA canonical form
PPA composite = Σ dimension_score × weight  (weights .25/.25/.15/.20/.15)
```

### 7.2 Parameterisation

**Wind:** 5 turbine classes (onshore 2/4 MW, offshore 5/8/12 MW) with cut-in/rated/cut-out
speeds, capex €1,100–3,200/kW, opex €30–90/kW/yr, life 25–30y (IRENA 2024 cost ranges cited in
docstring); 15 Weibull resource regions (k 1.7–2.2, λ 6.0–10.5 m/s — e.g. North Sea k=2.1,
λ=10.5). Wind uncertainty σ = 7% of annual energy (in-code comment "~6-10% std"); the 0.45
partial-power fraction is a stated simplification of the power curve. **Solar:** GHI table for
20 countries (DE 1,100 … SA 2,200 kWh/m²/yr); defaults capex €750/kWp, opex €12/kWp/yr,
PR 0.82, degradation 0.5%/yr, life 30y, temperature coefficient −0.35%/°C at +15 °C above STC;
σ = 5% inter-annual variability. **PPA scorer tables** (0–100, higher = riskier): credit
AAA 5 → CCC 70 (unrated 40); price structure feed-in-tariff 8 / fixed 10 / CfD 12 →
full merchant 80, plus `+0.5 × merchant_exposure%`; tenor <5y = 40, 5–15y = 20, >15y = 10;
curtailment low 10 → very_high 75; regulatory stable 10 → very_high 70, +20 if subsidy
dependence >50%. Risk bands: ≤20 low, ≤35 moderate, ≤55 high, else critical. Bankability:
composite ≤25 **and** credit ≤25 ⇒ bankable; composite ≤40 ⇒ conditionally bankable; else
non-bankable.

### 7.3 Calculation walkthrough

`assess_project` picks the technology leg (wind: yield from turbine + region + turbine-count;
solar: from country GHI + kWp), derives capex/opex from the class defaults unless overridden,
computes LCOE at the P50 energy, then: revenue = P50 × PPA price; CO₂ avoided = P50 ×
grid EF (default 0.4 tCO₂/MWh); carbon revenue = CO₂ × carbon price (default €80/t); NPV =
−capex + Σ(revenue − opex)/(1+r)^t; IRR by Newton-Raphson **with bisection fallback** on
[−capex, cf, …, cf] (the code comment records that this replaced a MOIC^(1/n) proxy that
"materially understates the return"); payback = capex / annual cash flow. `score_ppa` builds
the five `PPARiskDimension`s, accumulates narrative `risk_factors` and `mitigation_suggestions`
when a dimension breaches its trigger (e.g. credit ≥40 → "obtain parent company guarantee"),
and returns the weighted composite.

### 7.4 Worked example — 10 × 2 MW onshore, N-Europe (k=2.0, λ=7.5), PPA €60/MWh

| Step | Computation | Result |
|---|---|---|
| Weibull CDF values | F(3)=1−e^−0.16=0.148; F(12)=1−e^−2.56=0.923; F(25)=1−e^−11.1≈1.000 | — |
| CF gross | (0.923−0.148)×0.45 + (1.000−0.923)×1.0 = 0.349+0.077 | 42.6% |
| CF net | 0.426 × 0.92 × 0.97 | **38.0%** |
| P50 | 20 MW × 0.380 × 8760 | **66,600 MWh** |
| P90 | 66,600 × (1 − 1.282×0.07) | 60,624 MWh |
| Capex / opex | 20,000 kW × €1,200 / ×€35 | €24.0M / €0.70M/yr |
| CRF (6%, 25y) | 0.06×1.06²⁵/(1.06²⁵−1) | 0.078227 |
| LCOE | (24.0M×0.078227 + 0.70M)/66,600 | **€38.7/MWh** |
| Annual CF | 66,600×60 − 700,000 | €3.296M |
| NPV @6% | −24.0M + 3.296M×12.7834 | **+€18.1M** |
| CO₂ avoided / carbon rev | 66,600×0.4 = 26,640 t → ×€80 | €2.13M/yr |

(Annuity factor 12.7834 = (1−1.06⁻²⁵)/0.06.) IRR solves ≈13.2%; with carbon revenue the annual
CF rises to €5.43M and IRR ≈22%.

### 7.5 PPA scoring example

Offtaker BBB (20), fixed-escalation (15), 12y tenor (20), moderate curtailment (30), stable
regulatory (10): composite = 20×0.25 + 15×0.25 + 20×0.15 + 30×0.20 + 10×0.15 =
5 + 3.75 + 3 + 6 + 1.5 = **19.25 → "low" band**; credit 20 ≤ 25 and composite ≤ 25 ⇒
**bankable**. One mitigation emitted (curtailment ≥30 → storage co-location note).

### 7.6 Data provenance & limitations

- **No PRNG** — deterministic engineering formulas over registry constants; P75/P90 come from
  fixed normal-quantile scalings (0.674σ/1.282σ), not simulation.
- Turbine capex/opex, Weibull parameters, GHI values and all PPA dimension scores are
  transcribed reference constants (IRENA/DNV/Pexapark cited in docstrings) — indicative, not
  site-specific; a real EYA would integrate the actual power curve against measured wind
  distributions instead of the 0.45 partial-power fraction and 65% CF cap.
- Wind yield ignores air density, hub-height shear scaling and degradation; solar temperature
  loss is a single fixed adjustment; IRR/NPV use flat (non-escalating) revenue and opex, no
  tax, no debt structure (contrast `api::project_finance`, which layers debt but has its own
  unit bug).
- "CO₂ avoided" uses a single static grid EF (0.4 default) — a marginal-emissions or
  time-matched approach would differ materially.
- PPA weights and trigger thresholds are expert-judgement calibrations without cited studies.

### 7.7 Framework alignment

- **IEC 61400-12** — cited basis for wind power-performance treatment; the Weibull-CDF
  capacity-factor construction is the standard simplified yield method.
- **P50/P75/P90 exceedance convention (DNV energy-yield practice)** — quantiles derived from a
  normal uncertainty of annual energy, matching independent-engineer report structure.
- **IRENA Renewable Power Generation Costs 2024** — capex/opex anchors and the LCOE/CRF
  formulation (IRENA and NREL both publish LCOE this way); the degradation-aware LCOE follows
  the canonical discounted-energy denominator.
- **GHG Protocol project accounting** — avoided-emissions logic (generation × grid EF), albeit
  with an average rather than build-margin/operating-margin EF.
- **EFET / IRENA corporate-PPA risk practice / Pexapark** — the five scored dimensions
  (counterparty, price structure, tenor, curtailment, regulatory) mirror the standard European
  PPA bankability checklist.