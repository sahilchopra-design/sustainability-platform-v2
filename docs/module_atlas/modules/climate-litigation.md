# Climate Litigation Hub
**Module ID:** `climate-litigation` · **Route:** `/climate-litigation` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides comprehensive climate litigation analytics covering case inventories, precedent analysis, claimant/defendant profiling, and sector-level exposure across global jurisdictions.

> **Business value:** Centralises global climate litigation intelligence to support legal risk integration in ESG analysis, credit underwriting, and regulatory compliance functions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `ENTITY_TYPES`, `Inp`, `KpiCard`, `PIE_COLORS`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `entityIndex` | `(e) => ENTITY_TYPES.findIndex(t => t.value === e) + 1;` |
| `litigationScore` | `Math.round(seed(ei * 7) * 40 + 40);` |
| `maxExposure` | `parseFloat((seed(ei * 11) * 800 + 100).toFixed(0));` |
| `expectedCost` | `parseFloat((maxExposure * (seed(ei * 13) * 0.2 + 0.05)).toFixed(0));` |
| `exposureByCategory` | `dimensions.map(d => ({` |
| `gwScore` | `Math.round(seed(ei * 41) * 35 + 40);` |
| `topRegulator` | `flagsTriggered >= 8 ? 'SEC / FCA / ESMA' : flagsTriggered >= 5 ? 'ESMA' : 'FCA';` |
| `categoryBreakdown` | `['Marketing', 'Targets', 'Disclosure', 'Carbon', 'Portfolio', 'Regulatory', 'Financing', 'Assurance'].map(cat => ({` |
| `disclosureScore` | `Math.round(seed(ei * 53) * 30 + 50);` |
| `maxExposure` | `Math.max(...triggers.map(t => t.exposureM));` |
| `fiduciaryScore` | `Math.round(seed(ei * 121) * 30 + 50);` |
| `doExposure` | `parseFloat((seed(ei * 123) * 300 + 50).toFixed(0));` |
| `gapsCount` | `Math.round(seed(ei * 127) * 4 + 1);` |
| `jurisdictionScore` | `Math.round(seed(ei * 161) * 35 + 45);` |
| `attributionApplicable` | `seed(ei * 163) > 0.45;` |
| `physicalDamagePct` | `parseFloat((seed(ei * 167) * 30 + 10).toFixed(1));` |

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
**Frontend seed datasets:** `ENTITY_TYPES`, `PIE_COLORS`, `RED_FLAGS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Precedent-Setting Rulings | — | Sabin Center 2024 | Landmark decisions that have been cited in subsequent climate cases or influenced regulatory policy. |
| Average Case Duration | — | UNEP 2023 | Mean time from filing to final judgment across resolved climate litigation cases. |
- **Court dockets, judgment texts, NGO case trackers, regulatory filings** → NLP case classification, precedent graph analysis, sector linkage → **Case inventory, precedent heat map, sector and entity exposure scores**

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
**Methodology:** Precedent Strength Index
**Headline formula:** `PSI = Σ (Case Citations × Court Tier Weight) / Total Cases`
**Standards:** ['Sabin Center', 'Columbia SILC']

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
| `climate-litigation-risk-scorer` | engine:climate_litigation_engine |