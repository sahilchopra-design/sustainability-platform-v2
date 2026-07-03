# IoT Emissions Tracker
**Module ID:** `iot-emissions-tracker` · **Route:** `/iot-emissions-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time GHG emission monitoring platform ingesting data from IoT sensors deployed across industrial assets, buildings, and vehicle fleets. Converts raw sensor telemetry (energy, flow, temperature, mass) into continuous Scope 1 and Scope 2 emission streams with sub-hourly granularity. Supports automated CEMS-equivalent reporting and deviation alerting against emission reduction targets.

> **Business value:** Gives operations and sustainability teams a live view of facility-level GHG performance, enabling rapid response to emission exceedances and providing auditable continuous monitoring data for regulatory reporting and voluntary disclosure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `COUNTRIES`, `FAC_NAMES`, `FAC_SUFFIX`, `INDUSTRIES`, `SENSOR_TYPES`, `SENSOR_UNITS`, `TabBtn`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SENSOR_UNITS` | `['ppm','ppm-m','mg/m3','\u00b0C','m3/h','vol%','km/h','kWh'];` |
| `ind` | `INDUSTRIES[Math.floor(sr(i*3)*12)];` |
| `sensorCt` | `Math.floor(sr(i*13)*6)+2;` |
| `emRate` | `Math.round((sr(i*17)*8+0.5)*100)/100;` |
| `fIdx` | `Math.floor(i*60/200);` |
| `typeIdx` | `Math.floor(sr(i*7)*8);` |
| `totalEmissions` | `useMemo(()=>facilities.reduce((a,f)=>a+f.scope1+f.scope2+f.scope3,0),[]);` |
| `avgQuality` | `Math.round(sensors.reduce((a,s)=>a+s.dataQuality,0)/sensors.length*10)/10;` |
| `rows` | `facilities.map(f=>[f.name,f.industry,f.country,f.city,f.scope1,f.scope2,f.scope3,` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `compData` | `compareFacilities.map(f=>({` |
| `fHourly` | `hourlyData.map((h,i)=>({` |
| `mfrCounts` | `{};sensors.forEach(s=>{mfrCounts[s.manufacturer]=(mfrCounts[s.manufacturer]\|\|0)+1;});` |
| `mfrData` | `Object.entries(mfrCounts).map(([m,c])=>({name:m,count:c})).sort((a,b)=>b.count-a.count);` |
| `industryBenchmarks` | `INDUSTRIES.map((ind,i)=>({` |
| `forecastData` | `monthlyHistory.map((m,i)=>({` |
| `rcData` | `Object.entries(rootCauseSummary).map(([k,v])=>({cause:k,count:v}));` |
| `completePct` | `filteredCompliance.length?Math.round(filteredCompliance.filter(c=>c.status==='complete').length/filteredCompliance.length*100):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `COUNTRIES`, `FAC_NAMES`, `FAC_SUFFIX`, `INDUSTRIES`, `SENSOR_TYPES`, `SENSOR_UNITS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sensor Update Frequency | — | IoT gateway configuration | Sub-hourly telemetry enabling intra-day emission trend detection |
| Data Completeness (%) | — | Internal QA threshold | Proportion of expected telemetry records received within reporting window |
| Emission Intensity (tCO2e/MWh) | — | Real-time computation | Production-normalised emission rate for operational benchmarking |
| Alert Threshold Breach Count | — | Configurable alarm rules | Number of periods exceeding set emission rate limits triggering operational review |
- **IoT sensor telemetry via MQTT / REST gateway** → Validate timestamps and unit consistency; apply QAQC flags; substitute gaps → **Clean 15-minute emission stream per asset**
- **Emission factor lookup (fuel, grid zone)** → Match asset fuel type and grid region; apply real-time marginal grid intensity where available → **Per-asset emission rate in tCO2e per interval**
- **Target baseline file** → Compare cumulative emissions to trajectory; compute variance and days-to-target breach → **Real-time target tracking dashboard and alert queue**

## 5 · Intermediate Transformation Logic
**Methodology:** Continuous Emission Monitoring
**Headline formula:** `Eᵤₜ = Σᵢ (Fᵢₜ × Cᵢₜ × MW_CO₂ / MWᵢ)`
**Standards:** ['US EPA 40 CFR Part 75 CEMS', 'ISO 14064-1:2018', 'IEC 62056 DLMS/COSEM metering standard', 'GHG Protocol Corporate Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).