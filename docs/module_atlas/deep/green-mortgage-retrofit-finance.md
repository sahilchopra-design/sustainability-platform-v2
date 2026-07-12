## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (EP-EI3) and the code broadly agree: this module runs a **green-mortgage benefit
calculator** combining a rate discount with energy savings, over static mortgage-product and retrofit-scheme
reference tables. The guide's formula (`MonthlySaving = (StdRate − GreenRate)·Balance/12; EnergySaving =
ΔEPCgrade·AvgBill; Payback = RetrofitCost/TotalAnnualBenefit`) is implemented in a slightly reduced form —
the rate saving is parameterised by EPC improvement notches rather than a two-rate spread. No hard mismatch.

### 7.1 What the module computes

The live calculator (`calc`, driven by sliders `epcImprovement`, `loanAmount`, `energySaving`):
```js
rateSaving           = 0.0015 · epcImprovement          // 15 bps per EPC-grade improvement
annualInterestSaving = loanAmount·1000 · rateSaving     // $/yr interest saved
annualEnergySaving   = energySaving · 0.15 · 100        // energy bill saving
totalAnnual          = annualInterestSaving + annualEnergySaving
// (payback = retrofitCost / totalAnnual, per the guide)
```
Reference tables: `MORTGAGE_PRODUCTS` (8 products by country with `epcReq`, `rateBenefit`, `maxLTV`,
`volume2023`) and `RETROFIT_SCHEMES` (6 national schemes: UK ECO4/GBIS, EU Renovation Wave, France
MaPrimeRénov, Germany BAFA/KfW, US IRA §25C) with budget/target/subsidy/tech.

### 7.2 Parameterisation / provenance

| Element | Value | Provenance |
|---|---|---|
| Rate saving per EPC notch | `0.0015` (15 bps) | code constant; within EBA 10–60 bps green-mortgage range |
| Energy-saving multiplier | `·0.15·100` | code constant (scales the energy-saving input to $) |
| `MORTGAGE_PRODUCTS` (9) | country, epcReq, rateBenefit, maxLTV, volume2023 | static; real product families (EBA Green Mortgage Label) |
| `RETROFIT_SCHEMES` (7) | budget, target, subsidy, tech | static; **real named schemes** (ECO4, MaPrimeRénov, KfW, IRA §25C) |

The 15 bps/notch and the 0.15 energy factor are hand-set; the scheme names and caps (UK ECO4 max £15,000,
IRA §25C $3,200/yr) are real and guide-cited.

### 7.3 Calculation walkthrough

Sliders → `rateSaving = 0.0015·epcImprovement` → `annualInterestSaving = loanAmount·1000·rateSaving` →
plus `annualEnergySaving` → `totalAnnual`. Payback divides an assumed retrofit cost by `totalAnnual`. The
product and scheme tables are static references the user browses to pick a product/scheme; the market-forecast
tab projects labelled-mortgage volume.

### 7.4 Worked example

`epcImprovement = 3` (grades), `loanAmount = $300k` (i.e. 300 in $k units → ·1000 = 300,000),
`energySaving = 20`:
- `rateSaving = 0.0015·3 = 0.0045` (45 bps).
- `annualInterestSaving = 300·1000·0.0045 = 300,000·0.0045 = $1,350/yr`.
- `annualEnergySaving = 20·0.15·100 = $300/yr`.
- `totalAnnual = 1,350 + 300 = $1,650/yr`.
- With a retrofit cost of $18,000: `payback = 18,000/1,650 = 10.9 yr`. The interest saving dominates
  (~82%), and a 3-grade EPC jump earns a 45 bps discount — consistent with the EBA 10–60 bps band.

### 7.5 Data provenance & limitations

- The calculator is **deterministic** (no PRNG); product and scheme tables are **static real-world data**.
- The rate benefit is a **flat 15 bps per EPC notch**, not a lender-specific two-rate spread — a
  simplification of the guide's `(StdRate − GreenRate)`.
- Energy saving is scaled by a single `0.15·100` factor rather than `ΔEPCgrade × actual bill`; no fuel
  price or property-size dependence.
- Payback ignores discounting, subsidy offsets (the schemes are shown but not netted into the calculator),
  and residual value.

**Framework alignment:** EBA Green Mortgage Label (2022) — the 10–60 bps rate-discount range the 15 bps/notch
sits within; EU Renovation Wave (35M renovations by 2030) — the scheme-target context; national retrofit
schemes (UK ECO4/GBIS, France MaPrimeRénov, Germany BAFA/KfW, US IRA §25C) — real, correctly named and
capped. EU Taxonomy / EPC A–G is the alignment frame.

## 8 · Model Specification — Green-Mortgage Benefit & Retrofit-Payback Model

**Status: specification — not yet implemented in code.** The calculator is sound but reduced; a production
version should decompose the rate spread and net subsidies.

### 8.1 Purpose & scope
Value a green mortgage + retrofit package for a specific borrower/property: net annual benefit (rate
discount + energy saving − financing) and subsidy-adjusted payback — for lenders and borrowers.

### 8.2 Conceptual approach
Cash-flow model over the mortgage term, benchmarked against **EBA Green Mortgage Label** economics and
national scheme rules: the rate discount is the actual green-vs-standard product spread; the energy saving
comes from the modelled EUI reduction × tariff; subsidies offset upfront retrofit cost.

### 8.3 Mathematical specification
```
InterestSaving_t = (StdRate − GreenRate)·Balance_t
EnergySaving_t   = ΔEUI·Area·P_energy,t
NetRetrofitCost  = RetrofitCost − Σ eligible subsidies (ECO4/MaPrimeRénov/§25C caps)
TotalAnnual_t    = InterestSaving_t + EnergySaving_t
NPV = Σ_t TotalAnnual_t/(1+r)^t − NetRetrofitCost
Payback = min{ T : Σ_{t≤T} TotalAnnual_t ≥ NetRetrofitCost }
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `StdRate−GreenRate` | product spread | lender product sheets / EBA label (10–60 bps) |
| `ΔEUI` | energy-intensity cut | EPC pre/post, retrofit measure |
| `P_energy,t` | energy tariff path | national tariffs / IEA |
| subsidy caps | scheme grants | ECO4 (£15k), IRA §25C ($3,200/yr) etc. |
| `r` | discount rate | mortgage rate |

### 8.4 Data requirements
Property: EPC pre/post, area, energy use, retrofit cost, eligible schemes. Loan: balance, standard vs green
rate. Sources: EPC registries (free), lender rate sheets, scheme rules (public). The module holds the
product and scheme tables; per-property energy and rate spread must be added.

### 8.5 Validation & benchmarking plan
Reconcile rate discounts against EBA label ranges; validate energy savings against realised post-retrofit
consumption; check subsidy caps against scheme documentation; sensitivity to energy price and rate spread.

### 8.6 Limitations & model risk
Rebound reduces realised energy savings; rate spreads are small and lender-specific; subsidy eligibility is
complex. Conservative fallback: report payback with and without subsidies and across low/high energy-price
paths.
