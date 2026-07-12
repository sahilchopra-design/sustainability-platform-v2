# Api::Infrastructure_Finance
**Module ID:** `api::infrastructure_finance` · **Route:** `/api/v1/infrastructure-finance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/infrastructure-finance/equator-principles` | `equator_principles` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/ifc-ps` | `ifc_ps` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/oecd` | `oecd` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/paris-alignment` | `paris_alignment` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/dscr-stress` | `dscr_stress` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/blended-finance` | `blended_finance` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/climate-label` | `climate_label` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/full-assessment` | `full_assessment` | api/v1/routes/infrastructure_finance.py |
| GET | `/api/v1/infrastructure-finance/ref/ep-principles` | `ref_ep_principles` | api/v1/routes/infrastructure_finance.py |
| GET | `/api/v1/infrastructure-finance/ref/ifc-ps` | `ref_ifc_ps` | api/v1/routes/infrastructure_finance.py |
| GET | `/api/v1/infrastructure-finance/ref/paris-alignment` | `ref_paris_alignment` | api/v1/routes/infrastructure_finance.py |
| GET | `/api/v1/infrastructure-finance/ref/blended-structures` | `ref_blended_structures` | api/v1/routes/infrastructure_finance.py |

### 2.3 Engine `infrastructure_finance_engine` (services/infrastructure_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `InfrastructureFinanceEngine.assess_equator_principles` | entity_id, project_type, sector, country, total_cost_usd, e_s_data |  |
| `InfrastructureFinanceEngine.assess_ifc_ps` | entity_id, sector, country, workforce_size, biodiversity_sensitive, land_acquisition, indigenous_peoples_present, cultural_heritage |  |
| `InfrastructureFinanceEngine.assess_oecd` | entity_id, sector, country, project_type |  |
| `InfrastructureFinanceEngine.assess_paris_alignment` | entity_id, sector, country, annual_ghg_tco2, project_lifetime_yrs, climate_vulnerability_score, criteria_scores |  |
| `InfrastructureFinanceEngine.calculate_dscr_climate_stress` | entity_id, sector, baseline_dscr, debt_service_usd_pa, physical_risk_level, transition_risk_level |  |
| `InfrastructureFinanceEngine.structure_blended_finance` | entity_id, total_cost_usd, sector, country, target_private_irr_pct, mdb_participation, mdb_share_pct, crowding_in_ratio_override |  |
| `InfrastructureFinanceEngine.assess_climate_label` | entity_id, sector, annual_ghg_reduction, project_type |  |
| `InfrastructureFinanceEngine.generate_full_assessment` | entity_id, project_data |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/infrastructure-finance/ref/blended-structures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/infrastructure-finance/ref/ep-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/infrastructure-finance/ref/ifc-ps** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/infrastructure-finance/ref/paris-alignment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/infrastructure-finance/blended-finance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/infrastructure-finance/climate-label** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/infrastructure-finance/dscr-stress** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/infrastructure-finance/equator-principles** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `infrastructure_finance_engine` — extracted transformation lines:**
```python
overall_score = round(total_score / supplied_weight, 2)
composite = round(composite / supplied_weight, 2) if supplied_weight > 0.0 else None
dim_scores[dim] = round(dim_total / supplied, 2) if supplied > 0 else None
ghg_reduction_pa = round(annual_ghg_tco2 * (mit / 100.0) * 0.3, 2)
dscr_physical = baseline_dscr * (1.0 - phys_haircut)
dscr_transition = baseline_dscr * (1.0 - transition_capex_impact - revenue_reduction)
dscr_combined = baseline_dscr * (1.0 - phys_haircut - transition_capex_impact * 0.5 - revenue_reduction * 0.5)
mdb_pct = min(1.0, max(0.0, float(mdb_share_pct) / 100.0))
private_pct = 1.0 - mdb_pct
mdb_amount = total_cost_usd * mdb_pct
private_finance_mobilised = round(mdb_amount * crowding_in, 0)
mdb_share_out = round(mdb_pct * 100.0, 1)
blended_irr = round(target_private_irr_pct + float(concessional_irr_uplift_pct), 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine docstring and code are the sole methodology sources; there is nothing to reconcile against.)*

### 7.1 What the module computes

