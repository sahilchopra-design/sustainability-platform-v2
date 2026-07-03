# Grid Renewable Energy Credits
**Module ID:** `cc-grid-renewables` · **Route:** `/cc-grid-renewables` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Emission reduction quantification for grid-connected renewable energy projects under CDM AMS-I.D and ACM0002. Models combined margin (CM) emission factor, capacity factor projections, additionality via barrier analysis, and RECcertificate issuance.

> **Business value:** Annual ER = net renewable generation × combined margin EF. CM = 0.5×OM + 0.5×BM; project-specific weighting allowed under ACM0002.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `GRID_EF_PLANTS`, `GRID_REGIONS`, `HOURLY_PROFILES`, `Kpi`, `PROJECTS`, `Section`, `TECH_TYPES`, `TECH_WEIGHTS`, `TIP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `GRID_REGIONS` | `['South Asia','Southeast Asia','East Asia','Sub-Saharan Africa','Latin America','MENA','Eastern Europe','Central Asia','OECD Europe','North America','` |
| `names` | `[`${countries[i]} Solar Farm Alpha`,`${countries[i]} Wind Park Delta`,`${countries[i]} Offshore Array`,`${countries[i]} Run-of-River`,`${countries[i]}` |
| `capacity` | `Math.round(20+sr(i*7)*480);` |
| `aux` | `parseFloat((2+sr(i*13)*6).toFixed(1));` |
| `netGen` | `Math.round(capacity*8760*cf*(1-aux/100));` |
| `omEF` | `parseFloat((0.4+sr(i*17)*0.6).toFixed(3));` |
| `bmEF` | `parseFloat((0.2+sr(i*19)*0.5).toFixed(3));` |
| `HOURLY_PROFILES` | `TECH_TYPES.map((tech,ti)=>` |
| `setPlantShare` | `(idx,val)=>setGridPlants(prev=>prev.map((pl,i)=>i===idx?{...pl,share:val}:pl));` |
| `netGenCalc` | `Math.round(p.capacity*8760*p.cf*(1-p.aux/100));` |
| `sensOM` | `[0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0].map(om=>{` |
| `sensBM` | `[0.1,0.2,0.3,0.4,0.5,0.6].map(bm=>{` |
| `demand` | `dispatchDemand*(0.6+0.4*Math.sin((h-6)*Math.PI/12));` |
| `coal` | `Math.max(0,(demand-renew)*0.55);` |
| `gas` | `Math.max(0,(demand-renew)*0.35);` |
| `other` | `Math.max(0,demand-renew-coal-gas);` |
| `avgMargEF` | `parseFloat((hours.reduce((s,h)=>s+h.marginalEF,0)/24).toFixed(3));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GRID_EF_PLANTS`, `GRID_REGIONS`, `TABS`, `TECH_COLORS`, `TECH_TYPES`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Operating Margin EF | `Weighted dispatch data` | Grid operator | Average EF of existing grid generation mix weighted by output |
| Build Margin EF | `5-yr avg of new capacity` | Grid operator | Average EF of recently commissioned capacity |
| Combined Margin EF | `0.5×OM + 0.5×BM` | CDM ACM0002 | Default combined margin for ER calculation |
| Net Generation | `Gross – auxiliary consumption` | Plant metering | Electricity delivered to grid after station use deduction |
| Annual ER | `NetGen × EF_CM` | Model output | Verified emission reductions from RE displacing grid electricity |
- **Grid operator dispatch data** → Generation × EF → OM calculation → **Operating margin EF**
- **Plant SCADA** → Net generation → ER → **Annual tCO₂e credits**

## 5 · Intermediate Transformation Logic
**Methodology:** Combined Margin (CM) grid emission factor
**Headline formula:** `EF_CM = (EF_OM × w_OM) + (EF_BM × w_BM); ER = NetGen × EF_CM`
**Standards:** ['CDM ACM0002 v19', 'AMS-I.D v18', 'GHG Protocol Scope 2', 'I-REC Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).