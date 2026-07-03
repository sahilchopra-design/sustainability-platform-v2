# Real Estate ESG Hub
**Module ID:** `real-estate-esg-hub` · **Route:** `/real-estate-esg-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive real estate ESG management. Covers GRESB, CRREM, EPC ratings, green certifications (BREEAM/LEED/DGNB), tenant engagement, and embodied carbon (whole-life carbon).

> **Business value:** Real estate is both a major source of emissions (40% of EU energy) and a target of net-zero investment strategies. Institutional investors use GRESB for manager assessment and CRREM for stranding risk. This hub provides the complete ESG data infrastructure for real estate fund managers and corporate occupiers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `EPC_COLORS`, `EPC_RATINGS`, `SEVERITY_COLORS`, `SUB_MODULES`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Office','Retail','Residential','Industrial','Logistics','Mixed-Use'];` |
| `type` | `TYPES[Math.floor(s*6)];const city=CITIES[Math.floor(s2*CITIES.length)];` |
| `epcIdx` | `Math.floor(s3*7);const epc=EPC_RATINGS[epcIdx];` |
| `area` | `Math.floor(500+s4*49500);const yearBuilt=Math.floor(1950+s5*73);` |
| `value` | `Math.floor(area*(type==='Office'?4500:type==='Retail'?3200:type==='Residential'?5500:type==='Industrial'?1800:type==='Logistics'?2100:3800)*(0.8+s3*0.` |
| `intensity` | `Math.floor(({'Office':180,'Retail':220,'Residential':120,'Industrial':280,'Logistics':150,'Mixed-Use':200}[type])*(0.5+s*0.8));` |
| `certified` | `s6>0.38;const certScheme=certified?['LEED','BREEAM','WELL','NABERS','DGNB'][Math.floor(s*5)]:'None';` |
| `certLevel` | `certified?['Gold','Silver','Platinum','Excellent'][Math.floor(s2*4)]:'None';` |
| `embodiedCarbon` | `Math.floor(200+s*200);const resilience=Math.floor(30+s2*60);` |
| `riskScore` | `Math.floor(20+s3*70);const greenLease=s4>0.35;` |
| `tenantCount` | `Math.floor(1+s5*15);const occupancy=Math.floor(70+s6*30);` |
| `retrofitCost` | `Math.floor(area*(25+s*75));const retrofitStatus=['Not Started','Planned','In Progress','Completed'][Math.floor(s6*4)];` |
| `gresbScore` | `Math.floor(40+s*50);const co2=Math.floor(intensity*area*0.21/1000);` |
| `insurancePrem` | `Math.floor(value*0.003*(1+riskScore/100));` |
| `gresbTrend` | `Array.from({length:6},(_,i)=>({year:2020+i,score:Math.floor(52+i*4.5+sr(i*13)*3),benchmark:Math.floor(55+i*2.5),peer:Math.floor(50+i*3)}));` |
| `crremTrend` | `Array.from({length:6},(_,i)=>({year:2020+i,aligned:Math.floor(20+i*8+sr(i*17)*5),intensity:Math.floor(180-i*7)}));` |
| `certTrend` | `Array.from({length:6},(_,i)=>({year:2020+i,leed:Math.floor(10+i*4),breeam:Math.floor(8+i*5),well:Math.floor(2+i*3),total:Math.floor(20+i*12)}));` |
| `epcDist` | `useMemo(()=>EPC_RATINGS.map(r=>({rating:r,count:filtered.filter(b=>b.epc===r).length})),[filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `EPC_RATINGS`, `SUB_MODULES`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Operational Carbon | — | Typical split | Energy use in use phase — reduced by retrofitting |
| Embodied Carbon | — | Materials | Carbon in construction materials — set at design stage |
| Green Certifications | — | Building level | Third-party verification of building sustainability |
- **Building energy data** → Operational carbon calculation → **EUI and carbon per m²**
- **Construction data** → Embodied carbon LCA → **Whole-life carbon profile**
- **Portfolio data** → GRESB assessment → **ESG rating and investor reporting**

## 5 · Intermediate Transformation Logic
**Methodology:** Whole-life carbon accounting
**Headline formula:** `WLC = OperationalCarbon + EmbodiedCarbon; Embodied = A1-A5 + B1-B7 + C1-C4 + D`
**Standards:** ['RICS Whole Life Carbon Assessment', 'EN 15978', 'CRREM', 'GRESB']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).