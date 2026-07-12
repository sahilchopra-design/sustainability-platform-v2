# Api::Scenarios
**Module ID:** `api::scenarios` · **Route:** `/api/v1/scenarios` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/scenarios/ngfs/sources` | `get_ngfs_sources` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/ngfs/sources` | `create_ngfs_source` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/ngfs/sync` | `sync_ngfs_data` | api/v1/routes/scenarios.py |
| GET | `/api/v1/scenarios/templates` | `get_scenario_templates` | api/v1/routes/scenarios.py |
| GET | `/api/v1/scenarios` | `list_scenarios` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios` | `create_scenario` | api/v1/routes/scenarios.py |
| GET | `/api/v1/scenarios/{scenario_id}` | `get_scenario` | api/v1/routes/scenarios.py |
| PATCH | `/api/v1/scenarios/{scenario_id}` | `update_scenario` | api/v1/routes/scenarios.py |
| DELETE | `/api/v1/scenarios/{scenario_id}` | `delete_scenario` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/{scenario_id}/fork` | `fork_scenario` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/{scenario_id}/publish` | `publish_scenario` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/{scenario_id}/submit-for-approval` | `submit_for_approval` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/{scenario_id}/approve` | `approve_scenario` | api/v1/routes/scenarios.py |
| GET | `/api/v1/scenarios/{scenario_id}/versions` | `get_scenario_versions` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/{scenario_id}/preview` | `calculate_impact_preview` | api/v1/routes/scenarios.py |
| GET | `/api/v1/scenarios/{scenario_id}/preview/{portfolio_id}` | `get_impact_preview` | api/v1/routes/scenarios.py |

### 2.3 Engine `ngfs_sync_service` (services/ngfs_sync_service.py)
| Function | Args | Purpose |
|---|---|---|
| `NGFSSyncService.get_ngfs_sources` |  | Get all NGFS data sources. |
| `NGFSSyncService.create_or_update_source` | name, url, version, release_date | Create or update NGFS data source. |
| `NGFSSyncService.sync_ngfs_scenarios` | source_id | Sync NGFS scenarios from a data source. In a production system, this would download CSV/Excel files from NGFS. For this implementation, we use embedded scenario definitions. |
| `NGFSSyncService.download_ngfs_data` | url | Download NGFS data from URL. Production implementation would handle: - Authentication - Rate limiting - Retries - Progress tracking |
| `NGFSSyncService.detect_changes` | source_id | Detect if NGFS data has changed since last sync. Returns True if data has changed or first sync. |

### 2.3 Engine `scenario_builder_service` (services/scenario_builder_service.py)
| Function | Args | Purpose |
|---|---|---|
| `ScenarioBuilderService.list_scenarios` | approval_status, source, published_only | List scenarios with optional filters. |
| `ScenarioBuilderService.get_scenario` | scenario_id | Get scenario by ID. |
| `ScenarioBuilderService.create_scenario` | scenario_data | Create a new scenario. |
| `ScenarioBuilderService.update_scenario` | scenario_id, updates, updated_by | Update scenario and create new version. |
| `ScenarioBuilderService.fork_scenario` | scenario_id, new_name, description, created_by | Fork (copy) a scenario. |
| `ScenarioBuilderService.submit_for_approval` | scenario_id, submitted_by, notes | Submit scenario for approval. |
| `ScenarioBuilderService.approve_scenario` | scenario_id, approved_by, notes | Approve a scenario. |
| `ScenarioBuilderService.reject_scenario` | scenario_id, rejected_by, reason | Reject a scenario. |
| `ScenarioBuilderService.publish_scenario` | scenario_id | Publish an approved scenario. |
| `ScenarioBuilderService.get_scenario_versions` | scenario_id | Get all versions of a scenario. |
| `ScenarioBuilderService.get_ngfs_templates` |  | Get NGFS scenario templates. |
| `ScenarioBuilderService._create_version` | scenario_id, version_number, parameters, change_summary, changed_by | Create a scenario version record. |

### 2.3 Engine `scenario_impact_service` (services/scenario_impact_service.py)
| Function | Args | Purpose |
|---|---|---|
| `ScenarioImpactService.calculate_impact` | scenario_id, portfolio_id, parameters_override | Calculate scenario impact on a portfolio. Args: scenario_id: ID of scenario to apply portfolio_id: ID of portfolio to analyze parameters_override: Optional parameter overrides for preview Returns: ScenarioImpactPreview with impact summary |
| `ScenarioImpactService._get_portfolio_holdings` | portfolio_id | Get holdings for a portfolio. In production, query the holdings table. For now, return sample data. |
| `ScenarioImpactService._calculate_baseline_expected_loss` | holdings | Calculate baseline expected loss (EL = PD * LGD * EAD). |
| `ScenarioImpactService._calculate_scenario_expected_loss` | holdings, parameters | Calculate scenario expected loss with climate impacts. |
| `ScenarioImpactService._calculate_impact_by_sector` | holdings, parameters | Calculate impact breakdown by sector. |
| `ScenarioImpactService._calculate_impact_by_rating` | holdings, parameters | Calculate impact breakdown by credit rating. |
| `ScenarioImpactService._get_top_impacted_holdings` | holdings, parameters, limit | Get holdings with highest expected loss increase. |
| `ScenarioImpactService._get_baseline_pd` | rating | Get baseline probability of default by credit rating. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DRAFT`, `backend` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `scenario`, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `workers` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/scenarios** — status `passed`, provenance ['real-db'], source tables: `scenarios`
Output: `{'type': 'array', 'len': 42, 'item0_keys': None}`

