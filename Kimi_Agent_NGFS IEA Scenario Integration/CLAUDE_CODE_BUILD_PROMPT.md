# Claude Code Build Prompt
## AA Impact Climate Risk Modeling Platform

---

Use this prompt with Claude Code to build the complete climate risk modeling platform. Copy and paste the entire content below into Claude Code.

---

```
Build a comprehensive Climate Risk Modeling Platform for financial institutions. This is an enterprise-grade system for assessing physical risk, transition risk, and climate scenario analysis.

## PROJECT OVERVIEW

Build a cloud-native platform with:
- 100+ climate scenarios (NGFS, IEA, IPCC, IRENA, GFANZ)
- 15+ ML models for risk computation
- 80+ integrated data sources
- Real-time and batch risk assessment
- Portfolio aggregation and VaR/CVaR calculation
- Regulatory reporting (Basel IV, IFRS 9, TCFD)

## TECHNOLOGY STACK

**Backend:**
- FastAPI (Python 3.11+)
- PostgreSQL 15 + PostGIS (via Supabase)
- Redis (caching + queues)
- Celery (background tasks)

**ML/AI:**
- PyTorch 2.0+
- PyTorch Geometric (GNNs)
- XGBoost, LightGBM
- NVIDIA Triton (model serving)
- MLflow (model registry)

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- Recharts/D3 (visualizations)

**Infrastructure:**
- Docker + Docker Compose
- Railway (deployment)
- Kong (API gateway)
- Prometheus + Grafana (monitoring)

## SYSTEM ARCHITECTURE

```
Frontend (React) → API Gateway (Kong) → FastAPI Services → Calculation Engines → ML Inference (Triton) → Data Sources
```

## MODULE 1: SCENARIO MANAGEMENT SERVICE

Build a service to manage 100+ climate scenarios:

**Database Schema:**
```sql
CREATE TABLE scenarios (
    scenario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL, -- 'NGFS', 'IEA', 'IPCC', 'IRENA'
    scenario_code VARCHAR(20) NOT NULL,
    scenario_name VARCHAR(100) NOT NULL,
    temperature_outcome DECIMAL(3,1),
    description TEXT,
    version VARCHAR(10),
    release_date DATE,
    UNIQUE(provider, scenario_code, version)
);

CREATE TABLE scenario_variables (
    variable_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(scenario_id),
    variable_name VARCHAR(100) NOT NULL,
    variable_category VARCHAR(50), -- 'macro', 'energy', 'emissions', 'climate'
    unit VARCHAR(20),
    year INTEGER,
    value DECIMAL(18,6),
    confidence_lower DECIMAL(18,6),
    confidence_upper DECIMAL(18,6),
    UNIQUE(scenario_id, variable_name, year)
);

CREATE TABLE scenario_weights (
    weight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(scenario_id),
    weight_method VARCHAR(50), -- 'equal', 'temperature', 'bma'
    weight_value DECIMAL(10,8) NOT NULL CHECK (weight_value >= 0),
    target_temperature DECIMAL(3,1),
    calculation_date DATE
);
```

**API Endpoints:**
- `GET /v1/scenarios` - List scenarios with filters
- `GET /v1/scenarios/{id}/variables` - Get time series data
- `POST /v1/scenarios/ensemble` - Generate ensemble projection
- `GET /v1/scenarios/comparison` - Compare multiple scenarios

**Implementation:**
- Create Pydantic models for all request/response schemas
- Implement CRUD operations with SQLAlchemy
- Add ensemble generation using Bayesian Model Averaging
- Cache frequently accessed scenarios in Redis

## MODULE 2: PHYSICAL RISK ENGINE

Build calculation engine for physical climate risk:

**Core Components:**

1. **HazardIntensityMapper** - Maps asset locations to hazard intensity
```python
class HazardIntensityMapper:
    def map_flood_intensity(self, locations, return_periods, scenarios):
        # Query FEMA flood maps (US) or GloFAS (global)
        pass
    
    def map_earthquake_intensity(self, locations):
        # Query USGS earthquake hazard
        pass
    
    def map_wind_intensity(self, locations, scenarios):
        # Query Copernicus ERA5 or NOAA
        pass
```

2. **DamageFunctionBNN** - Bayesian Neural Network for damage estimation
```python
class DamageFunctionBNN(nn.Module):
    def __init__(self, input_dim, hidden_dim=64):
        super().__init__()
        # Bayesian layers with mean and rho parameters
        self.weight_mu_1 = nn.Parameter(torch.Tensor(hidden_dim, input_dim).normal_(0, 0.1))
        self.weight_rho_1 = nn.Parameter(torch.Tensor(hidden_dim, input_dim).normal_(-3, 0.1))
        # ... more layers
    
    def forward(self, x):
        # Sample weights, return mean and log_var
        pass
    
    def elbo_loss(self, x, y, kl_weight=1e-4):
        # Evidence Lower Bound loss
        pass
