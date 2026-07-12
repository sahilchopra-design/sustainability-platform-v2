## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide's formula `GDP_impact = Direct + Indirect +
> Productivity_loss` is never computed — there is no GDP-impact figure anywhere in the code. The
> guide's `Employment = Fossil_lost − Green_gained` **is** present, but only as two independent static
> fields per country (`transition_jobs_created_k`, `transition_jobs_lost_k`) that are hand-authored,
> not derived from any employment multiplier model. What the module actually implements well is a
> **deterministic, weighted transition-readiness score** and two **real curve-fitting functions**
> (logistic EV-adoption S-curve, linear scenario-interpolated energy mix) — genuinely more rigorous
> than most sibling modules in this batch.

### 7.1 What the module computes

20 countries (Germany, US, China, Japan, India, UK, France, Brazil, South Korea, Australia, Canada,
Saudi Arabia, South Africa, Indonesia, Mexico, Norway, Sweden, Poland, UAE, Chile) each carry 13
**hand-authored, static** energy-transition attributes (coal/renewable/nuclear generation %, EV sales
%, clean-energy investment $Bn, fossil subsidy $Bn, grid readiness, hydrogen strategy flag, CCUS
capacity, critical-minerals dependency tier, energy import dependency %, transition jobs
created/lost). These feed a genuine deterministic composite:

```js
transitionReadiness = min(renewable_pct,100)×0.30
                     + min(ev_sales_pct,100)×0.15
                     + grid_readiness×0.20
                     + min(clean_investment/(clean_investment+fossil_subsidy)×100, 100)×0.20
                     + (hydrogen_strategy ? 15 : 0)
```

### 7.2 Parameterisation

| Construct | Detail | Provenance |
|---|---|---|
| `IEA_SCENARIOS` (3: NZE/APS/STEPS) | Global temp 1.5°C/1.7°C/2.5°C, coal phase-out year 2040/2050/2060, oil/gas demand deltas, renewables %, EV share %, clean investment $tn | **Real** — correctly matches actual IEA World Energy Outlook scenario definitions and directional figures (NZE requiring no new fossil projects, 90% clean electricity by 2035 is accurately described in the narrative text) |
| `COUNTRY_TRANSITION` (20 countries × 13 fields) | Static, plausible real-world-consistent figures (Germany 52% renewable/0% nuclear post-phaseout; France 65% nuclear/1% coal; Saudi Arabia 99% fossil/$42Bn subsidy; Norway 98% renewable/82% EV sales) | Hand-authored, directionally accurate to each country's known energy profile, though undated/unsourced inline |
| Readiness weights (30/15/20/20/15) | Author-defined composite, no external calibration cited | — |
| `CRITICAL_MINERALS` (8) | Real minerals (Lithium, Cobalt, Nickel, Rare Earths, Copper, Silicon, Platinum, Manganese) with correct top-producer countries (DRC/Indonesia/Russia for Cobalt; China/Myanmar/Australia for Rare Earths) and plausible supply-risk tiers | **Real**, correctly-sourced geopolitical/geological facts |
| Portfolio-exposure fallback | `Math.round(30 + seed(i+99)×50)` for holdings whose country can't be matched to `COUNTRY_TRANSITION` | Synthetic demo value, only used as a fallback |

### 7.3 Calculation walkthrough — genuine curve models

- **Energy mix generator** (`generateEnergyMix`): linear interpolation over `t=(year−2020)/30` from
  a 2020 baseline (coal 27%, oil 30%, gas 23%, nuclear 10%, renewables 10%) toward each scenario's
  2050 endpoint — e.g. under NZE, coal declines `27 − t×27` (reaching 0% by 2050), renewables rise
  `10 + t×80` (reaching 90%); under STEPS, coal only declines to a 17% floor and gas actually *rises*
  (`23 + t×5`) — correctly capturing the IEA's qualitative scenario contrast in a simple linear model.
- **EV adoption curve** (`generateEVCurve`): a genuine **logistic S-curve** —
  `pct = 2 + A / (1 + e^(−k(t−t₀)))` with scenario-specific saturation `A` (93/65/40 percentage
  points), steepness `k` (8/7/6), and inflection point `t₀` (0.4/0.45/0.5 of the 2020-2040 span) —
  correctly modelling the real S-shaped technology-adoption pattern (slow start → rapid middle
  growth → saturation) rather than a naive linear ramp.
- **Transition readiness score**: applied live to all 20 countries (`countriesWithScores`) and
  ranked/colour-coded (green ≥70, gold ≥50, amber ≥30, red <30) for the "Readiness Ranked" bar chart.

### 7.4 Worked example — transition readiness, Germany

`renewable_pct=52, ev_sales_pct=31, grid_readiness=78, clean_energy_investment_bn=36,
fossil_subsidy_bn=12, hydrogen_strategy=true`:
```
renScore   = min(52,100)×0.30 = 15.6
evScore    = min(31,100)×0.15 = 4.65
gridScore  = 78×0.20 = 15.6
investRatio = 36/(36+12) = 0.75 → min(75,100)×0.20 = 15.0
h2Score    = 15
readiness  = round(15.6+4.65+15.6+15.0+15) = round(65.85) = 66
```
Compare Saudi Arabia (`renewable_pct=1, ev_sales_pct=1, grid_readiness=30,
clean_investment=5, fossil_subsidy=42, hydrogen_strategy=true`):
```
renScore=0.3, evScore=0.15, gridScore=6.0, investRatio=5/47=0.106→2.13, h2Score=15
readiness = round(0.3+0.15+6.0+2.13+15) = round(23.58) = 24
```
Correctly places Germany in the "Moderate-High" (gold) band and Saudi Arabia in the "Low" (red) band
— the formula behaves sensibly at both extremes.

### 7.5 Companion analytics

- **Energy mix stacked bar** (per-country) — `Coal/Renewable/Nuclear/OtherFossil` bars sorted by
  renewable share, direct rendering of the static country fields.
- **Investment vs Subsidy chart** — `Clean Investment` vs `Fossil Subsidies` per country, both static
  fields, letting a user visually assess each country's public-capital allocation stance.
- **Jobs chart** — `Created` vs `−Lost` (negated for a diverging bar) per country, both static fields
  with no netting formula applied in the chart itself (netting, if shown, would be a simple
  subtraction the chart does not perform — it displays both bars separately).
- **Critical Minerals** — reference table with demand-growth-to-2030 % and recycling-rate %, both
  plausible real figures (Lithium +340% demand growth by 2030 is broadly consistent with IEA critical
  minerals outlook orders of magnitude).

### 7.6 Data provenance & limitations

- All 20-country attribute values are static and undated; a production version should refresh
  against IEA World Energy Balances / Ember electricity data annually.
- The transition-readiness weighting (30/15/20/20/15) is author-chosen; no sensitivity analysis or
  external validation is presented.
- No GDP-impact or employment-multiplier model exists despite the guide's stated formulas — jobs
  created/lost are static per-country point estimates, not derived from a sectoral employment model.
- Portfolio Exposure tab's fallback readiness score for unmatched holdings (`30+seed(i+99)×50`) is
  synthetic and should not be conflated with the real 20-country readiness scores.

**Framework alignment:** IEA WEO NZE/APS/STEPS scenario framework is accurately represented, both
narratively and in the interpolated energy-mix/EV-curve outputs. NGFS and Cambridge Econometrics
E3ME (named in the guide as the underlying macro model) are not implemented — this module is a
country-level transition-readiness scorecard, not a macroeconomic GDP/employment simulation.
