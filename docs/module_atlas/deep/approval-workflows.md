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
