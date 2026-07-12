## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/builder_engine.py` powers the custom-scenario builder
(`api/v1/routes/scenario_builder_v2.py`): a user takes any hub scenario's trajectories
(emissions, GDP, carbon price, energy shares — per variable × region time series), overrides
selected year-values, and the engine recomputes the climate/economic/risk consequences:

```
temperature(y) = 1.1 °C + TCRE × cumulative CO₂ since series start ,  TCRE = 0.45 °C / 1000 GtCO₂
budget consumed = cumulative / 400 Gt (1.5 °C, 50%)  and  / 1150 Gt (2 °C, 67%)
P(≤1.5°C) = clamp((1 − cum/400) × 100, 0, 100)
P(≤2°C)   = clamp((1 − cum/1150) × 100 + 30, 0, 100)
physical risk (1–10)   = clamp((T₂₁₀₀ − 1.0) × 3.5, 1, 10)
transition risk (1–10) = clamp(CP₂₀₅₀ / 60, 1, 10)
overall = 0.5 × physical + 0.5 × transition
investment need % GDP  = min(8, CP₂₀₅₀ / 80)
```

Routes: `GET /base-scenarios`, `POST /calculate-impacts`, CRUD on `/custom/{cs_id}` (+ PUT /
DELETE / `POST …/fork`), `GET /simulations/{sim_id}` for stored Monte Carlo runs.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `TCRE` | 0.00045 °C/GtCO₂ | in-code comment "TCRE ≈ 0.45 °C per 1000 GtCO₂" — IPCC AR6 central TCRE (0.27–0.63 °C/1000 Gt likely range) |
| `BASELINE_TEMP_2020` | 1.1 °C above pre-industrial | ≈ IPCC AR6 observed 2011–2020 warming |
| `CARBON_BUDGET_1_5C` | 400 GtCO₂ from 2020 (50% chance) | AR6 WGI remaining-budget table |
| `CARBON_BUDGET_2C` | 1,150 GtCO₂ (67% chance) | AR6 WGI |
| Validation constraints | carbon price 0–1,000 $/t; emissions −15–60 Gt/yr; temperature 0.5–6.0 °C; GDP impact −20–+15% | `validate_customizations` CONSTRAINTS — plausibility gates |
| MC settings | 1,000 iterations, `random.Random(seed=42)`, Gaussian noise σ = 10% per year-value | `run_monte_carlo` |

Interpolation of sparse custom values supports `linear`, `exponential`
(`v0 × (v1/v0)^frac`, geometric) and `step` fills for every missing year.

### 7.3 Calculation walkthrough

`calculate_impacts` merges base trajectories into a `(variable, region) → {year: value}` map,
overlays the customised year-values, interpolates, then locates series by keyword
(`_find_series("emission","co2")`, `("gdp")`, `("price","carbon")`, preferring region
"World"). Temperature integrates cumulative emissions through the TCRE relation year by year;
`by_2050`/`by_2100` fall back to the last available year when the series ends early. Economic
impacts pass through the GDP and carbon-price trajectories and derive the investment-need
heuristic. Risk scores follow the two linear maps above with a 50/50 blend and 5-tier labels
(Low ≤2 … Extreme >8). Energy indicators are keyword-scraped (renewable share 2050, coal
2030/2050, solar 2050). `validate_customizations` also emits a consistency warning when an
emissions series *rises* >50% start-to-end. `run_monte_carlo` re-runs `calculate_impacts`
1,000 times with each year-value multiplied by `N(1, 0.1)` noise and reports
p5/p25/p50/p75/p95/mean of the 2100 temperature and overall risk, plus
`probability_below_1_5c/2c` as the fraction of paths under the threshold.

### 7.4 Worked example — net-zero-2050 custom emissions path

Custom World CO₂ (Gt/yr): 2025 = 38, 2030 = 30, 2040 = 15, 2050 = 0; linear interpolation;
carbon price 2050 = $590/t.

