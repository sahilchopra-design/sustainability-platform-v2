# Api::Shipping_Maritime
**Module ID:** `api::shipping_maritime` · **Route:** `/api/v1/shipping-maritime` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/shipping-maritime/cii-rating` | `cii_rating` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/eexi` | `eexi` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/poseidon-principles` | `poseidon_principles` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/fueleu` | `fueleu` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/ets-obligation` | `ets_obligation` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/fuel-switch` | `fuel_switch` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/fleet-portfolio` | `fleet_portfolio` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/full-assessment` | `full_assessment` | api/v1/routes/shipping_maritime.py |
| GET | `/api/v1/shipping-maritime/ref/vessel-types` | `ref_vessel_types` | api/v1/routes/shipping_maritime.py |
| GET | `/api/v1/shipping-maritime/ref/cii-requirements` | `ref_cii_requirements` | api/v1/routes/shipping_maritime.py |
| GET | `/api/v1/shipping-maritime/ref/fueleu-targets` | `ref_fueleu_targets` | api/v1/routes/shipping_maritime.py |
| GET | `/api/v1/shipping-maritime/ref/fuel-emission-factors` | `ref_fuel_emission_factors` | api/v1/routes/shipping_maritime.py |

### 2.3 Engine `shipping_maritime_engine` (services/shipping_maritime_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ShippingMaritimeEngine.calculate_cii` | entity_id, vessel_type, dwt, distance_nm, fuel_consumed_t, fuel_type, year |  |
| `ShippingMaritimeEngine.calculate_eexi` | entity_id, vessel_type, dwt, installed_power_kw, service_speed_knots, epl_applied, epl_power_kw |  |
| `ShippingMaritimeEngine.assess_poseidon_principles` | entity_id, vessel_type, dwt, actual_intensity, pp_year |  |
| `ShippingMaritimeEngine.assess_fueleu` | entity_id, annual_energy_mj, ghg_intensity_wtw, year |  |
| `ShippingMaritimeEngine.calculate_ets_obligation` | entity_id, co2_tonne_pa, voyage_types, year, eua_price_eur |  |
| `ShippingMaritimeEngine.model_fuel_switch` | entity_id, vessel_type, current_fuel, target_fuel, fleet_size, voyage_profile, current_fuel_price_usd_t |  |
| `ShippingMaritimeEngine.assess_fleet_portfolio` | entity_id, vessel_list |  |
| `ShippingMaritimeEngine.generate_full_assessment` | entity_id, vessel_data |  |

**Engine `shipping_maritime_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `CII_RATING_BOUNDARIES` | `{'A': (0.0, 0.85), 'B': (0.85, 0.95), 'C': (0.95, 1.05), 'D': (1.05, 1.15), 'E': (1.15, float('inf'))}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/shipping-maritime/ref/cii-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/shipping-maritime/ref/fuel-emission-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/shipping-maritime/ref/fueleu-targets** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/shipping-maritime/ref/vessel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/shipping-maritime/cii-rating** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/shipping-maritime/eexi** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/shipping-maritime/ets-obligation** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/shipping-maritime/fleet-portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `shipping_maritime_engine` — extracted transformation lines:**
```python
cii_attained = (co2_emitted * 1_000_000) / (dwt * distance_nm)
cii_reference = ref_coeff * (max(dwt, 1.0) ** -ref_exponent)
cii_required = cii_reference * (1.0 - reduction_pct / 100.0)
ratio = cii_attained / max(cii_required, 0.001)
future_required = cii_reference * (1.0 - future_reduction / 100.0)
future_ratio = cii_attained / max(future_required, 0.001)
sfcref = 195.0  # g/kWh reference SFOC for VLSFO
eexi_attained = (0.00349 * sfcref * effective_power) / (dwt * (service_speed_knots ** 0.3))
margin_pct = round((eexi_required - eexi_attained) / max(eexi_required, 0.001) * 100.0, 2)
required = trajectory[years_sorted[-1]]
t = (pp_year - y0) / (y1 - y0)
required = trajectory[y0] + t * (trajectory[y1] - trajectory[y0])
delta_pct = (actual_intensity - required) / max(required, 0.001) * 100.0
trajectory_gap = actual_intensity - required
alignment_score = max(0.0, min(100.0, (1.0 - delta_pct / 30.0) * 100.0))
target = FUELEU_GHG_TARGETS[target_years[-1]]
deficit_gco2eq_mj = max(0.0, ghg_intensity_wtw - target)
deficit_energy_mj = deficit_gco2eq_mj * annual_energy_mj / 1_000_000  # tCO2eq
penalty_eur = deficit_energy_mj * 2400.0
intra_eu_pct = intra_count / len(voyage_types) if voyage_types else 0.6
eligible_co2 = co2_tonne_pa * (intra_eu_pct + (1 - intra_eu_pct) * 0.5)
obligation_allowances = eligible_co2 * phase_in
surrender_gap = max(0.0, obligation_allowances - free_allocation)
phase_in_pct=round(phase_in * 100.0, 1),
capex_per_vessel = vessel_value_usd * capex_premium
capex_usd = capex_per_vessel * fleet_size
co2_reduction_pa = max(0.0, (co2_current - co2_target) * fleet_size)
opex_delta_per_vessel = annual_fuel_t * fuel_price * opex_premium
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/shipping-maritime` (`shipping_maritime_engine.py`, pure computation, no DB) covers six
maritime-climate frameworks in one engine: IMO **CII** rating, **EEXI**, **Poseidon Principles**
portfolio alignment, **FuelEU Maritime** penalty, **EU ETS shipping** obligation, fuel-switch
economics, plus fleet aggregation and a consolidated per-vessel assessment.

