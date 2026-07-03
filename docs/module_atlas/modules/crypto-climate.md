# Crypto Climate Risk
**Module ID:** `crypto-climate` · **Route:** `/crypto-climate` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies cryptocurrency mining energy consumption and GHG intensity, benchmarks proof-of-work versus proof-of-stake consensus mechanisms, and assesses portfolio-level exposure to regulatory and reputational climate risk from digital asset holdings.

> **Business value:** Enables ESG teams and portfolio managers to quantify and disclose the climate impact of digital asset holdings, assess regulatory risk in PoW mining jurisdictions, and engage with crypto asset issuers on energy transition strategies.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `ASSET_TYPES`, `Btn`, `COUNTRIES`, `Inp`, `KpiCard`, `MECHANISMS`, `PIE_COLORS`, `Row`, `STANDARDS`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `countryIntensity` | `COUNTRIES.slice(0, 10).map((c, i) => ({` |
| `premiumData` | `['gold_standard', 'vcs', 'eu_gbs'].map((s, i) => ({` |
| `runAssess` | `() => call('/api/v1/crypto-climate/assess', {` |
| `runGeo` | `() => call('/api/v1/crypto-climate/mining-geography', {` |
| `runMica` | `() => call('/api/v1/crypto-climate/mica-compliance', {` |
| `runToken` | `() => call('/api/v1/crypto-climate/tokenised-green-assets', {` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/crypto-climate/assess` | `assess_crypto_asset` | api/v1/routes/crypto_climate.py |
| POST | `/api/v1/crypto-climate/mica-compliance` | `check_mica_compliance` | api/v1/routes/crypto_climate.py |
| POST | `/api/v1/crypto-climate/financed-emissions` | `calculate_financed_emissions` | api/v1/routes/crypto_climate.py |
| POST | `/api/v1/crypto-climate/portfolio` | `aggregate_portfolio` | api/v1/routes/crypto_climate.py |
| GET | `/api/v1/crypto-climate/ref/consensus-mechanisms` | `get_consensus_mechanisms` | api/v1/routes/crypto_climate.py |
| GET | `/api/v1/crypto-climate/ref/country-energy-profiles` | `get_country_energy_profiles` | api/v1/routes/crypto_climate.py |
| GET | `/api/v1/crypto-climate/ref/mica-requirements` | `get_mica_requirements` | api/v1/routes/crypto_climate.py |

### 2.3 Engine `crypto_climate_engine` (services/crypto_climate_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CryptoClimateEngine.assess_crypto_asset` | asset_input | Full climate assessment for a single crypto asset. |
| `CryptoClimateEngine.assess_mining_geography` | geo_input | Carbon footprint of a mining operation based on location distribution. |
| `CryptoClimateEngine.check_mica_compliance` | asset_input | EU MiCA Regulation 2023/1114 Art 66 compliance check. |
| `CryptoClimateEngine.assess_tokenised_green_asset` | asset_input | Tokenised Green Assets (RWA) assessment. |
| `CryptoClimateEngine.calculate_financed_emissions` | portfolio_input | PCAF Emerging Methodology for Crypto financed emissions. |
| `CryptoClimateEngine.aggregate_portfolio` | portfolio_input | Full crypto portfolio climate aggregation. |
| `CryptoClimateEngine._geography_adjusted_intensity` | country_dist | Return (weighted_renewable_pct, weighted_grid_carbon_gco2_kwh). |
| `CryptoClimateEngine._compute_pcaf_single` | outstanding_value, market_cap, network_energy_twh, grid_factor_gco2_kwh | Core PCAF attribution formula for a single crypto holding. |
| `CryptoClimateEngine._classify_climate_risk` | mechanism, grid_carbon, renewable_pct | Classify climate risk tier based on consensus mechanism and energy mix. |
| `CryptoClimateEngine._assess_defi_protocols` | tvl_usd | DeFi Protocol Carbon Intensity — TVL-weighted emissions. |
| `CryptoClimateEngine._portfolio_risk_tier` | risk_tiers | Determine portfolio-level risk tier from weighted distribution. |
| `CryptoClimateEngine._portfolio_recommendations` | tier, mica_score | Generate actionable portfolio-level recommendations. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Cambridge`, `academic`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_TYPES`, `COUNTRIES`, `MECHANISMS`, `PIE_COLORS`, `STANDARDS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Bitcoin Annual Energy (2024) | — | CCAF Bitcoin Electricity Consumption Index | Annualised network energy consumption comparable to Poland’s total electricity use |
| Bitcoin Carbon Intensity | — | CCRI 2024 | Emission intensity of Bitcoin mining based on geographic distribution of hashrate |
| Ethereum PoS GHG Reduction | — | Ethereum Foundation | Energy reduction achieved by Ethereum’s transition from Proof-of-Work to Proof-of-Stake |
| Renewable Mining Share | — | CCAF Miner Survey | Proportion of Bitcoin mining electricity sourced from renewables; contested and varies by study |
| Portfolio Digital Asset GHG | — | CCRI | Scope 3 Category 15 GHG intensity of digital asset portfolio holdings per $M invested |
- **CCAF hashrate and geographic distribution data** → Compute network energy consumption from hashrate × ASIC efficiency → **Total and country-weighted energy use**
- **IEA/national grid emission factors** → Weight by mining geography, compute blended grid EF → **Mining-weighted GHG intensity (gCO₂e/kWh)**
- **Portfolio digital asset holdings** → Multiply holding value by asset-specific GHG intensity → **Scope 3 Category 15 portfolio emissions**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/crypto-climate/ref/consensus-mechanisms** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['consensus_mechanisms', 'methodology_notes', 'last_updated'], 'n_keys': 3}`

