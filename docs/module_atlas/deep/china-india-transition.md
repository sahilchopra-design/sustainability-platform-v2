## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry cites a calculation formula
> `Coal_retirement = f(policy, economics, RE_growth)`. **No such function exists in the code.**
> Coal phase-down capacities are hard-coded scenario tables (fast/base/slow), not derived from
> policy or economic inputs. The only genuine computation on the page is a logistic S-curve
> generator for renewable-capacity deployment. Everything else is curated reference data
> rendered through filters. The sections below document the code as it actually behaves.

### 7.1 What the module computes

The page (`ChinaIndiaTransitionPage.jsx`, EP-CJ1) is a dual-market transition intelligence
dashboard over six tabs (`TABS`): Dual Market Overview · China National ETS · India Green
Hydrogen Mission · Coal Phase-Down Timelines · RE Deployment Curves · Carbon Price Trajectories.

The single mathematical model is the RE deployment S-curve:

```js
val = startCap + (peakCap − startCap) / (1 + Math.exp(−k × (y − midYear)))
```

— a standard 3-parameter logistic diffusion curve (capacity approaches `peakCap` asymptotically,
with inflection at `midYear` and steepness `k`), evaluated annually via `buildSCurve(startYear,
startCap, peakCap, midYear, k, endYear)` for four series:

| Series | startCap (GW) | peakCap (GW) | midYear | k | horizon |
|---|---|---|---|---|---|
| `china_solar` | 250 | 2,500 | 2030 | 0.30 | 2020–2040 |
| `china_wind` | 280 | 1,800 | 2032 | 0.25 | 2020–2040 |
| `india_solar` | 50 | 500 | 2028 | 0.35 | 2020–2035 |
| `india_wind` | 42 | 250 | 2030 | 0.28 | 2020–2035 |

Parameters are unattributed in code — they are plausible calibrations to BNEF/IEA outlooks
(cited in `REFERENCES`) but should be treated as synthetic demo values.

### 7.2 Curated datasets (provenance as labelled in code)

- **`CHINA_ETS_SECTORS`** (9 rows shown as 8 sectors): Power active since 2021 (2,162 entities,
  4.5 GtCO₂ coverage, free intensity-based allocation); Steel/Cement in "Phase 2" from 2025;
  Aluminium/Petrochemical Phase 3 (2026–27); Paper, Aviation, Chemicals Phase 4 (2028–29).
  Consistent with China MEE's published expansion roadmap but stored as static rows.
