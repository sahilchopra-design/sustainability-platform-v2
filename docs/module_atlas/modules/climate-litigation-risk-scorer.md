# Climate Litigation Risk Scorer
**Module ID:** `climate-litigation-risk-scorer` · **Route:** `/climate-litigation-risk-scorer` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scores individual entities on their exposure to climate litigation using disclosure quality, emissions trajectory, greenwashing signals, and jurisdictional enforcement intensity.

> **Business value:** Provides investment and legal teams with a systematic, evidence-based entity scoring tool to integrate climate litigation risk into credit, equity, and ESG ratings workflows.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLAIM_TYPES`, `ENTITIES`, `ENTITY_NAME_BASES`, `ENTITY_TYPES`, `JURISDICTIONS`, `KpiCard`, `LANDMARK_CASES`, `OUTCOMES`, `RiskBadge`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `typeIdx` | `Math.floor(sr(i * 7) * 4);` |
| `sectorIdx` | `Math.floor(sr(i * 11) * 12);` |
| `jurIdx` | `Math.floor(sr(i * 13) * 20);` |
| `claim1` | `Math.floor(sr(i * 17) * 12);` |
| `claim2` | `Math.floor(sr(i * 19) * 12);` |
| `disclosureAdequacy` | `Math.round(sr(i * 23) * 80 + 10);` |
| `physRisk` | `Math.round(sr(i * 29) * 90 + 5);` |
| `transRisk` | `Math.round(sr(i * 31) * 90 + 5);` |
| `precedentRisk` | `Math.round(sr(i * 37) * 80 + 10);` |
| `reputationalRisk` | `Math.round(sr(i * 41) * 80 + 10);` |
| `activeCases` | `Math.floor(sr(i * 43) * 20);` |
| `historicalCases` | `Math.floor(sr(i * 47) * 40);` |
| `settledCases` | `Math.floor(sr(i * 53) * (historicalCases + 1));` |
| `dismissedCases` | `Math.floor(sr(i * 59) * Math.max(1, historicalCases - settledCases + 1));` |
| `totalExposureUSD` | `Math.round((sr(i * 61) * 9 + 0.1) * 1e9);` |
| `largestCaseUSD` | `Math.round(totalExposureUSD * (sr(i * 67) * 0.5 + 0.1));` |
| `legalCostEstimate` | `Math.round(totalExposureUSD * 0.05 * sr(i * 71));` |
| `litigationRiskScore` | `Math.min(100, Math.max(0, Math.round(` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-litigation/assess` | `run_full_assessment` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/greenwashing-risk` | `assess_greenwashing_risk` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/disclosure-liability` | `assess_disclosure_liability` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/fiduciary-duty` | `assess_fiduciary_duty` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/attribution-science` | `assess_attribution_science` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/litigation-exposure` | `compute_litigation_exposure` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/case-taxonomy` | `get_case_taxonomy` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/jurisdiction-profiles` | `get_jurisdiction_profiles` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/disclosure-triggers` | `get_disclosure_triggers` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/greenwashing-flags` | `get_greenwashing_flags` | api/v1/routes/climate_litigation.py |

### 2.3 Engine `climate_litigation_engine` (services/climate_litigation_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimateLitigationEngine.assess_greenwashing_risk` | entity_data | Check 20 red flags against entity data. Compute greenwashing risk score (0-100), |
| `ClimateLitigationEngine.assess_disclosure_liability` | entity_data | Check 8 disclosure liability triggers, quantify exposure per trigger, |
| `ClimateLitigationEngine.assess_fiduciary_duty` | entity_data | Score all 6 Duties X Framework fiduciary duties, compute fiduciary adequacy score, |
| `ClimateLitigationEngine.assess_attribution_science_risk` | entity_data | Assess attribution science applicability based on sector, jurisdiction, and |
| `ClimateLitigationEngine.compute_litigation_exposure` | entity_data | Aggregate all exposure streams. Compute max/expected litigation cost, |
| `ClimateLitigationEngine.run_full_assessment` | entity_data | Full climate litigation risk assessment across all five sub-modules. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CLAIM_TYPES`, `ENTITY_NAME_BASES`, `ENTITY_TYPES`, `JURISDICTIONS`, `OUTCOMES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| High-Risk Entity Threshold | — | Internal Calibration | Entities scoring 70 or above are classified as high litigation risk based on historical case filing rates. |
| Greenwashing Case Growth | — | UNEP 2023 | Year-on-year increase in greenwashing-specific climate litigation filings globally. |
- **Corporate disclosures, CDP submissions, court filing databases, regulatory registers** → Multi-factor scoring, greenwashing NLP flags, jurisdictional intensity mapping → **Entity risk scores, peer benchmarking, red-flag summary for investment committees**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-litigation/ref/case-taxonomy** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['case_taxonomy', 'category_count', 'source', 'total_cases_worldwide_2024', 'growth_note', 'fastest_growing_categories'], 'n_keys': 6}`

**GET /api/v1/climate-litigation/ref/disclosure-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['disclosure_liability_triggers', 'trigger_count', 'duties_x_framework', 'max_single_trigger_exposure_m', 'source'], 'n_keys': 5}`

**GET /api/v1/climate-litigation/ref/greenwashing-flags** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['greenwashing_red_flags', 'all_flags_flat', 'flag_count', 'categories', 'flags_with_enforcement_precedent', 'source', 'scoring_note'], 'n_keys': 7}`

**GET /api/v1/climate-litigation/ref/jurisdiction-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['jurisdiction_summary', 'jurisdiction_details', 'jurisdiction_count', 'highest_activity_jurisdictions', 'source'], 'n_keys': 5}`

**POST /api/v1/climate-litigation/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Entity Litigation Risk Score
**Headline formula:** `ELRS = w₁×Disclosure + w₂×EmissionsTrajectory + w₃×GreenwashSignal + w₄×JurisdictionIntensity`
**Standards:** ['UNEP 2023', 'Sabin Center']

**Engine `climate_litigation_engine` — extracted transformation lines:**
```python
base_score = flag_count * 10
greenwashing_risk_score = round(min(base_score + enforcement_uplift, 100.0), 1)
expected = (claim_min + claim_max) / 2 * 0.15
exposure_score = min(math.log10(total_max_m + 1) / math.log10(10001) * 50, 50)
count_score = min(trigger_count / 8 * 50, 50)
disclosure_score = round(exposure_score + count_score, 1)
breaches = min(breaches + 1, max_indicators)
breaches = min(breaches + 1, max_indicators)
breaches = min(breaches + 1, max_indicators)
duty_score = max(0, 100 - (breaches / max(max_indicators, 1)) * 100)
fiduciary_adequacy_score = round(sum(duty_scores.values()) / len(duty_scores), 1)
attribution_share = cumulative_emissions_mtco2 / global_industrial_co2_1850_2023
physical_damage_pct = round(min(attribution_share * 100, 100), 3)
gw_max = gw_flag_count * 20
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `climate_litigation_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-litigation` | engine:climate_litigation_engine |