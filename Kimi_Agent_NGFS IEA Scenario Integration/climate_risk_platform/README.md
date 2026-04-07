# Climate Risk Modeling Platform

Enterprise-grade climate risk modeling platform for financial institutions. Assesses physical risk (flood, wind, earthquake, wildfire, heat, drought), transition risk (carbon pricing, stranded assets), and climate scenario analysis.

## Features

### Climate Scenario Analysis
- **NGFS Scenarios**: Phase 5 scenarios (Current Policies, NDC, NZ2050, etc.)
- **IEA Pathways**: World Energy Outlook 2024 scenarios
- **IPCC AR6**: 3,131 scenario database
- **Bayesian Ensembles**: Multi-scenario uncertainty quantification

### Physical Risk Assessment
- **Hazard Modeling**: Flood, wildfire, hurricane, earthquake, heat stress, drought
- **Financial Impact**: EAL (Expected Annual Loss), PML (Probable Maximum Loss)
- **Multi-hazard Compounding**: Copula-based correlation modeling
- **Return Period Analysis**: 10 to 500-year event modeling

### Transition Risk Assessment
- **Carbon Pricing**: Scenario-based carbon cost projections
- **Stranded Asset Analysis**: Probability and value at risk
- **Sector Pathways**: MPP, TPI, SBTi, CRREM alignment
- **Temperature Alignment**: Portfolio-level temperature scoring

### Credit Risk Integration
- **IFRS 9 ECL**: Climate-adjusted Expected Credit Loss
- **Basel Capital**: RWA and capital charge calculations
- **Merton Model**: Climate-adjusted PD/LGD
- **Portfolio Aggregation**: Multi-asset risk consolidation

### Machine Learning Models
- **XGBoost**: Quantile regression with conformal prediction
- **ST-GNN**: Spatiotemporal graph neural networks
- **Bayesian Neural Networks**: Uncertainty quantification
- **iTransformer**: Long-horizon time series forecasting

## Quick Start

### Installation

```bash
# Clone repository
git clone <repository-url>
cd climate_risk_platform

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
export DATABASE_URL="postgresql://user:password@localhost:5432/climate_risk_db"

# Run migrations
alembic upgrade head

# Start server
uvicorn main:app --reload
```

### API Documentation

Once running, access interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Example Usage

#### List Climate Scenarios
```bash
curl "http://localhost:8000/v1/climate-risk/scenarios?provider=NGFS"
```

#### Calculate Physical Risk
```bash
curl -X POST "http://localhost:8000/v1/climate-risk/physical-risk/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "asset_id": "ASSET001",
    "asset_type": "real_estate",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "sector": "real_estate",
    "scenario_id": "550e8400-e29b-41d4-a716-446655440000",
    "time_horizon_years": 10,
    "asset_value": 10000000,
    "hazards": ["flood", "hurricane", "heat"]
  }'
```

#### Create Scenario Ensemble
```bash
curl -X POST "http://localhost:8000/v1/climate-risk/ensembles" \
  -H "Content-Type: application/json" \
  -d '{
    "ensemble_name": "Net Zero Optimistic",
    "scenario_ids": [
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001"
    ],
    "weight_method": "temperature",
    "confidence_level": 0.95
  }'
```

## Project Structure

```
climate_risk_platform/
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── config/
│   ├── database.py           # SQLAlchemy configuration
│   └── settings.py           # Application settings
├── models/
│   ├── scenario.py           # Database models
│   └── schemas.py            # Pydantic schemas
├── services/
│   ├── scenario_service.py   # Scenario business logic
│   ├── physical_risk_service.py
│   ├── transition_risk_service.py
│   └── credit_risk_service.py
├── ml/
│   └── models/
│       ├── xgboost_damage.py
│       ├── st_gnn.py
│       └── bayesian_nn.py
├── api/
│   └── routes/
│       └── climate_risk.py   # API endpoints
├── data_ingestion/
│   ├── copernicus_client.py  # CDS data access
│   ├── usgs_client.py        # Earthquake data
│   └── noaa_client.py        # Weather data
├── calculation_engines/
│   ├── physical_engine.py
│   ├── transition_engine.py
│   └── credit_engine.py
└── tests/
    └── test_*.py
```

## Data Sources

### Free/Low-Cost Sources
- **Copernicus CDS**: Climate reanalysis and projections (Free)
- **USGS**: Earthquake hazard data (Free)
- **NOAA**: Weather and flood data (Free)
- **OpenStreetMap**: Building footprints (Free)
- **SEC EDGAR**: Company emissions data (Free)
- **CDP**: Corporate climate disclosures (Free registration)

### Commercial Integrations
- **EODHD**: Financial market data
- **BRSR**: India ESG disclosures
- **First Street Foundation**: Flood/wildfire risk
- **Moody's/RMS**: Catastrophe models

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# API Keys
CDSAPI_KEY=your-copernicus-key
CDSAPI_URL=https://cds.climate.copernicus.eu/api/v2
EODHD_API_KEY=your-eodhd-key

# Application
DEBUG=false
LOG_LEVEL=INFO
WORKERS=4
```

## Development

### Running Tests
```bash
pytest tests/ -v --cov=.
```

### Code Formatting
```bash
black .
flake8
mypy .
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Deployment

### Docker
```bash
# Build image
docker build -t climate-risk-platform .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=$DATABASE_URL \
  climate-risk-platform
```

### Railway/Supabase
```bash
# Deploy to Railway
railway login
railway init
railway up

# Set environment variables
railway variables set DATABASE_URL=$DATABASE_URL
```

## License

MIT License - See LICENSE file for details.

## Support

For support and questions:
- Email: support@climate-risk-platform.com
- Documentation: https://docs.climate-risk-platform.com
- Issues: https://github.com/your-org/climate-risk-platform/issues
