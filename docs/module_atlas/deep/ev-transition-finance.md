## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The MODULE_GUIDES entry (EP-DF5) promises a **discounted**
> TCO `Σ[(Energy+Maint+Insurance−Residual)]/(1+r)^t` plus ICE-stranding risk
> `max(0, RemainingLoanLife − EVParityYear)`. **The code's TCO is undiscounted (fixed 5-year horizon,
> no r) and the stranding measure is a simple `iceUnits·icePrice·(1−evPct/100)·0.25` fleet write-down,
> not a loan-life-vs-parity calculation.** The `TCO_BASE` cost table is realistic; fleet instances are
> seeded. Documented below.

### 7.1 What the module computes

**(a) Segment TCO** (undiscounted, 5-year, per `TCO_BASE[seg]`):
```js
tcoBEV = base.bevPrice + (base.fuelBEV·5) + (base.maintBEV·5) − (base.bevPrice·base.residBEV)
tcoICE = base.icePrice + (base.fuelICE·5) + (base.maintICE·5) − (base.icePrice·base.residICE)
```
i.e. capex + 5×annual energy + 5×annual maintenance − residual (as a fraction of capex). Energy
sensitivities: `elecAdj = energyPx/0.28`, `fuelAdj = fuelPx/1.65` scale the fuel terms live.

**(b) Fleet stranding & capex**:
```js
iceUnits     = round(fleetSz·(1 − evPct/100))
strandedValue = iceUnits·base.icePrice·(1 − evPct/100)·0.25    // 25% write-down of residual ICE fleet
zevMandateGap = max(0, 80 − evPct)                             // % gap to a 2035 80% mandate
capexNeeded  = bevUnits·(base.bevPrice − base.icePrice)        // incremental fleet electrification cost
chargerInfra = round(bevUnits/4)                               // 1 charger per 4 BEVs
```

**(c) Charger economics** (hand-set table, not seeded):
```js
annRev  = c.sessions·365·c.revPerSess/1000       // £k/yr
payback = (c.capex / (annRev − c.opex)).toFixed(1)
```

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| `TCO_BASE` (6 segments) | e.g. Passenger Car: ICE £28k / BEV £38k, fuelICE 9.5 / fuelBEV 3.0, maintICE 5.0 / maintBEV 3.0, resid 0.45 / 0.38; HGV £120k/£200k; Bus £250k/£380k | **Realistic hand-set £k costs** — BEV capex premium, lower BEV energy/maint, lower BEV residual (all directionally correct per ICCT/BNEF) |
| Residual fractions | 0.28–0.50 | Editorial but plausible |
| Stranding write-down | 0.25 | Hard-coded haircut assumption |
| ZEV mandate target | 80% by 2035 | **Real** — UK ZEV Mandate trajectory reaches 80% cars by 2030 / 100% by 2035; EU 100% 2035 |
| `elecAdj` base 0.28 £/kWh, `fuelAdj` base 1.65 £/L | UK-representative energy prices |
| `charger table` (L2 £8k … HPC £150k, util 20–45%) | Hand-set realistic infrastructure economics |
| `BATTERY_CURVE` (12), `OEM_DATA` (11) | Battery cost decline + OEM EV-share/target data — illustrative |
| Fleet instances (`fleetSz`, `evPct`, `geo`) | seeded `sr()` |

### 7.3 Calculation walkthrough

1. Fleet generated with seeded size, EV%, geography.
2. `iceUnits`/`bevUnits` split by `evPct`; `capexNeeded` = incremental BEV cost × BEV units.
3. `strandedValue` = 25% write-down on the remaining ICE fleet's book value.
4. `zevMandateGap` = distance to the 80% mandate.
5. Segment TCO from `TCO_BASE` with live energy-price scaling; charger payback from the static table.

### 7.4 Worked example (Passenger Car, base energy prices)

