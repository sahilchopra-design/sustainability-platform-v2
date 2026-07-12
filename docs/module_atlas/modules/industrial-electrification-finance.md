# Industrial Electrification Finance
**Module ID:** `industrial-electrification-finance` · **Route:** `/industrial-electrification-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EG5 · **Sprint:** EG

## 1 · Overview
Financial analysis of industrial electrification technologies: Industrial Heat Pumps, Electric Boilers, EAF, Microwave/RF Heating, Induction Heating, and Thermal Storage. Covers 18 projects, simple payback calculator, ROI vs electricity price sensitivity, temperature profile, and grid flexibility benefits.

> **Business value:** Used by industrial companies evaluating electrification investments, utilities designing industrial demand response programmes, and investors in industrial electrification infrastructure and heat pump manufacturers.

**How an analyst works this module:**
- Review technology overview for 6 electrification technologies with heat temperature profiles
- Use simple payback calculator with CAPEX and energy cost sliders
- Examine ROI sensitivity to electricity price across 18 projects
- Analyse grid flexibility benefits including demand response and flexibility value

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PROJECTS`, `Pill`, `TABS`, `TECH_AREAS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECH_AREAS` | 7 | `name`, `tempRange`, `elecFactor`, `gasFactor`, `lcoh`, `abatement`, `capex`, `maturity` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tech` | `TECH_AREAS[Math.floor(sr(i * 7 + 1) * TECH_AREAS.length)];` |
| `sectorName` | `['Food & Bev', 'Paper/Pulp', 'Chemical', 'Automotive', 'Plastics', 'Pharma', 'Textile'][Math.floor(sr(i * 11 + 2) * 7)];` |
| `country` | `['Germany', 'Netherlands', 'USA', 'Sweden', 'UK', 'France', 'Japan'][Math.floor(sr(i * 13 + 3) * 7)];` |
| `heatMWh` | `Math.round(5000 + sr(i * 17 + 4) * 95000);` |
| `status` | `['Operating', 'Construction', 'FID', 'Engineering', 'Feasibility'][Math.floor(sr(i * 19 + 5) * 5)];` |
| `capex` | `Math.round(tech.capex * heatMWh / 10000);` |
| `irr` | `parseFloat((6 + sr(i * 23 + 6) * 10).toFixed(1));` |
| `filtered` | `useMemo(() => PROJECTS, []); const avgIrr = useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalHeat` | `useMemo(() => filtered.reduce((s, p) => s + p.heatMWh, 0), [filtered]);` |
| `economicsComparison` | `useMemo(() => TECH_AREAS.map(t => {` |
| `electricCost` | `heatDemand * 1000 * elecPrice / t.elecFactor / 1e6;` |
| `gasCost` | `heatDemand * 1000 * gasPrice / 1000 * 0.033 / t.gasFactor;` |
| `carbonSaving` | `t.abatement / 100 * heatDemand * 0.2 * carbonPrice / 1e3;` |
| `netElec` | `electricCost - carbonSaving;` |
| `annualGasCost` | `heatDemand * 1000 * gasPrice / 1000 * 0.033 / t.gasFactor;` |
| `annualElecCost` | `heatDemand * 1000 * elecPrice / t.elecFactor / 1e6;` |
| `annualCarbonSaving` | `t.abatement / 100 * heatDemand * 0.2 * carbonPrice / 1e3;` |
| `netSaving` | `annualGasCost - annualElecCost + annualCarbonSaving;` |
| `capexM` | `t.capex * heatDemand * 1000 / 1e9;` |
| `payback` | `netSaving > 0 ? (capexM / netSaving).toFixed(1) : '∞';` |
| `annualGas` | `heatDemand * 1000 * gasPrice / 1000 * 0.033 / 0.80;` |
| `annualElec` | `heatDemand * 1000 * ep / 0.85 / 1e6;` |
| `netSav` | `annualGas - annualElec + heatDemand * 0.2 * carbonPrice / 1e3;` |
| `capexM2` | `850 * heatDemand * 1000 / 1e9;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `TECH_AREAS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Industrial heat pump COP | `Heat delivered / Electricity input at process temperature` | IEA Industrial Heat Pump Report | COP decreases with higher temperature; <100°C: COP 3–4; 100–200°C: COP 2–3; >200°C: COP <2; above 300°C: not viable. |
| Electric boiler efficiency | `Electrode/resistance type; near-perfect conversion` | IEA Industrial Decarbonisation Roadmap | Fuel switch from gas boiler (90% efficiency) to electric (98%); economics depend entirely on electricity/gas price ratio. |
| EAF energy consumption (MWh/t steel) | `Scrap-based EAF; varies with scrap quality` | worldsteel Energy Use Indicator | EAF uses 0.5–0.65 MWh/t vs BF-BOF indirect electricity of 0.1–0.15 MWh/t; direct emissions near-zero with renewable power. |
- **IEA/IRENA industrial heat data + EAF energy intensity + heat pump COP data** → Payback calculator + ROI sensitivity + temperature profile + grid flexibility model → **Industrial companies evaluating fuel switching, utilities designing demand response, investors in industrial electrification**

## 5 · Intermediate Transformation Logic
**Methodology:** Industrial Electrification Payback
**Headline formula:** `Simple_payback = CAPEX / Annual_savings; Annual_savings = (Fossil_opex − Elec_opex) + Carbon_cost_avoided`

Industrial heat pumps: 2–5yr payback at gas vs electricity ratio <3:1; EAF already economical where scrap available; microwave heating 30–40% energy saving over conventional.

**Standards:** ['IEA Industrial Heat Roadmap 2023', 'IRENA Industrial Electrification Report 2023', 'EU Commission Electrification of Industry Study']
**Reference documents:** IEA (2023) – Industrial Heat Roadmap; IRENA (2023) – Industrial Electrification: Challenges and Solutions; EU Commission (2023) – Electrification of Industry in the European Union

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Clean unit handling, grid-specific carbon intensity, and a real project pipeline (analytics ladder: rung 2 → 3)

**What.** The core economics are genuine — the `TECH_AREAS` table encodes real IEA data (heat-pump `elecFactor = 0.33` ≈ COP 3, electric boilers 0.97) and the payback formula follows the guide — but §7.5 documents three defects: the electric-cost (÷1e6) and gas-cost (×0.033/1000) terms are on **inconsistent unit scales**, making the side-by-side comparison directional only (the §7.4 worked example shows gas at $0.093M vs electric $9.09M — a scale artefact, not economics); the carbon intensity is a single 0.2 tCO₂/MWh scalar rather than fuel/grid-specific; and the 18-project pipeline is `sr()`-seeded (random IRRs 6–16%). Evolution A fixes all three: a dimensional rewrite of the cost comparison into consistent €/MWh-heat terms, grid emission factors per country (the platform's ENTSO-E/EIA ingestion from data-sources wave 1 covers the 7 seeded countries), and the pipeline replaced by documented reference projects from IEA's industrial heat-pump installation lists.

**How.** (1) Refactor `electricCost`/`gasCost` to a common basis: `€/MWh_heat = price / η`, with the COP-vs-temperature relationship (COP 3–4 <100°C, <2 >200°C per §4.1) applied per technology-temperature pairing rather than one static factor. (2) `carbonSaving` uses gas EF 0.184 tCO₂/MWh vs country grid EF, so electrification's carbon case honestly varies by grid — a heat pump in Sweden ≠ one in Germany. (3) Pin a corrected worked example in bench_quant. (4) IRR computed from the corrected cash flows for reference projects, not drawn.

**Prerequisites.** The unit bug acknowledged as a calc defect (candidate for the platform's calc-bug backlog); country grid EFs wired from existing ingestion. **Acceptance:** gas and electric costs render in the same unit and cross at the documented ~3:1 price ratio for heat pumps; carbon saving differs across the 7 countries; zero `sr()` in the pipeline tab.

### 9.2 Evolution B — Fuel-switch screening copilot for industrial energy managers (LLM tier 1 → 2)

**What.** The module's audience asks one repeated question with many parameterisations: "does electrification pay back for my process?" Evolution B answers it conversationally: "120°C drying process, 30 GWh/yr, German prices — heat pump or electric boiler?", "at what gas price does the EAF case break even?", "why is thermal storage's LCOH the lowest at €55/MWh?" Grounding is the `TECH_AREAS` table (temperature ranges are the routing logic — the copilot must first match process temperature to viable technologies, exactly as §4.1's COP-temperature table dictates) plus the corrected economics engine.

**How.** Tier 1: atlas record and slider state as context, explaining the on-screen comparison with the §7.5 unit caveat until Evolution A lands. Tier 2: the corrected calculator exposed as `POST /industrial-electrification/payback` and tool-called for what-ifs and breakeven bisection; every payback figure traces to a tool response. Temperature-viability discipline: asked about a 400°C process, the copilot excludes heat pumps (>300°C not viable per the IEA anchor) before discussing economics — physics screens before finance. Demand-response value questions route to the grid-flexibility tab's framing.

**Prerequisites.** Copilot infrastructure (Phase 1); Evolution A's route for tier 2 (page is currently frontend-only). **Acceptance:** technology recommendations always show the temperature-viability screen; breakeven answers show the bisection points; no payback figure without a tool call or on-screen source.