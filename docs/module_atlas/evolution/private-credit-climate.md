## 9 · Future Evolution

### 9.1 Evolution A — Actually compute PCAF financed emissions (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag is blunt: the guide promises `FE = (Outstanding/EVIC) × Scope1+2` with PCAF DQ scoring, but no EVIC field, no attribution, and no financed-emissions figure exists — the page is a 50-loan `sr()`-seeded book whose only real arithmetic is `expectedLoss = pd × lgd / 100`, and `transRisk`/`physRisk`/`carbonFp`/`scenarioLoss1-3` are labelled random draws. Evolution A implements the missing methodology. Notably the sibling `private-credit` module already computes the correct PCAF private-debt attribution factor (`min(drawn/(equity+debt),1)`) — this module should share that logic, not duplicate it.

**How.** (1) Backend `POST /api/v1/private-credit-climate/financed-emissions`: per-loan attribution × borrower Scope 1+2, with the PCAF 5-tier data-quality ladder implemented as declared estimation cascades (reported emissions → sector-average intensity × revenue → asset-turnover proxy), each tier stamped on the row. (2) Sector-average emission factors seeded from the refdata layer (OWID/EPA intensity tables already in `reference_data`). (3) Scenario losses re-derived: NGFS scenario × sector transition exposure replacing the three seeded `scenarioLoss` fields. (4) The loan book becomes a persisted table with borrower financials (revenue, debt+equity) so attribution has a denominator.

**Prerequisites.** The §7 fabrication acknowledged in release notes (headline "2.4M tCO₂e" was never computed); borrower emissions/financials schema agreed with `private-credit`'s facility model to avoid a second register. **Acceptance:** portfolio FE equals the hand-summed per-loan attributions in a bench case; every loan reports its PCAF DQ tier; deleting a borrower's reported emissions demotes it to a lower tier rather than silently keeping the number.

### 9.2 Evolution B — TCFD reporting copilot for the credit book (LLM tier 1 → 2)

**What.** The module's consumers are net-zero and TCFD reporting teams. Evolution B adds a copilot that turns the computed book into disclosure-grade narrative: "draft our private-credit financed-emissions paragraph with DQ-tier caveats", "which sectors drive our high-physical-risk exposure and what changed vs Q1?" — grounded in the module's endpoints and the PCAF Part A text.

**How.** Tier 1 ships against the Atlas record plus PCAF Standard extracts in the pgvector corpus; the copilot's core competence is DQ-honesty — every emissions figure it quotes must carry its tier ("Tier 4 estimate, sector-average proxy"), mirroring PCAF's own disclosure requirement. Tier 2 adds tool calls to `/financed-emissions` and the scenario endpoint for interactive drill-downs ("re-attribute assuming 20% amortization"). The no-fabrication validator applies; the copilot must not exist on the page before Evolution A lands, since today's figures are seeded.

**Prerequisites (hard).** Evolution A complete — narrating the current random `carbonFp` fields would be fabrication with citations. **Acceptance:** a generated TCFD paragraph's every tCO₂e figure traces to a tool response including its DQ tier, and the copilot refuses Scope 3 questions (the module computes Scope 1+2 only).
