## 7 · Methodology Deep Dive

This module projects H₂ **cost-parity timelines**, electrolyser **cost-down curves**, infrastructure
buildout capex, sector demand and export-hub viability. Despite the guide (EP-CL3) naming an
experience-curve law `Cost(t)=Cost₂₀₂₄×(CumCap(t)/CumCap₂₀₂₄)^(−LR)`, the code does **not** implement
a learning curve on cumulative capacity — it interpolates cost between anchor years. The mismatch is
methodological (interpolation vs Wright's-law), so it is flagged below.

> ⚠️ **Guide↔code note.** The guide's headline formula is the classic Wright/experience-curve
> `Cost(t) = Cost₀ × (CumCap(t)/CumCap₀)^(−LearningRate)`. The code instead uses a **time-based
> interpolation** between hard-coded cost anchors (2024/2030/2040/2050). No cumulative-capacity series
> or learning-rate exponent appears anywhere in the file. Costs are therefore scenario assumptions,
> not endogenous outputs of a deployment model.

### 7.1 What the module computes

**H₂ cost parity** — sinusoidally-adjusted linear interpolation between anchor costs:

```js
t    = (yr − 2024) / (2050 − 2024)
cost = cost2024 + (cost2050 − cost2024)·t
       + (cost2030 − cost2024 − (cost2050 − cost2024)·((2030−2024)/(2050−2024)))·sin(π·t)
cost = max(0.5, cost)
```

The `sin(π·t)` term is a bump that forces the interpolated curve through the 2030 anchor while
returning to the linear endpoints at t=0 and t=1 (sin 0 = sin π = 0). It is a **curve-fitting
device**, not a decarbonisation dynamic.

**Electrolyser learning curve** — a piecewise linear blend of 2024→2040 anchors (also not Wright's law).

**Infrastructure investment**:

```js
totalInfraInvest = Σ_item  needed2040 × costPerUnit
```

### 7.2 Parameterisation (anchor tables)

| H₂ type | 2024 | 2030 | 2040 | 2050 ($/kg) | Basis |
|---|---|---|---|---|---|
| Green (electrolysis+RE) | 4.5 | 2.8 | 1.5 | 1.0 | Hydrogen Council / IRENA cost-down |
| Blue (SMR+CCS) | 2.0 | 1.8 | 1.6 | 1.5 | Gas-price + CCS capex |
| Gray (SMR) | 1.2 | 1.5 | 2.0 | 2.8 | Rises with carbon price |

| Electrolyser | 2024 $/kW | 2030 | 2040 | η % | Life (h) | TRL |
|---|---|---|---|---|---|---|
| Alkaline (AEL) | 700 | 400 | 250 | 65 | 80 000 | 9 |
| PEM | 1200 | 600 | 350 | 60 | 60 000 | 8 |
| SOEC | 2500 | 1000 | 500 | 80 | 40 000 | 6 |

| Infra item | needed 2040 | $/unit | 2040 capex |
|---|---|---|---|
| Pipeline (km) | 75 000 | 1.5 $M/km | $112.5B |
| Storage (TWh) | 3.0 | 500 $M/TWh | $1.5B |
| Terminals | 25 | 800 $M/unit | $20B |
| Electrolyzers (GW) | 550 | 600 $M/GW | $330B |

All anchor values are consistent with published Hydrogen Council / IRENA / IEA ranges; they are
**assumptions**, not model outputs.

### 7.3 Calculation walkthrough

`costTimeline` and `learningCurve` are computed once at module load over fixed year vectors.
`totalDemand2030/2050` sum the `DEMAND_SECTORS` table; `totalInfraInvest` sums `needed2040×costPerUnit`
(≈$464B, displayed as "~$464B needed by 2040"). The parity KPI is a static "~2032" string, not
derived from the crossover of the green and gray curves.

### 7.4 Worked example (Green H₂ at 2035)

```
t     = (2035−2024)/26 = 0.423
linear= 4.5 + (1.0−4.5)·0.423 = 4.5 − 1.48 = 3.02
bump  = (2.8 − 4.5 − (1.0−4.5)·(6/26))·sin(π·0.423)
      = (2.8 − 4.5 + 0.808)·sin(1.329)
      = (−0.892)·0.971 = −0.866
cost  = max(0.5, 3.02 − 0.866) = $2.15/kg
```

So green H₂ interpolates to ≈$2.15/kg in 2035 — between the 2030 anchor ($2.8) and 2040 anchor
($1.5), with the sine bump honouring the 2030 waypoint.

### 7.5 Data provenance & limitations

- All cost/demand/infra figures are **hand-authored anchors** from Hydrogen Council / IRENA / IEA;
  no PRNG randomness is used here (the seeded `sr` from sibling modules is absent).
- The **learning curve is not a learning curve** — no cumulative capacity, no experience-rate
  exponent. Parity is therefore not endogenous to deployment; a policy shock cannot move the curve.
- Blue/gray cost paths embed an implicit carbon-price rise (gray climbs 1.2→2.8) but no explicit
  carbon-price input is exposed.

## 8 · Model Specification — Endogenous H₂ Cost-Down (Wright experience curve)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Turn the displayed cost paths into *outputs* of a deployment model so parity year responds to policy,
capacity additions and electricity price — the decision the guide's formula promises.

### 8.2 Conceptual approach
Wright's law (one-factor experience curve) on cumulative electrolyser capacity, mirroring IEA ETP and
BNEF electrolyser cost-down modelling, coupled to an LCOH stack (electricity + capex CRF + O&M).

### 8.3 Mathematical specification
```
CAPEX(t)   = CAPEX₀ · (CumCap(t)/CumCap₀)^(−b),  b = −log₂(1−LR)   (LR = learning rate)
CRF        = r(1+r)^N / ((1+r)^N − 1)
LCOH(t)    = [CAPEX(t)·CRF + O&M] / (8760·CF·η_kg) + P_elec(t)/(η_kWh)  + waterOPEX
Parity year= min{ t : LCOH_green(t) ≤ LCOH_gray(t) + CarbonPrice(t)·EF_gray }
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `LR` | Learning rate per doubling | IRENA 13–18% (PEM); IEA ETP |
| `CumCap(t)` | Installed GW trajectory | IEA H₂ project database; BNEF pipeline |
| `P_elec(t)` | Electricity price path | NGSF/IEA WEO regional LCOE |
| `EF_gray` | Gray H₂ emissions factor | ~9–10 kgCO₂/kgH₂ (IEA) |
| `CarbonPrice(t)` | Policy path | EU ETS forward; NGFS carbon-price scenarios |
| `r, N` | WACC, plant life | Project-finance defaults (7–9%, 20–25 y) |

### 8.4 Data requirements
Electrolyser capex anchors (have), installed-capacity trajectory (needs IEA/BNEF pipeline ingest),
regional electricity price paths, carbon-price scenarios (partially in platform NGFS/ETS contexts),
capacity factor by resource region (export-hub table gives a proxy).

### 8.5 Validation & benchmarking plan
Backtest capex against realised 2015–2024 electrolyser prices (BNEF series); reconcile parity year
against IEA/BNEF published parity ranges; sensitivity of parity to LR (±5pp) and electricity price
(±$20/MWh); stability under alternative capacity trajectories.

### 8.6 Limitations & model risk
One-factor Wright's law ignores input-cost shocks (iridium/platinum for PEM) and floors capex too
aggressively at extreme cumulative capacity — cap CAPEX at a technology floor. Parity is sensitive to
the assumed electricity price and carbon path; present a parity *range*, not a point year.

**Framework alignment:** IRENA *Green Hydrogen Cost Reduction* (learning rates) · IEA *Global Hydrogen
Review* / ETP (cost-down + demand) · Hydrogen Council *Hydrogen Insights* (parity narrative). The
current module reproduces their published *ranges* as fixed anchors rather than deriving them.
