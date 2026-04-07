# Unified Requirements Specification
## AA Impact Climate Risk Modeling Platform - Technical Specification

---

**Document Classification:** Technical Requirements Specification (TRS)  
**Version:** 1.0  
**Date:** April 2026  
**Prepared by:** AA Impact Inc. Architecture Team  
**Classification:** Confidential - Engineering Use Only  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Module Specifications](#3-module-specifications)
4. [Calculation Engines](#4-calculation-engines)
5. [Machine Learning Algorithms](#5-machine-learning-algorithms)
6. [Data Integration Layer](#6-data-integration-layer)
7. [API Specifications](#7-api-specifications)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document specifies the complete technical requirements for building the AA Impact Climate Risk Modeling Platform - an enterprise-grade, cloud-native system for quantitative climate risk assessment covering physical risk, transition risk, and climate scenario analysis.

### 1.2 Scope

| Component | Coverage |
|-----------|----------|
| **Asset Classes** | Real Estate, Energy, Financial Instruments, Supply Chain |
| **Risk Types** | Physical (acute/chronic), Transition (policy/technology/market) |
| **Scenarios** | 100+ scenarios from NGFS, IEA, IPCC, IRENA, GFANZ |
| **Geographic Coverage** | 180+ countries, 6M+ asset locations |
| **Temporal Horizons** | 2025-2100 (annual, decadal) |
| **ML Models** | 15+ advanced algorithms for risk computation |
| **Data Sources** | 80+ free/low-cost + paid (EODHD, BRSR) |

### 1.3 Key Stakeholders

| Role | Requirements |
|------|--------------|
| **G-SIB CRO** | Enterprise risk aggregation, regulatory reporting |
| **REIT Portfolio Manager** | Property-level risk, green premium analysis |
| **Energy Developer** | Stranded asset analysis, real options valuation |
| **Procurement Director** | Supply chain risk, N-th order contagion |
| **Regulatory Auditor** | Model validation, Basel/ECB compliance |

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Web UI     │  │   Dashboard  │  │   API GW     │  │   Reports    │    │
│  │  (React)     │  │  (Grafana)   │  │  (Kong)      │  │  (PDF/Excel) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API LAYER (FastAPI)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Risk Calc   │  │  Scenario    │  │  Portfolio   │  │  Reporting   │    │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CALCULATION ENGINE LAYER                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    PHYSICAL RISK ENGINE                               │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │  Hazard    │  │  Damage    │  │  Portfolio │  │  Insurance │     │   │
│  │  │  Mapping   │  │  Functions │  │Aggregation │  │  Retreat   │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                   TRANSITION RISK ENGINE                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │  Carbon    │  │  Stranded  │  │  Policy    │  │  Tech      │     │   │
│  │  │  Pricing   │  │  Assets    │  │  Impact    │  │  Disrupt   │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    CREDIT RISK ENGINE                                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │  PD/LGD    │  │  ECL       │  │  Capital   │  │  Collateral│     │   │
│  │  │  Models    │  │  (IFRS9)   │  │  (ICAAP)   │  │  Haircuts  │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ML INFERENCE LAYER (Triton)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ iTransformer │  │   ST-GNN     │  │   XGBoost    │  │    BNN       │    │
│  │  (Time)      │  │  (Spatial)   │  │  (Tabular)   │  │ (Uncertainty)│    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  GraphCast   │  │  LightGBM    │  │   PINN       │  │  Ensemble    │    │
│  │  (Weather)   │  │  (Ensemble)  │  │(Physics-Guided)│  │  (Stacking)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA INTEGRATION LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    PAID DATA SOURCES                                  │   │
│  │  ┌────────────┐  ┌────────────┐                                      │   │
│  │  │   EODHD    │  │    BRSR    │  (Already Subscribed)               │   │
│  │  │ (Financial)│  │(India ESG) │                                      │   │
│  │  └────────────┘  └────────────┘                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    FREE DATA SOURCES                                  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ Copernicus │  │   NOAA     │  │   USGS     │  │   SEC      │     │   │
│  │  │  Climate   │  │  Weather   │  │  Hazards   │  │  EDGAR     │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │OpenStreetMap│  │    CDP     │  │OpenCorporat│  │ World Bank │     │   │
│  │  │Geospatial  │  │   ESG      │  │  Company   │  │   Macro    │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA STORAGE LAYER (Supabase)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │   PostGIS    │  │    Redis     │  │   MLflow     │    │
│  │  (Primary)   │  │  (Spatial)   │  │   (Cache)    │  │  (Registry)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React, TypeScript, Tailwind | User interface |
| **API Gateway** | Kong | Routing, rate limiting, auth |
| **API Services** | FastAPI, Python 3.11 | REST API endpoints |
| **ML Inference** | NVIDIA Triton, PyTorch 2.0 | Model serving |
| **Task Queue** | Celery + Redis | Async processing |
| **Database** | Supabase PostgreSQL + PostGIS | Primary storage |
| **Cache** | Redis Cluster | Hot data caching |
| **ML Registry** | MLflow + Weights & Biases | Model versioning |
| **Deployment** | Railway, Docker, Kubernetes | Container orchestration |
| **Monitoring** | Prometheus + Grafana | Observability |

---

## 3. Module Specifications

### 3.1 Module: Scenario Management Service

**Module ID:** MOD-SCENARIO-001  
**Priority:** P0 (Critical)

#### 3.1.1 Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SC-001 | Ingest NGFS Phase 5 scenarios | P0 | All 6 scenarios with 140B projections |
| SC-002 | Ingest IEA WEO 2024 scenarios | P0 | STEPS, APS, NZE with sectoral data |
| SC-003 | Ingest IPCC AR6 scenarios | P0 | 3,131 scenarios with C1-C7 categories |
| SC-004 | Ingest IRENA WETO scenarios | P0 | 1.5°C and PES pathways |
| SC-005 | Harmonize variable names | P0 | 500+ variables mapped to common schema |
| SC-006 | Temperature alignment mapping | P0 | All scenarios mapped to 1.5°C-4°C+ |
| SC-007 | Scenario ensemble generation | P0 | Bayesian averaging with uncertainty |
| SC-008 | API for scenario queries | P0 | <500ms response time |

#### 3.1.2 Data Schema

```sql
-- Scenario registry
CREATE TABLE scenarios (
    scenario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,  -- 'NGFS', 'IEA', 'IPCC', 'IRENA'
    scenario_code VARCHAR(20) NOT NULL,
    scenario_name VARCHAR(100) NOT NULL,
    temperature_outcome DECIMAL(3,1),
    temperature_category VARCHAR(20),
    description TEXT,
    version VARCHAR(10),
    release_date DATE,
    update_frequency VARCHAR(20),
    source_url VARCHAR(255),
    access_type VARCHAR(20),  -- 'free', 'subscription'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(provider, scenario_code, version)
);

-- Scenario variables (harmonized)
CREATE TABLE scenario_variables (
    variable_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(scenario_id),
    variable_name VARCHAR(100) NOT NULL,  -- harmonized name
    variable_category VARCHAR(50),  -- 'macro', 'energy', 'emissions', 'climate'
    unit VARCHAR(20),
    year INTEGER,
    value DECIMAL(18,6),
    confidence_lower DECIMAL(18,6),
    confidence_upper DECIMAL(18,6),
    source_variable_name VARCHAR(100),  -- original name from provider
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(scenario_id, variable_name, year)
);

-- Temperature alignment
CREATE TABLE temperature_alignment (
    alignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(scenario_id),
    target_temperature DECIMAL(3,1),
    probability DECIMAL(5,4),
    methodology VARCHAR(100),
    calculation_date DATE
);

-- Scenario weights for ensemble
CREATE TABLE scenario_weights (
    weight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(scenario_id),
    weight_method VARCHAR(50),  -- 'equal', 'temperature', 'bma', 'expert', 'composite'
    weight_value DECIMAL(10,8) NOT NULL CHECK (weight_value >= 0),
    target_temperature DECIMAL(3,1),
    calculation_date DATE,
    metadata JSONB
);
```

#### 3.1.3 API Endpoints

```python
# FastAPI router
from fastapi import APIRouter, Query, Depends
from typing import List, Optional

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

@router.get("/", response_model=List[ScenarioResponse])
async def list_scenarios(
    provider: Optional[str] = Query(None, description="Filter by provider"),
    temperature: Optional[float] = Query(None, description="Target temperature"),
    db: Session = Depends(get_db)
):
    """List all available scenarios with optional filtering"""
    pass

@router.get("/{scenario_id}/variables", response_model=List[VariableResponse])
async def get_scenario_variables(
    scenario_id: UUID,
    variable_name: Optional[str] = Query(None),
    year_from: Optional[int] = Query(2025),
    year_to: Optional[int] = Query(2100),
    db: Session = Depends(get_db)
):
    """Get variables for a specific scenario"""
    pass

@router.post("/ensemble", response_model=EnsembleResponse)
async def generate_ensemble(
    request: EnsembleRequest,
    db: Session = Depends(get_db)
):
    """Generate ensemble projection from multiple scenarios"""
    pass

@router.get("/comparison", response_model=ComparisonResponse)
async def compare_scenarios(
    scenario_ids: List[UUID] = Query(...),
    variables: List[str] = Query(...),
    db: Session = Depends(get_db)
):
    """Compare multiple scenarios across variables"""
    pass
```

---

### 3.2 Module: Physical Risk Engine

**Module ID:** MOD-PHYSICAL-001  
**Priority:** P0 (Critical)

#### 3.2.1 Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PH-001 | Hazard intensity mapping | P0 | Flood, wind, earthquake, wildfire, heat, drought |
| PH-002 | Asset footprint geocoding | P0 | 6M+ locations with confidence scores |
| PH-003 | Fragility curve modeling | P0 | Bayesian neural networks for uncertainty |
| PH-004 | Damage function computation | P0 | Power law, exponential, sigmoid forms |
| PH-005 | Multi-hazard compounding | P0 | Copula-based joint distributions |
| PH-006 | Portfolio aggregation | P0 | EAL, PML, VaR, CVaR calculations |
| PH-007 | Insurance retreat modeling | P1 | Uninsurability probability, collateral impact |
| PH-008 | Real-time hazard alerts | P2 | <1 hour from event detection |

#### 3.2.2 Calculation Engine Specifications

**Hazard Intensity Mapping:**
```python
class HazardIntensityMapper:
    """
    Maps asset locations to hazard intensity from multiple sources
    """
    
    def __init__(self):
        self.cds_client = cdsapi.Client()  # Copernicus (free)
        self.usgs_client = USGSClient()    # USGS (free)
        self.fema_client = FEMAClient()    # FEMA (free)
    
    def map_flood_intensity(
        self,
        locations: List[Tuple[float, float]],
        return_periods: List[int] = [10, 50, 100, 250, 500],
        scenarios: List[str] = ['current', '2050_RCP85']
    ) -> pd.DataFrame:
        """
        Map flood depth to asset locations
        
        Args:
            locations: List of (lat, lon) tuples
            return_periods: Return periods to calculate
            scenarios: Climate scenarios
            
        Returns:
            DataFrame with flood depths per location and scenario
        """
        results = []
        
        for lat, lon in locations:
            for rp in return_periods:
                for scenario in scenarios:
                    # Query FEMA flood maps (US)
                    if self.is_us_location(lat, lon):
                        depth = self.fema_client.get_flood_depth(lat, lon, rp)
                    else:
                        # Use GloFAS for global
                        depth = self.query_glofas(lat, lon, rp, scenario)
                    
                    results.append({
                        'lat': lat,
                        'lon': lon,
                        'return_period': rp,
                        'scenario': scenario,
                        'flood_depth_m': depth,
                        'confidence_lower': depth * 0.8,
                        'confidence_upper': depth * 1.2
                    })
        
        return pd.DataFrame(results)
```

**Damage Function with BNN:**
```python
class DamageFunctionBNN(nn.Module):
    """
    Bayesian Neural Network for damage function estimation
    """
    
    def __init__(self, input_dim: int, hidden_dim: int = 64):
        super().__init__()
        
        # Bayesian layers with mean and rho (std = log(1 + exp(rho)))
        self.weight_mu_1 = nn.Parameter(torch.Tensor(hidden_dim, input_dim).normal_(0, 0.1))
        self.weight_rho_1 = nn.Parameter(torch.Tensor(hidden_dim, input_dim).normal_(-3, 0.1))
        self.bias_mu_1 = nn.Parameter(torch.Tensor(hidden_dim).normal_(0, 0.1))
        self.bias_rho_1 = nn.Parameter(torch.Tensor(hidden_dim).normal_(-3, 0.1))
        
        self.weight_mu_2 = nn.Parameter(torch.Tensor(2, hidden_dim).normal_(0, 0.1))
        self.weight_rho_2 = nn.Parameter(torch.Tensor(2, hidden_dim).normal_(-3, 0.1))
        self.bias_mu_2 = nn.Parameter(torch.Tensor(2).normal_(0, 0.1))
        self.bias_rho_2 = nn.Parameter(torch.Tensor(2).normal_(-3, 0.1))
    
    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        # Sample weights
        weight_sigma_1 = torch.log1p(torch.exp(self.weight_rho_1))
        weight_1 = self.weight_mu_1 + weight_sigma_1 * torch.randn_like(self.weight_mu_1)
        bias_sigma_1 = torch.log1p(torch.exp(self.bias_rho_1))
        bias_1 = self.bias_mu_1 + bias_sigma_1 * torch.randn_like(self.bias_mu_1)
        
        # Layer 1
        h = F.relu(F.linear(x, weight_1, bias_1))
        
        # Layer 2 (output: mean and log_var)
        weight_sigma_2 = torch.log1p(torch.exp(self.weight_rho_2))
        weight_2 = self.weight_mu_2 + weight_sigma_2 * torch.randn_like(self.weight_mu_2)
        bias_sigma_2 = torch.log1p(torch.exp(self.bias_rho_2))
        bias_2 = self.bias_mu_2 + bias_sigma_2 * torch.randn_like(self.bias_mu_2)
        
        out = F.linear(h, weight_2, bias_2)
        return out[:, 0], out[:, 1]  # mean, log_var
    
    def elbo_loss(
        self,
        x: torch.Tensor,
        y: torch.Tensor,
        kl_weight: float = 1e-4
    ) -> torch.Tensor:
        """Evidence Lower Bound loss"""
        mean, log_var = self.forward(x)
        
        # Negative log likelihood (Gaussian)
        nll = 0.5 * (log_var + ((y - mean) ** 2) / torch.exp(log_var))
        
        # KL divergence (simplified - would sum over all Bayesian parameters)
        kl = self.compute_kl_divergence()
        
        return nll.mean() + kl_weight * kl
```

---

### 3.3 Module: Transition Risk Engine

**Module ID:** MOD-TRANSITION-001  
**Priority:** P0 (Critical)

#### 3.3.1 Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TR-001 | Carbon price trajectory modeling | P0 | NGFS/IEA scenarios to 2100 |
| TR-002 | Sectoral elasticity estimation | P0 | 50+ sectors with pass-through rates |
| TR-003 | DCF impairment calculation | P0 | Climate-adjusted cash flows |
| TR-004 | Stranded asset timeline | P0 | Optimal retirement timing |
| TR-005 | Technology displacement model | P0 | S-curve adoption, learning curves |
| TR-006 | Policy mandate impact | P0 | Phase-out schedules, compliance costs |
| TR-007 | Physical-transition correlation | P1 | Joint distribution modeling |
| TR-008 | Real options valuation | P1 | Binomial trees for flexibility |

#### 3.3.2 Calculation Engine Specifications

**Carbon Price Trajectory:**
```python
class CarbonPriceModel:
    """
    Models carbon price trajectories across scenarios
    """
    
    def __init__(self, scenario: str):
        self.scenario = scenario
        self.params = self.load_scenario_params(scenario)
    
    def price(self, year: int) -> float:
        """
        Calculate carbon price for given year
        
        Formula: P_t = P_0 * exp(g_t * t) + jump_t
        """
        base_year = 2025
        t = year - base_year
        
        # Base exponential growth
        P0 = self.params['initial_price']
        g = self.params['growth_rate']
        price = P0 * np.exp(g * t)
        
        # Add policy jump for delayed transition
        if self.scenario == 'Delayed Transition':
            jump_year = 2035
            if year >= jump_year:
                price *= self.params['jump_multiplier']
        
        return price
    
    def trajectory(self, years: List[int]) -> pd.Series:
        """Generate price trajectory"""
        return pd.Series(
            [self.price(y) for y in years],
            index=years,
            name=f'Carbon_Price_{self.scenario}'
        )
```

**Stranded Asset Valuation:**
```python
class StrandedAssetValuation:
    """
    Real options valuation for stranded assets
    """
    
    def __init__(
        self,
        cash_flows: pd.Series,
        salvage_value: float,
        carbon_intensity: float,
        carbon_price_model: CarbonPriceModel
    ):
        self.cash_flows = cash_flows
        self.salvage_value = salvage_value
        self.carbon_intensity = carbon_intensity
        self.carbon_price = carbon_price_model
    
    def value_with_flexibility(
        self,
        discount_rate: float = 0.08,
        volatility: float = 0.2
    ) -> Dict[str, float]:
        """
        Value asset with option to abandon
        
        Uses binomial tree for American option pricing
        """
        T = len(self.cash_flows)
        dt = 1.0
        
        # Binomial tree parameters
        u = np.exp(volatility * np.sqrt(dt))
        d = 1 / u
        p = (np.exp(discount_rate * dt) - d) / (u - d)
        
        # Initialize terminal values
        values = np.zeros((T + 1, T + 1))
        for j in range(T + 1):
            # Value if operating
            operating_value = sum([
                self.cash_flows[t] / (1 + discount_rate) ** t
                for t in range(T)
            ])
            # Value if abandoned
            abandon_value = self.salvage_value
            # Choose maximum
            values[T, j] = max(operating_value, abandon_value)
        
        # Backward induction
        for t in range(T - 1, -1, -1):
            for j in range(t + 1):
                # Expected continuation value
                continuation = (p * values[t + 1, j + 1] + 
                               (1 - p) * values[t + 1, j]) / (1 + discount_rate)
                
                # Immediate exercise (abandon)
                exercise = self.salvage_value / (1 + discount_rate) ** t
                
                # Optimal decision
                values[t, j] = max(continuation, exercise)
        
        return {
            'value_with_flexibility': values[0, 0],
            'value_without_flexibility': sum([
                self.cash_flows[t] / (1 + discount_rate) ** t
                for t in range(T)
            ]),
            'option_value': values[0, 0] - sum([
                self.cash_flows[t] / (1 + discount_rate) ** t
                for t in range(T)
            ]),
            'optimal_abandonment_year': self.find_optimal_abandonment(values)
        }
```

---

### 3.4 Module: Credit Risk Engine

**Module ID:** MOD-CREDIT-001  
**Priority:** P0 (Critical)

#### 3.4.1 Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CR-001 | Climate-adjusted PD model | P0 | Merton model with climate sigma |
| CR-002 | Climate-adjusted LGD model | P0 | Collateral value haircuts |
| CR-003 | ECL calculation (IFRS 9) | P0 | Three-stage model with scenarios |
| CR-004 | ICAAP capital add-ons | P0 | Pillar 2 climate risk capital |
| CR-005 | ILAAP liquidity stress | P0 | Stranded asset liquidity impact |
| CR-006 | Collateral haircut model | P0 | Dynamic haircuts from risk scores |
| CR-007 | Sovereign risk model | P1 | Country-level climate vulnerability |
| CR-008 | MBS/CMBS risk model | P1 | Spatial concentration, tranche analysis |

#### 3.4.2 Calculation Engine Specifications

**Climate-Adjusted Merton Model:**
```python
class ClimateMertonModel:
    """
    Merton structural credit model with climate risk adjustment
    """
    
    def __init__(
        self,
        firm_value: float,
        debt_face_value: float,
        risk_free_rate: float,
        time_to_maturity: float,
        base_volatility: float,
        climate_risk_score: float,
        climate_beta: float = 0.3
    ):
        self.V = firm_value
        self.D = debt_face_value
        self.r = risk_free_rate
        self.T = time_to_maturity
        self.sigma_base = base_volatility
        self.climate_score = climate_risk_score
        self.climate_beta = climate_beta
    
    @property
    def climate_adjusted_volatility(self) -> float:
        """
        Adjust asset volatility for climate risk
        
        sigma_climate = sigma_base * (1 + beta * climate_score)
        """
        return self.sigma_base * (1 + self.climate_beta * self.climate_score)
    
    def distance_to_default(self) -> float:
        """
        Calculate distance to default with climate adjustment
        
        DD = [ln(V/D) + (mu - 0.5*sigma^2)*T] / (sigma*sqrt(T))
        """
        sigma = self.climate_adjusted_volatility
        mu = self.r  # simplified assumption
        
        dd = (
            np.log(self.V / self.D) + 
            (mu - 0.5 * sigma ** 2) * self.T
        ) / (sigma * np.sqrt(self.T))
        
        return dd
    
    def probability_of_default(self) -> float:
        """PD = N(-DD)"""
        from scipy.stats import norm
        return norm.cdf(-self.distance_to_default())
    
    def expected_loss(self) -> float:
        """EL = EAD * PD * LGD"""
        ead = self.D
        pd = self.probability_of_default()
        lgd = self.calculate_lgd()
        return ead * pd * lgd
    
    def calculate_lgd(self) -> float:
        """
        Calculate LGD with climate adjustment to collateral
        """
        # Base recovery rate
        rr_base = 0.4
        
        # Climate haircut to collateral
        climate_haircut = self.climate_score * 0.2  # 20% max haircut
        
        # Adjusted recovery
        rr_adjusted = rr_base * (1 - climate_haircut)
        
        return 1 - rr_adjusted
```

**IFRS 9 ECL Calculation:**
```python
class IFRS9ECL:
    """
    IFRS 9 Expected Credit Loss with climate scenarios
    """
    
    def __init__(
        self,
        exposures: pd.DataFrame,
        pd_term_structure: pd.DataFrame,
        lgd_term_structure: pd.DataFrame,
        scenarios: List[str],
        scenario_weights: Dict[str, float]
    ):
        self.exposures = exposures
        self.pd_ts = pd_term_structure
        self.lgd_ts = lgd_term_structure
        self.scenarios = scenarios
        self.weights = scenario_weights
    
    def calculate_ecl(self, stage: int = 1) -> pd.DataFrame:
        """
        Calculate ECL for all exposures
        
        Stage 1: 12-month ECL
        Stage 2: Lifetime ECL
        Stage 3: Lifetime ECL (credit-impaired)
        """
        results = []
        
        for _, exposure in self.exposures.iterrows():
            ecl_scenarios = []
            
            for scenario in self.scenarios:
                # Get scenario-specific PD/LGD
                pd_curve = self.pd_ts[scenario]
                lgd_curve = self.lgd_ts[scenario]
                
                # Calculate ECL for this scenario
                if stage == 1:
                    ecl = self._12m_ecl(exposure, pd_curve, lgd_curve)
                else:
                    ecl = self._lifetime_ecl(exposure, pd_curve, lgd_curve)
                
                ecl_scenarios.append({
                    'scenario': scenario,
                    'ecl': ecl,
                    'weight': self.weights[scenario]
                })
            
            # Weighted average across scenarios
            weighted_ecl = sum([
                e['ecl'] * e['weight'] 
                for e in ecl_scenarios
            ])
            
            results.append({
                'exposure_id': exposure['id'],
                'stage': stage,
                'ecl': weighted_ecl,
                'ecl_by_scenario': ecl_scenarios
            })
        
        return pd.DataFrame(results)
    
    def _lifetime_ecl(
        self,
        exposure: pd.Series,
        pd_curve: pd.Series,
        lgd_curve: pd.Series
    ) -> float:
        """
        Calculate lifetime ECL
        
        ECL = sum_t [PD_t * LGD_t * EAD_t * DF_t]
        """
        ecl = 0
        for t in range(1, len(pd_curve) + 1):
            pd_t = pd_curve.iloc[t-1]
            lgd_t = lgd_curve.iloc[t-1]
            ead_t = exposure['ead'] * (1 - exposure['amortization_rate']) ** t
            df_t = 1 / (1 + exposure['discount_rate']) ** t
            
            ecl += pd_t * lgd_t * ead_t * df_t
        
        return ecl
```

---

## 4. Calculation Engines

### 4.1 Physical Risk Calculation Engine

**Engine ID:** ENG-PHYSICAL-001

#### 4.1.1 Core Calculations

| Calculation | Formula | Implementation |
|-------------|---------|----------------|
| **Expected Annual Loss (EAL)** | $EAL = \int_0^\infty Damage(IM) \cdot f_{IM}(IM) \cdot dIM$ | Numerical integration |
| **Probable Maximum Loss (PML)** | $PML_T = F_{Loss}^{-1}(1 - 1/T)$ | Empirical quantile |
| **Value at Risk (VaR)** | $VaR_\alpha = F_{Loss}^{-1}(\alpha)$ | Historical or parametric |
| **Conditional VaR (CVaR)** | $CVaR_\alpha = E[Loss \| Loss > VaR_\alpha]$ | Expected shortfall |
| **Damage Ratio** | $DR = a \cdot IM^b$ | Power law fit |

#### 4.1.2 Multi-Hazard Compounding

```python
class MultiHazardCompounding:
    """
    Models compounding effects of multiple hazards using copulas
    """
    
    def __init__(self, hazards: List[str], copula_type: str = 'gaussian'):
        self.hazards = hazards
        self.copula = self.initialize_copula(copula_type)
    
    def joint_damage_probability(
        self,
        hazard_intensities: Dict[str, float],
        damage_threshold: float
    ) -> float:
        """
        Calculate probability of damage exceeding threshold
        from multiple hazards using copula
        
        P(D > d | IM_1, IM_2, ...) = 1 - C(F_1(d), F_2(d), ...)
        """
        # Marginal damage probabilities
        marginal_probs = {
            h: self.damage_cdf(h, hazard_intensities[h], damage_threshold)
            for h in self.hazards
        }
        
        # Joint probability via copula
        joint_survival = self.copula.survival_function(
            [marginal_probs[h] for h in self.hazards]
        )
        
        return 1 - joint_survival
    
    def compound_damage_distribution(
        self,
        n_samples: int = 10000
    ) -> np.ndarray:
        """
        Generate samples from compound damage distribution
        """
        # Sample from copula
        copula_samples = self.copula.sample(n_samples)
        
        # Transform to damage space
        damages = np.zeros(n_samples)
        for i, h in enumerate(self.hazards):
            damages += self.inverse_damage_cdf(h, copula_samples[:, i])
        
        return damages
```

---

### 4.2 Transition Risk Calculation Engine

**Engine ID:** ENG-TRANSITION-001

#### 4.2.1 Core Calculations

| Calculation | Formula | Implementation |
|-------------|---------|----------------|
| **Carbon Cost** | $CC_t = E_t \cdot P_t^{carbon}$ | Emissions × carbon price |
| **DCF Impairment** | $\Delta V = \sum_t \frac{\Delta CF_t}{(1+r)^t}$ | Discounted cash flow |
| **Stranded Value** | $SV = \sum_{t=T+1}^{T^*} \frac{CF_t}{(1+r)^t}$ | Lost value from early retirement |
| **Technology S-Curve** | $MS_t = \frac{L}{1 + e^{-k(t-t_0)}}$ | Market share adoption |
| **Learning Curve** | $C_t = C_0 \cdot (\frac{Q_t}{Q_0})^{-b}$ | Cost reduction with scale |

---

### 4.3 Portfolio Aggregation Engine

**Engine ID:** ENG-PORTFOLIO-001

#### 4.3.1 Core Calculations

```python
class PortfolioAggregationEngine:
    """
    Aggregates individual asset risks to portfolio level
    """
    
    def __init__(
        self,
        assets: pd.DataFrame,
        correlation_matrix: pd.DataFrame
    ):
        self.assets = assets
        self.corr = correlation_matrix
    
    def portfolio_var(
        self,
        confidence: float = 0.95,
        method: str = 'historical'
    ) -> float:
        """
        Calculate portfolio Value at Risk
        
        Methods: 'historical', 'parametric', 'monte_carlo'
        """
        if method == 'parametric':
            # Variance-covariance approach
            weights = self.assets['weight'].values
            cov = np.diag(self.assets['std']) @ self.corr @ np.diag(self.assets['std'])
            portfolio_std = np.sqrt(weights @ cov @ weights)
            
            from scipy.stats import norm
            z = norm.ppf(confidence)
            return z * portfolio_std
        
        elif method == 'monte_carlo':
            # Monte Carlo simulation
            n_sims = 10000
            returns = np.random.multivariate_normal(
                mean=self.assets['expected_return'],
                cov=self.corr * np.outer(self.assets['std'], self.assets['std']),
                size=n_sims
            )
            portfolio_returns = returns @ self.assets['weight']
            return np.percentile(portfolio_returns, (1 - confidence) * 100)
        
        elif method == 'historical':
            # Historical simulation
            historical_returns = self.get_historical_returns()
            portfolio_returns = historical_returns @ self.assets['weight']
            return np.percentile(portfolio_returns, (1 - confidence) * 100)
    
    def marginal_var_contribution(self) -> pd.Series:
        """
        Calculate marginal VaR contribution for each asset
        
        MVaR_i = VaR_portfolio * (Cov(R_i, R_p) / Var(R_p))
        """
        portfolio_var = self.portfolio_var()
        
        cov_with_portfolio = self.corr @ self.assets['weight'] * self.assets['std'] * self.portfolio_std()
        
        mvar = portfolio_var * cov_with_portfolio / (self.portfolio_std() ** 2)
        
        return pd.Series(mvar, index=self.assets.index, name='Marginal_VaR')
```

---

## 5. Machine Learning Algorithms

### 5.1 Algorithm Inventory

| Algorithm | Type | Use Case | Data Requirements | Complexity |
|-----------|------|----------|-------------------|------------|
| **iTransformer** | Time Series | Multivariate climate forecasting | 10K+ time steps, 10+ variables | High |
| **Informer** | Time Series | Long-term projections | 10K+ time steps | High |
| **PatchTST** | Time Series | Short-term hazard prediction | 1K+ time steps | Medium |
| **GraphCast** | GNN | Weather forecasting | Grid data, 100K+ points | Very High |
| **ST-GNN** | Spatial-Temporal | Portfolio contagion | Graph + time series | High |
| **GNN-rP** | GNN + EVT | Extreme risk zoning | Spatial extremes | High |
| **XGBoost** | Gradient Boosting | Damage prediction | 1K+ samples, tabular | Low |
| **LightGBM** | Gradient Boosting | Large-scale scoring | 100K+ samples | Low |
| **BNN** | Bayesian NN | Uncertainty quantification | 1K+ samples | High |
| **GP** | Gaussian Process | Small data, high uncertainty | <1K samples | Medium |
| **PINN** | Physics-Guided | Process-aware prediction | Physics + data | Very High |
| **PPO/SAC** | Reinforcement Learning | Optimal adaptation | Simulation environment | Very High |

### 5.2 iTransformer Implementation

```python
class iTransformerClimate:
    """
    iTransformer for multivariate climate time series forecasting
    """
    
    def __init__(
        self,
        input_len: int = 168,  # 7 days hourly
        pred_len: int = 24,    # 1 day ahead
        d_model: int = 512,
        n_heads: int = 8,
        e_layers: int = 2,
        d_layers: int = 1,
        d_ff: int = 2048,
        dropout: float = 0.1
    ):
        self.input_len = input_len
        self.pred_len = pred_len
        self.d_model = d_model
        
        # Embedding for each variable's time series
        self.value_embedding = nn.Linear(input_len, d_model)
        
        # Transformer encoder (attention across variables)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=n_heads,
            dim_feedforward=d_ff,
            dropout=dropout,
            batch_first=True
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=e_layers)
        
        # Decoder
        decoder_layer = nn.TransformerDecoderLayer(
            d_model=d_model,
            nhead=n_heads,
            dim_feedforward=d_ff,
            dropout=dropout,
            batch_first=True
        )
        self.decoder = nn.TransformerDecoder(decoder_layer, num_layers=d_layers)
        
        # Output projection
        self.projection = nn.Linear(d_model, pred_len)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass
        
        Args:
            x: [batch, seq_len, n_vars] - multivariate time series
            
        Returns:
            [batch, pred_len, n_vars] - forecasts
        """
        batch, seq_len, n_vars = x.shape
        
        # Invert: treat each variable as a token
        # [batch, n_vars, seq_len]
        x_inv = x.permute(0, 2, 1)
        
        # Embed each variable's series
        # [batch, n_vars, d_model]
        x_emb = self.value_embedding(x_inv)
        
        # Encoder: attention across variables
        enc_out = self.encoder(x_emb)  # [batch, n_vars, d_model]
        
        # Decoder (simplified - using encoder output directly)
        # In practice, would have separate decoder input
        dec_out = self.decoder(enc_out, enc_out)
        
        # Project to prediction length
        # [batch, n_vars, pred_len]
        out = self.projection(dec_out)
        
        # Invert back: [batch, pred_len, n_vars]
        return out.permute(0, 2, 1)
```

### 5.3 ST-GNN Implementation

```python
class STGNNRisk(nn.Module):
    """
    Spatial-Temporal Graph Neural Network for portfolio risk
    """
    
    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        num_nodes: int,
        K: int = 3,  # Chebyshev polynomial order
        Kt: int = 3  # Temporal kernel size
    ):
        super().__init__()
        
        # Spatial convolution (Chebyshev)
        self.spatial_conv = ChebConv(in_channels, out_channels, K=K)
        
        # Temporal convolution
        self.temporal_conv = nn.Conv2d(
            out_channels, out_channels,
            kernel_size=(Kt, 1),
            padding=(Kt // 2, 0)
        )
        
        # Output layer
        self.fc = nn.Linear(out_channels, 1)
    
    def forward(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_weight: torch.Tensor
    ) -> torch.Tensor:
        """
        Forward pass
        
        Args:
            x: [batch, time, nodes, features]
            edge_index: [2, num_edges]
            edge_weight: [num_edges]
            
        Returns:
            [batch, nodes] - risk scores
        """
        batch, time, nodes, features = x.shape
        
        # Process each time step
        spatial_out = []
        for t in range(time):
            x_t = x[:, t, :, :]  # [batch, nodes, features]
            
            # Reshape for batch processing
            x_t_flat = x_t.reshape(-1, features)  # [batch*nodes, features]
            
            # Spatial convolution
            h = self.spatial_conv(
                x_t_flat, 
                edge_index, 
                edge_weight
            )  # [batch*nodes, out_channels]
            
            h = h.reshape(batch, nodes, -1)
            spatial_out.append(h)
        
        # Stack temporal dimension
        h_spatial = torch.stack(spatial_out, dim=1)  # [batch, time, nodes, out_channels]
        
        # Temporal convolution
        h_temp = self.temporal_conv(
            h_spatial.permute(0, 3, 1, 2)  # [batch, out_channels, time, nodes]
        )  # [batch, out_channels, time, nodes]
        
        # Take last time step
        h_last = h_temp[:, :, -1, :]  # [batch, out_channels, nodes]
        
        # Output risk score per node
        risk = self.fc(h_last.permute(0, 2, 1))  # [batch, nodes, 1]
        
        return torch.sigmoid(risk.squeeze(-1))  # [batch, nodes]
```

### 5.4 XGBoost Ensemble Implementation

```python
class XGBoostRiskEnsemble:
    """
    XGBoost ensemble with quantile regression for uncertainty
    """
    
    def __init__(self):
        self.models = {}
        self.quantiles = [0.05, 0.25, 0.5, 0.75, 0.95]
    
    def fit(self, X: pd.DataFrame, y: pd.Series):
        """Train quantile regression models"""
        import xgboost as xgb
        
        for q in self.quantiles:
            model = xgb.XGBRegressor(
                objective='reg:quantileerror',
                quantile_alpha=q,
                n_estimators=1000,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
            model.fit(X, y)
            self.models[q] = model
    
    def predict(self, X: pd.DataFrame) -> pd.DataFrame:
        """Predict with uncertainty bands"""
        predictions = {}
        for q, model in self.models.items():
            predictions[f'q{int(q*100)}'] = model.predict(X)
        
        return pd.DataFrame(predictions, index=X.index)
    
    def calculate_var(self, X: pd.DataFrame, confidence: float = 0.95) -> pd.Series:
        """Calculate VaR from quantile predictions"""
        pred = self.predict(X)
        var_column = f'q{int((1-confidence)*100)}'
        return pred[var_column]
```

---

## 6. Data Integration Layer

### 6.1 Data Source Configuration

```yaml
# data_sources.yaml
sources:
  # PAID - Already have access
  eodhd:
    type: paid
    cost: "$19-79/month"
    coverage: "Global financial markets"
    api_key: "${EODHD_API_KEY}"
    rate_limit: "1000/day"
    endpoints:
      - fundamentals
      - historical_prices
      - company_info
    
  brsr:
    type: paid
    cost: "Variable"
    coverage: "India top 1000 companies"
    access: "MCA21 portal"
    format: "XBRL, PDF"
  
  # FREE - Climate & Weather
  copernicus_cds:
    type: free
    coverage: "Global"
    registration: required
    api: cdsapi
    datasets:
      - era5_reanalysis
      - cmip6_projections
      - seasonal_forecasts
    
  noaa_cdo:
    type: free
    coverage: "Global (US-focused)"
    api_key: "${NOAA_TOKEN}"
    datasets:
      - ghcnd
      - storm_events
      
  nasa_power:
    type: free
    coverage: "Global"
    api: rest
    registration: none
    
  # FREE - Physical Hazards
  usgs_earthquake:
    type: free
    coverage: "Global"
    api: rest
    datasets:
      - earthquake_catalog
      - shakemaps
      
  fema_flood:
    type: free
    coverage: "US"
    format: shapefile
    
  # FREE - Financial
  sec_edgar:
    type: free
    coverage: "US public companies"
    api: rest
    user_agent: required
    datasets:
      - company_facts
      - filings
      - xbrl
      
  # FREE - ESG
  cdp:
    type: free
    coverage: "10,000+ companies"
    format: csv
    
  # FREE - Company
  opencorporates:
    type: free
    coverage: "200M+ companies"
    api_key: "${OPENCORPORATES_KEY}"
    
  # FREE - Geospatial
  openstreetmap:
    type: free
    coverage: "Global"
    api: overpass
    tools:
      - osmnx
      - geopandas
```

### 6.2 Data Ingestion Pipeline

```python
class DataIngestionPipeline:
    """
    Unified data ingestion from multiple sources
    """
    
    def __init__(self, config_path: str):
        with open(config_path) as f:
            self.config = yaml.safe_load(f)
        
        self.clients = {}
        self.cache = redis.Redis()
    
    def get_client(self, source_name: str):
        """Get or create client for data source"""
        if source_name not in self.clients:
            config = self.config['sources'][source_name]
            self.clients[source_name] = self.create_client(config)
        return self.clients[source_name]
    
    def ingest(
        self,
        source_name: str,
        dataset: str,
        params: Dict,
        use_cache: bool = True
    ) -> pd.DataFrame:
        """
        Ingest data from source
        
        Args:
            source_name: Name of data source
            dataset: Dataset identifier
            params: Query parameters
            use_cache: Whether to use caching
            
        Returns:
            DataFrame with ingested data
        """
        # Check cache
        cache_key = self._make_cache_key(source_name, dataset, params)
        if use_cache:
            cached = self.cache.get(cache_key)
            if cached:
                return pd.read_msgpack(cached)
        
        # Fetch from source
        client = self.get_client(source_name)
        data = client.fetch(dataset, params)
        
        # Transform to standard format
        transformed = self.transform(data, source_name, dataset)
        
        # Cache result
        if use_cache:
            self.cache.setex(
                cache_key,
                86400,  # 24 hours
                transformed.to_msgpack()
            )
        
        return transformed
    
    def transform(
        self,
        data: Any,
        source_name: str,
        dataset: str
    ) -> pd.DataFrame:
        """Transform raw data to standard schema"""
        # Get transformation rules
        rules = self.config['transforms'][source_name][dataset]
        
        # Apply transformations
        df = pd.DataFrame(data)
        
        # Rename columns
        if 'column_mapping' in rules:
            df = df.rename(columns=rules['column_mapping'])
        
        # Convert units
        if 'unit_conversions' in rules:
            for col, conversion in rules['unit_conversions'].items():
                df[col] = df[col] * conversion['factor']
        
        # Add metadata
        df['source'] = source_name
        df['ingested_at'] = pd.Timestamp.now()
        
        return df
```

---

## 7. API Specifications

### 7.1 REST API Endpoints

```python
# Main API router
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer

app = FastAPI(
    title="AA Impact Climate Risk API",
    version="1.0.0",
    description="Enterprise climate risk modeling platform"
)

security = HTTPBearer()

# ============ SCENARIO ENDPOINTS ============

@app.get("/v1/scenarios")
async def list_scenarios(
    provider: Optional[str] = None,
    temperature: Optional[float] = None,
    token: str = Depends(security)
):
    """List available climate scenarios"""
    pass

@app.get("/v1/scenarios/{scenario_id}/projections")
async def get_projections(
    scenario_id: UUID,
    variables: List[str],
    years: List[int],
    token: str = Depends(security)
):
    """Get scenario projections for variables"""
    pass

@app.post("/v1/scenarios/ensemble")
async def create_ensemble(
    request: EnsembleRequest,
    token: str = Depends(security)
):
    """Generate ensemble from multiple scenarios"""
    pass

# ============ PHYSICAL RISK ENDPOINTS ============

@app.post("/v1/physical-risk/assess")
async def assess_physical_risk(
    request: PhysicalRiskRequest,
    token: str = Depends(security)
):
    """
    Assess physical risk for assets
    
    Request body:
    {
        "assets": [{"id": "...", "lat": 40.7, "lon": -74.0, "value": 1000000}],
        "hazards": ["flood", "earthquake", "wind"],
        "scenarios": ["current", "2050_RCP85"],
        "return_periods": [100, 250, 500]
    }
    """
    pass

@app.get("/v1/physical-risk/portfolio/{portfolio_id}/var")
async def calculate_portfolio_var(
    portfolio_id: UUID,
    confidence: float = 0.95,
    time_horizon: int = 1,
    token: str = Depends(security)
):
    """Calculate portfolio VaR from physical risk"""
    pass

# ============ TRANSITION RISK ENDPOINTS ============

@app.post("/v1/transition-risk/assess")
async def assess_transition_risk(
    request: TransitionRiskRequest,
    token: str = Depends(security)
):
    """
    Assess transition risk for companies
    
    Request body:
    {
        "companies": [{"ticker": "AAPL", "sector": "Technology"}],
        "scenario": "NGFS_NZ2050",
        "time_horizon": 2050
    }
    """
    pass

@app.post("/v1/transition-risk/stranded-assets")
async def calculate_stranded_assets(
    request: StrandedAssetRequest,
    token: str = Depends(security)
):
    """Calculate stranded asset value"""
    pass

# ============ CREDIT RISK ENDPOINTS ============

@app.post("/v1/credit-risk/pd")
async def calculate_pd(
    request: PDRequest,
    token: str = Depends(security)
):
    """Calculate probability of default with climate adjustment"""
    pass

@app.post("/v1/credit-risk/ecl")
async def calculate_ecl(
    request: ECLRequest,
    token: str = Depends(security)
):
    """Calculate expected credit loss (IFRS 9)"""
    pass

@app.post("/v1/credit-risk/capital")
async def calculate_capital(
    request: CapitalRequest,
    token: str = Depends(security)
):
    """Calculate ICAAP capital requirements"""
    pass

# ============ ML INFERENCE ENDPOINTS ============

@app.post("/v1/ml/forecast")
async def ml_forecast(
    request: ForecastRequest,
    model: str = "itransformer",
    token: str = Depends(security)
):
    """Run ML model inference"""
    pass

@app.get("/v1/ml/models")
async def list_models(
    token: str = Depends(security)
):
    """List available ML models"""
    pass
```

---

## 8. Implementation Roadmap

### 8.1 Phase 1: Foundation (Months 1-3)

| Week | Deliverable | Owner | Dependencies |
|------|-------------|-------|--------------|
| 1-2 | Infrastructure setup (Supabase, Railway) | DevOps | None |
| 2-3 | Data ingestion pipelines (Copernicus, SEC) | Data Eng | Infrastructure |
| 3-4 | Scenario management service | Backend | Data pipelines |
| 4-6 | Physical risk engine (basic) | Quant Dev | Scenarios |
| 6-8 | XGBoost/LightGBM models | ML Eng | Physical risk |
| 8-10 | API layer (FastAPI) | Backend | All engines |
| 10-12 | Web UI (React) | Frontend | API |

### 8.2 Phase 2: Core Features (Months 4-6)

| Week | Deliverable | Owner |
|------|-------------|-------|
| 13-14 | Transition risk engine | Quant Dev |
| 14-16 | Credit risk engine (Merton, ECL) | Quant Dev |
| 16-18 | iTransformer implementation | ML Eng |
| 18-20 | ST-GNN for portfolio risk | ML Eng |
| 20-22 | BNN uncertainty quantification | ML Eng |
| 22-24 | Integration testing | QA |

### 8.3 Phase 3: Advanced Features (Months 7-9)

| Week | Deliverable | Owner |
|------|-------------|-------|
| 25-26 | GraphCast weather forecasting | ML Eng |
| 26-28 | Real options valuation | Quant Dev |
| 28-30 | Multi-hazard compounding (copulas) | Quant Dev |
| 30-32 | Portfolio optimization | Quant Dev |
| 32-34 | Stress testing framework | Quant Dev |
| 34-36 | Regulatory reporting | Backend |

### 8.4 Phase 4: Production (Months 10-12)

| Week | Deliverable | Owner |
|------|-------------|-------|
| 37-38 | Performance optimization | DevOps |
| 38-40 | Security hardening | Security |
| 40-42 | Documentation completion | Tech Writers |
| 42-44 | User acceptance testing | QA + Users |
| 44-46 | Production deployment | DevOps |
| 46-48 | Training and handover | All |

---

## 9. Non-Functional Requirements

### 9.1 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time (p95)** | <500ms | Prometheus |
| **ML Inference Time** | <100ms | MLflow |
| **Batch Processing** | 100K assets/hour | Custom metrics |
| **Data Ingestion** | 10K records/minute | Pipeline metrics |
| **Concurrent Users** | 1,000 | Load testing |
| **Availability** | 99.9% | Uptime monitoring |

### 9.2 Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Authentication** | JWT tokens, OAuth2 |
| **Authorization** | RBAC with fine-grained permissions |
| **Data Encryption** | AES-256 at rest, TLS 1.3 in transit |
| **API Rate Limiting** | 1000 requests/hour per user |
| **Audit Logging** | All API calls logged |
| **PII Protection** | Data anonymization for ML training |

### 9.3 Scalability Requirements

| Component | Scaling Strategy |
|-----------|------------------|
| **API Services** | Horizontal (K8s HPA) |
| **ML Inference** | GPU autoscaling (Triton) |
| **Database** | Read replicas, connection pooling |
| **Cache** | Redis Cluster |
| **Task Queue** | Celery worker autoscaling |

---

## 10. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **EAL** | Expected Annual Loss |
| **PML** | Probable Maximum Loss |
| **VaR** | Value at Risk |
| **CVaR** | Conditional Value at Risk (Expected Shortfall) |
| **PD** | Probability of Default |
| **LGD** | Loss Given Default |
| **EAD** | Exposure at Default |
| **ECL** | Expected Credit Loss |
| **ICAAP** | Internal Capital Adequacy Assessment Process |
| **ILAAP** | Internal Liquidity Adequacy Assessment Process |

### Appendix B: Complete File Inventory

| Category | Files | Lines |
|----------|-------|-------|
| **Original Framework** | 17 | 31,307 |
| **Scenario Integration** | 3 | 2,361 |
| **Global Reference Data** | 3 | 2,358 |
| **Advanced ML Models** | 3 | 2,452 |
| **Unified Requirements** | 1 | This document |
| **TOTAL** | **27** | **40,000+** |

### Appendix C: Technology Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React | 18.x |
| **API** | FastAPI | 0.100+ |
| **ML** | PyTorch | 2.0+ |
| **GNN** | PyTorch Geometric | 2.3+ |
| **Boosting** | XGBoost | 2.0+ |
| **Database** | PostgreSQL | 15+ |
| **Spatial** | PostGIS | 3.3+ |
| **Cache** | Redis | 7+ |
| **Queue** | Celery | 5.3+ |
| **ML Registry** | MLflow | 2.7+ |
| **Deployment** | Railway | Latest |
| **Monitoring** | Prometheus/Grafana | Latest |

---

*End of Unified Requirements Specification*
