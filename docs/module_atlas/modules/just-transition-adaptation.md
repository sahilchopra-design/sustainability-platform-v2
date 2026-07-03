# Just Transition & Adaptation
**Module ID:** `just-transition-adaptation` · **Route:** `/just-transition-adaptation` · **Tier:** A (backend vertical) · **EP code:** EP-EK6 · **Sprint:** EK

## 1 · Overview
Regional vulnerability assessment for 22 fossil fuel communities (Appalachia/Ruhr/Mpumalanga/Jharkhand), JETP finance mechanisms ($147Bn committed), net job creation/displacement analytics, social justice outcomes radar (procedural/distributive/restorative), and investor ILO/PRI framework.

> **Business value:** Used by impact investors integrating just transition into climate finance analysis, JETP advisory teams structuring blended finance programmes, and ESG analysts assessing social transition risk in fossil fuel portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FINANCE_MECHANISMS`, `INVESTMENT_TREND`, `JOBS_DATA`, `KpiCard`, `Pill`, `REGIONS`, `SOCIAL_RADAR`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sortedRegions` | `useMemo(() => [...filteredRegions].sort((a, b) => b[sortField] - a[sortField]), [filteredRegions, sortField]);` |
| `totalWorkers` | `REGIONS.reduce((a, b) => a + b.workers, 0);` |
| `avgVulnerability` | `REGIONS.reduce((a, b) => a + b.vulnerabilityScore, 0) / REGIONS.length;` |
| `totalFinanceGap` | `REGIONS.reduce((a, b) => a + b.adaptFinanceGap, 0);` |

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
**Frontend seed datasets:** `FINANCE_MECHANISMS`, `JOBS_DATA`, `SOCIAL_RADAR`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| JETP total commitments | `Across South Africa, Indonesia, India, Vietnam, Senegal, Nigeria (COP26/27)` | COP27 JETP Tracker 2023 | JETP leverage ratio 3:1 public:private; grant element typically 10–25%; most disbursement slow — SA JETP 18 mo |
| EU JTF total allocation | `2021–2027 for coal/carbon-intensive regions` | EU Just Transition Fund Regulation 2021 | Silesia (PL), Ruhr (DE), Lignite regions (DE/CZ) top recipients; conditions: coal phase-out timeline commitmen |
| Green job retraining cost | `Per worker for offshore wind/solar skills` | IRENA Renewable Energy Jobs 2023 | Coal mining to wind turbine technician: 6–12 month programme; community college model; geographic barriers if  |
- **ILO JT Guidelines 2024 + COP27 JETP frameworks + EU JTF + World Bank JTIP + IFC PS 2 + PRI Just Transition + UNPRI guidance** → 22-region vulnerability table + JETP finance mechanisms + jobs analytics + social radar + investment framework → **Impact investors, JETP advisory teams, DFI social safeguard teams, and ESG analysts covering just transition risk**

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
**Methodology:** Just Transition Index
**Headline formula:** `JT_Score = 0.25 × IncomeEquity + 0.20 × EmploymentAccess + 0.20 × CommunityVoice + 0.20 × HealthSafety + 0.15 × GenderInclusion; JETP_Leverage = (TotalCommitment − GrantElement) / GrantElement; Worker_Retraining_Cost = DisplacedWorkers × AvgRetraining_Cost`
**Standards:** ['ILO Just Transition Finance Guidelines 2024', 'COP26 JETP Frameworks 2021', 'UN Sendai Framework 2015–2030']

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
| `just-transition-finance` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-finance-hub` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-intelligence` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |