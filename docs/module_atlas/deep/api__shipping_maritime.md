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
