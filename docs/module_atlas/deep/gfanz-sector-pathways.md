## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The MODULE_GUIDES entry describes a real GFANZ sector-
> alignment score `Alignment_s = 1 − (Intensity_portfolio − Intensity_pathway(t)) / (Intensity_baseline
> − Intensity_pathway(t))` computed from *issuer-level production and emissions data*. The **pathway
> maths is real and correctly implemented** (linear interpolation of IEA-NZE-style sector
> trajectories), but every **company's current intensity, alignment, capex-alignment, SBTi status and
> milestone progress is fabricated by the `sr()` PRNG** — there is no issuer emissions data. So the
> framework is right; the inputs are synthetic. Sections below document the real formulas and flag the
> synthetic inputs.

### 7.1 What the module computes

Per company, per sector (JSX ~line 1850+):

```js
seed      = sectorIndex*100 + companyIndex;
progress  = sr(seed)*0.6 + 0.2;                                  // SYNTHETIC 20–80% progress
current   = base2020 - (base2020 - tgt2050)*progress;           // implied current intensity
targetNow = base2020 - (base2020 - tgt2050)*((2026-2020)/(2050-2020));  // pathway at t=now
gap       = (current - targetNow)/targetNow * 100;              // % above/below pathway
alignment = clamp(100 - gap*1.5 + sr(seed+50)*20 - 10, 0, 100); // alignment score (+ noise)
scope1/2/3 = sr(seed+…)*base2020*{0.4,0.15}; scope3 = current - s1 - s2;   // SYNTHETIC
```

The pathway interpolation (`current`, `targetNow`) is exactly the guide's formula — a straight-line
draw-down from the 2020 baseline to the 2050 target. The alignment score is `100 − gap×1.5` (gap
above pathway penalised 1.5×), but with an `sr()×20 − 10` noise band bolted on, so the score is not
reproducible from the pathway alone.

### 7.2 Parameterisation (IEA-NZE-consistent sector pathways)

| Sector | Unit | 2020 baseline | 2050 1.5°C | 2050 2°C | 2050 NDC | Provenance |
|---|---|---|---|---|---|---|
| Power | gCO₂/kWh | 450 | 0 | 50 | 180 | IEA NZE / NGFS |
| Steel | tCO₂/t | 1.85 | 0.08 | 0.35 | 0.9 | worldsteel / IEA |
| Cement | kgCO₂/t | 620 | 120 | 200 | 380 | GCCA / IEA |
| O&G | kgCO₂e/boe | 55 | 8 | 18 | 32 | IEA |
| Aviation | gCO₂/RPK | 95 | 20 | 40 | 60 | IATA/ICAO |
| Shipping | gCO₂/t-nm | 12.5 | 1.8 | 3.5 | 6.5 | IMO/Poseidon |
| Auto | gCO₂/km | 180 | 0 | 20 | 65 | IEA |
| Buildings | kgCO₂/m² | 38 | 3 | 8 | 18 | CRREM/IEA |

These baseline and target intensities are **real and IEA-NZE consistent** (Power 450→0, Steel
1.85→0.08). The module also imports `SECTOR_BENCHMARKS` from the platform reference-data layer.
`MILESTONES_DATA` (37 real GFANZ/IEA milestones with `year` and `status`) is curated, not PRNG.

| Synthetic (PRNG) input | Formula |
|---|---|
| company progress | `sr(seed)*0.6 + 0.2` |
| alignment noise | `sr(seed+50)*20 − 10` |
| capex alignment | `sr(seed+99)*60 + 20` |
| region / SBTi status / transition-plan | `sr(seed+…)` categorical picks |
| scope 1/2/3 split | `sr(seed+…)*base2020*{0.4,0.15}` |

### 7.3 Calculation walkthrough

1. For each sector, interpolate the pathway intensity at "now" (`targetNow`) from 2020→2050 line.
2. Each company's `current` intensity is drawn from a synthetic `progress` fraction of that line.
3. `gap` = % by which current exceeds the pathway; `alignment` = 100 − 1.5×gap ± noise.
4. Aggregate: `avgAlign`, on-track vs off-track counts, sector stats, top leaders/laggards.
5. Milestone timeline positions each of 37 milestones by year and colours by status.
6. What-if sliders reweight sectors to show baseline-vs-adjusted portfolio alignment.

### 7.4 Worked example (a Power company)

Power: base2020 = 450, tgt2050(1.5°C) = 0. Suppose `sr(seed) = 0.5` → progress = 0.5×0.6+0.2 = 0.50.

