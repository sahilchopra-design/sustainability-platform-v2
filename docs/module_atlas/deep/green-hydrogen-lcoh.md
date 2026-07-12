## 7 · Methodology Deep Dive

This **tier-A** page implements a **client-side LCOH calculator** (`calcLcoh`) that closely matches the
guide (EP-DS1: `LCOH = (CAPEX·CRF + OPEX)/Annual_H2_Production`) and the backend
`green_hydrogen_engine.calculate_lcoh`. Unlike the sibling `green-hydrogen-economics` page, this
calculator is **deterministic and dimensionally faithful** — it uses the HHV of hydrogen, a proper capital
recovery factor, an explicit electricity term, and an amortised stack-replacement term. It is the strongest
of the four hydrogen frontends. Sections below document the real formula.

### 7.1 What the module computes

```js
HHV_H2 = 39.4 kWh/kg ;  LHV_H2 = 33.3 kWh/kg
annualKgPerMW = (CF/100)·8760·1000 / (efficiency/100 · HHV_H2)          // kg H2 per MW-yr
capexAnnual   = capex·1000·(wacc/100) / (1 − (1+wacc/100)^−lifetime)     // CRF applied to $/kW·1000
electricityCost = elecCost · (efficiency/100 · HHV_H2)                   // $/kg (elecCost $/kWh × kWh/kg)
stackCostAnnual = (capex·1000·stackReplace/100) / (lifetime/2)          // amortise one replacement mid-life
totalPerKg    = (capexAnnual + opex·capex·1000/100 + stackCostAnnual)/max(1, annualKgPerMW)
              + electricityCost
```
Plus a 16-year electrolyser learning curve, an LCOH-vs-electricity-cost sweep, an LCOH-vs-capacity-factor
sweep, a waterfall decomposition, a regional comparison, and an electrolyser radar.

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| H2 HHV / LHV | 39.4 / 33.3 kWh/kg | physical constants |
| `capexAnnual` CRF | `wacc/(1−(1+wacc)^−lifetime)` | standard capital recovery factor |
| Stack amortisation | one replacement over `lifetime/2` | simplifying assumption (engine uses hours-based count) |
| `ELECTROLYZER_TYPES` (5) | efficiency, capex, opex, stackLife, ramp, TRL | IEA/manufacturer benchmarks (guide: CAPEX $400–2000/kW) |
| `RENEWABLE_SOURCES` (9) | lcoe, cf, variability | IRENA cost anchors |
| `REGIONS` (9) | elec price, policy/infra score, 2030 target | synthetic regional anchors |
| Learning curve `cumGW` | `2+i·8` (PEM) etc. | illustrative deployment ramp |

The core LCOH constants are physically correct; only the regional/learning-curve overlays are illustrative.

### 7.3 Calculation walkthrough

Sliders (`elecCost, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc`) → `calcLcoh`:
compute `annualKgPerMW` (production per MW), annualised CAPEX via CRF, OPEX (% of CAPEX), stack cost, and
the electricity cost per kg; sum to `totalPerKg`. The waterfall (`waterfallData`) shows each component's
$/kg contribution. Sweeps hold all else fixed and vary electricity price (`lcohElecData`) or capacity
factor (`cfData`) to trace the two dominant sensitivities. `reduction` = % LCOH fall from now to 2030 on
the learning curve.

### 7.4 Worked example

`elecCost = $0.045/kWh`, `capex = $1000/kW`, `opexPct = 3`, `efficiency = 65%`, `CF = 50%`, `lifetime = 20`,
`stackReplace = 15`, `wacc = 8`:
- `annualKgPerMW = 0.50·8760·1000 / (0.65·39.4) = 4,380,000 / 25.61 = 171,027 kg/MW-yr`.
- `CRF = 0.08/(1−1.08^−20) = 0.08/0.7855 = 0.1019`; `capexAnnual = 1000·1000·0.1019 = $101,900/MW-yr`.
- `stackCostAnnual = (1,000,000·0.15)/(20/2) = 150,000/10 = $15,000/MW-yr`.
- OPEX = `0.03·1,000,000 = $30,000/MW-yr`.
- Non-fuel per kg = `(101,900 + 30,000 + 15,000)/171,027 = 146,900/171,027 = $0.859/kg`.
- `electricityCost = 0.045·(0.65·39.4) = 0.045·25.61 = $1.152/kg`.
- **`totalPerKg = 0.859 + 1.152 = $2.01/kg`** — a plausible best-case green-H2 LCOH, electricity being
  ~57% of the total, matching the guide's "60–70% of LCOH" claim and the IEA <$2/kg 2030 target.

### 7.5 Data provenance & limitations

- The LCOH engine is **deterministic and physically correct** (HHV, CRF, explicit electricity term) — no
  seeded jitter in the headline number. The regional and learning-curve overlays are illustrative.
- Uses **HHV** for the efficiency→kWh/kg conversion; the backend engine uses **LHV** (33.33) — the two
  conventions differ by ~18%, so this page's production/kg and the engine's will not exactly reconcile.
  A production build should fix one convention (LHV is standard for RFNBO/IEA reporting).
- Stack replacement is amortised as one event over `lifetime/2`, vs the engine's operating-hours-based
  replacement count — a simplification.

**Framework alignment:** IEA Global Hydrogen Review (LCOH structure + <$2/kg 2030 target), IRENA green-
hydrogen cost reduction, Hydrogen Council pathway. The CRF/component decomposition mirrors standard LCOE/
LCOH practice. Consistency note: reconcile the HHV-vs-LHV convention against the backend engine.

*(No §8 model specification required — this page already implements a sound LCOH model; the only
remediation is to align the HHV/LHV convention with `green_hydrogen_engine.py` so frontend and backend
LCOH agree.)*
