## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is written directly from
`api/v1/routes/analysis.py` and its four service dependencies: `custom_scenario_builder.py`,
`impact_calculator.py`, `portfolio_upload.py`, `report_generator.py`. No guide↔code mismatch to
report.)*

### 7.1 What the domain computes

`/api/v1/analysis` is the platform's **scenario workbench**: it persists scenario comparisons,
runs gap analyses and internal-consistency checks, blends custom scenarios from the Data Hub,
translates hub scenarios into PD/LGD/EL/VaR portfolio impacts, parses uploaded portfolios, and
serves generated report files.

| Endpoint | Backing logic |
|---|---|
| `GET/POST /comparisons`, `GET /comparisons/{id}`, `/data`, `/gap-analysis` | `ScenarioComparisonService` over `hub_scenarios` / `hub_trajectories` tables |
| `GET /scenarios/{id}/consistency-check` | consistency rules on trajectory data (status + 0–1 score + issue list) |
| `GET/POST /alerts` | per-user alert rows (`alert_type`, ref scenario/source, read flag) |
| `GET /reports/download/{filename}` | file handoff for `report_generator.py` output |
| (service) `build_custom_scenario` | trajectory blending with lineage |
| (service) `run_impact_calculation` | Monte-Carlo climate credit-risk engine |

This is a **tier-A database-backed domain**: comparisons, custom scenarios and alerts are real
persisted rows (Pydantic schemas with `from_attributes` mapping the ORM models), and trajectories
come from ingested scenario providers (NGFS/IEA-style hub sources) rather than PRNG seeds.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Category → engine-scenario map | ~22 aliases collapsed to 3 buckets: Orderly (Net Zero, NZE, 1.5C, Low GHG …), Disorderly (Delayed, Divergent, Carbon Pricing, Policy, Sensitivity …), Hot house world (Current Policies, Baseline, STEPS, High GHG, Physical Risk …) | Mirrors the NGFS 3-quadrant framing; alias list hand-curated in `impact_calculator.py` |
| Temperature fallback | ≤ 1.8 °C → Orderly · ≤ 2.5 → Disorderly · else Hot house world | Heuristic when category text fails to match |
| Impact engine defaults | `n_simulations = 10,000`, `correlation = 0.3`, `var_method = 'monte_carlo'`, `base_return = 0.05`, `random_seed = 42` | Hardcoded in `run_impact_calculation`; fixed seed makes results reproducible |
| Default horizons | 2030, 2040, 2050 | Hardcoded |
| Portfolio upload | required columns `{name, sector, exposure}`; sector synonym map (e.g. "utilities" → Power Generation, "reit" → Real Estate); asset-type map (bond/loan/equity) | `portfolio_upload.py` constants |
| Custom-scenario data quality | copied trajectories stamped `data_quality_score = 3`, `interpolation_method = "blended"` | Convention marking blended data as mid-quality |

### 7.3 Calculation walkthrough

1. **Custom scenario blending** (`build_custom_scenario`) — clones every trajectory of a base
   scenario; for each `(variable, region)` in the override list it substitutes the same
   trajectory from the donor scenario (falling back to base with an `override_not_found` marker).
   Full lineage `{base_scenario_id, overrides}` is stored in the new scenario's `parameters`, and
   each copied trajectory records `{"source": "base"|"override", "from_scenario": id}` — an
   auditable per-series provenance trail. The synthetic scenario is filed under an auto-created
   "Custom Scenarios" source.
2. **Impact calculation** (`run_impact_calculation`) — maps the hub scenario to one of the three
   engine scenarios, converts stored portfolio assets via `assets_to_inputs`, then runs
   `ClimateRiskCalculationEngine.calculate_multiple_scenarios` (10k-path Monte Carlo, 0.3
   cross-asset correlation) per horizon, returning expected loss ($ and %), VaR 95/99,
   weighted-average PD and its % change, risk-adjusted return, sector breakdown and rating
   migrations. Alongside, `extract_scenario_multipliers` pulls the *actual* World-region
   trajectories: carbon price at 2030/2050, CO₂-emissions change
   `(v2050 − v2025)/|v2025| × 100`, and 2050 temperature — surfacing what the scenario really
   assumes next to the credit outputs.
