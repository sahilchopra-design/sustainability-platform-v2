## 9 · Future Evolution

### 9.1 Evolution A — Build the actual asset-swap-spread greenium engine (analytics ladder: rung 1 → 3)

**What.** §7 flags a severe name-vs-code mismatch: the guide describes a greenium engine (`Greenium = ASW_conventional_matched − ASW_green`, with matched-pair tables and cubic-spline ASW-curve interpolation), but the page is actually a 5-model technical-momentum signal ensemble over 40 synthetic equity/ETF price series (returns, vol-adjusted Sharpe, RSI, MA ratio, ESG boost → BUY/SELL/NEUTRAL with position sizing) — everything (prices, volumes, ESG, the "greenium" field, the 52-week backtest) is `sr()`-seeded, and "greenium" survives only as a cosmetic field (§8 marked "not yet implemented"). Evolution A builds the greenium engine the module is named for: compute asset-swap spreads for green bonds and matched conventional bonds, fit the issuer ASW curve by cubic spline where no exact match exists, and derive greenium as the ASW differential — a real fixed-income signal replacing the mislabeled equity-momentum ensemble.

**How.** (1) A backend route computing ASW for green and matched conventional bonds (same issuer/maturity/seniority/currency/coupon type). (2) Cubic-spline interpolation of the issuer's conventional ASW curve for synthetic matches, per §5. (3) Greenium = ASW_conventional − ASW_green, tracked over time as a signal. Either repurpose or retire the equity-momentum ensemble, which does not match the module's stated purpose.

**Prerequisites.** A bond universe with ASW data and issuer curves (reuse the FRED/market curves the pricing-desk sibling pulls); a decision on the orphaned momentum ensemble; the seeded price series replaced. **Acceptance:** greenium computes as an ASW differential reproducing §5; the spline handles unmatched maturities; the output is a fixed-income greenium signal, not equity momentum; no `sr()` price feeds it.

### 9.2 Evolution B — Greenium-signal copilot (LLM tier 2)

**What.** A copilot for fixed-income PMs: "which green bonds show the widest greenium versus their conventional curve this week, and is it tightening?" tool-calls the Evolution A greenium engine and narrates the ASW differential and its trend as a relative-value signal.

**How.** Tier-2 tool-calling over the greenium/ASW endpoints; the grounding corpus is §5/§7's stated greenium methodology (ASW differential, matched pairs, spline interpolation). The copilot's value is greenium relative-value monitoring. Guardrail, pre-Evolution-A: the page computes equity momentum on synthetic data with a cosmetic greenium field, so it must refuse all greenium claims and disclose the name-vs-code mismatch. Every bps figure validated against engine output.

**Prerequisites.** Evolution A (the greenium engine doesn't exist today); ASW/curve data; corpus embedding. **Acceptance:** post-Evolution-A, every greenium figure traces to an ASW-engine tool call; pre-Evolution-A the copilot declines greenium questions and flags that the page runs an unrelated momentum ensemble.
