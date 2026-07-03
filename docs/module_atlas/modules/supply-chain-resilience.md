# Supply Chain Resilience
**Module ID:** `supply-chain-resilience` · **Route:** `/supply-chain-resilience` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate and ESG resilience assessment of supply chains. Covers geographic concentration, single-source dependencies, climate hazard exposure of supplier locations, and near-shoring options.

> **Business value:** Supply chain disruptions — from COVID-19 to the Ever Given to Flooding in Thailand — show the financial impact of supply concentration risk. Climate change compounds this with physical hazards at supplier locations. This module enables proactive resilience planning and scenario-based disruption modelling.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `COUNTRY_HAZARD_MAP`, `DISRUPTION_HISTORY`, `HAZARDS`, `KPI`, `NODES`, `NODE_TYPES`, `QUARTERS`, `SECTORS`, `SECTOR_VULN`, `ScoreBar`, `Tab1`, `Tab2`, `Tab3`, `Tab4`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `HAZARDS` | `['Flood','Cyclone','Drought','Heatwave','Wildfire','Sea-Level Rise','Permafrost Thaw','Water Stress'];` |
| `type` | `NODE_TYPES[Math.floor(sr(i*41)*4)];` |
| `throughput` | `Math.round(100+sr(i*67)*900);` |
| `substitutability` | `Math.round(10+sr(i*83)*90);` |
| `resilience` | `Math.round(15+sr(i*29)*80);` |
| `hazards` | `HAZARDS.map((h,j)=>({name:h,score:Math.round(5+sr(i*100+j*13)*90)}));` |
| `historicalDisruptions` | `Math.floor(sr(i*59)*8);` |
| `measuresInPlace` | `adaptationMeasures.filter((_,mi)=>sr(i*200+mi*7)>0.55);` |
| `criticality` | `Math.round((throughput/10)*(100-substitutability)/100);` |
| `companyLinks` | `Array.from({length:Math.floor(1+sr(i*37)*4)},(_,ci)=>Math.floor(sr(i*300+ci*19)*60));` |
| `DISRUPTION_HISTORY` | `QUARTERS.map((q,qi)=>({quarter:q,events:Math.floor(2+sr(qi*77)*12),costM:Math.round(10+sr(qi*33)*200),avgRecoveryDays:Math.round(5+sr(qi*55)*45),affec` |
| `COUNTRY_HAZARD_MAP` | `COUNTRIES.map((c,ci)=>{const row={country:c};HAZARDS.forEach((h,hi)=>{row[h]=Math.round(5+sr(ci*100+hi*17)*90);});row.composite=Math.round(HAZARDS.red` |
| `SECTOR_VULN` | `SECTORS.map((s,si)=>({sector:s,vulnerability:Math.round(20+sr(si*61)*75),exposure:Math.round(15+sr(si*43)*80),adaptationGap:Math.round(10+sr(si*89)*60` |
| `pill` | `{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontFamily:T.mono,fontWeight:600};` |
| `distData` | `useMemo(()=>{const bins=Array.from({length:10},(_,i)=>({range:`${i*10}-${i*10+10}`,count:0}));nodes.forEach(n=>{const bi=Math.min(Math.floor(n.resilie` |
| `top10` | `useMemo(()=>[...nodes].sort((a,b)=>a.resilience-b.resilience).slice(0,10),[nodes]);` |
| `avgResilience` | `Math.round(nodes.reduce((s,n)=>s+n.resilience,0)/ Math.max(1, nodes.length));` |
| `affectedCompanies` | `[...companySet].map(ci=>{const co=COMPANIES[ci];const revImpact=Math.round(co.revenue*severity*0.03*(duration/30));return{...co,revImpact,recoveryDays` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/supply-chain/scope3/calculate` | `calculate_scope3` | api/v1/routes/supply_chain.py |
| POST | `/api/v1/supply-chain/scope3/sbti-target` | `calculate_sbti_target` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/emission-factors` | `list_emission_factors` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments` | `list_scope3_assessments` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments/{assessment_id}` | `get_scope3_assessment` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets` | `list_sbti_targets` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets/{target_id}` | `get_sbti_target` | api/v1/routes/supply_chain.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `base` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `emission_factor_library` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sbti_targets` *(shared)*, `sbti_trajectories` *(shared)*, `scope3_activities` *(shared)*, `scope3_assessments` *(shared)*, `sqlalchemy` *(shared)*, `this` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COUNTRIES`, `HAZARDS`, `NODE_TYPES`, `QUARTERS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| HHI Concentration | — | Herfindahl | Supply country concentration (>0.25 = highly concentrated) |
| Single-Source Dependencies | — | Assessment | Components with only one qualified supplier |
| Climate Hazard Exposure | — | IPCC overlay | Proportion of supply base in climate-risk locations |
- **Supplier database** → Concentration calculation → **Supply chain resilience score**
- **Supplier locations** → Climate hazard overlay → **Physical risk exposure per supplier**
- **Business continuity data** → Resilience assessment → **Vulnerability and resilience gaps**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/supply-chain/emission-factors** — status `passed`, provenance ['real-db'], source tables: `emission_factor_library`
Output: `{'type': 'object', 'keys': ['total_count', 'filters_applied', 'factors', 'validation_summary'], 'n_keys': 4}`

**GET /api/v1/supply-chain/scope3/assessments** — status `passed`, provenance ['real-db'], source tables: `scope3_assessments`
Output: `{'type': 'object', 'keys': ['assessments', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `scope3_assessments`
Output: `None`

**GET /api/v1/supply-chain/scope3/sbti-targets** — status `passed`, provenance ['real-db'], source tables: `sbti_targets`
Output: `{'type': 'object', 'keys': ['targets', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/sbti-targets/{target_id}** — status `failed`, provenance ['db-empty'], source tables: `sbti_targets`
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Supply chain resilience scoring
**Headline formula:** `Resilience = Diversification × ClimateAdaptation × BusinessContinuity / SupplyConcentration`
**Standards:** ['ISO 22301', 'WEF Supply Chain Risk', 'IPCC AR6 supply chain impacts']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **90** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-network-viz` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-contagion` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-carbon` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-emissions-mapper` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-map` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-labor-climate` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-esg-hub` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `insurance-climate-hub` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `insurance-transition` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:datetime, table:db, table:exc, table:sqlalchemy |