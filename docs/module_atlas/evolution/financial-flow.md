## 9 · Future Evolution

### 9.1 Evolution A — Validated externality pricing with uncertainty bands (analytics ladder: rung 2 → 3)

**What.** §7 re-identifies this module honestly: despite its guide's Paris-finance-gap framing (which belongs elsewhere), the code is a product-level true-cost engine — 15 products with BOM stage breakdowns, commodity-price sensitivity with bull/bear scenarios, and five monetised externalities in the Kering-EP&L style. Its flagged weaknesses: the air-pollution term is an unvalidated `0.15×GWP` proxy, externalities are single-point estimates with no uncertainty, the portfolio `commodity_sensitivity`/`revenue_mn` fields are `seed()`-synthetic with `top_commodity` assigned by index position. Evolution A hardens the pricing: replace the air proxy with pollutant-specific damage costs (EPA/EEA marginal damage values per PM2.5/NOx/SO2, requiring per-product pollutant estimates rather than a GWP scalar), attach low/central/high ranges to each shadow price (the SCC alone spans $51–$190 across vintages), and render true cost as a band.

**How.** (1) Move `EXTERNALITY_PRICES` to a versioned refdata table with source, vintage, and range columns. (2) Compute the externality breakdown at three price points; the waterfall shows central with whiskers. (3) Either wire portfolio sensitivity to real company commodity exposure (via the platform's company master and trade data) or remove the tab — the current seeded scoring is a §7-flagged fabrication.

**Prerequisites.** The seeded portfolio fields must not survive into a calibrated release; guide text re-pointed so §5 describes the true-cost model actually built. **Acceptance:** each externality line cites its price source and vintage; true-cost totals recompute correctly at all three price points; no `seed()` remains in any displayed metric.

### 9.2 Evolution B — True-cost explainer for product strategists (LLM tier 1 → 2)

**What.** A copilot that answers "why is the true cost of this EV battery 31% above its market price, and which stage drives it?" from the module's own computed surface: the externality breakdown (carbon/water/air/biodiversity/waste), the BOM stage margins (`marginDollar`, `totalMargin`, share treemap), and the commodity sensitivity sliders. Tier-2 slice: what-ifs run through the page's existing scenario machinery exposed as an endpoint — "reprice at SCC $190 and lithium +50%" returns engine-computed deltas.

**How.** Tier 1 grounds on this atlas record — §7.1's formulas and §7.5's caveats (demo BOM data, proxy air term) must appear in the copilot's framing so it never presents true cost as audited fact. Tier 2 wraps the adjusted-BOM computation (currently a `useMemo` chain) in a small backend route with commodity-factor and price-vintage overrides, so counterfactuals are computed, not narrated from memory.

**Prerequisites.** Evolution A's refdata table for price-vintage what-ifs; the BOM computation ported server-side for tier 2 (module is tier-B today). **Acceptance:** every dollar figure in an answer matches a logged tool response or the rendered page state; the copilot volunteers the air-proxy caveat when the air-pollution line is material to its answer.
