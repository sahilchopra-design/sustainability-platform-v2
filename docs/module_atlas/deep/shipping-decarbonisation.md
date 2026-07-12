## 7 · Methodology Deep Dive

### 7.1 What the module computes

60 synthetic vessel fleets (`FLEETS`, seeded `sr(s)=frac(sin(s+1)×10⁴)`) named with a mix of real shipping
line styles ("Maersk Ocean," "MSC Adriatic," "CMA CGM Pacific") and thematic decarbonisation names ("Net
Zero Ship," "Hydrogen Wave," "Carbon Free I"), each carrying an IMO CII (Carbon Intensity Indicator) letter
rating, EEXI (Energy Efficiency Existing Ship Index) value, fuel type, and retrofit economics:

```js
eexi              = 3 + sr()×22                                // 3–25
retrofitCapex     = 5 + sr()×195                                // $5–200M
greenFuelReadiness = 1 + sr()×9                                 // 1–10 scale
carbonIntensity    = 2 + sr()×18                                // 2–20 gCO2/dwt-nm (unit implied)
stranded2030Risk   = 5 + sr()×70                                // 5–75%
imoAligned         = sr() > 0.45                                // ~55% aligned
```

Interactive carbon-cost calculator with user-adjustable `carbonPrice` ($/tCO₂, default 75) and `fuelPrice`
($/tonne, default 600) sliders:

```js
annualCarbonCost   = carbonIntensity × fleetSize × carbonPrice × 0.001
fuelCostPerVessel  = fuelPrice × eexi × 0.1
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| CII rating | A–E, `sr()`-assigned uniformly | Real IMO CII letter-grade system (A=best, E=worst, per IMO's 2023 Carbon Intensity Indicator regulation) |
| EEXI | 3–25 | Real IMO metric name (Energy Efficiency Existing Ship Index, mandatory from 2023); numeric range here is illustrative, not a certified EEXI calculation |
| Fuel types | HFO, LNG, Methanol, Ammonia, Hybrid | Real marine fuel categories reflecting the actual current/emerging bunker fuel landscape |
| `avgCII` (portfolio KPI) | `mean(CII_RATINGS.indexOf(rating))` | Converts letter to a 0–4 ordinal index and averages — a defensible way to get a numeric portfolio CII summary from letter grades, though it treats the A→E scale as evenly spaced, which the real IMO CII boundary bands are not (bands are vessel-type and size-specific, non-linear) |

### 7.3 Calculation walkthrough

1. `filtered` applies ship-type/country/CII-rating filters over the 60 fleets.
2. Guarded KPIs: `avgCII` and `imoAlignedPct` both check `filtered.length` before dividing, avoiding
   NaN/Infinity on an empty filter result.
3. `ciiDist`/`fuelMix`/`retrofitByType` are straightforward count/sum aggregations across the filtered set.
4. **Carbon cost calculator**: for the first 20 filtered fleets, computes per-fleet `annualCarbonCost` (a
   function of the fleet's own `carbonIntensity` and `fleetSize`, scaled by the user's `carbonPrice`
   slider) and `fuelCostPerVessel` (a function of `eexi`, scaled by the `fuelPrice` slider) — both formulas
   use simple linear scaling constants (`×0.001`, `×0.1`) whose calibration is not sourced to a real
   bunker-fuel-consumption or carbon-cost model (e.g. they do not derive from actual vessel fuel
   consumption in tonnes/day × voyage days × emission factor).
5. **Stranding-risk scatter**: `x=avgAgeYrs`, `y=carbonIntensity` — a plausible visual proxy for stranded-
   asset risk (older, higher-carbon-intensity vessels facing IMO 2030/2050 tightening are the most exposed),
   though `stranded2030Risk` itself is an independently `sr()`-seeded field, not computed from the
   age/intensity relationship shown in the scatter.

### 7.4 Worked example

Fleet with `carbonIntensity=12.4`, `fleetSize=18`, `carbonPrice=$75/tCO₂` (default slider):
`annualCarbonCost = 12.4 × 18 × 75 × 0.001 = 16.74` (units as coded — likely intended as $M, though the
scaling constant `0.001` is not derived from any stated unit conversion, e.g. gCO₂/dwt-nm → tCO₂/year would
require voyage-distance and deadweight inputs not present in this model).

For `eexi=14.2`, `fuelPrice=$600/tonne`: `fuelCostPerVessel = 600 × 14.2 × 0.1 = $852` (again, units
undocumented — the `×0.1` scaling constant has no stated derivation).

### 7.5 Companion analytics on the page

- **CII Ratings / Fuel Transition / EEXI Compliance tabs** — descriptive distributions of the fleet's
  regulatory-compliance posture.
- **Retrofit Economics tab** — `retrofitByType` sums `retrofitCapex` by ship type, useful for prioritising
  which vessel category needs the most capital.
- **Green Fuel Pathways / IMO Alignment / Stranding Risk tabs** — descriptive views of
  `greenFuelReadiness`/`imoAligned`/`stranded2030Risk`, all independently `sr()`-seeded fields.

### 7.6 Data provenance & limitations

- **All 60 fleets and every numeric field are synthetic**, generated via `sr(seed)=frac(sin(seed+1)×10⁴)`;
  fleet names blend real shipping-line naming conventions with invented vessel names.
- **Carbon-cost and fuel-cost formulas use unsourced scaling constants** (`×0.001`, `×0.1`) rather than a
  physically-derived unit conversion chain (fuel consumption tonnes/day → voyage distance → CO₂ emission
  factor → carbon price) — treat the calculator's dollar outputs as illustrative order-of-magnitude, not
  audit-ready cost estimates.
- `avgCII`'s letter-to-ordinal conversion treats the 5-band CII scale as evenly spaced, which understates
  how much worse an "E" rating is in practice relative to "D" under IMO's actual (non-linear, vessel-type-
  specific) CII boundary methodology.
- `stranded2030Risk` is independently random rather than derived from the fleet's own age, CII rating, and
  green-fuel-readiness fields shown elsewhere on the page — a production stranding-risk model should
  compute this as a function of those inputs.

**Framework alignment:** IMO Carbon Intensity Indicator (CII) — the A–E letter-grade system and its
year-over-year tightening trajectory (referenced conceptually) matches the actual IMO MEPC 79/80
regulation, effective 2023 · IMO EEXI (Energy Efficiency Existing Ship Index) — real, mandatory metric name
correctly referenced, though not certified-calculation-grade here · the 5 alternative marine fuel types
(HFO as baseline, LNG, Methanol, Ammonia, Hybrid) reflect the actual current shipping-fuel transition
landscape as tracked by DNV's Alternative Fuels Insight platform and IMO's GHG strategy.
