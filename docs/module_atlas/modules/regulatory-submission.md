# Regulatory Submission Manager
**Module ID:** `regulatory-submission` · **Route:** `/regulatory-submission` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages ESG regulatory filing workflows from data preparation through validation, formatting, and submission to regulatory portals.

> **Business value:** Streamlines the ESG regulatory submission process from data mapping to portal filing, reducing manual error risk and providing a complete audit trail of submissions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `CROSS_DEPS`, `EVIDENCE_ITEMS`, `HISTORICAL`, `LS_KEY`, `LS_PORTFOLIO`, `PREP_STEPS`, `REGULATORY_SUBMISSIONS`, `REG_CHANGES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `today` | `new Date('2025-05-15');` |
| `daysBetween` | `(a, b) => Math.ceil((new Date(b) - new Date(a)) / 86400000);` |
| `jurisdictions` | `useMemo(() => ['All', ...new Set(REGULATORY_SUBMISSIONS.map(s => s.jurisdiction))], []);` |
| `juris` | `new Set(all.map(s => s.jurisdiction)).size;` |
| `regs` | `new Set(all.map(s => s.regulator)).size;` |
| `avgComp` | `all.reduce((a, s) => a + s.completion_pct, 0) / all.length;` |
| `label` | `d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `badge` | `(color, bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, color, background: bg \|\| `${color}18`` |
| `steps` | `checklistState[sub.id] \|\| PREP_STEPS.map(() => false);` |
| `complexity` | `Math.min(100, filings.length * 25 + (j.jurisdiction === 'EU' ? 30 : 0));` |
| `overall` | `Math.round((complexity * 0.25 + deadlinePressure * 0.3 + (100 - dataReady) * 0.3 + assurance * 0.15));` |
| `assigneeData` | `Object.entries(assigneeMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total);` |
| `fmtData` | `Object.entries(fmtMap).map(([name, value]) => ({ name, value }));` |
| `freqData` | `Object.entries(freqMap).map(([name, value]) => ({ name, value }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `CROSS_DEPS`, `HISTORICAL`, `PREP_STEPS`, `REGULATORY_SUBMISSIONS`, `REG_CHANGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Submissions | — | Submission Registry | Regulatory filings currently in progress across all applicable frameworks. |
| Submission Readiness (%) | — | Validation Engine | Average readiness score across all active submission workflows. |
| Validation Errors | — | XBRL Validator | Count of XBRL tagging or data validation errors across pending submissions. |
- **Sustainability data warehouse + regulatory templates + XBRL taxonomy** → Field mapping; XBRL tagging; validation; portal API submission → **Submitted regulatory filing with confirmation receipt and audit trail**

## 5 · Intermediate Transformation Logic
**Methodology:** Submission Readiness Score
**Headline formula:** `SR = (validated_fields / required_fields) × (1 – error_rate) × 100`
**Standards:** ['ESMA XBRL Taxonomy', 'EFRAG ESRS Taxonomy (Draft)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).