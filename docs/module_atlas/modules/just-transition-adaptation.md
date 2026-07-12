# Just Transition & Adaptation
**Module ID:** `just-transition-adaptation` · **Route:** `/just-transition-adaptation` · **Tier:** A (backend vertical) · **EP code:** EP-EK6 · **Sprint:** EK

## 1 · Overview
Regional vulnerability assessment for 22 fossil fuel communities (Appalachia/Ruhr/Mpumalanga/Jharkhand), JETP finance mechanisms ($147Bn committed), net job creation/displacement analytics, social justice outcomes radar (procedural/distributive/restorative), and investor ILO/PRI framework.

> **Business value:** Used by impact investors integrating just transition into climate finance analysis, JETP advisory teams structuring blended finance programmes, and ESG analysts assessing social transition risk in fossil fuel portfolios.

**How an analyst works this module:**
- Sort 22 regions by vulnerability score, workers at risk, finance gap, or RE job potential
- Filter by transition plan status (Yes/Draft/None) to identify regions needing immediate planning support
- Review 8 JETP and just transition finance mechanisms with size, instrument type, and policy anchor
- Use social justice radar to compare fossil economy vs just transition vs adaptation-focused outcomes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FINANCE_MECHANISMS`, `INVESTMENT_TREND`, `JOBS_DATA`, `KpiCard`, `Pill`, `REGIONS`, `SOCIAL_RADAR`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FINANCE_MECHANISMS` | 9 | `size`, `region`, `focus`, `alignment`, `instrument` |
| `SOCIAL_RADAR` | 7 | `fossil`, `transition`, `adaptation` |
| `JOBS_DATA` | 9 | `jobsCreated`, `lostFromFossil`, `net`, `region` |

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
**Frontend seed datasets:** `FINANCE_MECHANISMS`, `JOBS_DATA`, `SOCIAL_RADAR`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| JETP total commitments | `Across South Africa, Indonesia, India, Vietnam, Senegal, Nigeria (COP26/27)` | COP27 JETP Tracker 2023 | JETP leverage ratio 3:1 public:private; grant element typically 10–25%; most disbursement slow — SA JETP 18 months post-announcement, <$200M disbursed. |
| EU JTF total allocation | `2021–2027 for coal/carbon-intensive regions` | EU Just Transition Fund Regulation 2021 | Silesia (PL), Ruhr (DE), Lignite regions (DE/CZ) top recipients; conditions: coal phase-out timeline commitment; 85% grants for deprived regions. |
| Green job retraining cost | `Per worker for offshore wind/solar skills` | IRENA Renewable Energy Jobs 2023 | Coal mining to wind turbine technician: 6–12 month programme; community college model; geographic barriers if new jobs distant from displaced workers. |
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
Output: `{'type': 'object', 'keys': ['entity_id', 'region_name', 'country', 'sector', 'just_transition_score', 'transition_risk_tier', 'ilo_composite_score', 'ilo_tier', 'eu_jtf_eligible', 'eu_jtf_score', 'eu_jtf_allocation_estimate_m_eur', 'net_jobs_k', 'net_jobs_pct', 'reskilling_cost_m_usd', 'total_transi`

**POST /api/v1/just-transition/cif-eligibility** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/just-transition/community-resilience** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/just-transition/eu-jtf-eligibility** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Just Transition Index
**Headline formula:** `JT_Score = 0.25 × IncomeEquity + 0.20 × EmploymentAccess + 0.20 × CommunityVoice + 0.20 × HealthSafety + 0.15 × GenderInclusion; JETP_Leverage = (TotalCommitment − GrantElement) / GrantElement; Worker_Retraining_Cost = DisplacedWorkers × AvgRetraining_Cost`

South Africa JETP $8.5Bn: workers in Mpumalanga coal region without just transition support face 22% income loss and 34% employment rate decline within 5 years of plant closure.

