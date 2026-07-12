## 9 · Future Evolution

### 9.1 Evolution A — Build the Z-spread greenium engine the guide advertises (analytics ladder: rung 1 → 2)

**What.** §7 flags a total mismatch: the guide advertises a Z-spread greenium engine (`Greenium_i = ZSpread_conventional_matched − ZSpread_green_i`, with a cubic spline fitted on each issuer's conventional curve where no exact maturity match exists), but no Z-spread, no spline, and no matched-conventional logic exist — each bond's greenium is a single seeded draw, taxonomy/DNSH flags are threshold coin-flips, and `impactPerM` mixes incompatible units across labels (MW for green, beneficiary-count for social). Only the country-issuance bar reflects real CBI 2023 data. Evolution A builds the real greenium engine: compute Z-spreads for green bonds and matched conventional bonds, fit the issuer curve spline for synthetic matches, and derive greenium as the spread differential — plus a units-consistent impact model (normalise per-category impact metrics rather than summing MW and headcount).

**How.** (1) A backend route computing Z-spread from bond cash flows against a discount curve, matching each green bond to a conventional bond (same issuer/seniority/maturity) or the fitted cubic-spline synthetic yield. (2) Greenium = conventional Z-spread − green Z-spread, per §5. (3) Taxonomy/DNSH flags from real use-of-proceeds assessment, not coin-flips; impact reporting normalised per ICMA category (no cross-unit summation).

**Prerequisites.** A bond universe with cash flows and a conventional-curve source (the sibling `green-bond-pricing-desk` already pulls real FRED OAS curves — reuse); the seeded bonds replaced. **Acceptance:** greenium recomputes as a Z-spread differential reproducing §5; the spline handles unmatched maturities; impact metrics are unit-consistent; no seeded greenium remains.

### 9.2 Evolution B — GSS+ portfolio and impact-reporting copilot (LLM tier 2)

**What.** A copilot for green-bond PMs: "which holdings trade at a genuine greenium after matching to their conventional curve, and draft our use-of-proceeds impact report" tool-calls the Evolution A greenium and impact endpoints, narrating ICMA-aligned allocation and verified impact.

**How.** Tier-2 tool-calling over the greenium/impact endpoints; the grounding corpus is §5/§7 (ICMA GBP/SBP, Z-spread greenium methodology, use-of-proceeds categories). The copilot's value is distinguishing real greenium (curve-matched) from label premium, and drafting impact reports with unit-consistent metrics per category. Guardrail, pre-Evolution-A: because greeniums are seeded and impact units incompatible, it must refuse greenium and aggregate-impact claims. Every figure validated against tool output.

**Prerequisites.** Evolution A (no real greenium today); corpus embedding; conventional-curve data. **Acceptance:** post-Evolution-A, every greenium and impact figure traces to a tool call; the copilot reports impact per ICMA category without summing incompatible units; pre-Evolution-A it declines greenium claims.
