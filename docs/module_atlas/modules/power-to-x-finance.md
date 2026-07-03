# Power-to-X Project Finance
**Module ID:** `power-to-x-finance` · **Route:** `/power-to-x-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DS5 · **Sprint:** DS

## 1 · Overview
Project finance for Power-to-X conversion chains: green H2 to green ammonia, methanol, e-SAF and direct reduced iron, with EU subsidy modelling and carbon credit revenue stacking.

> **Business value:** Power-to-X economics require EU H2Global subsidies plus carbon credit revenue to reach bankable IRR of 8-10%; e-SAF and green ammonia are the nearest-term bankable PtX applications given EU regulatory mandates through 2035.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CO2_SOURCES`, `HHV_H2`, `KpiCard`, `LHV_H2`, `PTX_PRODUCTS`, `Slider`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `LHV_H2` | `33.3;   // kWh/kg` |
| `HHV_H2` | `39.4;   // kWh/kg` |
| `YEARS` | `Array.from({ length: 11 }, (_, i) => 2025 + i);` |
| `h2Cost` | `lcohEur * h2Kg;` |
| `co2CostKg` | `(co2Cost / 1000) * co2Kg;` |
| `elecCostKg` | `elecCost / 1000 * elecKwh;` |
| `capexAnnKg` | `(capexPerTpa * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime)));` |
| `opexKg` | `capexPerTpa * opexPct / 100;` |
| `allLcop` | `useMemo(() => PTX_PRODUCTS.map(p => ({` |
| `demandData` | `useMemo(() => YEARS.map((y, i) => ({` |
| `co2Projection` | `useMemo(() => YEARS.map((y, i) => {` |
| `ghgData` | `PTX_PRODUCTS.map((p, i) => ({` |
| `panelStyle` | `{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };` |
| `gridStyle` | `{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CO2_SOURCES`, `PTX_PRODUCTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Ammonia LCOP | `LCOH($/kgH2)×0.178+Haber-Bosch CAPEX` | IRENA 2022 | Green NH3 at $800/t is 2-3× grey NH3 at $250-350/t; requires $400-600/t carbon price or subsidy for parity. |
| e-SAF Production Cost | `LCOH×H2_intensity+CO2_capture+FT_CAPEX` | ICAO CORSIA | e-SAF is 3-5× conventional jet fuel; EU mandate 2% by 2030, 6% by 2035 creates guaranteed demand. |
| H2Global Subsidy Impact | `Subsidy = (offtake_price - import_price) × volume` | EU H2Global 2023 | EU H2Global auction mechanism bridges import/offtake price differential; first auctions cleared 2023. |
- **EU subsidy auction results** → → revenue model → **Clearing price and volume by PtX product**
- **Carbon credit price curve** → → revenue stacking model → **VCM and compliance price by year**

## 5 · Intermediate Transformation Logic
**Methodology:** PtX Conversion Chain Economics
**Headline formula:** `PtX_LCOP = LCOH × conversion_ratio + CAPEX_converter×CRF/output + OPEX`
**Standards:** ['IRENA Innovation Outlook: Electrofuels', 'EU Innovation Fund Guidelines', 'Hydrogen Council PtX Roadmap']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`