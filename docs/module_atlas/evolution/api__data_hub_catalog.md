## 9 · Future Evolution

### 9.1 Evolution A — Identifier-graph entity resolution and cached coverage (analytics ladder: rung 1 → 2)

**What.** The platform's data-source discovery and entity-360 layer over 14 registered public sources
(GLEIF, OpenSanctions, Climate TRACE, OWID, NGFS, SBTi, SEC EDGAR, yfinance, CA100+, TI CPI/FSI/FH/
GII, GEM coal) — no PRNG, live aggregates, honest zero-counts on empty tables. §7.5 names the core
limitation: **entity resolution is heuristic string matching, not identifier-graph resolution** — no
LEI↔ticker↔ISIN bridge is consulted, so the GLEIF/SBTi joins rely on name substrings and both miss
(ticker ≠ legal name, as the §7.4 MSFT example shows) and over-match (short names); sanctions results
are explicitly *potential* (no fuzzy-scoring threshold), a screening starting point not KYC-grade.
Evolution A adds an identifier-bridge table (LEI↔ticker↔ISIN↔CIK) so the 360-view resolves reliably,
and a fuzzy-match confidence score on sanctions hits.

**How.** A `identifier_xref` table (populated from GLEIF Level-1 + SEC CIK-ticker + OpenFIGI, all
already wired) lets `entity_360_view` resolve a ticker to its LEI and legal name before fanning out,
so GLEIF/SBTi joins hit; sanctions matches get a similarity score with a documented threshold.
Rung 2: cache the per-source `COUNT(*)`/`MAX(ingested_at)` via materialized views (roadmap D4) so the
catalog isn't full-table-counting on every request.

**Prerequisites.** The §4.2 harness shows `entity/{identifier}` and `search` returning `db-empty` for
some sources — populate the thin source tables (roadmap D1); fix the benign "13 vs 14 sources"
doc drift. **Acceptance:** the §7.4 MSFT resolution now hits GLEIF via the ticker→LEI bridge
(`source_count` rises); a sanctions hit carries a similarity score; coverage/freshness are served from
cached views, not per-request full counts.

### 9.2 Evolution B — Entity-resolution tool underpinning the desk orchestrators (LLM tier 2)

**What.** This domain is the platform's natural **entity-resolution and source-discovery tool** for
every desk copilot: "resolve ArcelorMittal to its LEI and pull all we know" tool-calls
`entity_360_view` (GLEIF + sanctions + EDGAR + yfinance EVIC + SBTi in one shot), "what sources cover
emissions?" calls `/sources`/`/coverage`, "how fresh is our SBTi data?" calls `/freshness`. It is the
front door that grounds cross-module entity references in one resolved identity — exactly the tier-3
desk-orchestrator routing step the roadmap describes ("assess this counterparty → GLEIF resolve →
sanctions screen → …").

**How.** Register the 5 endpoints as a shared resolution tool; the no-fabrication validator ensures
any entity attribute (EVIC, market cap, sanctions status, SBTi target) cited by a desk copilot traces
to a 360-view tool call with its source. The `evic` field is the PCAF attribution denominator, so a
financed-emissions copilot's attribution factor is grounded here. Sanctions hits are always surfaced
as "potential — screening only," never as adjudicated KYC.

**Prerequisites.** Evolution A's identifier-bridge (heuristic string matching is too unreliable for
tool-backed resolution) and populated source tables; Atlas + source-registry corpus embedded (roadmap
D3). **Acceptance:** an entity resolved by a desk copilot returns its LEI-anchored 360-view with
per-source provenance; an EVIC used in a PCAF attribution traces to the yfinance source via this tool;
a sanctions mention is labelled potential with its similarity score, never presented as confirmed.
