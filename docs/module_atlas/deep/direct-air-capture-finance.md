## 7 · Methodology Deep Dive

This module implements its guide's **DAC LCOC (levelised cost of carbon removal) model** with real
technology parameters, electricity-price sensitivity, learning curves, and an offtake revenue
calculator. The core cost mechanics are genuine deterministic functions over curated tech data; only
the 18-project pipeline attributes are `sr()`-seeded around real tech baselines. No ⚠️ mismatch.

### 7.1 What the module computes

```js
// Electricity-price sensitivity of LCOC ($/tCO₂):
lcocByElec[tech] = baseLCOC + (elecPrice − 40) × tech.elec × 8
// Learning curve (annual cost decline):
learningCurve[year i] = round(baseLCOC × learningRate^i)   // Solid 0.85, Liquid 0.87, ESDA 0.88
// Offtake revenue calculator:
creditsPerYear = scale × 1000                              // tCO₂/yr
creditRevenue  = creditsPerYear × creditPrice / 1e6        // $M
elecCost       = creditsPerYear × tech.elec × elecPrice / 1e6
margin         = creditsPerYear × (creditPrice − tech.elec·elecPrice − 200) / 1e6
```

The `−200` in the margin is a fixed non-electricity cost proxy ($/tCO₂ for CAPEX-CRF + heat + O&M);
`tech.elec` is the technology's electricity intensity (MWh/tCO₂). The `×8` slope converts a $/MWh
electricity change into a $/tCO₂ LCOC change given intensity.

### 7.2 Technology parameterisation (real)

| Tech | LCOC $/tCO₂ | CAPEX $/t/yr | elec MWh/t | heat GJ/t | company | maturity |
|---|---|---|---|---|---|---|
| Solid Sorbent | 600 | 850 | 1.8 | 0 | Climeworks / Carbon Engineering | Commercial |
| Liquid Solvent | 500 | 750 | 0.6 | 5.5 | Carbon Engineering / 1PointFive | Commercial |
| Electroswing (ESDA) | 350 | 600 | 2.2 | 0 | Verdox | Pilot |
| Moisture-Swing | 450 | 700 | 0.8 | 1.5 | Global Thermostat / Skytree | Early Comm. |
| DAC + Geologic Storage | 550 | 820 | 2.0 | 4.0 | Heirloom / Project Bison | Commercial |

These match the guide's provenance (IEA DAC 2022, NREL TEA 2023, Climeworks disclosures): current LCOC
$350–600/tCO₂, IEA $100–300 target by 2030, IRA §45Q $180/tCO₂ for geological/DACCS storage. Learning
rates (15% for solid, 13% liquid, 12% ESDA per doubling-proxy year) are illustrative but in the
plausible 10–20% technology-learning band.

### 7.3 Calculation walkthrough

Project pipeline: each of 18 projects picks a tech (seeded), a capacity `0.01–0.50 ktCO₂/yr`, a country,
status, and an LCOC = `tech.lcoc × (0.88 + sr·0.28)` (±14% around the tech baseline). `avgLcoc` and
`totalCap` aggregate. The sensitivity chart sweeps electricity price 20→100 $/MWh applying the linear
slope per tech. The learning-curve chart compounds the annual decline to 2033 against a $200 target.
The economics tab runs the offtake calculator on user sliders (scale, credit price, electricity price).

### 7.4 Worked example

**LCOC sensitivity** — Solid Sorbent at $60/MWh electricity:
`600 + (60 − 40) × 1.8 × 8 = 600 + 20 × 14.4 = 600 + 288 = $888/tCO₂`. At $20/MWh:
`600 + (−20)·14.4 = 600 − 288 = $312/tCO₂` — showing electricity is the dominant lever (consistent with
the guide's "electricity 50–70% of DAC LCOC").

**Offtake calculator** — scale 1 (1,000 tCO₂/yr), credit price $500/tCO₂, electricity $40/MWh, Solid:
- `creditRevenue = 1000 × 500 / 1e6 = $0.5M`
- `elecCost = 1000 × 1.8 × 40 / 1e6 = $0.072M`
- `margin = 1000 × (500 − 1.8·40 − 200)/1e6 = 1000 × (500 − 72 − 200)/1e6 = 1000 × 228/1e6 = $0.228M`.
Positive margin at $500/t credit — the IRA §45Q $180/tCO₂ (a KPI, not wired into `margin`) would add
$0.18M more, illustrating the policy-credit uplift the guide describes.

**Learning curve** — Solid Sorbent year 5: `600 × 0.85^5 = 600 × 0.4437 = $266/tCO₂`, approaching the
IEA 2030 $100–300 band.

### 7.5 Data provenance & limitations

- Technology parameters (LCOC, CAPEX, electricity/heat intensity, maturity, company) are **real**
  curated values; the LCOC-sensitivity, learning-curve and offtake-revenue formulas are genuine
  deterministic functions. Only the 18-project pipeline's per-project LCOC/IRR/credit-price/status are
  `sr()`-seeded around the real tech baselines.
- The `−200` non-electricity cost and the `×8` sensitivity slope are simplifying constants, not a full
  CAPEX-CRF + heat + O&M breakdown; a bankable model would build LCOC from `(CAPEX×CRF + fixed O&M +
  electricity + heat) / annual CDR − §45Q`.
- Learning rates are illustrative single-technology curves, not fitted to observed deployment.
- IRA §45Q ($180/t) is displayed but not subtracted inside `margin` — the calculator understates
  after-credit economics.

**Framework alignment:** IEA *Direct Air Capture 2022* and NREL DAC TEA 2023 anchor the LCOC ranges;
IRS §45Q (IRA 2022, $180/tCO₂ for DACCS geological storage, EPA Class VI + MRV) is the headline policy
credit; the IPCC 5 GtCO₂/yr 2050 CDR requirement frames the market-size KPI. Offtake buyers (Stripe
Frontier, Microsoft, Shopify) referenced in the guide are the advance-purchase demand side the
economics tab models.
