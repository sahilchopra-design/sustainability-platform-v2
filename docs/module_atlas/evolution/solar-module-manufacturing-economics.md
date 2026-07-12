## 9 · Future Evolution

### 9.1 Evolution A — Fit the learning rate from data, reconcile the waterfall, and build the §48C calculator (analytics ladder: rung 1 → 2)

**What.** Strong tier-B foundation: `MANUFACTURERS` (15 real companies), `BOM_COMPONENTS`, and `LEARNING_CURVE` (2010–2025, $4.00→$0.12/W) are all hand-curated real data with no `sr()`, and the `marginWaterfall` arithmetic checks out. But §7 documents three gaps: the "24% learning rate" KPI is a **static label, not regressed** from the plotted `LEARNING_CURVE` points; the `marginWaterfall` is a static illustrative example that doesn't reconcile to any specific manufacturer's `costPerWp`/`grossMargin`; and the IRA §48C calculator the guide advertises is **not implemented in any calculation** (contrast the sibling manufacturer module, which does implement India's PLI). Evolution A closes all three.

**How.** (1) Regress the learning rate: fit `log(cost) ~ log(cumulative_capacity)` over `LEARNING_CURVE`, display the computed LR (with fit R²) instead of the asserted 24% — and note where it diverges from the Wright's-Law literature. (2) Make `marginWaterfall` per-manufacturer: build it from the selected row's actual `costPerWp` and BOM shares so it reconciles to that company's stated margin. (3) Implement the §48C 30%-ITC calculator: US factory CAPEX → credit → NPV of a US vs China cost structure, the module's first genuine investment-decision output. (4) Cite the specific BNEF/Wood Mackenzie edition for the cost series.

**Prerequisites.** §48C credit rules (30% ITC, eligibility); the regression is trivial with the existing data. **Acceptance:** the displayed learning rate is computed from `LEARNING_CURVE` with a reported R²; the waterfall for LONGi reconciles to its $0.17/Wp; the §48C calculator returns an NPV that responds to CAPEX and credit inputs.

### 9.2 Evolution B — Manufacturing-cost and policy-competitiveness copilot (LLM tier 1)

**What.** A copilot for the buyer/manufacturer/trade-analyst users: "why is First Solar's margin 28% at a fraction of LONGi's capacity?", "what does §48C do to US factory economics vs Chinese imports?", "project module cost to 2030 at the fitted learning rate" — answered from the real `MANUFACTURERS`/`BOM_COMPONENTS`/`LEARNING_CURVE` data and, post-Evolution-A, the §48C calculator and regressed LR.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-module-manufacturing-economics/ask`, corpus = this Atlas record (§7.2 parameter table, the margin waterfall, framework notes) plus live page state. Benchmark comparisons narrate deterministic filtered means over the manufacturer table; cost-projection answers use the fitted Wright's-Law curve; §48C competitiveness answers run the calculator. The copilot flags the honest caveat that the 2010 curve start ($4.00/W) is higher than some published BNEF vintages.

**Prerequisites.** Evolution A's fitted LR and §48C calculator — otherwise projection and policy answers rest on an asserted rate and an unimplemented credit. **Acceptance:** every cost/margin figure matches the manufacturer table; cost projections use the computed learning rate; a §48C question returns the calculator's NPV, not a generic estimate.
