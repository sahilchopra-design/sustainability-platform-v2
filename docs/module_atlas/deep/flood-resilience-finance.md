## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives four formulae — an exceedance-probability AAL
> integral (`AAL = Σ P_exc × Loss_RP × dP`), a benefit-cost ratio (`BCR = PV_LossAvoided /
> (CapEx + PV_OpEx)`), an NbS BCR with ecosystem+carbon co-benefits, and an adaptation IRR. **None are
> computed.** `annualLoss`, `adaptCost` and `bcr` are **stored per city**, `exampleBCR` is **stored per
> intervention**, and the loss-return-period table is a static matrix. The page's only live maths is
> summing city AAL, averaging intervention BCR, and threshold-filtering interventions.

### 7.1 What the module computes

```js
totalAnnualLoss = Σ FLOOD_RISKS[c].annualLoss                    // $Bn, 10 cities
avgBCR          = Σ INTERVENTIONS[i].exampleBCR / n              // mean BCR
sortedCities    = [...FLOOD_RISKS].sort(desc by sortField)       // rank by loss/exposure/etc.
eligibleInterventions = INTERVENTIONS.filter(i =>
                    i.capexM ≤ capexBudget && i.exampleBCR ≥ bcrThreshold)   // BCR screener
```

The **BCR screener** (the interactive centrepiece) filters the 8 intervention types by a CapEx budget
slider and a BCR-threshold slider — this is genuine decision logic, but it operates on *stored* BCRs.

### 7.2 Parameterisation / scoring rubric

**City flood-risk table** (`FLOOD_RISKS`, 10 real cities — curated, realistic):

| City | Pop (M) | Flood exposure | Annual loss ($Bn) | Adapt cost ($Bn) | BCR | SLR (m) | Subsidence |
|---|---|---|---|---|---|---|---|
| Jakarta | 10.56 | 92 | 4.8 | 12.4 | 4.2 | 0.48 | 2.5 |
| Shanghai | 26.3 | 65 | 8.4 | 22.1 | 4.9 | 0.41 | 1.8 |
| New York | 8.3 | 48 | 6.8 | 18.6 | 5.6 | 0.44 | 0.3 |
| Rotterdam | 0.65 | 55 | 1.4 | 4.2 | 8.2 | 0.52 | 0.4 |
| Miami | 0.45 | 71 | 4.1 | 10.8 | 3.6 | 0.62 | 0.1 |

