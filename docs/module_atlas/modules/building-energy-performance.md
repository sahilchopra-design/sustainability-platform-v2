# Building Energy Performance
**Module ID:** `building-energy-performance` · **Route:** `/building-energy-performance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
EPC rating analytics, CRREM (Carbon Risk Real Estate Monitor) pathway alignment, and building-level GHG intensity tracking for commercial and residential real estate portfolios. Identifies stranding risk by comparing current energy performance against CRREM 1.5°C and 2°C pathways by property type and country. Supports EU Taxonomy Article 7 technical screening and TCFD physical risk integration.

> **Business value:** The EPBD recast and EU Taxonomy Article 7 are accelerating regulatory demand for decarbonised buildings, with minimum EPC standards tightening to class D by 2030 for all commercial real estate. CRREM stranding analysis quantifies the financial risk embedded in underperforming properties and provides the CapEx roadmap needed for green loan and green bond refinancing eligibility.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `EPC_COLORS`, `EPC_RATINGS`, `RETROFIT_TECH`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Office','Retail','Residential','Industrial','Logistics','Mixed-Use'];` |
| `type` | `TYPES[Math.floor(s*6)];` |
| `epcIdx` | `Math.floor(s2*7);const epc=EPC_RATINGS[epcIdx];` |
| `area` | `Math.floor(500+s3*49500);` |
| `yearBuilt` | `Math.floor(1950+s4*73);` |
| `city` | `CITIES[Math.floor(s5*CITIES.length)];` |
| `baseIntensity` | `{'Office':180,'Retail':220,'Residential':120,'Industrial':280,'Logistics':150,'Mixed-Use':200};` |
| `intensity` | `Math.floor(baseIntensity[type]*(0.5+s*0.8));` |
| `crremTarget` | `Math.floor(baseIntensity[type]*0.35);` |
| `strandingYear` | `intensity>crremTarget*2?2026+Math.floor(s2*4):intensity>crremTarget?2030+Math.floor(s3*5):2040+Math.floor(s4*10);` |
| `annualEnergy` | `Math.floor(intensity*area/1000);` |
| `annualCost` | `Math.floor(annualEnergy*0.15*1000);` |
| `co2` | `Math.floor(annualEnergy*0.21);` |
| `value` | `Math.floor(area*(type==='Office'?4500:type==='Retail'?3200:type==='Residential'?5500:type==='Industrial'?1800:type==='Logistics'?2100:3800)*(0.8+s3*0.` |
| `retrofitCost` | `Math.floor(area*(25+s4*75));` |
| `crremPathways15` | `Array.from({length:28},(_,i)=>({year:2023+i,office:180-i*5.2,retail:220-i*6.4,residential:120-i*3.5,industrial:280-i*8.1,logistics:150-i*4.3,mixedUse:` |
| `crremPathways20` | `Array.from({length:28},(_,i)=>({year:2023+i,office:180-i*3.8,retail:220-i*4.7,residential:120-i*2.5,industrial:280-i*5.9,logistics:150-i*3.1,mixedUse:` |
| `retrofitOptions` | `RETROFIT_TECH.map((tech,i)=>{` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `EPC_RATINGS`, `RETROFIT_TECH`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Intensity | `Annual_emissions / GFA` | Energy audit | Building GHG intensity; CRREM 1.5°C UK office pathway is ~15 kgCO₂e/m²/yr by 2030 |
| CRREM Pathway Gap | `Intensity – CRREM_pathway(t)` | CRREM v2 | Excess carbon intensity above the 1.5°C/2°C CRREM benchmark for property type |
| EPC Rating | — | National EPC register | Energy Performance Certificate band; EU minimum class E by 2027, D by 2030 under EPBD recast |
- **National EPC registers + building energy audit data** → Map each property to CRREM pathway; compute stranding year from intensity trajectory → **Per-property stranding year and CRREM gap with RAG risk flag**
- **CRREM v2 pathway database** → Select pathway by property type and country; compare against asset intensity → **CRREM stranding analysis and EU Taxonomy Article 7 compliance assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** CRREM carbon intensity stranding model
**Headline formula:** `Stranding_year = first t where intensity(t) > CRREM_pathway(t); Intensity = Annual_emissions_kgCO2 / GFA_m²; EPC_score = 0–100 (A–G)`
**Standards:** ['CRREM v2 Pathways', 'EU Taxonomy Art. 7 Buildings', 'EPBD Recast 2023', 'GRESB Standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).