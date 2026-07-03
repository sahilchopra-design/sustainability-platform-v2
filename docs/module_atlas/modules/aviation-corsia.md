# Aviation CORSIA
**Module ID:** `aviation-corsia` · **Route:** `/aviation-corsia` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ICAO CORSIA compliance analytics covering emission unit requirement calculation, eligible emission unit (EEU) procurement strategy, sector growth factor monitoring, and airline-level offsetting obligation tracking. Models Phase 1 (2024–2026), Phase 2 (2027–2035) obligations and supports SAF credit integration as a CORSIA compliance pathway.

> **Business value:** CORSIA is projected to generate demand for 1.5–1.8 billion tonnes of carbon offsets between 2024 and 2035, making it one of the largest compliance-driven carbon market mechanisms. Airlines with proactive SAF blending and EEU procurement strategies can reduce compliance costs materially versus spot-market procurement at the time of obligation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AIRCRAFT_TYPES`, `AIRLINE_NAMES`, `AirlineDrawer`, `COMPLIANCE_STATUSES`, `CORSIA_PHASES`, `CorsiaComplianceTab`, `CustomTooltip`, `FleetEmissionsTab`, `IATA_CODES`, `InvestmentRiskTab`, `REGIONS`, `REGION_COLORS`, `SAF_MANDATE_TRAJECTORY`, `SafFuelsTab`, `TABS`, `TOP_AIRPORTS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Europe','N.America','Asia-Pacific','Middle East','LATAM','Africa'];` |
| `REGION_COLORS` | `{'Europe':T.navy,'N.America':T.navyL,'Asia-Pacific':T.sage,'Middle East':T.gold,'LATAM':'#8b5cf6','Africa':'#e17055'};` |
| `AIRCRAFT_TYPES` | `['Narrow-body','Wide-body','Regional Jet','Turboprop','Freighter','Bizjet','Next-gen','Electric'];` |
| `CORSIA_PHASES` | `['Pilot (2024-26)','Phase 1 (2027-35)','Mandatory'];` |
| `COMPLIANCE_STATUSES` | `['Compliant','Partial','Non-compliant','Exempt'];` |
| `b2019` | `annualCO2 * baseline2019_factor;` |
| `b2020` | `annualCO2 * baseline2020_factor; // 2020 was ~60% of 2019 due to COVID` |
| `baseline` | `(b2019 + b2020) / 2;` |
| `regionIdx` | `Math.floor(sr(i*13+1)*6);` |
| `fleetSize` | `Math.floor(40+sr(i*11+2)*460);` |
| `annualCO2` | `parseFloat((fleetSize*0.018+sr(i*19+5)*8).toFixed(2));` |
| `b2020_factor` | `0.4 + sr(i*89+4)*0.25;` |
| `offsetReq` | `corsiaOffset; // replaces random offsetReq` |
| `safPct` | `parseFloat((sr(i*37+9)*12).toFixed(1));` |
| `fleetAge` | `parseFloat((5+sr(i*41+6)*20).toFixed(1));` |
| `emissionsIntensity` | `parseFloat((55+sr(i*43+8)*65).toFixed(1));` |
| `riskScore` | `parseFloat((20+sr(i*67+3)*75).toFixed(0));` |
| `techs` | `['HEFA','Fischer-Tropsch','Alcohol-to-Jet','e-Kerosene','Power-to-Liquid'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AIRCRAFT_TYPES`, `AIRLINE_NAMES`, `COMPLIANCE_STATUSES`, `CORSIA_PHASES`, `FLEET_COLORS`, `IATA_CODES`, `PHASE_COLORS`, `REGIONS`, `SAF_MANDATE_TRAJECTORY`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CORSIA Baseline | — | ICAO CORSIA MRV | Industry emission baseline against which growth above which must be offset |
| Sector Growth Factor | `Sector_yr / Sector_baseline` | ICAO annual reporting | Fraction of total sector emission growth requiring offsetting; <1 in 2020/2021 |
| EEU Price | — | Voluntary carbon market | Price of CORSIA-eligible emission units from approved VCS/Gold Standard/REDD+ programmes |
- **ICAO CORSIA MRV system (airline emission reports)** → Calculate sector growth factor and per-airline offsetting obligation → **EEU requirement schedule per airline and phase**
- **Voluntary carbon market EEU price feeds** → Optimise EEU procurement mix for cost minimisation subject to CORSIA eligibility → **Procurement strategy and total compliance cost estimate**

## 5 · Intermediate Transformation Logic
**Methodology:** CORSIA offsetting obligation model
**Headline formula:** `Offset_req = (Airline_emissions_yr – Airline_emissions_baseline) × Sector_growth_factor; Baseline = avg(2019,2020) emissions`
**Standards:** ['ICAO CORSIA Standards & Recommended Practices', 'ICAO Doc 9501 Vol IV', 'IATA SAF Registry']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).