| Step | Computation | Result |
|---|---|---|
| Current intensity | 450 − (450−0)×0.50 | 225 gCO₂/kWh |
| Pathway now (2026) | 450 − 450×(6/30) | 450 − 90 = 360 |
| Gap | (225 − 360)/360 × 100 | **−37.5%** (below pathway = ahead) |
| Alignment (no noise) | clamp(100 − (−37.5)×1.5 − 10, 0, 100) | clamp(146.25, 0, 100) = **100** |

The company is *ahead* of the linear pathway (225 < 360), so gap is negative and alignment caps at
100. Note the pathway draw-down is linear, whereas IEA NZE power decarbonisation is front-loaded —
a real GFANZ implementation would use the actual non-linear NZE curve, not a straight line.

### 7.5 Data provenance & limitations

- **Sector baseline/target intensities and the 37 milestones are real** (IEA NZE / sector bodies);
  `SECTOR_BENCHMARKS` is imported from the platform reference-data layer.
- **All company-level current intensity, alignment, capex-alignment, scope split, SBTi status and
  region are `sr()`-seeded synthetic** — no issuer emissions data enters the module.
- The pathway is **linear** 2020→2050; real sector pathways (esp. Power, Auto) are convex/front-loaded.
- The alignment score adds an `sr()×20 − 10` noise term, so it is not a deterministic function of the
  gap — two companies with identical gap get different alignment.

**Framework alignment:** *GFANZ Guidance on Use of Sectoral Pathways (2022)* — the alignment metric
(portfolio vs pathway vs baseline) follows GFANZ's fractional-progress definition. *IEA Net Zero by
2050* — sector baseline/target intensities are NZE-consistent; the pathway *should* interpolate the
real NZE curve rather than a straight line. *SBTi* — the sector decarbonisation approach and
company SBTi-status field reference SBTi validation tiers. *Poseidon Principles / IMO CII* — shipping
pathway. *CRREM* — buildings intensity pathway.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Company alignment is `sr()`-seeded with a
noise term and a linear pathway; below is the production sector-alignment model.

**8.1 Purpose & scope.** Compute issuer- and portfolio-level GFANZ sector-pathway alignment from real
production/emissions data for GFANZ membership reporting and engagement targeting across 8 hard-to-
abate sectors.

**8.2 Conceptual approach.** Physical-intensity convergence against the *actual* IEA-NZE (or NGFS
1.5°C) sector curve, benchmarked against **TPI's Carbon Performance** methodology and **PACTA/SBTi
SDA** (Sectoral Decarbonisation Approach). Portfolio alignment is production-weighted issuer
alignment.

**8.3 Mathematical specification.**

```
Pathway_s(t) = NZE_curve_s(t)                         (interpolated from published NZE points, non-linear)
Intensity_i  = Emissions_i / Production_i             (physical intensity, real data)
Alignment_i  = 1 − (Intensity_i − Pathway_s(t)) / (Baseline_s − Pathway_s(t))   (clamp 0–1)
ITR_i        = temperature at which Pathway_s(ITR) = Intensity_i   (implied temperature rise, SDA)
PortfolioAlign_s = Σ_i (Production_i/ΣProduction)·Alignment_i
```

| Parameter | Calibration source |
|---|---|
| NZE_curve_s(t) | IEA NZE 2023 sector intensity trajectories (free) |
| Baseline_s | 2020 sector intensity (IEA/worldsteel/GCCA) |
| Intensity_i | issuer CDP / annual-report emissions + production |
| ITR mapping | SBTi SDA / TPI carbon-performance benchmarks |

**8.4 Data requirements.** Issuer physical production + Scope 1–3 emissions (CDP, company reports —
free/vendor); IEA NZE sector curves (free); portfolio holdings with sector tags. Platform holds
`SECTOR_BENCHMARKS` and NGFS scenario tables; issuer intensity must be sourced (no synthetic).

**8.5 Validation & benchmarking.** Reconcile issuer alignment against TPI carbon-performance bands and
SBTi-validated targets; verify ITR against MSCI Implied Temperature Rise; backtest portfolio alignment
trend against realised emissions disclosures.

**8.6 Limitations & model risk.** Scope 3 data is sparse and inconsistent (flag DQ); production
metrics differ across issuers (normalise carefully); linear vs NZE-curve choice materially changes
alignment for front-loaded sectors — always use the published curve.
