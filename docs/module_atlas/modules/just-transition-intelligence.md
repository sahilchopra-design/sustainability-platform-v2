# Just Transition Intelligence
**Module ID:** `just-transition-intelligence` · **Route:** `/just-transition-intelligence` · **Tier:** A (backend vertical) · **EP code:** EP-CB2 · **Sprint:** CB

## 1 · Overview
ILO Just Transition Framework with 5-pillar scoring across 10 global regions. Includes workforce vulnerability analysis, financing gap quantification, green job sector pipeline with 2030/2040 projections.

**How an analyst works this module:**
- Select region to view 5-pillar radar chart
- Vulnerability Matrix ranks regions by fossil dependency and reskilling need
- Financing Gap shows JTF need vs available funding by region
- ILO JTF Alignment checks each pillar compliance
- Green Job Sectors shows 8-sector pipeline with 2030/2040 projections

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ILO_PILLARS`, `REGIONS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGIONS` | 11 | `country`, `sector`, `fossil_jobs`, `green_jobs`, `wage_fossil`, `wage_green`, `reskill_cost`, `vuln`, `jtf_need`, `jtf_avail`, `color` |
| `ILO_PILLARS` | 6 | `desc`, `weight`, `color` |
| `GREEN_SECTORS` | 9 | `jobs_2030`, `jobs_2040`, `wage_premium`, `reskill_months` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_JT_ILO_MAP` | `Object.fromEntries(ILO_LABOR_INDICATORS.map(l => [l.country, l]));` |
| `netJobs` | `r.green_jobs - r.fossil_jobs;` |
| `wageGap` | `r.wage_green - r.wage_fossil;` |
| `jtfGap` | `r.jtf_need - r.jtf_avail;` |
| `totalFossil` | `REGIONS.reduce((s, x) => s + x.fossil_jobs, 0);` |
| `totalGreen` | `REGIONS.reduce((s, x) => s + x.green_jobs, 0);` |
| `totalJtfGap` | `REGIONS.reduce((s, x) => s + (x.jtf_need - x.jtf_avail), 0);` |
| `gapPct` | `reg.jtf_need > 0 ? (reg.jtf_need - reg.jtf_avail) / reg.jtf_need * 100 : 0;` |
| `scores` | `ILO_PILLARS.map(p => ({` |
| `overall` | `Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length);` |

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
**Frontend seed datasets:** `GREEN_SECTORS`, `ILO_PILLARS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global JT Finance Gap | `Need - Flow` | UNEP | Gap between adaptation/transition needs and current financial flows |
| Regions Assessed | — | ILO | Western/Eastern Europe, N.America, East/South/SE Asia, LatAm, SSA, MENA, Oceania |
| Green Job Pipeline (2030) | `Sector projections` | IRENA/ILO | Projected green jobs by 2030 across 8 clean economy sectors |

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
**Methodology:** ILO 5-pillar weighted scoring
**Headline formula:** `JTF_score = 0.25×SocialDialogue + 0.20×Rights + 0.30×Employment + 0.15×SocialProtection + 0.10×Development`

Each region assessed across 5 ILO pillars with weighted composite. Vulnerability combines fossil job dependency, wage gap (fossil vs green), reskilling cost per worker, and institutional capacity. Financing gap = estimated JTF need - available JTF funding.

**Standards:** ['ILO Just Transition Guidelines', 'Paris Agreement Art. 4']
**Reference documents:** ILO Guidelines for a Just Transition; Paris Agreement Article 4; IRENA Renewable Energy and Jobs Annual Review; UNEP Adaptation Gap Report

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
| `just-transition` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `just-transition-finance` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The guide advertises an `ILO 5-pillar weighted score =
> 0.25·SocialDialogue + 0.20·Rights + 0.30·Employment + 0.15·SocialProtection + 0.10·Development`.
> The page **defines those five pillars and weights** (`ILO_PILLARS`) and displays them, but the
> per-region pillar scores it renders are **not computed from any regional data** — they are seeded
> PRNG draws (`sr()`), and the "overall" is their unweighted mean (not the guide's weighted formula).
> The page itself labels this panel *"Illustrative / Demo scores — not authoritative ILO assessment
> data"*. The regional jobs/wage/financing-gap figures are a hard-coded `REGIONS` table with **real
> ILO labour indicators stamped on** from `data/laborIndicators`. Sections below document what runs.

### 7.1 What the module computes

Three genuinely code-derived quantities per selected region, plus PRNG pillar scores.

**Real arithmetic over the `REGIONS` table (10 rows, hard-coded):**
```js
netJobs   = green_jobs − fossil_jobs        // e.g. Appalachia: 18000 − 42000 = −24000
wageGap   = wage_green − wage_fossil         // Appalachia: 58000 − 72000 = −14000
jtfGap    = jtf_need − jtf_avail             // Appalachia: 4200 − 1800 = 2400 ($M)
totalFossil = Σ fossil_jobs                  // header KPI "Fossil Jobs at Risk"
totalGreen  = Σ green_jobs
totalJtfGap = Σ (jtf_need − jtf_avail)       // header "JTF Financing Gap" ($B)
gapPct(reg) = reg.jtf_need>0 ? (need−avail)/need·100 : 0
```

**ILO labour overlay** — each region is matched by ISO2→country name to `ILO_LABOR_INDICATORS`
(ILOSTAT 2022) and stamped with `informalPct`, `youthUnemploymentPct`, `unionDensity`,
`womenInMgmtPct`, `minWage` (nullish-coalesced so real data wins).

**Pillar scores (demo)** — for the first 5 regions:
```js
score = round(40 + sr(i·15 + pillarIdx)·30 + sr(i·37 + pillarIdx·21)·15)   // 40–85 band
overall = round(Σ score / 5)                                                // UNWEIGHTED mean
```
Note the divergence from the guide: `overall` is a plain mean of 5 pillar scores, ignoring the
0.25/0.20/0.30/0.15/0.10 weights that `ILO_PILLARS` actually carries.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| `REGIONS` (10) | Appalachia, Ruhr, Silesia, Mpumalanga, Alberta, Sabine Pass, Kemerovo, Rheinland, Jharkhand, La Guajira | Real regions; jobs/wage/reskill/vuln/jtf figures **hard-coded demo** (plausible magnitudes) |
| ILO pillar weights | 25 / 20 / 30 / 15 / 10 | ILO *Guidelines for a Just Transition* (2015) — 5 policy areas |
| `vuln` (region) | 45–98 | Hard-coded vulnerability index; drives red/amber/green |
| `GREEN_SECTORS` (8) | Solar PV 1.8k→4.2k jobs, Green H₂ 0.38k→1.6k, wage premium −12%…+18% | Hard-coded 2030/2040 pipeline; IRENA/ILO magnitudes |
| ILO labour overlay | informal %, youth unemployment %, union density, women-in-mgmt %, min wage | **Real** — ILOSTAT 2022 via `data/laborIndicators` |
| Pillar scores | `sr()`-seeded 40–85 | **Synthetic**, explicitly labelled demo in the UI |

### 7.3 Calculation walkthrough

1. `REGIONS` array literal loaded; `forEach` stamps ILO labour data onto each row.
2. User selects a region → `netJobs`, `wageGap`, `jtfGap` computed for it.
3. Header KPIs sum across all 10 regions (`totalFossil`, `totalGreen`, `totalJtfGap`).
4. Vulnerability Matrix ranks by `vuln`; Financing Gap tab charts `jtf_need` vs `jtf_avail` and
   `gapPct`; ILO JTF Alignment tab renders the 5 PRNG pillar bars + unweighted `overall`.
5. Green Job Sectors tab renders the fixed 8-sector 2030/2040 bar + cards.

### 7.4 Worked example (Silesia, Poland)

From the table: `fossil_jobs=85000, green_jobs=12000, wage_fossil=38000, wage_green=32000,
jtf_need=8500, jtf_avail=1200, vuln=91`.

| Metric | Formula | Value |
|---|---|---|
| Net jobs | 12000 − 85000 | **−73,000** (severe net loss) |
| Wage gap | 32000 − 38000 | **−$6,000** (green pays 16% less) |
| JTF gap | 8500 − 1200 | **$7,300M** |
| gapPct | (8500−1200)/8500·100 | **85.9%** unfunded |

Silesia's 85.9% financing gap and `vuln=91` place it in the red tier — consistent with its real-world
status as Europe's most exposed coal-mining region.

### 7.5 Companion analytics

- **Vulnerability Matrix** — regions ranked by `vuln`, cross-tabbed with fossil-job dependency.
- **Financing Gap** — `jtf_need`/`jtf_avail`/`gapPct` bar per region; header `totalJtfGap` (≈$77B
  across the 10 rows) echoes the guide's "$124B/yr global gap" (a different, larger UNEP figure).
- **Green Job Sectors** — 2030 vs 2040 pipeline with wage premium and reskilling months.

### 7.6 Data provenance & limitations

- **`REGIONS` jobs/wage/JTF figures are synthetic demo data** (hard-coded, not PRNG but unsourced);
  the **ILO labour overlay is real** (ILOSTAT 2022).
- **Pillar alignment scores are `sr()`-seeded and self-labelled non-authoritative.** They do not use
  the guide's weighted formula (they use an unweighted mean), nor do they read any regional input.
- The backend `JustTransitionEngine.assess_ilo_principles` *does* implement the true weighted ILO
  composite (0.25/0.25/0.20/0.15/0.15 across its five principles — note the engine's split differs
  from the page's 25/20/30/15/10), but the page never calls it.

**Framework alignment:** ILO *Guidelines for a Just Transition towards environmentally sustainable
economies* (2015) — the five pillars/weights shown mirror the ILO's five policy areas; the ILO
derives no single numeric "score" itself, so any composite here is an analyst construct. Paris
Agreement Art. 4 (just transition of the workforce) — motivates the framing. IRENA *Renewable Energy
and Jobs* — magnitudes behind `GREEN_SECTORS`.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (The page renders `sr()`-seeded pillar
scores and hard-coded regional figures; the guide's weighted ILO score is not computed from data.)

### 8.1 Purpose & scope
Produce an auditable, data-driven **ILO Just-Transition alignment score** and **regional financing-gap
estimate** per coal/fossil region, for allocators sizing JTF/JETP support and for sovereign-credit
overlays. Coverage: transition-exposed NUTS2 / sub-national regions.

### 8.2 Conceptual approach
1. **Weighted ILO composite** — replace random pillar scores with rubric-scored indicators, using
   the guide's 0.25/0.20/0.30/0.15/0.10 weights (or the engine's principle split). Benchmarks: ILO
   2015 Guidelines operationalised as CBI Just Transition Criteria (2023) checklists; World Bank JT
   Framework (2022) diagnostic.
2. **Financing-gap model** — bottom-up transition need vs available JTF, per region. Benchmarks:
   UNEP Adaptation Gap need-vs-flow method; CPI Global Landscape of Climate Finance.

### 8.3 Mathematical specification

```
pillar_score_p = 100 · (Σ_j indicator_pj · maturity_pj) / Σ_j maturity_pj      indicator ∈ {0,0.5,1}
ILO_score      = Σ_p w_p · pillar_score_p        w = [0.25,0.20,0.30,0.15,0.10]

