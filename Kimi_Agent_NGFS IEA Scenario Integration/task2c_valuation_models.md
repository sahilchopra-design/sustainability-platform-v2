# Multi-Sector Asset Valuation Engine
## Real Estate, Energy, and Infrastructure Valuation Models

**AA Impact Inc. - MAI Real Estate & Infrastructure Appraisal Division**

---

# Table of Contents

1. [Hedonic Pricing Model for Residential Real Estate](#1-hedonic-pricing-model-for-residential-real-estate)
2. [Dynamic DCF for Commercial Real Estate (CRE)](#2-dynamic-dcf-for-commercial-real-estate-cre)
3. [Ricardian Rent Model for Agricultural Land](#3-ricardian-rent-model-for-agricultural-land)
4. [Depreciated Replacement Cost (DRC) for Infrastructure](#4-depreciated-replacement-cost-drc-for-infrastructure)
5. [Renewable Generation LCOE Adjustments](#5-renewable-generation-lcoe-adjustments)
6. [Transmission Grid and Energy Storage Valuation](#6-transmission-grid-and-energy-storage-valuation)

---

# 1. Hedonic Pricing Model for Residential Real Estate

## 1.1 Model Overview

The hedonic pricing model decomposes property value into constituent characteristics, enabling isolation of climate risk premiums. This approach treats housing as a differentiated product with implicit prices for each attribute.

## 1.2 Core Model Specification

### 1.2.1 Base Log-Linear Model

$$\ln(P_i) = \beta_0 + \sum_{j=1}^{k} \beta_j X_{ij} + \gamma_1 FloodRisk_i + \gamma_2 HeatRisk_i + \gamma_3 WindRisk_i + \delta_s + \epsilon_i$$

Where:
- $P_i$ = Transaction price of property $i$
- $X_{ij}$ = Vector of structural and locational attributes
- $\beta_j$ = Implicit prices (hedonic coefficients)
- $\gamma$ = Climate risk coefficients
- $\delta_s$ = Spatial fixed effects (census tract/block group)
- $\epsilon_i$ = Error term with spatial autocorrelation adjustment

### 1.2.2 Extended Semi-Log Model with Interactions

$$\ln(P_i) = \beta_0 + \mathbf{X}_i'\boldsymbol{\beta} + \boldsymbol{\Gamma}'\mathbf{Climate}_i + \boldsymbol{\Lambda}'(\mathbf{X}_i \otimes \mathbf{Climate}_i) + \delta_s + \tau_t + \epsilon_i$$

Where interaction terms capture heterogeneous climate impacts:
- $\mathbf{X}_i \otimes \mathbf{Climate}_i$ = Element-wise interaction between attributes and climate risks
- $\tau_t$ = Time fixed effects (year-quarter)

### 1.2.3 Spatial Lag Model (Addressing Spatial Autocorrelation)

$$\ln(P_i) = \rho \sum_{j} W_{ij} \ln(P_j) + \mathbf{X}_i'\boldsymbol{\beta} + \boldsymbol{\Gamma}'\mathbf{Climate}_i + \epsilon_i$$

Where:
- $\rho$ = Spatial autoregressive coefficient
- $W_{ij}$ = Spatial weights matrix (inverse distance or k-nearest neighbors)

## 1.3 Structural Attributes Vector

### 1.3.1 Physical Characteristics

$$\mathbf{X}^{structural} = \begin{bmatrix} 
\ln(SqFt_i) & \text{(Square footage, log-transformed)} \\
Bedrooms_i & \text{(Number of bedrooms)} \\
Bathrooms_i & \text{(Number of bathrooms)} \\
\ln(LotSize_i) & \text{(Lot size in acres, log)} \\
Age_i & \text{(Property age in years)} \\
Age_i^2 & \text{(Age squared - depreciation curve)} \\
Stories_i & \text{(Number of stories)} \\
Garage_i & \text{(Garage spaces)} \\
Pool_i & \text{(Pool indicator)} \\
Condition_i & \text{(Categorical: 1-5 scale)} \\
Quality_i & \text{(Construction quality: 1-5 scale)} \\
Renovation_i & \text{(Years since last renovation)} \\
\end{bmatrix}$$

### 1.3.2 Depreciation Function

$$Depreciation_i = \beta_{age} \cdot Age_i + \beta_{age2} \cdot Age_i^2 + \beta_{cond} \cdot Condition_i$$

The quadratic age term captures non-linear depreciation (steeper in early years, flattening over time).

## 1.4 Location Attributes Vector

### 1.4.1 Accessibility and Amenities

$$\mathbf{X}^{location} = \begin{bmatrix}
SchoolScore_i & \text{(School district quality index)} \\
CrimeIndex_i & \text{(Crime rate per 1000 residents)} \\
TransitScore_i & \text{(Walk Score / Transit Score)} \\
DistCBD_i & \text{(Distance to central business district)} \\
DistWater_i & \text{(Distance to water body)} \\
DistPark_i & \text{(Distance to nearest park)} \\
Elevation_i & \text{(Elevation in feet)} \\
Slope_i & \text{(Terrain slope percentage)} \\
\end{bmatrix}$$

### 1.4.2 Accessibility Index Construction

$$Accessibility_i = \sum_{k} \frac{A_k}{d_{ik}^\alpha} \cdot e^{-\beta \cdot t_{ik}}$$

Where:
- $A_k$ = Amenity value at location $k$
- $d_{ik}$ = Distance from property $i$ to amenity $k$
- $t_{ik}$ = Travel time
- $\alpha$ = Distance decay parameter (typically 1-2)
- $\beta$ = Time sensitivity parameter

## 1.5 Climate Risk Attributes

### 1.5.1 Flood Risk Specification

$$FloodRisk_i = \sum_{z \in Z} \pi_z \cdot D_{iz} \cdot S_z$$

Where:
- $Z$ = Set of flood zones (100-year, 500-year, coastal)
- $\pi_z$ = Probability of flooding in zone $z$
- $D_{iz}$ = Indicator for property $i$ in zone $z$
- $S_z$ = Severity multiplier for zone $z$

**FEMA Flood Zone Classifications:**
| Zone | Description | Annual Probability | Severity |
|------|-------------|-------------------|----------|
| X (shaded) | 0.2% annual chance | 0.002 | 0.3 |
| X (unshaded) | Minimal risk | 0.001 | 0.1 |
| A | 1% annual chance | 0.01 | 1.0 |
| AE | 1% with BFE | 0.01 | 1.2 |
| AH | 1% shallow flooding | 0.01 | 0.8 |
| AO | 1% sheet flow | 0.01 | 0.7 |
| VE | Coastal high hazard | 0.01 | 1.5 |

### 1.5.2 Heat Risk Specification

$$HeatRisk_i = \sum_{t \in T} \frac{DaysAboveThreshold_t}{|T|} \cdot HeatIndex_t \cdot UrbanHeat_i$$

Where:
- $DaysAboveThreshold_t$ = Days exceeding 95°F in year $t$
- $HeatIndex_t$ = Humidity-adjusted heat index
- $UrbanHeat_i$ = Urban heat island intensity at location $i$

$$UrbanHeat_i = \alpha_0 + \alpha_1 \cdot Impervious_i + \alpha_2 \cdot TreeCover_i + \alpha_3 \cdot PopDensity_i$$

### 1.5.3 Wildfire Risk Specification

$$WildfireRisk_i = FireProb_i \cdot BurnSeverity_i \cdot StructureVulnerability_i$$

Where:
- $FireProb_i$ = Annual probability of wildfire occurrence
- $BurnSeverity_i$ = Expected fire intensity
- $StructureVulnerability_i$ = Building-specific vulnerability factor

### 1.5.4 Wind Risk Specification

$$WindRisk_i = \sum_{cat} P(Category_{cat}) \cdot DamageFactor_{cat} \cdot Exposure_i$$

Where:
- $P(Category_{cat})$ = Probability of hurricane/tornado category
- $DamageFactor_{cat}$ = Expected damage percentage
- $Exposure_i$ = Building exposure factor

### 1.5.5 Composite Climate Risk Index

$$ClimateRisk_i^{composite} = w_1 \cdot FloodRisk_i + w_2 \cdot HeatRisk_i + w_3 \cdot WildfireRisk_i + w_4 \cdot WindRisk_i$$

With weights $w_k$ calibrated to historical damage data.

## 1.6 Spatial Fixed Effects

### 1.6.1 Census Tract Fixed Effects

$$\delta_s^{tract} = \frac{1}{n_s} \sum_{i \in s} \left[ \ln(P_i) - \mathbf{X}_i'\boldsymbol{\beta} \right]$$

Controls for unobserved neighborhood characteristics:
- Local amenities not captured in data
- Neighborhood reputation and stigma
- Unmeasured school quality factors
- Local zoning and development patterns

### 1.6.2 Spatial Error Model

$$\epsilon_i = \lambda \sum_{j} W_{ij} \epsilon_j + u_i$$

Where $u_i \sim N(0, \sigma^2)$ is i.i.d.

## 1.7 Instrumental Variables for Endogeneity

### 1.7.1 Endogeneity Sources

1. **Simultaneity**: Price affects neighborhood quality
2. **Omitted variables**: Unobserved attributes correlated with climate risk
3. **Measurement error**: In climate risk assessments

### 1.7.2 Instrumental Variable Specifications

**For Flood Risk:**
- Historical floodplain boundaries (pre-FIRM)
- Natural drainage patterns (slope, elevation)
- Distance to nearest water body squared

**For Heat Risk:**
- Historical land use patterns
- Pre-development vegetation cover
- Distance to industrial zones

**IV Estimation (2SLS):**

$$\text{First Stage: } \widehat{ClimateRisk}_i = \mathbf{Z}_i'\boldsymbol{\pi} + \mathbf{X}_i'\boldsymbol{\gamma} + \nu_i$$

$$\text{Second Stage: } \ln(P_i) = \beta_0 + \mathbf{X}_i'\boldsymbol{\beta} + \gamma \cdot \widehat{ClimateRisk}_i + \epsilon_i$$

## 1.8 Climate Impact Valuation

### 1.8.1 Marginal Willingness to Pay (MWTP)

$$MWTP_{climate} = \frac{\partial P}{\partial ClimateRisk} = \gamma \cdot \bar{P}$$

For log-linear model, percentage impact:
$$\%\Delta P = (e^{\gamma} - 1) \times 100$$

### 1.8.2 Capitalization Rate Adjustment

$$r_i^{climate} = r_{base} + \rho_1 \cdot FloodRisk_i + \rho_2 \cdot HeatRisk_i$$

Where $\rho$ parameters represent risk premiums.

### 1.8.3 Insurance Cost Capitalization

$$\Delta P_i^{insurance} = -\sum_{t=1}^{T} \frac{\Delta InsuranceCost_t}{(1+r)^t}$$

## 1.9 Data Sources and Integration

| Data Layer | Source | Resolution | Update Frequency |
|------------|--------|------------|------------------|
| Property transactions | County assessor / Zillow | Parcel | Daily |
| Structural attributes | CoreLogic / Costar | Parcel | Quarterly |
| Flood zones | FEMA NFHL | Parcel | Annual |
| Elevation | USGS 3DEP | 1/3 arc-second | Static |
| Climate projections | NOAA / PRISM | 4km grid | Annual |
| Heat island | NASA MODIS / Landsat | 30m | Monthly |
| Wildfire risk | USFS / First Street | 30m | Annual |
| School quality | GreatSchools / State DOE | School district | Annual |
| Crime data | FBI UCR / Local PD | Census tract | Annual |
| Transit access | OpenStreetMap / GTFS | Parcel | Quarterly |

### 1.9.1 OpenStreetMap Integration

```python
# OSM Feature Extraction
osm_features = {
    'amenity': ['school', 'hospital', 'park', 'supermarket'],
    'highway': ['primary', 'secondary', 'residential'],
    'public_transport': ['station', 'stop_position'],
    'natural': ['water', 'wood', 'wetland']
}

# Distance calculation
accessibility_score = sum([1/distance(feature) * weight(feature) 
                          for feature in nearby_features])
```

### 1.9.2 FEMA Flood Map Integration

```python
# Flood zone overlay
flood_zone = overlay(property_parcel, fema_sfha)
flood_risk_score = zone_risk_mapping[flood_zone]
bfe_elevation = get_base_flood_elevation(property_parcel)
floor_height_above_bfe = property_elevation - bfe_elevation
```

## 1.10 Model Validation and Diagnostics

### 1.10.1 Goodness of Fit Metrics

- $R^2$ and Adjusted $R^2$
- Root Mean Square Error (RMSE)
- Mean Absolute Percentage Error (MAPE)
- Moran's I for spatial autocorrelation

### 1.10.2 Cross-Validation

$$CV_{score} = \frac{1}{K} \sum_{k=1}^{K} \left[ \frac{1}{n_k} \sum_{i \in k} (P_i - \hat{P}_i)^2 \right]$$

### 1.10.3 Out-of-Sample Prediction

$$PredictionError = \frac{1}{n_{test}} \sum_{i \in test} \left| \frac{P_i - \hat{P}_i}{P_i} \right|$$

---

# 2. Dynamic DCF for Commercial Real Estate (CRE)

## 2.1 Model Overview

The Dynamic Discounted Cash Flow model for commercial real estate incorporates climate risk through explicit adjustments to income, expenses, and terminal value. This forward-looking approach captures the evolving nature of climate impacts on property performance.

## 2.2 Property-Level Cash Flow Architecture

### 2.2.1 Gross Potential Income (GPI)

$$GPI_t = \sum_{u=1}^{U} Rent_{u,t} \cdot SF_u \cdot (1 + g_{market})^t \cdot (1 + g_{climate,t}^{rent})^{\mathbb{1}_{climate}}$$

Where:
- $Rent_{u,t}$ = Contract rent per square foot for unit $u$ in year $t$
- $SF_u$ = Square footage of unit $u$
- $g_{market}$ = Market rent growth rate
- $g_{climate,t}^{rent}$ = Climate-adjusted rent growth (negative for at-risk properties)

### 2.2.2 Vacancy and Collection Loss

$$Vacancy_t = Vacancy_{base} + \Delta Vacancy_t^{climate} + \Delta Vacancy_t^{cycle}$$

$$\Delta Vacancy_t^{climate} = \alpha_0 + \alpha_1 \cdot FloodDamage_t + \alpha_2 \cdot HeatDays_t + \alpha_3 \cdot WindDamage_t$$

$$CollectionLoss_t = \beta \cdot GPI_t \cdot (1 - Occupancy_t)$$

### 2.2.3 Effective Gross Income (EGI)

$$EGI_t = GPI_t \times (1 - Vacancy_t - CollectionLoss_t) + OtherIncome_t$$

### 2.2.4 Operating Expenses (OE)

$$OE_t = \sum_{e \in E} Expense_{e,t} \times (1 + g_e)^t \times ClimateFactor_{e,t}$$

Expense Categories with Climate Adjustments:

| Expense Category | Base Growth | Climate Factor |
|------------------|-------------|----------------|
| Property Tax | 2.5% | $\tau \cdot FloodRisk$ |
| Insurance | 5.0% | $(1 + g_{ins})^{t}$ |
| Utilities | 3.0% | $\delta \cdot HeatDays_t$ |
| Maintenance | 2.5% | $\mu \cdot Damage_t$ |
| Management | 3.0% | 1.0 |
| Security | 2.0% | $\sigma \cdot Crime_t$ |

### 2.2.5 Net Operating Income (NOI)

$$NOI_t = EGI_t - OE_t$$

### 2.2.6 Net Cash Flow

$$NCF_t = NOI_t - CapEx_t - LeasingCosts_t - Reserves_t$$

## 2.3 Climate Adjustments to Cash Flows

### 2.3.1 Insurance Premium Dynamics

$$Insurance_t = Insurance_0 \times \prod_{s=1}^{t} (1 + g_{climate,s}) \times (1 + g_{market,s})$$

Where climate growth rate follows:

$$g_{climate,t} = \beta_0 + \beta_1 \cdot FloodRisk \cdot Trend_t + \beta_2 \cdot Claims_t + \beta_3 \cdot Regulatory_t$$

**Insurance Escalation Model:**

$$Insurance_t = Insurance_0 \times e^{\lambda t + \phi \cdot CumulativeDamage_t}$$

Where:
- $\lambda$ = Base insurance inflation rate
- $\phi$ = Claims experience factor
- $CumulativeDamage_t$ = Sum of historical climate damages

### 2.3.2 Capital Expenditure for Resilience

$$CapEx_t^{resilience} = CapEx_t^{routine} + CapEx_t^{climate}$$

$$CapEx_t^{climate} = \sum_{m \in M} Investment_m \cdot \mathbb{1}_{[t = T_m]} \cdot DiscountFactor_m$$

Where resilience measures $M$ include:
- Flood barriers and elevation
- HVAC upgrades for heat
- Storm-resistant windows and roofing
- Backup power systems
- Water conservation systems

**Resilience Investment NPV:**

$$NPV_{resilience} = \sum_t \frac{\Delta Insurance_t + \Delta Damage_t + \Delta Vacancy_t}{(1+r)^t} - CapEx_0^{resilience}$$

### 2.3.3 Vacancy Rate Sensitivity

$$Vacancy_t = Vacancy_{base} + \alpha_1 \cdot FloodDamage_t + \alpha_2 \cdot HeatStress_t + \alpha_3 \cdot Accessibility_t$$

Where:
- $FloodDamage_t$ = Expected flood damage in year $t$
- $HeatStress_t$ = Heat-related tenant discomfort index
- $Accessibility_t$ = Transportation disruption probability

**Tenant Migration Model:**

$$TenantRetention_t = Retention_{base} \times (1 - \rho_1 \cdot FloodEvents_t) \times (1 - \rho_2 \cdot HeatDays_t)$$

### 2.3.4 Rent Growth Climate Adjustment

$$g_t^{rent} = g_{market} + \gamma_1 \cdot ClimateRisk_t + \gamma_2 \cdot Resilience_t$$

Where $\gamma_1 < 0$ (climate risk reduces rent growth) and $\gamma_2 > 0$ (resilience investments mitigate).

## 2.4 Terminal Value Calculation

### 2.4.1 Terminal Cap Rate

$$CapRate_T = CapRate_{exit} + \Delta CapRate^{climate}$$

$$\Delta CapRate^{climate} = \kappa_1 \cdot FloodRisk_T + \kappa_2 \cdot HeatRisk_T + \kappa_3 \cdot StrandedAsset_T$$

### 2.4.2 Terminal Value Formula

$$TV_T = \frac{NOI_{T+1}}{CapRate_T}$$

### 2.4.3 Alternative Terminal Value: Direct Capitalization

$$TV_T = NOI_T \times \frac{1 - (1 + g)^{-n}}{r - g}$$

Where $n$ = remaining economic life adjusted for climate degradation.

## 2.5 Property Value Calculation

### 2.5.1 Unlevered Property Value

$$V_{property} = \sum_{t=1}^{T} \frac{NCF_t}{(1 + r)^t} + \frac{TV_T}{(1 + r)^T}$$

### 2.5.2 Discount Rate Specification

$$r = r_f + RP_{market} + RP_{property} + RP_{climate}$$

Where:
- $r_f$ = Risk-free rate
- $RP_{market}$ = Market risk premium
- $RP_{property}$ = Property type premium
- $RP_{climate}$ = Climate risk premium

$$RP_{climate} = \delta_1 \cdot FloodRisk + \delta_2 \cdot HeatRisk + \delta_3 \cdot TransitionRisk$$

### 2.5.3 Levered Equity Value

$$V_{equity} = V_{property} - Debt$$

$$DebtService_t = PMT(InterestRate, Amortization, Principal)$$

$$EquityCF_t = NCF_t - DebtService_t$$

$$V_{equity} = \sum_{t=1}^{T} \frac{EquityCF_t}{(1 + r_{equity})^t} + \frac{EquityTV_T}{(1 + r_{equity})^T}$$

## 2.6 Sensitivity Analysis Framework

### 2.6.1 Tornado Diagram Inputs

| Variable | Base Case | Low | High | Impact on Value |
|----------|-----------|-----|------|-----------------|
| Market Rent Growth | 3.0% | 1.5% | 4.5% | ±15% |
| Vacancy Rate | 8% | 5% | 15% | ±20% |
| Insurance Growth | 5% | 3% | 12% | ±12% |
| Cap Rate | 6.0% | 5.0% | 8.0% | ±25% |
| Flood Damage | $0 | $0 | $500K/yr | ±18% |
| Heat Impact | $0 | $0 | $200K/yr | ±8% |

### 2.6.2 Monte Carlo Simulation

$$V_{property}^{sim} = f(\tilde{X}_1, \tilde{X}_2, ..., \tilde{X}_n)$$

Where $\tilde{X}_i$ are random variables drawn from specified distributions:

```
For i = 1 to N_simulations:
    RentGrowth ~ N(μ=3%, σ=1%)
    Vacancy ~ Beta(α=2, β=8)
    InsuranceGrowth ~ LogNormal(μ=5%, σ=3%)
    FloodDamage ~ Poisson(λ) × SeverityDistribution
    CapRate ~ N(μ=6%, σ=0.5%)
    
    V[i] = CalculatePropertyValue(inputs)
End For

ValueAtRisk = Percentile(V, 5%)
ExpectedValue = Mean(V)
```

### 2.6.3 Scenario Analysis

**Scenario 1: Base Case**
- No additional climate impacts beyond current trends
- Insurance grows at 5% annually
- No major damage events

**Scenario 2: Moderate Climate Impact**
- 10% increase in extreme weather frequency
- Insurance grows at 8% annually
- One major flood event in year 5

**Scenario 3: Severe Climate Impact**
- 25% increase in extreme weather frequency
- Insurance grows at 12% annually
- Multiple damage events, potential tenant exodus
- Stranded asset risk emerges

## 2.7 Property Type Specific Adjustments

### 2.7.1 Office Buildings

$$NOI_t^{office} = NOI_t^{base} \times (1 - RemoteWork_t)^{\beta} \times (1 - HeatProductivity_t)^{\gamma}$$

Where:
- $RemoteWork_t$ = Percentage of workforce remote
- $HeatProductivity_t$ = Productivity loss from heat

### 2.7.2 Retail Properties

$$NOI_t^{retail} = NOI_t^{base} \times Traffic_t \times (1 - FloodAccess_t)$$

Where $Traffic_t$ depends on accessibility and consumer behavior shifts.

### 2.7.3 Industrial/Warehouse

$$NOI_t^{industrial} = NOI_t^{base} \times SupplyChain_t \times (1 - FloodDamage_t)$$

### 2.7.4 Multifamily Residential

$$NOI_t^{multifamily} = NOI_t^{base} \times Migration_t \times (1 - HeatDiscomfort_t)$$

## 2.8 Data Sources and Integration

| Data Element | Source | Frequency |
|--------------|--------|-----------|
| Rent comparables | CoStar / REIS | Monthly |
| Operating expenses | IREM / BOMA | Annual |
| Insurance costs | Marshall & Swift | Quarterly |
| Climate projections | First Street / RMS | Annual |
| Flood risk | FEMA / First Street | Annual |
| Property characteristics | Costar / RCA | Quarterly |
| Market cap rates | Real Capital Analytics | Monthly |

---

# 3. Ricardian Rent Model for Agricultural Land

## 3.1 Model Overview

The Ricardian approach models agricultural land value as the present value of expected future rents, where rents depend on climate-dependent yields, prices, and costs. This cross-sectional and panel framework captures adaptation behavior and crop switching options.

## 3.2 Land Value as Present Value of Rents

### 3.2.1 Basic Present Value Formula

$$V = \sum_{t=1}^{\infty} \frac{R_t}{(1+r)^t} = \frac{R}{r - g}$$

Where:
- $R_t$ = Net rent in year $t$
- $r$ = Discount rate
- $g$ = Growth rate of rents (if constant)

### 3.2.2 Rent as Function of Climate, Prices, and Costs

$$R_t = P_t \cdot Q_t(C_t, X_t) - C_t^{inputs} - C_t^{fixed}$$

Where:
- $P_t$ = Output price
- $Q_t$ = Yield (function of climate $C_t$ and inputs $X_t$)
- $C_t^{inputs}$ = Variable input costs
- $C_t^{fixed}$ = Fixed costs

### 3.2.3 Stochastic Rent Model

$$V = \mathbb{E}\left[ \sum_{t=1}^{\infty} \frac{R_t(C_t, P_t)}{(1+r)^t} \right]$$

Where expectations are taken over climate and price distributions.

## 3.3 Production Function Specification

### 3.3.1 Climate-Dependent Yield Function

$$Q = f(T, P, CO_2, Soil, Water, Inputs) \cdot \epsilon$$

Where:
- $T$ = Temperature (growing season)
- $P$ = Precipitation
- $CO_2$ = Atmospheric CO2 concentration
- $Soil$ = Soil quality index
- $Water$ = Irrigation water availability
- $Inputs$ = Fertilizer, labor, capital
- $\epsilon$ = Random shock

### 3.3.2 Temperature Effects (Quadratic Relationship)

$$Q(T) = \alpha_0 + \alpha_1 T + \alpha_2 T^2 + \alpha_3 T^3$$

Optimal temperature: $T^* = \frac{-\alpha_1}{2\alpha_2}$ (for quadratic)

**Temperature Impact by Crop:**

| Crop | Optimal Temp (°C) | Heat Threshold | Cold Damage |
|------|-------------------|----------------|-------------|
| Corn | 24-28 | >38°C | <10°C |
| Wheat | 15-20 | >34°C | <-5°C |
| Soybeans | 25-30 | >35°C | <5°C |
| Cotton | 27-32 | >40°C | <12°C |
| Rice | 25-28 | >36°C | <15°C |

### 3.3.3 Precipitation Effects (Threshold Model)

$$Q(P) = \beta_0 + \beta_1 P + \beta_2 P^2 + \beta_3 \mathbb{1}_{[P < P_{min}]} + \beta_4 \mathbb{1}_{[P > P_{max}]}$$

Where:
- $P_{min}$ = Minimum viable precipitation
- $P_{max}$ = Precipitation causing waterlogging

### 3.3.4 CO2 Fertilization Effect

$$Q(CO_2) = Q_{base} \times (1 + \gamma \cdot \ln(\frac{CO_2}{CO_{2,base}}))$$

Where $\gamma$ is the CO2 fertilization coefficient (typically 0.1-0.3 for C3 crops, 0.05-0.15 for C4 crops).

### 3.3.5 Complete Production Function

$$\ln(Q) = \beta_0 + \beta_1 T + \beta_2 T^2 + \beta_3 P + \beta_4 P^2 + \beta_5 (T \times P) + \beta_6 CO_2 + \beta_7 Soil + \beta_8 Water + \beta_9 \ln(Inputs) + \epsilon$$

## 3.4 Climate Impact on Land Values

### 3.4.1 Ricardian Cross-Sectional Model

$$\ln(LandValue_i) = \alpha_0 + \sum_{m=1}^{12} \beta_m T_{i,m} + \sum_{m=1}^{12} \gamma_m T_{i,m}^2 + \sum_{m=1}^{12} \delta_m P_{i,m} + \sum_{m=1}^{12} \theta_m P_{i,m}^2 + \mathbf{X}_i'\boldsymbol{\phi} + \epsilon_i$$

Where:
- $T_{i,m}$ = Temperature in month $m$ for county/parcel $i$
- $P_{i,m}$ = Precipitation in month $m$
- $\mathbf{X}_i$ = Control variables (soil, elevation, market access)

### 3.4.2 Marginal Climate Impacts

$$\frac{\partial \ln(V)}{\partial T_m} = \beta_m + 2\gamma_m T_m$$

$$\frac{\partial \ln(V)}{\partial P_m} = \delta_m + 2\theta_m P_m$$

### 3.4.3 Aggregate Climate Impact

$$\Delta V = \sum_m \left[ \beta_m \Delta T_m + \gamma_m (2T_m \Delta T_m + \Delta T_m^2) + \delta_m \Delta P_m + \theta_m (2P_m \Delta P_m + \Delta P_m^2) \right]$$

## 3.5 Crop Switching and Adaptation

### 3.5.1 Crop Choice Model

$$Crop^* = \arg\max_{c \in C} \mathbb{E}[\pi_c]$$

Where $\pi_c$ = profit from crop $c$.

### 3.5.2 Option Value of Crop Switching

$$V^{adaptation} = V^{base} + \sum_{c \in C} p_c \cdot \max(0, \pi_c - \pi_{current})$$

Where $p_c$ = probability of switching to crop $c$.

### 3.5.3 Adaptation Timeline

$$Adaptation_t = \alpha \cdot ClimateSignal_t + (1-\alpha) \cdot Adaptation_{t-1}$$

Where $\alpha$ = speed of adjustment parameter.

### 3.5.4 Irrigation Adoption Decision

$$Irrigate^* = \mathbb{1}_{[NPV_{irrigation} > 0]}$$

$$NPV_{irrigation} = \sum_t \frac{\Delta Y_t \cdot P_t - C_t^{water} - C_t^{capital}}{(1+r)^t} - CapEx_0$$

## 3.6 Panel Data Extensions

### 3.6.1 Fixed Effects Model

$$\ln(V_{it}) = \alpha_i + \lambda_t + \mathbf{C}_{it}'\boldsymbol{\beta} + \mathbf{X}_{it}'\boldsymbol{\gamma} + \epsilon_{it}$$

Where:
- $\alpha_i$ = County/parcel fixed effects
- $\lambda_t$ = Year fixed effects
- Controls for time-invariant unobservables

### 3.6.2 Dynamic Panel Model

$$\ln(V_{it}) = \rho \ln(V_{i,t-1}) + \mathbf{C}_{it}'\boldsymbol{\beta} + \mathbf{X}_{it}'\boldsymbol{\gamma} + \alpha_i + \epsilon_{it}$$

Estimated via GMM (Arellano-Bond).

## 3.7 Data Sources and Integration

| Data Element | Source | Spatial Resolution | Temporal |
|--------------|--------|-------------------|----------|
| Land values | USDA NASS | County | Annual |
| Crop yields | USDA NASS | County | Annual |
| Crop prices | USDA NASS / CBOT | National/Regional | Daily/Monthly |
| Input costs | USDA ERS | State | Annual |
| Climate | PRISM / Daymet | 4km | Daily |
| Soils | SSURGO / STATSGO | Polygon | Static |
| Irrigation | USDA Census of Agriculture | County | 5-year |
| Water availability | USGS | Watershed | Monthly |

### 3.7.1 PRISM Climate Data Integration

```python
# Climate variable extraction
climate_vars = {
    'tmean': 'Mean temperature (°C)',
    'tmax': 'Maximum temperature (°C)',
    'tmin': 'Minimum temperature (°C)',
    'ppt': 'Precipitation (mm)',
    'tdmean': 'Mean dewpoint (°C)',
    'vpdmin': 'Min vapor pressure deficit (hPa)',
    'vpdmax': 'Max vapor pressure deficit (hPa)'
}

# Growing degree days
gdd = sum([max(0, tmean - base_temp) for day in growing_season])

# Extreme heat days
heat_days = sum([1 for tmax in growing_season if tmax > threshold])
```

### 3.7.2 SSURGO Soil Data Integration

```python
# Soil quality index components
soil_quality = {
    'awc': available_water_capacity,  # inches/inch
    'ksat': saturated_hydraulic_conductivity,
    'ph': soil_ph,
    'om': organic_matter_percent,
    'slope': terrain_slope_percent,
    'drainage': drainage_class
}

# Weighted average by component percentage
soil_index = sum([comp['value'] * comp['pct'] for comp in components])
```

## 3.8 Climate Scenario Analysis

### 3.8.1 Scenario Definitions

| Scenario | Temperature | Precipitation | CO2 |
|----------|-------------|---------------|-----|
| RCP 2.6 | +1.0°C | +2% | 420 ppm |
| RCP 4.5 | +1.8°C | +3% | 540 ppm |
| RCP 6.0 | +2.2°C | +4% | 670 ppm |
| RCP 8.5 | +3.7°C | +8% | 940 ppm |

### 3.8.2 Impact Projection

$$\Delta V_{scenario} = V_{baseline} \times \left( e^{\mathbf{C}_{scenario}'\boldsymbol{\beta}} - 1 \right)$$

---

# 4. Depreciated Replacement Cost (DRC) for Infrastructure

## 4.1 Model Overview

The Depreciated Replacement Cost method values infrastructure assets based on the cost to replace them with modern equivalents, adjusted for physical deterioration, functional obsolescence, and economic obsolescence including climate-related factors.

## 4.2 Replacement Cost New (RCN)

### 4.2.1 Component-Based Cost Buildup

$$RCN = \sum_{i=1}^{n} UnitCost_i \times Quantity_i \times LocationFactor \times TimeIndex$$

Where:
- $UnitCost_i$ = Cost per unit for component $i$
- $Quantity_i$ = Physical quantity of component $i$
- $LocationFactor$ = Regional cost adjustment
- $TimeIndex$ = Cost escalation to valuation date

### 4.2.2 Component Breakdown for Infrastructure

| Component | Unit | Cost Source |
|-----------|------|-------------|
| Earthwork | CY | RS Means / State DOT |
| Pavement | SY | RS Means / State DOT |
| Bridges | SF | FHWA bridge cost data |
| Drainage | LF | RS Means |
| Signals | EA | State DOT |
| Lighting | EA | RS Means |
| Utilities | LF | Utility company estimates |

### 4.2.3 Cost Index Escalation

$$RCN_t = RCN_{base} \times \frac{Index_t}{Index_{base}}$$

**Major Cost Indices:**
- Engineering News-Record (ENR) Construction Cost Index
- RS Means City Cost Index
- Marshall & Swift Equipment Cost Index
- FHWA National Highway Construction Cost Index (NHCCI)

## 4.3 Physical Depreciation

### 4.3.1 Straight-Line Depreciation

$$D_{physical} = RCN \times \frac{EffectiveAge}{EconomicLife}$$

### 4.3.2 Effective Age Calculation

$$EffectiveAge = ChronologicalAge \times ConditionFactor - MaintenanceAdjustment$$

$$ConditionFactor = \frac{1}{ConditionRating}$$

Where Condition Rating scale:
- 1 = Excellent (like new)
- 2 = Good
- 3 = Fair
- 4 = Poor
- 5 = Failed

### 4.3.3 Economic Life by Asset Type

| Asset Type | Economic Life (years) | Climate-Adjusted Life |
|------------|----------------------|----------------------|
| Highway pavement | 20-30 | -10% to -30% |
| Bridges | 50-75 | -5% to -20% |
| Water treatment | 25-40 | -5% to -15% |
| Wastewater | 30-50 | -5% to -20% |
| Power transmission | 40-60 | -10% to -25% |
| Stormwater | 30-50 | -20% to -40% |

### 4.3.4 Condition-Based Depreciation

$$D_{physical} = RCN \times (1 - Condition\%)$$

Where Condition% is based on engineering inspection.

## 4.4 Functional Obsolescence

### 4.4.1 Deficiency-Based Calculation

$$FO = \sum_{j} (CostToCure_j + Penalty_j)$$

Where:
- $CostToCure_j$ = Cost to address deficiency $j$
- $Penalty_j$ = Ongoing cost penalty if not cured

### 4.4.2 Climate-Related Functional Obsolescence

$$FO_{climate} = FO_{capacity} + FO_{resilience} + FO_{efficiency}$$

**Capacity Deficiency:**

$$FO_{capacity} = (DesignCapacity - AdequateCapacity) \times UnitCost_{expansion}$$

Where adequate capacity accounts for climate-adjusted demand:

$$AdequateCapacity = BaseDemand \times (1 + ClimateGrowth)^{years}$$

**Resilience Deficiency:**

$$FO_{resilience} = \sum_{events} P(event) \times Damage_{withoutResilience} - Damage_{withResilience}$$

## 4.5 Economic Obsolescence

### 4.5.1 External Factor Calculation

$$EO = RCN \times ExternalFactor$$

### 4.5.2 Climate Policy Obsolescence

$$EO_{policy} = RCN \times \sum_{p} w_p \cdot PolicyImpact_p$$

Where policies include:
- Carbon pricing
- Resilience mandates
- Environmental regulations
- Land use restrictions

### 4.5.3 Demand-Side Obsolescence

$$EO_{demand} = RCN \times \frac{ActualUsage - ProjectedUsage}{ProjectedUsage}$$

Where usage may decline due to climate migration or economic shifts.

## 4.6 Climate Resilience Premium/Discount

### 4.6.1 Resilience Value Adjustment

$$ResilienceAdjustment = \pm RCN \times ResilienceFactor$$

Where:
- Positive = Premium for climate-resilient design
- Negative = Discount for climate-vulnerable assets

### 4.6.2 Resilience Factor Calculation

$$ResilienceFactor = \sum_{r} w_r \cdot ResilienceScore_r$$

Resilience components:
- Flood protection level
- Heat resistance
- Wind resistance
- Sea level rise adaptation

### 4.6.3 Stranded Asset Risk

$$StrandedRisk = RCN \times P(stranded) \times LossGivenStranding$$

Where:
- $P(stranded)$ = Probability asset becomes uneconomic
- $LossGivenStranding$ = Percentage value loss if stranded

## 4.7 DRC Value Calculation

### 4.7.1 Final DRC Formula

$$DRC = RCN - D_{physical} - FO - EO \pm ResilienceAdjustment$$

### 4.7.2 Alternative: Percent Good Method

$$DRC = RCN \times PercentGood$$

$$PercentGood = \left(1 - \frac{EffectiveAge}{EconomicLife}\right)^{n}$$

Where $n$ = depreciation curve exponent (1 = straight-line, >1 = accelerated).

## 4.8 Infrastructure-Specific Applications

### 4.8.1 Transportation Infrastructure

$$DRC_{road} = RCN_{pavement} \times Condition\% + RCN_{structures} \times Condition\% - FO_{capacity} - EO_{demand}$$

**Bridge Valuation:**

$$DRC_{bridge} = RCN \times NBI\_RatingFactor - FO_{load} - FO_{clearance} - EO_{seismic}$$

### 4.8.2 Water Infrastructure

$$DRC_{water} = RCN_{treatment} \times Condition\% + RCN_{distribution} \times Condition\% - FO_{capacity} - EO_{quality}$$

Climate adjustments:
- Source water quality changes
- Demand variability
- Treatment cost increases

### 4.8.3 Energy Infrastructure

$$DRC_{transmission} = RCN_{lines} \times Condition\% + RCN_{substations} \times Condition\% - FO_{capacity} - EO_{renewable}$$

## 4.9 Data Sources and Integration

| Data Element | Source | Update Frequency |
|--------------|--------|------------------|
| Unit costs | RS Means / Marshall & Swift | Quarterly |
| Construction costs | ENR / FHWA NHCCI | Monthly |
| Asset inventory | State DOT / Utility | Annual |
| Condition ratings | Inspection databases | 1-2 years |
| Climate risk | FEMA / First Street | Annual |
| Economic factors | BLS / Census | Annual |

---

# 5. Renewable Generation LCOE Adjustments

## 5.1 Model Overview

The Levelized Cost of Energy (LCOE) model for renewable generation requires climate adjustments to capture changing resource availability, equipment degradation, and operational risks under climate change scenarios.

## 5.2 Base LCOE Formula

### 5.2.1 Standard LCOE Definition

$$LCOE = \frac{\sum_{t=0}^{T} \frac{I_t + M_t + F_t}{(1+r)^t}}{\sum_{t=0}^{T} \frac{E_t}{(1+r)^t}}$$

Where:
- $I_t$ = Investment costs in year $t$
- $M_t$ = Operations and maintenance costs
- $F_t$ = Fuel costs (zero for most renewables)
- $E_t$ = Energy production in year $t$
- $r$ = Discount rate
- $T$ = Project lifetime

### 5.2.2 Component Breakdown

**Investment Costs:**
$$I_t = I_{equipment} + I_{installation} + I_{soft} + I_{financing}$$

**O&M Costs:**
$$M_t = M_{fixed} + M_{variable} \times E_t + M_{unscheduled}$$

## 5.3 Climate Adjustments by Technology

### 5.3.1 Solar PV Adjustments

**Irradiance Changes:**

$$GHI_t = GHI_{baseline} \times (1 + \Delta GHI_{climate,t})$$

Where $\Delta GHI$ accounts for:
- Cloud cover changes
- Aerosol loading
- Atmospheric water vapor

**Temperature Derating:**

$$\eta_t = \eta_{STC} \times [1 - \beta \times (T_{cell,t} - 25°C)]$$

$$T_{cell,t} = T_{ambient,t} + \frac{GHI_t}{GHI_{STC}} \times (NOCT - 20°C)$$

Where:
- $\eta$ = Module efficiency
- $\beta$ = Temperature coefficient (typically -0.3% to -0.5%/°C)
- NOCT = Nominal Operating Cell Temperature

**Solar LCOE Climate Adjustment:**

$$LCOE_{solar}^{climate} = \frac{\sum_t \frac{I_t + M_t}{(1+r)^t}}{\sum_t \frac{GHI_t \times \eta_t \times Capacity_t}{(1+r)^t}}$$

### 5.3.2 Wind Power Adjustments

**Capacity Factor Changes:**

$$CF_t = CF_{baseline} \times \frac{\sum_{h} P(h) \times v_{h,t}^3}{\sum_{h} P(h) \times v_{h,baseline}^3}$$

Where:
- $P(h)$ = Probability of wind speed bin $h$
- $v_h$ = Wind speed in bin $h$

**Wind Speed Climate Relationship:**

$$v_t = v_{baseline} \times (1 + \Delta v_{climate,t})$$

**Extreme Weather Damage:**

$$M_t^{damage} = \sum_{events} P(event_t) \times Damage_{event}$$

**Wind LCOE Climate Adjustment:**

$$LCOE_{wind}^{climate} = \frac{\sum_t \frac{I_t + M_t + M_t^{damage}}{(1+r)^t}}{\sum_t \frac{CF_t \times RatedCapacity \times 8760}{(1+r)^t}}$$

### 5.3.3 Hydropower Adjustments

**Inflow Variability:**

$$Q_t = Q_{baseline} \times (1 + \Delta Q_{climate,t} + \epsilon_t)$$

Where:
- $\Delta Q_{climate}$ = Climate-induced flow change
- $\epsilon_t$ = Random variability

**Reservoir Operations:**

$$Generation_t = \min(Q_t \times Head \times \eta, Capacity)$$

**Hydropower LCOE:**

$$LCOE_{hydro}^{climate} = \frac{\sum_t \frac{I_t + M_t}{(1+r)^t}}{\sum_t \frac{Generation_t(Q_t)}{(1+r)^t}}$$

### 5.3.4 Technology-Specific Climate Sensitivities

| Technology | Climate Factor | Impact Direction | Magnitude |
|------------|----------------|------------------|-----------|
| Solar PV | Temperature | Negative | -0.4%/°C |
| Solar PV | Cloud cover | Negative | -1% to -5% |
| Wind | Wind speed | Variable | ±10-20% |
| Wind | Extreme weather | Negative | +5-15% O&M |
| Hydro | Precipitation | Variable | ±20-40% |
| Hydro | Snowpack | Negative | -10-30% |
| Geothermal | Water availability | Negative | -5-10% |
| Biomass | Yield changes | Variable | ±10-20% |

## 5.4 Curtailment Risk Quantification

### 5.4.1 Curtailment Model

$$Curtailment_t = \max(0, Generation_t - Dispatch_t)$$

$$CurtailmentRisk_t = \frac{\mathbb{E}[Curtailment_t]}{\mathbb{E}[Generation_t]}$$

### 5.4.2 Grid Integration Factors

$$Curtailment_t = f(RenewablePenetration_t, GridFlexibility_t, Demand_t, Storage_t)$$

### 5.4.3 Economic Impact

$$RevenueLoss_t = Curtailment_t \times P_t^{electricity}$$

$$LCOE_{curtailed} = \frac{\sum_t \frac{I_t + M_t}{(1+r)^t}}{\sum_t \frac{(Generation_t - Curtailment_t)}{(1+r)^t}}$$

## 5.5 Integrated LCOE with Climate Risk

### 5.5.1 Stochastic LCOE

$$LCOE^{stochastic} = \mathbb{E}\left[ \frac{\sum_t \frac{I_t + M_t(C_t) + Damage_t(C_t)}{(1+r)^t}}{\sum_t \frac{E_t(C_t)}{(1+r)^t}} \right]$$

Where expectations are over climate scenarios $C_t$.

### 5.5.2 Risk-Adjusted LCOE

$$LCOE^{risk-adjusted} = LCOE^{base} + RiskPremium$$

$$RiskPremium = \lambda \times \sigma_{LCOE}$$

Where $\lambda$ = risk aversion coefficient.

### 5.5.3 Value-Adjusted LCOE (VALCOE)

$$VALCOE = LCOE + \frac{SystemIntegrationCost}{E} - \frac{SystemValue}{E}$$

Where:
- SystemIntegrationCost = Grid balancing, backup capacity
- SystemValue = Capacity value, ancillary services

## 5.6 Data Sources and Integration

| Data Element | Source | Resolution | Update |
|--------------|--------|------------|--------|
| Solar resource | NREL NSRDB | 4km, hourly | Annual |
| Wind resource | NREL WTK | 2km, 5-min | Annual |
| Technology costs | NREL ATB | National | Annual |
| Climate projections | CMIP6 / NEX-GDDP | 25km | Annual |
| Equipment specs | Manufacturer data | - | - |
| Grid data | EIA Form 860 | Plant-level | Annual |

### 5.6.1 NREL Data Integration

```python
# NSRDB solar data extraction
solar_resource = {
    'ghi': global_horizontal_irradiance,
    'dni': direct_normal_irradiance,
    'dhi': diffuse_horizontal_irradiance,
    'temp': ambient_temperature,
    'wind': wind_speed
}

# WTK wind data
wind_resource = {
    'windspeed': windspeed_at_hub_height,
    'winddirection': wind_direction,
    'temperature': air_temperature,
    'pressure': air_pressure
}

# Capacity factor calculation
cf_solar = pvwatts(system_design, solar_resource)
cf_wind = windpact(turbine_spec, wind_resource)
```

## 5.7 Scenario Analysis

### 5.7.1 Climate Scenarios for Renewables

| Scenario | Solar Impact | Wind Impact | Hydro Impact |
|----------|--------------|-------------|--------------|
| SSP1-2.6 | +2% GHI | +5% wind | -5% flow |
| SSP2-4.5 | +1% GHI | +3% wind | -10% flow |
| SSP3-7.0 | -1% GHI | -2% wind | -15% flow |
| SSP5-8.5 | -3% GHI | -5% wind | -25% flow |

---

# 6. Transmission Grid and Energy Storage Valuation

## 6.1 Model Overview

Transmission grid and energy storage valuation requires specialized approaches accounting for regulated returns, network externalities, and climate resilience investments. This section covers regulated asset base (RAB) approaches, battery degradation, and grid congestion value.

## 6.2 Regulated Asset Base (RAB) Approach

### 6.2.1 RAB Definition

$$RAB_t = RAB_{t-1} + CapEx_t - Depreciation_t$$

### 6.2.2 Allowed Revenue

$$Revenue_t^{allowed} = RAB_t \times WACC + OPEX_t^{efficient}$$

Where:
- $WACC$ = Weighted average cost of capital (regulated)
- $OPEX_t^{efficient}$ = Benchmark operating costs

### 6.2.3 WACC Calculation

$$WACC = \frac{E}{V} \times r_e + \frac{D}{V} \times r_d \times (1 - T_c)$$

Where:
- $r_e$ = Cost of equity (CAPM)
- $r_d$ = Cost of debt
- $T_c$ = Corporate tax rate

$$r_e = r_f + \beta \times (r_m - r_f) + RP_{climate}$$

### 6.2.4 Asset Valuation under RAB

$$V_{RAB} = \sum_{t=1}^{T} \frac{RAB_t \times WACC + OPEX_t - CapEx_t}{(1 + WACC)^t} + \frac{RAB_T}{(1 + WACC)^T}$$

## 6.3 Revenue Cap/Floor Mechanisms

### 6.3.1 Revenue Cap

$$Revenue_t^{actual} = \min(Revenue_t^{earned}, Revenue_t^{cap})$$

$$Revenue_t^{cap} = RAB_t \times WACC \times (1 + margin)$$

### 6.3.2 Revenue Floor

$$Revenue_t^{actual} = \max(Revenue_t^{earned}, Revenue_t^{floor})$$

### 6.3.3 Balancing Account

$$BalancingAccount_t = BalancingAccount_{t-1} + Revenue_t^{allowed} - Revenue_t^{actual}$$

### 6.3.4 Option Value of Regulation

$$V_{regulation} = V_{RAB} + Value(RevenueFloor) - Value(RevenueCap)$$

## 6.4 Climate Resilience Investments

### 6.4.1 Resilience Cost Recovery

$$CapEx_t^{resilience} = \sum_{projects} Cost_p \times \mathbb{1}_{[approved]}$$

Recovery mechanisms:
- Rate base inclusion
- Surcharge mechanisms
- Federal/state grants
- Catastrophe reserves

### 6.4.2 Resilience Benefit Valuation

$$Benefit_t^{resilience} = \Delta OutageCost_t + \Delta RepairCost_t + \Delta Liability_t$$

$$NPV_{resilience} = \sum_t \frac{Benefit_t}{(1+r)^t} - CapEx_0$$

### 6.4.3 Harding Infrastructure Valuation

$$V_{hardened} = V_{base} + \sum_t \frac{\Delta Insurance_t + \Delta Outage_t}{(1+r)^t} - CapEx_{hardening}$$

## 6.5 Battery Degradation Models

### 6.5.1 Capacity Fade

$$Q_t = Q_0 \times (1 - fade)^t$$

$$fade = fade_{cycle} + fade_{calendar} + fade_{temperature}$$

### 6.5.2 Cycle-Induced Degradation

$$fade_{cycle} = \alpha \times \sum_{cycles} DoD^{\beta}$$

Where:
- $DoD$ = Depth of discharge
- $\alpha, \beta$ = Technology-specific parameters

### 6.5.3 Calendar Degradation

$$fade_{calendar} = \gamma \times t$$

### 6.5.4 Temperature-Induced Degradation

$$fade_{temperature} = \delta \times \sum_{t} (T_t - T_{optimal})^2$$

**Temperature Impact Coefficients:**

| Chemistry | Optimal Temp | Degradation Rate |
|-----------|--------------|------------------|
| LFP | 25°C | 0.5%/year @ 25°C |
| NMC | 25°C | 1.0%/year @ 25°C |
| NCA | 25°C | 1.5%/year @ 25°C |

### 6.5.5 End-of-Life Valuation

$$V_{EOL} = ResidualValue(Q_{EOL}, Chemistry)$$

Where $Q_{EOL}$ = remaining capacity at end of life (typically 70-80%).

## 6.6 Grid Congestion Value

### 6.6.1 Congestion Rent

$$Rent_{congestion} = \sum_{lines} (P_{to} - P_{from}) \times Flow$$

### 6.6.2 Marginal Value of Transmission

$$MVT = \frac{\partial SocialSurplus}{\partial TransmissionCapacity}$$

### 6.6.3 Climate Impact on Congestion

$$Congestion_t^{climate} = Congestion_{base} \times \frac{RenewableVariability_t}{RenewableVariability_{base}}$$

### 6.6.4 Storage Arbitrage Value

$$Value_{arbitrage} = \sum_t (P_t^{peak} - P_t^{offpeak}) \times Discharge_t - Cost_{charging}$$

## 6.7 Ancillary Services Value

### 6.7.1 Frequency Regulation

$$Revenue_{reg} = CapacityPayment_{reg} + PerformancePayment_{reg}$$

### 6.7.2 Spinning Reserves

$$Revenue_{spin} = ReservedCapacity \times ReservationPrice$$

### 6.7.3 Voltage Support

$$Revenue_{voltage} = MVAR_{provided} \times Price_{MVAR}$$

## 6.8 Integrated Storage Valuation

### 6.8.1 Total Value Stack

$$V_{storage} = Value_{energy} + Value_{capacity} + Value_{ancillary} + Value_{transmission}$$

### 6.8.2 DCF for Battery Storage

$$V_{battery} = \sum_{t=1}^{T} \frac{Revenue_t(Capacity_t) - OPEX_t - Replacement_t}{(1+r)^t}$$

Where:
- $Capacity_t$ = Degraded capacity in year $t$
- $Replacement_t$ = Cell replacement costs

### 6.8.3 Replacement Scheduling

$$Replace^* = \arg\min_{t} NPV(Cost_t + FutureDegradation)$$

## 6.9 Data Sources and Integration

| Data Element | Source | Resolution |
|--------------|--------|------------|
| Transmission data | EIA Form 930 | Balancing area |
| LMP prices | ISO/RTO markets | Node, hourly |
| Congestion data | ISO market data | Line, hourly |
| Battery specs | Manufacturer | System-level |
| Degradation data | Lab testing / Field | Varies |
| Grid topology | OpenStreetMap / Utility | Substation |

### 6.9.1 ISO Market Data Integration

```python
# LMP data structure
lmp_data = {
    'node_id': pricing_node,
    'timestamp': datetime,
    'lmp': locational_marginal_price,
    'congestion': congestion_component,
    'losses': loss_component,
    'energy': energy_component
}

# Congestion value calculation
congestion_value = sum([
    (lmp['to'] - lmp['from']) * flow 
    for lmp, flow in zip(lmp_data, flow_data)
])
```

---

# Appendix A: Mathematical Notation Reference

| Symbol | Definition |
|--------|------------|
| $P$ | Price/Value |
| $V$ | Present value |
| $R$ | Rent/Revenue |
| $r$ | Discount rate |
| $g$ | Growth rate |
| $\beta$ | Regression coefficient |
| $\gamma$ | Climate risk coefficient |
| $\delta$ | Fixed effect |
| $\epsilon$ | Error term |
| $\lambda$ | Autoregressive parameter |
| $\rho$ | Spatial autoregressive coefficient |
| $Q$ | Quantity/Yield |
| $CF$ | Cash flow/Capacity factor |
| $NOI$ | Net operating income |
| $LCOE$ | Levelized cost of energy |
| $RAB$ | Regulated asset base |
| $WACC$ | Weighted average cost of capital |

---

# Appendix B: Data Integration Architecture

## B.1 API Integration Patterns

### FEMA NFHL API
```
Endpoint: https://msc.fema.gov/portal/advanceSearch
Parameters: address, coordinates, floodZone
Returns: SFHA status, zone, BFE
```

### NOAA Climate Data
```
Endpoint: https://www.ncei.noaa.gov/cdo-web/api/v2/
Parameters: datasetid, startdate, enddate, location
Returns: Temperature, precipitation, extremes
```

### NREL Developer API
```
Endpoint: https://developer.nrel.gov/api/
Resources: NSRDB, WTK, REopt
Returns: Solar/wind resource, system design
```

### EIA API
```
Endpoint: https://api.eia.gov/v2/
Series: electricity, energy prices, generation
Returns: Time series data
```

## B.2 Database Schema

```sql
-- Property transactions
CREATE TABLE properties (
    parcel_id VARCHAR(20) PRIMARY KEY,
    sale_date DATE,
    sale_price DECIMAL(12,2),
    sqft INT,
    bedrooms INT,
    bathrooms INT,
    year_built INT,
    condition_score INT,
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    flood_zone VARCHAR(5),
    heat_risk_score DECIMAL(3,2)
);

-- Climate risk
CREATE TABLE climate_risk (
    parcel_id VARCHAR(20),
    flood_probability DECIMAL(5,4),
    heat_days INT,
    wildfire_risk DECIMAL(3,2),
    wind_risk DECIMAL(3,2),
    composite_score DECIMAL(3,2)
);

-- Infrastructure assets
CREATE TABLE infrastructure (
    asset_id VARCHAR(20) PRIMARY KEY,
    asset_type VARCHAR(50),
    construction_date DATE,
    replacement_cost DECIMAL(15,2),
    condition_rating INT,
    effective_age INT,
    economic_life INT
);
```

---

# Appendix C: Model Validation Checklists

## C.1 Hedonic Model Validation

- [ ] $R^2 > 0.70$ for primary models
- [ ] Moran's I < 0.10 (no significant spatial autocorrelation)
- [ ] VIF < 5 for all variables
- [ ] Out-of-sample MAPE < 15%
- [ ] IV F-statistic > 10
- [ ] Climate coefficients statistically significant

## C.2 DCF Model Validation

- [ ] Cap rate within market range
- [ ] Growth rates consistent with economic forecasts
- [ ] Climate adjustments documented
- [ ] Sensitivity analysis completed
- [ ] Monte Carlo 95% CI calculated
- [ ] Terminal value < 50% of total value

## C.3 LCOE Model Validation

- [ ] Capacity factors validated against actuals
- [ ] Degradation rates from manufacturer specs
- [ ] Climate scenarios from peer-reviewed sources
- [ ] Curtailment assumptions documented
- [ ] Discount rate consistent with WACC

---

*Document Version: 1.0*
*Last Updated: 2024*
*AA Impact Inc. - MAI Real Estate & Infrastructure Appraisal Division*
