## 7 · Methodology Deep Dive

The Climate Derivatives module (E106 — Climate-Linked Structured Products) is one of the platform's
**genuinely quantitative tier-A modules**. It prices three real instrument families with textbook
methods: weather derivatives via **burn analysis** (Monte-Carlo historical simulation), EUA
(EU-ETS allowance) options via **Black-Scholes-Merton / Black-76**, and catastrophe bonds via the
**expected-loss layer method**. The backend engine (`climate_derivatives_engine.py`) and the React
page (`ClimateDerivativesPage.jsx`) both implement the maths; the page also POSTs to
`/api/v1/climate-derivatives/price-weather`. The module aligns with its guide.

### 7.1 What the module computes

**Weather derivative (burn analysis)** — `price_weather_derivative` + `_simulate_weather_payouts`:
```
realised ~ N(annual_mean, std_dev)             (per year, seeded rng.gauss)
payout   = tick × max(0, realised − strike)    (call/cap) | max(0, strike − realised) (put/floor)
fair_value = mean(payouts) × (1 + risk_premium_loading)     (default loading 0.20)
delta = Φ(moneyness);  gamma = φ(moneyness)/std;  vega = φ(moneyness)·√(days/365)·notional·0.01
```

**EUA option (Black-76 on the forward)** — `price_eua_option` and the page's client pricer:
```
d1 = [ln(F/K) + ½σ²T] / (σ√T);   d2 = d1 − σ√T
call = e^{−rT} (F·Φ(d1) − K·Φ(d2));   put = e^{−rT}(K·Φ(−d2) − F·Φ(−d1))
delta = e^{−rT}Φ(d1);  gamma = e^{−rT}φ(d1)/(Fσ√T);  vega = F·e^{−rT}φ(d1)√T/100
theta = −(F·e^{−rT}φ(d1)σ)/(2√T)/365;   rho from K·T·e^{−rT}·Φ(d2)
```

**Cat bond (expected-loss layering)** — `structure_cat_bond`:
```
z_attach  = (attachment − μ_loss)/σ_loss;   prob_attach  = 1 − Φ(z_attach)
z_exhaust = (exhaustion − μ_loss)/σ_loss;   prob_exhaust = 1 − Φ(z_exhaust)
annual_EL% = annual_freq × severity_mult × (prob_attach − prob_exhaust) × 100
coupon ≈ risk_free + EL + risk_load (multiple-of-EL spread)
```

### 7.2 Parameterisation / provenance

| Data | Nature | Provenance |
|---|---|---|
| `WEATHER_STATIONS` (20) | HDD/CDD/rainfall/wind/sunshine annual mean, std, Q1–Q4 seasonal | Realistic climatology (e.g. London HDD 2340, Singapore HDD 0, Dubai CDD 4600) |
| `risk_premium_loading` | 0.20 default (0.15–0.25 range) | Standard weather-market risk load |
| `_norm_cdf` | Abramowitz & Stegun approximation | Numerically sound Φ(·) |
| EUA vol surface | tenor buckets 3m/6m/12m/24m | Hard-coded implied-vol surface |
| Cat bond peril params | `annual_freq`, `severity_mult` per peril/country | Hard-coded actuarial parameters |
| Burn seed | `random.Random(seed=42)` | **Legitimate MC seed** — reproducible historical simulation, not fabricated data |

The `random` import is used **correctly**: it drives a Monte-Carlo burn simulation of weather
realisations `N(μ,σ)`, which is the standard actuarial pricing method — not the anti-pattern of
presenting a random draw as if it were observed data.

### 7.3 Calculation walkthrough

1. User selects underlying (HDD/CDD/…), station, contract type, strike, notional, tenor.
2. **Weather**: seasonal-adjusted `μ,σ` from the station → `_simulate_weather_payouts` (20-year burn)
   → `fair_value = mean payout × (1 + loading)` + Greeks; the page POSTs to the API for this.
3. **EUA**: forward `F`, strike `K`, vol `σ`, rate `r`, tenor `T` → Black-76 price + full Greeks
   (client-side and engine agree).
4. **Cat bond**: attachment/exhaustion vs modelled loss distribution → layer EL → coupon spread.
5. **Regulatory**: EMIR / MiFID II classification of the structured product.

### 7.4 Worked example — an EUA call option (Black-76)

`F = €80`, `K = €85`, `σ = 45 %`, `r = 3 %`, `T = 0.5 yr`:

| Step | Computation | Result |
|---|---|---|
| σ√T | 0.45 × √0.5 | 0.3182 |
| d1 | [ln(80/85) + ½·0.45²·0.5] / 0.3182 | (−0.0606 + 0.0506)/0.3182 = −0.0314 |
| d2 | −0.0314 − 0.3182 | −0.3496 |
| Φ(d1), Φ(d2) | | 0.4875, 0.3633 |
| discount | e^{−0.03·0.5} | 0.9851 |
| Call | 0.9851 × (80×0.4875 − 85×0.3633) | 0.9851 × (39.00 − 30.88) = **€8.00** |
| Delta | 0.9851 × 0.4875 | **0.480** |

A slightly OTM 6-month EUA call at 45 % vol prices ~€8 with delta ~0.48 — economically sensible.

### 7.5 Data provenance & limitations

- **The pricing methods are real and correct** (BSM/Black-76 with full Greeks, expected-loss cat
  bonds, burn-analysis weather). The `_norm_cdf` A&S approximation is accurate to ~7 dp.
- Weather station climatology is **realistic reference data**, not `sr()`-seeded fabrication; the
  burn Monte-Carlo uses a fixed seed (42) for reproducibility.
- Simplifications vs production: weather realisations are **Gaussian** (real HDD/CDD are often
  skewed/fat-tailed — a t- or gamma distribution would be more faithful); the EUA vol surface is a
  static lookup, not a live-calibrated smile; cat-bond loss distribution is normal-approximated.
- Forward EUA spot / rates are user inputs, not live market feeds.

**Framework alignment:** Black-Scholes-Merton / Black-76 (the industry standard for commodity/EUA
options — the module implements it faithfully including Greeks); actuarial expected-loss / attachment-
exhaustion layering for ILS cat bonds (as used by RMS/AIR-driven ILS pricing); weather-derivative
burn analysis (the CME HDD/CDD index-futures convention); EMIR & MiFID II for derivative
classification. Because the quant methods are genuinely implemented, **no §8 model specification is
required** — the production gap is live market data (forward curves, implied-vol smiles, catastrophe-
model loss distributions), not methodology.
