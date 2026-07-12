## 9 · Future Evolution

### 9.1 Evolution A — Real holdings, honest fallbacks, and a defensible portfolio VaR (analytics ladder: rung 2 → 3)

**What.** The aggregation math is sound — exposure-weighted DMI, HHI, Brinson-style selection/allocation/interaction attribution, PCAF financed emissions with attribution factors, WACI, implied temperature — but three things undermine it: holdings live in LocalStorage rather than the platform DB, every missing field silently falls back to `sRand()` (seeded scope 1–3 emissions, seeded DMI), and `portfolioVaR = portDMI·0.15 + portHHI·0.002` is an ad-hoc heuristic presented alongside genuine PCAF numbers. Evolution A grounds all three.

**How.** (1) Holdings from `portfolios_pg` (the platform's critical-rule table — LocalStorage becomes a cache, not the source of truth) via a new `api/v1/routes/dme_portfolio.py`; coverage reporting per the §4 lineage sketch — positions without company-master matches surface in a coverage report instead of getting seeded emissions. (2) Replace `sRand()` fallbacks with honest nulls and PCAF data-quality tier disclosure (the PCAF standard literally has a 1–5 quality score for this exact situation — use it). (3) Retire the heuristic VaR in favor of the dme-financial-risk engine's historical-simulation VaR over the same holdings, or delete the tile until that lands. (4) Rung 3: pin the Brinson decomposition and PCAF attribution arithmetic into `bench_quant.py`; 12-month trend reads persisted portfolio-score snapshots, not `(i−6)·0.3 + sRand()` drift.

**Prerequisites.** dme-entity's `dme_topic_scores` for real EMS inputs; the D0 demo portfolio (200–500 holdings) so aggregation is exercised at realistic scale. **Acceptance:** a fixture portfolio's PfMS, HHI, and financed emissions reproduce by hand; every holding shows either real data or a disclosed PCAF quality tier — zero seeded values.

### 9.2 Evolution B — Portfolio-review analyst for SFDR/TCFD reporting cycles (LLM tier 2)

**What.** A tool-calling analyst for the PM's quarterly loop: "what drove our portfolio materiality score this quarter, which PAIs deteriorated, and what should we engage on?" It chains Evolution A's endpoints — score trend, Brinson attribution, topic attribution, PCAF/WACI aggregates, SFDR classification counts — and drafts the portfolio-level TCFD/SFDR narrative with each figure traced, plus an engagement shortlist of the high-materiality positions the overview's workflow ends with.

**How.** Tool schemas from the new portfolio route; grounding corpus = this Atlas record's §5 (PfMS formula, attribution definitions) and the PCAF/SFDR reference docs cited there. Attribution explanations quote the actual decomposition terms (`selection = (holdingDMI − benchmarkDMI) × weight`), preventing the classic LLM failure of explaining Brinson from memory instead of from the implemented variant. Coverage gaps are first-class: the draft discloses what share of AUM lacks scores, sourced from the coverage endpoint.

**Prerequisites (hard).** Evolution A — an SFDR PAI narrative over seeded scope-3 fallbacks would put fabricated emissions into a regulated disclosure. **Acceptance:** every figure in a golden-portfolio draft matches a tool response; positions without coverage appear in the disclosed-gaps section, never with imputed numbers.
