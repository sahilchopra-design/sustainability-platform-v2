## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-CO5) states `Jobs(sector, year) =
> Deployment(sector, year) × Jobs_per_unit(sector)`. **No deployment × jobs-per-unit multiplication
> exists in the code.** The 2025/2030/2035/2040 job counts are **pre-tabulated static values** in the
> `SECTORS` array; the page sums and displays them, it does not derive them from a deployment path. This
> is a **static jobs-pipeline dashboard** across 8 green sectors, with wage, skills-taxonomy, geographic
> and policy-incentive views. §8 specifies the deployment-based projection the guide describes.

### 7.1 What the module computes

Essentially aggregation over static data:
```js
totalJobs2040 = Σ SECTORS.jobs2040
filteredSectors = selSector=='All' ? SECTORS : SECTORS.filter(s.sector==selSector)
```
The `SECTORS` rows carry `jobs2025/2030/2035/2040`, `avgWage`, `fossilWage`, `retrainingMo`, `certRequired`,
`topRegion`. `PIPELINE` gives a per-technology (solar/wind/ev/battery/hydrogen/retrofit/nature/circular)
deployment series; `GEO_DIST` a regional share/jobs split; `POLICY` a per-region incentive table.

### 7.2 Parameterisation / provenance

| Dataset | Fields | Provenance |
|---|---|---|
| `SECTORS` (9) | jobs2025–2040, avgWage, fossilWage, retrainingMo, certRequired, topRegion | static; job trajectories hand-tabulated (IRENA/ILO-informed) |
| `PIPELINE` (8) | solar, wind, ev, battery, hydrogen, retrofit, nature, circular | static deployment series |
| `GEO_DIST` (6) | share, jobs | static regional split |
| `POLICY` (7) | region, type, jobsEnabled, budgetBn | static policy table |

No PRNG here — every value is a literal. Named against IRENA/ILO ranges (65M green jobs by 2030, solar as
top sector) but not derived.

### 7.3 Calculation walkthrough

`selSector` filter → `filteredSectors`. Dashboard sums `jobs2040` across sectors. Wage-analysis tab
compares `avgWage` vs `fossilWage` per sector. Skills-taxonomy tab reads `certRequired`/`retrainingMo`.
Geographic tab maps `GEO_DIST`. Policy tab reads `POLICY.jobsEnabled`/`budgetBn`. All are direct reads of
static arrays with light aggregation.

### 7.4 Worked example

If the 8 sectors' `jobs2040` are (in millions) e.g. 12, 9, 8, 6, 4, 7, 3, 5, then
`totalJobs2040 = 12+9+8+6+4+7+3+5 = 54M`. Filtering to "Solar Installation" shows just that sector's
2025→2040 path (e.g. 4M→12M) and its wage premium (`avgWage − fossilWage`). These are lookups, not
projections — changing an assumed deployment rate would not move the numbers because deployment is not an
input.

### 7.5 Data provenance & limitations

- **All values are static literals** — informed by IRENA/ILO but not computed from any deployment model.
- The guide's `Deployment × Jobs_per_unit` projection is **absent**, so the tracker cannot answer "how do
  jobs change if solar deployment doubles?".
- Wage premiums and retraining months are single point estimates per sector, no distribution.

**Framework alignment:** IRENA *Renewable Energy and Jobs* (65M-by-2030 headline, solar leadership) and ILO
green-jobs methodology frame the static figures. Real jobs-per-unit factors (jobs/MW installed, jobs/GWh)
would drive the projection specified in §8.

## 8 · Model Specification — Deployment-Driven Green-Jobs Projection

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Project sector-level green employment 2025–2040 from technology deployment paths and jobs-per-unit factors,
with wage and reskilling overlays — for workforce and just-transition planning.

### 8.2 Conceptual approach
Deployment × employment-factor projection (the guide's formula), benchmarked against **IRENA jobs
modelling** and **IEA World Energy Employment**: annual capacity/output additions per technology times a
jobs-per-unit factor that itself declines on a learning curve, split into manufacturing/installation/O&M.

### 8.3 Mathematical specification
```
Jobs_direct(s,y) = Σ_phase Deployment(s,y,phase) · JF(s,phase,y)
JF(s,phase,y)    = JF0 · (Cum(s,y)/Cum0)^(−β)          (learning-curve decline, β from historical)
Jobs_total(s,y)  = Jobs_direct · (1 + indirect_ratio_s)
WagePremium(s)   = avgWage_s − fossilWage_s
ReskillDemand(s,y) = ΔJobs(s,y) · certRequired_s · retrainingMo_s
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `Deployment(s,y,phase)` | capacity/output additions | IEA/BNEF deployment forecasts |
| `JF` | jobs per unit (MW, GWh) | IRENA/ILO employment factors |
| `β` | jobs-factor learning rate | historical jobs-vs-cumulative-capacity |
| `indirect_ratio` | supply-chain multiplier | I-O tables |

### 8.4 Data requirements
Deployment paths per technology; jobs-per-unit factors by phase; wage data; certification/retraining
requirements. Sources: IEA/BNEF (deployment), IRENA/ILO (factors), national wage statistics. The module
holds static job totals and a `PIPELINE` deployment series — connect them via factors.

### 8.5 Validation & benchmarking plan
Reconcile projected totals against IRENA published sector jobs; back-test jobs-factor decline against
historical solar/wind employment; sensitivity to deployment and learning-rate assumptions.

### 8.6 Limitations & model risk
Jobs factors decline with automation and are region-specific; deployment forecasts are the largest
uncertainty. Conservative fallback: bound projections with low/high deployment scenarios and hold jobs
factors constant as a comparator to isolate learning-curve effects.
