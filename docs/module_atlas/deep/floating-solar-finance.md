## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives two structural formulae —
> `LCOE_FPV = LCOE_land × (1 + structural_premium) − cooling_benefit` and
> `Evap_savings = A_covered × ET_rate × shade_factor`. **Neither is computed.** In the code, `lcoe`,
> `structuralPremiumPct`, `coolingBoostPct` and `evaporationSavingML` are all **independently `sr()`-
> seeded fields**, so the LCOE is *not* built from a land baseline plus premium minus cooling, and evap
> savings is *not* `area × ET × shade`. Only the **revenue waterfall** and **cost-component breakdown**
> use real arithmetic. The sections below document what is computed vs seeded.

### 7.1 What the module computes

For 18 synthetic FPV projects, the page filters by country and aggregates:

```js
totalMw   = Σ capacityMw
avgLcoe   = Σ lcoe / n                      // seeded lcoe, just averaged
avgIrr    = Σ irrPct / n
totalEvapSaving = Σ evaporationSavingML
avgCoolingBoost = Σ coolingBoostPct / n
avgStructuralPremium = Σ structuralPremiumPct / n
```

**Revenue waterfall (real):**
```js
baseRevM      = capacityMw × 0.15 × 8760 × 55 / 1e6      // CF 15%, 8760h, $55/MWh
coolingBonusM = aepBoostGwh × 55 / 1e3                    // extra MWh × price
waterCreditM  = evaporationSavingML × 0.15 / 1e3          // water valued at $0.15/m³ equiv
aepBoostGwh   = capacityMw × coolingBoostPct/100 × 0.15 × 8760 / 1000   // (in the seed)
```
This chain *is* internally consistent: the cooling boost feeds an AEP uplift which feeds a revenue
bonus, and evaporation savings are monetised as a water credit.

### 7.2 Parameterisation / scoring rubric

**Seeded project fields** (`sr()` PRNG):

| Field | Formula | Range | Status |
|---|---|---|---|
| capacityMw | `1 + round(sr(i·7)·199)` | 1–200 MW | synthetic |
| coveragePct | `5 + sr(i·11)·20` | 5–25% | synthetic |
| evaporationSavingML | `capacityMw × (3 + sr(i·13)·7)` | scales with MW | synthetic |
| coolingBoostPct | `2 + sr(i·17)·3` | 2–5% | synthetic (feeds AEP boost) |
| structuralPremiumPct | `15 + sr(i·19)·10` | 15–25% | synthetic |
| lcoe | `42 + sr(i·23)·28` | $42–70/MWh | **synthetic — not derived** |
| irrPct | `6.0 + sr(i·29)·6.5` | 6–12.5% | synthetic |

**Cost components** (`COST_COMPONENTS`, hand-authored) carry the FPV-vs-ground cost delta: FPV adds a
Floating Structure (18%) and Anchoring (8%) line absent on land, while civil works fall (6% vs 12%) —
the real driver of the ~15–25% structural premium. These percentages are realistic FPV BOM shares.

**Country pipeline** (`COUNTRY_PIPELINE`) uses plausible installed/pipeline GW (China 1.8/8.5 GW) and
maturity tiers — curated, not random.

The **cooling boost (2–5%)** and **structural premium (15–25%)** ranges are physically credible: FPV
panels run cooler over water (typically +1–3% yield) and cost 10–25% more than ground-mount — but here
they are drawn randomly rather than modelled from water temperature or BOM.

### 7.3 Calculation walkthrough

1. Generate 18 projects with seeded fields; derive `aepBoostGwh` from `coolingBoostPct`.
2. Filter by country → KPIs (total MW, mean LCOE/IRR, total evap saving, mean cooling/premium).
3. Hydrology tab: evap saving, cooling boost, coverage per project.
4. Revenue waterfall: base + cooling bonus + water credit per project.
5. Structural tab: FPV vs ground cost component comparison.

### 7.4 Worked example (revenue waterfall)

