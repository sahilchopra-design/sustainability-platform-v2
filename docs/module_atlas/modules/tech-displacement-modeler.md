# Technology Displacement Modeler
**Module ID:** `tech-displacement-modeler` · **Route:** `/tech-displacement-modeler` · **Tier:** B (frontend-computed) · **EP code:** EP-CA3 · **Sprint:** CA

## 1 · Overview
S-curve technology adoption model with Wright's Law learning curves for 6 clean technologies. Includes cost crossover year calculation, job displacement vs. green job creation, and scenario sensitivity.

**How an analyst works this module:**
- Select technology from 6 options (Solar, Wind, EV, Heat Pump, Green H₂, DAC)
- S-Curve tab shows adoption trajectory under selected scenario
- Cost Learning Curves compare LCOE trajectories
- Disruption Timeline marks crossover years
- Job Transition shows displacement vs creation balance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `SCENARIOS_LIST`, `TABS`, `TECHNOLOGIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECHNOLOGIES` | 25 | `name`, `incumbent`, `sector`, `color`, `icon`, `s_curve`, `k`, `t_mid`, `L` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `cost` | `learningCurve(yr - 2024, tech.lcoe.base, tech.lcoe.rate);` |
| `incumbentShare` | `Math.max(0, incumbentStart - share * 0.9);` |
| `trajectory` | `useMemo(() => buildTechTrajectory(tech, scenario), [tech, scenario]);  // All tech S-curves for comparison const allTechData = useMemo(() => { const years = Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `costData` | `useMemo(() => { const years = Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `disruption` | `useMemo(() => TECHNOLOGIES.map(t => ({ name: t.name, icon: t.icon, color: t.color, incumbent: t.incumbent, sector: t.sector, crossover: t.scenario_crossover[scenario],` |
| `totalStrandedVal` | `TECHNOLOGIES.reduce((s, t) => s + t.stranded_value_usd_bn, 0);` |
| `totalDisplacement` | `TECHNOLOGIES.reduce((s, t) => s + t.job_displacement_k, 0);` |
| `totalGreenJobs` | `TECHNOLOGIES.reduce((s, t) => s + t.green_jobs_k, 0);` |
| `net` | `t.green_jobs_k - t.job_displacement_k;` |
| `delta` | `t.scenario_crossover['Current Policies'] - t.scenario_crossover['Net Zero 2050'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SCENARIOS_LIST`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Solar PV Learning Rate | `LCOE₀ × (1-0.22)^t` | IRENA | Cost reduction per doubling of cumulative capacity |
| EV Cost Parity | `TCO crossover vs ICE` | BNEF EV Outlook | Year when EV total cost of ownership equals internal combustion |
| Green H₂ Parity | `Electrolyzer learning + RE cost` | Hydrogen Council | Year when green hydrogen cost matches gray hydrogen |
| Job Displacement | `Green jobs created - fossil jobs lost` | ILO/IRENA | Net employment impact of technology transition |

## 5 · Intermediate Transformation Logic
**Methodology:** Logistic S-curve + Wright's Law learning
**Headline formula:** `f(t) = L / (1 + exp(-k(t - t_mid))); LCOE(t) = LCOE₀ × (1-rate)^t`

Adoption follows a logistic S-curve with technology-specific parameters (L=maximum penetration, k=steepness, t_mid=inflection year). Cost decline follows Wright's Law: each doubling of cumulative production reduces cost by the learning rate (solar 20-25%, wind 15-18%, batteries 18-22%). Crossover year = when new tech LCOE < incumbent.

**Standards:** ['IEA WEO', 'IRENA', 'BNEF']
**Reference documents:** IEA Net Zero by 2050 Roadmap; IRENA Renewable Cost Database; BNEF New Energy Outlook; Wright's Law (1936)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Scenario-driven trajectories and true Wright's Law (analytics ladder: rung 2 → 3)

**What.** The S-curve and learning-curve formulas match the guide verbatim (§7.1) — a faithful implementation — but §7.3 documents the module's central defect: `buildTechTrajectory(tech, scenario)` accepts the scenario argument and never uses it, so the most prominent UI control changes nothing on the S-Curve and Cost tabs; only the static `scenario_crossover` lookup varies. And §7.4 shows "Wright's Law" is actually calendar-time exponential decay (`LCOE₀×(1−rate)^t`), not the cumulative-production-doubling law the label claims. Evolution A makes scenarios real and the learning curve honest.

**How.** (1) Parameterise the S-curve by scenario: per-scenario `{k, t_mid, L}` adjustments (Net Zero 2050 pulls `t_mid` earlier and raises `L`; Current Policies the reverse), calibrated so each technology's fitted crossover year reproduces its existing `scenario_crossover` values — the static lookups become derived outputs, closing the loop. (2) Implement actual Wright's Law: `LCOE = LCOE₀ × (Q/Q₀)^(−b)`, `b = −log₂(1−LR)`, with cumulative deployment `Q(t)` integrated from the scenario's own S-curve — cost decline then correctly accelerates when adoption steepens, coupling the two engines. (3) Calibrate against IRENA's published per-doubling learning rates (solar 20–25%) and historical LCOE series (IRENA Renewable Cost Database, free), reporting fit error per technology. (4) Source the 0.9 incumbent-displacement factor or expose it as a labelled assumption slider.

**Prerequisites.** The §7.3 dead-parameter fix is the gating change; historical deployment/LCOE series seeded per technology for calibration. **Acceptance:** switching scenario visibly moves both trajectory charts; derived crossover years match the legacy static table within ±1 year; the §7.4 worked example (solar 22.5% at t_mid) still bench-pins the logistic core.

### 9.2 Evolution B — Disruption-thesis copilot with tool-called curve what-ifs (LLM tier 1 → 2)

**What.** A copilot for transition-equity analysts: "when does DAC reach 10% adoption under Net Zero, and what's its cost then?" answered by evaluating the module's own logistic and learning functions, and "explain why EV's crossover moves 10 years under Current Policies" narrated from the scenario deltas the Disruption Timeline already computes (§7.5).

**How.** Tier 1 first: this Atlas page is strong grounding (§7.1 formulas, §7.2 parameter table, §7.4 worked math), so the copilot can explain logistic behaviour (`f(t_mid)=L/2`), learning-rate compounding, and the job-transition arithmetic (`net = green_jobs − displacement`) against the on-page values, while disclosing per §7.6 that parameters are hand-curated estimates styled on IEA/IRENA/BNEF. Tier 2 requires a thin backend: port `sCurve`/`learningCurve`/`buildTechTrajectory` into a Pydantic-typed route (the module currently has none — tier B, frontend-only) and auto-generate tool schemas, enabling parametric what-ifs ("solar at learning rate 15%, ceiling 55%") executed rather than approximated. Cross-link: the sibling `tech-disruption-watchlist`'s tipping-point caption asserts the 16% S-curve inflection this module can actually compute — a natural first cross-module tool call.

**Prerequisites (hard).** Evolution A's scenario wiring first — a copilot explaining scenario differences on tabs where scenarios do nothing would be narrating a control that is documented dead. **Acceptance:** every adoption/cost figure in an answer reproduces from the two formulas at stated parameters; parameter-provenance questions get the hand-curated disclaimer, not an invented citation.