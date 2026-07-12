# Crypto Climate Risk
**Module ID:** `crypto-climate` · **Route:** `/crypto-climate` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies cryptocurrency mining energy consumption and GHG intensity, benchmarks proof-of-work versus proof-of-stake consensus mechanisms, and assesses portfolio-level exposure to regulatory and reputational climate risk from digital asset holdings.

> **Business value:** Enables ESG teams and portfolio managers to quantify and disclose the climate impact of digital asset holdings, assess regulatory risk in PoW mining jurisdictions, and engage with crypto asset issuers on energy transition strategies.

**How an analyst works this module:**
- Select digital asset or portfolio from the asset browser
- Energy Dashboard tab shows real-time hashrate, energy consumption, and efficiency trends
- GHG Intensity tab computes emission intensity per asset with geographic mining distribution
- PoW vs PoS Comparison tab benchmarks consensus mechanism energy and GHG profiles
- Portfolio Exposure tab computes Scope 3 Category 15 digital asset emissions
- Regulatory Risk tab assesses jurisdiction-specific crypto mining regulatory risk flags

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `ASSET_TYPES`, `ASSET_TYPE_API`, `Badge`, `Btn`, `COUNTRIES`, `CRYPTO_API`, `Inp`, `KpiCard`, `MECHANISMS`, `MECHANISM_API`, `MICA_REQ_LABELS`, `PIE_COLORS`, `Row`, `STANDARDS`, `STANDARD_API`, `Section`, `Sel`, `StatusBadge`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MECHANISMS` | 5 | `label` |
| `ASSET_TYPES` | 4 | `label` |
| `STANDARDS` | 4 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `CRYPTO_API` | ``${API}/api/v1/crypto-climate`;` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `countryIntensity` | `COUNTRIES.slice(0, 10).map((c, i) => ({` |
| `premiumData` | `['gold_standard', 'vcs', 'eu_gbs'].map((s, i) => ({` |
| `share` | `Math.max(0, Math.min(100, parseFloat(miningShare) \|\| 0));` |

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
| `CryptoClimateEngine.assess_crypto_asset` | asset_input | Full climate assessment for a single crypto asset. Combines energy estimation, GHG intensity, geography-adjusted emissions, MiCA compliance, and optional PCAF financed emissions. |
| `CryptoClimateEngine.assess_mining_geography` | geo_input | Carbon footprint of a mining operation based on location distribution. Uses hashrate × efficiency to derive annual energy, then weights by country grid carbon intensity for total tCO2e/yr. |
| `CryptoClimateEngine.check_mica_compliance` | asset_input | EU MiCA Regulation 2023/1114 Art 66 compliance check. Determines the required compliance level based on market cap and scores the issuer against disclosed sustainability indicators. |
| `CryptoClimateEngine.assess_tokenised_green_asset` | asset_input | Tokenised Green Assets (RWA) assessment. Evaluates tokenisation premium, on-chain verification quality, and alignment with green finance standards (ICMA GBP, EU GBS, Art 6 ITMOs). |
| `CryptoClimateEngine.calculate_financed_emissions` | portfolio_input | PCAF Emerging Methodology for Crypto financed emissions. Attribution formula (PCAF Part D analogy): Financed emissions = (outstanding_value / market_cap) × network_energy × grid_factor DQS 3 (estimated data with supporting evidence) or 4 (estimated, limited evidence). |
| `CryptoClimateEngine.aggregate_portfolio` | portfolio_input | Full crypto portfolio climate aggregation. Returns weighted-average gCO2e/tx, total MWh/yr, total tCO2e/yr, MiCA compliance status, and climate risk tier distribution. |
| `CryptoClimateEngine._geography_adjusted_intensity` | country_dist | Return (weighted_renewable_pct, weighted_grid_carbon_gco2_kwh). |
| `CryptoClimateEngine._compute_pcaf_single` | outstanding_value, market_cap, network_energy_twh, grid_factor_gco2_kwh | Core PCAF attribution formula for a single crypto holding. |
| `CryptoClimateEngine._classify_climate_risk` | mechanism, grid_carbon, renewable_pct | Classify climate risk tier based on consensus mechanism and energy mix. |
| `CryptoClimateEngine._assess_defi_protocols` | tvl_usd | DeFi Protocol Carbon Intensity — TVL-weighted emissions. Assumes Ethereum PoS as base network (0.01 gCO2e/tx equivalent). Gas fees proxy for relative compute intensity. |
| `CryptoClimateEngine._portfolio_risk_tier` | risk_tiers | Determine portfolio-level risk tier from weighted distribution. |
| `CryptoClimateEngine._portfolio_recommendations` | tier, mica_score | Generate actionable portfolio-level recommendations. |

**Engine `crypto_climate_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `CBECI_NETWORK_TWH_CENTRAL` | `120.0` |
| `CBECI_NETWORK_TWH_LOW` | `80.0` |
| `CBECI_NETWORK_TWH_HIGH` | `180.0` |
| `CBECI_EFFICIENCY_LOW_J_TH` | `20.0` |
| `CBECI_EFFICIENCY_CENTRAL_J_TH` | `40.0` |
| `CBECI_EFFICIENCY_HIGH_J_TH` | `80.0` |
| `BTC_ANNUAL_TX` | `300000000` |

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

**POST /api/v1/crypto-climate/financed-emissions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['portfolio_id', 'reporting_period', 'total_financed_emissions_tco2e', 'portfolio_financed_emissions_intensity_tco2e_per_musd', 'holding_breakdown', 'pcaf_methodology', 'data_quality_score', 'dqs_rationale', 'limitations'], 'n_keys': 9}`

**POST /api/v1/crypto-climate/mica-compliance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/crypto-climate/mining-geography** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['hashrate_eh_s', 'hardware_efficiency_j_th', 'annual_energy_kwh_yr', 'annual_energy_twh_yr', 'total_tco2e_yr', 'weighted_renewable_pct', 'weighted_grid_carbon_gco2_kwh', 'country_breakdown', 'renewable_counterfactual_tco2e', 'additional_tco2e_vs_renewable', 'assessment_ye`

## 5 · Intermediate Transformation Logic
**Methodology:** Crypto GHG Intensity Model
**Headline formula:** `GHG_crypto = TotalHashrate × EnergyPerHash × GridEF_weighted`

Total Bitcoin network hashrate (EH/s) is multiplied by ASIC efficiency (J/TH) to compute network energy consumption. Grid emission factor is weighted by geographic distribution of mining activity (CCAF miner survey). Ethereum (PoS post-Merge) GHG estimated at <0.002 TWh/yr vs Bitcoin ~130 TWh/yr. Portfolio exposure = holding value in PoW assets × GHG intensity per $M invested.

**Standards:** ['Cambridge Centre for Alternative Finance (CCAF)', 'CCRI Crypto Carbon Ratings', 'GHG Protocol Scope 3 Cat.15']
**Reference documents:** Cambridge Centre for Alternative Finance â€” Bitcoin Electricity Consumption Index; Crypto Carbon Ratings Institute (CCRI) Digital Assets Report 2024; GHG Protocol Corporate Value Chain Standard â€” Category 15 Investments; EU MiCA Regulation â€” Sustainability Disclosure Requirements

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
country_energy_kwh = energy_kwh_yr * (share_pct / 100.0)
renewable_tco2e = energy_kwh_yr * 28.0 / 1e6  # Iceland-equivalent grid (28 gCO2/kWh)
avoided_tco2e = total_tco2e - renewable_tco2e
market_cap_eur = market_cap * 0.92  # approximate USD→EUR
score = (met / len(required_reqs) * 100) if required_reqs else 0.0
total_premium = base_premium * quality_mult + verification_uplift
network_energy_twh = CBECI_NETWORK_TWH_CENTRAL * factor
weight = value / total_value
holding_energy_mwh = result.network_energy_twh_yr_central * 1e6 * weight
holding_tco2e = result.annual_network_tco2e * weight
avg_mica = sum(mica_scores) / len(mica_scores) if mica_scores else 0.0
attribution = outstanding_value / market_cap
dqs = 3 if market_cap > 1_000_000_000 else 4  # lower DQS for large-cap (better data)
total_network_tco2e = (network_energy_twh * 1e9) * (grid_factor_gco2_kwh / 1e6)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide's *Crypto GHG Intensity Model* — `GHG_crypto = TotalHashrate × EnergyPerHash ×
GridEF_weighted` — is genuinely implemented, **but in the backend engine, not the page**. The React
`CryptoClimatePage.jsx` renders hard-coded/seeded chart data for its default view and calls the engine
only on user action (`runAssess`, `runGeo`, `runMica`, `runToken`). So the *methodology* is real
(`crypto_climate_engine.py`: CBECI network energy, geography-weighted grid EF, per-tx emissions, MiCA
scoring, PCAF financed emissions); the *default dashboard numbers* are placeholders. This deep dive
documents both layers and flags the placeholder data.

### 7.1 What the module computes (backend engine — the real model)

`CryptoClimateService.assess_crypto_asset` executes the guide's formula:

```python
# 1. Network energy (TWh/yr) — CBECI defaults for PoW; scaled factors for PoS-family
PoW:  energy = CBECI_NETWORK_TWH_{low,central,high}
else: energy = CBECI_central × {PoS:0.0008, DPoS:0.0005, PoA:0.0003, PoH:0.0002}
# 2. Geography-adjusted grid EF (hashrate-weighted over country profiles)
eff_grid_carbon = Σ_c share_c · grid_gCO2/kWh_c
# 3. Annual network emissions
annual_tCO2e = (energy_TWh · 1e9 kWh) · (eff_grid_carbon gCO2/kWh / 1e6)
# 4. Per-transaction
energy_per_tx_kwh = energy·1e9 / tx_count
gCO2e_per_tx = clamp(ref_low, energy_per_tx·eff_grid, ref_high)   # bounded to consensus ref range
```

MiCA compliance (`check_mica_compliance`) and PCAF financed emissions (`_compute_pcaf_single`,
attribution = outstanding_value / market_cap) round out the assessment.

### 7.2 Parameterisation / scoring rubric

| Parameter | Value | Provenance |
|---|---|---|
| PoW gCO₂e/tx | low 300 / central 600 / high 900 | **real** — Cambridge CBECI 2024 |
| PoS gCO₂e/tx | 0.005 / 0.01 / 0.05 | **real** — Ethereum Foundation post-Merge |
| PoH (Solana) energy/tx | 0.000006 kWh | **real** — Solana Foundation 2023 (~0.00051 kWh/tx cited) |
| Grid EF US / CN / KZ | 386 / 580 / 682 gCO₂/kWh | **real** — EIA/NEA/KEGOC via CCAF 2024 |
| Mining share US / CN / KZ | 38% / 21% / 13% | **real** — CCAF hashrate map |
| PoS energy scale factors | 0.0008 / 0.0005 / 0.0003 / 0.0002 | engine assumption (order-of-magnitude) |
| **Frontend** `portfolioHoldings` | BTC 110.2 TWh, ETH 0.008, tCO₂e values | hard-coded demo |
| **Frontend** `piData` (PoW 65 / PoS 30 / Other 5) | consensus mix | hard-coded demo |
| **Frontend** `countryIntensity`, `premiumData`, `competitorEnergy.Target` | `seed()`-generated | synthetic seeded |

The engine constants are authentic and citable; the page's default charts are demo values, some
seeded via `seed(s)=frac(sin(s+1)×10⁴)`.

### 7.3 Calculation walkthrough

Page load → static/seeded charts render immediately. User enters asset params (mechanism, hashrate,
daily tx) → `runAssess` POSTs to `/crypto-climate/assess` → engine returns network energy band,
gCO₂e/tx band, annual tCO₂e, MiCA level+score+gaps, optional PCAF financed emissions. `runGeo`
returns the hashrate-weighted grid EF; `runMica` the MiCA Art-66 indicator set; `runToken` the RWA
tokenisation premium.

### 7.4 Worked example (Bitcoin, engine)

Inputs: PoW, `energy_central = 120 TWh/yr`, US/CN/KZ hashrate mix, `tx_count = 300M`.
```
eff_grid_carbon ≈ 0.38·386 + 0.21·580 + 0.13·682 + … ≈ 470 gCO2/kWh   (weighted)
annual_tCO2e   = 120·1e9 kWh · 470/1e6 = 120e9·4.70e-4 = 56.4M tCO2e
energy_per_tx  = 120e9 / 300e6 = 400 kWh/tx
gCO2e_per_tx   = 400·470 = 188,000 → clamp to [300,900] → 900 gCO2e/tx   (ref-bounded)
```
The clamp to the CBECI reference band prevents the naive per-tx figure (which double-counts allocated
network energy) from producing an implausibly high number — a sensible guardrail.

### 7.5 Data provenance & limitations

- **Backend: real** CBECI energy, real per-country grid EFs and hashrate shares, real consensus GHG
  bands — all cited inline. PoS scale factors and tx-count defaults are engine assumptions.
- **Frontend default view: demo/seeded** — `portfolioHoldings`, `piData` hard-coded; `countryIntensity`,
  `premiumData` and the "Target" energy bar are `seed()`-generated. Only live user assessments hit the
  real engine.
- Per-tx emissions are inherently ambiguous (transactions don't consume energy — miners do); the
  clamp acknowledges this by bounding to published ranges.

**Framework alignment:** Cambridge CBECI / CCAF (network energy + hashrate geography) · Ethereum
Foundation (PoS post-Merge ~99.95% reduction) · GHG Protocol Scope 3 Cat 15 & **PCAF** emerging crypto
methodology (financed emissions = outstanding/market-cap × network emissions) · EU **MiCA** Reg
2023/1114 Art 66 sustainability indicators. The engine implements all four; the page surfaces them on
demand over an otherwise demo dashboard.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (The engine *is* implemented; this section
specifies the upgrades needed to make the page's default view production-grade and to strengthen the
per-tx allocation.)

**8.1 Purpose & scope.** Portfolio-level Scope 3 Cat 15 emissions and MiCA sustainability disclosure
for digital-asset holdings, plus asset-level PoW/PoS benchmarking, calibrated to live network data.

**8.2 Conceptual approach.** CBECI-style **bottom-up hardware-efficiency energy model** (hashrate ÷
ASIC efficiency) with a **hashrate-weighted marginal grid-EF** overlay, then PCAF attribution — the
approach used by CCRI (Crypto Carbon Ratings Institute) and the CCAF index; PoS uses a validator-count
× node-power model rather than a scale-factor.

**8.3 Mathematical specification.**
```
PoW:  E_network(t) = Hashrate(t) / EfficiencyMix(t)                 # J/TH → kWh
PoS:  E_network(t) = N_validators · P_node · 8760h                  # node-power model
EF_eff(t) = Σ_c share_c(t) · GridEF_c(t)                            # CCAF hashrate map
Network_tCO2e(t) = E_network(t) · EF_eff(t)
Financed_tCO2e_i = (Outstanding_i / MarketCap_i) · Network_tCO2e    # PCAF attribution
Portfolio = Σ_i Financed_tCO2e_i ;  Intensity = Portfolio / AUM_$M
```

| Parameter | Source |
|---|---|
| Hashrate `Hashrate(t)` | blockchain.com / CCAF live feed |
| ASIC efficiency mix | CCAF miner-hardware survey (J/TH) |
| Hashrate geography `share_c` | CCAF mining map |
| Grid EF `GridEF_c` | Ember / IEA (real; in engine) |
| Validator counts / node power | beaconcha.in / client telemetry |
| Outstanding / market cap | CoinGecko / CMC |

**8.4 Data requirements.** Live hashrate, ASIC efficiency distribution, hashrate-by-country, grid EFs
(exist), validator counts, holdings and market caps. Vendors: CoinMetrics, CCRI; free: CCAF, Ember,
CoinGecko. Engine already holds grid EFs and consensus bands.

**8.5 Validation & benchmarking.** Reconcile network energy to CBECI's published band (BTC ~120–150
TWh/yr); benchmark per-asset intensity against CCRI ratings; backtest post-Merge ETH drop (~99.95%);
sensitivity to hashrate-geography assumptions (China share uncertainty).

**8.6 Limitations & model risk.** Hashrate geography is a survey estimate with wide error bars; ASIC
efficiency mix drifts with hardware cycles; PoS node-power is poorly observed. Fallback: report
low/central/high energy bands (as the engine already does) rather than point estimates.

## 9 · Future Evolution

### 9.1 Evolution A — Default dashboard from the real engine, live CBECI refresh (analytics ladder: rung 2 → 3)

**What.** The methodology here is real and citably parameterized — the engine
implements `GHG = Hashrate × EnergyPerHash × GridEF_weighted` with authentic CBECI
energy bands, CCAF hashrate geography (US 38%/CN 21%/KZ 13%), real per-country grid
EFs, MiCA scoring, and PCAF financed emissions; 6 of 8 harness checks pass. But §7
flags the split: the page's *default* view renders hard-coded/seeded charts
(`portfolioHoldings` BTC 110.2 TWh, `piData`, seeded `countryIntensity` and
`premiumData`) and only touches the engine on explicit user action. Evolution A
makes the engine the default and keeps its constants current.

**How.** (1) Default wiring: page-load charts populate from
`GET /ref/consensus-mechanisms` and `/ref/country-energy-profiles` plus a default
`POST /assess` for BTC/ETH — deleting the hard-coded holdings and the seeded
overlays. (2) Freshness: CBECI publishes a live API for network energy estimates and
the CCAF mining map updates periodically — a scheduled ingest keeps the engine's
constants versioned with `as_of` dates instead of frozen 2024 values, the rung-3
discipline for a module whose headline number (Bitcoin ~TWh/yr) moves with hashprice
cycles. (3) Fixture the skipped `POST /mica-compliance` sweep. (4) Portfolio tab:
holdings from the platform's portfolio layer through `POST /portfolio`, so Scope 3
Cat 15 exposure reflects actual positions.

**Prerequisites.** CBECI API integration (free, attribution required); frontend
seed purge. **Acceptance:** the default dashboard's network-energy figure matches
the engine's CBECI value with its date stamp; zero hard-coded TWh values remain in
the page; `/mica-compliance` passes the sweep.

### 9.2 Evolution B — MiCA sustainability-disclosure drafter (LLM tier 2)

**What.** MiCA Article 66 requires crypto-asset service providers to publish
sustainability indicators — a new, template-poor disclosure that this module's
engine already scores. Evolution B drafts it: for a given asset or book, the
assistant runs `POST /assess`, `/financed-emissions`, and `/mica-compliance`, then
writes the indicator disclosure — network energy with the CBECI low/central/high
band (not a false point estimate), geography-weighted emission intensity with the
hashrate-share table, per-transaction figures with the engine's own clamp caveat
("transactions don't consume energy — miners do"), and the PCAF attribution
arithmetic — every number tool-traced, every methodological ambiguity disclosed as
the engine's documentation does.

**How.** Tool schemas over the 7 operations; `GET /ref/mica-requirements` provides
the requirement checklist the draft is structured against, so coverage is
verifiable requirement-by-requirement. The band-not-point discipline is the key
prompt rule: crypto emissions estimates carry wide uncertainty and the engine
returns ranges — the drafter must never collapse them. Output through the
report-studio layer.

**Prerequisites.** Evolution A's default wiring and the `/mica-compliance` fixture;
MiCA requirement text current in the ref endpoint. **Acceptance:** a draft
disclosure covers every `/ref/mica-requirements` item or marks it unmet; all
emission figures quote the engine's low/central/high band; the PCAF attribution in
the draft reproduces from holdings × the engine's arithmetic.