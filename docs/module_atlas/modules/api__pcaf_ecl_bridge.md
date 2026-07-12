# Api::Pcaf_Ecl_Bridge
**Module ID:** `api::pcaf_ecl_bridge` · **Route:** `/api/v1/pcaf-ecl` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf-ecl/bridge` | `bridge_single_investee` | api/v1/routes/pcaf_ecl_bridge.py |
| POST | `/api/v1/pcaf-ecl/bridge-portfolio` | `bridge_portfolio_endpoint` | api/v1/routes/pcaf_ecl_bridge.py |
| POST | `/api/v1/pcaf-ecl/bridge-from-db` | `bridge_from_db` | api/v1/routes/pcaf_ecl_bridge.py |
| GET | `/api/v1/pcaf-ecl/scenario-weights` | `get_scenario_weights` | api/v1/routes/pcaf_ecl_bridge.py |
| GET | `/api/v1/pcaf-ecl/transition-risk` | `get_transition_risk` | api/v1/routes/pcaf_ecl_bridge.py |
| GET | `/api/v1/pcaf-ecl/dqs-confidence` | `get_dqs_confidence` | api/v1/routes/pcaf_ecl_bridge.py |

### 2.3 Engine `pcaf_ecl_bridge` (services/pcaf_ecl_bridge.py)
| Function | Args | Purpose |
|---|---|---|
| `_temperature_bucket` | temp_c | Classify temperature into scenario weight bucket. |
| `_waci_to_transition_risk` | waci | Map WACI intensity to sector transition risk level. |
| `_waci_to_transition_score` | waci | Convert WACI intensity to a 0-100 transition risk score. Logarithmic scale: 0 WACI -> 0, 50 -> 25, 200 -> 50, 1000 -> 80, 3000 -> 100. |
| `_carbon_price_sensitivity` | waci, sector_gics | Estimate carbon price sensitivity (0-1) from emissions intensity. High-carbon sectors have higher sensitivity to carbon pricing. |
| `map_investee_to_ecl_climate` | profile, physical_risk_override, collateral_flood_risk, energy_rating | Map a single PCAF investee profile to ECL ClimateRiskInputs. Parameters ---------- profile : PCAFInvesteeProfile PCAF emission and alignment data for one investee. physical_risk_override : float, optional If provided, use this 0-100 score instead of default. collateral_flood_risk : str Collateral-level flood risk (from property assessment). energy_rating : str EPC energy rating (from building asse |
| `bridge_portfolio` | investee_profiles, portfolio_temperature_c, physical_risk_overrides | Map an entire portfolio of PCAF investees to ECL climate inputs. Parameters ---------- investee_profiles : list[PCAFInvesteeProfile] All investees with PCAF data. portfolio_temperature_c : float Portfolio-level temperature score from PCAF engine. physical_risk_overrides : dict, optional Map of investee_name -> physical_risk_score (0-100). Returns ------- PortfolioBridgeResult Aggregated result wit |
| `db_row_to_profile` | row | Convert a pcaf_investees DB row (dict) to PCAFInvesteeProfile. Handles missing/null fields gracefully. |
| `demo_bridge` |  | Demonstrate the bridge with sample data. |

**Engine `pcaf_ecl_bridge` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `DQS_CONFIDENCE_WEIGHTS` | `{1: 1.0, 2: 0.9, 3: 0.7, 4: 0.5, 5: 0.3}` |
| `TEMPERATURE_SCENARIO_WEIGHTS` | `{'below_1.5': (0.35, 0.4, 0.2, 0.05), '1.5_to_2.0': (0.25, 0.45, 0.22, 0.08), '2.0_to_2.5': (0.2, 0.45, 0.25, 0.1), '2.5_to_3.0': (0.15, 0.4, 0.3, 0.15), '3.0_to_3.5': (0.1, 0.35, 0.35, 0.2), 'above_3.5': (0.05, 0.25, 0.4, 0.3)}` |
| `WACI_TRANSITION_RISK_MAP` | `[(50, 'low'), (150, 'medium'), (500, 'high'), (1000, 'very_high'), (float('inf'), 'very_high')]` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `DB` *(shared)*, `ECL`, `PCAF` *(shared)*, `WACI` *(shared)*, `dataclasses` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pcaf_investees` *(shared)*, `pcaf_portfolios` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pcaf-ecl/dqs-confidence** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['description', 'methodology', 'weights'], 'n_keys': 3}`

**GET /api/v1/pcaf-ecl/scenario-weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['temperature_c', 'temperature_bucket', 'scenario_weights', 'all_buckets'], 'n_keys': 4}`

