# Approval Workflows
**Module ID:** `approval-workflows` · **Route:** `/approval-workflows` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-level ESG disclosure review and approval routing engine supporting configurable sign-off chains, delegated authority matrices, and SLA-tracked review deadlines. Maintains immutable audit trails of all review actions for ISAE 3000 and SOX compliance. Integrates with Advanced Report Studio to gate report publication until all approvals are obtained.

> **Business value:** Structured approval workflows prevent premature disclosure publication and create the documented sign-off chain required for ISAE 3000 limited assurance. By enforcing authority matrices and capturing immutable audit trails, the engine reduces regulatory risk from unauthorised disclosures and supports internal audit reviews of ESG data governance.

**How an analyst works this module:**
- Submit disclosure item for review via Report Studio integration
- Workflow engine routes to first-tier reviewer per authority matrix
- Reviewer approves, rejects, or requests changes with mandatory comment
- Escalation logic triggers after SLA breach to next authority tier
- Final approver publishes signed-off disclosure with timestamp
- Audit Trail tab provides immutable record of all review actions for assurance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `DEFAULT_TEMPLATES`, `KANBAN_COLS`, `KANBAN_LABELS`, `LS_PORTFOLIO`, `LS_TEMPLATES`, `LS_WORKFLOWS`, `PIE_COLORS`, `SLA_COLORS`, `STATUS_COLORS`, `STATUS_LIST`, `SortHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEFAULT_TEMPLATES` | 9 | `name`, `trigger`, `approvers`, `steps`, `sla_hours`, `category`, `required_evidence` |

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
| `currentStep` | `status === 'approved' ? tpl.steps.length : status === 'rejected' ? Math.max(1, Math.floor(sr(h, 3) * tpl.steps.length)) : Math.floor(sr(h, 4) * tpl.steps.length) + 1;` |
| `approvers` | `tpl.approvers.map((role, ai) => ({` |
| `evidence` | `(tpl.required_evidence \|\| []).map((ev, ei) => ({ type: 'document', description: ev, attachment_ref: `ATT-${i}-${ei}` }));` |
| `companies` | `useMemo(() => { if (portfolioRaw.length) return portfolioRaw.map(h => { const master = GLOBAL_COMPANY_MASTER.find(m => m.ticker === h.ticker) \|\| {};` |
| `avgHours` | `instances.filter(w => w.status === 'approved').reduce((s, w) => {` |
| `dur` | `(new Date(w.approvers.filter(a => a.timestamp).pop()?.timestamp \|\| w.created_at) - new Date(w.created_at)) / 3600000;` |
| `cats` | `new Set(instances.map(w => w.category));` |
| `newApprovers` | `w.approvers.map((a, i) => i === w.current_step - 1 ? { ...a, status:'approved', timestamp: new Date().toISOString(), comment: actionComment } : a);` |
| `nextStep` | `w.current_step + 1;` |
| `rows` | `[keys.join(','), ...data.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))];` |
| `blob` | `new Blob([rows.join('\n')], { type:'text/csv' });` |
| `exportActive` | `() => exportCSV(filtered.map(w => ({ id:w.id, title:w.title, template:w.template_name, status:w.status, category:w.category, step:`${w.current_step}/${w.total_steps}`, sla_status:w.sla_status, created:w.created_at, creat` |
| `exportHistory` | `() => exportCSV(instances.filter(w => ['approved','rejected'].includes(w.status)).map(w => ({ id:w.id, title:w.title, template:w.template_name, outcome:w.status, category:w.category, created:w.created_at, sla:w.sla_statu` |
| `categories` | `[...new Set(instances.map(w => w.category))].sort();` |
| `current` | `i === w.current_step - 1 && !['approved','rejected'].includes(w.status);` |
| `pct` | `Math.max(0, Math.min(100, hoursLeft > 0 ? (hoursLeft / (templates.find(t => t.id === w.template_id)?.sla_hours \|\| 48)) * 100 : 0));` |
| `totalPages` | `Math.ceil(completed.length / pageSize);` |
| `page` | `completed.slice(historyPage * pageSize, (historyPage + 1) * pageSize);` |
| `durHrs` | `lastTs ? Math.round((new Date(lastTs) - new Date(w.created_at)) / 3600000) : '—';` |

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

Workflow engine enforces the delegated authority matrix: each disclosure type requires sign-off from defined roles in sequence. Parallel approval paths resolve via configurable majority rule. SLA tracking flags overdue reviews and auto-escalates to the next authority tier after the breach window.

