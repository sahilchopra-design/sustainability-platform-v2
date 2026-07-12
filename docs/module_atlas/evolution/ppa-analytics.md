## 9 · Future Evolution

### 9.1 Evolution A — Forward-curve hedge valuation replacing seeded-random risk fields (analytics ladder: rung 1 → 3)

**What.** Today this is a tier-B frontend page whose only genuine computation is filtering/averaging over 65 synthetic contracts; §7 flags that the guide's own formulas (`PPANetValue`, `VaR_PPA`, `BasisRisk`) are never computed, and `markToMarket`, `creditExposure`, `offtakerRisk` etc. are independent `sr()` draws — a AAA offtaker can score riskier than a BBB-. Evolution A implements the §8 model spec as this module's first backend vertical: a forward-curve DCF hedge-value engine with Monte-Carlo VaR and capture-vs-hub basis decomposition.

**How.** (1) New `api/v1/routes/ppa_valuation.py` with `POST /value` computing `Σ[(PPAprice − MerchantForward_t) × Volume_t/(1+r)^t]`, `POST /var` (merchant-price path simulation), and `GET /forward-curves`. (2) Seed a `ref_power_forward_curves` table per §8.4 (regional forwards — the platform has none today; EIA/ENTSO-E ingesters are the natural feed) plus a PD-by-rating table so `creditExposure = max(0, NPV) × PD(rating) × LGD` finally responds to the contract's `rating` field. (3) Replace per-contract random fields with engine-derived values; `greenAdditionality` becomes a criteria checklist (vintage/geography/EAC type per GHG Protocol Scope 2), not a coin flip.

**Prerequisites.** Forward-curve data source secured (hard prerequisite — §7.5 states the NPV formula "cannot be computed without one"); contract register persisted (new table) instead of load-time generation. **Acceptance:** two contracts differing only in offtaker rating produce ordered credit exposures; bench_quant pins one reference contract's NPV/VaR.

### 9.2 Evolution B — Procurement copilot for RE100/Scope-2 claims (LLM tier 1)

**What.** A copilot for corporate energy-procurement users answering "is this PPA structure eligible for market-based Scope 2 claims?", "what drives this contract's at-risk flag?", and "explain sleeved vs virtual PPA for our treasury memo" — grounded strictly in this module's Atlas record and the GHG Protocol Scope 2 market-based criteria the guide already cites (§5 standards list).

**How.** Standard tier-1 pattern: `POST /api/v1/copilot/ppa-analytics/ask` over pgvector chunks of this page (§4.1 metric interpretations, §7 limitations, §8 spec). Critically, until Evolution A ships the copilot's system prompt must carry the §7 mismatch flag verbatim: it may explain the price-scenario slider's genuine inequality check (`priceScenario < priceFloor`) but must refuse to interpret `markToMarket` or `creditExposure` as economic quantities, stating they are synthetic placeholders. After Evolution A, upgrade to tier-2 tool-calling against `/value` and `/var` for "re-value at $40/MWh forwards" what-ifs.

**Prerequisites.** Atlas corpus embedded (D3 pgvector stage); refusal-path eval cases written from §7.5's fabrication list. **Acceptance:** copilot refuses to attribute meaning to any field §7.2 marks "Fabricated" and cites GHG Protocol criteria (not the coin-flip field) when asked about additionality.
