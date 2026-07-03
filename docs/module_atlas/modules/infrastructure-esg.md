# Infrastructure ESG
**Module ID:** `infrastructure-esg` · **Route:** `/infrastructure-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Monitors ESG performance across operating infrastructure portfolios spanning transport, energy, utilities, and digital sectors using GIIA Global ESG Reporting and Performance Framework indicators. Provides asset-level KPI tracking, carbon intensity benchmarking, safety performance monitoring, and regulatory compliance status.

> **Business value:** Enables infrastructure fund managers to monitor ESG performance across operating assets, identify environmental and safety underperformers, meet GIIA ESG reporting obligations, and demonstrate portfolio-level progress toward net-zero infrastructure aligned with IEA NZE sector pathways.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `COUNTRIES`, `CustomTooltip`, `DATA`, `IFC_CATEGORIES`, `PAGE_SIZE`, `RISK_LEVELS`, `SECTORS`, `STAGES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `n=>n>=1000?`$${(n/1000).toFixed(1)}B`:`$${n}M`;` |
| `sector` | `SECTORS[Math.floor(s1*SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `stage` | `STAGES[Math.floor(s3*STAGES.length)];` |
| `inv` | `Math.floor(100+s4*4900);` |
| `esgScore` | `Math.floor(30+s5*65);` |
| `gresbScore` | `s6>0.3?Math.floor(40+s7*55):null;` |
| `ifcPerf` | `Math.floor(40+s8*55);` |
| `riskLevel` | `RISK_LEVELS[Math.floor(s9*RISK_LEVELS.length)];` |
| `ifcCat` | `IFC_CATEGORIES[Math.floor(s10*IFC_CATEGORIES.length)];` |
| `carbonInt` | `Math.floor(20+sr(i*67+41)*480);` |
| `waterRisk` | `Math.floor(10+sr(i*71+43)*85);` |
| `bioImpact` | `Math.floor(5+sr(i*73+47)*90);` |
| `commScore` | `Math.floor(20+sr(i*79+53)*75);` |
| `safetyRate` | `Number((0.5+sr(i*83+59)*4.5).toFixed(2));` |
| `jobsCreated` | `Math.floor(50+sr(i*89+61)*4950);` |
| `compliance` | `sr(i*97+67)>0.5?'Full':sr(i*101+71)>0.3?'Partial':'Non-compliant';` |
| `sdgAlign` | `Math.floor(1+sr(i*103+73)*6);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRIES`, `IFC_CATEGORIES`, `RISK_LEVELS`, `SECTORS`, `STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Energy Infrastructure Carbon Intensity (gCO2/kWh) | — | GIIA KPI 4.1 / IEA | Grid electricity emission factor normalised by generation; renewables score <5 gCO2/kWh; gas peakers score 400 |
| Water Loss Rate (%) | — | IWA / GIIA KPI 3.2 | Non-revenue water as a percentage of total water produced; above 20% indicates significant infrastructure effi |
| LTIFR (per million hours) | — | GIIA Safety KPI | Lost Time Injury Frequency Rate; infrastructure sector benchmark is below 1.0 for best-in-class operators; abo |
| Renewable Energy Share (%) | — | GIIA KPI 4.2 | Proportion of portfolio electricity consumption from renewable sources; GIIA encourages 100% renewable electri |
- **Asset operational data (energy, water, throughput)** → Compute sector-specific carbon intensity, water loss rate, renewable share → **GIIA ESG KPIs by asset**
- **Health and safety incident records** → Calculate LTIFR and TRIFR, benchmark against sector peer data → **Safety performance dashboard**
- **IEA NZE pathway data by infrastructure sector** → Compare asset carbon intensity to pathway benchmark → **Decarbonisation gap by asset**

## 5 · Intermediate Transformation Logic
**Methodology:** Infrastructure Carbon Intensity
**Headline formula:** `CI_infra = Total_CO2e / Throughput_metric`
**Standards:** ['GIIA ESG Reporting Framework KPI 4.1', 'GHG Protocol Scope 1/2/3 Standard', 'IEA NZE Sector Pathways']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).