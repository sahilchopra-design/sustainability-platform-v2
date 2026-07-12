# Api::Dashboard_Analytics
**Module ID:** `api::dashboard_analytics` · **Route:** `/api/v1/dashboard` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/dashboard/analytics` | `full_dashboard` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/kpis` | `dashboard_kpis` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/portfolio` | `dashboard_portfolio` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/climate` | `dashboard_climate` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/emissions` | `dashboard_emissions` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/governance` | `dashboard_governance` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/time-series` | `dashboard_time_series` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/sensitivity` | `dashboard_sensitivity` | api/v1/routes/dashboard_analytics.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `real-db`

**Database tables:** `CPI`, `NGFS` *(shared)*, `SBTi`, `__future__` *(shared)*, `all` *(shared)*, `company_profiles` *(shared)*, `csrd_entity_registry` *(shared)*, `csrd_kpi_values` *(shared)*, `db` *(shared)*, `dh_ca100_assessments` *(shared)*, `dh_country_risk_indices` *(shared)*, `dh_sbti_companies`, `fastapi` *(shared)*, `ngfs_scenarios`, `portfolios_pg` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dashboard/analytics** — status `passed`, provenance ['real-db'], source tables: `company_profiles`, `csrd_entity_registry`, `csrd_kpi_values`, `dh_ca100_assessments`, `dh_country_risk_indices`, `dh_sbti_companies`, `portfolios_pg`
Output: `{'type': 'object', 'keys': ['kpis', 'portfolio_exposure', 'climate_risk', 'emissions_by_sector', 'governance_heatmap', 'sbti_alignment', 'ca100_overview'], 'n_keys': 7}`

**GET /api/v1/dashboard/analytics/climate** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`, `dh_sbti_companies`
Output: `{'type': 'object', 'keys': ['climate_risk', 'ca100_overview'], 'n_keys': 2}`

**GET /api/v1/dashboard/analytics/emissions** — status `passed`, provenance ['real-db'], source tables: `dh_sbti_companies`
Output: `{'type': 'object', 'keys': ['emissions_by_sector'], 'n_keys': 1}`

**GET /api/v1/dashboard/analytics/governance** — status `passed`, provenance ['real-db'], source tables: `dh_country_risk_indices`
Output: `{'type': 'object', 'keys': ['governance_heatmap'], 'n_keys': 1}`

**GET /api/v1/dashboard/analytics/kpis** — status `passed`, provenance ['real-db'], source tables: `company_profiles`, `csrd_entity_registry`, `csrd_kpi_values`, `dh_ca100_assessments`, `dh_country_risk_indices`, `dh_sbti_companies`, `portfolios_pg`
Output: `{'type': 'object', 'keys': ['total_entities', 'csrd_entities', 'csrd_kpi_values', 'sbti_companies', 'sbti_net_zero', 'sbti_aligned_1_5c', 'ca100_companies', 'country_risk_countries', 'country_risk_indices', 'portfolios', 'total_data_points'], 'n_keys': 11}`

**GET /api/v1/dashboard/analytics/portfolio** — status `passed`, provenance ['real-db'], source tables: `dh_sbti_companies`
Output: `{'type': 'object', 'keys': ['portfolio_exposure'], 'n_keys': 1}`

**GET /api/v1/dashboard/analytics/sensitivity** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`, `dh_country_risk_indices`, `dh_sbti_companies`, `ngfs_scenarios`
Output: `{'type': 'object', 'keys': ['sensitivity'], 'n_keys': 1}`

**GET /api/v1/dashboard/analytics/time-series** — status `passed`, provenance ['real-db'], source tables: `dh_sbti_companies`, `ngfs_scenarios`
Output: `{'type': 'object', 'keys': ['time_series'], 'n_keys': 1}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/api/v1/routes/dashboard_analytics.py` at `/api/v1/dashboard` — self-described as the
replacement for *"seed-based random data generators in the frontend"*: every figure is a SQL
aggregation over live ingested tables (SBTi, CA100+, country risk indices, CSRD KPIs, company
profiles, portfolios, NGFS scenarios). There is no services engine.)*

### 7.1 What the module computes

Eight endpoints, all thin wrappers over internal aggregators:

| Endpoint | Aggregator | Output |
|---|---|---|
| `GET /analytics` | all of the below | combined dashboard JSON |
| `/analytics/kpis` | `_compute_kpis` | platform-wide counts (entities, SBTi, CA100+, CSRD KPIs, portfolios) |
| `/analytics/portfolio` | `_compute_portfolio_exposure` | SBTi sector distribution as a portfolio proxy + `risk_score` |
| `/analytics/climate` | `_compute_climate_risk` + `_compute_ca100_overview` | target-status/ambition distributions; CA100+ cluster alignment |
| `/analytics/emissions` | `_compute_emissions_by_sector` | per-sector alignment rates + Paris flag |
| `/analytics/governance` | `_compute_governance_heatmap` | 4-index composite governance score per country |
| `/analytics/time-series` | `_compute_time_series` | NGFS carbon-price-driven expected-loss trajectories |
| `/analytics/sensitivity` | `_compute_sensitivity_drivers` | 8-driver tornado (low/high/swing per macro driver) |

