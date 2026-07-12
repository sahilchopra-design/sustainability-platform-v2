# Just Transition Finance Hub
**Module ID:** `just-transition-finance-hub` · **Route:** `/just-transition-finance-hub` · **Tier:** A (backend vertical) · **EP code:** EP-CO6 · **Sprint:** CO

## 1 · Overview
EU Just Transition Fund (€17.5B), JETP tracker ($43.5B total), sovereign JT bonds, MDB programmes, and impact measurement.

**How an analyst works this module:**
- Finance Overview shows all JT instruments
- JETP Tracker monitors $43.5B in country partnerships
- Impact Measurement tracks jobs transitioned and emissions avoided

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `FLOW_DATA`, `IMPACT_DATA`, `INSTRUMENTS`, `MDB_PROGRAMMES`, `PALETTE`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `INSTRUMENTS` | 9 | `type`, `amountBn`, `region`, `status`, `disbursedPct` |
| `BONDS` | 6 | `amount`, `coupon`, `tenor`, `framework`, `rating`, `year` |
| `MDB_PROGRAMMES` | 6 | `programme`, `amountBn`, `countries`, `jobsTarget`, `status` |
| `IMPACT_DATA` | 5 | `jobsTransitioned`, `emissionsAvoided`, `wellbeingIndex` |
| `FLOW_DATA` | 6 | `value` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalFinance` | `INSTRUMENTS.reduce((s, i) => s + i.amountBn, 0);` |

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
**Frontend seed datasets:** `BONDS`, `FLOW_DATA`, `IMPACT_DATA`, `INSTRUMENTS`, `MDB_PROGRAMMES`, `PALETTE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU JTF | — | EC Cohesion | EU Just Transition Fund allocation |
| JETP Total | — | JETP Secretariats | Across 3 country partnerships |

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
**Methodology:** JTF instrument mapping
**Headline formula:** `Coverage = Σ(instrument_allocations) / Estimated_JT_need`

Comprehensive tracker of all just transition finance instruments. JETP deals: South Africa $8.5B, Indonesia $20B, Vietnam $15.5B. Impact metrics: jobs transitioned, emissions avoided, community wellbeing index.

**Standards:** ['EU JTF Regulation', 'JETP Secretariats']
**Reference documents:** EU JTF Regulation; JETP Implementation Plans

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
| `just-transition-adaptation` | engine:just_transition_engine, table:COAL_COMMUNITY_PROFILES, table:exc, table:fossil, table:public |
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

> ⚠️ **Guide↔code note.** The guide describes this as an *instrument tracker* with the coverage
> formula `Coverage = Σ(instrument_allocations) / Estimated_JT_need`. The page is indeed a tracker —
> but it computes **no coverage ratio and no `Estimated_JT_need`**. The only derived quantity in the
> entire page is `totalFinance = Σ amountBn`. Everything else is a hard-coded reference table
> rendered as bars/pies. The eight `/api/v1/just-transition/*` trace endpoints (and the backend
> `JustTransitionEngine`) are not called. This is a curated data-display module, not a calculation
> engine.

### 7.1 What the module computes

A single aggregation:

```js
totalFinance = INSTRUMENTS.reduce((s, i) => s + i.amountBn, 0)
             = 17.5 + 8.5 + 20.0 + 15.5 + 2.5 + 1.2 + 14.0 + 2.8  =  82.0  ($ bn)
```

All other panels are direct renders of five hard-coded tables:

- `INSTRUMENTS` (8 rows) — name, type, amountBn, region, status, disbursedPct
- `BONDS` (5 rows) — sovereign/MDB JT bonds: issuer, amount, coupon, tenor, framework, rating, year
- `MDB_PROGRAMMES` (5 rows) — MDB, programme, amountBn, countries, jobsTarget, status
- `IMPACT_DATA` (4 rows) — year, jobsTransitioned, emissionsAvoided (MtCO₂), wellbeingIndex
- `FLOW_DATA` (5 rows) — capital-source split summing to 100 (Public 42, MDB 28, Private 18,
  Philanthropic 8, Sovereign Bonds 4)

### 7.2 Parameterisation / reference data provenance

| Table | Key values | Provenance |
|---|---|---|
| JETP deals | South Africa $8.5bn, Indonesia $20bn, Vietnam $15.5bn, Senegal $2.5bn | Real, publicly announced JETP headline figures (JETP Secretariats) |
| EU JTF | €/$17.5bn | Real EU Just Transition Fund envelope (EC Cohesion) |
| Germany coal regions | $14.0bn | Real *Strukturstärkungsgesetz Kohleregionen* order of magnitude |
| Sovereign JT bonds | Chile $2.0bn @4.25% 10y, EIB $3.0bn @2.85% 15y AAA, S.Africa SOE @8.50% BB | Plausible/illustrative — coupons and ratings not sourced in code |
| `IMPACT_DATA` | jobsTransitioned 12k→85k (2022–25), emissions 8.5→72 Mt, wellbeing 62→70 | **Synthetic demo trajectory** (smooth upward, no PRNG, no source) |
| `disbursedPct` | 0–65% per instrument | Hard-coded, illustrative |

