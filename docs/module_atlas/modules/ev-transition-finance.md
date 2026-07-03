# EV Transition Finance
**Module ID:** `ev-transition-finance` · **Route:** `/ev-transition-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DF5 · **Sprint:** DF

## 1 · Overview
Analyses the financial implications of electric vehicle adoption for automotive OEMs, fleet operators, charging infrastructure investors, and auto lenders. Models ICE stranded asset risk, EV profitability curves, charging infrastructure NPV, and auto loan portfolio climate transition exposure.

> **Business value:** Directly applicable to auto lenders (ECB climate risk guidance), automotive OEM investors, fleet managers, and charging infrastructure funds. Quantifies ICE stranded asset risk in auto loan books, enables EV TCO advisory for fleet clients, and provides charging network investment analytics.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BATTERY_CURVE`, `CHARGER_TYPES`, `Card`, `FLEETS`, `GEOS`, `KpiCard`, `OEM_DATA`, `POWERTRAIN`, `SEGMENTS`, `TABS`, `TCO_BASE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits:0 });` |
| `SEGMENTS` | `['Passenger Car','Light Commercial (LCV)','Heavy Goods (HGV)','Bus & Coach','2-Wheeler','Van'];` |
| `CHARGER_TYPES` | `['Level 2 (7kW)','DC Fast (50kW)','Ultra-Rapid (150kW)','HPC (350kW)'];` |
| `seg` | `SEGMENTS[Math.floor(sr(i*7)*SEGMENTS.length)];` |
| `geo` | `GEOS[Math.floor(sr(i*11)*GEOS.length)];` |
| `fleetSz` | `Math.round(50 + sr(i*13)*4950);` |
| `evPct` | `Math.round(5 + sr(i*17)*80);` |
| `iceUnits` | `Math.round(fleetSz*(1-evPct/100));` |
| `bevUnits` | `fleetSz - iceUnits;` |
| `tcoBEV` | `base.bevPrice + (base.fuelBEV*5) + (base.maintBEV*5) - (base.bevPrice*base.residBEV);` |
| `tcoICE` | `base.icePrice + (base.fuelICE*5) + (base.maintICE*5) - (base.icePrice*base.residICE);` |
| `strandedValue` | `iceUnits * base.icePrice * (1 - evPct/100) * 0.25; // £k` |
| `zevMandateGap` | `Math.max(0, 80 - evPct); // % gap to 2035 mandate` |
| `capexNeeded` | `bevUnits * (base.bevPrice - base.icePrice); // £k incremental capex` |
| `chargerInfra` | `Math.round(bevUnits / 4); // charger count (1:4 ratio)` |
| `tcoBySegment` | `useMemo(() => SEGMENTS.map(seg => {` |
| `elecAdj` | `energyPx / 0.28; // scale by electricity price vs base` |
| `fuelAdj` | `fuelPx   / 1.65;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BATTERY_CURVE`, `CHARGER_TYPES`, `GEOS`, `OEM_DATA`, `POWERTRAIN`, `SEGMENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global EV Sales Share 2023 | — | IEA Global EV Outlook 2024 | EVs reached 18% of new car sales globally in 2023; China 38%, Europe 25%, US 9% |
| TCO Parity Year | — | BloombergNEF EV Market Outlook 2024 | EV total cost of ownership parity with ICE equivalent — varies by segment and market |
| Charging Infrastructure Gap | — | IEA Net Zero 2023 | Current global public chargers: 2.7M — 5× scale-up required for IEA Net Zero scenario |
- **Vehicle sales data + loan origination by segment** → TCO and stranding risk calculation → **Portfolio exposure to ICE stranded assets by maturity year**
- **Charging infrastructure utilisation and tariff data** → Charging NPV modelling → **IRR and payback for public charging network investment**
- **EV adoption curve by market and policy scenario** → Fleet transition planning → **Optimal fleet electrification schedule by cost minimisation**

## 5 · Intermediate Transformation Logic
**Methodology:** EV Total Cost of Ownership
**Headline formula:** `TCO_EV = CapEx_EV + Σ[(EnergyCost_t + Maint_t + Insurance_t - ResidualValue_t)] / (1+r)^t; ICE_StrandingRisk = max(0, RemainingLoanLife - EVParityYear)`
**Standards:** ['IEA Global EV Outlook 2024', 'BloombergNEF EV Market Outlook 2024', 'IPCC AR6 WGIII Chapter 10 — Transport', 'ECB Working Paper — Auto Loan Climate Risk']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `CleanTechAdvancedAnalytics`