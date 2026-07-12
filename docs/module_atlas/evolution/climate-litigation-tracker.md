## 9 · Future Evolution

### 9.1 Evolution A — Live case tracking from the Sabin database; fix the atlas mis-attribution (analytics ladder: rung 1 → 2)

**What.** §7 makes two findings. First, the atlas page itself mis-attributes: the
listed 10 `/api/v1/climate-litigation/*` endpoints belong to the sibling modules
(`climate-litigation`, `climate-litigation-risk-scorer`) — this page
(`ClimateLitigationTrackerPage.jsx`) has zero backend calls and is a pure client-side
filter/aggregate view over a hard-coded 31-case `CASES` array (jurisdiction, year,
sector, theory, status, outcome). The atlas generator's loose `climate-litigation*`
substring match should be fixed so the record reflects reality. Second, 31 hand-typed
cases is a sliver of a corpus that exceeds 2,500 cases globally. Evolution A ingests
the Sabin Center Global Climate Litigation Database (shared work with the
legal-intelligence dashboard's Evolution A — one ingest, two consumers) so the
tracker's filters, theory taxonomy, and outcome views operate over the real, current
case universe.

**How.** (1) Atlas generator fix: endpoint attribution by actual fetch-call analysis,
not id-substring — this is a documentation-infrastructure defect with blast radius
beyond this module. (2) `ref_litigation_cases` shared table (see the
legal-intelligence sibling); this page's existing filter/sort/aggregate UI transfers
unchanged to the larger table, with pagination. (3) Case-status change detection per
refresh so "recent developments" becomes a computed diff, not curation.

**Prerequisites.** Sabin terms and refresh cadence; the shared-ingest coordination
so the two legal modules don't duplicate pipelines. **Acceptance:** the atlas record
for this module lists zero backend endpoints (or the real ones if wiring is added);
case counts reconcile to the Sabin export; the 31-row seed array is deleted.

### 9.2 Evolution B — Docket-watch copilot (LLM tier 1)

**What.** A copilot for monitoring workflows: "what changed in EU climate dockets
this quarter?", "show corporate-defendant cases on a duty-of-care theory and their
outcomes", "which sectors face the newest filings?" — narrated filters and diffs over
the ingested case table, in the same shape the page's UI already offers but
conversational and citation-bearing (case names and jurisdictions quoted per claim).
Tier 1: the tracker aggregates and filters; it does not model, and neither should its
copilot.

**How.** Case-table aggregates as context per the tier-1 pattern; the status-diff
feed from Evolution A grounds "what's new" answers; every case fact cites its row;
the legal-advice disclaimer applies; refusal on outcome prediction and legal
strategy.

**Prerequisites (hard).** Evolution A's real corpus — a watch service over 31 static
hand-typed cases would miss essentially everything it claims to watch.
**Acceptance:** a quarterly-changes answer reconciles to the computed status diff;
every named case exists in the ingested table; asked "will this case succeed?", the
copilot reports historical base rates for the theory and declines the prediction.
