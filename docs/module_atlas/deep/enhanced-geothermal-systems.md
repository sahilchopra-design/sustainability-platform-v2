## 7 · Methodology Deep Dive

The guide (`LCOE_EGS(t) = Base_LCOE × (1−LR)^log₂(Cumulative_Wells)`, learning-curve pathway to
$45/MWh by 2035) is faithfully implemented, and the module goes further: it contains a genuine
**bottom-up EGS LCOE engine** (drilling + stimulation + surface plant capex, annuitised) plus a
Wright's-law learning curve and Newton-Raphson IRR. This is one of the more quantitatively sound
modules in the atlas; the only synthetic elements are the seeded project set and the flow-risk Monte
Carlo.

### 7.1 What the module computes

**Bottom-up LCOE** (`calcEgsLcoe`) — real capex build-up and capital-recovery annuity:
```js
wellCost     = depthKm × wellCostPerKm × 1e6 × 2       // injection + production well
totalDrill   = numWellPairs × wellCost
totalStim    = numWellPairs × stimCostPerWell × 1e6
surfacePlant = powerMw × 1.8e6                          // $1.8M/MW ORC plant
totalCapex   = totalDrill + totalStim + surfacePlant
annMwh       = powerMw × cf/100 × 8760
capexAnn     = totalCapex × w / (1 − (1+w)^(−lifetime)) // annuity, w = wacc/100
opexAnn      = opexMwyr × powerMw × 1000
LCOE ($/kWh) = (capexAnn + opexAnn) / annMwh
```

**Learning curve** (Wright's law, 15% learning rate):
```js
reduction = (nProjects/3)^(−log₂(1/0.85))              // exponent = −log₂(1/0.85) ≈ 0.234
lcoe_t    = lcoe × 1000 × reduction                    // $/MWh at cumulative deployment
```

**Flow-risk Monte Carlo** (20 paths): `power = flow × 4.2 × (temp−70)/3600 × 0.1` — a physically
motivated thermal-power proxy (4.2 kJ/kg·K water heat capacity, ΔT above 70 °C reinjection).

**IRR** via Newton-Raphson (200 iterations with analytic derivative).

### 7.2 Parameterisation / scoring rubric

| Parameter | Default | Provenance |
|---|---|---|
| Well cost per km | user slider | drilling-cost driver (DOE EGS Shot target) |
| Stimulation cost/well | user slider | hydraulic-stimulation capex |
| Surface plant | $1.8M/MW | ORC binary-plant cost (inline comment) |
| Water heat capacity | 4.2 kJ/kg·K | physical constant |
| Reinjection temp | 70 °C | thermal-cycle floor |
| Learning rate | 15% (0.85 factor) | consistent with DOE EGS Shot cost-down |
| LCOE target | $45/MWh by 2035 | DOE Enhanced Geothermal Shot |

`EGS_PROJECTS`, `STIMULATION_TECHNIQUES`, `GEOVISION_SCENARIOS` seed sets carry the project pipeline
and cost-reduction scenarios; project-level flow/temp variation is `sr()`-seeded around user inputs.

### 7.3 Calculation walkthrough

User sets depth, well-pairs, power, WACC, capacity factor, drilling/stim cost → `calcEgsLcoe` builds
total capex, annuitises it, and divides by annual generation → the learning curve projects LCOE down
as cumulative wells grow → the flow-risk MC shows the power-output distribution from flow/temperature
uncertainty → 2050 scenarios apply each GEOVISION cost-reduction to the base LCOE.

### 7.4 Worked example

A project: `depthKm = 4`, `wellCostPerKm = $5M/km`, `numWellPairs = 3`, `stimCostPerWell = $8M`,
`powerMw = 25`, `opexMwyr = $45k/MW·yr`, `wacc = 8%`, `lifetime = 30`, `cf = 90%`.
```
wellCost   = 4 × 5e6 × 2 = $40M/pair
totalDrill = 3 × 40e6 = $120M
totalStim  = 3 × 8e6  = $24M
surface    = 25 × 1.8e6 = $45M
totalCapex = 120 + 24 + 45 = $189M
annMwh     = 25 × 0.90 × 8760 = 197,100 MWh
w = 0.08 ; annuity = 0.08 / (1 − 1.08^−30) = 0.08 / 0.9006 = 0.0888
capexAnn   = 189e6 × 0.0888 = $16.79M/yr
opexAnn    = 45,000 × 25 = $1.125M/yr  (opexMwyr × powerMw × 1000)
LCOE = (16.79e6 + 1.125e6) / 197,100 MWh = $90.9/MWh
```
So a first-of-kind 25 MW EGS plant prices at ≈$91/MWh — roughly double the DOE 2035 target of $45/MWh.
The learning curve then shows how it converges: at 45 cumulative wells (15 projects × 3),
`reduction = (45/3)^−0.234 = 15^−0.234 = 0.53`, giving ≈$48/MWh — the module's core message that
drilling-cost learning is the path to the DOE target.

### 7.5 Companion analytics

- **Geological viability:** temperature-gradient/depth tables by basement region (UK Granite, etc.).
- **Induced-seismicity risk management:** stimulation-technique comparison (the EGS-specific hazard).
- **2050 GEOVISION scenarios:** cost-reduction pathways applied to the base LCOE.

### 7.6 Data provenance & limitations

- **The LCOE, learning-curve and IRR engines are genuine** and correctly specified; the surface-plant
  and thermal constants are physically grounded.
- **Project-level flow/temperature variation is synthetic**, seeded by `sr()`; the seed project set is
  editorial.
- The learning curve uses a single fixed 15% rate applied to a `nProjects/3` cumulative proxy, not
  actual global cumulative-capacity data.

**Framework alignment:** **DOE Enhanced Geothermal Shot (2024)** — the $45/MWh-by-2035 target and the
drilling-cost-reduction learning thesis; **MIT "The Future of Geothermal Energy" (2006)** — the EGS
hot-dry-rock resource and stimulation framing; **Wright's law / experience curves** — the (correctly
implemented) `(1−LR)^log₂(cumulative)` cost-decline model.
