## 9 · Future Evolution

### 9.1 Evolution A — Compute the composite the guide promises, on real registers (analytics ladder: pre-rung-1 static → 2)

**What.** §7 establishes this page computes nothing: every figure (strategy AUM strings, ESG scores 61–72, coverage %, stress impacts) is a hand-authored literal, there is no `reduce` anywhere, and the file is byte-identical to `private-markets-hub` (the export is even mis-named `PrivateMarketsHubPage`). The guide's `ESG_pm = Σ(AUMᵢ × ESGᵢ)/ΣAUMᵢ` is unimplemented. Evolution A first resolves the duplication — one module keeps the qualitative playbook (the DD stages and SFDR/AIFMD/CSRD regulatory register are genuinely content-accurate per §7.2), and this hub becomes the computed aggregation layer over the platform's real private-markets registers.

**How.** (1) Aggregation endpoint `GET /api/v1/private-markets/esg-composite` that reads the persisted books its sibling modules are evolving toward (`private-credit` facilities, `private-assets-transition` PE funds, real-estate holdings) and computes the AUM-weighted composite with per-class coverage %, honestly returning nulls for classes with no data rather than demo constants. (2) `STRATEGY_CARDS` AUM fields become numbers sourced from those registers; the 5×6 `STRATEGY_RISKS` matrix becomes averages of class-level scores where they exist, hand-authored placeholders clearly flagged where they don't. (3) Deduplicate with `private-markets-hub` — one route redirects or the shared content moves to a common component.

**Prerequisites.** At least two sibling registers persisted (dependency on their Evolution A work); the dedup decision made deliberately, not by drift. **Acceptance:** the composite changes when a facility's ESG score changes in `private-credit`; classes without data render "no coverage" instead of the current literal 68–89%.

### 9.2 Evolution B — LP reporting copilot over the regulatory register (LLM tier 1)

**What.** The module's durable asset is qualitative: an 8-stage ESG DD workflow and a six-regime regulatory register (SFDR, AIFMD, ELTIF, SEC, SDR, CSRD) that §7.2 calls content-accurate. Evolution B ships a tier-1 copilot for LP-reporting teams: "which of these regimes applies to a Luxembourg ELTIF with US LPs?", "draft the ILPA ESG section using our current coverage stats", "what DD stage should flag a red-flag sector exit clause?" — answered from the register, the DD-stage narrative, and (post-Evolution A) the computed composite.

**How.** Standard `POST /api/v1/copilot/private-markets-esg-hub/ask` over pgvector chunks of this Atlas record plus the `REGULATIONS`/`DD_STAGES` content and ILPA/GRESB reference texts named in §5. Quantitative questions are answered only from Evolution-A endpoint values injected as context; before that ships, the copilot must answer "what's our composite score?" with "not yet computed — the displayed figures are illustrative", which is exactly what §7 documents. Regulatory answers cite regime and deadline from the register, never from model memory alone.

**Prerequisites.** Register content dated and maintained (stale deadlines are worse than none); corpus embedded. **Acceptance:** regime-applicability answers cite the specific `REGULATIONS` row, and pre-Evolution-A quantitative questions get the documented illustrative-data refusal.
