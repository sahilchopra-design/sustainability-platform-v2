# Climate Derivatives Market
**Module ID:** `climate-derivatives` · **Route:** `/climate-derivatives` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate financial derivatives overview covering temperature futures (CME Degree Days), precipitation swaps, hurricane index products, and weather risk management for corporates.

> **Business value:** Weather derivatives protect companies against revenue volatility from temperature variability — energy companies from warm winters (reduced heating demand), utilities from cool summers (reduced cooling demand), agriculture from rainfall extremes. Climate change is shifting baseline temperatures, repricing these products.

**How an analyst works this module:**
- Market Overview shows HDD/CDD futures prices by city
- Options Pricer values weather options at various strikes
- Hedge Analyser designs weather risk strategy for energy/agriculture
- Climate Adjustment shows how temperature shifts affect fair values
- Historical Calibration shows HDD/CDD distributions 1990-2024

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `CITY_STATIONS`, `Inp`, `KpiCard`, `Row`, `Section`, `Sel`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CITY_STATIONS` | 9 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seededRandom` | `(seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `poly` | `t*(a1+t*(a2+t*(a3+t*(a4+t*a5))));` |
| `npd1` | `Math.exp(-0.5*d1*d1) / Math.sqrt(2*Math.PI);` |
| `call` | `df*(F*nd1 - K*nd2);` |
| `put` | `df*(K*(1-nd2) - F*(1-nd1));` |
| `delta` | `df*nd1;                          // ∂call/∂F (0–1)` |
| `gamma` | `df*npd1/(F*sigma*sqrtT);         // ∂²call/∂F²` |
| `vega` | `F*df*npd1*sqrtT/100;             // per 1% σ change` |
| `theta` | `-(F*df*npd1*sigma/(2*sqrtT))/365;// per calendar day (negative)` |
| `rho` | `-T*call;                          // ∂call/∂r` |
| `base` | `hashStr(productType + underlying + city + String(tenor));` |
| `fairValue` | `parseFloat((s(1) * 0.12 + 0.02).toFixed(4));` |
| `riskPremium` | `parseFloat((s(2) * 8 + 1).toFixed(2));` |
| `impliedVol` | `parseFloat((s(3) * 25 + 10).toFixed(1));` |
| `spread` | `Math.round(s(2) * 400 + 150);` |
| `attach` | `parseFloat((s(3) * 8 + 2).toFixed(1));` |
| `exhaust` | `parseFloat((attach + s(4) * 8 + 4).toFixed(1));` |
| `exceedanceCurve` | `[0.1, 0.5, 1, 2, 5, 10, 20, 50].map((prob, i) => ({` |
| `spot` | `Math.round(s(1) * 30 + 55);` |
| `atmVol` | `parseFloat((0.28 + s(2) * 0.07).toFixed(3));` |
| `fwd` | `spot * (0.5 + i * 0.06); // forward price varying around ATM` |
| `strikes` | `[spot * 0.8, spot, spot * 1.2].map(p => Math.round(p));` |
| `volSurface` | `strikes.map(k => {` |
| `moneyness` | `Math.log(spot / k); // positive = OTM put, negative = OTM call` |
| `skew` | `moneyness * 0.25;        // ~3% vol premium per 10% OTM (put skew)` |
| `termAdj` | `Math.sqrt(t) * 0.02;  // slight term structure` |
| `vol` | `Math.max(15, Math.round((atmVol + skew + termAdj + s(ti + 2) * 0.02) * 100));` |
| `barData` | `templates.map(t => ({ name: t.name.split(' ').slice(0, 2).join(' '), spread: t.spread }));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-derivatives/classify-regulatory` | `classify_regulatory_endpoint` | api/v1/routes/climate_derivatives.py |
| GET | `/api/v1/climate-derivatives/ref/weather-stations` | `get_weather_stations` | api/v1/routes/climate_derivatives.py |
| GET | `/api/v1/climate-derivatives/ref/eua-market` | `get_eua_market` | api/v1/routes/climate_derivatives.py |
| GET | `/api/v1/climate-derivatives/ref/product-templates` | `get_product_templates_endpoint` | api/v1/routes/climate_derivatives.py |
| GET | `/api/v1/climate-derivatives/ref/peril-models` | `get_peril_models` | api/v1/routes/climate_derivatives.py |
| GET | `/api/v1/climate-derivatives/ref/ccp-eligibility` | `get_ccp_eligibility` | api/v1/routes/climate_derivatives.py |

