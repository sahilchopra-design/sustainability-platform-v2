# Green Jobs & Growth Analytics
**Module ID:** `green-jobs-growth` · **Route:** `/green-jobs-growth` · **Tier:** B (frontend-computed) · **EP code:** EP-DI2 · **Sprint:** DI

## 1 · Overview
Tracks and forecasts green economy job creation across renewable energy, energy efficiency, EVs, sustainable agriculture, and circular economy. Models skill transition pathways, regional green job growth, and investment-to-employment multipliers for green sectors.

> **Business value:** Directly applicable to workforce development agencies, regional development banks, green bond impact reporting, and SDG 8 national action plans. Employment multipliers quantify the job creation co-benefit of climate investments — critical for just transition political economy.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `CLEAN_ENERGY_BY_TECH`, `COUNTRIES`, `ENTRY_BARRIERS`, `FOSSIL_FUEL_JOBS`, `GREEN_JOBS`, `IEA_COUNTRY`, `IEA_JOBS`, `INDIGO`, `IRENA_CAP`, `JOB_NAMES`, `PURPLE`, `SECTORS`, `TABS`, `YEAR_RANGE`

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
**Standards:** ['IEA World Energy Employment 2023', 'IRENA Renewable Power Generation Jobs 2023', 'ILO Green Jobs Assessment Methodology', 'IPCC AR6 WGIII Chapter 17']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).