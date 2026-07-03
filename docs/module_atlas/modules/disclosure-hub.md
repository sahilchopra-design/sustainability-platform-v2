# Disclosure Hub
**Module ID:** `disclosure-hub` · **Route:** `/disclosure-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised sustainability disclosure management platform aggregating all framework obligations, filing calendars, document versions, and approval workflows in one place. Supports CSRD, GRI, TCFD, SFDR, ISSB, CDP, and national regulatory filings. Status dashboards provide real-time readiness across all jurisdictions.

> **Business value:** Eliminates the risk of missed disclosure deadlines and approval gaps by centralising all framework obligations in a single managed workflow. Readiness dashboards give leadership early warning of filing risks before they become regulatory breaches.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `DATA`, `ENTITY_TYPES`, `FRAMEWORKS`, `NAMES`, `RISK_LEVELS`, `STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FRAMEWORKS` | `['CSRD/ESRS','SFDR','ISSB/IFRS S1-S2','SEC Climate','TCFD','UK SDR','EU Taxonomy','CDP'];` |
| `badgeS` | `(bg)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg});` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))` |
| `framework` | `FRAMEWORKS[Math.floor(s(17)*FRAMEWORKS.length)];const entityType=ENTITY_TYPES[Math.floor(s(23)*ENTITY_TYPES.length)];` |
| `status` | `STATUSES[Math.floor(s(29)*STATUSES.length)];const risk=RISK_LEVELS[Math.floor(s(31)*RISK_LEVELS.length)];` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `fwDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.framework]=(m[r.framework]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>1` |
| `statusDist` | `useMemo(()=>STATUSES.map(s=>({name:s,value:filtered.filter(r=>r.status===s).length})),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;` |
| `fwCompletion` | `useMemo(()=>FRAMEWORKS.map(f=>{const items=filtered.filter(r=>r.framework===f);if(!items.length)return null;return{name:f.length>14?f.slice(0,14)+'..'` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,completion:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filt` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `ENTITY_TYPES`, `FRAMEWORKS`, `NAMES`, `RISK_LEVELS`, `STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Frameworks | — | Framework registry | Count of sustainability frameworks with active filing obligations for the current entity |
| Overall DRI | — | Readiness engine | Weighted disclosure readiness index across all active frameworks; target ≥0.90 at T−30 days |
| Upcoming Filing Deadlines (30d) | — | Calendar engine | Count of framework filing deadlines occurring within the next 30 days |
| Documents Pending Approval | — | Workflow engine | Sustainability disclosure documents awaiting sign-off in the approval chain |
- **Framework obligation registry (requirements per framework per entity type)** → Applicability determination based on entity size, sector, and jurisdiction → **Personalised framework obligation list with filing deadlines**
- **Disclosure document repository** → Version control, section tagging, and completeness tracking → **Document readiness status per framework section**
- **Approval workflow engine** → Multi-level sign-off routing with escalation triggers → **Audit trail of approvals with timestamps and approver identity**

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Readiness Index
**Headline formula:** `DRI = Σ (Completed Items / Required Items × Weight) per Framework`
**Standards:** ['CSRD Article 29a', 'SFDR Article 10', 'CDP 2024 Questionnaire', 'ISSB IFRS S1/S2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).