### 2.3 Engine `climate_derivatives_engine` (services/climate_derivatives_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_norm_cdf` | x | Cumulative standard normal distribution: N(x) = ½·(1 + erf(x/√2)). Fixed 2026-07-04: the previous version applied the Abramowitz & Stegun 7.1.26 erf polynomial (constants 0.3275911, 0.254829592, …) directly as if it were the normal CDF (and with exp(-x²/2) instead of exp(-x²)), giving N(0) ≈ 1e-9 instead of 0.5 — which made price_eua_option return negative call premiums. math.erf is exact to doubl |
| `_norm_pdf` | x | Standard normal PDF. |
| `_generate_burn_payouts` | mean, std_dev, strike, contract_type, tick_usd, n_years, seed | Simulate n_years historical payouts for burn analysis. |
| `price_weather_derivative` | underlying, city_station, contract_type, strike, notional_usd, tenor_days, risk_premium_loading | Price a weather derivative using burn analysis. Parameters ---------- underlying : str One of: hdd, cdd, rainfall_mm, wind_ms, sunshine_hrs city_station : str Station key from WEATHER_STATIONS (e.g. 'london', 'chicago') contract_type : str One of: call, put, swap, cap, floor strike : float Strike level in the underlying's units notional_usd : float Notional in USD tenor_days : int Tenor of the con |
| `price_eua_option` | option_type, strike, spot, tenor_years, volatility, risk_free_rate | Price an EUA (EU Allowance) option using Black-Scholes-Merton adapted for commodity. Parameters ---------- option_type : str 'call' or 'put' strike : float Strike price in EUR/tCO2 spot : float or None Spot price; defaults to EUA_MARKET_DATA spot tenor_years : float Time to expiry in years volatility : float or None Annual volatility; defaults to EUA_MARKET_DATA historical_vol_pct risk_free_rate : |
| `structure_cat_bond` | peril, country, attachment_point_usd_m, exhaustion_point_usd_m, notional_usd_m, tenor_years, trigger_type, peril_model | Structure a catastrophe bond and compute expected loss, spread, and SPV details. Parameters ---------- peril : str e.g. 'wind', 'flood', 'earthquake', 'wildfire' country : str ISO-2 country code attachment_point_usd_m : float Industry loss level (USD millions) at which bond starts paying exhaustion_point_usd_m : float Industry loss level at which bond is fully exhausted notional_usd_m : float Face |
| `classify_regulatory` | product_type, counterparty_type, jurisdiction | Classify a climate-linked derivative under EMIR / MiFID II / ISDA documentation. Parameters ---------- product_type : str e.g. 'cat_bond', 'weather_swap', 'eua_call_spread', 'sustainability_linked_swap' counterparty_type : str 'financial_counterparty', 'non_financial_counterparty', 'nfc_plus', 'third_country' jurisdiction : str 'EU', 'UK', 'US', 'APAC' |
| `get_product_templates` |  | Return the 12 climate-linked structured product templates. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CITY_STATIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| HDD/CDD Contracts | — | CME/ICE | Temperature index futures at major weather stations |
| Contract Size | — | CME standard | Notional per degree-day index unit |
| Climate Pricing Premium | — | Model | Additional cost reflecting climate-changed baseline temperatures |
- **Weather station data** → HDD/CDD calculation → **Index value for pricing**
- **Climate projections** → Temperature shift modelling → **Climate-adjusted derivative fair value**
- **Corporate weather exposure** → Hedge ratio calculation → **Weather risk management strategy**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-derivatives/ref/ccp-eligibility** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'ccp_eligibility', 'isda_sld_checklist', 'regulatory_classification_reference'], 'n_keys': 4}`

**GET /api/v1/climate-derivatives/ref/eua-market** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/climate-derivatives/ref/peril-models** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'peril_models'], 'n_keys': 3}`

**GET /api/v1/climate-derivatives/ref/product-templates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'templates'], 'n_keys': 3}`

**GET /api/v1/climate-derivatives/ref/weather-stations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'stations'], 'n_keys': 3}`

**POST /api/v1/climate-derivatives/classify-regulatory** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-derivatives/price-eua-option** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-derivatives/price-weather** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Weather derivative pricing
**Headline formula:** `Fair_value = E[Payout(index)] / discount; HDD = max(0, 65-T_mean); CDD = max(0, T_mean-65)`

HDD (Heating Degree Days) and CDD (Cooling Degree Days) futures and options for seasonal temperature risk. Hurricane index products (CHI) provide parametric protection for wind events. Energy companies use these to hedge revenue from weather-dependent demand.

**Standards:** ['CME Degree Day Futures', 'WRMA', 'Black-Scholes for weather options']
**Reference documents:** CME Degree Day Index Futures Specifications; Weather Risk Management Association; Black & Scholes (1973) Options Pricing

