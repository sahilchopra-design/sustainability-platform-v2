## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded solely in
`backend/services/eu_ets_engine.py` and `backend/api/v1/routes/eu_ets.py`.)*

### 7.1 What the domain computes

`EUETSEngine` implements five analytic services for the EU Emissions Trading System
(Directive 2003/87/EC as amended by Directive 2023/959 "Fit for 55"):

1. **Free allocation** (`POST /free-allocation`) — Phase-4 benchmark-based allocation:

```
bm_value(year)   = max(0, benchmark_2021 − annual_reduction × (year − 2021))
preliminary      = historical_activity_level × bm_value
final_allocation = preliminary × CL_factor × CSCF × CBAM_factor
auction_exposure = max(0, HAL × benchmark_2021 − final_allocation)
auction_cost     = auction_exposure × carbon_price_eur
```

2. **Compliance position** (`POST /compliance`) — surrender-vs-holdings arithmetic:
   `surplus_deficit = (free + purchased + banked) − verified_emissions`; deficits carry
   `purchase_cost = |deficit| × price` plus `penalty = |deficit| × €100/tCO₂` (the Art. 16(3)
   excess-emissions penalty, coded as a flat 100.0).
3. **Carbon price forecast** (`POST /carbon-price-forecast`) — table lookup of 5 scenario paths
   plus `CAGR = (P₂₀₅₀/P_current)^(1/25) − 1` and a fixed 35% annual volatility proxy.
