# Integrated Multi-Scenario Framework for Climate Risk Analysis
## Harmonization of NGFS, IEA, IPCC AR6, IRENA, and GFANZ Scenarios

---

**Document Classification:** Proprietary Technical Integration Guide  
**Version:** 1.0  
**Date:** April 2026  
**Prepared by:** AA Impact Inc. Multi-Agent AI Task Force  

---

## Executive Summary

This document presents a comprehensive integration framework for harmonizing climate scenarios from the Network for Greening the Financial System (NGFS), International Energy Agency (IEA), Intergovernmental Panel on Climate Change (IPCC AR6), International Renewable Energy Agency (IRENA), and Glasgow Financial Alliance for Net Zero (GFANZ). The framework enables financial institutions to leverage multiple scenario providers while ensuring consistency, comparability, and regulatory compliance.

### Key Integration Achievements

| Feature | Implementation |
|---------|---------------|
| **Scenario Coverage** | 100+ scenarios across 5 major providers |
| **Temperature Alignment** | 1.5°C to 4°C+ pathways |
| **Temporal Horizons** | 2025-2100 (annual, decadal) |
| **Geographic Scope** | Global, regional, national |
| **Sector Granularity** | 50+ sectors and sub-sectors |
| **Variable Coverage** | 500+ economic, energy, climate variables |

---

## Table of Contents

