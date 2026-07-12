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
