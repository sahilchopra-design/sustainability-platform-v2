# SEC Climate Disclosure
**Module ID:** `sec-climate-disclosure` · **Route:** `/sec-climate-disclosure` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
US SEC climate disclosure rule compliance analytics tracking Scope 1/2 emission reporting, material climate risk disclosure, and scenario analysis obligations for registrants.

> **Business value:** Measures registrant readiness against SEC climate disclosure rule requirements and prioritises remediation actions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `CrossReference`, `FILER_TYPES`, `ITEMS`, `IssuerRegistry`, `ItemsOverview`, `RADAR_BASE`, `RescissionBanner`, `SCENARIO_DATA`, `SECTORS`, `ScenarioAnalysis`, `SectionHeader`, `TABS`, `TCFD_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `scope1` | `Math.round(50 + sr(i * 7) * 4900);` |
| `scope2loc` | `Math.round(scope1 * (0.3 + sr(i * 13) * 0.5));` |
| `scope2mkt` | `Math.round(scope2loc * (0.6 + sr(i * 17) * 0.35));` |
| `revenue` | `Math.round(500 + sr(i * 11) * 49500);` |
| `intensity` | `+((scope1 + scope2mkt) / revenue * 1000).toFixed(1);` |
| `readiness` | `Math.round(20 + sr(i * 3) * 75);` |
| `hasSbti` | `sr(i * 5) > 0.5;` |
| `targetYear` | `hasSbti ? (2040 + Math.round(sr(i * 19) * 10)) : null;` |
| `physData` | `useMemo(() => SCENARIO_DATA.map(d => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sec-climate/filer-assessment` | `filer_assessment` | api/v1/routes/sec_climate.py |
| POST | `/api/v1/sec-climate/ghg-disclosure` | `ghg_disclosure` | api/v1/routes/sec_climate.py |
| POST | `/api/v1/sec-climate/financial-effects` | `financial_effects` | api/v1/routes/sec_climate.py |
| POST | `/api/v1/sec-climate/materiality` | `materiality_assessment` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/filer-categories` | `ref_filer_categories` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/reg-sk-items` | `ref_reg_sk` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/reg-sx-items` | `ref_reg_sx` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/attestation` | `ref_attestation` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/safe-harbor` | `ref_safe_harbor` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/sec_climate.py |

### 2.3 Engine `sec_climate_engine` (services/sec_climate_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SECClimateEngine.assess_filer` | registrant_name, cik, filer_category, fiscal_year, governance_score, strategy_score | Assess SEC climate disclosure compliance for a registrant. |
| `SECClimateEngine.assess_ghg_disclosure` | registrant_name, fiscal_year, scope_1_total_co2e_mt, scope_1_by_gas, scope_1_methodology, scope_2_location_co2e_mt | Assess GHG emissions disclosure completeness and attestation readiness. |
| `SECClimateEngine.assess_financial_effects` | registrant_name, fiscal_year, pre_tax_income_usd, total_equity_usd, severe_weather_losses_usd, severe_weather_events | Assess Reg S-X 14-02 financial statement effects of climate events. |
| `SECClimateEngine.assess_materiality` | registrant_name, fiscal_year, physical_risks, transition_risks, scenario_analysis_used, internal_carbon_price_usd_per_tco2e | Assess materiality of climate risks under SEC Items 1502 and 1503. |
| `SECClimateEngine._generate_recommendations` | gaps, ghg_required, assurance_required, assurance_level, has_limited, has_reasonable |  |
| `SECClimateEngine.get_filer_categories` |  |  |
| `SECClimateEngine.get_reg_sk_items` |  |  |
| `SECClimateEngine.get_reg_sx_items` |  |  |
| `SECClimateEngine.get_attestation_requirements` |  |  |
| `SECClimateEngine.get_safe_harbor` |  |  |
| `SECClimateEngine.get_cross_framework_map` |  |  |
| `SECClimateEngine.get_rule_status` |  | Return P1-10 advisory: rule rescission status for UI/API consumers. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `FILER_TYPES`, `ITEMS`, `RADAR_BASE`, `SCENARIO_DATA`, `SECTORS`, `TABS`, `TCFD_MAP`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Rule Items Assessed | — | SEC 33-11275 | Total disclosure requirements assessed under the SEC final climate disclosure rule. |
| Readiness Score | — | Gap analysis | Current compliance readiness across all assessed registrant obligations. |
| Scope 1+2 Coverage | — | GHG inventory | Share of consolidated entities with verified Scope 1 and 2 GHG data for SEC reporting. |
- **SEC filing data, GHG inventory, material risk assessments** → Rule item mapping, gap scoring, filer category classification → **Readiness scores, gap reports, remediation plans**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sec-climate/ref/attestation** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['attestation'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/filer-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['filer_categories'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/reg-sk-items** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['reg_sk_items'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/reg-sx-items** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['reg_sx_items'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Readiness Score
**Headline formula:** `Completed SEC Requirements ÷ Total SEC Requirements × 100`
**Standards:** ['SEC Final Rule 33-11275', 'GHG Protocol']

**Engine `sec_climate_engine` — extracted transformation lines:**
```python
notes = [rescission_note] + notes
yoy_s1 = ((scope_1_total_co2e_mt - prior_year_scope_1) / prior_year_scope_1 * 100
yoy_s2 = ((scope_2_location_co2e_mt - prior_year_scope_2) / prior_year_scope_2 * 100
total_ghg = scope_1_total_co2e_mt + scope_2_location_co2e_mt
intensity_value = round(total_ghg / revenue_or_denominator, 2)
threshold = base * 0.01 if base > 0 else 0
total_transition = (carbon_offset_expenses_usd + rec_expenses_usd +
total_estimates = climate_impairments_usd + climate_contingencies_usd
total_impact = severe_weather_losses_usd + total_transition + total_estimates + transition_capex_usd
all_risks = physical_risks + transition_risks
material_count=len(material_physical) + len(material_transition),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `sec_climate_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `sec-climate-rule` | engine:sec_climate_engine |