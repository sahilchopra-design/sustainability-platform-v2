# Climate Risk Platform - Integration Guide

This guide explains how to integrate the climate risk platform into your existing application.

## Files Overview

The following Python files have been created and are ready to use:

### Core Application
| File | Purpose |
|------|---------|
| `main.py` | FastAPI application entry point |
| `requirements.txt` | Python dependencies |

### Database Layer
| File | Purpose |
|------|---------|
| `config/database.py` | SQLAlchemy configuration, connection pooling |
| `models/scenario.py` | Database models (Scenario, AssetClimateRisk, etc.) |
| `models/schemas.py` | Pydantic schemas for API validation |

### Business Logic
| File | Purpose |
|------|---------|
| `services/scenario_service.py` | Scenario CRUD, ensemble generation |
| `services/physical_risk_service.py` | Physical risk calculations (EAL, PML) |
| `services/transition_risk_service.py` | Transition risk (carbon, stranded assets) |
| `services/credit_risk_service.py` | IFRS 9 ECL, Basel capital |

### Machine Learning
| File | Purpose |
|------|---------|
| `ml/models/xgboost_damage.py` | XGBoost quantile regression |
| `ml/models/st_gnn.py` | Spatiotemporal graph neural network |

### API Layer
| File | Purpose |
|------|---------|
| `api/routes/climate_risk.py` | REST API endpoints |

### Data Ingestion
| File | Purpose |
|------|---------|
| `data_ingestion/copernicus_client.py` | Copernicus CDS data access |

## Integration Steps

### 1. Copy Files to Your Project

Copy the entire `climate_risk_platform/` directory into your existing project:

```bash
# From your existing project root
cp -r /path/to/climate_risk_platform ./climate_risk/
```

### 2. Install Dependencies

Add to your existing `requirements.txt`:

```bash
# Append climate risk dependencies
cat climate_risk/requirements.txt >> requirements.txt
pip install -r requirements.txt
```

### 3. Database Integration

#### Option A: Separate Database (Recommended)

Create a separate database for climate risk data:

```python
# In your existing database config
CLIMATE_DATABASE_URL = "postgresql://user:pass@localhost:5432/climate_risk_db"

# Import climate models
from climate_risk.models.scenario import Base as ClimateBase

# Create tables
from sqlalchemy import create_engine
climate_engine = create_engine(CLIMATE_DATABASE_URL)
ClimateBase.metadata.create_all(climate_engine)
```

#### Option B: Same Database, Separate Schema

```python
# Use PostgreSQL schema
from climate_risk.models.scenario import Base

class Scenario(Base):
    __tablename__ = "climate.scenarios"
    # ... rest of model
```

#### Option C: Add Tables to Existing Schema

```python
# In your existing Alembic migration
from climate_risk.models.scenario import (
    Scenario, ScenarioVariable, AssetClimateRisk,
    PortfolioClimateRisk, ScenarioEnsemble
)

# Add tables to your existing Base
# Run migration to create tables
```

### 4. FastAPI Integration

#### Option A: Mount as Sub-application

```python
# In your existing main.py
from fastapi import FastAPI
from climate_risk.main import app as climate_app

app = FastAPI()

# Mount climate risk routes
app.mount("/climate-risk", climate_app)

# Your existing routes
@app.get("/")
def root():
    return {"message": "Your existing API"}
```

#### Option B: Include Router

```python
# In your existing main.py
from fastapi import FastAPI
from climate_risk.api.routes.climate_risk import router as climate_router

app = FastAPI()

# Include climate risk router
app.include_router(
    climate_router,
    prefix="/api/v1/climate-risk",
    tags=["climate-risk"]
)
```

#### Option C: Individual Endpoints

```python
# Add specific endpoints to your existing API
from climate_risk.services.scenario_service import ScenarioService
from climate_risk.models.schemas import ScenarioResponse

@app.get("/api/scenarios", response_model=List[ScenarioResponse])
def list_scenarios(db: Session = Depends(get_db)):
    service = ScenarioService(db)
    scenarios, _ = service.get_scenarios()
    return scenarios
```

### 5. Service Integration

#### Using Services Directly

```python
from climate_risk.services.physical_risk_service import PhysicalRiskService
from climate_risk.models.schemas import PhysicalRiskCalculationRequest

# In your existing code
def assess_portfolio_risk(portfolio_id: str, db: Session):
    service = PhysicalRiskService(db)
    
    request = PhysicalRiskCalculationRequest(
        asset_id="ASSET001",
        asset_type="real_estate",
        latitude=40.7128,
        longitude=-74.0060,
        sector="real_estate",
        scenario_id="...",
        time_horizon_years=10,
        asset_value=10000000
    )
    
    results = service.calculate_physical_risk(request)
    return results
```

### 6. ML Model Integration

#### Using Pre-trained Models

```python
from climate_risk.ml.models.xgboost_damage import XGBoostDamageModel

# Load pre-trained model
model = XGBoostDamageModel.load("path/to/model.pkl")

# Make predictions
predictions = model.predict_with_conformal(X_test, confidence=0.95)
```

#### Training Custom Models

```python
from climate_risk.ml.models.xgboost_damage import XGBoostDamageModel

# Train new model
model = XGBoostDamageModel(quantiles=[0.05, 0.5, 0.95])
metrics = model.train(X_train, y_train)

# Save model
model.save("models/damage_model.pkl")
```

### 7. Data Ingestion Integration

#### Automated Data Pipeline

```python
from climate_risk.data_ingestion.copernicus_client import CopernicusCDSClient

# Initialize client
client = CopernicusCDSClient(
    api_key="your-api-key",
    api_url="https://cds.climate.copernicus.eu/api/v2"
)

# Download data
client.download_era5_single_levels(
    variables=["2m_temperature", "total_precipitation"],
    years=[2020, 2021, 2022],
    months=[6, 7, 8],  # Summer months
    area=[50, -10, 35, 20],  # Europe
    output_file="summer_climate.nc"
)
```

## Configuration

### Environment Variables

Add to your existing `.env` file:

```bash
# Climate Risk Database
CLIMATE_DATABASE_URL=postgresql://user:pass@localhost:5432/climate_risk_db

# External APIs
CDSAPI_KEY=your-copernicus-key
CDSAPI_URL=https://cds.climate.copernicus.eu/api/v2
EODHD_API_KEY=your-eodhd-key

# Application Settings
CLIMATE_RISK_ENABLED=true
CLIMATE_CACHE_TTL=3600
```

### Settings Module

```python
# config/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Your existing settings
    
    # Climate risk settings
    climate_database_url: str
    cdsapi_key: str | None = None
    eodhd_api_key: str | None = None
    climate_cache_ttl: int = 3600
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Testing

### Unit Tests

```python
# tests/test_physical_risk.py
import pytest
from climate_risk.services.physical_risk_service import PhysicalRiskService

def test_calculate_eal():
    service = PhysicalRiskService(db=None)
    
    losses = [1000, 5000, 10000, 50000, 100000]
    return_periods = [10, 25, 50, 100, 250]
    
    eal = service._calculate_eal(losses, return_periods)
    
    assert eal > 0
    assert eal < max(losses)
```

### Integration Tests

```python
# tests/test_api_integration.py
from fastapi.testclient import TestClient

def test_list_scenarios(client: TestClient):
    response = client.get("/v1/climate-risk/scenarios")
    assert response.status_code == 200
    assert "items" in response.json()
```

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy climate risk module
COPY climate_risk/ ./climate_risk/

# Copy your existing application
COPY . .

# Install dependencies
RUN pip install -r requirements.txt

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Railway

```yaml
# railway.yaml
services:
  api:
    build: .
    ports:
      - 8000:8000
    environment:
      DATABASE_URL: ${DATABASE_URL}
      CLIMATE_DATABASE_URL: ${CLIMATE_DATABASE_URL}
```

## Troubleshooting

### Import Errors

If you get import errors, ensure the climate_risk module is in Python path:

```python
import sys
sys.path.insert(0, "/path/to/climate_risk_platform")
```

### Database Connection Issues

Check database URL format:

```python
# Correct format
postgresql://user:password@host:port/database

# With SSL
postgresql://user:password@host:port/database?sslmode=require
```

### Memory Issues with ML Models

For large models, use lazy loading:

```python
_model = None

def get_model():
    global _model
    if _model is None:
        _model = XGBoostDamageModel.load("model.pkl")
    return _model
```

## Support

For issues and questions:
- Check the documentation in `/mnt/okcomputer/output/` for detailed specifications
- Review the README.md in the climate_risk_platform directory
- Examine the test files for usage examples
