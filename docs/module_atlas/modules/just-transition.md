# Just Transition Analytics
**Module ID:** `just-transition` · **Route:** `/just-transition` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the distributional impacts of energy transition policies on workers, communities, and vulnerable populations using the ILO Just Transition Framework and Climate Policy Initiative methodologies. Quantifies job displacement, wage impacts, and community income loss in fossil fuel-dependent regions alongside green job creation estimates. Supports transition planning, social impact assessment, and JTWG-aligned reporting for policymakers and investors.

> **Business value:** Gives policymakers, development banks, and ESG investors a rigorous quantitative basis for designing and financing just transition interventions that address worker displacement, wage gaps, and community income loss in fossil fuel-dependent regions.

**How an analyst works this module:**
- Select transition scenario (NZE, APS, STEPS) and time horizon to define the pace of fossil fuel phase-out
- Map affected regions and identify coal, oil, and gas employment concentrations using the asset-to-community overlay
- Review job displacement estimates against green job creation by sector and region
- Assess wage replacement rate gaps to identify skills retraining investment needs and timeline
- Generate JTWG-aligned transition plan summary for policy engagement or investor social bond reporting

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_JT_SCORES`, `Card`, `JT_DIMENSIONS`, `KpiCard`, `LS_KEY`, `PIE_COLORS`, `Section`, `SortTh`, `TABS`, `TRANSITION_FUNDS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `JT_DIMENSIONS` | 6 | `name`, `weight`, `indicators`, `color` |
| `COUNTRY_JT_SCORES` | 21 | `country`, `workers`, `communities`, `equity`, `developing`, `governance`, `composite`, `coal_workers_affected`, `transition_fund_bn`, `retraining_programs`, `social_dialogue`, `energy_poverty_pct`, `just_transition_plan`, `union_density_pct`, `green_jobs_created_k`, `avg_retraining_months`, `community_investment_bn` |
| `TRANSITION_FUNDS` | 11 | `amount_bn`, `region`, `focus`, `year` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['Overview & KPIs', 'Country Deep-Dive', 'Funds & Finance', 'Portfolio & Social Dialogue'];` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `portfolio` | `useMemo(() => loadLS(LS_KEY) \|\| [], []);  /* sorting */ const handleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };` |
| `avgJTScore` | `Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.composite, 0) / COUNTRY_JT_SCORES.length);` |
| `totalTransitionFunds` | `Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.transition_fund_bn, 0) * 10) / 10;` |
| `totalWorkersAffected` | `COUNTRY_JT_SCORES.reduce((s, c) => s + c.coal_workers_affected, 0);` |
| `retrainingCoverage` | `Math.round(COUNTRY_JT_SCORES.filter(c => c.retraining_programs).length / COUNTRY_JT_SCORES.length * 100);` |
| `avgEnergyPoverty` | `Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.energy_poverty_pct, 0) / COUNTRY_JT_SCORES.length * 10) / 10;` |
| `avgSocialDialogue` | `Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.governance, 0) / COUNTRY_JT_SCORES.length);` |
| `devNationFinanceGap` | `Math.round(100 - (COUNTRY_JT_SCORES.filter(c => ['IN', 'ID', 'ZA', 'BR', 'MX'].includes(c.iso2)).reduce((s, c) => s + c.developing, 0) / 5));` |
| `jtRanked` | `useMemo(() => [...COUNTRY_JT_SCORES].sort((a, b) => b.composite - a.composite).map(c => ({ country: c.iso2, composite: c.composite, fill: c.composite >= 70 ? T.green : c.composite >= 50 ? T.gold : c.composite >= 35 ? T.amber : T.red, })), []);` |
| `radarData` | `useMemo(() => JT_DIMENSIONS.map(d => ({ dimension: d.name, score: selCountry[d.id], weight: d.weight })), [selCountry]);` |
| `scatterData` | `useMemo(() => COUNTRY_JT_SCORES.map(c => ({ country: c.iso2, workers_affected: Math.log10(Math.max(c.coal_workers_affected, 1)), fund: c.transition_fund_bn, retraining: c.retraining_programs ? 1 : 0, composite: c.composite, })), []);` |
| `energyPovertyData` | `useMemo(() => COUNTRY_JT_SCORES.filter(c => c.energy_poverty_pct >= (energyPovertySlider / 10)).sort((a, b) => b.energy_poverty_pct - a.energy_poverty_pct).map(c => ({ country: c.iso2, poverty: c.energy_poverty_pct, fill: c.energy_poverty_pct >= 20 ? T.red : c.energy_poverty_pct >= 10 ? T.amber : T.gold, })), [energyPovertySlider]);` |
| `fundChartData` | `useMemo(() => [...TRANSITION_FUNDS].sort((a, b) => b.amount_bn - a.amount_bn).map(f => ({ name: f.name.length > 25 ? f.name.slice(0, 22) + '...' : f.name, amount: f.amount_bn, region: f.region })), []);` |
| `socialDialogueData` | `useMemo(() => COUNTRY_JT_SCORES.map(c => ({ country: c.iso2, governance: c.governance, union_density: c.union_density_pct, social_dialogue: c.social_dialogue, tripartite: c.social_dialogue && c.union_density_pct > 10, })).sort((a, b) => b.governance - a.governance), []);` |
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
Output: `{'type': 'object', 'keys': ['entity_id', 'region_name', 'country', 'sector', 'just_transition_score', 'transition_risk_tier', 'ilo_composite_score', 'ilo_tier', 'eu_jtf_eligible', 'eu_jtf_score', 'eu_jtf_allocation_estimate_m_eur', 'net_jobs_k', 'net_jobs_pct', 'reskilling_cost_m_usd', 'total_transi`

**POST /api/v1/just-transition/cif-eligibility** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/just-transition/community-resilience** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/just-transition/eu-jtf-eligibility** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Just Transition Impact Score
**Headline formula:** `JTISᵣ = α×JobLossᵣ + β×WageGapᵣ + γ×CommunityIncomeᵣ`

Regional impact scores aggregate employment, wage, and community fiscal impacts weighted by population vulnerability index. Job displacement uses ILO sector employment multipliers applied to planned coal/oil/gas capacity retirements. Green job creation credits use IRENA regional coefficient tables for renewable energy, efficiency, and grid modernisation sectors.

**Standards:** ['ILO Guidelines for a Just Transition 2015', 'Climate Policy Initiative Just Transition Finance Framework', 'IRENA World Energy Transitions Outlook 2023', 'WRI Just Transition Initiative']
**Reference documents:** ILO Guidelines for a Just Transition towards Environmentally Sustainable Economies 2015; IRENA World Energy Transitions Outlook 2023 â€” 1.5°C Pathway; CPI Just Transition Finance Landscape 2021; WRI Creating a Just Transition for All 2020; IEA Special Report on Clean Energy Jobs 2022

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
| `just-transition-finance` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's stated formula —
> `JTIS_r = α×JobLoss_r + β×WageGap_r + γ×CommunityIncome_r`, driven by "ILO sector employment
> multipliers applied to planned coal/oil/gas capacity retirements" and "IRENA regional coefficient
> tables" — **does not exist in the code**. There is no job-loss/wage-gap/community-income regression,
> no ILO employment multiplier, and no IRENA coefficient table. What the code actually implements is
> a **fixed, hand-curated 20-country dataset** scored on a 5-dimension ILO-styled composite (Worker
> Protection, Community Resilience, Distributional Equity, Developing Nation Support, Social
> Dialogue), plus a portfolio-exposure mapper. Despite the assignment record listing
> `backend/services/just_transition_engine.py` and 8 live API routes as this module's engine, **the
> frontend makes zero API calls** — the real backend engine exists in the codebase but is not invoked
> anywhere on this page. Sections below document the code as it actually behaves.

### 7.1 What the module computes

`COUNTRY_JT_SCORES` is a static array of 20 countries, each with a hand-set `composite` score that
**is** internally consistent with the declared dimension weights — i.e. the numbers were authored to
satisfy the formula even though the formula is never evaluated live in code:

```
composite ≈ 0.25·workers + 0.25·communities + 0.20·equity + 0.15·developing + 0.15·governance
```
Verification (Germany): `0.25×78 + 0.25×72 + 0.20×70 + 0.15×65 + 0.15×82 = 73.55 ≈ 74` ✓.
Verification (US): `0.25×62 + 0.25×58 + 0.20×55 + 0.15×45 + 0.15×60 = 56.75 ≈ 57` ✓.

Each country also carries 9 supporting fields (coal workers affected, transition fund $Bn,
retraining program flag, social dialogue flag, energy poverty %, JT plan flag, union density %,
green jobs created, avg retraining months, community investment $Bn) that are independently authored
per country (plausible, directionally consistent with each country's real coal dependency — e.g.
China 2.5M coal workers, South Africa 92,000, Norway 500 — but not sourced to a cited dataset in the
code).

### 7.2 Parameterisation

| Dimension | Weight | Indicators (descriptive only, not separately scored) |
|---|---|---|
| Worker Protection | 25% | Retraining, severance, early retirement, skill transfer, safety nets |
| Community Resilience | 25% | Economic diversification, infrastructure, social services, engagement, culture |
| Distributional Equity | 20% | Energy affordability, clean-energy access, progressive carbon pricing, vulnerable-group protection |
| Developing Nation Support | 15% | Climate finance flows, tech transfer, capacity building, debt-for-nature swaps |
| Social Dialogue | 15% | Tripartite consultation, union involvement, stakeholder engagement, transparent planning |

| Field | Provenance |
|---|---|
| 20-country composite + 5 dimension sub-scores | Hand-authored, internally consistent with the weighted formula; not derived from a cited index |
| `coal_workers_affected`, `transition_fund_bn` | Plausible, order-of-magnitude consistent with real JETP/EU JTF figures, but not sourced inline |
| `TRANSITION_FUNDS` (10 funds) | Real named funds (EU JTF €17.5Bn is actually correct; US IRA $60Bn community provisions; SA JET $8.5Bn; Germany Coal Exit €40Bn — figures are directionally accurate) |
| Portfolio exposure fallback | `Math.round(30 + seed(i+77)×50)` when a holding's country can't be matched to `COUNTRY_JT_SCORES` — synthetic demo value |

### 7.3 Calculation walkthrough

- **KPI cards** — simple aggregates over the 20-country array: `avgJTScore = mean(composite)`,
  `countriesWithPlans = count(just_transition_plan)`, `totalTransitionFunds = Σ transition_fund_bn`,
  `totalWorkersAffected = Σ coal_workers_affected`, `retrainingCoverage = count(retraining_programs)
  / 20 × 100`, `avgEnergyPoverty = mean(energy_poverty_pct)`, `avgSocialDialogue =
  mean(governance)`, `devNationFinanceGap = 100 − mean(developing) for {IN,ID,ZA,BR,MX}`.
- **Radar (single country)** — plots the 5 dimension sub-scores for the selected `iso2`.
- **Comparison radar (2–3 countries)** — same 5 dimensions overlaid for up to 3 selected countries.
- **Scatter (Workers vs Fund)** — `x = log10(max(coal_workers_affected,1))`, `y =
  transition_fund_bn`, bubble size/colour keyed to `composite` — a log transform is used because
  worker counts span 3 orders of magnitude (200 in Sweden to 3.8M in India); no regression line or
  correlation coefficient is computed, purely a scatter render.
- **Energy Poverty threshold filter** — slider 0–100 maps to a 0–10% threshold
  (`energyPovertySlider/10`), filtering countries whose `energy_poverty_pct` exceeds it.
- **Portfolio & Social Dialogue tab** — `portfolioJTExposure` maps each portfolio holding (from
  `localStorage: ra_portfolio_v1`) to a country via `GLOBAL_COMPANY_MASTER`, then looks up that
  country's `composite` as the holding's "JT exposure score"; unmatched holdings get a seeded-random
  fallback (`30 + seed(i+77)×50`, i.e. 30–80).

### 7.4 Worked example

South Africa: `workers=35, communities=32, equity=28, developing=60, governance=42`.
`composite = 0.25×35 + 0.25×32 + 0.20×28 + 0.15×60 + 0.15×42 = 8.75+8+5.6+9+6.3 = 37.65 ≈ 37` — matches
the stored value exactly. With `coal_workers_affected=92,000` and `transition_fund_bn=8.5`, the
scatter point sits at `x=log10(92000)=4.96`, `y=8.5`, coloured red (`composite<40`) — visually flagging
South Africa as a country with a large affected workforce, meaningful pledged finance, but a weak
composite JT score, consistent with the real-world JETP implementation delay narrative (though that
narrative is not itself computed — it's a coincidence of the authored numbers).

### 7.5 Companion analytics

- **Developing Nation Support Gap cards** (India, Indonesia, South Africa, Brazil, Mexico, Chile) —
  same `developing` sub-score rendered as a progress bar per country, plus the associated fund size
  and energy-poverty badge.
- **Retraining Investment vs Workers Affected** — top-12 countries by `coal_workers_affected`,
  grouped bar of workers (K), fund ($Bn), and green jobs created (K) — a juxtaposition, not a ratio
  or regression.

### 7.6 Data provenance & limitations

- **The 20-country dataset is hand-authored, not seeded-random** (unlike most sibling modules) — a
  meaningful distinction: the numbers are static demo data with no `sr()`/PRNG call in the country
  table, though the portfolio-mapping fallback does use the platform's `seed()` PRNG for unmatched
  holdings. No citation is embedded in code tying any country's score to a real ILO, IRENA, or CPI
  dataset, so all figures should be treated as illustrative until validated against source data.
- **The real backend engine is orphaned from this page.** `backend/services/just_transition_engine.py`
  and its 8 documented routes (`/assess`, `/cif-eligibility`, `/community-resilience`,
  `/eu-jtf-eligibility`, plus 4 `ref/*` endpoints) exist in the codebase and are presumably used by
  the sibling `just-transition-adaptation` module or DME integrations, but `JustTransitionPage.jsx`
  makes no `axios`/`fetch` call at all — every number the user sees here comes from the static
  in-file array, not from the engine.
- `TRANSITION_FUNDS` figures are directionally correct for well-known named programmes but are not
  live-updated (e.g. India JT Task Force $5Bn is dated 2024 and may already be stale).

**Framework alignment:** ILO Guidelines for a Just Transition (2015) — the 5-dimension structure
(worker/community/equity/developing-nation/governance) is a reasonable operationalisation of ILO's
7 policy areas, though condensed and re-weighted by the module's authors rather than drawn from an
ILO-published composite index. IRENA World Energy Transitions Outlook and CPI Just Transition Finance
Landscape are cited in the guide as data sources but are not ingested. JETP/EU JTF figures in
`TRANSITION_FUNDS` are the module's most defensible real-world anchor points.

## 9 · Future Evolution

### 9.1 Evolution A — Connect the page to its orphaned engine and source the country dataset (analytics ladder: rung 2 → 3)

**What.** §7.6 identifies the structural oddity: a substantial backend engine (`just_transition_engine.py` — ILO principle scoring, EU JTF eligibility per Reg 2021/1056 Art 8 with allocation estimation, workforce-transition modelling with wage gaps and reskilling costs, community resilience, CIF eligibility) sits behind 18 live routes, and the lineage trace shows `POST /assess` passing — yet `JustTransitionPage.jsx` makes **zero API calls**. The page renders a hand-authored 20-country table whose composite honestly satisfies its declared weights (§7.1 verifies Germany 73.55≈74) but cites no source, and unmatched portfolio holdings get a `seed()` fallback score. Evolution A: (1) wire the country deep-dive and portfolio tabs to the engine's `/assess` and `/community-resilience` routes; (2) source the 20-country sub-scores to citable data (ILO STAT union density, energy-poverty statistics, documented JT plan status) with per-field provenance; (3) replace the seeded portfolio fallback with an honest "no country match" state.

**How.** (1) The engine's `run_full_assessment` becomes the country deep-dive's data source, fed with curated country inputs (fossil workers, wages, phase-out years) — turning the static radar into a computed one. (2) `TRANSITION_FUNDS` figures (already directionally accurate — EU JTF €17.5Bn) gain citations and a review date. (3) Engine changes stay additive: 5 modules share it, 51-module blast radius via tables. (4) The composite-weight identity check (§7.1) becomes a unit test so authored and computed scores can't drift silently.

**Prerequisites.** Country-level input curation (the engine's expected keys define the collection list); sibling regression tests. **Acceptance:** the page issues real API calls visible in the lineage sweep; every country sub-score carries a source; the portfolio tab shows explicit no-match states instead of seeded scores.

### 9.2 Evolution B — Just-transition assessment analyst over the 18-route engine surface (LLM tier 2)

**What.** The engine's breadth (ILO assessment, ESRS social, SEC human capital, living wage, worker displacement, CBI JT finance, stakeholder mapping, full assessment) is exactly the kind of multi-endpoint surface tier 2 was designed for: "run the full JT assessment for a Silesian coal region with these workforce numbers", "is this region EU JTF eligible and what allocation would the Art 8 criteria imply?", "what's the reskilling bill if phase-out compresses from 2038 to 2033?" — each a tool call against an already-live route.

**How.** Tool schemas auto-generated from the just-transition route family; the four `ref/` GETs (ILO principles, coal community profiles, sector profiles, CIF facilities, living-wage benchmarks, ESRS requirements, CBI criteria) give the copilot citable grounding with the engine's own `source` fields. Discipline rules: JTF allocation estimates always carry the engine's documented heuristic basis (10% of fossil-GDP exposure × score multiplier — an estimate, not a Commission decision); tier assignments quote the engine's threshold constants (`_JT_RISK_TIERS` etc.); social-dialogue and union-density claims cite ILO STAT vintages once Evolution A sources them. Cross-module consistency: JETP figures defer to the jetp-analytics module's curated plan data (the sibling module documents a $15.5Bn-vs-$5Bn India inconsistency this copilot must not propagate).

**Prerequisites.** Phase 2 tool-calling — the engine works today, so tier 2 needs no backend work; Evolution A improves grounding but doesn't block. **Acceptance:** every score/€ figure matches a logged engine response; heuristic bases stated verbatim; cross-module JETP figures single-sourced.