# Carbon Credit Calculation Engine Technical Requirements
## Nature-Based and Agriculture Methodologies

**Document Version:** 1.0  
**Last Updated:** 2024  
**Classification:** Technical Specification

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Methodology Overview](#2-methodology-overview)
3. [Input Parameters Specification](#3-input-parameters-specification)
4. [Calculation Algorithms](#4-calculation-algorithms)
5. [Validation Rules](#5-validation-rules)
6. [Output Specifications](#6-output-specifications)
7. [MRV Integration](#7-mrv-integration)
8. [Technical Architecture](#8-technical-architecture)
9. [Appendices](#9-appendices)

---

## 1. Executive Summary

This document provides comprehensive technical requirements for a carbon credit calculation engine supporting Nature-based and Agriculture methodologies. The engine must support:

- **4 Nature-Based Methodologies:** ARR, IFM, REDD+, Wetlands & Blue Carbon
- **3 Agriculture Methodologies:** Soil Carbon, Livestock Methane, Rice Cultivation

The calculation engine shall implement IPCC-compliant methodologies with support for Verra VCS, ACR, ART-TREES, and other major standards.

---

## 2. Methodology Overview

### 2.1 Methodology Classification Matrix

| Methodology | Credit Type | Standard | Complexity | Coverage Status |
|-------------|-------------|----------|------------|-----------------|
| ARR | Removal/Avoidance | VCS/ACR | Medium | Mature |
| IFM | Removal/Avoidance | VCS/ACR | High | Mature |
| REDD+ | Avoidance | VCS/ART-TREES | Very High | Mature but scrutinized |
| Wetlands & Blue Carbon | Removal/Avoidance | VCS/Private | High | Growing |
| Soil Carbon | Removal/Reduction | VCS/ACR/National | Medium | Growing |
| Livestock Methane | Reduction | VCS/ACR/CAR | Medium | Mature |
| Rice Cultivation | Reduction | VCS/GS/National | Low | Selective |

---

## 3. Input Parameters Specification

### 3.1 ARR (Afforestation, Reforestation, Revegetation)

#### 3.1.1 Project Definition Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_id` | Unique project identifier | String | - | System | Yes | UUID format, unique |
| `project_area` | Total project area | Float | ha | Measured | Yes | >0, ≤500,000 ha |
| `project_start_date` | Project commencement date | Date | - | Document | Yes | Not future date |
| `crediting_period` | Years for credit issuance | Integer | years | Document | Yes | 1-60 years |
| `activity_type` | ARR activity classification | Enum | - | Document | Yes | [afforestation, reforestation, revegetation, anr] |
| `ecological_zone` | Climate/ecological classification | String | - | Document | Yes | IPCC climate zone |

#### 3.1.2 Baseline Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `baseline_land_use` | Pre-project land use classification | Enum | - | Document | Yes | IPCC land use category |
| `baseline_carbon_stock_agb` | Above-ground biomass carbon stock | Float | tCO2e/ha | Measured/Modeled | Yes | ≥0 |
| `baseline_carbon_stock_bgb` | Below-ground biomass carbon stock | Float | tCO2e/ha | Measured/Modeled | Yes | ≥0 |
| `baseline_carbon_stock_dw` | Dead wood carbon stock | Float | tCO2e/ha | Measured/Modeled | No | ≥0, default=0 |
| `baseline_carbon_stock_litter` | Litter carbon stock | Float | tCO2e/ha | Measured/Modeled | No | ≥0, default=0 |
| `baseline_carbon_stock_soc` | Soil organic carbon stock | Float | tCO2e/ha | Measured/Modeled | Yes | ≥0 |
| `baseline_deforestation_rate` | Historical deforestation rate | Float | %/year | Modeled | Conditional | 0-100% |

#### 3.1.3 Project Scenario Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `forest_type` | Type of forest established | Enum | - | Document | Yes | [natural, plantation, mixed] |
| `species_composition` | Tree species planted | Array | - | Document | Yes | Minimum 1 species |
| `planting_density` | Trees planted per hectare | Integer | trees/ha | Measured | Yes | 50-10,000 trees/ha |
| `survival_rate` | Tree survival percentage | Float | % | Measured | Yes | 0-100% |
| `monitoring_frequency` | Carbon stock monitoring interval | Integer | years | Document | Yes | 1-10 years |
| `project_carbon_stock_agb_t` | Project AGB at time t | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `project_carbon_stock_bgb_t` | Project BGB at time t | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `project_carbon_stock_soc_t` | Project SOC at time t | Float | tCO2e/ha | Measured | Yes | ≥0 |

#### 3.1.4 Adjustment Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `leakage_factor` | Activity-shifting leakage factor | Float | % | Default | Yes | 0-30%, default=10% |
| `buffer_contribution` | Non-permanence buffer contribution | Float | % | Calculated | Yes | 10-50% |
| `uncertainty_discount` | Statistical uncertainty adjustment | Float | % | Calculated | Yes | 0-30% |
| `project_lifetime` | Expected project duration | Integer | years | Document | Yes | 20-100 years |

---

### 3.2 IFM (Improved Forest Management)

#### 3.2.1 Project Definition Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_id` | Unique project identifier | String | - | System | Yes | UUID format |
| `forest_area` | Total forest area under management | Float | ha | Measured | Yes | >0 |
| `forest_type` | Forest classification | Enum | - | Document | Yes | [natural, plantation, mixed] |
| `management_activity` | IFM activity type | Enum | - | Document | Yes | [extended_rotation, reduced_impact_logging, conversion_avoidance, stocking_change] |
| `baseline_harvest_scenario` | Baseline harvest schedule | JSON | - | Modeled | Yes | Valid JSON structure |

#### 3.2.2 Baseline Forest Inventory Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `baseline_standing_volume` | Baseline standing timber volume | Float | m³/ha | Measured | Yes | ≥0 |
| `baseline_carbon_stock_live` | Live biomass carbon stock | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `baseline_carbon_stock_dead` | Dead biomass carbon stock | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `baseline_harvest_volume_annual` | Annual harvest volume baseline | Float | m³/year | Measured | Yes | ≥0 |
| `baseline_rotation_period` | Baseline rotation length | Integer | years | Document | Yes | 5-200 years |
| `baseline_regeneration_rate` | Natural regeneration rate | Float | m³/ha/year | Measured | Yes | ≥0 |
| `species_composition_baseline` | Baseline species mix | Array | - | Measured | Yes | Species list with % |

#### 3.2.3 Project Scenario Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_harvest_volume_annual` | Project annual harvest volume | Float | m³/year | Measured | Yes | ≥0 |
| `project_rotation_period` | Project rotation length | Integer | years | Document | Yes | ≥baseline_rotation_period |
| `project_standing_volume_t` | Standing volume at time t | Float | m³/ha | Measured | Yes | ≥0 |
| `project_carbon_stock_live_t` | Live biomass at time t | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `reduced_impact_logging_pct` | RIL implementation percentage | Float | % | Measured | Conditional | 0-100% |
| `stocking_density_change` | Change in stocking density | Float | trees/ha | Measured | Conditional | -10,000 to +10,000 |

#### 3.2.4 Market Leakage Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `market_leakage_factor` | Market leakage adjustment | Float | % | Default | Yes | 0-50%, default=20% |
| `activity_leakage_factor` | Activity-shifting leakage | Float | % | Default | Yes | 0-30%, default=10% |
| `timber_price_elasticity` | Price elasticity of timber supply | Float | - | Literature | No | -2 to 0 |
| `regional_supply_response` | Regional market response factor | Float | % | Default | No | 0-100% |

---

### 3.3 REDD+ (Avoided Deforestation)

#### 3.3.1 Project Definition Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_id` | Unique project identifier | String | - | System | Yes | UUID format |
| `project_area_total` | Total project area | Float | ha | Measured | Yes | >0 |
| `forest_area_at_risk` | Forest area under deforestation risk | Float | ha | Modeled | Yes | ≤project_area_total |
| `redd_type` | REDD+ implementation type | Enum | - | Document | Yes | [frontier, mosaic, planned, nested] |
| `reference_period_start` | Baseline reference period start | Date | - | Document | Yes | ≥10 years before project |
| `reference_period_end` | Baseline reference period end | Date | - | Document | Yes | ≤project_start_date |

#### 3.3.2 Baseline Deforestation Modeling Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `historical_deforestation_rate` | Annual deforestation rate (historical) | Float | %/year | Measured | Yes | 0-100% |
| `historical_deforestation_area` | Historical deforestation area | Float | ha/year | Measured | Yes | ≥0 |
| `baseline_carbon_stock_forest` | Average forest carbon stock | Float | tCO2e/ha | Measured | Yes | >0 |
| `baseline_carbon_stock_post_deforest` | Post-deforestation carbon stock | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `deforestation_drivers` | Drivers of deforestation | Array | - | Document | Yes | At least 1 driver |
| `deforestation_model_type` | Baseline modeling approach | Enum | - | Document | Yes | [historical_average, historical_adjusted, modeled] |
| `baseline_adjustment_factor` | Adjustment to historical rate | Float | - | Calculated | Conditional | 0.5-2.0 |

#### 3.3.3 Carbon Stock Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `agb_carbon_stock` | Above-ground biomass carbon | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `bgb_carbon_stock` | Below-ground biomass carbon | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `deadwood_carbon_stock` | Dead wood carbon | Float | tCO2e/ha | Measured | No | ≥0, default=0 |
| `litter_carbon_stock` | Litter carbon | Float | tCO2e/ha | Measured | No | ≥0, default=0 |
| `soc_carbon_stock` | Soil organic carbon | Float | tCO2e/ha | Measured | Conditional | ≥0 |
| `wood_products_carbon` | Long-term wood products carbon | Float | tCO2e/ha | Calculated | No | ≥0 |

#### 3.3.4 Monitoring Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `observed_deforestation_area` | Monitored deforestation area | Float | ha | Measured | Yes | ≥0 |
| `forest_loss_detected` | Forest loss detection result | Boolean | - | Remote Sensing | Yes | True/False |
| `verification_confidence` | Remote sensing confidence level | Float | % | System | Yes | 50-100% |
| `stratification_map` | Forest carbon stratification | File | - | Spatial | Yes | Valid geospatial file |
| `monitoring_frequency_rs` | Remote sensing frequency | Integer | months | Document | Yes | 1-36 months |

#### 3.3.5 Leakage Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `leakage_deduction_pct` | Leakage deduction percentage | Float | % | Calculated | Yes | 0-50% |
| `leakage_management_zone` | Area under leakage management | Float | ha | Document | No | ≥0 |
| `leakage_monitoring_active` | Leakage monitoring implemented | Boolean | - | Document | Yes | True/False |

---

### 3.4 Wetlands & Blue Carbon

#### 3.4.1 Project Definition Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_id` | Unique project identifier | String | - | System | Yes | UUID format |
| `wetland_type` | Type of wetland ecosystem | Enum | - | Document | Yes | [mangrove, peatland, tidal_marsh, seagrass] |
| `project_area` | Total wetland area | Float | ha | Measured | Yes | >0 |
| `hydrology_restoration_type` | Type of hydrology intervention | Enum | - | Document | Yes | [rewetting, tidal_restoration, sediment_raising, dam_removal] |
| `pre_project_drainage_status` | Pre-project drainage condition | Enum | - | Document | Yes | [undrained, partially_drained, fully_drained] |

#### 3.4.2 Baseline Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `baseline_water_table_depth` | Pre-project water table depth | Float | cm | Measured | Yes | -500 to +100 cm |
| `baseline_ghg_flux_co2` | CO2 flux baseline | Float | tCO2e/ha/year | Measured | Yes | Any value |
| `baseline_ghg_flux_ch4` | CH4 flux baseline | Float | tCO2e/ha/year | Measured | Yes | Any value |
| `baseline_ghg_flux_n2o` | N2O flux baseline | Float | tCO2e/ha/year | Measured | No | Any value, default=0 |
| `baseline_biomass_carbon` | Vegetation carbon stock baseline | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `baseline_soil_carbon` | Soil carbon stock baseline | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `degradation_rate_baseline` | Baseline degradation rate | Float | %/year | Modeled | Yes | 0-100% |

#### 3.4.3 Project Scenario Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_water_table_depth` | Project water table depth | Float | cm | Measured | Yes | -500 to +100 cm |
| `project_ghg_flux_co2` | Project CO2 flux | Float | tCO2e/ha/year | Measured | Yes | Any value |
| `project_ghg_flux_ch4` | Project CH4 flux | Float | tCO2e/ha/year | Measured | Yes | Any value |
| `project_ghg_flux_n2o` | Project N2O flux | Float | tCO2e/ha/year | Measured | No | Any value |
| `project_biomass_carbon_t` | Project biomass carbon at time t | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `project_soil_carbon_t` | Project soil carbon at time t | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `biomass_accumulation_rate` | Vegetation carbon accumulation | Float | tCO2e/ha/year | Measured | Yes | ≥0 |

#### 3.4.4 Ecosystem-Specific Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `mangrove_species` | Mangrove species present | Array | - | Measured | Conditional | Required if wetland_type=mangrove |
| `peat_depth` | Peat layer depth | Float | m | Measured | Conditional | 0-20m, if peatland |
| `bulk_density_peat` | Peat bulk density | Float | g/cm³ | Measured | Conditional | 0-0.5 g/cm³ |
| `organic_carbon_content_peat` | Peat organic carbon content | Float | % | Measured | Conditional | 0-100% |
| `tidal_range` | Tidal range for coastal wetlands | Float | m | Measured | Conditional | 0-10m |
| `salinity_level` | Water salinity | Float | ppt | Measured | Conditional | 0-40 ppt |

---

### 3.5 Soil Carbon

#### 3.5.1 Project Definition Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_id` | Unique project identifier | String | - | System | Yes | UUID format |
| `land_use_type` | Agricultural land use type | Enum | - | Document | Yes | [cropland, rangeland, grazing_land, pasture] |
| `project_area` | Total project area | Float | ha | Measured | Yes | >0 |
| `soil_carbon_practice` | Practice implemented | Enum | - | Document | Yes | [cover_cropping, reduced_tillage, organic_amendments, rotational_grazing, agroforestry] |
| `sampling_approach` | SOC measurement method | Enum | - | Document | Yes | [direct_sampling, model_based, hybrid] |

#### 3.5.2 Baseline Soil Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `baseline_soc_stock` | Baseline soil organic carbon | Float | tCO2e/ha | Measured | Yes | ≥0 |
| `baseline_soc_concentration` | SOC concentration baseline | Float | % | Measured | Yes | 0-100% |
| `soil_bulk_density_baseline` | Soil bulk density | Float | g/cm³ | Measured | Yes | 0.5-2.0 g/cm³ |
| `soil_depth_sampled` | Soil sampling depth | Float | cm | Document | Yes | 10-100 cm |
| `baseline_tillage_practice` | Baseline tillage system | Enum | - | Document | Yes | [conventional, reduced, no_till] |
| `baseline_cover_crop_pct` | Baseline cover crop adoption | Float | % | Document | Yes | 0-100% |

#### 3.5.3 Project Practice Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_tillage_practice` | Project tillage system | Enum | - | Document | Yes | [conventional, reduced, no_till] |
| `project_cover_crop_pct` | Project cover crop adoption | Float | % | Measured | Yes | 0-100% |
| `organic_amendment_type` | Type of organic amendment | Enum | - | Document | Conditional | [compost, manure, biochar, residue] |
| `organic_amendment_rate` | Amendment application rate | Float | t/ha/year | Measured | Conditional | ≥0 |
| `grazing_intensity` | Grazing intensity level | Enum | - | Document | Conditional | [light, moderate, heavy] |
| `grazing_rotation_days` | Rotation cycle length | Integer | days | Document | Conditional | 1-365 days |

#### 3.5.4 Sampling and Modeling Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `number_sample_points` | Number of soil sample locations | Integer | - | Document | Yes | ≥3 |
| `sampling_grid_size` | Grid cell size for sampling | Float | m | Document | Yes | >0 |
| `soc_model_type` | SOC dynamics model used | Enum | - | Document | Conditional | [rothc, century, dndc, custom] |
| `model_calibration_data` | Model calibration dataset | File | - | Document | Conditional | Valid file format |
| `sampling_frequency_years` | SOC resampling frequency | Integer | years | Document | Yes | 1-10 years |

---

### 3.6 Livestock Methane

#### 3.6.1 Project Definition Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_id` | Unique project identifier | String | - | System | Yes | UUID format |
| `intervention_type` | Methane reduction intervention | Enum | - | Document | Yes | [anaerobic_digester, manure_management, enteric_feed_additive, breeding_program] |
| `livestock_type` | Type of livestock | Enum | - | Document | Yes | [dairy_cattle, beef_cattle, swine, poultry, other] |
| `herd_size` | Number of animals | Integer | animals | Measured | Yes | >0 |
| `project_start_date` | Project commencement | Date | - | Document | Yes | Valid date |

#### 3.6.2 Baseline Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `baseline_manure_system` | Baseline manure management | Enum | - | Document | Yes | [open_lagoon, solid_storage, pasture_range, daily_spread, other] |
| `baseline_methane_emission_factor` | CH4 EF for baseline system | Float | kg CH4/head/year | IPCC/Default | Yes | >0 |
| `baseline_enteric_emissions` | Baseline enteric fermentation CH4 | Float | kg CH4/head/year | IPCC/Default | Conditional | >0 if applicable |
| `average_animal_weight` | Live weight of animals | Float | kg | Measured | Yes | >0 |
| `animal_days_per_year` | Days animals present per year | Integer | days/year | Document | Yes | 1-365 |

#### 3.6.3 Project Intervention Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `digester_type` | Anaerobic digester type | Enum | - | Document | Conditional | [covered_lagoon, complete_mix, plug_flow, fixed_film] |
| `biogas_capture_efficiency` | Biogas collection efficiency | Float | % | Measured | Conditional | 0-100% |
| `methane_destruction_efficiency` | Flare/engine CH4 destruction | Float | % | Measured | Conditional | 90-100% |
| `biogas_production_volume` | Volume of biogas produced | Float | m³/year | Measured | Conditional | ≥0 |
| `methane_content_biogas` | CH4 concentration in biogas | Float | % | Measured | Conditional | 50-70% |
| `feed_additive_type` | Enteric additive type | Enum | - | Document | Conditional | [3_nop, seaweed, essential_oils, other] |
| `feed_additive_reduction_pct` | Emission reduction from additive | Float | % | Measured | Conditional | 0-50% |

#### 3.6.4 Monitoring Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `biogas_flow_meter_readings` | Continuous flow measurements | Array | m³ | Measured | Conditional | Hourly/daily readings |
| `methane_analyzer_data` | CH4 concentration measurements | Array | % | Measured | Conditional | Continuous readings |
| `flame_temperature_monitoring` | Destruction device temp | Array | °C | Measured | Conditional | Continuous readings |
| `herd_size_monthly` | Monthly animal counts | Array | animals | Measured | Yes | Monthly values |
| `destruction_device_operating_hours` | Hours of operation | Float | hours | Measured | Conditional | 0-8760 hours/year |

---

### 3.7 Rice Cultivation

#### 3.7.1 Project Definition Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_id` | Unique project identifier | String | - | System | Yes | UUID format |
| `cultivation_area` | Total rice paddy area | Float | ha | Measured | Yes | >0 |
| `water_management_practice` | Water management intervention | Enum | - | Document | Yes | [alternate_wetting_drying, midseason_drainage, aerobic, other] |
| `number_growing_seasons` | Rice crops per year | Integer | seasons/year | Document | Yes | 1-3 |
| `project_start_date` | Project commencement | Date | - | Document | Yes | Valid date |

#### 3.7.2 Baseline Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `baseline_water_regime` | Baseline flooding practice | Enum | - | Document | Yes | [continuously_flooded, intermittently_flooded, rainfed] |
| `baseline_organic_amendment` | Baseline organic inputs | Enum | - | Document | Yes | [none, straw_incorporated, compost, manure] |
| `baseline_methane_ef` | Baseline CH4 emission factor | Float | kg CH4/ha/season | IPCC/Default | Yes | >0 |
| `baseline_flooding_days` | Days of flooding per season | Integer | days | Document | Yes | 0-180 |
| `straw_burning_baseline` | Post-harvest straw burning | Boolean | - | Document | Yes | True/False |

#### 3.7.3 Project Practice Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `project_water_regime` | Project flooding practice | Enum | - | Document | Yes | [continuously_flooded, intermittently_flooded, rainfed] |
| `project_organic_amendment` | Project organic inputs | Enum | - | Document | Yes | [none, straw_incorporated, compost, manure] |
| `project_flooding_days` | Project flooding days per season | Integer | days | Measured | Yes | 0-180 |
| `dry_days_per_cycle` | Number of dry days in AWD | Integer | days | Measured | Conditional | 0-30 |
| `number_drying_cycles` | AWD drying cycles per season | Integer | cycles | Measured | Conditional | ≥0 |
| `straw_management_practice` | Post-harvest straw management | Enum | - | Document | Yes | [burned, incorporated, removed, composted] |

#### 3.7.4 Monitoring Parameters

| Parameter | Description | Data Type | Units | Source | Required | Validation Rules |
|-----------|-------------|-----------|-------|--------|----------|------------------|
| `water_level_monitoring` | Paddy water level measurements | Array | cm | Measured | Yes | Daily readings |
| `adoption_rate_pct` | Farmer adoption percentage | Float | % | Measured | Yes | 0-100% |
| `implementation_area_verified` | Verified implementation area | Float | ha | Measured | Yes | ≤cultivation_area |
| `farmer_group_size` | Number of participating farmers | Integer | farmers | Document | Yes | >0 |
| `practice_compliance_rate` | Compliance with AWD protocol | Float | % | Measured | Yes | 0-100% |

---

## 4. Calculation Algorithms

### 4.1 ARR Calculation Algorithm

#### 4.1.1 Baseline Scenario Calculation

```
BASELINE_CARBON_STOCK_CALCULATION:

CS_BL_total = CS_BL_agb + CS_BL_bgb + CS_BL_dw + CS_BL_litter + CS_BL_soc

Where:
- CS_BL_agb = Baseline above-ground biomass carbon stock (tCO2e/ha)
- CS_BL_bgb = Baseline below-ground biomass carbon stock (tCO2e/ha)
- CS_BL_dw = Baseline dead wood carbon stock (tCO2e/ha)
- CS_BL_litter = Baseline litter carbon stock (tCO2e/ha)
- CS_BL_soc = Baseline soil organic carbon stock (tCO2e/ha)

BASELINE_EMISSIONS_CALCULATION (if applicable):

E_BL = Area × CS_BL_total × d_rate × (44/12)

Where:
- d_rate = Baseline deforestation rate (fraction/year)
- 44/12 = Molecular weight ratio CO2/C
```

#### 4.1.2 Project Scenario Calculation

```
PROJECT_CARBON_STOCK_CALCULATION:

CS_P_total(t) = CS_P_agb(t) + CS_P_bgb(t) + CS_P_dw(t) + CS_P_litter(t) + CS_P_soc(t)

Where:
- CS_P_agb(t) = Project AGB at time t, calculated using growth function:
  
  CS_P_agb(t) = CS_P_agb_max × [1 - exp(-k × t)]^p
  
  Where:
  - CS_P_agb_max = Maximum AGB carbon stock (tCO2e/ha)
  - k = Growth rate parameter (species/ecosystem specific)
  - p = Shape parameter (typically 1-3)
  - t = Time since project start (years)

PROJECT_REMOVALS_CALCULATION:

ΔCS_P(t) = CS_P_total(t) - CS_P_total(t-1)

Annual_Removals(t) = ΔCS_P(t) × Project_Area
```

#### 4.1.3 Net Credit Calculation

```
GROSS_CREDITS(t) = Annual_Removals(t) - Baseline_Emissions(t)

LEAKAGE_ADJUSTMENT:

L_activity = Gross_Credits × Leakage_Factor_activity
L_market = Gross_Credits × Leakage_Factor_market (if applicable)
Total_Leakage = L_activity + L_market

BUFFER_DEDUCTION:

Buffer_Contribution = (Gross_Credits - Total_Leakage) × Buffer_Rate

Where Buffer_Rate is determined by:
- Project type (ARR = 10-20% base rate)
- Risk assessment score (adds 0-30%)
- Permanence period (longer = lower rate)

UNCERTAINTY_DISCOUNT:

Uncertainty_Factor = 1 - (Uncertainty_Percentage / 100)

NET_CREDITS(t) = (Gross_Credits - Total_Leakage) × Uncertainty_Factor - Buffer_Contribution
```

### 4.2 IFM Calculation Algorithm

#### 4.2.1 Baseline Scenario Calculation

```
BASELINE_CARBON_STOCK_PROJECTION:

CS_BL(t) = f(Harvest_Schedule, Regeneration_Rate, Initial_Stock)

For extended rotation scenarios:

CS_BL(t) = CS_BL(0) + (Annual_Increment × t) - (Harvest_Volume_BL × t × Carbon_Factor)

Where:
- Annual_Increment = Natural growth rate (tCO2e/ha/year)
- Harvest_Volume_BL = Baseline harvest rate (m³/ha/year)
- Carbon_Factor = Carbon conversion factor (tCO2e/m³)

BASELINE_HARVEST_SCHEDULE_MODELING:

For each rotation period R:
  Standing_Volume_BL(t) = min(Max_Volume, Regeneration_Rate × (t mod R))
  Harvest_Volume_BL = Standing_Volume_BL at harvest year
```

#### 4.2.2 Project Scenario Calculation

```
PROJECT_CARBON_STOCK:

CS_P(t) = Measured_Live_Biomass + Measured_Dead_Biomass + Measured_SOC

For extended rotation:

CS_P(t) = CS_P(0) + (Annual_Increment × t) - (Harvest_Volume_P × t × Carbon_Factor)

Where Harvest_Volume_P < Harvest_Volume_BL

For reduced impact logging:

CS_P(t) = CS_BL(t) + (Damage_Reduction_Factor × Harvest_Volume × Carbon_Factor)

Where Damage_Reduction_Factor = 0.3-0.5 (30-50% damage reduction)
```

#### 4.2.3 Net Credit Calculation

```
CARBON_STOCK_DELTA:

ΔCS(t) = CS_P(t) - CS_BL(t)

GROSS_CREDITS(t) = ΔCS(t) × Project_Area

LEAKAGE_ADJUSTMENT:

Market_Leakage = Gross_Credits × Market_Leakage_Factor × Timber_Price_Elasticity
Activity_Leakage = Gross_Credits × Activity_Leakage_Factor

BUFFER_DEDUCTION:

Buffer_Contribution = (Gross_Credits - Total_Leakage) × IFM_Buffer_Rate

Where IFM_Buffer_Rate = 10-25% based on:
- Forest type risk
- Management stability
- Legal protections

NET_CREDITS(t) = (Gross_Credits - Total_Leakage) × Uncertainty_Factor - Buffer_Contribution
```

### 4.3 REDD+ Calculation Algorithm

#### 4.3.1 Baseline Deforestation Calculation

```
HISTORICAL_DEFORESTATION_RATE:

HDR = (Total_Deforested_Area_Reference_Period) / (Reference_Period_Years × Forest_Area)

BASELINE_DEFORESTATION_RATE:

BDR = HDR × Adjustment_Factor

Where Adjustment_Factor accounts for:
- Historical trend changes
- Regional context
- National circumstances
- Jurisdictional adjustments

BASELINE_EMISSIONS:

E_BL(t) = BDR × Forest_Area_at_Risk × (CS_Forest - CS_Post_Deforest) × (44/12)

Where:
- CS_Forest = Average forest carbon stock (tCO2e/ha)
- CS_Post_Deforest = Post-deforestation carbon stock (tCO2e/ha)
```

#### 4.3.2 Project Emissions Calculation

```
MONITORED_DEFORESTATION:

MD(t) = Observed_Deforestation_Area × Verification_Confidence_Factor

PROJECT_EMISSIONS:

E_P(t) = MD(t) × (CS_Forest_Stratum - CS_Post_Deforest) × (44/12)

Where CS_Forest_Stratum is determined by spatial stratification
```

#### 4.3.3 Net Credit Calculation

```
GROSS_EMISSION_REDUCTIONS:

ER_gross(t) = E_BL(t) - E_P(t)

LEAKAGE_ADJUSTMENT:

Activity_Shifting_Leakage = ER_gross × 0.10 (default 10%)
Market_Leakage = ER_gross × Market_Leakage_Factor

Total_Leakage = Activity_Shifting_Leakage + Market_Leakage

UNCERTAINTY_ADJUSTMENT:

Uncertainty_Discount = 1 - (RS_Uncertainty × 0.5 + Model_Uncertainty × 0.3 + Sampling_Uncertainty × 0.2)

BUFFER_DEDUCTION:

Buffer_Rate = Base_Rate(20%) + Risk_Premium(0-20%) + Reversal_History_Premium(0-10%)

Buffer_Contribution = (ER_gross - Total_Leakage) × Uncertainty_Discount × Buffer_Rate

NET_CREDITS(t) = (ER_gross - Total_Leakage) × Uncertainty_Discount - Buffer_Contribution
```

### 4.4 Wetlands & Blue Carbon Calculation Algorithm

#### 4.4.1 Baseline Emissions Calculation

```
BASELINE_GHG_FLUXES:

E_BL_CO2(t) = Area × Flux_CO2_BL
E_BL_CH4(t) = Area × Flux_CH4_BL × GWP_CH4
E_BL_N2O(t) = Area × Flux_N2O_BL × GWP_N2O

Where:
- GWP_CH4 = 28 (AR5) or 27.9 (AR6) for 100-year
- GWP_N2O = 265 (AR5) or 273 (AR6) for 100-year

BASELINE_CARBON_STOCK_CHANGE:

ΔCS_BL = Degradation_Rate × (CS_Biomass_BL + CS_Soil_BL)

TOTAL_BASELINE_EMISSIONS:

E_BL_total = E_BL_CO2 + E_BL_CH4 + E_BL_N2O + ΔCS_BL
```

#### 4.4.2 Project Emissions Calculation

```
PROJECT_GHG_FLUXES:

E_P_CO2(t) = Area × Flux_CO2_P
E_P_CH4(t) = Area × Flux_CH4_P × GWP_CH4
E_P_N2O(t) = Area × Flux_N2O_P × GWP_N2O

PROJECT_CARBON_STOCK_CHANGE:

ΔCS_P = Biomass_Accumulation_Rate + Soil_Carbon_Sequestration_Rate

Where:
- Biomass_Accumulation_Rate = Measured or default based on species
- Soil_Carbon_Sequestration_Rate = (CS_Soil_P(t) - CS_Soil_BL) / t

TOTAL_PROJECT_EMISSIONS:

E_P_total = E_P_CO2 + E_P_CH4 + E_P_N2O - ΔCS_P
```

#### 4.4.3 Net Credit Calculation

```
GROSS_CREDITS:

Credits_gross = E_BL_total - E_P_total

LEAKAGE_ADJUSTMENT:

Leakage_Factor = 0.05 to 0.20 (5-20% based on project type)
Leakage_Deduction = Credits_gross × Leakage_Factor

BUFFER_DEDUCTION:

Wetland_Buffer_Rate = 15-30% (higher for wetlands due to:
- Hydrological uncertainty
- Climate change risks
- Fire risk (peatlands)
- Permanence concerns)

Buffer_Contribution = (Credits_gross - Leakage_Deduction) × Wetland_Buffer_Rate

NET_CREDITS = (Credits_gross - Leakage_Deduction) - Buffer_Contribution
```

### 4.5 Soil Carbon Calculation Algorithm

#### 4.5.1 Baseline SOC Calculation

```
BASELINE_SOC_STOCK:

SOC_BL = SOC_Concentration_BL × Bulk_Density_BL × Depth × 100

Where:
- SOC_Concentration_BL = % organic carbon
- Bulk_Density_BL = g/cm³
- Depth = sampling depth (cm)
- 100 = conversion factor to tCO2e/ha

SOC_STOCK_VARIANCE:

Var_SOC_BL = Σ(SOC_BL_i - Mean_SOC_BL)² / (n - 1)
```

#### 4.5.2 Project SOC Calculation

```
DIRECT_SAMPLING_APPROACH:

SOC_P(t) = SOC_Concentration_P(t) × Bulk_Density_P(t) × Depth × 100

SOC_CHANGE:

ΔSOC(t) = SOC_P(t) - SOC_BL

MODEL-BASED_APPROACH:

SOC_P(t) = SOC_Model(SOC_BL, Climate, Soil_Type, Practice_Changes, Time)

Where SOC_Model can be:
- RothC
- Century/DayCent
- DNDC
- Custom model

UNCERTAINTY_CALCULATION:

SOC_Uncertainty = t-value × (Std_Dev / √n) × Finite_Population_Correction
```

#### 4.5.3 Net Credit Calculation

```
GROSS_CREDITS:

Credits_gross = ΔSOC(t) × Project_Area × (44/12)

UNCERTAINTY_DISCOUNT:

If SOC_Uncertainty > 10%:
  Uncertainty_Discount = 1 - (SOC_Uncertainty × 0.5)
Else:
  Uncertainty_Discount = 1.0

LEAKAGE_ADJUSTMENT:

Activity_Leakage = Credits_gross × 0.05 (5% default for soil carbon)

BUFFER_DEDUCTION:

Soil_Carbon_Buffer_Rate = 15-25% based on:
- Reversal risk assessment
- Practice permanence
- Contractual commitments

Buffer_Contribution = (Credits_gross - Activity_Leakage) × Uncertainty_Discount × Soil_Carbon_Buffer_Rate

NET_CREDITS = (Credits_gross - Activity_Leakage) × Uncertainty_Discount - Buffer_Contribution
```

### 4.6 Livestock Methane Calculation Algorithm

#### 4.6.1 Baseline Emissions Calculation

```
BASELINE_MANURE_METHANE:

CH4_BL_manure = VS × B0 × MCF_BL × 0.67 × N

Where:
- VS = Volatile solids excreted (kg dry matter/animal/year)
- B0 = Maximum methane producing capacity (m³ CH4/kg VS)
- MCF_BL = Methane conversion factor for baseline system (%)
- 0.67 = Conversion factor (kg CH4/m³ CH4)
- N = Number of animals

BASELINE_ENTERIC_METHANE:

CH4_BL_enteric = GE × Ym × 365 × N / 55.65

Where:
- GE = Gross energy intake (MJ/animal/day)
- Ym = Methane conversion factor (% of GE)
- 55.65 = Energy content of methane (MJ/kg CH4)

TOTAL_BASELINE_EMISSIONS:

CH4_BL_total = CH4_BL_manure + CH4_BL_enteric
```

#### 4.6.2 Project Emissions Calculation

```
ANAEROBIC_DIGESTER_PROJECT:

Biogas_Produced = Measured_Flow × Time
CH4_Captured = Biogas_Produced × CH4_Content
CH4_Destroyed = CH4_Captured × Destruction_Efficiency

CH4_P_manure = CH4_BL_manure - CH4_Destroyed

MANURE_MANAGEMENT_PROJECT:

MCF_P = MCF for improved system
CH4_P_manure = VS × B0 × MCF_P × 0.67 × N

ENTERIC_INTERVENTION_PROJECT:

CH4_P_enteric = CH4_BL_enteric × (1 - Feed_Additive_Reduction)

TOTAL_PROJECT_EMISSIONS:

CH4_P_total = CH4_P_manure + CH4_P_enteric
```

#### 4.6.3 Net Credit Calculation

```
GROSS_REDUCTIONS:

ΔCH4 = CH4_BL_total - CH4_P_total

Credits_gross = ΔCH4 × GWP_CH4 / 1000 (convert to tCO2e)

ADJUSTMENTS:

Uncertainty_Discount = 1 - (Meter_Uncertainty × 0.3 + Operational_Uncertainty × 0.2)

Livestock_Methane_Buffer = 5-10% (lower due to direct measurement)

Buffer_Contribution = Credits_gross × Uncertainty_Discount × Buffer_Rate

NET_CREDITS = Credits_gross × Uncertainty_Discount - Buffer_Contribution
```

### 4.7 Rice Cultivation Calculation Algorithm

#### 4.7.1 Baseline Emissions Calculation

```
BASELINE_METHANE_EMISSIONS:

CH4_BL = EF_BL × Area × Seasons × 10⁻⁶ × GWP_CH4

Where:
- EF_BL = Baseline emission factor (kg CH4/ha/season)
- 10⁻⁶ = Conversion to tonnes

EF_BL is determined by:
- Water regime (continuous flooding = highest)
- Organic amendments (straw = +50-100%)
- Cultivation period

STRAW_BURNING_EMISSIONS (if applicable):

E_straw_burn = Area × Straw_Production × Burn_Fraction × EF_burn × (44/12)
```

#### 4.7.2 Project Emissions Calculation

```
PROJECT_METHANE_EMISSIONS:

CH4_P = EF_P × Implementation_Area × Seasons × Adoption_Rate × 10⁻⁶ × GWP_CH4

EF_P is determined by:
- Water regime (AWD reduces by 30-50%)
- Organic amendments
- Number of dry days

EF_P = EF_BL × Scaling_Factor(Water_Regime, Organic_Amendment)

Where Scaling_Factor:
- AWD with 2-3 dry cycles: 0.5-0.7
- Midseason drainage: 0.6-0.8
- Aerobic rice: 0.3-0.5
```

#### 4.7.3 Net Credit Calculation

```
GROSS_REDUCTIONS:

ΔCH4 = CH4_BL - CH4_P

Credits_gross = ΔCH4 × Implementation_Area / Total_Area

ADJUSTMENTS:

Compliance_Factor = Verified_Area / Reported_Area
Practice_Factor = Actual_Dry_Days / Protocol_Dry_Days

Adjusted_Credits = Credits_gross × Compliance_Factor × Practice_Factor

Uncertainty_Discount = 1 - (Water_Monitoring_Uncertainty × 0.4 + Area_Uncertainty × 0.3)

Rice_Cultivation_Buffer = 10-15%

Buffer_Contribution = Adjusted_Credits × Uncertainty_Discount × Buffer_Rate

NET_CREDITS = Adjusted_Credits × Uncertainty_Discount - Buffer_Contribution
```

---

## 5. Validation Rules

### 5.1 Cross-Methodology Validation Rules

| Rule ID | Description | Severity | Validation Logic |
|---------|-------------|----------|------------------|
| V-001 | Project area positive | Error | project_area > 0 AND project_area ≤ 500,000 ha |
| V-002 | Date sequence valid | Error | project_start_date ≤ reporting_date |
| V-003 | Crediting period valid | Error | 1 ≤ crediting_period ≤ 60 years |
| V-004 | Carbon stocks non-negative | Error | All carbon stock values ≥ 0 |
| V-005 | Uncertainty within bounds | Error | 0% ≤ uncertainty ≤ 100% |
| V-006 | Buffer rate within bounds | Error | 0% ≤ buffer_rate ≤ 100% |
| V-007 | Leakage factor within bounds | Error | 0% ≤ leakage_factor ≤ 100% |
| V-008 | Project area matches strata sum | Warning | ABS(project_area - SUM(strata_areas)) < 1% |
| V-009 | Vintage year valid | Error | project_start_year ≤ vintage_year ≤ current_year |

### 5.2 ARR-Specific Validation Rules

| Rule ID | Description | Severity | Validation Logic |
|---------|-------------|----------|------------------|
| ARR-001 | Planting density valid | Error | 50 ≤ planting_density ≤ 10,000 trees/ha |
| ARR-002 | Survival rate valid | Error | 0% ≤ survival_rate ≤ 100% |
| ARR-003 | Project carbon exceeds baseline | Warning | CS_P(t) ≥ CS_BL for all t |
| ARR-004 | Growth rate realistic | Warning | Annual increment ≤ 50 tCO2e/ha/year |
| ARR-005 | Species composition valid | Error | At least 1 species specified |
| ARR-006 | Monitoring frequency valid | Error | 1 ≤ monitoring_frequency ≤ 10 years |
| ARR-007 | Ecological zone specified | Error | Valid IPCC climate zone |
| ARR-008 | Activity type valid | Error | activity_type ∈ [afforestation, reforestation, revegetation, anr] |

### 5.3 IFM-Specific Validation Rules

| Rule ID | Description | Severity | Validation Logic |
|---------|-------------|----------|------------------|
| IFM-001 | Rotation period valid | Error | 5 ≤ rotation_period ≤ 200 years |
| IFM-002 | Project rotation ≥ baseline | Warning | project_rotation ≥ baseline_rotation |
| IFM-003 | Harvest volume realistic | Warning | harvest_volume ≤ standing_volume × 0.9 |
| IFM-004 | Forest inventory current | Error | inventory_date ≥ project_start_date - 5 years |
| IFM-005 | Standing volume positive | Error | standing_volume ≥ 0 |
| IFM-006 | RIL percentage valid | Error | 0% ≤ ril_percentage ≤ 100% |
| IFM-007 | Species composition sum | Error | SUM(species_percentages) = 100% |

### 5.4 REDD+-Specific Validation Rules

| Rule ID | Description | Severity | Validation Logic |
|---------|-------------|----------|------------------|
| REDD-001 | Reference period ≥ 10 years | Error | reference_period_years ≥ 10 |
| REDD-002 | Historical deforestation rate valid | Error | 0% ≤ hdr ≤ 100% |
| REDD-003 | Forest area at risk ≤ total area | Error | forest_area_at_risk ≤ project_area_total |
| REDD-004 | Stratification covers area | Error | ABS(SUM(strata_areas) - project_area) < 1% |
| REDD-005 | Carbon stock > post-deforestation | Error | cs_forest > cs_post_deforest |
| REDD-006 | Verification confidence valid | Error | 50% ≤ verification_confidence ≤ 100% |
| REDD-007 | Deforestation drivers specified | Error | LENGTH(drivers) ≥ 1 |
| REDD-008 | Observed deforestation ≤ baseline | Warning | observed_deforestation ≤ baseline_deforestation × 2 |

### 5.5 Wetlands-Specific Validation Rules

| Rule ID | Description | Severity | Validation Logic |
|---------|-------------|----------|------------------|
| WET-001 | Peat depth valid | Error | 0 ≤ peat_depth ≤ 20 m |
| WET-002 | Bulk density valid | Error | 0 ≤ bulk_density ≤ 0.5 g/cm³ |
| WET-003 | Water table depth valid | Error | -500 ≤ water_table_depth ≤ +100 cm |
| WET-004 | Organic carbon content valid | Error | 0% ≤ organic_carbon ≤ 100% |
| WET-005 | Salinity valid for coastal | Error | 0 ≤ salinity ≤ 40 ppt |
| WET-006 | Tidal range valid | Error | 0 ≤ tidal_range ≤ 10 m |
| WET-007 | Wetland type specified | Error | wetland_type ∈ [mangrove, peatland, tidal_marsh, seagrass] |

### 5.6 Soil Carbon-Specific Validation Rules

| Rule ID | Description | Severity | Validation Logic |
|---------|-------------|----------|------------------|
| SOIL-001 | Sampling depth valid | Error | 10 ≤ sampling_depth ≤ 100 cm |
| SOIL-002 | Bulk density valid | Error | 0.5 ≤ bulk_density ≤ 2.0 g/cm³ |
| SOIL-003 | SOC concentration valid | Error | 0% ≤ soc_concentration ≤ 100% |
| SOIL-004 | Sample points sufficient | Error | number_sample_points ≥ 3 |
| SOIL-005 | Sampling grid valid | Error | sampling_grid_size > 0 |
| SOIL-006 | Practice adoption rate valid | Error | 0% ≤ adoption_rate ≤ 100% |
| SOIL-007 | Amendment rate valid | Warning | organic_amendment_rate ≤ 100 t/ha/year |

### 5.7 Livestock Methane-Specific Validation Rules

| Rule ID | Description | Severity | Validation Logic |
|---------|-------------|----------|------------------|
| LIVE-001 | Herd size positive | Error | herd_size > 0 |
| LIVE-002 | Animal weight valid | Error | 10 ≤ animal_weight ≤ 2000 kg |
| LIVE-003 | Biogas capture efficiency valid | Error | 0% ≤ capture_efficiency ≤ 100% |
| LIVE-004 | Destruction efficiency valid | Error | 90% ≤ destruction_efficiency ≤ 100% |
| LIVE-005 | Methane content valid | Error | 50% ≤ methane_content ≤ 70% |
| LIVE-006 | Operating hours valid | Error | 0 ≤ operating_hours ≤ 8760 |
| LIVE-007 | Animal days valid | Error | 1 ≤ animal_days ≤ 365 |

### 5.8 Rice Cultivation-Specific Validation Rules

| Rule ID | Description | Severity | Validation Logic |
|---------|-------------|----------|------------------|
| RICE-001 | Cultivation area positive | Error | cultivation_area > 0 |
| RICE-002 | Growing seasons valid | Error | 1 ≤ growing_seasons ≤ 3 |
| RICE-003 | Flooding days valid | Error | 0 ≤ flooding_days ≤ 180 |
| RICE-004 | Dry days valid | Error | 0 ≤ dry_days ≤ 30 |
| RICE-005 | Adoption rate valid | Error | 0% ≤ adoption_rate ≤ 100% |
| RICE-006 | Farmer group size valid | Error | farmer_group_size > 0 |
| RICE-007 | Compliance rate valid | Error | 0% ≤ compliance_rate ≤ 100% |
| RICE-008 | Water level data present | Error | LENGTH(water_level_monitoring) ≥ 30 |

---

## 6. Output Specifications

### 6.1 Standard Output Format

All methodologies shall produce outputs in the following structure:

```json
{
  "calculation_metadata": {
    "project_id": "string",
    "methodology": "enum",
    "calculation_version": "string",
    "calculation_timestamp": "datetime",
    "reporting_period": {
      "start_date": "date",
      "end_date": "date"
    },
    "vintage_year": "integer"
  },
  "input_summary": {
    "project_area": "float",
    "baseline_parameters_hash": "string",
    "project_parameters_hash": "string"
  },
  "baseline_results": {
    "baseline_emissions": "float",
    "baseline_carbon_stock": "float",
    "calculation_method": "string"
  },
  "project_results": {
    "project_emissions": "float",
    "project_carbon_stock": "float",
    "project_removals": "float"
  },
  "credit_calculation": {
    "gross_credits": "float",
    "leakage_deduction": "float",
    "uncertainty_discount": "float",
    "buffer_contribution": "float",
    "net_credits": "float"
  },
  "uncertainty_analysis": {
    "overall_uncertainty": "float",
    "confidence_interval_95": {
      "lower": "float",
      "upper": "float"
    },
    "uncertainty_components": [
      {
        "component": "string",
        "contribution": "float"
      }
    ]
  },
  "validation_results": {
    "validation_status": "enum",
    "errors": ["array"],
    "warnings": ["array"]
  },
  "audit_trail": {
    "input_data_sources": ["array"],
    "calculation_steps": ["array"],
    "assumptions_applied": ["array"]
  }
}
```

### 6.2 Output Units and Precision

| Output Field | Unit | Decimal Places | Notes |
|--------------|------|----------------|-------|
| Carbon stocks | tCO2e/ha | 2 | Per hectare basis |
| Emissions | tCO2e | 3 | Total project emissions |
| Credits | tCO2e | 3 | Final credit quantity |
| Area | ha | 2 | Project area measurements |
| Percentages | % | 2 | All percentage values |
| Fluxes | tCO2e/ha/year | 3 | Annual flux rates |
| Uncertainty | % | 2 | Uncertainty percentages |

### 6.3 Credit Issuance Output

```json
{
  "credit_issuance_request": {
    "project_id": "string",
    "vintage_year": "integer",
    "monitoring_period": {
      "start": "date",
      "end": "date"
    },
    "credit_breakdown": {
      "removal_credits": "float",
      "avoidance_credits": "float",
      "reduction_credits": "float"
    },
    "buffer_pool_contribution": {
      "pool_type": "enum",
      "quantity": "float",
      "buffer_rate_applied": "float"
    },
    "net_issuance": "float",
    "serial_number_range": {
      "start": "string",
      "end": "string"
    }
  }
}
```

---

## 7. MRV Integration

### 7.1 Data Collection Frequency by Methodology

| Methodology | Parameter Category | Minimum Frequency | Recommended Frequency |
|-------------|-------------------|-------------------|----------------------|
| ARR | Forest inventory | Every 5 years | Every 3-5 years |
| ARR | Remote sensing | Annual | Semi-annual |
| ARR | Survival monitoring | Annual | Annual |
| IFM | Forest inventory | Every 5 years | Every 3-5 years |
| IFM | Harvest records | Continuous | Continuous |
| IFM | Remote sensing | Annual | Annual |
| REDD+ | Remote sensing | Annual | Semi-annual |
| REDD+ | Ground truthing | Every 3 years | Annual for hotspots |
| REDD+ | Stratification update | Every 5 years | Every 3 years |
| Wetlands | GHG flux measurements | Every 3 years | Annual for first 3 years |
| Wetlands | Water table monitoring | Monthly | Continuous (automated) |
| Wetlands | Vegetation monitoring | Every 3 years | Every 2 years |
| Soil Carbon | Soil sampling | Every 3-5 years | Every 3 years |
| Soil Carbon | Practice monitoring | Annual | Annual |
| Livestock Methane | Biogas flow | Continuous | Continuous |
| Livestock Methane | Herd counts | Monthly | Monthly |
| Livestock Methane | Maintenance logs | Per event | Per event |
| Rice Cultivation | Water level | Daily during season | Daily |
| Rice Cultivation | Practice verification | Per season | Per season |
| Rice Cultivation | Area verification | Annual | Annual |

### 7.2 Verification Evidence Requirements

#### 7.2.1 ARR Verification Evidence

| Evidence Type | Description | Format | Retention Period |
|---------------|-------------|--------|------------------|
| Land title documentation | Proof of land ownership/control | PDF/Scanned | Project lifetime + 7 years |
| Planting records | Species, dates, locations | Database/CSV | Project lifetime + 7 years |
| Field measurement data | Tree measurements (DBH, height) | Database/Excel | Project lifetime + 7 years |
| Remote sensing imagery | Satellite/aerial imagery | GeoTIFF | Project lifetime + 7 years |
| Inventory reports | Third-party forest inventories | PDF | Project lifetime + 7 years |
| Survival surveys | Tree survival assessments | Database/Excel | Project lifetime + 7 years |

#### 7.2.2 IFM Verification Evidence

| Evidence Type | Description | Format | Retention Period |
|---------------|-------------|--------|------------------|
| Forest management plan | Approved management document | PDF | Project lifetime + 7 years |
| Harvest permits | Legal authorization for harvest | PDF | Project lifetime + 7 years |
| Harvest records | Volume, species, locations | Database/CSV | Project lifetime + 7 years |
| Inventory data | Pre/post-harvest measurements | Database/Excel | Project lifetime + 7 years |
| Chain of custody | Timber tracking documentation | Database/PDF | Project lifetime + 7 years |
| Remote sensing | Forest cover monitoring | GeoTIFF | Project lifetime + 7 years |

#### 7.2.3 REDD+ Verification Evidence

| Evidence Type | Description | Format | Retention Period |
|---------------|-------------|--------|------------------|
| Historical deforestation analysis | Reference period assessment | PDF/GeoTIFF | Project lifetime + 7 years |
| Baseline model documentation | Deforestation model details | PDF/Code | Project lifetime + 7 years |
| Stratification map | Carbon stock stratification | Shapefile | Project lifetime + 7 years |
| Remote sensing analysis | Deforestation detection | GeoTIFF/Report | Project lifetime + 7 years |
| Ground truthing reports | Field verification of deforestation | PDF | Project lifetime + 7 years |
| Leakage monitoring | Activity displacement evidence | Database/PDF | Project lifetime + 7 years |
| Safeguard documentation | Social/environmental safeguards | PDF | Project lifetime + 7 years |

#### 7.2.4 Wetlands Verification Evidence

| Evidence Type | Description | Format | Retention Period |
|---------------|-------------|--------|------------------|
| Hydrological restoration plan | Engineering/design documents | PDF | Project lifetime + 7 years |
| Water table monitoring data | Continuous water level records | Database/CSV | Project lifetime + 7 years |
| GHG flux measurements | Chamber/eddy covariance data | Database/Excel | Project lifetime + 7 years |
| Soil carbon sampling | Core samples and lab analysis | Database/PDF | Project lifetime + 7 years |
| Vegetation surveys | Species composition and biomass | Database/Excel | Project lifetime + 7 years |
| Remote sensing | Wetland extent and condition | GeoTIFF | Project lifetime + 7 years |

#### 7.2.5 Soil Carbon Verification Evidence

| Evidence Type | Description | Format | Retention Period |
|---------------|-------------|--------|------------------|
| Soil sampling protocol | Sampling design and procedures | PDF | Project lifetime + 7 years |
| Sample location coordinates | GPS coordinates of sample points | Shapefile/CSV | Project lifetime + 7 years |
| Laboratory analysis results | SOC concentration, bulk density | Database/PDF | Project lifetime + 7 years |
| Practice implementation records | Evidence of practice adoption | Database/PDF | Project lifetime + 7 years |
| Model calibration data | Model inputs and parameters | Database/Code | Project lifetime + 7 years |
| Remote sensing | Land cover and management | GeoTIFF | Project lifetime + 7 years |

#### 7.2.6 Livestock Methane Verification Evidence

| Evidence Type | Description | Format | Retention Period |
|---------------|-------------|--------|------------------|
| Digester design specifications | Engineering documentation | PDF | Project lifetime + 7 years |
| Biogas flow meter calibration | Calibration certificates | PDF | Project lifetime + 7 years |
| Continuous monitoring data | Hourly/daily biogas production | Database/CSV | Project lifetime + 7 years |
| Maintenance records | Equipment maintenance logs | Database/PDF | Project lifetime + 7 years |
| Herd records | Animal counts and characteristics | Database/CSV | Project lifetime + 7 years |
| Methane analyzer data | CH4 concentration measurements | Database/CSV | Project lifetime + 7 years |
| Destruction device monitoring | Temperature/operation logs | Database/CSV | Project lifetime + 7 years |

#### 7.2.7 Rice Cultivation Verification Evidence

| Evidence Type | Description | Format | Retention Period |
|---------------|-------------|--------|------------------|
| Farmer agreements | Participation contracts | PDF | Project lifetime + 7 years |
| Water level monitoring | Daily water depth measurements | Database/CSV | Project lifetime + 7 years |
| Field implementation records | Practice adoption verification | Database/PDF | Project lifetime + 7 years |
| Area verification | GPS mapping of implementation | Shapefile | Project lifetime + 7 years |
| Training records | Farmer training documentation | PDF | Project lifetime + 7 years |
| Seasonal reports | Per-season implementation reports | PDF | Project lifetime + 7 years |

### 7.3 Third-Party Validator Integration

#### 7.3.1 Validator API Endpoints

```
POST /api/v1/validation/submit
- Submit calculation package for validation
- Request body: Complete calculation output
- Response: Validation ID and status

GET /api/v1/validation/{validation_id}/status
- Check validation status
- Response: Status, estimated completion

GET /api/v1/validation/{validation_id}/report
- Retrieve validation report
- Response: Validation findings, findings classification

POST /api/v1/validation/{validation_id}/response
- Submit response to validation findings
- Request body: Response to each finding
```

#### 7.3.2 Validation Report Structure

```json
{
  "validation_id": "string",
  "validator_organization": "string",
  "validation_date": "datetime",
  "findings": [
    {
      "finding_id": "string",
      "category": "enum",
      "severity": "enum",
      "description": "string",
      "relevant_parameters": ["array"],
      "corrective_action_required": "boolean"
    }
  ],
  "conclusion": "enum",
  "credit_adjustment": "float",
  "recommendations": ["array"]
}
```

### 7.4 Audit Trail Requirements

#### 7.4.1 Audit Log Structure

```json
{
  "audit_event": {
    "event_id": "UUID",
    "timestamp": "datetime",
    "event_type": "enum",
    "user_id": "string",
    "session_id": "string",
    "ip_address": "string",
    "affected_entity": {
      "entity_type": "enum",
      "entity_id": "string"
    },
    "changes": {
      "before": "object",
      "after": "object"
    },
    "justification": "string"
  }
}
```

#### 7.4.2 Required Audit Events

| Event Type | Description | Data Captured |
|------------|-------------|---------------|
| CALCULATION_INITIATED | Calculation started | User, timestamp, project ID |
| INPUT_DATA_UPLOADED | Input data uploaded | File hash, source, timestamp |
| CALCULATION_COMPLETED | Calculation finished | Results hash, duration |
| RESULTS_MODIFIED | Results manually adjusted | Before/after values, reason |
| VALIDATION_SUBMITTED | Sent for validation | Validator, timestamp |
| VALIDATION_RECEIVED | Validation report received | Findings, conclusion |
| CREDIT_ISSUED | Credits issued | Quantity, vintage, serials |
| REVERSAL_RECORDED | Carbon reversal event | Quantity, reason, date |

---

## 8. Technical Architecture

### 8.1 Recommended Technology Stack

#### 8.1.1 Backend Services

| Component | Technology | Justification |
|-----------|------------|---------------|
| API Framework | Python FastAPI / Node.js Express | High performance, async support |
| Calculation Engine | Python (NumPy, SciPy, Pandas) | Scientific computing libraries |
| Database | PostgreSQL + PostGIS | Spatial data support, ACID compliance |
| Cache | Redis | High-speed caching for repeated calculations |
| Message Queue | RabbitMQ / Apache Kafka | Async processing, scalability |
| Task Processing | Celery / Apache Airflow | Background job processing |

#### 8.1.2 Geospatial Processing

| Component | Technology | Justification |
|-----------|------------|---------------|
| GIS Engine | GDAL / rasterio | Industry standard geospatial processing |
| Spatial Database | PostGIS | Native spatial queries and indexing |
| Remote Sensing | Google Earth Engine API / Sentinel Hub | Satellite data access |
| Map Server | GeoServer / MapServer | WMS/WFS services |

#### 8.1.3 Frontend (if applicable)

| Component | Technology | Justification |
|-----------|------------|---------------|
| UI Framework | React / Vue.js | Component-based architecture |
| Mapping | Leaflet / Mapbox GL JS | Interactive mapping |
| Visualization | D3.js / Chart.js | Data visualization |

### 8.2 API Design for Calculation Services

#### 8.2.1 Core Calculation Endpoints

```
POST /api/v1/calculate/{methodology}
Description: Execute calculation for specified methodology
Request Body: Methodology-specific input parameters
Response: Calculation results with uncertainty analysis

GET /api/v1/calculate/{calculation_id}/status
Description: Check calculation status
Response: Status, progress, estimated completion

GET /api/v1/calculate/{calculation_id}/results
Description: Retrieve calculation results
Response: Complete calculation output

POST /api/v1/calculate/batch
Description: Execute batch calculations
Request Body: Array of calculation requests
Response: Batch job ID, individual calculation IDs

POST /api/v1/calculate/{calculation_id}/clone
Description: Clone calculation with modifications
Request Body: Parameter overrides
Response: New calculation ID
```

#### 8.2.2 Input Validation Endpoints

```
POST /api/v1/validate/{methodology}
Description: Validate input parameters without calculation
Request Body: Input parameters
Response: Validation results (errors/warnings)

GET /api/v1/validate/defaults/{methodology}
Description: Get default values for methodology
Response: Default parameter values with sources

GET /api/v1/validate/ranges/{methodology}/{parameter}
Description: Get valid ranges for parameter
Response: Min, max, recommended values
```

#### 8.2.3 Methodology Information Endpoints

```
GET /api/v1/methodologies
Description: List supported methodologies
Response: Methodology list with descriptions

GET /api/v1/methodologies/{methodology}
Description: Get methodology details
Response: Parameters, formulas, requirements

GET /api/v1/methodologies/{methodology}/equations
Description: Get calculation equations
Response: LaTeX or MathML formatted equations

GET /api/v1/methodologies/{methodology}/defaults
Description: Get default parameter values
Response: Default values with IPCC/source references
```

### 8.3 Database Schema Recommendations

#### 8.3.1 Core Tables

```sql
-- Projects table
CREATE TABLE projects (
    project_id UUID PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    methodology VARCHAR(50) NOT NULL,
    standard VARCHAR(50) NOT NULL,
    project_area DECIMAL(12,2) NOT NULL,
    project_start_date DATE NOT NULL,
    crediting_period_years INTEGER NOT NULL,
    project_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calculations table
CREATE TABLE calculations (
    calculation_id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(project_id),
    calculation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    vintage_year INTEGER NOT NULL,
    calculation_status VARCHAR(50) NOT NULL,
    gross_credits DECIMAL(15,3),
    net_credits DECIMAL(15,3),
    uncertainty_pct DECIMAL(5,2),
    buffer_contribution DECIMAL(15,3),
    validation_status VARCHAR(50),
    input_hash VARCHAR(64) NOT NULL
);

-- Input parameters table (JSONB for flexibility)
CREATE TABLE input_parameters (
    parameter_id UUID PRIMARY KEY,
    calculation_id UUID REFERENCES calculations(calculation_id),
    parameter_category VARCHAR(50) NOT NULL,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_value JSONB NOT NULL,
    data_source VARCHAR(50) NOT NULL,
    uncertainty_pct DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carbon stocks table
CREATE TABLE carbon_stocks (
    stock_id UUID PRIMARY KEY,
    calculation_id UUID REFERENCES calculations(calculation_id),
    stock_type VARCHAR(50) NOT NULL, -- AGB, BGB, SOC, etc.
    scenario VARCHAR(20) NOT NULL, -- baseline, project
    stock_value DECIMAL(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    measurement_date DATE,
    spatial_reference VARCHAR(100)
);

-- Audit log table
CREATE TABLE audit_log (
    event_id UUID PRIMARY KEY,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    project_id UUID REFERENCES projects(project_id),
    calculation_id UUID REFERENCES calculations(calculation_id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    changes_before JSONB,
    changes_after JSONB,
    justification TEXT
);

-- Credit issuance table
CREATE TABLE credit_issuance (
    issuance_id UUID PRIMARY KEY,
    calculation_id UUID REFERENCES calculations(calculation_id),
    issuance_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vintage_year INTEGER NOT NULL,
    removal_credits DECIMAL(15,3),
    avoidance_credits DECIMAL(15,3),
    reduction_credits DECIMAL(15,3),
    buffer_contribution DECIMAL(15,3),
    net_issuance DECIMAL(15,3),
    serial_start VARCHAR(50),
    serial_end VARCHAR(50),
    issuance_status VARCHAR(50) NOT NULL
);
```

#### 8.3.2 Spatial Tables (PostGIS)

```sql
-- Project boundaries
CREATE TABLE project_boundaries (
    boundary_id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(project_id),
    boundary_type VARCHAR(50) NOT NULL,
    geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    area_ha DECIMAL(12,2) GENERATED ALWAYS AS (ST_Area(geometry::geography)/10000) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_boundaries_geom ON project_boundaries USING GIST(geometry);

-- Stratification polygons
CREATE TABLE stratification_units (
    unit_id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(project_id),
    stratum_name VARCHAR(100) NOT NULL,
    carbon_stock_value DECIMAL(12,3),
    geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    area_ha DECIMAL(12,2) GENERATED ALWAYS AS (ST_Area(geometry::geography)/10000) STORED
);

CREATE INDEX idx_stratification_geom ON stratification_units USING GIST(geometry);

-- Sample points
CREATE TABLE sample_points (
    point_id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(project_id),
    sample_type VARCHAR(50) NOT NULL,
    sample_date DATE,
    geometry GEOMETRY(POINT, 4326) NOT NULL,
    measurements JSONB
);

CREATE INDEX idx_sample_points_geom ON sample_points USING GIST(geometry);
```

### 8.4 Performance Requirements

| Metric | Requirement | Notes |
|--------|-------------|-------|
| Single calculation response time | < 5 seconds | For standard complexity |
| Complex calculation response time | < 30 seconds | REDD+ with large areas |
| Batch calculation throughput | > 100 calculations/hour | Parallel processing |
| Concurrent calculations | > 50 simultaneous | Auto-scaling support |
| Database query time | < 100ms | For standard queries |
| Spatial query time | < 2 seconds | For large spatial datasets |
| API availability | 99.9% uptime | Excluding maintenance |
| Data retention | 7 years post-project | Regulatory requirement |

### 8.5 Scalability Considerations

#### 8.5.1 Horizontal Scaling

- Stateless API services for easy horizontal scaling
- Database read replicas for query distribution
- Sharding strategy for large project datasets
- CDN for static assets and documentation

#### 8.5.2 Caching Strategy

| Cache Level | Data Type | TTL | Invalidation |
|-------------|-----------|-----|--------------|
| L1 (Application) | Default parameters | 1 hour | Manual |
| L1 (Application) | IPCC factors | 24 hours | Version-based |
| L2 (Redis) | Calculation results | 1 hour | On recalculation |
| L2 (Redis) | Validation rules | 1 hour | On update |
| L3 (CDN) | Static resources | 1 week | Version-based |

#### 8.5.3 Resource Allocation

| Component | Min Resources | Recommended | Notes |
|-----------|---------------|-------------|-------|
| API Servers | 2 CPU, 4GB RAM | 4 CPU, 8GB RAM | Per instance |
| Calculation Workers | 4 CPU, 8GB RAM | 8 CPU, 16GB RAM | For complex models |
| Database | 4 CPU, 16GB RAM | 8 CPU, 32GB RAM | SSD storage required |
| Redis Cache | 2 CPU, 4GB RAM | 4 CPU, 8GB RAM | Persistence enabled |
| File Storage | 1TB | 10TB+ | Scalable cloud storage |

---

## 9. Appendices

### Appendix A: IPCC Default Values Reference

| Parameter | Default Value | Source | Conditions |
|-----------|---------------|--------|------------|
| B0 (dairy cattle) | 0.24 m³ CH4/kg VS | IPCC 2019 | Default for developed countries |
| B0 (beef cattle) | 0.19 m³ CH4/kg VS | IPCC 2019 | Default for developed countries |
| MCF (liquid system) | 66% | IPCC 2019 | Average annual temperature > 28°C |
| MCF (solid storage) | 4% | IPCC 2019 | Average annual temperature > 28°C |
| Ym (cattle) | 6.5% | IPCC 2019 | Of gross energy intake |
| GWP CH4 (AR5) | 28 | IPCC AR5 | 100-year time horizon |
| GWP CH4 (AR6) | 27.9 | IPCC AR6 | 100-year time horizon |
| GWP N2O (AR5) | 265 | IPCC AR5 | 100-year time horizon |
| GWP N2O (AR6) | 273 | IPCC AR6 | 100-year time horizon |
| Root:shoot ratio (tropical) | 0.24 | IPCC 2006 | For broadleaf forests |
| Root:shoot ratio (temperate) | 0.26 | IPCC 2006 | For broadleaf forests |

### Appendix B: Buffer Pool Rate Guidelines

| Methodology | Base Rate | Risk Range | Maximum |
|-------------|-----------|------------|---------|
| ARR | 10% | +0-20% | 30% |
| IFM | 10% | +0-15% | 25% |
| REDD+ | 20% | +0-20% | 40% |
| Wetlands | 15% | +0-20% | 35% |
| Soil Carbon | 15% | +0-15% | 30% |
| Livestock Methane | 5% | +0-5% | 10% |
| Rice Cultivation | 10% | +0-10% | 20% |

### Appendix C: Uncertainty Calculation Methods

#### C.1 Error Propagation (for independent uncertainties)

```
σ_total = √(σ₁² + σ₂² + ... + σn²)
```

#### C.2 Monte Carlo Simulation (for complex dependencies)

```
1. Define probability distributions for all input parameters
2. Run 10,000+ iterations with random sampling
3. Calculate output distribution statistics
4. Report 95% confidence interval
```

#### C.3 IPCC Tier 1 Uncertainty Defaults

| Parameter Type | Default Uncertainty |
|----------------|---------------------|
| Measured carbon stocks | ±10% |
| Modeled carbon stocks | ±30% |
| IPCC default emission factors | ±50% |
| Country-specific EFs | ±25% |
| Activity data (measured) | ±5% |
| Activity data (estimated) | ±25% |
| Remote sensing area | ±5% |

### Appendix D: Methodology-Specific Formulas Quick Reference

#### D.1 ARR Net Credits
```
Net = [(CS_P(t) - CS_P(t-1)) × Area - Leakage] × (1 - Uncertainty) × (1 - Buffer)
```

#### D.2 IFM Net Credits
```
Net = [(CS_P(t) - CS_BL(t)) × Area - Leakage] × (1 - Uncertainty) × (1 - Buffer)
```

#### D.3 REDD+ Net Credits
```
Net = [(E_BL - E_P) - Leakage] × (1 - Uncertainty) × (1 - Buffer)
```

#### D.4 Wetlands Net Credits
```
Net = [(E_BL_total - E_P_total) - Leakage] × (1 - Uncertainty) × (1 - Buffer)
```

#### D.5 Soil Carbon Net Credits
```
Net = [(SOC_P - SOC_BL) × Area × 44/12 - Leakage] × (1 - Uncertainty) × (1 - Buffer)
```

#### D.6 Livestock Methane Net Credits
```
Net = [(CH4_BL - CH4_P) × GWP_CH4/1000] × (1 - Uncertainty) × (1 - Buffer)
```

#### D.7 Rice Cultivation Net Credits
```
Net = [(CH4_BL - CH4_P) × Area × Adoption × Compliance] × (1 - Uncertainty) × (1 - Buffer)
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | Carbon Credit Calculation Engine Team | Initial release |

---

**END OF DOCUMENT**
