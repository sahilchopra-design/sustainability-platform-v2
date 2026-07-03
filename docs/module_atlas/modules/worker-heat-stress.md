# Worker Heat Stress
**Module ID:** `worker-heat-stress` · **Route:** `/worker-heat-stress` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Outdoor worker heat exposure risk and labour productivity loss analytics platform using WBGT and UTCI indices, ILO productivity loss curves and IPCC warming projections by geography and occupation.

> **Business value:** The ILO estimates heat stress already costs 2.4% of global working hours (≄80M full-time jobs) annually; by 2030 this rises to 2.2°C equivalent losses concentrated in South Asia, West Africa and the Caribbean.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `COUNTRIES`, `QUARTERS`, `REGULATIONS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `sector` | `SECTORS[Math.floor(s1*SECTORS.length)];` |
| `name` | `COMPANY_PREFIXES[i%COMPANY_PREFIXES.length]+' '+COMPANY_SUFFIXES[Math.floor(s2*COMPANY_SUFFIXES.length)];` |
| `totalWorkforce` | `Math.floor(s3*50000+500);` |
| `outdoorPct` | `Math.floor(s4*70+10);` |
| `outdoorWorkers` | `Math.floor(totalWorkforce*outdoorPct/100);` |
| `wbgtExposureHrs` | `Math.floor(s5*2000+100);` |
| `country` | `COUNTRIES[Math.floor(s6*COUNTRIES.length)];` |
| `prodLossPct` | `+(sr(i*37+515)*12+1).toFixed(1);` |
| `annualCostM` | `Math.floor(sr(i*41+517)*50+1);` |
| `litigationRisk` | `Math.floor(sr(i*43+519)*100);` |
| `iloComplianceScore` | `Math.floor(sr(i*47+521)*100);` |
| `oshaComplianceScore` | `Math.floor(sr(i*53+523)*100);` |
| `euComplianceScore` | `Math.floor(sr(i*59+525)*100);` |
| `overallCompScore` | `Math.floor((iloComplianceScore+oshaComplianceScore+euComplianceScore)/3);` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],wbgt:+(26+qi*0.3+sr(i*61+qi*11)*3).toFixed(1),incidents:Math.floor(sr(i*67+qi*13)*20+1),prodLoss:+(prodLossPct*(` |
| `regScores` | `REGULATIONS.map((_,ri)=>({reg:REGULATIONS[ri],score:Math.floor(sr(i*73+ri*11+527)*100)}));` |
| `shiftOpt` | `{currentShift:'Standard 8hr',optimalShift:sr(i*79+529)>0.5?'Split Shift (5am-10am, 3pm-7pm)':'Early Start (5am-1pm)',potentialSaving:+(sr(i*83+531)*5+` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `COUNTRIES`, `QUARTERS`, `REGULATIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Workers at Risk (>2°C) | — | Heat Stress Model | Proportion of outdoor workforce exposed to unsafe WBGT levels (>28°C for heavy work) under 2°C warming scenari |
| Productivity Loss (2030) | — | ILO Model | Projected reduction in productive work capacity due to heat stress across outdoor operations by 2030. |
| High-Risk Geographies | — | IPCC AR6 WG1 | Countries where WBGT will exceed ISO 7933 safety thresholds for heavy outdoor work for >60 days/year by 2050. |
- **Workforce Geocodes, NOAA/ERA5 Temperature Data, IPCC Projections** → WBGT engine + ILO productivity curves + scenario projection → **Heat stress risk maps, productivity loss estimates, ESRS S1/GRI 403 disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** Wet Bulb Globe Temperature
**Headline formula:** `WBGT = 0.7 × Tₘᵣ + 0.2 × Tᵍ + 0.1 × Tₐᵒᵐ`
**Standards:** ['ILO Working on a Warmer Planet 2019', 'ISO 7933 Heat Stress Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).