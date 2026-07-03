# EGS Project Analytics
**Module ID:** `enhanced-geothermal-systems` · **Route:** `/enhanced-geothermal-systems` · **Tier:** B (frontend-computed) · **EP code:** EP-DV6 · **Sprint:** DV

## 1 · Overview
Enhanced Geothermal Systems analytics covering hot dry rock hydraulic stimulation, reservoir engineering, induced seismicity risk management, flow rate and temperature targets, DOE FORGE programme results and LCOE pathway to $45/MWh by 2035.

> **Business value:** EGS targets ≥10 kg/s flow rates and ≥175°C reservoir temperatures to reach $45/MWh LCOE by 2035; DOE FORGE is demonstrating feasibility at Utah with induced seismicity managed below ML 2.0 thresholds.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EGS_PROJECTS`, `GEOVIVSION_SCENARIOS`, `KpiCard`, `STIMULATION_TECHNIQUES`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `wellCost` | `depthKm * wellCostPerKm * 1e6 * 2; // injection + production` |
| `totalDrill` | `numWellPairs * wellCost;` |
| `totalStim` | `numWellPairs * stimCostPerWell * 1e6;` |
| `surfacePlant` | `powerMw * 1.8e6; // $1.8M/MW ORC plant` |
| `totalCapex` | `totalDrill + totalStim + surfacePlant;` |
| `annMwh` | `powerMw * cf / 100 * 8760;` |
| `capexAnn` | `totalCapex * w / (1 - Math.pow(1 + w, -lifetime));` |
| `opexAnn` | `opexMwyr * powerMw * 1000;` |
| `annMwh` | `powerMw * cf / 100 * 8760;` |
| `revMyr` | `annMwh * ppa / 1e6;` |
| `egsIrr` | `useMemo(() => irr([-totalCapex / 1e6, ...Array(lifetime).fill(revMyr - opex * powerMw * 1000 / 1e6)]) * 100, [totalCapex, revMyr, opex, powerMw, lifet` |
| `drillCost` | `wellPairs * depth * wellCostKm * 2;` |
| `stimTotalCost` | `wellPairs * stimCost;` |
| `plantCost` | `powerMw * 1.8;` |
| `flowVar` | `flowRate * (0.5 + sr(i * 7) * 0.8);` |
| `tempVar` | `temp * (0.92 + sr(i * 13) * 0.16);` |
| `powerOut` | `flowVar * 4.2 * (tempVar - 70) / 3600 * 0.1;` |
| `nProjects` | `(i + 1) * 3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EGS_PROJECTS`, `GEOVIVSION_SCENARIOS`, `STIMULATION_TECHNIQUES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Flow Rate Target | `Flow Rate = Reservoir Permeability × ΔP / Fluid Viscosity` | DOE FORGE Results 2023 | Minimum commercial threshold; FORGE achieving 5–8 kg/s at Utah site as of 2023. |
| Temperature Target | `T_reservoir = Surface Temperature + Geothermal Gradient × Depth` | DOE EGS Targets | Minimum reservoir temperature for viable flash or binary power generation. |
| EGS LCOE Target | `Target = DOE EGS Shot Learning Curve Projection` | DOE Enhanced Geothermal Shot 2022 | Requires 90% reduction in stimulation and drilling costs from current $100–$200/MWh baseline. |
- **DOE FORGE field data + drilling cost benchmarks** → LCOE learning-curve model → induced seismicity risk dashboard → **EGS project analytics platform**

## 5 · Intermediate Transformation Logic
**Methodology:** EGS LCOE Pathway
**Headline formula:** `LCOE_EGS(t) = Base_LCOE × (1 − LR)^(log₂(Cumulative_Wells(t)))`
**Standards:** ['DOE — EGS Shot 2024', 'MIT — The Future of Geothermal Energy 2006']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).