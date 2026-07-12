## 9 · Future Evolution

### 9.1 Evolution A — Article 6.4 transition layer with published grid EFs (analytics ladder: rung 1 → 3)

**What.** §7 confirms genuine CDM formula implementations — ACM0002 via TOOL07
combined margin, an ACM0014/FOD waste baseline, the AMS small-scale suite, a real
AR4/AR5/AR6 GWP table — with only the 50-project portfolio synthetic. Two honest
limits: the 21-row `GRID_EF` seed is a static snapshot (grid EFs are the module's
single most consequential input), and the CDM is transitioning to the Article 6.4
mechanism (A6.4ERs), which changes crediting-period rules and applies corresponding
adjustments. Evolution A grounds the grid EFs in the published UNFCCC/IFI harmonized
dataset with vintage tracking, and adds the 6.4 transition math: crediting-period
eligibility per the CMA rules, host-country corresponding-adjustment flags, and the
CER→A6.4ER label distinction in the registry-netting path (`verified = submitted·(1−unc)`).

**How.** (1) `ref_grid_ef_cdm(country, om, bm, cm, source, vintage)` refdata table
replacing the seed; each calculation displays its EF source and year. (2) Transition
rules as a deterministic eligibility function (activity type, registration date,
crediting-period end) sourced to the A6.4 rulebook in §5's reference lineage.
(3) Bench-pin the three calculator families (ACM0002, FOD, AMS trio) with worked
examples from the actual UNFCCC methodology documents — making this a calibration
anchor for the platform's other CDM-adjacent modules.

**Prerequisites.** The AMS-I.D hard-coded `−500` baseline constant needs a documented
justification or parameterisation; guide already faithful, so no mismatch to clear.
**Acceptance:** UNFCCC worked-example inputs reproduce published ER_y within rounding;
an activity past its crediting window is flagged ineligible with the rule cited.

### 9.2 Evolution B — Methodology-selection analyst (LLM tier 2)

**What.** The module already spans multiple methodologies, making "which methodology
fits my project?" its natural LLM question. A tier-2 assistant interviews the user
(sector, scale, host country), recommends ACM0002 vs AMS-I.D vs III.F with the
size-threshold rules cited, then executes the chosen calculator with the user's
parameters — client-side tool calls over `acm2`, the FOD function, and `amsCalcs`,
since this is a frontend-computed module with no API routes.

**How.** Tool schemas for the three calculator families plus the GWP-table lookup;
per the tier-2 no-fabrication contract, every ER_y, BE_y, and CER figure in an answer
must match a logged invocation; methodology-rule citations come from the §5 reference
corpus (ACM0002 v20, TOOL07 v4, EB47 Annex II).

**Prerequisites.** Evolution A's EF sourcing, so recommendations cite real
country factors; small-scale threshold rules (15MW etc.) encoded, not recalled.
**Acceptance:** a recommendation names the binding eligibility rule; the subsequent
calculation reproduces the page's output for identical inputs; price questions answer
only from the seeded curves, labelled as illustrative.
