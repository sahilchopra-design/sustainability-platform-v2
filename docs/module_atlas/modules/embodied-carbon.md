# Embodied Carbon Analytics
**Module ID:** `embodied-carbon` · **Route:** `/embodied-carbon` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks and analyses lifecycle embodied carbon across construction materials, building projects, and manufactured products using Environmental Product Declaration data. Covers upfront carbon (Modules A1â€“A5), use-stage emissions (B1â€“B7), and end-of-life impacts (C1â€“C4) in accordance with EN 15978 and ISO 14044. Supports whole-life carbon optimisation, EPD benchmarking, and supply chain material substitution analysis.

> **Business value:** Supports architects, developers, and lenders in achieving net-zero whole-life carbon targets, meeting LETI/RIBA 2030 benchmarks, and satisfying green loan eligibility criteria requiring embodied carbon disclosure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLDG_TYPES`, `RIBA_2030`, `STAGES`, `STAGE_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BLDG_TYPES` | `['Office','Residential','Retail','Education','Healthcare','Industrial','Mixed-Use','Warehouse'];` |
| `STAGES` | `['A1-A3 Product','A4-A5 Construction','B1-B5 Use','C1-C4 End-of-Life','D Reuse/Recycle'];` |
| `RIBA_2030` | `{Office:300,Residential:250,Retail:280,Education:270,Healthcare:350,Industrial:200,'Mixed-Use':290,Warehouse:180};` |
| `names` | `['Concrete (OPC)','Concrete (30% GGBS)','Concrete (50% GGBS)','Steel (Virgin)','Steel (Recycled)','Timber (Softwood)','CLT (Cross-Laminated)','Glulam'` |
| `type` | `BLDG_TYPES[Math.floor(s*8)];` |
| `gfa` | `Math.floor(1000+s2*49000);const stories=Math.floor(2+s3*30);` |
| `a13` | `Math.floor(ribaTarget*(0.3+s*0.8));const a45=Math.floor(a13*0.15*(0.5+s2));` |
| `b15` | `Math.floor(a13*0.08*(0.5+s3));const c14=Math.floor(a13*0.12*(0.5+s4));` |
| `dStage` | `Math.floor(-a13*0.1*(0.3+s5*0.5));` |
| `totalEmbodied` | `a13+a45+b15+c14+dStage;` |
| `operationalCarbon` | `Math.floor(gfa*0.05*(0.5+s2));const designLife=50+Math.floor(s3*10);` |
| `totalWholeLife` | `totalEmbodied+operationalCarbon*designLife;` |
| `stagePerc` | `{a13:0.65,a45:0.1,b15:0.08,c14:0.12,d:-0.05};` |
| `timberReduction` | `calcTimber*0.008;` |
| `adjustedBase` | `base*(1-timberReduction);` |
| `perSqm` | `Math.floor(adjustedBase*(0.7+sr(BLDG_TYPES.indexOf(calcType)*3)*0.6));` |
| `total` | `perSqm*calcGFA/1000;` |
| `materialBreakdown` | `calcMaterials.map(m=>{` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLDG_TYPES`, `STAGES`, `STAGE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Upfront Embodied Carbon (kgCO2e/m²) | — | EPD Database / ICE v3.0 | A1-A5 emissions intensity; LETI 2030 target for offices is <300 kgCO2e/m² GIA. |
| Global Warming Potential (kgCO2e) | — | EPD / ISO 14025 | Product-level GWP100 from EPD; primary indicator for material comparison and substitution. |
| Biogenic Carbon (kgCO2e) | — | EN 15804+A2 | Separately reported biogenic carbon stored in timber and bio-based products; must not net against fossil GWP. |
| Carbon Hotspot Ratio (%) | — | ICE/EPD blend | Percentage of WLC attributable to top-3 material categories; drives substitution prioritisation. |
- **EPD database (ECO Platform / EPD International)** → Parse GWP100 values by lifecycle module and material category → **Material-level embodied carbon factor (kgCO2e/kg or m²)**
- **Project bill of materials** → Quantity take-off matched to EPD records; gaps filled with ICE v3 defaults → **Project total WLC by lifecycle stage**
- **LETI/RIBA benchmark targets** → Compare project intensity to sector percentile bands → **Carbon performance rating and gap-to-target**

## 5 · Intermediate Transformation Logic
**Methodology:** Whole-Life Carbon (WLC)
**Headline formula:** `WLC = Σ(EC_i × Q_i) + OC_use + EoL_carbon`
**Standards:** ['EN 15978:2011', 'ISO 14044:2006', 'RICS Whole Life Carbon Assessment 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).