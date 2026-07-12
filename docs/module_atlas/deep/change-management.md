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
