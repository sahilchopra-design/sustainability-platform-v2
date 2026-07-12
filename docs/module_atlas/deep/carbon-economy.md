## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes *macro carbon-market
> analytics* — global market size ($900B+), `MarketValue = Σ(Volume_i × Price_i)`, a McKinsey MAC
> curve and BNEF investment flows. **None of that exists in this module's code.** What the page
> actually implements is a **consumer/personal carbon economics explorer**: carbon-price tagging of
> everyday activities ("true cost"), country per-capita footprints vs a 1.5 °C personal budget, a
> personal carbon-tax calculator, diet/transport/housing carbon comparisons, and a lifetime "carbon
> net worth" counter. The macro market analytics the guide describes live in `carbon-market-intelligence`
> and `carbon-forward-curve`. The sections below document the code as it behaves.

### 7.1 What the module computes

The core computation is *shadow carbon pricing of consumption*. For every activity `a` with an
embedded footprint `carbon_kg` and out-of-pocket cost `money_cost`, and a user-selected carbon
price `P` ($/tCO₂e, slider):

```
carbon_cost       = carbon_kg × P / 1000            // $ externality at price P
true_cost         = money_cost + carbon_cost         // internalised price
carbon_per_dollar = carbon_kg / money_cost           // kg CO₂e per $ spent (ranking key)
```

Activities are sorted descending by `carbon_per_dollar` (`pricedActivities`), so the most
carbon-intensive spending surfaces first. A second engine compares each country's per-capita
footprint against a fixed 1.5 °C-compatible personal budget:

```
dailyBudget_15C  = 6.3 kg/day        // code comment: "2.3t / 365"
annualBudget_15C = 2300 kg/yr
gap              = max(0, per_capita_t − 2.3)                    // countryGapData
used%            = min( (per_capita_t×1000/365) / 6.3 × 100, 100) // budget gauge
carbonTax        = per_capita_t × P   for P ∈ {51, 100, 200} $/t  // carbonTaxData
carbonNetWorth   = age × per_capita_t                             // lifetime tonnes
```

### 7.2 Parameterisation & data tables

| Constant / dataset | Value | Provenance |
|---|---|---|
| Personal 1.5 °C budget | 2.3 tCO₂e/yr (6.3 kg/day) | Widely cited IGES/Aalto "1.5-Degree Lifestyles" 2030 target; hard-coded |
| `GLOBAL_EMISSIONS_PER_SEC` | 1,169 kg/s | Code comment: "~36.8 Gt / year" (≈ Global Carbon Project 2023 CO₂ total) |
| Carbon price presets | $51 / $100 / $200 per t | $51 ≈ US EPA interim SCC (2021); others scenario values |
| `COUNTRY_FOOTPRINTS` (21 rows) | e.g. USA 15.5 t, India 1.9 t, Nigeria 0.6 t | Static seeds, order-of-magnitude consistent with Global Carbon Atlas / OWID consumption figures; breakdown %s are illustrative |
| `SECTOR_INTENSITY` (11 rows) | Electricity 1.82 → Finance 0.08 kg/$ | Static, EEIO-style spend intensities (unsourced in code) |
| `CARBON_DIET_COMPARISON` (13 rows) | Beef 5.4 kg/200 g … lentils 0.18 kg | Consistent with Poore & Nemecek (2018) ranges; hard-coded |
| `TRANSPORT_COMPARISON` (13 rows) | Petrol car 210 g/km, flight 255 g/km, train 41 g/km | Consistent with UK BEIS/DEFRA factor magnitudes; hard-coded |
| `PERSONAL_ACTIONS` (11 rows) | Car-free 2.4 t, one fewer flight 1.6 t … | Matches Wynes & Nicholas (2017) magnitudes; hard-coded |
| `GLOBAL_CARBON_CLOCK` | 250 Gt budget, 421 ppm, +1.2 °C | IPCC AR6-era values; hard-coded |

No `sr()` PRNG is used in this module — all data are static seed tables; only the carbon price,
country and age inputs are user-driven.

### 7.3 Calculation walkthrough

1. User picks a carbon price `P` (slider) and a country → `countryData` row selected.
2. `pricedActivities` maps the 3 activity tables (daily/weekly/annual) through §7.1 formulas and
   sorts by `carbon_per_dollar`; a `pct = carbon_cost / money_cost × 100` column shows the hidden
   price mark-up.
3. Category cards compute `catCarbon = per_capita_t × pct/100` (tonnes per category),
   `catDaily = per_capita_t×1000×pct/100/365` (kg/day) and `catCost = catCarbon × P` ($ tax).
4. The budget gauge computes `used%` (capped at 100) and the annual budget bar computes
   `budgetPct = annual_carbon / 2300 × 100` per activity.
5. `lifetimeCarbonByCategory = age × per_capita_t × pct/100` allocates the lifetime stock.
6. CSV export dumps `pricedActivities` rows (Activity, Carbon_kg, Dollar_Cost, Carbon_Cost,
   True_Cost, Carbon_Per_Dollar).

### 7.4 Worked example

US resident (15.5 t/yr), age 40, carbon price $100/t; activity = "Fill up car (50 L petrol)"
(115.5 kg, $75, annual 6,006 kg):

