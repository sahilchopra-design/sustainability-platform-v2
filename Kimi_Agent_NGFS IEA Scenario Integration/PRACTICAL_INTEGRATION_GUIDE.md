# Practical Integration Guide
## Climate Risk Module - Where to Find Everything

---

**This guide maps the conceptual files to actual documentation and provides standalone code you can copy.**

---

## 📍 Where to Find Implementation Code

### 1. Database Schema & Migrations

**Location in docs:** `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 3.1

**What you need to create:**
```python
# alembic/versions/xxx_add_climate_risk_tables.py
# Copy from: UNIFIED_REQUIREMENTS_SPECIFICATION.md lines ~200-320
```

**Key tables to add:**
- `scenarios` - Climate scenario registry
- `scenario_variables` - Time series data
- `asset_climate_risk` - Per-asset risk assessments
- `portfolio_climate_risk` - Portfolio aggregations

---

### 2. Pydantic Models (Request/Response)

**Location in docs:** `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 3.1.2

**What you need to create:**
```python
# app/models/climate_risk.py
# Copy from: UNIFIED_REQUIREMENTS_SPECIFICATION.md lines ~320-450
```

**Key models:**
- `ScenarioBase`, `ScenarioResponse`
- `ScenarioVariable`
- `EnsembleRequest`, `EnsembleResponse`
- `PhysicalRiskAssessment`
- `TransitionRiskAssessment`
- `CreditRiskAssessment`
- `PortfolioRiskAggregation`

---

### 3. SQLAlchemy ORM Models

**Location in docs:** `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 3.1.2 (continued)

**What you need to create:**
```python
# app/db/models/climate_risk.py
# Copy from: UNIFIED_REQUIREMENTS_SPECIFICATION.md lines ~450-550
```

**Key classes:**
- `Scenario`
- `ScenarioVariable`
- `AssetClimateRisk`

---

### 4. Scenario Service

**Location in docs:** `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 3.1.3

**What you need to create:**
```python
# app/services/scenario_service.py
# Copy from: UNIFIED_REQUIREMENTS_SPECIFICATION.md lines ~550-700
```

**Key methods:**
- `get_scenarios()` - List scenarios with filters
- `get_scenario_variables()` - Get time series
- `generate_ensemble()` - Bayesian ensemble

---

### 5. Physical Risk Calculations

**Location in docs:** 
- `task3_physical_risk_ml.md` - ML models (BNN)
- `task3_physical_risk_quant.md` - Quantitative formulas

**What you need to create:**
```python
# app/services/physical_risk_service.py
# Copy BNN from: task3_physical_risk_ml.md lines ~100-200
# Copy damage functions from: task3_physical_risk_quant.md lines ~50-150
```

---

### 6. Transition Risk Calculations

**Location in docs:** `task4_transition_risk.md`

**What you need to create:**
```python
# app/services/transition_risk_service.py
# Copy from: task4_transition_risk.md lines ~50-200
```

**Key components:**
- `CarbonPriceModel`
- `StrandedAssetValuation`
- `DCFImpairment`

---

### 7. Credit Risk (Merton Model)

**Location in docs:** `task6_banking_integration.md`

**What you need to create:**
```python
# app/services/credit_risk_service.py
# Copy from: task6_banking_integration.md lines ~50-200
```

**Key classes:**
- `ClimateMertonModel`
- `IFRS9ECL`

---

### 8. API Routes

**Location in docs:** `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 7

**What you need to create:**
```python
# app/api/routes/climate_risk.py
# Copy from: UNIFIED_REQUIREMENTS_SPECIFICATION.md lines ~1200-1400
```

**Endpoints:**
- `GET /v1/climate-risk/scenarios`
- `GET /v1/climate-risk/scenarios/{id}/variables`
- `POST /v1/climate-risk/scenarios/ensemble`
- `POST /v1/climate-risk/physical-risk/assess`
- `POST /v1/climate-risk/transition-risk/assess`
- `POST /v1/climate-risk/credit-risk/assess`

---

### 9. ML Models

**Location in docs:** `ADVANCED_ML_MODELS_CLIMATE_RISK.md`

**What you need to create:**
```python
# app/ml/models/
# Copy XGBoost from: ADVANCED_ML_MODELS_CLIMATE_RISK.md lines ~400-500
# Copy iTransformer from: ADVANCED_ML_MODELS_CLIMATE_RISK.md lines ~100-200
# Copy BNN from: ADVANCED_ML_MODELS_CLIMATE_RISK.md lines ~600-700
```

---

### 10. Data Ingestion Clients

**Location in docs:** `FREE_LOW_COST_DATA_SOURCES.md`

**What you need to create:**
```python
# app/data/ingestion/
# Copy Copernicus from: FREE_LOW_COST_DATA_SOURCES.md lines ~50-100
# Copy SEC EDGAR from: FREE_LOW_COST_DATA_SOURCES.md lines ~200-250
# Copy USGS from: FREE_LOW_COST_DATA_SOURCES.md lines ~300-350
```

---

## 📋 Complete File Mapping Table

| Conceptual File | Where to Find Code | Action |
|-----------------|-------------------|--------|
| `models/scenario.py` | `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 3.1.2 | Copy Pydantic models |
| `models/physical_risk.py` | `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 3.1.2 | Copy Pydantic models |
| `services/scenario_service.py` | `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 3.1.3 | Copy service class |
| `services/physical_risk_service.py` | `task3_physical_risk_ml.md` + `task3_physical_risk_quant.md` | Copy BNN + damage functions |
| `services/transition_risk_service.py` | `task4_transition_risk.md` | Copy carbon/DCF models |
| `services/credit_risk_service.py` | `task6_banking_integration.md` | Copy Merton/ECL |
| `api/routes/climate_risk.py` | `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 7 | Copy FastAPI routes |
| `ml/models/xgboost_damage.py` | `ADVANCED_ML_MODELS_CLIMATE_RISK.md` Section 3.1 | Copy XGBoost code |
| `ml/models/bnn_uncertainty.py` | `ADVANCED_ML_MODELS_CLIMATE_RISK.md` Section 4.1 | Copy BNN code |
| `data/ingestion/copernicus_client.py` | `FREE_LOW_COST_DATA_SOURCES.md` Section 1.1 | Copy CDS client |
| `data/ingestion/sec_edgar_client.py` | `FREE_LOW_COST_DATA_SOURCES.md` Section 3.1 | Copy SEC client |
| `data/ingestion/usgs_client.py` | `FREE_LOW_COST_DATA_SOURCES.md` Section 2.3 | Copy USGS client |

---

## 🔧 Standalone Implementation Package

Since the files are scattered across documentation, here's a consolidated implementation you can copy directly:

### Step 1: Database Migration (One File)

Create: `alembic/versions/20240101_add_climate_risk.py`

```python
"""Add climate risk tables

Revision ID: add_climate_risk
Create Date: 2024-01-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_climate_risk'
down_revision = None  # Set to your last migration


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
    
    # Scenario variables
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
    
    # Asset climate risk
    op.create_table(
        'asset_climate_risk',
        sa.Column('risk_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('assets.asset_id')),  # Your existing table
        sa.Column('calculation_date', sa.Date),
        sa.Column('physical_risk_score', sa.Numeric(5, 2)),
        sa.Column('transition_risk_score', sa.Numeric(5, 2)),
        sa.Column('flood_risk', sa.Numeric(5, 2)),
        sa.Column('earthquake_risk', sa.Numeric(5, 2)),
        sa.Column('wildfire_risk', sa.Numeric(5, 2)),
        sa.Column('expected_loss_annual', sa.Numeric(18, 2)),
        sa.Column('var_95', sa.Numeric(18, 2)),
        sa.Column('var_99', sa.Numeric(18, 2)),
        sa.Column('metadata', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    
    # Indexes
    op.create_index('idx_asset_climate_risk_asset', 'asset_climate_risk', ['asset_id'])
    op.create_index('idx_scenario_vars_lookup', 'scenario_variables', 
                    ['scenario_id', 'variable_name', 'year'])


def downgrade():
    op.drop_table('asset_climate_risk')
    op.drop_table('scenario_variables')
    op.drop_table('scenarios')
```

---

### Step 2: Pydantic Models (One File)

Create: `app/models/climate_risk.py`

```python
"""Climate risk Pydantic models"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class ScenarioResponse(BaseModel):
    scenario_id: UUID
    provider: str
    scenario_code: str
    scenario_name: str
    temperature_outcome: Optional[Decimal]
    description: Optional[str]
    version: str
    release_date: Optional[date]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ScenarioVariable(BaseModel):
    variable_name: str
    variable_category: Optional[str]
    unit: Optional[str]
    year: int
    value: Decimal
    confidence_lower: Optional[Decimal]
    confidence_upper: Optional[Decimal]