**GET /api/v1/crypto-climate/ref/country-energy-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['country_profiles', 'total_countries', 'sources'], 'n_keys': 3}`

**GET /api/v1/crypto-climate/ref/mica-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'article', 'effective_date', 'competent_authority', 'compliance_levels', 'esma_technical_standards', 'cross_reference'], 'n_keys': 7}`

**GET /api/v1/crypto-climate/ref/rwa-frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'tokenisation_benefits', 'risks', 'key_regulation'], 'n_keys': 4}`

**POST /api/v1/crypto-climate/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_symbol', 'consensus_mechanism', 'energy', 'emissions', 'geography', 'mica_compliance', 'tokenised_green_asset', 'pcaf', 'climate_risk_tier', 'summary'], 'n_keys': 10}`

## 5 · Intermediate Transformation Logic
**Methodology:** Crypto GHG Intensity Model
**Headline formula:** `GHG_crypto = TotalHashrate × EnergyPerHash × GridEF_weighted`
**Standards:** ['Cambridge Centre for Alternative Finance (CCAF)', 'CCRI Crypto Carbon Ratings', 'GHG Protocol Scope 3 Cat.15']

**Engine `crypto_climate_engine` — extracted transformation lines:**
```python
energy_low = energy_central * 0.65
energy_high = energy_central * 1.5
energy_central = CBECI_NETWORK_TWH_CENTRAL * factor
energy_low = energy_central * 0.7
energy_high = energy_central * 1.4
annual_tco2e = (energy_central * 1e9) * (eff_grid_carbon / 1e6)
energy_per_tx_kwh = (energy_central * 1e9) / tx_count if tx_count > 0 else 0.0
gco2e_central = energy_per_tx_kwh * eff_grid_carbon
gco2e_low = gco2e_central * 0.5
gco2e_high = gco2e_central * 1.5
hashrate_th_s = geo_input.hashrate_eh_s * 1e6  # EH to TH
power_watts = hashrate_th_s * geo_input.hardware_efficiency_j_th  # W
energy_kwh_yr = power_watts * 8_760 / 1_000  # hours per year
energy_twh_yr = energy_kwh_yr / 1e9
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).