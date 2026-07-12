## 7 · Methodology Deep Dive

This module implements the guide's two named formulas **exactly as specified** — a genuine logistic
S-curve adoption model and an exponential learning-curve cost-decline model — making it one of the
more faithful implementations in this batch. The one defect: the **scenario selector does not
actually affect the S-curve or cost trajectory it's wired to**, only a separately-displayed static
crossover-year field.

### 7.1 What the module computes

```js
sCurve(t, k, t_mid, L) = L / (1 + exp(−k×(t − t_mid)))            // logistic adoption curve
learningCurve(t, lcoe0, rate) = lcoe0 × (1−rate)^t                  // exponential cost decline
```

Both match the guide's formulas verbatim. 6 clean technologies (`TECHNOLOGIES`: Solar PV, Wind,
Electric Vehicles, Heat Pumps, Green Hydrogen, Direct Air Capture — the guide's "6 clean
technologies," though the metadata array itself is named for a broader "25 rows" seed schema in the
assignment, likely referring to a different generated column count) each carry real-world-styled
S-curve parameters (`k` steepness, `t_mid` inflection year, `L` maximum market-share ceiling),
learning-curve parameters (`lcoe.base`, `lcoe.rate`), current market share, stranded-asset value,
job-displacement/green-jobs counts, and a **static** per-scenario crossover year
(`scenario_crossover: {Current Policies, Below 2°C, Net Zero 2050}`).

### 7.2 Parameterisation

| Technology | k (steepness) | t_mid | L (ceiling %) | LCOE base | Learning rate |
|---|---|---|---|---|---|
| Solar PV | 0.22 | 2028 | 45% | $38/MWh | 12%/yr |
| Wind | 0.18 | 2030 | 38% | $45/MWh | 9%/yr |
| EV | 0.25 | 2029 | 95% | $220 (battery-equiv) | 8%/yr |
| Heat Pumps | 0.20 | 2031 | 80% | $180 | 7%/yr |
| Green Hydrogen | 0.14 | 2035 | 55% | $5.50/kg | 10%/yr |
| Direct Air Capture | 0.16 | 2038 | 20% | $400/tCO₂ | 15%/yr |

Steepness (`k`) and inflection year (`t_mid`) roughly track real-world technology maturity —
EV has the steepest curve (0.25, fastest S-curve) with the earliest inflection among the six, DAC the
shallowest and latest — a directionally sound calibration consistent with IEA/BNEF adoption-curve
literature, though the specific numeric values are not individually cited to a single external
source.

### 7.3 The scenario-selector defect

```js
function buildTechTrajectory(tech, scenario) {           // scenario parameter accepted...
  ...
  const share = sCurve(yr, tech.s_curve.k, tech.s_curve.t_mid, tech.s_curve.L);     // ...but never used
  const cost  = learningCurve(yr-2024, tech.lcoe.base, tech.lcoe.rate);              // ...here either
  ...
}
```

`buildTechTrajectory(tech, scenario)` takes a `scenario` argument and the page's "Scenario
Sensitivity" tab lets the user pick Current Policies / Below 2°C / Net Zero 2050 — but the function
body never references the `scenario` parameter. The S-curve and cost-learning trajectories shown in
the "S-Curve Adoption" and "Cost Learning Curves" tabs are **identical regardless of which scenario
is selected**. Only the separately-stored `tech.scenario_crossover[scenario]` static lookup value
(displayed in the Disruption Timeline tab) actually varies by scenario. This means the module's most
prominent interactive control has no effect on two of its five tabs' primary charts.

### 7.4 Worked example

Solar PV at year 2028 (`t_mid`): `share = sCurve(2028,0.22,2028,45) = 45/(1+exp(0)) = 45/2 = 22.5%` —
correctly the curve's exact half-maximum point at its inflection year, as expected for a logistic
function (`f(t_mid)=L/2` always). At 2035: `share = 45/(1+exp(−0.22×7)) = 45/(1+exp(−1.54)) =
45/(1+0.214) = 45/1.214 ≈ 37.1%` — approaching but not yet at the 45% ceiling, correctly asymptotic.

Cost: `learningCurve(2035−2024=11, 38, 0.12) = 38×(1−0.12)^11 = 38×0.88^11 = 38×0.2382 ≈ $9.05/MWh`
— an ~76% cost reduction over 11 years at a flat 12%/yr *calendar-time* decline rate. Note this
differs from **true Wright's Law**, which conditions cost decline on *cumulative production
doublings*, not elapsed calendar time — the guide labels this "Wright's Law learning curves" but the
actual formula (`LCOE₀×(1−rate)^t`, t = years) is a **calendar-time exponential decay**, a common and
reasonable simplification when cumulative-production data isn't available, but not literally Wright's
Law (which would require `LCOE = LCOE₀ × (cumulative_production/production₀)^(-b)`, with `b` derived
from the learning rate via `b = -log₂(1-rate)`).

`incumbentShare = max(0, incumbentStart − share×0.9)` — the incumbent's share declines at 90% of the
new technology's share gain rate (not 1:1), implicitly modelling that ~10% of the new technology's
growth comes from new demand/market expansion rather than pure incumbent displacement — a reasonable
modelling choice, though the 0.9 factor is not independently sourced.

### 7.5 Companion analytics

- **Job Transition tab** — `totalDisplacement` (Σ job_displacement_k) vs `totalGreenJobs` (Σ
  green_jobs_k) and per-tech `net = green_jobs_k − job_displacement_k`; both are static per-tech
  literals, summed correctly, matching the guide's "net positive by 2030" framing directionally (EV:
  1800 green vs 1400 displaced = +400k net; Solar: 1200 vs 420 = +780k net).
- **Disruption Timeline** — `delta = scenario_crossover['Current Policies'] −
  scenario_crossover['Net Zero 2050']` correctly quantifies how much later cost/adoption crossover
  arrives under a weaker-policy scenario (e.g. Solar: 2038−2028=10 years later under Current
  Policies vs Net Zero 2050) — this is the one place scenario choice genuinely changes a displayed
  number.

### 7.6 Data provenance & limitations

- S-curve and learning-curve parameters, stranded-value, and job figures are **hand-curated
  illustrative estimates** styled on real IEA/IRENA/BNEF/ILO reporting, not live-sourced from those
  organisations.
- The scenario selector does not affect the S-curve/cost trajectory charts (§7.3) — a functional gap
  between the UI control and two of the five tabs it should drive.
- "Wright's Law" is used loosely — the implemented formula is calendar-time exponential decay, not a
  cumulative-production-doubling learning curve (§7.4).

**Framework alignment:** IEA WEO, IRENA Renewable Cost Database, and BNEF New Energy Outlook are
correctly named as the conceptual basis for both the adoption S-curves and cost-decline rates (solar
12%/yr and similar magnitude rates are broadly consistent with IRENA's published 20-25% *per-doubling*
learning rates once converted to an equivalent annual rate at typical capacity-growth speeds, though
the two rate definitions are not interchangeable — see §7.4). ILO/IRENA job-transition framing
("net positive by 2030") is reflected in the displacement-vs-creation comparison.
