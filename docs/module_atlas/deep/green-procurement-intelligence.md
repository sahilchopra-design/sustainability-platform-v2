## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-DN6) advertises a **Green Procurement TCO**
> (`GreenTCO = CapEx + Σ(OpEx + ExternalCost)/(1+r)^t`) and a **carbon-reduction** aggregation
> (`Σ[Spend_i·(ConvEF − GreenEF)]`). **Neither the discounted TCO nor the emission-factor differential is
> computed in the code.** The `co2SavedT` and `costSavingsMn` figures are **pre-tabulated fields** on the
> static `PROGRAMMES` array; the page sums them. This is a **green-procurement portfolio dashboard** —
> spend, green-spend %, CO₂ saved, savings, and standards/category breakdowns — over static data. §8
> specifies the TCO and carbon-differential model.

### 7.1 What the module computes

Pure aggregation over the static `PROGRAMMES` set:
```js
totalSpend      = Σ totalSpendMn
totalGreenSpend = Σ greenSpendMn
totalCo2Saved   = Σ co2SavedT
totalSavings    = Σ costSavingsMn
avgGreenPct     = Σ greenSpendPct / max(1, N)
compliantCount  = count(status == 'Compliant')
```
Breakdowns: `standardBreakdown` (green spend + avg cert score per standard), `categoryBreakdown` (spend,
CO₂, savings per category), a savings-lever allocation (`savingsAnalysis`, e.g. 28% of savings to energy
efficiency), and `top10Programmes` by `co2SavedT`.

### 7.2 Parameterisation / provenance

| Field | Nature | Provenance |
|---|---|---|
| `PROGRAMMES` (per-programme) | totalSpendMn, greenSpendMn, greenSpendPct, co2SavedT, costSavingsMn, certScore, status | static; curated/illustrative |
| `STATUS` | Compliant/Partial/Non-Compliant/In Progress/Pending | categorical labels |
| `savingsAnalysis` split | 28% energy efficiency, fleet, etc. | **hard-coded allocation** of total savings |
| `STANDARDS`, `CATEGORIES` | grouping keys | ISO 20400 / EU GPP framing |

No PRNG. The `co2SavedT` and `costSavingsMn` are inputs, not derived — the module trusts them rather than
computing them from spend × emission-factor differentials.

### 7.3 Calculation walkthrough

`PROGRAMMES` → sum spend/green-spend/CO₂/savings → KPI cards. `standardBreakdown` groups by standard and
means `certScore`; `categoryBreakdown` groups by category and sums spend/CO₂/savings. `savingsAnalysis`
apportions `totalSavings`/`totalCo2Saved` across named levers by fixed fractions. `top10Programmes` sorts by
`co2SavedT`. Every output is a reduction or grouping of static fields.

### 7.4 Worked example

Three programmes with `co2SavedT` = 4,000 / 2,500 / 1,500 t and `costSavingsMn` = 3.0 / 2.0 / 1.0:
`totalCo2Saved = 8,000 t`, `totalSavings = $6.0M`. The energy-efficiency lever = `totalSavings·0.28 =
6.0·0.28 = $1.68M` and `totalCo2Saved·0.25 = 8,000·0.25 = 2,000 t`. These are display allocations of
pre-supplied totals — the module cannot say *why* a programme saved 4,000 t, because the saving is an
input, not a spend×EF-differential output.

### 7.5 Data provenance & limitations

- **All programme data is static** and curated; CO₂ saved and cost savings are **given, not computed**.
- The guide's discounted **GreenTCO** (with external carbon shadow price) is **absent** — no life-cycle
  cost comparison of green vs conventional alternatives.
- The carbon-reduction differential (`Σ Spend·(ConvEF − GreenEF)`) is **absent** — CO₂ saved is not tied to
  emission factors, so it can't be audited against spend.
- Savings-lever splits are hard-coded fractions, not derived from the programme mix.

**Framework alignment:** EU Green Public Procurement Criteria (2023) — the compliance-status and green-spend
framing; ISO 20400:2017 sustainable procurement; OECD GPP; UN SDG procurement. Real GPP TCO accounting nets
capex, opex and an external carbon cost at a shadow price over the asset life — specified in §8.

## 8 · Model Specification — Green-Procurement TCO & Carbon-Reduction Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compare green vs conventional procurement on a true total-cost-of-ownership basis (including an external
carbon cost) and compute auditable procurement-carbon reduction from spend and emission factors — for
public/corporate procurement decisions.

### 8.2 Conceptual approach
Life-cycle TCO with a carbon shadow price (the EU GPP / ISO 20400 method), benchmarked against **EU GPP
cost-benefit analysis** and **OECD GPP** guidance: discount capex + opex + externalised carbon over the
asset life; the carbon reduction is a spend-weighted emission-factor differential.

### 8.3 Mathematical specification
```
GreenTCO = CapEx_green + Σ_t (OpEx_green,t + EF_green·Activity_t·CarbonPrice_t)/(1+r)^t
ConvTCO  = CapEx_conv  + Σ_t (OpEx_conv,t  + EF_conv·Activity_t·CarbonPrice_t)/(1+r)^t
TCO_advantage = ConvTCO − GreenTCO
CarbonReduction = Σ_i Spend_i · (ConvEF_i − GreenEF_i)/UnitPrice_i        (tCO₂e)
CostSaving      = Σ_t (OpEx_conv,t − OpEx_green,t)/(1+r)^t
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `EF_green/conv` | emission factors by category | DEFRA/EPA/ecoinvent EFs |
| `CarbonPrice_t` | shadow/market price | EU ETS / internal shadow price |
| `OpEx` paths | running cost by option | vendor quotes / benchmarks |
| `r` | discount rate | public discount rate (e.g. HM Treasury Green Book) |

### 8.4 Data requirements
Per category: green & conventional capex, opex, emission factors, activity/consumption, spend. Sources:
procurement records (spend), DEFRA/EPA EFs (free), vendor quotes, carbon-price policy. The module holds
spend and pre-computed CO₂/savings; replace with EF-driven computation.

### 8.5 Validation & benchmarking plan
Reconcile carbon reduction against EF-based bottom-up estimates; validate TCO advantage against EU GPP
cost-benefit case studies; sensitivity to carbon price and discount rate; audit CO₂ saved against spend×EF.

### 8.6 Limitations & model risk
Emission factors and opex paths are category- and region-specific; shadow carbon price is a policy choice
that swings TCO. Conservative fallback: report TCO advantage across low/central/high carbon-price and
discount-rate scenarios, and derive CO₂ saved from EFs rather than accepting supplied totals.
