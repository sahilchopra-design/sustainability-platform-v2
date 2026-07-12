## 7 · Methodology Deep Dive

This is another **AdvisoryToolkit-family** tool (shared `_shared/AdvisoryReference.js` data layer, no
backend engine) and one of the stronger modules in this batch — genuine multi-hazard weighted risk
scoring, transition-risk elasticity, DSCR stress testing, adaptation ROI, Monte Carlo, and tornado
sensitivity, all wired to real reference data (Indian state hazard baselines cited to IMD/WRI
Aqueduct/IPCC AR6, IFRS S2 paragraph-numbered checklist, NGFS carbon-price paths). The one
methodology gap: the guide's formula is `ORR = max(chronic_risk, acute_risk) × exposure_weight ×
financial_sensitivity` — a **max-of-two-channels** design — but the code computes a single
**weighted sum across five hazards** (mixing chronic and acute together) with no explicit
chronic/acute split or max operator.

### 7.1 What the module computes

For a configurable renewable-energy portfolio (default: 8 assets across Indian states + one Oman
hub), the tool computes a physical-risk-at-risk (RaR) % of EBITDA per asset, blends it with a
transition-risk EBITDA impact from a carbon-price path, stress-tests debt service coverage (DSCR),
and models adaptation-investment ROI, opportunity NPV uplift, Monte Carlo loss distribution, and
IFRS S2 disclosure-readiness.

### 7.2 Core physical-risk formula (RaR)

```js
RaR(asset, ssp, year) = min(40, 0.6 × (heat×1.2 + water×1.5 + cyclone×2.0 + flood×1.8 + dust×0.8) × SSP_MULT[ssp][year])
```

Five hazard scores (0–10 scale, from `IN_HAZARD_BASELINE`, sourced to IMD/WRI Aqueduct/IPCC AR6
regional chapters) are weighted (cyclone highest at 2.0×, dust lowest at 0.8×, reflecting relative
acute-event severity), summed, scaled by 0.6, multiplied by an SSP/year-specific escalation factor,
and capped at 40% of EBITDA — a sensible ceiling preventing runaway extrapolation. This **is** the
guide's "exposure_weight" concept in spirit (per-hazard weights standing in for exposure), but it
combines chronic hazards (heat, water stress, dust) and acute hazards (cyclone, flood) into one
additive sum rather than computing separate chronic/acute channels and taking their `max` as the
guide specifies — a methodologically defensible alternative (aggregate hazard exposure), but a
different number than a max-of-two-channels ORR would produce, since summing rather than taking the
max of comparable-magnitude terms will generally yield a *higher* combined score.

### 7.3 SSP-scenario scaling

| SSP scenario | 2030 | 2040 | 2050 | 2070 |
|---|---|---|---|---|
| SSP1-2.6 | 1.00 | 1.10 | 1.15 | 1.20 |
| SSP2-4.5 | 1.10 | 1.30 | 1.55 | 1.90 |
| SSP3-7.0 | 1.15 | 1.45 | 1.85 | 2.45 |
| SSP5-8.5 | 1.20 | 1.60 | 2.20 | 3.10 |

A genuine escalation table — multipliers increase with both SSP severity and time horizon, correctly
ordered (SSP5-8.5/2070 is the most severe cell at 3.10×). Provenance for the exact multiplier values
is not cited beyond "IPCC AR6 regional chapters" in the surrounding comments — treat as an
internally-calibrated escalation curve consistent with, but not literally reproducing, a specific
IPCC table.

### 7.4 Transition-risk formula

```js
transitionImpactPct(sector, price, intensity) = elasticity[sector] × (price/100) × intensity × 100
```

`elasticity` (EBITDA sensitivity per $100/t carbon price) is sector-specific and directionally
correct: Oil & Gas upstream most negative (-0.35), Steel (-0.28) and Cement (-0.22) next (both
carbon-intensive hard-to-abate sectors), Utilities-Renewables **positive** (+0.04, renewables
*benefit* from rising carbon prices as fossil competitors get more expensive), Real Estate/Banks
least sensitive. `intensity` is a 0–2 multiplier around sector-average (1.0). `price` comes from one
of 6 real NGFS/IEA carbon-price scenario paths (`CARBON_PRICE_PATHS`, e.g. NGFS Orderly 1.5°C:
$80→$400/t 2025→2050).

### 7.5 Combined loss, DSCR stress test, and adaptation ROI

```js
combinedLossPct = portRar + max(0, −transPct)            // physical loss + transition loss (transition gains don't offset)
dscrBase   = ebitda / debtSvc
dscrStress = max(0, ebitda − combinedLoss$) / debtSvc      // post-shock DSCR
dscrAdapt  = max(0, ebitda − rarAfter$ − adaptOpex + min(0,transDollar) + oppUplift) / debtSvc

