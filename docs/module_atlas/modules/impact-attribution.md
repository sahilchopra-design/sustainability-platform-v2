# Impact Attribution
**Module ID:** `impact-attribution` · **Route:** `/impact-attribution` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `IMPACT_CATEGORIES`, `IRIS_METRICS`, `QUARTERS`, `REPORT_SECTIONS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `IRIS_METRICS` | `['PI4060 - Jobs Created','PI2822 - Patients Served','OI1120 - GHG Reduced','OI8839 - Energy Generated','OI4389 - Water Conserved','PI6330 - Students E` |
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `pIdx` | `Math.floor(s1*COMPANY_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*COMPANY_SUFFIXES.length);` |
| `secIdx` | `Math.floor(s3*SECTORS.length);` |
| `outstanding` | `Math.round((sr(i*31+17)*80+5)*10)/10;` |
| `evic` | `Math.round((sr(i*47+19)*500+100)*10)/10;` |
| `attrFactor` | `Math.round((outstanding/evic)*1000)/1000;` |
| `jobs` | `Math.round(sr(i*67+21)*5000+100);` |
| `lives` | `Math.round(sr(i*29+23)*20000+500);` |
| `co2` | `Math.round(sr(i*53+25)*50000+1000);` |
| `energy` | `Math.round(sr(i*37+27)*100000+5000);` |
| `water` | `Math.round(sr(i*43+29)*5000+100);` |
| `attrJobs` | `Math.round(jobs*attrFactor);` |
| `attrLives` | `Math.round(lives*attrFactor);` |
| `attrCo2` | `Math.round(co2*attrFactor);` |
| `attrEnergy` | `Math.round(energy*attrFactor);` |
| `attrWater` | `Math.round(water*attrFactor);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `IMPACT_CATEGORIES`, `IRIS_METRICS`, `QUARTERS`, `REPORT_SECTIONS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).