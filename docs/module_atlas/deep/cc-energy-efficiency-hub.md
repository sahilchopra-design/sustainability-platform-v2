## 7 · Methodology Deep Dive

Guide and code align: an IPMVP / CDM AMS-II series energy-efficiency emission-reduction calculator,
a distributed-energy-resource (DER) generation model, and a weather-normalisation (HDD/CDD) engine.
Calculators are real; the 10-project portfolio is synthetic.

### 7.1 What the module computes

**Energy-efficiency ER** (`calcEnergyEff`, lines 60–77):

```js
blEnergy   = capacity × opHours × lf / blEff       // baseline energy at baseline efficiency
pjEnergy   = capacity × opHours × lf / pjEff        // project energy at improved efficiency
savings    = max(0, blEnergy − pjEnergy)            // kWh saved (clamped ≥ 0)
be         = savings × gridEF × 1e-3                // tCO2 (gridEF tCO2/MWh, kWh→MWh)
netCredits = be × 0.92                              // 8% buffer/uncertainty deduction
savingsPct = (1 − pjEnergy/blEnergy) × 100
```

**Weather normalisation** (`calcWeatherNorm`):

```js
ratio    = hddNormal / max(hddActual, 1)
adjusted = measured × ratio                          // IPMVP routine adjustment to normal-year weather
```

**DER model** (`derResult`): `generation = capacity × hours × lf`, self-consumption split, storage
loss `selfConsumed × (1−storageEff) × 0.3`, credits on net generation × gridEF × 0.92.

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| `blEff` / `pjEff` | 0.60 / 0.85 | Baseline vs improved system efficiency (illustrative) |
| `gridEF` | 0.55 tCO₂/MWh | Regional grid emission factor (IEA-style; ~550 gCO₂/kWh) |
| `lf` (load factor) | 0.55 | Operating load factor |
| `opHours` | 4,500 h/yr | Annual operating hours |
| Buffer | ×0.92 (8% deduction) | Conservativeness proxy |
| Storage loss coefficient | ×0.3 of round-trip loss | DER self-consumption storage penalty |
| DER load factor | 0.20 | Rooftop-solar-style capacity factor |
| Seasonal factor | `0.7 + 0.6·sin((m−2)·π/6)` | Sinusoidal monthly generation shape |

### 7.3 Calculation walkthrough

1. Baseline and project energy computed from the same demand (`capacity × opHours × lf`) divided by
   respective efficiencies; the efficiency gain is the energy saving.
2. Savings × grid EF → baseline emissions avoided; ×0.92 buffer → net credits.
3. Result pushed to `CarbonCreditContext` as methodology `AMS-II.C`, family `energy`.
4. **Weather normalisation** rescales measured consumption by the ratio of normal-year to actual-year
   heating degree-days — the IPMVP routine-adjustment step — with a sensitivity sweep over HDD.
5. **DER model** builds generation, self-consumption/export split, storage loss, and a 12-month
   seasonal profile.

### 7.4 Worked example — Energy-Efficiency Calculator

Defaults: capacity 200, opHours 4,500, lf 0.55, blEff 0.60, pjEff 0.85, gridEF 0.55:

| Step | Computation | Result |
|---|---|---|
| Demand | 200 × 4,500 × 0.55 | 495,000 |
| Baseline energy | 495,000 / 0.60 | 825,000 kWh |
| Project energy | 495,000 / 0.85 | 582,353 kWh |
| Savings | 825,000 − 582,353 | 242,647 kWh |
| Baseline emissions (be) | 242,647 × 0.55 × 1e-3 | 133.5 tCO₂ |
| Net credits | 133.5 × 0.92 | **≈122.8 tCO₂e** |
| Savings % | (1 − 582,353/825,000) | **29.4%** |

### 7.5 Data provenance & limitations

- **Calculators are real; the 10-project registry is synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- Baseline is engineering-estimated from efficiency ratios, not a regression against production/
  weather/occupancy variables as full IPMVP Option B/C requires — the weather-normalisation tab is a
  standalone HDD ratio, not integrated into the ER baseline.
- Grid EF is a single annual-average value; marginal or hourly EFs (which the guide mentions) are not
  modelled.
- Buffer is a flat 8%; no measurement-uncertainty propagation.
- DER storage loss uses a `×0.3` heuristic scalar on round-trip loss, not a dispatch model.

**Framework alignment:** **IPMVP 2022** (the weather-normalisation ratio is the IPMVP routine
adjustment; the baseline-minus-project structure is IPMVP Option B/C) · **CDM AMS-II.A/C/E**
(small-scale energy efficiency) · **ISO 50001** energy-management baseline concept · **GHG Protocol
Scope 2** for the grid emission factor applied to saved kWh. The methodology tag written to the data
bus is `AMS-II.C` (industrial demand-side efficiency).