3. **Comparisons & gap analysis** — saved comparisons pin a base scenario against N comparison
   scenarios with variable/region/sector/time filters; the gap-analysis response carries
   `gap_value`, `gap_pct = (target − base)`-style deltas per variable/region/year plus a
   `required_action` narrative and `confidence_level`.
4. **Consistency check** — per-scenario rule evaluation returning `check_type`, pass/fail
   `status`, a numeric `score`, and structured `issues` (e.g. trajectory monotonicity or unit
   coherence — logic lives in `ScenarioComparisonService`).
5. **Portfolio upload** — `csv.DictReader` parse with auto-mapped headers, per-row validation
   collecting `{row, error}` tuples, sector/asset-type normalisation via the synonym maps, and a
   summary `{total_rows, valid_rows}`.
6. **Alerts** — CRUD rows keyed to user with scenario/source references and read-state.

### 7.4 Worked example (scenario multiplier extraction)

A hub scenario whose World CO₂-emissions trajectory holds `{2025: 36.0, 2050: 12.0}` GtCO₂ and
carbon-price trajectory `{2030: 130, 2050: 250}` $/t, category "Delayed transition":

| Step | Computation | Result |
|---|---|---|
| Engine mapping | "Delayed" matches alias list | **Disorderly** |
| Emissions change | (12.0 − 36.0)/36.0 × 100 | **−66.67 %** |
| carbon_price_2030 / 2050 | direct lookup | **130 / 250** |
| Impact run | 10,000-path MC at horizons 2030/2040/2050, seed 42 | EL, VaR95/99, PD shift per horizon |

The multipliers are returned for transparency; note the credit engine consumes only the mapped
*category* (one of 3), not the numeric trajectories — see limitations.

### 7.5 Data provenance & limitations

- Scenario trajectories are **real ingested provider data** (Data Hub tables) and user artefacts
  are persisted — this domain contains no PRNG-seeded fabrication.
- The category→engine mapping is **lossy**: all scenario richness (carbon-price path, sectoral
  detail) collapses into 3 discrete stress presets; the extracted multipliers are displayed but
  do not parameterise the PD/LGD shocks. Two different 1.5 °C scenarios produce identical credit
  impacts.
- Alias matching is substring-based (`"policy" in category`), so novel category labels can
  misroute; the temperature fallback only partially mitigates this.
- Fixed `random_seed = 42` guarantees reproducibility but hides Monte-Carlo sampling error;
  `correlation = 0.3` is a single flat asset-correlation assumption.
- Custom scenarios blend *series substitution* only — no re-derivation of dependent variables, so
  a blended scenario can be internally inconsistent (e.g. NZE carbon prices atop STEPS
  emissions); the consistency-check endpoint exists to surface exactly this.

### 7.6 Framework alignment

- **NGFS scenario framework** — the Orderly / Disorderly / Hot house world triad is NGFS's
  original 2×2 (transition vs physical risk) collapsed to its three populated quadrants; the
  alias map routes NGFS Phase-style names (Net Zero 2050, Delayed Transition, Current Policies)
  and IEA names (NZE, STEPS) accordingly.
- **Credit risk (IFRS 9 / Basel vocabulary)** — outputs are the standard EL = PD×LGD×EAD family
  plus VaR quantiles from simulated loss distributions; rating migrations echo transition-matrix
  practice.
- **Model lineage / auditability (SR 11-7 spirit, DAMA lineage)** — custom-scenario parameters
  and per-trajectory source metadata implement genuine data lineage for user-built scenarios.
- **TCFD scenario-analysis guidance** — comparing portfolios across multiple published scenarios
  with documented assumptions is the disclosure pattern TCFD/ISSB S2 request; this domain is the
  platform's engine room for that exercise.
