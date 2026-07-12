## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (EP-EG4) and the code broadly agree: this module models low-carbon cement
economics via a per-technology levelised cost of product (`lcop`, $/t), an LCA carbon split, and a
break-even carbon price. The guide's headline `LCOP = Energy + Raw_material + CAPEX·CRF + CO₂_cost −
Green_premium` is not assembled from components in code — instead each technology carries a **seeded
`lcop` anchor** perturbed per project — but the technology carbon intensities and the break-even logic are
real and coherent. No hard mismatch; §8 specifies the component-built LCOP the guide describes.

### 7.1 What the module computes

The `TECHNOLOGIES` table (8 pathways) carries carbon intensity `ci` (tCO₂/t), a levelised cost anchor
`lcop`, capex, maturity and abatement. Projects perturb the anchor and add returns:
```js
lcop     = tech.lcop · (0.9 + sr(i·19+5)·0.25)      // ±per-project cost variation
irr      = 5 + sr(i·23+6)·10                          // 5–15% equity IRR
avgLcop  = mean(lcop | filtered)
avgCi    = mean(ci | filtered)
breakeven = tech.lcop > 85 ? ⌊(tech.lcop − 85) / (0.82 − tech.ci)⌋ : 0   // $/tCO₂ break-even price
```
Abatement progress projects three levers to 2050:
```js
eff = base · (1 − (yr−2025)·0.008)                   // efficiency: −0.8%/yr
ccs = base · (yr≥2030 ? (yr−2025)·0.018 : 0)         // CCS ramps from 2030 at 1.8%/yr
lc3 = base · (yr≥2026 ? (yr−2025)·0.012 : 0)         // LC³ ramps from 2026 at 1.2%/yr
```

### 7.2 Parameterisation / provenance

| Element | Value/rule | Provenance |
|---|---|---|
| `TECHNOLOGIES.ci` | per-pathway tCO₂/t (e.g. OPC ~0.82, CCS/LEILAC/geopolymer far lower) | IEA/GCCA cement roadmap (guide-cited) |
| Conventional OPC intensity | ~0.82 tCO₂/t (baseline in `breakeven`) | GCCA Concrete Future |
| Calcination CO₂ | 0.55 tCO₂/t clinker (process-inherent) | IEA/GCCA — irreducible without CCS/SCM |
| Thermal CO₂ | ~0.10 tCO₂/t (fuel-addressable) | IEA cement roadmap |
| `lcop` anchor | per tech, ×`(0.9+sr·0.25)` per project | anchors plausible; project variation synthetic |
| `irr` | `5 + sr·10` | synthetic demo value |
| Break-even threshold | reference LCOP $85/t | code constant (conventional cement cost proxy) |
| Ramp rates (0.8/1.8/1.2 %/yr) | efficiency/CCS/LC³ | synthetic deployment assumptions |

### 7.3 Calculation walkthrough

`selTech` filter → `filtered` projects → `avgLcop`, `avgCi` KPIs. `lcaComparison` and `carbonValueChart`
map over `TECHNOLOGIES`. The **break-even carbon price** answers: at what $/tCO₂ does a low-carbon
technology's cost premium over the $85/t conventional cost equal the value of its avoided emissions?
`breakeven = (tech.lcop − 85) / (0.82 − tech.ci)` — numerator = cost premium ($/t product), denominator =
carbon abated per tonne (baseline 0.82 − tech `ci`), so the ratio is $/tCO₂.

### 7.4 Worked example

Technology with `lcop = $110/t`, `ci = 0.30 tCO₂/t`:
`breakeven = (110 − 85) / (0.82 − 0.30) = 25 / 0.52 = ⌊48⌋ = $48/tCO₂`. Interpretation: once a carbon
price exceeds ~$48/t, this pathway's higher production cost is offset by the value of the 0.52 tCO₂/t it
abates versus OPC — below EU ETS levels (~€80–90/t), so already viable there; above voluntary-market
prices. A technology with `lcop ≤ 85` returns `breakeven = 0` (already at or below conventional cost).

### 7.5 Data provenance & limitations

- Technology carbon intensities and the calcination/thermal split are **real and standard** (IEA/GCCA);
  the LCA waterfall is faithful to the process chemistry.
- Project-level `lcop` variation and `irr` are **synthetic** (seeded `sr()`).
- Break-even uses a single fixed conventional-cost reference ($85/t) and baseline intensity (0.82) for all
  technologies — no regional cost/fuel variation, no CAPEX-CRF decomposition.
- Abatement ramp rates are illustrative linear assumptions, not scenario-calibrated.

**Framework alignment:** IEA *Cement Technology Roadmap* and GCCA *Concrete Future: Roadmap to Net Zero*
(intensities, levers, calcination/thermal split); EU ETS embedded-carbon data and CBAM (the carbon-price
context the break-even speaks to); LEILAC-2 (Horizon 2020) and IIT-Delhi LC³ research (technology anchors).
The calcination CO₂ (0.55 tCO₂/t) as an irreducible-without-CCS stream is a correct, load-bearing fact.

## 8 · Model Specification — Component-Built Cement LCOP & Abatement-Cost Model

**Status: specification — not yet implemented in code.** The guide's decomposed LCOP is not assembled in
code; below is the production build.

### 8.1 Purpose & scope
Compute a fully-decomposed levelised cost of cement ($/t) and marginal abatement cost ($/tCO₂) for each
decarbonisation pathway, to rank technologies and size the carbon price / green premium needed for FID.

### 8.2 Conceptual approach
Bottom-up LCOP mirroring the **IEA cement roadmap cost model** and **GCCA** techno-economics, with a
CAPEX capital-recovery-factor term (as in energy LCOE/LCOH models) and an explicit CO₂-cost term keyed to
the calcination/thermal split. Marginal abatement cost then follows the McKinsey/IEA MAC-curve convention.

### 8.3 Mathematical specification
```
CRF = wacc·(1+wacc)^n / ((1+wacc)^n − 1)
LCOP = (Energy_cost + Raw_material + CAPEX·CRF/AnnualOutput + FixedOM)
       + CO₂_cost·(CI_calc + CI_thermal_residual) − GreenPremium
where CI_calc = 0.55·(1 − capture_rate), CI_thermal_residual = 0.10·(1 − fuel_switch − electrify)
Abatement cost:  MAC = (LCOP_tech − LCOP_OPC) / (CI_OPC − CI_tech)      ($/tCO₂)
Break-even carbon price = MAC (price at which tech LCOP = OPC LCOP incl. carbon cost)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `CI_calc, CI_thermal` | 0.55 / 0.10 tCO₂/t | IEA/GCCA roadmap |
| `capture_rate` | CCS/LEILAC efficiency | LEILAC-2, capture pilot data |
| CAPEX, `wacc`, `n` | plant cost, cost of capital, life | GCCA innovation fund / project data |
| Energy, raw-material cost | $/t | IEA / regional input prices |
| `GreenPremium` | low-carbon cement price uplift | green procurement / offtake surveys |

### 8.4 Data requirements
Per pathway: clinker factor, capture rate, fuel mix, CAPEX/OPEX, output, WACC. Carbon price (EU ETS/CBAM).
Green-premium offtake data. The module holds `ci`, `lcop`, `capex`, `abatement` anchors — expand into the
component structure and source input prices.

### 8.5 Validation & benchmarking plan
Reconcile LCOP against IEA roadmap and published plant techno-economics; validate MAC ordering against
GCCA/McKinsey cement MAC curves; sensitivity to carbon price, fuel cost and CAPEX; cross-check CBAM
exposure against EU ETS embedded-carbon benchmarks.

### 8.6 Limitations & model risk
LCOP is highly sensitive to energy price and CAPEX, which vary regionally and over time. Green premium is
market-dependent and thin. CCS assumes CO₂ transport/storage availability. Conservative fallback: report
break-even carbon price as a range across fuel/CAPEX scenarios.
