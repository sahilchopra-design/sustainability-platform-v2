# Stress Test Orchestrator
**Module ID:** `stress-test-orchestrator` · **Route:** `/stress-test-orchestrator` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-framework stress test management platform. Coordinates ECB, BoE, Fed, APRA, and internal stress tests with scenario libraries, results aggregation, and regulatory submission packages.

> **Business value:** Managing multiple simultaneous regulatory stress tests is operationally complex. This orchestrator eliminates duplication, ensures consistent scenario application, and generates the submission packages needed for ECB SREP, BoE CBES, and other regulatory processes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `HOLDINGS`, `SCENARIOS`, `SECTORS_DATA`, `SECTOR_IMPACT`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `SCENARIOS` | `[{id:1,name:'NGFS Net Zero 2050',type:'Orderly',source:'NGFS',horizon:'2050',carbonPrice:250,tempC:1.5,gdpImpact:-2.1,severity:'Medium'},{id:2,name:'N` |
| `SECTOR_IMPACT` | `SCENARIOS.map(s=>({scenario:s.name,...Object.fromEntries(SECTORS_DATA.map(sec=>[sec,+((sr(s.id*100+SECTORS_DATA.indexOf(sec)*7)-0.5)*s.severity.length` |
| `impacts` | `SCENARIOS.map(s=>{const sIdx=SECTORS_DATA.indexOf(secs[i]);const base=(sr(s.id*100+i*7)-0.5)*20;return{scenario:s.name,impact:+(base-s.severity.length` |
| `holdingsWithImpact` | `useMemo(()=>HOLDINGS.map(h=>{const imp=h.impacts.find(i=>i.scenario===scenarioF);return{...h,impact:imp?imp.impact:0};}),[scenarioF]);` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `sectorImpact` | `useMemo(()=>{const si=SECTOR_IMPACT.find(s=>s.scenario===scenarioF);if(!si)return[];return SECTORS_DATA.map(s=>({sector:s,impact:si[s]\|\|0})).sort((a,b` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='impacts');const csv=[keys.join(','),...data.map(r=>keys.` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/stress-test-orchestrator/ref/sector-risk-profiles` | `get_sector_risk_profiles_ref` | api/v1/routes/stress_test_orchestrator.py |
| GET | `/api/v1/stress-test-orchestrator/ref/transmission-channels` | `get_transmission_channels_ref` | api/v1/routes/stress_test_orchestrator.py |
| POST | `/api/v1/stress-test-orchestrator/run` | `run_full_stress_test` | api/v1/routes/stress_test_orchestrator.py |
| POST | `/api/v1/stress-test-orchestrator/scenario-comparison` | `compare_all_scenarios` | api/v1/routes/stress_test_orchestrator.py |
| POST | `/api/v1/stress-test-orchestrator/pd-migration` | `compute_pd_migration` | api/v1/routes/stress_test_orchestrator.py |

### 2.3 Engine `stress_test_orchestrator_engine` (services/stress_test_orchestrator_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_sector_profile` | sector | Return sector profile; fall back to financial_services if unknown. |
| `calculate_pd_migration` | sector, scenario_id, time_horizon_year | Compute stressed PD for a sector under a given NGFS Phase IV scenario. |
| `calculate_lgd_uplift` | sector, scenario_id, jurisdiction, baseline_lgd_pct | Compute stressed LGD incorporating stranded-asset and physical-damage channels. |
| `calculate_cet1_depletion` | expected_loss_bn, rwa_bn, baseline_cet1_pct | Compute stressed CET1 after expected credit loss absorption. |
| `_run_single_scenario` | scenario_id, sectors, total_exposure_bn, baseline_cet1_pct, jurisdiction, regulatory_framework | Run one scenario and return full result dict. |
| `_map_sector_to_framework_category` | sector | Map NACE sector key to framework's sector risk weight category. |
| `run_stress_test` | request | Run full climate stress test across requested NGFS Phase IV scenarios. |
| `run_scenario_comparison` | request | Compare all NGFS Phase IV scenarios side-by-side at a single time horizon. |
| `get_regulatory_submission_template` | regulatory_framework | Return structured disclosure template for the specified regulatory framework. |
| `get_ngfs_phase4_scenarios` |  | Return full NGFS Phase IV scenario library. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sector` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `SCENARIOS`, `SECTORS_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Frameworks | — | Compliance | ECB, BoE, Fed, APRA plus internal models |
| Climate Scenarios | — | NGFS | Standard scenario set used across frameworks |
| Submission Deadlines | — | Regulatory calendar | Varies by regulator and institution size |
- **Scenario parameters** → Risk model application → **P&L and capital impact estimates**
- **Multiple regulator results** → Aggregation and reconciliation → **Consolidated stress report**
- **Stress test results** → Regulatory template population → **Submission package**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/stress-test-orchestrator/ref/ngfs-phase4-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['vintage', 'published_by', 'publication_date', 'scenarios', 'scenario_count', 'temperature_range_c', 'types'], 'n_keys': 7}`

**GET /api/v1/stress-test-orchestrator/ref/regulatory-frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'framework_count', 'framework_ids', 'jurisdictions_covered'], 'n_keys': 4}`

**GET /api/v1/stress-test-orchestrator/ref/sector-risk-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sectors', 'sector_count', 'sector_ids', 'highest_carbon_intensity', 'highest_stranded_asset_risk'], 'n_keys': 5}`

**GET /api/v1/stress-test-orchestrator/ref/transmission-channels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['channels', 'channel_count', 'channel_ids', 'primary_risks'], 'n_keys': 4}`

**POST /api/v1/stress-test-orchestrator/pd-migration** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Regulatory stress test aggregation
**Headline formula:** `Combined_result = Σ(test_i × weight_i) across parallel test runs`
**Standards:** ['ECB SREP', 'BoE PRA SS3/19', 'Fed DFAST', 'APRA CPG 229']

**Engine `stress_test_orchestrator_engine` — extracted transformation lines:**
```python
pd_uplift = carbon_intensity × carbon_price_multiplier + physical_damage × physical_multiplier
stressed_PD = baseline_PD × (1 + pd_uplift / 100)
horizon_scale = min(horizon_scale + (time_horizon_year - 2030) * 0.02, 1.5)
scaled_uplift = raw_uplift * horizon_scale
stressed_pd = baseline_pd + scaled_uplift
carbon_channel_pd = (carbon_intensity / 5000) * (carbon_price_2030 / 150) * 0.4
physical_channel_pd = (physical_damage / 10) * 0.3
total_stressed_pd = max(stressed_pd + carbon_channel_pd + physical_channel_pd, 0.05)
avg_peril_multiplier = sum(perils.values()) / len(perils)
stressed_lgd = base_lgd * lgd_multiplier * (1 + physical_adj)
el_over_rwa_pct = (expected_loss_bn / rwa_bn) * 100
stressed_cet1 = baseline_cet1_pct - el_over_rwa_pct
systemic_pd_uplift = gdp_dev * 0.15 + max(unemp_shock, 0) * 0.08
el_bn = sec_exp.exposure_bn * (stressed_pd / 100) * (stressed_lgd / 100) * fw_weight
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `sovereign-swf` | table:sector |