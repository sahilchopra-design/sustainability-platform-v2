# Blue Hydrogen with CCS Economics
**Module ID:** `blue-hydrogen-ccs` · **Route:** `/blue-hydrogen-ccs` · **Tier:** B (frontend-computed) · **EP code:** EP-DS6 · **Sprint:** DS

## 1 · Overview
Economic and lifecycle analysis of blue hydrogen production via SMR with carbon capture, covering capture cost, CO2 transport and storage, lifecycle emissions versus grey H2, and US 45Q tax credit valuation.

> **Business value:** Blue hydrogen with 90%+ CCS reduces lifecycle emissions to 3-5 kgCO2e/kgH2 versus 10-12 for grey H2; US 45Q credit at $85/tCO2 reduces blue H2 LCOH by $0.4-0.7/kg, making US projects broadly competitive with grey H2 before 2030.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_STORES`, `KpiCard`, `ROUTES`, `Slider`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YEARS` | `Array.from({ length: 11 }, (_, i) => 2025 + i);` |
| `ngCostPerKg` | `gasPrice * ngCons; // €/MWh × MWh/kg` |
| `co2Generated` | `9.0; // kg CO2 per kg H2 (SMR w/o capture)` |
| `co2Captured` | `co2Generated * captureRate / 100;` |
| `co2Stored` | `co2CostPerT => co2Captured * co2CostPerT / 1000;` |
| `escapedCO2` | `co2Generated * (1 - captureRate / 100) + methaneSlip * 28 / 1000; // methane slip × GWP100` |
| `carbonTaxKg` | `escapedCO2 * carbonTax / 1000;` |
| `capexAnn` | `capex * 1000 * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));` |
| `annualTonne` | `250000; // tonne per year reference` |
| `capexPerKg` | `capexAnn / Math.max(1, annualTonne * 1000);` |
| `opexPerKg` | `capex * 1000 * opexPct / 100 / Math.max(1, annualTonne * 1000);` |
| `captured` | `co2Gen * captureRate / 100;` |
| `slip` | `methaneSlip * 28 / 1000;` |
| `routeCompare` | `useMemo(() => ROUTES.map(r => ({` |
| `panelStyle` | `{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };` |
| `gridStyle` | `{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_STORES`, `ROUTES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CO2 Capture Cost | `CAPEX_capture×CRF + OPEX_capture / CO2_captured` | IEA 2023 | Post-combustion amine scrubbing dominates; pre-combustion (IGCC) offers higher capture rates but greater CAPEX |
| Capture Rate | `CO2_captured/CO2_generated` | Global CCS Institute 2023 | 95%+ capture requires advanced solvents and larger equipment; residual emissions from SMR process gas remain. |
| Lifecycle Emissions vs Grey H2 | `LCA boundary: extraction through gate` | IEA Well-to-Gate 2022 | Upstream methane leakage (>2%) can erode blue H2 emission advantage; supply chain integrity critical for lifec |
- **SMR plant operating data** → → emissions intensity model → **tCO2/kgH2 by feedstock quality**
- **45Q credit eligibility** → → project economics → **$/kgH2 tax credit value by capture rate**

## 5 · Intermediate Transformation Logic
**Methodology:** Blue H2 Cost and Emissions
**Headline formula:** `LCOH_blue = LCOH_SMR + CCS_cost($/tCO2) × emission_intensity(tCO2/kgH2)`
**Standards:** ['IEA CCUS in Clean Energy Transitions', 'Global CCS Institute Blue Hydrogen', 'US 45Q Tax Credit Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`