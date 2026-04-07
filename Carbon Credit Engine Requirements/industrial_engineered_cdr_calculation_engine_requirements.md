# Industrial and Engineered Carbon Removal Calculation Engine
## Technical Requirements Specification

**Document Version:** 1.0  
**Date:** January 2025  
**Classification:** Technical Specification  
**Scope:** Industrial Gas Destruction, CCS/CCUS, Biochar, Mineralization, DAC, BiCRS, and Private CDR Protocols

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Input Parameters](#2-input-parameters)
   - 2.1 Industrial Gas Destruction (N2O, HFCs)
   - 2.2 CCS/CCUS
   - 2.3 Biochar
   - 2.4 Mineralization
   - 2.5 Direct Air Capture (DAC)
   - 2.6 BiCRS / Biomass Storage
   - 2.7 Private CDR Protocols
3. [Calculation Algorithms](#3-calculation-algorithms)
4. [Validation Rules](#4-validation-rules)
5. [Output Specifications](#5-output-specifications)
6. [MRV and Verification Integration](#6-mrv-and-verification-integration)
7. [Technical Architecture](#7-technical-architecture)
8. [Appendices](#8-appendices)

---

## 1. Executive Summary

This document defines the technical requirements for a comprehensive calculation engine supporting Industrial and Engineered Carbon Removal methodologies. The engine must support seven primary methodology categories with varying levels of maturity, from mature industrial gas destruction to emerging premium DAC technologies.

### Key Design Principles

| Principle | Description |
|-----------|-------------|
| **Conservatism** | All calculations apply conservative uncertainty discounts |
| **Transparency** | Full audit trail for all inputs, calculations, and outputs |
| **Verification-Ready** | All outputs formatted for third-party verification |
| **Modularity** | Methodology-specific modules with common LCA framework |
| **Scalability** | Support for high-volume credit calculations |
| **Permanence-First** | Durability and permanence requirements built into all removal calculations |

---

## 2. Input Parameters

### 2.1 Industrial Gas Destruction (N2O, HFCs, Process Gases)

#### 2.1.1 Core Destruction Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `gas_type` | Type of gas destroyed | Enum | - | Declared | Yes | Must be in approved gas list (N2O, HFC-23, HFC-134a, etc.) |
| `gwp_value` | Global Warming Potential | Decimal | tCO2e/t gas | IPCC AR5/AR6 | Yes | Must match IPCC value for gas_type and selected AR |
| `gas_quantity_destroyed` | Mass of gas destroyed | Decimal | tonnes | Direct measurement | Yes | > 0, ≤ facility capacity |
| `destruction_efficiency` | Destruction/removal efficiency | Decimal | % | Engineering estimate | Yes | 90-99.99%, protocol-specific minimums |
| `destruction_period_start` | Start of destruction period | Date | ISO 8601 | Declared | Yes | Must be ≤ period_end |
| `destruction_period_end` | End of destruction period | Date | ISO 8601 | Declared | Yes | Must be ≥ period_start |
| `facility_id` | Unique facility identifier | String | - | Registry assigned | Yes | Valid registry facility ID |

#### 2.1.2 Baseline Emission Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `baseline_emission_factor` | Baseline emission factor | Decimal | tCO2e/t gas | Calculated/Modeled | Yes | Per protocol methodology |
| `baseline_scenario` | Description of baseline | String | - | Declared | Yes | Must meet additionality requirements |
| `historic_emission_rate` | Historical emission rate | Decimal | t gas/year | Historical data | Conditional | Required for new facilities |
| `capacity_utilization` | Plant capacity utilization | Decimal | % | Operational data | Yes | 0-100% |

#### 2.1.3 Project Emission Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `energy_consumption` | Energy used in destruction | Decimal | MWh | Direct metering | Yes | ≥ 0 |
| `energy_emission_factor` | Grid/fuel emission factor | Decimal | tCO2e/MWh | Verified source | Yes | Must be from approved source |
| `fuel_consumption` | Auxiliary fuel consumption | Decimal | GJ or L | Direct metering | Conditional | Required if applicable |
| `fuel_emission_factor` | Fuel-specific emission factor | Decimal | tCO2e/GJ | IPCC/EPA | Conditional | Required if fuel_consumption > 0 |
| `process_emissions` | Non-energy process emissions | Decimal | tCO2e | Calculated | Conditional | Required per protocol |
| `ancillary_chemicals` | Chemical inputs for process | Array | kg | Inventory records | Conditional | Required if significant |

#### 2.1.4 Policy Constraint Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `regulatory_requirement` | Mandatory destruction requirement | Boolean | - | Legal review | Yes | - |
| `regulatory_destruction_rate` | Required destruction rate | Decimal | % | Regulation | Conditional | Required if regulatory_requirement = true |
| `policy_discount_factor` | Discount for policy constraints | Decimal | % | Protocol defined | Yes | Per registry rules |
| `corsia_eligible` | CORSIA eligibility status | Boolean | - | Registry verified | No | - |

---

### 2.2 CCS / CCUS (Carbon Capture and Storage)

#### 2.2.1 Capture Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `capture_source_type` | Type of capture source | Enum | - | Declared | Yes | Power plant, industrial, DAC, BECCS |
| `co2_captured_volume` | Volume of CO2 captured | Decimal | tCO2 | Direct measurement | Yes | > 0 |
| `co2_concentration_source` | CO2 concentration in source gas | Decimal | % vol | Continuous monitoring | Yes | 1-100% |
| `capture_efficiency` | CO2 capture efficiency | Decimal | % | Engineering calc | Yes | 50-99% |
| `capture_period_start` | Capture period start | Date | ISO 8601 | Declared | Yes | - |
| `capture_period_end` | Capture period end | Date | ISO 8601 | Declared | Yes | ≥ start |
| `metering_system_id` | Flow meter identifier | String | - | Calibration cert | Yes | Valid calibrated meter |
| `measurement_standard` | Measurement standard applied | Enum | - | Declared | Yes | ISO 5167, AGA, etc. |

#### 2.2.2 Transport Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `transport_mode` | Transport method | Enum | - | Declared | Yes | Pipeline, truck, rail, ship |
| `transport_distance` | One-way transport distance | Decimal | km | Verified route | Yes | > 0 |
| `transport_fuel_type` | Transport fuel | Enum | - | Declared | Conditional | Required for non-pipeline |
| `transport_fuel_consumption` | Fuel used for transport | Decimal | L or kg | Direct/allocated | Conditional | Required for non-pipeline |
| `transport_emission_factor` | Transport fuel EF | Decimal | tCO2e/L | Approved source | Conditional | Required if fuel data provided |
| `pipeline_compression_energy` | Compression energy | Decimal | MWh | Direct metering | Conditional | Required for pipeline |
| `pipeline_leakage_rate` | Estimated pipeline leakage | Decimal | % | Engineering estimate | Yes | 0-5%, default if not measured |

#### 2.2.3 Storage Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `storage_type` | Storage methodology | Enum | - | Declared | Yes | Depleted oil/gas, saline, mineral |
| `storage_site_id` | Storage facility identifier | String | - | Registry assigned | Yes | Valid storage site |
| `co2_injected_volume` | CO2 volume injected | Decimal | tCO2 | Direct measurement | Yes | ≤ captured_volume |
| `injection_depth` | Injection depth | Decimal | m | Well logs | Yes | > 800m for most protocols |
| `reservoir_pressure` | Reservoir pressure | Decimal | bar | Monitoring | Yes | Continuous monitoring required |
| `reservoir_temperature` | Reservoir temperature | Decimal | °C | Monitoring | Yes | Continuous monitoring required |
| `storage_permanence_period` | Guaranteed storage duration | Integer | years | Contract/Regulation | Yes | ≥ 100 years for removals |
| `mmv_plan_id` | Monitoring plan identifier | String | - | Approved plan | Yes | Valid MMV plan |
| `plume_migration_model` | Migration model used | String | - | Technical doc | Conditional | Required for some reservoirs |

#### 2.2.4 Process Emission Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `capture_energy_consumption` | Energy for capture process | Decimal | MWh | Direct metering | Yes | ≥ 0 |
| `compression_energy` | CO2 compression energy | Decimal | MWh | Direct metering | Yes | ≥ 0 |
| `purification_energy` | CO2 purification energy | Decimal | MWh | Direct metering | Conditional | Required if purification |
| `cooling_energy` | Cooling system energy | Decimal | MWh | Direct metering | Conditional | Required if significant |
| `solvent_makeup` | Solvent/chemical makeup | Array | kg | Inventory | Conditional | Required for chemical capture |
| `solvent_emission_factor` | Solvent lifecycle EF | Decimal | tCO2e/kg | LCA database | Conditional | Required if solvent_makeup > 0 |

---

### 2.3 Biochar

#### 2.3.1 Feedstock Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `feedstock_type` | Biomass feedstock type | Enum | - | Declared | Yes | Wood, agricultural residue, etc. |
| `feedstock_source` | Origin of feedstock | String | - | Chain of custody | Yes | Geographic coordinates or address |
| `feedstock_moisture_content` | Moisture in feedstock | Decimal | % wet basis | Laboratory analysis | Yes | 0-100% |
| `feedstock_carbon_content` | Carbon content of feedstock | Decimal | % dry basis | Laboratory analysis | Yes | 30-60% typical |
| `feedstock_quantity` | Mass of feedstock processed | Decimal | tonnes | Weighbridge records | Yes | > 0 |
| `feedstock_collection_emissions` | Emissions from collection | Decimal | tCO2e | Calculated | Yes | Per protocol methodology |
| `sustainability_certification` | Feedstock sustainability cert | String | - | Certificate | No | FSC, PEFC, etc. |
| `counterfactual_fate` | What would happen to biomass | Enum | - | Declared | Yes | Decay, burned, other use |
| `counterfactual_emissions` | Emissions from counterfactual | Decimal | tCO2e | Calculated | Yes | Per protocol |

#### 2.3.2 Pyrolysis Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `pyrolysis_technology` | Pyrolysis system type | Enum | - | Declared | Yes | Slow, fast, flash, gasification |
| `pyrolysis_temperature` | Operating temperature | Decimal | °C | Continuous monitoring | Yes | 300-1000°C |
| `pyrolysis_duration` | Residence time | Decimal | hours | Operational data | Yes | 0.5-72 hours |
| `heating_rate` | Heating rate | Decimal | °C/min | Operational data | Conditional | Required for some protocols |
| `reactor_capacity` | Rated reactor capacity | Decimal | tonnes/day | Design spec | Yes | > 0 |
| `biochar_yield_rate` | Mass yield of biochar | Decimal | % of feedstock | Measurement | Yes | 10-40% typical |
| `energy_recovery_rate` | Energy recovered from process | Decimal | MJ/tonne feedstock | Measurement | Yes | ≥ 0 |
| `pyrolysis_date` | Date of production | Date | ISO 8601 | Production record | Yes | - |
| `batch_id` | Production batch identifier | String | - | Internal tracking | Yes | Unique per batch |

#### 2.3.3 Biochar Properties Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `biochar_carbon_content` | Carbon content of biochar | Decimal | % | Laboratory analysis | Yes | 30-90% |
| `biochar_h_c_ratio` | Hydrogen to Carbon ratio | Decimal | - | Laboratory analysis | Yes | < 0.7 for stability |
| `biochar_o_c_ratio` | Oxygen to Carbon ratio | Decimal | - | Laboratory analysis | Yes | < 0.4 for stability |
| `biochar_surface_area` | Specific surface area | Decimal | m²/g | Laboratory analysis | Conditional | Required for some protocols |
| `biochar_ph` | pH of biochar | Decimal | - | Laboratory analysis | Conditional | Required for soil application |
| `biochar_heavy_metals` | Heavy metal content | Object | mg/kg | Laboratory analysis | Yes | Must meet regulatory limits |
| `biochar_durability_class` | Oxidative stability class | Enum | - | Laboratory/H:C ratio | Yes | Class 1-5 per protocol |
| `biochar_quantity_produced` | Mass of biochar produced | Decimal | tonnes | Weighbridge | Yes | > 0 |

#### 2.3.4 Application/Use Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `biochar_application_method` | How biochar is used | Enum | - | Declared | Yes | Soil, construction, other durable |
| `application_location` | Geographic location of use | GeoJSON | coordinates | GPS verified | Yes | Valid coordinates |
| `application_date` | Date of application | Date | ISO 8601 | Documentation | Yes | ≥ production_date |
| `application_depth` | Depth of soil incorporation | Decimal | cm | Field records | Conditional | Required for soil application |
| `transport_distance_to_use` | Distance to application site | Decimal | km | Verified route | Yes | ≥ 0 |
| `transport_mode_to_use` | Transport method | Enum | - | Declared | Yes | Truck, rail, etc. |
| `durability_period` | Expected carbon storage duration | Integer | years | Protocol/model | Yes | ≥ 100 for full credits |
| `durability_model` | Model used for durability | String | - | Cited reference | Yes | Peer-reviewed or protocol-approved |

---

### 2.4 Mineralization

#### 2.4.1 Feedstock/Mineral Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `mineral_type` | Type of mineral feedstock | Enum | - | Declared | Yes | Olivine, basalt, wollastonite, etc. |
| `mineral_source` | Origin of minerals | String | - | Chain of custody | Yes | Mine/quarry location |
| `mineral_cao_content` | Calcium oxide content | Decimal | % | XRF analysis | Conditional | Required for Ca-rich minerals |
| `mineral_mgo_content` | Magnesium oxide content | Decimal | % | XRF analysis | Conditional | Required for Mg-rich minerals |
| `mineral_sio2_content` | Silicon dioxide content | Decimal | % | XRF analysis | Yes | - |
| `mineral_surface_area` | Specific surface area | Decimal | m²/g | BET analysis | Yes | > 0.1 m²/g typical |
| `mineral_particle_size_d50` | Median particle size | Decimal | μm | Particle analysis | Yes | 1-1000 μm |
| `mineral_quantity_processed` | Mass of mineral processed | Decimal | tonnes | Weighbridge | Yes | > 0 |
| `mineral_mining_emissions` | Emissions from mining | Decimal | tCO2e | LCA/allocated | Yes | Per protocol |

#### 2.4.2 Process Parameters (Ex-situ Mineralization)

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `process_type` | Mineralization process type | Enum | - | Declared | Yes | Aqueous, gas-solid, electrochemical |
| `reaction_temperature` | Process temperature | Decimal | °C | Continuous monitoring | Yes | 20-300°C |
| `reaction_pressure` | Process pressure | Decimal | bar | Continuous monitoring | Conditional | Required for pressurized |
| `co2_source` | Source of CO2 for reaction | Enum | - | Declared | Yes | Flue gas, pure CO2, air |
| `co2_purity` | Purity of CO2 feed | Decimal | % | Analysis | Yes | 0.04-100% |
| `reaction_time` | Duration of reaction | Decimal | hours | Operational data | Yes | > 0 |
| `conversion_efficiency` | Mineral to carbonate conversion | Decimal | % | Analysis | Yes | 0-100% |
| `energy_consumption_process` | Energy for mineralization | Decimal | MWh | Direct metering | Yes | ≥ 0 |
| `water_consumption` | Water used in process | Decimal | m³ | Metering | Yes | ≥ 0 |
| `water_source` | Source of process water | Enum | - | Declared | Yes | Fresh, recycled, seawater |

#### 2.4.3 Enhanced Rock Weathering (ERW) Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `erw_application_rate` | Application rate to soil | Decimal | tonnes/hectare | Field records | Yes | 1-100 t/ha typical |
| `application_area` | Area of land treated | Decimal | hectares | GIS/mapping | Yes | > 0 |
| `soil_type` | Type of receiving soil | Enum | - | Soil survey | Yes | USDA or WRB classification |
| `soil_ph` | pH of receiving soil | Decimal | - | Field measurement | Yes | 4-9 typical |
| `climate_zone` | Köppen climate classification | String | - | Declared | Yes | Valid Köppen code |
| `annual_rainfall` | Mean annual precipitation | Decimal | mm/year | Climate data | Yes | > 0 |
| `mean_annual_temperature` | Mean annual temperature | Decimal | °C | Climate data | Yes | - |
| `weathering_model` | Model for weathering rate | String | - | Cited reference | Yes | Peer-reviewed model |
| `weathering_rate_coefficient` | Site-specific weathering rate | Decimal | %/year | Model output | Yes | > 0 |
| `measurement_method` | How weathering is measured | Enum | - | Declared | Yes | River chemistry, soil, modeling |

#### 2.4.4 Concrete Carbonation Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `concrete_mix_design` | Concrete composition | Object | kg/m³ | Mix records | Yes | Per component |
| `cement_type` | Type of cement used | Enum | - | Declared | Yes | OPC, blended, etc. |
| `cement_content` | Mass of cement per m³ | Decimal | kg/m³ | Mix records | Yes | 100-500 kg/m³ |
| `co2_curing_applied` | CO2 used in curing | Boolean | - | Declared | Yes | - |
| `co2_curing_quantity` | Mass of CO2 for curing | Decimal | kg CO2/m³ | Metering | Conditional | Required if CO2 curing |
| `concrete_volume_produced` | Volume of concrete | Decimal | m³ | Production records | Yes | > 0 |
| `carbonation_depth_measured` | Measured carbonation depth | Decimal | mm | Testing | Conditional | Required for some protocols |
| `concrete_exposure_conditions` | Environmental exposure | Enum | - | Declared | Yes | Indoor, outdoor, submerged |
| `concrete_service_life` | Expected service life | Integer | years | Design spec | Yes | ≥ 50 years typical |
| `end_of_life_treatment` | Disposal/recycling method | Enum | - | Declared | Yes | Landfill, recycling, reuse |

---

### 2.5 Direct Air Capture (DAC)

#### 2.5.1 Capture System Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `dac_technology_type` | DAC technology used | Enum | - | Declared | Yes | Solid sorbent, liquid solvent, other |
| `sorbent_type` | Type of sorbent material | String | - | Declared | Conditional | Required for solid sorbent |
| `sorbent_lifetime` | Expected sorbent lifetime | Integer | cycles | Testing/estimate | Conditional | Required for solid sorbent |
| `plant_capacity_rated` | Design capture capacity | Decimal | tCO2/year | Design spec | Yes | > 0 |
| `plant_capacity_actual` | Actual capture rate | Decimal | tCO2/year | Operational data | Yes | ≤ rated capacity |
| `capture_period_hours` | Hours of operation | Integer | hours | Operational log | Yes | 0-8760 hours/year |
| `availability_factor` | Plant availability | Decimal | % | Calculated | Yes | 0-100% |
| `capture_efficiency` | CO2 capture efficiency | Decimal | % | Testing | Yes | 50-99% |
| `co2_purity_output` | Purity of captured CO2 | Decimal | % | Analysis | Yes | > 95% for storage |

#### 2.5.2 Energy Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `total_energy_consumption` | Total energy for capture | Decimal | MWh | Direct metering | Yes | ≥ 0 |
| `thermal_energy_consumption` | Heat energy required | Decimal | MWh | Direct metering | Yes | ≥ 0 |
| `electrical_energy_consumption` | Electricity required | Decimal | MWh | Direct metering | Yes | ≥ 0 |
| `energy_source_thermal` | Source of thermal energy | Enum | - | Declared | Yes | Renewable, waste heat, grid, fossil |
| `energy_source_electric` | Source of electricity | Enum | - | Declared | Yes | Renewable, grid, on-site |
| `thermal_energy_emission_factor` | EF for thermal energy | Decimal | tCO2e/MWh | Verified source | Yes | 0 for renewable |
| `electricity_emission_factor` | EF for electricity | Decimal | tCO2e/MWh | Verified source | Yes | Grid average or specific |
| `energy_consumption_per_tonne` | Specific energy consumption | Decimal | GJ/tCO2 | Calculated | Yes | 5-15 GJ/tCO2 typical |
| `waste_heat_recovery` | Heat recovered from process | Decimal | MWh | Measurement | No | ≥ 0 |

#### 2.5.3 Storage Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `storage_partner_id` | Storage facility partner | String | - | Contract | Yes | Valid partner ID |
| `co2_delivered_to_storage` | CO2 delivered for storage | Decimal | tCO2 | Transfer documentation | Yes | ≤ captured |
| `storage_method` | Method of durable storage | Enum | - | Declared | Yes | Geologic, mineralization |
| `storage_verification_standard` | Storage verification standard | Enum | - | Declared | Yes | ISO, EPA, other approved |
| `durability_guarantee_period` | Guaranteed storage duration | Integer | years | Contract | Yes | ≥ 1000 years for premium |
| `mmv_protocol` | Monitoring protocol | String | - | Approved plan | Yes | Valid MMV plan |
| `reversal_insurance` | Insurance for reversals | Boolean | - | Contract | Yes | Required by most protocols |

#### 2.5.4 Lifecycle Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `sorbent_production_emissions` | Emissions from sorbent production | Decimal | tCO2e | LCA | Conditional | Required for solid sorbent |
| `sorbent_disposal_emissions` | Emissions from sorbent disposal | Decimal | tCO2e | LCA | Conditional | Required for solid sorbent |
| `construction_emissions` | Embodied emissions in plant | Decimal | tCO2e | LCA | Yes | Amortized over plant life |
| `equipment_lifetime` | Expected plant lifetime | Integer | years | Design spec | Yes | ≥ 20 years |
| `maintenance_emissions` | Emissions from maintenance | Decimal | tCO2e/year | Estimate | Yes | ≥ 0 |

---

### 2.6 BiCRS / Biomass Storage

#### 2.6.1 Biomass Feedstock Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `biomass_type` | Type of biomass | Enum | - | Declared | Yes | Wood, agricultural, algae, etc. |
| `biomass_moisture_content` | Moisture content | Decimal | % | Laboratory | Yes | 0-100% |
| `biomass_carbon_content` | Carbon content (dry basis) | Decimal | % | Laboratory | Yes | 30-60% typical |
| `biomass_energy_content` | Energy content (dry basis) | Decimal | MJ/kg | Laboratory | Yes | 15-25 MJ/kg typical |
| `biomass_quantity` | Mass of biomass processed | Decimal | tonnes | Weighbridge | Yes | > 0 |
| `biomass_sustainability_cert` | Sustainability certification | String | - | Certificate | No | FSC, SFI, etc. |
| `biomass_origin` | Geographic origin | String | - | Chain of custody | Yes | Location coordinates |
| `collection_emissions` | Emissions from collection | Decimal | tCO2e | Calculated | Yes | Per protocol |

#### 2.6.2 Processing Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `processing_type` | Type of processing | Enum | - | Declared | Yes | Pelletization, torrefaction, other |
| `drying_energy_consumption` | Energy for drying | Decimal | MWh | Direct metering | Conditional | Required if drying |
| `processing_energy_consumption` | Energy for processing | Decimal | MWh | Direct metering | Yes | ≥ 0 |
| `processing_emissions` | Direct process emissions | Decimal | tCO2e | Calculated | Yes | ≥ 0 |
| `processing_yield` | Product yield from biomass | Decimal | % | Measurement | Yes | 50-100% |
| `processing_date` | Date of processing | Date | ISO 8601 | Production record | Yes | - |

#### 2.6.3 Storage Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `storage_method` | Method of storage | Enum | - | Declared | Yes | Geologic injection, ocean, land |
| `storage_location` | Storage facility location | GeoJSON | coordinates | GPS verified | Yes | Valid coordinates |
| `biomass_carbon_injected` | Carbon mass injected/stored | Decimal | tC | Measurement | Yes | > 0 |
| `injection_depth` | Depth of injection | Decimal | m | Well logs | Conditional | Required for geologic |
| `storage_form` | Physical form in storage | Enum | - | Declared | Yes | Slurry, pellets, bio-oil |
| `storage_permanence_estimate` | Expected permanence | Integer | years | Model/contract | Yes | ≥ 1000 years for premium |
| `leakage_risk_assessment` | Risk of carbon leakage | Enum | - | Assessment | Yes | Low, medium, high |
| `monitoring_frequency` | Storage monitoring frequency | Enum | - | Declared | Yes | Continuous, periodic |

#### 2.6.4 Transport Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `transport_distance_collection` | Distance to processing | Decimal | km | Verified route | Yes | ≥ 0 |
| `transport_distance_to_storage` | Distance to storage site | Decimal | km | Verified route | Yes | ≥ 0 |
| `transport_mode` | Transport method | Enum | - | Declared | Yes | Truck, rail, ship, pipeline |
| `transport_fuel_consumption` | Fuel used for transport | Decimal | L or kg | Records | Yes | ≥ 0 |
| `transport_emission_factor` | Transport fuel EF | Decimal | tCO2e/L | Approved source | Yes | Valid EF |

---

### 2.7 Private CDR Protocols

#### 2.7.1 Protocol-Specific Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `protocol_name` | Name of private protocol | Enum | - | Declared | Yes | Puro.earth, Isometric, etc. |
| `protocol_version` | Version of protocol | String | - | Declared | Yes | Valid version number |
| `methodology_code` | Specific methodology code | String | - | Declared | Yes | Valid methodology |
| `project_type` | Type of CDR project | Enum | - | Declared | Yes | Bio-oil, ERW, materials, etc. |
| `registry_account_id` | Registry account identifier | String | - | Registry assigned | Yes | Valid account |

#### 2.7.2 Bio-oil Sequestration Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `biooil_feedstock` | Biomass source for bio-oil | Enum | - | Declared | Yes | Wood chips, agricultural, etc. |
| `pyrolysis_temperature_biooil` | Pyrolysis temperature | Decimal | °C | Monitoring | Yes | 400-600°C |
| `biooil_yield` | Yield of bio-oil | Decimal | % of feedstock | Measurement | Yes | 50-75% |
| `biooil_carbon_content` | Carbon content of bio-oil | Decimal | % | Laboratory | Yes | 50-70% |
| `biooil_stability_class` | Stability classification | Enum | - | Laboratory | Yes | Per protocol |
| `injection_well_id` | Well used for injection | String | - | Regulatory permit | Yes | Valid well ID |
| `injection_formation` | Geologic formation name | String | - | Geologic data | Yes | Valid formation |
| `biooil_volume_injected` | Volume injected | Decimal | m³ | Metering | Yes | > 0 |
| `biooil_density` | Density of bio-oil | Decimal | kg/m³ | Laboratory | Yes | 1000-1300 kg/m³ |

#### 2.7.3 Carbonated Materials Parameters

| Parameter | Description | Data Type | Units | Measurement | Required | Validation |
|-----------|-------------|-----------|-------|-------------|----------|------------|
| `material_type` | Type of carbonated material | Enum | - | Declared | Yes | Concrete, aggregate, other |
| `co2_source_materials` | Source of CO2 for carbonation | Enum | - | Declared | Yes | Industrial, DAC, other |
| `carbonation_method` | Method of carbonation | Enum | - | Declared | Yes | Curing, exposure, accelerated |
| `co2_uptake_measured` | Measured CO2 uptake | Decimal | kg CO2/kg material | Testing | Yes | > 0 |
| `material_production_volume` | Volume of material produced | Decimal | tonnes | Production records | Yes | > 0 |
| `material_service_life` | Expected service life | Integer | years | Design spec | Yes | ≥ 50 years |
| `end_of_life_recycling` | Recycling potential | Decimal | % | Estimate | Yes | 0-100% |

---

## 3. Calculation Algorithms

### 3.1 Core Calculation Framework

All methodologies follow a standardized calculation framework:

```
NET_CREDITS = GROSS_REMOVAL_REDUCTION - LIFECYCLE_EMISSIONS - UNCERTAINTY_DISCOUNT - PERMANENCE_ADJUSTMENT
```

### 3.2 Industrial Gas Destruction Algorithm

#### Step 1: Calculate Baseline Emissions
```
BASELINE_EMISSIONS = gas_quantity_destroyed × destruction_efficiency × gwp_value × baseline_emission_factor
```

#### Step 2: Calculate Project Emissions
```
ENERGY_EMISSIONS = energy_consumption × energy_emission_factor
FUEL_EMISSIONS = fuel_consumption × fuel_emission_factor
PROCESS_EMISSIONS = process_emissions + Σ(ancillary_chemicals × chemical_ef)
PROJECT_EMISSIONS = ENERGY_EMISSIONS + FUEL_EMISSIONS + PROCESS_EMISSIONS
```

#### Step 3: Apply Policy Constraints
```
IF regulatory_requirement = TRUE THEN
    POLICY_ADJUSTMENT = gas_quantity_destroyed × regulatory_destruction_rate × gwp_value
ELSE
    POLICY_ADJUSTMENT = 0
END IF
```

#### Step 4: Calculate Net Emission Reduction
```
GROSS_REDUCTION = BASELINE_EMISSIONS
NET_REDUCTION = GROSS_REDUCTION - PROJECT_EMISSIONS - POLICY_ADJUSTMENT
```

#### Step 5: Apply Uncertainty Discount
```
UNCERTAINTY_DISCOUNT = NET_REDUCTION × uncertainty_rate
VERIFIED_REDUCTION = NET_REDUCTION - UNCERTAINTY_DISCOUNT
```

#### Step 6: Calculate Credit Quantity
```
CREDITS_ISSUED = VERIFIED_REDUCTION × corsia_eligibility_factor
```

### 3.3 CCS/CCUS Algorithm

#### Step 1: Calculate Gross CO2 Captured
```
GROSS_CAPTURED = co2_captured_volume × capture_efficiency
```

#### Step 2: Calculate Transport Emissions
```
IF transport_mode = 'pipeline' THEN
    TRANSPORT_EMISSIONS = pipeline_compression_energy × electricity_ef + 
                          (co2_captured_volume × pipeline_leakage_rate × gwp_co2)
ELSE
    TRANSPORT_EMISSIONS = transport_fuel_consumption × transport_emission_factor
END IF
```

#### Step 3: Calculate Storage Verification
```
CO2_STORED = co2_injected_volume × (1 - storage_leakage_estimate)
```

#### Step 4: Calculate Process Emissions
```
CAPTURE_ENERGY_EMISSIONS = capture_energy_consumption × energy_emission_factor
COMPRESSION_EMISSIONS = compression_energy × energy_emission_factor
PURIFICATION_EMISSIONS = purification_energy × energy_emission_factor
SOLVENT_EMISSIONS = Σ(solvent_makeup × solvent_lifecycle_ef)

PROCESS_EMISSIONS = CAPTURE_ENERGY_EMISSIONS + COMPRESSION_EMISSIONS + 
                    PURIFICATION_EMISSIONS + SOLVENT_EMISSIONS
```

#### Step 5: Calculate Net Storage
```
NET_STORAGE = CO2_STORED - TRANSPORT_EMISSIONS - PROCESS_EMISSIONS
```

#### Step 6: Determine Credit Type and Apply Permanence
```
IF capture_source_type IN ['DAC', 'BECCS'] THEN
    CREDIT_TYPE = 'REMOVAL'
    PERMANENCE_ADJUSTMENT = 0  // Full credits if ≥ 100 year permanence
ELSE
    CREDIT_TYPE = 'REDUCTION'
    PERMANENCE_ADJUSTMENT = 0
END IF
```

#### Step 7: Final Credit Calculation
```
UNCERTAINTY_DISCOUNT = NET_STORAGE × uncertainty_rate
FINAL_CREDITS = NET_STORAGE - UNCERTAINTY_DISCOUNT
```

### 3.4 Biochar Algorithm

#### Step 1: Calculate Carbon in Feedstock
```
FEEDSTOCK_DRY_MASS = feedstock_quantity × (1 - feedstock_moisture_content/100)
CARBON_IN_FEEDSTOCK = FEEDSTOCK_DRY_MASS × feedstock_carbon_content/100
```

#### Step 2: Calculate Carbon in Biochar
```
BIOCHAR_DRY_MASS = biochar_quantity_produced × (1 - biochar_moisture_content/100)
CARBON_IN_BIOCHAR = BIOCHAR_DRY_MASS × biochar_carbon_content/100
```

#### Step 3: Calculate Pyrolysis Emissions
```
FEEDSTOCK_COLLECTION_EMISSIONS = feedstock_collection_emissions
PYROLYSIS_ENERGY_EMISSIONS = pyrolysis_energy_consumption × energy_emission_factor
TRANSPORT_TO_USE_EMISSIONS = transport_distance_to_use × transport_emission_factor × biochar_quantity_produced

PYROLYSIS_EMISSIONS = FEEDSTOCK_COLLECTION_EMISSIONS + PYROLYSIS_ENERGY_EMISSIONS + TRANSPORT_TO_USE_EMISSIONS
```

#### Step 4: Calculate Counterfactual Emissions
```
COUNTERFACTUAL_EMISSIONS = counterfactual_emissions  // From protocol methodology
```

#### Step 5: Calculate Biochar Stability Factor
```
IF biochar_h_c_ratio < 0.4 THEN
    STABILITY_FACTOR = 1.0  // Highly stable
ELSE IF biochar_h_c_ratio < 0.7 THEN
    STABILITY_FACTOR = 0.8  // Moderately stable
ELSE
    STABILITY_FACTOR = 0.5  // Less stable
END IF
```

#### Step 6: Calculate Durable Carbon Storage
```
DURABLE_CARBON = CARBON_IN_BIOCHAR × STABILITY_FACTOR
```

#### Step 7: Calculate Net Carbon Removal
```
GROSS_REMOVAL = DURABLE_CARBON + COUNTERFACTUAL_EMISSIONS
NET_REMOVAL = GROSS_REMOVAL - PYROLYSIS_EMISSIONS
```

#### Step 8: Convert to CO2e and Apply Durability
```
REMOVAL_CO2E = NET_REMOVAL × (44/12)  // Convert C to CO2

IF durability_period >= 100 THEN
    DURABILITY_ADJUSTMENT = 0
ELSE IF durability_period >= 50 THEN
    DURABILITY_ADJUSTMENT = REMOVAL_CO2E × 0.2
ELSE
    DURABILITY_ADJUSTMENT = REMOVAL_CO2E × 0.5
END IF

FINAL_REMOVAL = REMOVAL_CO2E - DURABILITY_ADJUSTMENT
```

### 3.5 Mineralization Algorithm

#### Step 1: Calculate Theoretical Carbonation Potential
```
FOR Ca-rich minerals:
    THEORETICAL_CO2 = mineral_quantity_processed × mineral_cao_content/100 × (44/56)
    
FOR Mg-rich minerals:
    THEORETICAL_CO2 = mineral_quantity_processed × mineral_mgo_content/100 × (44/40)
```

#### Step 2: Apply Conversion Efficiency
```
ACTUAL_MINERALIZATION = THEORETICAL_CO2 × conversion_efficiency/100
```

#### Step 3: Calculate Process Emissions
```
MINING_EMISSIONS = mineral_mining_emissions
PROCESS_ENERGY_EMISSIONS = energy_consumption_process × energy_emission_factor
TRANSPORT_EMISSIONS = transport_distance × transport_emission_factor × mineral_quantity_processed
WATER_TREATMENT_EMISSIONS = water_consumption × water_treatment_ef

PROCESS_EMISSIONS = MINING_EMISSIONS + PROCESS_ENERGY_EMISSIONS + TRANSPORT_EMISSIONS + WATER_TREATMENT_EMISSIONS
```

#### Step 4: Calculate Net Mineralization
```
NET_MINERALIZATION = ACTUAL_MINERALIZATION - PROCESS_EMISSIONS
```

#### Step 5: Enhanced Rock Weathering Specific Calculation
```
IF methodology = 'ERW' THEN
    // Calculate weathering over time
    ANNUAL_WEATHERING_RATE = weathering_rate_coefficient
    
    // Model cumulative weathering over project period
    CUMULATIVE_WEATHERING = 0
    FOR year = 1 TO project_duration
        YEAR_WEATHERING = ACTUAL_MINERALIZATION × ANNUAL_WEATHERING_RATE × (1 - cumulative_weathered_fraction)
        CUMULATIVE_WEATHERING = CUMULATIVE_WEATHERING + YEAR_WEATHERING
    END FOR
    
    NET_ERW_REMOVAL = CUMULATIVE_WEATHERING - PROCESS_EMISSIONS
END IF
```

#### Step 6: Apply Durability and Uncertainty
```
DURABILITY_FACTOR = MIN(1.0, durability_period / 100)
UNCERTAINTY_DISCOUNT = NET_MINERALIZATION × uncertainty_rate

FINAL_MINERALIZATION = (NET_MINERALIZATION × DURABILITY_FACTOR) - UNCERTAINTY_DISCOUNT
```

### 3.6 DAC Algorithm

#### Step 1: Calculate Gross Atmospheric CO2 Captured
```
GROSS_CAPTURE = co2_captured_volume × capture_efficiency
```

#### Step 2: Calculate Energy Emissions
```
THERMAL_EMISSIONS = thermal_energy_consumption × thermal_energy_emission_factor
ELECTRIC_EMISSIONS = electrical_energy_consumption × electricity_emission_factor

ENERGY_EMISSIONS = THERMAL_EMISSIONS + ELECTRIC_EMISSIONS
```

#### Step 3: Calculate Transport and Storage Emissions
```
TRANSPORT_STORAGE_EMISSIONS = transport_emissions + storage_emissions  // Per CCS algorithm
```

#### Step 4: Calculate Lifecycle Emissions
```
SORBENT_EMISSIONS = (sorbent_production_emissions + sorbent_disposal_emissions) / sorbent_lifetime
CONSTRUCTION_EMISSIONS_AMORTIZED = construction_emissions / equipment_lifetime

LIFECYCLE_EMISSIONS = ENERGY_EMISSIONS + SORBENT_EMISSIONS + CONSTRUCTION_EMISSIONS_AMORTIZED + 
                      maintenance_emissions + TRANSPORT_STORAGE_EMISSIONS
```

#### Step 5: Calculate Net Removal
```
NET_REMOVAL = GROSS_CAPTURE - LIFECYCLE_EMISSIONS
```

#### Step 6: Apply Durability Requirements
```
IF durability_guarantee_period >= 1000 THEN
    DURABILITY_ADJUSTMENT = 0
    CREDIT_TIER = 'PREMIUM'
ELSE IF durability_guarantee_period >= 100 THEN
    DURABILITY_ADJUSTMENT = NET_REMOVAL × 0.1
    CREDIT_TIER = 'STANDARD'
ELSE
    DURABILITY_ADJUSTMENT = NET_REMOVAL × 0.3
    CREDIT_TIER = 'BASIC'
END IF
```

#### Step 7: Final Credit Calculation
```
UNCERTAINTY_DISCOUNT = NET_REMOVAL × uncertainty_rate
FINAL_CREDITS = NET_REMOVAL - DURABILITY_ADJUSTMENT - UNCERTAINTY_DISCOUNT
```

### 3.7 BiCRS Algorithm

#### Step 1: Calculate Biogenic Carbon in Biomass
```
BIOMASS_DRY_MASS = biomass_quantity × (1 - biomass_moisture_content/100)
BIOGENIC_CARBON = BIOMASS_DRY_MASS × biomass_carbon_content/100
```

#### Step 2: Calculate Processing Emissions
```
COLLECTION_EMISSIONS = collection_emissions
PROCESSING_EMISSIONS = processing_energy_consumption × energy_emission_factor + processing_emissions
TRANSPORT_EMISSIONS = (transport_distance_collection + transport_distance_to_storage) × 
                      transport_emission_factor × biomass_quantity

TOTAL_PROCESS_EMISSIONS = COLLECTION_EMISSIONS + PROCESSING_EMISSIONS + TRANSPORT_EMISSIONS
```

#### Step 3: Calculate Stored Carbon
```
CARBON_STORED = biomass_carbon_injected × (1 - storage_leakage_estimate)
```

#### Step 4: Calculate Net Removal
```
NET_REMOVAL = CARBON_STORED - TOTAL_PROCESS_EMISSIONS
```

#### Step 5: Convert to CO2e and Apply Adjustments
```
REMOVAL_CO2E = NET_REMOVAL × (44/12)

IF storage_permanence_estimate >= 1000 THEN
    PERMANENCE_ADJUSTMENT = 0
ELSE IF storage_permanence_estimate >= 100 THEN
    PERMANENCE_ADJUSTMENT = REMOVAL_CO2E × 0.1
ELSE
    PERMANENCE_ADJUSTMENT = REMOVAL_CO2E × 0.3
END IF

UNCERTAINTY_DISCOUNT = REMOVAL_CO2E × uncertainty_rate
FINAL_CREDITS = REMOVAL_CO2E - PERMANENCE_ADJUSTMENT - UNCERTAINTY_DISCOUNT
```

### 3.8 Private CDR Protocols Algorithm

Private protocols use methodology-specific calculations but follow the general framework:

```
GROSS_STORAGE = protocol_specific_storage_calculation()
LIFECYCLE_EMISSIONS = protocol_specific_lca_calculation()
NET_STORAGE = GROSS_STORAGE - LIFECYCLE_EMISSIONS

// Apply protocol-specific uncertainty and durability
UNCERTAINTY_DISCOUNT = NET_STORAGE × protocol_uncertainty_rate
DURABILITY_ADJUSTMENT = NET_STORAGE × protocol_durability_factor

FINAL_CREDITS = NET_STORAGE - UNCERTAINTY_DISCOUNT - DURABILITY_ADJUSTMENT
```

---

## 4. Validation Rules

### 4.1 Measurement Accuracy Requirements

| Methodology | Parameter | Required Accuracy | Verification Method |
|-------------|-----------|-------------------|---------------------|
| Industrial Gas | Gas flow rate | ±2% | Calibrated flow meters, annual calibration |
| Industrial Gas | Gas concentration | ±5% | Continuous emissions monitoring (CEMS) |
| Industrial Gas | Destruction efficiency | ±1% | Engineering analysis, testing |
| CCS/CCUS | CO2 flow rate | ±1.5% | ISO 5167 orifice meters, ultrasonic |
| CCS/CCUS | CO2 purity | ±0.5% | Gas chromatography, infrared |
| CCS/CCUS | Injection volume | ±1% | Coriolis meters, turbine meters |
| Biochar | Carbon content | ±2% | Elemental analysis (CHNS) |
| Biochar | H:C ratio | ±0.05 | Elemental analysis |
| Biochar | Mass | ±0.5% | Calibrated weighbridge |
| Mineralization | CO2 uptake | ±5% | Mass balance, TGA analysis |
| Mineralization | Mineral composition | ±3% | XRF analysis |
| DAC | CO2 captured | ±1% | Mass flow meters, composition |
| DAC | Energy consumption | ±2% | Utility-grade metering |
| BiCRS | Biomass carbon | ±3% | Elemental analysis |
| BiCRS | Injection volume | ±2% | Flow metering |

### 4.2 Chain-of-Custody Validation

#### 4.2.1 Required Documentation

| Stage | Required Documentation | Validation Rule |
|-------|----------------------|-----------------|
| Feedstock Origin | Purchase records, sustainability certs | Must trace to verifiable source |
| Processing | Production logs, batch records | Mass balance must reconcile |
| Transport | Bills of lading, GPS tracking | Route verification required |
| Storage | Injection records, monitoring data | Third-party verification |
| End Use | Application records, field verification | For non-geologic storage |

#### 4.2.2 Mass Balance Validation
```
VALIDATION_RULE: Input_mass × yield_rate = Output_mass ± tolerance
TOLERANCE: ±3% for most methodologies
```

### 4.3 Storage Verification Requirements

#### 4.3.1 Geologic Storage

| Requirement | Specification | Verification Frequency |
|-------------|---------------|----------------------|
| Injection monitoring | Continuous pressure/temperature | Real-time |
| Plume monitoring | 3D seismic, well monitoring | Annual minimum |
| Well integrity | Mechanical integrity tests | Annual |
| Leakage detection | Surface monitoring, atmospheric | Continuous |
| Modeling validation | Compare predicted vs observed | Annual |

#### 4.3.2 Non-Geologic Storage

| Storage Type | Verification Method | Frequency |
|--------------|---------------------|-----------|
| Biochar in soil | Soil sampling, C analysis | Every 5 years |
| Carbonated materials | Material testing, carbon content | Per batch |
| Mineral products | XRD, TGA analysis | Per batch |

### 4.4 Permanence and Durability Checks

#### 4.4.1 Permanence Thresholds

| Credit Tier | Minimum Duration | Reversal Buffer | Insurance Required |
|-------------|------------------|-----------------|-------------------|
| Premium Removal | 1000 years | 10% | Yes |
| Standard Removal | 100 years | 5% | Yes |
| Basic Removal | 50 years | 10% | Recommended |
| Reduction | N/A | N/A | No |

#### 4.4.2 Durability Validation

```
VALIDATION_RULES:
1. Biochar H:C ratio must be < 0.7 for any removal credits
2. Biochar O:C ratio must be < 0.4 for full credits
3. Mineral carbonation must demonstrate > 100 year stability
4. Geologic storage must have MMV plan approved by registry
5. ERW must use peer-reviewed weathering models
```

### 4.5 Policy Constraint Validations

#### 4.5.1 Regulatory Compliance Check

```
IF regulatory_requirement = TRUE THEN
    REQUIRE: Legal documentation of regulation
    REQUIRE: Evidence of mandatory destruction rate
    APPLY: Policy discount per protocol rules
    FLAG: For additional verification review
END IF
```

#### 4.5.2 Additionality Demonstration

| Methodology | Additionality Test | Evidence Required |
|-------------|-------------------|-------------------|
| Industrial Gas | Regulatory surplus | Legal analysis, baseline study |
| CCS/CCUS | Financial/investment | Cost analysis, barrier assessment |
| Biochar | Common practice | Market analysis, technology assessment |
| Mineralization | Financial/regulatory | Investment analysis, policy review |
| DAC | Technology/Financial | Innovation assessment, cost analysis |
| BiCRS | Common practice | Market analysis, barrier assessment |

### 4.6 Data Quality Validation

#### 4.6.1 Completeness Checks
```
FOR each required_parameter IN methodology.required_parameters:
    IF parameter.value IS NULL OR parameter.value IS EMPTY:
        RAISE validation_error("Required parameter missing")
    IF parameter.value < parameter.min_value OR parameter.value > parameter.max_value:
        RAISE validation_error("Parameter out of valid range")
```

#### 4.6.2 Consistency Checks
```
VALIDATION_RULES:
1. capture_period_end must be > capture_period_start
2. co2_injected_volume must be ≤ co2_captured_volume
3. biochar_quantity_produced must be ≤ feedstock_quantity × max_yield
4. energy_consumption must be ≥ 0
5. All emission factors must be from approved sources
```

#### 4.6.3 Temporal Validation
```
VALIDATION_RULES:
1. All dates must be within valid vintage period
2. Monitoring data must cover full reporting period
3. No gaps > 30 days in continuous monitoring data
4. Calibration dates must be within validity period
```

---

## 5. Output Specifications

### 5.1 Credit Quantity Output

#### 5.1.1 Standard Output Format

```json
{
  "credit_calculation": {
    "calculation_id": "UUID",
    "methodology": "METHODLOGY_CODE",
    "protocol_version": "VERSION",
    "reporting_period": {
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD"
    },
    "gross_quantity": {
      "value": 0.0,
      "unit": "tCO2e",
      "description": "Gross capture/destruction before deductions"
    },
    "lifecycle_emissions": {
      "value": 0.0,
      "unit": "tCO2e",
      "breakdown": {
        "energy_emissions": 0.0,
        "transport_emissions": 0.0,
        "process_emissions": 0.0,
        "upstream_emissions": 0.0
      }
    },
    "net_quantity": {
      "value": 0.0,
      "unit": "tCO2e",
      "description": "Net after lifecycle deductions"
    },
    "adjustments": {
      "uncertainty_discount": {
        "value": 0.0,
        "rate_applied": 0.0,
        "rationale": "Description"
      },
      "permanence_adjustment": {
        "value": 0.0,
        "rationale": "Description"
      },
      "policy_adjustment": {
        "value": 0.0,
        "rationale": "Description"
      }
    },
    "final_credit_quantity": {
      "value": 0.0,
      "unit": "tCO2e",
      "confidence_interval": {
        "lower_bound": 0.0,
        "upper_bound": 0.0,
        "confidence_level": "95%"
      }
    }
  }
}
```

### 5.2 Credit Type Classification

#### 5.2.1 Credit Type Determination

| Methodology | Credit Type | Classification Rules |
|-------------|-------------|---------------------|
| Industrial Gas | Reduction | Always reduction |
| CCS (fossil) | Reduction | Source is fossil fuel |
| CCS (biogenic) | Removal | Source is biomass |
| CCS (DAC) | Removal | Source is atmosphere |
| Biochar | Removal | Always removal |
| Mineralization | Removal | Always removal |
| DAC | Removal | Always removal |
| BiCRS | Removal | Always removal |

#### 5.2.2 Durability Classification

```json
{
  "durability_classification": {
    "durability_tier": "PREMIUM|STANDARD|BASIC",
    "storage_duration_years": 0,
    "storage_method": "METHOD",
    "reversal_risk": "LOW|MEDIUM|HIGH",
    "monitoring_requirements": {
      "frequency": "CONTINUOUS|ANNUAL|PERIODIC",
      "methods": ["METHOD_1", "METHOD_2"],
      "verification_body": "BODY_NAME"
    },
    "buffer_contribution": {
      "required": true,
      "percentage": 0.0,
      "rationale": "Description"
    }
  }
}
```

### 5.3 Uncertainty Ranges

#### 5.3.1 Uncertainty Calculation

```
UNCERTAINTY_COMPONENTS:
1. Measurement uncertainty: Based on instrument accuracy
2. Modeling uncertainty: Based on model validation
3. Parameter uncertainty: Based on data quality
4. Temporal uncertainty: Based on monitoring gaps

TOTAL_UNCERTAINTY = √(measurement² + modeling² + parameter² + temporal²)
```

#### 5.3.2 Confidence Interval Output

```json
{
  "uncertainty_analysis": {
    "total_uncertainty_percentage": 0.0,
    "confidence_interval_95": {
      "lower_bound": 0.0,
      "upper_bound": 0.0,
      "mean_estimate": 0.0
    },
    "uncertainty_breakdown": {
      "measurement": 0.0,
      "modeling": 0.0,
      "parameter": 0.0,
      "temporal": 0.0
    },
    "conservative_estimate": 0.0,
    "discount_applied": 0.0
  }
}
```

### 5.4 Lifecycle Emission Breakdowns

#### 5.4.1 Detailed LCA Output

```json
{
  "lifecycle_emissions": {
    "total_lifecycle_emissions": 0.0,
    "unit": "tCO2e",
    "breakdown_by_stage": {
      "raw_material_acquisition": {
        "value": 0.0,
        "description": "Emissions from feedstock/mineral extraction",
        "components": {
          "mining_extraction": 0.0,
          "processing": 0.0,
          "transport_to_facility": 0.0
        }
      },
      "production_processing": {
        "value": 0.0,
        "description": "Emissions from conversion processes",
        "components": {
          "energy_consumption": 0.0,
          "chemical_inputs": 0.0,
          "direct_process_emissions": 0.0
        }
      },
      "transport_distribution": {
        "value": 0.0,
        "description": "Emissions from transport to storage/use",
        "components": {
          "fuel_combustion": 0.0,
          "refrigeration": 0.0,
          "handling": 0.0
        }
      },
      "storage_end_use": {
        "value": 0.0,
        "description": "Emissions from storage operations",
        "components": {
          "compression": 0.0,
          "injection": 0.0,
          "monitoring": 0.0
        }
      }
    },
    "emission_factors_used": [
      {
        "factor_name": "NAME",
        "value": 0.0,
        "unit": "UNIT",
        "source": "SOURCE_REFERENCE",
        "vintage": "YEAR"
      }
    ]
  }
}
```

### 5.5 Storage Evidence References

#### 5.5.1 Storage Documentation Output

```json
{
  "storage_evidence": {
    "storage_type": "TYPE",
    "storage_location": {
      "facility_id": "ID",
      "coordinates": {
        "latitude": 0.0,
        "longitude": 0.0
      },
      "geologic_formation": "FORMATION_NAME"
    },
    "storage_verification": {
      "verification_body": "BODY_NAME",
      "verification_date": "YYYY-MM-DD",
      "verification_standard": "STANDARD",
      "verification_report_id": "REPORT_ID"
    },
    "monitoring_data": {
      "monitoring_plan_id": "PLAN_ID",
      "last_monitoring_date": "YYYY-MM-DD",
      "next_monitoring_due": "YYYY-MM-DD",
      "monitoring_results_summary": "SUMMARY"
    },
    "storage_quantity": {
      "reported_volume": 0.0,
      "verified_volume": 0.0,
      "unit": "tCO2",
      "measurement_method": "METHOD"
    },
    "permanence_guarantee": {
      "guarantee_period_years": 0,
      "guarantee_instrument": "TYPE",
      "insurance_coverage": true,
      "reversal_buffer_contribution": 0.0
    }
  }
}
```

### 5.6 Vintage and Protocol Information

#### 5.6.1 Credit Metadata Output

```json
{
  "credit_metadata": {
    "vintage": {
      "year": 0,
      "vintage_start": "YYYY-MM-DD",
      "vintage_end": "YYYY-MM-DD",
      "issuance_date": "YYYY-MM-DD"
    },
    "protocol_information": {
      "protocol_name": "PROTOCOL",
      "protocol_version": "VERSION",
      "methodology_code": "CODE",
      "methodology_version": "VERSION",
      "registry": "REGISTRY_NAME",
      "compliance_programs": ["CORSIA", "OTHER"]
    },
    "project_information": {
      "project_id": "ID",
      "project_name": "NAME",
      "project_location": {
        "country": "CODE",
        "region": "REGION"
      },
      "project_type": "TYPE",
      "facility_id": "FACILITY_ID"
    },
    "additional_attributes": {
      "sustainable_development_contributions": ["SDG_7", "SDG_13"],
      "co_benefits": ["BENEFIT_1", "BENEFIT_2"],
      "certifications": ["CERT_1"]
    }
  }
}
```

---

## 6. MRV and Verification Integration

### 6.1 Third-Party Verification Integration

#### 6.1.1 Verification Workflow

```
CALCULATION_ENGINE → VERIFICATION_REQUEST → VERIFICATION_BODY → VERIFICATION_REPORT → CREDIT_ISSUANCE
```

#### 6.1.2 Verification Data Package

```json
{
  "verification_package": {
    "package_id": "UUID",
    "created_date": "YYYY-MM-DDTHH:MM:SSZ",
    "calculation_summary": {
      "calculation_id": "UUID",
      "methodology": "CODE",
      "reporting_period": "PERIOD",
      "total_credits_claimed": 0.0
    },
    "supporting_documents": [
      {
        "document_type": "MONITORING_REPORT",
        "document_id": "ID",
        "hash": "SHA256_HASH",
        "uploaded_date": "YYYY-MM-DD"
      },
      {
        "document_type": "CALIBRATION_CERTIFICATE",
        "document_id": "ID",
        "hash": "SHA256_HASH",
        "uploaded_date": "YYYY-MM-DD"
      },
      {
        "document_type": "LABORATORY_ANALYSIS",
        "document_id": "ID",
        "hash": "SHA256_HASH",
        "uploaded_date": "YYYY-MM-DD"
      }
    ],
    "raw_data_files": [
      {
        "file_type": "CONTINUOUS_MONITORING",
        "file_id": "ID",
        "time_range": "START to END",
        "format": "CSV|JSON|XML"
      }
    ],
    "audit_trail": {
      "calculation_log": "LOG_REFERENCE",
      "input_validation_log": "LOG_REFERENCE",
      "exception_log": "LOG_REFERENCE"
    }
  }
}
```

#### 6.1.3 Verification API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/verification/packages` | POST | Create verification package |
| `/api/v1/verification/packages/{id}` | GET | Retrieve verification package |
| `/api/v1/verification/packages/{id}/status` | PUT | Update verification status |
| `/api/v1/verification/packages/{id}/report` | POST | Submit verification report |
| `/api/v1/verification/bodies` | GET | List approved verification bodies |

### 6.2 Storage Monitoring Systems Integration

#### 6.2.1 Monitoring Data Requirements

| Storage Type | Monitoring Parameter | Frequency | Data Format |
|--------------|---------------------|-----------|-------------|
| Geologic | Pressure | Continuous | Time-series JSON |
| Geologic | Temperature | Continuous | Time-series JSON |
| Geologic | CO2 injection rate | Continuous | Time-series JSON |
| Geologic | Seismic data | Periodic (annual) | SEG-Y or equivalent |
| Geologic | Wellhead monitoring | Continuous | Time-series JSON |
| Biochar (soil) | Soil carbon content | Every 5 years | Laboratory reports |
| Biochar (soil) | Biochar persistence | Every 5 years | Field sampling data |
| Mineral products | Carbon content | Per batch | Laboratory reports |

#### 6.2.2 Monitoring System API

```json
{
  "monitoring_integration": {
    "data_ingestion": {
      "supported_protocols": ["MQTT", "OPC-UA", "Modbus", "REST"],
      "data_validation": {
        "range_checks": true,
        "spike_detection": true,
        "missing_data_detection": true
      },
      "data_storage": {
        "time_series_db": "InfluxDB/TimescaleDB",
        "retention_period": "10 years minimum"
      }
    },
    "alerting": {
      "anomaly_detection": true,
      "threshold_alerts": true,
      "notification_channels": ["email", "webhook", "sms"]
    }
  }
}
```

### 6.3 Chain-of-Custody Tracking

#### 6.3.1 Tracking Requirements

```
CHAIN_OF_CUSTODY_STAGES:
1. Feedstock Origin → Collection
2. Collection → Processing
3. Processing → Transport
4. Transport → Storage/Use
5. Storage → Monitoring

REQUIRED_AT_EACH_STAGE:
- Mass/volume measurement
- Timestamp
- Location (GPS coordinates)
- Responsible party signature
- Documentation hash
```

#### 6.3.2 Blockchain/DLT Integration (Optional)

```json
{
  "chain_of_custody": {
    "tracking_method": "BLOCKCHAIN|DATABASE|HYBRID",
    "blockchain_configuration": {
      "platform": "Hyperledger Fabric|Ethereum|Other",
      "consensus_mechanism": "PROOF_OF_AUTHORITY",
      "smart_contracts": [
        "FeedstockOrigin",
        "ProcessingVerification",
        "TransportTracking",
        "StorageVerification"
      ]
    },
    "data_recorded": {
      "transaction_hash": "HASH",
      "timestamp": "ISO8601",
      "location": "GPS_COORDINATES",
      "party_id": "IDENTIFIER",
      "mass_volume": "VALUE_WITH_UNITS",
      "documentation_cid": "IPFS_CONTENT_ID"
    }
  }
}
```

### 6.4 Protocol Compliance Checking

#### 6.4.1 Automated Compliance Rules

```python
COMPLIANCE_RULES = {
    "industrial_gas": {
        "min_destruction_efficiency": 0.95,
        "max_reporting_gap_days": 30,
        "required_calibration_frequency_months": 12,
        "baseline_study_required": True
    },
    "ccs": {
        "min_injection_depth_m": 800,
        "mmv_plan_approval_required": True,
        "monitoring_data_completeness_required": 0.95,
        "storage_permanence_years": 100
    },
    "biochar": {
        "max_h_c_ratio": 0.7,
        "min_durability_years": 100,
        "laboratory_analysis_required": True,
        "application_verification_required": True
    },
    "dac": {
        "min_durability_years": 1000,
        "reversal_insurance_required": True,
        "energy_source_verification_required": True,
        "lifecycle_assessment_required": True
    }
}
```

#### 6.4.2 Compliance Report Output

```json
{
  "compliance_check": {
    "check_id": "UUID",
    "methodology": "CODE",
    "check_date": "YYYY-MM-DD",
    "overall_status": "PASS|FAIL|CONDITIONAL",
    "rule_results": [
      {
        "rule_id": "RULE_001",
        "rule_description": "Description",
        "status": "PASS|FAIL|WARNING",
        "actual_value": "VALUE",
        "required_value": "VALUE",
        "remediation_required": true
      }
    ],
    "exceptions": [
      {
        "exception_code": "CODE",
        "description": "Description",
        "severity": "CRITICAL|MAJOR|MINOR",
        "resolution_required": true
      }
    ]
  }
}
```

### 6.5 Audit Trail Requirements

#### 6.5.1 Audit Log Schema

```json
{
  "audit_log_entry": {
    "log_id": "UUID",
    "timestamp": "YYYY-MM-DDTHH:MM:SS.sssZ",
    "event_type": "INPUT_RECEIVED|CALCULATION_STARTED|CALCULATION_COMPLETED|VALIDATION_PASSED|VALIDATION_FAILED|OUTPUT_GENERATED",
    "user_id": "USER_IDENTIFIER",
    "session_id": "SESSION_UUID",
    "calculation_id": "CALCULATION_UUID",
    "event_details": {
      "input_parameter": "PARAM_NAME",
      "old_value": "VALUE",
      "new_value": "VALUE",
      "validation_result": "PASS|FAIL"
    },
    "ip_address": "IP_ADDRESS",
    "user_agent": "USER_AGENT_STRING"
  }
}
```

#### 6.5.2 Audit Trail Retention

| Data Type | Retention Period | Storage Location |
|-----------|------------------|------------------|
| Calculation logs | 20 years | Immutable storage |
| Input data | 20 years | Encrypted database |
| Output data | 20 years | Registry-linked storage |
| Verification packages | 20 years | Registry-linked storage |
| Audit logs | 20 years | WORM storage |

### 6.6 Evidence Documentation

#### 6.6.1 Required Evidence by Methodology

| Methodology | Evidence Category | Document Types |
|-------------|-------------------|----------------|
| Industrial Gas | Operational | CEMS data, calibration certs, maintenance logs |
| Industrial Gas | Analytical | Gas composition analysis, efficiency tests |
| CCS/CCUS | Operational | Flow meter data, injection records, pressure data |
| CCS/CCUS | Geologic | Seismic surveys, well logs, reservoir models |
| Biochar | Analytical | CHNS analysis, heavy metals, stability tests |
| Biochar | Operational | Production logs, application records |
| Mineralization | Analytical | XRF, XRD, TGA, carbonation extent |
| Mineralization | Modeling | Weathering models, persistence projections |
| DAC | Operational | Energy consumption, capture rate data |
| DAC | Analytical | CO2 purity, sorbent analysis |
| BiCRS | Operational | Processing logs, injection records |
| BiCRS | Analytical | Biomass composition, storage verification |

#### 6.6.2 Evidence Management

```json
{
  "evidence_management": {
    "document_storage": {
      "primary_storage": "IPFS|ARWEAVE|REGISTRY_SYSTEM",
      "backup_storage": "CLOUD_STORAGE",
      "encryption": "AES-256",
      "access_control": "ROLE_BASED"
    },
    "document_metadata": {
      "document_id": "UUID",
      "document_type": "TYPE",
      "upload_date": "YYYY-MM-DD",
      "uploader_id": "USER_ID",
      "file_hash": "SHA256",
      "verification_status": "VERIFIED|PENDING|REJECTED",
      "linked_calculation": "CALCULATION_UUID"
    }
  }
}
```

---

## 7. Technical Architecture

### 7.1 Recommended Technology Stack

#### 7.1.1 Backend Services

| Component | Technology | Justification |
|-----------|------------|---------------|
| API Framework | Python/FastAPI or Node.js/NestJS | High performance, async support |
| Calculation Engine | Python (NumPy, SciPy, Pandas) | Scientific computing libraries |
| Database | PostgreSQL + TimescaleDB | Relational + time-series data |
| Cache | Redis | High-speed calculation caching |
| Message Queue | RabbitMQ or Apache Kafka | Async processing, audit logging |
| Document Store | MongoDB or PostgreSQL JSONB | Flexible evidence documents |

#### 7.1.2 Frontend (if applicable)

| Component | Technology |
|-----------|------------|
| Web Application | React/Vue.js with TypeScript |
| Data Visualization | D3.js, Chart.js |
| Maps/Geospatial | Leaflet, Mapbox |

#### 7.1.3 Infrastructure

| Component | Technology |
|-----------|------------|
| Container Orchestration | Kubernetes |
| Cloud Provider | AWS/Azure/GCP |
| CI/CD | GitHub Actions, GitLab CI |
| Monitoring | Prometheus, Grafana |
| Logging | ELK Stack or Loki |

### 7.2 API Design for Calculation Services

#### 7.2.1 Core API Endpoints

```yaml
openapi: 3.0.0
info:
  title: Carbon Credit Calculation Engine API
  version: 1.0.0

paths:
  /api/v1/calculate:
    post:
      summary: Perform credit calculation
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CalculationRequest'
      responses:
        200:
          description: Successful calculation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CalculationResponse'
        400:
          description: Validation error
        422:
          description: Calculation error

  /api/v1/validate:
    post:
      summary: Validate input parameters
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValidationRequest'
      responses:
        200:
          description: Validation results

  /api/v1/methodologies:
    get:
      summary: List supported methodologies
      responses:
        200:
          description: List of methodologies

  /api/v1/methodologies/{code}/parameters:
    get:
      summary: Get parameters for methodology
      responses:
        200:
          description: Parameter definitions

components:
  schemas:
    CalculationRequest:
      type: object
      required:
        - methodology
        - parameters
        - reporting_period
      properties:
        methodology:
          type: string
          enum: [INDUSTRIAL_GAS, CCS, BIOCHAR, MINERALIZATION, DAC, BICRS, PRIVATE_CDR]
        parameters:
          type: object
        reporting_period:
          type: object
          properties:
            start_date:
              type: string
              format: date
            end_date:
              type: string
              format: date

    CalculationResponse:
      type: object
      properties:
        calculation_id:
          type: string
          format: uuid
        status:
          type: string
          enum: [SUCCESS, PARTIAL_SUCCESS, FAILED]
        results:
          $ref: '#/components/schemas/CreditCalculationResult'
        validation_results:
          $ref: '#/components/schemas/ValidationResults'
        audit_log_id:
          type: string
```

#### 7.2.2 API Authentication

```json
{
  "authentication": {
    "method": "OAuth 2.0 with JWT",
    "token_lifetime": "1 hour",
    "refresh_token_lifetime": "30 days",
    "scopes": [
      "calculation:read",
      "calculation:write",
      "validation:read",
      "admin:full"
    ],
    "mfa_required": true,
    "ip_whitelist": "optional"
  }
}
```

### 7.3 Database Schema Recommendations

#### 7.3.1 Core Tables

```sql
-- Projects table
CREATE TABLE projects (
    project_id UUID PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    methodology_code VARCHAR(50) NOT NULL,
    protocol_version VARCHAR(20) NOT NULL,
    registry VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calculations table
CREATE TABLE calculations (
    calculation_id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(project_id),
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    calculation_status VARCHAR(20) NOT NULL,
    gross_quantity DECIMAL(20, 6),
    lifecycle_emissions DECIMAL(20, 6),
    net_quantity DECIMAL(20, 6),
    final_credits DECIMAL(20, 6),
    uncertainty_discount DECIMAL(20, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID,
    verification_status VARCHAR(20)
);

-- Input parameters table (flexible schema)
CREATE TABLE input_parameters (
    parameter_id UUID PRIMARY KEY,
    calculation_id UUID REFERENCES calculations(calculation_id),
    parameter_name VARCHAR(100) NOT NULL,
    parameter_value JSONB NOT NULL,
    unit VARCHAR(50),
    data_source VARCHAR(100),
    measurement_method VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY,
    calculation_id UUID REFERENCES calculations(calculation_id),
    event_type VARCHAR(50) NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID,
    session_id UUID,
    event_details JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Time-series data for monitoring
CREATE TABLE monitoring_data (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    project_id UUID NOT NULL,
    parameter_name VARCHAR(100) NOT NULL,
    value DECIMAL(20, 6),
    unit VARCHAR(50),
    quality_flag VARCHAR(20),
    PRIMARY KEY (time, project_id, parameter_name)
);

-- Create TimescaleDB hypertable for monitoring data
SELECT create_hypertable('monitoring_data', 'time');

-- Evidence documents table
CREATE TABLE evidence_documents (
    document_id UUID PRIMARY KEY,
    calculation_id UUID REFERENCES calculations(calculation_id),
    document_type VARCHAR(50) NOT NULL,
    document_hash VARCHAR(64) NOT NULL,
    storage_location VARCHAR(500),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_status VARCHAR(20),
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_calculations_project ON calculations(project_id);
CREATE INDEX idx_calculations_period ON calculations(reporting_period_start, reporting_period_end);
CREATE INDEX idx_audit_log_calculation ON audit_log(calculation_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(event_timestamp);
CREATE INDEX idx_monitoring_project_time ON monitoring_data(project_id, time DESC);
```

### 7.4 Integration with Private Registry Systems

#### 7.4.1 Registry Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CALCULATION ENGINE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Industrial  │  │    CCS/      │  │   Biochar    │          │
│  │    Gas       │  │   CCUS       │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Mineralization│  │     DAC      │  │    BiCRS     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              REGISTRY INTEGRATION LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Verra      │  │     ACR      │  │  Puro.earth  │          │
│  │    VCS       │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  Isometric   │  │   CDM/       │                            │
│  │              │  │   Other      │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.4.2 Registry API Adapters

```python
# Abstract base class for registry adapters
class RegistryAdapter(ABC):
    @abstractmethod
    def submit_calculation(self, calculation: CalculationResult) -> RegistryResponse:
        pass
    
    @abstractmethod
    def get_credit_status(self, credit_id: str) -> CreditStatus:
        pass
    
    @abstractmethod
    def validate_methodology(self, methodology_code: str) -> bool:
        pass

# Example implementation for Verra VCS
class VerraVCSAdapter(RegistryAdapter):
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
    
    def submit_calculation(self, calculation: CalculationResult) -> RegistryResponse:
        # Transform to Verra format
        verra_payload = self._transform_to_verra_format(calculation)
        # Submit to Verra API
        response = requests.post(
            f"{self.base_url}/v1/credit-submissions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json=verra_payload
        )
        return RegistryResponse.from_verra_response(response.json())
```

### 7.5 Performance Requirements

#### 7.5.1 Response Time Targets

| Operation | Target Response Time | Maximum Response Time |
|-----------|---------------------|----------------------|
| Simple calculation | < 500ms | < 2s |
| Complex calculation (LCA) | < 3s | < 10s |
| Validation only | < 200ms | < 1s |
| Batch calculation (100) | < 30s | < 2min |
| Report generation | < 5s | < 30s |

#### 7.5.2 Throughput Requirements

| Metric | Target | Peak Capacity |
|--------|--------|---------------|
| Concurrent calculations | 100 | 500 |
| Calculations per minute | 1000 | 5000 |
| API requests per second | 100 | 500 |
| Data ingestion (monitoring) | 10,000 points/sec | 50,000 points/sec |

#### 7.5.3 Scalability Design

```
SCALING_STRATEGY:
1. Horizontal scaling of API servers
2. Read replicas for database queries
3. Caching layer for frequent calculations
4. Async processing for complex LCA calculations
5. Queue-based architecture for batch processing
```

### 7.6 Security Considerations

#### 7.6.1 Data Security

| Data Type | Encryption at Rest | Encryption in Transit | Access Control |
|-----------|-------------------|----------------------|----------------|
| Calculation inputs | AES-256 | TLS 1.3 | Role-based |
| Calculation outputs | AES-256 | TLS 1.3 | Role-based |
| Audit logs | AES-256 | TLS 1.3 | Append-only |
| Evidence documents | AES-256 | TLS 1.3 | Granular permissions |
| API keys | Hash + Salt | N/A | Admin only |

#### 7.6.2 High-Value Credit Protection

```json
{
  "security_measures": {
    "high_value_threshold": {
      "credit_value_usd": 100000,
      "credit_quantity_tco2": 10000
    },
    "additional_security": {
      "multi_signature_required": true,
      "manual_review_required": true,
      "enhanced_audit_logging": true,
      "real_time_anomaly_detection": true
    },
    "fraud_detection": {
      "velocity_checks": true,
      "pattern_analysis": true,
      "cross_reference_validation": true,
      "third_party_data_verification": true
    }
  }
}
```

#### 7.6.3 Compliance Requirements

| Standard | Requirement | Implementation |
|----------|-------------|----------------|
| SOC 2 Type II | Security controls | Annual audit |
| ISO 27001 | Information security | Certified |
| GDPR | Data protection | Privacy by design |
| CORSIA | Credit integrity | Registry compliance |

---

## 8. Appendices

### Appendix A: GWP Values Reference

| Gas | IPCC AR5 GWP (100-yr) | IPCC AR6 GWP (100-yr) |
|-----|----------------------|----------------------|
| CO2 | 1 | 1 |
| N2O | 298 | 273 |
| HFC-23 | 14,800 | 14,600 |
| HFC-134a | 1,430 | 1,530 |
| HFC-125 | 3,170 | 3,740 |
| HFC-143a | 4,800 | 5,810 |
| CH4 | 28 | 27.9 |

### Appendix B: Emission Factor Sources

| Source Type | Recommended Source | URL |
|-------------|-------------------|-----|
| Electricity | IEA, EPA eGRID | https://www.epa.gov/egrid |
| Fuels | IPCC 2006 Guidelines | https://www.ipcc-nggip.iges.or.jp |
| Transport | GREET Model, Defra | https://greet.es.anl.gov |
| Industrial | EPA GHGRP, NGER | https://www.epa.gov/ghgreporting |

### Appendix C: Uncertainty Default Values

| Methodology | Default Uncertainty Rate | Notes |
|-------------|-------------------------|-------|
| Industrial Gas | 5% | With CEMS |
| CCS (direct measurement) | 3% | With ISO meters |
| CCS (indirect) | 10% | Without direct metering |
| Biochar | 10% | With lab analysis |
| Mineralization | 15% | With measurement |
| DAC | 5% | With verified energy |
| BiCRS | 10% | With monitoring |

### Appendix D: Protocol-Specific Requirements

#### D.1 Verra VCS Requirements
- PD document required
- Validation by VVB
- Verification every monitoring period
- Buffer contribution to VCS pooled buffer

#### D.2 ACR Requirements
- Project plan approval
- Third-party verification
- Compliance with ACR Standard
- Buffer contribution to ACR buffer pool

#### D.3 Puro.earth Requirements
- CORC methodology compliance
- Supplier agreement
- Independent auditor verification
- Durability requirements per methodology

#### D.4 Isometric Requirements
- Protocol-specific MRV
- Third-party verification
- Durability quantification
- Uncertainty assessment

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01 | Carbon Credit Engine Team | Initial release |

---

**END OF DOCUMENT**
