## 9 · Future Evolution

### 9.1 Evolution A — A real resolution database that its own KPIs are computed from (analytics ladder: rung 1 → 3)

**What.** The §7 mismatch flag documents the module's defining defect: the subtitle and Tab-0 KPI cards claim "100 climate/ESG resolutions" but `'100'` is a hardcoded string literal — the actual `RESOLUTIONS` array holds 8 hand-authored rows, and all four aggregate tables (`TREND_DATA`, `TOPICS`, `FILERS`, `MGMT_RESP`) are static constants never derived from the row-level data (e.g. "Emissions Targets: 28" versus 2 actual tagged rows). Evolution A makes the headline true: build a genuinely ~100+-row resolution dataset with verifiable sourcing, and compute every aggregate from it.

**How.** (1) Source row-level resolutions from AGM results disclosed in 8-K filings on SEC EDGAR (vote counts are reported there, free and citable) seeded around the 8 existing well-known cases (Follow This at Exxon/Shell/BP, As You Sow at Chevron — real campaigns the page already describes plausibly but uncited). (2) Store in a `shareholder_resolutions` table with `source_accession` per row; serve via `GET /api/v1/resolutions` — the module's first backend vertical. (3) Delete the four static aggregate tables; `TREND_DATA`, topic counts, filer counts, and management-response distribution become `reduce`s over the real rows, so the KPI cards can never again disagree with the database view. (4) Verify the 8 legacy rows' support percentages against the actual filings and attach citations.

**Prerequisites.** EDGAR extraction of vote tallies (Item 5.07 of 8-Ks is semi-structured); UK/EU AGM results need a second source or explicit US-only scoping. **Acceptance:** the "Total Resolutions" card renders `RESOLUTIONS.length`; every aggregate figure is reproducible by filtering the row-level table; each row links to its source filing.

### 9.2 Evolution B — Resolution-text classifier and precedent finder (LLM tier 2)

**What.** Once real resolution texts exist (Evolution A), the analytically valuable layer is textual: classifying resolution demands into the module's 7-topic taxonomy (emissions targets, lobbying disclosure, climate risk reporting, just transition, deforestation, methane) and answering precedent questions — "show me prior methane-disclosure resolutions at O&G majors and how support trended" — by querying the row-level table and reading the resolution texts.

**How.** Tier-2 pattern: the LLM classifies each ingested resolution's text (with a quoted evidence span per topic tag, human-reviewable), writing tags back to `shareholder_resolutions` for deterministic aggregation. The precedent-finder answers by tool-calling `GET /api/v1/resolutions?topic=&sector=` and narrating the returned support trajectory — no external memory of proxy seasons permitted, since that is exactly where plausible-but-unverified numbers creep in (the failure mode this module's hardcoded KPIs exemplify).

**Prerequisites (hard).** Evolution A — there are only 8 uncited rows today; classification and precedent search over invented aggregates would compound the documented 12.5× overstatement. **Acceptance:** every topic tag carries a quoted span from the resolution text; a precedent answer's support figures match the table rows returned by the query.