**GET /api/v1/scenarios/ngfs/sources** — status `passed`, provenance ['real-db'], source tables: `ngfs_data_sources`
Output: `{'type': 'array', 'len': 2, 'item0_keys': None}`

**GET /api/v1/scenarios/templates** — status `passed`, provenance ['real-db'], source tables: `scenarios`
Output: `{'type': 'array', 'len': 12, 'item0_keys': None}`

**GET /api/v1/scenarios/{scenario_id}** — status `failed`, provenance ['db-empty'], source tables: `scenarios`
Output: `None`

**GET /api/v1/scenarios/{scenario_id}/preview/{portfolio_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/scenarios/{scenario_id}/versions** — status `failed`, provenance ['db-empty'], source tables: `scenarios`
Output: `None`

**POST /api/v1/scenarios** — status `passed`, provenance ['real-db'], source tables: `scenario_versions`, `scenarios`
Output: `{'type': 'Scenario', 'repr': '<db.models.scenario.Scenario object at 0x0000013D49EA6150>'}`

**POST /api/v1/scenarios/ngfs/sources** — status `passed`, provenance ['real-db'], source tables: `ngfs_data_sources`
Output: `{'type': 'NGFSDataSource', 'repr': '<db.models.scenario.NGFSDataSource object at 0x0000013D4A1C1940>'}`

## 5 · Intermediate Transformation Logic

**Engine `ngfs_sync_service` — extracted transformation lines:**
```python
approval_status=ScenarioApprovalStatus.APPROVED,  # NGFS scenarios are pre-approved
```

**Engine `scenario_impact_service` — extracted transformation lines:**
```python
el_change = scenario_el - baseline_el
el_change_pct = (el_change / baseline_el * 100) if baseline_el > 0 else 0
el = pd * lgd * exposure
temperature_factor = 1 + (avg_temp_increase - 1.0) * 0.15  # 15% PD increase per degree above 1°C
gdp_factor = 1 + abs(gdp_impact_2050) * 0.05  # 5% PD increase per 1% GDP decline
scenario_pd = baseline_pd * sector_multiplier * temperature_factor * gdp_factor
scenario_lgd = min(baseline_lgd * 1.1, 0.9)  # Max 90% LGD
el = scenario_pd * scenario_lgd * exposure
baseline_el = baseline_pd * self.BASELINE_LGD * exposure
scenario_el = baseline_el * sector_multiplier * 1.5  # Simplified factor
baseline_el = baseline_pd * self.BASELINE_LGD * exposure
scenario_el = baseline_el * 1.8  # Simplified multiplier
baseline_el = baseline_pd * self.BASELINE_LGD * exposure
scenario_el = baseline_el * sector_multiplier * 1.5
change_pct = ((scenario_el - baseline_el) / baseline_el * 100) if baseline_el > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/scenarios` is the platform's **scenario lifecycle engine**: it (a) syncs a library of 8
NGFS scenario definitions into the `Scenario` table (`ngfs_sync_service.py`), (b) manages custom
scenario creation / versioning / approval / publication (`scenario_builder_service.py`), and
(c) previews scenario impact on a portfolio as an expected-loss delta
(`scenario_impact_service.py`):

```
EL_baseline = Σ_h  PD(rating_h) × LGD × EAD_h                       LGD = 0.45
EL_scenario = Σ_h  min(1, PD × sectorMult × tempFactor × gdpFactor) × min(LGD×1.1, 0.9) × EAD_h
ΔEL % = (EL_scenario − EL_baseline) / EL_baseline × 100
```

### 7.2 Parameterisation

**NGFS scenario library** (embedded in `NGFSSyncService.NGFS_SCENARIOS`; code comments cite NGFS
Phase IV plus Phase V 2024 recalibrations "per post-AR6 NiGEM model"; carbon prices USD/tCO₂, GDP
impact % deviation from baseline):

| Scenario | Phase | Carbon price 2030→2050 | Temp 2050 | GDP 2050 | Phys. mult 2050 | Trans. mult 2050 |
|---|---|---|---|---|---|---|
| Net Zero 2050 | V | 173 → 735 | 1.4 °C | −1.6 % | 1.1 | 1.2 |
| Delayed Transition | V | 110 → 1,200 | 1.7 °C | −4.8 % | 1.2 | 2.0 |
| Below 2 °C | IV | 120 → 490 | 1.6 °C | −2.3 % | 1.3 | 1.1 |
| NDCs | IV | 60 → 200 | 2.3 °C | −3.0 % | 1.8 | 0.9 |
| Current Policies | IV | 25 → 60 | 3.0 °C | −5.0 % | 2.8 | 0.2 |
| Fragmented World | IV | 80 → 500 | 2.8 °C | −6.5 % | 2.2 | 1.5 |
| Low Demand (new) | V | 90 → 360 | 1.4 °C | −1.1 % | 1.0 | 0.8 |
| Divergent Net Zero (new) | V | 140 → 590 | 1.5 °C | −2.1 % | 1.2 | 1.4 |

Extras: Low Demand carries `demand_reduction_pct` (5→32 % by 2050, citing IPCC AR6 WG3 Ch.5);
Divergent Net Zero carries `cbam_friction_factor = 1.35` (carbon-border amplification).

**Cross-scenario constants** stored into every synced scenario's `parameters`:

| Table | Values | Provenance |
|---|---|---|
| `SECTORAL_MULTIPLIERS` | energy 1.8, utilities 1.6, transport 1.5, materials 1.4, industrials 1.3, real_estate 1.2, cons. disc. 1.1, cons. staples 1.0, financials 1.0, healthcare 0.9, technology 0.8 | Synthetic; comment: "energy sector has highest exposure" |
| `PHYSICAL_RISK_FACTORS` | wildfire 1.20, storm 1.18, flood 1.15, sea-level 1.14, heatwave 1.12, drought 1.10 | Synthetic demo values |
| Rating→PD map | AAA 0.1 % … BBB 2 % … B 20 % … CCC- 90 %; unrated → 2 % | Stylised "standard PD mapping", not a named agency table |
| `BASELINE_LGD` | 0.45 | Close to the 45 % Basel foundation-IRB senior-unsecured LGD |

### 7.3 Calculation walkthrough

1. **Sync** (`POST /ngfs/sources` → `sync_ngfs_scenarios`): upserts one `Scenario` row per
   NGFS type keyed on `(source=NGFS, type, version)`, auto-`APPROVED` and published (code comment:
   "NGFS scenarios are pre-approved"). A SHA-256 hash of the definitions supports change detection.
   Note: despite the docstring's "downloading" language, **no download occurs** — definitions are
   embedded constants.
2. **Builder lifecycle**: custom scenarios start `DRAFT` (version 1); parameter updates increment
   `current_version` and append a `ScenarioVersion` snapshot; state machine is
   DRAFT → PENDING_APPROVAL → APPROVED → published (REJECTED returns to editable). Forking deep-
   copies parameters; a forked NGFS scenario becomes source `HYBRID`, otherwise `CUSTOM`.
3. **Impact preview** (`GET /{scenario_id}/preview/{portfolio_id}`): pulls scenario `parameters`
   (or an override), then per holding:
   - `tempFactor = 1 + (temp_2050 − 1.0) × 0.15` — comment: "15 % PD increase per degree above 1 °C"
   - `gdpFactor = 1 + \|gdp_2050\| × 0.05` — "5 % PD increase per 1 % GDP decline"
   - `PD_scenario = min(1, PD_base × sectorMult × tempFactor × gdpFactor)`
   - `LGD_scenario = min(0.45 × 1.1, 0.9) = 0.495`
   Results are cached in `ScenarioImpactPreview` (upsert per scenario × portfolio,
   `calculation_version = "1.0"`).

### 7.4 Worked example — Current Policies on the sample energy holding

Holding h1: Energy Corp A, EAD $50M, rating BBB (PD 2.0 %), sector energy (mult 1.8). Current
Policies: temp 2050 = 3.0 °C, GDP 2050 = −5.0 %.

| Step | Computation | Result |
|---|---|---|
| Baseline EL | 0.02 × 0.45 × 50,000,000 | **$450,000** |
| Temp factor | 1 + (3.0 − 1.0) × 0.15 | 1.30 |
| GDP factor | 1 + 5.0 × 0.05 | 1.25 |
| Scenario PD | 0.02 × 1.8 × 1.30 × 1.25 | 5.85 % |
| Scenario LGD | min(0.45 × 1.1, 0.9) | 49.5 % |
| Scenario EL | 0.0585 × 0.495 × 50,000,000 | **$1,447,875** |
| ΔEL | 1,447,875 / 450,000 − 1 | **+221.75 %** |

### 7.5 Internal inconsistency worth knowing

The sector and rating **breakdown tables do not reuse the headline formula**: `by_sector` uses
`scenario_el = baseline_el × sectorMult × 1.5` and `by_rating` uses a flat `× 1.8` (both marked
"Simplified factor/multiplier" in comments). So the by-sector/by-rating panels will not sum to the
headline `scenario_expected_loss`, and the by-rating change is a constant +80 % for every rating
band. Top-impacted holdings use the same simplified ×1.5 sector formula, ranked by `change_pct`.

### 7.6 Data provenance & limitations

- **Portfolio holdings are hard-coded sample data** — `_get_portfolio_holdings` ignores
  `portfolio_id` and always returns the same 5 demo counterparties ($165M total). The docstring
  says "In production, query the holdings table." No `sr()` PRNG is used; the fabrication is a
  fixed literal list.
- Scenario parameter *shapes* follow NGFS publications, but the specific numbers are
  hand-embedded approximations of NGFS Phase IV/V outputs, not ingested IIASA data (the ingested
  series live in the separate `api::scenario_data` domain).
- Single-horizon (2050 values only) EL; no discounting, no PD term structure, no correlation.
  The 0.15/°C and 0.05/%GDP sensitivities are unattributed modelling choices.
- LGD stress is scenario-invariant (always ×1.1 capped at 90 %).

### 7.7 Framework alignment

- **NGFS Phases IV/V** — the scenario taxonomy, names, and the Phase V additions (Low Demand,
  Divergent Net Zero) match the real NGFS 2023/2024 releases; NGFS derives these with three IAMs
  (GCAM, MESSAGEix-GLOBIOM, REMIND-MAgPIE) plus the NiGEM macro model — here the outputs are
  summarised into 4-point paths per variable.
- **IFRS 9 §5.5.17** — the EL = PD × LGD × EAD kernel is the standard expected-credit-loss form;
  no staging/SICR logic exists in this domain (that lives in climate-credit modules).
- **Model-risk governance (SR 11-7 style)** — the builder's draft/approve/publish workflow with
  immutable version snapshots mirrors supervisory expectations for scenario change control.
- **EU CBAM** — Divergent Net Zero's `cbam_friction_factor` gestures at carbon-border adjustment
  costs; it is stored but not consumed by the impact calculator.

## 9 · Future Evolution

### 9.1 Evolution A — Replace simplified EL multipliers with the platform's real credit engines (analytics ladder: rung 2 → 3)

**What.** The platform's scenario lifecycle engine: it syncs 8 NGFS scenario definitions
(`ngfs_sync_service`), manages custom-scenario creation/versioning/approval, and previews scenario
impact on a portfolio as an expected-loss delta (`scenario_impact_service`). The impact model is
candidly simplified in §5: `temperature_factor = 1 + (ΔT − 1)×0.15` ("15% PD increase per degree"),
`gdp_factor = 1 + |gdp|×0.05`, LGD capped `min(base×1.1, 0.9)`, and several
`scenario_el = baseline × 1.5` / `× 1.8` "simplified multipliers". The scenario library itself is
real-db (42 scenarios, 12 templates). Evolution A grounds the impact model.

**How.** (1) Replace the linear temperature/GDP PD factors and the `×1.5`/`×1.8` shortcuts with the
platform's actual credit-risk engines — route the scenario's carbon-price/GDP/temperature paths
through the PCAF-ECL bridge and the prudential-climate engine so ΔEL derives from calibrated PD/LGD
transformations, not flat multipliers. (2) Reconcile the embedded `NGFS_SCENARIOS` library with the
canonical `dh_ngfs_scenario_data` source (the platform's third NGFS surface — consolidate). (3) Fix
the failing `/{scenario_id}` and preview endpoints. (4) Bench-pin the EL-delta math.

**Prerequisites.** Integration with the credit engines (`pcaf_ecl_bridge`, `prudential_climate_risk`);
NGFS source consolidation; the failed detail/preview/versions endpoints repaired. **Acceptance:**
scenario EL-delta derives from calibrated credit transformations, not `×1.5`/linear factors;
`/{scenario_id}` and preview return `passed`; the scenario library reads the canonical NGFS table;
ΔEL bench-pinned.

### 9.2 Evolution B — Scenario-lifecycle copilot with governed approval (LLM tier 2)

**What.** A copilot that manages the scenario library conversationally — "show me the disorderly
scenario, preview its impact on my portfolio, and submit a custom variant for approval" — calling
the list/preview endpoints and the governed create/version/publish actions.

**How.** A mixed read/write surface: list/templates/get/preview are free; create, version, approve,
and publish are the gated mutating actions (the engine already models an approval workflow —
NGFS scenarios are pre-approved, custom ones require sign-off). The copilot narrates the real ΔEL
preview and never invents a portfolio impact. Approval/publish inherit RBAC and log to audit — a
governed-scenario tool matching the `parameter_governance` four-eyes pattern. Central node feeding
scenarios to the stress-test and transition-risk copilots.

**Prerequisites.** Evolution A's grounded impact model — a copilot narrating ΔEL from the simplified
multipliers as a stress result needs the caveat; endpoint fixes. **Acceptance:** every scenario
parameter and ΔEL figure traces to a tool response; custom-scenario approval/publish require
confirmation and log to audit; the copilot labels EL-deltas as simplified-model until Evolution A,
and refuses to publish a scenario without the approval step.