4. **Cap trajectory** (`POST /cap-trajectory`) — linear-reduction-factor schedule applied to the
   2021 base cap (reduction is always `base_cap × LRF%`, i.e. linear in the *2021* cap, matching
   the Directive's fixed-quantity LRF design rather than compounding).
5. **ETS2 readiness** (`POST /ets2-readiness`) — buildings/road-transport fuel-distributor
   assessment: fuel-volume → emissions → allowance cost, pass-through %, and a 100-point
   compliance-readiness score (see §7.5 caveat).

### 7.2 Parameterisation

**Product benchmarks** (tCO₂/t product; source cited in code: Commission Decision (EU) 2021/927;
DB-first lookup of `ets_product_benchmarks` with hardcoded fallback, per GAP-012):

| Product | benchmark_2021 | annual_reduction | Product | benchmark_2021 | annual_reduction |
|---|---|---|---|---|---|
| hot_metal | 1.328 | 0.024 | ammonia | 1.619 | 0.029 |
| sintered_ore | 0.171 | 0.003 | hydrogen | 8.850 | 0.160 |
| coke | 0.286 | 0.005 | aluminium | 1.514 | 0.027 |
| cement_clinker | 0.766 | 0.015 | paper | 0.318 | 0.006 |
| lime | 0.954 | 0.017 | refinery_products | 0.0295 (tCO₂/CWT) | 0.0005 |
| float_glass | 0.453 | 0.008 | heat / fuel benchmark | 62.3 / 56.1 (tCO₂/TJ) | 1.13 / 1.02 |

**Cap & MSR parameters** (`ETS_CAP_PARAMETERS`): base cap 1,571.6 Mt (2021, stationary); LRF 2.2%
(2021–23) → 4.3% (2024–27) → 4.4% (2028+); MSR intake 24%, TNAC thresholds 833/400 Mt; ETS2 start
2027 with ≈600 Mt initial cap. These match the amended MSR Decision (EU) 2015/1814 and
Directive 2023/959.

**Carbon price scenarios** (EUR/tCO₂e; code comment cites NGFS Phase IV + IEA WEO 2024 + EU
Climate Target Plan modelling — the specific numbers are the platform's calibration):

| Scenario | 2025 | 2030 | 2035 | 2040 | 2050 |
|---|---|---|---|---|---|
| EU_REFERENCE | 80 | 110 | 150 | 200 | 300 |
| FIT_FOR_55 | 85 | 130 | 180 | 250 | 400 |
| NET_ZERO_2050 | 90 | 150 | 220 | 320 | 500 |
| DELAYED_ACTION | 70 | 90 | 130 | 200 | 350 |
| CURRENT_POLICY | 75 | 85 | 95 | 110 | 130 |

**CBAM free-allocation phase-out** (Regulation (EU) 2023/956 Art. 31): 97.5% (2026) → 95 → 90 →
82.5 → 75 (2030) → 62.5 → 50 → 37.5 → 25 → 0% (2035), applied only when the installation's sector
is in `CBAM_SECTORS` = {cement, iron_steel, aluminium, fertilisers, electricity, hydrogen}.

**Carbon-leakage tiers** (Delegated Decision (EU) 2019/708): HIGH → free-allocation factor 1.00;
MEDIUM → 0.30; LOW → 0.00. The allocation calculator uses the boolean shortcut
`cl_factor = 1.0 if carbon_leakage_listed else 0.3`.

**ETS2 emission factors** (kgCO₂/litre; code cites IPCC 2006 Vol.2 Ch.3 / EEA): diesel 2.640,
petrol 2.319, LPG 1.635, heating oil 2.630, kerosene 2.520, HFO 3.174, biofuel blend 1.450;
natural gas 2.750 kg/kg (2.020 kg/m³); hydrogen and e-fuel 0.0 and flagged `ets2_covered: False`.

### 7.3 Calculation walkthrough

Free allocation: the route passes the request straight to `calculate_free_allocation`. The
benchmark declines linearly from its 2021 value; CSCF is hardcoded 1.0 ("simplified — 1.0 if cap
not exceeded"); the CBAM factor is looked up by year (1.0 pre-2026, 0.0 for years > 2035 outside
the table). Note `auction_exposure` compares final allocation against activity × the **2021**
benchmark (a proxy for emissions at benchmark intensity), not verified emissions — verified
emissions enter only via the separate compliance endpoint.

### 7.4 Worked example — cement clinker plant, 2030

Inputs: 1,000,000 t clinker/yr, sector `cement` (CBAM-covered), on the CL list, €80/tCO₂.

| Step | Computation | Result |
|---|---|---|
| Benchmark 2030 | 0.766 − 0.015 × 9 | 0.631 tCO₂/t |
| Preliminary | 1,000,000 × 0.631 | 631,000 tCO₂ |
| CL factor / CSCF | listed → 1.0 / 1.0 | — |
| CBAM factor 2030 | phase-out table | 0.750 |
| Final allocation | 631,000 × 0.750 | **473,250 tCO₂** |
| Auction exposure | max(0, 1,000,000 × 0.766 − 473,250) | **292,750 tCO₂** |
| Auction cost | 292,750 × €80 | **€23,420,000** |

If the same installation then reports 700,000 tCO₂ verified emissions with only its 473,250 free
allocation held, `/compliance` returns deficit = −226,750 tCO₂, purchase cost €18.14M, and penalty
exposure 226,750 × €100 = **€22.675M**.

### 7.5 ETS2 readiness rubric — and a live code defect

Readiness starts at 100 and deducts: no MRV system −25, no monitoring plan −20, no registry
account −20, no verified report −20, data quality "estimated" −15 ("calculated" −5). Pass-through
is 85% for road fuels, 70% for heating fuels, 60% otherwise; consumer impact =
`price × EF / 1000` €/litre.

**Defect (documented, not fixed here):** `assess_ets2_readiness` references
`self.ETS2_EMISSION_FACTORS`, `self.ETS2_PRICE_CORRIDOR`, and `self.ETS2_COMPLIANCE_CALENDAR`,
but those names are **module-level constants, not class attributes** — the method raises
`AttributeError` when invoked, so `POST /ets2-readiness` returns a 500 as written. Two further
latent bugs behind it: the corridor lookup indexes `corridor["floor"]` while the table's keys are
`floor_eur`/`ceiling_eur`, and the recommendations call `.get()` on `ETS2_COMPLIANCE_CALENDAR`,
which is a *list*. The four other endpoints are unaffected.

### 7.6 Data provenance & limitations

- No synthetic PRNG data anywhere in this domain — all constants are transcriptions of published
  EU regulatory values (benchmarks, LRF, MSR, CBAM schedule) plus scenario price calibrations.
- Benchmark reference endpoints are **DB-first** (`ets_product_benchmarks`, period-aware:
  2026–2030 values after 2026-01-01) with hardcoded 2021–2025 fallback.
- Simplifications: CSCF fixed at 1.0 (no cross-sectoral correction modelling); carbon-leakage
  treatment is binary (1.0/0.3) rather than the trade-intensity × emission-intensity test of
  Decision 2019/708; price forecast is pure table lookup (no stochastic process — volatility is a
  reported constant 35%, not used in any simulation); cap trajectory ignores MSR intake dynamics
  even though MSR parameters are exposed via `/ref/cap-parameters`; penalty is flat €100/tCO₂
  (the Directive indexes it to inflation from a €100 base).

### 7.7 Framework alignment

- **EU ETS Directive 2003/87/EC + 2023/959** — cap trajectory (LRF 2.2→4.3→4.4%), Art. 16 penalty,
  ETS2 Art. 30a–30j calendar and Art. 30d price corridor (€45 trigger; the code models it as a
  €45–60 floor/ceiling band).
- **Delegated Regulation (EU) 2019/331 & Decision (EU) 2021/927** — benchmark-based free
  allocation: real Phase-4 mechanics multiply activity level × benchmark × CL factor × CSCF; the
  engine reproduces that chain with published benchmark values.
- **CBAM Regulation (EU) 2023/956 Art. 31** — the exact 2026–2035 free-allocation phase-out
  schedule, applied multiplicatively to CBAM sectors.
- **MSR Decision (EU) 2015/1814 (amended)** — intake rate and TNAC thresholds exposed as
  reference data (not yet wired into the cap simulation).
- **NGFS / IEA WEO** — cited as calibration anchors for the five scenario price paths.