These are illustrative but plausible (Jakarta's high subsidence 2.5 cm/yr and SLR are real concerns;
Rotterdam's high BCR reflects mature Dutch flood defence). **Interventions** (`INTERVENTIONS`, 8 types)
carry CapEx, maintenance, life, 100-yr protection flag, NbS flag, and an example BCR — with Early
Warning Systems highest (12.8, low-cost/high-benefit) and Flood Insurance Pools lowest (3.4).

**Loss scenarios** (`LOSS_SCENARIOS`): a 5×3 matrix of return-period loss ($Bn) by RCP — e.g.
1-in-100yr flood: RCP2.6 $34.2Bn → RCP8.5 $88.4Bn (2.6× amplification). **AAL trend** (`AAL_TREND`,
10 yrs) is the only `sr()`-touched series: `baseline = 85 + i·2.8 + sr(i·11)·8` — a linear trend plus
±8 noise, with RCP4.5/8.5 steeper slopes (i·4.2 / i·7.4).

### 7.3 Calculation walkthrough

1. Sum city annual losses → dataset AAL headline.
2. Average intervention BCR.
3. Rank cities by the chosen `sortField`.
4. Screen interventions by budget + BCR sliders.
5. Plot loss-scenario matrix (RCP bars) and AAL trend (area chart).

### 7.4 Worked example (BCR screener)

Set `capexBudget = 200 ($M)`, `bcrThreshold = 4.0`. The 8 interventions filter to those with
`capexM ≤ 200 AND exampleBCR ≥ 4.0`:
- Urban Green Infrastructure (120, 4.8) ✓
- Wetland Restoration NbS (65, 7.6) ✓
- Early Warning Systems (18, 12.8) ✓
- Storm Water Retention (95, 5.9) ✓
- Managed Retreat (280) ✗ (over budget), Coastal Barriers (850) ✗, Levees (450) ✗, Insurance Pools
  (40, 3.4) ✗ (below BCR threshold).

So a $200M budget with a 4× BCR hurdle selects the four low-CapEx / high-benefit options, three of
them nature-based — the "NbS wins at low budgets" narrative. The BCRs themselves are stored inputs,
not computed from loss-avoided.

### 7.5 Data provenance & limitations

- **City AAL, adaptation cost and BCR are stored constants** (realistic, curated), not computed from
  the exceedance-probability integral the guide describes.
- Intervention BCRs are stored `exampleBCR`, not `PV(loss avoided)/(CapEx+PV OpEx)`.
- Only the AAL trend uses `sr()` (small ±8 noise on a linear trend).
- Finance-structure amounts and the global headline figures ($280Bn loss, $194Bn UNEP gap) are
  citations/placeholders.

**Framework alignment (named, mostly not computed):** catastrophe-modelling AAL (loss-exceedance curve
integral) · benefit-cost analysis for adaptation (World Bank / GCA methodology) · IPCC RCP scenarios
(the loss matrix) · UNEP Adaptation Gap Report (the $194Bn/yr figure) · nature-based-solutions valuation
(NbS BCR with ecosystem + carbon co-benefits). The city SLR/subsidence figures echo IPCC AR6 and
InSAR-based subsidence studies.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** AAL and BCR are stored, not derived. Below is
the production flood-loss + adaptation-economics model.

### 8.1 Purpose & scope
Compute per-city annual average loss from a flood loss-exceedance curve under climate scenarios, and
rank adaptation interventions by benefit-cost ratio and IRR (including NbS co-benefits) — for
adaptation-finance allocation.

### 8.2 Conceptual approach
A **catastrophe-model AAL** (hazard × exposure × vulnerability) benchmarked against **Swiss Re / Munich
Re flood models** and the **World Resources Institute Aqueduct Floods** tool, plus an **adaptation BCA**
following **GCA / World Bank** guidance where benefit = discounted avoided loss + monetised co-benefits.

### 8.3 Mathematical specification
```
Loss(RP) = ExposedValue · DamageRatio(depth(RP)) · (1 − protectionEffectiveness)
AAL      = ∫₀¹ Loss(p) dp ≈ Σ_k ½·(Loss_k + Loss_{k+1})·(p_k − p_{k+1})   trapezoidal over RPs
BCR      = PV_LossAvoided / (CapEx + PV_OpEx)
   PV_LossAvoided = Σ_t (AAL_noAdapt,t − AAL_adapt,t) / (1+r)^t
NbS_BCR  = (PV_LossAvoided + PV_EcoServices + PV_CarbonValue) / TotalCost
IRR: solve Σ_t (Benefit_t − Cost_t)/(1+IRR)^t = 0
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| DamageRatio(depth) | depth-damage function | JRC global flood depth-damage curves |
| depth(RP) | flood depth by return period | Aqueduct Floods / GLOFRIS hazard maps |
| ExposedValue | assets in floodplain | national asset registers / LitPop |
| protectionEffectiveness | intervention risk reduction | engineering design standards |
| EcoServices, CarbonValue | NbS co-benefits | TEEB / social cost of carbon |
| r | social discount rate | 3–7% (Stern/Nordhaus range) |

### 8.4 Data requirements
Per city: flood hazard maps by RP and RCP, exposed asset value, depth-damage curves, current protection
standard. Per intervention: CapEx, OpEx, life, risk-reduction, co-benefit quantities. Sources: WRI
Aqueduct (public), JRC depth-damage (public), EM-DAT for validation, GCA cost data.

### 8.5 Validation & benchmarking plan
Reconcile AAL against Swiss Re / Munich Re city flood-loss estimates and historical EM-DAT losses
(target same order); backtest avoided-loss against observed post-defence loss reductions (e.g. Thames
Barrier); sensitivity-test discount rate and damage curves; validate NbS co-benefit values.

### 8.6 Limitations & model risk
Depth-damage curves are region-generic; hazard maps omit compound (pluvial+coastal) events; NbS benefits
are uncertain and slow to accrue. Conservative fallback: report AAL as a range across RCP scenarios and
exclude co-benefits from the core BCR (report NbS_BCR as upside).
