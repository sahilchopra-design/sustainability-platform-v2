# Api::Analysis
**Module ID:** `api::analysis` · **Route:** `/api/v1/analysis` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/analysis/comparisons` | `list_comparisons` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/comparisons` | `create_comparison` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/comparisons/{comp_id}` | `get_comparison` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/comparisons/{comp_id}/data` | `get_comparison_data` | api/v1/routes/analysis.py |
| DELETE | `/api/v1/analysis/comparisons/{comp_id}` | `delete_comparison` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/compare` | `adhoc_compare` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/comparisons/{comp_id}/gap-analysis` | `run_gap_analysis` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/comparisons/{comp_id}/gap-analysis` | `get_gap_analysis` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/scenarios/{scenario_id}/consistency-check` | `run_consistency_check` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/scenarios/{scenario_id}/consistency-check` | `get_consistency_checks` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/alerts` | `list_alerts` | api/v1/routes/analysis.py |
| PATCH | `/api/v1/analysis/alerts/{alert_id}/read` | `mark_alert_read` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/alerts` | `create_alert` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/impact` | `calculate_impact` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/custom-scenarios` | `create_custom_scenario` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/portfolio-upload/parse` | `parse_portfolio_file` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/portfolio-upload/create` | `create_portfolio_from_upload` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/reports/generate` | `generate_report` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/reports/download/{filename}` | `download_report` | api/v1/routes/analysis.py |

### 2.3 Engine `custom_scenario_builder` (services/custom_scenario_builder.py)
| Function | Args | Purpose |
|---|---|---|
| `build_custom_scenario` | db, name, description, base_scenario_id, overrides, created_by | Create a custom scenario by blending trajectories. Args: name: Name for the custom scenario description: Description base_scenario_id: The base scenario to start from overrides: List of {"variable": str, "region": str, "source_scenario_id": str} — take that variable+region trajectory from source_scenario_id instead of base created_by: User ID Returns: The created custom scenario dict |

### 2.3 Engine `impact_calculator` (services/impact_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `map_scenario_to_engine` | scenario | Map a hub scenario to one of the 3 engine scenario types. |
| `extract_scenario_multipliers` | db, scenario_id | Extract key multipliers from scenario trajectories for impact calculation. |
| `run_impact_calculation` | db, scenario_id, portfolio_assets, horizons | Run impact calculation for a hub scenario against a portfolio. Uses the existing calculation engine with mapped scenario type. |

**Engine `impact_calculator` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `CATEGORY_TO_ENGINE_SCENARIO` | `{'Orderly': 'Orderly', 'Net Zero': 'Orderly', 'NZE': 'Orderly', 'Low Emissions': 'Orderly', 'Low GHG': 'Orderly', 'Very Low GHG': 'Orderly', 'Energy Transition': 'Orderly', '1.5C': 'Orderly', 'Disorderly': 'Disorderly', 'Delayed': 'Disorderly', 'Divergent': 'Disorderly', 'Intermediate GHG': 'Disorde` |

### 2.3 Engine `portfolio_upload` (services/portfolio_upload.py)
| Function | Args | Purpose |
|---|---|---|
| `parse_portfolio_csv` | content, column_mapping | Parse CSV content into portfolio assets. Args: content: CSV file content as string column_mapping: Optional mapping of CSV columns to standard fields Returns: {"assets": [...], "errors": [...], "warnings": [...]} |
| `_auto_map_columns` | columns | Auto-detect column mapping from CSV headers. |
| `_parse_row` | row, mapping, row_num | Parse a single CSV row into an asset dict. |

**Engine `portfolio_upload` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SECTOR_MAP` | `{'power': 'Power Generation', 'power generation': 'Power Generation', 'energy': 'Power Generation', 'utilities': 'Power Generation', 'oil': 'Oil & Gas', 'oil & gas': 'Oil & Gas', 'oil and gas': 'Oil & Gas', 'gas': 'Oil & Gas', 'petroleum': 'Oil & Gas', 'metals': 'Metals & Mining', 'metals & mining':` |
| `ASSET_TYPE_MAP` | `{'bond': 'Bond', 'bonds': 'Bond', 'loan': 'Loan', 'loans': 'Loan', 'equity': 'Equity', 'stock': 'Equity', 'shares': 'Equity'}` |

### 2.3 Engine `report_generator` (services/report_generator.py)
| Function | Args | Purpose |
|---|---|---|
| `_build_narrative_data` | impact_data, portfolio_data, scenario_data | Build the template data dict from raw report inputs. |
| `generate_pdf_report` | impact_data, portfolio_data, scenario_data | Generate a professional PDF report. Returns the filename. |
| `generate_excel_report` | impact_data, portfolio_data, scenario_data | Generate an Excel report. Returns the filename. |
| `generate_csv_report` | impact_data, portfolio_data | Generate a CSV report of impact results. |

### 2.3 Engine `scenario_comparison_service` (services/scenario_comparison_service.py)
| Function | Args | Purpose |
|---|---|---|
| `ScenarioComparisonService.create_comparison` | data |  |
| `ScenarioComparisonService.get_comparison` | comp_id |  |
| `ScenarioComparisonService.list_comparisons` |  |  |
| `ScenarioComparisonService.delete_comparison` | comp_id |  |
| `ScenarioComparisonService.build_comparison_data` | comp_id | Build the full comparison dataset for a saved comparison. |
| `ScenarioComparisonService.build_adhoc_comparison` | scenario_ids, variables, regions, time_range | Build comparison data on-the-fly without saving. |
| `ScenarioComparisonService._build_data` | scenario_ids, variables, regions, time_range | Core: fetch trajectories for given scenarios, align and compute stats. |
| `ScenarioComparisonService._compute_stats` | series_list, years | Compute statistics across scenarios for each year. |
| `ScenarioComparisonService.run_gap_analysis` | comparison_id | Run gap analysis for a comparison. Compares base scenario to each compared scenario. |
| `ScenarioComparisonService._suggest_action` | gap_type, variable, gap_pct |  |
| `ScenarioComparisonService.get_gap_analyses` | comparison_id |  |
| `ScenarioComparisonService.run_consistency_check` | scenario_id | Run consistency checks on a scenario's trajectories. |
| `ScenarioComparisonService._check_carbon_budget` | scenario_id, traj_map, scenario |  |
| `ScenarioComparisonService._check_energy_balance` | scenario_id, traj_map |  |
| `ScenarioComparisonService._check_tech_deployment` | scenario_id, traj_map |  |
| `ScenarioComparisonService._check_economic_feasibility` | scenario_id, traj_map, scenario |  |
| `ScenarioComparisonService._save_check` | scenario_id, check_type, status, score, issues, details |  |
| `ScenarioComparisonService.get_consistency_checks` | scenario_id |  |
| `ScenarioComparisonService.list_alerts` | user_id, unread_only |  |
| `ScenarioComparisonService.mark_alert_read` | alert_id |  |
| `ScenarioComparisonService.create_alert` | data |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `models`, `parsed`, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/analysis/alerts** — status `passed`, provenance ['real-db'], source tables: `hub_alerts`
Output: `{'type': 'array', 'len': 2, 'item0_keys': None}`

**GET /api/v1/analysis/comparisons** — status `passed`, provenance ['real-db'], source tables: `hub_comparisons`
Output: `{'type': 'array', 'len': 3, 'item0_keys': None}`

**GET /api/v1/analysis/comparisons/{comp_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_comparisons`
Output: `None`

**GET /api/v1/analysis/comparisons/{comp_id}/data** — status `failed`, provenance ['db-empty'], source tables: `hub_comparisons`
Output: `None`

**GET /api/v1/analysis/comparisons/{comp_id}/gap-analysis** — status `passed`, provenance ['db-empty'], source tables: `hub_gap_analyses`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/analysis/reports/download/{filename}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/analysis/scenarios/{scenario_id}/consistency-check** — status `passed`, provenance ['db-empty'], source tables: `hub_consistency_checks`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**POST /api/v1/analysis/alerts** — status `passed`, provenance ['real-db'], source tables: `hub_alerts`
Output: `{'type': 'ScenarioAlert', 'repr': '<db.models.data_hub.ScenarioAlert object at 0x0000013D475565D0>'}`

## 5 · Intermediate Transformation Logic

**Engine `report_generator` — extracted transformation lines:**
```python
best = sorted_h[-1] if sorted_h else {}
leftMargin=25*mm, rightMargin=25*mm,
topMargin=20*mm, bottomMargin=20*mm)
last = horizons[-1]
col_w = [140] + [100] * len(horizons)
```

**Engine `scenario_comparison_service` — extracted transformation lines:**
```python
comp = DataHubComparison(**data)
all_ids = [comp.base_scenario_id] + (comp.compare_scenario_ids or [])
last_year = years[-1] if years else None
gap_val = cv - bv
gap_pct = (gap_val / abs(bv) * 100) if bv != 0 else 0
score = max(0.1, 1.0 - len(issues) * 0.2)
growth = (last / first - 1) * 100
span = int(years[-1]) - int(years[0])
annual = growth / span if span > 0 else 0
score = max(0.2, 1.0 - len(issues) * 0.25)
jump = (curr - prev) / prev * 100
score = max(0.3, 1.0 - len(issues) * 0.2)
alert = ScenarioAlert(**data)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Trajectory-parameterised impact instead of lossy category mapping (analytics ladder: rung 2 → 4)

**What.** This is the platform's scenario workbench — a genuine tier-A domain persisting
comparisons, gap analyses, consistency checks and custom scenarios over real ingested NGFS/IEA
trajectories, running a 10k-path Monte-Carlo climate credit engine. It is already rung 2. But §7.5
documents its central weakness: the category→engine mapping is **lossy** — all scenario richness
(carbon-price path, sectoral detail) collapses into 3 discrete stress presets, so two different
1.5°C scenarios produce *identical* credit impacts, and the extracted multipliers are displayed but
never parameterise the PD/LGD shocks. Evolution A feeds the actual trajectory values (carbon price
by year, emissions path, temperature) into the credit engine's shock calibration, so scenario
specificity flows through to expected loss and VaR.

**How.** Extend `run_impact_calculation` to accept the extracted multipliers as shock parameters,
not just the 3-bucket category; the substring alias matcher (`"policy" in category`) is replaced by
a structured scenario-metadata join so novel labels don't misroute. Rung 4 (predictive): remove the
fixed `random_seed=42` in favour of reported Monte-Carlo confidence intervals, and let the
consistency-check engine forecast whether a blended custom scenario's dependent variables stay
coherent.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `GET /comparisons/{id}`,
`/data`, and `/reports/download/{filename}` **failed** (db-empty); seed a demo comparison so the
detail paths return data (roadmap D0). The flat `correlation=0.3` should become an asset-class
correlation input. **Acceptance:** two distinct 1.5°C scenarios now produce different EL/VaR (they
are identical today); a blended NZE-price-over-STEPS-emissions scenario is flagged by the
consistency check; the detail endpoints pass the harness.

### 9.2 Evolution B — Scenario-analysis analyst driving the workbench (LLM tier 2)

**What.** A tool-calling analyst executing the TCFD/ISSB S2 scenario-analysis workflow in natural
language: "compare NGFS Net Zero, Delayed Transition and Current Policies for my portfolio"
tool-calls `/compare` and `/impact`, "where's my biggest gap under disorderly?" calls
`/gap-analysis`, "is this custom scenario internally consistent?" calls `/consistency-check`, and
"generate the report" calls `/reports/generate` — narrating real engine outputs and the extracted
scenario multipliers (carbon price, emissions change, 2050 temperature) alongside the credit
results.

**How.** Tool schemas from the domain's ~19 endpoints; the custom-scenario blending
(`build_custom_scenario`) with its per-trajectory source lineage is ideal for LLM-assisted "build me
a scenario that's NZE power but delayed transport" workflows — the LLM composes the override list,
the engine executes and stamps provenance. The no-fabrication validator checks every EL, VaR and
gap figure against tool output; the "show work" expander surfaces which scenario trajectories and
Monte-Carlo settings produced each number.

**Prerequisites.** Evolution A (so narrated impacts actually reflect scenario specificity);
harness-passing endpoints; Atlas corpus embedded (roadmap D3). **Acceptance:** every numeric in an
answer traces to a workbench tool call; a copilot-built custom scenario carries the same auditable
`{base, overrides}` lineage the engine already stamps; the report generated matches the impact-run
figures exactly.