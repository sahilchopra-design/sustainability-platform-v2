# Climate Stress Test Suite
**Module ID:** `climate-stress-test` · **Route:** `/climate-stress-test` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements NGFS and ECB climate stress testing frameworks to quantify transition and physical risk losses across credit, equity, and insurance portfolios under orderly, disorderly, and hot-house-world scenarios.

> **Business value:** Provides banks, insurers, and asset managers with a regulatory-grade climate stress testing suite aligned with NGFS, ECB, and Bank of England frameworks to support supervisory submissions and internal capital planning.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BORROWERS`, `CET1_COMPONENTS`, `CET1_DATA`, `COUNTRIES`, `HAZARD_TYPES`, `IFRS9_STAGES`, `REG_TIMELINE`, `SCENARIO_DEFS`, `SECTORS`, `TABS`, `TabCET1Waterfall`, `TabECLOverlay`, `TabExportReporting`, `TabModelMethodology`, `TabPhysicalRisk`, `TabRegulatoryCompliance`, `TabScenarioConfig`, `TabScenarioSensitivity`, `TabSectorPDMigration`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,seed)=>arr[Math.floor(sr(seed)*arr.length)];` |
| `rng` | `(min,max,seed)=>+(min+sr(seed)*(max-min)).toFixed(2);` |
| `rngInt` | `(min,max,seed)=>Math.floor(min+sr(seed)*(max-min+1));` |
| `fmt` | `(v,d=1)=>typeof v==='number'?v.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d}):'-';` |
| `fmtPct` | `(v)=>fmt(v,2)+'%';` |
| `fmtBps` | `(v)=>(v*100).toFixed(0)+' bps';` |
| `fmtM` | `(v)=>'EUR '+fmt(v,1)+'M';` |
| `sIdx` | `Math.floor(sr(i * 7) * 30);` |
| `country` | `pick(COUNTRIES, i * 3 + 1);` |
| `exposure` | `rng(20, 500, i * 5 + 2);` |
| `base` | `s.basePD + sr(i * 11) * 0.8 - 0.4;` |
| `bpd` | `Math.max(0.15, rng(base * 0.8, base * 1.2, i * 13));` |
| `lgd` | `rng(25, 65, i * 17);` |
| `maturity` | `rngInt(1, 15, i * 19);` |
| `carbonPathData` | `useMemo(() => YEARS.map(y => {` |
| `gdpPathData` | `useMemo(() => YEARS.map(y => {` |
| `multKey` | `scenarioKey + 'Mult';` |
| `sectorData` | `useMemo(()=>SECTORS.map(s=>{` |

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
**Frontend seed datasets:** `CET1_COMPONENTS`, `COUNTRIES`, `HAZARD_TYPES`, `IFRS9_STAGES`, `REG_TIMELINE`, `SCENARIO_DEFS`, `SECTORS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NGFS Scenarios Implemented | — | NGFS 2023 | Full set of NGFS Phase IV scenarios: Orderly (Below 2°C, Net Zero 2050), Disorderly (Divergent Net Zero, Delay |
| ECB Aggregate Credit Loss (adverse) | — | ECB 2021 | Range of climate stress credit losses as percentage of risk-weighted assets in ECB's economy-wide climate stre |
- **Portfolio credit data, NGFS scenario variable paths, physical hazard maps, sector carbon intensity** → PD uplift modelling, physical risk overlay, loss aggregation by scenario and horizon → **Stress loss tables, capital impact analysis, sector vulnerability heat maps**

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
**Methodology:** Climate Stress Loss
**Headline formula:** `CSL = Σᵢ EADᵢ × PDᵢ(Δscenario) × LGDᵢ`
**Standards:** ['NGFS Climate Scenarios 2022', 'ECB Economy-Wide Climate Stress Test 2021']

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
| `climate-stress-test-suite` | engine:climate_stress_test_engine |