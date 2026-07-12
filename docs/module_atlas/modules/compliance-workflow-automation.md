# Compliance Workflow Automation
**Module ID:** `compliance-workflow-automation` · **Route:** `/compliance-workflow-automation` · **Tier:** B (frontend-computed) · **EP code:** EP-CR6 · **Sprint:** CR

## 1 · Overview
Automated workflows for CSRD, TCFD, ISSB S2, SFDR, and UK TPT with task assignment, deadline management, and approval chains.

**How an analyst works this module:**
- Workflow Dashboard shows all 5 framework workflows
- Task Assignment distributes work with deadlines
- Evidence Collection tracks required documentation
- Approval Chain manages multi-level sign-off

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `APPROVAL_CHAIN`, `DEADLINES_TIMELINE`, `EVIDENCE`, `STATUS_COLORS`, `TABS`, `TASKS`, `WORKFLOWS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `WORKFLOWS` | 6 | `name`, `framework`, `totalTasks`, `completed`, `inProgress`, `overdue`, `assignees`, `deadline`, `status` |
| `TASKS` | 9 | `workflow`, `assignee`, `status`, `priority`, `dueDate` |
| `DEADLINES_TIMELINE` | 10 | `active`, `overdue` |
| `EVIDENCE` | 9 | `type`, `status`, `quality`, `source` |
| `APPROVAL_CHAIN` | 6 | `role`, `approver`, `status`, `date` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalTasks` | `WORKFLOWS.reduce((s,w)=>s+w.totalTasks,0);` |
| `completedTasks` | `WORKFLOWS.reduce((s,w)=>s+w.completed,0);` |
| `overdueTasks` | `WORKFLOWS.reduce((s,w)=>s+w.overdue,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `APPROVAL_CHAIN`, `DEADLINES_TIMELINE`, `EVIDENCE`, `TABS`, `TASKS`, `WORKFLOWS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Frameworks | — | Compliance | CSRD, TCFD, ISSB S2, SFDR, UK TPT |
| Workflow Steps | — | Task decomposition | Granular task-level tracking |

## 5 · Intermediate Transformation Logic
**Methodology:** Workflow task decomposition
**Headline formula:** `Completion = CompletedTasks / TotalTasks; OnTrack = AllDeadlinesMet`

Each regulatory framework decomposed into tasks with: responsible person, deadline, evidence checklist, approval chain. Multi-level approval: preparer → reviewer → approver → signatory.

**Standards:** ['Process management']
**Reference documents:** CSRD Reporting Process; TCFD Implementation Guide

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Compliance Workflow Automation (EP-CR6) is an **operational tracking dashboard**, not a quantitative
model. Its only derived figures are three portfolio-level task aggregates and a completion rate,
computed over a hard-coded `WORKFLOWS` array of 5 regulatory filing workflows:

```js
totalTasks     = WORKFLOWS.reduce((s,w) => s + w.totalTasks, 0)   // = 145
completedTasks = WORKFLOWS.reduce((s,w) => s + w.completed, 0)    // = 100
overdueTasks   = WORKFLOWS.reduce((s,w) => s + w.overdue, 0)      // = 6
CompletionRate = Math.round(completedTasks / totalTasks * 100)    // = 69%
```

This matches the guide's stated formula `Completion = CompletedTasks / TotalTasks`. The guide's
second clause (`OnTrack = AllDeadlinesMet`) is **not computed anywhere** — on-track status is a
hand-labelled `status` string per workflow (`'In Progress'`, `'Near Complete'`, `'Complete'`).

### 7.2 Seed datasets (all hard-coded demo values)

| Dataset | Rows | Content |
|---|---|---|
| `WORKFLOWS` | 5 | One workflow per framework: CSRD/ESRS (48 tasks), TCFD (24), ISSB (35), SFDR (20), UK TPT (18); each with completed/inProgress/overdue counts, assignees, deadline |
| `TASKS` | 8 | Sample task-level rows (task, workflow, assignee, status, priority, dueDate) |
| `DEADLINES_TIMELINE` | 9 | Monthly active/overdue counts Apr–Dec 2025 (bar chart only) |
| `EVIDENCE` | 8 | Evidence register items with status ∈ {Collected, Partial, Pending, Draft} and quality ∈ {High, Medium, N/A} |
| `APPROVAL_CHAIN` | 5 | Sign-off ladder: Data Owner → Sustainability Lead → Legal Review → CFO → Board/Audit Committee |

