# Green Jobs & Growth Analytics
**Module ID:** `green-jobs-growth` · **Route:** `/green-jobs-growth` · **Tier:** B (frontend-computed) · **EP code:** EP-DI2 · **Sprint:** DI

## 1 · Overview
Tracks and forecasts green economy job creation across renewable energy, energy efficiency, EVs, sustainable agriculture, and circular economy. Models skill transition pathways, regional green job growth, and investment-to-employment multipliers for green sectors.

> **Business value:** Directly applicable to workforce development agencies, regional development banks, green bond impact reporting, and SDG 8 national action plans. Employment multipliers quantify the job creation co-benefit of climate investments — critical for just transition political economy.

**How an analyst works this module:**
- Browse green job categories by sector and skill level
- Model regional green employment from investment scenarios
- Analyse skill overlap between fossil and green sectors
- Calculate employment multipliers for green investment
- Generate SDG 8 (Decent Work) alignment report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `CLEAN_ENERGY_BY_TECH`, `COUNTRIES`, `ENTRY_BARRIERS`, `FOSSIL_FUEL_JOBS`, `GREEN_JOBS`, `IEA_COUNTRY`, `IEA_JOBS`, `INDIGO`, `IRENA_CAP`, `JOB_NAMES`, `PURPLE`, `SECTORS`, `TABS`, `YEAR_RANGE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CLEAN_ENERGY_BY_TECH` | 10 | `jobs_m`, `color` |
| `FOSSIL_FUEL_JOBS` | 5 | `jobs_m`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `currentJobs` | `+(20 + sr(i * 7) * 480).toFixed(0);` |
| `growthRate` | `+(5 + sr(i * 11) * 35).toFixed(1);` |
| `IRENA_CAP` | `Object.fromEntries((IRENA_RENEWABLE_CAPACITY_2023\|\|[]).map(c=>[c.country,c]));` |
| `policyBoost` | `1 + (policyAmbition - 1) * 0.1;` |
| `totalCurrent` | `filtered.reduce((s, j) => s + j.currentJobs, 0);` |
| `totalProjected2030` | `filtered.reduce((s, j) => s + j.projectedJobs2030 * policyBoost * investmentMultiplier, 0);` |
| `avgGrowth` | `filtered.length ? filtered.reduce((s, j) => s + j.growthRate, 0) / filtered.length : 0;` |
| `avgSkillsGap` | `filtered.length ? filtered.reduce((s, j) => s + j.skillsGap, 0) / filtered.length : 0;` |
| `sectorData` | `SECTORS.map(sec => {` |
| `growthTrend` | `YEAR_RANGE.map(yr => {` |
| `frac` | `(yr - 2024) / 11;` |
| `scatterData` | `filtered.map(j => ({ x: j.avgSalary, y: j.skillsGap, name: j.name }));` |
| `growthBySector` | `SECTORS.map(sec => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLEAN_ENERGY_BY_TECH`, `COUNTRIES`, `ENTRY_BARRIERS`, `FOSSIL_FUEL_JOBS`, `JOB_NAMES`, `SECTORS`, `TABS`, `YEAR_RANGE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Renewable Energy Jobs 2022 | — | IRENA Renewable Energy Jobs Annual Review 2023 | Solar PV (4.9M) and biofuels (2.4M) are largest employers — growing 16% yr-on-yr |
| Solar Employment Intensity | — | IRENA/ILO 2023 | Solar PV creates 7–15 direct jobs per $1M invested — 3× higher than gas power |
| Green Job Premium | — | OECD Green Employment Premium 2023 | Green sector jobs pay 15% more than sector average — higher in engineering/tech roles |
- **IRENA/IEA green employment data by sector/country** → Employment intensity benchmarking → **Jobs created per $M investment by green sector**
- **O*NET skill profiles for fossil and green occupations** → Skill overlap analysis → **Reskilling pathway matrix and training cost**
- **Green investment scenarios by sector/region** → Employment forecast → **Green job creation forecast by 2030/2040 by scenario**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Employment Multiplier
**Headline formula:** `GreenJobs = GreenInvestment × EmploymentIntensity(sector, region); SkillMatchScore = Σ [w_skill × SkillOverlap(FossilSkill_i, GreenRequirement_j)]`

Employment intensity (jobs per $M invested) varies by sector and region — renewable energy creates 3× more jobs per $M than fossil fuels; skill overlap matrix identifies reskilling pathways with lowest friction

**Standards:** ['IEA World Energy Employment 2023', 'IRENA Renewable Power Generation Jobs 2023', 'ILO Green Jobs Assessment Methodology', 'IPCC AR6 WGIII Chapter 17']
**Reference documents:** IRENA Renewable Energy Jobs Annual Review 2023; IEA World Energy Employment 2023; ILO Green Jobs: Towards Decent Work in a Sustainable, Low-Carbon World; OECD Green Growth and Promotion of Quality Jobs (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Build the investment→jobs multiplier and skill-overlap matrix (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's two core models are unimplemented: `GreenJobs = GreenInvestment × EmploymentIntensity(sector, region)` (renewables ~3× the jobs per $M of fossil) and `SkillMatchScore = Σ[w_skill × SkillOverlap(FossilSkill_i, GreenRequirement_j)]` — region job counts and growth are `sr()`-seeded (only IRENA capacity is real), and the §8 spec is marked "not yet implemented." Evolution A builds both: an employment-multiplier model applying sector/region employment intensities (jobs per $M) to real green-investment figures, and a skill-overlap matrix computing reskilling friction between fossil and green occupations — turning a seeded jobs display into the multiplier and transition-pathway tool the guide describes.

**How.** (1) A backend route computing green jobs from investment × employment intensity, with intensities from IRENA/ILO employment-factor data by sector/region. (2) A skill-overlap matrix (fossil occupation → green requirement) yielding a SkillMatchScore that ranks reskilling pathways by friction. (3) Real green-investment inputs (IRENA/BNEF) replacing the seeded region panel, with the real IRENA capacity kept.

**Prerequisites.** Employment-intensity factors by sector/region and a skill-taxonomy overlap source (IRENA/ILO); green-investment data; the seeded region data replaced (§7-flagged). **Acceptance:** green-jobs figures recompute from investment × intensity reproducing §5; the SkillMatchScore ranks reskilling pathways from a real overlap matrix; no `sr()` job count feeds a headline.

### 9.2 Evolution B — Just-transition workforce copilot (LLM tier 2)

**What.** A copilot for workforce-development and policy teams: "how many jobs would $10B of solar investment create in this region, and which fossil-worker skills transfer with lowest friction?" tool-calls the Evolution A multiplier and skill-overlap endpoints, narrating the employment impact and reskilling pathways.

**How.** Tier-2 tool-calling over the jobs-multiplier and skill-match endpoints; the grounding corpus is §5/§7 (IRENA/ILO employment factors, the skill-overlap concept). The copilot's value is quantifying investment-to-jobs and identifying low-friction reskilling routes. Guardrail, pre-Evolution-A: the multiplier is unbuilt and jobs seeded, so it must refuse job-count figures and answer only on the real IRENA capacity context. Every figure validated against tool output.

**Prerequisites.** Evolution A (no multiplier today); employment-factor data; corpus embedding. **Acceptance:** post-Evolution-A, every jobs and skill-match figure traces to a tool call reproducing the multiplier; pre-Evolution-A the copilot declines job projections and cites only real capacity data.