```

3. **PortfolioAggregation** - Aggregate individual risks
```python
class PortfolioAggregationEngine:
    def calculate_eal(self, asset_risks):
        # Expected Annual Loss
        pass
    
    def calculate_var(self, asset_risks, correlation_matrix, confidence=0.95):
        # Value at Risk with correlations
        pass
    
    def calculate_cvar(self, asset_risks, confidence=0.95):
        # Conditional VaR (Expected Shortfall)
        pass
```

**API Endpoints:**
- `POST /v1/physical-risk/assess` - Assess physical risk for assets
- `GET /v1/physical-risk/portfolio/{id}/var` - Calculate portfolio VaR
- `POST /v1/physical-risk/multi-hazard` - Multi-hazard compounding

**Data Sources to Integrate:**
- Copernicus CDS (ERA5, CMIP6) - FREE
- USGS Earthquake API - FREE
- FEMA Flood Maps (US) - FREE
- NOAA Climate Data - FREE
- NASA POWER - FREE

## MODULE 3: TRANSITION RISK ENGINE

Build engine for transition risk assessment:

**Core Components:**

1. **CarbonPriceModel** - Carbon price trajectories
```python
class CarbonPriceModel:
    def __init__(self, scenario):
        self.scenario = scenario
        self.params = self.load_scenario_params(scenario)
    
    def price(self, year):
        # P_t = P_0 * exp(g_t * t) + jump_t
        pass
    
    def trajectory(self, years):
        # Generate price trajectory
        pass
```

2. **StrandedAssetValuation** - Real options for stranded assets
```python
class StrandedAssetValuation:
    def value_with_flexibility(self, cash_flows, salvage_value, 
                                carbon_intensity, carbon_price_model,
                                discount_rate=0.08, volatility=0.2):
        # Binomial tree for American option pricing
        pass
```

3. **DCFImpairment** - Climate-adjusted DCF
```python
class DCFImpairment:
    def calculate_impairment(self, cash_flows, carbon_costs, 
                            discount_rate, time_horizon):
        # CF_t_adjusted = CF_t - carbon_costs_t
        # V = sum(CF_t_adjusted / (1+r)^t)
        pass
```

**API Endpoints:**
- `POST /v1/transition-risk/assess` - Assess transition risk
- `POST /v1/transition-risk/stranded-assets` - Calculate stranded value
- `GET /v1/transition-risk/carbon-price` - Get carbon price trajectory

**Data Sources:**
- NGFS scenarios (via API or download)
- IEA WEO (subscription or free extracts)
- SBTi sector pathways - FREE
- TPI benchmarks - FREE

## MODULE 4: CREDIT RISK ENGINE

Build climate-adjusted credit risk models:

**Core Components:**

1. **ClimateMertonModel** - Merton model with climate adjustment
```python
class ClimateMertonModel:
    def __init__(self, firm_value, debt_face_value, risk_free_rate,
                 time_to_maturity, base_volatility, climate_risk_score):
        self.V = firm_value
        self.D = debt_face_value
        self.r = risk_free_rate
        self.T = time_to_maturity
        self.sigma_base = base_volatility
        self.climate_score = climate_risk_score
    
    @property
    def climate_adjusted_volatility(self):
        # sigma_climate = sigma_base * (1 + beta * climate_score)
        return self.sigma_base * (1 + 0.3 * self.climate_score)
    
    def distance_to_default(self):
        # DD = [ln(V/D) + (mu - 0.5*sigma^2)*T] / (sigma*sqrt(T))
        pass
    
    def probability_of_default(self):
        # PD = N(-DD)
        from scipy.stats import norm
        return norm.cdf(-self.distance_to_default())
```

2. **IFRS9ECL** - Expected Credit Loss calculation
```python
class IFRS9ECL:
    def calculate_ecl(self, exposures, pd_term_structure, 
                     lgd_term_structure, scenarios, scenario_weights):
        # ECL = sum_t [PD_t * LGD_t * EAD_t * DF_t]
        # Weighted across scenarios
        pass
```

**API Endpoints:**
- `POST /v1/credit-risk/pd` - Calculate climate-adjusted PD
- `POST /v1/credit-risk/ecl` - Calculate ECL (IFRS 9)
- `POST /v1/credit-risk/capital` - Calculate ICAAP capital

## MODULE 5: ML INFERENCE SERVICE

Build ML model serving infrastructure:

**Models to Implement:**

1. **iTransformer** - Multivariate time series forecasting
```python
class iTransformer(nn.Module):
    def __init__(self, input_len=168, pred_len=24, d_model=512, 
                 n_heads=8, e_layers=2):
        super().__init__()
        # Inverted Transformer - attention across variables
        self.value_embedding = nn.Linear(input_len, d_model)
        self.encoder = nn.TransformerEncoder(...)
        self.projection = nn.Linear(d_model, pred_len)
```

2. **ST-GNN** - Spatial-temporal graph neural network
```python
class STGNNRisk(nn.Module):
    def __init__(self, in_channels, out_channels, num_nodes, K=3):
        super().__init__()
        self.spatial_conv = ChebConv(in_channels, out_channels, K=K)
        self.temporal_conv = nn.Conv2d(out_channels, out_channels, 
                                       kernel_size=(3, 1), padding=(1, 0))
