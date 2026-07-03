# Conflict Minerals Compliance
**Module ID:** `conflict-minerals` · **Route:** `/conflict-minerals` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
SEC Rule 13p-1 (3TG) and EU Conflict Minerals Regulation compliance for tin, tantalum, tungsten, and gold. Covers RMAP smelter certification, supply chain traceability, and OECD 5-step framework.

> **Business value:** Conflict minerals due diligence is mandatory for SEC-registered companies and EU importers of 3TG minerals. Non-compliance risks SEC sanctions, customer contract loss, and reputational damage. This module provides the OECD 5-step framework automation needed for efficient annual compliance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANY_NAMES`, `COUNTRIES`, `Card`, `DueDiligenceCompliance`, `KPI`, `MINERALS`, `MineralRiskDashboard`, `RECYCLING_FACILITIES`, `SMELTER_NAMES`, `StrategicFinancialImpact`, `SupplyChainMapping`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COMPANY_NAMES` | `['Tesla','Apple','Samsung','BYD','CATL','Panasonic','LG Energy','SK Innovation','BMW','Volkswagen','Mercedes-Benz','Toyota','Ford','GM','Stellantis','` |
| `SMELTER_NAMES` | `['Jiangxi Copper Smelter','Umicore Belgium','LS-Nikko Copper','PT Timah','Thaisarco','Malaysia Smelting','Minsur Peru','Alpha Tungsten','Wolfram Bergb` |
| `genMinerals` | `()=>MINERALS.map((m,i)=>{` |
| `supplyRisk` | `sn(i*100+1,35,95);` |
| `hhi` | `sn(i*100+2,1200,8500);` |
| `priceVol` | `sn(i*100+3,8,55);` |
| `recycRate` | `sn(i*100+4,2,65);` |
| `demandGrowth` | `sn(i*100+5,3,28);` |
| `reserveYrs` | `si(i*100+30,8,120);` |
| `prodTonnes` | `si(i*100+31,500,500000);` |
| `countries` | `COUNTRIES.slice(0,si(i*100+6,4,10)).map((c,j)=>({` |
| `totalShare` | `countries.reduce((s,c)=>s+c.share,0);` |
| `topProducers` | `countries.slice(0,3).map(c=>c.country);` |
| `genCompanies` | `()=>COMPANY_NAMES.map((name,i)=>{` |
| `sector` | `sp(['Automotive','Electronics','Mining','Battery','Industrial','Semiconductor','Components','Chemicals'],i*200+1);` |
| `revenue` | `sn(i*200+2,500,250000);` |
| `marketCap` | `revenue*(sn(i*200+60,1.5,8));` |
| `exposure` | `MINERALS.map((m,j)=>({mineral:m.id,name:m.name,level:sn(i*200+j*17+3,0,100)>60?sn(i*200+j*17+4,10,100):0}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_NAMES`, `COUNTRIES`, `MINERALS`, `RECYCLING_FACILITIES`, `SMELTER_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 3TG Minerals | — | SEC/EU | Tin, tantalum, tungsten, gold — conflict mineral scope |
| RMAP Certified Smelters | — | RMI | Responsible Minerals Initiative certified facilities |
| CAHRA Coverage | — | OECD | Conflict-affected and high-risk area definition |
- **Supplier CMRT data** → Smelter identification → **Smelter list**
- **RMAP database** → Certification check → **Compliant vs non-compliant smelters**
- **CAHRA analysis** → Sourcing risk → **SEC Form SD / EU regulatory report**

## 5 · Intermediate Transformation Logic
**Methodology:** OECD 5-step conflict minerals framework
**Headline formula:** `Compliance = Supply_chain_mapping × Risk_identification × Strategy × Audit × Reporting`
**Standards:** ['SEC Rule 13p-1', 'EU Conflict Minerals Regulation (EU) 2017/821', 'OECD DDG']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).