**Standards:** ['ISAE 3000 (Revised)', 'SOX Section 302/906', 'ISO 9001 Document Control']
**Reference documents:** ISAE 3000 Revised – Assurance Engagements Other than Audits; SOX Section 302 CEO/CFO Certification; ISO 9001:2015 Document and Record Control

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *delegated authority matrix*
> with **parallel approval paths resolved by configurable majority rule**, **auto-escalation to the
> next authority tier after SLA breach**, an **immutable audit trail** for ISAE 3000/SOX, and a hard
> **integration gate with Advanced Report Studio**. None of those four mechanisms exists in the code.
> What the page implements is a *strictly sequential* multi-step approval Kanban with SLA *flagging*
> (no escalation), mutable `localStorage` persistence (no immutability), and no cross-module
> publication gate — one of the 8 templates is merely *named* "Report Publication". The sections
> below document the code as it behaves.

### 7.1 What the module computes

`frontend/src/features/approval-workflows/pages/ApprovalWorkflowsPage.jsx` (EP-V3, Sprint V) manages approval instances built from **8 hard-coded templates** (`DEFAULT_TEMPLATES`): Portfolio Rebalance (SLA 48h), Manual Data Override (24h), Report Publication (72h), Model Parameter Change (120h), Regulatory Submission (168h), Client Onboarding (240h), ESG Screen Exception (120h), Alert Escalation (24h) — each with an approver-role chain (2–3 roles), 3–4 named steps, category, and required-evidence list.

Core derived quantities:

```
sla_deadline = created_at + sla_hours × 3600000
hoursLeft    = (sla_deadline − now) / 3600000
sla_status   = terminal(approved/rejected) → on_track
               hoursLeft < 0               → breached
               hoursLeft < 0.2 × sla_hours → at_risk       (final 20% of the SLA window)
               else                         → on_track
```

Eight KPI tiles: active count, pending, approved (30d), rejected, SLA breached, average approval hours, on-track %, categories used (n/8).

### 7.2 State machine & scoring rubric

Statuses: `draft → pending → in_review → approved | rejected` (+ `expired` defined in `STATUS_LIST` but never assigned by any handler). Transitions are strictly sequential:

| Action | Guard | Effect |
|---|---|---|
| Submit | status = draft | status→pending, current_step→1 |
| Approve | mandatory non-empty comment | approver at `current_step−1` stamped approved; `nextStep > total_steps ? approved : in_review` |
| Reject | mandatory non-empty comment | approver stamped rejected; whole workflow → rejected (no resubmission path) |

Progress bar: `pct = clamp((hoursLeft / sla_hours) × 100, 0, 100)`. Average approval duration = time from `created_at` to the last approver timestamp, divided by the count of workflows *approved in the last 30 days* (`approved30.length || 1`) — note the numerator sums over **all** approved workflows, so the KPI overstates when older approvals exist (a real code quirk, faithful to line ~160).

### 7.3 Seed-data generation

On first load (no `ra_workflow_instances_v1` in localStorage), `generateInstances` fabricates 16 instances from a fixed title list ("Override Scope 3 for HDFCBANK", "CSRD Filing — FY 2024"…). Each title is hashed (`hashStr`: Java-style ×31 rolling hash) and fed to the platform PRNG `sr(seed) = frac(sin(seed+1)×10⁴)`:

- status = `STATUS_LIST[floor(sr(h,1)×5)]`; created 20–40 days ago (`(30−i)` days minus up to 10 random days).
- current step: approved → all steps; rejected → random step ≥ 1; else random step + 1.
- approvers get cyclic Indian names (Arun/Priya/… × Sharma/Patel/…), 85% approve probability per past step (`sr(h,5+ai) > 0.15`), timestamps spaced 8h apart, canned comments.
- evidence stubs `ATT-{i}-{ei}` mirror the template's required-evidence list.

Portfolio holdings from `ra_portfolio_v1` (falling back to the first 40 `GLOBAL_COMPANY_MASTER` rows) are loaded but only inform context, not the instance generator's output.

### 7.4 Worked example — SLA math

Take template WF02 (Manual Data Override, SLA 24h), instance created 2025-03-10 09:00 UTC, now = 2025-03-11 06:00 UTC, status `in_review`:

| Step | Computation | Result |
|---|---|---|
| Deadline | 09:00 + 24h | 2025-03-11 09:00 |
| hoursLeft | (09:00 − 06:00) | 3.0 h |
| Threshold | 0.2 × 24 | 4.8 h |
| sla_status | 0 < 3.0 < 4.8 | **at_risk** |
| Progress bar | (3/24) × 100 | 12.5% remaining |

Two hours later hoursLeft = 1.0 → still at_risk; at 09:01 hoursLeft < 0 → **breached**. Nothing else happens on breach — no reassignment, notification, or tier escalation (contrary to the guide).

### 7.5 Companion analytics & exports

Charts (Recharts): category pie, monthly-volume line (bucketed by `created_at` month), SLA distribution bar (colour-coded green/amber/red), and average turnaround-hours bar per template (approved instances only). Tabs: Kanban (5 columns, drag-free click-to-detail), sortable/filterable table (status/category/SLA filters, string-lowered comparator on a spread copy — no in-place mutation), history with 10-per-page pagination, and a detail pane with per-approver timeline. CSV exports (active + history) quote-escape fields and exclude object-valued keys; workflow IDs from the create form are `'WFI-' + Date.now() + '-' + sr(seed)` — PRNG-suffixed, not cryptographic.

