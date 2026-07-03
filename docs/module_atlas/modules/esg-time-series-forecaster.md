# ESG Time Series Forecaster
**Module ID:** `esg-time-series-forecaster` · **Route:** `/esg-time-series-forecaster` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Applies machine learning and statistical time series models to forecast ESG KPI trajectories at company, sector, and portfolio levels over 1â€“10 year horizons. Combines autoregressive, gradient boosting, and neural network models with macro-climate scenario inputs to generate probabilistic ESG forecast distributions. Supports target-setting, portfolio decarbonisation pathway management, and regulatory forward-looking disclosure requirements.

> **Business value:** Enables ESG analysts and portfolio managers to move beyond backward-looking ESG data to forward-looking trajectory management, supporting target-setting credibility assessments, proactive engagement with laggard issuers, and TCFD/IFRS S2 forward-looking metrics requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_YEARS`, `Badge`, `COMPANIES`, `EVENTS`, `HIST_YEARS`, `KpiCard`, `METRICS`, `METRIC_KEYS`, `Section`, `Sel`, `StatRow`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `HIST_YEARS` | `Array.from({length:10},(_,i)=>2015+i);` |
| `ALL_YEARS` | `Array.from({length:21},(_,i)=>2015+i);` |
| `EVENTS` | `[{year:2015,label:'Paris Agreement'},{year:2020,label:'COVID-19'},{year:2022,label:'EU Taxonomy'},{year:2023,label:'CSRD'}];` |
| `trend` | `(data[data.length-1]-data[0])/(data.length-1);` |
| `trend` | `(data[data.length-1]-data[0])/(data.length-1);` |
| `val` | `level+dampedTrend*h*(1-gamma*h*0.01);` |
| `last` | `data[data.length-1];` |
| `mean` | `data.reduce((a,b)=>a+b,0)/data.length;` |
| `noiseScale` | `(Math.max(...data)-Math.min(...data))*0.05;` |
| `noise` | `(sr(seed*1000+h)-0.5)*noiseScale;` |
| `slope` | `xs.reduce((s,x,i)=>s+(x-mx)*(data[i]-my),0)/xs.reduce((s,x)=>s+(x-mx)**2,0);` |
| `intercept` | `my-slope*mx;` |
| `resids` | `data.map((d,i)=>d-(fitted[i]\|\|d));` |
| `mean` | `resids.reduce((a,b)=>a+b,0)/resids.length;` |
| `frac` | `(y-currentYear)/(netZeroYear-currentYear);` |
| `seed` | `ci*13+mi*7;` |
| `baseVal` | `lo+(hi-lo)*sr(seed);` |
| `trendFactor` | `meta.direction==='higher_better'?0.015:-0.018;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `EVENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forecast Accuracy (MAPE %) | — | Backtested Model | Mean absolute percentage error on holdout set; below 15% MAPE indicates reliable 3-year forecast horizon. |
| KPI Trend (annual % change) | — | Model Output | Expected year-on-year KPI change under base scenario; negative trend for carbon intensity indicates decarbonis |
| Target Attainment Probability (%) | — | Monte Carlo Simulation | Probability that forecast trajectory meets committed ESG target by target year; below 50% triggers target revi |
| Forecast Uncertainty Band (P10–P90) | — | Quantile Regression | Interquartile range of KPI forecast at each horizon year; wide bands indicate high uncertainty requiring scena |
- **Company ESG KPI history (CDP, Bloomberg, Refinitiv)** → Clean and align annual time series; impute missing values using sector median interpolation → **ESG KPI time series at company level (5â€“10 year history)**
- **NGFS macro-climate scenario outputs (carbon price, energy price, GDP)** → Align scenario variables to company sector and geography; create forecast feature matrix → **Macro-conditioned feature set for XGBoost model**
- **SBTi target registry and internal target commitments** → Map target year and absolute/intensity metric to forecast output; compute attainment probability → **Target attainment probability and gap-to-target under each scenario**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Forecast Model
**Headline formula:** `KPI_t = f(KPI_{t-1}, ..., KPI_{t-p}, X_macro, ε_t)`
**Standards:** ['ARIMA/Prophet Framework', 'XGBoost Time Series', 'NGFS Macro Scenarios']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).