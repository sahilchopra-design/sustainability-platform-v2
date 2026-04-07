# Climate Risk Platform - File Location Guide

This guide maps all documentation and implementation files to their locations.

## Quick Reference

### Documentation Files (in `/mnt/okcomputer/output/`)

| Document | Description | Lines |
|----------|-------------|-------|
| `UNIFIED_REQUIREMENTS_SPECIFICATION.md` | Complete build specification | 1,636 |
| `CLAUDE_CODE_BUILD_PROMPT.md` | Prompt for Claude Code implementation | 490 |
| `INTEGRATION_GUIDE_EXISTING_APPLICATION.md` | Integration patterns guide | 1,359 |
| `PRACTICAL_INTEGRATION_GUIDE.md` | Code extraction guide | ~800 |
| `FILE_LOCATION_GUIDE.md` | This file | - |

### Scenario Analysis Documentation

| Document | Description | Lines |
|----------|-------------|-------|
| `NGFS_IEA_IPCC_INTEGRATION.md` | NGFS Phase 5, IEA WEO 2024, IPCC AR6 | ~800 |
| `GLOBAL_SCENARIO_REFERENCE_DATA.md` | 80+ scenario providers | ~800 |
| `SCENARIO_PROVIDERS_COMPREHENSIVE_LIST.md` | 20+ providers, 50+ pathways | ~800 |

### ML Models Documentation

| Document | Description | Lines |
|----------|-------------|-------|
| `ADVANCED_ML_MODELS_CLIMATE_RISK.md` | 15+ ML models with implementations | 597 |
| `FREE_LOW_COST_DATA_SOURCES.md` | 80+ data sources with API code | 983 |

### Implementation Files (in `/mnt/okcomputer/output/climate_risk_platform/`)

#### Core Application
| File | Purpose |
|------|---------|
| `main.py` | FastAPI application entry point |
| `requirements.txt` | Python dependencies |
| `README.md` | Platform documentation |
| `INTEGRATION_GUIDE.md` | Integration instructions |

#### Database Layer
| File | Purpose |
|------|---------|
| `config/database.py` | SQLAlchemy configuration |
| `config/__init__.py` | Package initializer |
| `models/scenario.py` | Database models (5 tables) |
| `models/schemas.py` | Pydantic schemas (20+ classes) |
| `models/__init__.py` | Package initializer |

#### Business Logic Services
| File | Purpose |
|------|---------|
| `services/scenario_service.py` | Scenario CRUD, Bayesian ensembles |
| `services/physical_risk_service.py` | Hazard modeling, EAL/PML |
| `services/transition_risk_service.py` | Carbon pricing, stranded assets |
| `services/credit_risk_service.py` | IFRS 9 ECL, Basel capital |
| `services/__init__.py` | Package initializer |

#### Machine Learning Models
| File | Purpose |
|------|---------|
| `ml/models/xgboost_damage.py` | XGBoost quantile regression |
| `ml/models/st_gnn.py` | Spatiotemporal graph neural network |
| `ml/models/__init__.py` | Package initializer |
| `ml/__init__.py` | Package initializer |

#### API Layer
| File | Purpose |
|------|---------|
| `api/routes/climate_risk.py` | 15+ REST API endpoints |
| `api/routes/__init__.py` | Package initializer |
| `api/__init__.py` | Package initializer |

#### Data Ingestion
| File | Purpose |
|------|---------|
| `data_ingestion/copernicus_client.py` | Copernicus CDS client |
| `data_ingestion/__init__.py` | Package initializer |

#### Supporting Directories
| Directory | Purpose |
|-----------|---------|
| `calculation_engines/` | Placeholder for calculation engines |
| `utils/` | Placeholder for utility functions |

## How to Use These Files

### 1. For New Implementation (Greenfield)

If building from scratch:

1. **Copy the implementation files**:
   ```bash
   cp -r /mnt/okcomputer/output/climate_risk_platform ./your-project/
   ```