A 100 MW project with `coolingBoostPct = 3.0`, `evaporationSavingML = 500`:
```
aepBoostGwh   = 100 × 3.0/100 × 0.15 × 8760 / 1000 = 100 × 0.03 × 0.15 × 8.76 = 3.94 GWh
baseRevM      = 100 × 0.15 × 8760 × 55 / 1e6 = 7.23 → $7.23M/yr
coolingBonusM = 3.94 × 55 / 1000 = $0.217M/yr        (cooling adds ~3% revenue)
waterCreditM  = 500 × 0.15 / 1000 = $0.075M/yr
```
So the cooling co-benefit (~$0.22M) and water credit (~$0.08M) together add ~4% to base revenue — the
FPV value proposition the module is built to show. Note the underlying LCOE ($42–70) is unrelated to
this cash flow because it is separately seeded.

### 7.5 Data provenance & limitations

- **LCOE, IRR, cooling boost, structural premium, evaporation savings are all `sr()`-seeded** —
  independent random draws, not linked to the guide's structural formulae.
- The revenue waterfall and cost-component breakdown *are* real arithmetic and internally consistent.
- Water credit price ($0.15/m³ equiv) and electricity price ($55/MWh) are hard-coded flat assumptions.
- Country pipeline is curated (realistic), not a live database.

**Framework alignment:** IEA/NREL LCOE framing (though not computed here) · FPV cooling-yield literature
(the 2–5% boost is the empirically observed range) · World Bank/SERIS FPV cost studies (the ~15–25%
structural premium). The guide's evaporation model (`A×ET×shade`) is the standard Penman-Monteith-based
approach, described but not implemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** LCOE, cooling boost, structural premium and
evaporation savings are seeded random values. Below is the production FPV techno-economic model that
would derive them.

### 8.1 Purpose & scope
Compute FPV project LCOE, the cooling-driven yield uplift, evaporation water savings, and the structural
cost premium versus an equivalent ground-mount plant — for project-finance and water-energy-nexus
decisions on reservoirs/lakes/irrigation ponds.

### 8.2 Conceptual approach
Three coupled blocks benchmarked against **World Bank/SERIS "Where Sun Meets Water"** FPV cost studies
and **NREL** FPV performance modelling: (i) an LCOE built from a ground-mount baseline plus a BOM-derived
structural premium minus the monetised cooling gain; (ii) a temperature-corrected PV yield model for the
cooling boost; (iii) a Penman–Monteith evaporation model for water savings.

### 8.3 Mathematical specification
```
LCOE_FPV   = LCOE_land · (1 + StructuralPremium) − CoolingBenefit_$/MWh
StructuralPremium = (Σ FPV_BOM − Σ ground_BOM) / Σ ground_BOM     from component stack
CoolingBoost = γ · (T_cell,land − T_cell,water)                    γ = PV temp coefficient ≈ −0.35%/°C
   T_cell,water = T_air + (NOCT−20)/800·G − ΔT_water-cooling
Evap_savings = A_covered · ET₀ · K_shade · (1 − f_wind-return)     ET₀ Penman–Monteith
Revenue    = (AEP_base + AEP_cooling)·price + Evap_savings·waterPrice
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| LCOE_land | ground-mount baseline | NREL ATB / IRENA regional LCOE |
| BOM shares | FPV vs ground components | World Bank/SERIS FPV cost report |
| γ | PV power temperature coefficient | module datasheets (−0.30 to −0.40%/°C) |
| ET₀ | reference evapotranspiration | FAO-56 Penman–Monteith, local met data |
| K_shade | evaporation-suppression factor | FPV field studies (0.7–0.9 for covered area) |
| waterPrice | value of saved water | regional water tariff / shadow price |

### 8.4 Data requirements
Per site: water-body area, coverage %, air/water temperature, solar resource (GHI), local ET₀, ground-
mount LCOE, water tariff. Sources: NREL ATB, IRENA, FAO CLIMWAT (ET₀), local met stations, World
Bank/SERIS BOM. The module already holds capacity, coverage and country.

### 8.5 Validation & benchmarking plan
Reconcile LCOE against World Bank/SERIS FPV case studies (target ±10%); validate cooling boost against
measured FPV-vs-ground yield differentials (1–3%); check evaporation savings against field-measured
suppression rates; sensitivity-test γ and K_shade.

### 8.6 Limitations & model risk
Cooling benefit depends on local water temperature and wind (return of humidity can offset ET
suppression); structural premium varies by anchoring depth. Conservative fallback: use the lower
cooling boost (1%) and higher structural premium for financing, and treat the water credit as optional
upside not core revenue.
