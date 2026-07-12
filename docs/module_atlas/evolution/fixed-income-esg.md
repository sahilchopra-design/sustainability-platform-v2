## 9 · Future Evolution

### 9.1 Evolution A — Estimate greenium from matched conventional curves (analytics ladder: rung 1 → 2)

**What.** §7 flags the core gap: the guide describes an ESG-adjusted OAS attribution regression (`OAS_esg = OAS_benchmark + β_esg·ESG_score + β_dur·Duration + ε`), but no regression is estimated — the greenium is a stored per-bond field (`greenium_bps`) over a curated ~80-bond universe, and the "FI WACI" is a mislabelled weighted-ESG average. Evolution A implements the way greenium is actually isolated: match each labelled green bond to a conventional issuer curve of the same rating/currency/maturity and regress the residual spread on ESG score and duration, producing a real β_esg and a fitted-vs-actual greenium so mispriced bonds surface from computation, not storage.

**How.** (1) Backend route running the matched-curve construction and multivariate OLS (statsmodels, already in the environment per the roadmap) over the bond universe. (2) The greenium-signal tab reads fitted residuals (`actual OAS − curve-implied`) instead of the stored `greenium_bps`, so "trades wider than the curve" becomes a computed claim. (3) Relabel the WACI card honestly, or wire it to real issuer GHG intensity via the platform's company master (the `combinedWaci` code already reaches for `ghg_intensity_tco2e_cr`).

**Prerequisites.** A conventional-bond reference curve source (even a curated matched set to start); the stored `greenium_bps` demoted to a fallback, not the headline. **Acceptance:** β_esg is estimated with a reported R²/standard error; a bond flagged mispriced shows its curve-implied vs actual spread; the WACI card no longer mislabels weighted-ESG as emissions intensity.

### 9.2 Evolution B — Green-bond desk copilot (LLM tier 1 → 2)

**What.** A copilot for fixed-income PMs: "which green bonds in my universe screen cheap after adjusting for duration and rating, and what's the ESG spread pickup?" Tier-1 narrates the portfolio notional-weighted analytics (wAvgEsg, wAvgGreenium, green/social/SLB share) and the ICMA/CBI framework taxonomy from the atlas corpus; tier-2 runs the Evolution A regression endpoint to answer relative-value questions with fitted greeniums.

**How.** Tier 1 grounds on §5/§7 — the module accurately encodes the ICMA GBP/SBP/SLB taxonomy (11 types), CBI certification, EU GBS frameworks, and ND-GAIN sovereign scores, so the copilot explains labelling and eligibility credibly. Its guardrail: pre-Evolution-A it must state that greeniums are stored demo values, not estimated, and refuse "is this bond mispriced" as a quantitative claim. Tier 2 upgrades those to regression-backed answers with the fabrication validator checking every basis-point figure against tool output.

**Prerequisites.** Evolution A for relative-value claims; corpus embedding; per-module tool allowlist. **Acceptance:** SFDR/taxonomy classification answers cite the specific framework field relied on; a mispricing claim post-Evolution-A carries the fitted-vs-actual spread from a logged regression call, and pre-Evolution-A is refused.
