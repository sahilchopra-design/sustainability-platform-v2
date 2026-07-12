## 7 · Methodology Deep Dive

This module is genuinely grounded in chemical-process economics: each of the 6 PtX products carries
a real reaction stoichiometry, and the LCOP (levelised cost of product) calculator applies a
standard capital-recovery-factor annuitisation — not a synthetic scaling. The guide and code broadly
agree; the main gap is that market-price benchmarks and demand-growth curves are illustrative
constants, not sourced from a live market feed.

### 7.1 What the module computes

**Levelised Cost of Product (LCOP)** — real annuitised project-economics formula:

```js
h2Cost     = LCOH_€/kg × h2Kg_per_kgProduct                    // stoichiometric H2 input cost
co2CostKg  = (CO2Cost_€/t / 1000) × co2Kg_per_kgProduct         // stoichiometric CO2 input cost
elecCostKg = (ElecCost_€/MWh / 1000) × elecKwh_per_kgProduct    // balance-of-plant electricity
capexAnnKg = CapexPerTpa × [ WACC / (1 − (1+WACC)^−lifetime) ]  // capital recovery factor (CRF)
opexKg     = CapexPerTpa × OpexPct
LCOP       = h2Cost + co2CostKg + elecCostKg + capexAnnKg + opexKg
```
The CRF term `WACC/(1-(1+WACC)^-lifetime)` is the standard annuity factor used to convert a lump-sum
CAPEX into an equivalent annual charge — the same formula underlying LCOE/LCOH calculations
throughout the platform's other energy-finance modules.

### 7.2 Parameterisation

| Product | Reaction | H₂ (kg/kg product) | CO₂ (kg/kg product) | Efficiency | Capex (€/tpa) | Provenance |
|---|---|---|---|---|---|---|
| e-Methanol | CO₂ + 3H₂ → CH₃OH + H₂O | 0.187 | 1.375 | 72% | 850 | Real stoichiometric ratios (44g CO₂ + 3×2g H₂ → 32g CH₃OH mass balance ≈ matches) |
| e-Ammonia | N₂ + 3H₂ → 2NH₃ | 0.178 | 0 | 68% | 700 | Haber-Bosch stoichiometry (17g NH₃ needs 3/2×2g H₂ per mol → 0.178 kg H₂/kg NH₃ is correct) |
| e-SAF (via FT) | CO + 2H₂ → (–CH₂–)ₙ + H₂O | 0.31 | 3.16 | 47% | 2,400 | Fischer-Tropsch via RWGS, illustrative CO₂ intensity for jet-range hydrocarbons |
| e-Diesel (via FT) | CO + 2H₂ → CₙH₂ₙ₊₂ | 0.29 | 3.05 | 48% | 2,200 | Fischer-Tropsch, diesel-range |
| e-Methane (SNG) | CO₂ + 4H₂ → CH₄ + 2H₂O | 0.50 | 2.75 | 78% | 500 | Sabatier reaction — 4:1 H₂:CO₂ molar ratio scaled to mass is directionally consistent |
| e-Methanol (marine) | Same as e-Methanol, marine-grade | 0.187 | 1.375 | 71% | 950 | Same chemistry, higher capex for marine-fuel purification spec |
| LHV/HHV H₂ | 33.3 / 39.4 kWh/kg | — | — | — | — | Correct published hydrogen heating values |

CAPEX, OPEX%, and 2025/2030 market prices are illustrative but plausible figures (e.g. e-SAF
$2,800/t 2025 → $1,800/t 2030, consistent with the guide's cited $2.5–6.0/litre band once converted).

### 7.3 Calculation walkthrough

1. User selects a product and adjusts 6 sliders (LCOH, CO₂ cost, electricity cost, scale, WACC,
   lifetime).
2. `calcLcoP()` runs the 5-term cost build-up (§7.1) for the selected product and, separately, for
   all 6 products simultaneously (`allLcop`) to populate the comparison chart against each product's
   static 2025 market price.
3. **CO₂ source cost projection** (tab 3) linearly interpolates each of 5 CO₂ sources (DAC,
   Biogenic, Industrial, BECCS, Cement) between 2025/2030/2035 anchor costs — genuine piecewise-
   linear interpolation, static anchor values.
4. **Demand projections** (tab 6) use a compound-growth formula
   `demand(year_i) = base × (1+growthRate)^i` per product — a real exponential-growth model, with
   `base`/`growthRate` pairs chosen illustratively (e.g. e-SAF: base=0.05, growth=60%/yr).

### 7.4 Worked example

e-Ammonia, LCOH=€3.5/kg, CO₂Cost=€150/t (unused, co2Kg=0), ElecCost=€60/MWh, Capex=€700/tpa,
Opex%=3.5, WACC=8%, lifetime=20yr:

| Step | Computation | Result |
|---|---|---|
| h2Cost | 3.5 × 0.178 | €0.623/kg |
| co2CostKg | (150/1000) × 0 | €0.00/kg |
| elecCostKg | (60/1000) × 0.6 | €0.036/kg |
| CRF | 0.08 / (1 − 1.08⁻²⁰) = 0.08/(1−0.2145) | 0.1019 |
| capexAnnKg | 700 × 0.1019 | €71.3/tonne → €0.0713/kg |
| opexKg | 700 × 0.035 | €24.5/tonne → €0.0245/kg |
| **LCOP** | 0.623+0+0.036+0.0713+0.0245 | **€0.755/kg ≈ €755/t** |

Against the static 2025 market price of $480/t for grey/blue ammonia benchmark, this green ammonia
LCOP (~€755/t, roughly $810/t at typical EUR/USD) is meaningfully above the fossil incumbent —
consistent with the guide's cited 2–3× cost gap needing carbon-price or subsidy support.

### 7.5 Data provenance & limitations

- **Chemistry (stoichiometric H₂/CO₂ ratios, reaction formulas) is genuinely accurate** and grounded
  in real process engineering (Haber-Bosch, Fischer-Tropsch, Sabatier, methanol synthesis).
- **CAPEX/OPEX/efficiency/market-price figures are illustrative point estimates**, not sourced to a
  specific IRENA/BNEF/Hydrogen Council table row-by-row (though broadly consistent with the guide's
  cited ranges).
- No project-finance layer beyond LCOP — no debt sizing, no DSCR, no subsidy-stacking calculation
  despite the guide's claim of "carbon credit revenue stacking" and "H2Global subsidy modelling";
  these appear as descriptive tab labels without a corresponding computed subsidy bridge.
- CO₂ source cost interpolation and demand-growth curves are real formulas over illustrative anchor
  constants.

## Framework alignment

**IRENA Innovation Outlook: Electrofuels** — the LCOP cost-stacking approach (feedstock + capex
annuity + opex) mirrors IRENA's PtX costing methodology; anchor cost figures are illustrative rather
than sourced line-by-line from the report. **EU Innovation Fund / H2Global** — named as the subsidy
mechanisms that bridge green-fossil cost gaps; no subsidy calculation is implemented in code.
**ICAO CORSIA / EU ReFuelEU** — cited correctly as the demand-mandate drivers behind e-SAF's
aggressive growth-rate assumption (60%/yr) in the demand projection.