### 7.6 Data provenance & limitations

- **All 16 initial instances, approver names, comments, and timestamps are synthetic**, generated by the seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` keyed off title hashes — stable across renders but not real approvals. User-created workflows are real user input, persisted only to browser `localStorage` (`ra_workflow_instances_v1`/`ra_workflow_templates_v1`) — clearable, editable via devtools, single-browser: not an audit-grade store.
- No authentication of the approver: any user of the browser session can approve any step; `created_by` is just "System"/"Manual".
- SLA constants (48/24/72/120/168/240/24 h) and the 20% at-risk window are synthetic demo values with no cited policy source.
- Simplifications vs production workflow engines: no delegation/out-of-office, no parallel or quorum approvals, no escalation, no server-side immutable event log, no e-signature or hash-chaining of decisions.

### 7.7 Framework alignment

- **ISAE 3000 (Revised)** — the guide's stated target: IAASB's standard for assurance over non-financial information requires documented, attributable review evidence. The page's per-approver timestamps + mandatory comments *gesture at* that evidence trail, but localStorage mutability means it would not satisfy an ISAE 3000 practitioner's evidence-integrity expectations.
- **SOX §302** — CEO/CFO certification presumes controlled, sequential sign-off chains; the sequential step machine models the control design, without the access-control and retention layers SOX evidence requires.
- **ISO 9001:2015 §7.5 (documented information)** — template-driven required-evidence lists per workflow type approximate document-control checklists.
- SLA tracking follows generic ITSM practice (on-track / at-risk / breached traffic-lighting) rather than any named standard.

## 9 · Future Evolution

### 9.1 Evolution A — First backend vertical: server-side workflow engine with immutable event log (analytics ladder: rung 1 → 2)

**What.** This is a tier-B frontend-only module with a documented guide↔code mismatch: the guide promises delegated authority matrices, majority-rule parallel paths, SLA auto-escalation, an immutable ISAE 3000/SOX audit trail, and a Report Studio publication gate — none exist. What runs is a sequential Kanban over 16 PRNG-fabricated instances (`sr(seed)=frac(sin(seed+1)×10⁴)` keyed off title hashes) persisted in mutable `localStorage`, with any browser user able to approve any step. Evolution A builds the module's first backend vertical and makes the audit-trail claim true.

**How.** (1) Tables `workflow_templates`, `workflow_instances`, `workflow_events` — events append-only with per-row SHA-256 chaining (prior_hash + payload), the pattern the ISAE 3000 evidence claim actually requires. (2) The existing state machine (draft→pending→in_review→approved|rejected, mandatory comments) ports server-side with approver identity from the RBAC session, closing the "anyone can approve" hole; add the escalation handler the guide promises (SLA breach → next authority tier). (3) Fix the avg-approval-hours KPI (numerator sums all approved workflows, denominator counts last-30-days only — documented quirk at ~line 160). (4) Rung 2: what-if SLA simulation — replay the event history under altered `sla_hours`/staffing to project breach rates.

**Prerequisites.** Alembic migration (two-head merge outstanding); retire the seeded-random instance generator — synthetic approvals must not migrate into an audit table. **Acceptance:** an event row cannot be altered without breaking the hash chain (verified by an integrity endpoint); approving a step as a viewer-role user is rejected server-side; breach simulation reproduces observed breach counts on unmodified parameters.

### 9.2 Evolution B — Review-desk copilot with gated approval actions (LLM tier 2)

**What.** Once Evolution A exposes real endpoints, the approval queue is a natural tool-calling surface: "what's waiting on me and which items breach SLA today?" answered from the live queue; "summarise the evidence attached to WFI-2214 against its template's required-evidence list" drafted from real records; approve/reject executed as tool calls only after explicit user confirmation with a mandatory comment — mirroring the state machine's own guard.

**How.** Tool schemas from the new workflow API: read tools (queue by assignee, instance detail, event history) ungated; mutating tools (approve/reject/escalate) behind the Tier-2 confirmation + RBAC convention, inheriting the user's session so the copilot can never approve beyond the user's own authority tier. Grounding corpus is this Atlas page's §7.1–7.2 (SLA formula, at-risk 20% window, transition guards) so SLA explanations cite the actual thresholds. The copilot's evidence-summary output writes into the instance's comment field, becoming part of the hash-chained event log — LLM assistance itself leaves audit evidence.

**Prerequisites (hard).** Evolution A in full — a copilot narrating localStorage PRNG-fabricated approvals would be documenting fiction, and mutating actions without server-side identity would be an approval-control bypass. **Acceptance:** copilot cannot execute approve/reject without a confirmed user action carrying a non-empty comment; every SLA figure it quotes matches the instance's computed `sla_status`; its summaries appear in the event log attributed to the session user.