- **`INDIA_H2_DATA`** (2024–2030): hydrogen production ramps 0.02 → 5.0 Mt (the National Green
  Hydrogen Mission's 5 Mt/yr 2030 target appears as the `target` field), green share 0.3% → 56%,
  production cost declines $5.2 → $2.0/kg.
- **`COAL_RETIREMENT`**: China fleet 1,100 GW (2024) declining to 50 GW (2060) in the base
  scenario, with `scenario_fast` reaching 0 GW by 2060 and `scenario_slow` retaining 400 GW;
  India 210 GW peaking at ~230–245 GW around 2030–2035 before declining. The user's
  `coalScenario` state toggles which series the chart plots — no recomputation occurs.
- **`CARBON_PRICE_PATHS`** (13 rows, 2021–2040): China ETS actuals $7 → $12/t (2021–24), then
  projections $15 (2025) → $60 (2030) → $150 (2040); India CCTS projected from $3 (2025) to
  $65 (2040). Projections are hard-coded, with no scenario dependence.
- **`OVERVIEW_METRICS`**: China GDP $17.8T / 12.4 GtCO₂ / 32% RE share / 1,100 GW coal / 680 GW
  solar / "2060 Carbon Neutral"; India $3.7T / 2.9 GtCO₂ / 43% RE share / 210 GW coal / 73 GW
  solar / "2070 Net Zero".

### 7.3 Calculation walkthrough

1. Country toggle (`country`) selects the `OVERVIEW_METRICS` row `m` for the four KPI cards.
2. The **Investment Opportunity Scanner** filters a 7-row inline table by
   `r.size >= investmentThreshold` (slider $10–200B). Pure threshold filter — no scoring.
3. Tab 4 charts `RE_CURVES[...]` from the logistic generator in §7.1.
4. Tab 3 plots `COAL_RETIREMENT[country]` with the chosen scenario key.
5. Tab 5 plots `CARBON_PRICE_PATHS` actual + projected series with a null-split so actual and
   projection render as separate line segments.
6. An `alerts` state array seeds three static policy alerts (ETS expansion, solar PLI, CCER restart).

### 7.4 Worked example — China solar S-curve at 2030

With `startCap = 250`, `peakCap = 2500`, `midYear = 2030`, `k = 0.3`, `y = 2030`:

| Step | Computation | Result |
|---|---|---|
| Exponent | −0.3 × (2030 − 2030) | 0 |
| Logistic term | 1 / (1 + e⁰) = 1/2 | 0.5 |
| Capacity | 250 + (2500 − 250) × 0.5 | **1,375 GW** |

At 2040: exponent = −0.3 × 10 = −3, logistic = 1/(1+e⁻³) = 0.9526, capacity = 250 + 2,250 ×
0.9526 ≈ **2,393 GW** — i.e. 95% of the way to the 2,500 GW asymptote, exactly the midpoint-at-
inflection behaviour of a logistic adoption model.

### 7.5 Data provenance & limitations

- **No seeded PRNG is used** — the page contains no `sr()` calls; all numbers are hand-curated
  constants. They broadly match public sources (Global Coal Tracker ~1,100 GW China coal;
  MNRE 500 GW RE target; MEE ETS Phase 2 expansion) but carry no citations at the row level, so
  they should be treated as illustrative snapshots frozen at authoring time (2024–26 vintage).
- Coal scenarios have no policy/economic drivers; carbon-price projections have no volatility,
  scenario conditioning, or currency basis (CNY/INR quoted in USD without FX assumptions).
- The `REFERENCES` array lists 6 sources (China MEE ETS Regulations 2024, MNRE roadmap, IEA
  India Energy Outlook 2025, BNEF China Outlook 2025, SEBI BRSR, CCER guidance) but all URLs
  are `'#'` placeholders — the lineage is nominal, not linked.

**Framework alignment:** China MEE National ETS regulations (sector expansion phases mirrored in
`CHINA_ETS_SECTORS`) · India National Green Hydrogen Mission (5 Mt/yr by 2030 target embedded)
· IEA India Energy Outlook / BNEF outlooks (S-curve calibration inspiration) · NDC framing
(China 2060 carbon neutrality; India 2070 net zero, per Paris Agreement Art. 4 NDC submissions).

## 8 · Model Specification — Dual-Market Carbon Price & Coal Retirement Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support transition-risk pricing and investment screening for China and India exposure: produce
scenario-conditional carbon-price trajectories (China national ETS; India CCTS) and an
economics-driven coal retirement schedule, replacing the hard-coded tables. Coverage: national
power and heavy-industry sectors, 2025–2060, annual steps.

### 8.2 Conceptual approach

Two coupled components, mirroring (i) NGFS Phase IV/V scenario carbon-price outputs produced by
REMIND/MESSAGEix and (ii) the plant-level coal economics approach of Carbon Tracker's *Global
Coal Power Economics Model* and BNEF's coal phase-out analysis, with Rocky Mountain Institute /
TransitionZero utilised as India-specific benchmarks:

1. **Carbon price**: anchor path = NGFS scenario shadow carbon price for the CHN/IND region,
   blended toward the observed ETS/CCTS market price with a convergence half-life (market prices
   sit far below shadow prices early; converge as coverage and auctioning expand).
2. **Coal retirement**: retire capacity when the going-forward cost of coal exceeds the
   levelised cost of new RE + storage plus a policy-inertia premium ("cost crossover" rule).

### 8.3 Mathematical specification

Carbon price (per country c, scenario s, year t):

```
P(c,s,t) = w(t) · P_NGFS(c,s,t) + (1 − w(t)) · P_mkt(c,t₀) · (1+g)^(t−t₀)
w(t)     = 1 − exp(−ln2 · (t − t₀)/H)
```

Coal retirement:

```
GFC(t)  = FuelCost(t) + VOM + FOM + P(c,s,t) · EF_coal          // going-forward cost, $/MWh
Retire(t): capacity exits when GFC(t) > LCOE_RE+storage(t) · (1 + π_policy)
K(t+1)  = K(t) − Retired(t) + Additions(t)                       // additions from permit pipeline
```

| Parameter | Value / source |
|---|---|
| `P_NGFS(c,s,t)` | NGFS Phase IV scenario explorer, regional shadow carbon price (Net Zero 2050, Delayed Transition, Current Policies) |
| `P_mkt(t₀)` | China ETS ≈ ¥90–100/t (~$12–14) 2024, ICAP Allowance Price Explorer; India CCTS pre-launch ≈ $0 |
| `g` (market drift) | 8–12%/yr, calibrated to ICAP historical EU/KR ETS early-phase drift |
| `H` (convergence half-life) | 8 yr China, 12 yr India — expert setting; sensitivity-tested ±50% |
| `EF_coal` | 0.95 tCO₂/MWh supercritical, IPCC 2006 GLs / IEA Electricity 2024 |
| `LCOE_RE+storage` | IRENA Renewable Power Generation Costs (annual); Lazard LCOE+ for storage adder |
| `π_policy` | 15% China, 25% India — retirement friction premium, calibrated to Global Energy Monitor observed retirement lags |
| Coal fleet `K(t₀)` | Global Energy Monitor Global Coal Plant Tracker (unit-level, free) |

### 8.4 Data requirements

Unit-level coal fleet (GEM tracker, free), ETS auction/market prices (ICAP, free), NGFS scenario
prices (NGFS/IIASA explorer, free), IRENA/Lazard LCOE, IEA WEO India/China country projections.
Platform already holds OWID energy series in `reference_data` (ingested per the reference-data
layer) and NGFS scenario tables in migration 088 (`climate_scenarios`) — both reusable here.

### 8.5 Validation & benchmarking plan

Backtest P(c,s,t) against realised China ETS prices 2021–25 (MAPE target <25% at 1-yr horizon);
reconcile retirement schedule against GEM's observed 2015–2024 retirements (China ≈ 70 GW);
cross-check 2030 capacity vs IEA WEO STEPS/APS and Carbon Tracker crossover years. Sensitivity:
±50% on H, ±20% on LCOE; stability: monotonicity of retirements in carbon price.

### 8.6 Limitations & model risk

Cost-crossover rules understate retirement friction from PPAs, provincial employment mandates and
capacity payments (both countries run coal as flexibility reserve); NGFS regional prices are
shadow values, not market forecasts — the convergence weight w(t) is a judgment overlay and the
dominant model risk. Conservative fallback: floor retirements at announced-policy schedules
(NDC/five-year-plan commitments) and cap carbon price at the NGFS Net Zero path.