| Step | Computation | Result (£k) |
|---|---|---|
| tcoBEV | 38 + 3.0·5 + 3.0·5 − 38·0.38 | 38 + 15 + 15 − 14.44 = **53.56** |
| tcoICE | 28 + 9.5·5 + 5.0·5 − 28·0.45 | 28 + 47.5 + 25 − 12.6 = **87.90** |
| TCO gap | tcoICE − tcoBEV | **£34.34k in favour of BEV** over 5 years |

Fleet of 1,000 at evPct = 30 (bevUnits = 300):
`capexNeeded = 300·(38−28) = £3,000k`; `strandedValue = 700·28·0.70·0.25 = £3,430k`;
`zevMandateGap = 80 − 30 = 50%`. The BEV TCO advantage (£34k/vehicle) is real arithmetic; the fleet
counts are seeded.

### 7.5 Data provenance & limitations

- **`TCO_BASE` is realistic and hand-set**; the 5-year TCO is genuine arithmetic (but **undiscounted**).
- **Fleet instances are synthetic** (`sr()`) — size, EV%, geography.
- **Stranding is a flat 25% haircut**, not the guide's `RemainingLoanLife − EVParityYear` loan-life
  measure; there is no auto-loan amortisation schedule.
- **No discounting / NPV** despite the guide's discounted formula; no explicit EV-parity-year solve.
- Insurance term in the guide formula is omitted from `TCO_BASE`.

**Framework alignment:** Cost structure aligns with **ICCT** and **BloombergNEF EV Outlook** TCO
methodology (BEV capex premium offset by lower energy/maintenance) and the **UK ZEV Mandate / EU 2035**
phase-out for the mandate gap. Auto-lender stranded-asset framing echoes **ECB** transition-risk-in-auto-
lending guidance, but the loan-book mechanics are simplified to a portfolio write-down.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Add discounting, an EV-parity-year solve, and a
loan-amortisation-based stranding measure.

**8.1 Purpose & scope.** Deliver a discounted EV-vs-ICE TCO, an EV-parity year per segment/market, and an
auto-loan-book ICE stranded-asset exposure by maturity — for OEM investors, fleet advisory, and auto
lenders.

**8.2 Conceptual approach.** Discounted lifecycle TCO (ICCT/BNEF) plus a structural stranding model:
loans whose remaining life extends beyond the market's EV-parity year face residual-value impairment, per
**ECB** auto-lending climate-risk work and **IPCC AR6 WGIII** transport transition pathways.

**8.3 Mathematical specification.**

```
TCO_v = Capex_v + Σ_t (Energy_{v,t}+Maint_{v,t}+Insurance_{v,t})/(1+r)^t − RV_v/(1+r)^T
EVParityYear_{seg,mkt} = min t : TCO_BEV(t) ≤ TCO_ICE(t)
ICE stranding (loan ℓ): impair_ℓ = Balance_ℓ · LGD · 1[RemainingLife_ℓ > EVParityYear]
Portfolio stranded = Σ_ℓ impair_ℓ   (bucketed by maturity year)
Charger IRR: solve Σ_t (Rev_t − Opex_t)/(1+IRR)^t = Capex_0
```

| Parameter | Source |
|---|---|
| Discount rate r | Lender WACC |
| Segment costs | ICCT / BNEF (extends `TCO_BASE`) |
| EV adoption / parity paths | IEA Global EV Outlook, BNEF |
| Residual-value decline for ICE | BNEF residual curves under transition |
| LGD | Auto-loan LGD (secured, ~30–45%) |

**8.4 Data requirements.** Auto-loan tape (balance, remaining life, collateral segment); segment TCO
inputs; EV-adoption curves by market; residual-value projections. Platform holds NGFS scenarios and
`GLOBAL_COMPANY_MASTER`; needs a loan tape for the stranding block.

**8.5 Validation & benchmarking plan.** Reconcile EV-parity years against BNEF/ICCT published parity;
backtest residual impairment against observed ICE resale declines; sensitivity of stranded exposure to
parity-year and LGD.

**8.6 Limitations & model risk.** EV-parity year is scenario-dependent — report a range. Residual-value
projections for both ICE and BEV are the dominant uncertainty. Conservative fallback: if parity year is
uncertain, use the earliest credible year (more conservative stranding).