`backend/services/infrastructure_finance_engine.py` (class `InfrastructureFinanceEngine`, "pure computation — no DB calls") implements eight sub-modules for project-finance E&S and climate assessment, exposed via `api/v1/routes/infrastructure_finance.py` (`POST /equator-principles`, `/dscr-stress`, `/blended-finance`, `/climate-label`, plus `GET /ref/*` for the reference tables):

1. **Equator Principles IV** — A/B/C categorisation + weighted 10-principle compliance score.
2. **IFC Performance Standards** — PS1–PS8 weighted composite.
3. **OECD Common Approaches 2022** — tier screening (Tier1/2/3 mapped from EP category).
4. **Paris Alignment (IDFC/DFI)** — mitigation/adaptation/governance weighted score.
5. **DSCR climate stress** — physical + transition haircuts on baseline DSCR vs a 1.20× covenant.
6. **Blended finance structuring** — structure selection + crowding-in mobilisation.
7. **Climate label eligibility** — CBI Standard v4 / ICMA GBP / taxonomy mapping.
8. **Full assessment** — consolidated report with a renormalised weighted compliance score.

A deliberate design principle runs through the scoring sub-modules: **entity-specific scores are never fabricated.** Per the inline comments ("cannot be fabricated when no per-principle input is provided"), any principle/PS/sub-criterion score not supplied by the caller is returned as `None` (`insufficient_data`), and composites are weight-normalised over supplied inputs only.

### 7.2 Parameterisation

**EP-IV categorisation** (`EP_SECTOR_RISKS`): extractives, oil_gas, mining, large_hydro, coal_power, nuclear, chemical → **Cat A**; infrastructure, transport, manufacturing, agriculture, water, waste, real_estate, renewables, telecom → **Cat B**; education, healthcare, finance, software → **Cat C**; unknown sector defaults to B. Caller may override via `e_s_data.category`. All 10 EP principles carry equal weight 0.1.

**IFC PS weights** (`IFC_PS_DESCRIPTIONS`, sum = 1.00): PS1 0.20 · PS2 0.15 · PS3 0.12 · PS4 0.12 · PS5 0.10 · PS6 0.12 · PS7 0.10 · PS8 0.09. Provenance: judgemental engine weights (PS1 ESMS treated as most material), not published IFC weights — IFC PS themselves are unweighted requirements.

**Paris alignment dimension weights** (`PARIS_ALIGNMENT_CRITERIA`): mitigation 0.40, adaptation 0.30, governance 0.30, each with 4 named sub-criteria (e.g. `mitigation_emissions_trajectory`). Thresholds: mitigation ≥ 65, adaptation ≥ 60, governance ≥ 65, overall ≥ 65 — engine conventions in the spirit of the IDFC Paris Alignment Framework, not published cut-offs.

**DSCR climate haircuts** (`DSCR_CLIMATE_HAIRCUTS`, per sector — synthetic calibration constants):

| Sector | Phys. haircut (orderly) | Phys. haircut (disorderly) | Transition capex % | Revenue reduction % |
|---|---|---|---|---|
| power | 0.05 | 0.12 | 0.15 | 0.10 |
| oil_gas | 0.08 | 0.20 | 0.25 | 0.30 |
| mining | 0.07 | 0.15 | 0.12 | 0.18 |
| transport | 0.06 | 0.14 | 0.10 | 0.08 |
| water | 0.10 | 0.22 | 0.05 | 0.05 |
| agriculture | 0.12 | 0.28 | 0.08 | 0.15 |
| real_estate | 0.08 | 0.18 | 0.12 | 0.12 |
| renewables | 0.04 | 0.09 | 0.02 | 0.03 |

Unknown sectors fall back to the `transport` row. Risk-level multipliers (both physical and transition): low 0.5 · medium 1.0 · high 1.5 · very_high 2.0.

**Blended-finance crowding-in ratios** (`CROWDING_IN_RATIOS`, attributed in comments to the OECD Blended Finance Toolkit as "published central estimates"): first_loss 3.0–8.0 (typical 5.0) · guarantee 4.0–10.0 (7.0) · concessional_debt 2.0–5.0 (3.5) · grant_component 1.5–4.0 (2.5) · equity_plus 2.5–6.0 (4.0).

### 7.3 Calculation walkthrough

