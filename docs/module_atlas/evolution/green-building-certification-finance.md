## 9 · Future Evolution

### 9.1 Evolution A — Decomposed green-building NPV replacing the 8%-of-CAPEX heuristic (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's decomposed NPV (`NPV = Σ[(SalePremium + RentPremium + VacancyBenefit + EnergySaving)/(1+r)^t] − CAPEX`, `MOIC = TotalBenefit/CAPEX`) is not implemented — `npvCalc` applies a single flat annual benefit of 8% of CAPEX over 10 years, unable to reflect asset size, rent level, energy price, vacancy, or certification tier (the very drivers the guide lists). The `ROI_BREAKDOWN` component data exists but is disconnected from the calculator, so the displayed ROI narrative can contradict the NPV number; buildings are `sr()`-seeded; and no CRREM stranding or financing-cost saving is modelled. Evolution A builds the real decomposed NPV: each benefit stream (sale premium, rent premium, vacancy benefit, energy saving) computed from the asset's rent/area/energy inputs and certification tier, discounted properly, with MOIC from total benefit — wiring the existing `ROI_BREAKDOWN` into the actual calculation.

**How.** (1) Rewrite `npvCalc` to sum the four discounted benefit streams from asset-level inputs (rent, area, energy intensity, vacancy, tier-specific premia from the 8–22% sale / 6–15% rent ranges the module cites). (2) Connect `ROI_BREAKDOWN` so the waterfall and NPV reconcile. (3) Add a financing-cost saving (green-loan margin) and optional CRREM stranding overlay.

**Prerequisites.** Asset-level rent/area/energy inputs (real or user-entered); the seeded `BUILDINGS` replaced or made editable; tier-premium reference ranges. **Acceptance:** NPV recomputes from the four decomposed streams reproducing §5; the ROI waterfall and NPV agree; changing rent or tier changes the NPV; the flat 8% heuristic is gone.

### 9.2 Evolution B — Green-building investment-case copilot (LLM tier 1 → 2)

**What.** A copilot for real-estate investors: "what's the NPV and MOIC of certifying this office to LEED Platinum, and which benefit stream dominates?" narrates the premium ranges and ROI components from the atlas corpus, with tier-2 running the Evolution A decomposed NPV so the investment case is computed per asset.

**How.** Tier 1 grounds on §5/§7 (LEED/BREEAM/NABERS/DGNB systems, the sale/rent premium ranges), with a guardrail that pre-Evolution-A the NPV is a flat-8% heuristic and the ROI narrative can contradict it — so it must flag that limitation. Tier 2 tool-calls the decomposed NPV endpoint so CAPEX and discount-rate what-ifs are computed and the dominant benefit stream is identified. Every NPV/MOIC figure validated against tool output.

**Prerequisites.** Evolution A (the current NPV can't reflect the drivers a copilot would discuss); corpus embedding. **Acceptance:** post-Evolution-A, every NPV, MOIC, and benefit-stream figure traces to a tool call and the waterfall reconciles with the NPV; pre-Evolution-A the copilot discloses the single-parameter heuristic limitation.
