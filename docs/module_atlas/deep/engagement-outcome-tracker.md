## 7 · Methodology Deep Dive

The guide (engagement-effectiveness scoring, CA100+ progress, escalation ladder) is broadly matched.
The module is a **stewardship/engagement tracker** over a hand-authored table of real investee
companies, structured around the genuine **Climate Action 100+ Net Zero Company Benchmark** indicator
set and the standard escalation ladder. Two small gaps: the guide says "30 engagements across 20
companies" but the code table holds **15** engagements; and the guide's effectiveness formula
(`MilestonesAchieved / MilestonesTargeted × 100`) is not computed as a headline — the module tracks
milestone *status* categorically rather than as a ratio.

### 7.1 What the module computes

The data layer is 15 engagements with **real company names** (Shell, TotalEnergies, BP, Exxon, Chevron,
Glencore, BHP, Rio Tinto, ArcelorMittal, HeidelbergCement, Volkswagen, Samsung, POSCO, Holcim, Duke
Energy), each carrying: `status`, `milestone` (5-stage), `escalation` (4-level), `ca100` (focus flag),
`nzScore` (0–100 net-zero benchmark score), `indicators` (count met).

Derived values are simple groupings/filters — there is no scoring engine:
```js
sectors  = unique(ENGAGEMENTS.sector)
filtered = sectorFilter=='All' ? ENGAGEMENTS : filter by sector
```
Distributions (`MILESTONES_DIST`, `ESCALATION_DIST`, `CA100_INDICATORS`, `COLLAB`) are **static
pre-tabulated** counts, not computed from the engagement rows.

### 7.2 Parameterisation / scoring rubric

**Engagement lifecycle (milestone ladder):**

| Stage | Colour | Meaning |
|---|---|---|
| Letter Sent | grey | Initial outreach |
| Meeting Held | amber | Dialogue opened |
| Commitment Made | blue | Company pledge |
| Action Taken | green | Implementation |
| Verified | navy | Independently confirmed |

**Escalation ladder:** Dialogue → Enhanced → Vote Against → Public Statement → (Divestment). The
distribution: Dialogue 8, Enhanced 4, Vote Against 2, Public Statement 1.

**CA100+ Net Zero Benchmark indicators (10, real):** Net Zero by 2050, Short-term Targets, Capex
Alignment, Scope 3 Disclosure, Lobbying Alignment, Just Transition Plan, TCFD Reporting, Board
Oversight, Executive Remuneration, Methane Targets — each with met/partial/notMet counts. These are the
authentic CA100+ benchmark disclosure indicators.

`nzScore` (28–72) is a hand-set net-zero benchmark score per company (Exxon 28 lowest, Holcim 72
highest) — consistent with real CA100+ assessment gradients, but editorial.

### 7.3 Calculation walkthrough

Load 15 engagements → filter by sector → dashboard shows engagement rows with milestone/escalation
badges and nzScore → CA100+ tab renders the 10-indicator met/partial/notMet stacked bars → milestone
and escalation tabs render the pre-tabulated distributions → collaborative-engagement tab lists 5 real
investor initiatives (CA100+, IIGCC Net Zero, ShareAction, FAIRR, CDP Non-Disclosure) with partner
counts and AUM → impact-attribution tab links engagement outcomes to portfolio effect. The API route
(`/api/v1/engagement/*`) exists for persisting entities/escalations, but the displayed data is static.

### 7.4 Worked example

**CA100+ indicator coverage.** For "TCFD Reporting": met 9, partial 4, notMet 2 (across 15 companies —
note counts exceed 15 as they aggregate the full 20-company universe the guide references). Coverage
rate = met/(met+partial+notMet) = 9/15 = 60% fully compliant. By contrast "Just Transition Plan": met
2, partial 5, notMet 8 → only 2/15 = 13% met — the module's signal that just-transition planning is
the weakest CA100+ dimension across the engaged universe, while TCFD reporting is the most mature.

An engagement's escalation status also encodes effectiveness: Exxon (nzScore 28) sits at "Vote Against"
and Chevron (32) at "Public Statement" — the two lowest scorers have escalated furthest up the ladder,
the intended dialogue-to-escalation logic.

### 7.5 Companion analytics

- **Collaborative engagement:** 5 real initiatives with partner count, AUM ($T), years active — the
  collective-stewardship layer (CA100+ 12 partners / $8.5T; CDP Non-Disclosure 20 partners / $18.5T).
- **Milestone & escalation distributions:** the funnel from Letter Sent (2) to Verified (3), and the
  Dialogue-heavy escalation profile.
- **Impact attribution:** connects engagement stage to portfolio net-zero contribution.

### 7.6 Data provenance & limitations

- **Company names and CA100+ indicators are real; the scores and counts are editorial** (hand-set,
  not a live CA100+ data feed). No PRNG.
- The guide's effectiveness *ratio* is not computed; the module tracks milestone/escalation status
  categorically. Distributions are pre-tabulated, not derived from the 15 rows (and reference the
  broader 20-company universe).
- 15 engagements in code vs the guide's stated 30.

**Framework alignment:** **Climate Action 100+ Net Zero Company Benchmark** — the 10-indicator
disclosure framework is genuine; CA100+ assesses focus companies against these indicators at
met/partial/not-met granularity, exactly the structure rendered. **IIGCC Net Zero Stewardship Toolkit**
— the milestone (letter→verify) and escalation (dialogue→divestment) ladders follow the IIGCC
stewardship escalation model. **PRI** — the collaborative-engagement and outcome-tracking discipline
reflects PRI's active-ownership reporting.