No `sr()` PRNG is used anywhere — the numbers are curated constants rather than random, but the
impact series and disbursement percentages are still unsourced demo values.

### 7.3 Calculation walkthrough

Inputs → outputs is trivial: the six tabs (Finance Overview, JTF Instruments, Sovereign JT Bonds,
JETP Tracker, MDB JT Programmes, Impact Measurement) each render one or two of the constant tables
with a Recharts bar/line/pie. `totalFinance` (82.0) is the only cross-row computation and feeds the
Finance Overview KPI card.

### 7.4 Worked example (Finance Overview headline)

`totalFinance` = 17.5 + 8.5 + 20.0 + 15.5 + 2.5 + 1.2 + 14.0 + 2.8 = **$82.0 bn tracked**. The guide
claims "JETP total $43.5bn across 3 country partnerships"; summing the three named JETP rows in code
(SA 8.5 + Indonesia 20.0 + Vietnam 15.5) = **44.0**, and including Senegal 2.5 = 46.5 — the guide's
43.5 figure predates the Senegal row and is not recomputed on the page.

### 7.5 Companion analytics

- **Capital flow pie** (`FLOW_DATA`) — source split; the closest thing to an analytical decomposition.
- **Impact Measurement** — 4-year jobs/emissions/wellbeing lines from `IMPACT_DATA`.
- **Disbursement bars** — `disbursedPct` per instrument, a delivery-progress view.

### 7.6 Data provenance & limitations

- JETP / EU-JTF / Germany headline envelopes are **real public figures**; bond coupons, ratings,
  `disbursedPct`, and the entire `IMPACT_DATA` series are **synthetic/illustrative demo values**
  with no citation in code.
- No coverage ratio, no financing-gap denominator (`Estimated_JT_need`), so the guide's headline
  formula is not evaluated — the module cannot answer "what % of need is covered".
- The backend engine's ILO/EU-JTF/CIF scoring is unused; this hub is display-only.

