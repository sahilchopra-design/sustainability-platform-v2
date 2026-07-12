# Geothermal LCOE Economics
**Module ID:** `geothermal-lcoe-economics` · **Route:** `/geothermal-lcoe-economics` · **Tier:** A (backend vertical) · **EP code:** EP-DV1 · **Sprint:** DV

## 1 · Overview
Levelised cost analysis for geothermal power covering hydrothermal vs EGS technologies, exploration dry-well risk, drilling cost by depth, reservoir productivity, flash/binary/dry-steam plant types and capacity factor benchmarks.

> **Business value:** Geothermal LCOE of $40–$100/MWh reflects high capacity factors (85–95%) offset by exploration dry-well risk ($5–$20M per well) and depth-driven drilling costs; hydrothermal projects are competitive with wind and solar.

**How an analyst works this module:**
- Assess resource quality via temperature gradient and permeability data
- Model drilling programme cost by well count, depth and dry-well probability
- Select plant technology (dry-steam, flash, binary ORC) matching resource enthalpy
- Compute LCOE sensitivity to reservoir productivity decline and CF assumption

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPARABLES`, `HEAT_FLOW_ZONES`, `KpiCard`, `Slider`, `TABS`, `TECH_TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECH_TYPES` | 7 | `capexWell`, `numWells`, `powerMw`, `parasitic`, `opex`, `cf`, `explore`, `plant`, `temp`, `depth`, `color`, `country`, `examples` |
| `COMPARABLES` | 9 | `lcoe_lo`, `lcoe_hi`, `cf`, `co2`, `color` |
| `HEAT_FLOW_ZONES` | 13 | `hf`, `resource`, `temp3km`, `installed` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalCapex` | `capexWellUsd * numWells + surfacePlantUsd + exploreCost * 1e6;` |
| `netMw` | `powerMwGross * (1 - parasitic / 100);` |
| `annMwh` | `netMw * cf / 100 * 8760;` |
| `capexAnn` | `totalCapex * w / (1 - Math.pow(1 + w, -lifetime));` |
| `opexAnn` | `opexMwyr * netMw * 1000;` |
| `lcoe` | `useMemo(() => calcGeothermalLcoe({ capexWellUsd: capexWell * 1e6, numWells, powerMwGross: powerMw, parasitic, opexMwyr: opex, wacc, lifetime, cf, exploreCost: explore, surfacePlantUsd: plant * 1e6 }), [capexWell, numWells, powerMw, parasitic, opex, wacc, lifetime, cf, explore, plant]);` |
| `carbonAdj` | `lcoe - carbonPrice * 38 / 1e6;` |
| `cashflows` | `useMemo(() => { const rev = annMwh * lcoe * 1.3;` |
| `projectIrr` | `useMemo(() => irr(cashflows), [cashflows]);  const costBreakdown = useMemo(() => [ { name: "Drilling & Wells", value: +(capexWell * numWells / totalCapex * 100).toFixed(1) }, { name: "Surface Plant",    value: +(plant * 1e6 / totalCapex * 100).toFixed(1) }, { name: "Exploration",      value: +(explore * 1e6 / totalCapex * 100).toFixed(1) ` |
| `sensitivityData` | `useMemo(() => [ { param: "WACC +2%",       lcoe: calcGeothermalLcoe({ capexWellUsd: capexWell*1e6, numWells, powerMwGross: powerMw, parasitic, opexMwyr: opex, wacc: wacc+2, lifetime, cf, exploreCost: explore, surfacePlantUsd: plant*1e6 }) * 1000 }, { param: "WACC -2%",       lcoe: calcGeothermalLcoe({ capexWellUsd: capexWell*1e6, numWells` |
| `learningData` | `useMemo(() => Array.from({ length: 20 }, (_, i) => { const cum = (i + 1) * 5;` |
| `depthCostData` | `useMemo(() => TECH_TYPES.map(t => ({` |
| `techCompare` | `useMemo(() => TECH_TYPES.map(t => ({` |
| `carbonValueData` | `useMemo(() => [20, 40, 60, 80, 100, 120, 150, 200].map(cp => ({` |
| `returnData` | `useMemo(() => [60, 70, 80, 90, 100, 110, 120].map(ppa => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/geothermal/assess` | `assess_geothermal` | api/v1/routes/geothermal.py |
| GET | `/api/v1/geothermal/plant-types` | `list_plant_types` | api/v1/routes/geothermal.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COMPARABLES`, `HEAT_FLOW_ZONES`, `TABS`, `TECH_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Geothermal LCOE Range | `LCOE = Annualised Total Cost / Annual Generation` | IRENA 2023 | Hydrothermal $40–$70/MWh; EGS $80–$100/MWh reflecting higher drilling and stimulation costs. |
| Exploration Dry-Well Cost | `Dry-Well Cost = Drilling Day Rate × Depth + Mobilisation` | ThinkGeoEnergy 2023 | Key risk factor; dry-well probability 30–50% in frontier areas drives project financing structure. |
| Capacity Factor | `CF = Actual Generation / (Installed Capacity × 8760)` | IRENA Geothermal Capacity Factors | Among the highest of any renewable technology; reservoir management critical to maintaining output. |
- **Drilling cost databases + IRENA benchmark data** → Exploration risk model → LCOE sensitivity analysis → **Geothermal LCOE dashboard by resource type and region**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/geothermal/plant-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dry_steam', 'single_flash', 'double_flash', 'binary', 'egs'], 'n_keys': 5}`