```
CII_attained = fuel_t × EF_CO2 × 10⁶ / (DWT × distance_nm)          gCO2/dwt-nm
CII_required = (coeff / √DWT) × (1 − Z(year)/100)                    Z = 5 %…20 % (2023–2030)
rating: ratio < 0.85 A | < 0.95 B | < 1.05 C | < 1.15 D | else E
EEXI_attained = 0.00349 × 195 × P_eff / (DWT × v^0.3)                 stated simplification
PP: score = clamp((1 − Δ%/30) × 100, 0, 100);  aligned if Δ% ≤ 0
FuelEU: deficit_t = max(0, GHG_wtw − target) × energy_MJ / 10⁶;  penalty = deficit_t × €2,400
ETS: eligible = CO2 × (intra% + (1−intra%) × 0.5);  obligation = eligible × phase-in(40/70/100 %)
```

### 7.2 Parameterisation

| Table | Content | Provenance |
|---|---|---|
| `VESSEL_TYPES` (8 types) | CII reference coefficient (e.g. bulk 4745, tanker 5247, gas carrier 14405), EEXI required (2.2–5.0 gCO₂/dwt), FuelEU base 91.16 | Coefficients feed a **simplified** `coeff/√DWT` reference line, not the true MEPC.338(76) `a·W^−c` per-type exponents |
| `CII_REQUIRED_REDUCTION` | 2023: 5 %, 2024: 7 %, 2025: 9 %, 2026: 11 %, … 2030: 20 % | 2023–2026 match adopted IMO Z-factors; 2027–2030 are the platform's extrapolation (IMO has not adopted them); beyond 2030 the code adds +0.5 %/yr |
| `CII_RATING_BOUNDARIES` | 0.85/0.95/1.05/1.15, all vessel types | Simplified generic bands (real dd-vectors are type-specific) |
| `PP_REQUIRED_TRAJECTORY` | per-type gCO₂/dwt-nm at 2025→2050, linearly interpolated | Synthetic stand-in for the Poseidon Principles decarbonisation trajectories |
| `FUELEU_GHG_TARGETS` | 89.34 (2025), 80.43 (2030), 71.53 (2035), 53.65 (2040), 35.76 (2045), 17.88 (2050) gCO₂e/MJ | Matches Regulation (EU) 2023/1805 reduction steps (−2/−6/−14.5/−31/−62/−80 % vs 91.16) |
| `FUEL_EMISSION_FACTORS` | 8 fuels: CO₂/t (TtW), WtW gCO₂e/MJ, LCV | HFO 3.114 / 91.16 / 40.2 GJ/t per MARPOL & FuelEU defaults; green ammonia/H₂ zero TtW; e-methanol WtW 2.5 |
| `ALTERNATIVE_FUEL_READINESS` | TRL 4–9, capex premium 5–35 %, opex premium 10–50 %, availability 0.10–0.80 | Synthetic expert-style calibration |
| `ETS_SHIPPING_PHASE_IN` | 2024: 40 %, 2025: 70 %, 2026: 100 % | Matches Directive 2023/959 shipping phase-in |
| FuelEU penalty | €2,400 per tCO₂e-equivalent deficit | Regulation 2023/1805 penalty basis (2,400 €/t VLSFO-energy equivalent — the code applies it per tonne of GHG deficit, a simplification) |

