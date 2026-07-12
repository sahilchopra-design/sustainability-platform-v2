## 9 · Future Evolution

### 9.1 Evolution A — Location- and scenario-resolved health exposure (analytics ladder: rung 2 → 4)

**What.** The E59 `health_climate_engine` computes seven health-nexus methods with
published concentration-response coefficients: heat productivity loss
(`min(50, (WBGT−26)×10×outdoor_fraction)`, "10%/°C above 26°C"), PM2.5 respiratory
mortality (`PM2.5×0.6`, WHO GBD proxy), vector-disease RCP4.5/8.5 range shifts, and a
composite. Two honest limits: WBGT falls back to a country proxy (`26 + heat_mortality×
1.5`) when no observation is supplied, and several coefficients are literature point
estimates applied flat. Evolution A grounds the drivers in the platform's own climate
data and adds forward scenarios.

**How.** (1) Wire WBGT and PM2.5 from the physical-risk digital twin / NASA-POWER +
Open-Meteo feeds already ingested, replacing the country-proxy fallback with
coordinate-resolved values and a reported `resolution_tier`. (2) Project heat/air
exposure forward under RCP/SSP scenarios (the engine already carries RCP4.5/8.5
sensitivities for vectors — generalise to heat and air) so `/composite` returns a
2030/2040/2050 trajectory, not a point-in-time score. (3) Attach confidence intervals
from the concentration-response literature rather than single coefficients. (4)
Bench-pin heat, air, and composite against worked WHO/Lancet examples.

**Prerequisites.** Coordinate weather/air data wired (feeds exist); RCP/SSP projection
series per location. **Acceptance:** two facilities in different climates produce
different heat/air scores from real WBGT/PM2.5, not the country proxy; `/composite`
returns a multi-horizon trajectory with intervals; bench pins pass.

### 9.2 Evolution B — Workforce health-risk copilot for corporate entities (LLM tier 2)

**What.** A copilot that runs the health suite for an entity and explains the financial
translation — "heat costs you N productivity-days and $X adaptation at ~$200/employee;
here's the driver decomposition" — citing `/financial-impact` and `/composite` outputs,
and answering what-ifs like "if we cut outdoor work to 30%, how does productivity loss
change?" by re-calling with the amended `outdoor_fraction`.

**How.** Five computational POST endpoints plus three reference GETs (WHO guidelines,
Lancet indicators, country profiles) form the tool set; the reference endpoints ground
threshold questions (OSHA 90°F WBGT-equiv, EU AQD PM2.5 limit). The engine's explicit
`insufficient_data` returns (e.g. `healthcare_cost_uplift = None` when no wage input) are
exactly what the copilot must surface honestly rather than filling in — a strong test of
the refusal path.

**Prerequisites.** None hard for tier 1 narration; for tier 2 what-ifs the POST
endpoints (some trace as `skipped` in §4.2 under the harness) must be confirmed callable.
**Acceptance:** every cost, sick-day, and score figure traces to a tool response; when
an input is missing the copilot reports the engine's `insufficient_data`/None rather
than estimating; scenario what-ifs reflect a fresh engine call.
