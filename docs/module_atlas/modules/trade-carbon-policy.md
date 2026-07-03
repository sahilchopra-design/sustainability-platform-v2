# Trade Carbon Policy
**Module ID:** `trade-carbon-policy` · **Route:** `/trade-carbon-policy` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Carbon border adjustment and trade policy analytics platform modelling CBAM impact on import costs, supply chain competitiveness and trade flow shifts under EU CBAM and emerging global equivalents.

> **Business value:** EU CBAM entered transitional phase in October 2023 with full financial obligations from 2026; affected imports represent ≊€69 billion annually; steel and aluminium sectors face the largest immediate exposures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CBAM_IMPORTERS`, `CBAM_SECTORS`, `COLORS`, `COUNTRIES_40`, `COUNTRY_POLICIES`, `IMP_NAMES`, `TRADE_FLOWS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COUNTRY_POLICIES` | `COUNTRIES_40.map((c,i)=>{` |
| `from` | `COUNTRIES_40[Math.floor(s1*20)+10];` |
| `pagedImporters` | `filteredImporters.slice(compPage*PAGE_SIZE,(compPage+1)*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filteredImporters.length/PAGE_SIZE);` |
| `headers` | `['Company','Sector','Country','Volume Tons','Emissions tCO2/t','CBAM Cost $M','Default Value','Actual Emissions','Compliance','Reporting Gap','Cost Pa` |
| `rows` | `filteredImporters.map(c=>[c.name,c.sector,c.country,c.importVolumeTons,c.embeddedEmissions,c.adjustedCost,c.defaultValue,c.actualEmissions,c.complianc` |
| `blob` | `new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);` |
| `totalCost` | `CBAM_IMPORTERS.reduce((a,c)=>a+c.cbamCostMn*(p/80),0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CBAM_IMPORTERS`, `CBAM_SECTORS`, `COLORS`, `COUNTRIES_40`, `IMP_NAMES`, `TRADE_FLOWS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Estimated Annual CBAM Liability | — | CBAM Model | Projected annual carbon border adjustment cost on imports of CBAM-covered goods at current ETS prices. |
| CBAM-Exposed Import Value | — | Trade Data | Value of imports in CBAM-covered sectors (steel, cement, aluminium, fertilisers, electricity, hydrogen). |
| Origin Country Carbon Price Gap | — | ICAP Carbon Price Survey | Average gap between EU ETS price and carbon price paid in exporting countries; determines CBAM surcharge. |
- **Import Customs Data, Embedded Emissions Certificates, EU ETS Price Feed** → CBAM liability engine + supply chain restructuring model + trade flow analytics → **CBAM liability reports, supply chain optimisation scenarios, regulatory compliance filings**

## 5 · Intermediate Transformation Logic
**Methodology:** CBAM Liability
**Headline formula:** `CBAM = (Embedded CO2 – Carbon Price Paid) × EU ETS Price`
**Standards:** ['EU CBAM Regulation 2023/956', 'EU ETS Directive 2003/87/EC']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).