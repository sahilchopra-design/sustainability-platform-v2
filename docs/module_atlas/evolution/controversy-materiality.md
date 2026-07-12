## 9 · Future Evolution

### 9.1 Evolution A — A real event study on the curated event set (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide's financial-impact model
(`EV_impact = β × Severity × PersistenceDecay(t)`, EV/EBITDA compression tables,
CDS-spread calibration) is entirely absent — `estImpactUsd` is a hand-entered field.
What the page *does* compute is worth keeping: the double-materiality validation
cross-check (ESRS topics with severe controversies but sub-50 material scores flagged
as "gap") is genuine, useful logic over 30 curated real incidents. Evolution A adds
the missing financial layer as an actual event study rather than asserted
coefficients.

**How.** (1) The 30 curated events have real dates and listed tickers (VW, Boeing,
Shell, Glencore…) — run a standard event study: abnormal returns vs a market model
over event windows (−5,+30 days), using the platform's market-data layer for prices;
statsmodels handles the estimation. (2) Report per-severity-tier mean CAR with
confidence intervals — replacing the guide's uncited "Sev 5 = −6.8× EV/EBITDA" with
numbers the module itself estimated, benchmarked against the Friede et al. /
event-study literature it already cites. (3) Persistence: fit the decay half-life
from the post-event CAR path per sector instead of asserting 18/36 months. (4) The
validation cross-check then gains a financial column: "gap" topics ranked by
estimated (not curated) impact. Keep `estImpactUsd` as a labelled editorial
comparison column.

**Prerequisites.** Price history coverage for the event tickers (the EA-hybrid-v3
market-data seed or an EOD ingest); 30 events is a small sample — report N and
uncertainty honestly rather than sector-level splits the data can't support.
**Acceptance:** each event's CAR reproduces from stored prices; severity-tier
estimates carry confidence intervals; the module's headline no longer implies a 2,000-
event calibration it doesn't have.

### 9.2 Evolution B — Materiality-gap challenger for DMA reviews (LLM tier 1)

**What.** The module's best output — the "gap" status where severe controversy
evidence contradicts a non-material ESRS scoring — is exactly what a double-
materiality assessment reviewer needs surfaced and argued. Evolution B drafts the
challenge memo: for each gap topic, the controversy evidence (which events, their
severity and remediation status), why it challenges the materiality determination,
and the EFRAG-consistent reassessment question — grounded in the
`CONTROVERSY_ESRS_MAP`, the event records, and (post-Evolution A) estimated financial
impact. This feeds the sibling `csrd-dma` module's assessment workflow.

**How.** Tier-1 RAG: this Atlas record, the ESRS topic definitions from refdata, and
the curated event set as grounding; the validation table's computed statuses pass as
structured context. The prompt's honesty rules come from §7.6: `materialScore` values
are curated demo scores, `estImpactUsd` is editorial — until Evolution A, financial
claims must be framed as editorial estimates. No endpoints exist; tier 2 waits for a
backend.

**Prerequisites.** Corpus embedding (D3); coordination with `csrd-dma` if memos are
to land in its workflow. **Acceptance:** every gap memo cites the specific events and
their severities driving the flag; topics with `status = untested` produce "no
evidence either way" rather than manufactured support; memo regenerates identically
for identical validation state.
