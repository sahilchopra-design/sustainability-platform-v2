## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-EI1) advertises a decomposed NPV —
> `NPV = Σ[(SalePremium + RentPremium + VacancyBenefit + EnergySaving)/(1+r)^t] − CAPEX` with
> `MOIC = TotalBenefit/CAPEX`. **The code's `npvCalc` does none of that decomposition.** It applies a
> single flat annual benefit of **8% of CAPEX** to a 10-year discounted sum: `annualBenefit = capex·0.08`.
> The rich certification/building/ROI-breakdown tables (`CERTIFICATIONS`, `BUILDINGS`, `ROI_BREAKDOWN`)
> are displayed for context but do **not** feed the calculator. The page is a **green-building economics
> dashboard with a simplified NPV/MOIC slider**; §8 specifies the decomposed model the guide claims.

### 7.1 What the module computes

The interactive calculator (2 sliders: `capex` $M, `discountRate` %):
```js
annualBenefit = capex · 0.08                                          // flat 8% of CAPEX per year
npv  = Σ_{t=1..10} annualBenefit / (1 + discountRate/100)^t  −  capex
moic = 1 + npv / capex
```
Portfolio KPIs over the 22-building set (filtered by certification system):
```js
avgSalePremium = mean(salePremium)     avgRentPremium = mean(rentPremium)
avgEnergySaving = mean(energySaving)   avgPayback = mean(payback)
```

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| Annual benefit rate | `capex·0.08` (flat 8%) | **hard-coded heuristic** — no components, no framework |
| NPV horizon | 10 years | assumption in code |
| `CERTIFICATIONS` premia | LEED Platinum 8.5% sale / 6.2% rent; BREEAM Outstanding 9.2%/7.1%; NABERS 6★ 7.0%/5.5% | synthetic but consistent with JLL/RICS green-premium ranges (guide-cited) |
| `BUILDINGS` (22) | gfa `5000+sr·95000`; certCost `50+sr·450`; premiums `sr`-drawn | synthetic, seeded |
| `ROI_BREAKDOWN` | 6 components × LEED/BREEAM/NABERS | static reference table (illustrative) |
| `MARKET_TREND` | certifiedStock, avgPremium, greenLoanVolume 2024–2033 | synthetic linear trend |

Crucially, the `ROI_BREAKDOWN` table *does* enumerate the sale/rent/vacancy/energy/opex/financing
components the guide's formula wants — but they are shown in a chart, never summed into `annualBenefit`.

### 7.3 Calculation walkthrough

Sliders → `annualBenefit = 0.08·capex` → 10-year discount → `npv`, `moic`. Certification filter →
`BUILDINGS.filter(cert startsWith system)` → recompute the four average-premium KPIs. The two paths are
independent: changing the certification filter does not alter the NPV, and the NPV ignores the per-scheme
premiums entirely.

### 7.4 Worked example

`capex = $20M`, `discountRate = 7%`. `annualBenefit = 20·0.08 = $1.6M/yr`. Discounted 10-yr annuity
factor at 7% = `(1 − 1.07^−10)/0.07 = 7.0236`. `PV of benefits = 1.6·7.0236 = $11.24M`.
`npv = 11.24 − 20 = −$8.76M`; `moic = 1 + (−8.76/20) = 0.56`. So under the flat-8% assumption a $20M
certification spend is value-destructive (MOIC 0.56×) — a direct artefact of the hard-coded 8% benefit
rate being below the discount-adjusted breakeven, not of any building-specific economics.

### 7.5 Data provenance & limitations

- The NPV engine is a **single-parameter heuristic** (8% of CAPEX); it cannot reflect asset size, rent
  level, energy price, vacancy, or certification tier — the very drivers the guide lists.
- `BUILDINGS` are synthetic (seeded `sr()`); named investors/cities are illustrative labels.
- The decomposed component data exists (`ROI_BREAKDOWN`) but is disconnected from the calculator, so the
  displayed ROI narrative and the NPV number can contradict each other.
- No stranding/CRREM, no financing-cost saving modelled despite being a named component.

**Framework alignment:** LEED v4.1 / BREEAM 2018 / NABERS / DGNB / Green Star (label systems in
`CERTIFICATIONS`); EU Taxonomy Art. 7.7 DNSH buildings and the NZEB +10% threshold are referenced as the
alignment target; GRESB Green Star as benchmark positioning. The green-premium magnitudes echo JLL and
RICS studies. The decomposed, discounted certification-NPV the guide names is specified in §8.

## 8 · Model Specification — Certification-Investment NPV / MOIC Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Value the decision to pursue a green certification on a specific asset: does the incremental CAPEX earn
its cost through higher rent, sale premium, lower vacancy, energy/opex savings and cheaper green
financing? Coverage: single-asset underwriting within a real-estate portfolio.

### 8.2 Conceptual approach
Build a **component-decomposed discounted-cash-flow** exactly as the guide states, benchmarked against
RICS "Sustainability and Real Estate Value" and JLL green-premium methodologies and against CRREM's
value-at-risk framing: each benefit stream is modelled from the asset's own rent roll and energy profile,
discounted at an asset-appropriate rate, net of the certification CAPEX and ongoing verification cost.

### 8.3 Mathematical specification
```
Annual benefit in year t:
  B_t = ρ_rent·Rent_0·(1+g)^t          (rent premium on passing rent)
      + Δvac·Rent_0·(1+g)^t            (vacancy reduction × rent)
      + E_save·P_energy,t              (energy saving × energy price)
      + OpEx_save + Fin_save           (opex & financing-cost saving)
NPV = Σ_{t=1..T} B_t/(1+r)^t + SalePremium·Value_T/(1+r)^T − (CAPEX + Σ VerCost_t/(1+r)^t)
MOIC = (Σ discounted benefits) / (CAPEX + Σ discounted verification cost)
Payback = min{ T' : Σ_{t≤T'} B_t ≥ CAPEX }
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `ρ_rent`, `SalePremium` | rent/sale premium by tier | JLL/RICS green-premium studies; MSCI |
| `Δvac` | vacancy reduction | leasing data / RICS |
| `E_save`, `P_energy,t` | energy saving & price path | EPC/audit; IEA/national energy forecasts |
| `Fin_save` | green-loan margin benefit | green-mortgage / SLL market (EBA label) |
| `r` | asset discount rate | WACC / cap-rate build-up |
| `g` | rent growth | market forecast |

### 8.4 Data requirements
Per asset: passing rent, GFA, vacancy, energy use + tariff, target certification tier + CAPEX, financing
terms. Sources: rent roll, EPC/energy audit (internal), green-premium coefficients (JLL/RICS/MSCI),
energy-price forecasts (IEA). The platform holds the premium reference table (`CERTIFICATIONS`) and the
component split (`ROI_BREAKDOWN`) — these become the calibration inputs.

### 8.5 Validation & benchmarking plan
Backtest predicted premiums against realised certified-vs-uncertified transaction spreads; reconcile
payback against `CERT_COST_BENEFIT`-style market surveys; sensitivity of NPV to each component (tornado);
cross-check the sale-premium term against MSCI green-premium indices.

### 8.6 Limitations & model risk
Premium coefficients suffer selection bias (certified assets are also better-located/newer) — control for
grade/location or the NPV overstates certification value. Energy-price and rent-growth paths are exogenous
and material. Conservative fallback: report NPV as a range across low/central/high premium coefficients and
flag when the result flips sign within that band.
