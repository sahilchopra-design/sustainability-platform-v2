# Sustainable Aviation Fuel
**Module ID:** `sustainable-aviation-fuel` · **Route:** `/sustainable-aviation-fuel` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
SAF production analytics, blending mandate tracking and lifecycle GHG assessment platform covering HEFA, e-fuel and advanced biofuel pathways against CORSIA and EU ReFuelEU mandates.

> **Business value:** Aviation contributes 3.5% of effective radiative forcing; SAF is the primary decarbonisation pathway as electric and hydrogen aircraft remain decades away for long-haul routes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `KPI`, `MANDATES`, `PATHWAYS`, `PW_CAP_2024`, `PW_CAP_2030`, `PW_CORSIA`, `PW_COST`, `PW_DESC`, `PW_EURED`, `PW_FEED`, `PW_GHG`, `PW_INV`, `PW_TRL`, `REFUELEU_TIMELINE`, `REGIONS`, `REG_COLORS`, `REG_SHARE`, `TABS`, `ToolTipC`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(v,d=1)=>v>=1e9?(v/1e9).toFixed(d)+'B':v>=1e6?(v/1e6).toFixed(d)+'M':v>=1e3?(v/1e3).toFixed(d)+'K':v.toFixed(d);` |
| `pct` | `(v)=>(v*100).toFixed(1)+'%';` |
| `PATHWAYS` | `['HEFA','Fischer-Tropsch','AtJ','DSHC','Co-processing','e-Kerosene/PtL','Pyrolysis','Gasification'];` |
| `PW_FEED` | `{'HEFA':'Used cooking oil, tallow, camelina','Fischer-Tropsch':'Forestry residues, MSW, ag waste','AtJ':'Corn ethanol, cellulosic ethanol, isobutanol'` |
| `PW_CORSIA` | `{HEFA:true,'Fischer-Tropsch':true,AtJ:true,DSHC:true,'Co-processing':true,'e-Kerosene/PtL':true,Pyrolysis:false,Gasification:true};` |
| `PW_EURED` | `{HEFA:true,'Fischer-Tropsch':true,AtJ:true,DSHC:true,'Co-processing':false,'e-Kerosene/PtL':true,Pyrolysis:false,Gasification:true};` |
| `PW_GHG` | `{HEFA:65,'Fischer-Tropsch':85,AtJ:70,DSHC:72,'Co-processing':50,'e-Kerosene/PtL':95,Pyrolysis:60,Gasification:80};` |
| `PW_TRL` | `{HEFA:9,'Fischer-Tropsch':7,AtJ:7,DSHC:6,'Co-processing':9,'e-Kerosene/PtL':5,Pyrolysis:5,Gasification:6};` |
| `PW_COST` | `{HEFA:1.8,'Fischer-Tropsch':3.2,AtJ:2.6,DSHC:3.5,'Co-processing':1.3,'e-Kerosene/PtL':5.5,Pyrolysis:2.9,Gasification:3.0};` |
| `PW_CAP_2024` | `{HEFA:4.2,'Fischer-Tropsch':0.3,AtJ:0.15,DSHC:0.02,'Co-processing':0.8,'e-Kerosene/PtL':0.01,Pyrolysis:0.05,Gasification:0.08};` |
| `PW_CAP_2030` | `{HEFA:15,'Fischer-Tropsch':4.5,AtJ:3.0,DSHC:0.8,'Co-processing':3.5,'e-Kerosene/PtL':2.0,Pyrolysis:1.5,Gasification:2.5};` |
| `PW_INV` | `{HEFA:8,'Fischer-Tropsch':18,AtJ:12,DSHC:6,'Co-processing':3,'e-Kerosene/PtL':45,Pyrolysis:8,Gasification:14};` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Middle East','Latin America','Africa'];` |
| `cap` | `Math.round(50+s*1200);` |
| `opPct` | `s2>0.6?1:s2>0.3?0.5+s3*0.4:0;` |
| `idx` | `q.length;const s=sr(idx*11+5);` |
| `base` | `0.1+idx*0.035+s*0.02;` |
| `price` | `2800-idx*25+s*300;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MANDATES`, `PATHWAYS`, `PW_COLORS`, `REFUELEU_TIMELINE`, `REGIONS`, `REG_COLORS`, `REG_SHARE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SAF Blend Rate | — | Fuel Uplift Records | Current fleet-weighted SAF blending ratio; EU ReFuelEU mandates 2% by 2025, 6% by 2030. |
| Lifecycle CI | — | CORSIA Methodology | Weighted average carbon intensity of SAF portfolio; 69% reduction vs fossil baseline. |
| CORSIA Offset Credit | — | CORSIA Registry | CORSIA Eligible Fuel credits generated from SAF use, offsetting international aviation emissions. |
- **Fuel Uplift Records, SAF Certificates, Feedstock Data** → Lifecycle CI engine + mandate compliance tracker + CORSIA credit calculator → **SAFR reports, blending compliance status, 2030 gap analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** SAF Lifecycle GHG Intensity
**Headline formula:** `CI = (GHGₚₐₜₕ + GHGₚ⬿ₐₜ + GHGₑⵔₑ) / MJ₟⭃⻿`
**Standards:** ['ICAO CORSIA Methodology', 'EU RED III Annex V']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).