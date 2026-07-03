# Just Transition Finance
**Module ID:** `just-transition-finance` · **Route:** `/just-transition-finance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses financing mechanisms for inclusive and equitable climate transition, covering social bonds, sustainability-linked bonds with social KPIs, blended finance structures, and just transition-labelled green bonds. Quantifies capital mobilisation toward affected workers and communities and tracks additionality relative to business-as-usual social spending. Supports ICMA Social Bond Principles and CBI Just Transition Criteria compliance.

> **Business value:** Helps development banks, sovereign issuers, and fund managers structure, monitor, and report credible just transition finance instruments that deliver measurable social benefits to transition-affected workers and communities.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `INDICATORS`, `KPI`, `PAGE_SIZE`, `PROJECTS`, `TABS`, `TREND`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#b45309';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,investment:Math.round(200+i*30+sr(i*7)*100),worke` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const totalInv=PROJECTS.reduce((s,c)=>s+c.investmentM,0);const totalWorkers=PROJECTS.reduce((s,c)=>s+c.workersRetrained,0);const totalJob` |
| `typeDist` | `useMemo(()=>{const m={};PROJECTS.forEach(c=>{m[c.type]=(m[c.type]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `typeInv` | `useMemo(()=>{const m={};PROJECTS.forEach(c=>{if(!m[c.type])m[c.type]={type:c.type,inv:0,n:0};m[c.type].inv+=c.investmentM;m[c.type].n++;});return Obje` |
| `radarData` | `useMemo(()=>{const dims=['jtScore','socialImpact','economicDiv','envRemediation','stakeholderEng','genderEquity'];const avg=(k)=>Math.round(PROJECTS.r` |

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
| `JustTransitionEngine.assess_ilo_principles` | entity_data | Score all 5 ILO Just Transition Guiding Principles (2015). |
| `JustTransitionEngine.assess_eu_jtf_eligibility` | entity_data | Check 8 EU JTF eligibility criteria (JTF Reg 2021/1056 Art 8). |
| `JustTransitionEngine.model_workforce_transition` | entity_data | Model the workforce transition: |
| `JustTransitionEngine.assess_community_resilience` | entity_data | Assess community resilience to fossil fuel transition. |
| `JustTransitionEngine.assess_cif_eligibility` | entity_data | Check eligibility for all 4 CIF facilities. |
| `JustTransitionEngine.run_full_assessment` | entity_data | Orchestrates all E89 sub-assessments and produces a consolidated |

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
Output: `{'type': 'object', 'keys': ['entity_id', 'region_name', 'country', 'sector', 'just_transition_score', 'transition_risk_tier', 'ilo_composite_score', 'ilo_tier', 'eu_jtf_eligible', 'eu_jtf_score', 'eu_jtf_allocation_estim`

## 5 · Intermediate Transformation Logic
**Methodology:** Social Additionality Index
**Headline formula:** `SAI = (JT Financeₜ − BAU Social Spendₜ) / Target Populationₜ`
**Standards:** ['ICMA Social Bond Principles 2023', 'Climate Bonds Initiative Just Transition Criteria 2023', 'CPI Global Landscape of Climate Finance 2023', 'IFC Operating Principles for Impact Management']

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
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).
**Shared engines (edits propagate!):** `just_transition_engine` (used by 5 modules)

| Connected module | Shared via |
|---|---|
| `just-transition` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-finance-hub` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-intelligence` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-adaptation` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |