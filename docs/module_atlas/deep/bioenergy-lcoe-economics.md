## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is one of the more genuinely quantitative pages: `calcBioenergyLcoe` is a real
annuitised LCOE decomposition, and `irr` a correct Newton-Raphson solver.

```js
annMwh        = powerMw × (cf/100) × 8760
capexTotal    = capexMwh × powerMw × 1000
annuity       = w / (1 − (1+w)^-lifetime)          // capital recovery factor, w = wacc/100
capexAnn      = capexTotal × annuity
opexAnn       = opexMwyr × powerMw × 1000
feedstockGjMwh = heatRate / (efficiency/100)        // GJ feedstock per MWh
feedstockAnn  = annMwh × feedstockGjMwh × feedstockUsd / 1000
lcoe          = (capexAnn + opexAnn + feedstockAnn) / annMwh          // $/MWh
feedstockShare = feedstockAnn / (capexAnn + opexAnn + feedstockAnn)
```

A carbon-credit overlay reduces the effective LCOE:
`annCreds = annMwh×1000 × (fossilBaseline − bioEmissions)/1000`,
`adjustedLcoe = lcoe − annCreds×carbonPrice/annMwh`.

### 7.2 Parameterisation / technology table

`TECH_TYPES` (8 rows) carry real bioenergy techno-economics (CAPEX $/MWh capacity,
fixed OPEX $/MW-yr, capacity factor %, efficiency %, life, feedstock $/t, heat rate
GJ/MWh):

| Technology | CAPEX $/MWh | CF % | Eff % | Feedstock $/t | Heat rate |
|---|---|---|---|---|---|
| Dedicated biomass | 3,800 | 85 | 28 | 42 | 12.2 |
| Coal co-firing (20%) | 480 | 72 | 38 | 38 | 9.0 |
| Biomass CHP | 4,200 | 82 | 82 | 45 | 4.4 |
| Biogas power (AD) | 2,800 | 90 | 40 | 28 | 9.0 |
| Biomethane | 1,800 | 92 | 65 | 30 | 5.5 |
| Advanced biofuel | 5,200 | 88 | 45 | 85 | 8.0 |
| SAF (HEFA/AtJ/FT) | 7,800 | 90 | 55 | 120 | 6.5 |

`FEEDSTOCK_TYPES` (7) hold cost $/t (including **negative** gate fees for MSW −15,
organic waste −25), energy GJ/t, land-use ha/GJ, water m³/GJ and lifecycle CO₂ kg/GJ.
`LCOE_COMPARISON` benchmarks against solar PV ($38), onshore wind ($45), CCGT ($68).
`POLICY_SUPPORT` (6 countries) and `SUSTAINABILITY_CRITERIA` (RED III ≥65% GHG,
no-deforestation, water, biodiversity, food-vs-fuel weights 30/25/15/20/10) are
descriptive tables, **not wired** into LCOE.

### 7.3 Calculation walkthrough

1. Select technology → its parameter row; feedstock-cost slider (`feedstockAdj`)
   perturbs `feedstockUsd`.
2. `calcBioenergyLcoe` returns the three annual cost buckets, LCOE, feedstock share
   and annual GWh.
3. Carbon-credit tab converts avoided fossil emissions to credits and nets them off.
4. IRR tab builds `[−capexTotal, ...life × (revenue − opex)]` and solves.
5. Sensitivity fans WACC ±2%; a learning-curve and carbon-intensity chart complete
   the view.

### 7.4 Worked example

Biomass CHP, `powerMw = 50`, WACC 8%, feedstock $45/t:

| Step | Computation | Result |
|---|---|---|
| Annual MWh | 50 × 0.82 × 8760 | 359,160 MWh |
| CAPEX total | 4,200 × 50 × 1000 | $210M |
| Annuity (8%, 25y) | 0.08/(1−1.08⁻²⁵) | 0.09368 |
| CAPEX annual | 210M × 0.09368 | $19.67M |
| OPEX annual | 105 × 50 × 1000 | $5.25M |
| Feedstock GJ/MWh | 4.4 / 0.82 | 5.37 GJ/MWh |
| Feedstock annual | 359,160 × 5.37 × 45/1000 | $86.8M |
| LCOE | (19.67+5.25+86.8)M / 359,160 | **≈$311/MWh** |

