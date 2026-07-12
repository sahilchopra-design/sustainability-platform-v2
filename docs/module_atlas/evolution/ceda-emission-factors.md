## 9 · Future Evolution

### 9.1 Evolution A — Server-side factor service with vintage and uncertainty (analytics ladder: rung 1 → 3)

**What.** §7 rates this one of the platform's genuinely data-backed modules: a real
149-country × 400-sector EEIO dataset (`data/ceda-2025.json`) with deterministic O(1)
lookups, regional fallback, currency conversion, and a correct GHG Protocol spend-based
Scope-3 calculator via `CedaContext`. Its honest limits: the dataset ships as a static
frontend JSON (every client downloads the full matrix; other backend engines cannot
reach it), factors carry no uncertainty, and the single 2025 vintage will silently
stale. Evolution A promotes it to a platform factor service: the matrix loaded into a
`ref_eeio_factors(country, sector_isic, ef_kgco2e_usd, vintage, source)` table behind
`/api/v1/refdata` endpoints, with per-cell provenance (CEDA vs Exiobase vs WIOD, which
§1 says are all integrated) and published EEIO uncertainty ranges attached
(spend-based factors typically carry ±30–60% — the module should say so numerically).

**How.** (1) One-time ETL of the JSON into Postgres; `CedaContext` refactored to the
platform's `useReferenceData` pattern with the regional-fallback logic preserved and a
`resolution_tier` field reporting when fallback fired. (2) Deflator handling made
explicit: factors re-based per §5's PPP-deflator method with base-year displayed.
(3) The EEIO-vs-process-LCA comparison tab backed by a small curated pairs table
rather than prose.

**Prerequisites.** CEDA licensing check for server-side redistribution; existing
frontend behaviour regression-pinned (same EF for 20 sampled country-sector pairs).
**Acceptance:** any backend engine can resolve a factor via the refdata route; every
lookup response carries vintage, source, and fallback status.

### 9.2 Evolution B — Scope-3 estimation analyst (LLM tier 2)

**What.** A tool-calling assistant for the module's core workflow: "estimate scope 3
for this spend ledger" — the LLM maps free-text purchase categories to ISIC sectors
(the genuinely hard, currently-manual step §1 describes), calls
`calculateSpendEmissions` per line, and returns a categorised estimate with every
kgCO₂e traceable to a factor lookup. Mapping is where an LLM adds real value: "IT
consulting, Bangalore office" → ISIC J62, India factor — with the match confidence
stated and ambiguous lines flagged for human review rather than silently guessed.

**How.** Tool schemas over `getEmissionFactor` and `calculateSpendEmissions` (or the
Evolution A refdata endpoints once server-side); the no-fabrication validator requires
each line's EF to match a lookup response; the answer table shows category → ISIC →
country → EF → tCO₂e so the mapping is auditable line by line.

**Prerequisites.** Evolution A's uncertainty ranges, so estimates carry honest error
bars; a golden mapping set (~50 purchase descriptions → ISIC) to bench the LLM's
categorisation per the bench_llm pattern. **Acceptance:** mapping accuracy ≥90% on the
golden set; every emission figure in output equals EF × spend for a logged lookup.
