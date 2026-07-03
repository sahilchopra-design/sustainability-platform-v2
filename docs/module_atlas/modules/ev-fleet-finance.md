# EV Fleet Finance
**Module ID:** `ev-fleet-finance` · **Route:** `/ev-fleet-finance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models the financial case for electric vehicle fleet transition, computing total cost of ownership, financing structures, residual value projections, and charging infrastructure capex requirements for corporate and public sector fleet operators. Integrates government incentive programmes, carbon price forecasts, and energy price scenarios to produce investment-grade EV transition business cases. Supports green loan frameworks and sustainability-linked financing for fleet electrification.

> **Business value:** Provides fleet managers, CFOs, and sustainability teams with the financial rigour needed to approve EV transition investment decisions, structure green or sustainability-linked financing, and set credible Scope 1 decarbonisation targets aligned with SBTi corporate pathway requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `BatteryEconomicsTab`, `CHARGER_TYPES`, `CHEMISTRIES`, `COUNTRIES`, `Card`, `ChargingInfraTab`, `ChartTip`, `FLEET_NAMES`, `FLEET_TYPES`, `FleetTransitionTab`, `Stat`, `TABS`, `TcoCalculatorTab`, `VEHICLE_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FLEET_TYPES` | `['Logistics','Delivery','Ride-hail','Municipal','Corporate','Rental'];` |
| `VEHICLE_TYPES` | `['Sedan','SUV','Van','Light Truck','Heavy Truck','Bus','2-Wheeler','3-Wheeler','Compact','Minibus','Cargo Van','Pickup'];` |
| `CHEMISTRIES` | `['NMC','LFP','Solid-State','Sodium-Ion'];` |
| `CHARGER_TYPES` | `['L2 AC','DC Fast 50kW','DC Fast 150kW','Ultra-Fast 350kW'];` |
| `type` | `FLEET_TYPES[Math.floor(s*6)];` |
| `country` | `COUNTRIES[Math.floor(s2*20)];` |
| `fleetSize` | `Math.floor(50+s3*4950);` |
| `evPct` | `Math.floor(5+s4*55);` |
| `targetPct` | `Math.min(100,Math.floor(evPct+20+sr(i*19+5)*40));` |
| `annualKm` | `Math.floor(15000+sr(i*23+11)*85000);` |
| `fuelCost` | `Math.floor(500000+sr(i*29+13)*4500000);` |
| `evCost` | `Math.floor(fuelCost*(0.35+sr(i*31+17)*0.3));` |
| `tcoSavings` | `fuelCost-evCost+Math.floor(sr(i*37+19)*500000);` |
| `ice` | `Math.floor((100-evPct)*(0.5+sr(i*41+3)*0.4));` |
| `hybrid` | `100-evPct-ice>0?100-evPct-ice:0;` |
| `bev` | `Math.floor(evPct*(0.7+sr(i*43+7)*0.25));` |
| `vType` | `VEHICLE_TYPES[Math.floor(s*12)];` |
| `annualKm` | `Math.floor(10000+s2*90000);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHARGER_TYPES`, `CHEMISTRIES`, `COUNTRIES`, `FLEET_NAMES`, `FLEET_TYPES`, `TABS`, `VEHICLE_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EV vs. ICE TCO Gap (Â£/vehicle/year) | — | BloombergNEF/ICCT | Annual TCO difference between EV and ICE equivalent; typically EV TCO parity achieved by 2024â€“2026 for most  |
| Fleet Decarbonisation Rate (tCO2e saved/year) | — | DEFRA EV Emission Factors | Annual GHG savings from electrification vs. ICE baseline; primary metric for sustainability-linked loan target |
| Charging Infrastructure Capex (Â£/vehicle) | — | OZEV Infrastructure Assessment | Capital cost of AC/DC charging infrastructure per fleet vehicle; varies from Â£500 (AC7kW) to Â£15,000+ (DC150 |
| Payback Period (years) | — | NPV Model | Number of years for cumulative EV TCO savings to recover incremental capex vs. ICE fleet continuation. |
- **Fleet management system (vehicle specs, mileage, fuel data)** → Map each vehicle to EV equivalent; compute current ICE total running cost per vehicle type → **ICE baseline TCO by vehicle segment (Â£/vehicle/year)**
- **OEM EV pricing and charging infrastructure quotes** → Input capex, battery warranty, OBC power, and charge time; compute depreciation and financing cost → **EV capex and depreciation schedule per vehicle type**
- **DEFRA emission factors and energy price forecasts** → Apply electricity grid carbon factor trajectory; compute annual GHG savings at vehicle level → **Fleet decarbonisation trajectory (tCO2e) and carbon savings value at forward carbon price**

## 5 · Intermediate Transformation Logic
**Methodology:** EV Fleet TCO Model
**Headline formula:** `TCO_EV = Capex + PV(Energy) + PV(Maintenance) − PV(Incentives) − PV(CarbonSavings) − RV`
**Standards:** ['IEA Global EV Outlook 2024', 'BloombergNEF EV Market Outlook 2024', 'ICCT EV Ownership Cost Analysis 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).