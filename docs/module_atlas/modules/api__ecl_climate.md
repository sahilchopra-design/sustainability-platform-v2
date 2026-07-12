# Api::Ecl_Climate
**Module ID:** `api::ecl_climate` · **Route:** `/api/v1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ecl/calculate` | `calculate_ecl` | api/v1/routes/ecl_climate.py |
| POST | `/api/v1/ecl/portfolio` | `calculate_portfolio_ecl` | api/v1/routes/ecl_climate.py |
| POST | `/api/v1/ecl/sicr-screening` | `screen_sicr` | api/v1/routes/ecl_climate.py |
| GET | `/api/v1/ecl/assessments` | `list_ecl_assessments` | api/v1/routes/ecl_climate.py |
| GET | `/api/v1/ecl/assessments/{assessment_id}` | `get_ecl_assessment` | api/v1/routes/ecl_climate.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DB` *(shared)*, `climate` *(shared)*, `collections` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `ecl_assessments`, `ecl_exposures`, `ecl_scenario_results`, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ecl/assessments** — status `passed`, provenance ['real-db'], source tables: `ecl_assessments`
Output: `{'type': 'object', 'keys': ['total', 'assessments'], 'n_keys': 2}`

**GET /api/v1/ecl/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `ecl_assessments`
Output: `None`

**POST /api/v1/ecl/calculate** — status `passed`, provenance ['real-db'], source tables: `ecl_assessments`, `ecl_exposures`
Output: `{'type': 'object', 'keys': ['assessment_id', 'exposure_id', 'probability_weighted_ecl_12m_gbp', 'probability_weighted_ecl_lifetime_gbp', 'determined_stage', 'sicr_triggered', 'sicr_triggers', 'climate_uplift_pct', 'scenario_results', 'validation_summary'], 'n_keys': 10}`

**POST /api/v1/ecl/portfolio** — status `passed`, provenance ['real-db'], source tables: `ecl_assessments`, `ecl_exposures`
Output: `{'type': 'object', 'keys': ['assessment_id', 'total_exposures', 'total_ead_gbp', 'total_ecl_baseline_gbp', 'total_ecl_climate_adjusted_gbp', 'total_ecl_uplift_gbp', 'total_ecl_uplift_pct', 'stage_distribution', 'sector_breakdown', 'validation_summary'], 'n_keys': 10}`

**POST /api/v1/ecl/sicr-screening** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_screened', 'sicr_count', 'sicr_pct', 'exposures', 'validation_summary'], 'n_keys': 5}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/ecl/*` implements **climate-adjusted IFRS 9 expected credit loss** directly inside the
route file (`backend/api/v1/routes/ecl_climate.py` — "Inline computation with DB persistence";
there is no separate engine module). For each exposure and each probability-weighted climate
scenario:

```
uplift(s)      = base_uplift × scenario_multiplier(s)
PD_adj(s)      = min(PD × (1 + uplift(s)), 0.9999)         (both 12m and lifetime PD)
ECL_12m(s)     = EAD × PD_12m_adj(s) × LGD
ECL_life(s)    = EAD × PD_life_adj(s) × LGD
PW-ECL         = Σ_s weight(s) × ECL(s)                     (probability-weighted)
uplift %       = (PW-ECL_life − EAD×PD_life×LGD) / baseline × 100
```

The climate PD uplift aggregates four channels (`_climate_pd_uplift`):

```
uplift = max( phys_score×0.02
            + trans_score×0.03 × sector_sensitivity
            + min(carbon_intensity×0.001, 0.05)
            − green_revenue_pct×0.02 , 0 )
```

Physical/transition scores are 0–10 inputs; green revenue share (0–1) is the only *mitigant*
(negative term), and the whole uplift is floored at zero.

### 7.2 Parameterisation

**Scenario set** (defaults; caller may override weights, which must sum to 1.0):

| Scenario | Default weight | PD multiplier |
|---|---|---|
| baseline | 0.40 | ×1.0 |
| adverse | 0.30 | ×1.5 |
| severe | 0.30 | ×2.5 |

**Sector transition sensitivity** (`_SECTOR_TRANSITION_SENSITIVITY`, multiplies only the
transition-score term; synthetic expert-judgement values): coal_mining 1.8, oil_gas 1.5,
power_generation 1.4, cement/steel/aviation 1.3, shipping 1.2, agriculture 1.1, real_estate 1.0,
financial_services 0.8, retail 0.7, technology 0.6, healthcare 0.5; unknown sector → 1.0.

**SICR triggers** (Stage-1 exposures only, evaluated per scenario against origination PD, defaulting
to base 12m PD when origination PD is absent):

