## 7 · Methodology Deep Dive

This module matches its MODULE_GUIDES entry closely: a **municipal climate-resilience investment hub**
running FEMA-style benefit-cost analysis over adaptation measures, a grant-programme catalogue, resilience
bond structures, and an 8-city dashboard. The BCA math is **genuine present-value finance**; the city
resilience/adaptation scores and hazard lists are hand-authored, not modelled.

### 7.1 What the module computes

The core engine is a discounted benefit-cost analysis (`calcBcr` / `calcNpv`) using the standard
present-value-of-an-annuity formula — the same mechanic FEMA's BCA Toolkit uses:

```js
dr         = discountRate / 100
pvBenefits = dr > 0 ? annBenefit · (1 − (1+dr)^(−lifetime)) / dr : annBenefit · lifetime
BCR        = pvBenefits / capex
NPV        = pvBenefits − capex
```

A separate city-level ROI proxy: `roi = avoidedLoss / investment` where
`avoidedLoss = investment · (city.bcr − 1)` — i.e. ROI is algebraically pinned to the city's stored BCR
(`roi = bcr − 1`), so it is a re-expression, not an independent estimate.

### 7.2 Parameterisation / scoring rubric

| Dataset | Fields | Provenance |
|---|---|---|
| `RESILIENCE_MEASURES` (8) | capex, annBenefit, lifetime, co2, **bcr**, hazard | Hand-authored, realistic (e.g. Early Warning Systems BCR 8.1, NbS 5.8, Green Stormwater 3.8) |
| `CITIES` (8) | pop, hazards, resilienceScore, investment, avoided, bcr, adaptScore, fundingStack | Hand-authored (NYC 74/BCR 4.2, Rotterdam 92/6.8, Lagos 32/2.1) |
| `FUNDING_PROGRAMS` (8) | amount ($M), type, match, focus | **Real US/EU programmes** — FEMA BRIC, HUD CDBG-DR, Army Corps CSRM, EPA WIFIA, DOT RAISE, EU Cohesion Fund, Green Climate Fund |
| `BOND_STRUCTURES` (5) | security, tenor, rate, pros/cons | Real muni-finance instruments (GO, revenue, green, SIB/PAYGO, CAT bond) |
| `fundingTrend` | year, total, federal | Synthetic (`sr()` seeded around a 28+8.5·i trend) |

The stored per-measure `bcr` values are **inputs**, hand-set; the live `calcBcr` calculator recomputes a
BCR from the user's discount rate and the measure's capex/annBenefit/lifetime, so the two can differ (the
calculator is the honest engine; the stored `bcr` is a headline figure).

### 7.3 Calculation walkthrough

1. User picks a city → `roi = bcr − 1`; picks a measure + discount rate → live `bcr`/`npv` from the PV
   annuity formula.
2. `cityRankData` sorts cities by `resilienceScore`; `measureBcrData` sorts measures by stored `bcr`.
3. `totalFunding = Σ FUNDING_PROGRAMS.amount` drives the "total program funding" KPI.
4. Radar normalises five city metrics onto 0–100 (`min(100, bcr·15)`, `min(100, avoided·1.2)` …) for
   visual comparison.

### 7.4 Worked example (Green Stormwater Infrastructure, 4 % discount)

`measure = {capex 45, annBenefit 12, lifetime 30}`, `dr = 0.04`:

| Step | Computation | Result |
|---|---|---|
| Annuity factor | `(1 − 1.04^(−30)) / 0.04` = `(1 − 0.3083)/0.04` | 17.29 |
| PV benefits | `12 · 17.29` | **$207.5M** |
| BCR | `207.5 / 45` | **4.61** |
| NPV | `207.5 − 45` | **$162.5M** |

At `dr = 0` the annuity collapses to `annBenefit · lifetime = 12·30 = 360`, BCR 8.0 — correctly showing
how a higher discount rate suppresses long-lived benefits (the whole point of FEMA's discount-rate
sensitivity, run at 3 % and 7 %). The stored headline `bcr = 3.8` reflects a higher assumed discount.

### 7.5 Data provenance & limitations