| Step | Computation | Result |
|---|---|---|
| Cumulative emissions | Σ 2025–2050 of the interpolated path = 204 + 217.5 + 67.5 | **489 GtCO₂** |
| Temperature 2050 | 1.1 + 489 × 0.00045 | **1.32 °C** |
| by_2100 | series ends 2050 → fallback | 1.32 °C |
| 1.5 °C budget consumed | 489/400 | 122.3% |
| P(≤1.5 °C) | (1 − 1.223) × 100 → clamped | **0%** |
| P(≤2 °C) | (1 − 489/1150) × 100 + 30 = 57.5 + 30 | **87.5%** |
| Physical risk | (1.32 − 1.0) × 3.5 | 1.1 (Low) |
| Transition risk | 590/60 | 9.8 (Extreme) |
| Overall climate risk | 0.5×1.1 + 0.5×9.8 | **≈5.5 (High)** |
| Investment need | min(8, 590/80) | 7.4% of GDP |

The example illustrates the model's shape: an aggressive-mitigation path scores *low physical*
but *extreme transition* risk, and the seeded Monte Carlo would spread the 1.32 °C outcome by
roughly ±10% of cumulative emissions.

### 7.5 Persistence & scenario lifecycle

The route layer stores custom scenarios (base-scenario reference + customisations + computed
impacts) and simulation results in DB tables, supporting update (PUT), delete, and **fork**
(`POST /custom/{cs_id}/fork` clones a scenario for divergent edits). `GET /base-scenarios`
lists the hub scenarios (NGFS/IEA/IPCC-sourced trajectory sets elsewhere in the platform) that
can seed a custom build — the builder itself is source-agnostic ("works with ALL hub
scenarios").

### 7.6 Data provenance & limitations

- **Seeded stdlib PRNG** (`random.Random(42)`, Gaussian) is used *only* inside the Monte
  Carlo — reproducible, and never a substitute for entity data. Note a comment/code mismatch:
  the MC comment says "Perturb customizations by ±20%" but the code applies σ = 10%
  (`rng.gauss(1.0, 0.1)`).
- The TCRE linear model is a legitimate first-order reduction of AR6 science but ignores
  non-CO₂ forcing, zero-emissions commitment nuances and carbon-cycle feedback ranges; the
  `+30` offset in P(≤2 °C) is an undocumented calibration fudge, and cumulative emissions are
  summed from the series' first year (not 2020), so the budget-consumed figures depend on the
  window supplied.
- `by_2100` silently equals the last series year when trajectories stop early (as most 2050
  paths do) — understating end-of-century warming for hot-house paths.
- Keyword-based series discovery (`"emission"+"co2"`, `"price"+"carbon"`) is convention-
  dependent; a renamed variable silently drops out of the impact calc.
- Risk maps (×3.5, /60, /80 and the 50/50 blend) are unsourced heuristic calibrations; the MC
  perturbs only *customised* values, leaving base-trajectory years unperturbed.

### 7.7 Framework alignment

- **IPCC AR6 WGI** — TCRE (~0.45 °C/1000 GtCO₂ central), the 1.1 °C 2020 baseline and the
  400/1150 Gt remaining carbon budgets are all AR6 quantities; the engine's temperature model
  is the standard TCRE budget arithmetic used in "warming contribution" calculators.
- **NGFS / IEA / IPCC hub scenarios** — the builder's base trajectories come from the
  platform's scenario hub; customisation-plus-recompute mirrors how NGFS advises users to
  adapt published scenarios to institution-specific narratives.
- **TCFD scenario-analysis guidance** — the physical/transition/overall risk triad and
  probability-of-outcome framing supply the quantitative backbone for Strategy (c) resilience
  disclosures.
- **Carbon-budget probability framing (AR6 SPM Table)** — the P(1.5 °C)/P(2 °C) outputs
  approximate the budget-exceedance logic, though the real relationship between budget
  consumption and outcome probability is non-linear.
