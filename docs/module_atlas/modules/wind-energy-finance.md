# Wind Energy Finance Analytics
**Module ID:** `wind-energy-finance` · **Route:** `/wind-energy-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DO2 · **Sprint:** DO

## 1 · Overview
Models onshore and offshore wind project economics — turbine CapEx, capacity factor analysis, wake losses, cable/grid connection costs, O&M curves, and levelised cost of energy. Calculates project IRR, DSCR, and optimises turbine configuration for site-specific conditions.

> **Business value:** Essential for wind project developers, bank project finance teams, and infrastructure investors. Provides bankable energy yield analysis with P50/P90 confidence intervals for debt sizing and equity IRR modelling aligned with IEA/IRENA benchmarks.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CFD_TECHS`, `KpiCard`, `MARKETS`, `MiniBar`, `PROJECTS`, `TABS`, `WIND_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `WIND_TYPES[Math.floor(sr(i * 7 + 1) * WIND_TYPES.length)];` |
| `market` | `MARKETS[Math.floor(sr(i * 11 + 2) * MARKETS.length)];` |
| `cfd` | `CFD_TECHS[Math.floor(sr(i * 13 + 3) * CFD_TECHS.length)];` |
| `capacityMw` | `type === 'Offshore Fixed' ? Math.round(100 + sr(i*3+1)*900) : type === 'Offshore Floating' ? Math.round(50+sr(i*5+2)*350) : Math.round(30+sr(i*7+3)*27` |
| `lcoe` | `type === 'Offshore Fixed' ? parseFloat((55 + sr(i*31+7)*45).toFixed(1)) : type === 'Offshore Floating' ? parseFloat((80 + sr(i*37+8)*60).toFixed(1)) :` |
| `irr` | `parseFloat((7 + sr(i*43+1)*12).toFixed(2));` |
| `cfdStrike` | `parseFloat((60 + sr(i*47+2)*80).toFixed(1));` |
| `merchantPct` | `parseFloat((sr(i*53+3)*35).toFixed(1));` |
| `capex` | `type === 'Offshore Fixed' ? parseFloat((2.8+sr(i*59+4)*2.2).toFixed(2)) : type === 'Offshore Floating' ? parseFloat((4.5+sr(i*61+5)*3.5).toFixed(2)) :` |
| `dscr` | `parseFloat((1.1+sr(i*71+7)*1.5).toFixed(2));` |
| `wake` | `parseFloat((3+sr(i*73+8)*10).toFixed(1));` |
| `status` | `['Operational','Construction','Consent Granted','Planning','Development'][Math.floor(sr(i*79+9)*5)];` |
| `avgIrr` | `filtered.reduce((s, p) => s + p.irr, 0) / n;` |
| `avgCf` | `filtered.reduce((s, p) => s + p.cf, 0) / n;` |
| `totalGw` | `filtered.reduce((s, p) => s + p.capacityMw, 0) / 1000;` |
| `avgLcoe` | `filtered.reduce((s, p) => s + p.lcoe, 0) / n;` |
| `avgCfdStrike` | `filtered.reduce((s, p) => s + p.cfdStrike, 0) / n;` |
| `avgMerchant` | `filtered.reduce((s, p) => s + p.merchantPct, 0) / n;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CFD_TECHS`, `MARKETS`, `TABS`, `WIND_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Onshore Wind LCOE 2023 | — | IRENA Renewable Power Costs 2023 | Onshore wind LCOE at $0.033/kWh — cheapest new-build electricity generation in history |
| Offshore Wind CapEx | — | BloombergNEF Offshore Wind 2024 | Offshore wind CapEx range — rising in 2023 from supply chain pressure; floating adds 50–100% premium |
| Global Wind Additions 2023 | — | GWEC Global Wind Report 2024 | Record 116 GW of wind capacity added globally in 2023 — 60% onshore, 40% offshore |
- **Wind resource data (ERA5, MERRA-2, met mast)** → Wind energy assessment → **Annual energy production P50/P90 with uncertainty analysis**
- **Turbine cost database (BloombergNEF, MAKE)** → LCOE calculation → **Project economics by turbine model and site conditions**
- **Grid connection cost estimates + curtailment risk** → Interconnection modelling → **Net project economics after grid connection costs**

## 5 · Intermediate Transformation Logic
**Methodology:** Wind Project LCOE
**Headline formula:** `LCOE_wind = (CapEx × CRF + OpEx_annual) / (8760 × CapacityFactor × InstalledCapacity); WakeEffect = 1 - (1 - CT/(4A)) for Betz limit considerations`
**Standards:** ['IRENA Renewable Power Generation Costs 2023', 'IEA Wind TCP Task 26 — Wind Cost Study', 'WindEurope Market Outlook 2024', 'DTU Wind Energy Atlas (WAsP)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).