### 7.3 Calculation walkthrough

- **CII**: `year_to_d_rating` scans forward holding attained intensity constant while the required
  line tightens; first year ratio ≥ 1.05 (the D boundary) is reported.
- **EEXI**: engine-power-limitation (EPL) substitutes effective power; compliance is attained ≤
  the per-type static required value; margin % reported.
- **Poseidon**: 100 = on-trajectory, 0 = ≥30 % above; `aligned` requires the vessel at or below
  the required intensity (Δ% ≤ 0).
- **ETS**: voyage-type list drives the intra-EU share (default 0.6); extra-EU legs count 50 % per
  the directive; free allocation is correctly zero for shipping. EUA cost is an **honest null**
  unless the caller supplies a market price (remediation comment: "No default is fabricated").
- **Fuel switch**: capex = vessel value × capex premium × fleet; CO₂ saving corrects for energy
  density (`LCV_current/LCV_target` scales target-fuel tonnage); OPEX/payback/NPV computed only
  when a fuel price is supplied — NPV is 15-year at 8 % discount with carbon savings valued at a
  hard-coded $65/tCO₂; payback capped at 50 yr.
- **Fleet**: per-vessel CII/PP/FuelEU/ETS aggregated; stranding = D/E share, "urgent_retrofit" if
  > 30 %; `sea_cargo_charter_aligned` proxied by PP alignment ≥ 60 % of vessels.
- **Full assessment** adds a Sea Cargo Charter AER check vs the 2025 benchmark and a composite
  `overall_compliance_score` = 25 % each: CII (100 if A–C else 50), PP score, FuelEU (100 if
  compliant else `100 − penalty/10,000` floored at 0), EEXI (100 if compliant else 40).

### 7.4 Worked example — bulk carrier defaults, 2025

Defaults: bulk_carrier, DWT 50,000, 80,000 nm, 3,000 t HFO.

| Step | Computation | Result |
|---|---|---|
| CO₂ | 3,000 × 3.114 | **9,342 t** |
| CII attained | 9,342×10⁶ / (50,000×80,000) | **2.3355 g/dwt-nm** |
| Reference | 4745 / √50,000 = 4745/223.61 | 21.22 |
| Required (2025, −9 %) | 21.22 × 0.91 | 19.31 |
| Ratio | 2.3355/19.31 = **0.121** | **Rating A** (never reaches D by 2050) |
| FuelEU | intensity 91.16 vs target 89.34 → deficit 1.82 g/MJ; energy = 3,000×40,200 = 120.6M MJ; deficit t = 1.82×120.6M/10⁶ = 219.5 t | penalty = 219.5 × 2,400 ≈ **€526,800** |
| ETS (no voyage list → intra 0.6) | eligible = 9,342 × (0.6+0.2) = 7,473.6; ×0.70 | **5,231.5 EUAs**; cost null without EUA price |

Note the CII ratio is implausibly low — the `coeff/√DWT` reference line yields ~21 g/dwt-nm where
the real MEPC formula gives ~4.2 for a 50k-DWT bulker, so ratings from this engine skew optimistic
(the companion `api::sector_calculators` shipping engine implements the true `a·W^−c` line).

### 7.5 Data provenance & limitations

- **No PRNG; two explicit honest-null monetary outputs** (EUA cost, fuel-switch economics).
  Defaults (DWT 50,000, 3,000 t fuel, $30M vessel value, $65/t carbon) apply when the caller
  omits fields — deterministic but synthetic.
- Key simplifications vs regulation: square-root CII reference line (wrong exponent per type);
  generic rating bands; extrapolated post-2026 Z-factors; FuelEU penalty applied per tonne of GHG
  deficit without the compliance-balance/pooling/banking mechanics or the consecutive-deficit
  multiplier; EEXI omits SFOC curves, shaft limitation verification, and reference-line comparison
  (uses static per-type thresholds); ETS ignores CH₄/N₂O inclusion from 2026.
- Poseidon/Sea-Cargo-Charter trajectories are illustrative, not the published decarbonisation
  trajectories (which derive from IMO striving scenarios per vessel class).

### 7.6 Framework alignment

