# Tenant Engagement ESG
**Module ID:** `tenant-engagement-esg` · **Route:** `/tenant-engagement-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real estate tenant sustainability engagement platform enabling landlords to collaborate with tenants on energy efficiency, waste reduction and GRESB green building certification through green lease provisions.

> **Business value:** Split incentive between landlord capex and tenant energy savings has historically impeded real estate decarbonisation; green leases with data-sharing obligations are the primary solution adopted by leading REITs.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLDG_TYPES`, `CLAUSES`, `ENGAGEMENT_STAGES`, `SECTORS`, `STAGE_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CLAUSES` | `['Data Sharing','Fit-Out Standards','Waste Management','Renewable Energy','EV Charging','Indoor Air Quality','Water Conservation','Carbon Reporting','` |
| `BLDG_TYPES` | `['Office','Retail','Mixed-Use'];` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `buildingIdx` | `Math.floor(s2*50);` |
| `area` | `Math.floor(500+s3*9500);` |
| `employees` | `Math.floor(10+s4*490);` |
| `esgScore` | `Math.floor(20+s5*80);` |
| `clauses` | `CLAUSES.map((c,j)=>({clause:c,adopted:greenLeaseActive&&sr(i*31+j*7)>0.4,compliance:greenLeaseActive?Math.floor(40+sr(i*37+j*11)*60):0}));` |
| `energyConsumption` | `Math.floor(area*150*(0.5+s*0.8));` |
| `stageIdx` | `Math.floor(s*6);` |
| `satisfaction` | `Math.floor(50+s2*50);` |
| `renewablePerc` | `Math.floor(s3*60);` |
| `wasteRecycling` | `Math.floor(20+s4*70);` |
| `waterEfficiency` | `Math.floor(30+s5*60);` |
| `scope3Contribution` | `Math.floor(energyConsumption*0.21/1000);` |
| `reductionTarget` | `Math.floor(10+s6*40);` |
| `leaseExpiry` | `2025+Math.floor(s2*8);` |
| `quarterlyEngagement` | `Array.from({length:8},(_,i)=>({quarter:`Q${(i%4)+1} ${2024+Math.floor(i/4)}`,surveys:Math.floor(30+sr(i*17)*40),responses:Math.floor(20+sr(i*19)*30),s` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLDG_TYPES`, `CLAUSES`, `ENGAGEMENT_STAGES`, `SECTORS`, `STAGE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Lease Coverage | — | Lease Database | Proportion of NLA under green lease provisions with ESG data-sharing obligations. |
| Avg Tenant Energy Reduction | — | Smart Metering | Mean energy intensity reduction achieved by tenants in active engagement programmes vs baseline. |
| GRESB Tenant Score | — | GRESB Submission | Tenant engagement module score in latest GRESB Real Estate Assessment. |
- **Green Lease Data, Smart Meter Feeds, Tenant ESG Surveys, GRESB Portal** → Engagement scoring + GRESB module mapping + energy intensity analytics → **GRESB submissions, tenant engagement reports, MEES compliance tracker**

## 5 · Intermediate Transformation Logic
**Methodology:** Tenant ESG Engagement Score
**Headline formula:** `TEES = Σ (Initiative Score × Tenant Weight) / Σ Tenant Weight`
**Standards:** ['GRESB Real Estate Assessment 2023', 'BBP Green Lease Toolkit']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).