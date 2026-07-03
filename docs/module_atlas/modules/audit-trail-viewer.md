# Audit Trail Viewer
**Module ID:** `audit-trail-viewer` · **Route:** `/audit-trail-viewer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Platform-wide audit log viewer. All user actions, data changes, score modifications, and report generations recorded with timestamp, user ID, and change detail. ISAE 3000 assurance-ready.

> **Business value:** External assurance on sustainability reporting requires comprehensive audit trails. This viewer enables assurance providers to trace any disclosed metric back to its source data, supporting both limited and reasonable assurance under ISAE 3000 and ISAE 3410.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTION_TYPES`, `AUDIT_EVENTS`, `CALC_AUDITS`, `CHANGE_HEATMAP`, `COLORS`, `COLUMNS_BY_TABLE`, `COMPLIANCE_MODULES`, `DATA_CHANGES`, `ENGINES`, `ENTITY_TYPES`, `SEVERITY_LEVELS`, `TABLES`, `TABS`, `USER_NAMES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `ENGINES` | `['E1-EmissionsCalculator','E2-ScopeMapper','E3-CarbonFootprint','E4-WaterRisk','E5-BiodiversityImpact','E6-ClimatePolicyScorer','E7-ESGRatingEngine','` |
| `action` | `ACTION_TYPES[Math.floor(sr(i*3)*10)];` |
| `entityType` | `ENTITY_TYPES[Math.floor(sr(i*7)*10)];` |
| `user` | `USER_NAMES[Math.floor(sr(i*11)*20)];` |
| `entityId` | ``${entityType.toUpperCase().slice(0,3)}-${String(Math.floor(sr(i*29)*9000+1000)).padStart(5,'0')}`;` |
| `oldVal` | `action==='edit'?`${(sr(i*31)*100).toFixed(2)}`:null;` |
| `newVal` | `action==='edit'?`${(sr(i*37)*100).toFixed(2)}`:null;` |
| `engine` | `ENGINES[Math.floor(sr(i*100)*25)];` |
| `table` | `TABLES[Math.floor(sr(i*200)*20)];` |
| `col` | `cols[Math.floor(sr(i*203)*cols.length)];` |
| `changeType` | `['manual','import','calculation','system','api'][Math.floor(sr(i*207)*5)];` |
| `CHANGE_HEATMAP` | `TABLES.map((table,ti)=>{` |
| `eventsByAction` | `useMemo(()=>ACTION_TYPES.map(a=>({name:a,count:AUDIT_EVENTS.filter(e=>e.action===a).length})),[]);` |
| `eventsByEntity` | `useMemo(()=>ENTITY_TYPES.map(t=>({name:t,count:AUDIT_EVENTS.filter(e=>e.entityType===t).length})),[]);` |
| `eventTimeline` | `useMemo(()=>Array.from({length:24},(_,i)=>({hour:`${String(i).padStart(2,'0')}:00`,events:AUDIT_EVENTS.filter(e=>+e.timestamp.slice(11,13)===i).length` |
| `severityDist` | `useMemo(()=>['info','warning','critical'].map(s=>({name:s,count:AUDIT_EVENTS.filter(e=>e.severity===s).length})),[]);` |
| `calcSuccessRate` | `useMemo(()=>Math.round(CALC_AUDITS.filter(c=>c.status==='Success').length/ Math.max(1, CALC_AUDITS.length)*100),[]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTION_TYPES`, `COLORS`, `ENGINES`, `ENTITY_TYPES`, `SEVERITY_LEVELS`, `TABLES`, `TABS`, `USER_NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Log Retention | — | Default | Configurable; SOX requires 7yr minimum |
| Coverage | — | Platform | All data modification events captured |
- **Platform write operations** → Audit event capture → **Immutable audit log**
- **Audit log** → Assurance review → **ISAE 3000 evidence pack**

## 5 · Intermediate Transformation Logic
**Methodology:** Immutable audit log
**Headline formula:** `AuditRecord = {timestamp, user, action, entity, before, after, reason}`
**Standards:** ['ISAE 3000', 'SOX Section 302/906', 'GDPR Article 5']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).