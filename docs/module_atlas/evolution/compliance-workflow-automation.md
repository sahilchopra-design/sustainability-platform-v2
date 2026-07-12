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
