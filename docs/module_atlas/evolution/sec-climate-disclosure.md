## 9 · Future Evolution

### 9.1 Evolution A — EDGAR-calibrated disclosure benchmarking across live regimes (analytics ladder: rung 1 → 3)

**What.** The module already has a real backend vertical (10 routes in `api/v1/routes/sec_climate.py`, `sec_climate_engine` with honest YoY/intensity math) and — correctly — treats Release 33-11275 as rescinded (`SEC_RULE_STATUS`, `legal_force: False`), positioning itself as a voluntary TCFD/ISSB-S2 framework. What it lacks is any observed data: the 40 frontend companies are `sr()`-synthetic with a fixed positional filer split, and `readiness` is a random draw uncorrelated with the disclosure flags. Evolution A calibrates readiness scoring against actual filings: ingest climate-related sections of real 10-Ks via SEC EDGAR full-text search (free, keyless) and score real registrants item-by-item against the Reg S-K 1500–1505 ↔ TCFD ↔ ISSB S2 cross-mapping the page already carries (its "most reliably grounded content" per §7.6).

**How.** (1) An `edgar_climate_ingester` following the platform's 19-ingester scaffold, populating `sec_filing_climate_sections`. (2) Extend `POST /materiality` and `/filer-assessment` to accept an actual CIK, deriving disclosure booleans from filing evidence rather than user assertion. (3) Sector-level benchmark distributions (real disclosure rates per S-K item) replacing the synthetic 40-company roster.

**Prerequisites.** EDGAR rate-limit handling (10 req/s, User-Agent header); the frontend must drop the `sr()` company generator once real distributions exist. **Acceptance:** readiness score for a named registrant cites specific filing excerpts; `hasTransitionPlan` can no longer be true while readiness contradicts it.

### 9.2 Evolution B — Disclosure-drafting analyst over the ref endpoints (LLM tier 2)

**What.** The module's six `GET /ref/*` endpoints (filer-categories, reg-sk-items, reg-sx-items, attestation, safe-harbor, cross-framework) are a structured regulatory corpus ideally shaped for tool-calling. Evolution B is a copilot that answers "what would Item 1502(a) have required of an LAF, and what is the ISSB S2 equivalent I should disclose voluntarily?" by calling those endpoints, and drafts gap-remediation language grounded in the registrant's own `filer-assessment` response — always carrying the engine's rescission note forward so no answer implies live SEC obligation.

**How.** Tool schemas from the module's OpenAPI operations (all read-only except the four POST assessments, which are compute-only, no mutation); system prompt assembled from this Atlas page with the §7 regulatory-status note pinned as a non-negotiable preamble. The fabrication validator checks numerics against tool outputs; the rescission caveat is asserted by a post-response check (answer must not contain "required by the SEC" without the qualifier).

**Prerequisites.** None hard — the backend already exists and correctly caveats status; the copilot inherits that honesty. **Acceptance:** every cited rule item traces to a `/ref/*` response; asking "when is my Scope 3 filing due to the SEC?" yields the rescission explanation, not a date.