The guide states "20–40 workflow steps per framework"; the seed range is actually **18–48**
(UK TPT 18, CSRD 48). The guide's 4-level approval chain (preparer → reviewer → approver →
signatory) is implemented as a **5-level** chain in code — a superset, with Legal Review inserted
before CFO sign-off. These are presentational discrepancies, not methodology gaps.

### 7.3 Calculation walkthrough

1. **Workflow Dashboard (tab 0):** the three reduces above feed 4 KPI cards; a stacked
   horizontal bar chart plots `completed / inProgress / overdue` per workflow directly from seeds.
2. **Task Assignment (tab 1)** and **Evidence Collection (tab 3):** pure table renders of `TASKS`
   and `EVIDENCE`; status pills use a shared `STATUS_COLORS` map.
3. **Deadline Manager (tab 2):** bar chart of `DEADLINES_TIMELINE` — the monthly counts are
   independent seeds, *not* derived from `TASKS` due dates (summing them gives 142 active tasks vs
   145 in `WORKFLOWS`; the datasets are not reconciled).
4. **Approval Chain (tab 4):** renders the 5 `APPROVAL_CHAIN` levels; the bar chart plots the
   `level` integer (1–5) coloured by status — a visual device, not a metric.
5. **Audit Pack Generator (tab 5):** 5 static "generate pack" cards plus a pie chart of `EVIDENCE`
   status counts: Collected 4, Partial 2, Pending 2, Draft 1 — note the pie omits none but the
   counts are computed live via `EVIDENCE.filter(...)`.

### 7.4 Worked example — the completion-rate KPI

Total tasks: 48 + 24 + 35 + 20 + 18 = **145**. Completed: 32 + 22 + 18 + 20 + 8 = **100**.
Overdue: 2 + 0 + 3 + 0 + 1 = **6**. Completion rate: `Math.round(100/145 × 100)` =
`Math.round(68.97)` = **69%**. In-progress (10+2+12+0+6 = 30) plus not-started (145−100−30−6 = 9,
never shown) make up the remainder.

### 7.5 Interconnections

The page is self-contained: no API calls, no shared context reads, no data bus writes. The
watchlist / alert-subscribe / export / bookmark buttons toggle local state or fire `alert()`-style
stubs only. The footer cites EFRAG ESRS Implementation Guidance, TCFD Recommended Disclosures,
IFRS ISSB S1/S2, EU SFDR RTS, UK TPT Framework and ISO 14064-1 as reference material — these are
labels, not ingested datasets.

### 7.6 Data provenance & limitations

- **All five datasets are synthetic demo values**, hand-authored (no `sr()` PRNG is used — the
  numbers are literal constants). Workflow names, assignees, and dates are illustrative.
- No persistence: task status changes, approvals, and evidence uploads are not implemented; a
  production system needs a task DB, RBAC-scoped assignment, and document storage.
- `DEADLINES_TIMELINE` is not derived from task due dates, so the Deadline Manager can contradict
  the task table.
- No deadline engine: "Overdue" is a stored label, not `dueDate < today` — the page will not
  age tasks as time passes.
- The guide's `OnTrack = AllDeadlinesMet` gate and the "granular 20–40 step decomposition" per
  framework exist only as summary counts, not as an actual task graph.

### 7.7 Framework alignment

- **CSRD / ESRS (Delegated Reg. (EU) 2023/2772):** the CSRD workflow (48 tasks, deadline
  2025-09-30) mirrors the ESRS filing cycle; evidence items (EU Taxonomy assessment, assurance
  report) map to CSRD's limited-assurance requirement.
