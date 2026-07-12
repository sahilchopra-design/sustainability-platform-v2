# Just Transition Finance
**Module ID:** `just-transition-finance` · **Route:** `/just-transition-finance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses financing mechanisms for inclusive and equitable climate transition, covering social bonds, sustainability-linked bonds with social KPIs, blended finance structures, and just transition-labelled green bonds. Quantifies capital mobilisation toward affected workers and communities and tracks additionality relative to business-as-usual social spending. Supports ICMA Social Bond Principles and CBI Just Transition Criteria compliance.

> **Business value:** Helps development banks, sovereign issuers, and fund managers structure, monitor, and report credible just transition finance instruments that deliver measurable social benefits to transition-affected workers and communities.

**How an analyst works this module:**
- Define the just transition finance mandate by selecting eligible use-of-proceeds categories (retraining, community infrastructure, SME finance)
- Review labelled bond and SLB issuance pipeline against CBI Just Transition Criteria eligibility screens
- Model blended finance structures using concessional capital tranches and risk sharing agreements
- Track SLB social KPI performance against observation dates and assess coupon step-up risk
- Generate ICMA Social Bond Principles annual impact report with beneficiary and additionality metrics

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `INDICATORS`, `KPI`, `PAGE_SIZE`, `PROJECTS`, `TABS`, `TREND`, `TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `INDICATORS` | 8 | `name`, `value`, `target`, `gap` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#b45309';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,investment:Math.round(200+i*30+sr(i*7)*100),workers:Math.round(5000+i*500+sr(i*11)*2000),jobs:Math.round(2000+i*300+sr(` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...PROJECTS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(typeF!=='All')d=d.filter(r=>r.type===typeF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,typeF,sortCol,sortDir]); const paged=filtered.slice((page-1)*PAGE_SIZE,page` |
| `kpis` | `useMemo(()=>{const totalInv=PROJECTS.reduce((s,c)=>s+c.investmentM,0);const totalWorkers=PROJECTS.reduce((s,c)=>s+c.workersRetrained,0);const totalJobs=PROJECTS.reduce((s,c)=>s+c.jobsCreated,0);const avgJt=Math.round(PRO` |
| `typeDist` | `useMemo(()=>{const m={};PROJECTS.forEach(c=>{m[c.type]=(m[c.type]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `typeInv` | `useMemo(()=>{const m={};PROJECTS.forEach(c=>{if(!m[c.type])m[c.type]={type:c.type,inv:0,n:0};m[c.type].inv+=c.investmentM;m[c.type].n++;});return Object.values(m).sort((a,b)=>b.inv-a.inv);},[]);` |
| `radarData` | `useMemo(()=>{const dims=['jtScore','socialImpact','economicDiv','envRemediation','stakeholderEng','genderEquity'];const avg=(k)=>Math.round(PROJECTS.reduce((s,c)=>s+c[k],0)/PROJECTS.length);return dims.map(d=>({dim:d.rep` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/just-transition/workforce-transition` | `workforce_transition` | api/v1/routes/just_transition.py |
| POST | `/api/v1/just-transition/community-resilience` | `community_resilience` | api/v1/routes/just_transition.py |
| GET | `/api/v1/just-transition/ref/ilo-principles` | `ref_ilo_principles` | api/v1/routes/just_transition.py |
| GET | `/api/v1/just-transition/ref/coal-community-profiles` | `ref_coal_community_profiles` | api/v1/routes/just_transition.py |
| GET | `/api/v1/just-transition/ref/sector-profiles` | `ref_sector_profiles` | api/v1/routes/just_transition.py |
| GET | `/api/v1/just-transition/ref/cif-facilities` | `ref_cif_facilities` | api/v1/routes/just_transition.py |
| POST | `/api/v1/just-transition/ilo-assessment` | `ilo_assessment` | api/v1/routes/just_transition_engine.py |
| POST | `/api/v1/just-transition/esrs-social` | `esrs_social` | api/v1/routes/just_transition_engine.py |
| POST | `/api/v1/just-transition/sec-human-capital` | `sec_human_capital` | api/v1/routes/just_transition_engine.py |
| POST | `/api/v1/just-transition/living-wage` | `living_wage` | api/v1/routes/just_transition_engine.py |
| POST | `/api/v1/just-transition/worker-displacement` | `worker_displacement` | api/v1/routes/just_transition_engine.py |
| POST | `/api/v1/just-transition/cbi-jt-finance` | `cbi_jt_finance` | api/v1/routes/just_transition_engine.py |
| POST | `/api/v1/just-transition/stakeholder-mapping` | `stakeholder_mapping` | api/v1/routes/just_transition_engine.py |
| POST | `/api/v1/just-transition/full-assessment` | `full_assessment` | api/v1/routes/just_transition_engine.py |
| GET | `/api/v1/just-transition/ref/ilo-dimensions` | `ref_ilo_dimensions` | api/v1/routes/just_transition_engine.py |
| GET | `/api/v1/just-transition/ref/esrs-social-requirements` | `ref_esrs_social_requirements` | api/v1/routes/just_transition_engine.py |
| GET | `/api/v1/just-transition/ref/living-wage-benchmarks` | `ref_living_wage_benchmarks` | api/v1/routes/just_transition_engine.py |
| GET | `/api/v1/just-transition/ref/cbi-criteria` | `ref_cbi_criteria` | api/v1/routes/just_transition_engine.py |

### 2.3 Engine `just_transition_engine` (services/just_transition_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `JustTransitionEngine.assess_ilo_principles` | entity_data | Score all 5 ILO Just Transition Guiding Principles (2015). Computes weighted composite, identifies gaps, assigns tier. Expected keys: entity_id, region_name, country, principle_scores dict (principle_name → 0-100), sector |
| `JustTransitionEngine.assess_eu_jtf_eligibility` | entity_data | Check 8 EU JTF eligibility criteria (JTF Reg 2021/1056 Art 8). Compute territorial just transition score and estimate JTF allocation. Expected keys: entity_id, region_name, country, nuts2_code, criteria_status dict (criterion → met bool), regional_gdp_m_eur, population_k, fossil_employment_k, total_employment_k |
| `JustTransitionEngine.model_workforce_transition` | entity_data | Model the workforce transition: affected workers, green jobs created, net jobs, wage gap, reskilling cost (€M per worker), and timeline. Expected keys: entity_id, sector, region_name, country, fossil_workers_k, green_jobs_pipeline_k, avg_fossil_wage_usd, avg_green_wage_usd, reskilling_duration_months, reskilling_cost_per_worker_usd, phase_out_start_year, phase_out_end_year, jetp_pledge bool |
| `JustTransitionEngine.assess_community_resilience` | entity_data | Assess community resilience to fossil fuel transition. Scores GDP dependency, infrastructure, employer diversity, skills transferability, social cohesion, and vulnerability. Expected keys: entity_id, region_name, country, gdp_fossil_dependency_pct, infrastructure_score (0-100), alternative_employer_count, skills_transferability (1-5), social_cohesion_score (0-100), coal_profile_key |
| `JustTransitionEngine.assess_cif_eligibility` | entity_data | Check eligibility for all 4 CIF facilities. Returns concessional finance available (€M) and blended ratio. Expected keys: entity_id, country, sector, project_type, project_cost_m, income_group, has_national_climate_plan, forest_coverage_pct, grid_electrification_rate_pct |
| `JustTransitionEngine.run_full_assessment` | entity_data | Orchestrates all E89 sub-assessments and produces a consolidated just transition finance report. Produces: - just_transition_score (0-100) - transition_risk_tier - ilo_composite_score - eu_jtf_eligible - net_jobs_impact - reskilling_cost_m |

**Engine `just_transition_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_ILO_TIER_THRESHOLDS` | `[(80.0, 'leading'), (65.0, 'advanced'), (45.0, 'developing'), (0.0, 'early')]` |
| `_JT_RISK_TIERS` | `[(75.0, 'low'), (55.0, 'medium'), (35.0, 'high'), (0.0, 'critical')]` |
| `_COMMUNITY_VULNERABILITY_TIERS` | `[(70.0, 'resilient'), (50.0, 'moderate'), (30.0, 'vulnerable'), (0.0, 'highly_vulnerable')]` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `COAL_COMMUNITY_PROFILES` *(shared)*, `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `fossil` *(shared)*, `public` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `INDICATORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| JT Finance Mobilised (USD bn) | — | CPI Climate Finance Landscape | Total capital labelled or aligned with just transition objectives in the analysis portfolio |
| Social KPI Achievement Rate (%) | — | SLB coupon step-up trigger records | Proportion of SLB social KPIs achieved at observation dates, avoiding penalty coupon step-up |
| Blended Finance Leverage Ratio | — | DFI blended finance reports | Private capital mobilised per dollar of concessional public capital deployed |
| Beneficiary Reach (workers/communities) | — | Programme monitoring data | Number of transition-affected individuals supported through financed programmes |
- **Bond prospectus and use-of-proceeds reports** → Screen against CBI/ICMA eligibility criteria; tag by just transition category → **Eligible JT finance deal database with category, size, and tenor**
- **SLB KPI framework documents** → Extract social KPI targets and observation dates; track reported performance → **KPI achievement status and coupon step-up exposure per bond**
- **Programme beneficiary monitoring data** → Aggregate worker and community reach; compute per-capita capital deployed → **Beneficiary impact report for ICMA Social Bond Principles annual disclosure**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/just-transition/ref/cif-facilities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cif_facilities', 'count', 'source'], 'n_keys': 3}`

**GET /api/v1/just-transition/ref/coal-community-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coal_community_profiles', 'count', 'source'], 'n_keys': 3}`

**GET /api/v1/just-transition/ref/ilo-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ilo_jt_principles', 'count', 'source'], 'n_keys': 3}`

**GET /api/v1/just-transition/ref/sector-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_profiles', 'count', 'source'], 'n_keys': 3}`

**POST /api/v1/just-transition/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_id', 'region_name', 'country', 'sector', 'just_transition_score', 'transition_risk_tier', 'ilo_composite_score', 'ilo_tier', 'eu_jtf_eligible', 'eu_jtf_score', 'eu_jtf_allocation_estimate_m_eur', 'net_jobs_k', 'net_jobs_pct', 'reskilling_cost_m_usd', 'total_transi`

**POST /api/v1/just-transition/cif-eligibility** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/just-transition/community-resilience** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/just-transition/eu-jtf-eligibility** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Social Additionality Index
**Headline formula:** `SAI = (JT Financeₜ − BAU Social Spendₜ) / Target Populationₜ`

Additionality measures capital directed to just transition activities above baseline social expenditure. Target population denominates benefits per affected worker or community member. SAI captures whether labelled instruments represent genuine incremental support or reclassification of existing expenditure.

**Standards:** ['ICMA Social Bond Principles 2023', 'Climate Bonds Initiative Just Transition Criteria 2023', 'CPI Global Landscape of Climate Finance 2023', 'IFC Operating Principles for Impact Management']
**Reference documents:** ICMA Social Bond Principles 2023; Climate Bonds Initiative Just Transition Criteria Discussion Paper 2023; CPI Global Landscape of Climate Finance 2023; OECD Blended Finance Principles for Unlocking Commercial Finance for the SDGs; IFC Just Transition Finance Guidance Note 2022

**Engine `just_transition_engine` — extracted transformation lines:**
```python
composite_score = round(composite_score / total_weight if total_weight else 0.0, 2)
jtf_score = round((total_points / max_points) * 100.0, 2) if max_points > 0 else 0.0
fossil_share = fossil_employment_k / total_employment_k if total_employment_k > 0 else 0
base_allocation_m = regional_gdp_m * fossil_share * 0.10  # 10% of fossil GDP exposure
score_multiplier = jtf_score / 100.0
jtf_allocation_m = round(base_allocation_m * score_multiplier, 2)
transition_years = max(1, phase_out_end - phase_out_start)
workers_displaced_pa_k = fossil_workers_k / transition_years
net_jobs_k = green_jobs_k - fossil_workers_k
net_jobs_pct = (net_jobs_k / fossil_workers_k * 100.0) if fossil_workers_k > 0 else 0.0
wage_gap_usd = avg_fossil_wage - avg_green_wage
wage_gap_pct = (wage_gap_usd / avg_fossil_wage * 100.0) if avg_fossil_wage > 0 else 0.0
income_support_months = reskilling_months * 1.5
total_transition_cost_m = total_reskilling_cost_m + income_support_cost_m
jetp_finance_available_m = total_transition_cost_m * 0.30 if jetp_pledge else 0.0
green_jobs_pa_k = green_jobs_k / transition_years
gdp_dependency_score = max(0.0, 100.0 - gdp_fossil_pct * 3.0)
employer_diversity_score = min(100.0, alt_employer_count * 8.0)
skills_norm = (skills_score_raw / 5.0) * 100.0
alt_sector_norm = alt_sector_score * 100.0
concessional_m = project_cost_m * 0.50  # 50% concessional tranche assumption
blended_ratio = total_concessional_m / project_cost_m if project_cost_m > 0 else 0.0
net_jobs_norm = min(100.0, max(0.0, 50.0 + net_jobs_k * 5.0))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **51** other module(s).
**Shared engines (edits propagate!):** `just_transition_engine` (used by 5 modules)

| Connected module | Shared via |
|---|---|
| `just-transition-finance-hub` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-adaptation` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-intelligence` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *Social Additionality
> Index* (`SAI = (JT Financeₜ − BAU Social Spendₜ) / Target Populationₜ`), ICMA Social Bond
> Principles labelled-bond screening, SLB coupon step-up tracking and blended-finance leverage
> ratios. **None of that is implemented in this page.** The page is a project-tracking dashboard
> over 40 synthetic just-transition projects with a fixed 8-row indicator scorecard. No SAI, no
> BAU baseline, no bond/SLB pipeline, no leverage ratio. A rich ILO/EU-JTF/CIF engine
> (`backend/services/just_transition_engine.py`) *does* exist but this page never calls it — the
> `trace_labels` list eight `/api/v1/just-transition/*` endpoints, yet every number rendered is
> generated locally by the seeded PRNG. Sections below document the code as it behaves.

### 7.1 What the module computes

The page seeds a `PROJECTS` array of 40 named coal/transition projects. Each project's fields are
drawn from the platform PRNG `sr(s) = frac(sin(s+1)×10⁴)`:

```js
investmentM      = round(5   + sr(i·7)·295)     // $5–300M
workersRetrained = round(100 + sr(i·11)·4900)
jobsCreated      = round(50  + sr(i·13)·2950)
communityFundM   = round(1   + sr(i·17)·49)
jtScore          = round(15  + sr(i·19)·80)     // 15–95, the headline "JT Score"
socialImpact, economicDiv, envRemediation, stakeholderEng,
genderEquity, youthEmploy, skillsMatch, wageRetention, redeployRate  // all sr-seeded 0–100 sub-scores
status           = sr(i·67)<0.4?'Active':<0.7?'Planning':<0.9?'Completed':'Suspended'
```

Portfolio KPIs are plain sums/means over the 40 rows:

```js
kpis.totalInv    = Σ investmentM
kpis.totalWorkers= Σ workersRetrained
kpis.totalJobs   = Σ jobsCreated
kpis.avgJt       = round(Σ jtScore / 40)
```

The `jtScore` is **not derived** from the sub-scores — it is an independent random draw. There is no
weighting formula linking `socialImpact`, `economicDiv` etc. to the composite, unlike the backend
engine's ILO-weighted composite (§8).

### 7.2 Parameterisation / scoring rubric

| Element | Value / rule | Provenance |
|---|---|---|
| Project count | 40 | Hard-coded `names[]` array (real region names: Silesia, Ruhr, Appalachia, Mpumalanga…) |
| Project types | 11 categories (Coal Transition, Worker Retraining, Community Fund…) | Hard-coded `types[]`, thematically plausible |
| `jtScore` badge thresholds | `[25, 50, 70]` → red/amber/gold/green | UI heuristic, `badge(v,[25,50,70])` |
| `INDICATORS` scorecard | 8 fixed rows, `{value, target, gap}` | Hard-coded demo values (e.g. Worker Retraining 62 vs target 80) |
| `TREND` (24 months) | `investment = 200 + i·30 + sr(i·7)·100`, similar for workers/jobs | Synthetic upward trend + PRNG noise |

Every quantitative field is **synthetic demo data**. The indicator targets (80% retraining, 1.0 job
replacement ratio, 85% wage retention, 50% gender equity) are plausible policy aspirations but carry
no cited source in code.

### 7.3 Calculation walkthrough

1. `PROJECTS` built once at module load from `sr()`.
2. `filtered` applies search + type filter + column sort (a shallow copy `[...PROJECTS]`).
3. `kpis` / `typeDist` / `typeInv` / `radarData` aggregate across all 40 rows with simple
   reduce/group-by — `radarData` averages six sub-scores into a portfolio radar.
4. Tabs render: Dashboard (KPIs + charts), Project Screening (sortable paginated table, 15/page),
   Worker Programs (top-12 by `workersRetrained`), Indicators (8-row target-vs-actual bars).

### 7.4 Worked example (project i = 2, "Ruhr Valley Innovation Park")

Using `sr(s)=frac(sin(s+1)×10⁴)`:

| Field | Formula | Value |
|---|---|---|
| `investmentM` | `round(5 + sr(14)·295)` | `sr(14)=frac(sin15·1e4)` ≈ 0.650 → round(5+191.7) = **$197M** |
| `workersRetrained` | `round(100 + sr(22)·4900)` | `sr(22)`≈0.010 → **≈149** |
| `jtScore` | `round(15 + sr(38)·80)` | `sr(38)`≈0.291 → round(15+23.3) = **38** |

The dashboard "Avg JT Score" is then `round(Σ jtScore/40)` — a mean of 40 such independent draws,
carrying no methodological meaning beyond "average of random 15–95 numbers".

### 7.5 Companion analytics

- **Investment-by-type bar / type pie** — group-by `type`, sum `investmentM` / count.
- **Progress Trend area** — the 24-month `TREND` series.
- **JT Impact Radar** — 6-dimension portfolio-mean radar (jtScore, socialImpact, economicDiv,
  envRemediation, stakeholderEng, genderEquity).
- **Indicators tab** — the only non-project analytic: 8 KPI rows with current/target/gap and a
  progress bar `min(100, value/target·100)`.

### 7.6 Data provenance & limitations

- **All 40 projects and every metric are synthetic**, generated by `sr()`. Region names are real
  but the attached figures are not.
- The backend `JustTransitionEngine` (ILO 5-principle weighted composite, EU JTF 8-criterion
  eligibility scoring, workforce/wage-gap/reskilling-cost model, CIF facility eligibility, community
  resilience) is **completely disconnected** from this page — a production wiring would replace the
  random `jtScore` with the engine's `just_transition_score`.
- No additionality (SAI), no bond/SLB instruments, no blended-finance leverage — the three
  quantities the guide leads with are absent.

**Framework alignment:** ILO *Guidelines for a Just Transition* (2015) — the engine encodes its five
principles (social dialogue, skills/reskilling, social protection, active labour-market policy,
community investment) with weights 0.25/0.25/0.20/0.15/0.15; the page surfaces only unstructured
sub-scores. EU JTF Reg (EU) 2021/1056 — engine only. ICMA Social Bond Principles / CBI Just
Transition Criteria — named in the guide, unimplemented anywhere in the page.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (The page renders a random `jtScore`; the
guide's Social Additionality Index has no implementation. This section specifies the production
model that should replace both.)

### 8.1 Purpose & scope
Score just-transition finance *credibility and additionality* at project level, so a DFI/issuer can
(a) rank a pipeline by genuine incremental social benefit and (b) certify a labelled instrument
(social bond / JT-labelled green bond / SLB with social KPIs). Coverage: transition-affected
regions, worker programmes, community funds; asset unit = project or use-of-proceeds tranche.

### 8.2 Conceptual approach
Two coupled sub-models, mirroring recognised practice:
1. **Social Additionality Index (SAI)** — incremental capital above a business-as-usual (BAU)
   social-spend counterfactual, per-capita of the target population. Benchmarks: OECD Blended
   Finance Principles (additionality tests) and IFC Operating Principles for Impact Management
   (attribution + counterfactual).
2. **ILO-weighted Just-Transition Credibility Score (JTCS)** — the five-principle weighted composite
   already coded in `just_transition_engine.py`, benchmarked against the ILO 2015 Guidelines and CBI
   Just Transition Criteria (2023) eligibility screens.

### 8.3 Mathematical specification

```
SAIₜ   = (JT_Financeₜ − BAU_Social_Spendₜ) / Target_Populationₜ          [$ / person]
BAU_Social_Spendₜ = Social_Spend_{t-1} × (1 + g_fiscal)                    (trend counterfactual)
Additionality_ratio = (JT_Finance − BAU) / JT_Finance          ∈ [0,1]

JTCS = Σ_p w_p · principle_score_p          (w = 0.25,0.25,0.20,0.15,0.10 per engine)
Credibility = 0.6·JTCS + 0.4·(100·Additionality_ratio)

SLB step-up risk:  E[step-up bps] = Σ_k P(miss KPI_k)·step_k
                   P(miss) from logistic on (trajectory gap, time-to-observation)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Fiscal growth of BAU social spend | `g_fiscal` | IMF WEO country fiscal projections |
| ILO principle weights | `w_p` | ILO 2015 Guidelines (as engine) |
| Target population | `Target_Popularionₜ` | Coal-community profiles (engine `COAL_COMMUNITY_PROFILES`) |
| KPI miss probability | `P(miss)` | Issuer trajectory vs SLB framework; ICMA SLBP 2023 |
| Blended leverage benchmark | 3–5× | OECD/DFI blended finance reports |

### 8.4 Data requirements
- Project use-of-proceeds tranche, size, tenor, label (bond/SLB/grant) — deal database.
- Historical municipal/state social spend (BAU baseline) — national statistics / IMF GFS.
- Target population + baseline wages/employment — engine `COAL_COMMUNITY_PROFILES`,
  `JUST_TRANSITION_SECTOR_PROFILES`, ILO labour indicators (already in `data/laborIndicators`).
- SLB KPI framework + observation dates — issuer disclosure.
- Already in platform: ILO weights, EU-JTF criteria, CIF facilities (engine).

### 8.5 Validation & benchmarking plan
- Backtest SAI against realised programme beneficiary reach vs. pledged (ex-post additionality).
- Reconcile JTCS against CBI Just Transition certification outcomes on a labelled-bond sample.
- Sensitivity: BAU growth `g_fiscal` ±1pp, population estimate ±20%; report SAI elasticity.
- Reconcile blended-leverage output against DFI-reported private mobilisation ratios.

### 8.6 Limitations & model risk
- SAI is only as credible as the BAU counterfactual — greatest model risk is baseline gaming
  (reclassifying existing spend). Require independent baseline attestation.
- ILO principle scores are self-reported; conservative fallback caps un-attested principles at 50.
- Non-economic losses (culture, displacement) are not monetised; flagged qualitatively, not in SAI.

## 9 · Future Evolution

### 9.1 Evolution A — A real labelled-instrument register screened by the CBI engine route (analytics ladder: rung 1 → 2)

**What.** The page is a seeded project dashboard: the 24-month `TREND` is `sr()`-noised linear growth, the `PROJECTS` table's investment/workers-retrained/jobs-created figures are seeded, and the 8 `INDICATORS` are static — while the module's own backend surface includes `POST /just-transition/cbi-jt-finance` (CBI Just Transition Criteria screening) and `GET /ref/cbi-criteria`, which the page never calls, plus living-wage and worker-displacement routes. The §4.1 lineage describes the right design — bond prospectus screening against CBI/ICMA criteria, SLB KPI tracking with coupon step-up exposure, beneficiary monitoring — none of it wired. Evolution A builds the instrument register: a `jt_instruments` table (bond/SLB/blended structure × issuer × size × use-of-proceeds categories × social KPIs × observation dates), screened through the existing `cbi_jt_finance` engine route, with SLB step-up exposure computed from KPI status at observation dates.

**How.** (1) Curate an initial register from public sources — labelled JT/social bonds are a small, documented universe (CBI's social/sustainability bond database is public). (2) Wire the eligibility screen to the live route; the `ref/cbi-criteria` GET already serves the criteria with sources. (3) SLB tracking: `step_up_exposure = coupon_step × notional × P(miss)` where KPI status is entered evidence, honest-null when unreported. (4) Replace the seeded trend with the register's actual issuance-by-month series; retire `PROJECTS` seeding in favour of register rows.

**Prerequisites.** Register curation effort; the `sr()` trend/project generation deleted. **Acceptance:** every instrument carries its CBI screening result from a logged engine call; SLB step-up exposure recomputes when a KPI status changes; the issuance trend sums from register rows.

### 9.2 Evolution B — Social-bond structuring and ICMA-reporting copilot (LLM tier 2)

**What.** The stated workflow ends at "generate ICMA Social Bond Principles annual impact report" — a structured disclosure over instrument and beneficiary data, plus structuring questions: "which use-of-proceeds categories does CBI's JT criteria accept for a retraining programme?", "what social KPIs are market-standard for a coal-region SLB, and what step-ups?", "draft the allocation and impact section for our 2026 social bond report." A second lever: prospectus screening — extracting use-of-proceeds categories and KPI definitions from uploaded bond frameworks into register records for confirmation, the recurring extraction-with-review pattern.

**How.** Tier 2: tool schemas over the Evolution A register routes, the `cbi_jt_finance` screen, and the living-wage benchmark GET (relevant to wage-related KPI calibration). Report generation maps to ICMA SBP's required sections (allocation, impact, methodology) with every beneficiary and $ figure tool-validated; unallocated proceeds and unreported KPIs are disclosed as such — social-bond reporting that papers over gaps is the exact impact-washing failure mode. Criteria answers quote the `ref/cbi-criteria` payload with its source field; market-standard claims about step-ups cite register precedents, not model priors.

**Prerequisites (hard).** Evolution A's register (an ICMA report over seeded projects would be fabricated impact disclosure); document pipeline for prospectus intake. **Acceptance:** report figures 100% register-traceable; screening claims match logged engine responses; extraction suggestions carry prospectus page citations and confirmation state.