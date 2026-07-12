## 9 · Future Evolution

### 9.1 Evolution A — Discounted ABCR on twin-sourced hazards (analytics ladder: rung 1 → 2)

**What.** §7's assessment is measured: the adaptation-economics core is real
arithmetic (per-measure `benefit = costOfInaction × riskReduction%`, ROI/payback,
hazard-loaded insurance repricing) but with two honest limits — the ABCR is an
undiscounted ratio despite the guide's `NPV(RiskReduction)/CapEx` definition, and
every building's 8-hazard scores are seeded draws. Evolution A fixes both: hazard
scores come from the platform's Physical Risk Digital Twin at building coordinates
(the workflow description already says "map asset via lat/long and hazard
return-period layers" — the twin is exactly that layer), and the ABCR becomes a
proper NPV — avoided annual losses projected over the measure's life, discounted at
a user rate, with asset-life extension and the carbon co-benefits the guide mentions
entering as explicit cash-flow terms.

**How.** (1) Building schema gains coordinates; per-hazard scores via the twin's
composite-scoring endpoints with `resolution_tier` displayed; the composite formula
(mean of hazards) retained but now over sourced inputs. (2) `abcrNPV(measure,
building, discountRate, life)` replacing the flat ratio; the engineering
`riskReduction` factors per measure sourced to adaptation-economics literature (GCA/
World Bank tools in §5) or labelled expert-set. (3) The measure-ranking view re-keyed
to discounted ABCR with payback retained as a secondary metric.

**Prerequisites (hard).** Seeded-building purge (fixtures with coordinates, or
user-entered assets); twin coverage honesty for flood/SLR-sparse locations.
**Acceptance:** ABCR responds to discount rate and measure life (NPV proven); two
identical buildings in different cities rank measures differently per grid hazards;
a fixture reproduces a hand-computed discounted ABCR.

### 9.2 Evolution B — Adaptation-investment advisor (LLM tier 2)

**What.** An assistant for asset owners and lenders: "which measures pay back within
7 years for this Rotterdam logistics asset?" (tool-called ABCR ranking over the
measure menu with the twin-sourced flood score driving benefits), "why does elevation
beat barriers here?" (decomposition: hazard mix, riskReduction factors, cost per
m²), "what does adaptation do to the insurance premium?" (the module's real
repricing arithmetic narrated). Lender use: resilience-conditional term-sheet
context, with the computed residual-risk figures cited.

**How.** Tool schemas over the ABCR/ranking functions and the twin's scoring
endpoints; the validator on every ratio, payback, and premium figure; engineering-
factor provenance (sourced vs expert-set, from Evolution A) surfaces when precision
is challenged; refusal on structural-engineering judgments — the module ranks
economics, it does not certify designs.

**Prerequisites (hard).** Evolution A first — measure rankings over seeded hazards
would steer real capex to the wrong buildings. **Acceptance:** a ranking answer
reproduces via the ABCR function with stated parameters; hazard citations resolve to
grid lookups with resolution tier; the copilot redirects design-certification
questions to qualified engineers.