- **IMO CII (MARPOL Annex VI Reg. 28; MEPC.337–339(76))** — attained CII = annual CO₂/(capacity ×
  distance) rated A–E vs a required line reduced by adopted Z-factors; implemented with simplified
  reference line and bands.
- **EEXI (MARPOL Annex VI Reg. 23/25)** — one-off design index with EPL as the standard compliance
  lever; the module honours EPL substitution.
- **Poseidon Principles** — bank framework scoring portfolio climate alignment as % deviation of
  vessel AER from a decarbonisation trajectory; the module's Δ% and alignment flag mirror that
  disclosure.
- **FuelEU Maritime (EU) 2023/1805** — WtW GHG-intensity targets stepping down from the 91.16
  gCO₂e/MJ 2020 baseline, with €2,400-based remedial penalties; targets reproduced exactly.
- **EU ETS (Directive 2003/87/EC as amended 2023/959)** — 40/70/100 % phase-in 2024–26, 50 %
  extra-EEA voyage scope, no free allocation; implemented faithfully at annual granularity.
- **Sea Cargo Charter** — cargo-owner AER disclosure benchmark; approximated by static per-type
  AER benchmarks.

## 9 · Future Evolution

### 9.1 Evolution A — Voyage-data grounding and multi-year compliance-cost projection (analytics ladder: rung 2 → 4)

**What.** A six-framework maritime-climate engine (pure computation, no DB): IMO CII rating
(A–E bands on `attained/required` with the Z-factor tightening 5–20% over 2023–2030), EEXI (a
stated simplification `0.00349 × 195 × P_eff/(DWT × v^0.3)`), Poseidon Principles alignment,
FuelEU Maritime penalty (`deficit × €2,400/t`), EU ETS shipping obligation (40/70/100% phase-in,
50% extra-EU eligibility), fuel-switch economics, and fleet aggregation. Parameter tables cite IMO
MEPC sources. Inputs (fuel burned, distance, voyage split) are caller-supplied per vessel, and
several POST endpoints trace `skipped` under the harness. Evolution A grounds inputs and projects
costs forward.

**How.** (1) Add a multi-year compliance-cost projection per vessel/fleet: CII rating trajectory as
Z tightens, FuelEU deficits as targets step down (2025–2050), and ETS obligation as phase-in and
free allocation evolve — a single NPV of regulatory cost per vessel (rung 4), the number a ship
financier actually needs. (2) Ground vessel particulars and fuel consumption from ingested fleet
data (IMO DCS/THETIS-MRV style records) rather than hand-typed inputs, with a provenance tier. (3)
Replace the EEXI simplification with the full attained-EEXI formula or scope it explicitly. (4)
Confirm the POST endpoints pass the harness and bench-pin CII, FuelEU, and ETS against published
worked examples.

**Prerequisites.** A fleet/voyage data source (MRV public data is feasible); endpoint verification.
**Acceptance:** a vessel returns a 2025–2050 compliance-cost NPV across the three regimes; CII/
FuelEU/ETS bench-pinned to worked examples; inputs carry a provenance tier; POSTs return `passed`.

### 9.2 Evolution B — Ship-finance climate copilot (LLM tier 2)

**What.** A copilot for shipping lenders and owners: "run the full assessment on this bulker —
what's its CII rating, when does it fall to D, what are its FuelEU and ETS bills, and is my
portfolio Poseidon-aligned?" — calling `/full-assessment`, `/fleet-portfolio`, and the per-framework
endpoints, every number tool-sourced.

**How.** Eight POST endpoints plus four reference GETs (CII requirements, fuel emission factors,
FuelEU targets, vessel types) that ground every constant with its IMO/EU citation. The consolidated
`/full-assessment` gives a one-call vessel verdict; `/fuel-switch` powers "what if we retrofit to
methanol?" economics; `/fleet-portfolio` and the Poseidon score serve the lender view. Strong node
for a shipping-finance desk, cross-linking to `sector_calculators` (the sibling CII implementation —
the two should reconcile) and trade-finance copilots.

**Prerequisites.** Endpoint verification (several trace `skipped`); reconciliation with the sibling
`sector_calculators` shipping calculator so the platform gives one CII answer. **Acceptance:** every
rating, penalty, and obligation figure traces to a tool response; the copilot cites the reference
table (MEPC/FuelEU/ETS) behind each threshold; identical vessel inputs to this and
`sector_calculators` yield consistent CII narrations; it refuses to assert flag-state compliance.