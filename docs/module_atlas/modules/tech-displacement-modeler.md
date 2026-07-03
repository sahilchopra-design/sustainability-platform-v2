# Technology Displacement Modeler
**Module ID:** `tech-displacement-modeler` · **Route:** `/tech-displacement-modeler` · **Tier:** B (frontend-computed) · **EP code:** EP-CA3 · **Sprint:** CA

## 1 · Overview
S-curve technology adoption model with Wright's Law learning curves for 6 clean technologies. Includes cost crossover year calculation, job displacement vs. green job creation, and scenario sensitivity.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `SCENARIOS_LIST`, `TABS`, `TECHNOLOGIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `cost` | `learningCurve(yr - 2024, tech.lcoe.base, tech.lcoe.rate);` |
| `incumbentShare` | `Math.max(0, incumbentStart - share * 0.9);` |
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
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
**Standards:** ['IEA WEO', 'IRENA', 'BNEF']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).