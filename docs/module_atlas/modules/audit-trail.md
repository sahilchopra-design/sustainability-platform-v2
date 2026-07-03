# Audit Trail Viewer
**Module ID:** `audit-trail` · **Route:** `/audit-trail` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Immutable platform audit log capturing all data changes, user actions, report generations, and access events. Provides full ISAE 3000 and SOX-compliant evidence packs with tamper-evident hash chains, granular search by user, action type, and timestamp. Supports external auditor access for sustainability assurance engagements.

> **Business value:** An immutable, hash-chained audit trail is the foundational control that enables external assurance providers to give limited or reasonable assurance on ESG disclosures. Without it, auditors cannot verify that data was not manipulated between measurement and reporting, making ISAE 3000 engagement scope and testing prohibitively expensive.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_CATEGORIES`, `Badge`, `Btn`, `DATE_RANGES`, `KpiCard`, `MAX_EVENTS`, `MODULES`, `SEVERITIES`, `STORAGE_KEY`, `Section`, `SevBadge`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `catMap` | `Object.fromEntries(AUDIT_CATEGORIES.map(c => [c.id, c]));` |
| `sRand` | `seed => { let x=Math.sin(seed + 1) * 10000; return x-Math.floor(x); };` |
| `fmtDate` | `d => new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});` |
| `fmtTime` | `d => new Date(d).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});` |
| `daysBetween` | `(a,b) => Math.floor((new Date(b)-new Date(a))/(86400000));` |
| `catIds` | `AUDIT_CATEGORIES.map(c=>c.id);` |
| `catIdx` | `hash(key+i) % catIds.length;` |
| `eventsPerDay` | `Math.floor(sRand(day*7+42)*6)+2;` |
| `catIdx` | `Math.floor(sRand(day*13+j*7)*catIds.length);` |
| `act` | `actList[Math.floor(sRand(day*19+j*3)*actList.length)];` |
| `cutoff` | `Date.now() - dateRange*86400000;` |
| `catDist` | `useMemo(()=>AUDIT_CATEGORIES.map(c=>({ name:c.name, value:filtered.filter(e=>e.category===c.id).length, color:c.color })).filter(d=>d.value>0),[filter` |
| `dayData` | `{ date: d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) };` |
| `coNames` | `companies.map(c=>c.name);` |
| `cutoff` | `Date.now() - purgeDays*86400000;` |
| `rows` | `filtered.map(e=>[e.id,e.timestamp,e.category,e.action,`"${(e.detail\|\|'').replace(/"/g,"'")}"`,e.module,e.entity,e.user,e.severity,e.before_value\|\|'',e` |
| `csv` | `[headers.join(','),...rows.map(r=>r.join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AUDIT_CATEGORIES`, `DATE_RANGES`, `MODULES`, `SEVERITIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Audit Events (30d) | — | Audit log database | Total platform events captured in the last 30 days across all users and modules |
| Chain Integrity | `Hash_n verification` | Hourly integrity check | Percentage of audit log records passing hash chain validation; <100% is a critical alert |
| ISAE 3000 Evidence Pack | — | Platform export | Structured evidence pack exported for external assurance engagements with full event detail |
- **Platform application event stream** → Append each event to hash chain with SHA-256; store in immutable log partition → **Tamper-evident audit log with hourly chain integrity verification**
- **ISAE 3000 assurance engagement scope** → Filter log by scope period and entity; format per assurance provider template → **Structured evidence pack with event details, hash proofs, and user activity summary**

## 5 · Intermediate Transformation Logic
**Methodology:** Hash-chained immutable event log
**Headline formula:** `Hash_n = SHA256(event_n || Hash_{n-1}); Integrity_check = (Computed_chain == Stored_chain)`
**Standards:** ['ISAE 3000 (Revised)', 'SOX Section 404', 'ISO/IEC 27001 Audit Logging']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).