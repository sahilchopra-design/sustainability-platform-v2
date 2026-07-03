# Just Transition Analytics
**Module ID:** `just-transition` · **Route:** `/just-transition` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the distributional impacts of energy transition policies on workers, communities, and vulnerable populations using the ILO Just Transition Framework and Climate Policy Initiative methodologies. Quantifies job displacement, wage impacts, and community income loss in fossil fuel-dependent regions alongside green job creation estimates. Supports transition planning, social impact assessment, and JTWG-aligned reporting for policymakers and investors.

> **Business value:** Gives policymakers, development banks, and ESG investors a rigorous quantitative basis for designing and financing just transition interventions that address worker displacement, wage gaps, and community income loss in fossil fuel-dependent regions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_JT_SCORES`, `Card`, `JT_DIMENSIONS`, `KpiCard`, `LS_KEY`, `PIE_COLORS`, `Section`, `SortTh`, `TABS`, `TRANSITION_FUNDS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['Overview & KPIs', 'Country Deep-Dive', 'Funds & Finance', 'Portfolio & Social Dialogue'];` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `avgJTScore` | `Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.composite, 0) / COUNTRY_JT_SCORES.length);` |
| `totalTransitionFunds` | `Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.transition_fund_bn, 0) * 10) / 10;` |
| `totalWorkersAffected` | `COUNTRY_JT_SCORES.reduce((s, c) => s + c.coal_workers_affected, 0);` |
| `retrainingCoverage` | `Math.round(COUNTRY_JT_SCORES.filter(c => c.retraining_programs).length / COUNTRY_JT_SCORES.length * 100);` |
| `avgEnergyPoverty` | `Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.energy_poverty_pct, 0) / COUNTRY_JT_SCORES.length * 10) / 10;` |
| `avgSocialDialogue` | `Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.governance, 0) / COUNTRY_JT_SCORES.length);` |
| `devNationFinanceGap` | `Math.round(100 - (COUNTRY_JT_SCORES.filter(c => ['IN', 'ID', 'ZA', 'BR', 'MX'].includes(c.iso2)).reduce((s, c) => s + c.developing, 0) / 5));` |
| `jtScore` | `ctry ? ctry.composite : Math.round(30 + seed(i + 77) * 50);` |
| `dimensionPie` | `JT_DIMENSIONS.map(d => ({ name: d.name, value: d.weight }));` |

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
**Frontend seed datasets:** `COUNTRY_JT_SCORES`, `JT_DIMENSIONS`, `PIE_COLORS`, `TABS`, `TRANSITION_FUNDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Jobs at Risk (direct) | — | ILO employment multipliers / national labour data | Direct fossil fuel sector jobs exposed to transition-driven displacement in the analysis region |
| Green Job Creation Ratio | — | IRENA World Energy Transitions Outlook 2023 | Estimated new green economy jobs per displaced fossil fuel job by region and scenario |
| Wage Replacement Rate (%) | — | BLS / national wage databases | Average wage of new green jobs vs. displaced fossil fuel wages; gap indicates retraining need |
| Community Fiscal Impact (USD) | — | Local government revenue data | Lost tax base from fossil asset retirement per affected municipality |
- **National labour force survey data** → Disaggregate employment by sector, fossil fuel dependency, and region; apply ILO multipliers → **Job displacement risk map by region and phase-out timeline**
- **IRENA green job coefficients** → Apply to planned renewable capacity additions by technology and region → **Green job creation forecast by year, region, and sector**
- **Local government fiscal databases** → Model tax base loss from retiring fossil assets; estimate transfer dependency uplift → **Community fiscal impact assessment by municipality**

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
**Methodology:** Just Transition Impact Score
**Headline formula:** `JTISᵣ = α×JobLossᵣ + β×WageGapᵣ + γ×CommunityIncomeᵣ`
**Standards:** ['ILO Guidelines for a Just Transition 2015', 'Climate Policy Initiative Just Transition Finance Framework', 'IRENA World Energy Transitions Outlook 2023', 'WRI Just Transition Initiative']

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
| `just-transition-finance` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-finance-hub` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-intelligence` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-adaptation` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |