# Integration Guide: Climate Risk Module into Existing Application
## Onboarding Files, Reference Data, and Implementation Steps

---

**Document Classification:** Integration Guide  
**Version:** 1.0  
**Date:** April 2026  
**Target:** Engineering teams integrating climate risk into existing platforms  

---

## Table of Contents

1. [Files to Onboard](#1-files-to-onboard)
2. [Reference Data Requirements](#2-reference-data-requirements)
3. [Integration Architecture](#3-integration-architecture)
4. [Implementation Steps](#4-implementation-steps)
5. [API Contract Specification](#5-api-contract-specification)
6. [Database Schema Additions](#6-database-schema-additions)
7. [Testing & Validation](#7-testing--validation)
8. [Deployment Checklist](#8-deployment-checklist)

---

## 1. Files to Onboard

### 1.1 Core Implementation Files (Required)

| File | Purpose | Priority | Location in Your Repo |
|------|---------|----------|----------------------|
| `models/scenario.py` | Scenario data models | P0 | `/app/models/climate_risk/` |
| `models/physical_risk.py` | Physical risk data models | P0 | `/app/models/climate_risk/` |
| `models/transition_risk.py` | Transition risk data models | P0 | `/app/models/climate_risk/` |
| `models/credit_risk.py` | Credit risk data models | P0 | `/app/models/climate_risk/` |
| `services/scenario_service.py` | Scenario management logic | P0 | `/app/services/climate_risk/` |
| `services/physical_risk_service.py` | Physical risk calculations | P0 | `/app/services/climate_risk/` |
| `services/transition_risk_service.py` | Transition risk calculations | P0 | `/app/services/climate_risk/` |
| `services/credit_risk_service.py` | Credit risk calculations | P0 | `/app/services/climate_risk/` |
| `api/routes/climate_risk.py` | API endpoints | P0 | `/app/api/routes/` |
| `ml/models/xgboost_damage.py` | XGBoost damage prediction | P0 | `/app/ml/models/` |
| `ml/models/bnn_uncertainty.py` | Bayesian uncertainty | P1 | `/app/ml/models/` |
| `data/ingestion/copernicus_client.py` | Copernicus CDS client | P0 | `/app/data/ingestion/` |
| `data/ingestion/usgs_client.py` | USGS hazard client | P0 | `/app/data/ingestion/` |
| `data/ingestion/sec_edgar_client.py` | SEC EDGAR client | P0 | `/app/data/ingestion/` |
| `core/calculations/var_calculator.py` | VaR/CVaR calculations | P0 | `/app/core/calculations/` |
| `core/calculations/ecl_calculator.py` | ECL (IFRS 9) calculations | P0 | `/app/core/calculations/` |

### 1.2 Configuration Files (Required)

| File | Purpose | Location |
|------|---------|----------|
| `config/climate_risk.yaml` | Climate risk configuration | `/app/config/` |
| `config/data_sources.yaml` | Data source credentials | `/app/config/` |
| `alembic/versions/*_add_climate_risk_tables.py` | Database migrations | `/alembic/versions/` |
| `docker/Dockerfile.ml` | ML service Dockerfile | `/docker/` |
| `docker/docker-compose.climate-risk.yml` | Climate risk services | `/docker/` |

### 1.3 Frontend Files (If Applicable)

| File | Purpose | Location |
|------|---------|----------|
| `frontend/src/components/ClimateRiskDashboard.tsx` | Main dashboard | `/frontend/src/components/climate-risk/` |
| `frontend/src/components/RiskHeatMap.tsx` | Risk visualization | `/frontend/src/components/climate-risk/` |
| `frontend/src/components/ScenarioComparison.tsx` | Scenario comparison | `/frontend/src/components/climate-risk/` |
| `frontend/src/services/climateRiskApi.ts` | API client | `/frontend/src/services/` |

### 1.4 Documentation Files (Reference Only)

| File | Purpose | Keep In |
|------|---------|---------|
| `UNIFIED_REQUIREMENTS_SPECIFICATION.md` | Complete spec | `/docs/climate-risk/` |
| `CLAUDE_CODE_BUILD_PROMPT.md` | Build reference | `/docs/climate-risk/` |
| `FREE_LOW_COST_DATA_SOURCES.md` | Data source catalog | `/docs/climate-risk/` |
| `ADVANCED_ML_MODELS_CLIMATE_RISK.md` | ML model reference | `/docs/climate-risk/` |

---

## 2. Reference Data Requirements

### 2.1 Static Reference Data (Load Once)

| Dataset | Records | Size | Source | Update Frequency |
|---------|---------|------|--------|------------------|
| **NGFS Scenarios** | 6 main × 180 countries × 76 years | ~50 MB | NGFS Portal | Annual (Nov) |
| **IEA WEO Scenarios** | 3 scenarios × sectors × years | ~20 MB | IEA | Annual (Oct) |
| **IPCC AR6 Scenarios** | 3,131 scenarios | ~500 MB | IIASA | 6-7 years |
| **World Bank Country Data** | 200+ countries | ~5 MB | World Bank API | Quarterly |
| **Sector Classifications** | 50+ sectors | ~1 MB | Manual/GICS | Annual |
| **Hazard Return Period Maps** | Global grids | ~10 GB | USGS/Copernicus | Annual |

### 2.2 Dynamic Reference Data (Regular Updates)

| Dataset | Records | Update Frequency | Source |
|---------|---------|------------------|--------|
| **ERA5 Climate Data** | Hourly global | Daily | Copernicus CDS |
| **USGS Earthquakes** | Real-time | Continuous | USGS API |
| **NOAA Weather** | Hourly stations | Hourly | NOAA API |
| **SEC EDGAR Filings** | 10-K, 10-Q | Daily | SEC API |
| **CDP Emissions Data** | 10,000+ companies | Annual | CDP Portal |
| **Stock Prices (EODHD)** | Daily OHLCV | Daily | EODHD API |

### 2.3 Reference Data Storage Requirements

```
Storage Estimate:
├── Static Data: ~100 GB (one-time load)
├── Time Series (5 years): ~500 GB
├── ML Models: ~50 GB
└── User Data: Scales with usage

Total Initial: ~650 GB
Annual Growth: ~200 GB/year
```

### 2.4 Reference Data Load Scripts

```python
# scripts/load_reference_data.py
"""
One-time script to load all reference data
"""

import asyncio
from app.data.ingestion import (
    NGFSClient, IEAClient, IPCCClient,
    WorldBankClient, USGSClient
)
from app.db.session import async_session

async def load_all_reference_data():
    """Load all static reference data"""
    
    async with async_session() as session:
        # 1. Load NGFS Scenarios
        print("Loading NGFS scenarios...")
        ngfs = NGFSClient()
        scenarios = await ngfs.download_all_scenarios()
        await session.bulk_insert_mappings(Scenario, scenarios)
        
        # 2. Load IEA WEO
        print("Loading IEA WEO scenarios...")
        iea = IEAClient()
        weo_data = await iea.download_weo_2024()
        await session.bulk_insert_mappings(ScenarioVariable, weo_data)
        
        # 3. Load World Bank country data
        print("Loading World Bank data...")
        wb = WorldBankClient()
        country_data = await wb.get_all_countries()
        await session.bulk_insert_mappings(Country, country_data)
        
        # 4. Load hazard maps (USGS)
        print("Loading hazard maps...")
        usgs = USGSClient()
        await usgs.download_earthquake_hazard_maps()
        
        await session.commit()
        print("Reference data loaded successfully!")

if __name__ == "__main__":
    asyncio.run(load_all_reference_data())
```

---

## 3. Integration Architecture

### 3.1 Integration Patterns

#### Pattern A: Microservice (Recommended for Large Apps)

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING APPLICATION                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Existing   │  │   Existing   │  │   Existing   │          │
│  │   Service A  │  │   Service B  │  │   Service C  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │ HTTP/gRPC
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              CLIMATE RISK MICROSERVICE (New)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Scenario   │  │   Physical   │  │  Transition  │          │
│  │   Service    │  │    Risk      │  │    Risk      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │   Credit     │  │     ML       │                            │
│  │    Risk      │  │  Inference   │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:** Independent deployment, scaling, technology choice  
**Cons:** Network latency, operational complexity

---

#### Pattern B: Library/Module (Recommended for Medium Apps)

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING APPLICATION                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CLIMATE RISK MODULE (Integrated)             │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐           │  │
│  │  │ Scenario   │ │ Physical   │ │ Transition │           │  │
│  │  │ Service    │ │ Risk       │ │ Risk       │           │  │
│  │  └────────────┘ └────────────┘ └────────────┘           │  │
│  │  ┌────────────┐ ┌────────────┐                          │  │
│  │  │ Credit     │ │ ML Models  │                          │  │
│  │  │ Risk       │ │            │                          │  │
│  │  └────────────┘ └────────────┘                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Existing   │  │   Existing   │  │   Existing   │          │
│  │   Service A  │  │   Service B  │  │   Service C  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:** Low latency, shared resources, simpler ops  
**Cons:** Tight coupling, shared deployment

---

#### Pattern C: Plugin/Extension (Recommended for Small Apps)

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING APPLICATION                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              EXISTING SERVICES                            │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐           │  │
│  │  │ Service A  │ │ Service B  │ │ Service C  │           │  │
│  │  └────────────┘ └────────────┘ └────────────┘           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         CLIMATE RISK PLUGIN (Extension Points)            │  │
│  │  • Risk hooks in portfolio service                        │  │
│  │  • Climate fields in asset models                         │  │
│  │  • Scenario endpoints in API                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:** Minimal changes, gradual adoption  
**Cons:** Limited functionality, technical debt

---

### 3.2 Recommended Integration Pattern by App Size

| App Size | Pattern | Rationale |
|----------|---------|-----------|
| **Small** (<10 services) | Pattern C (Plugin) | Minimize overhead |
| **Medium** (10-50 services) | Pattern B (Module) | Balance flexibility/simplicity |
| **Large** (50+ services) | Pattern A (Microservice) | Independent scaling |

---

## 4. Implementation Steps

### 4.1 Pre-Implementation Checklist

Before starting integration, ensure:

- [ ] **Database** can handle additional tables (estimate: +20 tables)
- [ ] **API Gateway** can route to new endpoints
- [ ] **Authentication** system can validate new service tokens
- [ ] **Monitoring** can track new metrics
- [ ] **CI/CD** can deploy new components
- [ ] **Team** has Python/FastAPI/PyTorch expertise

---

### 4.2 Phase 1: Database Schema (Week 1)

**Step 1.1: Create Migration File**

```python
# alembic/versions/2024_01_01_add_climate_risk_tables.py
"""Add climate risk tables

Revision ID: add_climate_risk_tables
Revises: <previous_revision>
Create Date: 2024-01-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_climate_risk_tables'
down_revision = '<previous_revision>'
branch_labels = None
depends_on = None


def upgrade():
    # Scenarios table
    op.create_table(
        'scenarios',
        sa.Column('scenario_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('scenario_code', sa.String(20), nullable=False),
        sa.Column('scenario_name', sa.String(100), nullable=False),
        sa.Column('temperature_outcome', sa.Numeric(3, 1)),
        sa.Column('description', sa.Text),
        sa.Column('version', sa.String(10)),
        sa.Column('release_date', sa.Date),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint('provider', 'scenario_code', 'version')
    )
    
    # Scenario variables table
    op.create_table(
        'scenario_variables',
        sa.Column('variable_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scenario_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('scenarios.scenario_id')),
        sa.Column('variable_name', sa.String(100), nullable=False),
        sa.Column('variable_category', sa.String(50)),
        sa.Column('unit', sa.String(20)),
        sa.Column('year', sa.Integer),
        sa.Column('value', sa.Numeric(18, 6)),
        sa.Column('confidence_lower', sa.Numeric(18, 6)),
        sa.Column('confidence_upper', sa.Numeric(18, 6)),
        sa.UniqueConstraint('scenario_id', 'variable_name', 'year')
    )
    
    # Asset climate risk table (links to existing assets)
    op.create_table(
        'asset_climate_risk',
        sa.Column('risk_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('assets.asset_id')),  # Your existing assets table
        sa.Column('calculation_date', sa.Date),
        sa.Column('physical_risk_score', sa.Numeric(5, 2)),
        sa.Column('transition_risk_score', sa.Numeric(5, 2)),
        sa.Column('combined_risk_score', sa.Numeric(5, 2)),
        sa.Column('flood_risk', sa.Numeric(5, 2)),
        sa.Column('earthquake_risk', sa.Numeric(5, 2)),
        sa.Column('wildfire_risk', sa.Numeric(5, 2)),
        sa.Column('wind_risk', sa.Numeric(5, 2)),
        sa.Column('heat_risk', sa.Numeric(5, 2)),
        sa.Column('drought_risk', sa.Numeric(5, 2)),
        sa.Column('stranding_risk', sa.Numeric(5, 2)),
        sa.Column('carbon_cost_2030', sa.Numeric(18, 2)),
        sa.Column('carbon_cost_2050', sa.Numeric(18, 2)),
        sa.Column('expected_loss_annual', sa.Numeric(18, 2)),
        sa.Column('var_95', sa.Numeric(18, 2)),
        sa.Column('var_99', sa.Numeric(18, 2)),
        sa.Column('metadata', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, onupdate=sa.func.now())
    )
    
    # Portfolio climate risk aggregation
    op.create_table(
        'portfolio_climate_risk',
        sa.Column('portfolio_risk_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('portfolio_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('portfolios.portfolio_id')),  # Your existing table
        sa.Column('scenario_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('scenarios.scenario_id')),
        sa.Column('calculation_date', sa.Date),
        sa.Column('total_expected_loss', sa.Numeric(18, 2)),
        sa.Column('portfolio_var_95', sa.Numeric(18, 2)),
        sa.Column('portfolio_var_99', sa.Numeric(18, 2)),
        sa.Column('portfolio_cvar_95', sa.Numeric(18, 2)),
        sa.Column('weighted_avg_risk_score', sa.Numeric(5, 2)),
        sa.Column('risk_concentration', sa.Numeric(5, 2)),
        sa.Column('geographic_exposure', postgresql.JSONB),
        sa.Column('sector_exposure', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now())
    )
    
    # Create indexes
    op.create_index('idx_asset_climate_risk_asset', 'asset_climate_risk', ['asset_id'])
    op.create_index('idx_asset_climate_risk_calc_date', 'asset_climate_risk', ['calculation_date'])
    op.create_index('idx_portfolio_climate_risk_portfolio', 'portfolio_climate_risk', ['portfolio_id'])
    op.create_index('idx_scenario_variables_scenario', 'scenario_variables', ['scenario_id'])
    op.create_index('idx_scenario_variables_name_year', 'scenario_variables', ['variable_name', 'year'])


def downgrade():
    op.drop_table('portfolio_climate_risk')
    op.drop_table('asset_climate_risk')
    op.drop_table('scenario_variables')
    op.drop_table('scenarios')
```

**Step 1.2: Run Migration**

```bash
# Run the migration
alembic upgrade add_climate_risk_tables

# Verify tables created
psql -d your_database -c "\dt"
```

---

### 4.3 Phase 2: Core Models (Week 1-2)

**Step 2.1: Create Pydantic Models**

```python
# app/models/climate_risk/__init__.py
"""Climate risk data models"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class ScenarioBase(BaseModel):
    """Base scenario model"""
    provider: str = Field(..., description="Scenario provider (NGFS, IEA, IPCC, IRENA)")
    scenario_code: str = Field(..., description="Provider-specific scenario code")
    scenario_name: str = Field(..., description="Human-readable scenario name")
    temperature_outcome: Optional[Decimal] = Field(None, description="Temperature outcome in Celsius")
    description: Optional[str] = None
    version: str = "1.0"
    release_date: Optional[date] = None


class ScenarioCreate(ScenarioBase):
    """Model for creating scenarios"""
    pass


class ScenarioResponse(ScenarioBase):
    """Model for scenario responses"""
    scenario_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class ScenarioVariable(BaseModel):
    """Time series variable for a scenario"""
    variable_name: str
    variable_category: Optional[str] = None
    unit: Optional[str] = None
    year: int
    value: Decimal
    confidence_lower: Optional[Decimal] = None
    confidence_upper: Optional[Decimal] = None


class EnsembleRequest(BaseModel):
    """Request to generate ensemble projection"""
    scenario_ids: List[UUID]
    variables: List[str]
    years: List[int]
    weight_method: str = "equal"  # equal, temperature, bma
    target_temperature: Optional[Decimal] = None


class EnsembleResponse(BaseModel):
    """Ensemble projection response"""
    ensemble_id: UUID
    variable_name: str
    projections: List[Dict[str, Any]]  # year, mean, lower, upper
    weights: Dict[UUID, Decimal]


class PhysicalRiskAssessment(BaseModel):
    """Physical risk assessment for an asset"""
    asset_id: UUID
    calculation_date: date
    
    # Overall scores
    physical_risk_score: Decimal = Field(..., ge=0, le=100)
    
    # Hazard-specific risks
    flood_risk: Optional[Decimal] = Field(None, ge=0, le=100)
    earthquake_risk: Optional[Decimal] = Field(None, ge=0, le=100)
    wildfire_risk: Optional[Decimal] = Field(None, ge=0, le=100)
    wind_risk: Optional[Decimal] = Field(None, ge=0, le=100)
    heat_risk: Optional[Decimal] = Field(None, ge=0, le=100)
    drought_risk: Optional[Decimal] = Field(None, ge=0, le=100)
    
    # Financial impact
    expected_loss_annual: Optional[Decimal] = None
    var_95: Optional[Decimal] = None
    var_99: Optional[Decimal] = None
    
    # Detailed results
    hazard_details: Optional[Dict[str, Any]] = None


class TransitionRiskAssessment(BaseModel):
    """Transition risk assessment for a company"""
    company_id: UUID
    calculation_date: date
    scenario_id: UUID
    
    # Risk scores
    transition_risk_score: Decimal = Field(..., ge=0, le=100)
    stranding_risk: Optional[Decimal] = Field(None, ge=0, le=100)
    
    # Carbon costs
    carbon_cost_2030: Optional[Decimal] = None
    carbon_cost_2050: Optional[Decimal] = None
    
    # Financial impact
    dcf_impairment: Optional[Decimal] = None
    stranded_value: Optional[Decimal] = None
    
    # Detailed results
    carbon_price_trajectory: Optional[List[Dict[str, Any]]] = None


class CreditRiskAssessment(BaseModel):
    """Climate-adjusted credit risk"""
    exposure_id: UUID
    calculation_date: date
    scenario_id: UUID
    
    # Risk metrics
    pd_baseline: Decimal
    pd_climate_adjusted: Decimal
    lgd_baseline: Decimal
    lgd_climate_adjusted: Decimal
    
    # ECL
    ecl_12m: Optional[Decimal] = None
    ecl_lifetime: Optional[Decimal] = None
    
    # Capital
    rwa_climate_adjusted: Optional[Decimal] = None
    capital_requirement: Optional[Decimal] = None


class PortfolioRiskAggregation(BaseModel):
    """Aggregated climate risk for a portfolio"""
    portfolio_id: UUID
    calculation_date: date
    scenario_id: UUID
    
    # Aggregate metrics
    total_expected_loss: Decimal
    portfolio_var_95: Decimal
    portfolio_var_99: Decimal
    portfolio_cvar_95: Decimal
    weighted_avg_risk_score: Decimal
    
    # Concentration
    risk_concentration: Decimal
    geographic_exposure: Dict[str, Decimal]
    sector_exposure: Dict[str, Decimal]
    
    # Asset-level breakdown
    asset_risks: Optional[List[PhysicalRiskAssessment]] = None
```

**Step 2.2: Create SQLAlchemy Models**

```python
# app/db/models/climate_risk.py
"""SQLAlchemy models for climate risk"""

import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Numeric, Date, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base


class Scenario(Base):
    """Climate scenario model"""
    __tablename__ = "scenarios"
    
    scenario_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(50), nullable=False)
    scenario_code = Column(String(20), nullable=False)
    scenario_name = Column(String(100), nullable=False)
    temperature_outcome = Column(Numeric(3, 1))
    description = Column(Text)
    version = Column(String(10))
    release_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    variables = relationship("ScenarioVariable", back_populates="scenario")
    
    __table_args__ = (
        UniqueConstraint('provider', 'scenario_code', 'version'),
    )


class ScenarioVariable(Base):
    """Scenario time series variable"""
    __tablename__ = "scenario_variables"
    
    variable_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey("scenarios.scenario_id"))
    variable_name = Column(String(100), nullable=False)
    variable_category = Column(String(50))
    unit = Column(String(20))
    year = Column(Integer)
    value = Column(Numeric(18, 6))
    confidence_lower = Column(Numeric(18, 6))
    confidence_upper = Column(Numeric(18, 6))
    
    # Relationships
    scenario = relationship("Scenario", back_populates="variables")
    
    __table_args__ = (
        UniqueConstraint('scenario_id', 'variable_name', 'year'),
    )


class AssetClimateRisk(Base):
    """Climate risk assessment for an asset"""
    __tablename__ = "asset_climate_risk"
    
    risk_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"))
    calculation_date = Column(Date)
    
    # Risk scores
    physical_risk_score = Column(Numeric(5, 2))
    transition_risk_score = Column(Numeric(5, 2))
    combined_risk_score = Column(Numeric(5, 2))
    
    # Hazard-specific risks
    flood_risk = Column(Numeric(5, 2))
    earthquake_risk = Column(Numeric(5, 2))
    wildfire_risk = Column(Numeric(5, 2))
    wind_risk = Column(Numeric(5, 2))
    heat_risk = Column(Numeric(5, 2))
    drought_risk = Column(Numeric(5, 2))
    stranding_risk = Column(Numeric(5, 2))
    
    # Financial impact
    carbon_cost_2030 = Column(Numeric(18, 2))
    carbon_cost_2050 = Column(Numeric(18, 2))
    expected_loss_annual = Column(Numeric(18, 2))
    var_95 = Column(Numeric(18, 2))
    var_99 = Column(Numeric(18, 2))
    
    # Metadata
    metadata = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
```

---

### 4.4 Phase 3: Services (Week 2-3)

**Step 3.1: Scenario Service**

```python
# app/services/climate_risk/scenario_service.py
"""Scenario management service"""

from typing import List, Dict, Optional
from uuid import UUID
from decimal import Decimal
import numpy as np
from sqlalchemy.orm import Session
from app.models.climate_risk import (
    ScenarioCreate, ScenarioResponse, 
    ScenarioVariable, EnsembleRequest, EnsembleResponse
)
from app.db.models.climate_risk import Scenario, ScenarioVariable as ScenarioVariableDB


class ScenarioService:
    """Service for managing climate scenarios"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_scenarios(
        self,
        provider: Optional[str] = None,
        temperature: Optional[Decimal] = None
    ) -> List[ScenarioResponse]:
        """Get scenarios with optional filtering"""
        query = self.db.query(Scenario)
        
        if provider:
            query = query.filter(Scenario.provider == provider)
        
        if temperature:
            query = query.filter(
                Scenario.temperature_outcome <= temperature + Decimal('0.5'),
                Scenario.temperature_outcome >= temperature - Decimal('0.5')
            )
        
        scenarios = query.all()
        return [ScenarioResponse.from_orm(s) for s in scenarios]
    
    def get_scenario_variables(
        self,
        scenario_id: UUID,
        variable_name: Optional[str] = None,
        year_from: int = 2025,
        year_to: int = 2100
    ) -> List[ScenarioVariable]:
        """Get time series variables for a scenario"""
        query = self.db.query(ScenarioVariableDB).filter(
            ScenarioVariableDB.scenario_id == scenario_id,
            ScenarioVariableDB.year >= year_from,
            ScenarioVariableDB.year <= year_to
        )
        
        if variable_name:
            query = query.filter(ScenarioVariableDB.variable_name == variable_name)
        
        variables = query.order_by(ScenarioVariableDB.year).all()
        
        return [
            ScenarioVariable(
                variable_name=v.variable_name,
                variable_category=v.variable_category,
                unit=v.unit,
                year=v.year,
                value=v.value,
                confidence_lower=v.confidence_lower,
                confidence_upper=v.confidence_upper
            )
            for v in variables
        ]
    
    def generate_ensemble(
        self,
        request: EnsembleRequest
    ) -> List[EnsembleResponse]:
        """Generate ensemble projection from multiple scenarios"""
        results = []
        
        for variable_name in request.variables:
            # Get variables from all scenarios
            scenario_data = {}
            for scenario_id in request.scenario_ids:
                variables = self.get_scenario_variables(
                    scenario_id=scenario_id,
                    variable_name=variable_name,
                    year_from=min(request.years),
                    year_to=max(request.years)
                )
                scenario_data[scenario_id] = {
                    v.year: v for v in variables
                }
            
            # Calculate weights
            weights = self._calculate_weights(
                request.scenario_ids,
                request.weight_method,
                request.target_temperature
            )
            
            # Generate ensemble for each year
            projections = []
            for year in request.years:
                values = []
                variances = []
                
                for scenario_id in request.scenario_ids:
                    if year in scenario_data[scenario_id]:
                        v = scenario_data[scenario_id][year]
                        values.append(float(v.value))
                        # Use confidence interval as variance proxy
                        if v.confidence_upper and v.confidence_lower:
                            var = ((v.confidence_upper - v.confidence_lower) / (2 * 1.96)) ** 2
                            variances.append(float(var))
                        else:
                            variances.append(0)
                
                if values:
                    # Weighted mean
                    weights_list = [weights[sid] for sid in request.scenario_ids 
                                   if sid in scenario_data and year in scenario_data[sid]]
                    weights_array = np.array(weights_list) / sum(weights_list)
                    values_array = np.array(values)
                    
                    ensemble_mean = np.average(values_array, weights=weights_array)
                    
                    # Weighted variance
                    internal_var = sum(w**2 * v for w, v in zip(weights_array, variances))
                    between_var = sum(w * (v - ensemble_mean)**2 
                                     for w, v in zip(weights_array, values_array))
                    total_var = internal_var + between_var
                    
                    # Confidence interval
                    std = np.sqrt(total_var)
                    
                    projections.append({
                        'year': year,
                        'mean': Decimal(str(ensemble_mean)),
                        'lower': Decimal(str(ensemble_mean - 1.96 * std)),
                        'upper': Decimal(str(ensemble_mean + 1.96 * std))
                    })
            
            results.append(EnsembleResponse(
                ensemble_id=uuid.uuid4(),
                variable_name=variable_name,
                projections=projections,
                weights={sid: Decimal(str(w)) for sid, w in weights.items()}
            ))
        
        return results
    
    def _calculate_weights(
        self,
        scenario_ids: List[UUID],
        method: str,
        target_temperature: Optional[Decimal]
    ) -> Dict[UUID, float]:
        """Calculate scenario weights for ensemble"""
        if method == "equal":
            return {sid: 1.0 / len(scenario_ids) for sid in scenario_ids}
        
        elif method == "temperature" and target_temperature:
            # Get scenario temperatures
            temps = {}
            for sid in scenario_ids:
                scenario = self.db.query(Scenario).filter(
                    Scenario.scenario_id == sid
                ).first()
                if scenario and scenario.temperature_outcome:
                    temps[sid] = float(scenario.temperature_outcome)
            
            # Gaussian kernel weights
            sigma = 0.5
            weights = {}
            for sid, temp in temps.items():
                weights[sid] = np.exp(-((temp - float(target_temperature))**2) / (2 * sigma**2))
            
            # Normalize
            total = sum(weights.values())
            return {sid: w / total for sid, w in weights.items()}
        
        else:
            return {sid: 1.0 / len(scenario_ids) for sid in scenario_ids}
```

---

### 4.5 Phase 4: API Routes (Week 3)

**Step 4.1: Create API Router**

```python
# app/api/routes/climate_risk.py
"""Climate risk API endpoints"""

from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.climate_risk import (
    ScenarioResponse, ScenarioVariable,
    EnsembleRequest, EnsembleResponse,
    PhysicalRiskAssessment, TransitionRiskAssessment,
    CreditRiskAssessment, PortfolioRiskAggregation
)
from app.services.climate_risk.scenario_service import ScenarioService
from app.services.climate_risk.physical_risk_service import PhysicalRiskService
from app.services.climate_risk.transition_risk_service import TransitionRiskService
from app.services.climate_risk.credit_risk_service import CreditRiskService

router = APIRouter(prefix="/v1/climate-risk", tags=["climate-risk"])


# ============ SCENARIO ENDPOINTS ============

@router.get("/scenarios", response_model=List[ScenarioResponse])
async def list_scenarios(
    provider: Optional[str] = Query(None, description="Filter by provider (NGFS, IEA, IPCC, IRENA)"),
    temperature: Optional[Decimal] = Query(None, description="Target temperature in Celsius"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    List available climate scenarios with optional filtering.
    
    Returns all scenarios from NGFS, IEA, IPCC AR6, and IRENA.
    """
    service = ScenarioService(db)
    return service.get_scenarios(provider=provider, temperature=temperature)


@router.get("/scenarios/{scenario_id}/variables", response_model=List[ScenarioVariable])
async def get_scenario_variables(
    scenario_id: UUID,
    variable_name: Optional[str] = Query(None),
    year_from: int = Query(2025, ge=1900, le=2100),
    year_to: int = Query(2100, ge=1900, le=2100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get time series variables for a specific scenario.
    
    Common variables: GDP, CO2_emissions, carbon_price, temperature
    """
    service = ScenarioService(db)
    return service.get_scenario_variables(
        scenario_id=scenario_id,
        variable_name=variable_name,
        year_from=year_from,
        year_to=year_to
    )


@router.post("/scenarios/ensemble", response_model=List[EnsembleResponse])
async def generate_ensemble(
    request: EnsembleRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate ensemble projection from multiple scenarios.
    
    Supports weighting methods: equal, temperature, bma (Bayesian Model Averaging)
    """
    service = ScenarioService(db)
    return service.generate_ensemble(request)


# ============ PHYSICAL RISK ENDPOINTS ============

@router.post("/physical-risk/assess", response_model=PhysicalRiskAssessment)
async def assess_physical_risk(
    asset_id: UUID,
    hazards: List[str] = Query(["flood", "earthquake", "wind", "wildfire"]),
    scenario: str = Query("current"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Assess physical climate risk for a specific asset.
    
    Evaluates flood, earthquake, wind, wildfire, heat, and drought risks.
    Returns risk scores (0-100) and expected financial impact.
    """
    service = PhysicalRiskService(db)
    return service.assess_asset_risk(
        asset_id=asset_id,
        hazards=hazards,
        scenario=scenario
    )


@router.post("/physical-risk/portfolio/{portfolio_id}/aggregate", response_model=PortfolioRiskAggregation)
async def aggregate_portfolio_risk(
    portfolio_id: UUID,
    scenario_id: UUID,
    confidence: Decimal = Query(Decimal("0.95"), ge=0, le=1),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Aggregate physical risk across a portfolio.
    
    Calculates portfolio-level VaR, CVaR, and concentration metrics.
    """
    service = PhysicalRiskService(db)
    return service.aggregate_portfolio_risk(
        portfolio_id=portfolio_id,
        scenario_id=scenario_id,
        confidence=confidence
    )


# ============ TRANSITION RISK ENDPOINTS ============

@router.post("/transition-risk/assess", response_model=TransitionRiskAssessment)
async def assess_transition_risk(
    company_id: UUID,
    scenario_id: UUID,
    time_horizon: int = Query(2050, ge=2030, le=2100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Assess transition risk for a company under a climate scenario.
    
    Evaluates carbon pricing impact, stranded asset risk, and DCF impairment.
    """
    service = TransitionRiskService(db)
    return service.assess_company_risk(
        company_id=company_id,
        scenario_id=scenario_id,
        time_horizon=time_horizon
    )


@router.get("/transition-risk/carbon-price-trajectory")
async def get_carbon_price_trajectory(
    scenario_id: UUID,
    year_from: int = Query(2025),
    year_to: int = Query(2100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get carbon price trajectory for a scenario.
    """
    service = TransitionRiskService(db)
    return service.get_carbon_price_trajectory(
        scenario_id=scenario_id,
        year_from=year_from,
        year_to=year_to
    )


# ============ CREDIT RISK ENDPOINTS ============

@router.post("/credit-risk/assess", response_model=CreditRiskAssessment)
async def assess_credit_risk(
    exposure_id: UUID,
    scenario_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Calculate climate-adjusted credit risk (PD, LGD, ECL).
    
    Uses Merton model with climate volatility adjustment.
    """
    service = CreditRiskService(db)
    return service.assess_credit_risk(
        exposure_id=exposure_id,
        scenario_id=scenario_id
    )


@router.post("/credit-risk/ecl", response_model=Dict)
async def calculate_ecl(
    portfolio_id: UUID,
    scenario_id: UUID,
    stage: int = Query(1, ge=1, le=3),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Calculate Expected Credit Loss (IFRS 9).
    
    Stage 1: 12-month ECL
    Stage 2: Lifetime ECL
    Stage 3: Lifetime ECL (credit-impaired)
    """
    service = CreditRiskService(db)
    return service.calculate_ecl(
        portfolio_id=portfolio_id,
        scenario_id=scenario_id,
        stage=stage
    )


# ============ PORTFOLIO DASHBOARD ENDPOINTS ============

@router.get("/portfolio/{portfolio_id}/dashboard")
async def get_portfolio_dashboard(
    portfolio_id: UUID,
    scenario_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get comprehensive climate risk dashboard for a portfolio.
    
    Combines physical, transition, and credit risk metrics.
    """
    # Get all risk assessments
    physical = PhysicalRiskService(db).aggregate_portfolio_risk(portfolio_id, scenario_id)
    transition = TransitionRiskService(db).get_portfolio_transition_risk(portfolio_id, scenario_id)
    credit = CreditRiskService(db).get_portfolio_credit_risk(portfolio_id, scenario_id)
    
    return {
        "portfolio_id": portfolio_id,
        "scenario_id": scenario_id,
        "physical_risk": physical,
        "transition_risk": transition,
        "credit_risk": credit,
        "combined_risk_score": calculate_combined_score(physical, transition, credit)
    }
```

---

## 5. API Contract Specification

### 5.1 Request/Response Examples

#### Scenario List

**Request:**
```http
GET /v1/climate-risk/scenarios?provider=NGFS&temperature=1.5
Authorization: Bearer <token>
```

**Response:**
```json
{
  "scenarios": [
    {
      "scenario_id": "550e8400-e29b-41d4-a716-446655440000",
      "provider": "NGFS",
      "scenario_code": "NZ2050",
      "scenario_name": "Net Zero 2050",
      "temperature_outcome": 1.5,
      "description": "Immediate, coordinated global action to achieve net-zero by 2050",
      "version": "Phase 5",
      "release_date": "2024-11-01"
    }
  ]
}
```

#### Physical Risk Assessment

**Request:**
```http
POST /v1/climate-risk/physical-risk/assess?asset_id=550e8400-e29b-41d4-a716-446655440001&hazards=flood,earthquake,wind
Authorization: Bearer <token>
```

**Response:**
```json
{
  "asset_id": "550e8400-e29b-41d4-a716-446655440001",
  "calculation_date": "2024-01-15",
  "physical_risk_score": 65.5,
  "flood_risk": 78.2,
  "earthquake_risk": 45.3,
  "wind_risk": 52.1,
  "wildfire_risk": 23.4,
  "expected_loss_annual": 1250000.00,
  "var_95": 8500000.00,
  "var_99": 15000000.00,
  "hazard_details": {
    "flood": {
      "return_period_100": 2.5,
      "return_period_500": 4.2,
      "damage_ratio": 0.35
    }
  }
}
```

#### Portfolio Aggregation

**Request:**
```http
POST /v1/climate-risk/physical-risk/portfolio/550e8400-e29b-41d4-a716-446655440002/aggregate?scenario_id=550e8400-e29b-41d4-a716-446655440000&confidence=0.95
Authorization: Bearer <token>
```

**Response:**
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440002",
  "calculation_date": "2024-01-15",
  "scenario_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_expected_loss": 45250000.00,
  "portfolio_var_95": 125000000.00,
  "portfolio_var_99": 210000000.00,
  "portfolio_cvar_95": 165000000.00,
  "weighted_avg_risk_score": 58.3,
  "risk_concentration": 72.5,
  "geographic_exposure": {
    "US": 45.2,
    "EU": 30.1,
    "Asia": 24.7
  },
  "sector_exposure": {
    "Real Estate": 35.0,
    "Energy": 25.0,
    "Utilities": 20.0,
    "Other": 20.0
  }
}
```

---

## 6. Database Schema Additions

### 6.1 Summary of New Tables

| Table | Purpose | Estimated Rows |
|-------|---------|----------------|
| `scenarios` | Climate scenario registry | ~100 |
| `scenario_variables` | Time series data | ~1M |
| `asset_climate_risk` | Per-asset risk assessments | ~6M |
| `portfolio_climate_risk` | Portfolio aggregations | ~10K |
| `hazard_maps` | Cached hazard intensity | ~100K |
| `ml_model_versions` | ML model registry | ~50 |

### 6.2 Indexes to Create

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_asset_climate_risk_asset_date 
ON asset_climate_risk(asset_id, calculation_date);

CREATE INDEX CONCURRENTLY idx_asset_climate_risk_score 
ON asset_climate_risk(physical_risk_score) 
WHERE physical_risk_score > 70;

CREATE INDEX CONCURRENTLY idx_scenario_variables_lookup 
ON scenario_variables(scenario_id, variable_name, year);

CREATE INDEX CONCURRENTLY idx_portfolio_climate_risk_portfolio_scenario 
ON portfolio_climate_risk(portfolio_id, scenario_id);
```

---

## 7. Testing & Validation

### 7.1 Unit Tests

```python
# tests/services/test_scenario_service.py
import pytest
from app.services.climate_risk.scenario_service import ScenarioService

class TestScenarioService:
    def test_get_scenarios(self, db_session):
        service = ScenarioService(db_session)
        scenarios = service.get_scenarios()
        assert len(scenarios) > 0
    
    def test_generate_ensemble(self, db_session):
        service = ScenarioService(db_session)
        request = EnsembleRequest(
            scenario_ids=[scenario1_id, scenario2_id],
            variables=["GDP", "CO2_emissions"],
            years=[2030, 2040, 2050],
            weight_method="equal"
        )
        results = service.generate_ensemble(request)
        assert len(results) == 2  # One per variable
```

### 7.2 Integration Tests

```python
# tests/api/test_climate_risk_api.py
import pytest
from fastapi.testclient import TestClient

class TestClimateRiskAPI:
    def test_list_scenarios(self, client: TestClient, auth_headers):
        response = client.get("/v1/climate-risk/scenarios", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()["scenarios"]) > 0
    
    def test_assess_physical_risk(self, client: TestClient, auth_headers):
        response = client.post(
            "/v1/climate-risk/physical-risk/assess",
            params={"asset_id": test_asset_id},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert "physical_risk_score" in response.json()
```

### 7.3 Validation Checklist

- [ ] All API endpoints return correct status codes
- [ ] Database queries execute in <100ms
- [ ] ML inference completes in <500ms
- [ ] Risk calculations match reference implementations
- [ ] Backtesting shows <10% error vs historical events

---

## 8. Deployment Checklist

### 8.1 Pre-Deployment

- [ ] Database migrations applied
- [ ] Reference data loaded
- [ ] ML models trained and deployed
- [ ] API endpoints tested
- [ ] Documentation updated

### 8.2 Deployment Steps

```bash
# 1. Deploy database changes
alembic upgrade head

# 2. Load reference data
python scripts/load_reference_data.py

# 3. Deploy ML models
mlflow models serve -m models:/climate-risk-xgboost/Production

# 4. Deploy API
docker build -t climate-risk-api:latest .
docker push climate-risk-api:latest
kubectl apply -f k8s/climate-risk-deployment.yaml

# 5. Verify deployment
curl https://api.yourapp.com/v1/climate-risk/health
```

### 8.3 Post-Deployment Monitoring

| Metric | Threshold | Alert |
|--------|-----------|-------|
| API Response Time (p95) | >500ms | PagerDuty |
| Error Rate | >1% | Slack |
| ML Inference Time | >1000ms | Email |
| Database CPU | >80% | Slack |

---

## Summary

### Files to Onboard: 20+
- Models, services, API routes, data ingestion clients
- Configuration files, migrations, Docker files

### Reference Data: ~650 GB initial
- Scenarios, hazard maps, climate data
- Regular updates from free sources

### Integration Time: 8-12 weeks
- Database: 1 week
- Services: 3-4 weeks
- API: 2 weeks
- Testing: 2-3 weeks
- Deployment: 1 week

---

*End of Integration Guide*
