# Regulatory Deadline Tracker
**Module ID:** `regulatory-deadline-tracker` · **Route:** `/regulatory-deadline-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Compliance deadline monitoring tool for ESG reporting obligations, providing real-time status tracking, owner assignment, and escalation workflows.

> **Business value:** Provides compliance teams with a systematic workflow tool to manage ESG regulatory deadlines, prevent missed filings, and maintain audit-ready completion records.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FRAMEWORKS`, `JURISDICTIONS`, `PRIORITIES`, `REQUIREMENTS`, `REQ_NAMES`, `RESPONSIBLE`, `STATUSES`, `TODAY`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TODAY` | `new Date('2026-04-07');` |
| `frameworkIdx` | `Math.floor(sr(i * 7) * FRAMEWORKS.length);` |
| `jurIdx` | `Math.floor(sr(i * 11) * JURISDICTIONS.length);` |
| `statusIdx` | `Math.floor(sr(i * 13) * STATUSES.length);` |
| `priorityIdx` | `Math.floor(sr(i * 17) * PRIORITIES.length);` |
| `respIdx` | `Math.floor(sr(i * 19) * RESPONSIBLE.length);` |
| `month` | `Math.floor(1 + sr(i * 23) * 23) % 24;` |
| `year` | `2026 + Math.floor(month / 12);` |
| `mon` | `(month % 12) + 1;` |
| `day` | `Math.floor(1 + sr(i * 29) * 27);` |
| `deadline` | ``${year}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;` |
| `gapCount` | `STATUSES[statusIdx] === 'Compliant' ? 0 : Math.floor(sr(i * 37) * 12);` |
| `evidenceItems` | `Math.floor(completionPct / 10 * (1 + sr(i * 41)));` |
| `estimatedHours` | `Math.round(20 + sr(i * 43) * 480);` |
| `total` | `REQUIREMENTS.reduce((s, r) => s + priorityW[r.priority] * (1 - r.completionPct / 100) * urgency(r.daysToDeadline), 0);` |
| `totalGaps` | `reqs.reduce((s, r) => s + r.gapCount, 0);` |
| `avgCompl` | `fwReqs.length>0 ? fwReqs.reduce((s,r)=>s+r.completionPct,0)/fwReqs.length : 0;` |
| `totalGaps` | `jurReqs.reduce((s,r)=>s+r.gapCount,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FRAMEWORKS`, `JURISDICTIONS`, `PRIORITIES`, `REQ_NAMES`, `RESPONSIBLE`, `STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Tracked Deadlines (Active) | — | Deadline Registry | Total regulatory filing deadlines currently tracked for the entity. |
| On-Track (%) | — | Completion Status | Share of active deadlines where workflow completion is on schedule. |
| Escalation Alerts | — | Alert Engine | Number of deadlines with Deadline Risk Score above threshold requiring senior review. |
- **Regulatory deadline database + workflow status data** → Deadline risk scoring; owner assignment; escalation evaluation → **Deadline tracker dashboard with risk scores and escalation alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Deadline Risk Score
**Headline formula:** `DR = (1 – completion_pct) × (1 / days_remaining) × materiality`
**Standards:** ['Internal Compliance Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).