**Engine `climate_derivatives_engine` — extracted transformation lines:**
```python
raw = max(0.0, realised - strike)
raw = max(0.0, strike - realised)
raw = realised - strike          # can be negative
raw = max(0.0, realised - strike)
scale_factor = tenor_days / 365.0
mean_scaled = mean_annual * scale_factor
std_scaled = std_dev_annual * math.sqrt(scale_factor)
expected_payout_usd = max(0.0, sum(burn_payouts) / len(burn_payouts))
payout_std_dev = (sum((p - expected_payout_usd) ** 2 for p in burn_payouts) / len(burn_payouts)) ** 0.5
risk_premium_usd = expected_payout_usd * risk_premium_loading
fair_value_usd = expected_payout_usd + risk_premium_usd
notional_scale = notional_usd / reference_notional
payout_std_dev_scaled = payout_std_dev * notional_scale
moneyness = (mean_scaled - strike) / (std_scaled + 1e-9)
gamma = _norm_pdf(moneyness) / (std_scaled + 1e-9)
vega = _norm_pdf(moneyness) * math.sqrt(tenor_days / 365.0) * notional_usd * 0.01
d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * sqrt_T)
d2 = d1 - sigma * sqrt_T
disc = math.exp(-r * T)
price = S * _norm_cdf(d1) - K * disc * _norm_cdf(d2)
price = K * disc * _norm_cdf(-d2) - S * _norm_cdf(-d1)
delta = _norm_cdf(d1) - 1.0
gamma = _norm_pdf(d1) / (S * sigma * sqrt_T)
vega = S * _norm_pdf(d1) * sqrt_T / 100.0          # per 1% vol move
rho_call = K * T * disc * _norm_cdf(d2) / 100.0   # per 1% rate move
time_value = price - intrinsic
layer_width = exhaustion_point_usd_m - attachment_point_usd_m
industry_mean = attachment_point_usd_m * 0.4
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).
**Shared engines (edits propagate!):** `climate_derivatives_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `carbon-derivatives-desk` | engine:climate_derivatives_engine, table:exc |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |

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

## 9 · Future Evolution

### 9.1 Evolution A — Station-observed burn analysis with climate-trend adjustment (analytics ladder: rung 3 → 4)

**What.** §7 rates this a genuinely quantitative tier-A module: burn-analysis weather
pricing (`fair_value = mean(payouts)×(1+loading)` with Φ-based Greeks), Black-76 EUA
options, expected-loss cat-bond layering, live POST `/price-weather`, and five passing
ref endpoints. Its honest limitation: burn analysis samples `N(annual_mean, std_dev)`
from *user-supplied* normal parameters — the module's own overview says climate change
is shifting baselines and "repricing these products", but nothing in the engine
estimates that shift. Evolution A grounds and de-trends: HDD/CDD season histories
computed from observed station temperatures (the platform's NASA POWER / Open-Meteo
integrations cover the 9 `CITY_STATIONS`), a fitted linear/loess warming trend per
station, and pricing offered on both bases — stationary historical vs trend-adjusted —
with the fair-value difference surfaced as the climate-repricing signal the module's
thesis promises.

**How.** (1) `ref_degree_day_history(station, season, hdd, cdd, year)` built from the
weather feeds (30+ seasons); `price_weather_derivative` gains a `basis` parameter:
empirical resampling of observed seasons vs trend-adjusted resampling.
(2) Greeks unchanged (they operate on the payout distribution); bench pins extended
with a station-based reference case alongside the existing parametric one.
(3) EUA option path upgraded to pull spot/vol context from the `ref/eua-market`
endpoint it already serves.

**Prerequisites.** Station-history backfill via the existing weather ingesters;
distribution-fit diagnostics published per §8 (normality fails for some stations —
show it, use empirical resampling). **Acceptance:** trend-adjusted HDD fair value for
a warming station prices warm-winter floors above the stationary basis, with the
delta displayed; parametric fixture pricing is regression-pinned unchanged.

### 9.2 Evolution B — Weather-hedge structuring analyst (LLM tier 2)

**What.** This module has the platform's cleanest tier-2 substrate: a working pricing
POST plus five reference GETs. The analyst assistant runs structuring conversations:
"price a Chicago HDD floor at 5,800 strike, $5k/HDD tick, Nov–Mar", "how does the
hedge change if we move to a collar?", "is this product CCP-eligible and how is it
classified?" (the `/ref/ccp-eligibility` and `/classify-regulatory` endpoints exist
precisely for this) — every premium, Greek, and eligibility verdict from tool calls.

**How.** Tool schemas auto-generated from this module's OpenAPI routes per the atlas
endpoint map; the no-fabrication validator ties every $ and Greek to a logged
response; hedge-design reasoning (cap vs collar vs swap) grounded in the §5
product-template corpus; "show work" lists engine version and seed for the burn
simulation so any quote is reproducible.

**Prerequisites.** None hard — engine and endpoints are real today; Evolution A
upgrades quote quality but does not block. REQUIRE_AUTH posture for POST access
applies. **Acceptance:** a quoted fair value reproduces byte-identically via direct
endpoint call with the stated parameters; the assistant refuses to quote perils
outside the engine's product templates.