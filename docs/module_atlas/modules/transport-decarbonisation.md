# Transport Decarbonisation
**Module ID:** `transport-decarbonisation` · **Route:** `/transport-decarbonisation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Road, rail, aviation and shipping GHG reduction analytics platform modelling decarbonisation pathways, technology transition costs and policy compliance for transport operators and investors.

> **Business value:** Transport accounts for 21% of global CO2 emissions; road transport electrification is cost-competitive in most markets; maritime and aviation represent the hardest decarbonisation challenges requiring green fuels.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `COUNTRY_CODES`, `COUNTRY_EMISSION_MIX`, `COUNTRY_PROFILES`, `DESTS`, `FINANCE`, `GLEC_CRITERIA`, `INSTRUMENTS`, `ISSUERS`, `LEVERS`, `MODES`, `MODE_COLORS`, `MODE_EMISSIONS_STACK`, `MODE_ICONS`, `MODE_INTENSITY`, `ORIGINS`, `PREFIXES`, `QUARTERLY_MODE_INTENSITY`, `REGULATIONS`, `ROUTES`, `SUFFIXES`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `v=>`${v>=0?'+':''}${v.toFixed(1)}%`;` |
| `MODES` | `['Road Freight','Rail','Maritime','Aviation','Last-Mile','Multimodal'];` |
| `MODE_INTENSITY` | `[62,22,8,602,180,35]; // gCO2e/tkm baseline` |
| `COUNTRY_PROFILES` | `COUNTRIES.map((c,i)=>({` |
| `intensity` | `parseFloat((baseInt*(0.6+sr(i*13)*0.8)).toFixed(1));` |
| `fleet` | `Math.round(50+sr(i*7)*2000);` |
| `annualEmissions` | `Math.round(fleet*intensity*0.4+sr(i*11)*50000);` |
| `decarb2030` | `parseFloat((15+sr(i*19)*45).toFixed(1));` |
| `scope1` | `parseFloat((30+sr(i*23)*30).toFixed(1));` |
| `scope2` | `parseFloat((10+sr(i*29)*20).toFixed(1));` |
| `scope3` | `parseFloat((100-scope1-scope2).toFixed(1));` |
| `revenue` | `Math.round(50+sr(i*31)*2000);` |
| `avgAge` | `parseFloat((3+sr(i*37)*12).toFixed(1));` |
| `utilisation` | `parseFloat((55+sr(i*41)*35).toFixed(0));` |
| `YEARS` | `Array.from({length:16},(_,i)=>2020+i);` |
| `base` | `100+sr(mi*83)*200;` |
| `trend` | `m==='Aviation'?1.02:m==='Road Freight'?0.97:m==='Rail'?0.95:m==='Maritime'?0.98:m==='Last-Mile'?1.01:0.96;` |
| `obj` | `{quarter:`Q${(q%4)+1} ${2022+Math.floor(q/4)}`};` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `COUNTRY_CODES`, `DESTS`, `GLEC_CRITERIA`, `INSTRUMENTS`, `ISSUERS`, `LEVERS`, `MODES`, `MODE_COLORS`, `MODE_ICONS`, `MODE_INTENSITY`, `ORIGINS`, `PREFIXES`, `REGULATIONS`, `SUFFIXES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fleet Average Emissions Intensity | — | Fleet Registry | Fleet-weighted average carbon intensity across all transport modes; benchmark vs regulatory targets. |
| EV Fleet Share | — | Fleet Registry | Proportion of road fleet electrified; target 100% for new sales by 2030–2035 under UK ZEV mandate. |
| SAF Blend Rate | — | Fuel Uplift | Sustainable aviation fuel proportion in aviation fuel uplift; EU ReFuelEU target 2% by 2025. |
- **Fleet Registry, Fuel Consumption Data, Technology Cost Curves** → MAC engine + pathway optimiser + regulatory compliance tracker → **Decarbonisation roadmaps, capex plans, CORSIA/IMO compliance reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Transport Abatement Cost
**Headline formula:** `MAC = ΔCost / ΔEmissions (tCO2e)`
**Standards:** ['ITF Transport Outlook 2023', 'ICAO CORSIA', 'IMO GHG Strategy']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).