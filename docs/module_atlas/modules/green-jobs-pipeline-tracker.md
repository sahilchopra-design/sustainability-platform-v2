# Green Jobs Pipeline
**Module ID:** `green-jobs-pipeline-tracker` · **Route:** `/green-jobs-pipeline-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CO5 · **Sprint:** CO

## 1 · Overview
8 green sectors with 2025-2040 job projections, skills taxonomy, wage analysis, and geographic distribution.

**How an analyst works this module:**
- Green Jobs Dashboard shows 8-sector pipeline
- Skills Taxonomy maps qualifications to green roles
- Wage Analysis compares green vs fossil sector pay

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `GEO_DIST`, `PALETTE`, `PIPELINE`, `POLICY`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 9 | `jobs2025`, `jobs2030`, `jobs2035`, `jobs2040`, `avgWage`, `fossilWage`, `retrainingMo`, `certRequired`, `topRegion` |
| `PIPELINE` | 8 | `solar`, `wind`, `ev`, `battery`, `hydrogen`, `retrofit`, `nature`, `circular` |
| `GEO_DIST` | 6 | `share`, `jobs` |
| `POLICY` | 7 | `region`, `type`, `jobsEnabled`, `budgetBn` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Green Jobs Dashboard','Sector Pipeline 2025-2040','Skills Taxonomy','Wage Analysis','Geographic Distribution','Policy Incentives'];` |
| `filteredSectors` | `useMemo(() => selSector === 'All' ? SECTORS : SECTORS.filter(s => s.sector === selSector), [selSector]); const totalJobs2040 = SECTORS.reduce((s, sec) => s + sec.jobs2040, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GEO_DIST`, `PALETTE`, `PIPELINE`, `POLICY`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Jobs 2030 | — | IRENA/ILO | Global projection across 8 sectors |
| Top Sector | — | IRENA | Largest employer in clean energy |

## 5 · Intermediate Transformation Logic
**Methodology:** Sector job projection model
**Headline formula:** `Jobs(sector, year) = Deployment(sector, year) × Jobs_per_unit(sector)`

8 sectors: solar installation, wind turbine, EV manufacturing, battery production, green H₂, building retrofit, nature restoration, circular economy. Skills taxonomy maps required qualifications and retraining pathways.

**Standards:** ['IRENA Jobs Review', 'ILO']
**Reference documents:** IRENA Renewable Energy and Jobs; ILO Green Jobs Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Derive job projections from deployment paths (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's `Jobs(sector, year) = Deployment(sector, year) × Jobs_per_unit(sector)` is not implemented — the 2025/2030/2035/2040 job counts across the 8 sectors (solar, wind, EV, battery, green H₂, retrofit, nature restoration, circular) are pre-tabulated static literals (informed by IRENA/ILO but not computed), so the tracker cannot answer "how do jobs change if deployment accelerates?" Evolution A builds the projection model: take sector deployment paths (GW/units by year) and multiply by jobs-per-unit employment factors, so job counts are derived from — and respond to — deployment scenarios rather than being fixed. This complements the sibling `green-jobs-growth`'s investment-multiplier (deployment-driven here vs investment-driven there).

**How.** (1) A backend route computing `Jobs(sector, year)` from a deployment path × jobs-per-unit factors (IRENA/ILO). (2) Deployment paths as scenario inputs (baseline/accelerated), so the 2025–2040 trajectory is computed. (3) The skills taxonomy and wage/geographic layers tied to the computed job counts. Static literals become the model's default/baseline, not the only value.

**Prerequisites.** Jobs-per-unit employment factors by sector; deployment-path scenarios (from the platform's renewable-deployment data); the static job literals reframed as baseline outputs. **Acceptance:** job counts recompute from deployment × jobs-per-unit reproducing §5; an accelerated deployment scenario raises projected jobs; the skills/wage layers reflect computed counts.

### 9.2 Evolution B — Green-workforce planning copilot (LLM tier 1 → 2)

**What.** A copilot for regional workforce and policy planners: "how many green-H₂ jobs by 2035 under an accelerated deployment path, and what skills and wages do they require?" narrates the sector job projections, skills taxonomy, and geographic distribution from the atlas corpus, with tier-2 computing scenario-driven projections via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (the 8-sector taxonomy, IRENA/ILO framing, skills/wage data) — the copilot cites the baseline projections while flagging them as static estimates. Tier 2 tool-calls the deployment→jobs endpoint so scenario what-ifs are computed. The copilot's value is scenario-based workforce planning tied to deployment ambition. Guardrail: pre-Evolution-A it presents job counts as static IRENA/ILO-informed estimates, not model outputs.

**Prerequisites.** Corpus embedding; Evolution A for scenario projections. **Acceptance:** post-Evolution-A, every job-projection figure traces to a tool call reproducing the deployment multiplication; the accelerated-scenario answer differs from baseline; pre-Evolution-A the copilot labels counts as static estimates.