Headline formulas (quoted from code):

```python
risk_score       = 100 − aligned_1_5c / max(companies,1) × 100          # per sector
alignment_rate   = (aligned_1_5c + well_below_2c) / max(total,1) × 100  # per sector
paris_aligned    = alignment_rate_fraction > 0.5
composite_gov    = ( CPI                                   # 0-100, higher better
                   + (120 − FSI)/120 × 100                 # invert 0-120 fragility
                   + (14 − FH_FIW)/14 × 100                # invert Freedom House
                   + (1 − GII) × 100 ) / 4                 # invert 0-1 inequality
EL(year, scen)   = 500 × (carbon_price/1000) × (0.3 + 0.7 × no_target_ratio)
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `base_exposure_m` | $500M | inline comment "Normalised portfolio exposure" — synthetic scaling constant |
| `carbon_factor` | price/1000 ("$100/t → 0.1") | engine-authored scaling |
| `risk_mult` | 0.3 + 0.7 × no-target ratio, bounded 0.3–1.0 | engine-authored; SBTi-derived ratio |
| 2025 carbon price | 0.8 × NGFS 2030 price | stated assumption in code |
| Tornado scalers | alignment ×15, CPI ×12, FSI ×10, GII ×8, FH ×9, NZ −0.15/+0.12, CA100+ −0.12/+0.10 | engine-authored elasticity proxies |
| Governance heatmap gate | country needs ≥3 of the 4 indices; top 50 | SQL `HAVING` clause |
| Sector alignment gate | sectors with ≥20 SBTi companies | SQL `HAVING` clause |
| FH_FIW normalisation | `(14 − score)/14` | treats FH as a 0–14 combined PR+CL rating scale |

Data sources are all real ingested public datasets: SBTi target dashboard
(`dh_sbti_companies` / `SbtiCompany`), Climate Action 100+ Net Zero Benchmark
(`dh_ca100_assessments`, indicators 1–3 = disclosure/targets/emissions), Transparency
International CPI, Fund for Peace FSI, Freedom House FIW, UNDP GII
(`dh_country_risk_indices`), NGFS scenario carbon prices (`ngfs_scenarios`), CSRD extraction
tables, and `portfolios_pg`.

### 7.3 Calculation walkthrough

**Time series:** for each NGFS scenario with 2030/2050 carbon prices, build a 5-year grid from
2025 to the requested horizon (2030–2100). Prices are piecewise-linear: 2025→2030 from the
0.8× anchor, 2030→2050 between the two DB values, beyond 2050 extrapolated at the 2030–2050
slope. The SBTi "no-target ratio" (1 − share with `targets set`) scales portfolio vulnerability
into the 0.3–1.0 risk multiplier, and EL is the §7.1 product in $M.
**Sensitivity:** each driver's low/high = the observed MIN/MAX of that dataset relative to its
AVG, multiplied by the driver's elasticity scaler, with signs flipped for "higher is safer"
metrics (alignment rate, CPI); `swing = high − low`; drivers sorted by swing. **Governance
heatmap:** latest-year pivot of the 4 indices per country, then the equal-weight composite.
All raw counts go through `_safe_scalar` (returns 0 + rollback on any SQL failure), and the
aggregators degrade to empty lists rather than erroring.

### 7.4 Worked example — expected loss, year 2040

NGFS scenario with `carbon_price_2030 = $100/t`, `carbon_price_2050 = $250/t`; SBTi table shows
60% of companies with targets set → `no_target_ratio = 0.4`:

| Step | Computation | Result |
|---|---|---|
| Interpolation weight | (2040 − 2030)/20 | 0.5 |
| Carbon price 2040 | 100 + 0.5 × (250 − 100) | $175/t |
| Carbon factor | 175 / 1000 | 0.175 |
| Risk multiplier | 0.3 + 0.7 × 0.4 | 0.58 |
| Expected loss | 500 × 0.175 × 0.58 | **$50.75M** |

Governance composite for a country with CPI 70, FSI 40, FH_FIW 2, GII 0.10:
(70 + (80/120)×100 + (12/14)×100 + 90)/4 = (70 + 66.67 + 85.71 + 90)/4 = **78.1**.

### 7.5 Data provenance & limitations

- **No PRNG and no hard-coded demo datasets** — this module exists precisely to replace
  frontend synthetic seeds with DB aggregates. However, several *transformation constants* are
  synthetic: the $500M base exposure, the ÷1000 carbon scaling, the 0.3–1.0 risk multiplier and
  every tornado elasticity (×8…×15) are engine-authored proxies, not estimated coefficients.
  The EL trajectory is therefore an **indexed proxy**, not a modelled portfolio loss.
- SBTi sector counts stand in for portfolio exposure ("proxy for portfolio" per the code) — no
  actual holdings weighting; "emissions by sector" contains alignment counts, not tCO₂e.
- Governance composite uses equal weights and ad-hoc normalisations; the `(14 − FH)/14`
  transform assumes a 0–14 combined PR+CL scale, which must match how ingestion stored FH_FIW
  scores (the sibling `country_risk` route describes FH as 1–7 per-dimension ratings).
- CA100+ alignment uses only indicators 1–3 of the ten-indicator Net Zero Benchmark, treating
  string `'Yes'` as full credit (no partial assessment).
- Time-series EL applies one global multiplier — no sector/geography differentiation, no
  discounting, no damage function.

### 7.6 Framework alignment

- **NGFS Climate Scenarios** — scenario carbon-price pathways (2030/2050 anchors) as the
  transition-risk driver; the linear interpolation approximates NGFS's published price
  trajectories between reported milestones.
- **SBTi (Science Based Targets initiative)** — real dashboard semantics: `targets set` status,
  near-term ambition classes (1.5°C / Well-below 2°C / 2°C), net-zero commitments. SBTi itself
  validates targets against sector decarbonisation pathways; here the classifications are
  consumed as-is.
- **Climate Action 100+ Net Zero Benchmark** — indicator-level Yes/No assessments (disclosure,
  targets, emissions performance) aggregated to sector-cluster alignment percentages.
- **Transparency International CPI / Fund for Peace FSI / Freedom House FIW / UNDP GII** —
  published governance/social indices blended into the equal-weight composite (a platform
  construct; none of the publishers define such a composite).
- The tornado/EL constructs echo **TCFD scenario-analysis** practice (transition-risk drivers ×
  portfolio vulnerability) at a dashboard-illustrative level of rigour.

## 9 · Future Evolution

### 9.1 Evolution A — Real portfolio weighting and calibrated EL/tornado coefficients (analytics ladder: rung 2 → 3)

**What.** This domain exists to replace frontend synthetic seeds with SQL aggregates over live
ingested tables (SBTi, CA100+, country-risk indices, CSRD KPIs, company profiles, portfolios, NGFS)
— all real-db, no PRNG, honest-degradation (`_safe_scalar` returns 0 on SQL failure). But §7.5 is
candid that several *transformation constants* are synthetic: the $500M base exposure, the ÷1000
carbon scaling, the 0.3–1.0 risk multiplier and every tornado elasticity (×8…×15) are engine-authored
proxies, so the expected-loss trajectory is an **indexed proxy, not a modelled portfolio loss**; SBTi
sector counts stand in for portfolio exposure with no holdings weighting; and CA100+ alignment uses
only indicators 1–3 treating string 'Yes' as full credit. Evolution A grounds the dashboard in real
`portfolios_pg` holdings and calibrates the EL/tornado coefficients.

**How.** `_compute_portfolio_exposure` and the EL time-series weight by actual `portfolios_pg`
holdings and their financed-emissions (from the PCAF modules) instead of SBTi sector counts; the EL
product's carbon-scaling and risk-multiplier are replaced by the platform's real transition-risk
engine outputs (the `analysis` domain's Monte-Carlo credit engine), so the dashboard reflects modelled
loss, not an index. Rung 3: the tornado elasticities are calibrated to observed driver sensitivities;
CA100+ alignment uses all 10 indicators with partial-credit scoring.

**Prerequisites.** The engine is harness-passing; the work is fidelity, not repair. Resolve the
documented FH_FIW normalisation ambiguity (`(14−score)/14` assumes a 0–14 combined scale — must match
how ingestion stored it; the sibling `country_risk` route calls it 1–7 per-dimension). **Acceptance:**
the §7.4 EL worked example ($50.75M at 2040) reproduces under legacy constants, then reflects real
holdings-weighted loss; the governance composite (78.1 in the example) reconciles with the
`country_risk` domain's scale; portfolio exposure derives from `portfolios_pg`, not SBTi counts.

### 9.2 Executive copilot over the live platform dashboard (LLM tier 2)

**What.** A copilot for executives/CSOs answering "what's our platform-wide SBTi alignment?", "which
sectors are Paris-aligned?", "what's the expected-loss trajectory under Net Zero 2050?", and "which
macro driver has the biggest swing?" — tool-calling the eight dashboard aggregators and narrating real
figures across KPIs, climate, emissions, governance, time-series and the sensitivity tornado.

**How.** Tool schemas over the 8 GET endpoints (all real-db, harness-passing); the no-fabrication
validator checks every count, rate and EL figure against tool output. Because several constants are
synthetic proxies (§7.5), the copilot must label the EL trajectory and tornado as indexed proxies
until Evolution A grounds them in real loss modelling. This is the natural top-level surface for a
desk orchestrator's executive summary, composing the underlying domains' outputs.

**Prerequisites.** Atlas corpus embedded (roadmap D3); the copilot's grounding carries §7.5's proxy
caveats. **Acceptance:** every figure in an answer traces to a dashboard tool call; the EL and tornado
are presented as indexed proxies (pre-Evolution A) with the synthetic scaling disclosed; the SBTi/
CA100+/governance counts match the `/analytics/kpis` output exactly.