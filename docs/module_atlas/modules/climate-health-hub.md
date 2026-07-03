# Climate-Health Nexus
**Module ID:** `climate-health-hub` · **Route:** `/climate-health-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate change health impacts analytics. Covers heat mortality, air quality degradation, vector-borne disease expansion, food security, and mental health impacts with investment implications.

> **Business value:** Climate change is the defining public health challenge of our time. Healthcare costs, workforce productivity, and supply chain disruptions from climate-health impacts create material financial risks. This module quantifies these impacts for healthcare sector investors and ESG analysts.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `ALERT_TYPES`, `AUDIENCE_TYPES`, `BOARD_SECTIONS`, `COLORS`, `COUNTRY_NAMES`, `COUNTRY_RISK`, `ENGAGEMENTS`, `KPI_DATA`, `MODULES`, `QUARTERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `MODULES` | `['Heat Mortality','Air Quality','Pandemic-Climate','Health Adaptation','Worker Heat Stress'];` |
| `AUDIENCE_TYPES` | `['Board / ExCo','Investment Committee','Risk Committee','ESG Team','External Stakeholders'];` |
| `heatRisk` | `Math.floor(s1*100);` |
| `aqRisk` | `Math.floor(s2*100);` |
| `pandemicRisk` | `Math.floor(s3*100);` |
| `adaptGap` | `Math.floor(s4*100);` |
| `workerRisk` | `Math.floor(s5*100);` |
| `composite` | `Math.floor((heatRisk+aqRisk+pandemicRisk+adaptGap+workerRisk)/5);` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],composite:Math.floor(composite*(0.9+qi*0.015+sr(i*31+qi*7)*0.05))}));` |
| `BOARD_SECTIONS` | `['Executive Summary','Heat Mortality Risk Overview','Air Quality & Health Costs','Pandemic-Climate Nexus','Health Adaptation Finance','Worker Heat Str` |
| `fmt` | `(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `TABS` | `['Executive Dashboard','Country Health-Climate View','Engagement Pipeline','Board Report'];` |
| `moduleDistribution` | `useMemo(()=>MODULES.map(m=>({name:m,alerts:ALERTS.filter(a=>a.module===m).length,engagements:ENGAGEMENTS.filter(e=>e.module===m).length})),[]);` |
| `csv` | `[headers.join(','),...data.map(row=>headers.map(h=>JSON.stringify(row[h]\|\|'')).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERT_TYPES`, `AUDIENCE_TYPES`, `BOARD_SECTIONS`, `COLORS`, `COUNTRY_NAMES`, `MODULES`, `QUARTERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Heat Deaths (2°C) | — | Lancet Countdown | Additional heat-attributable deaths globally |
| Productivity Loss | — | IPCC WGII | Labour output decline above heat stress thresholds |
- **Temperature projections** → Exposure-response function → **Heat mortality estimate**
- **Wildfire data** → PM2.5 mapping → **Air quality health impact**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-health impact pathways
**Headline formula:** `HeatMortality = Excess_deaths(T - T_threshold); AirQuality = PM2.5 µg/m³ from wildfire smoke`
**Standards:** ['WHO Climate and Health', 'Lancet Countdown', 'IPCC AR6 WGII Ch.7']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).