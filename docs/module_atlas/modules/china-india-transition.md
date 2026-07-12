# China & India Transition
**Module ID:** `china-india-transition` · **Route:** `/china-india-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-CJ1 · **Sprint:** CJ

## 1 · Overview
China National ETS and India green hydrogen mission deep-dive with coal phase-down timelines and RE deployment curves.

**How an analyst works this module:**
- Dual Market Overview compares China and India side by side
- China ETS shows mechanics and price trajectory
- India Green H₂ Mission shows investment pipeline

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_PRICE_PATHS`, `CHINA_ETS_SECTORS`, `COAL_RETIREMENT`, `INDIA_H2_DATA`, `OVERVIEW_METRICS`, `REFERENCES`, `RE_CURVES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CHINA_ETS_SECTORS` | 9 | `status`, `entities`, `coverage`, `startYear`, `allocation` |
| `INDIA_H2_DATA` | 8 | `production`, `demand`, `greenShare`, `cost`, `target` |
| `CARBON_PRICE_PATHS` | 13 | `china_actual`, `china_proj`, `india_actual`, `india_proj` |
| `REFERENCES` | 7 | `title`, `url` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Dual Market Overview', 'China National ETS', 'India Green Hydrogen Mission', 'Coal Phase-Down Timelines', 'RE Deployment Curves', 'Carbon Price Trajectories'];` |
| `val` | `startCap + (peakCap - startCap) / (1 + Math.exp(-k * (y - midYear)));` |
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_PRICE_PATHS`, `CHINA_ETS_SECTORS`, `INDIA_H2_DATA`, `REFERENCES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| China Coal Fleet | — | Global Coal Tracker | Largest coal fleet globally |
| India RE Target | — | MNRE | From current ~175GW |

## 5 · Intermediate Transformation Logic
**Methodology:** Dual-market transition modelling
**Headline formula:** `Coal_retirement = f(policy, economics, RE_growth)`

China: 1100GW coal fleet, ETS expanding to 8 sectors. India: $2.3B green H₂ mission, 500GW RE target by 2030.

**Standards:** ['IEA India', 'China MEE']
**Reference documents:** IEA India Energy Outlook; China MEE ETS Regulations

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Economics-driven coal retirement model (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's `Coal_retirement = f(policy, economics, RE_growth)`
does not exist — phase-down capacities are hard-coded fast/base/slow tables, and the
only real computation is the logistic RE S-curve
(`val = start + (peak−start)/(1+e^(−k(y−mid)))`). Evolution A builds the advertised
function honestly scoped: a plant-cohort retirement model where each vintage cohort of
the China (1,100GW) and India coal fleets retires when its going-forward cost exceeds
the RE-plus-storage LCOE implied by the S-curve the page already computes, with policy
levers (China ETS carbon price from the `CARBON_PRICE_PATHS` trajectory, India's RPO
trajectory) shifting the crossover year per cohort.

**How.** (1) Cohort table (commissioning-year buckets × heat rate × fuel cost) built
from published CEA (India) and China Electricity Council fleet statistics rather than
invented plants. (2) Retirement rule: retire when `fuel + VOM + carbon_price ×
emission_intensity > RE_LCOE(y) + firming`; the fast/base/slow presets become named
parameterisations of carbon-price and RE-cost assumptions instead of hard-coded
outputs. (3) The existing S-curve generator is reused as the RE-cost/deployment input —
the one real engine on the page becomes the model's driver.

**Prerequisites.** Fleet statistics sourced and vintaged; the hard-coded scenario
tables retained as validation targets (the model should roughly reproduce the "base"
table, and the delta is informative). **Acceptance:** raising the China ETS price path
pulls cohort retirements earlier, monotonically; a single-cohort fixture reproduces
the crossover year by hand.

### 9.2 Evolution B — Dual-market policy copilot (LLM tier 1)

**What.** A copilot over the curated intelligence this module actually contains: "which
sectors does the China ETS cover and since when?" (the 9-row `CHINA_ETS_SECTORS`
table), "what is India's green hydrogen mission funding and target?" (`INDIA_H2_DATA`),
"compare the two carbon-price trajectories" (13-point `CARBON_PRICE_PATHS`, actual vs
projected clearly distinguished). Tier-1 explainer over reference tables and the §5
sources (IEA India Energy Outlook, China MEE ETS regulations) — no computation to call
until Evolution A ships.

**How.** Atlas record plus seed tables in `llm_corpus_chunks`, with each table's
curation vintage stamped; the copilot must label projected price-path values as
projections (the `china_actual` vs `china_proj` field split already encodes this).
Post-Evolution A, retirement-model runs become client-side tool calls and the copilot
graduates to tier 2.

**Prerequisites.** Vintage stamps on the curated tables — both markets move fast (CCER
restart, India CCTS launch) and unstamped narration would assert stale policy as
current. **Acceptance:** every policy fact cites a table row with its as-of date;
asked for next year's CEA auction outcome, the copilot refuses.