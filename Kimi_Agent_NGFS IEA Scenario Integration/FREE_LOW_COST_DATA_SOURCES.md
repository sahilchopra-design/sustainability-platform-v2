# Free and Low-Cost Data Sources for Climate Risk ML
## Comprehensive Data Directory for Model Training and Validation

---

**Document Classification:** Resource Guide  
**Version:** 1.0  
**Date:** April 2026  
**Prepared by:** AA Impact Inc. Data Engineering Team  

---

## Executive Summary

This document catalogs free and low-cost data sources for training and validating climate risk machine learning models. The sources complement existing EODHD (financial markets) and BRSR (Business Responsibility & Sustainability Reporting - India) access to provide comprehensive coverage across climate, financial, ESG, and physical risk domains.

### Data Source Categories

| Category | Free Sources | Low-Cost Sources | Total |
|----------|--------------|------------------|-------|
| **Climate & Weather** | 15+ | 5+ | 20+ |
| **Physical Hazards** | 10+ | 3+ | 13+ |
| **Financial Markets** | 8+ | 5+ | 13+ |
| **ESG & Sustainability** | 10+ | 4+ | 14+ |
| **Company & Corporate** | 8+ | 3+ | 11+ |
| **Geospatial** | 12+ | 2+ | 14+ |
| **Economic & Macro** | 10+ | 2+ | 12+ |

---

## Table of Contents