- **TCFD (2017/2021 recommendations):** board review task reflects TCFD's Governance pillar
  expectation of board-level climate oversight.
- **ISSB IFRS S2:** Scope 3 category screening and scenario-analysis documentation tasks track
  S2 paragraphs 29(a) (GHG scopes) and 22 (climate resilience/scenario analysis).
- **SFDR:** the PAI task corresponds to the RTS Annex I principal adverse impact statement due
  annually by 30 June (seeded here as a 31-March internal deadline).
- **UK TPT:** transition-plan narrative task follows the TPT Disclosure Framework (Oct 2023).
- **Multi-level sign-off** approximates the "preparer → reviewer → approver → signatory" control
  chain expected under CSRD assurance readiness and SOX-style disclosure controls; the code's
  5-step ladder inserts legal review, consistent with common practice for regulated filings.

## 9 · Future Evolution

### 9.1 Evolution A — From display to engine: persistent tasks with computed deadline state (analytics ladder: rung 1 → 2)

**What.** EP-CR6 is an honest operational dashboard — hand-authored constants, no PRNG
— but §7.6 lists the structural gaps: no persistence (status changes don't survive),
"Overdue" is a stored label rather than `dueDate < today` (the page will not age),
`DEADLINES_TIMELINE` is not derived from task due dates (142 vs 145 tasks — the
datasets contradict each other), and the guide's `OnTrack = AllDeadlinesMet` gate is
never evaluated. Evolution A turns the display into a workflow engine: a task graph
that computes its own state.

**How.** (1) Backend vertical: `compliance_tasks` and `compliance_workflows` tables
with the 5 framework workflows as seed templates (task decomposition per framework —
the CSRD 48-task breakdown becomes real rows); RBAC-scoped assignment using the
platform's existing role system. (2) Computed state: overdue = due date arithmetic;
`OnTrack` = the guide's all-deadlines-met gate per workflow; the deadline timeline
derives from actual task due dates, eliminating the reconciliation gap. (3) Approval
chain as state machine: the existing 5-level ladder (Data Owner → Sustainability Lead
→ Legal → CFO → Board) becomes enforced transitions with audit-logged sign-offs — the
AuditMiddleware already captures everything. (4) Cross-link to `compliance-evidence`:
evidence-item status feeds task completion where a task's deliverable is an artifact
(the natural pairing both modules gesture at).

**Prerequisites.** No PRNG purge needed; RBAC roles for the approval ladder; a
migration on the current 2-head Alembic state (coordinate with the deferred merge).
**Acceptance:** a task with a past due date shows overdue without any stored label;
completing all tasks flips a workflow's computed `OnTrack`; an approval sign-off
appears in the audit log with actor and timestamp.

### 9.2 Evolution B — Filing-cycle copilot with task-generation from regulation texts (LLM tier 2)

**What.** The hard part of compliance workflow tooling is authoring the task
decomposition — the module ships 5 hand-built workflows and can't adapt when ESRS
guidance changes. Evolution B uses an LLM where it earns its keep: "generate the FY26
CSRD workflow for a first-wave filer with limited assurance" drafts the task graph
(tasks, dependencies, role assignments, deadline back-planning from the filing date)
from the EFRAG implementation guidance and ESRS requirement structure, proposed as a
diff against the template for human approval before instantiation. Operationally, the
copilot answers "what's at risk this month?" from the computed deadline state.

**How.** Tool schemas over Evolution A's task CRUD (writes gated behind confirmation
per the roadmap's tier-2 contract); grounding corpus is the regulatory requirement
texts in refdata plus this Atlas record. Task-generation output is structured JSON
validated against the workflow schema — never free-text tasks. Status questions
answer from `GET` tool calls, with the fabrication validator checking counts and dates.

**Prerequisites (hard).** Evolution A (there is no API at all today — the page is
self-contained with zero endpoints); regulation guidance texts embedded.
**Acceptance:** a generated CSRD workflow instantiates only after explicit approval
and every task cites the guidance section it derives from; "what's overdue?" answers
match the computed state exactly; the copilot refuses to mark tasks complete itself.