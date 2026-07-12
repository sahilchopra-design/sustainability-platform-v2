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
