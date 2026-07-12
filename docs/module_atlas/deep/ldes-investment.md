## 7 · Methodology Deep Dive

### 7.1 What the module computes

A 10-tab LDES (long-duration energy storage) investment analytics tool built on two real, correctly
implemented core formulas — **Levelised Cost of Storage (LCOS)** and **project IRR via
Newton-Raphson** — applied across 8 technologies (Iron-Air, Vanadium Flow, Zinc-Bromine Flow,
Zinc-Air, Liquid Air, Pumped Thermal, Green H₂, Gravity/Rail). This matches the guide's stated
formula `LCOS = (CAPEX×CRF + OPEX) / (Annual_cycles × Discharged_energy_per_cycle)` closely — no
guide↔code mismatch on the core LCOS methodology. A genuine **unit-scale bug in the IRR revenue
calculation** (§7.7) does exist and inflates the "Project IRR" KPI by roughly 1000×.

```js
capexAnn  = capexPerKwh × w / (1 − (1+w)^−lifetime)     // capital recovery factor (CRF) annuity
opexAnn   = capexPerKwh × opexPct / 100
throughput = cycles × (rte / 100)                        // annual discharged energy per $/kWh basis
LCOS      = (capexAnn + opexAnn) / throughput             // $/kWh discharged
```

### 7.2 Parameterisation

| Technology | Capex ($/kWh) | RTE | Cycles/yr | Lifetime | Duration | TRL | Provenance |
|---|---|---|---|---|---|---|---|
| Iron-Air (Form Energy) | 20 | 68% | 150 | 20yr | 100h | 7 | Cited to Form Energy public targets ("$20/kWh target") |
| Vanadium Flow (VRFB) | 300 | 78% | 300 | 25yr | 8h | 9 | Commercial-stage figures |
| Zinc-Bromine Flow (Redflow) | 380 | 72% | 250 | 20yr | 10h | 8 | Semi-commercial |
| Zinc-Air (EOS Energy) | 75 | 75% | 200 | 20yr | 4h | 8 | "$75/kWh current" cited inline |
| Liquid Air (Highview) | 180 | 62% | 250 | 25yr | 12h | 8 | "250MW Carrington UK" cited inline |
| Pumped Thermal (Carnot) | 120 | 65% | 200 | 30yr | 12h | 7 | "Malta Antora leading" cited inline |
| Green H₂ (electrolysis+CCGT) | 25 | 35% | 80 | 20yr | 720h | 8 | Multi-week/seasonal use case |
| Gravity/Rail (Energy Vault) | 100 | 82% | 300 | 30yr | 8h | 8 | "Energy Vault, RheEnergise" cited |

All 8 rows are static, hand-entered technology assumptions (not `sr()`-random) — plausible and
broadly consistent with public DOE/NREL/BNEF LDES cost benchmarks, though no per-row citation to a
specific report page is embedded.

### 7.3 Calculation walkthrough

- **LCOS Engine tab**: 6 sliders (capex, opex%, RTE, cycles/yr, lifetime, WACC) feed `calcLcos()`
  live; a sensitivity line chart re-runs the same formula across capex $10–500/kWh at 3 fixed RTE
  levels (60/70/80%), with a "Li-ion parity" reference line at $50/MWh.
- **Investment Returns tab**: same 6 sliders (plus revenue price $/MWh) feed the IRR calculation
  (§7.4) via Newton-Raphson on a `[-capexTotal, net, net, ..., net]` cashflow vector over `lifetime`
  years, solved to `1e-8` tolerance or 200 iterations.
- **Technology Comparison / Radar tabs**: per-technology scorecards plus a 6-axis radar
  (`Cost, RTE, Duration, Lifetime, TRL, Safety`), each axis independently normalised:
  `Cost = min(100, (400/capex_kwh)×80)`, `Duration = min(100, (duration_hr/24)×80+20)`,
  `Lifetime = min(100, (lifetime/30)×100)`, `Safety` is a 3-tier heuristic keyed on CO₂ footprint and
  an "Iron" name-match special case (95 for Iron-Air, 85 if `co2_kg_kwh<30`, else 70).
