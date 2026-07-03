# Compliance Workflow Automation
**Module ID:** `compliance-workflow-automation` · **Route:** `/compliance-workflow-automation` · **Tier:** B (frontend-computed) · **EP code:** EP-CR6 · **Sprint:** CR

## 1 · Overview
Automated workflows for CSRD, TCFD, ISSB S2, SFDR, and UK TPT with task assignment, deadline management, and approval chains.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `APPROVAL_CHAIN`, `DEADLINES_TIMELINE`, `EVIDENCE`, `STATUS_COLORS`, `TABS`, `TASKS`, `WORKFLOWS`

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
**Standards:** ['Process management']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).