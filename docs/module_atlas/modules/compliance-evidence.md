# Compliance Evidence Manager
**Module ID:** `compliance-evidence` · **Route:** `/compliance-evidence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages the collection, versioning, and audit trail of evidence artefacts required for regulatory compliance filings across CSRD, SFDR, ISSB, GRI, and FCA climate disclosures. Provides workflow tracking, completeness scoring, and deadline management for evidence submission cycles.

> **Business value:** Enables compliance and sustainability teams to maintain a defensible, audit-ready evidence repository for all active regulatory filings, reducing last-minute gaps and providing external assurers with a complete chain-of-custody record.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_REGULATIONS`, `AUTO_SCAN_KEYS`, `Badge`, `EVIDENCE_CATEGORIES`, `LS_AUDITS`, `LS_EVIDENCE`, `LS_PORTFOLIO`, `PIE_COLORS`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `seededRandom` | `seed => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `fmtDate` | `d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '\u2014';` |
| `uid` | `() => 'EVI-' + Date.now() + '-' + sr(_uidSeed++).toString(36).slice(2, 6);` |
| `daysAgo` | `Math.floor(sr(h, 1) * 60);` |
| `cats` | `new Set(evidence.map(e => e.category_id));` |
| `regs` | `new Set(evidence.map(e => e.regulation));` |
| `avgDays` | `evidence.reduce((s, e) => s + (Date.now() - new Date(e.collected_at).getTime()) / 86400000, 0) / (evidence.length \|\| 1);` |
| `autoPct` | `evidence.length ? Math.round(evidence.filter(e => e.collection_type === 'auto').length / evidence.length * 100) : 0;` |
| `lastAudit` | `audits.length ? [...audits].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null;` |
| `avgQuality` | `evidence.length ? Math.round(evidence.reduce((s, e) => s + e.quality_score, 0) / evidence.length) : 0;` |
| `avgDays` | `items.length ? Math.round(items.reduce((s, e) => s + (Date.now() - new Date(e.collected_at).getTime()) / 86400000, 0) / items.length) : 0;` |
| `completeness` | `items.length ? Math.round(items.length / 4 * 25) : 0; // 4 sources = 100%` |
| `freshness` | `items.length ? Math.round(100 - items.reduce((s, e) => s + Math.min(60, (Date.now() - new Date(e.collected_at).getTime()) / 86400000), 0) / items.leng` |
| `coverage` | `items.length ? Math.round(new Set(items.map(e => e.regulation)).size / cat.regulations.length * 100) : 0;` |
| `rows` | `[keys.join(','), ...data.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))];` |
| `blob` | `new Blob([rows.join('\n')], { type:'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_REGULATIONS`, `AUTO_SCAN_KEYS`, `EVIDENCE_CATEGORIES`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Evidence Completeness | — | Internal tracking | Percentage of required disclosure evidence items submitted with adequate quality rating |
| Outstanding Items | — | Regulatory mapping | Number of evidence items required but not yet submitted or verified |
| Average Quality Score | — | Quality classification | Average quality weight across all submitted evidence; target >0.7 for regulator confidence |
| Deadline Proximity | — | Regulatory calendar | Days to next filing deadline for each active disclosure framework |
| Audit Trail Completeness | — | Version control system | Proportion of submitted evidence items with complete chain-of-custody documentation |
- **Regulatory requirement mapping databases** → Parse ESRS/SFDR/ISSB requirement trees, generate item checklist → **Required evidence item register per regulation**
- **Document management system** → Version-control uploads, assign quality weights, record preparer → **Evidence artefact repository with audit trail**
- **Calendar/deadline engine** → Map reporting periods to filing dates, compute days remaining → **Deadline proximity and completeness dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Compliance Completeness Score
**Headline formula:** `Completeness = (EvidenceItems_Submitted / EvidenceItems_Required) × Quality_Weight`
**Standards:** ['CSRD Delegated Regulation', 'SFDR RTS', 'ISSB IFRS S1/S2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).