- **Market Sizing tab**: static `MARKET_SEGMENTS` (5 rows: Utility Grid Firming, Capacity Market,
  Seasonal Balancing, Islands/Off-Grid, Industrial Process Heat) with 2025/2030/2035 GW projections —
  no interpolation or growth-rate model, just 3 fixed snapshot years per segment.
- **Seasonal Storage tab**: a 12-month price-spread area chart using `sr()`-seeded noise layered on a
  hand-coded winter-peak/summer-trough pattern, plus 3 static seasonal-arbitrage economics rows
  (Iron-Air, Green H₂, Liquid Air) with pre-computed buy/sell/RTE-loss/net-margin figures.

### 7.4 Worked example — LCOS at default slider settings

Inputs: `capexKwh=150, opexPct=2.0, rte=70, cyclesYr=200, lifetime=20, wacc=8`.
```
w = 0.08
1.08^20 ≈ 4.6610  →  (1.08)^-20 ≈ 0.2145
capexAnn = 150 × 0.08 / (1 − 0.2145) = 12 / 0.7855 ≈ 15.28
opexAnn  = 150 × 2/100 = 3.00
throughput = 200 × 0.70 = 140
LCOS = (15.28 + 3.00) / 140 = 18.28 / 140 ≈ 0.1306 $/kWh  →  $130.6/MWh
```
This matches the KPI card formula exactly (`lcos × 1000` for the $/MWh display).

### 7.5 Companion analytics

- **Technology Radar (all techs) tab** — two scatter plots (Capex vs RTE trade-off; Duration vs LCOS)
  across all 8 technologies, letting a user visually identify the cost/duration/efficiency frontier.
- **Financing Structures tab** — a static 5-layer capital stack (Senior Debt 55% / Green Bond 15% /
  Mezzanine 10% / Preferred Equity 10% / Common Equity 10%) with indicative rates and tenors, and a
  5-row public-support-mechanism reference table (IRA §48 ITC, DOE LDES loan guarantees, EU
  Innovation Fund, UK CfD, ARENA) — reference data, not computed.
- **India context module** (via shared `EnergyAdvancedAnalytics`) — adds a Monte Carlo LCOS model for
  Iron-Air (`capexKwh∈[20,60], cycles∈[200,400], rte∈[0.48,0.58], lifeYrs∈[18,30]`), a tornado
  sensitivity chart, an NGFS-scenario carbon-price impact function
  (`max(40, 95 − 0.25×max(0, carbonPrice−40))`), and a peer LCOS comparison table plus an
  India-specific pumped-storage/iron-air project pipeline table.

### 7.6 Worked example — MC LCOS model (India context)

At the tornado model's fixed inputs (`capexKwh=35, cycles=300, rte=0.52, lifeYrs=22`), using a
hard-coded 8% discount rate distinct from the main page's WACC slider:
```
capexAnn = 35 × 0.08 / (1 − 1.08^-22) ≈ 35×0.08/0.8261 ≈ 3.390
cost = capexAnn / (cycles × rte) = 3.390 / (300×0.52) = 3.390/156 ≈ 0.02173 $/kWh → $21.7/MWh
```

### 7.7 Data provenance & limitations

- **IRR revenue unit-scale bug (verified in code)**: `capexTotal = capexKwh × 100000` correctly
  treats the analysis as a 100,000 kWh (100 MWh) reference system (`$/kWh × kWh = $`). But
  `annRevenue = cyclesYr × (rte/100) × rePrice × 100000` reuses the same `100000` multiplier even
  though `rePrice` is denominated **$/MWh**, not $/kWh. The correct revenue formula for a 100 MWh
  system is `cyclesYr × RTE × rePrice × 100` (MWh, not kWh) — the code is **1000× too large**. At the
  default sliders (`capexKwh=150, cyclesYr=200, rte=70%, rePrice=$35/MWh`), the buggy formula yields
  `annRevenue ≈ $4.90Bn` against a `capexTotal` of only $15M — a revenue-to-capex ratio of ~326:1 in
  year one alone, which drives the Newton-Raphson solver toward an economically meaningless IRR
  (tens of thousands of percent) rather than the realistic single-digit-to-teens IRR the sensitivity
  chart's legend and the "8% hurdle" reference line imply. This bug affects both the "Project IRR" KPI
  card and the entire "IRR Sensitivity" line chart on the Investment Returns tab.
