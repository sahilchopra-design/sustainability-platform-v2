## 9 · Future Evolution

### 9.1 Evolution A — Live ROI formula and worker-weighted KPIs (analytics ladder: rung 1 → 2)

**What.** This module is refreshingly honest — no PRNG at all, and its hand-curated
10-region dataset encodes wage *decline* in 6 of 10 regions (Alberta −16.7%), which
§7.2 rightly credits as a non-trivial modelling choice. Two documented gaps: §7.3(4)
shows `ROI_DATA.roi` was evidently hand-derived from the guide's formula once (Solar
Install Cert: computed 147.6% vs stored 148%) but isn't live-computed, so editing
`cost` or `avgWageGain` today silently desynchronises the ROI; and §7.4 shows the
headline KPIs are unweighted regional means — Shanxi's 8,500-worker cohort counts the
same as Yorkshire's 2,100, overstating programme-wide completion because the largest
cohorts underperform. Evolution A makes the ROI formula live
(`ROI = (WageGain × PlacementRate × Years − Cost)/Cost` with the horizon and
placement inputs explicit and user-adjustable), switches portfolio KPIs to
worker-weighted averages, and adds a programme-entry form persisting to a
`workforce_programmes` table so the tracker can actually track — new cohorts,
quarterly outcome updates, and a region's trajectory over time instead of one static
snapshot.

**How.** Small backend vertical (module is Tier B, EP-CO1): `POST /programmes`,
`GET /programmes`, `POST /roi` in a new route; Alembic migration for the table; the
static 10-region dataset becomes the seed fixture with provenance labels.

**Prerequisites.** Time-horizon assumption in the ROI made explicit (the hand-derived
figures implied 5 years); decision on currency normalisation for cross-region wage
comparison. **Acceptance:** editing a programme's cost updates its ROI on render;
the headline completion rate is worker-weighted (and visibly lower than the current
71.0% given the large underperforming cohorts); a newly entered cohort appears after
reload.

### 9.2 Evolution B — Just-transition programme advisor (LLM tier 1 → 2)

**What.** The module's users — just-transition funds, development banks, policy
teams — ask comparative questions the dataset can genuinely answer: "why do Ruhr
Valley and Yorkshire outperform — what do the wage-gain regions have in common?",
"is Alberta's Oil→Wind pathway viable at 59% placement and a 16.7% wage cut, and what
would placement need to reach for ROI break-even?" Tier-1 first: a copilot grounded
in this Atlas page and the on-page dataset, whose honest wage-decline structure gives
it unusually substantive material. Tier-2 adds Evolution A's `POST /roi` as a tool so
break-even questions are computed ("placement rate at which Alberta's ROI turns
positive") rather than estimated, and `GET /programmes` for portfolio queries once
real cohorts accumulate.

**How.** Standard copilot stack (`llm_corpus_chunks` embedding;
`POST /api/v1/copilot/workforce-transition-tracker/ask`); the system prompt carries
§7.5's provenance statement — plausible ILO-consistent illustrative estimates, not
traceable dataset rows — so answers about "the data" are correctly framed.

**Prerequisites.** pgvector corpus; Evolution A for any computed break-even claims.
**Acceptance:** every %, wage, and ROI in an answer matches the dataset or a tool
response; break-even answers cite the ROI tool run with its horizon assumption;
asked for a region outside the 10 tracked, the advisor says so rather than
generalising.