**Framework alignment:** EU JTF Regulation (EU) 2021/1056 — envelope figure only, no eligibility
scoring (that lives in the engine's `EU_JTF_ELIGIBILITY_CRITERIA`). Glasgow Climate Pact JETPs —
tracked as headline deal sizes. ICMA/CBI just-transition bond frameworks — referenced as a `framework`
string label on each bond, not assessed.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (The page tracks headline figures but never
computes the guide's coverage ratio or any credibility/gap metric.)

### 8.1 Purpose & scope
Turn the static tracker into a **JT finance gap-and-adequacy model**: for each region/country, compare
committed just-transition capital against modelled transition need, and flag under/over-funding for
allocators and JETP secretariats. Coverage: JETP countries, EU JTF regions, MDB programme geographies.

### 8.2 Conceptual approach
Bottom-up need estimation + top-down commitment tracking:
1. **Transition-need model** — worker reskilling + income support + community diversification +
   stranded-asset write-down, per affected region. Mirrors the platform engine's
   `model_workforce_transition` cost build-up and World Bank JT Framework (2022) cost taxonomy.
2. **Coverage & adequacy** — `Coverage = committed / need`; adequacy-adjusted for disbursement pace.
   Benchmarks: CPI *Global Landscape of Climate Finance* need-vs-flow methodology and IEA transition
   investment gap analysis.

### 8.3 Mathematical specification

```
Need_region = Reskill + Income_support + Community_div + Stranded_write_down
  Reskill        = workers · reskill_cost_per_worker
  Income_support = workers · avg_wage · (support_months/12)
  Community_div  = f(gdp_fossil_dependency) · regional_GDP
  Stranded       = Σ_asset (book_value · impairment_pct)

Coverage_region = Σ committed_instrument_region / Need_region
Disbursement_adj_coverage = Coverage · (Σ disbursed / Σ committed)
Gap_region = max(0, Need_region − committed_region)
Global_gap = Σ_region Gap_region
```

| Parameter | Calibration source |
|---|---|
| `reskill_cost_per_worker`, `support_months` | Engine `model_workforce_transition` defaults; ILO |
| `impairment_pct` (stranded coal) | IEA WEO/NZE coal phase-out pathways; Carbon Tracker |
| `gdp_fossil_dependency` | Engine `COAL_COMMUNITY_PROFILES.alternative_sector_score` |
| Committed / disbursed | This page's `INSTRUMENTS` table (real headline figures) |

### 8.4 Data requirements
- Affected-worker counts + wages per region — engine `COAL_COMMUNITY_PROFILES` / ILO labour data.
- Fossil-asset book values + retirement schedules — company disclosure / GEM Global Coal Plant Tracker.
- Committed & disbursed capital — the `INSTRUMENTS`/`BONDS`/`MDB_PROGRAMMES` tables here.
- Fiscal capacity for community diversification — IMF WEO.

### 8.5 Validation & benchmarking plan
- Reconcile `Global_gap` against CPI/OECD published just-transition finance-gap estimates.
- Backtest coverage forecasts vs realised disbursement for EU JTF regions (public monitoring data).
- Sensitivity on `impairment_pct` and `support_months`; stress with delayed disbursement.

### 8.6 Limitations & model risk
- Need estimation is highly sensitive to stranded-asset assumptions — conservative fallback uses IEA
  central retirement dates, not issuer optimism.
- Double-counting risk across overlapping instruments (JETP + MDB + bond) — require instrument-level
  de-duplication before summing committed capital.
- Political-economy delivery risk (pledged ≠ disbursed) is captured only via the disbursement adjuster.

## 9 · Future Evolution

### 9.1 Evolution A — Coverage-vs-need arithmetic on a maintained instrument tracker (analytics ladder: rung 1 → 2)

**What.** The hub is a curated tracker — real named instruments (EU JTF €17.5B, the three JETP deals summing to the $43.5-44B headline, sovereign JT bonds, MDB programmes) with a single computation, `totalFinance = Σ amountBn`. The guide's headline formula, `Coverage = Σ instrument_allocations / Estimated_JT_need`, is never computed because no need estimate exists; disbursement percentages are static fields; `IMPACT_DATA` (jobs transitioned, emissions avoided, a wellbeing index) is hand-set with no measurement chain; and the JETP figures overlap with two sibling modules that §7 of just-transition-adaptation showed carry mutually inconsistent numbers. Evolution A: (1) a maintained `jt_instruments` reference table shared across the JT module family — one source of truth for JETP/JTF figures with citations and review dates, ending the documented inconsistency; (2) the coverage ratio implemented with the need denominator from the shared engine's workforce-transition outputs (`total_transition_cost_m` summed over assessed regions) so coverage means something; (3) disbursement tracked as dated events rather than a static percent.

**How.** (1) Instrument table with per-field provenance; the sibling jetp-analytics module's Investment Plan curation feeds it. (2) `GET /jt-finance-hub/coverage` computing `Σ committed / Σ assessed_need` with the region-assessment coverage disclosed (need is only as complete as the assessed-region set — stated, not hidden). (3) Impact metrics re-based on programme-reported data where published (EU JTF reports operational indicators) with honest nulls elsewhere. (4) The `eu-jtf-eligibility` route (currently `skipped` in the sweep) wired into an allocation-explorer tab.

**Prerequisites.** Cross-module data-ownership agreement (this hub becomes the instrument source; jetp-analytics owns plan detail); curation cadence. **Acceptance:** all three JT sibling modules render identical JETP figures from one table; coverage displays its numerator/denominator composition; disbursement history is dated and sourced.

### 9.2 Evolution B — JT-finance landscape copilot for allocators (LLM tier 1 → 2)

**What.** A copilot for DFI and sovereign users navigating the instrument landscape: "what concessional sources exist for a Vietnamese coal-region programme and at what blended ratios?" (the engine's `assess_cif_eligibility` returns concessional availability and blending), "how much of the EU JTF is disbursed and to which regions?", "compare the three JETP structures — grant element, leverage, disbursement pace." Grounding is the curated instrument table plus the engine's four reference GETs (CIF facilities, coal-community profiles, ILO principles, sector profiles — all live and `passed` in the sweep).

**How.** Tier 1: instrument table and reference payloads into the corpus with per-figure citations mandatory — these are politically scrutinised public numbers where a wrong figure is checkable. Tier 2: tool calls to `assess_cif_eligibility` and `assess_eu_jtf_eligibility` for eligibility what-ifs, and the coverage endpoint for gap questions; the JTF allocation heuristic's basis (10% of fossil-GDP exposure × score) is stated whenever an allocation estimate is quoted. Disbursement-pace commentary uses recorded events only — the JETP family's documented slow-drawdown reality must come from data, not narrative colour.

**Prerequisites.** Evolution A's single-sourced table; Phase 2 for tool calls (reference GETs support tier 1 immediately). **Acceptance:** every instrument fact carries a citation; eligibility answers show engine payloads; no JETP figure conflicts across the module family in copilot answers.