2. **Install dependencies**:
   ```bash
   cd your-project
   pip install -r requirements.txt
   ```

3. **Configure database**:
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/climate_risk_db"
   ```

4. **Run the application**:
   ```bash
   uvicorn main:app --reload
   ```

### 2. For Integration (Existing Application)

If integrating into existing code:

1. **Read the integration guide**:
   ```bash
   cat /mnt/okcomputer/output/climate_risk_platform/INTEGRATION_GUIDE.md
   ```

2. **Copy specific modules**:
   ```bash
   # Copy only what you need
   cp -r climate_risk_platform/models ./your-project/climate_risk/
   cp -r climate_risk_platform/services ./your-project/climate_risk/
   ```

3. **Follow integration patterns** in `INTEGRATION_GUIDE.md`

### 3. For Understanding Requirements

If reviewing the specification:

1. **Read the unified specification**:
   ```bash
   cat /mnt/okcomputer/output/UNIFIED_REQUIREMENTS_SPECIFICATION.md
   ```

2. **Review scenario analysis**:
   ```bash
   cat /mnt/okcomputer/output/NGFS_IEA_IPCC_INTEGRATION.md
   ```

3. **Check ML models**:
   ```bash
   cat /mnt/okcomputer/output/ADVANCED_ML_MODELS_CLIMATE_RISK.md
   ```

## File Relationships

```
Documentation Files:
├── UNIFIED_REQUIREMENTS_SPECIFICATION.md (Master spec)
├── CLAUDE_CODE_BUILD_PROMPT.md (Build prompt)
├── INTEGRATION_GUIDE_EXISTING_APPLICATION.md (Integration patterns)
├── PRACTICAL_INTEGRATION_GUIDE.md (Code extraction)
├── NGFS_IEA_IPCC_INTEGRATION.md (Scenarios)
├── GLOBAL_SCENARIO_REFERENCE_DATA.md (Reference data)
├── ADVANCED_ML_MODELS_CLIMATE_RISK.md (ML models)
└── FREE_LOW_COST_DATA_SOURCES.md (Data sources)

Implementation Files:
├── main.py (Entry point)
├── models/ (Database + Schemas)
├── services/ (Business logic)
├── ml/models/ (ML implementations)
├── api/routes/ (REST API)
└── data_ingestion/ (Data clients)
```

## Key Implementation Details

### Database Models (`models/scenario.py`)
- `Scenario`: Climate scenario metadata
- `ScenarioVariable`: Time-series variables
- `AssetClimateRisk`: Individual asset risk
- `PortfolioClimateRisk`: Portfolio aggregation
- `ScenarioEnsemble`: Bayesian ensemble config

### Services (`services/`)
- `ScenarioService`: CRUD + ensemble generation
- `PhysicalRiskService`: 6 hazard types, EAL/PML
- `TransitionRiskService`: Carbon pricing, stranded assets
- `CreditRiskService`: IFRS 9, Basel capital

### ML Models (`ml/models/`)
- `XGBoostDamageModel`: Quantile regression with conformal prediction
- `STGNNClimateRisk`: Graph neural network for spatial risk

### API Endpoints (`api/routes/climate_risk.py`)
- `GET /scenarios`: List scenarios
- `POST /scenarios`: Create scenario
- `POST /physical-risk/calculate`: Calculate physical risk
- `POST /transition-risk/calculate`: Calculate transition risk
- `POST /credit-risk/calculate`: Calculate credit risk
- `POST /ensembles`: Generate scenario ensemble

## Next Steps

1. **Review the implementation** in `climate_risk_platform/`
2. **Test the API** using the provided endpoints
3. **Integrate with your application** following `INTEGRATION_GUIDE.md`
4. **Extend with additional data sources** using patterns in `data_ingestion/`
5. **Train ML models** using your data with `ml/models/`

## Support

All files are located in `/mnt/okcomputer/output/`:
- Documentation: Root of output directory
- Implementation: `climate_risk_platform/` subdirectory
