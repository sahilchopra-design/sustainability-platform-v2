## 7 · Methodology Deep Dive

Guide and code align: a Direct Air Capture net-removal calculator with an energy-source carbon
intensity switch, lifecycle-component deductions, permanence adjustment, and a cost/learning-curve
model. The `netCalc` engine is real; the learning curve and facility roster are synthetic projections.

### 7.1 What the module computes

`netCalc` (lines 70–84):

```js
energyEF          = {Renewable:0.02, 'Grid Mix':0.45, 'Natural Gas':0.20}[source]   // tCO2/MWh
energyEmissions   = grossCapture × (energyIntensity/1000) × energyEF                 // kWh/t → MWh/t
sorbentEmissions       = grossCapture × sorbentPct/100
constructionEmissions  = grossCapture × constructionPct/100
transportEmissions     = grossCapture × transportPct/100
totalLifecycle    = Σ(the four above)
grossNet          = grossCapture − totalLifecycle
netRemoval        = grossNet × (1 − permAdj)
captureEfficiency = netRemoval / grossCapture × 100
costPerNetTonne   = (grossCapture × lcod) / netRemoval
```

Key design point (matching the guide): net removal is dominated by the **energy channel** — a
high-carbon grid can wipe out net removal. `costPerNetTonne` rises above the raw LCOD because the
denominator is *net*, not gross, tonnes.

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| Energy EF (Renewable / Grid Mix / Natural Gas) | 0.02 / 0.45 / 0.20 tCO₂/MWh | Grid-CI proxies (renewable ~20 gCO₂/kWh, grid mix 450, gas 200) |
| `energyIntensity` | 1,800 kWh/tCO₂ (solid sorbent) | IEA/DOE DAC electric energy demand |
| Sorbent / construction / transport | 6% / 3% / 4% of gross | Lifecycle component assumptions |
| `permAdj` | tier-dependent | `PERM_TIERS` durability discount ladder |
| `lcod` | $400/tCO₂ | Current commercial DAC LCOR midpoint (IEA CCUS 2024 $400–1,000) |
| Learning curve | solid `max(80, 600×0.92^i)`, liquid `max(90, 500×0.93^i)` | ~8% cost decline/yr to a $80–90 floor (DOE DAC Shot target $100) |
| Capacity growth | `1000 × 1.35^min(i,20)` | 35%/yr deployment, capped at year 20 |

### 7.3 Calculation walkthrough

1. Energy emissions from capture-scaled energy demand × grid EF; three flat percentage lifecycle
   terms added.
2. Gross net = capture − lifecycle; permanence discount applied → net removal.
3. Capture efficiency and cost-per-net-tonne derived; results pushed to `CarbonCreditContext` as
   `Iso-DAC`, family `cdr`.
4. **Energy sensitivity** sweeps energy intensity 1,200–2,500 kWh/t across all three sources.
5. **Facility design** partitions a target capacity into modules (guarded `max(modules,1)`), sizing
   energy/water/land and generating synthetic module telemetry.
6. **LCA waterfall** and **learning curve** (2024–2050) visualise the deductions and cost trajectory.

### 7.4 Worked example — Net Removal Calculator

Defaults: grossCapture 10,000 t, source Renewable (EF 0.02), energyIntensity 1,800, sorbent 6%,
construction 3%, transport 4%, permTier 0 (adj 0), lcod $400:

| Step | Computation | Result |
|---|---|---|
| Energy emissions | 10,000 × (1,800/1,000) × 0.02 | 360 t |
| Sorbent | 10,000 × 0.06 | 600 t |
| Construction | 10,000 × 0.03 | 300 t |
| Transport | 10,000 × 0.04 | 400 t |
| Total lifecycle | 360+600+300+400 | 1,660 t |
| Gross net | 10,000 − 1,660 | 8,340 t |
| Net removal (permAdj 0) | 8,340 × 1 | **8,340 t** |
| Capture efficiency | 8,340 / 10,000 | **83.4%** |
| Cost / net tonne | (10,000 × 400) / 8,340 | **$480/t** |

On a Grid-Mix source (EF 0.45), energy emissions become 10,000 × 1.8 × 0.45 = 8,100 t — net removal
collapses to ~240 t and cost per net tonne explodes, exactly the grid-CI-breakeven message.

### 7.5 Data provenance & limitations

- **Calculator is real; learning curve, facilities, and module telemetry are synthetic** (PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)`).
- Lifecycle components (sorbent/construction/transport) are flat percentages of gross capture, not
  process-model outputs; construction/embodied carbon should amortise over facility lifetime, not
  scale linearly with annual capture.
- Only three discrete energy sources; no continuous grid-CI input despite the guide's "breakeven grid
  CI ~100 gCO₂/kWh" framing (the model would cross zero net around EF ≈ capture/energy ≈ 0.56 tCO₂/MWh
  at 1,800 kWh/t + 13% other lifecycle).
- Permanence adjustment is a single discount, not a monitored geological-storage reversal term.

**Framework alignment:** **DOE Carbon Negative Shot** ($100/t target — the learning-curve floor) ·
**IEA CCUS 2024** (LCOR $400–1,000, energy intensities) · **IPCC AR6 Ch.12 CDR** (DAC net-removal
must net energy emissions) · **ISO 14064-2** project accounting · **IRA §45Q** ($180/t geologic DAC)
referenced in the guide's policy tab. The core "net = captured − energy×gridCI − lifecycle" identity
is the standard DAC LCA accounting used across MSCI/CDR-registry methodologies.