Vulnerability  = 0.4·fossil_job_dependency + 0.3·(1−alt_sector_score)
                 + 0.2·wage_cliff + 0.1·informal_employment_share      (0–100, higher=worse)

JTF_need   = reskill_cost·workers + income_support + community_diversification
JTF_gap    = max(0, JTF_need − JTF_available)
gapPct     = JTF_gap / JTF_need
```

| Parameter | Calibration source |
|---|---|
| Pillar weights `w_p` | ILO 2015 Guidelines / guide |
| Indicator maturity scoring | CBI Just Transition Criteria 2023 checklist |
| `fossil_job_dependency`, `alt_sector_score` | Engine `COAL_COMMUNITY_PROFILES` |
| `informal_employment_share`, `union_density` | ILOSTAT 2022 (already in `data/laborIndicators`) |
| `reskill_cost`, `income_support` | Engine `model_workforce_transition`; ILO |

### 8.4 Data requirements
- Region → indicator responses per ILO pillar (tripartite dialogue evidence, reskilling programmes,
  social-protection coverage) — survey / policy tracker.
- Fossil vs green jobs, wages, reskill cost — engine profiles + ILO labour data (present).
- JTF committed/available per region — EU JTF allocations, JETP tranches.

### 8.5 Validation & benchmarking plan
- Reconcile `ILO_score` against CBI Just Transition certification / World Bank JT diagnostics.
- Backtest `gapPct` vs realised EU JTF disbursement shortfalls (public monitoring).
- Sensitivity on pillar weights (equal vs guide vs engine split) to show ranking stability.

### 8.6 Limitations & model risk
- Pillar indicators are largely qualitative and self-reported — greatest model risk is optimistic
  self-assessment; require third-party attestation and cap un-attested pillars at 50.
- Regional financing need is sensitive to displaced-worker counts and reskilling unit costs.
- The composite is a policy-alignment score, not a probability — must not be read as a risk PD.

## 9 · Future Evolution

### 9.1 Evolution A — Regional assessments computed by the engine, sourced from ILO data (analytics ladder: rung 2 → 3)

**What.** The page computes honest arithmetic over its 10-region table — `netJobs = green − fossil`, `wageGap`, `jtfGap = need − avail`, a 5-pillar weighted composite per the §5 ILO formula — and it already joins a real reference dataset (`_JT_ILO_MAP` built from `ILO_LABOR_INDICATORS`). But the region rows themselves (fossil/green jobs, wages, reskill cost, JTF need/avail) are authored constants, the pillar scores driving the radar are static, and the shared `just_transition_engine` — whose `assess_ilo_principles` implements exactly this weighted composite with tier thresholds, and whose `model_workforce_transition` computes the same net-jobs/wage-gap/reskilling chain — is never called (all POSTs `skipped` in the sweep). Evolution A: region records move to the shared `COAL_COMMUNITY_PROFILES` orbit with ILO STAT/IRENA sourcing per field; pillar scores and vulnerability come from engine calls; the financing-gap denominator aligns with the JT-finance-hub's single-sourced instrument table so "need vs available" is consistent family-wide.

**How.** (1) The region deep-dive calls `POST /ilo-assessment` and `/workforce-transition` with the sourced inputs; the UI's local diff arithmetic remains as instant feedback, reconciled against engine output. (2) `GREEN_SECTORS` 2030/2040 projections re-anchored to IRENA's published jobs outlook with vintage. (3) Tier labels come from the engine's `_ILO_TIER_THRESHOLDS`/`_JT_RISK_TIERS` constants rather than local bands. (4) Engine changes additive — 5 modules share it, 51-module table blast radius.

**Prerequisites.** Region input sourcing (ILO STAT employment, national wage data); coordination with the JT family's shared-table work. **Acceptance:** the radar renders engine-returned pillar scores; each region field carries a source; the family's JTF gap figures agree; POSTs appear exercised in the lineage sweep.

### 9.2 Evolution B — Regional JT intelligence copilot (LLM tier 2)

**What.** A tool-calling analyst for the module's comparative questions: "rank the 10 regions by residual vulnerability after accounting for available JTF funding", "what does South Asia's wage gap imply for reskilling investment per worker?", "which green sectors absorb displaced coal workers fastest given reskill months?" (the `GREEN_SECTORS` reskill_months × wage_premium fields make this a real matching argument, not vibes). Multi-region what-ifs run `model_workforce_transition` per region and compose the comparison.

**How.** Tool schemas over the just-transition route family (shared with the sibling modules — one tool registry serves five pages); the four reference GETs ground qualitative claims with their `source` fields. Discipline: pillar-weight arithmetic shown when composites are compared (the §5 weights 0.25/0.20/0.30/0.15/0.10 are quoted, not assumed); JTF-gap answers state the need-estimation basis; green-jobs projections cite the IRENA vintage; regions outside the assessed 10 get a scope refusal pointing to the engine's generic assessment path rather than invented figures.

**Prerequisites.** Phase 2 tooling (the engine routes are live today); Evolution A's sourcing for citation-grade answers. **Acceptance:** comparative rankings reproduce from logged engine responses; every wage/jobs figure carries a source or engine-call reference; weight arithmetic visible in composite explanations.