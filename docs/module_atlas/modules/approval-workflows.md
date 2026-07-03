# Approval Workflows
**Module ID:** `approval-workflows` · **Route:** `/approval-workflows` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-level ESG disclosure review and approval routing engine supporting configurable sign-off chains, delegated authority matrices, and SLA-tracked review deadlines. Maintains immutable audit trails of all review actions for ISAE 3000 and SOX compliance. Integrates with Advanced Report Studio to gate report publication until all approvals are obtained.

> **Business value:** Structured approval workflows prevent premature disclosure publication and create the documented sign-off chain required for ISAE 3000 limited assurance. By enforcing authority matrices and capturing immutable audit trails, the engine reduces regulatory risk from unauthorised disclosures and supports internal audit reviews of ESG data governance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `DEFAULT_TEMPLATES`, `KANBAN_COLS`, `KANBAN_LABELS`, `LS_PORTFOLIO`, `LS_TEMPLATES`, `LS_WORKFLOWS`, `PIE_COLORS`, `SLA_COLORS`, `STATUS_COLORS`, `STATUS_LIST`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `seededRandom` | `seed => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `fmtDate` | `d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';` |
| `fmtDateTime` | `d => d ? new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';` |
| `uid` | `() => 'WFI-' + Date.now() + '-' + sr(_uidSeed++).toString(36).slice(2, 6);` |
| `statusIdx` | `Math.floor(sr(h, 1) * 5);` |
| `created` | `new Date(now - (30 - i) * 86400000 - sr(h, 2) * 86400000 * 10).toISOString();` |
| `slaDeadline` | `new Date(new Date(created).getTime() + tpl.sla_hours * 3600000).toISOString();` |
| `hoursLeft` | `(new Date(slaDeadline) - now) / 3600000;` |
| `currentStep` | `status === 'approved' ? tpl.steps.length : status === 'rejected' ? Math.max(1, Math.floor(sr(h, 3) * tpl.steps.length)) : Math.floor(sr(h, 4) * tpl.st` |
| `approvers` | `tpl.approvers.map((role, ai) => ({` |
| `evidence` | `(tpl.required_evidence \|\| []).map((ev, ei) => ({ type: 'document', description: ev, attachment_ref: `ATT-${i}-${ei}` }));` |
| `avgHours` | `instances.filter(w => w.status === 'approved').reduce((s, w) => {` |
| `dur` | `(new Date(w.approvers.filter(a => a.timestamp).pop()?.timestamp \|\| w.created_at) - new Date(w.created_at)) / 3600000;` |
| `cats` | `new Set(instances.map(w => w.category));` |
| `dur` | `(new Date(w.approvers.filter(a => a.timestamp).pop()?.timestamp \|\| w.created_at) - new Date(w.created_at)) / 3600000;` |
| `newApprovers` | `w.approvers.map((a, i) => i === w.current_step - 1 ? { ...a, status:'approved', timestamp: new Date().toISOString(), comment: actionComment } : a);` |
| `nextStep` | `w.current_step + 1;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEFAULT_TEMPLATES`, `KANBAN_COLS`, `PIE_COLORS`, `STATUS_LIST`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Approval Cycle Time | `Review_completed – Assigned` | Workflow engine | Average time from disclosure submission to final approval sign-off |
| SLA Breach Rate | — | Workflow monitor | Percentage of review tasks exceeding their SLA deadline |
| Pending Approvals | — | Workflow queue | Number of disclosure items awaiting at least one required sign-off |
- **Report Studio disclosure drafts** → Route to authority matrix reviewers; capture approval/rejection actions with timestamps → **Immutable approval audit trail per disclosure item**
- **Delegated authority configuration** → Enforce sign-off sequence; trigger SLA monitoring; auto-escalate on breach → **SLA compliance reports and pending approval dashboards**

## 5 · Intermediate Transformation Logic
**Methodology:** Delegated authority matrix with SLA tracking
**Headline formula:** `SLA_breach = (Review_completed – Review_assigned) > threshold_hours; Approval_completion = Approved_items / Total_items × 100`
**Standards:** ['ISAE 3000 (Revised)', 'SOX Section 302/906', 'ISO 9001 Document Control']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).