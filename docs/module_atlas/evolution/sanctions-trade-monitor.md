## 9 · Future Evolution

### 9.1 Evolution A — Real portfolio-exposure aggregation over screened holdings (analytics ladder: rung 1 → 2)

**What.** §7 shows a static reference page: the only arithmetic in the file is one `reduce` summing regime entity counts; the guide's `Exposure = Σ(holdings in sanctioned jurisdictions)` is never computed; and the `PORTFOLIO_EXPOSURE` table names real securities (Gazprom, Lukoil, Sberbank, PDVSA, PetroChina) with illustrative percentages that §7.4 warns could be mistaken for actual holdings data. Evolution A implements the exposure aggregation over the user's real portfolio, screened through the platform's live infrastructure.

**How.** (1) Portfolio holdings (from `portfolios_pg`) screened via `sanctions-screening-desk`'s endpoints (CSL live today; EU/UK lists per that module's evolution), plus jurisdiction matching against regime country scopes — producing the guide's exposure sum as `Σ(weight × flag)` with match-confidence bands. (2) Regime metadata (designation counts, program descriptions, trade-policy timeline) becomes a maintained reference table with per-row source dates, replacing hand-entered constants; designation counts derive from the ingested lists themselves, so the headline count is a query, not a typed number. (3) The illustrative named-security table is deleted or clearly fixture-labelled — real tickers with fake exposures is the pattern the platform's fabrication guardrail exists to kill. (4) Trade-policy tracker rows link to `regulatory-change-radar`-style sourcing.

**Prerequisites.** Screening-desk batch endpoint; jurisdiction-scope metadata per regime. **Acceptance:** portfolio exposure recomputes when a holding or a list changes; the total-designations headline equals the ingested-list count; no named security carries an unsourced exposure figure.

### 9.2 Evolution B — Sanctions-exposure briefing copilot (LLM tier 2)

**What.** Compliance and investment teams need the same facts at different altitudes. The copilot serves both: "brief the IC on our Russia-regime exposure — direct designations, jurisdiction-level exposure, and what changed since last month" (list-diff data from the ingesters), "explain why this holding flags under EU but not OFAC" (regime-scope comparison from the metadata), each grounded in screening results and regime records.

**How.** Tier-2 tool calls over the exposure aggregation, screening results, and regime metadata; month-over-month change narratives use ingested list version diffs — a computed what-changed, not recalled news. Regime-difference explanations quote the program scopes from stored metadata with source dates. The screening desk's non-determination disclaimer propagates; the copilot additionally refuses trading-action framing ("should we sell?") — it quantifies exposure and cites designations, full stop. Briefings render via report studio with the list-version footer.

**Prerequisites (hard).** Evolution A's aggregation and list ingestion — briefing from hand-typed designation counts and fictional exposures would be compliance malpractice; version-diff tooling. **Acceptance:** every count and percentage traces to a query; what-changed sections reproduce from list diffs; action-recommendation requests are declined.
