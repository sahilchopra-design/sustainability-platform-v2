# Water Risk Analytics
**Module ID:** `water-risk-analytics` · **Route:** `/water-risk-analytics` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Detailed water stress, scarcity, quality and flood analytics platform providing granular basin-level assessment integrating WRI Aqueduct, GEMS/Water quality data and IPCC hydrology projections.

> **Business value:** Freshwater quality degradation affects 40% of global river length (UN 2023); combined stress and quality risk is most acute in South Asia, North Africa and Northern China where industrial and agricultural demand converges.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `BASIN_COUNTRY`, `REGIONS`, `TABS`, `WRI_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TABS` | `['Water Risk Dashboard','Regional Analysis','Corporate Exposure','Projections'];const RISKF=['All','Extremely High','High','Medium-High','Medium','Low` |
| `names` | `['Ganges Basin','Indus Basin','Yellow River','Yangtze Delta','Mekong Delta','Nile Valley','Murray-Darling','Colorado Basin','California Central','Sao ` |
| `stressLevel` | `+(sr(i*7)*4+1).toFixed(1);const riskCat=stressLevel>4?'Extremely High':stressLevel>3?'High':stressLevel>2.5?'Medium-High':stressLevel>1.5?'Medium':'Lo` |
| `supply` | `Math.round(sr(i*11)*500+10);const demand=Math.round(supply*(sr(i*13)*0.5+0.6));const deficit=stressLevel>3?Math.max(supply*0.1,demand-supply):Math.max` |
| `floodRisk` | `Math.round(sr(i*17)*100);const droughtRisk=Math.round(sr(i*19)*100);const pollutionIdx=Math.round(sr(i*23)*100);const groundwater=Math.round(sr(i*29)*` |
| `yearly` | `Array.from({length:6},(_,y)=>({year:2020+y,stress:+(stressLevel+y*0.08+sr(i*100+y)*0.3).toFixed(1),supply:Math.round(supply-y*5+sr(i*100+y*3)*10),dema` |
| `WRI_MAP` | `Object.fromEntries((WRI_AQUEDUCT_WATER_RISK\|\|[]).map(c=>[c.country,c]));` |
| `REGIONS` | `isIndiaMode() ? adaptForWaterRisk().map((c, i) => ({` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>{const d=Math.max(1,filtered.length);return{count:filtered.length,avgStress:(filtered.reduce((s,r)=>s+r.waterStress,0)/d).toFixed(1),extre` |
| `riskDist` | `useMemo(()=>['Extremely High','High','Medium-High','Medium','Low'].map(r=>({name:r,value:REGIONS.filter(reg=>reg.riskCategory===r).length})),[]);` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.m` |
| `rBdg` | `r=>({color:r==='Extremely High'?T.red:r==='High'?T.amber:r==='Medium-High'?T.gold:r==='Medium'?T.sage:T.green,fontWeight:600,fontSize:11});` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/water-risk/aqueduct-risk` | `aqueduct_risk` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/cdp-water` | `cdp_water` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/esrs-e3` | `esrs_e3` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/tnfd-water-dependency` | `tnfd_water_dependency` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/water-footprint` | `water_footprint` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/financial-impact` | `financial_impact` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/physical-risk-scenarios` | `physical_risk_scenarios` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/materiality` | `materiality` | api/v1/routes/water_risk.py |
| GET | `/api/v1/water-risk/ref/risk-tiers` | `ref_risk_tiers` | api/v1/routes/water_risk.py |
| GET | `/api/v1/water-risk/ref/cdp-methodology` | `ref_cdp_methodology` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/assess` | `assess_water_risk_endpoint` | api/v1/routes/water_stewardship.py |
| POST | `/api/v1/water-risk/stewardship-target` | `stewardship_target_endpoint` | api/v1/routes/water_stewardship.py |
| GET | `/api/v1/water-risk/ref/aqueduct-benchmarks` | `get_aqueduct_benchmarks` | api/v1/routes/water_stewardship.py |
| GET | `/api/v1/water-risk/ref/cdp-criteria` | `get_cdp_criteria` | api/v1/routes/water_stewardship.py |
| GET | `/api/v1/water-risk/ref/aws-standard` | `get_aws_standard` | api/v1/routes/water_stewardship.py |
| GET | `/api/v1/water-risk/ref/stewardship-bond` | `get_stewardship_bond_framework` | api/v1/routes/water_stewardship.py |

### 2.3 Engine `water_risk_engine` (services/water_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `WaterRiskEngine.assess_aqueduct_risk` | entity_id, country_code, sector, basin_name, indicator_scores | WRI Aqueduct 4.0 — 7 physical risk indicators on 0-5 scale. |
| `WaterRiskEngine.assess_cdp_water` | entity_id, governance_score, risk_score, target_score | CDP Water Security questionnaire scoring. |
| `WaterRiskEngine.assess_esrs_e3` | entity_id, withdrawal_m3_pa, consumption_m3_pa, discharge_m3_pa, recycled_pct, water_stress_areas_disclosed | CSRD ESRS E3 mandatory water disclosure completeness and compliance. |
| `WaterRiskEngine.assess_tnfd_water_dependency` | entity_id, sector, value_chain_stage, dependency_score | TNFD ENCORE-based water dependency assessment. |
| `WaterRiskEngine.calculate_water_footprint` | entity_id, product_name, annual_volume, sector, blue_m3_per_unit, green_m3_per_unit | Water footprint accounting: Blue (surface/ground), Green (rain), Grey (dilution). |
| `WaterRiskEngine.assess_financial_impact` | entity_id, water_stress_score, annual_revenue_usd, withdrawal_m3_pa | Financial materiality of water risk: revenue-at-risk, compliance costs, |
| `WaterRiskEngine.assess_physical_risk_scenarios` | entity_id, country_code, sector | IPCC AR6 RCP 2.6/4.5/8.5 physical water risk projections per country. |
| `WaterRiskEngine.compute_overall_water_materiality` | entity_id, aqueduct_score, cdp_score, esrs_score, tnfd_score, ceo_water_mandate_score | Aggregated water materiality score across four frameworks. |

### 2.3 Engine `water_stewardship_engine` (services/water_stewardship_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_seed_float` | entity_id, key, lo, hi | Deterministic seeded float — reproducible demo data without randomness. |
| `_normalise` | value, lo, hi | Map a raw value to 0-100 normalised score (higher = higher risk). |
| `_aqueduct_composite` | data, eid | Compute AQUEDUCT 4.0 weighted composite risk score 0-100. |
| `_tier` | score |  |
| `_cdp_grade` | composite |  |
| `_tnfd_disclosure_score` | data | Score TNFD E3 disclosure completeness 0-100. |
| `assess_water_risk` | request_data | Full water risk and stewardship assessment per: |
| `create_stewardship_target` | request_data | Create and validate a water stewardship target against SBTN, CDP, and AWS criteria. |
| `get_benchmark_data` |  | Return all reference data: AQUEDUCT basins, CDP criteria, TNFD E3, AWS, CEO WM, bond framework. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Basins Assessed | — | WRI Aqueduct | Number of HydroBASINS level-6 catchments with full CWRI assessment. |
| Critical Quality Hotspots | — | GEMS/Water | Catchments with combined high stress and poor water quality requiring operational water treatment investment. |
| 2050 Stress Increase | — | IPCC AR6 | Projected increase in population-weighted water stress by 2050 under SSP2-4.5 scenario. |
- **WRI Aqueduct Geodata, GEMS/Water Quality, Flood Hazard Maps, IPCC Projections** → Multi-source integration + CWRI computation + scenario projection → **Detailed water risk analytics, basin-level reports, ESRS E3/TNFD disclosures, CDP Water package**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/water-risk/ref/cdp-methodology** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scoring_weights', 'grade_thresholds', 'a_list_threshold', 'source', 'disclosure_cycle'], 'n_keys': 5}`

**GET /api/v1/water-risk/ref/risk-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scale', 'tiers', 'source', 'indicators'], 'n_keys': 4}`

**POST /api/v1/water-risk/aqueduct-risk** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/water-risk/cdp-water** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/water-risk/esrs-e3** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Water Risk Index
**Headline formula:** `CWRI = 0.4 × Stress + 0.25 × Quality + 0.2 × FloodRisk + 0.15 × Regulatory`
**Standards:** ['WRI Aqueduct 4.0', 'GEMS/Water Quality Database', 'IPCC AR6 WG1 Chapter 8']

**Engine `water_risk_engine` — extracted transformation lines:**
```python
country_base = round(base_mult * 5.0, 2)
gap_to_a_list = round(max(0.0, 80.0 - cdp_weighted), 2)
efficiency_ratio = round(consumption_m3_pa / withdrawal_m3_pa, 4) if withdrawal_m3_pa > 0 else 0.0
disclosure_score = round(sum(components.values()) / len(components) * 100, 2)
total_m3 = round(blue_m3 + green_m3 + grey_m3, 3)
annual_total = round(total_m3 * annual_volume, 1)
water_scarcity_adjusted = round(annual_total * stress_multiplier, 1)
revenue_at_risk_pct = round(min(water_stress_score * 0.6, 3.0), 3)
revenue_at_risk_usd = round(annual_revenue_usd * revenue_at_risk_pct / 100.0, 0)
compliance_cost_usd_pa = round(withdrawal_m3_pa * 0.05, 0)
capex_resilience_usd = round(revenue_at_risk_pct / 100.0 * annual_revenue_usd * 0.3, 0)
insurance_premium_uplift_pct = round(water_stress_score * 1.5, 2)
stress_norm = water_stress_score / 5.0 if water_stress_score <= 5.0 else 1.0
aqueduct_norm = round((aqueduct_score / 5.0) * 100.0, 2)
```

**Engine `water_stewardship_engine` — extracted transformation lines:**
```python
span = max(hi - lo, 1e-9)
cdp_composite = cdp_gov * 0.25 + cdp_risk * 0.25 + cdp_tgt * 0.25 + cdp_perf * 0.25
cdp_composite = min(cdp_composite * 1.04, 1.0)
aws_overall = (aws_wb + aws_gov + aws_sws + aws_eng + aws_out) / 5.0
aws_pct     = round(aws_overall * 100.0, 1)
opex_risk_m   = round(opex_m * (stress_mult - 1.0), 2)
reg_risk_m    = round(assets_m * (rev_pct / 100.0) * 0.032 * stress_mult, 2)
strand_risk_m = round(assets_m * (rev_pct / 100.0) * 0.048 * (aq_score / 100.0), 2)
total_fin_m   = round(opex_risk_m + reg_risk_m + strand_risk_m, 2)
governance_bonus = round((cdp_composite * 0.50 + aws_overall * 0.50) * 22.0, 2)
risk_score = round(min(max(aq_score - governance_bonus, 0.0), 100.0), 1)
years     = max(tgt_yr - base_yr, 1)
target_ml = round(base_ml * (1.0 - red_pct / 100.0), 1)
annual_ml = round((base_ml - target_ml) / years, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `water_risk_engine` (used by 2 modules), `water_stewardship_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `water-risk` | engine:water_risk_engine, engine:water_stewardship_engine |