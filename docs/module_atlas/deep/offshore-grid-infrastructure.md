## 7 · Methodology Deep Dive

### 7.1 What the module computes

An engineering-economics model for offshore wind grid connection, computing AC cable I²R loss,
HVDC terminal loss, an AC-vs-HVDC cost breakeven distance, CAPEX waterfall, and MTBF-style
availability — matching the guide's stated formula set closely.

```
I (kA)        = P_MW / (√3 × V_kV)                          // per-cable current
P_loss (kW)   = 3 × (I×1000)² × R_per_km / 1e6 × length_km   // AC cable I²R loss
lossPct       = P_loss / (P_MW × 1000) × 100
HVDC_loss (%) = 1.4 + 0.0020 × km                            // fixed terminal + linear cable term
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| HVDC terminal loss | 1.4% fixed | Matches guide's "~0.6% each end" terminal conversion range order-of-magnitude; hard-coded, not derived from a converter datasheet |
| HVDC cable loss slope | 0.0020%/km | Guide cites ~0.003%/km; code uses 0.0020, a modelling simplification not reconciled to the guide's own number |
| Conductor resistance table (`CONDUCTOR_DATA`, 9 rows) | Ω/km by voltage (33/66/132kV) and material (Cu/Al) | IEC 60228-consistent structure; values not individually cited but plausible for submarine XLPE cable |
| PPA price | `55 + sr(capacityMW×3)×30` → $55–85/MWh | Synthetic demo value |
| HVDC cost premium | 30% of cable CAPEX | Synthetic demo value, order-of-magnitude consistent with guide's converter-station cost premium note |
| Cable install cost | `distanceKm × numCables × 0.8` ($M) | Synthetic demo value |
| Fault rate | `faultPer100` × distance/100 × numCables | Seed input; guide cites CIGRÉ TB 379 (~0.08 faults/100km/yr for HVDC) as the real-world benchmark |

### 7.3 Calculation walkthrough

1. **Cable loss (`cableLoss` fn)**: current is derived from power and voltage via the standard
   three-phase relation, then I²R loss is computed per km and scaled by cable length — textbook AC
   transmission-loss physics, correctly implemented.
2. **AC vs HVDC comparison**: `annualSavingM = max(0, acLossNow − hvdcLossNow)/100 × annualGenGWh ×
   ppaPriceMWh/1000` nets the annual revenue benefit of switching technology; `paybackYrs =
   hvdcPremiumM / annualSavingM` (999 sentinel when saving ≤ 0) determines whether the ~30% HVDC
   CAPEX premium pays back within project life — this is the module's version of the guide's ~80km
   breakeven distance, computed dynamically per site parameters rather than as a fixed constant.
3. **CAPEX waterfall**: cable supply (`cableLengthM × costPerM`) + installation (`distanceKm ×
   numCables × 0.8`) + onshore substation (`substationCostM×0.6 + landCostM`) + offshore
   substation (`platformCostM × numPlatforms`) sum to `totalCapexM`.
4. **Availability (MTBF-style)**: `expectedFaults = faultPer100 × distanceKm × numCables / 100`,
   `annualOutageHrs = expectedFaults × repairDays×24`, `availability = max(0, min(100, (1 −
   annualOutageHrs/8760)×100))` — the standard reliability formula the guide cites
   (`Availability = 1 − f_fault × MTTR / 8760`), correctly bounded to [0,100].
5. **Grid LCOE**: `annualCapexCharge` (annuitised via the standard capital-recovery factor
   `r(1+r)^n/((1+r)^n−1)`) plus O&M and revenue-loss cost, divided by annual generation, produces a
   $/MWh grid-connection LCOE add-on — a genuine annuity-based levelised-cost calculation.

### 7.4 Worked example

1 GW farm, 100 km to shore, 220 kV AC export, 2 cables, discount rate 8%, 25-year life:

| Step | Computation | Result |
|---|---|---|
| Current per cable | 500 MW / (√3 × 220) | 1.31 kA |
| AC loss % (220kV, R≈0.028Ω/km) | `cableLoss()` per formula | ≈ 2.8 % (2 cables combined) |
| HVDC loss % | 1.4 + 0.0020×100 | **1.60%** |
| AC vs HVDC gap | 2.8% − 1.6% | 1.2 pp favouring HVDC |
| Annual generation (45% CF) | 1000×0.45×8760/1000 | 3,942 GWh |
| Annual saving (HVDC) | 1.2%/100 × 3,942 × $65/MWh /1000 | **≈ $3.1M/yr** |
| HVDC premium | 30% × total cable CAPEX | project-specific $M |
| Payback | premium ÷ saving | site-dependent, illustrating the ~80–100km breakeven the guide describes |

### 7.5 Data provenance & limitations

- Conductor resistance table and fault-rate benchmarks are **seed constants styled on IEC 60228 /
  CIGRÉ TB 379** but not literal values reproduced from those standards.
- PPA price and cable/substation unit costs are **synthetic demo values** (`sr()`-seeded or fixed),
  not sourced from a live market-price feed.
- HVDC cable-loss slope (0.0020%/km in code vs 0.003%/km cited in the guide) is an internal
  inconsistency — worth reconciling since it directly moves the AC/HVDC breakeven distance.
- No stochastic treatment of fault occurrence (Poisson-style event modelling) — `expectedFaults` is
  a deterministic expectation, not a simulated count with variance.

**Framework alignment:** IEC 60228 (conductor sizing) and ENTSO-E/UK Grid Code RfG (grid-code
compliance tables elsewhere in the page) are correctly used as structural references; DNVGL-RP-0286
(offshore electrical systems) motivates the substation-platform-type logic but platform selection
by water depth (jacket <60m / floating >60m) is not present in the extracted `computed` formulas
(likely a static lookup elsewhere in the page, not independently verified here).