```

3. **XGBoostEnsemble** - Gradient boosting with quantile regression
```python
class XGBoostRiskEnsemble:
    def __init__(self):
        self.quantiles = [0.05, 0.25, 0.5, 0.75, 0.95]
        self.models = {}
    
    def fit(self, X, y):
        for q in self.quantiles:
            model = xgb.XGBRegressor(objective='reg:quantileerror', 
                                     quantile_alpha=q)
            model.fit(X, y)
            self.models[q] = model
```

**Model Serving:**
- Export models to ONNX format
- Serve with NVIDIA Triton
- Version models with MLflow
- Implement A/B testing

**API Endpoints:**
- `POST /v1/ml/forecast` - Run ML forecast
- `GET /v1/ml/models` - List available models
- `POST /v1/ml/predict/{model_id}` - Run specific model

## DATA INTEGRATION LAYER

**Paid Sources (Already Have):**
- EODHD API - Financial markets ($19-79/month)
- BRSR - India ESG data

**Free Sources to Integrate:**

1. **Copernicus Climate Data Store**
```python
import cdsapi

c = cdsapi.Client()
c.retrieve('reanalysis-era5-single-levels', {
    'variable': ['2m_temperature', 'total_precipitation'],
    'year': '2023',
    'month': '01',
    'day': '01',
    'time': '12:00',
    'format': 'netcdf'
}, 'era5_data.nc')
```

2. **SEC EDGAR (Free)**
```python
import requests
headers = {"User-Agent": "your@email.com"}
url = "https://data.sec.gov/api/xbrl/companyfacts/CIK0001318605.json"
response = requests.get(url, headers=headers)
```

3. **USGS Earthquake API**
```python
url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
params = {"format": "geojson", "starttime": "2023-01-01", 
          "minmagnitude": 5.0}
response = requests.get(url, params=params)
```

4. **OpenStreetMap**
```python
import osmnx as ox
buildings = ox.geometries.geometries_from_place(
    "Manhattan, New York", tags={"building": True})
```

## FRONTEND DASHBOARD

Build a React dashboard with:

**Pages:**
1. **Portfolio Overview** - Risk heat map, VaR summary
2. **Scenario Analysis** - Compare scenarios, ensemble projections
3. **Physical Risk** - Asset-level hazard maps, damage estimates
4. **Transition Risk** - Carbon cost trajectories, stranded assets
5. **Credit Risk** - PD/LGD trends, ECL calculations
6. **Reports** - Generate regulatory reports (TCFD, Basel)

**Components:**
- Interactive maps (Mapbox/Leaflet)
- Time series charts (Recharts)
- Risk gauges and KPIs
- Data tables with filtering
- Export to PDF/Excel

## IMPLEMENTATION ORDER

**Phase 1 (Weeks 1-4): Foundation**
1. Set up infrastructure (Supabase, Railway, Docker)
2. Create database schemas
3. Implement Scenario Management Service
4. Build basic API layer

**Phase 2 (Weeks 5-8): Physical Risk**
1. Integrate Copernicus CDS for climate data
2. Build HazardIntensityMapper
3. Implement XGBoost damage prediction
4. Create portfolio aggregation

**Phase 3 (Weeks 9-12): Transition & Credit Risk**
1. Build CarbonPriceModel
2. Implement stranded asset valuation
3. Build ClimateMertonModel
4. Implement ECL calculation

**Phase 4 (Weeks 13-16): ML Models**
1. Implement iTransformer
2. Build ST-GNN
3. Train and deploy models
4. Set up Triton serving

**Phase 5 (Weeks 17-20): Frontend & Polish**
1. Build React dashboard
2. Create visualizations
3. Add reporting
4. Performance optimization

## TESTING REQUIREMENTS

- Unit tests for all calculation engines (>80% coverage)
- Integration tests for API endpoints
- Load tests (1000 concurrent users)
- Backtesting with historical events

## DEPLOYMENT

Use Docker Compose for local development:
```yaml
version: '3.8'
services:
  api:
    build: ./api
    ports:
      - "8000:8000"
  db:
    image: postgis/postgis:15-3.3
  redis:
    image: redis:7
  ml:
    build: ./ml
    runtime: nvidia
```

Deploy to Railway for production.

## SUCCESS CRITERIA

- [ ] All 5 modules operational
- [ ] 100+ scenarios ingested
- [ ] 6 hazard types supported
- [ ] 15+ ML models deployed
- [ ] API latency <500ms (p95)
- [ ] 99.9% uptime

Build this system following software engineering best practices: clean code, comprehensive tests, proper error handling, and detailed documentation.
```

---

## How to Use This Prompt

1. **Open Claude Code** in your terminal
2. **Paste the entire prompt above** (between the triple backticks)
3. **Claude will begin building** the system module by module
4. **Review and iterate** as each component is built

---

## Tips for Working with Claude Code

- **Start with Phase 1** (infrastructure and database)
- **Ask Claude to commit frequently** (`git commit` after each module)
- **Request tests** for each component (`pytest`)
- **Ask for documentation** (`README.md` for each module)
- **Iterate** - have Claude refine and improve as needed

---

*End of Claude Code Build Prompt*
