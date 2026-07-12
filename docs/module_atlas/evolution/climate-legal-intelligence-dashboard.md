## 9 · Future Evolution

### 9.1 Evolution A — Case-driven scoring from the Sabin database (analytics ladder: rung 1 → 2)

**What.** §7 flags the gap: the guide's case-driven
`LRS = Σ(CaseWeight × JurisdictionFactor × OutcomeProbability)` requires ingested
filings, but the code generates 100 synthetic entities with six independent seeded
dimensions, means them, and derives a "Net Legal VaR" from seeded amounts. The Sabin
Center's Global Climate Litigation Database — which the guide itself names — is
publicly browsable and exportable, giving real cases with jurisdiction, claim type,
status, and outcome. Evolution A builds the case layer: an ingested case table, entity
exposure computed from actual cases naming (or sectorally implicating) the entity, and
jurisdiction factors derived from observed case density and outcome rates per
jurisdiction rather than asserted.

**How.** (1) `ref_litigation_cases(case_id, jurisdiction, claim_type, defendant_
sector, status, outcome, filed_year, source)` from Sabin exports (periodic refresh —
the database updates continuously). (2) The guide's LRS implemented with documented
weights: case weight by claim type and court level, jurisdiction factor from the
observed per-jurisdiction win/settle rates, outcome probability as the historical
base rate per claim type — all derivable from the ingested table itself.
(3) The Net Legal VaR retained but its litigation-amount input restricted to cases
with disclosed claim amounts, else honest-null.

**Prerequisites (hard).** Sabin data terms (academic database, attribution required);
synthetic-entity purge — sector-level views can be real immediately, entity-level
views only for entities actually appearing in cases. **Acceptance:** a sector's case
count reconciles to the ingested table; jurisdiction factors are reproducible
aggregates; zero seeded risk dimensions remain.

### 9.2 Evolution B — Legal-trend intelligence copilot (LLM tier 1 → 2)

**What.** A copilot over the real case corpus: "what greenwashing cases were filed in
the EU this year and how do outcomes trend?", "which claim types are growing fastest
against utilities?", "summarise the precedent posture for disclosure-failure claims
in Germany" — filtering, counting, and trend narration over the ingested Sabin table,
with claim-type taxonomy from the sibling engine's `/ref/case-taxonomy` endpoint
(already live in the climate-litigation module). Tier 2 adds entity screening as tool
calls into the Evolution A LRS function.

**How.** Tier 1: case-table aggregates + §5 corpus (UNEP litigation trends reports)
as grounding; every count and rate cites the query that produced it. Tier 2: tool
schema over the LRS scorer; validator on all scores and VaR figures. Case summaries
quote case names and dockets — verifiable — never paraphrase outcomes not in the
data.

**Prerequisites (hard).** Evolution A first; legal-domain prompt discipline (the
copilot describes litigation data, it does not give legal advice — a mandatory
disclaimer path). **Acceptance:** every case fact traces to an ingested row; an
entity absent from the case table gets "no recorded cases", not an invented score.
