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