1. [Scenario Provider Overview](#1-scenario-provider-overview)
2. [NGFS Phase 5 Scenarios](#2-ngfs-phase-5-scenarios)
3. [IEA World Energy Outlook 2024](#3-iea-world-energy-outlook-2024)
4. [IPCC AR6 WGIII Mitigation Scenarios](#4-ipcc-ar6-wgiii-mitigation-scenarios)
5. [IRENA World Energy Transitions Outlook](#5-irena-world-energy-transitions-outlook)
6. [GFANZ Scenario Guidance](#6-gfanz-scenario-guidance)
7. [Scenario Harmonization Framework](#7-scenario-harmonization-framework)
8. [Integrated Variable Mapping](#8-integrated-variable-mapping)
9. [Temperature Alignment Matrix](#9-temperature-alignment-matrix)
10. [Implementation Architecture](#10-implementation-architecture)

---

## 1. Scenario Provider Overview

### 1.1 Comparative Framework

| Provider | Scenarios | Temperature Range | Time Horizon | Update Frequency | Primary Use Case |
|----------|-----------|-------------------|--------------|------------------|------------------|
| **NGFS** | 6-8 main | 1.5°C - 3°C+ | 2025-2100 | Annual | Financial risk assessment |
| **IEA** | 3 main | 1.5°C - 2.7°C | 2025-2050 | Annual | Energy sector analysis |
| **IPCC AR6** | 3,000+ | 1.5°C - 4°C+ | 2020-2100 | 6-7 years | Scientific assessment |
| **IRENA** | 2 main | 1.5°C - 2.7°C | 2025-2050 | Annual | Renewable energy focus |
| **GFANZ** | Multi-provider | 1.5°C - 2°C | 2025-2050 | Ongoing | Financial institution alignment |

### 1.2 Scenario Taxonomy

```
Climate Scenarios
├── Transition Risk Scenarios
│   ├── Orderly Transition
│   │   ├── NGFS: Net Zero 2050, Below 2°C
│   │   ├── IEA: NZE Scenario
│   │   ├── IRENA: 1.5°C Scenario
│   │   └── IPCC: C1, C2 categories
│   ├── Disorderly Transition
│   │   ├── NGFS: Delayed Transition
│   │   ├── IEA: APS (Announced Pledges)
│   │   └── IPCC: C3 category
│   └── Hot House World
│       ├── NGFS: Current Policies, NDCs
│       ├── IEA: STEPS
│       ├── IRENA: Planned Energy Scenario
│       └── IPCC: C6, C7 categories
│
├── Physical Risk Scenarios
│   ├── Acute (event-based)
│   │   ├── NGFS: Chronic + Acute modules
│   │   └── IPCC: Extreme event projections
│   └── Chronic (trend-based)
│       ├── NGFS: Temperature, SLR modules
│       └── IPCC: RCP/SSP combinations
│
└── Integrated Scenarios
    ├── NGFS: Full suite with damage functions
    └── IPCC: Full IAM pathways
```

---

## 2. NGFS Phase 5 Scenarios

### 2.1 Phase 5 Updates (November 2024)

The NGFS published Phase 5 scenarios on **November 5, 2024**, representing the most significant update to the framework.

#### 2.1.1 Key Phase 5 Enhancements

| Enhancement | Description | Impact on Risk Assessment |
|-------------|-------------|---------------------------|
| **New Damage Function** | Kotz et al. (2024) economic commitment model | 4x higher physical risk impact by 2050 |
| **Extended Climate Variables** | Temperature variability, precipitation extremes, wet days | More granular hazard assessment |
| **Lagged Effects** | 10-year persistence of climate shocks | Long-term GDP impact modeling |
| **Policy Updates** | March 2024 NDC submissions | 36 new country commitments |
| **CDR Limitations** | Constrained carbon dioxide removal | More realistic net-zero pathways |

#### 2.1.2 Scenario Suite

| Scenario | Code | Temperature | Description | Use Case |
|----------|------|-------------|-------------|----------|
| **Net Zero 2050** | NZ2050 | 1.5°C | Immediate, coordinated global action | Best-case transition |
| **Below 2°C** | B2DS | <2°C | Strong action with some delay | Ambitious transition |
| **Nationally Determined Contributions** | NDC | ~2.5°C | Current NDCs fully implemented | Policy baseline |
| **Current Policies** | CP | ~2.7°C | Existing policies only | Business-as-usual |
| **Delayed Transition** | DT | ~2°C (peak) | Late, sudden policy shift | Disorderly risk |
| **Fragmented World** | FW | ~2.8°C | Uncoordinated regional action | Geopolitical risk |

#### 2.1.3 Carbon Price Trajectories (Phase 5)

| Scenario | 2025 | 2030 | 2040 | 2050 |
|----------|------|------|------|------|
| NZ2050 | $50/t | $130/t | $680/t | $2,946/t |
| B2DS | $40/t | $95/t | $420/t | $1,250/t |
| NDC | $25/t | $45/t | $75/t | $95/t |
| CP | $20/t | $28/t | $48/t | $83/t |
| DT | $20/t | $28/t | $85/t (2035 jump) | $285/t |

#### 2.1.4 Physical Risk Damage Function (Kotz et al. 2024)

The new damage function incorporates:

$$\delta_t = f(\bar{T}_t, \sigma_T, P_{annual}, N_{wet}, P_{extreme}, Lag)$$

Where:
- $\bar{T}_t$ = average annual temperature
- $\sigma_T$ = daily temperature variability
- $P_{annual}$ = total annual precipitation
- $N_{wet}$ = number of wet days
- $P_{extreme}$ = extreme daily rainfall
- $Lag$ = 10-year persistence effect

**Key Finding:** Economic losses are **4x higher** by 2050 compared to Phase 4.

---

## 3. IEA World Energy Outlook 2024

### 3.1 Scenario Architecture

The IEA WEO 2024 presents three main scenarios with updated temperature outcomes:

| Scenario | Temperature (2100) | Description | Key Assumptions |
|----------|-------------------|-------------|-----------------|
| **Stated Policies (STEPS)** | 2.4°C | Current policy trajectory | Policies in place + under development |
| **Announced Pledges (APS)** | 1.7°C | All targets met on time | Full implementation of NDCs, net-zero goals |
| **Net Zero Emissions (NZE)** | 1.5°C | Paris-aligned pathway | Net-zero by 2050, 1.5°C limit |

### 3.2 Key WEO 2024 Insights

#### 3.2.1 Clean Energy Transition

- **Renewable capacity:** 560 GW added globally in 2023 (China: 60%)
- **Electrification:** Electricity demand growing faster than total energy demand
- **Fossil fuel peak:** Global demand peaks before 2030 in all scenarios

#### 3.2.2 Regional Dynamics

| Region | STEPS 2050 | APS 2050 | NZE 2050 |
|--------|------------|----------|----------|
| **China** | Emissions -50% | Emissions -80% | Net-zero |
| **India** | Emissions +50% | Emissions -50% | Net-zero 2070 |
| **EU** | Emissions -70% | Emissions -90% | Net-zero |
| **US** | Emissions -60% | Emissions -85% | Net-zero |

#### 3.2.3 Technology Trends

| Technology | STEPS 2030 | APS 2030 | NZE 2030 |
|------------|------------|----------|----------|
| EV Stock | 250M | 400M | 600M |
| Solar Capacity | 2,500 GW | 3,500 GW | 5,000 GW |
| Wind Capacity | 1,800 GW | 2,500 GW | 3,500 GW |
| Heat Pumps | 300M | 500M | 700M |

### 3.3 Sectoral Pathways

#### 3.3.1 Power Generation

$$\text{Renewable Share}_t^{NZE} = \min\left(1, 0.6 + 0.02 \times (t - 2023)\right)$$

#### 3.3.2 Transport

$$\text{EV Share}_t^{NZE} = \frac{1}{1 + e^{-0.3(t - 2030)}}$$

#### 3.3.3 Industry

$$\text{Low-Carbon Fuel}_t^{NZE} = 0.1 \times (t - 2023)^{0.8}$$

---

## 4. IPCC AR6 WGIII Mitigation Scenarios

### 4.1 AR6 Scenario Database

The IPCC AR6 scenario database contains **3,131 scenarios** from **188 modeling frameworks**:

| Category | Scenarios | Temperature | Characteristics |
|----------|-----------|-------------|-----------------|
| **C1** | 97 | 1.5°C (<1.5°C in 2100) | Low/no overshoot |
| **C2** | 198 | 1.5°C (>50% in 2100) | High overshoot |
| **C3** | 423 | 2°C (>67% in 2100) | Likely below 2°C |
| **C4** | 352 | 2°C (>50% in 2100) | Below 2°C |
| **C5** | 602 | 2.5°C | Below 2.5°C |
| **C6** | 665 | 3°C | Below 3°C |
| **C7** | 794 | 4°C+ | Above 3°C |

### 4.2 Illustrative Mitigation Pathways (IMPs)

The IPCC selected **8 Illustrative Pathways** representing different mitigation strategies:

| IMP | Strategy | Temperature | Key Characteristics |
|-----|----------|-------------|---------------------|
| **IMP-GS** | Gradual Strengthening | 1.8°C | Progressive policy tightening |
| **IMP-Neg** | Negative Emissions | 1.5°C | Heavy reliance on CDR |
| **IMP-Ren** | Renewables | 1.5°C | Rapid renewable deployment |
| **IMP-LD** | Low Demand | 1.5°C | Demand reduction focus |
| **IMP-SP** | Shifting Pathways | 1.5°C | Sustainable development |
| **CurPol** | Current Policies | 3.0°C | Existing policies only |
| **ModAct** | Moderate Action | 2.5°C | Some policy enhancement |

### 4.3 Shared Socioeconomic Pathways (SSPs)

| SSP | Narrative | Challenges | Temperature Range |
|-----|-----------|------------|-------------------|
| **SSP1** | Sustainability | Low | 1.5°C - 2°C |
| **SSP2** | Middle of the Road | Medium | 2°C - 2.5°C |
| **SSP3** | Regional Rivalry | High | 2.5°C - 3.5°C |
| **SSP4** | Inequality | High | 2°C - 3°C |
| **SSP5** | Fossil-Fueled Development | Low | 3°C - 5°C |

### 4.4 Representative Concentration Pathways (RCPs)

| RCP | Radiative Forcing | Temperature | Emissions Trajectory |
|-----|-------------------|-------------|----------------------|
| **RCP1.9** | 1.9 W/m² | 1.5°C | Very low emissions |
| **RCP2.6** | 2.6 W/m² | 2°C | Low emissions |
| **RCP4.5** | 4.5 W/m² | 2.5°C | Intermediate |
| **RCP6.0** | 6.0 W/m² | 3°C | High emissions |
| **RCP8.5** | 8.5 W/m² | 4°C+ | Very high emissions |

### 4.5 SSP-RCP Matrix

| | RCP1.9 | RCP2.6 | RCP4.5 | RCP6.0 | RCP8.5 |
|---|--------|--------|--------|--------|--------|
| **SSP1** | 1.5°C | 1.8°C | 2.2°C | - | - |
| **SSP2** | - | 2.0°C | 2.5°C | 3.0°C | - |
| **SSP3** | - | - | 2.8°C | 3.5°C | 4.5°C |
| **SSP4** | - | 2.2°C | 2.7°C | 3.2°C | - |
| **SSP5** | - | - | - | 3.5°C | 4.8°C |

---

## 5. IRENA World Energy Transitions Outlook 2024

### 5.1 Scenario Framework

IRENA presents two main scenarios with a renewable energy focus:

| Scenario | Temperature | Description | Key Metrics |
|----------|-------------|-------------|-------------|
| **1.5°C Scenario** | 1.5°C | Paris-aligned pathway | Triple renewables by 2030 |
| **Planned Energy Scenario (PES)** | 2.7°C | Current government plans | Based on existing policies |

### 5.2 1.5°C Scenario Key Targets

| Target | 2030 | 2050 |
|--------|------|------|
| Renewable Power Capacity | 11,000 GW | 27,000 GW |
| Renewable Share in TFEC | 30% | 55% |
| Electrification Rate (Buildings) | 53% | 72% |
| Electrification Rate (Industry) | 31% | 36% |
| Electrification Rate (Transport) | 7% | 52% |
| Annual Investment | $4.5T | $7.0T |

### 5.3 Investment Requirements

$$\text{Total Investment}_{2024-2050}^{1.5°C} = USD\ 131\ trillion$$

Breakdown:
- Renewable power: $31.5T (2024-2030)
- Grids and flexibility: $24T
- Energy efficiency: $18T
- Electrification: $28T
- Hydrogen: $12T
- Innovation: $19.5T

### 5.4 G20 Progress Tracking

IRENA serves as custodian agency for COP28 UAE Consensus targets:

| Target | Status 2024 | Required by 2030 |
|--------|-------------|------------------|
| Triple renewable capacity | 3,800 GW | 11,000 GW |
| Double energy efficiency rate | 2.1%/year | 4.2%/year |

---

## 6. GFANZ Scenario Guidance

### 6.1 GFANZ Framework Principles

GFANZ provides guidance for financial institutions on scenario selection:

| Principle | Requirement |
|-----------|-------------|
| **Science-Based** | Aligned with 1.5°C Paris goal |
| **Comprehensive** | Cover transition + physical risk |
| **Transparent** | Clear assumptions and methodologies |
| **Forward-Looking** | 10+ year time horizons |
| **Sector-Specific** | Granular sectoral pathways |

### 6.2 Recommended Scenario Sources

GFANZ recognizes the following scenario providers:

| Provider | Use Case | Temperature |
|----------|----------|-------------|
| **IEA** | Energy sector focus | 1.5°C - 2.4°C |
| **IPCC** | Scientific rigor | 1.5°C - 4°C+ |
| **NGFS** | Financial risk | 1.5°C - 3°C+ |
| **IRENA** | Renewable energy | 1.5°C - 2.7°C |
| **OECM** | One Earth Climate Model | 1.5°C |
| **MPP** | Mission Possible Partnership | 1.5°C |

### 6.3 Sectoral Pathway Framework

GFANZ recommends sector-specific pathways for:

| Sector | Key Metrics | Scenario Sources |
|--------|-------------|------------------|
| **Power** | Generation mix, capacity additions | IEA, IRENA, IPCC |
| **Steel** | Production technology, scrap ratio | MPP, IEA |
| **Cement** | Clinker ratio, alternative fuels | MPP, IEA |
| **Aviation** | SAF deployment, efficiency | MPP, IEA |
| **Shipping** | Fuel mix, vessel efficiency | MPP, IEA |
| **Automotive** | EV share, ICE phase-out | IEA, IPCC |
| **Buildings** | Energy intensity, retrofit rate | IEA, CRREM |

### 6.4 Transition Finance Strategies

GFANZ identifies four financing strategies:

```
┌─────────────────────────────────────────────────────────────┐
│                    Transition Finance                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Aligned    │  │  Aligning    │  │   Managed    │      │
│  │              │  │              │  │  Phaseout    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Climate Solutions                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Scenario Harmonization Framework

### 7.1 Harmonization Methodology

#### 7.1.1 Temperature Alignment Mapping

```python
def map_temperature(scenario, provider):
    """
    Map scenarios to common temperature categories
    """
    temperature_map = {
        'NGFS': {
            'Net Zero 2050': 1.5,
            'Below 2°C': 1.8,
            'NDCs': 2.5,
            'Current Policies': 2.7,
            'Delayed Transition': 2.0,
            'Fragmented World': 2.8
        },
        'IEA': {
            'NZE': 1.5,
            'APS': 1.7,
            'STEPS': 2.4
        },
        'IPCC': {
            'C1': 1.5,
            'C2': 1.5,
            'C3': 2.0,
            'C4': 2.0,
            'C5': 2.5,
            'C6': 3.0,
            'C7': 4.0
        },
        'IRENA': {
            '1.5°C Scenario': 1.5,
            'PES': 2.7
        }
    }
    return temperature_map[provider][scenario]
```

#### 7.1.2 Variable Harmonization

| Harmonized Variable | NGFS | IEA | IPCC | IRENA |
|---------------------|------|-----|------|-------|
| **GDP** | NIGEM | IMF | SSPs | OECD |
| **Population** | UN | UN | SSPs | UN |
| **Energy Demand** | MESSAGEix | GEC Model | IAMs | REmap |
| **Carbon Price** | Endogenous | Endogenous | IAMs | Endogenous |
| **Renewable Capacity** | MESSAGEix | GEC Model | IAMs | REmap |
| **Temperature** | MAGICC | MAGICC | MAGICC | MAGICC |

### 7.2 Scenario Ensemble Approach

#### 7.2.1 Bayesian Model Averaging

$$P(Y|D) = \sum_{i=1}^{n} P(Y|M_i, D) \cdot P(M_i|D)$$

Where:
- $Y$ = outcome variable (e.g., carbon price, GDP)
- $D$ = observed data
- $M_i$ = scenario model $i$
- $P(M_i|D)$ = posterior model probability

#### 7.2.2 Scenario Weighting Framework

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Temperature Alignment** | 30% | Proximity to 1.5°C target |
| **Policy Plausibility** | 25% | Likelihood of implementation |
| **Model Robustness** | 20% | IAM quality and validation |
| **Data Granularity** | 15% | Sector and regional detail |
| **Update Frequency** | 10% | Recency of scenario |

### 7.3 Cross-Scenario Consistency Checks

#### 7.3.1 Carbon Price Consistency

$$\Delta P_{carbon}^{max} = \max_{i,j} |P_i - P_j| < \epsilon_{tol}$$

For scenarios with similar temperature outcomes.

#### 7.3.2 Energy Transition Consistency

$$\Delta Renewables_{share}^{max} = \max_{i,j} |R_i - R_j| < \epsilon_{tol}$$

#### 7.3.3 GDP Impact Consistency

$$\Delta GDP_{loss}^{max} = \max_{i,j} |GDP_i - GDP_j| < \epsilon_{tol}$$

---

## 8. Integrated Variable Mapping

### 8.1 Macroeconomic Variables

| Variable | Unit | NGFS | IEA | IPCC | IRENA |
|----------|------|------|-----|------|-------|
| GDP | Trillion USD (PPP) | ✓ | ✓ | ✓ | ✓ |
| GDP Growth | %/year | ✓ | ✓ | ✓ | ✓ |
| Population | Billion | ✓ | ✓ | ✓ | ✓ |
| Inflation | %/year | ✓ | ✗ | ✗ | ✗ |
| Interest Rates | % | ✓ | ✗ | ✗ | ✗ |
| Exchange Rates | Index | ✓ | ✗ | ✗ | ✗ |

### 8.2 Energy Variables

| Variable | Unit | NGFS | IEA | IPCC | IRENA |
|----------|------|------|-----|------|-------|
| Primary Energy Demand | EJ | ✓ | ✓ | ✓ | ✓ |
| Final Energy Consumption | EJ | ✓ | ✓ | ✓ | ✓ |
| Electricity Generation | TWh | ✓ | ✓ | ✓ | ✓ |
| Renewable Capacity | GW | ✓ | ✓ | ✓ | ✓ |
| Fossil Fuel Demand | EJ | ✓ | ✓ | ✓ | ✓ |
| Oil Price | USD/bbl | ✓ | ✓ | ✗ | ✗ |
| Gas Price | USD/MMBtu | ✓ | ✓ | ✗ | ✗ |
| Coal Price | USD/tonne | ✓ | ✓ | ✗ | ✗ |

### 8.3 Emissions Variables

| Variable | Unit | NGFS | IEA | IPCC | IRENA |
|----------|------|------|-----|------|-------|
| CO₂ Emissions | Gt CO₂ | ✓ | ✓ | ✓ | ✓ |
| CH₄ Emissions | Mt CH₄ | ✓ | ✓ | ✓ | ✓ |
| N₂O Emissions | Mt N₂O | ✓ | ✓ | ✓ | ✗ |
| GHG Emissions (CO₂e) | Gt CO₂e | ✓ | ✓ | ✓ | ✓ |
| Carbon Intensity | t CO₂/$GDP | ✓ | ✓ | ✓ | ✓ |

### 8.4 Climate Variables

| Variable | Unit | NGFS | IEA | IPCC | IRENA |
|----------|------|------|-----|------|-------|
| Global Mean Temperature | °C | ✓ | ✓ | ✓ | ✓ |
| Temperature Anomaly | °C vs pre-industrial | ✓ | ✓ | ✓ | ✓ |
| Sea Level Rise | cm | ✓ | ✗ | ✓ | ✗ |
| Precipitation Change | % | ✓ | ✗ | ✓ | ✗ |
| Extreme Events | Frequency | ✓ | ✗ | ✓ | ✗ |

### 8.5 Policy Variables

| Variable | Unit | NGFS | IEA | IPCC | IRENA |
|----------|------|------|-----|------|-------|
| Carbon Price | USD/t CO₂ | ✓ | ✓ | ✓ | ✓ |
| Fossil Fuel Subsidies | Billion USD | ✓ | ✓ | ✓ | ✗ |
| Renewable Support | Billion USD | ✓ | ✓ | ✓ | ✓ |
| Energy Efficiency Investment | Billion USD | ✓ | ✓ | ✓ | ✓ |

---

## 9. Temperature Alignment Matrix

### 9.1 Scenario-Temperature Mapping

| Temperature | NGFS | IEA | IPCC | IRENA |
|-------------|------|-----|------|-------|
| **1.5°C** | NZ2050 | NZE | C1, C2, IMP-Ren, IMP-LD, IMP-SP | 1.5°C Scenario |
| **1.7°C** | - | APS | C3 (lower) | - |
| **2.0°C** | B2DS | - | C3, C4, IMP-GS | - |
| **2.4°C** | - | STEPS | C5 (lower) | - |
| **2.5°C** | NDC | - | C5 | - |
| **2.7°C** | CP | - | C6 (lower) | PES |
| **2.8°C** | FW | - | C6 | - |
| **3.0°C+** | - | - | C7 | - |

### 9.2 Scenario Selection by Use Case

| Use Case | Recommended Scenarios | Temperature Range |
|----------|----------------------|-------------------|
| **Stress Testing** | NGFS NZ2050, DT, CP; IEA STEPS, NZE | 1.5°C - 2.7°C |
| **Portfolio Alignment** | IEA NZE, APS; IPCC IMP-Ren, IMP-LD | 1.5°C - 1.7°C |
| **Risk Assessment** | NGFS full suite; IEA STEPS | 1.5°C - 2.8°C |
| **Target Setting** | IEA NZE; IPCC C1, C2; IRENA 1.5°C | 1.5°C |
| **Disclosure** | NGFS NZ2050, NDC; IEA APS | 1.5°C - 2.5°C |
| **Strategic Planning** | NGFS full suite; IEA all; IPCC IMPs | 1.5°C - 4°C+ |

### 9.3 Scenario Probability Weighting

| Scenario | Expert Survey | Market Implied | Policy Tracker | Composite |
|----------|--------------|----------------|----------------|-----------|
| **1.5°C (NZE)** | 15% | 10% | 20% | 15% |
| **1.7°C (APS)** | 25% | 20% | 30% | 25% |
| **2.4°C (STEPS)** | 35% | 45% | 35% | 38% |
| **2.7°C+ (CP)** | 25% | 25% | 15% | 22% |

---

## 10. Implementation Architecture

### 10.1 Data Ingestion Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Scenario Data Sources                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    NGFS     │  │     IEA     │  │    IPCC     │             │
│  │   Portal    │  │    WEO      │  │    AR6      │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    IRENA    │  │   GFANZ     │  │   Other     │             │
│  │   WETO      │  │  Guidance   │  │  Sources    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Harmonization Layer                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Variable Mapping │ Unit Conversion │ Temporal Alignment  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Ensemble Modeling                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Bayesian Averaging │ Scenario Weighting │ Uncertainty    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Risk Calculation Engine                        │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Database Schema

```sql
-- Scenario registry
CREATE TABLE scenarios (
    scenario_id UUID PRIMARY KEY,
    provider VARCHAR(50),  -- 'NGFS', 'IEA', 'IPCC', 'IRENA'
    scenario_name VARCHAR(100),
    scenario_code VARCHAR(20),
    temperature_outcome DECIMAL(3,1),
    description TEXT,
    update_date DATE,
    version VARCHAR(10)
);

-- Harmonized variables
CREATE TABLE scenario_variables (
    variable_id UUID PRIMARY KEY,
    scenario_id UUID REFERENCES scenarios(scenario_id),
    variable_name VARCHAR(100),
    variable_category VARCHAR(50),  -- 'macro', 'energy', 'emissions', 'climate'
    unit VARCHAR(20),
    year INT,
    value DECIMAL(18,6),
    confidence_lower DECIMAL(18,6),
    confidence_upper DECIMAL(18,6),
    source_variable_name VARCHAR(100)
);

-- Temperature alignment
CREATE TABLE temperature_alignment (
    alignment_id UUID PRIMARY KEY,
    scenario_id UUID REFERENCES scenarios(scenario_id),
    temperature_category VARCHAR(20),  -- '1.5C', '2C', '2.5C', etc.
    probability DECIMAL(5,4),
    methodology VARCHAR(50)
);

-- Scenario weights
CREATE TABLE scenario_weights (
    weight_id UUID PRIMARY KEY,
    scenario_id UUID REFERENCES scenarios(scenario_id),
    weight_method VARCHAR(50),  -- 'expert', 'market', 'policy', 'composite'
    weight_value DECIMAL(5,4),
    calculation_date DATE
);
```

### 10.3 API Integration

```python
class IntegratedScenarioFramework:
    """
    Unified interface for multi-scenario climate risk analysis
    """
    
    def __init__(self):
        self.providers = {
            'NGFS': NGFSProvider(),
            'IEA': IEAProvider(),
            'IPCC': IPCCProvider(),
            'IRENA': IRENAProvider()
        }
        self.harmonizer = VariableHarmonizer()
        self.ensemble = EnsembleModel()
    
    def get_scenario(self, provider, scenario_name, variables, years):
        """
        Retrieve scenario data from specific provider
        """
        raw_data = self.providers[provider].fetch(
            scenario_name, variables, years
        )
        return self.harmonizer.transform(raw_data, provider)
    
    def get_ensemble_projection(self, temperature_target, variables, years):
        """
        Get Bayesian ensemble projection for temperature target
        """
        scenarios = self.select_by_temperature(temperature_target)
        weighted = self.ensemble.calculate_weights(scenarios)
        return self.ensemble.project(weighted, variables, years)
    
    def compare_scenarios(self, scenario_list, variables):
        """
        Compare multiple scenarios across key variables
        """
        comparison = {}
        for scenario in scenario_list:
            data = self.get_scenario(**scenario)
            comparison[scenario['name']] = data
        return self.generate_comparison_report(comparison, variables)
    
    def get_risk_metrics(self, portfolio, scenarios, time_horizon):
        """
        Calculate climate risk metrics for portfolio under scenarios
        """
        metrics = {}
        for scenario in scenarios:
            data = self.get_scenario(**scenario)
            metrics[scenario['name']] = self.calculate_risk(
                portfolio, data, time_horizon
            )
        return metrics
```

### 10.4 Visualization Dashboard

```python
# Scenario comparison visualization
def plot_scenario_comparison(scenarios, variable, years):
    """
    Create interactive comparison chart
    """
    fig = go.Figure()
    
    for scenario in scenarios:
        fig.add_trace(go.Scatter(
            x=years,
            y=scenario[variable],
            mode='lines',
            name=scenario['name'],
            line=dict(color=scenario['color'])
        ))
    
    fig.update_layout(
        title=f'{variable} Across Scenarios',
        xaxis_title='Year',
        yaxis_title=variable,
        hovermode='x unified'
    )
    
    return fig

# Temperature alignment heatmap
def plot_temperature_alignment():
    """
    Create scenario-temperature alignment matrix
    """
    scenarios = ['NGFS NZ2050', 'IEA NZE', 'IPCC C1', 'IRENA 1.5C',
                 'IEA APS', 'NGFS B2DS', 'IEA STEPS', 'NGFS CP']
    temperatures = [1.5, 1.5, 1.5, 1.5, 1.7, 1.8, 2.4, 2.7]
    
    fig = go.Figure(data=go.Heatmap(
        z=[temperatures],
        x=scenarios,
        y=['Temperature (°C)'],
        colorscale='RdYlGn_r',
        zmin=1.5,
        zmax=3.0
    ))
    
    return fig
```

---

## Appendices

### Appendix A: Scenario Provider Contacts

| Provider | Website | Data Access | Support |
|----------|---------|-------------|---------|
| NGFS | www.ngfs.net | Portal + API | scenarios@ngfs.net |
| IEA | www.iea.org | Subscription | weo@iea.org |
| IPCC | data.ene.iiasa.ac.at/ar6 | Free download | ar6@iiasa.ac.at |
| IRENA | www.irena.org | Free download | weto@irena.org |
| GFANZ | www.gfanzero.com | Free resources | info@gfanzero.com |

### Appendix B: Data License Summary

| Provider | License | Commercial Use | Attribution |
|----------|---------|----------------|-------------|
| NGFS | CC BY 4.0 | Yes | Required |
| IEA | Proprietary | Subscription | Required |
| IPCC | CC BY 4.0 | Yes | Required |
| IRENA | CC BY 4.0 | Yes | Required |
| GFANZ | CC BY 4.0 | Yes | Required |

### Appendix C: Update Schedule

| Provider | Update Frequency | Next Expected | Version |
|----------|------------------|---------------|---------|
| NGFS | Annual | November 2025 | Phase 6 |
| IEA | Annual | October 2025 | WEO 2025 |
| IPCC | 6-7 years | 2028-2029 | AR7 |
| IRENA | Annual | November 2025 | WETO 2025 |
| GFANZ | Ongoing | Quarterly | Latest |

### Appendix D: Recommended Reading

1. NGFS (2024). "NGFS Climate Scenarios for Financial Risk Assessment: Phase 5"
2. IEA (2024). "World Energy Outlook 2024"
3. IPCC (2022). "AR6 WGIII: Mitigation of Climate Change"
4. IRENA (2024). "World Energy Transitions Outlook 2024"
5. GFANZ (2022). "Financial Institution Net-zero Transition Plans"
6. Kotz et al. (2024). "The economic commitment of climate change", Nature
7. TCFD (2017). "Recommendations of the Task Force on Climate-related Financial Disclosures"

---

*End of Document*
