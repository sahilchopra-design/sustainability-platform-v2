# Api::Eu_Ets
**Module ID:** `api::eu_ets` · **Route:** `/api/v1/eu-ets` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eu-ets/free-allocation` | `calculate_free_allocation` | api/v1/routes/eu_ets.py |
| POST | `/api/v1/eu-ets/compliance` | `assess_compliance` | api/v1/routes/eu_ets.py |
| POST | `/api/v1/eu-ets/carbon-price-forecast` | `forecast_carbon_price` | api/v1/routes/eu_ets.py |
| POST | `/api/v1/eu-ets/cap-trajectory` | `compute_cap_trajectory` | api/v1/routes/eu_ets.py |
| POST | `/api/v1/eu-ets/ets2-readiness` | `assess_ets2_readiness` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/benchmarks` | `ref_benchmarks` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/benchmarks/all` | `ref_benchmarks_all` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/price-scenarios` | `ref_price_scenarios` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/cbam-phaseout` | `ref_cbam_phaseout` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/cap-parameters` | `ref_cap_parameters` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/leakage-tiers` | `ref_leakage_tiers` | api/v1/routes/eu_ets.py |

### 2.3 Engine `eu_ets_engine` (services/eu_ets_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `EUETSEngine.calculate_free_allocation` | installation_id, installation_name, sector, product_benchmark, year, historical_activity_level, carbon_leakage_listed, carbon_price_eur | Calculate free allocation for an installation under ETS Phase 4. |
| `EUETSEngine.assess_compliance` | installation_id, year, verified_emissions_tco2, free_allocation_tco2, purchased_allowances_tco2, banked_allowances_tco2, carbon_price_eur | Assess compliance position for an installation. |
| `EUETSEngine.forecast_carbon_price` | scenario, current_price_eur | Forecast EU ETS carbon price under a given scenario. |
| `EUETSEngine.compute_cap_trajectory` | start_year, end_year | Compute EU ETS cap trajectory with LRF schedule. |
| `EUETSEngine.assess_ets2_readiness` | entity_id, entity_name, fuel_type, annual_fuel_volume_litres, annual_fuel_volume_kg, emission_factor_kgco2_per_litre, carbon_price_eur, has_mrv_system | Assess readiness for ETS2 (buildings/transport from 2027). Enhanced (E8): - Resolves emission factor from ETS2_EMISSION_FACTORS table per fuel type - Calculates allowance cost at Art. 30d price corridor floor AND ceiling - Scores compliance readiness from 5 weighted factors (100-point scale) - Distinguishes road (85% pass-through) vs. heating (70%) fuel categories - Returns compliance calendar dea |
| `EUETSEngine.get_product_benchmarks` |  | Return product benchmarks as a flat dict for API reference endpoints. GAP-012: Prefers live DB values for the current allocation period (2026-2030 if today >= 2026-01-01, else 2021-2025). Falls back to the hardcoded PRODUCT_BENCHMARKS dict if the DB query fails or the table doesn't exist yet. |
| `EUETSEngine.get_product_benchmarks_all_periods` |  | Return all benchmark rows across all allocation periods for the reference-data endpoint (/api/v1/eu-ets/ref/benchmarks/all). |
| `EUETSEngine.get_carbon_price_scenarios` |  |  |
| `EUETSEngine.get_cbam_phaseout_schedule` |  |  |
| `EUETSEngine.get_ets_cap_parameters` |  |  |
| `EUETSEngine.get_carbon_leakage_tiers` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `ETS2_EMISSION_FACTORS`, `__future__` *(shared)*, `ets_product_benchmarks`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eu-ets/ref/benchmarks** — status `passed`, provenance ['db-empty'], source tables: `ets_product_benchmarks`
Output: `{'type': 'object', 'keys': ['product_benchmarks'], 'n_keys': 1}`

**GET /api/v1/eu-ets/ref/benchmarks/all** — status `passed`, provenance ['db-empty'], source tables: `ets_product_benchmarks`
Output: `{'type': 'object', 'keys': ['product_benchmarks', 'note'], 'n_keys': 2}`

**GET /api/v1/eu-ets/ref/cap-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ets_cap_parameters'], 'n_keys': 1}`

**GET /api/v1/eu-ets/ref/cbam-phaseout** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cbam_phaseout'], 'n_keys': 1}`

**GET /api/v1/eu-ets/ref/leakage-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['carbon_leakage_tiers'], 'n_keys': 1}`

**GET /api/v1/eu-ets/ref/price-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['carbon_price_scenarios'], 'n_keys': 1}`

