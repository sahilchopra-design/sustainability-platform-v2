## 9 · Future Evolution

### 9.1 Evolution A — Consolidate the twin E75 engines and ground trade-lane emissions (analytics ladder: rung 2 → 3)

**What.** `trade_finance_engine.py` is a second, complementary E75 engine (distinct from
`sustainable_trade_finance_engine.py`) behind `/api/v1/trade-finance-esg`: EP4 categorisation with
OECD CRC premium (`crc × 0.05`), ECA standards with coal exclusion, green-instrument eligibility
(ICC STF 2022 8-principle score, pricing benefit interpolated in bps), supplier ESG tiers A–E with
dynamic discounting, and trade-flow emissions (Scope 3 Cat 1/Cat 4 per lane from embedded transport
emission factors). It shows good honesty (`total_scope3_cat1 = None` when any supplier lacks
spend data) but overlaps heavily with its sibling — two EP4 scorers, two ECA classifiers — and the
Cat 1 proxy (`spend / (product_ghg × 0.5)`) is coarse. Evolution A consolidates and calibrates.

**How.** (1) Reconcile the twin engines: one EP4 categoriser and one ECA classifier shared by both
routes (or an explicit division of labour documented in both), so the platform can't give two EP4
categories for one project. (2) Ground trade-lane volumes and modes from the UN Comtrade module
(`un_comtrade` proxies real flows) instead of caller-typed lane data, with provenance. (3) Replace
the `× 0.5` spend-to-volume proxy with EEIO or product-price-based conversion, keeping the honest
null for incomplete portfolios. (4) Bench-pin the EP4 score, CRC premium, and lane emissions.

**Prerequisites.** A consolidation decision with `sustainable_trade_finance`; Comtrade linkage
(that module's trade-flow endpoint currently fails); EEIO/price factors. **Acceptance:** identical
project inputs to both routes yield one EP4 category; lane emissions cite a flow-data source or the
caller-input label; the Cat 1 proxy carries documented conversion provenance; bench pins pass.

### 9.2 Evolution B — Trade-lane emissions and instrument-eligibility copilot (LLM tier 2)

**What.** A copilot for trade-finance and procurement teams: "what are the Scope 3 emissions of
this Shanghai–Rotterdam lane by sea vs air, and does the financing qualify as a green LC?" —
calling the trade-flow and green-instrument endpoints and narrating the mode-shift deltas, ICC STF
score, and pricing benefit in bps, each figure tool-sourced.

**How.** Four POST assessments plus five `ref/*` registries (transport emission factors with their
standard, EP4 categories/principles, ESG tiers with ICC STF and ILO standards, green instruments,
OECD Arrangement sectors) — every constant citable. Mode-shift what-ifs ("rail instead of air")
re-run statelessly and produce the decarbonisation-vs-cost narrative; the supplier-tier output
drives dynamic-discounting proposals. Pairs with `sustainable_trade_finance` (until consolidation)
and `supply_chain_workflow` on a trade desk.

**Prerequisites.** None hard — the engine is deterministic with honest nulls; consolidation
(Evolution A) before the copilot spans both trade-finance modules, to avoid contradictory EP4
narrations. **Acceptance:** every emissions, score, and bps figure traces to a tool response;
incomplete-portfolio Scope 3 totals are reported as the engine's honest null, never summed around;
the copilot cites the emission-factor standard per lane and refuses to assert green-label
certification (an external review).