1. [Climate & Weather Data](#1-climate--weather-data)
2. [Physical Hazard Data](#2-physical-hazard-data)
3. [Financial Market Data](#3-financial-market-data)
4. [ESG & Sustainability Data](#4-esg--sustainability-data)
5. [Company & Corporate Data](#5-company--corporate-data)
6. [Geospatial Data](#6-geospatial-data)
7. [Economic & Macroeconomic Data](#7-economic--macroeconomic-data)
8. [Data Integration with EODHD & BRSR](#8-data-integration-with-eodhd--brsr)

---

## 1. Climate & Weather Data

### 1.1 Global Climate Data

#### Copernicus Climate Data Store (CDS) ⭐ TOP PICK

| Attribute | Details |
|-----------|---------|
| **Provider** | European Centre for Medium-Range Weather Forecasts (ECMWF) |
| **Cost** | **FREE** |
| **Coverage** | Global |
| **Data Types** | Reanalysis (ERA5), CMIP6 projections, seasonal forecasts, satellite observations |
| **Time Range** | 1940-present (ERA5), future projections to 2100 |
| **Resolution** | 0.25° x 0.25° (ERA5), various for projections |
| **API** | Yes - Python API (cdsapi) |
| **Registration** | Required (free) |

**Key Datasets:**
- ERA5 hourly/daily reanalysis (temperature, precipitation, wind, humidity)
- CMIP6 climate projections (all scenarios)
- Seasonal forecasts (3-6 months ahead)
- Essential Climate Variables (ECVs)

**Python Access:**
```python
import cdsapi

c = cdsapi.Client()

c.retrieve(
    'reanalysis-era5-single-levels',
    {
        'product_type': 'reanalysis',
        'variable': [
            '2m_temperature', 'total_precipitation',
            '10m_u_component_of_wind', '10m_v_component_of_wind'
        ],
        'year': '2023',
        'month': '01',
        'day': '01',
        'time': '12:00',
        'area': [50, -10, 40, 10],  # North, West, South, East
        'format': 'netcdf'
    },
    'era5_data.nc'
)
```

**Website:** https://cds.climate.copernicus.eu

---

#### NASA POWER (Prediction of Worldwide Energy Resources)

| Attribute | Details |
|-----------|---------|
| **Provider** | NASA Langley Research Center |
| **Cost** | **FREE** |
| **Coverage** | Global (solar-focused) |
| **Data Types** | Solar radiation, temperature, humidity, wind, precipitation |
| **Time Range** | 1984-present (reanalysis), near real-time |
| **Resolution** | 0.5° x 0.5° |
| **API** | Yes - REST API |
| **Registration** | Not required |

**Python Access:**
```python
import requests

url = "https://power.larc.nasa.gov/api/temporal/daily/point"
params = {
    "parameters": "T2M,PRECTOT,RH2M",
    "community": "RE",
    "longitude": -77.02,
    "latitude": 38.90,
    "start": "20200101",
    "end": "20201231",
    "format": "JSON"
}
response = requests.get(url, params=params)
data = response.json()
```

**Website:** https://power.larc.nasa.gov

---

#### NOAA Climate Data Online (CDO)

| Attribute | Details |
|-----------|---------|
| **Provider** | National Oceanic and Atmospheric Administration |
| **Cost** | **FREE** |
| **Coverage** | Global (US-focused) |
| **Data Types** | Temperature, precipitation, extreme events, storms |
| **Time Range** | 1750-present (varies by station) |
| **Resolution** | Station-level |
| **API** | Yes - REST API (token required) |
| **Registration** | Free token |

**Python Access:**
```python
import requests

# Get API token from: https://www.ncdc.noaa.gov/cdo-web/token
token = "YOUR_NOAA_TOKEN"
headers = {"token": token}

url = "https://www.ncei.noaa.gov/cdo-web/api/v2/data"
params = {
    "datasetid": "GHCND",  # Global Historical Climatology Network Daily
    "stationid": "GHCND:USW00023174",
    "startdate": "2023-01-01",
    "enddate": "2023-12-31",
    "datatypeid": "TMAX,TMIN,PRCP",
    "limit": 1000
}
response = requests.get(url, headers=headers, params=params)
data = response.json()
```

**Website:** https://www.ncei.noaa.gov/cdo-web/webservices

---

#### World Bank Climate Change Knowledge Portal (CCKP)

| Attribute | Details |
|-----------|---------|
| **Provider** | World Bank Group |
| **Cost** | **FREE** |
| **Coverage** | 196 countries/territories |
| **Data Types** | Historical climate, projections, sectoral impacts |
| **Time Range** | 1901-present, projections to 2100 |
| **Resolution** | Country-level |
| **API** | Limited API access |
| **Registration** | Not required |

**Key Features:**
- Country climate profiles
- Sectoral information (agriculture, water, energy, health)
- Climate risk screening tools
- SSP/RCP scenario projections

**Website:** https://climateknowledgeportal.worldbank.org

---

#### Open-Meteo

| Attribute | Details |
|-----------|---------|
| **Provider** | Open-Meteo (open-source) |
| **Cost** | **FREE** (non-commercial) |
| **Coverage** | Global |
| **Data Types** | Weather forecasts, historical reanalysis |
| **Time Range** | 1940-present, forecasts 14 days |
| **Resolution** | 11 km (forecasts), 25 km (historical) |
| **API** | Yes - REST API |
| **Registration** | Not required for non-commercial |

**Python Access:**
```python
import requests

url = "https://archive-api.open-meteo.com/v1/archive"
params = {
    "latitude": 52.52,
    "longitude": 13.41,
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
    "timezone": "auto"
}
response = requests.get(url, params=params)
data = response.json()
```

**Website:** https://open-meteo.com

---

### 1.2 Regional Climate Data

| Source | Region | Cost | Key Data |
|--------|--------|------|----------|
| **CORDEX** | Regional (Africa, Europe, Asia) | Free | High-resolution projections |
| **PRISM** | US | Free | High-quality spatial climate |
| **SILO** | Australia | Free | Climate data for Queensland |
| **Met Office** | UK | Free | UK climate projections |
| **DWD** | Germany/Europe | Free | German weather service data |

---

## 2. Physical Hazard Data

### 2.1 Flood Data

#### FEMA Flood Map Service Center

| Attribute | Details |
|-----------|---------|
| **Provider** | US Federal Emergency Management Agency |
| **Cost** | **FREE** |
| **Coverage** | United States |
| **Data Types** | Flood zones, flood insurance rate maps |
| **Formats** | Shapefile, GeoTIFF, API |
| **API** | Yes - REST API |

**Python Access:**
```python
import requests

# National Flood Data API
url = "https://api.nationalflooddata.com/flood"
params = {
    "lat": 40.7128,
    "lng": -74.0060
}
headers = {"x-api-key": "YOUR_API_KEY"}  # Free tier available
response = requests.get(url, headers=headers, params=params)
flood_data = response.json()
```

**Website:** https://msc.fema.gov

---

#### Global Flood Awareness System (GloFAS)

| Attribute | Details |
|-----------|---------|
| **Provider** | Copernicus Emergency Management Service |
| **Cost** | **FREE** |
| **Coverage** | Global |
| **Data Types** | Flood forecasts, flood hazard maps |
| **Time Range** | Real-time + 30-day forecasts |
| **Resolution** | 0.1° x 0.1° |

**Website:** https://www.globalfloods.eu

---

#### FloodScan

| Attribute | Details |
|-----------|---------|
| **Provider** | University of Colorado / NASA |
| **Cost** | **FREE** (academic/research) |
| **Coverage** | Global |
| **Data Types** | Satellite-based flood extent |
| **Time Range** | 1998-present (daily) |

**Website:** https://floodscan.com

---

### 2.2 Wildfire Data

| Source | Coverage | Cost | Data Types |
|--------|----------|------|------------|
| **NASA FIRMS** | Global | Free | Active fire detections (MODIS/VIIRS) |
| **USGS MTBS** | US | Free | Burn severity, fire perimeters |
| **CAL FIRE** | California | Free | Fire history, perimeters |
| **Global Wildfire Information System** | Global | Free | Fire danger, burned areas |
| **EFFIS** | Europe | Free | European forest fire info |

**NASA FIRMS Python Access:**
```python
import requests

url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_NOAA20_NRT/world/1/2023-01-01"
params = {"API_KEY": "YOUR_API_KEY"}  # Free registration
response = requests.get(url, params=params)
```

---

### 2.3 Earthquake Data

#### USGS Earthquake Hazards Program

| Attribute | Details |
|-----------|---------|
| **Provider** | US Geological Survey |
| **Cost** | **FREE** |
| **Coverage** | Global |
| **Data Types** | Earthquake catalog, ShakeMaps, hazard maps |
| **Time Range** | Real-time + historical (1900-present) |
| **API** | Yes - REST API |

**Python Access:**
```python
import requests

url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
params = {
    "format": "geojson",
    "starttime": "2023-01-01",
    "endtime": "2023-12-31",
    "minmagnitude": 5.0,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "maxradiuskm": 500
}
response = requests.get(url, params=params)
earthquakes = response.json()
```

**Website:** https://earthquake.usgs.gov

---

### 2.4 Hurricane/Cyclone Data

| Source | Coverage | Cost | Data Types |
|--------|----------|------|------------|
| **IBTrACS** | Global | Free | Tropical cyclone best tracks |
| **NOAA HURDAT** | Atlantic/E Pacific | Free | Hurricane database |
| **JTWC** | Global | Free | Tropical cyclone warnings |
| **EUMETNET** | Europe | Free | European windstorms |

**IBTrACS Python Access:**
```python
import xarray as xr

# Download from: https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/
ds = xr.open_dataset('IBTrACS.ALL.v04r00.nc')
```

---

### 2.5 Drought Data

| Source | Coverage | Cost | Data Types |
|--------|----------|------|------------|
| **US Drought Monitor** | US | Free | Drought conditions, indices |
| **SPEI Global Drought Monitor** | Global | Free | Standardized Precipitation-Evapotranspiration Index |
| **SPI** | Global | Free | Standardized Precipitation Index |
| **GRACE** | Global | Free | Groundwater/drought from satellite |

---

### 2.6 Sea Level Rise Data

| Source | Coverage | Cost | Data Types |
|--------|----------|------|------------|
| **NOAA Sea Level Rise Viewer** | US | Free | SLR projections, inundation maps |
| **NASA Sea Level Change Portal** | Global | Free | Satellite altimetry, projections |
| **IMOS** | Australia | Free | Australian sea level data |

---

## 3. Financial Market Data

### 3.1 Free Financial Data Sources

#### SEC EDGAR ⭐ TOP PICK (US Public Companies)

| Attribute | Details |
|-----------|---------|
| **Provider** | US Securities and Exchange Commission |
| **Cost** | **FREE** |
| **Coverage** | All US public companies (10,000+) |
| **Data Types** | 10-K, 10-Q, 8-K, 13F, financial statements |
| **Time Range** | 1993-present |
| **API** | Yes - REST API |
| **Registration** | Not required (User-Agent with email) |

**Python Access:**
```python
import requests

headers = {"User-Agent": "your-email@example.com"}

# Get company facts (XBRL)
cik = "0001318605"  # Tesla
url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik.zfill(10)}.json"
response = requests.get(url, headers=headers)
financials = response.json()

# Get filings
url = f"https://data.sec.gov/submissions/CIK{cik.zfill(10)}.json"
response = requests.get(url, headers=headers)
filings = response.json()
```

**Website:** https://www.sec.gov/edgar

---

#### Yahoo Finance (via yfinance)

| Attribute | Details |
|-----------|---------|
| **Provider** | Yahoo (unofficial API) |
| **Cost** | **FREE** |
| **Coverage** | Global stocks, ETFs, indices |
| **Data Types** | Prices, fundamentals, options |
| **Time Range** | Varies (daily from ~1960s) |

**Python Access:**
```python
import yfinance as yf

# Stock data
ticker = yf.Ticker("AAPL")
hist = ticker.history(period="5y")
info = ticker.info
financials = ticker.financials
```

---

#### Alpha Vantage

| Attribute | Details |
|-----------|---------|
| **Provider** | Alpha Vantage |
| **Cost** | **FREE** (25 calls/day) / Paid tiers |
| **Coverage** | Global stocks, forex, crypto |
| **Data Types** | Prices, technical indicators, fundamentals |

**Python Access:**
```python
import requests

api_key = "YOUR_API_KEY"  # Free at alphavantage.co
url = "https://www.alphavantage.co/query"
params = {
    "function": "TIME_SERIES_DAILY",
    "symbol": "AAPL",
    "apikey": api_key
}
response = requests.get(url, params=params)
data = response.json()
```

---

#### FRED (Federal Reserve Economic Data)

| Attribute | Details |
|-----------|---------|
| **Provider** | Federal Reserve Bank of St. Louis |
| **Cost** | **FREE** |
| **Coverage** | US economic data |
| **Data Types** | Interest rates, GDP, employment, inflation |
| **API** | Yes - REST API |

**Python Access:**
```python
from fredapi import Fred

fred = Fred(api_key="YOUR_API_KEY")  # Free at fred.stlouisfed.org
gdp = fred.get_series('GDP')
unemployment = fred.get_series('UNRATE')
```

**Website:** https://fred.stlouisfed.org

---

### 3.2 Low-Cost Financial Data

| Provider | Cost | Coverage | Notes |
|----------|------|----------|-------|
| **EODHD** | $19-79/month | Global | Already have access ✅ |
| **Financial Modeling Prep** | $22-149/month | US-focused | ESG data available |
| **Quandl/NASDAQ Data Link** | Free tier + paid | Global | Economic/financial data |
| **Tiingo** | $10/month | US | High-quality fundamentals |
| **IEX Cloud** | Free tier + paid | US | Stock prices, fundamentals |

---

## 4. ESG & Sustainability Data

### 4.1 Free ESG Data Sources

#### CDP (Carbon Disclosure Project)

| Attribute | Details |
|-----------|---------|
| **Provider** | CDP Global |
| **Cost** | **FREE** (open data portal) |
| **Coverage** | 10,000+ companies |
| **Data Types** | Emissions, climate risks, water, forests |
| **Access** | CSV downloads |

**Website:** https://data.cdp.net

---

#### Open Sustainability Index

| Attribute | Details |
|-----------|---------|
| **Provider** | Open-source community |
| **Cost** | **FREE** |
| **Coverage** | Global companies |
| **Data Types** | Emissions, sustainability metrics |

**Website:** https://opensustainabilityindex.org

---

#### OpenESG

| Attribute | Details |
|-----------|---------|
| **Provider** | OpenESG |
| **Cost** | **FREE** |
| **Coverage** | Global |
| **Data Types** | ESG scores, risk ratings |

**Website:** https://opensesg.com

---

#### SEC Climate Disclosures

| Attribute | Details |
|-----------|---------|
| **Provider** | SEC |
| **Cost** | **FREE** |
| **Coverage** | US public companies |
| **Data Types** | Climate-related disclosures (voluntary) |

---

### 4.2 Low-Cost ESG Data

| Provider | Cost | Coverage | Notes |
|----------|------|----------|-------|
| **MSCI ESG** | Contact for pricing | Global | Industry standard |
| **Sustainalytics** | Contact for pricing | Global | Risk ratings |
| **Refinitiv ESG** | Contact for pricing | Global | Comprehensive |
| **Bloomberg ESG** | Terminal subscription | Global | Best-in-class |
| **ISS ESG** | Contact for pricing | Global | Proxy voting focus |
| **Trucost** | Contact for pricing | 15,000+ companies | Carbon pricing |

---

### 4.3 BRSR Data (India) - Already Have Access ✅

| Attribute | Details |
|-----------|---------|
| **Provider** | Ministry of Corporate Affairs, India |
| **Cost** | **FREE** (public filings) |
| **Coverage** | Top 1,000+ listed Indian companies |
| **Data Types** | ESG disclosures, employee data, supply chain, community impact |
| **Format** | XBRL, PDF |

**Access:** https://www.brsr.in or MCA21 portal

---

## 5. Company & Corporate Data

### 5.1 Free Company Data

#### OpenCorporates ⭐ TOP PICK

| Attribute | Details |
|-----------|---------|
| **Provider** | OpenCorporates |
| **Cost** | **FREE** (open data) / Commercial license |
| **Coverage** | 200+ million companies, 140+ jurisdictions |
| **Data Types** | Company info, directors, filings, registered addresses |
| **API** | Yes - REST API |

**Python Access:**
```python
import requests

api_key = "YOUR_API_KEY"  # Free tier available
url = "https://api.opencorporates.com/v0.4/companies/search"
params = {
    "q": "Tesla Inc",
    "api_token": api_key
}
response = requests.get(url, params=params)
companies = response.json()
```

**Website:** https://opencorporates.com

---

#### OpenSanctions

| Attribute | Details |
|-----------|---------|
| **Provider** | OpenSanctions |
| **Cost** | **FREE** (open source) |
| **Coverage** | Global |
| **Data Types** | Sanctions lists, PEPs, crime lists |

**Website:** https://www.opensanctions.org

---

#### OpenOwnership

| Attribute | Details |
|-----------|---------|
| **Provider** | OpenOwnership |
| **Cost** | **FREE** |
| **Coverage** | 40+ jurisdictions |
| **Data Types** | Beneficial ownership data |

---

### 5.2 Government Registries

| Country | Registry | Cost | Access |
|---------|----------|------|--------|
| **US** | SEC EDGAR | Free | API + bulk download |
| **UK** | Companies House | Free | API + bulk download |
| **EU** | Business Registers | Free | Varies by country |
| **India** | MCA21 | Free | Portal access |
| **Australia** | ASIC | Free | Search portal |

---

## 6. Geospatial Data

### 6.1 Free Geospatial Data

#### OpenStreetMap (OSM) ⭐ TOP PICK

| Attribute | Details |
|-----------|---------|
| **Provider** | OpenStreetMap Foundation |
| **Cost** | **FREE** (open data) |
| **Coverage** | Global |
| **Data Types** | Roads, buildings, land use, POIs, boundaries |
| **Formats** | OSM XML, PBF, GeoJSON |
| **API** | Overpass API |

**Python Access:**
```python
import osmnx as ox

# Download building footprints
buildings = ox.geometries.geometries_from_place(
    "Manhattan, New York, USA",
    tags={"building": True}
)

# Download street network
G = ox.graph_from_place("Manhattan, New York, USA", network_type="drive")
```

**Website:** https://www.openstreetmap.org

---

#### USGS Earth Explorer

| Attribute | Details |
|-----------|---------|
| **Provider** | US Geological Survey |
| **Cost** | **FREE** |
| **Coverage** | Global |
| **Data Types** | Landsat, MODIS, Sentinel, DEM, aerial imagery |
| **Resolution** | 15m - 1km |

**Website:** https://earthexplorer.usgs.gov

---

#### Copernicus Open Access Hub

| Attribute | Details |
|-----------|---------|
| **Provider** | European Space Agency |
| **Cost** | **FREE** |
| **Coverage** | Global |
| **Data Types** | Sentinel-1 (SAR), Sentinel-2 (optical), Sentinel-3 |
| **Resolution** | 10m (Sentinel-2) |

**Website:** https://scihub.copernicus.eu

---

#### Google Earth Engine

| Attribute | Details |
|-----------|---------|
| **Provider** | Google |
| **Cost** | **FREE** (non-commercial/research) |
| **Coverage** | Global |
| **Data Types** | Landsat, Sentinel, MODIS, climate data |
| **Platform** | Cloud-based analysis |

**Website:** https://earthengine.google.com

---

### 6.2 Low-Cost Geospatial Data

| Provider | Cost | Coverage | Notes |
|----------|------|----------|-------|
| **Planet Labs** | Contact for pricing | Global | Daily satellite imagery |
| **Maxar** | Contact for pricing | Global | High-resolution imagery |
| **Airbus** | Contact for pricing | Global | SPOT, Pleiades |
| **Here Maps** | Contact for pricing | Global | Map data |
| **Mapbox** | Free tier + paid | Global | Map tiles, geocoding |

---

## 7. Economic & Macroeconomic Data

### 7.1 Free Economic Data

#### World Bank Open Data ⭐ TOP PICK

| Attribute | Details |
|-----------|---------|
| **Provider** | World Bank |
| **Cost** | **FREE** |
| **Coverage** | 200+ countries |
| **Data Types** | GDP, population, trade, development indicators |
| **API** | Yes - REST API |

**Python Access:**
```python
import wbdata

# Get GDP data
data = wbdata.get_indicator(
    indicator="NY.GDP.MKTP.CD",  # GDP (current US$)
    country="USA",
    date="2010:2023"
)
```

**Website:** https://data.worldbank.org

---

#### IMF Data

| Attribute | Details |
|-----------|---------|
| **Provider** | International Monetary Fund |
| **Cost** | **FREE** |
| **Coverage** | Global |
| **Data Types** | Exchange rates, GDP, inflation, trade |
| **API** | Yes - JSON REST API |

**Website:** https://data.imf.org

---

#### UN Data

| Attribute | Details |
|-----------|---------|
| **Provider** | United Nations |
| **Cost** | **FREE** |
| **Coverage** | Global |
| **Data Types** | Population, trade, environment, energy |

**Website:** https://data.un.org

---

#### OECD Data

| Attribute | Details |
|-----------|---------|
| **Provider** | Organisation for Economic Co-operation |
| **Cost** | **FREE** |
| **Coverage** | OECD member countries |
| **Data Types** | Economic, social, environmental statistics |
| **API** | Yes - SDMX API |

**Website:** https://data.oecd.org

---

### 7.2 National Statistics Offices

| Country | Source | Cost | Data |
|---------|--------|------|------|
| **US** | Census Bureau, BLS | Free | Population, employment, prices |
| **UK** | ONS | Free | Economic, social statistics |
| **EU** | Eurostat | Free | EU-wide statistics |
| **India** | MOSPI | Free | Indian economic statistics |
| **China** | NBS | Free | Chinese economic data |

---

## 8. Data Integration with EODHD & BRSR

### 8.1 EODHD Integration

**EODHD Coverage (Already Have):**
- Global stock prices (60+ exchanges)
- Fundamental data
- ETFs and mutual funds
- Cryptocurrencies
- Real-time and historical data

**Complementary Free Sources:**

| EODHD Gap | Free Alternative | Use Case |
|-----------|------------------|----------|
| Climate risk scores | CDP, TPI | ESG integration |
| Physical hazard data | Copernicus CDS, NOAA | Location risk |
| Company structure | OpenCorporates | Supply chain |
| Macroeconomic context | World Bank, IMF | Scenario analysis |

### 8.2 BRSR Integration

**BRSR Coverage (Already Have):**
- Top 1,000 Indian companies
- ESG disclosures
- Employee data
- Supply chain information
- Community impact

**Complementary Free Sources:**

| BRSR Gap | Free Alternative | Use Case |
|----------|------------------|----------|
| Global companies | SEC EDGAR, OpenCorporates | International comparison |
| Climate projections | CCKP, IPCC AR6 | Physical risk assessment |
| Financial deep-dive | SEC XBRL | Credit risk |
| Sector benchmarks | TPI, SBTi | Alignment assessment |

### 8.3 Unified Data Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AA Impact Data Platform                       │
├─────────────────────────────────────────────────────────────────┤
│  PAID TIER                                                      │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │    EODHD    │  │    BRSR     │  (Already subscribed)        │
│  │  Financial  │  │   India ESG │                              │
│  └──────┬──────┘  └──────┬──────┘                              │
├─────────┼────────────────┼──────────────────────────────────────┤
│  FREE TIER                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Copernicus  │  │   NOAA      │  │    USGS     │             │
│  │   Climate   │  │   Weather   │  │   Hazards   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ World Bank  │  │    SEC      │  │OpenStreetMap│             │
│  │   Macro     │  │   EDGAR     │  │  Geospatial │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │     CDP     │  │OpenCorporat │  │    NASA     │             │
│  │    ESG      │  │   Company   │  │    POWER    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Harmonization Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Entity Resolution │ Unit Conversion │ Temporal Alignment  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ML Training Pipeline                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary Tables

### Top 20 Free Data Sources by Priority

| Rank | Source | Category | Cost | Priority |
|------|--------|----------|------|----------|
| 1 | Copernicus CDS | Climate | Free | ⭐⭐⭐ |
| 2 | SEC EDGAR | Financial | Free | ⭐⭐⭐ |
| 3 | OpenStreetMap | Geospatial | Free | ⭐⭐⭐ |
| 4 | NOAA Climate | Weather | Free | ⭐⭐⭐ |
| 5 | World Bank | Economic | Free | ⭐⭐⭐ |
| 6 | USGS Hazards | Physical | Free | ⭐⭐⭐ |
| 7 | CDP | ESG | Free | ⭐⭐ |
| 8 | OpenCorporates | Company | Free | ⭐⭐ |
| 9 | NASA POWER | Climate | Free | ⭐⭐ |
| 10 | FRED | Economic | Free | ⭐⭐ |
| 11 | IBTrACS | Hurricanes | Free | ⭐⭐ |
| 12 | NASA FIRMS | Wildfire | Free | ⭐⭐ |
| 13 | GloFAS | Flood | Free | ⭐⭐ |
| 14 | CCKP | Climate Risk | Free | ⭐ |
| 15 | Open-Meteo | Weather | Free | ⭐ |
| 16 | Landsat | Satellite | Free | ⭐ |
| 17 | Sentinel | Satellite | Free | ⭐ |
| 18 | IMF Data | Economic | Free | ⭐ |
| 19 | OECD | Economic | Free | ⭐ |
| 20 | UN Data | Economic | Free | ⭐ |

---

## Appendices

### Appendix A: API Key Registration Links

| Source | Registration URL |
|--------|------------------|
| Copernicus CDS | https://cds.climate.copernicus.eu |
| NOAA CDO | https://www.ncdc.noaa.gov/cdo-web/token |
| NASA FIRMS | https://firms.modaps.eosdis.nasa.gov |
| Alpha Vantage | https://www.alphavantage.co/support/#api-key |
| FRED | https://fred.stlouisfed.org/docs/api/api_key.html |
| OpenCorporates | https://api.opencorporates.com |

### Appendix B: Python Libraries for Data Access

```python
# Climate/Weather
pip install cdsapi xarray netcdf4

# Financial
pip install yfinance alpha-vantage fredapi sec-api

# Geospatial
pip install osmnx geopandas rasterio shapely

# ESG
pip install openesg-py

# General
pip install requests pandas numpy
```

---

*End of Document*