class EnsembleRequest(BaseModel):
    scenario_ids: List[UUID]
    variables: List[str]
    years: List[int]
    weight_method: str = "equal"
    target_temperature: Optional[Decimal] = None


class PhysicalRiskAssessment(BaseModel):
    asset_id: UUID
    calculation_date: date
    physical_risk_score: Decimal = Field(..., ge=0, le=100)
    flood_risk: Optional[Decimal] = Field(None, ge=0, le=100)
    earthquake_risk: Optional[Decimal] = Field(None, ge=0, le=100)
    wildfire_risk: Optional[Decimal] = Field(None, ge=0, le=100)
    expected_loss_annual: Optional[Decimal]
    var_95: Optional[Decimal]
    var_99: Optional[Decimal]


class TransitionRiskAssessment(BaseModel):
    company_id: UUID
    calculation_date: date
    transition_risk_score: Decimal = Field(..., ge=0, le=100)
    carbon_cost_2030: Optional[Decimal]
    carbon_cost_2050: Optional[Decimal]
    stranded_value: Optional[Decimal]


class CreditRiskAssessment(BaseModel):
    exposure_id: UUID
    pd_baseline: Decimal
    pd_climate_adjusted: Decimal
    lgd_baseline: Decimal
    lgd_climate_adjusted: Decimal
    ecl_12m: Optional[Decimal]
```

---

### Step 3: Scenario Service (One File)

Create: `app/services/scenario_service.py`

```python
"""Scenario management service"""

from typing import List, Optional, Dict
from uuid import UUID
from decimal import Decimal
import numpy as np
from sqlalchemy.orm import Session
from app.models.climate_risk import (
    ScenarioResponse, ScenarioVariable, 
    EnsembleRequest
)
from app.db.models.climate_risk import Scenario, ScenarioVariable as ScenarioVarDB


class ScenarioService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_scenarios(
        self, 
        provider: Optional[str] = None,
        temperature: Optional[Decimal] = None
    ) -> List[ScenarioResponse]:
        query = self.db.query(Scenario)
        if provider:
            query = query.filter(Scenario.provider == provider)
        if temperature:
            query = query.filter(
                Scenario.temperature_outcome <= temperature + Decimal('0.5'),
                Scenario.temperature_outcome >= temperature - Decimal('0.5')
            )
        return [ScenarioResponse.from_orm(s) for s in query.all()]
    
    def get_variables(
        self,
        scenario_id: UUID,
        variable_name: Optional[str] = None,
        year_from: int = 2025,
        year_to: int = 2100
    ) -> List[ScenarioVariable]:
        query = self.db.query(ScenarioVarDB).filter(
            ScenarioVarDB.scenario_id == scenario_id,
            ScenarioVarDB.year >= year_from,
            ScenarioVarDB.year <= year_to
        )
        if variable_name:
            query = query.filter(ScenarioVarDB.variable_name == variable_name)
        
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
            for v in query.order_by(ScenarioVarDB.year).all()
        ]
    
    def generate_ensemble(self, request: EnsembleRequest) -> List[Dict]:
        """Generate ensemble with equal weights"""
        results = []
        
        for var_name in request.variables:
            projections = []
            
            for year in request.years:
                values = []
                for sid in request.scenario_ids:
                    vars = self.get_variables(sid, var_name, year, year)
                    if vars:
                        values.append(float(vars[0].value))
                
                if values:
                    mean = np.mean(values)
                    std = np.std(values)
                    projections.append({
                        'year': year,
                        'mean': Decimal(str(mean)),
                        'lower': Decimal(str(mean - 1.96 * std)),
                        'upper': Decimal(str(mean + 1.96 * std))
                    })
            
            results.append({
                'variable': var_name,
                'projections': projections
            })
        
        return results
