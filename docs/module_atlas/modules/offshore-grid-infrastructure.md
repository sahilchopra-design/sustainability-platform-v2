# Offshore Grid & Cable Infrastructure Analytics
**Module ID:** `offshore-grid-infrastructure` · **Route:** `/offshore-grid-infrastructure` · **Tier:** B (frontend-computed) · **EP code:** EP-DR4 · **Sprint:** DR

## 1 · Overview
Engineering economics analytics for offshore wind grid connection covering AC vs HVDC technology selection, cable sizing and loss calculation, offshore substation platform design, grid code compliance by country, reliability and outage modelling, congestion and curtailment risk, and offshore hub topology design across 18 analytical tabs.

> **Business value:** Designed for offshore wind grid engineers, project developers, and transmission system operators evaluating offshore grid connection strategy. Covers the full grid infrastructure decision stack from cable sizing and AC vs HVDC selection through offshore substation design, grid code compliance, and reliability modelling — replacing the combination of PSCAD/DIgSILENT simulations and Excel cost models typically used in pre-FEED offshore grid studies.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CABLE_VOLTAGES`, `CONDUCTOR_DATA`, `CONDUCTOR_MATERIALS`, `COUNTRIES`, `ChartBox`, `EXPORT_TYPES`, `GRID_VOLTAGES`, `KpiCard`, `PLATFORM_TYPES`, `Section`, `SideInput`, `SideSelect`, `TABS`, `TENDER_DATA`, `Table`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `currentkA` | `voltagekV > 0 ? powerMW / (Math.sqrt(3) * voltagekV) : 0;` |
| `lossKw` | `3 * Math.pow(currentkA * 1000, 2) * resistancePerkm / 1e6 * lengthkm;` |
| `lossPct` | `powerMW > 0 ? lossKw / (powerMW * 1000) * 100 : 0;` |
| `hvdcLoss` | `1.4 + 0.0020 * km;` |
| `result` | `cableLoss(capacityMW / numCables, exportVoltage, resistance, distanceKm);` |
| `annualGenGWh` | `capacityMW * (loadFactor / 100) * 8760 / 1000;` |
| `annualEnergyLossGWh` | `annualGenGWh * lossPct / 100;` |
| `ppaPriceMWh` | `55 + sr(capacityMW * 3) * 30;` |
| `annualRevenueLossM` | `annualEnergyLossGWh * ppaPriceMWh / 1000;` |
| `cableLengthM` | `distanceKm * 1000 * numCables * 1.08;` |
| `cableSupplyCostM` | `cableLengthM * cableCostPerM / 1e6;` |
| `installationCostM` | `distanceKm * numCables * 0.8;` |
| `totalCableCostM` | `cableSupplyCostM + installationCostM;` |
| `onshoreSsCostM` | `substationCostM * 0.6 + landCostM;` |
| `offshoreSsCostM` | `platformCostM * numPlatforms;` |
| `totalCapexM` | `totalCableCostM + onshoreSsCostM + offshoreSsCostM;` |
| `expectedFaults` | `faultPer100 * distanceKm * numCables / 100;` |
| `repairHours` | `repairDays * 24;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CABLE_VOLTAGES`, `CONDUCTOR_DATA`, `CONDUCTOR_MATERIALS`, `COUNTRIES`, `EXPORT_TYPES`, `GRID_VOLTAGES`, `MONTHS`, `PIE_COLORS`, `PLATFORM_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cable Loss (AC 132kV) | `P_loss = 3I²R×L / P_rated` | IEC 60228 | 66kV array cable: ~0.5% per km; 132kV export: ~0.3% per km; 220kV export: ~0.15% per km; HVDC export: ~0.003%/ |
| HVDC Breakeven Distance | `AC total cost = HVDC total cost` | HVDC converter + cable cost model | HVDC economically superior beyond ~80km at 1GW; at 500MW: ~100km; at 2GW: ~60km; DC cost higher at short dista |
| Grid CAPEX (%) | `Cable + substation + connection` | Project finance breakdown | Offshore substation (jacket platform + transformers): $150–400M; export cable supply + install: $0.5–2M/km (33 |
| Cable Reliability | `Industry fault rate (CIGRÉ TB 379)` | Cable joint + HDD failure data | HVDC submarine cable: ~0.08 faults/100km/yr; repair takes 30–90 days; N-1 redundancy (spare cable) costs 20–40 |
| Offshore Substation | `Platform + transformer + secondary systems` | Engineering cost studies | Jacket platform (20–60m): $150–250M; includes GIS 220/33kV transformers, reactive compensation, protection, co |
| Grid Code Compliance | `Frequency range, reactive power, FRT, ROCOF` | ENTSO-E / UK Grid Code / NERC | Key requirements: fault ride-through (0.25s at 0V), reactive power capability Q/P ≥ 0.33, ROCOF immunity (UK:  |
- **Farm capacity, distance, voltage level → cable cross-section sizing (thermal + voltage drop), cable type selection** → AC cable loss: I²R; HVDC loss: terminal + 0.003%/km; total loss comparison → **Cable loss %, annual GWh loss, revenue impact, AC vs HVDC recommendation**
- **Fault rate per 100km, MTTR, load factor → MTBF model** → Availability = 1 − (fault_rate × MTTR/8760) → **Fleet availability %, annual energy not delivered, revenue risk from outage**
- **Country grid code requirements (UK/EU/US/TW) + project parameters** → Compliance check against requirements → **Grid code compliance status, required reactive power range, frequency response capability**

## 5 · Intermediate Transformation Logic
**Methodology:** Cable Loss (I²R) + AC vs HVDC Breakeven + Availability (MTBF) Model
**Headline formula:** `P_loss = 3I²R×L; I = P/(√3×V); HVDC_loss = P_terminal + α×L; Breakeven: L* = (P_terminal − ΔP_terminal) / (R_AC − R_HVDC); Availability = 1 − f_fault × MTTR / 8760`
**Standards:** ['ENTSO-E Network Code RfG', 'UK Grid Code (National Grid ESO)', 'IEC 60228 — Conductors for Insulated Cables', 'IEEE 1885-2023 Offshore Wind']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).