The CHP heat-rate/efficiency combination makes feedstock ~78% of LCOE — matching the
guide's message that feedstock cost is the dominant, most volatile driver. (Note the
model prices *all* thermal fuel to electricity output, so CHP looks expensive on a
power-only LCOE unless heat credit is applied.)

### 7.5 Data provenance & limitations

- The LCOE and IRR maths are **real** and correct; `TECH_TYPES`/`FEEDSTOCK_TYPES`
  values are plausible IRENA/IEA-consistent benchmarks (hard-coded, not seeded — the
  `sr()` present is used only for minor chart jitter).
- **RED II/III GHG saving is not computed** — the guide's "74% GHG saving" data point
  has no implementation; `SUSTAINABILITY_CRITERIA` only *display* the thresholds.
- CHP heat output is not credited, so its LCOE is overstated on a power-only basis.
- Carbon-credit netting uses a flat fossil baseline minus bio emissions with no
  lifecycle (upstream feedstock) accounting.

**Framework alignment:** IRENA Renewable Power Generation Costs (LCOE annuity
decomposition) · IEA WEO bioenergy · EU RED III sustainability & GHG-saving criteria
(displayed, not calculated) · IRA §45/§45Q and EU ETS carbon pricing (in the policy
table and the credit overlay).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (LCOE is real; this spec
covers the missing RED III GHG-saving / lifecycle-emissions model behind the "74%"
claim.)

**8.1 Purpose & scope.** Compute the certified lifecycle GHG saving of a bioenergy
pathway versus the fossil comparator, determining RED III subsidy eligibility and
the true carbon intensity used in the LCOE credit overlay.

**8.2 Conceptual approach.** Implement the **EU RED III Annex VI** actual-value GHG
methodology (the legal standard) with **GREET/BioGrace** emission factors,
benchmarked against **EPA RFS** and **ISCC/RSB** certified pathway defaults.

**8.3 Mathematical specification.**
```
E = e_ec + e_l + e_p + e_td + e_u − e_sca − e_ccs − e_ccr        (gCO₂e/MJ)
  e_ec cultivation, e_l land-use-change (annualised over 20y), e_p processing,
  e_td transport, e_u use; e_sca soil-carbon accumulation, e_ccs capture, e_ccr replacement
GHG_saving% = (E_fossil − E) / E_fossil × 100      E_fossil = 94 gCO₂e/MJ (electricity comparator)
Eligible = GHG_saving% ≥ threshold (65% existing / 70–80% new plants)
CI_bio (for credit overlay) = E · conversion to kgCO₂/MWh
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Cultivation EF | e_ec | GREET / BioGrace / RED III defaults |
| iLUC / dLUC | e_l | RED III Annex VIII; GLOBIOM iLUC values |
| Fossil comparator | E_fossil | RED III (94 gCO₂e/MJ elec; 183 heat) |
| Soil carbon | e_sca | IPCC Tier-1/2 SOC change |

**8.4 Data requirements.** Feedstock type & origin, cultivation inputs, transport
distances, conversion efficiency, land-use history, any CCS. Platform holds
feedstock CO₂ kg/GJ and technology efficiency; the Annex-VI term structure and iLUC
factors are new.

**8.5 Validation & benchmarking.** Reconcile pathway CI against BioGrace tool and
certified ISCC/RSB pathway values (±5%); verify the 65/70/80% eligibility gates
reproduce RED III worked examples; cross-check the resulting CI feeds the LCOE credit
overlay consistently.

**8.6 Limitations & model risk.** iLUC is highly uncertain and politically contested;
soil-carbon credits are site-specific; upstream methane leakage for biogas can flip
the saving. Conservative fallback: use RED III conservative default values and
exclude soil-carbon credit unless independently verified.
