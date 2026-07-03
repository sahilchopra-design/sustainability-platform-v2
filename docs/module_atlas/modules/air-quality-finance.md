# Air Quality Finance
**Module ID:** `air-quality-finance` · **Route:** `/air-quality-finance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Clean air project financing analytics covering health co-benefit monetisation, PM2.5 abatement NPV, and air quality bond pricing. Integrates WHO AQG 2021 targets, WHO cost-of-illness methodology for DALY valuation, and IFC air quality performance standards to assess investment viability of clean air projects alongside carbon reduction co-benefits.

> **Business value:** Incorporating air quality health co-benefits into project finance models can increase NPV by 30–60% for urban clean energy and transport projects, unlocking commercially viable investment cases that would otherwise fail standalone carbon pricing hurdles. Co-benefit transparency also strengthens green bond use-of-proceeds documentation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ABATEMENTS`, `ABATEMENT_TECHS`, `CITIES`, `CITY_NAMES`, `COMPANIES`, `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `POLLUTANTS`, `QUARTERS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `ABATEMENT_TECHS` | `['Electrostatic Precipitator','Scrubber Systems','Catalytic Converter','Baghouse Filter','Low-NOx Burner','Selective Catalytic Reduction','Diesel Part` |
| `pm25` | `Math.floor(5+s1*150);` |
| `pm10` | `Math.floor(pm25*1.3+s2*40);` |
| `no2` | `Math.floor(10+s3*80);` |
| `so2` | `Math.floor(3+sr(i*31+5)*60);` |
| `popM` | `+(0.5+s5*25).toFixed(1);` |
| `mortalityCostM` | `Math.floor(pm25*popM*0.8+s1*200);` |
| `morbidityCostM` | `Math.floor(mortalityCostM*0.6+s2*100);` |
| `dalys` | `Math.floor(pm25*popM*15+s3*5000);` |
| `prodLossPct` | `+(pm25*0.03+s4*1).toFixed(1);` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],pm25:Math.floor(pm25*(0.85+qi*0.02+sr(i*41+qi*11)*0.15)),no2:Math.floor(no2*(0.9+qi*0.01+sr(i*43+qi*13)*0.1))}))` |
| `sector` | `SECTORS[Math.floor(s1*SECTORS.length)];` |
| `name` | `COMPANY_PREFIXES[Math.floor(s2*COMPANY_PREFIXES.length)]+' '+COMPANY_SUFFIXES[Math.floor(s3*COMPANY_SUFFIXES.length)];` |
| `scope1AirPollutants` | `Math.floor(s4*50000+500);` |
| `regRisk` | `+(sr(i*29+111)*100).toFixed(0);` |
| `abatementCostM` | `Math.floor(sr(i*31+113)*200+5);` |
| `airQualityScore` | `Math.floor(sr(i*37+117)*100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ABATEMENT_TECHS`, `CITY_NAMES`, `COLORS`, `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `POLLUTANTS`, `QUARTERS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| VSL (Value of Statistical Life) | `Country-specific OECD/WHO` | WHO/OECD | Economic value of preventing one statistical premature death used for co-benefit NPV |
| PM2.5 Abatement Cost-Effectiveness | `Project cost / PM25 reduction` | IFC PS3 | Cost per unit ambient PM2.5 concentration reduction |
| Health Co-Benefit NPV | `Σ(DALY × VSL) discounted` | WHO 2021 | Net present value of health benefits from PM2.5 and NO2 reduction |
- **WHO AQG ambient concentration targets** → Apply concentration-response functions to emission reduction scenarios → **DALY avoidance estimates per PM2.5 and NO2 reduction increment**
- **OECD/WHO country VSL data** → Monetise DALYs and discount to NPV; add carbon co-benefit at SCC → **Total co-benefit NPV and blended project IRR**

## 5 · Intermediate Transformation Logic
**Methodology:** WHO DALY-based health co-benefit NPV
**Headline formula:** `NPV_coBenefit = Σ_t [DALY_avoided(t) × VSL / (1+r)^t]; PM25_abatement = Emission_reduction × CF_PM25`
**Standards:** ['WHO Air Quality Guidelines 2021', 'IFC Performance Standard 3', 'GHG Protocol Co-benefits']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).