- **Funding programmes and bond structures are real** and accurately described; **city and measure
  datasets are hand-authored** plausible values, not sourced from a municipal GIS asset inventory or a
  cat model. `fundingTrend` is the only PRNG-seeded (`sr(s)=frac(sin(s+1)·10⁴)`) series.
- The BCA engine is sound but **single-measure**: no portfolio optimisation across measures under a
  budget, no probabilistic avoided-loss (it uses point annual benefits, not an EP-curve-integrated AAL),
  and no explicit RCP/SSP hazard scenario driving the benefit stream.
- `resilienceScore`/`adaptScore` are opaque 0–100 composites with no documented sub-factors.

**Framework alignment:** **FEMA BCA Reference Guide v6** — the PV-annuity BCR and the ≥1.0 grant-
eligibility threshold are faithfully reproduced. **World Bank CURB** and **IPCC AR6 WG2 Ch.17** framing
(adaptation option appraisal) is referenced. Grant catalogue maps to real **FEMA BRIC / HUD CDBG-DR /
EPA WIFIA / GCF** windows. The gap vs production practice is the missing probabilistic avoided-loss
model (see §8).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The BCR engine uses point annual benefits and
hand-set avoided-loss. A production hub should derive avoided loss from a probabilistic hazard-loss model
and optimise measure selection under budget.

### 8.1 Purpose & scope
Prioritise a municipality's adaptation capex across candidate measures and hazards, producing scenario-
conditioned BCR/NPV and a budget-constrained optimal portfolio, for FEMA/GCF grant applications and bond
sizing.

### 8.2 Conceptual approach
Couple a **probabilistic avoided-loss model** (EP-curve-integrated AAL, per RMS/AIR cat-modelling and the
platform's own `natcat-loss-engine`) with a **capital-budgeting optimiser** (knapsack over measures under
budget, maximising portfolio NPV). Benchmarks: **FEMA BCA Toolkit** (discounting, standard values) and
**World Bank CURB / OECD infrastructure appraisal** (co-benefit monetisation).

### 8.3 Mathematical specification
Per measure m and hazard h: avoided annual loss `ΔAAL_m,h = AAL_baseline_h − AAL_with_m,h`, where
`AAL = ∫ L(p) dp` over the exceedance-probability curve, and the with-measure curve reflects the measure's
loss-reduction fraction `η_m,h`. Benefit stream also includes co-benefits `CB_m` (heat, air quality,
habitat, GHG at a carbon price). `PV(m) = Σ_{t=1}^{life} (ΔAAL_m·(1+g)^t + CB_m) / (1+dr)^t`.
`NPV(m) = PV(m) − capex_m`. Portfolio: `max Σ_m x_m·NPV(m)` s.t. `Σ_m x_m·capex_m ≤ Budget`,
`x_m ∈ {0,1}` (0/1 knapsack), plus hazard-coverage constraints.

| Parameter | Source |
|---|---|
| Baseline AAL_h | NatCat EP curves (RMS/AIR-style) under RCP 4.5/8.5 |
| Loss-reduction η_m,h | FEMA/USACE effectiveness studies |
| Discount rate dr | FEMA 7 % + 3 % sensitivity |
| Co-benefit values CB_m | EPA social cost of carbon, ASCE heat/stormwater studies |
| Benefit growth g | RCP hazard-intensification trend |

### 8.4 Data requirements
Municipal asset inventory + replacement values (GIS), hazard EP curves per site (from `natcat-loss-engine`
/ WRI Aqueduct), measure effectiveness library, discount rate, budget. Platform already provides the cat-
loss engine and funding catalogue.

### 8.5 Validation & benchmarking plan
Reconcile computed BCRs against published FEMA BRIC award BCAs for comparable projects; sensitivity on
discount rate (3/7 %) and η; verify knapsack optimality against exhaustive search on small measure sets.

### 8.6 Limitations & model risk
Avoided-loss estimates inherit deep cat-model uncertainty; co-benefit monetisation is contested; 0/1
knapsack ignores partial/phased implementation. Conservative fallback: report BCR ranges (not points),
apply FEMA's 7 % discount as the primary case, and exclude speculative co-benefits from the eligibility BCR.
