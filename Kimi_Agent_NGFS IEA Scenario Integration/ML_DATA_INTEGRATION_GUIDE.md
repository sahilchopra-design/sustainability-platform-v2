# ML Model & Data Integration Guide
## Practical Implementation for Climate Risk Modeling with EODHD and BRSR

---

**Document Classification:** Implementation Guide  
**Version:** 1.0  
**Date:** April 2026  
**Prepared by:** AA Impact Inc. Engineering Team  

---

## Executive Summary

This guide provides practical implementation patterns for integrating advanced ML models with free/low-cost data sources, complementing existing EODHD (financial markets) and BRSR (India ESG) subscriptions for comprehensive climate risk modeling.

### Integration Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ML Model Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │iTransformer │  │   ST-GNN    │  │   XGBoost   │             │
│  │  (Time)     │  │  (Space)    │  │  (Tabular)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    BNN      │  │  GraphCast  │  │   LightGBM  │             │
│  │(Uncertainty)│  │  (Weather)  │  │  (Ensemble) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Integration Layer                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PAID: EODHD (Financial) │ PAID: BRSR (India ESG)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FREE: Copernicus │ NOAA │ USGS │ SEC │ OpenStreetMap    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Data Source Mapping by ML Model](#1-data-source-mapping-by-ml-model)
2. [End-to-End Implementation Examples](#2-end-to-end-implementation-examples)
3. [Feature Engineering Pipeline](#3-feature-engineering-pipeline)
4. [Model Training Workflows](#4-model-training-workflows)
5. [Cost Optimization Strategies](#5-cost-optimization-strategies)

---

## 1. Data Source Mapping by ML Model

### 1.1 iTransformer for Multivariate Climate Forecasting

**Required Data:**

| Data Type | Source | Cost | Format |
|-----------|--------|------|--------|
| Historical weather | Copernicus ERA5 | Free | NetCDF |
| Climate projections | Copernicus CMIP6 | Free | NetCDF |
| Real-time weather | Open-Meteo | Free | JSON/API |
| Station data | NOAA GHCN | Free | CSV/API |

**Feature Engineering:**
```python
import xarray as xr
import pandas as pd
import numpy as np

# Load ERA5 data
ds = xr.open_dataset('era5_data.nc')

# Extract multivariate time series
temperature = ds['t2m'].values  # 2m temperature
precipitation = ds['tp'].values  # Total precipitation
wind_u = ds['u10'].values  # 10m U wind
wind_v = ds['v10'].values  # 10m V wind
humidity = ds['rh'].values  # Relative humidity

# Create multivariate dataframe
data = pd.DataFrame({
    'temperature': temperature.flatten(),
    'precipitation': precipitation.flatten(),
    'wind_speed': np.sqrt(wind_u**2 + wind_v**2),
    'humidity': humidity.flatten()
}, index=pd.to_datetime(ds.time.values))

# Normalize for iTransformer
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
data_scaled = scaler.fit_transform(data)
```

**iTransformer Implementation:**
```python
# Using neuralforecast library
from neuralforecast.models import iTransformer
from neuralforecast import NeuralForecast

# Configure model
model = iTransformer(
    h=24,  # Forecast horizon (24 time steps)
    input_size=168,  # Lookback window
    hidden_size=512,
    n_heads=8,
    e_layers=2,
    d_layers=1,
    dropout=0.1,
    scaler_type='standard',
    learning_rate=0.001,
    max_steps=100
)

# Train
nf = NeuralForecast(models=[model], freq='H')
nf.fit(df=data, val_size=168)

# Forecast
forecasts = nf.predict()
```

---

### 1.2 ST-GNN for Spatial Portfolio Risk

**Required Data:**

| Data Type | Source | Cost | Format |
|-----------|--------|------|--------|
| Asset locations | EODHD (company HQ) | Paid | JSON/API |
| Geocoding | OpenStreetMap Nominatim | Free | JSON/API |
| Hazard layers | USGS, NOAA, Copernicus | Free | GeoTIFF |
| Network connections | OpenCorporates (supply chain) | Free | JSON/API |

**Graph Construction:**
```python
import osmnx as ox
import networkx as nx
from scipy.spatial.distance import cdist

# Get asset locations from EODHD
assets = eodhd_client.get_company_info(tickers)
locations = [(a['lat'], a['lon']) for a in assets]

# Build spatial graph
n_assets = len(locations)
adj_matrix = np.zeros((n_assets, n_assets))

# Connect assets within 100km
for i in range(n_assets):
    for j in range(i+1, n_assets):
        dist = geodesic(locations[i], locations[j]).km
        if dist < 100:
            adj_matrix[i, j] = adj_matrix[j, i] = 1 / (dist + 1)

# Add hazard intensity as node features
hazard_data = extract_hazard_intensity(locations, 'flood')
node_features = np.column_stack([
    [a['market_cap'] for a in assets],
    [a['carbon_intensity'] for a in assets],
    hazard_data['flood_risk'],
    hazard_data['wildfire_risk']
])
```

**ST-GNN Implementation:**
```python
import torch
import torch.nn as nn
from torch_geometric.nn import GCNConv, GATConv
from torch_geometric_temporal import DCRNN

class STGNN_Risk(nn.Module):
    def __init__(self, node_features, hidden_dim, num_layers):
        super().__init__()
        self.convs = nn.ModuleList()
        self.convs.append(GCNConv(node_features, hidden_dim))
        for _ in range(num_layers - 1):
            self.convs.append(GCNConv(hidden_dim, hidden_dim))
        
        self.temporal = nn.LSTM(hidden_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, 1)  # Risk score
    
    def forward(self, x, edge_index, edge_weight, seq_len):
        # Spatial convolution
        for conv in self.convs:
            x = torch.relu(conv(x, edge_index, edge_weight))
        
        # Temporal modeling
        x, _ = self.temporal(x.unsqueeze(0))
        
        # Risk prediction
        risk = torch.sigmoid(self.fc(x[:, -1, :]))
        return risk
```

---

### 1.3 XGBoost/LightGBM for Damage Prediction

**Required Data:**

| Data Type | Source | Cost | Format |
|-----------|--------|------|--------|
| Asset characteristics | EODHD + SEC EDGAR | Mixed | JSON/API |
| Hazard intensity | USGS, NOAA, Copernicus | Free | GeoTIFF/API |
| Historical damage | FEMA, insurance data | Free | CSV |
| Building footprints | OpenStreetMap | Free | GeoJSON |

**Feature Engineering:**
```python
import pandas as pd
import numpy as np

# Asset features from EODHD + SEC
asset_features = pd.DataFrame({
    'company_id': companies,
    'market_cap': [get_market_cap(c) for c in companies],
    'total_assets': [get_total_assets(c) for c in companies],
    'property_plant_equipment': [get_ppe(c) for c in companies],
    'industry_code': [get_industry(c) for c in companies],
    'latitude': [get_lat(c) for c in companies],
    'longitude': [get_lon(c) for c in companies]
})

# Hazard features from free sources
hazard_features = pd.DataFrame({
    'company_id': companies,
    'flood_depth_100yr': [get_flood_depth(c, return_period=100) for c in companies],
    'earthquake_pga': [get_earthquake_pga(c) for c in companies],
    'wind_speed_50yr': [get_wind_speed(c, return_period=50) for c in companies],
    'wildfire_probability': [get_wildfire_prob(c) for c in companies],
    'sea_level_rise_2050': [get_slr(c, year=2050) for c in companies]
})

# Combine features
features = pd.merge(asset_features, hazard_features, on='company_id')

# Target: historical damage ratio (from insurance data or reported losses)
target = pd.DataFrame({
    'company_id': companies,
    'damage_ratio': [get_historical_damage(c) for c in companies]
})

df = pd.merge(features, target, on='company_id')
```

**XGBoost Implementation:**
```python
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# Prepare data
X = df.drop(['company_id', 'damage_ratio'], axis=1)
y = df['damage_ratio']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train quantile regression for uncertainty
quantiles = [0.05, 0.25, 0.5, 0.75, 0.95]
models = {}

for q in quantiles:
    model = xgb.XGBRegressor(
        objective='reg:quantileerror',
        quantile_alpha=q,
        n_estimators=1000,
        max_depth=6,
        learning_rate=0.05
    )
    model.fit(X_train, y_train)
    models[q] = model

# Predict with uncertainty
predictions = {q: models[q].predict(X_test) for q in quantiles}
```

---

### 1.4 Bayesian Neural Networks for Uncertainty Quantification

**Required Data:**
- Same as XGBoost above
- Plus: ensemble of predictions for calibration

**BNN Implementation:**
```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class BayesianLinear(nn.Module):
    def __init__(self, in_features, out_features):
        super().__init__()
        self.weight_mu = nn.Parameter(torch.Tensor(out_features, in_features).normal_(0, 0.1))
        self.weight_rho = nn.Parameter(torch.Tensor(out_features, in_features).normal_(-3, 0.1))
        self.bias_mu = nn.Parameter(torch.Tensor(out_features).normal_(0, 0.1))
        self.bias_rho = nn.Parameter(torch.Tensor(out_features).normal_(-3, 0.1))
    
    def forward(self, x):
        weight_sigma = torch.log1p(torch.exp(self.weight_rho))
        bias_sigma = torch.log1p(torch.exp(self.bias_rho))
        
        weight = self.weight_mu + weight_sigma * torch.randn_like(self.weight_mu)
        bias = self.bias_mu + bias_sigma * torch.randn_like(self.bias_mu)
        
        return F.linear(x, weight, bias)

class BNN_Risk(nn.Module):
    def __init__(self, input_dim, hidden_dim):
        super().__init__()
        self.fc1 = BayesianLinear(input_dim, hidden_dim)
        self.fc2 = BayesianLinear(hidden_dim, hidden_dim)
        self.fc3 = BayesianLinear(hidden_dim, 2)  # mean and log_var
    
    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x[:, 0], x[:, 1]  # mean, log_var

# Training with ELBO
def elbo_loss(y_pred, y_true, model, kl_weight=1e-4):
    mean, log_var = y_pred
    # Negative log likelihood
    nll = 0.5 * (log_var + (y_true - mean)**2 / torch.exp(log_var))
    # KL divergence (simplified)
    kl = 0  # Compute KL for all Bayesian layers
    return nll.mean() + kl_weight * kl
```

---

## 2. End-to-End Implementation Examples

### 2.1 Physical Risk Assessment Pipeline

```python
"""
Complete pipeline for physical risk assessment
Data sources: EODHD + Copernicus + USGS + OpenStreetMap
"""

class PhysicalRiskPipeline:
    def __init__(self, eodhd_api_key):
        self.eodhd = EODHDClient(eodhd_api_key)
        self.cds = cdsapi.Client()
        
    def get_asset_data(self, tickers):
        """Get asset data from EODHD + SEC EDGAR"""
        assets = []
        for ticker in tickers:
            # From EODHD
            info = self.eodhd.get_fundamentals(ticker)
            
            # From SEC EDGAR (free)
            cik = get_cik_from_ticker(ticker)
            sec_data = fetch_sec_facts(cik)
            
            assets.append({
                'ticker': ticker,
                'cik': cik,
                'market_cap': info['market_cap'],
                'total_assets': sec_data['assets'],
                'ppe': sec_data['property_plant_equipment'],
                'lat': info['lat'],
                'lon': info['lon']
            })
        return pd.DataFrame(assets)
    
    def get_hazard_data(self, locations, hazards=['flood', 'earthquake', 'wind']):
        """Get hazard data from free sources"""
        hazard_data = {}
        
        for hazard in hazards:
            if hazard == 'flood':
                # From USGS/FEMA
                hazard_data[hazard] = self.get_flood_risk(locations)
            elif hazard == 'earthquake':
                # From USGS
                hazard_data[hazard] = self.get_earthquake_risk(locations)
            elif hazard == 'wind':
                # From Copernicus ERA5
                hazard_data[hazard] = self.get_wind_risk(locations)
                
        return pd.DataFrame(hazard_data)
    
    def calculate_risk(self, assets, hazards, model='xgboost'):
        """Calculate physical risk using ML"""
        # Combine features
        features = pd.concat([assets, hazards], axis=1)
        
        # Load pre-trained model
        if model == 'xgboost':
            model = xgb.Booster()
            model.load_model('physical_risk_xgb.json')
            risk = model.predict(xgb.DMatrix(features))
        elif model == 'bnn':
            risk = self.bnn_predict(features)
            
        return risk
    
    def run(self, tickers):
        """Run complete pipeline"""
        # 1. Get asset data
        assets = self.get_asset_data(tickers)
        
        # 2. Get hazard data
        locations = assets[['lat', 'lon']].values
        hazards = self.get_hazard_data(locations)
        
        # 3. Calculate risk
        risk = self.calculate_risk(assets, hazards)
        
        # 4. Return results
        results = pd.DataFrame({
            'ticker': assets['ticker'],
            'physical_risk_score': risk,
            'expected_loss': risk * assets['ppe']
        })
        
        return results

# Usage
pipeline = PhysicalRiskPipeline(eodhd_api_key='YOUR_KEY')
results = pipeline.run(['AAPL', 'MSFT', 'TSLA'])
```

---

### 2.2 Transition Risk Assessment Pipeline

```python
"""
Transition risk assessment using scenario analysis
Data sources: EODHD + NGFS + IEA + OpenCorporates
"""

class TransitionRiskPipeline:
    def __init__(self, eodhd_api_key):
        self.eodhd = EODHDClient(eodhd_api_key)
        
    def get_company_profile(self, tickers):
        """Get company emissions and sector data"""
        profiles = []
        for ticker in tickers:
            # From EODHD
            profile = self.eodhd.get_fundamentals(ticker)
            
            # From SEC (free)
            cik = get_cik_from_ticker(ticker)
            sec_climate = fetch_sec_climate_disclosure(cik)
            
            profiles.append({
                'ticker': ticker,
                'sector': profile['industry'],
                'scope1_emissions': sec_climate.get('scope1'),
                'scope2_emissions': sec_climate.get('scope2'),
                'revenue': profile['revenue']
            })
        return pd.DataFrame(profiles)
    
    def get_scenario_data(self, scenario='NGFS_NZ2050'):
        """Get carbon price and policy trajectories"""
        # From NGFS (free)
        ngfs_data = fetch_ngfs_scenario(scenario)
        
        # From IEA (free for some data)
        iea_data = fetch_iea_data()
        
        return pd.merge(ngfs_data, iea_data, on='year')
    
    def calculate_stranding_risk(self, profile, scenario):
        """Calculate stranded asset risk"""
        # Carbon cost trajectory
        carbon_cost = scenario['carbon_price'] * (
            profile['scope1_emissions'] + profile['scope2_emissions']
        )
        
        # Revenue impact (sector-specific elasticity)
        elasticity = get_sector_elasticity(profile['sector'])
        revenue_impact = carbon_cost * elasticity
        
        # Stranding probability (using trained model)
        features = pd.DataFrame({
            'carbon_intensity': (profile['scope1'] + profile['scope2']) / profile['revenue'],
            'sector_risk': get_sector_transition_risk(profile['sector']),
            'policy_exposure': scenario['policy_stringency']
        })
        
        stranding_prob = self.model.predict_proba(features)[:, 1]
        
        return pd.DataFrame({
            'ticker': profile['ticker'],
            'stranding_probability': stranding_prob,
            'carbon_cost_2030': carbon_cost[2030],
            'carbon_cost_2050': carbon_cost[2050],
            'revenue_at_risk': revenue_impact
        })
    
    def run(self, tickers, scenario='NGFS_NZ2050'):
        """Run complete transition risk assessment"""
        profiles = self.get_company_profile(tickers)
        scenario_data = self.get_scenario_data(scenario)
        results = self.calculate_stranding_risk(profiles, scenario_data)
        return results
```

---

### 2.3 Portfolio Climate Risk Aggregation

```python
"""
Portfolio-level climate risk using ST-GNN
Data sources: EODHD + OpenCorporates + Copernicus
"""

class PortfolioRiskAggregator:
    def __init__(self, eodhd_api_key):
        self.eodhd = EODHDClient(eodhd_api_key)
        
    def build_portfolio_graph(self, holdings):
        """Build graph from portfolio holdings"""
        # Get company data
        companies = []
        for ticker, weight in holdings.items():
            info = self.eodhd.get_fundamentals(ticker)
            companies.append({
                'ticker': ticker,
                'weight': weight,
                'lat': info['lat'],
                'lon': info['lon'],
                'sector': info['industry'],
                'market_cap': info['market_cap']
            })
        
        df = pd.DataFrame(companies)
        
        # Build adjacency matrix (correlation + geography)
        n = len(df)
        adj = np.zeros((n, n))
        
        for i in range(n):
            for j in range(i+1, n):
                # Geographic proximity
                dist = geodesic(
                    (df.iloc[i]['lat'], df.iloc[i]['lon']),
                    (df.iloc[j]['lat'], df.iloc[j]['lon'])
                ).km
                
                # Sector correlation
                sector_corr = 0.8 if df.iloc[i]['sector'] == df.iloc[j]['sector'] else 0.3
                
                # Combined edge weight
                adj[i, j] = adj[j, i] = sector_corr / (1 + dist/100)
        
        # Node features: [weight, market_cap, physical_risk, transition_risk]
        node_features = df[['weight', 'market_cap']].values
        
        return adj, node_features, df['ticker'].values
    
    def propagate_risk(self, adj, node_features, initial_risk):
        """Propagate risk through portfolio network"""
        # Using Graph Convolution
        from torch_geometric.nn import GCNConv
        
        # Convert to PyG format
        edge_index = torch.tensor(np.array(adj.nonzero()), dtype=torch.long)
        edge_weight = torch.tensor(adj[adj.nonzero()], dtype=torch.float)
        x = torch.tensor(node_features, dtype=torch.float)
        
        # GCN layers
        conv1 = GCNConv(node_features.shape[1], 64)
        conv2 = GCNConv(64, 1)
        
        h = torch.relu(conv1(x, edge_index, edge_weight))
        propagated_risk = torch.sigmoid(conv2(h, edge_index, edge_weight))
        
        return propagated_risk
    
    def calculate_portfolio_var(self, holdings, confidence=0.95):
        """Calculate portfolio climate VaR"""
        adj, features, tickers = self.build_portfolio_graph(holdings)
        
        # Get individual risks
        individual_risks = self.get_individual_risks(tickers)
        
        # Propagate through network
        propagated = self.propagate_risk(adj, features, individual_risks)
        
        # Calculate portfolio VaR
        portfolio_loss = np.dot(holdings.values(), propagated.numpy().flatten())
        var = np.percentile(portfolio_loss, (1 - confidence) * 100)
        
        return var
```

---

## 3. Feature Engineering Pipeline

### 3.1 Climate Feature Engineering

```python
class ClimateFeatureEngineer:
    def __init__(self):
        self.cds = cdsapi.Client()
    
    def extract_extreme_indices(self, lat, lon, start_year, end_year):
        """Extract climate extreme indices from ERA5"""
        # Download ERA5 data
        self.download_era5(lat, lon, start_year, end_year)
        
        # Calculate indices
        ds = xr.open_dataset(f'era5_{lat}_{lon}.nc')
        
        features = {}
        
        # Temperature extremes
        features['txx'] = ds['t2m'].resample(time='1Y').max().mean().values  # Max Tmax
        features['tnn'] = ds['t2m'].resample(time='1Y').min().mean().values  # Min Tmin
        features['su'] = (ds['t2m'] > 25).resample(time='1Y').sum().mean().values  # Summer days
        
        # Precipitation extremes
        features['rx1day'] = ds['tp'].resample(time='1Y').max().mean().values  # Max 1-day precip
        features['r95p'] = ds['tp'].where(ds['tp'] > ds['tp'].quantile(0.95)).resample(time='1Y').sum().mean().values
        
        # Drought indices
        features['cdd'] = self.calculate_cdd(ds['tp'])  # Consecutive dry days
        
        return features
    
    def calculate_cdd(self, precip, threshold=1.0):
        """Calculate maximum consecutive dry days"""
        dry = precip < threshold
        cdd_list = []
        
        for year in np.unique(precip.time.dt.year):
            year_dry = dry.sel(time=str(year))
            max_cdd = 0
            current = 0
            for d in year_dry.values:
                if d:
                    current += 1
                    max_cdd = max(max_cdd, current)
                else:
                    current = 0
            cdd_list.append(max_cdd)
        
        return np.mean(cdd_list)
```

---

### 3.2 Financial Feature Engineering

```python
class FinancialFeatureEngineer:
    def __init__(self, eodhd_api_key):
        self.eodhd = EODHDClient(eodhd_api_key)
    
    def extract_features(self, ticker):
        """Extract financial features from EODHD + SEC"""
        # From EODHD
        fundamentals = self.eodhd.get_fundamentals(ticker)
        
        # From SEC EDGAR (free)
        cik = get_cik_from_ticker(ticker)
        sec_data = fetch_sec_facts(cik)
        
        features = {
            # Size
            'market_cap': fundamentals['market_cap'],
            'total_assets': sec_data['assets'],
            'revenue': sec_data['revenues'],
            
            # Profitability
            'net_income': sec_data['net_income'],
            'roe': sec_data['net_income'] / sec_data['stockholders_equity'],
            'debt_to_equity': sec_data['liabilities'] / sec_data['stockholders_equity'],
            
            # Tangible assets (exposed to physical risk)
            'ppe_ratio': sec_data['property_plant_equipment'] / sec_data['total_assets'],
            
            # Sector
            'sector_code': fundamentals['industry'],
        }
        
        return features
```

---

## 4. Model Training Workflows

### 4.1 Distributed Training Setup

```python
# Using Dask for distributed feature engineering
import dask.dataframe as dd
from dask.distributed import Client

client = Client(n_workers=4)

# Parallel feature extraction
def process_batch(tickers):
    results = []
    for ticker in tickers:
        features = extract_features(ticker)
        results.append(features)
    return pd.DataFrame(results)

# Distribute across workers
ticker_batches = np.array_split(all_tickers, 4)
futures = client.map(process_batch, ticker_batches)
results = client.gather(futures)

features_df = pd.concat(results)
```

### 4.2 Model Versioning with MLflow

```python
import mlflow
import mlflow.xgboost

with mlflow.start_run():
    # Log parameters
    mlflow.log_params({
        'model_type': 'xgboost',
        'max_depth': 6,
        'learning_rate': 0.05,
        'n_estimators': 1000
    })
    
    # Train model
    model = xgb.XGBRegressor(**params)
    model.fit(X_train, y_train)
    
    # Log metrics
    mlflow.log_metrics({
        'rmse': rmse,
        'mae': mae,
        'r2': r2
    })
    
    # Log model
    mlflow.xgboost.log_model(model, 'model')
    
    # Log feature importance
    importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    })
    mlflow.log_artifact(importance.to_csv(), 'feature_importance.csv')
```

---

## 5. Cost Optimization Strategies

### 5.1 Data Source Tiers

| Tier | Sources | Cost | Use Case |
|------|---------|------|----------|
| **Core (Paid)** | EODHD, BRSR | $50-200/month | Primary financial + India ESG |
| **Essential (Free)** | Copernicus, SEC, NOAA, USGS | $0 | Climate, hazards, US companies |
| **Supplementary (Free)** | OpenStreetMap, CDP, OpenCorporates | $0 | Geospatial, ESG, company structure |
| **Optional (Low-cost)** | FMP, Alpha Vantage (paid) | $20-50/month | Additional fundamentals |

### 5.2 Caching Strategy

```python
import redis
import hashlib
import pickle

r = redis.Redis(host='localhost', port=6379)

def cached_api_call(func):
    def wrapper(*args, **kwargs):
        # Create cache key
        key = hashlib.md5(
            f"{func.__name__}:{str(args)}:{str(kwargs)}".encode()
        ).hexdigest()
        
        # Check cache
        cached = r.get(key)
        if cached:
            return pickle.loads(cached)
        
        # Call API
        result = func(*args, **kwargs)
        
        # Cache for 24 hours
        r.setex(key, 86400, pickle.dumps(result))
        
        return result
    return wrapper

@cached_api_call
def fetch_copernicus_data(params):
    # Expensive API call
    return cds_client.retrieve(params)
```

### 5.3 Monthly Cost Estimate

| Component | Free Tier | Low-Cost Tier | Enterprise |
|-----------|-----------|---------------|------------|
| **Financial Data** | SEC EDGAR ($0) | EODHD ($19-79) | Bloomberg ($2000+) |
| **Climate Data** | Copernicus ($0) | - | Custom ($500+) |
| **Hazard Data** | USGS/NOAA ($0) | - | RMS/AIR ($1000+) |
| **ESG Data** | CDP ($0) | FMP ESG ($22) | MSCI ($5000+) |
| **Geospatial** | OSM ($0) | Mapbox ($50) | Google Maps ($500+) |
| **Total/Month** | **$0** | **$100-200** | **$10,000+** |

---

## Appendices

### Appendix A: Complete Python Requirements

```txt
# Core
pandas==2.0.3
numpy==1.24.3
scipy==1.11.1

# ML
xgboost==2.0.0
lightgbm==4.1.0
scikit-learn==1.3.0
torch==2.0.1
torch-geometric==2.3.1
pytorch-forecasting==1.0.0
neuralforecast==1.6.0

# Geospatial
geopandas==0.13.2
osmnx==1.6.0
rasterio==1.3.8
xarray==2023.6.0

# Climate
cdsapi==0.6.1
netcdf4==1.6.4

# Financial
yfinance==0.2.28
alpha-vantage==2.3.1
fredapi==0.5.1
sec-api==1.0.0

# Data
requests==2.31.0
redis==4.6.0

# MLOps
mlflow==2.7.1
```

---

*End of Document*
