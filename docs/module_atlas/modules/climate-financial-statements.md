# Climate-Adjusted Financial Statements
**Module ID:** `climate-financial-statements` · **Route:** `/climate-financial-statements` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted income statement, balance sheet, and cash flow statement engine. Applies NGFS scenario overlays to financial projections, quantifies stranded asset impairments, carbon cost line items, and physical damage provisions under IFRS and ISSB S2 disclosure requirements.

> **Business value:** Climate P&L impact = carbon cost + physical damage provision. Balance sheet adjusted via IAS 36 impairment for stranded assets. ISSB S2 requires quantitative disclosure of material climate financial impacts across all 4 TCFD pillars.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `Inp`, `KpiCard`, `PIE_COLORS`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `ifrsS2Score` | `Math.round(seed(15) * 20 + 64);` |
| `climateRiskScore` | `Math.round(seed(16) * 15 + 58);` |
| `disclosureCompleteness` | `Math.round(seed(17) * 20 + 68);` |
| `totalImpairment` | `impairmentTriggers.filter(t => t.activated).reduce((s, t) => s + t.impactM, 0);` |
| `carbonProvision` | `Math.round(seed(30) * 20 + 32);` |
| `etsAllocationDeficit` | `Math.round(seed(31) * 15 + 18);` |
| `totalStrandedExposure` | `strandedAssetTypes.reduce((s, a) => s + a.exposureM, 0);` |
| `earliestWritedown` | `Math.min(...strandedAssetTypes.map(a => a.writedownYr));` |
| `largestWritedown` | `[...strandedAssetTypes].sort((a, b) => b.exposureM - a.exposureM)[0];` |
| `plData` | `years.map((yr, i) => ({` |
| `latestPl` | `plData[plData.length - 1];` |
| `ebitdaImpact` | `((latestPl.reportedEbitda - latestPl.climateEbitda) / latestPl.reportedEbitda * 100).toFixed(1);` |
| `scenarioData` | `scenarioCategories.map((cat, i) => ({` |
| `writedown` | `Math.round(a.exposureM * 0.7);` |
| `yrsToTrigger` | `a.writedownYr - 2025;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-financial-statements/assess` | `full_assessment` | api/v1/routes/climate_financial_statements.py |
| POST | `/api/v1/climate-financial-statements/ifrs-s2-effects` | `ifrs_s2_financial_effects` | api/v1/routes/climate_financial_statements.py |
| POST | `/api/v1/climate-financial-statements/ias36-impairment` | `ias36_climate_impairment` | api/v1/routes/climate_financial_statements.py |
| POST | `/api/v1/climate-financial-statements/carbon-provisions` | `carbon_provisions` | api/v1/routes/climate_financial_statements.py |
| POST | `/api/v1/climate-financial-statements/stranded-assets` | `stranded_asset_assessment` | api/v1/routes/climate_financial_statements.py |
| POST | `/api/v1/climate-financial-statements/climate-financials` | `climate_adjusted_financials` | api/v1/routes/climate_financial_statements.py |
| GET | `/api/v1/climate-financial-statements/ref/financial-effect-categories` | `ref_financial_effect_categories` | api/v1/routes/climate_financial_statements.py |
| GET | `/api/v1/climate-financial-statements/ref/impairment-indicators` | `ref_impairment_indicators` | api/v1/routes/climate_financial_statements.py |
| GET | `/api/v1/climate-financial-statements/ref/scenario-multipliers` | `ref_scenario_multipliers` | api/v1/routes/climate_financial_statements.py |
| GET | `/api/v1/climate-financial-statements/ref/carbon-provision-thresholds` | `ref_carbon_provision_thresholds` | api/v1/routes/climate_financial_statements.py |
| GET | `/api/v1/climate-financial-statements/ref/stranded-asset-triggers` | `ref_stranded_asset_triggers` | api/v1/routes/climate_financial_statements.py |

