# Heat Mortality Risk
**Module ID:** `heat-mortality-risk` · **Route:** `/heat-mortality-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models excess heat mortality using exposure-response functions calibrated to city-level temperature and demographic data, providing quantitative heat risk assessments for life insurers, reinsurers, and public health investors. Incorporates urban heat island effect, adaptation capacity, and future climate scenario projections under SSP scenarios.

> **Business value:** Enables life insurers and reinsurers to quantify the impact of rising heat mortality on longevity assumptions, supports public health investors in prioritising cooling infrastructure, and provides city-level heat risk intelligence for physical climate risk disclosure under TCFD and TNFD frameworks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `COUNTRIES`, `HORIZONS`, `QUARTERS`, `RCP_SCENARIOS`, `SECTORS_LABOUR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `days35` | `Math.floor(30+s2*180);` |
| `mortalityBase` | `Math.floor(s3*800+50);` |
| `lat` | `s6>0.5?(s6*40):(s6*-40+20);` |
| `rcpMort` | `RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>Math.floor(mortalityBase*(1+ri*0.3+hi*0.25+sr(i*37+ri*11+hi*7)*0.2))));` |
| `rcpWBGT` | `RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>+(baseWBGT+ri*1.2+hi*0.8+sr(i*41+ri*13+hi*9)*0.5).toFixed(1)));` |
| `rcpDays` | `RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>Math.floor(days35*(1+ri*0.15+hi*0.2+sr(i*43+ri*17+hi*11)*0.1))));` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],mort:Math.floor(mortalityBase*(0.8+qi*0.03+sr(i*47+qi*13)*0.15)),wbgt:+(baseWBGT+qi*0.1+sr(i*53+qi*7)*0.5).toFix` |
| `labourLoss` | `SECTORS_LABOUR.map((sec,si)=>({sector:sec,lossPercent:+(sr(i*59+si*11)*8+1).toFixed(1),gdpImpactM:Math.floor(sr(i*61+si*13)*500+10),workersExposedK:Ma` |
| `greenInfraGapM` | `Math.floor(sr(i*71+5)*2000+100);` |
| `cddProjection` | `HORIZONS.map((_,hi)=>Math.floor(1500+hi*400+sr(i*73+hi*11)*300));` |
| `healthcostM` | `Math.floor(sr(i*79+9)*1500+50);` |
| `insuranceClaimsM` | `Math.floor(sr(i*83+3)*400+10);` |
| `realEstateImpactPct` | `+(sr(i*89+7)*15+1).toFixed(1);` |
| `portfolioExposurePct` | `+(sr(i*97+13)*25+1).toFixed(1);` |
| `fmt` | `(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `avgWBGT` | `+(CITIES.length?CITIES.reduce((s,c)=>s+c.baseWBGT,0)/CITIES.length:0).toFixed(1);` |
| `totalMort` | `CITIES.reduce((s,c)=>s+c.rcpMort[rcpIdx][horizonIdx],0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `COUNTRIES`, `HORIZONS`, `QUARTERS`, `RCP_SCENARIOS`, `SECTORS_LABOUR`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Excess Heat Mortality (per 100k/yr) | — | Gasparrini et al. / Lancet Countdown | Annual excess deaths per 100,000 population attributable to heat above MMT; Mediterranean cities average 25â€“ |
| Minimum Mortality Temperature (°C) | — | City-specific exposure-response curves | Temperature at which all-cause mortality is minimised; varies by local acclimatisation; London MMT ~18°C, Athe |
| Urban Heat Island Offset (°C) | — | ERA5 / Urban climate models | Temperature premium of urban core vs rural surroundings; increases excess heat mortality exposure by 15â€“35%  |
| SSP3-7.0 Heat Mortality Uplift (%) | — | IPCC AR6 / Vicedo-Cabrera et al. 2021 | Projected increase in excess heat mortality by 2080 under SSP3-7.0 high-emission scenario relative to current  |
- **ERA5 daily temperature data by city** → Compute daily excess above MMT, apply 21-day distributed lag → **Daily excess heat exposure**
- **National mortality statistics (all-cause daily)** → Calibrate exposure-response function, extract β_heat coefficient → **City-specific heat mortality response curves**
- **IPCC SSP scenario temperature projections** → Apply projected temperature change to exposure-response model → **Future excess heat mortality by scenario and city**

## 5 · Intermediate Transformation Logic
**Methodology:** Excess Heat Mortality Rate
**Headline formula:** `EHMR = Σ_t max(0, T_t - MMT) × β_heat × Population × BaselineMortality`
**Standards:** ['Gasparrini et al. (2017) â€” Mortality Risk Attributable to High and Low Temperatures', 'Lancet Countdown Indicator 1.1.2', 'IPCC AR6 Chapter 7 â€” Health Impacts']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).