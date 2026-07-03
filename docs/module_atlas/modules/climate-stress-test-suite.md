# Climate Stress Test Suite
**Module ID:** `climate-stress-test-suite` · **Route:** `/climate-stress-test-suite` · **Tier:** A (backend vertical) · **EP code:** EP-CH3 · **Sprint:** CH

## 1 · Overview
Multi-regulator stress test alignment: ECB CST 2024, BoE CBES, APRA CPG 229. Includes reverse stress test and submission tracker.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `APRA_RISKS`, `BOE_SCENARIOS`, `Card`, `ECB_SCENARIOS`, `ECB_SECTORS`, `Pill`, `Ref`, `SUBMISSION_TIMELINE`, `StatusBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sectorImpact` | `useMemo(() => ECB_SECTORS.map(s => ({` |
| `targetFrac` | `reverseTarget / 100;` |
| `carbonPrice` | `Math.round(targetFrac * 1800 + 50);` |
| `gdpShock` | `-(targetFrac * 12 + 1).toFixed(1);` |
| `physicalLoss` | `(targetFrac * 8 + 0.5).toFixed(1);` |
| `pdNoise` | `0.05 * sr(i * 13);   // [0, 0.05]` |
| `lgdNoise` | `0.025 * sr(i * 9 + 100); // [0, 0.025]` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-stress-test/bcbs-517` | `bcbs_517` | api/v1/routes/climate_stress_test.py |
| POST | `/api/v1/climate-stress-test/boe-cbes` | `boe_cbes` | api/v1/routes/climate_stress_test.py |
| POST | `/api/v1/climate-stress-test/ecb-cst` | `ecb_cst` | api/v1/routes/climate_stress_test.py |
| POST | `/api/v1/climate-stress-test/apra-clt` | `apra_clt` | api/v1/routes/climate_stress_test.py |
| POST | `/api/v1/climate-stress-test/cross-framework` | `cross_framework` | api/v1/routes/climate_stress_test.py |
| POST | `/api/v1/climate-stress-test/portfolio-resilience` | `portfolio_resilience` | api/v1/routes/climate_stress_test.py |
| GET | `/api/v1/climate-stress-test/ref/frameworks` | `ref_frameworks` | api/v1/routes/climate_stress_test.py |
| GET | `/api/v1/climate-stress-test/ref/ngfs-scenarios` | `ref_ngfs_scenarios` | api/v1/routes/climate_stress_test.py |
| GET | `/api/v1/climate-stress-test/ref/damage-functions` | `ref_damage_functions` | api/v1/routes/climate_stress_test.py |

### 2.3 Engine `climate_stress_test_engine` (services/climate_stress_test_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_scenario_multiplier` | scenario, scenario_type_key | Map NGFS scenario to a loss intensity multiplier. |
| `ClimateStressTestEngine.run_bcbs_517` | entity_id, institution_type, portfolio_sectors, total_assets_usd, cet1_ratio_pct, scenario |  |
| `ClimateStressTestEngine.run_boe_cbes` | entity_id, institution_type, uk_mortgage_exposure_pct, uk_corporate_exposure_pct, scenario |  |
| `ClimateStressTestEngine.run_ecb_cst` | entity_id, institution_type, eu_sector_exposures, total_rwa_usd, scenario |  |
| `ClimateStressTestEngine.run_apra_clt` | entity_id, institution_type, australian_exposure_pct, scenario |  |
| `ClimateStressTestEngine.run_cross_framework` | entity_id, institution_type, portfolio_sectors, total_assets_usd, cet1_pct, scenario |  |
| `ClimateStressTestEngine.assess_portfolio_resilience` | entity_id, portfolios |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `APRA_RISKS`, `BOE_SCENARIOS`, `ECB_SCENARIOS`, `ECB_SECTORS`, `SUBMISSION_TIMELINE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ECL Uplift (NZ) | `Scenario-conditional` | ECB CST | Increase in expected credit loss under Net Zero scenario |
| Reverse Stress | `Solver output` | Model | Conditions that break the portfolio |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-stress-test/ref/damage-functions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['physical_hazard_damage_functions', 'sector_transition_sensitivity', 'total_hazards', 'total_sectors'], 'n_keys': 4}`

**GET /api/v1/climate-stress-test/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'capital_adequacy_floors', 'total_frameworks'], 'n_keys': 3}`

**GET /api/v1/climate-stress-test/ref/ngfs-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scenarios', 'by_type', 'total'], 'n_keys': 3}`

**POST /api/v1/climate-stress-test/apra-clt** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-stress-test/bcbs-517** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Regulatory stress test methodologies
**Headline formula:** `ECL_stressed = PD_base × (1 + β_sector × ΔGDP + γ × ΔCarbonPrice) × LGD × EAD`
**Standards:** ['ECB CST 2024', 'BoE CBES', 'APRA CPG 229', 'Fed SR 11-7']

**Engine `climate_stress_test_engine` — extracted transformation lines:**
```python
credit_loss_pct = round(max(0, min(30, base_credit * weighted_credit * scen_mult * 100)), 2)
market_loss_pct = round(max(0, min(20, base_market * weighted_market * scen_mult * 100)), 2)
operational_loss_pct = round(max(0, min(10, base_op * weighted_op * scen_mult * 100)), 2)
total_loss_pct = round(credit_loss_pct + market_loss_pct + operational_loss_pct + physical_loss_pct, 2)
climate_var_pct = round(total_loss_pct * 1.15, 2)
cet1_post = round(cet1_ratio_pct - total_loss_pct, 2)
bcbs_compliance_score = round(max(30, min(100, 70 - scen_mult * 10)), 2)
cet1_impact_ppts = round(physical_loss_pct + transition_loss_pct * 0.6, 2)
taxonomy_alignment_pct = round(min(100, green_exposure * 100), 2)
pillar2_add_on = round(max(0, cet1_impact_ppts - 2.0), 2)
au_factor = max(0, min(2, australian_exposure_pct / 50))
liquidity_impact_pct = round(max(0, min(15, capital_impact_ppts * 2.5)), 2)
ecb = self.run_ecb_cst(entity_id, institution_type, portfolio_sectors, total_assets_usd * 0.4, scenario)
aggregated_capital_impact = round(sum(losses.values()) / len(losses), 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `climate_stress_test_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-stress-test` | engine:climate_stress_test_engine |