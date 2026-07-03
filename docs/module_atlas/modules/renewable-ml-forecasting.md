# ML Forecasting & Risk Engine
**Module ID:** `renewable-ml-forecasting` · **Route:** `/renewable-ml-forecasting` · **Tier:** B (frontend-computed) · **EP code:** RE-ML1 · **Sprint:** RE

## 1 · Overview
Quantitative machine learning and probabilistic forecasting engine for renewable energy portfolio risk management. Implements Monte Carlo (Box-Muller), Bayesian Normal-Normal conjugate updating, OLS factor regression with seasonality, 3-state HMM ENSO climate regime detection (La Niña / Neutral / El Niño), portfolio VaR, ensemble forecasting, and long-range stress scenarios across 18 analytical tabs.

> **Business value:** Designed for RE portfolio managers, quantitative risk analysts at infrastructure funds, and independent engineers needing probabilistic yield forecasting beyond deterministic P50 models. Provides the full probabilistic toolkit — Monte Carlo, Bayesian updating, OLS factor models, and ENSO regime detection — in a unified engine that replaces fragmented Python scripts and Excel Monte Carlo add-ins used in RE investment risk management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `KpiCard`, `MONTHS_SHORT`, `SecHdr`, `SectionTitle`, `SelectBtn`, `Slider`, `Tab01MonteCarlo`, `Tab02Bayesian`, `Tab03OLS`, `Tab04HMM`, `Tab05ForecastActual`, `Tab06ModelComparison`, `Tab07PortfolioVaR`, `Tab08StressTesting`, `Tab09Seasonality`, `Tab10Degradation`, `Tab11Ensemble`, `Tab12FeatureImportance`, `Tab13CrossValidation`, `Tab14RevenueForecast`, `Tab15UncertaintyDecomp`, `Tab16LongRange`, `Tab17Backtesting`, `Tab18LiveAPI`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sorted` | `[...results].sort((a, b) => a - b);` |
| `mean` | `results.reduce((s, v) => s + v, 0) / Math.max(1, nRuns);` |
| `variance` | `results.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(1, nRuns);` |
| `priorSigma` | `priorMean * priorSigmaFrac / 100;` |
| `obsSigma` | `priorMean * obsSigmaFrac / 100;` |
| `priorVar` | `priorSigma * priorSigma;` |
| `obsVar` | `obsSigma * obsSigma;` |
| `posteriorVar` | `1 / (1 / priorVar + n / obsVar);` |
| `posteriorMean` | `posteriorVar * (priorMean / priorVar + n * obsMean / obsVar);` |
| `xMean` | `X.reduce((s, v) => s + v, 0) / n;` |
| `yMean` | `y.reduce((s, v) => s + v, 0) / n;` |
| `ssXX` | `X.reduce((s, x) => s + Math.pow(x - xMean, 2), 0);` |
| `ssXY` | `X.reduce((s, x, i) => s + (x - xMean) * (y[i] - yMean), 0);` |
| `beta1` | `ssXX > 0 ? ssXY / ssXX : 0;` |
| `beta0` | `yMean - beta1 * xMean;` |
| `yHat` | `X.map(x => beta0 + beta1 * x);` |
| `residuals` | `y.map((v, i) => v - yHat[i]);` |
| `ssRes` | `residuals.reduce((s, v) => s + v * v, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MONTHS_SHORT`, `SCENARIOS`, `SCENARIO_COLORS`, `STATE_COLORS`, `STATE_LABELS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Monte Carlo P90 | `Box-Muller combined σ across 6 uncertainty sources` | Engineering assessment | P90 10-year exceedance (divide σ by √10 for multi-year); used for lender base case; combines resource, technic |
| Bayesian Posterior Mean | `μ₁ = σ₁²(μ₀/σ₀² + Σxᵢ/σ²)` | Bayesian update model | Posterior shrinks toward observed data as number of observations grows; prior dominates with few observations; |
| OLS R² (GHI factor) | `SSExplained / SSTotal = 1 − SSRes/SSTotal` | OLS regression | How much generation variance is explained by irradiance alone; high R² indicates good resource tracking; low R |
| HMM Regime Probability | `Forward-backward algorithm; Viterbi for state sequence` | ENSO forecast (IRI, BOM) | La Niña → lower solar irradiance in tropical Americas + Australia; El Niño → higher irradiance in same zones;  |
| Portfolio VaR (95%) | `σ_port = √(wᵀΣw); VaR = σ_port × 1.645 × Revenue` | Variance-covariance | Revenue at risk at 95% confidence; benefit of diversification measured by VaR reduction vs sum-of-individual V |
| Ensemble Forecast MAPE | `Σ|actual − forecast|/|actual| / n × 100` | Backtesting model | Mean absolute percentage error; ensemble typically outperforms any individual model by 10–25% on MAPE; weighte |
| Degradation Trajectory | `Arrhenius calendar aging bands (P10/P50/P90)` | Manufacturer + NREL | 25-year production forecast with Arrhenius uncertainty bands; P10 degradation (pessimistic) used for lender DC |
- **Portfolio technical specs (P50 GWh, capacity MW, technology mix)** → Monte Carlo Box-Muller × 1,000 runs with 6 uncertainty σ inputs → **P10/P50/P90/P99 generation distribution, VaR, exceedance curve**
- **12 months of observed production data (user input)** → Bayesian Normal-Normal conjugate update → **Posterior mean and σ, shrinkage toward data vs prior, updated P50/P90**
- **ENSO regime probability (IRI/BOM seasonal outlook)** → HMM 3-state transition matrix + Viterbi decoding → **Regime-adjusted P50, probability of La Niña/Neutral/El Niño persistence, generation adjustment factor**

## 5 · Intermediate Transformation Logic
**Methodology:** Bayesian Conjugate Update + HMM Viterbi + Box-Muller Monte Carlo
**Headline formula:** `μ₁ = σ₁²(μ₀/σ₀² + Σxᵢ/σ²); σ₁² = 1/(1/σ₀² + n/σ²); VaR₉₅ = σ_port × 1.645 × Revenue`
**Standards:** ['IPCC AR5 WG1 Ch.14 — ENSO', 'IEA Solar Resource Forecasting', 'AEMO Probabilistic Forecasting Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`