**POST /api/v1/geothermal/assess** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['project_name', 'plant_type', 'plant_type_label', 'total_capex_musd', 'lcoe_usd_mwh', 'irena_lcoe_range', 'lcoe_vs_irena', 'annual_generation_gwh', 'capacity_factor_pct', 'lifetime_generation_twh', 'plant_co2_intensity_gco2_kwh', 'annual_emissions_tco2', 'annual_avoided_e`

## 5 · Intermediate Transformation Logic
**Methodology:** Geothermal LCOE
**Headline formula:** `LCOE = (Exploration + Drilling + Surface Plant + O&M) / (CF × 8760 × Capacity)`

Full lifecycle cost model including dry-well exploration write-off and reservoir decline provisions.

**Standards:** ['IRENA — Geothermal Power Technology Brief 2017', 'ThinkGeoEnergy Market Report']
**Reference documents:** IRENA — Geothermal Power: Technology Brief (2017); ThinkGeoEnergy — Global Geothermal Market Report 2023; IEA — Geothermal Electricity Technology Costs

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **52** other module(s).

| Connected module | Shared via |
|---|---|
| `geothermal-market-intelligence` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-project-finance` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-direct-use` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-power-markets` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `reference-data-explorer` | table:dh_irena_lcoe, table:sqlalchemy |
| `carbon-market-intelligence` | table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:sqlalchemy |
| `supply-chain-esg-hub` | table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:sqlalchemy |
| `supply-chain-resilience` | table:sqlalchemy |

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

## 9 · Future Evolution

### 9.1 Evolution A — Probabilistic LCOE with dry-well write-off and real learning curve (analytics ladder: rung 2 → 3)

**What.** §7 rates this one of the platform's better-grounded tier-A modules: a genuine CRF annuity LCOE model (`calcGeothermalLcoe`) mirroring the backend `/api/v1/geothermal/assess` engine, anchored to IRENA plant-type bands, with no guide↔code mismatch. Its flagged limitations are the deepening targets: the deterministic path ignores dry-well write-off (P10/P50/P90 productivity lives only in the project-finance sibling), `carbonAdj` uses a fixed 38 gCO₂/kWh with a scaling that makes the credit negligible, the `TECH_TYPES` values are curated benchmarks not project-specific, and merchant-price scatter uses `sr()` for illustrative volatility. Evolution A brings probabilistic LCOE into this module: incorporate exploration dry-well probability as an expected-cost loading on the drilling programme, add a reservoir-productivity-decline provision, and replace the hard-coded learning curve with a Wright's-Law curve from cumulative deployment.

**How.** (1) `E[LCOE]` loads the drilling capex by `1/(1−p_dry)` and adds a decline-provision term, exposing P10/P50/P90 via a QMC pass (deterministic Halton per platform convention) over productivity and dry-well inputs. (2) Fix the `carbonAdj` scaling and let the flash-plant intensity vary by tech. (3) The learning curve computes `LCOE₀·(cumMW/cumMW₀)^(−b)` from a documented learning rate. (4) Optionally source `TECH_TYPES` capex from real project data.

**Prerequisites.** Dry-well probability and productivity ranges (curated from IRENA/ThinkGeoEnergy is acceptable, documented per §8); the `sr()` merchant scatter relabelled illustrative. **Acceptance:** LCOE renders as a P10–P90 band responding to dry-well probability; the learning curve responds to the learning-rate input; the carbon credit is correctly scaled.

### 9.2 Evolution B — Geothermal LCOE structuring copilot (LLM tier 2)

**What.** A copilot for developers and IC members: "compare binary ORC vs flash LCOE at 3 km depth and 180°C, and show the WACC sensitivity" tool-calls the LCOE endpoint across tech types and the sensitivity grid, narrating drilling-cost-by-depth and CF assumptions from the atlas corpus.

**How.** Tier-2 tool-calling over the geothermal assess/sensitivity endpoints (the `calcGeothermalLcoe` sensitivity table is a natural tool surface); the grounding corpus is §5/§7 (IRENA technology brief, IEA electricity-cost data, the ≤100 gCO₂/kWh Paris gate). Since the LCOE model is already real and CI-consistent, a tier-1 explainer ships first. Every $/MWh and IRR figure validated against tool output; the copilot distinguishes deterministic LCOE (this module) from probabilistic project risk (the finance sibling).

**Prerequisites.** None hard for tier 1; Evolution A for probabilistic answers. **Acceptance:** LCOE and sensitivity figures in a copilot answer trace to tool calls; asked for financing DSCR (not in this module), the copilot points to `geothermal-project-finance`.