| Trigger | Threshold | Result |
|---|---|---|
| Relative PD increase | `(PD_adj − PD_orig)/PD_orig > 100%` | Stage 2, "relative increase exceeds 100%" |
| Absolute PD increase | `PD_adj − PD_orig > 50 bps` | Stage 2, "absolute increase exceeds 50bps" |

Final `determined_stage = max(stage over scenarios)` — one bad scenario is enough to migrate.
Data-quality score: `max(0, 1 − 0.05×warnings − 0.1×missing_fields)`.

### 7.3 Calculation walkthrough

- **`POST /ecl/calculate`** — single exposure: runs `_compute_single_exposure`, returns PW 12m and
  lifetime ECL, determined stage, SICR flags/reasons, climate uplift %, and per-scenario results.
  A warning is added ("ECL will equal baseline") if neither climate score is supplied.
- **`POST /ecl/portfolio`** — loops the same computation, then aggregates: total EAD, baseline vs
  climate-adjusted lifetime ECL, uplift £/%; stage distribution (counts + ECL per stage); sector
  breakdown sorted by ECL descending with average uplift %.
- **`POST /ecl/sicr-screening`** — per-exposure PD increase vs origination and a recommended action
  ladder: SICR triggered → "Move to Stage 2; increase provision; review within 30 days";
  PD increase > 50% → "Monitor closely; add to watchlist"; else "No action required".
- **Persistence** — every POST writes (non-blocking; failure logged, `assessment_id=None`) to
  `ecl_assessments`, `ecl_exposures` (with `ecl_recognised` = lifetime ECL if stage ≥ 2 else 12m —
  the IFRS 9 recognition rule) and `ecl_scenario_results` (scenario names mapped to the DB CHECK
  vocabulary BASE/ADVERSE/SEVERE/OPTIMISTIC). `GET /ecl/assessments` and
  `GET /ecl/assessments/{id}` read these tables back with pagination/status filters.

### 7.4 Worked example

Exposure: EAD £10M, PD₁₂ₘ 2%, PD_life 6%, LGD 45%, sector oil_gas, Stage 1, origination PD 2%.
Climate: physical 4, transition 6, carbon intensity 30 tCO₂e/£M rev, green revenue 10%.

Base uplift = 4×0.02 + 6×0.03×1.5 + min(30×0.001, 0.05) − 0.10×0.02
= 0.08 + 0.27 + 0.03 − 0.002 = **0.378**.

| Scenario (weight) | Uplift | PD₁₂ₘ adj | ECL_life = 10M × PD_life×(1+u) × 0.45 | Stage |
|---|---|---|---|---|
| baseline (0.40) | 0.378 | 2.756% | 10M×8.268%×0.45 = £372,060 | 1 (rel +37.8%, abs 75.6bp… **abs > 50bp → Stage 2**) |
| adverse (0.30) | 0.567 | 3.134% | 10M×9.402%×0.45 = £423,090 | 2 |
| severe (0.30) | 0.945 | 3.890% | 10M×11.67%×0.45 = £525,150 | 2 |

Correction on baseline staging: abs increase = 2.756% − 2% = 0.756% > 0.5% → Stage 2 already in the
baseline scenario. PW ECL_life = 0.4×372,060 + 0.3×423,090 + 0.3×525,150 = **£433,296**.
Baseline (unadjusted) ECL_life = 10M×0.06×0.45 = £270,000 → climate uplift = **+60.5%**.
Determined stage = **2**; recognised ECL = lifetime £433,296.

### 7.5 Data provenance & limitations

- **Pure calculator; no seeded synthetic data** — all PDs, LGDs, EADs and climate scores are
  caller-supplied; results persist to Postgres (`ecl_assessments`/`ecl_exposures`/
  `ecl_scenario_results`). Demo numbers, if any, originate in calling frontends.
- The uplift coefficients (0.02/score physical, 0.03/score transition, 0.001 per tCO₂e/£M capped
  at 5%, −0.02 per green-revenue unit) and sector sensitivities are **synthetic calibrations** with
  no cited source.
- Lifetime ECL is a single-number `EAD × PD_life × LGD` — no marginal-PD term structure, no
  discounting (IFRS 9 requires EIR discounting), no EAD amortisation profile, and `maturity_years`
  is accepted but unused in the math.
- Scenario multipliers apply one flat factor to both 12m and lifetime PD; a production model would
  condition PD term structures on macro paths (NGFS-style).
- The aggregate `ecl_scenario_results` persistence uses only the **first** exposure's scenario ECLs
  with default weights — portfolio scenario totals in the DB understate multi-exposure portfolios
  (response payload is unaffected).
- SICR uses PD levels post-climate vs origination — consistent with IFRS 9's relative approach, but
  the 100%-relative/50bp-absolute thresholds are common industry heuristics, not standard-mandated.

### 7.6 Framework alignment

