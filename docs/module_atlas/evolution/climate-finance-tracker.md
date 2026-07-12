## 9 · Future Evolution

### 9.1 Evolution A — Compute the finance gap from sourced flows (analytics ladder: rung 1 → 2)

**What.** §7 shows the same engine↔page divergence as its sibling hub: the rigorous
OECD-CRS engine (E78) sits uncalled while the page renders hard-coded fund/donor/
pipeline tables (realistic), a 50-row `sr()`-seeded transaction ledger, and a seeded
annual trend — sums and sorts only, no Rio-marker attribution, and the guide's
headline `FinGap(c) = NDCNeed(c) − Committed(c) − Disbursed(c)` never computed.
Evolution A implements the gap formula on sourced terms: OECD DAC climate-finance
totals (published annually) for committed/disbursed, UNFCCC SCF Biennial Assessment
needs compilations for NDC needs, and the engine's Rio-marker logic applied to any
user-entered instruments — with the seeded ledger and trend series deleted.

**How.** (1) `ref_climate_finance_flows(country, year, committed, disbursed, source)`
and `ref_ndc_needs(country, need_low, need_high, source)` reference tables — both
publish as report tables, a bounded curation task; the gap computed per country with
need ranges carried through (needs are ranges, and the gap must be too).
(2) The genuinely useful seed tables (FUNDS, DONOR_FLOWS with NCQG pledges) upgraded
with source/vintage columns. (3) Page wired to the four existing ref GETs
(`cpi-data`, `mdb-institutions`, `ncqg-structure`, `oecd-markers`) so the engine's
real reference payloads replace equivalent hard-coding.

**Prerequisites (hard).** Seeded ledger/trend purge; needs-data honesty — SCF
compilations are incomplete per country, and missing needs must render as gaps in
coverage, not zeros. **Acceptance:** a country's finance gap decomposes into three
sourced terms with vintages; the $100Bn/NCQG progress view reconciles to OECD
published totals; zero `sr()` rows remain.

### 9.2 Evolution B — COP-brief copilot (LLM tier 1)

**What.** A copilot for the questions this tracker exists to answer: "where does the
$100Bn commitment actually stand and on whose accounting?" (OECD vs Oxfam-style
critiques — the copilot cites the accounting basis per §5's SCF/OECD/CPI corpus),
"what share of flows to Africa is adaptation?", "what did donor X pledge under
NCQG?" — retrieval and comparison over the sourced tables with the accounting-method
caveats that make this domain contentious stated explicitly.

**How.** Atlas record, reference tables, and the engine's ref-endpoint payloads as
corpus; every dollar figure cited with source-year-basis (commitment vs disbursement
— the module's own core distinction — must survive into prose); refusal on
forward-pledge speculation.

**Prerequisites (hard).** Evolution A first — the current page's ledger is seeded
and its trend synthetic; narrating them as flow intelligence would mislead.
**Acceptance:** every figure carries source+basis; asked "has the $100Bn been met?",
the answer states the accounting basis and year rather than a bare yes/no.
