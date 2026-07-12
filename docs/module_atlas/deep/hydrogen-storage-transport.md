## 7 · Methodology Deep Dive

A **storage-and-transport economics** page comparing 6 storage modalities (compressed 350/700 bar,
LH₂, LOHC, NH₃ cracking, salt cavern) and 8 real export corridors, with pipeline/shipping/terminal
cost models grounded in H₂ physical constants. Most maths is genuine engineering economics; only the
per-corridor cost stack uses a small synthetic term. Code and guide (EP-DS4) agree.

### 7.1 What the module computes

**Physical constants** (correct, hard-coded):
`LHV_H2 = 33.3`, `HHV_H2 = 39.4` kWh/kg; `DENSITY_LIQUID_H2 = 70.8`, `DENSITY_700BAR = 39.0`,
`DENSITY_350BAR = 23.5` kg/m³; `NH3_H2_RATIO = 0.178` kg H₂/kg NH₃.

**Pipeline cost** — diameter-scaled capex annuitised over 30 years:

```js
capexPerKm = 3.2 + 0.8·diaDm          // M€/km, larger diameter costs more
totalCapex = capexPerKm · distKm
annuity    = totalCapex·1e6 · 0.08 / (1 − 1.08^−30)   // 8% discount, 30-yr life
cost €/kg  = annuity / max(1, annualTonne·1e3)
```

**Shipping cost** — mode base rate + distance term:

```js
shippingCost = { LH₂:0.08, NH₃:0.04, LOHC:0.06 }[mode] + distKm·0.00005    // €/kg
```

**Storage cost** (20-yr NPV of opex on capex):

```js
totalStorageCostPerKg = capexPerKg + (opexPct/100 · capexPerKg · 20)
```

**Terminal cost** — capacity-scaled capex annuitised, divided by throughput:

```js
capexTerminal = termCapacity · 0.5        // €0.5M per tonne capacity
annuity       = capexTerminal·1e6·0.08 / (1 − 1.08^−30)
costPerKg     = annuity / max(1, annualThroughput·1000)
```

### 7.2 Parameterisation — STORAGE_MODES table

| Mode | Density kg/m³ | capex €/kg | opex % | Compression kWh/kg | Boil-off %/day | Round-trip η | TRL |
|---|---|---|---|---|---|---|---|
| CGH2 350 bar | 23.5 | 700 | 2 | 2.2 | 0 | 0.92 | 9 |
| CGH2 700 bar | 39.0 | 1100 | 2.5 | 3.2 | 0 | 0.88 | 9 |
| LH2 | 70.8 | 1800 | 3 | 11.5 | 0.3 | 0.78 | 8 |
| LOHC (DBT) | 6.2 wt% | 900 | 3.5 | 8.0 | 0 | 0.70 | 7 |
| NH3 cracking | 120 (→21.4 H₂) | 600 | 2.8 | 6.5 | 0.05 | 0.65 | 8 |
| Salt cavern | 25 @200 bar | 0.5 | 1 | 2.0 | 0.01 | 0.96 | 8 |

These match IEA/DNV/Hydrogen Council ranges: LH₂ liquefaction ~11.5 kWh/kg (≈35% of HHV), salt-cavern
lowest €/kg, NH₃ lowest round-trip due to cracking penalty. Corridors are 8 real routes with published
distances and LCOH-transport figures (Chile-EU 12 800 km $1.20/kg; Norway-EU 800 km $0.18/kg).

### 7.3 Calculation walkthrough

`pipelineSensData` sweeps 10 distances (1 000–10 000 km) at three flow rates. `terminalData` responds
to `termCapacity`/`loaFactor` sliders. `stackData` builds a per-corridor delivered-cost stack:
`prodCost (2.5 + sr(i·17)·2.0)` + `storeCost (0.3 + sr(i·11)·0.4)` + `transpCost` + `regas`. `lohcCycleData`
traces the 8-step LOHC round-trip with per-step energy (kWh/tH₂), temperature and loss — hard-coded
process data (hydrogenation 58, dehydrogenation 180 kWh/tH₂ at 320 °C).

### 7.4 Worked example (Norway-EU pipeline, 2 Mtpa, 1.0 m diameter, 800 km)

```
capexPerKm = 3.2 + 0.8·1.0 = 4.0 M€/km
totalCapex = 4.0 · 800 = 3200 M€
annuity    = 3200·1e6 · 0.08/(1 − 1.08^−30) = 2.56e8/0.90066 = €2.84e8/yr
annualTonne= 2 Mtpa · 1000 = 2e6 t/yr → 2e9 kg/yr
cost/kg    = 2.84e8 / 2e9 = €0.14/kg
```

≈€0.14/kg — consistent with the corridor's hand-tagged $0.18/kg and the guide's claim that short-haul
pipeline is the cheapest transport mode, and that pipeline repurposing cuts cost 50–70% vs new build.

### 7.5 Data provenance & limitations

- **Physical constants and the cost engines are genuine** — capex annuitisation, compression energy,
  round-trip efficiency and boil-off are real engineering-economics; this page is largely trustworthy.
- The **per-corridor delivered-cost stack uses seeded PRNG** for production and storage terms
  (`sr(i·17)`, `sr(i·11)`) — the *transport* term is real, but the total stack embeds ~$2.5–4.5/kg of
  synthetic production cost.
- Boil-off is a static %/day, not integrated over voyage duration; shipping cost is a linear distance
  term without vessel-size economies.
- LOHC dehydrogenation heat (320 °C, 180 kWh/tH₂) is captured descriptively but not costed into a
  temperature-dependent penalty.

**Framework alignment:** DNV *Hydrogen Forecast to 2050* (transport-mode cost ordering: NH₃ cheapest
>3 000 km) · IEA *The Future of Hydrogen* (storage cost, liquefaction energy penalty) · Hydrogen
Council *Decarbonization Pathways* (reconversion efficiency). The module implements the DNV/IEA
transport-mode comparison faithfully; the delivered-LCOH totals are indicative because the production
term is synthetic.
