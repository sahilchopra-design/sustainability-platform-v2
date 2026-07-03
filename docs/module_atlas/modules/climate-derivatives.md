# Climate Derivatives Market
**Module ID:** `climate-derivatives` · **Route:** `/climate-derivatives` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate financial derivatives overview covering temperature futures (CME Degree Days), precipitation swaps, hurricane index products, and weather risk management for corporates.

> **Business value:** Weather derivatives protect companies against revenue volatility from temperature variability — energy companies from warm winters (reduced heating demand), utilities from cool summers (reduced cooling demand), agriculture from rainfall extremes. Climate change is shifting baseline temperatures, repricing these products.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `CITY_STATIONS`, `Inp`, `KpiCard`, `Row`, `Section`, `Sel`, `TABS`

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
| `base` | `hashStr(productType + city + 'catbond');` |
| `spread` | `Math.round(s(2) * 400 + 150);` |
| `attach` | `parseFloat((s(3) * 8 + 2).toFixed(1));` |

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
| `_norm_cdf` | x | Cumulative standard normal distribution (Abramowitz & Stegun approximation). |
| `_norm_pdf` | x | Standard normal PDF. |
| `_generate_burn_payouts` | mean, std_dev, strike, contract_type, tick_usd, n_years | Simulate n_years historical payouts for burn analysis. |
| `price_weather_derivative` | underlying, city_station, contract_type, strike, notional_usd, tenor_days | Price a weather derivative using burn analysis. |
| `price_eua_option` | option_type, strike, spot, tenor_years, volatility, risk_free_rate | Price an EUA (EU Allowance) option using Black-Scholes-Merton adapted for commodity. |
| `structure_cat_bond` | peril, country, attachment_point_usd_m, exhaustion_point_usd_m, notional_usd_m, tenor_years | Structure a catastrophe bond and compute expected loss, spread, and SPV details. |
| `classify_regulatory` | product_type, counterparty_type, jurisdiction | Classify a climate-linked derivative under EMIR / MiFID II / ISDA documentation. |
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

## 5 · Intermediate Transformation Logic
**Methodology:** Weather derivative pricing
**Headline formula:** `Fair_value = E[Payout(index)] / discount; HDD = max(0, 65-T_mean); CDD = max(0, T_mean-65)`
**Standards:** ['CME Degree Day Futures', 'WRMA', 'Black-Scholes for weather options']

**Engine `climate_derivatives_engine` — extracted transformation lines:**
```python
k = 1.0 / (1.0 + 0.3275911 * x)
y = 1.0 - (((((1.061405429 * k - 1.453152027) * k) + 1.421413741)
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
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |
| `crrem` | table:exc |