- The Monte Carlo/tornado models in the India context panel use a separate, correctly-scaled
  `compute()` function (`cost = capexAnn/(cycles×rte)`, no MWh/kWh conversion needed since it outputs
  $/kWh directly) and are **not** affected by the IRR bug.
- Seasonal price-spread chart (tab 7) blends a hand-authored winter/summer pattern with `sr()` noise
  — illustrative, not a real day-ahead/futures price series.
- Technology cost/performance table (§7.2) is static and undated; production use should refresh
  against BNEF/NREL/LDES Council annual cost curves.

**Framework alignment:** LDES Council *Net-Zero Power* and NREL Grid-Scale BESS cost methodology
underpin the LCOS formula design (CRF-based capex annuitisation), which is correctly implemented.
IRA §48C ITC, EU Innovation Fund, UK CfD, and ARENA are correctly named real public-support
mechanisms. The Monte Carlo/tornado/NGFS-scenario overlay follows the platform's shared
`EnergyAdvancedAnalytics` pattern used across other energy modules.

---

## 8 · Model Specification — IRR revenue calculation fix

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Correct the unit-scale defect in `irrCalc` (§7.7) so the "Project IRR" KPI and IRR-sensitivity chart
return economically meaningful values usable for real investment screening.

### 8.2 Conceptual approach
Standard project-finance IRR: build an explicit annual cashflow vector in consistent units (all $ per
project, all energy in MWh) and solve for the discount rate that zeroes NPV — the same
Newton-Raphson solver already implemented can be reused unchanged; only the revenue-line unit
conversion needs correction.

### 8.3 Mathematical specification
```
SystemCapacity_MWh = capexKwh_basis_kWh / 1000            // 100,000 kWh → 100 MWh
CapexTotal_$       = capexKwh × SystemCapacity_kWh          // unchanged, already correct
AnnualDischarge_MWh = cyclesYr × (rte/100) × SystemCapacity_MWh
AnnualRevenue_$     = AnnualDischarge_MWh × rePrice_perMWh   // = cyclesYr × RTE × rePrice × 100 (not ×100000)
AnnualOpex_$        = CapexTotal_$ × (opexPct/100)
NetCF_$             = AnnualRevenue_$ − AnnualOpex_$
IRR = solve( -CapexTotal_$ + Σ_{t=1}^{lifetime} NetCF_$/(1+r)^t = 0 )
```
| Parameter | Calibration source |
|---|---|
| Reference system size (100 MWh) | Author-chosen normalisation constant, should be documented in-code as a named constant rather than a bare literal `100000` |
| Revenue price ($/MWh) | User input / market data (wholesale + capacity + ancillary stacked value) |

### 8.4 Data requirements
No new external data required — this is a pure unit-consistency fix using inputs already collected
by the page's sliders.

### 8.5 Validation & benchmarking plan
- Regression test: at default sliders, corrected IRR should fall in a plausible 5–20% range for a
  merchant LDES project at $35/MWh revenue — flag any output outside a sane band (e.g. IRR>50% or
  IRR<-20%) as a config or model error.
- Cross-check against the India-context MC/tornado LCOS model, which is unaffected and already
  correctly scaled — the two models' implied revenue requirements should be reconcilable.

### 8.6 Limitations & model risk
- IRR remains a simplified constant-net-cashflow annuity model (no revenue escalation, no
  degradation curve, no tax/depreciation shield) — acceptable for screening-level comparison but not
  for financial close.
- The `100000`/`100` scale constant should be replaced with a named, documented variable to prevent
  the class of bug found here recurring when the reference system size changes.
