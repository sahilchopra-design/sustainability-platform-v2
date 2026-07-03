# Physical Risk Pricing
**Module ID:** `physical-risk-pricing` · **Route:** `/physical-risk-pricing` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrates climate physical risk premia into asset pricing using hazard-adjusted discount rates and expected loss modelling.

> **Business value:** Translates physical climate hazard into actionable pricing signals, enabling climate-adjusted bond/loan spreads and equity discount rates.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `COUNTRIES`, `Inp`, `KpiCard`, `PIE_COLORS`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seededRandom` | `sr; // alias for backward compat` |
| `base` | `hashStr(country + assetClass + ngfs) % 997;` |
| `composite` | `Math.round(acutePerils.reduce((sum, p) => sum + p.score, 0) / acutePerils.length);` |
| `ealPct` | `(s(10) * 0.8 + 0.1).toFixed(2);` |
| `base` | `hashStr(country + assetClass + 'natcat') % 997;` |
| `data` | `returnPeriods.map((rp, ri) => {` |
| `assetVal` | `100; // $M reference` |
| `tableRows` | `returnPeriods.map((rp, ri) => {` |
| `base` | `hashStr(country + assetClass + ngfs + 'fin') % 997;` |
| `ealPct` | `s(1) * 0.8 + 0.1;` |
| `pml100` | `s(2) * 0.15 + 0.05;` |
| `riskPremium` | `Math.round(s(4) * 80 + 20);` |
| `lossDistData` | `[10, 25, 50, 100, 200, 500].map((rp, i) => ({` |
| `insuredPct` | `Math.round(s(10) * 40 + 30);` |
| `base` | `hashStr(country + assetClass + 'strand') % 997;` |
| `barData` | `scenarios.map((sc, si) => {` |
| `base` | `hashStr(country + assetClass + 'ngfs') % 997;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `physical_risk_pricing_engine` (services/physical_risk_pricing_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | v, lo, hi |  |
| `_composite_baseline_score` | profile | Weighted composite of all peril baselines. |
| `_determine_risk_tier` | composite_score |  |
| `_expected_annual_loss` | country_iso, asset_class, asset_value_usd, amplifiers | EAL = Σ_perils [ annualised_loss_rate_peril × vulnerability_coeff × amplifier × asset_value ] |
| `price_physical_risk` | entity_id, asset_class, country_iso, asset_value_usd, ngfs_scenario, time_horizon | Full physical risk pricing for a single asset. |
| `calculate_return_period_losses` | country_iso, asset_class, asset_value_usd | Returns full loss table: peril × return period → expected loss USD and %. |
| `calculate_stranding_probability` | country_iso, asset_class, ngfs_scenario, time_horizon | Estimates stranding probability for an asset given chronic physical risk |
| `get_country_physical_risk_profile` | country_iso | Returns full baseline risk profile for a country. |
| `get_all_country_profiles` |  |  |
| `get_damage_functions` |  |  |
| `get_ngfs_amplifiers` |  |  |
| `get_insurance_gaps` |  |  |
| `get_risk_premium_table` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Swiss`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COUNTRIES`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Baseline Spread (bps) | — | Market Data | Pre-climate credit spread for reference asset. |
| Climate Risk Premium (bps) | — | Physical Hazard Engine | Incremental spread from modelled physical risk exposure under RCP 8.5. |
| Climate VaR (95%) | — | Loss Distribution Model | 95th percentile climate-adjusted value-at-risk over 30-year horizon. |
- **Hazard scores + credit fundamentals + market spreads** → PD uplift mapping; LGD adjustment; climate premium calculation → **Climate-adjusted pricing outputs and valuation adjustments**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/physical-risk-pricing/ref/country-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'countries', 'metadata'], 'n_keys': 3}`

**GET /api/v1/physical-risk-pricing/ref/damage-functions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['acute_perils', 'vulnerability_coefficients', 'return_period_probabilities', 'asset_classes', 'notes'], 'n_keys': 5}`

**GET /api/v1/physical-risk-pricing/ref/insurance-gaps** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['data', 'interpretation', 'sources', 'coverage_note'], 'n_keys': 4}`

**GET /api/v1/physical-risk-pricing/ref/ngfs-amplifiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scenarios', 'horizons', 'amplifiers', 'interpretation', 'sources'], 'n_keys': 5}`

**GET /api/v1/physical-risk-pricing/ref/risk-premium-table** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['risk_premium_table', 'risk_tier_thresholds', 'sources', 'notes'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Risk Premium
**Headline formula:** `δr = PD_climate × LGD × (1 + β_hazard)`
**Standards:** ['NGFS Physical Risk Scenarios', 'ECB Climate Risk Stress Test 2022']

**Engine `physical_risk_pricing_engine` — extracted transformation lines:**
```python
l1 = rp_table[rp1] / 100 * baseline * amp * vuln
l2 = rp_table[rp2] / 100 * baseline * amp * vuln
avg_amp = sum(amplifiers[p] for p in ACUTE_PERILS if p in amplifiers) / len(ACUTE_PERILS)
composite_score_stressed = _clamp(composite_score * avg_amp)
avg_insured = sum(gap_ratios.values()) / len(gap_ratios) if gap_ratios else 0.1
insurance_gap_usd = eal_usd * (1.0 - avg_insured)
climate_var_usd = max(climate_var_usd, eal_usd * 3.0)  # floor at 3× EAL
scaled_loss_pct = loss_pct * baseline * vuln
loss_usd = scaled_loss_pct / 100 * asset_value_usd
stranding_prob = 1.0 / (1.0 + math.exp(-k * (composite_chronic - x0)))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).