avoidedLoss15yr = (rarDollar − rarDollarAfter) × 15         // 15-year NPV-free avoided-loss horizon
roi = (avoidedLoss15yr − adaptOpex×15) / adaptCapex
```

The DSCR stress test is a genuine lender-relevant metric: `combinedLossPct` deliberately only
subtracts transition **losses** (`max(0,−transPct)`), not gains — a conservative modelling choice
that avoids transition upside masking physical-risk downside in a stress scenario. `dscrAdapt` layers
in adaptation opex cost, any transition-gain benefit, and opportunity NPV uplift to show the
post-adaptation, post-opportunity DSCR — a coherent three-scenario waterfall (base → stress →
adapted). The 15-year avoided-loss ROI is undiscounted (no `(1+r)^t` term), a simplification worth
flagging for a lender-facing deliverable.

### 7.6 Monte Carlo and tornado

```js
MC: physLoss = portRar × rarMult × (1−benefit/100);  trans = elasticity×(carbonPrice×priceMult/100)×intensity×100
    loss$ = (physLoss + max(0,−trans)) × ebitda/100
    rarMult ~ Tri(0.75,1.00,1.35);  benefit ~ Tri(benefit−15, benefit, benefit+15);  priceMult ~ Tri(0.6,1.0,1.6)
```

A genuine triangular-distribution Monte Carlo (default 800 draws) varying hazard-multiplier,
adaptation-benefit uncertainty, and carbon-price-path uncertainty simultaneously — a real 3-factor
joint simulation, not a decorative label. The tornado sensitivity (`torn`) perturbs `rar`, `price`,
`elast`, `intensity`, `benefit` each ±20% one-at-a-time against the same combined-loss function,
correctly isolating each driver's individual contribution to output variance.

### 7.7 Worked example

Asset 'Rajasthan 50 MW' (state RJ: heat=8, water=9, cyclone=1, flood=2, dust=8), `ssp='SSP2-4.5'`,
`horizon=2040` (`SSP_MULT=1.30`): weighted hazard sum `= 8×1.2+9×1.5+1×2.0+2×1.8+8×0.8 = 9.6+13.5+2.0
+3.6+6.4 = 35.1`. `RaR = min(40, 0.6×35.1×1.30) = min(40, 27.4) = 27.4%` of EBITDA. At
`sector='Utilities — Power (renewables)'` (elasticity +0.04), `pricePath='NGFS Orderly (1.5°C)'` at
2040 (`price=$280/t`), `intensity=1.0`: `transPct = 0.04×(280/100)×1.0×100 = 0.04×2.8×100 = 11.2%` —
a **positive** 11.2% EBITDA gain from the transition (renewables benefiting from rising carbon
prices). `combinedLossPct = 27.4 + max(0,−11.2) = 27.4+0 = 27.4%` (the transition gain doesn't reduce
physical loss under the conservative combining rule). At `ebitda=$1,200M`: `combinedDollar =
1200×0.274 = $328.8M`. `dscrBase = 1200/420 = 2.86×`; `dscrStress = max(0,1200−328.8)/420 =
871.2/420 = 2.07×` — still comfortably above a typical 1.2× covenant, illustrating that even a
severe physical-risk scenario doesn't breach debt service coverage for this well-capitalised
portfolio, though the ~0.8x DSCR compression itself is material information for a lender.

### 7.8 Data provenance & limitations

- Indian state hazard baselines (`IN_HAZARD_BASELINE`) are cited to IMD, WRI Aqueduct, and IPCC AR6
  regional chapters — genuinely sourced reference data, not `sr()`-seeded.
- SSP escalation multipliers and the RaR weight vector (cyclone 2.0×, dust 0.8×, etc.) are internally
  calibrated, not directly reproducing a single external table — reasonable but not independently
  verifiable against one citation.
- Adaptation ROI is undiscounted over a flat 15-year horizon — a production credit-risk tool should
  discount avoided losses at the portfolio's WACC or lender's hurdle rate.
- The combined-loss formula's chronic/acute conflation (§7.2) means this module's "ORR" is not
  literally the guide's max-of-two-channels design — document this distinction if reconciling against
  a max-based benchmark model.

**Framework alignment:** TCFD Technical Supplement (Physical Risks, 2017) — asset-level exposure ×
financial-sensitivity framing is followed, though via weighted-sum rather than max(chronic,acute).
IFRS S2 — the 11-item checklist uses **real IFRS S2 paragraph numbers** (¶6a/6b Governance, ¶10/13/14/
22 Strategy, ¶25 Risk Management, ¶29a-d/33 Metrics & Targets), giving `checklistPct` genuine
regulatory-mapping value. NGFS — 6 real NGFS/IEA carbon-price scenario paths and the SSP framework are
correctly represented as scenario inputs.