**Standards:** ['ILO Just Transition Finance Guidelines 2024', 'COP26 JETP Frameworks 2021', 'UN Sendai Framework 2015–2030']
**Reference documents:** ILO (2024) – Just Transition Finance Guidelines for Financial Institutions; COP27 (2022) – JETP South Africa, Indonesia, India, Vietnam Investment Plans; EU Commission (2021) – Just Transition Fund Regulation

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
| `just-transition-intelligence` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-finance` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states
> `JT_Score = 0.25×IncomeEquity + 0.20×EmploymentAccess + 0.20×CommunityVoice + 0.20×HealthSafety +
> 0.15×GenderInclusion` plus `JETP_Leverage = (TotalCommitment − GrantElement)/GrantElement` and
> `Worker_Retraining_Cost = DisplacedWorkers × AvgRetrainingCost`. **None of these three formulas are
> computed anywhere in the code.** The page's per-region `vulnerabilityScore` is a single seeded-random
> draw, not a weighted composite of the five named sub-indicators, and no leverage ratio or
> retraining-cost figure is calculated at all — the "social justice" 6-metric radar (Income Equity,
> Employment Access, Community Voice, Gender Inclusion, Indigenous Rights, Health & Safety) is a
> separate, hand-authored, region-agnostic dataset that is never combined into the per-region score.
> The listed `just_transition_engine.py` backend is not called by this page (no `axios`/`fetch` calls
> exist in the file). Sections below document the code as it actually behaves.

### 7.1 What the module computes

Four independent, unconnected datasets drive six tabs:

1. **22 fossil-dependent regions** (`REGIONS`) — Appalachia, Ruhr Valley, Silesia, Mpumalanga,
   Jharkhand, Inner Mongolia, etc. — each with 8 seeded-random attributes.
2. **8 named finance mechanisms** (`FINANCE_MECHANISMS`) — real programmes (EU JTF, SA/Indonesia/
   India JETP, US IRA §48C, World Bank JTIP, UK JT Platform, ADB ETM) with static, hand-entered
   commitment sizes.
3. **A 6-metric social-justice radar** (`SOCIAL_RADAR`) comparing "Fossil Economy" vs "Just
   Transition" vs "Adaptation Focus" archetypes — static, not tied to any region or country.
4. **8-sector jobs table** (`JOBS_DATA`) and a **7-year investment trend** (`INVESTMENT_TREND`,
   seeded-random) for Fossil / Clean Energy / Adaptation / Just Transition capital flows.

### 7.2 Parameterisation

```js
fossilDependency      = round(sr(i*7)*60 + 30)     // 30-90%
workers                = round(sr(i*11)*80000+5000) // 5,000-85,000
gdpShareFossil          = round(sr(i*5)*35+15)       // 15-50%
vulnerabilityScore      = round(sr(i*13)*40+40)      // 40-80
adaptFinanceGap         = round(sr(i*9)*800+100)     // $100-900M
renewableJobPotential    = round(sr(i*3)*60000+2000) // 2,000-62,000
justicePillar            = ['Procedural','Distributive','Restorative','All Three'][floor(sr(i*17)*4)]
transitionPlan           = ['Yes','Draft','None'][floor(sr(i*19)*3)]
```

| Field | Provenance |
|---|---|
| All 8 per-region attributes | Synthetic demo value, `sr(i×k)` PRNG — 22 real region *names* (Appalachia, Ruhr, Silesia, Mpumalanga, Jharkhand, etc.) paired with fabricated statistics |
| `FINANCE_MECHANISMS` sizes | Real, named programmes with plausible/correct order-of-magnitude commitments (EU JTF €17.5Bn, SA JETP $8.5Bn, Indonesia JETP $20Bn, India JETP — listed here as $15.5Bn, cf. the sibling `jetp-analytics` module's $5Bn figure for India, an internal platform inconsistency) |
| `SOCIAL_RADAR` scores | Hand-authored illustrative values, 3 archetypes × 6 metrics, no per-region linkage |
| `JOBS_DATA` sector jobs | Hand-authored static figures (Solar PV +820K, Coal Mining −420K, Oil & Gas −280K, etc.), no source cited, no year specified |
| `INVESTMENT_TREND` 2020-2026 | `sr()`-perturbed linear trends: fossil declining `1800−80i`, clean energy rising `280+120i`, adaptation `46+22i`, just transition `8+14i`, all ± small noise term |

### 7.3 Calculation walkthrough

- **KPIs**: `totalWorkers = Σ workers` (22 regions), `avgVulnerability = mean(vulnerabilityScore)`,
  `totalFinanceGap = Σ adaptFinanceGap` ($M, displayed in $Bn), and a **hard-coded** "JETP
  Commitments = $147Bn" figure that is not a sum of any in-file array (it does not equal the sum of
  `FINANCE_MECHANISMS` sizes, which totals $80.5Bn — the $147Bn appears to be an externally-sourced
  headline figure pasted in directly, not derived from the visible dataset).
- **Regional Vulnerability tab** — sortable by 4 fields (vulnerability, workers, finance gap, RE job
  potential) and filterable by `transitionPlan` status; purely a table re-sort/filter, no scoring
  logic.
- **Jobs Transition tab** — `JOBS_DATA` rendered as a stacked bar (created vs lost) and 4 net-change
  KPI tiles; `net = jobsCreated − lostFromFossil` is pre-computed in the static data, not derived in
  the render.
- **Social Justice Radar tab** — the 3-archetype × 6-metric comparison, entirely static.
- **Investment Flow tab** — area chart of the 4 seeded-random category trends over 2020–2026.

### 7.4 Worked example

Region `Mpumalanga, ZA` (`i=3`): `vulnerabilityScore = round(sr(3×13)×40+40) = round(sr(39)×40+40)`.
`sr(39) = frac(sin(40)×10000)`; `sin(40 rad) ≈ 0.7451`, so `frac(7451.3) = 0.332` →
`vulnerabilityScore = round(0.332×40+40) = round(53.3) = 53`. `workers = round(sr(33)×80000+5000)`;
`sr(33)=frac(sin(34)*10000)`, `sin(34)≈0.5291` → `frac(5290.8)=0.808` → `workers = round(0.808×80000+
5000) = 69,650`. Both figures are internally consistent (deterministic given the seed) but bear no
relationship to Mpumalanga's actual coal-workforce statistics, which the guide's `dataLineage` claims
come from "ILO JT Guidelines + COP27 JETP frameworks + EU JTF + World Bank JTIP" — none of which are
ingested in code.

### 7.5 Companion analytics

- **Overview tab** juxtaposes the investment-flow area chart with the net-jobs-by-sector bar chart
  side by side, but the two are computed independently with no shared driver.
- **Finance Mechanisms tab** renders `FINANCE_MECHANISMS` as info cards (region, instrument type,
  committed $Bn, policy anchor) — a reference table, not a calculation.
- **Investor Frameworks tab** (tab 5) is pure reference text: 4 static lists of principles (ILO/COP26
  just transition principles, JETP governance structure, adaptation equity assessment steps, investor
  framework citations) with no interactive or computed component.

### 7.6 Data provenance & limitations

- **All 22 regions' quantitative attributes are synthetic**, generated by `sr(seed) =
  frac(sin(seed+1)×10⁴)` — only the region *names* and countries are real.
- The three guide-cited formulas (weighted JT_Score, JETP leverage ratio, worker retraining cost) are
  **entirely absent** from the code; a user cannot derive any of the guide's headline analytics from
  what is actually rendered.
- Cross-module inconsistency: this module's India JETP figure ($15.5Bn) does not match the sibling
  `jetp-analytics` module's synthetic India `pledgedFinance` (which is itself `sr()`-derived and
  unrelated), illustrating that neither module's India figure should be treated as authoritative.
- The `SOCIAL_RADAR` archetype comparison (fossil vs transition vs adaptation) is illustrative
  storytelling, not measured outcome data for any real region or portfolio.

**Framework alignment:** ILO Just Transition Finance Guidelines (2024) and COP26/27 JETP frameworks
are correctly named and their qualitative structure (Investment Plan → IPG → grant-element blending →
conditionality) is accurately summarised in the reference tab, but none of it is operationalised as a
calculation. EU Just Transition Fund and IFC PS2 are correctly cited as real instruments/standards.
The module functions as a **curated reference + illustrative dashboard**, not a quantitative just
transition or adaptation-finance model.

## 9 · Future Evolution

### 9.1 Evolution A — Real region statistics and the three missing formulas (analytics ladder: rung 1 → 2)

**What.** The §7 flag lists exactly what to build: the guide's `JT_Score` weighted composite, `JETP_Leverage = (Commitment − Grant)/Grant`, and `Worker_Retraining_Cost = DisplacedWorkers × AvgCost` are all absent — the 22 real region names (Appalachia, Ruhr, Mpumalanga, Jharkhand) carry `sr()`-fabricated statistics, the social-justice radar is region-agnostic storytelling, the headline "$147Bn JETP commitments" is a pasted figure that doesn't reconcile to the visible $80.5Bn mechanism table, and §7.6 documents a cross-module inconsistency (India JETP $15.5Bn here vs unrelated figures in jetp-analytics). Evolution A: source real region statistics (EU JTF territorial plans publish exactly the fossil-employment and GDP-dependency data needed for the European regions; US EIA/BLS for Appalachia; national statistics for Mpumalanga/Jharkhand), compute the three formulas via the shared `just_transition_engine` (its `model_workforce_transition` already implements the retraining-cost and wage-gap math — the page just never calls it), and reconcile all JETP figures to a single curated source shared with jetp-analytics.

**How.** (1) Region records move to the shared `COAL_COMMUNITY_PROFILES` table (already in the engine's orbit) with per-field citations. (2) The vulnerability score becomes the engine's community-resilience composite instead of one `sr()` draw. (3) The headline KPI recomputes from the mechanism table or cites its external source explicitly — a displayed number must either sum from visible data or carry provenance. (4) The social radar either binds to per-region assessed outcomes or is relabeled as illustrative archetypes.

**Prerequisites.** Region data curation (EU JTF plans are public); the `sr()` region attributes deleted; JETP single-sourcing agreed across the module family. **Acceptance:** Mpumalanga's worker count matches a cited statistic, not `sr(33)`; the $147Bn figure reconciles or cites; vulnerability decomposes into engine-scored components.

### 9.2 Evolution B — Blended-finance structuring copilot for JT advisory teams (LLM tier 1 → 2)

**What.** The module's stated users — JETP advisory teams, impact investors, DFI safeguard teams — need mechanism-matching and framework guidance the curated content supports: "which finance mechanism fits a Silesian retraining programme — EU JTF grants or ADB ETM?", "what does IFC PS2 require for a coal-closure project?", "compare procedural vs distributive justice outcomes for this region's plan" (grounded in the investor-frameworks reference tab, which §7.5 notes is accurate qualitative content). Post-Evolution-A, tier 2 runs the engine: "model workforce transition for Jharkhand with a 2040 phase-out — net jobs, wage gap, retraining bill."

**How.** Tier 1: the curated `FINANCE_MECHANISMS` table (real programmes with instrument types and policy anchors) plus the frameworks reference text into the corpus; mechanism recommendations quote the mechanism's actual instrument/focus fields and the region's plan status. All quantitative region claims carry the synthetic-data caveat until Evolution A lands. Tier 2: tool calls to `model_workforce_transition`, `assess_eu_jtf_eligibility` and `assess_cif_eligibility` with input assumptions echoed back; disbursement realism inherited from the JETP family's documented slow-drawdown facts (§4.1 notes SA's <$200M in 18 months). The no-fabrication validator covers all $ and job figures.

**Prerequisites.** Copilot infrastructure; Evolution A for region-specific quantitative answers; the engine routes are live already for generic what-ifs. **Acceptance:** mechanism facts trace to table rows; engine what-ifs show their input payloads; region statistics post-Evolution-A carry citations, pre carry caveats.