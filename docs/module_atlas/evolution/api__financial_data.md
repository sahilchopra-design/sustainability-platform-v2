## 9 · Future Evolution

### 9.1 Evolution A — Fundamentals time-series analytics over the EDGAR corpus (analytics ladder: rung 1 → 2)

**What.** Today this domain is a read-only query surface over `SecEdgarFiling` and
`YfinanceMarketData` — its only computations are SQL aggregates (per-sector AVG(pe_ratio),
COUNT(filings), MIN/MAX(fiscal_year)). Evolution A adds a derived-analytics layer:
multi-year growth and trend metrics computed from the filing history the tables already
hold, turning `/edgar/compare` from a raw time-series dump into a fundamentals
diagnostic.

**How.** (1) Extend `/edgar/compare` with computed CAGR (revenue, EBITDA, FCF), margin
trajectories, and leverage trend (D/E slope) across available fiscal years — pure
arithmetic over stored rows, honest nulls where a company has <3 filings. (2) Add a
`/market/evic/history` variant that snapshots EVIC over ingest dates so PCAF consumers
(the stated purpose of `/market/evic`) can pick attribution denominators per reporting
date rather than latest-only. (3) Cross-check the stored EVIC identity
(market_cap + total_debt) server-side and flag rows where components don't reconcile,
since the route currently trusts the ingest pipeline blind.

**Prerequisites.** Ingest pipeline must retain historical snapshots rather than
upserting latest (schema change: effective-date column on `YfinanceMarketData`);
sufficient EDGAR corpus depth per ticker. **Acceptance:** `/edgar/compare` returns CAGR
with an explicit `years_covered` field and nulls below threshold; at least one
EVIC-reconciliation flag surfaces on a deliberately corrupted test row.

### 9.2 Evolution B — Grounded fundamentals Q&A for PCAF and valuation consumers (LLM tier 2)

**What.** A tool-calling analyst that answers "what EVIC should I use for Acme Corp's
2024 financed-emissions attribution?" or "compare revenue trajectories of these three
issuers" by calling the module's nine GET endpoints and narrating only stored,
role-gated data — this domain is the natural grounding source for numbers other
copilots would otherwise be tempted to invent.

**How.** All nine endpoints are read-only, `require_min_role("viewer")`-gated, and
Pydantic-typed — the safest possible tier-2 tool surface. Tool schemas come from the
OpenAPI spec filtered by this module's endpoint map; the copilot inherits the user's
session per the roadmap's RBAC-inheritance rule. Crucially, this module should register
as a *shared tool* for the Desk Orchestrator (tier 3): the PCAF, unified-valuation, and
peer-benchmark copilots resolve fundamentals through these endpoints instead of their
own guesses. `/stats` provides the corpus-coverage disclaimer the copilot must lead
with when a ticker is absent.

**Prerequisites.** Corpus coverage documentation (which CIKs/tickers are ingested, as
of when) exposed via `/stats` so refusals are grounded; entity-name → ticker resolution
via the GLEIF/entity-resolution module for natural-language company references.
**Acceptance:** asking about a non-ingested ticker yields "not in corpus (N companies
covered as of DATE)" rather than a hallucinated figure; every quoted fundamental
matches a tool response field exactly.
