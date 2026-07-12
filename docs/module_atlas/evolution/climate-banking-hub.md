## 9 · Future Evolution

### 9.1 Evolution A — Live Pillar 3 templates from platform data (analytics ladder: rung 1 → 2)

**What.** §7 reframes this module accurately: not the guide's four-way risk aggregator
(that formula doesn't exist) but a **bank climate-reporting hub** — EBA Pillar 3 ESG
ITS templates, a 6-period × 15-KPI dashboard with genuine delta/target logic,
risk-appetite headroom, NZBA sector tracking, peer benchmarking, and a board-report
exporter — all over hard-coded seed tables. Evolution A converts the strongest asset,
the EBA template structures (`TEMPLATE4_DATA`, `TEMPLATE9_DATA`, `TEMPLATE10_DATA`,
`PCAF_BY_ASSET_CLASS`, `FE_BY_COUNTRY`), from static seeds into views computed from a
loan-book table: financed emissions per PCAF asset class, template rows derived by
aggregation, and the KPI time series appended per period from data rather than typed.

**How.** (1) `bank_loan_book(exposure_id, asset_class, sector_nace, country, ead,
attribution_factor, counterparty_emissions, data_quality_score)` table with a seeded
demo book; template aggregations as SQL views matching the EBA ITS row definitions.
(2) The KPI dashboard's delta/target mechanics remain unchanged but read computed
period values. (3) The guide rewritten to describe the reporting hub (clearing the §7
flag) with the four-way risk sum either implemented as a simple roll-up of the four
risk-line KRIs or deleted from the guide.

**Prerequisites.** PCAF attribution needs counterparty emissions data — data-quality
scores (PCAF 1–5) must be carried and displayed, since demo books will be DQ-4/5;
Alembic slot post head-merge. **Acceptance:** editing a loan-book row moves the
affected template cell and KPI; template totals reconcile to SQL sums; each figure
carries its PCAF data-quality score.

### 9.2 Evolution B — Board-pack co-author (LLM tier 2)

**What.** The module already ships a board-report exporter with hard-coded key
messages (`BOARD_KEY_MESSAGES`). Evolution B replaces canned prose with grounded
generation: "draft the Q4 board climate update" pulls the period's KPI deltas,
risk-appetite headroom, NZBA sector positions vs pathway, and peer rank as tool calls,
then writes the narrative around those numbers — the highest-leverage LLM surface in
a bank workflow, and safe only because every figure is validator-checked against the
tool outputs.

**How.** Tool schemas over the Evolution A views (read-only); a message-architecture
template (what changed, why, headroom, actions) so drafts are structurally consistent
quarter to quarter; supervisory-expectation questions ("what does SS3/19 require
here?") answered from the §5 corpus with citations, clearly separated from the bank's
own numbers.

**Prerequisites (hard).** Evolution A first — generating board narrative over
hard-coded demo KPIs would produce a confident fiction with a bank's name on it.
**Acceptance:** every numeric in a generated board pack matches a view/tool output;
the draft flags KPIs that breached appetite rather than smoothing them; human sign-off
recorded before export.