**EP-IV score:** `overall = Σ(score_p × 0.1) / Σ(supplied 0.1 weights)` over caller-supplied principles only; any score < 60 logs a gap. `compliant = overall ≥ 70 AND gaps = 0`. `esap_required = category ∈ {A, B}`. IFC PS uses the identical pattern with its 0.09–0.20 weights; unsupplied PS with a triggering project characteristic (workforce > 500 → PS2, land acquisition → PS5, biodiversity-sensitive → PS6, indigenous peoples → PS7, cultural heritage → PS8) log a qualitative "elevated attention" gap instead of a score.

**Paris alignment:** dimension score = plain mean of supplied sub-criteria; overall = weight-normalised mean over dimensions with values. GHG reduction proxy: `ghg_reduction_pa = annual_ghg_tco2 × (mitigation_score/100) × 0.3` (the 0.3 is an unattributed engine assumption).

**DSCR stress** (the disorderly haircut is used when `physical_risk_level ∈ {high, very_high}`):

```
phys_haircut     = haircut_orderly|disorderly × phys_factor
capex_impact     = transition_capex_pct × trans_factor × 0.5
rev_reduction    = revenue_reduction_pct × trans_factor × 0.5
DSCR_physical    = DSCR₀ × (1 − phys_haircut)
DSCR_transition  = DSCR₀ × (1 − capex_impact − rev_reduction)
DSCR_combined    = DSCR₀ × (1 − phys_haircut − 0.5·capex_impact − 0.5·rev_reduction)
breach           = DSCR_combined < 1.20
```

Note the combined case halves the transition terms *again* (they already carry a ×0.5), an implicit diversification assumption between physical and transition stress.

**Blended finance:** structure selected deterministically — Cat-A sector OR target IRR < 8% → `first_loss`; else MDB participating AND IRR < 12% → `guarantee`; else IRR < 10% → `concessional_debt`; else `equity_plus`. Then `private_finance_mobilised = total_cost × mdb_share × crowding_in` (None if `mdb_share_pct` absent); `blended_irr = target_IRR + concessional_uplift` (None if uplift absent); `oecd_additionality_score = min(100, crowding_in × 12)`.

**Full assessment composite:** weights EP 0.20, IFC PS 0.20, Paris 0.30, DSCR-covenant 0.30 where the DSCR component is binary-ish (100 if no covenant breach, 40 if breach); `None` components are dropped and weights renormalised.

### 7.4 Worked example — DSCR stress, oil & gas, high/high risk

`POST /dscr-stress` with `sector=oil_gas`, `baseline_dscr=1.60`, `physical_risk_level=high`, `transition_risk_level=high`:

| Step | Computation | Result |
|---|---|---|
| Physical haircut | disorderly 0.20 × factor 1.5 | 0.30 |
| Capex impact | 0.25 × 1.5 × 0.5 | 0.1875 |
| Revenue reduction | 0.30 × 1.5 × 0.5 | 0.225 |
| DSCR physical | 1.60 × (1 − 0.30) | **1.120** |
| DSCR transition | 1.60 × (1 − 0.1875 − 0.225) | **0.940** |
| DSCR combined | 1.60 × (1 − 0.30 − 0.09375 − 0.1125) | **0.790** |
| Covenant | 0.790 < 1.20 | **BREACH** |

A comfortably covenanted 1.60× project fails under combined disorderly stress — the intended demonstration of transition-exposed sector fragility. (For blended finance on the same deal at target IRR 14% with MDB participation: structure = `equity_plus`, typical crowding-in 4.0; with `mdb_share_pct=25` on a $200M project, MDB tranche $50M mobilises $200M private; additionality score = min(100, 4.0×12) = 48.)

### 7.5 Data provenance & limitations

- **No seeded PRNG anywhere** — the engine is fully deterministic and, unusually for this platform, refuses to synthesise entity scores (explicit `insufficient_data`/`None` contract, comment-documented).
- Reference tables (EP categories/principles, IFC PS names, OECD tiers, CBI v4 sectors) faithfully mirror the named public frameworks; the *weights, thresholds and haircut percentages* are engine calibrations without cited sources and should be treated as synthetic demo values.
- DSCR stress is a scalar haircut on a single DSCR, not a cash-flow-model re-projection; no term structure, no scenario-year dimension, no NGFS pathway linkage.
- Blended-finance IRR is additive (`target + uplift`), not a tranche-weighted capital-structure IRR; crowding-in uses a point "typical" value rather than an econometric mobilisation model.
- Climate-label logic is a lookup: `cbi_certified` requires only a mapped sector + positive GHG reduction — no CBI sector-criteria thresholds (e.g. buildings emissions-intensity trajectories) are evaluated.

