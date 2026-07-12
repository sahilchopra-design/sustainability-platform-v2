## 9 · Future Evolution

### 9.1 Evolution A — Implement the promised OLS normalisation and Arrhenius aging; fix cell-temperature (analytics ladder: rung 2 → 3)

**What.** This is a genuinely strong engineering module — live NASA POWER irradiance integration, a correctly-formed IEC 61724 PR waterfall, and a statistically-correct lognormal P50/P90 quantile model (`p90 = p50 × exp(−1.282σ)`). But §7 flags that two headline methodologies the guide advertises are **not implemented**: there is no OLS weather-normalisation regression (`production ~ GHI × temperature`, no R² output) and no Arrhenius degradation kinetics (`Δη = A·exp(−Ea/RT)·√t`) — degradation uses a simpler linear-annual model. It also notes a cell-temperature bug: `tCell = temp + 25×0.03` is not irradiance-dependent, understating thermal losses at high POA. Evolution A closes the guide↔code gaps and fixes the physics.

**How.** (1) Implement OLS weather normalisation: regress actual production on GHI and temperature, output R² and the residual (operational underperformance) the guide describes — the tool already has the live NASA POWER data to fit against. (2) Implement Arrhenius calendar aging as an alternative to (or validation of) the linear model, per the guide's `A·exp(−Ea/RT)·√years` form. (3) Fix cell temperature to the standard NOCT/irradiance-dependent form (`T_cell = T_amb + POA/800 × (NOCT−20)`), so thermal loss scales with irradiance. (4) Bench-pin the PR and P90 calculations against a known PVsyst reference case.

**Prerequisites.** The regression needs a production time series (live NASA POWER + user generation data); Arrhenius parameters (Ea, A) per technology from the Jordan et al. survey. **Acceptance:** the normalisation tab outputs a real R² from an OLS fit; cell temperature rises with POA irradiance (matching PVsyst); a bench case reproduces expected PR within tolerance.

### 9.2 Evolution B — Resource-assessment copilot for technical advisors (LLM tier 2)

**What.** A copilot for the asset-manager/independent-engineer/lender users: "pull the irradiance profile for this site and estimate P90 yield", "why is this plant underperforming its expected PR?", "compare TOPCon vs HJT lifetime energy here" — with the site fetch triggering the live NASA POWER call, and the analysis narrating the PR waterfall, P50/P90 bands, and (post-Evolution-A) the OLS-decomposed underperformance.

**How.** Tier-2 pattern: the NASA POWER fetch and the PR/P90/tilt-optimisation calculators become tools; the copilot passes site/module parameters, receives computed results, and narrates them — never fabricating irradiance or yield. Underperformance diagnosis cites the OLS residual and the specific loss-waterfall stages; technology comparisons narrate the deterministic ranking. Provenance UX shows the NASA POWER query and the loss-factor breakdown.

**Prerequisites.** Evolution A's OLS normalisation, so underperformance answers cite a real residual rather than the (unimplemented) regression the guide promises. The live fetch already exists for the resource side. **Acceptance:** every irradiance and yield figure traces to a NASA POWER fetch or a calculator run; underperformance claims cite the OLS residual and loss stages; a site outside NASA POWER coverage yields a data-availability caveat.
