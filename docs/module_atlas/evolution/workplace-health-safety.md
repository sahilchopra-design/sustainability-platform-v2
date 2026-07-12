## 9 · Future Evolution

### 9.1 Evolution A — LTIFR/TRIR computed from incident counts and hours worked (analytics ladder: rung 1 → 2)

**What.** The guide's industry-standard formula (`LTIFR = injuries × 1,000,000 /
hours worked`) is never computed — §7 flags that no `lostTimeInjuries` or
`hoursWorked` field even exists, so `ltir`/`trir` are unfounded random draws attached
to 78 real company names (BHP, Shell, ArcelorMittal), which §7.5 warns readers could
mistake for actual disclosed safety records. §7.4 documents a subtler defect:
`safetyRating` reuses the same `sr(i·7)` seed as `ltir`, making the six-tier rating
perfectly single-factor while appearing multi-dimensional. Evolution A builds the data
model the formula needs: an incident register (`whs_incidents`: entity, date, type,
severity, lost days) and exposure-hours field per entity-period, from which LTIFR,
TRIR, and fatality rate are derived; a genuinely multi-factor `safetyRating` from
weighted LTIFR/TRIR/fatalities/violations; and the `BENCHMARKS` table cited to IOGP
Safety Performance Indicators (the guide names it; the constants should reference the
published table with a vintage).

**How.** Backend vertical (module is Tier B, no EP code): `POST /incidents`,
`GET /rates` in a new `whs` route with an Alembic migration; company records become
seeded fixtures with a demo-data banner replacing the real-name illusion, or names
are anonymised. The correctly implemented aggregation layer (§7.3 credits it) stays.

**Prerequisites.** The seed-reuse defect and the real-names-random-data risk both
acknowledged; incident-type taxonomy aligned with the existing 10-row
`INCIDENT_TYPES`. **Acceptance:** entering 3 lost-time injuries against 1.5M hours
yields LTIFR 2.0 on the page; safetyRating changes when fatalities change with LTIFR
held constant; every benchmark row cites its source.

### 9.2 Evolution B — GRI 403 reporting copilot with incident intake (LLM tier 2)

**What.** GRI 403 and ESRS S1 reporting is where this module's users end up, and the
inputs arrive as messy incident narratives. Evolution B has two halves. Intake: the
copilot parses free-text incident reports ("contractor slipped on scaffold, 4 days
lost") into the structured `whs_incidents` schema — type classification against the
10-category taxonomy, severity, lost days — with human confirmation before `POST
/incidents` runs (mutation gated per the tier-2 pattern). Reporting: "draft our GRI
403-9 disclosure for FY2026" calls `GET /rates`, benchmarks against the IOGP-cited
sector table, and produces the disclosure text with every rate traceable to the
register — including the mandatory methodology statement (per-million-hours basis)
the current page can't honestly make.

**How.** Tier-2 stack: tool schemas from Evolution A's routes; grounding corpus is
this Atlas page plus GRI 403 requirement definitions. Classification accuracy is
evaluated on a fixture set before intake ships; misclassified severity is the risk
that justifies the confirm step.

**Prerequisites (hard).** Evolution A's register and computed rates — drafting GRI
403 disclosures from random `ltir` fields would fabricate regulated safety metrics;
RBAC since incident data is sensitive personal-adjacent data. **Acceptance:** every
rate in a drafted disclosure recomputes from register rows; intake never writes
without user confirmation; asked for a company's real-world LTIFR, the copilot
distinguishes platform register data from public disclosures.
