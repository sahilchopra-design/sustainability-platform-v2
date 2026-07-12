## 9 · Future Evolution

### 9.1 Evolution A — Fit the model the page already pretends to have (analytics ladder: rung 1 → 4)

**What.** §7 flags the mismatch precisely: the page ships a working ridge-OLS solver (`linearRegression`/`solveLinearSystem`) as dead code, while the live score is a fixed-weight aggregate (`computeScore`, 15 features × `shapW` constants) and the three "models" differ only by scalars 0.94/0.97/1.00; all 20 companies, forecasts, and diagnostics are `sr()`-seeded. Evolution A implements §8's boosted panel regressor as this module's first backend vertical: predict `Δ = R(t+12) − R(t)` from lagged features, with TreeSHAP replacing the hand-fixed `shapW` weights the UI already renders as a waterfall.

**How.** (1) `api/v1/routes/predictive_esg.py` with `POST /forecast` (issuer feature vector → quantile-boosted `R̂(t+12)` band replacing the fixed ±ciW), `GET /attribution/{issuer}` (exact-additive TreeSHAP values, `Σφᵢ + φ₀ = Δ̂`), `GET /model-card` (walk-forward MAE/rank-IC written by the backtest, never hand-entered). (2) Training panel assembled from whatever rating history the platform can legitimately source — if no MSCI/Sustainalytics feed is licensed (§8.4 notes neither is in `reference_data`), train on the platform's own disclosure-derived scores and label the target accordingly, honestly. (3) The dead OLS becomes the documented baseline the boosted model must beat.

**Prerequisites.** A real ratings label source (licensed feed or in-platform scores — decision gates the whole evolution); removal of the synthetic model-performance tab. **Acceptance:** UI waterfall bars equal TreeSHAP outputs; reported MAE reproduces from the walk-forward artifact; the guide's "MAE 4.2" claim is either validated or corrected.

### 9.2 Evolution B — Stewardship watchlist copilot (LLM tier 2)

**What.** The module's export target is a downgrade watchlist for asset managers. Evolution B makes the watchlist conversational: "which holdings have predicted downgrades driven by governance features?", "draft the engagement note for this issuer citing its top-3 SHAP drivers" — each answered by tool calls to `POST /forecast` and `GET /attribution`, with the engagement note grounded in the computed contribution signs and magnitudes.

**How.** Tier-2 tool schemas from the Evolution-A endpoints; the system prompt carries the §8.6 model-risk language (label drift, regime-break extrapolation caps, stale-input freeze rule) so generated notes include the right hedging by construction. Portfolio-level questions iterate the forecast tool over holdings via the existing portfolio tables (`portfolios_pg`) rather than a new bulk endpoint in the first slice. No-fabrication validator checks every score, probability, and SHAP value against tool outputs.

**Prerequisites (hard).** Evolution A shipped — today there is nothing behind the page to call, and a copilot narrating the current `sr()`-seeded forecasts would violate the platform's fabrication guardrail in spirit. **Acceptance:** an engagement note's every quantitative claim traces to a tool call; asked for a controversy probability (a §8 component not yet built), the copilot says the classifier is not implemented.
