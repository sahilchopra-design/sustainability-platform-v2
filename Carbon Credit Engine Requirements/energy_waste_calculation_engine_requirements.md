# Carbon Credit Calculation Engine Requirements
## Energy and Waste Methodologies Technical Specification

**Version:** 1.0  
**Date:** January 2025  
**Document Type:** Technical Requirements Specification

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Methodology Overview](#2-methodology-overview)
3. [Input Parameters](#3-input-parameters)
4. [Calculation Algorithms](#4-calculation-algorithms)
5. [Validation Rules](#5-validation-rules)
6. [Output Specifications](#6-output-specifications)
7. [Monitoring Integration](#7-monitoring-integration)
8. [Technical Architecture](#8-technical-architecture)
9. [Appendices](#9-appendices)

---

## 1. Executive Summary

This document provides comprehensive technical requirements for a carbon credit calculation engine supporting Energy and Waste methodologies. The engine must handle seven primary methodology categories with varying complexity levels, data sources, and validation requirements.

### Supported Methodologies

| ID | Methodology | Standard | Complexity | Status |
|----|-------------|----------|------------|--------|
| E1 | Grid Renewables | VCS/GS/CDM | Medium | Mature |
| E2 | Distributed Energy | GS/VCS | High | Mature |
| E3 | Clean Cooking | GS/VCS | High | Mature/Scrutinized |
| E4 | Energy Efficiency | VCS/GS/ACR | High | Mature |
| W1 | Landfill Gas | VCS/ACR | Medium | Mature |
| W2 | Wastewater Methane | VCS/ACR | Medium | Mature |
| W3 | Organic Waste | VCS/ACR/National | High | Growing |

---

## 2. Methodology Overview

### 2.1 Energy Methodologies

#### E1: Grid Renewables
Grid-connected renewable energy projects displace fossil fuel-based electricity generation. Credits are calculated based on net electricity supplied to the grid multiplied by the applicable grid emission factor.

**Applicable Technologies:**
- Solar PV (utility-scale and distributed)
- Wind (onshore and offshore)
- Hydroelectric (run-of-river and reservoir)
- Geothermal
- Biomass (with sustainability criteria)

**Key Standards:**
- VCS VM0018 (Electricity Generation from Renewable Sources)
- CDM ACM0002 (Grid-connected electricity generation from renewable sources)
- Gold Standard Renewable Energy Activity Requirements

#### E2: Distributed Energy
Off-grid and mini-grid renewable energy systems provide electricity services to households and communities that would otherwise use fossil fuels or have no access to electricity.

**Applicable Technologies:**
- Solar Home Systems (SHS)
- Mini-grids (solar, wind, hybrid)
- Pico-hydro systems
- Biogas generators

**Key Standards:**
- Gold Standard Metered & Measured Energy Activities
- VCS VMR0006 (Grid-connected electricity generation from renewable sources - small scale)

#### E3: Clean Cooking
Improved cookstoves and clean cooking technologies reduce fuel consumption and emissions from household cooking activities.

**Applicable Technologies:**
- Improved biomass cookstoves
- LPG/natural gas cookstoves
- Electric/induction cookstoves
- Biogas digesters
- Water purification technologies

**Key Standards:**
- Gold Standard TPDDTEC (Technologies and Practices to Displace Decentralized Thermal Energy Consumption)
- VCS VMR0004 (Energy efficiency and fuel switching measures - thermal energy production)

#### E4: Energy Efficiency
Projects that reduce energy consumption through improved equipment, building systems, or industrial processes.

**Applicable Technologies:**
- Industrial equipment upgrades
- Building energy management systems
- Efficient appliances
- District heating/cooling systems
- Lighting retrofits

**Key Standards:**
- VCS VM0018 (Energy Efficiency)
- ACR Energy Efficiency Protocols
- Gold Standard Energy Efficiency Activity Requirements

### 2.2 Waste Methodologies

#### W1: Landfill Gas
Capture and destruction or utilization of methane from municipal solid waste landfills.

**Applicable Activities:**
- Landfill gas flaring
- Electricity generation from landfill gas
- Direct use of landfill gas

**Key Standards:**
- VCS VM0018 (Electricity Generation from the Capture and Destruction of Methane in Landfills)
- ACR Landfill Gas Protocol

#### W2: Wastewater Methane
Reduction of methane emissions from wastewater treatment through improved treatment processes or methane capture.

**Applicable Activities:**
- Anaerobic digestion with gas capture
- Aerobic treatment upgrades
- Biogas utilization

**Key Standards:**
- VCS VM0018 (Methane Recovery in Wastewater Treatment)
- CDM AMS-III.H (Methane recovery in wastewater treatment)

#### W3: Organic Waste
Diversion of organic waste from landfills to alternative treatment pathways.

**Applicable Activities:**
- Composting
- Anaerobic digestion
- Vermicomposting
- Animal feed production

**Key Standards:**
- VCS VM0018 (Avoidance of methane emissions from organic waste)
- ACR Organic Waste Diversion Protocol

---

## 3. Input Parameters

### 3.1 Common Input Parameters (All Methodologies)

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `project_id` | Unique project identifier | String | - | Registry | Yes |
| `methodology_code` | Methodology identifier | String | - | Configuration | Yes |
| `monitoring_period_start` | Start date of monitoring period | Date | YYYY-MM-DD | User Input | Yes |
| `monitoring_period_end` | End date of monitoring period | Date | YYYY-MM-DD | User Input | Yes |
| `project_location` | Geographic coordinates | GeoJSON | lat/lon | GIS | Yes |
| `grid_emission_factor` | Approved grid emission factor | Decimal | tCO2e/MWh | Official Source | Yes |
| `additionality_demonstration` | Evidence of additionality | Document | - | Project Files | Yes |
| `leakage_assessment` | Leakage calculation inputs | Object | - | Analysis | Conditional |

### 3.2 Grid Renewables (E1) Input Parameters

#### Primary Energy Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `gross_generation` | Total electricity generated | Decimal | MWh | Meter | Yes |
| `auxiliary_consumption` | On-site electricity use | Decimal | MWh | Meter | Yes |
| `net_generation` | Net electricity to grid | Decimal | MWh | Calculated | Yes |
| `meter_reading_start` | Opening meter reading | Decimal | MWh | Meter | Yes |
| `meter_reading_end` | Closing meter reading | Decimal | MWh | Meter | Yes |
| `meter_calibration_date` | Last calibration date | Date | YYYY-MM-DD | Certificate | Yes |
| `grid_export_quantity` | Electricity exported to grid | Decimal | MWh | Billing | Yes |

#### Plant Performance Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `plant_capacity` | Installed capacity | Decimal | MW | Design | Yes |
| `capacity_factor` | Actual capacity factor | Decimal | % | Calculated | Yes |
| `availability_factor` | Plant availability | Decimal | % | O&M Records | Yes |
| `curtailment_losses` | Grid curtailment quantity | Decimal | MWh | Grid Operator | Conditional |
| `forced_outage_hours` | Unplanned downtime | Integer | hours | O&M Records | Yes |
| `planned_outage_hours` | Scheduled maintenance | Integer | hours | O&M Records | Yes |

#### Emission Factors

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `grid_ef_build_margin` | Build margin emission factor | Decimal | tCO2e/MWh | Official | Yes |
| `grid_ef_operating_margin` | Operating margin emission factor | Decimal | tCO2e/MWh | Official | Yes |
| `grid_ef_combined_margin` | Combined margin emission factor | Decimal | tCO2e/MWh | Calculated | Yes |
| `om_weighting` | Operating margin weight | Decimal | 0-1 | Standard | Yes |
| `bm_weighting` | Build margin weight | Decimal | 0-1 | Standard | Yes |

#### Project Emissions (if applicable)

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `backup_fuel_consumption` | Fossil fuel backup use | Decimal | Litres | Meter | Conditional |
| `backup_fuel_type` | Type of backup fuel | String | - | Records | Conditional |
| `backup_fuel_ef` | Backup fuel emission factor | Decimal | tCO2e/L | Default | Conditional |
| `sf6_emissions` | SF6 emissions (if applicable) | Decimal | kg | Measurement | Conditional |

### 3.3 Distributed Energy (E2) Input Parameters

#### System Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `system_type` | Technology type | Enum | - | Configuration | Yes |
| `system_capacity` | Installed capacity per system | Decimal | W/kW | Design | Yes |
| `number_of_systems` | Total systems deployed | Integer | count | Records | Yes |
| `deployment_date` | System installation date | Date | YYYY-MM-DD | Records | Yes |
| `system_lifetime` | Expected system lifetime | Integer | years | Design | Yes |

#### Baseline Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `baseline_fuel_type` | Pre-project fuel used | Enum | - | Survey | Yes |
| `baseline_fuel_consumption` | Baseline fuel use per household | Decimal | kg/L/month | Survey | Yes |
| `baseline_lighting_type` | Pre-project lighting | Enum | - | Survey | Conditional |
| `baseline_lighting_consumption` | Baseline lighting fuel use | Decimal | L/month | Survey | Conditional |
| `baseline_ef` | Baseline fuel emission factor | Decimal | tCO2e/unit | Default | Yes |
| `grid_access_pre_project` | Grid access availability | Boolean | - | Survey | Yes |

#### Monitoring Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `metered_generation` | Actual electricity generated | Decimal | kWh | Smart Meter | Yes |
| `metered_consumption` | Actual electricity consumed | Decimal | kWh | Smart Meter | Yes |
| `usage_hours_per_day` | Average daily usage | Decimal | hours | Meter/Log | Yes |
| `days_operational` | Days system operational | Integer | days | Records | Yes |
| `household_count` | Number of beneficiary households | Integer | count | Records | Yes |
| `household_size` | Average household size | Decimal | persons | Survey | Yes |

#### Suppressed Demand Parameters (if applicable)

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `tier_level` | Energy access tier achieved | Integer | 1-5 | Assessment | Conditional |
| `suppressed_demand_factor` | Suppressed demand adjustment | Decimal | multiplier | Standard | Conditional |
| `reference_consumption` | Tier reference consumption | Decimal | kWh/person/year | Standard | Conditional |

### 3.4 Clean Cooking (E3) Input Parameters

#### Stove/System Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `stove_type` | Cookstove technology type | Enum | - | Design | Yes |
| `stove_model` | Specific stove model | String | - | Design | Yes |
| `stove_efficiency` | Certified stove efficiency | Decimal | % | Testing | Yes |
| `baseline_stove_efficiency` | Baseline stove efficiency | Decimal | % | Default/Survey | Yes |
| `number_of_stoves` | Total stoves distributed | Integer | count | Records | Yes |
| `distribution_date` | Stove distribution date | Date | YYYY-MM-DD | Records | Yes |

#### Baseline Fuel Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `baseline_fuel_type` | Primary baseline fuel | Enum | - | Survey | Yes |
| `baseline_fuel_ncv` | Net calorific value | Decimal | MJ/kg | Default | Yes |
| `baseline_fuel_ef` | Emission factor | Decimal | tCO2e/TJ | Default | Yes |
| `baseline_annual_consumption` | Annual fuel use per household | Decimal | kg/year | Survey | Yes |
| `fraction_non_renewable` | Non-renewable biomass fraction | Decimal | 0-1 | Assessment | Yes |
| `wood_density` | Density of wood fuel | Decimal | kg/m³ | Default | Conditional |

#### Monitoring Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `usage_rate` | Stove usage rate | Decimal | 0-1 | Monitoring | Yes |
| `performance_factor` | Actual performance factor | Decimal | multiplier | Testing | Yes |
| `survey_sample_size` | Number of households surveyed | Integer | count | Records | Yes |
| `survey_method` | Survey methodology | Enum | - | Protocol | Yes |
| `stove_retention_rate` | Stoves still in use | Decimal | 0-1 | Survey | Yes |
| `fuel_consumption_measured` | Measured fuel use | Decimal | kg/household | Survey | Conditional |

#### Adjustment Factors

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `kitchen_efficiency_factor` | Kitchen efficiency adjustment | Decimal | 0-1 | Default | Yes |
| `charcoal_production_factor` | Charcoal production emissions | Decimal | multiplier | Default | Conditional |
| `stacking_factor` | Fuel stacking adjustment | Decimal | 0-1 | Survey | Yes |
| `rebound_effect_factor` | Rebound effect adjustment | Decimal | 0-1 | Analysis | Conditional |

### 3.5 Energy Efficiency (E4) Input Parameters

#### Baseline Equipment Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `baseline_equipment_type` | Equipment being replaced | Enum | - | Audit | Yes |
| `baseline_capacity` | Baseline equipment capacity | Decimal | kW/ton/etc | Design | Yes |
| `baseline_efficiency` | Baseline equipment efficiency | Decimal | % | Rating | Yes |
| `baseline_energy_consumption` | Baseline energy use | Decimal | kWh/year | Audit | Yes |
| `baseline_operating_hours` | Annual operating hours | Integer | hours/year | Records | Yes |
| `baseline_load_factor` | Average load factor | Decimal | 0-1 | Audit | Yes |

#### Project Equipment Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `project_equipment_type` | New equipment type | Enum | - | Design | Yes |
| `project_efficiency` | New equipment efficiency | Decimal | % | Rating | Yes |
| `project_capacity` | New equipment capacity | Decimal | kW/ton/etc | Design | Yes |
| `installation_date` | Equipment installation date | Date | YYYY-MM-DD | Records | Yes |
| `expected_lifetime` | Equipment lifetime | Integer | years | Manufacturer | Yes |

#### Metered Savings Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `metered_consumption_pre` | Pre-retrofit consumption | Decimal | kWh | Meter | Conditional |
| `metered_consumption_post` | Post-retrofit consumption | Decimal | kWh | Meter | Conditional |
| `metering_period_days` | Duration of metering | Integer | days | Records | Conditional |
| `weather_normalization` | Weather adjustment applied | Boolean | - | Analysis | Conditional |
| `degree_days_heating` | Heating degree days | Integer | HDD | Weather | Conditional |
| `degree_days_cooling` | Cooling degree days | Integer | CDD | Weather | Conditional |

#### Ex-Ante Engineering Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `engineering_estimate` | Calculated energy savings | Decimal | kWh/year | Calculation | Conditional |
| `calculation_methodology` | Engineering calculation method | Enum | - | Protocol | Conditional |
| `savings_uncertainty` | Uncertainty in estimate | Decimal | % | Analysis | Conditional |
| `measurement_verification_protocol` | M&V protocol used | Enum | - | Standard | Yes |

### 3.6 Landfill Gas (W1) Input Parameters

#### Landfill Characteristics

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `landfill_type` | Type of landfill | Enum | - | Design | Yes |
| `landfill_area` | Total landfill area | Decimal | hectares | Survey | Yes |
| `waste_in_place` | Total waste in place | Decimal | tonnes | Records | Yes |
| `annual_waste_input` | Annual waste received | Decimal | tonnes/year | Records | Yes |
| `waste_acceptance_start` | Date waste acceptance began | Date | YYYY-MM-DD | Records | Yes |
| `waste_composition` | Waste composition breakdown | Object | % by type | Analysis | Yes |
| `organic_fraction` | Degradable organic carbon | Decimal | 0-1 | Analysis | Yes |

#### Gas Collection System

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `collection_system_type` | Extraction system type | Enum | - | Design | Yes |
| `number_of_wells` | Extraction wells installed | Integer | count | Design | Yes |
| `well_spacing` | Distance between wells | Decimal | meters | Design | Yes |
| `collection_efficiency` | System collection efficiency | Decimal | 0-1 | Testing | Yes |
| `system_installation_date` | Collection system date | Date | YYYY-MM-DD | Records | Yes |

#### Gas Flow and Composition

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `gas_flow_rate` | Landfill gas flow rate | Decimal | m³/hour | Flow Meter | Yes |
| `methane_content` | CH4 percentage in gas | Decimal | % | Analyzer | Yes |
| `co2_content` | CO2 percentage in gas | Decimal | % | Analyzer | Yes |
| `oxygen_content` | O2 percentage in gas | Decimal | % | Analyzer | Yes |
| `gas_temperature` | Gas temperature | Decimal | °C | Sensor | Yes |
| `gas_pressure` | Gas pressure | Decimal | kPa | Sensor | Yes |
| `meter_calibration_date` | Flow meter calibration | Date | YYYY-MM-DD | Certificate | Yes |

#### Destruction/Utilization

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `destruction_method` | Flare, engine, or other | Enum | - | Design | Yes |
| `destruction_efficiency` | Methane destruction efficiency | Decimal | 0-1 | Manufacturer | Yes |
| `flare_operating_hours` | Hours flare operational | Integer | hours | Records | Yes |
| `engine_operating_hours` | Hours engine operational | Integer | hours | Records | Conditional |
| `electricity_generated` | Power from LFG | Decimal | MWh | Meter | Conditional |
| `engine_efficiency` | Generation efficiency | Decimal | % | Manufacturer | Conditional |

#### Methane Generation Model

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `methane_generation_rate` | L0 value from FOD model | Decimal | m³ CH4/tonne | IPCC/Default | Yes |
| `decay_rate` | Decay rate constant (k) | Decimal | 1/year | IPCC/Default | Yes |
| `model_type` | First order decay or other | Enum | - | Standard | Yes |
| `baseline_capture_status` | Pre-project capture status | Enum | - | Records | Yes |

### 3.7 Wastewater Methane (W2) Input Parameters

#### Treatment Plant Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `plant_type` | Municipal or industrial | Enum | - | Design | Yes |
| `treatment_capacity` | Design treatment capacity | Decimal | m³/day | Design | Yes |
| `treatment_process` | Treatment process type | Enum | - | Design | Yes |
| `plant_upgrade_date` | Upgrade completion date | Date | YYYY-MM-DD | Records | Yes |

#### Influent Characteristics

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `influent_flow_rate` | Wastewater inflow | Decimal | m³/day | Flow Meter | Yes |
| `influent_cod` | Chemical oxygen demand | Decimal | kg COD/m³ | Lab Analysis | Yes |
| `influent_bod` | Biochemical oxygen demand | Decimal | kg BOD/m³ | Lab Analysis | Conditional |
| `total_organic_load` | Total COD load | Decimal | kg COD/year | Calculated | Yes |
| `wastewater_temperature` | Average temperature | Decimal | °C | Sensor | Yes |
| `wastewater_ph` | Average pH | Decimal | pH units | Sensor | Yes |

#### Methane Generation Parameters

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `methane_producing_capacity` | B0 or MCF value | Decimal | kg CH4/kg COD | IPCC/Default | Yes |
| `methane_correction_factor` | MCF for treatment type | Decimal | 0-1 | IPCC/Default | Yes |
| `baseline_treatment_type` | Pre-project treatment | Enum | - | Records | Yes |
| `baseline_mcf` | Baseline methane correction | Decimal | 0-1 | IPCC/Default | Yes |

#### Capture and Destruction

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `biogas_capture_rate` | Biogas captured | Decimal | m³/day | Flow Meter | Conditional |
| `biogas_methane_content` | CH4 in biogas | Decimal | % | Analyzer | Conditional |
| `destruction_efficiency` | Destruction efficiency | Decimal | 0-1 | Manufacturer | Conditional |
| `captured_biogas_utilized` | Biogas used beneficially | Decimal | m³ | Meter | Conditional |

### 3.8 Organic Waste (W3) Input Parameters

#### Waste Stream Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `waste_type` | Type of organic waste | Enum | - | Records | Yes |
| `waste_quantity_processed` | Total waste processed | Decimal | tonnes | Weighbridge | Yes |
| `waste_source` | Origin of waste | Enum | - | Records | Yes |
| `waste_moisture_content` | Moisture percentage | Decimal | % | Lab Analysis | Yes |
| `waste_dry_matter` | Dry matter content | Decimal | % | Calculated | Yes |
| `degradable_organic_carbon` | DOC in waste | Decimal | % | Analysis | Yes |

#### Baseline Scenario

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `baseline_disposal_method` | Counterfactual disposal | Enum | - | Assessment | Yes |
| `baseline_landfill_type` | Landfill type | Enum | - | Assessment | Conditional |
| `baseline_mcf` | Baseline methane correction | Decimal | 0-1 | IPCC/Default | Conditional |
| `baseline_capture_efficiency` | Baseline gas capture | Decimal | 0-1 | Assessment | Conditional |
| `transport_distance` | Distance to landfill | Decimal | km | Records | Conditional |
| `transport_emissions` | Transport emissions factor | Decimal | tCO2e/tonne-km | Default | Conditional |

#### Treatment Process Data

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `treatment_type` | Composting/digestion/etc | Enum | - | Design | Yes |
| `treatment_capacity` | Process capacity | Decimal | tonnes/day | Design | Yes |
| `composting_method` | Composting technology | Enum | - | Design | Conditional |
| `digestion_type` | Anaerobic digester type | Enum | - | Design | Conditional |
| `process_temperature` | Operating temperature | Decimal | °C | Sensor | Conditional |
| `retention_time` | Process retention time | Integer | days | Design | Conditional |

#### Emissions from Treatment

| Parameter | Description | Data Type | Units | Source | Required |
|-----------|-------------|-----------|-------|--------|----------|
| `process_ch4_emissions` | Methane from treatment | Decimal | tonnes CH4 | Measurement | Yes |
| `process_n2o_emissions` | N2O from treatment | Decimal | tonnes N2O | Measurement | Conditional |
| `process_co2_emissions` | Fossil CO2 from treatment | Decimal | tonnes CO2 | Calculated | Conditional |
| `energy_consumption` | Electricity/fuel use | Decimal | kWh or L | Meter | Yes |
| `compost_produced` | Quantity of compost output | Decimal | tonnes | Weighbridge | Conditional |
| `digestate_produced` | Quantity of digestate | Decimal | tonnes | Weighbridge | Conditional |

---


## 4. Calculation Algorithms

### 4.1 Common Calculation Framework

All methodologies follow a consistent calculation structure:

```
Net Emission Reductions = Baseline Emissions - Project Emissions - Leakage
```

Where:
- **Baseline Emissions (BE)**: Emissions that would occur in the absence of the project
- **Project Emissions (PE)**: Emissions resulting from project implementation
- **Leakage (L)**: Emissions occurring outside project boundary due to project

### 4.2 Grid Renewables (E1) Calculation Algorithm

#### Step 1: Calculate Net Electricity Generation

```
Net Generation (MWh) = Gross Generation - Auxiliary Consumption
                    = Meter Reading End - Meter Reading Start - Auxiliary Consumption
```

**Validation:** Net Generation must be ≥ 0 and ≤ Plant Capacity × Hours × Capacity Factor

#### Step 2: Calculate Combined Margin Emission Factor

```
Combined Margin EF (tCO2e/MWh) = (OM Weight × Operating Margin EF) + (BM Weight × Build Margin EF)

Standard weights (CDM/VCS):
- Wind, solar, geothermal, ocean: OM = 0.75, BM = 0.25
- Hydro, biomass: OM = 0.50, BM = 0.50
```

#### Step 3: Calculate Baseline Emissions

```
Baseline Emissions (tCO2e) = Net Generation (MWh) × Combined Margin EF (tCO2e/MWh)
```

#### Step 4: Calculate Project Emissions

```
Project Emissions (tCO2e) = Backup Fuel Emissions + SF6 Emissions (if applicable)

Backup Fuel Emissions = Backup Fuel Consumption (L) × Backup Fuel EF (tCO2e/L)
SF6 Emissions = SF6 Mass Emitted (kg) × GWP_SF6
```

#### Step 5: Calculate Net Emission Reductions

```
Net Emission Reductions (tCO2e) = Baseline Emissions - Project Emissions
```

#### Step 6: Calculate Credits (Vintage Adjusted)

```
Credits Issued (tCO2e) = Net Emission Reductions × (1 - Buffer Contribution Rate)
```

**Algorithm Pseudocode:**
```python
def calculate_grid_renewables(params):
    # Step 1: Net Generation
    net_generation = params.gross_generation - params.auxiliary_consumption
    
    # Validate against meter readings
    metered_generation = params.meter_reading_end - params.meter_reading_start
    if abs(net_generation - metered_generation) > 0.01 * metered_generation:
        raise ValidationError("Generation discrepancy exceeds 1%")
    
    # Step 2: Combined Margin
    combined_margin = (params.om_weighting * params.grid_ef_operating_margin + 
                       params.bm_weighting * params.grid_ef_build_margin)
    
    # Step 3: Baseline Emissions
    baseline_emissions = net_generation * combined_margin
    
    # Step 4: Project Emissions
    project_emissions = 0
    if params.backup_fuel_consumption > 0:
        project_emissions += params.backup_fuel_consumption * params.backup_fuel_ef
    if params.sf6_emissions > 0:
        project_emissions += params.sf6_emissions * 22800  # GWP of SF6
    
    # Step 5: Net Reductions
    net_reductions = baseline_emissions - project_emissions
    
    # Step 6: Credits
    buffer_rate = get_buffer_rate(params.project_type)
    credits = net_reductions * (1 - buffer_rate)
    
    return {
        'net_generation_mwh': net_generation,
        'combined_margin_ef': combined_margin,
        'baseline_emissions_tco2e': baseline_emissions,
        'project_emissions_tco2e': project_emissions,
        'net_reductions_tco2e': net_reductions,
        'credits_issued_tco2e': credits
    }
```

### 4.3 Distributed Energy (E2) Calculation Algorithm

#### Step 1: Calculate Baseline Energy Consumption

For households with baseline fuel use:
```
Baseline Energy (kWh/year) = Σ(Baseline Fuel Consumption × Fuel NCV × Conversion Factor)
```

For suppressed demand scenarios:
```
Baseline Energy (kWh/year) = Reference Consumption × Household Size × Household Count
```

#### Step 2: Calculate Project Energy Generation

```
Project Energy (kWh/year) = Σ(Metered Generation per System × Usage Rate × Days Operational / 365)
```

#### Step 3: Calculate Energy Savings

```
Energy Savings (kWh/year) = MIN(Baseline Energy, Project Energy)
```

#### Step 4: Calculate Baseline Emissions

```
Baseline Emissions (tCO2e/year) = Baseline Fuel Consumption × Baseline Fuel EF
```

#### Step 5: Calculate Project Emissions

```
Project Emissions (tCO2e/year) = Project Energy × Grid EF (if grid backup) + Battery Replacement Emissions
```

#### Step 6: Calculate Net Emission Reductions

```
Net Reductions (tCO2e/year) = Baseline Emissions - Project Emissions
```

**Algorithm Pseudocode:**
```python
def calculate_distributed_energy(params):
    # Step 1: Baseline Energy
    if params.suppressed_demand:
        baseline_energy = (params.reference_consumption * 
                          params.household_size * 
                          params.household_count)
    else:
        baseline_energy = sum(
            fuel.consumption * fuel.ncv * 0.2778  # Convert to kWh
            for fuel in params.baseline_fuels
        )
    
    # Step 2: Project Energy
    project_energy = (params.metered_generation * 
                     params.usage_rate * 
                     params.days_operational / 365)
    
    # Step 3: Energy Savings (capped at baseline)
    energy_savings = min(baseline_energy, project_energy)
    
    # Step 4: Baseline Emissions
    baseline_emissions = sum(
        fuel.consumption * fuel.emission_factor
        for fuel in params.baseline_fuels
    )
    
    # Step 5: Project Emissions
    project_emissions = 0
    if params.grid_backup:
        project_emissions += project_energy * params.grid_emission_factor
    # Add battery replacement emissions if applicable
    
    # Step 6: Net Reductions
    net_reductions = baseline_emissions - project_emissions
    
    return {
        'baseline_energy_kwh': baseline_energy,
        'project_energy_kwh': project_energy,
        'energy_savings_kwh': energy_savings,
        'baseline_emissions_tco2e': baseline_emissions,
        'project_emissions_tco2e': project_emissions,
        'net_reductions_tco2e': net_reductions
    }
```

### 4.4 Clean Cooking (E3) Calculation Algorithm

#### Step 1: Calculate Baseline Fuel Consumption

```
Baseline Fuel (kg/year) = Baseline Annual Consumption per Household × Number of Households
```

#### Step 2: Apply Usage and Performance Adjustments

```
Adjusted Baseline Fuel (kg/year) = Baseline Fuel × Usage Rate × Performance Factor
```

#### Step 3: Calculate Baseline Emissions

```
Baseline Emissions (tCO2e/year) = Adjusted Baseline Fuel × NCV × EF × Fraction Non-Renewable

Where:
- NCV = Net Calorific Value (TJ/tonne)
- EF = Emission Factor (tCO2e/TJ)
- Fraction Non-Renewable = Fraction of biomass from non-renewable sources
```

#### Step 4: Calculate Project Fuel Consumption

```
Project Fuel (kg/year) = Baseline Fuel × (Baseline Efficiency / Project Efficiency) × Stacking Factor
```

#### Step 5: Calculate Project Emissions

```
Project Emissions (tCO2e/year) = Project Fuel × NCV × EF (for project fuel type)
```

#### Step 6: Calculate Net Emission Reductions

```
Net Reductions (tCO2e/year) = Baseline Emissions - Project Emissions
```

#### Step 7: Apply Rebound Effect Adjustment (if applicable)

```
Final Reductions (tCO2e/year) = Net Reductions × (1 - Rebound Effect Factor)
```

**Algorithm Pseudocode:**
```python
def calculate_clean_cooking(params):
    # Step 1: Baseline Fuel
    baseline_fuel = params.baseline_annual_consumption * params.number_of_stoves
    
    # Step 2: Adjusted Baseline
    adjusted_baseline = (baseline_fuel * 
                        params.usage_rate * 
                        params.performance_factor)
    
    # Step 3: Baseline Emissions
    baseline_emissions = (adjusted_baseline * 
                         params.baseline_fuel_ncv / 1000 *  # Convert to TJ
                         params.baseline_fuel_ef * 
                         params.fraction_non_renewable)
    
    # Step 4: Project Fuel
    project_fuel = (baseline_fuel * 
                   (params.baseline_stove_efficiency / params.stove_efficiency) * 
                   params.stacking_factor)
    
    # Step 5: Project Emissions
    project_emissions = (project_fuel * 
                        params.project_fuel_ncv / 1000 * 
                        params.project_fuel_ef)
    
    # Step 6: Net Reductions
    net_reductions = baseline_emissions - project_emissions
    
    # Step 7: Rebound adjustment
    final_reductions = net_reductions * (1 - params.rebound_effect_factor)
    
    return {
        'baseline_fuel_kg': baseline_fuel,
        'adjusted_baseline_kg': adjusted_baseline,
        'baseline_emissions_tco2e': baseline_emissions,
        'project_fuel_kg': project_fuel,
        'project_emissions_tco2e': project_emissions,
        'net_reductions_tco2e': net_reductions,
        'final_reductions_tco2e': final_reductions
    }
```

### 4.5 Energy Efficiency (E4) Calculation Algorithm

#### Step 1: Calculate Baseline Energy Consumption

```
Baseline Energy (kWh/year) = Baseline Capacity × Operating Hours × Load Factor / Baseline Efficiency
```

#### Step 2: Calculate Project Energy Consumption

**For metered savings approach:**
```
Project Energy (kWh/year) = Metered Consumption Post × (365 / Metering Period Days)
```

**For ex-ante engineering approach:**
```
Project Energy (kWh/year) = Baseline Energy × (Project Efficiency / Baseline Efficiency)
```

#### Step 3: Calculate Energy Savings

```
Energy Savings (kWh/year) = Baseline Energy - Project Energy
```

#### Step 4: Apply Weather Normalization (if applicable)

```
Normalized Savings (kWh/year) = Energy Savings × (Normal HDD/Actual HDD) for heating
                              = Energy Savings × (Normal CDD/Actual CDD) for cooling
```

#### Step 5: Calculate Baseline Emissions

```
Baseline Emissions (tCO2e/year) = Baseline Energy × Grid Emission Factor
```

#### Step 6: Calculate Project Emissions

```
Project Emissions (tCO2e/year) = Project Energy × Grid Emission Factor
```

#### Step 7: Calculate Net Emission Reductions

```
Net Reductions (tCO2e/year) = (Energy Savings × Grid Emission Factor) - Project Emissions
```

**Algorithm Pseudocode:**
```python
def calculate_energy_efficiency(params):
    # Step 1: Baseline Energy
    baseline_energy = (params.baseline_capacity * 
                      params.baseline_operating_hours * 
                      params.baseline_load_factor / 
                      params.baseline_efficiency)
    
    # Step 2: Project Energy
    if params.calculation_approach == 'metered':
        project_energy = (params.metered_consumption_post * 
                         (365 / params.metering_period_days))
    else:  # ex-ante
        project_energy = baseline_energy * (params.project_efficiency / params.baseline_efficiency)
    
    # Step 3: Energy Savings
    energy_savings = baseline_energy - project_energy
    
    # Step 4: Weather Normalization
    if params.weather_normalization:
        if params.heating_application:
            energy_savings *= (params.normal_hdd / params.actual_hdd)
        elif params.cooling_application:
            energy_savings *= (params.normal_cdd / params.actual_cdd)
    
    # Step 5 & 6: Emissions
    baseline_emissions = baseline_energy * params.grid_emission_factor
    project_emissions = project_energy * params.grid_emission_factor
    
    # Step 7: Net Reductions
    net_reductions = (energy_savings * params.grid_emission_factor) - project_emissions
    
    return {
        'baseline_energy_kwh': baseline_energy,
        'project_energy_kwh': project_energy,
        'energy_savings_kwh': energy_savings,
        'baseline_emissions_tco2e': baseline_emissions,
        'project_emissions_tco2e': project_emissions,
        'net_reductions_tco2e': net_reductions
    }
```

### 4.6 Landfill Gas (W1) Calculation Algorithm

#### Step 1: Calculate Methane Generation Potential (First Order Decay Model)

```
Methane Generation (m³ CH4/year) = Σ[MCF × DOC × DOCf × F × (Waste Input) × e^(-k(t-x)) × (1 - e^(-k))]

Where:
- MCF = Methane correction factor
- DOC = Degradable organic carbon (tonne C/tonne waste)
- DOCf = Fraction of DOC dissimilated (default 0.5)
- F = Fraction of CH4 in landfill gas (default 0.5)
- k = Decay rate (1/year)
- t = Current year
- x = Year of waste input
```

#### Step 2: Calculate Baseline Methane Emissions

```
Baseline CH4 Emissions (tonnes CH4/year) = Methane Generation × (1 - Baseline Capture Efficiency)
```

#### Step 3: Calculate Captured Methane

```
Captured CH4 (tonnes CH4/year) = Gas Flow Rate × Methane Content × Hours × Density

Where:
- Density of CH4 at STP = 0.716 kg/m³
```

#### Step 4: Calculate Destroyed Methane

```
Destroyed CH4 (tonnes CH4/year) = Captured CH4 × Destruction Efficiency
```

#### Step 5: Calculate Baseline Emissions (CO2e)

```
Baseline Emissions (tCO2e/year) = Baseline CH4 Emissions × GWP_CH4
```

#### Step 6: Calculate Project Emissions

```
Project Emissions (tCO2e/year) = Residual CH4 Emissions + Energy Generation Emissions

Residual CH4 = Captured CH4 × (1 - Destruction Efficiency)
Energy Generation Emissions = Electricity Generated × Grid EF (if applicable)
```

#### Step 7: Calculate Net Emission Reductions

```
Net Reductions (tCO2e/year) = Baseline Emissions - Project Emissions
```

**Algorithm Pseudocode:**
```python
def calculate_landfill_gas(params):
    # Step 1: Methane Generation (FOD model)
    methane_generation = 0
    for year_input in params.waste_inputs:
        years_degraded = params.current_year - year_input.year
        methane_generation += (params.mcf * params.doc * 0.5 * 0.5 * 
                              year_input.quantity * 
                              math.exp(-params.decay_rate * years_degraded) * 
                              (1 - math.exp(-params.decay_rate)))
    
    # Step 2: Baseline Methane
    baseline_ch4 = methane_generation * (1 - params.baseline_capture_efficiency)
    
    # Step 3: Captured Methane
    captured_ch4 = (params.gas_flow_rate * params.methane_content / 100 * 
                   params.operating_hours * 0.716 / 1000)  # Convert to tonnes
    
    # Step 4: Destroyed Methane
    destroyed_ch4 = captured_ch4 * params.destruction_efficiency
    
    # Step 5: Baseline Emissions
    baseline_emissions = baseline_ch4 * 28  # GWP of CH4
    
    # Step 6: Project Emissions
    residual_ch4 = captured_ch4 * (1 - params.destruction_efficiency)
    energy_emissions = 0
    if params.electricity_generated > 0:
        energy_emissions = params.electricity_generated * params.grid_ef
    
    project_emissions = residual_ch4 * 28 + energy_emissions
    
    # Step 7: Net Reductions
    net_reductions = baseline_emissions - project_emissions
    
    return {
        'methane_generation_tonnes': methane_generation,
        'baseline_ch4_tonnes': baseline_ch4,
        'captured_ch4_tonnes': captured_ch4,
        'destroyed_ch4_tonnes': destroyed_ch4,
        'baseline_emissions_tco2e': baseline_emissions,
        'project_emissions_tco2e': project_emissions,
        'net_reductions_tco2e': net_reductions
    }
```

### 4.7 Wastewater Methane (W2) Calculation Algorithm

#### Step 1: Calculate Organic Load

```
Organic Load (kg COD/year) = Influent Flow Rate × Influent COD × Operating Days
```

#### Step 2: Calculate Baseline Methane Emissions

```
Baseline CH4 Emissions (tonnes CH4/year) = Organic Load × B0 × Baseline MCF

Where:
- B0 = Methane producing capacity (kg CH4/kg COD)
- MCF = Methane correction factor
```

#### Step 3: Calculate Project Methane Emissions

```
Project CH4 Emissions (tonnes CH4/year) = Organic Load × B0 × Project MCF × (1 - Capture Efficiency)
```

#### Step 4: Calculate Captured and Destroyed Methane

```
Captured CH4 (tonnes CH4/year) = Biogas Capture Rate × Methane Content × Operating Days × Density
Destroyed CH4 (tonnes CH4/year) = Captured CH4 × Destruction Efficiency
```

#### Step 5: Calculate Baseline Emissions (CO2e)

```
Baseline Emissions (tCO2e/year) = Baseline CH4 Emissions × GWP_CH4
```

#### Step 6: Calculate Project Emissions

```
Project Emissions (tCO2e/year) = (Project CH4 Emissions × GWP_CH4) + Energy Emissions
```

#### Step 7: Calculate Net Emission Reductions

```
Net Reductions (tCO2e/year) = Baseline Emissions - Project Emissions
```

**Algorithm Pseudocode:**
```python
def calculate_wastewater_methane(params):
    # Step 1: Organic Load
    organic_load = (params.influent_flow_rate * 
                   params.influent_cod * 
                   params.operating_days)
    
    # Step 2: Baseline Methane
    baseline_ch4 = organic_load * params.methane_producing_capacity * params.baseline_mcf / 1000
    
    # Step 3: Project Methane
    project_ch4 = (organic_load * params.methane_producing_capacity * 
                  params.project_mcf * (1 - params.capture_efficiency) / 1000)
    
    # Step 4: Captured and Destroyed
    captured_ch4 = (params.biogas_capture_rate * params.biogas_methane_content / 100 * 
                   params.operating_days * 0.716 / 1000)
    destroyed_ch4 = captured_ch4 * params.destruction_efficiency
    
    # Step 5: Baseline Emissions
    baseline_emissions = baseline_ch4 * 28
    
    # Step 6: Project Emissions
    energy_emissions = params.energy_consumption * params.grid_ef
    project_emissions = project_ch4 * 28 + energy_emissions
    
    # Step 7: Net Reductions
    net_reductions = baseline_emissions - project_emissions
    
    return {
        'organic_load_kg_cod': organic_load,
        'baseline_ch4_tonnes': baseline_ch4,
        'project_ch4_tonnes': project_ch4,
        'captured_ch4_tonnes': captured_ch4,
        'destroyed_ch4_tonnes': destroyed_ch4,
        'baseline_emissions_tco2e': baseline_emissions,
        'project_emissions_tco2e': project_emissions,
        'net_reductions_tco2e': net_reductions
    }
```

### 4.8 Organic Waste (W3) Calculation Algorithm

#### Step 1: Calculate Baseline Emissions

```
Baseline Emissions (tCO2e/year) = Landfill Methane + Transport Emissions

Landfill Methethane = Waste Quantity × DOC × DOCf × F × MCF × (1 - OX) × (1 - Capture Efficiency) × 16/12 × GWP_CH4

Transport Emissions = Waste Quantity × Transport Distance × Transport EF

Where:
- DOC = Degradable organic carbon
- DOCf = Fraction of DOC dissimilated
- F = Fraction of CH4 in landfill gas
- MCF = Methane correction factor
- OX = Oxidation factor
- 16/12 = Molecular weight ratio CH4/C
```

#### Step 2: Calculate Project Emissions

```
Project Emissions (tCO2e/year) = Process CH4 + Process N2O + Process CO2 + Energy Emissions

Process CH4 = Waste Quantity × CH4 Emission Factor
Process N2O = Waste Quantity × N2O Emission Factor × GWP_N2O
Process CO2 = Waste Quantity × Fossil CO2 Factor
Energy Emissions = Electricity Use × Grid EF + Fuel Use × Fuel EF
```

#### Step 3: Calculate Emission Reductions

```
Net Reductions (tCO2e/year) = Baseline Emissions - Project Emissions
```

#### Step 4: Apply Uncertainty Deduction

```
Final Reductions (tCO2e/year) = Net Reductions × (1 - Uncertainty Factor)
```

**Algorithm Pseudocode:**
```python
def calculate_organic_waste(params):
    # Step 1: Baseline Emissions
    landfill_methane = (params.waste_quantity * 
                       params.degradable_organic_carbon / 100 * 
                       0.5 * 0.5 * params.baseline_mcf * 
                       (1 - params.oxidation_factor) * 
                       (1 - params.baseline_capture_efficiency) * 
                       16/12 * 28)
    
    transport_emissions = (params.waste_quantity * 
                          params.transport_distance * 
                          params.transport_emissions_factor)
    
    baseline_emissions = landfill_methane + transport_emissions
    
    # Step 2: Project Emissions
    process_ch4 = params.waste_quantity * params.process_ch4_ef
    process_n2o = params.waste_quantity * params.process_n2o_ef * 265
    process_co2 = params.waste_quantity * params.process_co2_ef
    
    energy_emissions = (params.energy_consumption * params.grid_ef + 
                       params.fuel_consumption * params.fuel_ef)
    
    project_emissions = process_ch4 + process_n2o + process_co2 + energy_emissions
    
    # Step 3: Net Reductions
    net_reductions = baseline_emissions - project_emissions
    
    # Step 4: Uncertainty
    final_reductions = net_reductions * (1 - params.uncertainty_factor)
    
    return {
        'landfill_methane_tco2e': landfill_methane,
        'transport_emissions_tco2e': transport_emissions,
        'baseline_emissions_tco2e': baseline_emissions,
        'process_ch4_tco2e': process_ch4,
        'process_n2o_tco2e': process_n2o,
        'process_co2_tco2e': process_co2,
        'energy_emissions_tco2e': energy_emissions,
        'project_emissions_tco2e': project_emissions,
        'net_reductions_tco2e': net_reductions,
        'final_reductions_tco2e': final_reductions
    }
```

---


## 5. Validation Rules

### 5.1 Common Validation Rules (All Methodologies)

#### Date Validation

| Rule | Description | Severity | Error Message |
|------|-------------|----------|---------------|
| `DATE-001` | Monitoring period start must be before end | Critical | "Monitoring period start date must precede end date" |
| `DATE-002` | Monitoring period cannot exceed 24 months | Warning | "Monitoring period exceeds recommended 24-month maximum" |
| `DATE-003` | Monitoring period must not be in the future | Critical | "Monitoring period cannot include future dates" |
| `DATE-004` | Monitoring period must not overlap with previous periods | Critical | "Monitoring period overlaps with existing period" |

#### Geographic Validation

| Rule | Description | Severity | Error Message |
|------|-------------|----------|---------------|
| `GEO-001` | Project location must be valid coordinates | Critical | "Invalid geographic coordinates" |
| `GEO-002` | Project location must be within eligible region | Critical | "Project location outside eligible region for methodology" |

#### Additionality Validation

| Rule | Description | Severity | Error Message |
|------|-------------|----------|---------------|
| `ADD-001` | Additionality demonstration must be provided | Critical | "Additionality demonstration required" |
| `ADD-002` | Financial additionality test must pass | Critical | "Project fails financial additionality test" |
| `ADD-003` | Regulatory surplus must be demonstrated | Critical | "Project fails regulatory additionality test" |

### 5.2 Grid Renewables (E1) Validation Rules

#### Energy Generation Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E1-001` | `net_generation` | ≥ 0 MWh | Critical | "Net generation cannot be negative" |
| `E1-002` | `net_generation` | ≤ `plant_capacity` × `hours` × 1.2 | Warning | "Net generation exceeds theoretical maximum by >20%" |
| `E1-003` | `capacity_factor` | 0-100% | Critical | "Capacity factor must be between 0% and 100%" |
| `E1-004` | `capacity_factor` | ≤ 60% for solar, ≤ 50% for wind | Warning | "Capacity factor exceeds typical maximum for technology" |
| `E1-005` | `auxiliary_consumption` | ≤ 15% of `gross_generation` | Warning | "Auxiliary consumption exceeds 15% of gross generation" |

#### Meter Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E1-010` | `meter_calibration_date` | Within 2 years of monitoring end | Critical | "Meter calibration expired (>2 years)" |
| `E1-011` | `meter_reading_end` | > `meter_reading_start` | Critical | "Meter reading end must exceed start" |
| `E1-012` | Meter discrepancy | ≤ 1% difference | Warning | "Meter reading discrepancy exceeds 1%" |

#### Emission Factor Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E1-020` | `grid_ef_operating_margin` | 0-2.0 tCO2e/MWh | Critical | "Operating margin emission factor outside valid range" |
| `E1-021` | `grid_ef_build_margin` | 0-2.0 tCO2e/MWh | Critical | "Build margin emission factor outside valid range" |
| `E1-022` | `om_weighting` + `bm_weighting` | = 1.0 | Critical | "OM and BM weights must sum to 1.0" |

### 5.3 Distributed Energy (E2) Validation Rules

#### System Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E2-001` | `number_of_systems` | ≥ 1 | Critical | "At least one system required" |
| `E2-002` | `system_capacity` | 0.1-1000 kW | Critical | "System capacity outside valid range (0.1-1000 kW)" |
| `E2-003` | `deployment_date` | Within 5 years of monitoring | Warning | "System deployment >5 years before monitoring" |

#### Baseline Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E2-010` | `baseline_fuel_consumption` | ≥ 0 | Critical | "Baseline fuel consumption cannot be negative" |
| `E2-011` | `baseline_annual_consumption` | 50-5000 kWh equivalent | Warning | "Baseline consumption outside typical range" |
| `E2-012` | `survey_sample_size` | ≥ 30 or 10% of population | Warning | "Survey sample size below recommended minimum" |

#### Monitoring Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E2-020` | `usage_rate` | 0.1-1.0 | Critical | "Usage rate must be between 10% and 100%" |
| `E2-021` | `stove_retention_rate` | 0.5-1.0 | Warning | "Retention rate below 50% indicates data quality issue" |
| `E2-022` | `days_operational` | ≤ Monitoring period days | Critical | "Days operational cannot exceed monitoring period" |

### 5.4 Clean Cooking (E3) Validation Rules

#### Stove Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E3-001` | `stove_efficiency` | 10-90% | Critical | "Stove efficiency outside valid range" |
| `E3-002` | `stove_efficiency` | > `baseline_stove_efficiency` | Critical | "Project stove efficiency must exceed baseline" |
| `E3-003` | `number_of_stoves` | ≥ 1 | Critical | "At least one stove required" |
| `E3-004` | `stove_retention_rate` | 0.3-1.0 | Warning | "Retention rate outside expected range" |

#### Fuel Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E3-010` | `baseline_fuel_ncv` | 10-45 MJ/kg | Critical | "NCV outside valid range for fuel type" |
| `E3-011` | `fraction_non_renewable` | 0-1.0 | Critical | "Non-renewable fraction must be between 0 and 1" |
| `E3-012` | `baseline_annual_consumption` | 100-5000 kg | Warning | "Annual fuel consumption outside typical range" |

#### Adjustment Factor Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E3-020` | `usage_rate` | 0.2-1.0 | Critical | "Usage rate must be between 20% and 100%" |
| `E3-021` | `performance_factor` | 0.5-1.5 | Warning | "Performance factor outside expected range" |
| `E3-022` | `stacking_factor` | 0.5-1.0 | Warning | "Stacking factor outside expected range" |

### 5.5 Energy Efficiency (E4) Validation Rules

#### Equipment Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E4-001` | `baseline_efficiency` | 10-99% | Critical | "Baseline efficiency outside valid range" |
| `E4-002` | `project_efficiency` | > `baseline_efficiency` | Critical | "Project efficiency must exceed baseline" |
| `E4-003` | `project_efficiency` | ≤ 99% | Warning | "Project efficiency exceeds theoretical maximum" |

#### Energy Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E4-010` | `baseline_energy_consumption` | ≥ 0 | Critical | "Energy consumption cannot be negative" |
| `E4-011` | `energy_savings` | ≥ 0 | Critical | "Energy savings cannot be negative" |
| `E4-012` | `energy_savings` / `baseline_energy` | ≤ 80% | Warning | "Energy savings >80% of baseline requires verification" |

#### Metering Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `E4-020` | `metering_period_days` | ≥ 30 days | Warning | "Metering period <30 days may be insufficient" |
| `E4-021` | `metered_consumption_post` | < `metered_consumption_pre` | Critical | "Post-retrofit consumption must be less than pre-retrofit" |

### 5.6 Landfill Gas (W1) Validation Rules

#### Landfill Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `W1-001` | `waste_in_place` | ≥ 1000 tonnes | Critical | "Waste in place below minimum threshold" |
| `W1-002` | `annual_waste_input` | ≥ 0 | Critical | "Annual waste input cannot be negative" |
| `W1-003` | `organic_fraction` | 0.05-0.5 | Warning | "Organic fraction outside typical range" |

#### Gas Flow Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `W1-010` | `gas_flow_rate` | ≥ 0 | Critical | "Gas flow rate cannot be negative" |
| `W1-011` | `methane_content` | 30-65% | Warning | "Methane content outside typical range (30-65%)" |
| `W1-012` | `oxygen_content` | < 5% | Warning | "Oxygen content >5% indicates air intrusion" |

#### Collection System Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `W1-020` | `collection_efficiency` | 0.1-0.9 | Critical | "Collection efficiency outside valid range" |
| `W1-021` | `destruction_efficiency` | 0.9-0.999 | Critical | "Destruction efficiency outside valid range" |
| `W1-022` | `flare_operating_hours` | ≤ Monitoring period hours | Critical | "Operating hours cannot exceed monitoring period" |

### 5.7 Wastewater Methane (W2) Validation Rules

#### Flow Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `W2-001` | `influent_flow_rate` | ≥ 0 | Critical | "Influent flow cannot be negative" |
| `W2-002` | `influent_cod` | 0.1-50 kg/m³ | Warning | "COD outside typical range" |
| `W2-003` | `influent_bod` | 0.05-30 kg/m³ | Warning | "BOD outside typical range" |

#### Treatment Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `W2-010` | `treatment_capacity` | ≥ `influent_flow_rate` | Warning | "Influent exceeds treatment capacity" |
| `W2-011` | `methane_correction_factor` | 0-1.0 | Critical | "MCF must be between 0 and 1" |
| `W2-012` | `baseline_mcf` | ≥ `project_mcf` | Warning | "Project MCF should be less than baseline" |

#### Biogas Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `W2-020` | `biogas_capture_rate` | ≥ 0 | Critical | "Biogas capture rate cannot be negative" |
| `W2-021` | `biogas_methane_content` | 50-75% | Warning | "Biogas methane content outside typical range" |

### 5.8 Organic Waste (W3) Validation Rules

#### Waste Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `W3-001` | `waste_quantity_processed` | ≥ 0 | Critical | "Waste quantity cannot be negative" |
| `W3-002` | `waste_moisture_content` | 10-90% | Warning | "Moisture content outside typical range" |
| `W3-003` | `degradable_organic_carbon` | 5-40% | Warning | "DOC outside typical range" |

#### Treatment Validation

| Rule ID | Parameter | Condition | Severity | Error Message |
|---------|-----------|-----------|----------|---------------|
| `W3-010` | `treatment_capacity` | ≥ `waste_quantity_processed` | Warning | "Waste quantity exceeds treatment capacity" |
| `W3-011` | `process_ch4_emissions` | ≥ 0 | Critical | "Process methane emissions cannot be negative" |
| `W3-012` | `compost_produced` | ≤ `waste_quantity_processed` × 0.5 | Warning | "Compost yield exceeds expected maximum" |

### 5.9 Cross-Parameter Validation Rules

| Rule ID | Methodologies | Validation Logic | Severity |
|---------|---------------|------------------|----------|
| `X-001` | All | Project start date ≤ Monitoring period start | Critical |
| `X-002` | All | Sum of all emission reductions ≤ Baseline emissions | Critical |
| `X-003` | All | Project emissions ≤ 50% of baseline emissions | Warning |
| `X-004` | E1, E4 | Grid emission factor from approved source | Critical |
| `X-005` | E2, E3 | Baseline survey within 2 years of project start | Warning |
| `X-006` | W1, W2, W3 | Methane destruction efficiency documented | Critical |
| `X-007` | All | Leakage assessment completed if required | Critical |

---

## 6. Output Specifications

### 6.1 Standard Output Format

All calculations must produce a standardized output JSON structure:

```json
{
  "calculation_metadata": {
    "calculation_id": "uuid",
    "calculation_timestamp": "ISO-8601",
    "methodology_code": "string",
    "methodology_version": "string",
    "standard": "VCS|GS|ACR|CDM",
    "calculation_engine_version": "string"
  },
  "project_info": {
    "project_id": "string",
    "project_name": "string",
    "monitoring_period": {
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "duration_days": "integer"
    }
  },
  "input_summary": {
    "key_parameters": {},
    "data_quality_score": "0-100",
    "validation_status": "passed|warning|failed"
  },
  "calculation_results": {
    "baseline_emissions": {
      "value": "decimal",
      "unit": "tCO2e",
      "components": {}
    },
    "project_emissions": {
      "value": "decimal",
      "unit": "tCO2e",
      "components": {}
    },
    "leakage": {
      "value": "decimal",
      "unit": "tCO2e"
    },
    "net_emission_reductions": {
      "value": "decimal",
      "unit": "tCO2e",
      "calculation_method": "string"
    }
  },
  "credit_quantification": {
    "gross_credits": "decimal",
    "buffer_contribution": "decimal",
    "buffer_rate": "decimal",
    "net_credits_issuable": "decimal",
    "vintage_year": "integer",
    "crediting_period": {
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD"
    }
  },
  "uncertainty_analysis": {
    "overall_uncertainty": "decimal (0-1)",
    "confidence_level": "decimal (0-1)",
    "uncertainty_components": {},
    "conservative_factor_applied": "decimal"
  },
  "validation_results": {
    "status": "passed|warning|failed",
    "critical_errors": [],
    "warnings": [],
    "passed_checks": []
  },
  "audit_trail": {
    "calculation_steps": [],
    "intermediate_values": {},
    "data_sources": {},
    "assumptions": {}
  }
}
```

### 6.2 Output Components by Methodology

#### Grid Renewables (E1) Output Components

| Component | Description | Unit | Precision |
|-----------|-------------|------|-----------|
| `gross_generation_mwh` | Total electricity generated | MWh | 3 decimal |
| `auxiliary_consumption_mwh` | On-site electricity use | MWh | 3 decimal |
| `net_generation_mwh` | Net electricity to grid | MWh | 3 decimal |
| `capacity_factor_percent` | Actual capacity factor | % | 2 decimal |
| `combined_margin_ef` | Combined margin emission factor | tCO2e/MWh | 6 decimal |
| `baseline_emissions_tco2e` | Baseline emissions | tCO2e | 3 decimal |
| `project_emissions_tco2e` | Project emissions | tCO2e | 3 decimal |
| `net_reductions_tco2e` | Net emission reductions | tCO2e | 3 decimal |
| `credits_issuable_tco2e` | Credits available for issuance | tCO2e | 0 decimal |

#### Distributed Energy (E2) Output Components

| Component | Description | Unit | Precision |
|-----------|-------------|------|-----------|
| `baseline_energy_kwh` | Baseline energy consumption | kWh | 0 decimal |
| `project_energy_kwh` | Project energy generation | kWh | 0 decimal |
| `energy_savings_kwh` | Energy savings achieved | kWh | 0 decimal |
| `systems_operational_count` | Number of operational systems | count | 0 decimal |
| `average_usage_rate` | Average system usage rate | % | 2 decimal |
| `baseline_emissions_tco2e` | Baseline emissions | tCO2e | 3 decimal |
| `project_emissions_tco2e` | Project emissions | tCO2e | 3 decimal |
| `net_reductions_tco2e` | Net emission reductions | tCO2e | 3 decimal |

#### Clean Cooking (E3) Output Components

| Component | Description | Unit | Precision |
|-----------|-------------|------|-----------|
| `baseline_fuel_consumption_kg` | Baseline fuel consumption | kg | 0 decimal |
| `project_fuel_consumption_kg` | Project fuel consumption | kg | 0 decimal |
| `fuel_savings_kg` | Fuel savings achieved | kg | 0 decimal |
| `stoves_active_count` | Number of active stoves | count | 0 decimal |
| `average_usage_rate` | Average stove usage rate | % | 2 decimal |
| `baseline_emissions_tco2e` | Baseline emissions | tCO2e | 3 decimal |
| `project_emissions_tco2e` | Project emissions | tCO2e | 3 decimal |
| `net_reductions_tco2e` | Net emission reductions | tCO2e | 3 decimal |
| `adjustment_factors_applied` | List of adjustment factors | object | - |

#### Energy Efficiency (E4) Output Components

| Component | Description | Unit | Precision |
|-----------|-------------|------|-----------|
| `baseline_energy_kwh` | Baseline energy consumption | kWh | 0 decimal |
| `project_energy_kwh` | Project energy consumption | kWh | 0 decimal |
| `energy_savings_kwh` | Energy savings achieved | kWh | 0 decimal |
| `savings_percentage` | Percentage savings | % | 2 decimal |
| `calculation_approach` | Metered or ex-ante | string | - |
| `baseline_emissions_tco2e` | Baseline emissions | tCO2e | 3 decimal |
| `project_emissions_tco2e` | Project emissions | tCO2e | 3 decimal |
| `net_reductions_tco2e` | Net emission reductions | tCO2e | 3 decimal |

#### Landfill Gas (W1) Output Components

| Component | Description | Unit | Precision |
|-----------|-------------|------|-----------|
| `methane_generation_tonnes` | Methane generation potential | tonnes CH4 | 3 decimal |
| `baseline_ch4_tonnes` | Baseline methane emissions | tonnes CH4 | 3 decimal |
| `captured_ch4_tonnes` | Captured methane | tonnes CH4 | 3 decimal |
| `destroyed_ch4_tonnes` | Destroyed methane | tonnes CH4 | 3 decimal |
| `collection_efficiency_percent` | Collection system efficiency | % | 2 decimal |
| `destruction_efficiency_percent` | Destruction efficiency | % | 2 decimal |
| `baseline_emissions_tco2e` | Baseline emissions | tCO2e | 3 decimal |
| `project_emissions_tco2e` | Project emissions | tCO2e | 3 decimal |
| `net_reductions_tco2e` | Net emission reductions | tCO2e | 3 decimal |

#### Wastewater Methane (W2) Output Components

| Component | Description | Unit | Precision |
|-----------|-------------|------|-----------|
| `organic_load_kg_cod` | Total organic load | kg COD | 0 decimal |
| `baseline_ch4_tonnes` | Baseline methane emissions | tonnes CH4 | 3 decimal |
| `project_ch4_tonnes` | Project methane emissions | tonnes CH4 | 3 decimal |
| `captured_ch4_tonnes` | Captured methane | tonnes CH4 | 3 decimal |
| `destroyed_ch4_tonnes` | Destroyed methane | tonnes CH4 | 3 decimal |
| `baseline_emissions_tco2e` | Baseline emissions | tCO2e | 3 decimal |
| `project_emissions_tco2e` | Project emissions | tCO2e | 3 decimal |
| `net_reductions_tco2e` | Net emission reductions | tCO2e | 3 decimal |

#### Organic Waste (W3) Output Components

| Component | Description | Unit | Precision |
|-----------|-------------|------|-----------|
| `waste_processed_tonnes` | Total waste processed | tonnes | 3 decimal |
| `landfill_methane_tco2e` | Baseline landfill methane | tCO2e | 3 decimal |
| `transport_emissions_tco2e` | Transport emissions | tCO2e | 3 decimal |
| `process_ch4_tco2e` | Process methane emissions | tCO2e | 3 decimal |
| `process_n2o_tco2e` | Process N2O emissions | tCO2e | 3 decimal |
| `process_co2_tco2e` | Process CO2 emissions | tCO2e | 3 decimal |
| `energy_emissions_tco2e` | Energy-related emissions | tCO2e | 3 decimal |
| `baseline_emissions_tco2e` | Total baseline emissions | tCO2e | 3 decimal |
| `project_emissions_tco2e` | Total project emissions | tCO2e | 3 decimal |
| `net_reductions_tco2e` | Net emission reductions | tCO2e | 3 decimal |
| `final_reductions_tco2e` | Final reductions after uncertainty | tCO2e | 3 decimal |

### 6.3 Uncertainty and Confidence Levels

#### Uncertainty Calculation Methodology

```
Overall Uncertainty = √(Σ(Component Uncertainty²))

Where component uncertainties are:
- Measurement uncertainty: Based on meter accuracy
- Sampling uncertainty: Based on sample size and variance
- Model uncertainty: Based on emission factor uncertainty
- Parameter uncertainty: Based on input parameter ranges
```

#### Confidence Level Requirements

| Methodology | Minimum Confidence Level | Recommended Confidence Level |
|-------------|-------------------------|------------------------------|
| Grid Renewables | 90% | 95% |
| Distributed Energy | 90% | 95% |
| Clean Cooking | 90% | 95% |
| Energy Efficiency | 90% | 95% |
| Landfill Gas | 90% | 95% |
| Wastewater Methane | 90% | 95% |
| Organic Waste | 90% | 95% |

#### Conservative Factor Application

```
Credits Issued = Net Reductions × (1 - Overall Uncertainty) × (1 - Buffer Rate)
```

### 6.4 Credit Vintage and Issuance

#### Vintage Year Determination

| Methodology | Vintage Year Rule |
|-------------|-------------------|
| All Energy | Year of monitoring period end |
| All Waste | Year of monitoring period end |

#### Crediting Period

| Methodology | Maximum Crediting Period | Renewable |
|-------------|-------------------------|-----------|
| Grid Renewables | 21 years (7 years × 3) | Yes |
| Distributed Energy | 21 years (7 years × 3) | Yes |
| Clean Cooking | 21 years (7 years × 3) | Yes |
| Energy Efficiency | 10 years | No |
| Landfill Gas | 21 years (7 years × 3) | Yes |
| Wastewater Methane | 21 years (7 years × 3) | Yes |
| Organic Waste | 21 years (7 years × 3) | Yes |

#### Buffer Contribution Rates

| Risk Category | Buffer Rate | Applicability |
|---------------|-------------|---------------|
| Low Risk | 10% | Grid renewables with >5 years operation |
| Medium Risk | 20% | Standard projects |
| High Risk | 30% | Clean cooking, first-time projects |

---


## 7. Monitoring Integration

### 7.1 Smart Meter Data Integration

#### Supported Meter Types

| Meter Category | Protocols | Data Frequency | Methodologies |
|----------------|-----------|----------------|---------------|
| Electrical Meters | Modbus, DNP3, IEC 61850 | 15-minute to hourly | E1, E2, E4 |
| Gas Flow Meters | HART, Modbus, 4-20mA | Hourly to daily | W1, W2 |
| Thermal Meters | M-Bus, Wireless M-Bus | Hourly | E3, E4 |
| Water Meters | Pulse, M-Bus, LoRaWAN | Hourly to daily | W2, W3 |

#### Data Collection Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Field Meters  │────▶│  Data Gateway   │────▶│  Cloud Platform │
│  (Smart Meters) │     │  (Edge Device)  │     │  (Data Lake)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Raw Measurements      Aggregated Data         Processed Data
   (15-min intervals)   (Hourly/Daily)          (Calculation Ready)
```

#### Data Format Requirements

**Standard Meter Data Record:**
```json
{
  "meter_id": "string (unique identifier)",
  "timestamp": "ISO-8601 datetime",
  "reading_value": "decimal",
  "unit": "kWh|MWh|m³|kg|etc",
  "reading_type": "cumulative|interval",
  "quality_flag": "valid|estimated|missing|questionable",
  "meter_status": "operational|maintenance|fault",
  "location": {
    "latitude": "decimal",
    "longitude": "decimal"
  }
}
```

#### Data Quality Requirements

| Metric | Requirement | Validation Action |
|--------|-------------|-------------------|
| Data Completeness | ≥ 95% for monitoring period | Flag for verification if <95% |
| Data Accuracy | Within ±2% of calibrated reference | Require recalibration if exceeded |
| Data Timeliness | < 24 hours from measurement | Flag delayed data |
| Data Consistency | No gaps > 7 days without explanation | Require gap analysis |

### 7.2 Usage Monitoring Requirements by Methodology

#### Grid Renewables (E1) Monitoring

| Parameter | Monitoring Method | Frequency | Minimum Duration |
|-----------|------------------|-----------|------------------|
| Electricity Generation | Revenue-grade meter | Continuous | Full monitoring period |
| Auxiliary Consumption | Sub-meter | Continuous | Full monitoring period |
| Grid Export | Billing meter | Monthly | Full monitoring period |
| Plant Availability | SCADA system | Continuous | Full monitoring period |

**Meter Specifications:**
- Accuracy Class: 0.2S or better (IEC 62053-22)
- Calibration: Every 2 years minimum
- Data Storage: Minimum 2 years local storage

#### Distributed Energy (E2) Monitoring

| Parameter | Monitoring Method | Frequency | Minimum Duration |
|-----------|------------------|-----------|------------------|
| Energy Generation | Smart meter | Hourly | Full monitoring period |
| System Status | Remote monitoring | Daily | Full monitoring period |
| Usage Patterns | Smart meter analytics | Daily | Full monitoring period |
| Household Surveys | Field visits | Annual | Minimum 10% sample |

**Remote Monitoring Requirements:**
- GSM/Cellular connectivity for data transmission
- Battery backup for 7 days minimum
- Tamper detection and alerts
- GPS location tracking

#### Clean Cooking (E3) Monitoring

| Parameter | Monitoring Method | Frequency | Minimum Duration |
|-----------|------------------|-----------|------------------|
| Stove Usage | Temperature sensors | Event-based | Full monitoring period |
| Fuel Consumption | Weighing/surveys | Monthly | Minimum 10% sample |
| Stove Condition | Field inspections | Annual | Minimum 5% sample |
| Household Surveys | Phone/in-person | Annual | Minimum 10% sample |

**Temperature Sensor Specifications:**
- Temperature Range: 0-500°C
- Accuracy: ±2°C
- Sampling Rate: 1 minute
- Data Transmission: Daily summary
- Battery Life: Minimum 1 year

**Survey Requirements:**
- Sample size: Minimum 30 households or 10% of population
- Survey methodology: Standardized questionnaire
- Data collection: Digital forms with GPS tagging
- Quality control: 10% back-checks

#### Energy Efficiency (E4) Monitoring

| Parameter | Monitoring Method | Frequency | Minimum Duration |
|-----------|------------------|-----------|------------------|
| Energy Consumption | Revenue-grade meter | 15-minute | Minimum 30 days |
| Operating Hours | Equipment sensors | Hourly | Full monitoring period |
| Environmental Conditions | Weather station | Hourly | Full monitoring period |
| Equipment Performance | BMS/SCADA | Continuous | Full monitoring period |

**Measurement and Verification (M&V) Protocol:**
- Protocol: IPMVP Option B or C
- Baseline period: Minimum 12 months
- Post-implementation: Minimum 12 months
- Uncertainty analysis: Required for all measurements

#### Landfill Gas (W1) Monitoring

| Parameter | Monitoring Method | Frequency | Minimum Duration |
|-----------|------------------|-----------|------------------|
| Gas Flow Rate | Thermal mass flow meter | Continuous | Full monitoring period |
| Gas Composition | Gas chromatograph | Weekly | Full monitoring period |
| Destruction Efficiency | Temperature monitoring | Continuous | Full monitoring period |
| Flare Operation | Flame detection | Continuous | Full monitoring period |

**Flow Meter Specifications:**
- Accuracy: ±2% of reading
- Turndown ratio: 100:1 minimum
- Temperature compensation: Required
- Calibration: Annual with certified gas

#### Wastewater Methane (W2) Monitoring

| Parameter | Monitoring Method | Frequency | Minimum Duration |
|-----------|------------------|-----------|------------------|
| Influent Flow | Magnetic flow meter | Continuous | Full monitoring period |
| COD/BOD | Laboratory analysis | Weekly | Full monitoring period |
| Biogas Production | Gas flow meter | Continuous | Full monitoring period |
| Treatment Performance | Process sensors | Continuous | Full monitoring period |

**Laboratory Analysis Requirements:**
- COD analysis: Standard Method 5220D
- BOD analysis: Standard Method 5210B
- Sampling: 24-hour composite samples
- QA/QC: Duplicate samples, certified standards

#### Organic Waste (W3) Monitoring

| Parameter | Monitoring Method | Frequency | Minimum Duration |
|-----------|------------------|-----------|------------------|
| Waste Quantity | Weighbridge | Per delivery | Full monitoring period |
| Waste Composition | Visual/sorting analysis | Quarterly | Full monitoring period |
| Process Emissions | Portable analyzers | Monthly | Full monitoring period |
| Output Products | Weighbridge | Per batch | Full monitoring period |

**Weighbridge Specifications:**
- Accuracy: ±0.5% of applied load
- Calibration: Annual with certified weights
- Data recording: Automatic with timestamp
- Backup: Manual recording capability

### 7.3 Performance Tracking

#### Key Performance Indicators (KPIs)

| Methodology | KPI | Target | Alert Threshold |
|-------------|-----|--------|-----------------|
| E1 | Capacity Factor | > 15% (solar), > 25% (wind) | < 10% (solar), < 15% (wind) |
| E1 | Availability Factor | > 95% | < 90% |
| E2 | System Uptime | > 90% | < 80% |
| E2 | Usage Rate | > 60% | < 40% |
| E3 | Stove Retention | > 80% | < 60% |
| E3 | Usage Rate | > 50% | < 30% |
| E4 | Savings Achievement | > 80% of projected | < 60% of projected |
| W1 | Collection Efficiency | > 60% | < 40% |
| W1 | Destruction Efficiency | > 90% | < 85% |
| W2 | COD Removal | > 80% | < 60% |
| W3 | Waste Diversion | > 90% | < 70% |

#### Performance Dashboard Requirements

**Real-time Metrics:**
- Current generation/consumption
- System status indicators
- Alarm notifications
- Performance vs. baseline

**Periodic Reports:**
- Daily: Generation/consumption summaries
- Weekly: Performance trend analysis
- Monthly: Detailed performance report
- Quarterly: Verification-ready data package

### 7.4 Data Quality Assurance

#### QA/QC Procedures

| Procedure | Frequency | Responsible Party |
|-----------|-----------|-------------------|
| Meter calibration verification | Annual | Certified technician |
| Data completeness check | Daily | Automated system |
| Data consistency check | Weekly | Data analyst |
| Outlier detection | Continuous | Automated system |
| Cross-validation with independent sources | Quarterly | Third-party verifier |

#### Data Validation Rules

```python
# Example data validation logic
def validate_meter_data(reading, previous_reading, max_increase_factor=1.5):
    """
    Validates meter reading against previous reading
    """
    # Check for negative values
    if reading < 0:
        return False, "Negative reading not allowed"
    
    # Check for unreasonable increase
    if previous_reading > 0:
        increase = reading - previous_reading
        max_increase = previous_reading * max_increase_factor
        if increase > max_increase:
            return False, f"Increase exceeds {max_increase_factor}x previous reading"
    
    # Check for zero reading (potential fault)
    if reading == 0 and previous_reading > 0:
        return False, "Zero reading after non-zero reading"
    
    return True, "Valid"
```

### 7.5 Third-Party Verification Points

#### Verification Schedule

| Methodology | Initial Verification | Periodic Verification | Spot Checks |
|-------------|---------------------|----------------------|-------------|
| E1 | Before first issuance | Every 5 years | Annual |
| E2 | Before first issuance | Every 3 years | Annual |
| E3 | Before first issuance | Every 3 years | Annual |
| E4 | Before first issuance | Every 5 years | Annual |
| W1 | Before first issuance | Every 5 years | Annual |
| W2 | Before first issuance | Every 5 years | Annual |
| W3 | Before first issuance | Every 3 years | Annual |

#### Verification Requirements

**Documentation:**
- Calculation methodology documentation
- Input data sources and quality assurance
- Assumption documentation and justification
- Uncertainty analysis
- Audit trail

**Site Visits:**
- Equipment inspection
- Meter calibration verification
- Data collection system review
- Interview with project personnel

**Data Review:**
- Sample of raw data
- Calculation worksheets
- Quality control records
- Monitoring reports

---

## 8. Technical Architecture

### 8.1 Recommended Technology Stack

#### Backend Services

| Component | Technology | Justification |
|-----------|------------|---------------|
| API Framework | Python/FastAPI or Node.js/Express | High performance, async support |
| Calculation Engine | Python (NumPy, Pandas) | Scientific computing libraries |
| Database | PostgreSQL + TimescaleDB | Relational + time-series data |
| Cache | Redis | High-speed data caching |
| Message Queue | Apache Kafka or RabbitMQ | Event streaming |
| Task Queue | Celery | Background job processing |

#### Frontend (Optional)

| Component | Technology | Justification |
|-----------|------------|---------------|
| Web Framework | React or Vue.js | Component-based UI |
| Visualization | D3.js or Chart.js | Custom charts and graphs |
| Maps | Mapbox or Leaflet | Geographic visualization |

#### Infrastructure

| Component | Technology | Justification |
|-----------|------------|---------------|
| Containerization | Docker | Consistent deployment |
| Orchestration | Kubernetes | Scalability and resilience |
| Cloud Platform | AWS/Azure/GCP | Managed services |
| CI/CD | GitHub Actions/GitLab CI | Automated deployment |
| Monitoring | Prometheus + Grafana | Metrics and alerting |

### 8.2 API Design for Calculation Services

#### REST API Endpoints

```yaml
# Calculation API Specification
openapi: 3.0.0
info:
  title: Carbon Credit Calculation Engine API
  version: 1.0.0

paths:
  /api/v1/calculate/{methodology}:
    post:
      summary: Execute calculation for specified methodology
      parameters:
        - name: methodology
          in: path
          required: true
          schema:
            type: string
            enum: [grid-renewables, distributed-energy, clean-cooking, 
                   energy-efficiency, landfill-gas, wastewater-methane, organic-waste]
      requestBody:
        required: true
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
        500:
          description: Internal server error

  /api/v1/validate/{methodology}:
    post:
      summary: Validate input parameters without executing calculation
      parameters:
        - name: methodology
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CalculationRequest'
      responses:
        200:
          description: Validation results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationResponse'

  /api/v1/emission-factors:
    get:
      summary: Retrieve available emission factors
      parameters:
        - name: region
          in: query
          schema:
            type: string
        - name: year
          in: query
          schema:
            type: integer
      responses:
        200:
          description: List of emission factors

  /api/v1/health:
    get:
      summary: Health check endpoint
      responses:
        200:
          description: Service is healthy
```

#### API Request/Response Examples

**Calculation Request:**
```json
{
  "project_id": "PROJ-2024-001",
  "monitoring_period": {
    "start_date": "2024-01-01",
    "end_date": "2024-03-31"
  },
  "parameters": {
    "gross_generation_mwh": 1250.5,
    "auxiliary_consumption_mwh": 25.1,
    "plant_capacity_mw": 5.0,
    "grid_ef_operating_margin": 0.8564,
    "grid_ef_build_margin": 0.7231,
    "om_weighting": 0.75,
    "bm_weighting": 0.25
  },
  "options": {
    "include_audit_trail": true,
    "uncertainty_analysis": true
  }
}
```

**Calculation Response:**
```json
{
  "calculation_id": "calc-uuid-123",
  "status": "success",
  "results": {
    "net_generation_mwh": 1225.4,
    "baseline_emissions_tco2e": 918.2,
    "project_emissions_tco2e": 0.0,
    "net_reductions_tco2e": 918.2,
    "credits_issuable_tco2e": 826.4
  },
  "validation": {
    "status": "passed",
    "warnings": [],
    "errors": []
  },
  "audit_trail": {
    "calculation_steps": [...],
    "intermediate_values": {...}
  }
}
```

### 8.3 Database Schema Recommendations

#### Core Tables

```sql
-- Projects table
CREATE TABLE projects (
    project_id UUID PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    methodology_code VARCHAR(50) NOT NULL,
    standard VARCHAR(50) NOT NULL,
    project_location GEOGRAPHY(POINT),
    registration_date DATE,
    crediting_period_start DATE,
    crediting_period_end DATE,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Monitoring periods table
CREATE TABLE monitoring_periods (
    period_id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(project_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Calculations table
CREATE TABLE calculations (
    calculation_id UUID PRIMARY KEY,
    period_id UUID REFERENCES monitoring_periods(period_id),
    calculation_timestamp TIMESTAMP DEFAULT NOW(),
    methodology_code VARCHAR(50),
    baseline_emissions DECIMAL(15, 3),
    project_emissions DECIMAL(15, 3),
    leakage DECIMAL(15, 3),
    net_reductions DECIMAL(15, 3),
    credits_issuable DECIMAL(15, 3),
    uncertainty DECIMAL(5, 4),
    validation_status VARCHAR(50),
    calculation_json JSONB
);

-- Meter readings table (time-series)
CREATE TABLE meter_readings (
    reading_id BIGSERIAL,
    meter_id VARCHAR(100) NOT NULL,
    project_id UUID REFERENCES projects(project_id),
    timestamp TIMESTAMP NOT NULL,
    reading_value DECIMAL(15, 6),
    unit VARCHAR(20),
    quality_flag VARCHAR(20),
    PRIMARY KEY (meter_id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Emission factors table
CREATE TABLE emission_factors (
    ef_id UUID PRIMARY KEY,
    ef_name VARCHAR(100),
    ef_value DECIMAL(15, 10),
    unit VARCHAR(50),
    region VARCHAR(100),
    year INTEGER,
    source VARCHAR(100),
    valid_from DATE,
    valid_to DATE
);

-- Validation rules table
CREATE TABLE validation_rules (
    rule_id VARCHAR(50) PRIMARY KEY,
    methodology_code VARCHAR(50),
    parameter_name VARCHAR(100),
    rule_type VARCHAR(50),
    condition VARCHAR(255),
    severity VARCHAR(20),
    error_message TEXT
);

-- Audit log table
CREATE TABLE audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    calculation_id UUID REFERENCES calculations(calculation_id),
    event_type VARCHAR(50),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_meter_readings_project_time ON meter_readings(project_id, timestamp);
CREATE INDEX idx_calculations_period ON calculations(period_id);
CREATE INDEX idx_calculations_timestamp ON calculations(calculation_timestamp);
CREATE INDEX idx_emission_factors_region_year ON emission_factors(region, year);
CREATE INDEX idx_projects_methodology ON projects(methodology_code);

-- GIN index for JSONB queries
CREATE INDEX idx_calculation_json ON calculations USING GIN(calculation_json);
```

### 8.4 Real-time vs Batch Processing

#### Processing Mode Selection

| Scenario | Recommended Mode | Latency Requirement |
|----------|-----------------|---------------------|
| Initial project registration | Batch | < 1 hour |
| Monthly monitoring reports | Batch | < 4 hours |
| Real-time performance monitoring | Real-time | < 1 minute |
| Verification data preparation | Batch | < 24 hours |
| Credit issuance calculations | Batch | < 1 hour |
| Alert generation | Real-time | < 5 minutes |

#### Batch Processing Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Data Ingest │────▶│  Validation  │────▶│  Calculation │────▶│   Results    │
│   (Batch)    │     │   (Batch)    │     │   (Batch)    │     │   Storage    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
  Raw data files      Validated data      Calculation jobs    Results database
  (CSV, JSON, etc)    (Database)          (Celery workers)    (PostgreSQL)
```

#### Real-time Processing Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  IoT Sensors │────▶│    Kafka     │────▶│  Stream      │────▶│  Real-time   │
│   (Meters)   │     │   (Queue)    │     │  Processor   │     │  Dashboard   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                │
                                                ▼
                                          ┌──────────────┐
                                          │   Alert      │
                                          │   Engine     │
                                          └──────────────┘
```

### 8.5 Performance and Scalability Requirements

#### Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response Time (p95) | < 500ms | > 2s |
| Calculation Throughput | > 100 calcs/min | < 50 calcs/min |
| Database Query Time (p95) | < 100ms | > 500ms |
| Data Ingestion Rate | > 10,000 records/sec | < 5,000 records/sec |
| System Availability | 99.9% | < 99% |

#### Scalability Requirements

**Horizontal Scaling:**
- API servers: Auto-scale 2-10 instances based on load
- Calculation workers: Scale 5-50 workers based on queue depth
- Database: Read replicas for query scaling

**Vertical Scaling:**
- Database: Scale up to 32 vCPU, 128GB RAM for primary instance
- Cache: Scale to 64GB Redis cluster

#### Load Balancing Strategy

```
                    ┌─────────────┐
                    │   Load      │
                    │  Balancer   │
                    │  (Nginx)    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  API Server │ │  API Server │ │  API Server │
    │    (1)      │ │    (2)      │ │    (N)      │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────┴──────┐
                    │   Shared    │
                    │   Database  │
                    │  (Primary + │
                    │  Replicas)  │
                    └─────────────┘
```

### 8.6 Security Requirements

#### Authentication and Authorization

| Layer | Mechanism | Requirements |
|-------|-----------|--------------|
| API Access | OAuth 2.0 + JWT | Token expiration: 1 hour |
| Service-to-Service | mTLS | Certificate-based |
| Database | Role-based | Principle of least privilege |
| Admin Access | MFA + SSO | Required for all admin functions |

#### Data Protection

| Data Type | Encryption at Rest | Encryption in Transit |
|-----------|-------------------|----------------------|
| Calculation inputs | AES-256 | TLS 1.3 |
| Calculation outputs | AES-256 | TLS 1.3 |
| Meter readings | AES-256 | TLS 1.3 |
| Emission factors | AES-256 | TLS 1.3 |
| Audit logs | AES-256 | TLS 1.3 |

#### Audit Requirements

- All API calls logged with user ID, timestamp, and action
- All calculation inputs and outputs stored immutably
- Data modifications tracked with before/after values
- Access logs retained for 7 years

---


## 9. Appendices

### Appendix A: Emission Factor Reference Values

#### Grid Emission Factors (Sample Values)

| Region/Country | Operating Margin (tCO2e/MWh) | Build Margin (tCO2e/MWh) | Source |
|----------------|------------------------------|--------------------------|--------|
| United States | 0.450 | 0.380 | eGRID |
| European Union | 0.276 | 0.198 | EEA |
| China | 0.857 | 0.682 | NDRC |
| India | 0.819 | 0.715 | CEA |
| Brazil | 0.089 | 0.075 | MME |
| Global Average | 0.500 | 0.400 | IEA |

#### Fuel Emission Factors (IPCC 2006)

| Fuel Type | NCV (TJ/tonne) | CO2 EF (kg/TJ) | CH4 EF (kg/TJ) | N2O EF (kg/TJ) |
|-----------|----------------|----------------|----------------|----------------|
| Coal (bituminous) | 24.4 | 94,600 | 1 | 1.5 |
| Natural Gas | 48.0 | 56,100 | 1 | 0.1 |
| Diesel | 43.0 | 74,100 | 3 | 0.6 |
| Kerosene | 43.3 | 71,900 | 3 | 0.6 |
| LPG | 47.3 | 63,100 | 1 | 0.1 |
| Fuelwood (dry) | 15.6 | 112,000 | 30 | 4 |
| Charcoal | 29.5 | 112,000 | 200 | 4 |

#### Global Warming Potentials (AR5, 100-year)

| Gas | GWP Value |
|-----|-----------|
| CO2 | 1 |
| CH4 (fossil) | 36 |
| CH4 (biogenic) | 28 |
| N2O | 265 |
| SF6 | 23,500 |

### Appendix B: Methodology-Specific Constants

#### Grid Renewables Constants

| Parameter | Standard Value | Notes |
|-----------|----------------|-------|
| OM Weight (wind, solar, geothermal) | 0.75 | VCS/CDM default |
| BM Weight (wind, solar, geothermal) | 0.25 | VCS/CDM default |
| OM Weight (hydro, biomass) | 0.50 | VCS/CDM default |
| BM Weight (hydro, biomass) | 0.50 | VCS/CDM default |
| SF6 GWP | 23,500 | AR5 100-year |

#### Landfill Gas Constants (IPCC FOD Model)

| Waste Type | DOC (tonne C/tonne waste) | DOCf | k (1/year) |
|------------|---------------------------|------|------------|
| Food waste | 0.15 | 0.5 | 0.185 |
| Paper/cardboard | 0.40 | 0.5 | 0.060 |
| Wood | 0.43 | 0.5 | 0.030 |
| Textiles | 0.24 | 0.5 | 0.060 |
| Garden waste | 0.20 | 0.5 | 0.100 |

#### Wastewater Methane Constants

| Treatment Type | MCF Range | Default B0 (kg CH4/kg COD) |
|----------------|-----------|---------------------------|
| Untreated | 0.5-0.8 | 0.25 |
| Anaerobic lagoon | 0.2-0.8 | 0.25 |
| Aerobic treatment | 0-0.3 | 0.25 |
| Anaerobic digester | 0-0.1 | 0.25 |

### Appendix C: Unit Conversion Reference

#### Energy Conversions

| From | To | Conversion Factor |
|------|----|-------------------|
| kWh | MJ | 3.6 |
| kWh | GJ | 0.0036 |
| MWh | kWh | 1,000 |
| MWh | GJ | 3.6 |
| TJ | GJ | 1,000 |
| TJ | MWh | 277.78 |
| Gcal | MWh | 1.163 |

#### Volume Conversions

| From | To | Conversion Factor |
|------|----|-------------------|
| m³ CH4 (STP) | kg CH4 | 0.716 |
| m³ CH4 (STP) | tonnes CH4 | 0.000716 |
| L | m³ | 0.001 |
| gal (US) | L | 3.785 |

#### Mass Conversions

| From | To | Conversion Factor |
|------|----|-------------------|
| kg | tonnes | 0.001 |
| kg | lbs | 2.205 |
| tonnes | lbs | 2,205 |

### Appendix D: Error Codes and Messages

#### Validation Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| VAL-001 | Invalid input parameters | 400 |
| VAL-002 | Missing required parameter | 400 |
| VAL-003 | Parameter out of valid range | 400 |
| VAL-004 | Inconsistent data values | 400 |
| VAL-005 | Date validation failed | 400 |
| VAL-006 | Geographic validation failed | 400 |
| VAL-007 | Emission factor not found | 404 |
| VAL-008 | Additionality check failed | 400 |
| VAL-009 | Calculation exceeds limits | 400 |
| VAL-010 | Uncertainty exceeds threshold | 400 |

#### System Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| SYS-001 | Internal calculation error | 500 |
| SYS-002 | Database connection failed | 503 |
| SYS-003 | External service unavailable | 503 |
| SYS-004 | Rate limit exceeded | 429 |
| SYS-005 | Calculation timeout | 504 |

### Appendix E: Sample Calculation Worksheet

#### Grid Renewables Example

**Input Data:**
- Project: 5 MW Solar PV
- Monitoring Period: January 1 - March 31, 2024 (91 days)
- Gross Generation: 1,250.5 MWh
- Auxiliary Consumption: 25.1 MWh
- Grid EF Operating Margin: 0.8564 tCO2e/MWh
- Grid EF Build Margin: 0.7231 tCO2e/MWh
- OM Weight: 0.75
- BM Weight: 0.25

**Calculation Steps:**

1. Net Generation = 1,250.5 - 25.1 = 1,225.4 MWh

2. Combined Margin EF = (0.75 × 0.8564) + (0.25 × 0.7231) = 0.8231 tCO2e/MWh

3. Baseline Emissions = 1,225.4 × 0.8231 = 1,008.6 tCO2e

4. Project Emissions = 0 (no backup fuel)

5. Net Reductions = 1,008.6 - 0 = 1,008.6 tCO2e

6. Credits (with 10% buffer) = 1,008.6 × 0.90 = 907.7 tCO2e

**Results:**
- Net Generation: 1,225.4 MWh
- Baseline Emissions: 1,008.6 tCO2e
- Project Emissions: 0.0 tCO2e
- Net Reductions: 1,008.6 tCO2e
- Credits Issuable: 907.7 tCO2e

### Appendix F: Integration Checklist

#### Pre-Integration Requirements

- [ ] API credentials obtained and configured
- [ ] Database schema created and migrated
- [ ] Emission factors loaded and validated
- [ ] Validation rules configured
- [ ] Monitoring system endpoints configured
- [ ] Authentication/authorization tested
- [ ] Rate limits configured
- [ ] Logging and monitoring enabled

#### Integration Testing Checklist

- [ ] API health check passes
- [ ] Sample calculation executes successfully
- [ ] Validation rules trigger correctly
- [ ] Error handling works as expected
- [ ] Data persistence verified
- [ ] Audit logging confirmed
- [ ] Performance benchmarks met
- [ ] Security scan passed

#### Production Deployment Checklist

- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring dashboards active
- [ ] Alert rules configured
- [ ] Disaster recovery plan documented
- [ ] Runbooks created
- [ ] Support contacts defined
- [ ] Documentation published

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2025 | Carbon Credit Engine Team | Initial release |

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Product Owner | | | |
| Quality Assurance | | | |

---

*End of Document*
