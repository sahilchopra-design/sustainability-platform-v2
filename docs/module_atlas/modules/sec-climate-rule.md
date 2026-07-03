# SEC Climate Rule
**Module ID:** `sec-climate-rule` · **Route:** `/sec-climate-rule` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
SEC final climate disclosure rule implementation gap analysis covering governance, strategy, risk management, metrics and targets obligations across accelerated filer categories.

> **Business value:** Provides structured gap analysis against all SEC climate rule requirements with deadline-prioritised remediation guidance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE_FRAMEWORK`, `COLORS`, `COMPANIES`, `COMPANY_NAMES`, `COMPANY_SECTORS`, `COMPLIANCE_PHASES`, `DISCLOSURE_REQUIREMENTS`, `ENFORCEMENT`, `FILER_TYPES`, `INTL_COMPARISON`, `KpiCard`, `SECTORS`, `SECTOR_BENCHMARKS`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FILER_TYPES` | `['Large Accelerated Filer', 'Accelerated Filer', 'Non-Accelerated Filer', 'Smaller Reporting Co'];` |
| `ftype` | `FILER_TYPES[Math.floor(sr(i * 7) * 3)];` |
| `scope1` | `Math.round(sr(i * 11) * 9000 + 100);` |
| `scope2` | `Math.round(sr(i * 13) * 2500 + 50);` |
| `complScore` | `Math.round(38 + sr(i * 17) * 57);` |
| `ghgDisc` | `sr(i * 19) > 0.25;` |
| `riskDisc` | `sr(i * 23) > 0.18;` |
| `finImpact` | `sr(i * 29) > 0.38;` |
| `assurance` | `ftype === 'Large Accelerated Filer' ? (sr(i * 31) > 0.45 ? 'Limited' : 'None Yet') : 'N/A';` |
| `gaps` | `(!ghgDisc ? 1 : 0) + (!riskDisc ? 1 : 0) + (!finImpact ? 1 : 0);` |
| `icp` | `sr(i * 47) > 0.48 ? Math.round(sr(i * 53) * 150 + 15) : null;` |
| `hasScenario` | `sr(i * 61) > 0.55;` |
| `TREND` | `['Q3-22', 'Q4-22', 'Q1-23', 'Q2-23', 'Q3-23', 'Q4-23', 'Q1-24', 'Q2-24', 'Q3-24', 'Q4-24', 'Q1-25', 'Q2-25'].map((q, i) => ({` |
| `SECTOR_BENCHMARKS` | `SECTORS.map((s, i) => ({` |
| `scope3Add` | `calcScope3 ? base * 0.6 : 0;` |
| `revenueScale` | `Math.log10(Math.max(1, calcRevenue)) / Math.log10(100);` |
| `total` | `+(base * revenueScale + scope3Add).toFixed(2);` |
| `statusColor` | `s => ({ 'Compliant': T.green, 'Partial': T.amber, 'Non-Compliant': T.red }[s] \|\| T.textSec);` |

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
**Frontend seed datasets:** `ASSURANCE_FRAMEWORK`, `COLORS`, `COMPANY_NAMES`, `COMPANY_SECTORS`, `COMPLIANCE_PHASES`, `DISCLOSURE_REQUIREMENTS`, `ENFORCEMENT`, `FILER_TYPES`, `INTL_COMPARISON`, `SECTORS`, `TABS`, `TREND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Critical Gaps | — | Gap analysis | Rule items with no current implementation and nearest compliance deadline within 12 months. |
| Governance Items | — | SEC 33-11275 | Board oversight and management governance disclosure items with adequate documentation. |
| Attestation Ready | — | GHG audit | Share of Scope 1/2 disclosures meeting limited assurance readiness for attestation requirement. |
- **Regulatory text, current policy documentation, GHG inventory** → Item-by-item gap assessment, deadline mapping, priority scoring → **Gap index dashboard, remediation roadmap, board-ready summary**

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
**Methodology:** Implementation Gap Index
**Headline formula:** `(Total Items – Implemented Items) ÷ Total Items × 100`
**Standards:** ['SEC 33-11275', 'TCFD Framework']

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
| `sec-climate-disclosure` | engine:sec_climate_engine |