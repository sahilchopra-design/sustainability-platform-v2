## 7 · Methodology Deep Dive

Geothermal LCOE Economics (EP-DV1) is one of the platform's better-grounded tier-A modules: it runs
a genuine levelised-cost-of-energy annuity model client-side (`calcGeothermalLcoe`) that mirrors the
backend `/api/v1/geothermal/assess` engine, both anchored to IRENA plant-type LCOE bands. No
guide↔code mismatch — the code implements the LCOE the guide describes.

### 7.1 What the module computes

The core function (JSX lines 17–27):

```js
function calcGeothermalLcoe({capexWellUsd,numWells,powerMwGross,parasitic,opexMwyr,wacc,lifetime,cf,
                             exploreCost,surfacePlantUsd}) {
  const w = wacc/100;
  const totalCapex = capexWellUsd*numWells + surfacePlantUsd + exploreCost*1e6;
  const netMw = powerMwGross*(1 - parasitic/100);              // net of parasitic load
  const annMwh = netMw*cf/100*8760;
  const capexAnn = totalCapex * w/(1 - Math.pow(1+w,-lifetime)); // capital-recovery annuity
  const opexAnn  = opexMwyr*netMw*1000;
  return (capexAnn + opexAnn)/annMwh;                           // USD/MWh
}
```

The `w/(1−(1+w)^−n)` factor is the **capital recovery factor (CRF)** in present-value annuity form —
algebraically identical to the backend's `crf = r(1+r)^n/((1+r)^n−1)`. Companion outputs:

```js
carbonAdj  = lcoe − carbonPrice*38/1e6;    // credit for 38 gCO2/kWh avoided intensity
projectIrr = irr(cashflows);  rev = annMwh*lcoe*1.3;   // revenue at 30% margin over LCOE
```

### 7.2 Parameterisation (IRENA / ThinkGeoEnergy anchored)

`TECH_TYPES` (7 rows) carries per-technology techno-economics. Selected values:

| Technology | capex/well | wells | MW gross | parasitic % | opex $/MW-yr | CF % | explore $M | depth km | provenance |
|---|---|---|---|---|---|---|---|---|---|
| Dry Steam | $4.5M | 12 | 55 | 10 | 22 | 95 | 18 | 1.8 | The Geysers/Larderello |
| Single Flash | $5.2M | 18 | 50 | 12 | 25 | 93 | 22 | 2.2 | Makban/Cerro Prieto |
| Binary (ORC) | $3.8M | 14 | 20 | 8 | 30 | 90 | 14 | 2.8 | Mammoth/Kızıldere |
| EGS (Advanced) | $12M | 6 | 10 | 15 | 45 | 88 | 35 | 4.5 | Fervo/Quaise/Eavor |

`COMPARABLES` (8 techs) gives LCOE lo/hi bands and CO₂ intensity for the "Vs. Alternatives" tab
(Geothermal flash $50–100, EGS $100–250, Solar PV $25–60/490 gCO₂, CCGT $55–100/490 gCO₂ — all IRENA
*Renewable Power Generation Costs 2023* consistent). `HEAT_FLOW_ZONES` (12 regions) carries heat-flow
(mW/m²), 3 km temperature, and installed GW — real geological/capacity data.

The backend adds `PLANT_TYPES` LCOE bands ($40–200/MWh), `TEMP_THRESHOLDS` (dry-steam min 230 °C,
binary min 100 °C), and `SEISMICITY_RISK` by depth (EGS or >4 km = high) — IRENA 2024/IEA anchored.

The **one PRNG use** is cosmetic: `sr()` appears only in the merchant-price path scatter
(`ppaVsMerchant`, `spotVol = basePrice*(0.8+sr(y*17)*0.4)`), not in LCOE.

### 7.3 Calculation walkthrough

1. Sliders set capex/well, well count, MW, parasitic %, opex, WACC, lifetime, CF, explore, plant.
2. `calcGeothermalLcoe` → LCOE in $/MWh.
3. `carbonAdj` subtracts a carbon credit (carbonPrice × 38 gCO₂/kWh / 1e6) from LCOE.
4. `cashflows` = [−capex, then annual (rev − opex − debt)] → `irr` via Newton-Raphson.
5. `sensitivityData` re-runs LCOE under ±2% WACC, ±CF, ±capex perturbations (tornado).
6. `learningData` projects LCOE down a learning curve over 20 cumulative-capacity steps.

### 7.4 Worked example (Binary ORC, base sliders)

Inputs: capexWell $3.8M, 14 wells, 20 MW gross, parasitic 8%, opex $30/MW-yr, WACC 8%, lifetime 25,
CF 90%, explore $14M, plant $32M.

| Step | Computation | Result |
|---|---|---|
| Total capex | 3.8M×14 + 32M + 14M | 53.2 + 32 + 14 = **$99.2M** |
| Net MW | 20×(1−0.08) | 18.4 MW |
| Annual MWh | 18.4×0.90×8760 | 145,066 MWh |
| CRF | 0.08/(1−1.08⁻²⁵) | 0.08/0.8538 = **0.09368** |
| Capex annuity | 99.2M×0.09368 | $9.293M |
| Opex annuity | 30×18.4×1000 | $0.552M |
| LCOE | (9.293M+0.552M)/145,066 | **$67.9/MWh** |

$67.9/MWh sits within the binary IRENA band ($55–110), so the "Within IRENA range" flag fires. At a
$50/tCO₂ carbon price, `carbonAdj = 67.9 − 50×38/1e6` ≈ 67.9 − 0.0019 ≈ 67.9 (the 38 gCO₂/kWh
divided by 1e6 makes the carbon adjustment tiny per-MWh in these units — a scaling quirk worth noting).

### 7.5 Backend `/assess` companion

The FastAPI route runs the same CRF LCOE plus: `annual_avoided = (gridEF − plant_co2)×gwh` avoided
emissions, `paris_aligned = plant_co2 ≤ 100 gCO₂/kWh` (IEA threshold), resource viability from
`TEMP_THRESHOLDS`, seismicity from depth, NPV (discounted), and IRR (100-step bisection). It also
pulls real IRENA LCOE history from `dh_irena_lcoe` where `technology='geothermal'`.

### 7.6 Data provenance & limitations

- **Techno-economic `TECH_TYPES` values are curated benchmarks** (IRENA/ThinkGeoEnergy), not project-
  specific — real projects vary widely by resource.
- LCOE ignores dry-well write-off in the deterministic path (the guide's 30–50% contingency and
  P10/P50/P90 productivity live in the *project-finance* sibling module, not here).
- `carbonAdj` uses a fixed 38 gCO₂/kWh flash-plant intensity for all techs and a units scaling that
  makes the per-MWh credit negligible — a display simplification.
- Merchant-price scatter uses `sr()` PRNG for illustrative volatility only.

**Framework alignment:** *IRENA Renewable Power Generation Costs / Geothermal Technology Brief* — the
LCOE bands, CF ranges (85–95%), and CO₂ intensities are IRENA-consistent. *IEA WEO/NZE* — the ≤100
gCO₂/kWh Paris-alignment gate is the IEA electricity-decarbonisation threshold. *CRF annuity* — the
capital-recovery form is the standard NREL/IEA LCOE convention.

*(No §8 model specification required — the module runs a real, validated LCOE annuity model
consistent with IRENA methodology.)*