### 7.6 Framework alignment

- **Equator Principles IV (2020):** implements the A/B/C categorisation and all 10 principles as a weighted checklist; real EP adoption is a bank process standard, not a score — the 0–100 scoring is a platform overlay.
- **IFC Performance Standards (2012):** PS1–PS8 names/requirements reproduced; applicability triggers (PS5 land, PS7 FPIC etc.) modelled as attention flags.
- **OECD Common Approaches (2022):** tier screening/review/notification flags mapped 1:1 from EP category.
- **IDFC Paris Alignment Framework (2021):** three-dimension (mitigation/adaptation/governance) structure mirrored; the ≥65/60/65 thresholds are the engine's own.
- **Climate Bonds Standard v4.0 & ICMA Green Bond Principles (2021):** CBI certification in reality requires sector-criteria conformance plus approved-verifier assurance; ICMA GBP alignment rests on the four pillars (use of proceeds, evaluation/selection, management of proceeds, reporting) — the engine approximates both with sector-eligibility lookups.
- **OECD Blended Finance Toolkit (2018):** source cited in-code for the crowding-in ranges; the ×12 additionality scaling is a platform proxy.

## 9 · Future Evolution

### 9.1 Evolution A — Stochastic DSCR stress and calibrated crowding-in (analytics ladder: rung 2 → 4)

**What.** The `InfrastructureFinanceEngine` ("pure computation — no DB calls") runs eight
project-finance sub-modules: Equator Principles IV, IFC PS1–8, OECD Common Approaches,
Paris alignment, DSCR climate stress, blended finance, climate-label eligibility, and a
full assessment. The DSCR stress is deterministic single-shot —
`dscr_combined = baseline × (1 − phys_haircut − 0.5·transition_capex − 0.5·revenue_reduction)`
against a 1.20× covenant — and the blended-finance crowding-in
(`private_finance_mobilised = mdb_amount × crowding_in`) uses a caller-supplied
multiplier. Evolution A makes the DSCR stress probabilistic and calibrates mobilisation.

**How.** (1) Turn `/dscr-stress` into a Monte Carlo / scenario-grid over the physical and
transition haircut inputs (NGFS/CRREM-linked), returning a DSCR distribution and
probability of covenant breach across the debt tenor, not one number — this is the
rung-4 move the QMC/scenario-matrix pattern from Financial Modeling Studio templates.
(2) Calibrate the `crowding_in` multiplier against observed blended-finance leverage
ratios (OECD/Convergence data) by structure type, replacing the free input with a
prior-plus-override. (3) Bench-pin EP categorisation, IFC composite, and DSCR against
worked examples.

**Prerequisites.** NGFS/CRREM linkage for physical/transition haircuts (available via
the glidepath/scenario modules); a blended-finance leverage reference set. **Acceptance:**
`/dscr-stress` returns a breach probability and DSCR percentiles; crowding-in defaults to
a calibrated per-structure value with provenance; bench pins pass for the compliance
scorers.

### 9.2 Evolution B — Project-finance E&S structuring analyst (LLM tier 2)

**What.** A copilot that runs a project through the eight sub-modules and narrates the
integrated verdict — "this is EP Category A; IFC PS composite 78; Paris-aligned on
mitigation but weak on adaptation governance; DSCR survives the physical stress but
breaches under combined" — each figure from a tool call, and structures a blended-finance
proposal via `/blended-finance`.

**How.** Eight POST endpoints plus `/ref/*` tables (EP principles, IFC PS, Paris
alignment, blended structures) that ground every framework definition. The full
assessment endpoint gives the copilot a one-call cross-module verdict; individual
endpoints let it drill down. What-ifs ("re-run DSCR with a 20% revenue haircut", "raise
MDB share to 40%") are stateless re-calls. This module is a strong tier-3 Desk
Orchestrator node for an infrastructure/energy desk.

**Prerequisites.** Several POST endpoints trace as `skipped` in §4.2 under the harness —
confirm they're callable with valid payloads before wiring as tools. **Acceptance:**
every score, category, and DSCR figure traces to a tool response; blended-finance
proposals cite only structures from `/ref/blended-structures`; the copilot flags the
DSCR result as deterministic-only until Evolution A's probabilistic version ships.