**GET /api/v1/pcaf-ecl/transition-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['waci_tco2e_per_meur', 'sector_gics', 'transition_risk_level', 'transition_risk_score', 'carbon_price_sensitivity', 'risk_thresholds'], 'n_keys': 6}`

**POST /api/v1/pcaf-ecl/bridge** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/pcaf-ecl/bridge-from-db** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/pcaf-ecl/bridge-portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `pcaf_ecl_bridge` — extracted transformation lines:**
```python
score = min(100.0, 15.0 * math.log10(waci + 1) + 5.0)
result.avg_confidence = round(total_confidence / total_weight, 3)
result.avg_transition_risk_score = round(total_transition_score / total_weight, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `pcaf_ecl_bridge` domain (`/api/v1/pcaf-ecl`) wires **PCAF financed-emissions analytics
into the IFRS 9 ECL climate overlay**. Engine: `pcaf_ecl_bridge.py`. It translates each
investee's PCAF profile (WACI, DQS, implied temperature, SBTi status) into the climate-risk
inputs the ECL engine consumes, so financed-emissions data automatically informs credit risk.

### 7.1 What the module computes

For each investee it maps a `PCAFInvesteeProfile` → `ECLClimateInputs`:

```
transition_risk_score = min(100, 15·log10(WACI+1) + 5)          # 0-100
transition_risk_level = threshold(WACI)                          # low…very_high
carbon_price_sensitivity = base(WACI) + sector_boost             # 0-1
pcaf_confidence = DQS_CONFIDENCE_WEIGHTS[round(DQS)]             # data trust
scenario_weights = TEMPERATURE_SCENARIO_WEIGHTS[bucket(temp_c)]  # 4-way NGFS split
```

At portfolio level (`bridge_portfolio`) it produces **exposure-weighted** average confidence
and transition score, plus a portfolio-temperature-driven scenario weight vector.

### 7.2 Parameterisation / scoring rubric

**DQS → confidence** (`DQS_CONFIDENCE_WEIGHTS`): 1→1.00, 2→0.90, 3→0.70, 4→0.50, 5→0.30.
Better data quality earns more weight on the climate overlay.

**Temperature → scenario weights** (`TEMPERATURE_SCENARIO_WEIGHTS`, ordered optimistic / base
/ adverse / severe):

| Temp bucket | OPT | BASE | ADV | SEV |
|---|---|---|---|---|
| <1.5 °C | 0.35 | 0.40 | 0.20 | 0.05 |
| 1.5-2.0 | 0.25 | 0.45 | 0.22 | 0.08 |
| 2.0-2.5 | 0.20 | 0.45 | 0.25 | 0.10 |
| 2.5-3.0 | 0.15 | 0.40 | 0.30 | 0.15 |
| 3.0-3.5 | 0.10 | 0.35 | 0.35 | 0.20 |
| >3.5 | 0.05 | 0.25 | 0.40 | 0.30 |

Hotter portfolios shift probability mass onto adverse/severe scenarios (2.0-2.5 is the "NGFS
default").

**WACI → transition risk level** (`WACI_TRANSITION_RISK_MAP`): <50 low, 50-150 medium,
150-500 high, ≥500 very_high (tCO₂e/€M revenue). **Carbon-price sensitivity** base:
≤50→0.2, ≤200→0.4, ≤500→0.6, ≤1000→0.8, else 0.95; plus a high-carbon GICS boost (Energy
"10" +0.15, Materials "15" +0.10, Utilities "55" +0.08, Industrials "20" +0.05), capped at 1.0.

**Provenance:** referenced against PCAF v2.0, IFRS 9 B5.5.7 (SICR) and EBA GL/2022/16; the
numeric weights are platform calibration constants.

### 7.3 Calculation walkthrough

`map_investee_to_ecl_climate` reads `revenue_intensity_tco2e_per_meur` (WACI) →
log-transition score, threshold level, carbon sensitivity; sets `physical_risk_score` from an
override or the 30.0 default; flags `net_zero_committed` if `net_zero_target_year ≤ 2050`;
picks `pcaf_confidence` from the DQS; and selects `scenario_weights` from the investee's
temperature bucket. `bridge_portfolio` accumulates `Σ w·confidence` and `Σ w·transition_score`
with `w = max(outstanding_eur, 1.0)`, then divides by total weight; portfolio scenario weights
come from the **portfolio** temperature bucket.

### 7.4 Worked example

Investee "ArcelorMittal": WACI = 1,200 tCO₂e/€M, GICS `15104050`, DQS 3, implied temp 3.8 °C,
no SBTi, no net-zero year.

- **Transition score:** `15·log10(1201)+5 = 15·3.080+5 = 51.2` → capped stays **51.2/100**.
- **Transition level:** 1,200 ≥ 500 → **very_high**.
- **Carbon sensitivity:** base (WACI>1000) 0.95 + Materials boost 0.10 → `min(1.0, 1.05) =
  1.0`.
- **Confidence:** DQS 3 → **0.70**.
- **Scenario weights:** temp 3.8 → ">3.5" bucket → **(0.05, 0.25, 0.40, 0.30)** — 70% of mass
  on adverse+severe, driving a materially higher climate-conditioned ECL.

### 7.5 Data provenance & limitations

- **No `sr()` fabrication.** Every output is a deterministic transform of the investee's PCAF
  fields; the demo profiles in `demo_bridge()` (TotalEnergies, Ørsted, ArcelorMittal) are
  illustrative but the mapping logic is pure.
- Physical risk defaults to 30/100 unless the caller supplies an override — the bridge does
  not itself model asset-level physical hazard.
- The log-transition curve and temperature→weight table are calibration choices, not derived
  from a specific NGFS run; they encode the *direction* of NGFS logic (hotter = worse for
  credit) rather than published transition matrices.
- The bridge produces ECL **inputs**, not ECL itself — PD/LGD/ECL are computed downstream by
  the ECL climate engine (see `climate-credit-integration`).

**Framework alignment:** **PCAF v2.0** supplies WACI/DQS/implied-temperature. **IFRS 9
B5.5.7** — the confidence and scenario weights feed the SICR-driven ECL overlay that IFRS 9
requires for forward-looking, scenario-weighted expected loss. **NGFS** — the four-scenario
optimistic/base/adverse/severe split with temperature-conditioned weights mirrors NGFS's
orderly/disorderly/hot-house framing. **EBA GL/2022/16** — climate stress-testing guidance
motivates conditioning credit parameters on portfolio temperature.

## 9 · Future Evolution

### 9.1 Evolution A — Calibrate the WACI→transition-risk mapping and close the ECL loop (analytics ladder: rung 2 → 3)

**What.** This engine wires PCAF financed-emissions analytics into the IFRS 9 ECL climate
overlay: it maps a `PCAFInvesteeProfile` (WACI, DQS, implied temp, SBTi) to `ECLClimateInputs`
via `transition_risk_score = min(100, 15·log10(WACI+1) + 5)`, DQS→confidence weights
(1→1.00 … 5→0.30), and a temperature-bucket→NGFS scenario-weight vector, aggregating to
exposure-weighted portfolio confidence and transition score. The log10 transition-risk curve
and the confidence weights are platform calibrations without empirical anchoring, and §4.2
shows the `/bridge` POST endpoints trace `skipped`. Evolution A calibrates and closes the loop.

**How.** (1) Calibrate the `15·log10(WACI+1)+5` mapping and carbon-price sensitivity against
observed credit-migration or spread data by sector, rather than an unanchored transform —
this is the load-bearing link between emissions and credit loss. (2) Verify the bridge
actually feeds the downstream ECL engine end-to-end (the `bridge-from-db` path reading
`pcaf_investees`/`pcaf_portfolios`) and confirm the POST endpoints work. (3) Align the
temperature→scenario-weight vector with the platform's canonical NGFS source (the
`ngfs_scenarios_extract` / `dh_ngfs_scenario_data` reconciliation). (4) Bench-pin the
transition-score and portfolio aggregation.

**Prerequisites.** A credit-outcome dataset for calibrating the WACI→risk curve (thin — may
stay literature-anchored with honest labelling); working `/bridge` endpoints; NGFS source of
truth. **Acceptance:** the transition-risk mapping carries calibration provenance; a bridged
investee's climate inputs measurably move the ECL engine's output; bench pins reproduce the
score and portfolio averages.

### 9.2 Evolution B — Financed-emissions-to-credit-risk copilot (LLM tier 2)

**What.** A copilot that explains the bridge: "this investee's WACI of 420 tCO₂e/€M maps to a
transition-risk score of 44 (medium); its DQS-5 data means only 30% confidence; under your
portfolio's 2.4°C implied temperature the ECL overlay weights the disorderly scenario at X%" —
each figure from a tool call, connecting emissions to credit provisioning.

**How.** Three POST bridge endpoints plus three reference GETs (scenario-weights,
transition-risk, dqs-confidence) that ground every mapping. The copilot's value is
*explaining the linkage* auditors question — why a high-emissions investee raises ECL — using
the documented log10 curve and confidence weights. What-ifs ("what if this investee gets
verified emissions data?") re-run statelessly. Bridges the `pcaf_asset_classes` and
credit-risk copilots.

**Prerequisites.** Evolution A's endpoint fix and calibration — narrating an unanchored
mapping as a credit-risk driver needs the honest caveat that it's platform-calibrated.
**Acceptance:** every score, confidence weight, and scenario weight traces to a tool response;
the copilot labels the WACI→risk mapping as calibrated-heuristic until Evolution A anchors it;
it refuses to state an ECL figure the bridge itself doesn't produce (it produces inputs, not
the provision).