| Step | Computation | Result |
|---|---|---|
| Carbon cost | 115.5 × 100 / 1000 | **$11.55** |
| True cost | 75 + 11.55 | **$86.55** (+15.4%) |
| Carbon per dollar | 115.5 / 75 | **1.54 kg/$** |
| Annual budget share | 6,006 / 2,300 × 100 | **261%** of a full 1.5 °C budget |
| Country tax @$100 | 15.5 × 100 | **$1,550/yr** ($129/month) |
| Budget gauge | (15,500/365)/6.3 × 100 = 674 → capped | **100%** |
| Carbon net worth | 40 × 15.5 | **620 t lifetime** |

### 7.5 Data provenance & limitations

- All datasets are **hard-coded illustrative seeds** — no live API despite the module's tier-A
  wiring to `carbon_calculator.py` / `methodology_engine.py` (trace labels list `/api/v1/carbon/*`
  endpoints, but the page renders entirely from local constants).
- Country breakdowns (transport/home/food/goods/services %) are stylised, not from a published
  consumption-based accounting source; the same 2.3 t budget is applied to every country and year
  (real 1.5 °C-compatible per-capita budgets decline over time).
- `true_cost` assumes 100% pass-through of the carbon price to the consumer and no behavioural
  response (no demand elasticity).
- The guide's macro content (MAC curve, market size, ICAP coverage) is absent from code.

**Framework alignment:** *1.5-Degree Lifestyles* (IGES/Aalto/D-mat 2019) — source of the
2.5→2.3 t/cap near-term lifestyle budget the module hard-codes · IPCC AR6 WGI remaining carbon
budget (~250 GtCO₂ for 1.5 °C at 50% from early 2023) — mirrored in `GLOBAL_CARBON_CLOCK` ·
Poore & Nemecek (2018, *Science*) food LCA ranges · social cost of carbon (US EPA interim $51/t)
as the default shadow price. None are cited inline in code; alignment is by value inspection.

## 8 · Model Specification — Consumption-Based Personal Carbon Accounting

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Replace static activity tables with a defensible spend- and
activity-based footprint estimator for an individual or household, supporting the module's
true-cost, budget-gauge and tax-calculator displays. Coverage: all consumption categories,
21+ countries, updateable annually.

**8.2 Conceptual approach.** Hybrid EEIO + process-LCA estimator, the same architecture used by
commercial spend-carbon engines (Mastercard/Doconomy Åland Index; CoGo; Connect Earth) and by
S&P Trucost EBoard sector intensities. Spend-based EEIO gives full coverage; activity-based
process factors (fuel litres, kWh, km) override spend estimates where physical data exist —
mirroring GHG Protocol Scope 3 guidance's data-quality ladder.

**8.3 Mathematical specification.**

```
F_spend(c,r)   = Σ_k  S_k × EF_EEIO(k, r)                 // kg CO₂e; k = COICOP category
F_activity     = Σ_j  Q_j × EF_process(j)                  // physical units × factor
F_total        = Σ_k [ physical_data_k ? F_activity,k : F_spend,k ]
TrueCost_k     = S_k + F_k × P_carbon / 1000
Budget_t(1.5°C)= B_2030 × (1 − g)^(t−2030),  B_2030 = 2.5 t, g s.t. B_2050 = 0.7 t
```

| Parameter | Calibration source |
|---|---|
| `EF_EEIO(k,r)` (kg/$ by COICOP × region) | EXIOBASE 3 (free) or US EPA USEEIO v2; CEDA (vendor) |
| `EF_process(j)` fuel/electricity/travel | UK DEFRA/DESNZ conversion factors (annual, free); IEA grid EFs (platform `reference_data` already holds OWID energy + grid EF endpoint `GET /api/v1/carbon/data/grid-emission-factor`) |
| Country per-capita footprints | Global Carbon Budget + OWID consumption-based CO₂ (already ingested: OWID CO₂ table in `reference_data`) |
| Personal budgets B_2030/B_2050 = 2.5/0.7 t | IGES/Aalto 1.5-Degree Lifestyles (2019) |
| `P_carbon` scenarios | NGFS Phase IV/V carbon-price paths; EPA SCC ($51–190/t) |

**8.4 Data requirements.** Transaction category + amount + currency (user input or CSV import —
the sibling `carbon-wallet` module already captures this schema); optional physical quantities
(litres, kWh, km); country of residence. Platform assets reusable: `reference_data` OWID tables,
`/api/v1/carbon/emission-factors`, `carbon_calculator.py` factor lookups.

**8.5 Validation & benchmarking.** (i) Reconcile country aggregates against OWID consumption-based
per-capita CO₂ (tolerance ±10%); (ii) cross-check 20 benchmark activities against DEFRA factors;
(iii) sensitivity: ±30% on EEIO intensities must not reorder the top-5 `carbon_per_dollar`
ranking; (iv) benchmark full-profile outputs against the UC Berkeley CoolClimate calculator.

**8.6 Limitations & model risk.** EEIO factors are sector averages (product-level error up to
2–3×); currency/PPP conversion drift; budget allocation to individuals is normative, not
physical. Fallback: display uncertainty bands (P25–P75 of factor range) and label spend-based
rows as "estimated".
