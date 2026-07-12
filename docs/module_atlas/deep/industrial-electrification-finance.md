## 7 · Methodology Deep Dive

An **industrial-electrification finance** page comparing 6 electrification technologies (heat pumps,
electric boilers, EAF, microwave/RF, induction, thermal storage) on fuel-switch economics and payback,
with a synthetic 18-project pipeline. The technology property table is grounded in IEA/IRENA data; the
cost/payback formulas are genuine energy economics. Code and guide (EP-EG5) agree — no mismatch flag.

### 7.1 What the module computes

**Fuel-switch cost comparison** (electric vs gas, per technology), with carbon-saving credit:

```js
electricCost = heatDemand · 1000 · elecPrice / t.elecFactor / 1e6      // €M for the elec route
gasCost      = heatDemand · 1000 · gasPrice / 1000 · 0.033 / t.gasFactor
carbonSaving = t.abatement/100 · heatDemand · 0.2 · carbonPrice / 1e3  // CO₂ avoided × price
netElec      = electricCost − carbonSaving
```

**Simple payback** (ROI Calculator):

```js
netSaving = annualGasCost − annualElecCost + annualCarbonSaving
capexM    = t.capex · heatDemand · 1000 / 1e9
payback   = netSaving>0 ? (capexM/netSaving).toFixed(1) : '∞'
```

The `0.033` factor converts gas price ($/MWh-equiv) via the ~0.033 GJ/kWh energy content; `0.2` is a
tCO₂/MWh grid/fuel emission-intensity proxy.

### 7.2 Parameterisation — TECH_AREAS table (provenance)

| Technology | Temp range | elecFactor (η) | gasFactor | LCOH €/MWh | Abatement % | capex €/kW | Maturity |
|---|---|---|---|---|---|---|---|
| Industrial Heat Pumps | ≤200 °C | 0.33 (COP≈3) | 0.80 | 65 | 72 | 850 | Commercial |
| Electric Boilers | ≤500 °C | 0.97 | 0.80 | 72 | 85 | 180 | Commercial |
| Electric Arc Furnaces | ≤1800 °C | 0.90 | 0.85 | 95 | 90 | 420 | Commercial |
| Microwave / RF | ≤1200 °C | 0.75 | 0.85 | 110 | 88 | 280 | Early Comm. |
| Induction | ≤1400 °C | 0.85 | 0.82 | 90 | 88 | 350 | Commercial |
| Thermal Storage | 100–700 °C | 0.70 | 0.80 | 55 | 65 | 220 | Early Comm. |

`elecFactor` for heat pumps (0.33) encodes COP≈3 (guide: COP 2.5–4.0 falling with temperature),
electric boilers ~0.97 (near-perfect conversion) — both consistent with IEA Industrial Heat data. The
18-project pipeline is **synthetic** (`sr()` selects tech/sector/country/status; heat 5 000–100 000
MWh; capex = tech.capex × heat/10 000; IRR = 6 + sr·10 → 6–16%).

### 7.3 Calculation walkthrough

Sliders: `elecPrice` ($/MWh), `gasPrice`, `carbonPrice`, `heatDemand` (GWh). `economicsComparison`
computes per-technology electric vs gas cost and net cost after carbon saving. The ROI Calculator
computes annual gas/elec cost, net saving (incl. carbon), capex and simple payback. Portfolio KPIs
(`avgIrr`, `totalHeat`) reduce the synthetic pipeline.

### 7.4 Worked example (Heat Pumps, defaults)

`heatDemand = 50` GWh, `elecPrice = $60/MWh`, `gasPrice = $45/MWh`, `carbonPrice = $80/t`,
heat-pump `elecFactor = 0.33`, `gasFactor = 0.80`, `abatement = 72%`:

| Step | Computation | Result |
|---|---|---|
| electricCost | 50·1000·60/0.33/1e6 | 50 000·60/0.33/1e6 = **$9.09M** |
| gasCost | 50·1000·45/1000·0.033/0.80 | 50 000·45·0.033/1000/0.80 ≈ **$0.093M** (scale artefact) |
| carbonSaving | 0.72·50·0.2·80/1e3 | 0.72·800/1000 = **$0.576M** |
| netElec | 9.09 − 0.576 | **$8.51M** |

(The gas/elec figures are on different unit scales in the code — the comparison is directional; the
heat-pump COP of ~3 means electric energy demand is one-third of delivered heat, the module's key point
that heat pumps win when the gas:electricity price ratio is favourable.)

### 7.5 Data provenance & limitations

- **Technology table is grounded** in IEA Industrial Heat / IRENA electrification data (COP, efficiency,
  abatement, capex); the **fuel-switch and payback formulas are genuine** energy economics.
- The **project pipeline is synthetic** (`sr()`); IRRs (6–16%) and heat volumes are random.
- Unit scaling between the electric-cost (÷1e6) and gas-cost (×0.033/1000) terms is inconsistent, so the
  side-by-side bar is indicative rather than a clean €/MWh comparison; the carbon-intensity proxy (0.2
  tCO₂/MWh) is a single scalar, not fuel/grid-specific.

**Framework alignment:** IEA *Industrial Heat Roadmap 2023* (COP by temperature, heat-pump economics) ·
IRENA *Industrial Electrification 2023* · worldsteel EAF energy-use indicator (0.5–0.65 MWh/t). The
module implements the guide's `payback = capex / (fossil_opex − elec_opex + carbon_avoided)` faithfully;
the improvement would be consistent unit handling and a grid-specific emission factor rather than the
0.2 tCO₂/MWh proxy.
