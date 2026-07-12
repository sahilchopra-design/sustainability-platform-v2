## 9 · Future Evolution

### 9.1 Evolution A — Complete the 18-indicator set and widen the CDP-grade data path (analytics ladder: rung 1 → 3)

**What.** This module has the strongest real-data grounding in the SFDR family — 5 named Indian companies with sector-appropriate financials, and PAI-1/2/4 genuinely wired to CDP data for oil & gas tickers — plus a 14-route backend (`sfdr_pai_engine`) with honest division guards. Two REM-38 findings remain open per §7: PAI-16 is still mislabelled ('Countries with Social Violations') and PAI-17/18 (real-estate) are absent, so only 16 of 18 indicators exist, while the sibling `sfdr-pai-dashboard` already carries the corrected 18-row taxonomy. Evolution A closes the indicator gap and extends the real-data path beyond the O&G subset.

**How.** (1) Port the sibling's corrected `PAI_INDICATORS` (relabel PAI-16 to sovereign fossil-fuel exposure, add PAI-17/18) into both this page and the engine's `calculate_all_mandatory` path. (2) Extend CDP-style sourcing to PAI-3/5/6 for the default holdings, and mark every non-sourced field `estimated: true` in the API response — §7.6 notes manual estimates are currently indistinguishable from disclosed figures. (3) Replace the `totalAUM || 1` guard with an explicit empty-portfolio state (the guard silently renders near-zero weighted values). (4) Exercise the already-built `POST /benchmark` and `POST /compare-periods` routes from the UI — the engine supports period-over-period deltas and peer ratios that the page doesn't yet surface.

**Prerequisites.** SME verification of PAI-16's current RTS text; sibling taxonomy as the template. **Acceptance:** `GET /ref/mandatory-indicators` returns 18 correctly-labelled rows; every UI figure displays disclosed/estimated provenance; empty portfolio renders "no holdings," not 0.

### 9.2 Evolution B — Data-coverage triage analyst (LLM tier 2)

**What.** The RTS's real-world pain is not the arithmetic (the engine does that) but the data plumbing: which holdings lack which indicator inputs, what proxies are defensible, and how coverage caveats must be worded in the statement. Evolution B is a tool-calling analyst over `POST /data-coverage`, `POST /classify-entity`, and `POST /calculate-all`: "where are my PAI-7 gaps?", "which holdings drive the GHG-intensity number?", "draft the coverage-limitation paragraph" — each answered from live engine output, with the coverage wording citing the actual computed `data_quality_score`.

**How.** Tool schemas from the module's OpenAPI operations (9 POST computes, 5 GET refs, all read-only or compute-only); grounding corpus = this Atlas record plus `GET /ref/calculation-methods` payloads (the engine already encodes PCAF chapter citations per indicator). The fabrication validator checks every coverage percentage against tool responses.

**Prerequisites.** Evolution A's `estimated` flags — coverage triage is meaningless if estimates masquerade as disclosures. **Acceptance:** every coverage figure quoted matches a `/data-coverage` response; asking for a PAI-17 value before Evolution A lands yields "indicator not implemented," not a number.
