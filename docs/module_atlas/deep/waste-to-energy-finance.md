## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry gives an NPV formula
> (`WtE_NPV = Σ[(GateFee+EnergyRevenue+CarbonCredit−CapEx/n−OpEx−CarbonCost)/(1+r)^t]`) and a biogas
> yield formula (`BiogasYield = OrganicFraction × VS × BMP × ConversionEfficiency`). **Neither is
> implemented.** There is no discount rate, no multi-year cash-flow loop, and no biogas-yield
> calculation anywhere in the file. The module is a 55-project synthetic directory with two simple
> portfolio aggregates (gate-fee revenue, carbon-credit value) computed from user-adjustable sliders.
> This module significantly overlaps the sibling `waste-to-energy-biogas-finance` module (which has
> a similar gap — see its deep dive for the recommended production project-finance model, §8; not
> repeated here to avoid duplication).

### 7.1 What the module computes

55 synthetic projects (`PROJECTS`) across 6 technology types (Incineration, AD, Gasification,
Landfill Gas, Pyrolysis, Biomass), 6 regions, 12 countries, with independent `sr()`-seeded fields:
`capacityMW` (5–300), `wasteProcessed` (50–1,000 kt/yr), `energyOutput = capacityMW × (2000+sr·3000)
/1000` (GWh, an implied 2,000–5,000 full-load-hour range per project), `projectValue`, `lcoe`
($60–200/MWh), `carbonCredits` (5–150 kt), `co2Intensity`, `irr` (4–22%), `subsidyEligible` (boolean).

Two genuinely-computed portfolio aggregates respond to sliders:

```js
gateRevenue = totalWaste × gateFee / 1000            // $M, gateFee slider $/tonne (default 45)
creditValue = totalCredits × carbonPrice / 1000       // $M, carbonPrice slider $/tCO2e (default 55)
avgLcoe     = Σ lcoe_i / n                             // simple mean of filtered projects' random lcoe field
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `capacityMW` | 5–300 | `5 + sr(i·3)·295`, synthetic uniform |
| `energyOutput` implied full-load-hours | 2,000–5,000 h/yr | `2000 + sr(i·19)·3000`, synthetic uniform — plausible but not technology-specific (a 300MW EfW plant and a 5MW LFG unit draw from the same distribution) |
| `lcoe` | $60–200/MWh | `60 + sr(i·31)·140`, synthetic uniform, independent of `type` |
| `irr` | 4–22% | `4 + sr(i·43)·18`, synthetic uniform, independent of `capacityMW`/`lcoe`/`subsidyEligible` |
| `subsidyEligible` | ~60% True | `sr(i·47) > 0.4` |

Critically, **`lcoe` and `irr` are independent random draws per project, not functions of `type`** —
an Incineration project and a Landfill Gas project have the same expected LCOE distribution in code,
even though the guide's own reference data (and the sibling biogas module) show LFG should be
materially cheaper than mass-burn EfW.

### 7.3 Calculation walkthrough

1. Filters (`typeFilter`, `regionFilter`, `statusFilter`) reduce `PROJECTS` (55) to `filtered`.
2. `totalCapacity`, `totalWaste`, `totalEnergy`, `totalCredits` are simple sums over `filtered`.
3. `avgLcoe = Σlcoe/n` — an unweighted mean (a $5MW project and a $300MW project count equally).
4. `gateRevenue` and `creditValue` respond live to the `gateFee`/`carbonPrice` sliders, multiplying
   the *filtered* portfolio's `totalWaste`/`totalCredits` by the slider value — this is the only
   slider-reactive calculation in the module.
5. `typeCapData`/`typeLcoeData`/`typeCreditData` group `filtered` by technology type for bar charts —
   `typeLcoeData` averages the random `lcoe` field per type, which (given point 7.2's independence
   from `type`) produces a chart that looks like a genuine technology cost comparison but is
   statistical noise around a common mean, not a true technology cost curve.
6. `scatterData` plots `wasteProcessed` vs `energyOutput` per project — since `energyOutput` is
   derived from `capacityMW` (not `wasteProcessed`) via the full-load-hours formula, and
   `wasteProcessed` is an independent random draw, the scatter shows no structural correlation
   despite waste throughput and energy output being causally linked in reality.

### 7.4 Worked example

At default sliders (`gateFee=$45/t`, `carbonPrice=$55/tCO2e`), if `filtered` (all 55 projects)
totals `totalWaste = 28,500 kt` and `totalCredits = 4,200 kt`:

```
gateRevenue = 28,500 × 45 / 1000 = $1,282.5M
creditValue = 4,200 × 55 / 1000 = $231.0M
```

These are portfolio-level, not per-project, figures — useful as an order-of-magnitude market-sizing
view but not attributable to any single project's bankability.

### 7.5 Data provenance & limitations

- **All 55 projects are synthetic**, with real-sounding operator-style names (Thames/Biffa/Veolia-
  style prefixes) but no correspondence to actual WtE facilities.
- **LCOE and IRR are technology-independent random draws** — the single largest limitation, since the
  guide's own methodology (and industry data) shows LCOE varies 3× across WtE technologies (LFG
  ~$48/MWh vs Plasma Arc ~$165/MWh per the sibling module's `TECHNOLOGIES` table).
- No discount-rate/NPV, biogas-yield, or EU ETS carbon-cost-post-2026 calculation exists despite
  being the guide's headline formulas.

**Framework alignment:** EU ETS WtE Inclusion 2026 Rules, IEA Bioenergy WtE Task 36, ISWA WtE
Guidelines 2022, and EU RED III Biomethane (all named in the guide) are **not implemented** as
calculations — they appear only in the guide text, not in any code-level EF/tariff/threshold value.
See `waste-to-energy-biogas-finance`'s §8 Model Specification for the recommended production
project-finance cash-flow model, which applies equally to this module's project universe.
