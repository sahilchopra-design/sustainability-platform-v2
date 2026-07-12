## 9 · Future Evolution

### 9.1 Evolution A — Apply the quality-weighting scheme and derive prices (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide states `Ocean CDR Price = f(Permanence Tier, MRV Maturity, Co-benefit Score)`, but every price in `CREDIT_TYPES`/`PRICE_HISTORY`/`FORWARD_CURVE` is hand-entered — no function derives price from those inputs. Notably, the `QUALITY_METRICS` table (Additionality 25%, Permanence 25%, MRV Rigour 20%, Co-Benefits 15%, Registry 10%, Buyer Transparency 5%, summing to 100%) is a real weighting scheme that is *never applied* — `qualityScore` per credit type is a preset number, not a weighted composite. The good news: this module is fully deterministic (no `sr()`), and the data is well-curated. Evolution A wires the scheme it already contains.

**How.** (1) Compute `qualityScore` as the actual weighted sum of per-dimension sub-scores using the `QUALITY_METRICS` weights, so a credit type's quality is auditable and responds to its additionality/permanence/MRV inputs. (2) Implement the guide's permanence-adjusted value (`Spot × PermanenceFactor × (1 − ReversalRisk)`) as a real derivation, connecting to the sibling `offset-permanence-risk` module's reversal-probability logic rather than a static number. (3) Anchor `PRICE_HISTORY`/`FORWARD_CURVE` to real advance-purchase data where public (Frontier/Stripe disclose settlement prices; named in §5) with a dated reference table, keeping the curve shape but grounding the anchors.

**Prerequisites.** Per-dimension sub-scores must be added to each `CREDIT_TYPES` row (currently only the composite exists); Frontier/CDR.fyi price data has partial public coverage — honest-null where unavailable. **Acceptance:** `qualityScore` reproduces from the weighted sub-scores; changing a credit's permanence tier moves its permanence-adjusted value; prices carry source/vintage.

### 9.2 Evolution B — Ocean-CDR procurement copilot (LLM tier 1 → 2)

**What.** A copilot for the buyer/procurement users §1 targets: "which ocean CDR pathways offer geological-scale permanence?", "how does OAE at $280/t compare on quality-adjusted value to mangrove at $32/t?", "what's the forward curve for kelp credits?" — grounded in the six real credit types (with named buyers Microsoft/Stripe/Frontier), the quality-metric scheme, and the HLP Ocean Carbon / Frontier references named in §5.

**How.** Tier 1 works on the curated deterministic data: system prompt from this Atlas page's §7.1 tables; the copilot compares pathways citing real permanence tiers, MRV status, and buyer lists. Tier 2, post-Evolution-A: tool calls to the quality-composite and permanence-adjusted-value functions for computed comparisons, with the fabrication validator matching quoted prices and scores to outputs. The copilot must flag that ocean CDR is nascent (methodologies emerging, prices thin) and refuse to present the forward curve as a market quote rather than an illustrative advance-purchase projection.

**Prerequisites.** Tier 1 on current data with as-of disclosure; quality/value computation needs Evolution A. **Acceptance:** pathway comparisons cite real credit-type attributes; quality-adjusted values (post-Evolution-A) trace to the weighted-sum function; forward-curve answers carry the illustrative-projection caveat.
