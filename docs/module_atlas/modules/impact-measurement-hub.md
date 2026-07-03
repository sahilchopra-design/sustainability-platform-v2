# Impact Measurement Hub
**Module ID:** `impact-measurement-hub` · **Route:** `/impact-measurement-hub` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `ENGAGEMENT_STATUSES`, `ENGAGEMENT_TYPES`, `QUARTERS`, `REPORT_SECTIONS`, `SDG_COLORS`, `SDG_NAMES`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `REPORT_SECTIONS` | `['Executive Summary','Impact KPI Dashboard','SDG Portfolio Coverage','Impact Attribution Analysis','Theory of Change Progress','Impact-Weighted Accoun` |
| `pIdx` | `Math.floor(s1*COMPANY_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*COMPANY_SUFFIXES.length);` |
| `secIdx` | `Math.floor(s3*SECTORS.length);` |
| `sdgCoverage` | `Math.floor(sr(i*31+1030)*8+4);` |
| `impactScore` | `Math.round(sr(i*43+1050)*50+35);` |
| `additionalityScore` | `Math.round(sr(i*53+1060)*50+30);` |
| `iwaProfitAdj` | `Math.round((sr(i*67+1070)*200-80)*10)/10;` |
| `invested` | `Math.round((sr(i*71+1080)*50+5)*10)/10;` |
| `impactPerM` | `Math.round(sr(i*29+1090)*60+10);` |
| `co2Avoided` | `Math.round(sr(i*37+1100)*10000+500);` |
| `jobsCreated` | `Math.round(sr(i*41+1110)*500+20);` |
| `livesImproved` | `Math.round(sr(i*47+1120)*2000+100);` |
| `typeIdx` | `Math.floor(sr(i*73+1200)*alertTypes.length);` |
| `sevIdx` | `Math.floor(sr(i*41+1210)*3);` |
| `pIdx` | `Math.floor(sr(i*53+1220)*COMPANY_PREFIXES.length);` |
| `sIdx` | `Math.floor(sr(i*61+1230)*COMPANY_SUFFIXES.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `ENGAGEMENT_STATUSES`, `ENGAGEMENT_TYPES`, `QUARTERS`, `REPORT_SECTIONS`, `SDG_COLORS`, `SDG_NAMES`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).