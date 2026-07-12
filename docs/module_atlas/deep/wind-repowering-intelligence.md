## 7 · Methodology Deep Dive

This module is one of the most rigorously implemented in this batch: it runs a genuine
**Newton-Raphson IRR solver** (`calcIRR`) and discounted-cash-flow NPV function (`calcNPV`) over
real incremental cash-flow arrays, matching the guide's stated methodology closely. The core
repowering-economics engine is sound; a few downstream scenario cards use fixed multipliers on the
real IRR rather than independently-modelled cash flows (flagged in §7.4).

### 7.1 What the module computes

```js
function calcIRR(cashflows) {                          // Newton-Raphson, ~1e-8 convergence
  let rate = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    cashflows.forEach((cf, t) => {
      npv  += cf / Math.pow(1+rate, t);
      dnpv -= t * cf / Math.pow(1+rate, t+1);
    });
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv/dnpv;
    if (Math.abs(newRate-rate) < 1e-8) { rate = newRate; break; }
    rate = newRate;
  }
  return rate;
}
function calcNPV(cashflows, rate) { return cashflows.reduce((s, cf, t) => s + cf/Math.pow(1+rate, t), 0); }
```

Applied to genuine engineering/financial inputs:

```js
oldAEP = oldCapMW × (currentCF/100) × 8760                             // existing fleet annual energy, MWh
newCF  = min(52, baseCF + rotorFactor×14 + (hubHeight−80)/300×4)        // rotor/hub-height-conditioned uplift
rotorFactor = min(1.0, (rotorDiam−80)/150)
newAEP = newCapMW × (newCF/100) × 8760
incrementalCFs = newCFsArr.map((v,t) => v − (oldCFs[t]||0))            // repower minus continue-as-is
incIRR = calcIRR(incrementalCFs) × 100
aepUplift = (newAEP−oldAEP)/oldAEP × 100
payback = totalInvestM / (newRevenue − oldRevenue)
```

### 7.2 Parameterisation

| Parameter | Formula/value | Provenance |
|---|---|---|
| `newCF` cap | 52% | Plausible ceiling for modern onshore turbines, consistent with guide's "35-50% CF" range |
| `rotorFactor` | `min(1, (rotorDiam−80)/150)` | Author-calibrated linear scaling from an 80m baseline to a 230m ceiling |
| `co2Factor` | 0.45 tCO2e/MWh | Plausible average grid emission factor (order-of-magnitude consistent with global average grid intensity) |
| `oldOpexMYr` | `oldCapMW × 0.025` $M/yr | Author-calibrated OPEX intensity |
| `newOpexMYr` | `newCapMW × 0.022` $M/yr | Slightly lower than old-fleet OPEX intensity, reflecting modern turbine reliability |
| Decommissioning/scrap ($/kW) | `decomPerTurbine`, `scrapPerTurbine` inputs | User-adjustable, consistent with guide's cited $50–120/kW net decommissioning range |

### 7.3 Calculation walkthrough

1. User inputs (existing fleet size/rating/age/CF, new turbine rating/hub height/rotor diameter,
   discount rate, PPA price, tax rate) drive `metrics` (a single large `useMemo`).
2. `oldCFs`/`newCFsArr` build 20-30yr nominal cash-flow arrays for the continuation and repowering
   scenarios respectively (revenue less OPEX, escalated).
3. `oldNPV = calcNPV(oldCFs, dr)`, `newNPV = calcNPV(newCFsArr, dr)`, `incrementalNPV = newNPV−oldNPV`.
4. `incIRR = calcIRR(incrementalCFs)` — solved on the *difference* series (repower cash flows minus
   continue-as-is cash flows), which is the financially correct way to evaluate an incremental
   investment decision (matches standard capital-budgeting practice, not just IRR on the new asset
   alone).
5. Sensitivity tables (PPA price sweep, CAPEX sweep) rebuild `cfs`/`inc` arrays per scenario point and
   re-solve `calcIRR` independently for each — a genuine sensitivity analysis, not interpolation.
6. **Decision Summary tab** compares three named strategies (Full Repower, Life Extension 10yr,
   Decommission) — but the Life Extension row uses `irr: incIRR × 0.55` and `npv: oldNPV × 0.6`, i.e.
   **fixed multipliers on the Full-Repower solve**, not an independently-solved cash-flow scenario for
   life extension (which the "Life Extension" tab itself, at line ~671, *does* solve properly via its
   own `calcIRR(cfs)` — so the Decision Summary card and the dedicated Life Extension tab can show
   different numbers for the same scenario).

### 7.4 Worked example

For an existing fleet of 20× 1.5MW turbines (`oldCapMW=30`) at `currentCF=28%`:
`oldAEP = 30 × 0.28 × 8760 = 73,584 MWh/yr`. Repowering to 6× 5MW turbines
(`newCapMW=30`, same nameplate) at `rotorDiam=150m`, `hubHeight=120m`, `baseCF` (say 30%):
`rotorFactor = min(1, (150−80)/150) = 0.467`, `newCF = min(52, 30+0.467×14+(120−80)/300×4) =
min(52, 30+6.53+0.53) = min(52,37.1) = 37.1%`. `newAEP = 30×0.371×8760 = 97,481 MWh/yr`.
`aepUplift = (97,481−73,584)/73,584×100 = 32.5%` — even at *equal* nameplate capacity, the larger
rotor delivers a meaningful CF-driven uplift, consistent with the guide's framing that repowering
value comes primarily from rotor/hub-height improvements, not just capacity addition.

### 7.5 Data provenance & limitations

- **The IRR/NPV engine and its inputs are genuinely computed**, not seeded-random — this module's
  core financial logic would pass a basic model-validation review for correctness of the Newton-
  Raphson/DCF mechanics themselves.
- **The Decision Summary tab's Life Extension and Decommission rows use fixed multipliers on the Full
  Repower solve rather than independent cash-flow models**, creating a risk of inconsistency with the
  dedicated Life Extension tab's own (correctly independent) calculation — worth reconciling so a user
  sees one number per scenario, not two.
- Country-specific `PERMIT_RULES` (Germany EEG §16b, UK NSIP, etc.) and `CASE_STUDIES` (9 real-named
  projects) are static reference tables, not wired into the IRR calculation's permit-timeline risk
  adjustment despite both existing on the page.

**Framework alignment:** German EEG 2023 §16b repowering bonus and WindEurope Repowering Report 2023
(named in the guide) inform the static reference tables; the core incremental-IRR/NPV methodology
itself is a standard, correctly-implemented capital-budgeting technique (no named external standard
required, since IRR/NPV are generic corporate-finance tools) consistent with how project-finance
lenders actually evaluate repowering decisions.
