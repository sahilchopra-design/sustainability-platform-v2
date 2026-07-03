# Digital MRV Platform
**Module ID:** `digital-mrv` · **Route:** `/digital-mrv` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Digital Measurement, Reporting, and Verification for GHG emissions. Covers IoT sensor integration, automated data collection, third-party verification workflow, and registry connectivity.

> **Business value:** Digital MRV is transforming GHG accounting from annual surveys to continuous measurement. High-frequency verified data enables real-time emission monitoring, more credible carbon credits, and reduced assurance costs. Critical for project-level carbon credit issuance under VCS, Gold Standard, and Article 6.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `METHODS`, `PROJECT_NAMES`, `SENSOR_TYPES`, `STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODS` | `['Satellite','IoT','AI','Hybrid','Satellite+IoT','AI+Satellite'];` |
| `PROJECT_NAMES` | `['Amazon Reforestation','Borneo Palm Oil','Gujarat Solar Farm','Nairobi Wind Park','Lagos Waste-to-Energy','Bogota Transit','Mekong Delta Mangrove','B` |
| `genVerifiedCerts` | `()=>Array.from({length:20},(_,i)=>({id:i+1,project:PROJECT_NAMES[i],method:METHODS[Math.floor(sr(i*163)*METHODS.length)],verifiedMt:+(sr(i*167)*4+0.5)` |
| `badge` | `(text,color)=>({display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,fontFamily:T.font,background:color==='green'?'#dc` |
| `tot` | `projects.reduce((a,p)=>a+p.verified,0);` |
| `avgAcc` | `projects.length?projects.reduce((a,p)=>a+parseFloat(p.accuracy),0)/projects.length:0;` |
| `avgConf` | `projects.length?projects.reduce((a,p)=>a+parseFloat(p.confidence),0)/projects.length:0;` |
| `satCov` | `satSites.length?satSites.filter(s=>s.status!=='Critical').length/satSites.length*100:0;` |
| `costSav` | `certs.reduce((a,c)=>a+(c.tradCost-c.digiCost),0);` |
| `avgTurn` | `certs.length?certs.reduce((a,c)=>a+c.digiDays,0)/certs.length:0;` |
| `typeCounts` | `SENSOR_TYPES.map(t=>({name:t,count:sensors.filter(s=>s.type===t).length}));` |
| `avgQuality` | `(sensors.reduce((a,s)=>a+parseFloat(s.dataQuality),0)/sensors.length).toFixed(1);` |
| `avgCoverage` | `(sensors.reduce((a,s)=>a+parseFloat(s.coverage),0)/sensors.length).toFixed(1);` |
| `costData` | `certs.slice(0,10).map(c=>({name:c.project.split(' ')[0],traditional:c.tradCost,digital:c.digiCost}));` |
| `timeData` | `certs.slice(0,10).map(c=>({name:c.project.split(' ')[0],traditional:c.tradDays,digital:c.digiDays}));` |
| `ruleOptions` | `['Cross-reference satellite + IoT','AI anomaly detection','Historical baseline comparison','Peer verification','Statistical threshold check','Blockcha` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `METHODS`, `PROJECT_NAMES`, `SENSOR_TYPES`, `STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IoT Data Frequency | — | Sensor spec | High-frequency measurement vs annual survey |
| MRV Quality | — | Standard | Level 1 = highest certainty; Level 3 = estimated |
- **IoT sensor data** → Emission calculation → **Verified GHG inventory**
- **GHG inventory** → Third-party audit → **Verified emission statement**
- **Verified emissions** → Credit issuance → **Carbon credit registry entry**

## 5 · Intermediate Transformation Logic
**Methodology:** Digital MRV pipeline
**Headline formula:** `Verified_emission = Raw_sensor × (1 - Uncertainty) × GWP; MRV = Measure + Report + Verify`
**Standards:** ['ISO 14064', 'VERRA VCS', 'Gold Standard MRV']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).