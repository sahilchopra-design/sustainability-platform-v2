## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The MODULE_GUIDES entry (EP-DI2) advertises an **employment-
> multiplier + skill-overlap matrix** — `GreenJobs = GreenInvestment × EmploymentIntensity(sector,region)`
> and `SkillMatchScore = Σ w_skill·SkillOverlap(FossilSkill_i, GreenReq_j)`. **The investment→jobs
> multiplier and the skill-overlap matrix are not computed in code.** The page seeds current jobs and a
> growth rate per region, projects 2030 jobs, and scales them by two policy sliders. Real IRENA capacity
> data is wired in (`IRENA_RENEWABLE_CAPACITY_2023`). Sections below document the code; §8 specifies the
> employment-intensity model.

### 7.1 What the module computes

```js
currentJobs        = ⌊20 + sr(i·7)·480⌋                              // thousands, seeded
growthRate         = 5 + sr(i·11)·35                                 // %/yr, seeded
policyBoost        = 1 + (policyAmbition − 1)·0.1                     // slider multiplier
totalProjected2030 = Σ projectedJobs2030 · policyBoost · investmentMultiplier
avgGrowth          = mean(growthRate)
avgSkillsGap       = mean(skillsGap)
growthTrend:  frac = (yr − 2024)/11 ; interpolate current→2035 jobs
```
The two live controls are `policyAmbition` (→ `policyBoost`, +10% per ambition notch) and
`investmentMultiplier`, both applied linearly to the 2030 projection.

### 7.2 Parameterisation / provenance

| Field | Generator | Provenance |
|---|---|---|
| `currentJobs` | `⌊20 + sr·480⌋` (k) | synthetic per region |
| `growthRate` | `5 + sr·35` (%) | synthetic |
| `projectedJobs2030` | seeded | synthetic |
| `skillsGap`, `avgSalary` | seeded | synthetic |
| `policyBoost` | `1 + (policyAmbition−1)·0.1` | code rule (10%/notch) |
| `CLEAN_ENERGY_BY_TECH` (10) | `jobs_m` by technology | real-ish IRENA jobs anchors |
| `FOSSIL_FUEL_JOBS` (5) | `jobs_m` | comparison anchors |
| `IRENA_RENEWABLE_CAPACITY_2023` | wired via `IRENA_CAP` | **real** IRENA 2023 capacity data |

The one real dataset is IRENA capacity (`IRENA_CAP`); the region-level job counts and growth are seeded.

### 7.3 Calculation walkthrough

Seed regions → filter → aggregate current jobs, growth, skills gap. 2030 projection scales each region's
`projectedJobs2030` by the policy and investment sliders and sums. `growthTrend` linearly interpolates each
year's jobs between 2024 and 2035 via `frac`. `sectorData`/`growthBySector` group by sector; `scatterData`
plots salary vs skills gap.

### 7.4 Worked example

Region with `projectedJobs2030 = 300k`, sliders `policyAmbition = 3` (→ `policyBoost = 1 + 2·0.1 = 1.20`),
`investmentMultiplier = 1.1`:
`contribution = 300·1.20·1.10 = 396k` projected 2030 jobs. If `currentJobs = 250k`, the implied CAGR to
2030 is `(396/250)^{1/6} − 1 = 1.584^{0.167} − 1 ≈ 8.0%/yr`. The projection responds linearly to both
sliders — a transparent scenario tool, but the multipliers are policy scalars, not estimated
employment-intensity coefficients tied to investment.

### 7.5 Data provenance & limitations

- Region job counts and growth are **synthetic** (`sr(seed)=frac(sin(seed+1)·10⁴)`); IRENA capacity is real.
- The guide's core **investment→jobs multiplier** (jobs per $M by sector/region) is **not implemented** —
  the sliders are ad-hoc scalars, so the module cannot translate a specific green-investment plan into a
  jobs number.
- No skill-overlap matrix, so reskilling-pathway analysis (the guide's second formula) is absent.

**Framework alignment:** IRENA *Renewable Energy and Jobs Annual Review* (13.7M jobs 2022; the wired
capacity data and jobs anchors); IEA *World Energy Employment*; ILO Green Jobs Assessment Methodology (the
employment-intensity concept); IPCC AR6 WGIII Ch.17. Real employment-intensity studies estimate jobs/$M by
sector (renewables ~3× fossil) — specified in §8.

## 8 · Model Specification — Green Employment-Intensity & Skill-Transition Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Translate a green-investment programme into direct+indirect job creation by sector/region, and identify
lowest-friction reskilling pathways from fossil to green occupations — for policy and just-transition
planning.

### 8.2 Conceptual approach
Input-output employment-multiplier model (the ILO/IRENA method) combined with an occupational **skill-
overlap matrix** (O*NET-style), benchmarked against **IRENA jobs modelling** and **ILO Green Jobs
Assessment**: employment intensity per $M by sector from I-O tables; skill overlap from occupation skill
vectors.

### 8.3 Mathematical specification
```
Direct jobs      = Investment_sector · EI_direct(sector, region)          (EI = jobs/$M)
Indirect+induced = Investment_sector · (L·EI)      L = Leontief multiplier from I-O table
GreenJobs        = Σ_sector (Direct + Indirect + Induced)
SkillMatch(fossil→green) = Σ_skill w_skill · min(level_fossil,skill, req_green,skill)/req_green,skill
ReskillFriction  = 1 − SkillMatch ;  cost ∝ ReskillFriction · training_hours
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `EI_direct` | jobs/$M by sector/region | IRENA/ILO employment-factor studies |
| `L` | I-O employment multiplier | national input-output tables |
| skill vectors | occupation skill levels | O*NET / ESCO |
| `w_skill` | skill importance | O*NET importance weights |

### 8.4 Data requirements
Investment by sector/region; employment factors; I-O tables; occupation skill profiles. Sources: IRENA jobs
data (partly wired), national statistics I-O tables, O*NET/ESCO (free). The module holds IRENA capacity and
seeded jobs; the multipliers and skill matrix must be added.

### 8.5 Validation & benchmarking plan
Reconcile modelled jobs against IRENA's published renewables-jobs totals; validate multipliers against
national green-stimulus ex-post job studies; check skill-overlap predictions against realised transition
programmes (e.g. coal→solar retraining outcomes).

### 8.6 Limitations & model risk
Employment factors decline with automation and scale (learning); I-O multipliers assume fixed technical
coefficients. Skill overlap is coarse. Conservative fallback: report jobs as a range across employment-
factor scenarios and treat induced jobs (most uncertain) separately from direct+indirect.