**POST /api/v1/eu-ets/cap-trajectory** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/eu-ets/carbon-price-forecast** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `eu_ets_engine` — extracted transformation lines:**
```python
years_from_2021 = max(0, year - 2021)
preliminary = historical_activity_level * bm_value
final = preliminary * cl_factor * cscf * cbam_factor
auction_cost = auction_exposure * carbon_price_eur
total_holdings = free_allocation_tco2 + purchased_allowances_tco2 + banked_allowances_tco2
surplus_deficit = total_holdings - surrender
purchase_cost = abs(surplus_deficit) * carbon_price_eur
penalty = abs(surplus_deficit) * 100.0  # EUR 100/tCO2 penalty
n_years = 2050 - 2025
cagr = ((p_2050 / current_price_eur) ** (1 / n_years) - 1) * 100
cap = max(0.0, cap - reduction)
annual_emissions = annual_fuel_volume_litres * ef_per_litre / 1000  # tCO2
pass_through = 70.0   # heating — longer-term supply contracts
consumer_impact = (carbon_price_eur * ef_per_litre / 1000)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Fix the ETS2 defect, wire MSR dynamics, and live carbon price (analytics ladder: rung 2 → 3)

**What.** A faithful EU ETS engine (Directive 2003/87/EC as amended by 2023/959): benchmark-based free
allocation, compliance position, carbon-price scenario forecast, cap trajectory, and ETS2 readiness —
all constants transcribed from published EU regulatory values (benchmarks, LRF, MSR, CBAM phase-out),
DB-first benchmark lookup, no PRNG. Already rung 2 (five NGFS/IEA-anchored price scenarios). §7.5
documents a **live code defect**: `assess_ets2_readiness` references `self.ETS2_EMISSION_FACTORS`/
`ETS2_PRICE_CORRIDOR`/`ETS2_COMPLIANCE_CALENDAR` which are module-level constants, **not class
attributes** — so `POST /ets2-readiness` raises `AttributeError` and returns a 500, plus two latent bugs
(corridor key mismatch `floor` vs `floor_eur`; `.get()` on a list calendar). §7.6 also flags
simplifications: CSCF fixed at 1.0, binary carbon-leakage (1.0/0.3 vs the trade×emission-intensity
test), price forecast a pure table lookup (35% volatility reported but unused), and the cap trajectory
ignoring MSR intake dynamics. Evolution A fixes the ETS2 defect, wires MSR into the cap simulation, and
adds a live carbon price.

**How.** Fix the ETS2 constant references (self → module) and the corridor-key/calendar bugs;
`compute_cap_trajectory` applies the MSR intake/TNAC dynamics already exposed via `/ref/cap-parameters`;
the carbon price becomes a live market input (the platform wires EU ETS spot) feeding auction cost and
compliance. Rung 3: implement the real carbon-leakage trade×emission-intensity test (vs the binary
shortcut), model the CSCF, and add a stochastic price process using the 35% volatility.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /cap-trajectory` and
`/carbon-price-forecast` **failed**, and the ETS2 500 defect; the benchmark reference is `db-empty`
(seed `ets_product_benchmarks`, roadmap D0). Preserve the published-value transcriptions.
**Acceptance:** the §7.4 cement-clinker worked example (473,250 tCO₂ final allocation, €23.42M auction
cost) reproduces; `POST /ets2-readiness` returns a valid result instead of a 500; the cap trajectory
responds to MSR intake; a live ETS price moves the auction cost; the failing endpoints pass the harness.

### 9.2 Evolution B — EU ETS compliance-and-price analyst with tool-called calculation (LLM tier 2)

**What.** A tool-calling analyst for compliance/carbon-desk teams: "calculate our free allocation for
2030" (`/free-allocation` → benchmark decline, CBAM phase-out, auction exposure/cost), "what's our
compliance position and penalty risk?" (`/compliance` → surplus/deficit, purchase cost, €100/t penalty),
"forecast the carbon price under Fit-for-55" (`/carbon-price-forecast`), "project the cap to 2040"
(`/cap-trajectory`), and "are we ETS2-ready?" (`/ets2-readiness`) — narrating real regulatory
calculations across the ETS stack.

**How.** Tool schemas over the 5 POST + 6 GET operations; the reference endpoints (product benchmarks,
price scenarios, CBAM phase-out, cap parameters, leakage tiers) are exceptional RAG grounding for
"what's the cement clinker benchmark?" or "what's the 2030 CBAM free-allocation percentage?" questions.
The no-fabrication validator checks every tCO₂, € and benchmark against tool output; the copilot flags
the documented simplifications (binary leakage, fixed CSCF) until Evolution A. Composable with `cbam`
and `facilitated_emissions` in a carbon/regulatory desk.

**Prerequisites.** Evolution A's ETS2 fix, harness fixes, and seeded benchmarks (so all endpoints work
for tool-calling); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure cited
traces to an engine tool call; the free allocation and auction cost match `/free-allocation`; the
compliance penalty matches the €100/t calculation; the ETS2-readiness answer returns a real score, not
a 500.