### 2.3 Engine `climate_financial_statements_engine` (services/climate_financial_statements_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_safe_float` | val, default |  |
| `_clamp` | val, lo, hi |  |
| `ClimateFinancialStatementsEngine.assess_ifrs_s2_financial_effects` | entity_data, category_impact_overrides | Identify and quantify the 8 IFRS S2 financial effect categories. |
| `ClimateFinancialStatementsEngine.assess_ias36_climate_impairment` | entity_data, indicator_overrides | Evaluate all 12 IAS 36 climate impairment indicators. |
| `ClimateFinancialStatementsEngine.calculate_carbon_provisions` | entity_data, carbon_price_cagr_pct | Calculate IAS 37 carbon provision for ETS allowance deficit. |
| `ClimateFinancialStatementsEngine.assess_stranded_assets` | entity_data, trigger_overrides | Identify triggered stranded asset write-down scenarios. |
| `ClimateFinancialStatementsEngine.compute_climate_adjusted_financials` | entity_data | Compute climate-adjusted revenue, EBITDA and PAT across three |
| `ClimateFinancialStatementsEngine.run_full_assessment` | entity_data | Orchestrate all sub-assessments and produce consolidated E86 scores. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `request`, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Cost (P&L) | `Scope 1 × Carbon Price(t,scenario)` | NGFS carbon price trajectory | Annual P&L impact of internal or regulatory carbon pricing on operations |
| Physical Damage Provision | `Asset value × annual loss probability` | CAT model | Provision for climate-related physical asset damage in financial period |
| Stranded Asset Impairment | `IAS 36 recoverable amount shortfall` | Climate DCF model | Write-down of assets where climate-adjusted NPV < carrying value |
| IFRS 9 ECL Uplift | `ECL base + climate overlay` | IFRS 9 model | Expected credit loss increase from climate transition risk on loan book |
- **Financial model** → Base 3-statement → climate overlay → adjusted statements → **Climate-adjusted financials**
- **NGFS carbon price database** → Scenario-specific price trajectory → carbon cost line → **P&L carbon cost by scenario**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-financial-statements/ref/carbon-provision-thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'standard', 'sector_count', 'data'], 'n_keys': 4}`

**GET /api/v1/climate-financial-statements/ref/financial-effect-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'standard', 'category_count', 'data'], 'n_keys': 4}`

**GET /api/v1/climate-financial-statements/ref/impairment-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'standard', 'total_indicators', 'external_count', 'internal_count', 'external_indicators', 'internal_indicators'], 'n_keys': 7}`

**GET /api/v1/climate-financial-statements/ref/scenario-multipliers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'methodology', 'sector_count', 'data'], 'n_keys': 4}`

**GET /api/v1/climate-financial-statements/ref/stranded-asset-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'methodology', 'trigger_count', 'data'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate overlay on 3-statement financial model
**Headline formula:** `EBIT_adj = EBIT_base – CarbonCost(t) – PhysicalDamage(t); AssetValue_adj = AssetValue × (1–ImpairmentPct)`
**Standards:** ['ISSB IFRS S2 Climate Disclosures', 'IAS 36 Impairment Testing', 'IFRS 9 Expected Credit Loss', 'TCFD Financial Impact Guidance']

**Engine `climate_financial_statements_engine` — extracted transformation lines:**
```python
provision_deficit_pct = max(0.0, (_emiss_kt - _free_kt)) / _emiss_kt
income_m = abs(ebitda_m * 0.12 * base_relevance)  # model coefficient
bs_m = income_m * 0.6  # CapEx component capitalised
_phys_base = abs(total_assets_m * 0.03 * base_relevance)  # model coefficient
income_m = _phys_base * 0.4
income_m = abs(revenue_m * 0.05 * base_relevance)  # model coefficient
annual_emissions_kt = carbon_intensity * revenue_m / 1_000
income_m = annual_emissions_kt * 1_000 * provision_deficit_pct * price_mid / 1_000_000
income_m = abs(total_assets_m * 0.08 * base_relevance)  # model coefficient
bs_m = abs(total_assets_m * 0.04 * base_relevance)  # model coefficient
_lit_base = abs(revenue_m * 0.015 * base_relevance)  # model coefficient
income_m = _lit_base * 0.5
bs_m = _lit_base * 0.3
adjusted_prob = base_prob * 0.30
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).