# Data Source Manager
**Module ID:** `data-source-manager` · **Route:** `/data-source-manager` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised registry for all ESG data providers, covering licensing terms, API credentials, rate limits, and data refresh schedules. Administrators configure provider priority rankings that feed the reconciliation engine. Real-time connectivity status and usage telemetry are displayed per source.

> **Business value:** Gives data operations teams a single control plane for all ESG data sources, ensuring credentials, licenses, and schedules are actively managed. Reliable provider configuration underpins the accuracy and completeness of every downstream analytics and disclosure module.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENGINE_LINEAGE`, `EngineLineageTab`, `LiveApiTesterTab`, `PIPELINE_TEMPLATES`, `SOURCES`, `SOURCE_FIELDS`, `SourceRegistryTab`, `StatusBadge`, `SyncMonitorTab`, `TARGET_TABLES`, `TEST_SCENARIOS`, `TRANSFORM_TYPES`, `TransformPipelineTab`, `VisualFieldMapperTab`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtNum` | `(n)=>{if(typeof n!=='number')n=Number(n);if(isNaN(n))return String(n);if(n>=1e12)return(n/1e12).toFixed(1)+'T';if(n>=1e9)return(n/1e9).toFixed(1)+'B';` |
| `fmtDate` | `(iso)=>{if(!iso)return'\u2014';const d=new Date(iso);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' '+d.toLocaleT` |
| `similarity` | `(a,b)=>{const al=a.toLowerCase().replace(/[^a-z0-9]/g,''),bl=b.toLowerCase().replace(/[^a-z0-9]/g,'');const maxLen=Math.max(al.length,bl.length);if(ma` |
| `base` | `SOURCES.findIndex(s=>s.id===sourceId)*13;` |
| `severity` | `sr(base+i*7)>0.7?'ERROR':sr(base+i*7)>0.3?'WARN':'INFO';` |
| `mappedSrc` | `useMemo(()=>new Set(mappings.map(m=>m.sourceField)),[mappings]);` |
| `mappedTgt` | `useMemo(()=>new Set(mappings.map(m=>m.targetField)),[mappings]);` |
| `unmappedSrc` | `srcFields.length-mappedSrc.size;` |
| `unmappedTgt` | `tgtFields.length-mappedTgt.size;` |
| `coverage` | `tgtFields.length>0?Math.round(mappedTgt.size/tgtFields.length*100):0;` |
| `config` | `{source:selectedSource,target:selectedTarget,mappings:mappings.map(m=>({source_field:m.sourceField,target_column:m.targetField,transform:m.transform,c` |
| `blob` | `new Blob([JSON.stringify(config,null,2)],{type:'application/json'});` |
| `midX` | `(sp.x+tp.x)/2;` |
| `base` | `scenarioId.split('').reduce((a,c)=>a+c.charCodeAt(0),0);` |
| `statusCode` | `sr(base*3)>0.85?500:sr(base*7)>0.9?400:200;` |
| `responseTime` | `Math.floor(40+sr(base*11)*350);` |
| `headers` | `{'Content-Type':'application/json','X-RateLimit-Remaining':String(Math.floor(sr(base*13)*500)),'X-RateLimit-Limit':'1000','X-Request-Id':'req_'+String` |
| `delay` | `800+sr(selectedScenario.length)*1200;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENGINE_LINEAGE`, `PIPELINE_TEMPLATES`, `SOURCES`, `TEST_SCENARIOS`, `TRANSFORM_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Providers | — | Provider registry | Count of data sources with valid credentials and at least one successful pull in the last 7 days |
| API Error Rate (7d) | — | API telemetry | Share of API calls returning non-200 responses across all providers |
| Avg Freshness Lag | — | Timestamp comparison | Mean difference between provider stated refresh cadence and actual delivery time |
| License Expiry <30d | — | License registry | Count of provider licenses expiring within 30 days requiring renewal action |
- **Provider API endpoints and SFTP feeds** → Credential validation, rate-limit tracking, and field mapping to canonical schema → **Connectivity status and per-provider field coverage report**
- **License management database** → Expiry date monitoring with configurable alert lead time → **License renewal queue with contract metadata**
- **API telemetry logs** → Error rate and latency aggregation by provider and endpoint → **Provider Reliability Index time series**

## 5 · Intermediate Transformation Logic
**Methodology:** Provider Reliability Index
**Headline formula:** `PRI = (1 − ErrorRate) × AvailabilityPct × FreshnessScore`
**Standards:** ['ISO/IEC 25012 Data Quality', 'PCAF Source Hierarchy']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).