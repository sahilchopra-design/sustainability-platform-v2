## 9 · Future Evolution

### 9.1 Evolution A — Energy-yield model plus bankability scorecard (analytics ladder: rung 1 → 2)

**What.** The module benchmarks CAPEX and schedule across 25 synthetic projects, but
§7's mismatch flag documents that its two headline claims are unimplemented: there is
no AEP/energy-yield model (the "+4–6% SAT uplift" card is a static label — changing
tracker type changes nothing) and no contractor bankability score despite the guide
describing one. Evolution A implements both per the §8 spec: `AEP_tracker =
AEP_fixed × (1 + uplift)` with NREL 2023 uplift parameters feeding
`LCOE = (CAPEX×CRF + OPEX) / AEP`, so tracker choice finally moves an economic output;
and the DNV-style scorecard `Bankability = 0.35·FinStrength + 0.25·TrackRecord +
0.20·WarrantyDepth + 0.20·LDProvision` with `FinStrength` anchored to the real lender
covenant (EPC net worth ≥ 20% of contract value). Also connect `SCHEDULE_RISKS` to
projects: probability-weighted schedule contingency added to `scheduleMonths` instead
of the current fully-decoupled static table.

**How.** Backend `epc_intelligence_engine` (module is Tier B, EP-EC4) with
`POST /lcoe`, `POST /bankability`, `GET /benchmarks`; a new `epc_financials` seed
table for the 10 named contractors (illustrative but structured, provenance-labelled).
Replace the six independent uniform CAPEX draws with a build-up sharing common cost
indices per §8.3, so cross-project CAPEX correlates the way markets do.

**Prerequisites.** §7.4's seeding artefact (components correlated through shared `i`)
removed with the PRNG build-up; NREL uplift constants cited in code. **Acceptance:**
switching a project SAT→fixed-tilt changes its LCOE by the documented uplift; a
contractor with net worth <20% of contract value scores FinStrength <5 and is flagged;
one bench-pinned LCOE case.

### 9.2 Evolution B — EPC term-sheet analyst for lenders (LLM tier 2)

**What.** Independent engineers and project-finance banks evaluate EPC term sheets
against benchmarks — a document-plus-calculation workflow suited to tool-calling.
The analyst takes a term sheet's key parameters (contract value, $/Wdc, schedule,
warranty years, LD caps, contractor), calls `GET /benchmarks` to position the bid
against the 25-project distribution (e.g. "this $0.82/Wdc bid sits in the top quartile
of comparable SAT projects"), `POST /bankability` for the contractor score, and
`POST /lcoe` for the resulting debt-sizing economics — returning a lender-style
screening memo where every number is a tool output.

**How.** Tier-2 stack: tool schemas from Evolution A's OpenAPI operations; the LLM
performs parameter extraction from pasted term-sheet text with a human-confirm step
before tools run. System prompt grounded in this Atlas page, stating explicitly (per
§7.5) that benchmark projects are synthetic-but-calibrated to BNEF/NREL ranges, so
memos position bids against "platform benchmark distribution", never "market data".

**Prerequisites (hard).** Evolution A endpoints and the bankability scorecard — the
current page has neither the score nor any backend; extraction accuracy eval on a
fixture set of term sheets. **Acceptance:** memo figures all trace to tool calls;
a term sheet missing warranty terms yields a flagged gap, not an assumed value;
asked for a contractor's real credit rating, the analyst discloses the illustrative
provenance of `epc_financials`.
