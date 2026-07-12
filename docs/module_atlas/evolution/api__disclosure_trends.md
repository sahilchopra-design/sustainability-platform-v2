## 9 · Future Evolution

### 9.1 Evolution A — Full-catalog denominators, double-materiality filter, and regression trends (analytics ladder: rung 1 → 3)

**What.** Two clean deterministic engines: `DisclosureCompletenessEngine` (coverage vs a 9-framework,
74-datapoint requirement catalogue) and `TrendAnalyticsEngine` (YoY, CAGR, ±3% trend band, on-track
test, peer deviation) — no PRNG, no DB. §7.5 names the deepening targets: completeness is
**presence-based** (supplying any value counts as disclosed — no content/assurance/materiality check),
so the double-materiality principle CSRD actually applies (non-material topics legitimately omissible)
is scored as gaps; framework catalogues are **headline condensations** (15 vs hundreds of E1
datapoints); trend direction uses **endpoint comparison only** (a V-shaped series reads "stable"); and
peer benchmarks are explicitly *illustrative*. Evolution A adds a double-materiality filter (omit
non-material topics from the denominator), regression-slope trends, and real peer benchmark data.

**How.** `assess` accepts a materiality assessment so the coverage denominator excludes non-material
datapoints (with the omission documented, per ESRS); `analyse` adds a regression slope alongside the
CAGR/endpoint test; peer benchmarks are sourced from the platform's real disclosure corpus (CSRD
extraction, SBTi, CA100+) instead of the labelled illustrative anchors. Rung 3: calibrate against
EFRAG-datapoint-level coverage and implement the ESRS BP-2/GRI 2-4 restatement handling the module
cites but doesn't implement.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /completeness` and `/trends`
both **failed**; the presence-only test and headline-condensed catalogues are documented
simplifications to disclose. **Acceptance:** the §7.4 Scope-1 trend (CAGR −4.17%, improving, on-track)
reproduces; a non-material topic no longer counts as a gap under a materiality filter; a V-shaped
series is detected via slope, not read as stable; the failing POST endpoints pass the harness.

### 9.2 Evolution B — Disclosure-readiness copilot with tool-called scoring (LLM tier 2)

**What.** A copilot for reporting teams: "how complete is our ESRS E1 disclosure and what are the
priority gaps?" (`/completeness` → coverage %, urgency-ranked gaps), "how are our emissions trending
vs target and peers?" (`/trends` → CAGR, on-track, peer deviation) — narrating real coverage and
trend outputs. The gap urgency ranking (CSRD/ESRS 4 > ISSB 3 > TCFD 2) directly answers "what should
we prioritise?"

**How.** Tool schemas over the 2 POST + 5 GET operations; the reference endpoints (framework
requirements, KPI definitions, peer benchmarks, sectors) are ideal RAG grounding. The no-fabrication
validator checks every coverage %, CAGR and gap count against tool output; the copilot must state that
completeness is presence-based (not content-assured) and peer benchmarks are illustrative until
Evolution A. Composable with `csrd_reports` and `cdp_scoring` in a disclosure-readiness workflow.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas + reference
corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool call; the
priority gaps a copilot names match the urgency-ranked `/completeness` output; a trend verdict matches
`/trends`, with the on-track direction-clause caveat surfaced.