```

---

### Step 4: XGBoost Damage Model (One File)

Create: `app/ml/models/xgboost_damage.py`

```python
"""XGBoost damage prediction model"""

import xgboost as xgb
import numpy as np
from typing import List, Dict


class XGBoostDamageModel:
    """XGBoost for building damage prediction"""
    
    def __init__(self):
        self.models = {}
        self.quantiles = [0.05, 0.25, 0.5, 0.75, 0.95]
    
    def train(self, X: np.ndarray, y: np.ndarray):
        """Train quantile regression models"""
        for q in self.quantiles:
            model = xgb.XGBRegressor(
                objective='reg:quantileerror',
                quantile_alpha=q,
                n_estimators=500,
                max_depth=6,
                learning_rate=0.05
            )
            model.fit(X, y)
            self.models[q] = model
    
    def predict(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        """Predict with uncertainty bands"""
        return {f'q{int(q*100)}': model.predict(X) 
                for q, model in self.models.items()}
    
    def save(self, path: str):
        """Save models"""
        for q, model in self.models.items():
            model.save_model(f"{path}_q{int(q*100)}.json")
    
    def load(self, path: str):
        """Load models"""
        for q in self.quantiles:
            model = xgb.Booster()
            model.load_model(f"{path}_q{int(q*100)}.json")
            self.models[q] = model
```

---

### Step 5: API Routes (One File)

Create: `app/api/routes/climate_risk.py`

```python
"""Climate risk API endpoints"""

from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.climate_risk import (
    ScenarioResponse, ScenarioVariable,
    EnsembleRequest, PhysicalRiskAssessment
)
from app.services.scenario_service import ScenarioService

router = APIRouter(prefix="/v1/climate-risk", tags=["climate-risk"])


@router.get("/scenarios", response_model=List[ScenarioResponse])
async def list_scenarios(
    provider: Optional[str] = Query(None),
    temperature: Optional[Decimal] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List climate scenarios"""
    service = ScenarioService(db)
    return service.get_scenarios(provider, temperature)


@router.get("/scenarios/{scenario_id}/variables", response_model=List[ScenarioVariable])
async def get_variables(
    scenario_id: UUID,
    variable_name: Optional[str] = Query(None),
    year_from: int = Query(2025),
    year_to: int = Query(2100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get scenario variables"""
    service = ScenarioService(db)
    return service.get_variables(scenario_id, variable_name, year_from, year_to)


@router.post("/scenarios/ensemble")
async def generate_ensemble(
    request: EnsembleRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate ensemble projection"""
    service = ScenarioService(db)
    return service.generate_ensemble(request)
```

---

### Step 6: Main App Integration

Add to your main app:

```python
# app/main.py

from fastapi import FastAPI
from app.api.routes import climate_risk

app = FastAPI()

# Include climate risk routes
app.include_router(climate_risk.router)
```

---

## 📥 Quick Download Commands

To extract code from the documentation files:

```bash
# View specific sections
grep -n "class ScenarioService" UNIFIED_REQUIREMENTS_SPECIFICATION.md
grep -n "def upgrade" UNIFIED_REQUIREMENTS_SPECIFICATION.md
grep -n "class XGBoost" ADVANCED_ML_MODELS_CLIMATE_RISK.md

# Copy code blocks (manually or with script)
# Each code block in the docs is marked with ```python
```

---

## 🎯 Summary

| What You Need | Where to Find | File to Create |
|---------------|---------------|----------------|
| Database tables | `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 3.1 | `alembic/versions/xxx_add_climate_risk.py` |
| Pydantic models | `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 3.1.2 | `app/models/climate_risk.py` |
| Scenario service | `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 3.1.3 | `app/services/scenario_service.py` |
| XGBoost model | `ADVANCED_ML_MODELS_CLIMATE_RISK.md` Section 3.1 | `app/ml/models/xgboost_damage.py` |
| API routes | `UNIFIED_REQUIREMENTS_SPECIFICATION.md` Section 7 | `app/api/routes/climate_risk.py` |

The standalone code blocks above are ready to copy and use directly.

---

*End of Practical Integration Guide*
