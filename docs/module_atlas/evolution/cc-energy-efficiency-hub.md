## 9 · Future Evolution

### 9.1 Evolution A — Regression baselines on real degree-day data (analytics ladder: rung 1 → 3)

**What.** The guide promises IPMVP Option C regression baselines ("adjustment factors
typically explain 70–90% of baseline variation"), but §7 shows the code implements a
simpler efficiency-ratio model (`blEnergy = capacity × opHours × lf / blEff`) and a
one-line weather normalisation (`adjusted = measured × hddNormal/hddActual`). Evolution
A closes that gap: an actual multivariate baseline regression (energy ~ HDD + CDD +
production + occupancy) fitted on 12–24 months of consumption history, with HDD/CDD
computed from the platform's already-wired Open-Meteo/NASA POWER weather feeds instead
of user-typed degree-day totals.

**How.** (1) Backend endpoint (this module currently has none) accepting a monthly
consumption series + site coordinates; statsmodels OLS with coefficient table, R², and
CV(RMSE) against the ASHRAE Guideline 14 thresholds the M&V world actually gates on.
(2) The existing `calcEnergyEff` path stays as the Option A/B engineering-estimate
route; the new regression is Option C, selected by the M&V option tab that already
exists. (3) Savings uncertainty from regression standard errors replaces the flat 8%
`netCredits = be × 0.92` buffer when Option C is used.

**Prerequisites.** Weather-feed lookup by site coordinates; demo consumption series
seeded honestly as fixtures. **Acceptance:** a fitted baseline reports R² and CV(RMSE),
and a synthetic site with known coefficients recovers them within tolerance
(bench-pinned regression case).

### 9.2 Evolution B — M&V analyst copilot (LLM tier 2)

**What.** An analyst-tier assistant for the M&V workflow: "which IPMVP option fits a
site with sub-metered chillers?", "re-run the adjustment with normal-year HDD 2,100",
"why did verified savings fall below the engineering estimate?". It explains from the
atlas corpus (IPMVP 2022 / AMS-II.A / ISO 50001 standards in §5) and, once Evolution
A's endpoint exists, executes re-runs as tool calls against the regression and
`calcEnergyEff` paths, narrating only returned numbers.

**How.** Tier-1 slice first: RAG over this atlas page plus current page state (the DER
model, weather-norm inputs, credit results are all on screen). Tier-2 slice adds the
Evolution A endpoint to the tool schema; the no-fabrication validator checks that every
kWh and tCO₂ figure in an answer appears in a tool response from the same conversation.

**Prerequisites.** Evolution A for the tool-calling step — today there is no backend
route to call, so tier 2 cannot ship first. **Acceptance:** copilot recommends an M&V
option with a §5-cited rationale; a requested re-run produces numbers byte-identical to
the endpoint response it cites.
