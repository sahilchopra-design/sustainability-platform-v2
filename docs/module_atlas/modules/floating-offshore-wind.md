# Floating Offshore Wind LCOE & Technology Analytics
**Module ID:** `floating-offshore-wind` · **Route:** `/floating-offshore-wind` · **Tier:** B (frontend-computed) · **EP code:** EP-DR2 · **Sprint:** DR

## 1 · Overview
Comprehensive floating offshore wind (FOW) technology and economics analytics. Covers LCOE breakdown by floater concept (Spar-Buoy, Semi-submersible, TLP, Barge), mooring system design, EPCI cost modelling, learning curve trajectory, supply chain risks, CfD/PPA structuring for deep-water sites, and country-by-country policy comparison across 18 analytical tabs.

> **Business value:** Designed for offshore wind developers evaluating floating wind feasibility, infrastructure fund investment committees, and policy makers designing CfD auction parameters. Covers the full LCOE and technology assessment for a floating offshore wind project — from floater concept selection and mooring design through EPCI planning, CfD structuring, and supply chain risk — in a unified 18-tab analytical environment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `FLOATER_CONCEPTS`, `KpiCard`, `MONTHS`, `SUPPLY_CHAIN`, `SectionHeader`, `SelectRow`, `SliderRow`, `TABS`, `TRL_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annualAEP` | `capacityMW * 1000 * (cfPct / 100) * 8760;` |
| `totalCapex` | `capexPerKw * capacityMW * 1000;` |
| `npvOpex` | `Array.from({ length: life }, (_, i) => opexPerKwYr * capacityMW * 1000 / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);` |
| `npvAEP` | `Array.from({ length: life }, (_, i) => annualAEP / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);` |
| `npv` | `cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);` |
| `dnpv` | `cashFlows.reduce((acc, cf, t) => acc - t * cf / Math.pow(1 + rate, t + 1), 0);` |
| `newRate` | `rate - npv / dnpv;` |
| `rotorDiameter` | `useMemo(() => Math.round(Math.sqrt(turbineRating / 15) * 236), [turbineRating]);` |
| `base` | `capexFloater + capexMooring + capexTurbine + capexInstall + capexGrid;` |
| `distAdj` | `1 + (distanceShore - 80) * 0.0015;` |
| `depthAdj` | `1 + (waterDepth - 200) * 0.0005;` |
| `conceptAdj` | `floaterConcept === 'Spar-Buoy' ? 1.0 : floaterConcept === 'Semi-submersible' ? 1.05 : floaterConcept === 'Tension Leg Platform' ? 1.15 : 1.25;` |
| `base` | `38 + (latitude - 50) * 0.4 + (hubHeight - 120) * 0.05 - seaState * 0.5;` |
| `lcoe` | `useMemo(() => calcLCOE(capexPerKw, opex, farmCapacity, cfPct, projectLife, discountRate / 100), [capexPerKw, opex, farmCapacity, cfPct, projectLife, d` |
| `totalCapexM` | `useMemo(() => Math.round(capexPerKw * farmCapacity * 1000 / 1e6), [capexPerKw, farmCapacity]);` |
| `annualAEP` | `useMemo(() => Math.round(farmCapacity * (cfPct / 100) * 8760 / 1000), [farmCapacity, cfPct]);` |
| `capexTotal` | `capexPerKw * farmCapacity * 1000;` |
| `annualRev` | `annualAEP * 1000 * (strikePrice / 1000);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `FLOATER_CONCEPTS`, `MONTHS`, `SUPPLY_CHAIN`, `TABS`, `TAB_RENDERERS`, `TRL_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOE (floating, 2024) | `CAPEX + NPV(OPEX) / NPV(AEP)` | Industry benchmarks 2024 | vs $60–90/MWh for fixed-bottom offshore; declining at 12–18%/yr as supply chain scales; target $60–80/MWh by 2 |
| CAPEX (floating) | `Turbine + floater + mooring + installation + grid` | WindEurope/NREL 2024 | Hywind Scotland: ~$5,500/kW (2017 pioneer); Kincardine: ~$4,200/kW; target <$3,000/kW by 2030 with supply chai |
| Water Depth Range | `Spar: >80m; Semi-sub: 60–2,000m; TLP: 50–500m` | DNV floater selection guide | Fixed-bottom limited to ~60m; floating unlocks 80% of global offshore wind resource in waters >60m depth |
| Mooring Cost | `Chain/wire/polyester mooring × lines × depth` | Mooring supplier data | Catenary mooring: heavier but cheaper at moderate depth; taut-leg: smaller footprint, requires anchors; polyes |
| EPCI Cost Share | `Tow-out (self-install!) vs crane-based` | Floating advantage | Key advantage of floating: turbines assembled at quayside, towed to site (no expensive offshore crane vessel); |
| CfD Strike (floating) | `UK AR5 2024 allocation round` | DESNZ 2024 | UK Allocation Round 5 (2024): floating offshore wind strike price ~£225/MWh; France (Bretagne): €200–225/MWh;  |
- **Site depth/distance + floater concept → CAPEX $/kW model (turbine + floater + mooring + EPCI + grid)** → LCOE = (CAPEX + NPV(OPEX)) / NPV(AEP) → **LCOE by component, IRR, NPV**
- **Cumulative FOW deployed capacity (2024 baseline: ~0.5 GW) + learning rate** → Wright learning curve: LCOE(n) = LCOE₀ × n^(−b) → **LCOE trajectory to 2040, cost reduction per doubling**
- **CfD strike price vs reference market price (seeded by country)** → Settlement = (strike − spot) × gen; NPV over CfD term → **CfD value, IRR under CfD vs merchant**

## 5 · Intermediate Transformation Logic
**Methodology:** LCOE Learning Curve + Floater CAPEX Model + CfD Contract Analytics
**Headline formula:** `LCOE = (CAPEX + NPV(OPEX)) / NPV(AEP); Floater_CAPEX = Turbine + Hull + Mooring + EPCI + Grid; Learning: LCOE(n) = LCOE₀ × n^(-b), b=log₂(LR)`
**Standards:** ['IEA Wind TCP Task 37', 'DNV Energy Transition Outlook 2024', 'WindEurope Floating Offshore 2030']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).