- **IFRS 9 §5.5:** ECL = PD×LGD×EAD building blocks; 12-month (Stage 1) vs lifetime (Stage 2/3)
  recognition implemented via `ecl_recognised`; probability-weighted multiple scenarios implement
  §5.5.17(a)'s "unbiased and probability-weighted amount" requirement; SICR staging per §5.5.9,
  using both relative and absolute PD movement tests as permitted operational simplifications.
- **BCBS/ECB climate-risk guidance:** the climate-to-PD overlay mirrors the ECB's 2020 Guide
  expectation that climate drivers be integrated in credit risk quantification; multiplier design
  (baseline/adverse/severe) echoes supervisory stress-test scenario tiers rather than named NGFS
  pathways.
- **PCAF-adjacent inputs:** carbon intensity (tCO₂e/revenue) enters as a transition-risk proxy,
  capped so carbon data quality cannot dominate PD.

## 9 · Future Evolution

### 9.1 Evolution A — Marginal-PD term structure, EIR discounting, and NGFS-conditioned scenarios (analytics ladder: rung 2 → 4)

**What.** A climate-adjusted IFRS 9 ECL engine — probability-weighted multi-scenario ECL, a four-
channel climate PD uplift, SICR staging, and DB persistence to `ecl_assessments`/`ecl_exposures`/
`ecl_scenario_results` (largely harness-passing, real-db). Already rung 2 (baseline/adverse/severe
scenarios). §7.5 names the deepening targets: lifetime ECL is a **single-number `EAD × PD_life × LGD`**
— no marginal-PD term structure, **no EIR discounting** (which IFRS 9 requires), no EAD amortisation,
and `maturity_years` is accepted but unused; scenario multipliers apply **one flat factor to both 12m
and lifetime PD** rather than conditioning PD term structures on macro paths; the uplift coefficients
and sector sensitivities are synthetic calibrations; and the aggregate `ecl_scenario_results`
persistence uses only the **first exposure's** scenario ECLs (understating multi-exposure portfolios
in the DB, though the response payload is correct). Evolution A adds a discounted marginal-PD term
structure and NGFS-conditioned scenario PD paths.

**How.** `_compute_single_exposure` sums discounted marginal PD×LGD×EAD per period over the maturity
(finally using `maturity_years`) with EIR discounting; scenario PD adjustments come from NGFS-pathway-
conditioned term structures (via the `carbon_prices`/`analysis` domains) instead of a flat multiplier;
the portfolio persistence bug (first-exposure-only scenario totals) is fixed. Rung 4 (predictive): the
uplift coefficients are calibrated against observed climate-related credit deterioration, and PD paths
forecast per NGFS vintage.

**Prerequisites (hard).** Fix the harness failure — §4.2 shows `GET /assessments/{id}` **failed**
(db-empty); fix the documented portfolio-scenario persistence understatement. Preserve the honest
warning when no climate score is supplied ("ECL will equal baseline"). **Acceptance:** the §7.4 worked
example (£433,296 PW lifetime ECL, +60.5% climate uplift, Stage 2) reproduces under the legacy flat
model, then the discounted marginal-PD version differs for a long-maturity exposure; the DB scenario
totals reconcile with the response for a multi-exposure portfolio; the detail endpoint passes the
harness.

### 9.2 Evolution B — Climate-ECL analyst with tool-called provisioning (LLM tier 2)

**What.** A tool-calling analyst for credit-risk/provisioning teams: "compute climate-adjusted ECL for
this oil & gas exposure" (`/calculate` → PW 12m/lifetime ECL, climate uplift %, per-scenario
breakdown, SICR flags), "run our portfolio" (`/portfolio` → baseline vs climate-adjusted ECL, stage
distribution, sector breakdown), and "screen for SICR migrations" (`/sicr-screening` → recommended
action ladder) — narrating the engine's real IFRS 9 outputs and the four-channel uplift decomposition.

**How.** Tool schemas over the 5 endpoints; the no-fabrication validator checks every ECL £, PD, uplift
% and stage against tool output. The copilot explains *why* an exposure migrated to Stage 2 (the §7.4
insight: the absolute 50bp PD-increase test can trigger even in the baseline scenario) and surfaces
that the uplift coefficients are synthetic calibrations. Because ECL consumes EAD from the sibling
`ead` engine, this is a core node in a Financial-desk credit-risk orchestrator (`ead` → `ecl_climate`
→ `banking_risk` capital).

**Prerequisites.** Evolution A's harness fix and the persistence-bug fix; Atlas corpus embedded
(roadmap D3); RBAC so assessments persist under the user's session. **Acceptance:** every figure cited
traces to an engine tool call; the PW ECL and determined stage match `/calculate`; a SICR-screening
answer names the specific trigger (relative >100% or absolute >50bp) that fired; the copilot flags the
uplift coefficients as illustrative pending Evolution A calibration.