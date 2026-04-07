# Global Reference Data Coverage Framework
## Comprehensive Scenario Analysis and Reference Data Integration

---

**Document Classification:** Technical Reference Architecture  
**Version:** 1.0  
**Date:** April 2026  
**Prepared by:** AA Impact Inc. Multi-Agent AI Task Force  

---

## Executive Summary

This document provides a comprehensive mapping of global reference data sources for climate scenario analysis, ensuring the AA Impact climate risk modeling framework covers all major scenario providers, sector-specific pathways, and regional/national data sources worldwide.

### Coverage Summary

| Category | Sources | Scenarios/Pathways |
|----------|---------|-------------------|
| **Global Climate Scenarios** | 5+ providers | 100+ scenarios |
| **Sector-Specific Pathways** | 8+ initiatives | 50+ sector pathways |
| **Regional/National Scenarios** | 15+ regions | 30+ regional models |
| **Financial Alignment Tools** | 6+ frameworks | Multiple benchmarks |
| **Reference Data Providers** | 10+ sources | Continuous updates |

---

## Table of Contents

1. [Global Climate Scenario Providers](#1-global-climate-scenario-providers)
2. [Sector-Specific Transition Pathways](#2-sector-specific-transition-pathways)
3. [Regional and National Scenario Sources](#3-regional-and-national-scenario-sources)
4. [Financial Portfolio Alignment Tools](#4-financial-portfolio-alignment-tools)
5. [Reference Data and Analytics Providers](#5-reference-data-and-analytics-providers)
6. [Integration Architecture](#6-integration-architecture)
7. [Coverage Gap Analysis](#7-coverage-gap-analysis)
8. [Implementation Recommendations](#8-implementation-recommendations)

---

## 1. Global Climate Scenario Providers

### 1.1 Primary Scenario Providers (Core)

| Provider | Scenarios | Temperature Range | Update Frequency | Geographic Coverage |
|----------|-----------|-------------------|------------------|---------------------|
| **NGFS** | 6 main + variants | 1.5°C - 3°C+ | Annual (Nov) | Global, 180+ countries |
| **IEA** | STEPS, APS, NZE | 1.5°C - 2.4°C | Annual (Oct) | Global, regional |
| **IPCC AR6** | 3,131 scenarios | 1.5°C - 4°C+ | 6-7 years | Global |
| **IRENA** | 1.5°C, PES | 1.5°C - 2.7°C | Annual (Nov) | Global |
| **GFANZ** | Multi-provider | 1.5°C - 2°C | Ongoing | Global |

### 1.2 Extended Scenario Providers

| Provider | Scenarios | Focus Area | Key Differentiator |
|----------|-----------|------------|-------------------|
| **OECM** | 1.5°C razor's edge | Renewable energy | No CCS/BECCS reliance |
| **DNB** | 4 short-term shocks | Transition risk | Policy/tech/confidence shocks |
| **BoE** | CBES scenarios | Financial stability | Banking/insurance focus |
| **ECB/ESRB** | Fit-for-55 | EU policy | EU-specific pathways |
| **RMI** | Multiple | Clean energy | Technology-focused |

### 1.3 Scenario Variable Coverage Matrix

| Variable Category | NGFS | IEA | IPCC | IRENA | OECM | DNB |
|-------------------|------|-----|------|-------|------|-----|
| **Macroeconomic** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Energy Demand** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Power Generation** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Transport** | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Industry** | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Buildings** | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **AFOLU** | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ |
| **Emissions** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Carbon Price** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Physical Risk** | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |

---

## 2. Sector-Specific Transition Pathways

### 2.1 Mission Possible Partnership (MPP)

**Sectors Covered:** 7 hard-to-abate sectors

| Sector | Pathway Type | 2030 Target | 2050 Target |
|--------|--------------|-------------|-------------|
| **Steel** | Technology shift | 190 Mt near-zero capacity | Net-zero |
| **Cement** | Process innovation | Multiple pathways | Net-zero |
| **Chemicals (Ammonia)** | Feedstock change | 50-120 Mt near-zero | Net-zero |
| **Aluminium** | Smelting technology | 40 low-carbon facilities | Net-zero |
| **Aviation** | SAF deployment | Scale SAF production | Net-zero |
| **Shipping** | Fuel transition | Zero-emission vessels | Net-zero |
| **Heavy Trucking** | Electrification/H2 | Scale ZEVs | Net-zero |

**Key Features:**
- Asset-by-asset transition strategies
- Industry-endorsed pathways
- Real economy milestones
- Open-access tools

### 2.2 Transition Pathway Initiative (TPI)

**Sectors Covered:** 10+ sectors

| Sector | Benchmarks | Metric |
|--------|------------|--------|
| **Electricity Utilities** | 1.5°C, Below 2°C, National Pledges | Carbon intensity (gCO₂/kWh) |
| **Oil & Gas** | 1.5°C, Below 2°C, National Pledges | Carbon intensity (kgCO₂/boe) |
| **Coal Mining** | 1.5°C, Below 2°C | Production trajectory |
| **Automobiles** | 1.5°C, Below 2°C, Pledges | gCO₂/km |
| **Airlines** | 1.5°C, Below 2°C, Pledges | gCO₂/RPK |
| **Shipping** | 1.5°C, Below 2°C, Pledges | gCO₂/tonne-km |
| **Steel** | 1.5°C, Below 2°C | tCO₂/t crude steel |
| **Cement** | 1.5°C, Below 2°C, Pledges | tCO₂/t cementitious |
| **Aluminium** | 1.5°C, Below 2°C, Pledges | tCO₂/t aluminium |
| **Pulp & Paper** | 1.5°C, Below 2°C, Pledges | tCO₂/t paper |
| **Diversified Mining** | 1.5°C, Below 2°C | Scope 1+2 intensity |

**Methodology:** Sectoral Decarbonization Approach (SDA)

### 2.3 SBTi Sector Pathways

**FLAG (Forest, Land, Agriculture) Pathways:**

| Commodity | Pathway Type | 2030 Reduction |
|-----------|--------------|----------------|
| **Beef** | Commodity-specific | 30% |
| **Chicken** | Commodity-specific | 30% |
| **Dairy** | Commodity-specific | 30% |
| **Pork** | Commodity-specific | 30% |
| **Maize** | Commodity-specific | 30% |
| **Palm Oil** | Commodity-specific | 30% |
| **Rice** | Commodity-specific | 30% |
| **Soy** | Commodity-specific | 30% |
| **Wheat** | Commodity-specific | 30% |
| **Timber/Wood Fiber** | Commodity-specific | Case-by-case |
| **Leather (Cattle Hides)** | Derived from beef | 30% |

**Key Requirements:**
- Dual objective: reduce emissions + increase sequestration
- No-deforestation commitment by 2025
- 30% FLAG emissions reduction by 2030 (default pathway)
- Separate from energy/industry targets

### 2.4 CRREM (Carbon Risk Real Estate Monitor)

**Property Types Covered:**

| Property Type | Regions | Metric |
|---------------|---------|--------|
| **Residential** | EU + 10 countries | kgCO₂/m²/year |
| **Offices** | EU + 10 countries | kgCO₂/m²/year |
| **Retail** | EU + 10 countries | kgCO₂/m²/year |
| **Hotels** | EU + 10 countries | kgCO₂/m²/year |
| **Logistics** | EU + 10 countries | kgCO₂/m²/year |

**Pathway Features:**
- 1.5°C and 2°C decarbonization pathways
- Country-specific grid factors
- Climate zone adjustments
- Stranded asset risk identification
- SFDR/CSRD compliance support

### 2.5 PACTA Sectors

**Climate-Critical Sectors (8):**

| Sector | Technology/Market Share | Emission Intensity |
|--------|------------------------|-------------------|
| **Power** | ✓ | ✓ |
| **Oil & Gas** | ✓ | ✓ |
| **Coal** | ✓ | ✗ |
| **Automotive** | ✓ | ✓ |
| **Steel** | ✗ | ✓ |
| **Cement** | ✗ | ✓ |
| **Aviation** | ✗ | ✓ |
| **Shipping** | Coming soon | Coming soon |

**Metrics:**
- Technology Mix
- Production Volume Trajectory
- Emission Intensity

### 2.6 Carbon Tracker Initiative

**Upstream Oil & Gas Assessments:**

| Assessment | Description |
|------------|-------------|
| **Investment Alignment** | Capex plans vs. IEA scenarios |
| **Production Alignment** | Output vs. demand scenarios |
| **Capital Allocation** | Portfolio resilience |
| **Least-Cost Analysis** | Supply curve positioning |

**Scenarios Used:**
- IEA STEPS (2.4°C)
- IEA APS (1.7°C)
- IEA NZE (1.5°C)

---

## 3. Regional and National Scenario Sources

### 3.1 European Union

| Source | Scenarios | Focus |
|--------|-----------|-------|
| **ECB/ESRB** | Fit-for-55 | EU banking sector |
| **EBA** | EU-wide stress test | Bank solvency |
| **EIOPA** | Climate stress test | Insurance sector |
| **ESMA** | Risk assessment | Securities markets |
| **EU Commission** | REFIT scenarios | Policy impact |

### 3.2 United Kingdom

| Source | Scenarios | Focus |
|--------|-----------|-------|
| **Bank of England** | CBES | Banking/insurance |
| **PRA** | Climate stress test | Prudential risk |
| **FCA** | Disclosure scenarios | Market conduct |

### 3.3 Asia-Pacific

| Country/Source | Scenarios | Focus |
|----------------|-----------|-------|
| **People's Bank of China** | Green finance | Banking sector |
| **MAS (Singapore)** | Climate stress test | Financial sector |
| **HKMA (Hong Kong)** | Climate risk | Banking |
| **RBA (Australia)** | Climate scenarios | Financial stability |
| **BOJ (Japan)** | Climate analysis | Balance sheet |

### 3.4 Americas

| Country/Source | Scenarios | Focus |
|----------------|-----------|-------|
| **Federal Reserve** | Pilot CSA | Large banks |
| **OCC** | Climate risk | Bank supervision |
| **OSFI (Canada)** | Guideline B-15 | Banks/insurers/pensions |
| **Banco Central do Brasil** | Climate stress test | Banking sector |

### 3.5 Emerging Markets

| Region/Source | Scenarios | Focus |
|---------------|-----------|-------|
| **South Africa (SARB)** | Climate risk | Financial sector |
| **India (RBI)** | Climate scenarios | Banking |
| **Mexico (Banxico)** | Climate analysis | Financial stability |

---

## 4. Financial Portfolio Alignment Tools

### 4.1 PACTA (Paris Agreement Capital Transition Assessment)

**Developer:** RMI (formerly 2° Investing Initiative)  
**Users:** 1,500+ financial institutions  
**AUM Covered:** $106+ trillion  

**Key Features:**
- Asset-based company data
- 5-year forward-looking production plans
- Technology-level analysis
- Open-source methodology

**Alignment Metrics:**
- Technology Mix
- Production Volume Trajectory
- Emission Intensity

### 4.2 TPI (Transition Pathway Initiative)

**Developer:** LSE Grantham Research Institute  
**Supporters:** 150+ investors  
**AUM:** $40+ trillion  

**Key Features:**
- Company-level assessments
- Open-access data
- Climate Action 100+ benchmark
- GitHub repository

**Coverage:**
- 2,000+ companies (Management Quality)
- 554+ companies (Carbon Performance)

### 4.3 UNEP FI Tools

| Tool | Purpose | Users |
|------|---------|-------|
| **ClimateALIGN** | Portfolio temperature scoring | Banks/investors |
| **ClimateMAPS** | Scenario analysis | Financial institutions |
| **Impact Analysis Tools** | Portfolio impact assessment | Banks |

### 4.4 SBTi Finance

**Target Setting for Financial Institutions:**

| Asset Class | Methodology |
|-------------|-------------|
| **Listed Equity/Corporate Bonds** | SDA / Temperature Rating |
| **Private Equity** | SDA / Temperature Rating |
| **Real Estate** | CRREM pathways |
| **Mortgages** | CRREM / PCAF |
| **Project Finance** | Project-level SDA |
| **Sovereign Bonds** | Not yet available |

### 4.5 GFANZ Framework

**Four Financing Strategies:**

| Strategy | Description |
|----------|-------------|
| **Climate Solutions** | Technologies/services for net-zero |
| **Aligned** | Already aligned with 1.5°C |
| **Aligning** | Transitioning to alignment |
| **Managed Phaseout** | Orderly retirement of high-emitting assets |

**Sectoral Pathways:**
- Power
- Steel
- Cement
- Aviation
- Shipping
- Automotive

### 4.6 PCAF (Partnership for Carbon Accounting Financials)

**Asset Classes Covered:**

| Asset Class | Emissions Scope |
|-------------|-----------------|
| **Listed Equity** | Scope 1+2+3 |
| **Corporate Bonds** | Scope 1+2+3 |
| **Business Loans** | Scope 1+2+3 |
| **Commercial Real Estate** | Scope 1+2 |
| **Mortgages** | Scope 1+2 |
| **Project Finance** | Scope 1+2+3 |
| **Sovereign Bonds** | Scope 1+2+3 (country) |

---

## 5. Reference Data and Analytics Providers

### 5.1 Asset-Level Data Providers

| Provider | Data Type | Coverage |
|----------|-----------|----------|
| **Asset Impact** | Asset-level production data | Power, fossil fuels, steel, cement, aviation |
| **Rystad Energy** | Oil & gas asset data | Global upstream |
| **GlobalData** | Power asset data | Global power plants |
| **S&P Global Commodity Insights** | Multi-sector | Energy, metals, agriculture |

### 5.2 Emissions Data Providers

| Provider | Data Type | Coverage |
|----------|-----------|----------|
| **CDP** | Corporate emissions | 10,000+ companies |
| **GHG Protocol** | Accounting standards | Global standard |
| **IEA** | Country/sector emissions | Global |
| **EDGAR** | Global emissions | JRC/Netherlands |

### 5.3 Physical Risk Data Providers

| Provider | Hazard Types | Coverage |
|----------|--------------|----------|
| **First Street Foundation** | Flood, heat, wildfire | US |
| **JBA Risk Management** | Flood | Global |
| **RMS/Moody's** | Multi-hazard | Global |
| **AIR Worldwide** | Multi-hazard | Global |
| **Copernicus CDS** | Climate data | Europe/Global |

### 5.4 ESG and Climate Data Aggregators

| Provider | Services | Coverage |
|----------|----------|----------|
| **Bloomberg** | ESG data, carbon scores | Global |
| **Refinitiv/LSEG** | ESG scores, climate data | Global |
| **MSCI** | ESG ratings, climate VaR | Global |
| **Sustainalytics** | ESG risk ratings | Global |
| **ISS ESG** | Climate data, voting | Global |
| **CDP** | Disclosure scores | 10,000+ companies |
| **Trucost/S&P** | Carbon pricing risk | 15,000+ companies |

### 5.5 Scenario Data Platforms

| Platform | Content | Access |
|----------|---------|--------|
| **NGFS Scenario Portal** | All NGFS scenarios | Free |
| **IEA WEO** | Energy scenarios | Subscription |
| **IPCC AR6 Database** | 3,131 scenarios | Free |
| **IRENA REmap** | Renewable pathways | Free |
| **TPI Online Tool** | Company assessments | Free |
| **PACTA** | Portfolio alignment | Free |
| **OS-Climate** | Open-source tools | Free |

---

## 6. Integration Architecture

### 6.1 Data Ingestion Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Source Layer                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Scenarios  │  │   Sectoral   │  │   Regional   │              │
│  │   (NGFS/IEA) │  │   Pathways   │  │   Sources    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Physical   │  │   Financial  │  │   Reference  │              │
│  │   Risk Data  │  │   Alignment  │  │   Data       │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼────────────────┼────────────────┼────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Harmonization Layer                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Variable Mapping │ Unit Conversion │ Temporal Alignment      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Scenario Registry                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Scenario Metadata │ Variable Catalog │ Temperature Mapping   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Ensemble Engine                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Weighting Methods │ Uncertainty Quant │ Risk Calculation     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Database Schema Extension

```sql
-- Extended scenario registry
CREATE TABLE scenario_providers (
    provider_id UUID PRIMARY KEY,
    provider_name VARCHAR(100),
    provider_type VARCHAR(50),  -- 'global', 'sectoral', 'regional', 'financial'
    website VARCHAR(255),
    update_frequency VARCHAR(50),
    access_type VARCHAR(50),  -- 'free', 'subscription', 'registration'
    last_update DATE
);

-- Sector pathways
CREATE TABLE sector_pathways (
    pathway_id UUID PRIMARY KEY,
    provider_id UUID REFERENCES scenario_providers(provider_id),
    sector VARCHAR(100),
    subsector VARCHAR(100),
    pathway_name VARCHAR(100),
    temperature_target DECIMAL(3,1),
    methodology VARCHAR(100),
    metric_type VARCHAR(50),  -- 'intensity', 'absolute', 'technology_share'
    unit VARCHAR(50)
);

-- Regional scenarios
CREATE TABLE regional_scenarios (
    scenario_id UUID PRIMARY KEY,
    provider_id UUID REFERENCES scenario_providers(provider_id),
    region_code VARCHAR(10),
    region_name VARCHAR(100),
    country_code VARCHAR(5),
    scenario_name VARCHAR(100),
    temperature_target DECIMAL(3,1),
    horizon_years INT[]
);

-- Alignment tools
CREATE TABLE alignment_tools (
    tool_id UUID PRIMARY KEY,
    tool_name VARCHAR(100),
    developer VARCHAR(100),
    tool_type VARCHAR(50),  -- 'portfolio', 'company', 'sector'
    methodology VARCHAR(100),
    coverage_description TEXT,
    aum_covered DECIMAL(15,2)
);

-- Reference data sources
CREATE TABLE reference_data_sources (
    source_id UUID PRIMARY KEY,
    source_name VARCHAR(100),
    data_type VARCHAR(50),  -- 'asset_level', 'emissions', 'physical_risk', 'esg'
    coverage_description TEXT,
    update_frequency VARCHAR(50),
    access_type VARCHAR(50)
);
```

### 6.3 API Integration Map

| Provider | API Type | Authentication | Rate Limits |
|----------|----------|----------------|-------------|
| **NGFS** | REST API | API Key | 1000/day |
| **IEA** | Data portal | Subscription | Unlimited |
| **IPCC** | Direct download | None | N/A |
| **IRENA** | REST API | API Key | 500/day |
| **TPI** | REST API | Registration | 100/day |
| **PACTA** | R package | Free | N/A |
| **Asset Impact** | REST API | Subscription | Varies |
| **CDP** | REST API | Registration | 1000/day |

---

## 7. Coverage Gap Analysis

### 7.1 Identified Gaps

| Gap Area | Current Status | Priority | Action Required |
|----------|---------------|----------|-----------------|
| **Agriculture/Forestry** | Limited (SBTi FLAG) | High | Expand MPP coverage |
| **Sovereign Bonds** | Partial (NGFS) | High | Develop dedicated scenarios |
| **Emerging Markets** | Limited | High | Partner with regional CBs |
| **Private Equity** | Limited | Medium | Extend PACTA methodology |
| **Supply Chain (Scope 3)** | Partial | High | Integrate SBTi pathways |
| **Nature/Biodiversity** | Minimal | Medium | Monitor TNFD development |
| **Social Dimensions** | Limited | Medium | Integrate Just Transition |

### 7.2 Regional Coverage Gaps

| Region | Coverage | Gap |
|--------|----------|-----|
| **Sub-Saharan Africa** | Limited | Need regional scenarios |
| **Southeast Asia** | Partial | Expand national scenarios |
| **Middle East** | Limited | Oil-dependent economies |
| **Central Asia** | Minimal | Data availability |
| **Small Island States** | Minimal | Physical risk focus |

### 7.3 Sector Coverage Gaps

| Sector | Coverage | Gap |
|--------|----------|-----|
| **Agriculture** | SBTi FLAG | Need more granular pathways |
| **Forestry** | SBTi FLAG | Limited data availability |
| **Fisheries** | None | Not covered |
| **Waste Management** | Minimal | Circular economy pathways |
| **Digital/ICT** | None | Growing emissions |
| **Healthcare** | None | Growing sector |

---

## 8. Implementation Recommendations

### 8.1 Priority Actions

| Priority | Action | Timeline | Resource |
|----------|--------|----------|----------|
| **1** | Integrate NGFS Phase 5 scenarios | Immediate | 2 weeks |
| **2** | Add MPP sector pathways | Immediate | 2 weeks |
| **3** | Expand TPI sector coverage | Short-term | 1 month |
| **4** | Integrate SBTi FLAG pathways | Short-term | 1 month |
| **5** | Add CRREM real estate | Short-term | 2 weeks |
| **6** | Develop sovereign bond scenarios | Medium-term | 3 months |
| **7** | Partner with regional CBs | Medium-term | 6 months |
| **8** | Expand emerging market coverage | Long-term | 12 months |

### 8.2 Data Partnership Strategy

| Partnership Type | Target Partners | Value |
|------------------|-----------------|-------|
| **Scenario Providers** | NGFS, IEA, IRENA | Core data |
| **Sector Initiatives** | MPP, TPI, SBTi | Sector pathways |
| **Data Aggregators** | Bloomberg, MSCI | Market data |
| **Academic** | LSE, IIASA | Research |
| **Open Source** | OS-Climate, PACTA | Tools |

### 8.3 Quality Assurance Framework

| Check | Method | Frequency |
|-------|--------|-----------|
| **Data Completeness** | Automated validation | Daily |
| **Consistency** | Cross-provider checks | Weekly |
| **Timeliness** | Update monitoring | Daily |
| **Accuracy** | Backtesting | Quarterly |
| **Coverage** | Gap analysis | Monthly |

---

## Appendices

### Appendix A: Complete Provider Contact List

| Provider | Contact | Website |
|----------|---------|---------|
| NGFS | scenarios@ngfs.net | www.ngfs.net |
| IEA | weo@iea.org | www.iea.org |
| IPCC | ar6@iiasa.ac.at | data.ene.iiasa.ac.at/ar6 |
| IRENA | weto@irena.org | www.irena.org |
| MPP | info@missionpossiblepartnership.org | www.missionpossiblepartnership.org |
| TPI | tpi@lse.ac.uk | www.transitionpathwayinitiative.org |
| SBTi | info@sciencebasedtargets.org | www.sciencebasedtargets.org |
| PACTA | pacta@rmi.org | pacta.rmi.org |
| CRREM | info@crrem.eu | www.crrem.eu |
| Carbon Tracker | info@carbontracker.org | www.carbontracker.org |

### Appendix B: License Summary

| Provider | License | Commercial Use |
|----------|---------|----------------|
| NGFS | CC BY 4.0 | Yes |
| IEA | Proprietary | Subscription |
| IPCC | CC BY 4.0 | Yes |
| IRENA | CC BY 4.0 | Yes |
| MPP | Open access | Yes |
| TPI | Open access | Yes |
| SBTi | Open access | Yes |
| PACTA | Open source | Yes |
| CRREM | Open access | Yes |

### Appendix C: Update Schedule

| Provider | Frequency | Next Update |
|----------|-----------|-------------|
| NGFS | Annual | Nov 2025 |
| IEA | Annual | Oct 2025 |
| IPCC | 6-7 years | 2028-2029 |
| IRENA | Annual | Nov 2025 |
| MPP | Quarterly | Ongoing |
| TPI | Quarterly | Ongoing |
| SBTi | Quarterly | Ongoing |

---

*End of Document*
