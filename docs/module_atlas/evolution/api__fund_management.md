## 9 · Future Evolution

### 9.1 Evolution A — Covariance-based tracking error and benchmark-resolved analytics (analytics ladder: rung 1 → 3)

**What.** `FundStructureEngine.analyse_fund` is a single-shot deterministic calc whose
own docstring concedes its weakest link: tracking error is
`√(Σ sector active-wt²) × 0.20` — a flat 20% vol proxy the code labels "rough proxy…
real TE needs covariance matrix". The sustainable-investment test (`esg_score ≥ 50 AND
dnsh_compliant`) is likewise a synthetic stand-in for SFDR Art 2(17). Evolution A
replaces both with data-grounded versions.

**How.** (1) Build a sector covariance matrix from the ingested `YfinanceMarketData`
price/beta history (the `financial_data` domain already stores beta and sector), so TE
becomes `√(wᵃᵀ Σ wᵃ)` over sector active weights with a documented estimation window.
(2) Benchmark holdings resolve by ISIN against stored reference data rather than
arriving fully caller-supplied, enabling a persisted benchmark library. (3) Fix the §7.6
observation that CarbonFP numerically equals WACI — financed emissions should use EVIC
attribution (available via `/api/v1/financial-data/market/evic`), not revenue-intensity
shortcut. (4) Pin WACI/active-share/TVPI in bench_quant against a hand-computed
reference fund.

**Prerequisites.** Historical market-data snapshots (shared prerequisite with the
financial_data evolution); a stored benchmark-constituents table. **Acceptance:** TE for
a reference fund moves when the covariance window changes and matches a
statsmodels-computed value within tolerance; CarbonFP ≠ WACI for a fund whose holdings'
EVIC differs from revenue base.

### 9.2 Evolution B — SFDR classification copilot over fund analytics (LLM tier 2)

**What.** A copilot that takes the `FundAnalyticsResult` from `POST /analyse` and
answers the questions compliance teams actually ask: "does this holding mix support an
Article 8 badge?", "which holdings breach our exclusions and what happens to
sustainable-investment % if we drop them?" — running the drop as a real re-call of
`/analyse` with the amended holdings list, never by arithmetic in the prompt.

**How.** Tool schemas for the module's two endpoints (`POST /analyse`,
`GET /sfdr-summary`); the static Article 6/8/8+/9 descriptions from `/sfdr-summary`
plus this Atlas page's §5/§7 formulas form the grounding corpus. What-if loops are
cheap because the engine is stateless — the copilot mutates the holdings payload and
re-analyses. Guardrail: the copilot must present SFDR classification as *indicative*,
citing the §7.2 caveat that the sustainable-investment test is a synthetic proxy, and
refuse to assert regulatory compliance.

**Prerequisites.** Evolution A's Art 2(17) test upgrade is strongly advised first —
otherwise the copilot narrates a threshold (`esg ≥ 50`) with no regulatory basis and
must caveat every answer. **Acceptance:** a "what if we exclude these 3 ISINs" question
produces a fresh `/analyse` tool call whose output matches the quoted deltas; the
copilot refuses to state "this fund is Article 9 compliant" and instead reports the
computed sustainable-investment % against the disclosed indicative threshold.
