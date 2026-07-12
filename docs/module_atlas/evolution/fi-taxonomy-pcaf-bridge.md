## 9 · Future Evolution

### 9.1 Evolution A — Backend vertical for the platform's richest banking calculator (analytics ladder: rung 2 → 3)

**What.** §7 calls this 20-tab page "one of the platform's most complete quantitative banking pages" — GAR/BTAR, PCAF DQ-weighted financed emissions, a correctly transcribed Basel ASRF IRB K-function, IFRS 9 staging, Solvency II SCR, and an NGFS PD-stress lab — with one structural caveat: it is all tier-B frontend computation over `sr()`-seeded `LOAN_BOOK`/`MORTGAGE_POOL`/`CRE_ASSETS`. Evolution A promotes the genuine math to a backend vertical: persist the three books, port the IRB/ECL/SCR/GAR calculators into an engine, and calibrate the illustrative constants §7.6 flags (NGFS/sector PD multipliers, Solvency factors) to a named NGFS Phase IV/V vintage with citations.

**How.** (1) New tables `fi_bridge_loans`, `fi_bridge_mortgages`, `fi_bridge_cre` seeded from the D0 demo book so results are reproducible across sessions and shareable across the FI desk modules. (2) Engine `fi_taxonomy_pcaf_engine.py` exposing `/gar`, `/stress`, `/irb-capital`, `/ecl-staging` — the JS formulas transcribed and bench-pinned (the exactly-transcribed K-function is an ideal `bench_quant` candidate). (3) Add lifetime-ECL term structure and discounting, the two method gaps §7.6 names.

**Prerequisites.** Alembic migration slot; NGFS vintage reference data in refdata; agreement that per-loan `alignedPct` stays a stored field until counterparty taxonomy-disclosure ingestion exists (§7.6 documents this shortcut honestly). **Acceptance:** bench-pinned IRB reference case (given PD/LGD/EAD/M → K matches hand calculation); GAR from the API equals the page's EAD-weighted formula on the same book.

### 9.2 Evolution B — Pillar 3 disclosure-drafting analyst (LLM tier 2)

**What.** The module already models the EBA Pillar 3 ESG ITS templates (`KPI_TEMPLATES`) and a 13-point CSRD/ESRS E1 datapoint crosswalk with ready/gap status. Evolution B turns that into a disclosure-drafting analyst: "draft our GAR disclosure narrative with the DNSH caveats" tool-calls `/gar` and the stress endpoints, pulls the CSRD datapoint statuses, and produces template-shaped disclosure text where every figure is engine-sourced and every gap (`CSRD_DATAPOINTS` entries with status ≠ Ready) is explicitly listed as an open item rather than papered over.

**How.** Tier-2 tool-calling per the roadmap: schemas from the Evolution A OpenAPI operations; grounding corpus is this page's §7 (which already encodes the Art. 8 Delegated Act, EBA ITS, PCAF v2.2 attribution rules). Output renders via the report-studio layer. The fabrication validator is essential here because disclosure text is regulator-facing — numbers are checked against tool outputs before the draft is shown.

**Prerequisites.** Evolution A (a disclosure narrative must not be drafted over seeded books); RBAC-scoped access to the org's book. **Acceptance:** a generated Pillar 3 draft contains only tool-traceable figures, cites the ITS template row for each KPI, and reproduces the CSRD gap list verbatim from the datapoint table.
