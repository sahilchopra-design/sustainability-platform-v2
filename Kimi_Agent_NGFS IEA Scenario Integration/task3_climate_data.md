# Physical Risk Modeling & Stochastic Damage Functions: Climate Data Integration
## Technical Specifications for Climate Data Integration

**Document Version:** 1.0  
**Classification:** Technical Reference  
**Prepared by:** AA Impact Inc. - Climate Data Science Team  
**Date:** 2024

---

## Executive Summary

This document provides comprehensive technical specifications for integrating climate data into physical risk modeling and stochastic damage function frameworks. It covers acute and chronic hazard data sources, processing methodologies, hazard intensity footprint mapping, scenario-based projections, uncertainty quantification, and asset vulnerability database integration. The specifications are designed to support enterprise-grade climate risk assessment platforms with over 140 billion data points in forward-looking climate projections.

---

## Table of Contents

1. [Acute Hazard Data Sources and Processing](#1-acute-hazard-data-sources-and-processing)
2. [Chronic Hazard Data Sources and Processing](#2-chronic-hazard-data-sources-and-processing)
3. [Hazard Intensity Footprint Mapping](#3-hazard-intensity-footprint-mapping)
4. [Scenario-Based Hazard Projections](#4-scenario-based-hazard-projections)
5. [Uncertainty Quantification in Hazard Data](#5-uncertainty-quantification-in-hazard-data)
6. [Asset Vulnerability Database Integration](#6-asset-vulnerability-database-integration)

---

## 1. Acute Hazard Data Sources and Processing

### 1.1 Flood Hazard Data

#### 1.1.1 FEMA Flood Hazard Data

**Data Source:** Federal Emergency Management Agency (FEMA) Flood Insurance Rate Maps (FIRM) and National Flood Hazard Layer (NFHL)

**Technical Specifications:**
- **Spatial Resolution:** Vector polygons at 1:12,000 to 1:24,000 scale
- **Temporal Resolution:** Static with periodic updates (typically 5-10 year cycles)
- **Data Format:** Shapefile (.shp), GeoJSON, File Geodatabase
- **Coordinate Reference System:** NAD83 / UTM zone appropriate
- **Key Attributes:**
  - Flood Zone Designation (A, AE, AH, AO, VE, X)
  - Base Flood Elevation (BFE) in feet NAVD88
  - Depth grid values for 100-year and 500-year events
  - Zone Subtypes: A99, AR, A1-A30, V1-V30

**Data Processing Pipeline:**
```python
# FEMA Flood Data Processing Architecture
class FEMAFloodProcessor:
    def __init__(self, data_path, crs='EPSG:4269'):
        self.data_path = data_path
        self.crs = crs
        self.depth_grids = {}
        self.flood_zones = {}
    
    def load_firm_data(self, county_fips):
        """Load FIRM data for specified county"""
        firm_path = f"{self.data_path}/FIRM/{county_fips}/"
        # Load S_FLD_HAZ_AR (flood hazard areas)
        # Load S_BFE (base flood elevations)
        # Load S_XS (cross-sections)
        pass
    
    def extract_depth_at_location(self, lat, lon, return_period=100):
        """Extract flood depth at specific coordinates"""
        # Spatial join with depth grid
        # Interpolate if between grid cells
        # Return depth in feet relative to ground elevation
        pass
    
    def calculate_aal(self, asset_inventory, damage_function):
        """Calculate Average Annual Loss for asset portfolio"""
        # Integrate over all return periods
        # Apply damage function
        # Sum across portfolio
        pass
```

**Integration Considerations:**
- FEMA data represents regulatory floodplains, not complete probabilistic flood risk
- Depth grids required for damage estimation (separate from FIRM polygons)
- First Floor Height (FFH) critical for accurate damage calculation
- Coastal vs. Riverine flooding requires different treatment

#### 1.1.2 First Street Foundation Flood Risk Data

**Data Source:** First Street Foundation Flood Model (FSF-FM)

**Technical Specifications:**
- **Spatial Resolution:** 30-meter grid cells (raster)
- **Temporal Coverage:** Current conditions + 30-year projections
- **Data Format:** GeoTIFF, API (JSON/XML)
- **Coordinate Reference System:** WGS84 (EPSG:4326)

**Key Data Fields:**
- Flood Factor (1-10 scale): Property-level risk indicator
- Annual probability by depth thresholds (0.5ft, 1ft, 2ft, 3ft, 4ft+)
- Cumulative probability over 5, 10, 15, 30 years
- Historic event count and maximum depth
- Adaptation project coverage

#### 1.1.3 JBA Risk Management Flood Data

**Data Source:** JBA Global Flood Maps and Probabilistic Flood Model

**Technical Specifications:**
- **Spatial Resolution:** 30m to 90m depending on region
- **Return Periods:** 20, 50, 100, 200, 500, 1000, 10000-year
- **Data Format:** NetCDF, GeoTIFF, ASCII grid
- **Flood Types:** Fluvial (riverine), Pluvial (surface water), Coastal, Groundwater
- **Regional Coverage:** 180+ countries

**Probabilistic Model Structure:**
```
JBA Probabilistic Flood Model Components:
├── Hydrological Model
│   ├── Rainfall-runoff transformation
│   ├── Catchment delineation
│   └── Flow routing
├── Hydraulic Model
│   ├── 1D/2D solver
│   ├── Boundary conditions
│   └── Roughness coefficients
├── Statistical Model
│   ├── Extreme value analysis
│   ├── Joint probability
│   └── Uncertainty quantification
└── Depth-Damage Integration
    ├── Building occupancy types
    ├── Depth-damage curves
    └── Contents valuation
```

### 1.2 Hurricane and Wind Hazard Data

#### 1.2.1 NOAA HURDAT Database

**Data Source:** NOAA Hurricane Research Division - HURDAT2

**Technical Specifications:**
- **Temporal Coverage:** Atlantic (1851-present), Pacific (1949-present)
- **Temporal Resolution:** 6-hourly (00Z, 06Z, 12Z, 18Z)
- **Data Format:** CSV, Fixed-width ASCII
- **Coordinate Reference System:** WGS84

**Status Codes:**
- TD: Tropical Depression (< 34 kts)
- TS: Tropical Storm (34-63 kts)
- HU: Hurricane (>= 64 kts)
- EX: Extratropical cyclone
- SD: Subtropical Depression
- SS: Subtropical Storm
- LO: Low (non-tropical)
- DB: Disturbance
- WV: Tropical Wave

#### 1.2.2 RMS Hurricane Models

**Data Source:** RMS (Moody's) Hurricane Models

**Technical Specifications:**
- **Event Catalogs:** 50,000+ stochastic events per region
- **Regional Coverage:** North Atlantic, Northwest Pacific, Australia, etc.
- **Key Outputs:**
  - 3-second gust wind speeds
  - Central pressure
  - Radius to maximum winds
  - Storm surge heights
  - Rainfall accumulations

#### 1.2.3 AIR Worldwide Hurricane Models

**Data Source:** AIR Worldwide (Verisk) Hurricane Models

**Technical Specifications:**
- **Event Catalogs:** 10,000+ years of simulated events
- **Regional Coverage:** US Atlantic/Gulf, Hawaii, Caribbean, etc.
- **Data Format:** Touchstone format, CSV

### 1.3 Wildfire Hazard Data

#### 1.3.1 USGS Wildfire Data

**Data Source:** USGS GeoMAC, MTBS (Monitoring Trends in Burn Severity)

**Technical Specifications:**
- **Spatial Resolution:** 30m (Landsat-based)
- **Temporal Coverage:** 1984-present
- **Data Format:** Shapefile, GeoTIFF

**MTBS Burn Severity Classes:**
| Class | dNBR Range | Description |
|-------|------------|-------------|
| Enhanced Regrowth High | -500 to -251 | Post-fire vegetation recovery |
| Enhanced Regrowth Low | -250 to -101 | Partial recovery |
| Unburned | -100 to 99 | No significant burn |
| Low Severity | 100 to 269 | Light burn |
| Moderate-Low Severity | 270 to 439 | Moderate burn |
| Moderate-High Severity | 440 to 659 | Significant burn |
| High Severity | 660 to 1300 | Severe burn |

#### 1.3.2 CAL FIRE Fire Hazard Severity Zones

**Data Source:** California Department of Forestry and Fire Protection

**Technical Specifications:**
- **Spatial Resolution:** Vector polygons
- **Temporal Coverage:** Updated periodically (latest 2025)
- **Classification:**
  - Very High Fire Hazard Severity Zone (VHFHSZ)
  - High Fire Hazard Severity Zone
  - Moderate Fire Hazard Severity Zone

### 1.4 Earthquake Hazard Data

#### 1.4.1 USGS ShakeMap

**Data Source:** USGS Earthquake Hazards Program - ShakeMap System

**Technical Specifications:**
- **Spatial Resolution:** 1km grid (nominally)
- **Temporal Coverage:** Real-time + historical events
- **Data Format:** XML (grid.xml), GeoTIFF, KML, HAZUS

**Intensity Parameters:**
| Parameter | Description | Units | Engineering Relevance |
|-----------|-------------|-------|----------------------|
| PGA | Peak Ground Acceleration | %g | Structural response, liquefaction |
| PGV | Peak Ground Velocity | cm/s | Structural damage, displacement |
| MMI | Modified Mercalli Intensity | I-XII | Damage assessment |
| PSA03 | Spectral Acceleration (0.3s) | %g | Short-period structures |
| PSA10 | Spectral Acceleration (1.0s) | %g | Mid-period structures |
| PSA30 | Spectral Acceleration (3.0s) | %g | Long-period structures |
| SVEL | Shear Wave Velocity (Vs30) | m/s | Site amplification |

**Modified Mercalli Intensity Scale:**
| MMI | Description | PGA Range (%g) | Damage Level |
|-----|-------------|----------------|--------------|
| I | Not felt | < 0.17 | None |
| II | Weak | 0.17-1.4 | None |
| III | Slight | 1.4-3.9 | None |
| IV | Moderate | 3.9-9.2 | Light |
| V | Rather Strong | 9.2-18 | Very Light |
| VI | Strong | 18-34 | Light |
| VII | Very Strong | 34-65 | Moderate |
| VIII | Destructive | 65-124 | Moderate-Heavy |
| IX | Violent | 124-242 | Heavy |
| X | Intense | > 242 | Very Heavy |

#### 1.4.2 GEM Global Earthquake Model

**Data Source:** Global Earthquake Model Foundation

**Technical Specifications:**
- **Event Catalogs:** Global stochastic events
- **Data Format:** OpenQuake NRML, CSV
- **Key Components:**
  - Global Seismic Hazard Map
  - Exposure Database
  - Vulnerability Functions
  - Risk Calculations

### 1.5 Severe Convective Storm Data

#### 1.5.1 NOAA Storm Prediction Center (SPC) Database

**Data Source:** NOAA SPC Severe Weather Database

**Technical Specifications:**
- **Temporal Coverage:** 1950-present
- **Temporal Resolution:** Event-based
- **Data Format:** CSV, Shapefile
- **Event Types:** Tornado, Hail, Wind

**Enhanced Fujita (EF) Scale:**
| EF Scale | Wind Speed (mph) | Damage Description |
|----------|------------------|-------------------|
| EF0 | 65-85 | Light damage |
| EF1 | 86-110 | Moderate damage |
| EF2 | 111-135 | Significant damage |
| EF3 | 136-165 | Severe damage |
| EF4 | 166-200 | Devastating damage |
| EF5 | >200 | Incredible damage |

### 1.6 Data Format Specifications

#### 1.6.1 Raster Data Formats

**GeoTIFF Structure:**
```
├── Image Data
│   ├── Band 1: Hazard intensity
│   ├── Band 2: Uncertainty (optional)
│   └── Band 3+: Additional parameters
├── Georeferencing
│   ├── Coordinate Reference System (CRS)
│   ├── Affine transformation
│   └── NoData value
└── Metadata
    ├── Creation date
    ├── Data source
    └── Processing history
```

**NetCDF Climate Data Structure:**
```
├── Dimensions
│   ├── time (unlimited)
│   ├── latitude
│   ├── longitude
│   └── (optional: level, ensemble)
├── Variables
│   ├── time (units: days since YYYY-MM-DD)
│   ├── latitude (units: degrees_north)
│   ├── longitude (units: degrees_east)
│   └── hazard_variable
│       ├── units (e.g., m/s, mm, degC)
│       ├── long_name
│       ├── standard_name (CF convention)
│       └── _FillValue
└── Global Attributes
    ├── title
    ├── institution
    ├── source
    ├── history
    └── Conventions (e.g., CF-1.8)
```

#### 1.6.2 Vector Data Formats

**Shapefile Components:**
- .shp - Main file (geometry)
- .shx - Index file
- .dbf - Attribute table (dBASE)
- .prj - Projection information
- .cpg - Code page for encoding

---

## 2. Chronic Hazard Data Sources and Processing

### 2.1 Sea Level Rise Data

#### 2.1.1 NOAA Sea Level Rise Projections

**Data Source:** NOAA Sea Level Rise Viewer, tide gauge stations

**Technical Specifications:**
- **Spatial Resolution:** Point locations (tide gauges) + regional interpolation
- **Temporal Coverage:** Historical (1900-present) + projections (to 2150)
- **Data Format:** CSV, NetCDF, GeoTIFF
- **Projection Scenarios:**
  - Low: 0.3m by 2100
  - Intermediate-Low: 0.5m by 2100
  - Intermediate: 1.0m by 2100
  - Intermediate-High: 1.5m by 2100
  - High: 2.0m by 2100

#### 2.1.2 IPCC AR6 Sea Level Rise Projections

**Data Source:** IPCC Sixth Assessment Report (AR6) - Working Group I

**Technical Specifications:**
- **SSP-RCP Scenarios:** SSP1-1.9, SSP1-2.6, SSP2-4.5, SSP3-7.0, SSP5-8.5
- **Confidence Levels:** Medium, Low (for high-end scenarios)
- **Components:**
  - Thermal expansion
  - Glacier mass loss
  - Greenland Ice Sheet
  - Antarctic Ice Sheet
  - Land water storage

**AR6 Sea Level Projection Structure:**
```
IPCC AR6 Sea Level Components:
├── Global Mean Sea Level (GMSL)
│   ├── Central estimate
│   ├── 5th-95th percentile range
│   └── 17th-83rd percentile range
├── Regional Sea Level Change
│   ├── Ocean dynamic sea level
│   ├── Gravitational fingerprint
│   ├── Glacial isostatic adjustment
│   └── Vertical land motion
└── Time Periods: 2050, 2100, 2150
```

### 2.2 Heat Stress Data

#### 2.2.1 ERA5 Reanalysis Heat Data

**Data Source:** ECMWF ERA5 Reanalysis

**Technical Specifications:**
- **Spatial Resolution:** 0.25° x 0.25° (approx. 31km)
- **Temporal Resolution:** Hourly, daily, monthly
- **Temporal Coverage:** 1940-present (back extension to 1950)
- **Data Format:** NetCDF, GRIB
- **Key Variables:**
  - 2m temperature (t2m)
  - Maximum 2m temperature (t2mx)
  - Minimum 2m temperature (t2mn)
  - Relative humidity
  - Dewpoint temperature

**Heat Stress Categories:**
| WBGT (°C) | Risk Level | Work/Activity Guidance |
|-----------|------------|----------------------|
| < 18 | None | No restrictions |
| 18-23 | Low | Alert |
| 23-28 | Moderate | Caution |
| 28-31 | High | Extreme caution |
| 31-32 | Very High | Limited activity |
| > 32 | Extreme | Activity cessation |

#### 2.2.2 CMIP6 Heat Stress Projections

**Data Source:** CMIP6 Model Ensemble

**Technical Specifications:**
- **Spatial Resolution:** 1° to 2° (model dependent)
- **Temporal Resolution:** Daily, Monthly
- **Scenario Coverage:** All SSP-RCP combinations
- **Variables:** Temperature, humidity, wind, radiation

### 2.3 Drought Data

#### 2.3.1 Standardized Precipitation Index (SPI)

**Technical Specifications:**
- **Calculation Period:** 1, 3, 6, 12, 24, 48 months
- **Distribution:** Gamma distribution for precipitation
- **Output:** Standard normal deviate (z-score)
- **Data Requirements:** Monthly precipitation totals

**SPI Classification:**
| SPI Value | Category | Drought Severity |
|-----------|----------|-----------------|
| > 2.0 | Extremely wet | - |
| 1.5 to 2.0 | Severely wet | - |
| 1.0 to 1.5 | Moderately wet | - |
| -0.99 to 0.99 | Near normal | Normal |
| -1.0 to -1.5 | Moderately dry | Moderate drought |
| -1.5 to -2.0 | Severely dry | Severe drought |
| < -2.0 | Extremely dry | Extreme drought |

#### 2.3.2 Standardized Precipitation Evapotranspiration Index (SPEI)

**Technical Specifications:**
- **Calculation Period:** 1, 3, 6, 12, 24, 48 months
- **Distribution:** Log-logistic distribution for water balance
- **Output:** Standard normal deviate (z-score)
- **Data Requirements:** Monthly precipitation, temperature

**SPEI vs SPI Comparison:**
| Index | Temperature Consideration | Best Application |
|-------|--------------------------|-----------------|
| SPI | No | Regions with stable temperature |
| SPEI | Yes (via PET) | Regions with temperature trends |
| SPEI-Thornthwaite | Limited (temp only) | Data-limited regions |
| SPEI-Penman-Monteith | Full (temp, RH, wind, rad) | Data-rich regions |

### 2.4 Precipitation Changes

#### 2.4.1 Intensity-Duration-Frequency (IDF) Curves

**Technical Specifications:**
- **Durations:** 1-hour to 7-day
- **Return Periods:** 2, 5, 10, 25, 50, 100, 200, 500 years
- **Distribution:** Generalized Extreme Value (GEV), Gumbel, Log-Pearson III

**IDF Curve Equation:**
```
General IDF Form: i = a / (d + b)^c
Where:
- i = rainfall intensity (mm/hr)
- d = duration (hours)
- a, b, c = empirical coefficients (vary by return period)
```

### 2.5 Downscaling Methods

#### 2.5.1 Dynamical Downscaling

**Technical Specifications:**
- **Method:** Regional Climate Models (RCMs)
- **Input:** GCM boundary conditions
- **Output:** High-resolution climate projections
- **Resolution:** 10-50km typical
- **Coordination:** CORDEX (Coordinated Regional Climate Downscaling Experiment)

**CORDEX Regional Domains:**
- Africa (CORDEX-AFR)
- South America (CORDEX-SAM)
- North America (CORDEX-NAM)
- Europe (CORDEX-EUR)
- Asia (CORDEX-SEA, CORDEX-CAS, CORDEX-EAS)
- Australia (CORDEX-AUS)
- Arctic (CORDEX-ARC)
- Antarctic (CORDEX-ANT)

#### 2.5.2 Statistical Downscaling

**Delta Method:**
- For temperature: additive delta (GCM_future - GCM_historical)
- For precipitation: multiplicative delta (GCM_future / GCM_historical)

**Quantile Mapping:**
- Empirical quantile mapping
- Quantile Delta Mapping (Cannon et al., 2015)
- Preserves relative changes in quantiles

### 2.6 Non-Stationarity in Climate Parameters

**Detection Methods:**
- Mann-Kendall trend test
- Pettitt test for change point detection
- Time-varying parameter estimation

---

## 3. Hazard Intensity Footprint Mapping

### 3.1 Geospatial Processing Pipeline

#### 3.1.1 Asset Coordinate Validation and Geocoding

Key validation rules:
- Latitude range: [-90, 90]
- Longitude range: [-180, 180]
- Precision: 6 decimal places
- Check for coordinate swaps

#### 3.1.2 Spatial Joins with Hazard Layers

**Methods:**
- Point-in-polygon joins
- Raster extraction at point locations
- Zonal statistics for polygon assets

### 3.2 Raster Extraction Methods

#### 3.2.1 Nearest Neighbor Interpolation
- Fastest method
- Suitable for categorical data

#### 3.2.2 Bilinear Interpolation
- Smooth interpolation
- Suitable for continuous data
- Formula: f(x,y) = (1-a)(1-b)*Q11 + a(1-b)*Q21 + (1-a)b*Q12 + ab*Q22

#### 3.2.3 Zonal Statistics for Polygons
- Mean, median, standard deviation
- Min/max values
- Percentile statistics
- Histogram distributions

### 3.3 Multi-Hazard Overlay Techniques

**Composite Index Methods:**
- Weighted sum
- Weighted product
- Maximum hazard value
- Copula-based combination

### 3.4 Temporal Alignment of Hazard Data

**Alignment Methods:**
- Resampling to common frequency
- Cross-correlation with time lags
- Temporal interpolation

---

## 4. Scenario-Based Hazard Projections

### 4.1 CMIP6 Model Ensemble Processing

**CMIP6 Models (28+ models):**
ACCESS-CM2, ACCESS-ESM1-5, BCC-CSM2-MR, CanESM5, CESM2, CESM2-WACCM, CMCC-CM2-SR5, CMCC-ESM2, CNRM-CM6-1, CNRM-ESM2-1, EC-Earth3, EC-Earth3-Veg, GFDL-CM4, GFDL-ESM4, GISS-E2-1-G, HadGEM3-GC31-LL, INM-CM4-8, INM-CM5-0, IPSL-CM6A-LR, KACE-1-0-G, MIROC6, MIROC-ES2L, MPI-ESM1-2-HR, MPI-ESM1-2-LR, MRI-ESM2-0, NorESM2-LM, NorESM2-MM, UKESM1-0-LL

#### 4.1.2 SSP-RCP Scenario Combinations

| Scenario | Description | Warming by 2100 |
|----------|-------------|-----------------|
| SSP1-1.9 | Very low emissions, sustainability focus | ~1.4C |
| SSP1-2.6 | Low emissions, sustainability focus | ~1.8C |
| SSP2-4.5 | Intermediate emissions, middle path | ~2.7C |
| SSP3-7.0 | High emissions, regional rivalry | ~3.6C |
| SSP5-8.5 | Very high emissions, fossil-fueled dev. | ~4.4C |

### 4.2 Bias Correction Methods

#### 4.2.1 Quantile Mapping
- Empirical CDF matching
- Quantile Delta Mapping (Cannon et al., 2015)
- Preserves relative changes in quantiles

#### 4.2.2 Delta Method
- Simple but preserves climate change signal
- Temperature: additive delta
- Precipitation: multiplicative delta

### 4.3 Internal Variability vs. Forced Response

**Decomposition:**
- Forced response = Ensemble mean across models
- Internal variability = Ensemble standard deviation
- Signal-to-noise ratio = |Forced Response| / Internal Variability
- Time of emergence = Time when SNR exceeds threshold

### 4.4 Model Weighting Approaches

**Weighting Methods:**
- Performance weighting (RMSE, correlation)
- Independence weighting (pairwise distances)
- Combined weighting (performance + independence)
- Bayesian Model Averaging

---

## 5. Uncertainty Quantification in Hazard Data

### 5.1 Ensemble Spread Analysis

**Spread Metrics:**
- Standard deviation
- Interquartile range (IQR)
- Range (max - min)
- Coefficient of variation

### 5.2 Confidence Intervals from Multiple Models

**Methods:**
- Bootstrap confidence intervals
- Bayesian Model Averaging CI
- Percentile-based intervals

### 5.3 Structural Uncertainty in Climate Models

**Uncertainty Components (Hawkins and Sutton, 2009):**
- Internal variability
- Model uncertainty (structural)
- Scenario uncertainty

### 5.4 Scenario Uncertainty Quantification

**Approaches:**
- Scenario spread analysis
- Probability assignment based on assumptions
- Expert judgment

### 5.5 Propagation to Damage Estimates

**Propagation Methods:**
- Monte Carlo simulation
- Analytical propagation (Taylor series)
- Latin Hypercube Sampling

---

## 6. Asset Vulnerability Database Integration

### 6.1 Building Typology Classification

**HAZUS Building Types:**
| Code | Description | Stories | Construction |
|------|-------------|---------|--------------|
| RES1 | Single Family Dwelling | 1-2 | Wood frame |
| RES2 | Mobile Home | 1 | Manufactured |
| RES3 | Multi Family Dwelling | 2-4 | Wood/Concrete |
| COM1 | Commercial - Retail | 1-3 | Steel/Concrete |
| COM2 | Commercial - Office | 1-10+ | Steel/Concrete |
| IND1 | Industrial - Light | 1-2 | Steel/Concrete |
| IND2 | Industrial - Heavy | 1-2 | Steel/Concrete |

### 6.2 Construction Era and Code Effects

**Code Epochs by Hazard:**

**Earthquake:**
| Epoch | Years | Vulnerability Factor |
|-------|-------|---------------------|
| Pre-code | < 1940 | 1.5 |
| Early seismic codes | 1940-1975 | 1.2 |
| Modern seismic codes | 1975-1994 | 1.0 |
| Post-Northridge | > 1994 | 0.8 |

**Flood:**
| Epoch | Years | Vulnerability Factor |
|-------|-------|---------------------|
| Pre-FIRM | < 1970 | 1.3 |
| Post-FIRM | > 1970 | 1.0 |

**Wind:**
| Epoch | Years | Vulnerability Factor |
|-------|-------|---------------------|
| Pre-Andrew | < 1992 | 1.4 |
| Post-Andrew | > 1992 | 1.0 |

### 6.3 Depth-Damage Curve Libraries

#### 6.3.1 FEMA Depth-Damage Curves

**Sources:**
- BCAR (Benefit-Cost Analysis Re-engineering)
- FIMA credibility-weighted damages
- USACE district-specific curves

**Example Curves:**
| Curve ID | Description | Structure Damage at 4ft | Content Damage at 4ft |
|----------|-------------|------------------------|----------------------|
| RES1_1SB | Single Family, 1 Story, Slab | 33% | 53% |
| RES1_1WB | Single Family, 1 Story, With Basement | 36% | 57% |
| COM1 | Commercial - Retail | 31% | 52% |

#### 6.3.2 JRC Depth-Damage Curves

**European Curves (EUR/m2):**
| Building Type | 0.5m | 1.0m | 2.0m | 3.0m |
|--------------|------|------|------|------|
| Residential - Detached | 150 | 350 | 750 | 1050 |
| Residential - Apartment | 200 | 450 | 900 | 1250 |
| Commercial - Retail | 300 | 650 | 1300 | 1750 |
| Commercial - Office | 250 | 550 | 1100 | 1475 |

### 6.4 Regional Vulnerability Variations

**Regional Adjustment Factors:**
| Region | Flood | Wind | Earthquake |
|--------|-------|------|------------|
| US Gulf Coast | 1.1 | 1.2 | 0.5 |
| California | 0.9 | 0.8 | 1.5 |
| US Midwest | 1.0 | 1.1 | 0.3 |
| Europe North Sea | 1.2 | 1.1 | 0.3 |
| Europe Mediterranean | 0.9 | 0.9 | 1.2 |

### 6.5 Retrofit and Resilience Measures

#### Flood Retrofit Measures:
| Measure | Cost/sqft | Damage Reduction | Applicable To |
|---------|-----------|------------------|---------------|
| Elevation | $150 | 80% | RES1, RES2, RES3 |
| Wet floodproofing | $25 | 40% | RES1, COM1, COM2 |
| Dry floodproofing | $50 | 60% | COM1, COM2, IND1 |
| Barriers | $30 | 50% | RES1, COM1, COM2, IND1 |

#### Earthquake Retrofit Measures:
| Measure | Cost/sqft | Damage Reduction | Applicable To |
|---------|-----------|------------------|---------------|
| Soft-story retrofit | $75 | 70% | RES3, COM1, COM2 |
| Cripple wall bracing | $20 | 50% | RES1 |
| Foundation bolting | $15 | 40% | RES1, RES2 |
| Moment frames | $100 | 65% | COM2, IND1, IND2 |

#### Wind Retrofit Measures:
| Measure | Cost/sqft | Damage Reduction | Applicable To |
|---------|-----------|------------------|---------------|
| Roof straps | $5 | 30% | RES1, RES2, RES3 |
| Impact windows | $25 | 45% | RES1, RES3, COM1, COM2 |
| Roof replacement | $40 | 55% | RES1, RES3, COM1 |

---

## Appendix A: Data Source Summary

### A.1 Acute Hazard Data Sources

| Hazard | Primary Source | Resolution | Format | Coverage |
|--------|---------------|------------|--------|----------|
| Flood | FEMA NFHL | Vector | Shapefile | US |
| Flood | First Street | 30m | API/GeoTIFF | US |
| Flood | JBA | 30-90m | NetCDF | Global |
| Hurricane | NOAA HURDAT2 | 6-hourly | CSV | Atlantic/Pacific |
| Hurricane | RMS | Stochastic | Proprietary | Multiple regions |
| Hurricane | AIR | Stochastic | Proprietary | Multiple regions |
| Wildfire | USGS MTBS | 30m | Shapefile | US |
| Wildfire | CAL FIRE FHSZ | Vector | Shapefile | California |
| Earthquake | USGS ShakeMap | 1km | XML/GeoTIFF | Global |
| Earthquake | GEM | Variable | OpenQuake NRML | Global |
| Severe Storm | NOAA SPC | Event | CSV | US |

### A.2 Chronic Hazard Data Sources

| Hazard | Primary Source | Resolution | Format | Coverage |
|--------|---------------|------------|--------|----------|
| Sea Level Rise | NOAA | Point | CSV | US coast |
| Sea Level Rise | IPCC AR6 | 1° | NetCDF | Global |
| Heat Stress | ERA5 | 0.25° | NetCDF | Global |
| Heat Stress | CMIP6 | 1-2° | NetCDF | Global |
| Drought | CRU/SPEIbase | 0.5° | NetCDF | Global |
| Precipitation | CMIP6 | 1-2° | NetCDF | Global |

### A.3 Vulnerability Data Sources

| Source | Hazard Types | Coverage | Format |
|--------|-------------|----------|--------|
| FEMA HAZUS | Flood, Earthquake, Hurricane | US | Database |
| GEM | Earthquake | Global | OpenQuake |
| JRC | Flood | Europe | Database |
| RMS | Multiple | Global | Proprietary |
| AIR | Multiple | Global | Proprietary |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | AA Impact Inc. | Initial release |

---

*This document provides technical specifications for climate data integration in physical risk modeling. For implementation support, contact AA Impact Inc. Climate Data Science Team.*
