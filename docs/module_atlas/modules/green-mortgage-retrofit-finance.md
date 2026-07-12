# Green Mortgage & Retrofit Finance
**Module ID:** `green-mortgage-retrofit-finance` · **Route:** `/green-mortgage-retrofit-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EI3 · **Sprint:** EI

## 1 · Overview
8 green mortgage products with rate discount and EPC minimum requirements, 6 retrofit scheme analytics (UK ECO4/GBIS, EU Renovation Wave, France MaPrimeRénov, Germany BAFA/KfW, US IRA §25C), benefit calculator, and market forecast.

> **Business value:** Used by mortgage lenders structuring green products, housing associations accessing ECO4 grants, sustainability-linked bond issuers, and ESG advisory teams benchmarking green finance offerings.

**How an analyst works this module:**
- Compare 8 green mortgage products by rate discount, EPC minimum, max LTV, and lender certification
- Review 6 retrofit schemes with grant amounts, eligibility, and timeline details
- Use calculator to model total benefit (rate saving + energy saving) for different loan sizes and EPC improvements
- Explore market forecast for green mortgage origination and retrofit spend 2024–2030

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEALS`, `KpiCard`, `MARKET_DATA`, `MORTGAGE_PRODUCTS`, `Pill`, `RETROFIT_SCHEMES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MORTGAGE_PRODUCTS` | 9 | `country`, `epcReq`, `rateBenefit`, `maxLTV`, `features`, `volume2023` |
| `RETROFIT_SCHEMES` | 7 | `country`, `budget`, `target`, `subsidy`, `tech` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `calc` | `useMemo(() => { const rateSaving = 0.0015 * epcImprovement;` |
| `annualInterestSaving` | `loanAmount * 1000 * rateSaving;` |
| `annualEnergySaving` | `energySaving * 0.15 * 100;` |
| `totalAnnual` | `annualInterestSaving + annualEnergySaving;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MORTGAGE_PRODUCTS`, `RETROFIT_SCHEMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EBA Green Mortgage rate discount | `For EPC A/B properties across 8 lenders` | EBA Green Mortgage Label Product Sheet 2023 | NatWest offers 60bps discount for EPC A; average across 8 tracked lenders is 28bps; linked to green bond funding costs. |
| UK ECO4 grant (max) | `For solid wall insulation in eligible households` | UK Government ECO4 Scheme 2022 | ECO4 targets lowest income and worst EPC D–G properties; fully funded by energy suppliers via obligation. |
| IRA §25C annual cap | `Per taxpayer per year for qualified efficiency improvements` | US IRS Notice 2023-29 | 30% credit (max $1,200 insulation/windows + $2,000 heat pump); first substantive residential retrofit incentive in US history. |
- **EBA GML + UK ECO4/GBIS + EU Renovation Wave + IRA §25C + KfW BEG + MaPrimeRénov** → Green mortgage product comparison + retrofit scheme analytics + benefit calculator + market forecast → **Mortgage lenders, green bond issuers, housing associations, and property ESG advisory teams**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Mortgage Benefit
**Headline formula:** `MonthlySaving = (StandardRate − GreenRate) × LoanBalance / 12; EnergySaving = ΔEPCgrade × AvgEnergyBill; TotalAnnualBenefit = MonthlySaving × 12 + EnergySaving; Payback = RetrofitCost / TotalAnnualBenefit`

Green mortgages typically offer 10–60bps rate discount for EPC A/B properties; EU Renovation Wave targets 35 million building renovations by 2030.

**Standards:** ['EBA Green Mortgage Label 2022', 'EU Renovation Wave Strategy 2020', 'IRA §25C Energy Efficiency Tax Credit 2022']
**Reference documents:** EBA (2022) – Green Mortgage Label Product Sheet; European Commission (2020) – Renovation Wave Strategy; IRS (2023) – Notice 2023-29 §25C Tax Credit Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Lender-specific two-rate spread and EPC-grounded energy savings (analytics ladder: rung 1 → 2)

**What.** §7 credits this with a deterministic (no-PRNG) benefit calculator and static real-world product/scheme tables covering 8 green mortgage products and 6 retrofit schemes (UK ECO4/GBIS, EU Renovation Wave, France MaPrimeRénov, Germany BAFA/KfW, US IRA §25C). Its flagged simplification: the rate benefit is a flat 15 bps per EPC notch rather than a lender-specific two-rate spread, and the energy-saving term (`ΔEPCgrade × AvgEnergyBill`) uses an average bill rather than the property's actual consumption. Evolution A grounds these: model each product's actual standard-vs-green rate spread (from the real product table) instead of a flat 15 bps, and derive energy savings from EPC-band-specific energy-intensity data (the platform's EPC feed, wired in wave-1) rather than a flat average bill.

**How.** (1) Replace the flat 15 bps/notch with each product's real two-rate spread from the product table, so the monthly saving reflects the actual discount. (2) Energy savings from EPC-band EUI deltas × the property's floor area and local energy price, not a flat bill. (3) The retrofit-scheme subsidies netted into the payback so `Payback = (RetrofitCost − Subsidy)/TotalAnnualBenefit` reflects the real scheme.

**Prerequisites.** EPC-band energy-intensity data (wave-1 EPC source); local energy prices; the flat 15 bps replaced by product-specific spreads. **Acceptance:** the monthly saving uses each product's real rate spread; energy savings derive from EPC-band EUI and property area; payback nets scheme subsidies; no flat-15bps assumption remains.

### 9.2 Evolution B — Retrofit-financing copilot (LLM tier 1 → 2)

**What.** A copilot for mortgage lenders and homeowners: "for an EPC-D house upgraded to B with a €20k retrofit, which scheme and green mortgage minimise payback?" narrates the product and scheme tables from the atlas corpus, with tier-2 computing the benefit/payback via the Evolution A calculator across products and schemes.

**How.** Tier 1 grounds on §5/§7 (the 8 products, 6 real retrofit schemes, the benefit/payback formulae) — the copilot cites real scheme terms (ECO4, MaPrimeRénov, IRA §25C). Because the calculator is deterministic, an explainer over rendered state ships immediately; the tier-2 upgrade computes cross-product/scheme comparisons via the Evolution A endpoint. Every saving and payback figure validated against tool output.

**Prerequisites.** Corpus embedding; Evolution A for lender-specific/EPC-grounded computation. **Acceptance:** every saving and payback figure traces to a tool call or rendered state; the scheme recommendation uses real subsidy terms; post-Evolution-A the energy saving reflects EPC-band data, not a flat bill.