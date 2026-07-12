# Sustainability Change Management
**Module ID:** `change-management` · **Route:** `/change-management` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Organisational change management framework for sustainability transformation programmes. Assesses stakeholder readiness, models adoption curves using Everett Rogers diffusion theory, and tracks KPI progress across 5 ADKAR stages (Awareness, Desire, Knowledge, Ability, Reinforcement).

> **Business value:** ADKAR composite below 60 indicates high change failure risk. Critical mass (16%) is key inflection point; adoption typically accelerates 3× once threshold is crossed.

**How an analyst works this module:**
- Input ADKAR survey scores per stakeholder group
- Adoption Curve tab fits Rogers S-curve to rollout data
- Stakeholder Map visualises readiness by group and influence
- Milestone Tracker links Kotter stages to current progress
- Intervention Planner suggests targeted actions for low ADKAR dimensions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CHANGE_CATEGORIES`, `COLORS`, `DEFAULT_CHANGES`, `EmptyState`, `KANBAN_COLORS`, `KANBAN_COLS`, `KANBAN_LABELS`, `KpiCard`, `LS_CHANGES`, `LS_KEY`, `LS_PORTFOLIO`, `Section`, `VERSION_HISTORY`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CHANGE_CATEGORIES` | 9 | `name`, `risk`, `examples`, `requires_approval`, `impact_scope` |
| `DEFAULT_CHANGES` | 13 | `title`, `category`, `risk_level`, `description`, `before_state`, `after_state`, `impact_assessment`, `requester`, `status`, `created_at`, `approved_at`, `implemented_at`, `rollback_available` |
| `VERSION_HISTORY` | 8 | `sprint`, `date`, `description` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `today` | `new Date('2025-05-15');` |
| `fmtDate` | `(d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '---';` |
| `companies` | `useMemo(() => { if (portfolioRaw.length) { const tickers = new Set(portfolioRaw.map(p => p.ticker \|\| p.symbol).filter(Boolean));` |
| `implTimes` | `changes.filter(c => c.implemented_at && c.created_at).map(c => (new Date(c.implemented_at) - new Date(c.created_at)) / 86400000);` |
| `avgImpl` | `implTimes.length ? (implTimes.reduce((a, b) => a + b, 0) / implTimes.length).toFixed(1) : '---';` |
| `rollbackRate` | `totalImpl ? ((rolledBack / totalImpl) * 100).toFixed(1) : '0.0';` |
| `trend` | `months.length >= 2 ? (monthCounts[months[months.length - 1]] > monthCounts[months[months.length - 2]] ? 'Up' : 'Down') : 'Stable';` |
| `catNames` | `useMemo(() => [...new Set(changes.map(c => CHANGE_CATEGORIES.find(cc => cc.id === c.category)?.name).filter(Boolean))], [changes]);` |
| `rows` | `changes.map(c => [c.id, c.title, CHANGE_CATEGORIES.find(cc => cc.id === c.category)?.name \|\| c.category, c.risk_level, c.status, c.requester, c.created_at \|\| '', c.approved_at \|\| '', c.implemented_at \|\| '', `"${(c.impact` |
| `csv` | `[headers.join(','), ...rows.map(r => r.join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `report` | `{ generated:today.toISOString(), total:changes.length, high_risk:changes.filter(c => c.risk_level === 'High').length, changes:changes.map(c => ({ ...c, category_name:CHANGE_CATEGORIES.find(cc => cc.id === c.category)?.na` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHANGE_CATEGORIES`, `COLORS`, `DEFAULT_CHANGES`, `KANBAN_COLS`, `VERSION_HISTORY`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ADKAR Composite Score | `avg(A,D,K,A2,R) × 20` | Stakeholder survey | Overall change readiness; below 60 = high change failure risk |
| Adoption Rate | `Rogers S-curve at current t` | Rollout tracking data | Percentage of target population currently using new sustainability practice |
| Critical Mass Threshold | `Innovators (2.5%) + Early Adopters (13.5%)` | Rogers Diffusion Theory | Adoption level required for self-sustaining momentum |
| Change Resistance Index | `Weighted stakeholder opposition score` | Survey data | Composite measure of stakeholder resistance severity |
- **Stakeholder surveys** → ADKAR dimension scores → composite → **Change readiness by group**
- **Rollout tracking system** → Adoption counts over time → S-curve fit → **Adoption rate and critical mass timing**

## 5 · Intermediate Transformation Logic
**Methodology:** ADKAR change readiness composite + Rogers S-curve adoption
**Headline formula:** `ADKAR_score = avg(A,D,K,A₂,R) × 20; Adoption(t) = L / (1 + exp(-k(t–t_mid)))`

ADKAR scored 0–5 per dimension via stakeholder survey; composite × 20 normalises to 0–100. Rogers adoption curve fit to rollout data: L = maximum adoption rate, k = steepness parameter, t_mid = inflection point (when 50% adoption reached). Critical mass threshold at 16% (innovators + early adopters per Rogers). Kotter stages mapped to ADKAR progression milestones.

**Standards:** ['Prosci ADKAR Model', 'Rogers Diffusion of Innovations (1962)', 'Kotter 8-Step Change Model', 'GRI 2-29 Stakeholder Engagement']
**Reference documents:** Prosci ADKAR Change Management Model; Rogers Diffusion of Innovations (1962); Kotter Leading Change 8-Step Process; GRI 2-29 Stakeholder Engagement Standard

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (major).** The MODULE_GUIDES entry describes an **organisational
> change-management** tool: ADKAR readiness composite (`avg(A,D,K,A₂,R)·20`), Rogers diffusion
> S-curve (`L/(1+e^(−k(t−t_mid)))`), a 16% critical-mass threshold, and stakeholder-adoption modelling.
> **None of that exists in the code.** The module is actually a **platform change-control registry** —
> it logs technical/data/model/regulatory *changes to the A² platform itself* (schema changes, PD
> coefficient updates, VaR-config changes, CSRD/ESRS updates), tracks approval status, implementation
> lead time, and rollback rate, and exports a change log. There is no ADKAR, no Rogers curve, no
> adoption modelling. The guide should be rewritten; the code is documented below.

### 7.1 What the module computes

A change-log analytics layer over `DEFAULT_CHANGES` (13 seeded change requests) plus any user-added
changes persisted to `localStorage`:
```
implTimes  = changes.filter(implemented&created).map((impl − created)/86,400,000)   // days
avgImpl    = mean(implTimes)                                     // avg lead time (days)
rollbackRate = rolledBack / totalImpl · 100                      // % of implemented reverted
trend      = last month count > prior ? 'Up' : 'Down'
```
Plus category breakdowns, a CSV export, and a JSON governance report (`report`) tagging each change
with its risk level and category name.

### 7.2 Parameterisation / data rubric

| Element | Value | Provenance |
|---|---|---|
| Change categories (9) | Data Schema (High), Model Parameter (High), Threshold (Med), Report Template (Low), API Integration (Med), Regulatory (High), Workflow (Med), Access (Med) | `CHANGE_CATEGORIES` — hard-coded, platform-specific with realistic examples |
| Default changes (13) | title, category, risk, before/after state, requester, timestamps, rollback_available | `DEFAULT_CHANGES` — seeded illustrative change history |
| Version history (8) | sprint, date, description | `VERSION_HISTORY` — platform release log |
| Reference date | 2025-05-15 | Hard-coded `today` |
| Company master join | `GLOBAL_COMPANY_MASTER` / portfolio tickers | Real company reference data |
| `sRand` / `seed` helpers | present | Largely unused decoration (deterministic) |

### 7.3 Calculation walkthrough

Changes load from `localStorage` (falling back to `DEFAULT_CHANGES`). For each change with both a
created and implemented timestamp, the lead time in days is computed; these average to `avgImpl`. The
rollback rate divides rolled-back changes by total implemented. A monthly count series drives a simple
up/down `trend`. Category names resolve via `CHANGE_CATEGORIES`. The CSV/JSON exports serialise the
full change log for audit. This is ITIL-style change control, not behavioural change management.

### 7.4 Worked example (change-log KPIs)

Suppose of 13 changes, 8 are implemented, with lead times (created→implemented) of {2, 5, 3, 10, 1, 4,
7, 6} days and 1 subsequently rolled back:
- `avgImpl = (2+5+3+10+1+4+7+6)/8 = 38/8 = 4.75 days`
- `rollbackRate = 1/8·100 = 12.5%`
- If May's change count (say 4) exceeds April's (say 3), `trend = 'Up'`.

These are the module's headline governance metrics — mean implementation lead time and rollback rate —
exactly the change-control KPIs a platform ops team tracks, and unrelated to ADKAR/adoption.

### 7.5 Data provenance & limitations
- Change records are **seeded illustrative data** plus user entries in `localStorage`; category and
  version tables are hard-coded platform metadata. The company join uses real reference data.
- No `sr()`-driven synthetic outputs in the KPI path (the PRNG helpers are effectively unused).
- No ADKAR survey capture, no Rogers S-curve fit, no adoption/critical-mass modelling — the guide's
  entire behavioural-science methodology is absent.

**Framework alignment:** The implemented tool aligns with **ITIL change management** / **SR 11-7 model
change control** (risk-classified changes, approval gates, rollback, audit log) — appropriate for a
regulated analytics platform. The guide's named frameworks (**Prosci ADKAR**, **Rogers Diffusion of
Innovations**, **Kotter 8-Step**, **GRI 2-29**) are *not* implemented; ADKAR would score five
readiness dimensions from stakeholder surveys, and Rogers would fit a logistic adoption curve with a
16% (innovators + early adopters) critical-mass inflection — neither appears in this codebase.

## 9 · Future Evolution

### 9.1 Evolution A — Server-side change-control registry (analytics ladder: rung 1 → 2)

**What.** §7 carries a major mismatch flag: the guide describes an organisational
change-management tool (ADKAR composites, Rogers S-curves, 16% critical mass) while
the code is actually a **platform change-control registry** — it logs changes to the
A² platform itself (schema changes, PD coefficient updates, VaR-config changes,
CSRD/ESRS updates) with approval status, lead-time and rollback-rate analytics over 13
seeded requests plus `localStorage` persistence. Evolution A embraces what the module
really is: promote the registry from `localStorage` to a backend vertical
(`platform_change_requests` table + router) so change control survives browsers,
supports multi-user approval workflows via the existing RBAC roles, and can join the
platform's 18 `audit_*` tables — turning "what changed before this number moved?" into
a queryable question.

**How.** (1) CRUD router with state transitions (proposed → approved → implemented →
rolled-back) enforced server-side; category-based approval requirements from the
existing 9-row `CHANGE_CATEGORIES` rubric (model changes require approval; docs
don't). (2) The real analytics (`avgImpl` lead time, `rollbackRate`) recomputed over
DB rows. (3) Rewrite the MODULE_GUIDES entry — §7 explicitly says the guide should be
rewritten; the ADKAR/Rogers text describes a module that does not exist and must not
survive into the LLM corpus.

**Prerequisites (hard).** Guide rewrite is a blocking prerequisite for any copilot
(Evolution B) — RAG over the current guide would answer ADKAR questions about a
change-log tool. **Acceptance:** a change request created in one browser is visible in
another with its approval state; lead-time analytics match SQL over the table; the
mismatch flag clears.

### 9.2 Evolution B — Change-audit copilot (LLM tier 2)

**What.** An assistant for platform-governance questions: "what model changes shipped
last quarter and what was their rollback rate?", "which pending changes touch the VaR
configuration?", "draft the change record for this PD coefficient update" — the first
two as tool calls over the Evolution A registry endpoints, the third as a structured-
draft workflow where the LLM fills the change-record schema and a human approves. This
pairs naturally with the platform's audit posture: every module's engine changes could
be narrated from one place.

**How.** Tool schemas from the new router (list/filter read-only first; the create
endpoint gated behind explicit user confirmation per the tier-2 mutating-endpoint
rule); answers cite change-record IDs; category-rubric questions answer from the
`CHANGE_CATEGORIES` seed with its approval requirements.

**Prerequisites.** Evolution A complete including the guide rewrite; RBAC so the
copilot inherits the user's approval permissions and can never self-approve.
**Acceptance:** a quarterly-summary answer reconciles to a SQL count over the table;
the copilot cannot move a change to approved without a logged human confirmation.