# Technical Implementation Guide: Multi-Scenario Integration
## Mathematical Framework and Computational Methods

---

**Document Classification:** Technical Implementation Guide  
**Version:** 1.0  
**Date:** April 2026  
**Prepared by:** AA Impact Inc. Quantitative Research Team  

---

## Table of Contents

1. [Mathematical Framework for Scenario Ensemble](#1-mathematical-framework-for-scenario-ensemble)
2. [Bayesian Model Averaging](#2-bayesian-model-averaging)
3. [Scenario Weighting Methodologies](#3-scenario-weighting-methodologies)
4. [Variable Harmonization](#4-variable-harmonization)
5. [Uncertainty Quantification](#5-uncertainty-quantification)
6. [Implementation Code](#6-implementation-code)
7. [Validation Framework](#7-validation-framework)

---

## 1. Mathematical Framework for Scenario Ensemble

### 1.1 Ensemble Definition

Given $n$ scenarios from different providers, the ensemble prediction for variable $Y$ at time $t$ is:

$$\hat{Y}_t^{ensemble} = \sum_{i=1}^{n} w_i \cdot \hat{Y}_{i,t}$$

Where:
- $w_i$ = weight for scenario $i$
- $\hat{Y}_{i,t}$ = prediction from scenario $i$ at time $t$
- $\sum_{i=1}^{n} w_i = 1$

### 1.2 Ensemble Variance Decomposition

The total uncertainty in the ensemble is:

$$\text{Var}(\hat{Y}_t^{ensemble}) = \underbrace{\sum_{i=1}^{n} w_i^2 \cdot \sigma_i^2}_{\text{Internal Uncertainty}} + \underbrace{\sum_{i=1}^{n} w_i (\hat{Y}_{i,t} - \hat{Y}_t^{ensemble})^2}_{\text{Between-Scenario Uncertainty}}$$

### 1.3 Temperature-Conditional Ensemble

For a target temperature $T^*$, the conditional ensemble is:

$$\hat{Y}_t^{ensemble}|T^* = \sum_{i=1}^{n} w_i(T^*) \cdot \hat{Y}_{i,t}$$

Where weights depend on scenario temperature alignment:

$$w_i(T^*) = \frac{\exp\left(-\frac{(T_i - T^*)^2}{2\sigma_T^2}\right)}{\sum_{j=1}^{n} \exp\left(-\frac{(T_j - T^*)^2}{2\sigma_T^2}\right)}$$

---

## 2. Bayesian Model Averaging

### 2.1 BMA Framework

The posterior distribution of variable $Y$ given data $D$:

$$P(Y|D) = \sum_{i=1}^{n} P(Y|M_i, D) \cdot P(M_i|D)$$

Where:
- $P(Y|M_i, D)$ = posterior given model $i$
- $P(M_i|D)$ = posterior model probability

### 2.2 Posterior Model Probability

$$P(M_i|D) = \frac{P(D|M_i) \cdot P(M_i)}{\sum_{j=1}^{n} P(D|M_j) \cdot P(M_j)}$$

### 2.3 Marginal Likelihood (BIC Approximation)

$$\ln P(D|M_i) \approx \ln \hat{L}_i - \frac{k_i}{2} \ln(n)$$

Where:
- $\hat{L}_i$ = maximum likelihood
- $k_i$ = number of parameters
- $n$ = sample size

### 2.4 Model Weights from Information Criteria

$$w_i^{BIC} = \frac{\exp(-\frac{1}{2} \Delta BIC_i)}{\sum_{j=1}^{n} \exp(-\frac{1}{2} \Delta BIC_j)}$$

Where $\Delta BIC_i = BIC_i - BIC_{min}$

---

## 3. Scenario Weighting Methodologies

### 3.1 Equal Weighting

$$w_i^{equal} = \frac{1}{n}$$

### 3.2 Temperature-Based Weighting

$$w_i^{temp} = \frac{\exp(-\lambda |T_i - T^*|)}{\sum_{j=1}^{n} \exp(-\lambda |T_j - T^*|)}$$

Where $\lambda$ = temperature sensitivity parameter

### 3.3 Performance-Based Weighting

$$w_i^{perf} = \frac{\exp(-\gamma \cdot RMSE_i)}{\sum_{j=1}^{n} \exp(-\gamma \cdot RMSE_j)}$$

Where:
- $RMSE_i$ = root mean squared error for scenario $i$
- $\gamma$ = performance sensitivity parameter

### 3.4 Expert Elicitation Weighting

$$w_i^{expert} = \frac{1}{K} \sum_{k=1}^{K} e_{i,k}$$

Where $e_{i,k}$ = expert $k$'s weight for scenario $i$

### 3.5 Composite Weighting

$$w_i^{composite} = \prod_{m=1}^{M} (w_i^m)^{\alpha_m}$$

Normalized:

$$w_i = \frac{w_i^{composite}}{\sum_{j=1}^{n} w_j^{composite}}$$

Where:
- $m$ = weighting method index
- $\alpha_m$ = importance weight for method $m$

---

## 4. Variable Harmonization

### 4.1 Unit Conversion Matrix

| From Unit | To Unit | Conversion Factor |
|-----------|---------|-------------------|
| Mt CO₂ | Gt CO₂ | 0.001 |
| EJ | TWh | 277.778 |
| USD/bbl | USD/GJ | 0.163 |
| USD/MMBtu | USD/GJ | 1.055 |
| GW | TW | 0.001 |

### 4.2 Temporal Interpolation

For harmonizing different time steps:

$$Y_t = Y_{t_1} + \frac{t - t_1}{t_2 - t_1} (Y_{t_2} - Y_{t_1})$$

For annual data from decadal:

$$Y_t = Y_{decade} \cdot \left(\frac{Y_{next}}{Y_{current}}\right)^{\frac{t - t_1}{10}}$$

### 4.3 Spatial Aggregation

For regional to global aggregation:

$$Y_{global} = \sum_{r=1}^{R} w_r \cdot Y_r$$

Where $w_r$ = economic weight of region $r$

### 4.4 Sectoral Aggregation

$$Y_{total} = \sum_{s=1}^{S} \alpha_s \cdot Y_s$$

Where $\alpha_s$ = output share of sector $s$

---

## 5. Uncertainty Quantification

### 5.1 Prediction Intervals

$$CI_{1-\alpha} = \left[\hat{Y} - z_{\alpha/2} \cdot \sigma_{\hat{Y}}, \hat{Y} + z_{\alpha/2} \cdot \sigma_{\hat{Y}}\right]$$

### 5.2 Monte Carlo Ensemble

Generate $N$ samples:

$$Y^{(j)} = \sum_{i=1}^{n} w_i \cdot (\hat{Y}_i + \epsilon_i^{(j)})$$

Where $\epsilon_i^{(j)} \sim \mathcal{N}(0, \sigma_i^2)$

### 5.3 Bootstrap Confidence Intervals

1. Resample scenarios with replacement $B$ times
2. Calculate ensemble for each bootstrap sample
3. Compute percentiles of bootstrap distribution

$$CI_{1-\alpha}^{boot} = \left[Y_{(\alpha/2 \cdot B)}^*, Y_{((1-\alpha/2) \cdot B)}^*\right]$$

---

## 6. Implementation Code

### 6.1 Core Ensemble Class

```python
import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, List, Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScenarioEnsemble:
    """
    Multi-scenario ensemble framework for climate risk analysis
    """
    
    def __init__(self, scenarios: Dict[str, pd.DataFrame]):
        """
        Initialize ensemble with scenario data
        
        Parameters:
        -----------
        scenarios : dict
            Dictionary mapping scenario names to DataFrames
            Each DataFrame should have columns: ['year', 'variable', 'value', 'lower', 'upper']
        """
        self.scenarios = scenarios
        self.n_scenarios = len(scenarios)
        self.weights = None
        self.ensemble_results = None
        
        logger.info(f"Initialized ensemble with {self.n_scenarios} scenarios")
    
    def calculate_equal_weights(self) -> np.ndarray:
        """Calculate equal weights for all scenarios"""
        return np.ones(self.n_scenarios) / self.n_scenarios
    
    def calculate_temperature_weights(
        self, 
        scenario_temperatures: Dict[str, float],
        target_temperature: float,
        sigma: float = 0.5
    ) -> np.ndarray:
        """
        Calculate temperature-based weights using Gaussian kernel
        
        Parameters:
        -----------
        scenario_temperatures : dict
            Mapping of scenario names to temperature outcomes
        target_temperature : float
            Target temperature (e.g., 1.5, 2.0)
        sigma : float
            Temperature sensitivity parameter
        
        Returns:
        --------
        weights : np.ndarray
            Normalized weights summing to 1
        """
        temps = np.array([scenario_temperatures[s] for s in self.scenarios.keys()])
        raw_weights = np.exp(-((temps - target_temperature)**2) / (2 * sigma**2))
        weights = raw_weights / raw_weights.sum()
        
        logger.info(f"Temperature weights for {target_temperature}°C: {dict(zip(self.scenarios.keys(), weights))}")
        
        return weights
    
    def calculate_bma_weights(
        self,
        historical_data: pd.DataFrame,
        variables: List[str]
    ) -> np.ndarray:
        """
        Calculate Bayesian Model Averaging weights
        
        Parameters:
        -----------
        historical_data : pd.DataFrame
            Historical observations for validation
        variables : list
            List of variables to use for weight calculation
        
        Returns:
        --------
        weights : np.ndarray
            BMA weights
        """
        bics = []
        
        for scenario_name, scenario_df in self.scenarios.items():
            # Calculate RMSE for each variable
            rmse_total = 0
            for var in variables:
                if var in scenario_df.columns and var in historical_data.columns:
                    merged = pd.merge(
                        scenario_df[['year', var]],
                        historical_data[['year', var]],
                        on='year',
                        suffixes=('_scenario', '_actual')
                    )
                    if len(merged) > 0:
                        rmse = np.sqrt(np.mean((merged[f'{var}_scenario'] - merged[f'{var}_actual'])**2))
                        rmse_total += rmse
            
            # Approximate BIC (simplified)
            n = len(historical_data)
            k = len(variables)  # number of parameters
            bic = n * np.log(rmse_total + 1e-10) + k * np.log(n)
            bics.append(bic)
        
        bics = np.array(bics)
        delta_bics = bics - bics.min()
        weights = np.exp(-0.5 * delta_bics)
        weights = weights / weights.sum()
        
        logger.info(f"BMA weights: {dict(zip(self.scenarios.keys(), weights))}")
        
        return weights
    
    def calculate_composite_weights(
        self,
        weight_methods: Dict[str, Dict],
        method_importance: Optional[Dict[str, float]] = None
    ) -> np.ndarray:
        """
        Calculate composite weights from multiple methods
        
        Parameters:
        -----------
        weight_methods : dict
            Dictionary mapping method names to their parameters
        method_importance : dict
            Importance weights for each method (default: equal)
        
        Returns:
        --------
        weights : np.ndarray
            Composite weights
        """
        if method_importance is None:
            method_importance = {m: 1.0 for m in weight_methods.keys()}
        
        all_weights = []
        
        for method, params in weight_methods.items():
            if method == 'equal':
                w = self.calculate_equal_weights()
            elif method == 'temperature':
                w = self.calculate_temperature_weights(**params)
            elif method == 'bma':
                w = self.calculate_bma_weights(**params)
            else:
                raise ValueError(f"Unknown method: {method}")
            
            all_weights.append(w ** method_importance[method])
        
        # Combine weights (geometric mean)
        composite = np.prod(all_weights, axis=0)
        weights = composite / composite.sum()
        
        return weights
    
    def generate_ensemble(
        self,
        variables: List[str],
        years: List[int],
        weights: Optional[np.ndarray] = None,
        confidence_level: float = 0.95
    ) -> pd.DataFrame:
        """
        Generate ensemble projections
        
        Parameters:
        -----------
        variables : list
            Variables to include in ensemble
        years : list
            Years to project
        weights : np.ndarray
            Scenario weights (default: equal)
        confidence_level : float
            Confidence level for intervals
        
        Returns:
        --------
        ensemble_df : pd.DataFrame
            Ensemble projections with confidence intervals
        """
        if weights is None:
            weights = self.calculate_equal_weights()
        
        self.weights = weights
        
        results = []
        
        for var in variables:
            for year in years:
                values = []
                variances = []
                
                for scenario_name, scenario_df in self.scenarios.items():
                    scenario_data = scenario_df[
                        (scenario_df['year'] == year) & 
                        (scenario_df['variable'] == var)
                    ]
                    
                    if len(scenario_data) > 0:
                        values.append(scenario_data['value'].values[0])
                        # Use confidence interval width as variance proxy
                        lower = scenario_data['lower'].values[0]
                        upper = scenario_data['upper'].values[0]
                        variance = ((upper - lower) / (2 * 1.96)) ** 2
                        variances.append(variance)
                    else:
                        # Interpolate if exact year not available
                        var_data = scenario_df[scenario_df['variable'] == var].sort_values('year')
                        if len(var_data) > 1:
                            interpolated = np.interp(
                                year,
                                var_data['year'],
                                var_data['value']
                            )
                            values.append(interpolated)
                            variances.append(np.var(var_data['value']))
                
                if len(values) > 0:
                    values = np.array(values)
                    variances = np.array(variances)
                    
                    # Weighted mean
                    ensemble_mean = np.sum(weights * values)
                    
                    # Weighted variance (internal + between)
                    internal_var = np.sum(weights**2 * variances)
                    between_var = np.sum(weights * (values - ensemble_mean)**2)
                    total_var = internal_var + between_var
                    
                    # Confidence interval
                    z_score = stats.norm.ppf((1 + confidence_level) / 2)
                    margin = z_score * np.sqrt(total_var)
                    
                    results.append({
                        'variable': var,
                        'year': year,
                        'ensemble_mean': ensemble_mean,
                        'ensemble_lower': ensemble_mean - margin,
                        'ensemble_upper': ensemble_mean + margin,
                        'internal_uncertainty': np.sqrt(internal_var),
                        'between_uncertainty': np.sqrt(between_var),
                        'n_scenarios': len(values)
                    })
        
        self.ensemble_results = pd.DataFrame(results)
        return self.ensemble_results
    
    def monte_carlo_simulation(
        self,
        variables: List[str],
        years: List[int],
        n_simulations: int = 10000,
        weights: Optional[np.ndarray] = None
    ) -> Dict[str, np.ndarray]:
        """
        Run Monte Carlo simulation for uncertainty quantification
        
        Parameters:
        -----------
        variables : list
            Variables to simulate
        years : list
            Years to simulate
        n_simulations : int
            Number of Monte Carlo draws
        weights : np.ndarray
            Scenario weights
        
        Returns:
        --------
        mc_results : dict
            Dictionary with simulation results for each variable-year
        """
        if weights is None:
            weights = self.calculate_equal_weights()
        
        mc_results = {}
        
        for var in variables:
            for year in years:
                values = []
                stds = []
                
                for scenario_name, scenario_df in self.scenarios.items():
                    scenario_data = scenario_df[
                        (scenario_df['year'] == year) & 
                        (scenario_df['variable'] == var)
                    ]
                    
                    if len(scenario_data) > 0:
                        values.append(scenario_data['value'].values[0])
                        lower = scenario_data['lower'].values[0]
                        upper = scenario_data['upper'].values[0]
                        stds.append((upper - lower) / (2 * 1.96))
                
                if len(values) > 0:
                    values = np.array(values)
                    stds = np.array(stds)
                    
                    # Monte Carlo draws
                    simulations = np.zeros(n_simulations)
                    for i in range(n_simulations):
                        # Sample scenario according to weights
                        scenario_idx = np.random.choice(len(values), p=weights)
                        # Add noise based on scenario uncertainty
                        simulations[i] = np.random.normal(
                            values[scenario_idx],
                            stds[scenario_idx]
                        )
                    
                    mc_results[f"{var}_{year}"] = simulations
        
        return mc_results
    
    def calculate_risk_metrics(
        self,
        portfolio_values: pd.DataFrame,
        variables: List[str],
        years: List[int],
        confidence_levels: List[float] = [0.95, 0.99]
    ) -> pd.DataFrame:
        """
        Calculate climate risk metrics for portfolio
        
        Parameters:
        -----------
        portfolio_values : pd.DataFrame
            Portfolio values under different scenarios
        variables : list
            Risk variables
        years : list
            Time horizons
        confidence_levels : list
            Confidence levels for VaR/CVaR
        
        Returns:
        --------
        risk_metrics : pd.DataFrame
            Risk metrics by variable and year
        """
        metrics = []
        
        mc_results = self.monte_carlo_simulation(variables, years)
        
        for var in variables:
            for year in years:
                simulations = mc_results.get(f"{var}_{year}", np.array([]))
                
                if len(simulations) > 0:
                    for cl in confidence_levels:
                        alpha = 1 - cl
                        
                        # VaR
                        var = np.percentile(simulations, alpha * 100)
                        
                        # CVaR (Expected Shortfall)
                        cvar = simulations[simulations <= var].mean()
                        
                        metrics.append({
                            'variable': var,
                            'year': year,
                            'confidence_level': cl,
                            'VaR': var,
                            'CVaR': cvar,
                            'mean': simulations.mean(),
                            'std': simulations.std(),
                            'skewness': stats.skew(simulations),
                            'kurtosis': stats.kurtosis(simulations)
                        })
        
        return pd.DataFrame(metrics)


class VariableHarmonizer:
    """
    Harmonize variables across different scenario providers
    """
    
    # Unit conversion factors
    CONVERSION_FACTORS = {
        ('Mt CO2', 'Gt CO2'): 0.001,
        ('Gt CO2', 'Mt CO2'): 1000,
        ('EJ', 'TWh'): 277.778,
        ('TWh', 'EJ'): 0.0036,
        ('USD/bbl', 'USD/GJ'): 0.163,
        ('USD/MMBtu', 'USD/GJ'): 1.055,
        ('GW', 'TW'): 0.001,
        ('TW', 'GW'): 1000,
        ('billion USD', 'trillion USD'): 0.001,
        ('trillion USD', 'billion USD'): 1000
    }
    
    # Variable name mappings
    VARIABLE_MAPPINGS = {
        'NGFS': {
            'gdp': 'GDP',
            'population': 'Population',
            'co2_emissions': 'CO2 Emissions',
            'carbon_price': 'Carbon Price',
            'primary_energy': 'Primary Energy Demand',
            'renewable_capacity': 'Renewable Capacity'
        },
        'IEA': {
            'GDP': 'GDP',
            'Population': 'Population',
            'CO2': 'CO2 Emissions',
            'CarbonPrice': 'Carbon Price',
            'TPED': 'Primary Energy Demand',
            'Renewables': 'Renewable Capacity'
        },
        'IPCC': {
            'GDP|PPP': 'GDP',
            'Population': 'Population',
            'Emissions|CO2': 'CO2 Emissions',
            'Price|Carbon': 'Carbon Price',
            'PE': 'Primary Energy Demand'
        },
        'IRENA': {
            'gdp': 'GDP',
            'population': 'Population',
            'co2_emissions': 'CO2 Emissions',
            'total_primary_energy': 'Primary Energy Demand',
            'renewable_power_capacity': 'Renewable Capacity'
        }
    }
    
    def __init__(self):
        logger.info("Initialized Variable Harmonizer")
    
    def convert_units(
        self,
        values: np.ndarray,
        from_unit: str,
        to_unit: str
    ) -> np.ndarray:
        """Convert values between units"""
        if from_unit == to_unit:
            return values
        
        key = (from_unit, to_unit)
        if key in self.CONVERSION_FACTORS:
            return values * self.CONVERSION_FACTORS[key]
        else:
            raise ValueError(f"Conversion from {from_unit} to {to_unit} not defined")
    
    def harmonize_variable_names(
        self,
        df: pd.DataFrame,
        provider: str,
        target_names: List[str]
    ) -> pd.DataFrame:
        """
        Harmonize variable names to common standard
        
        Parameters:
        -----------
        df : pd.DataFrame
            Input data with provider-specific variable names
        provider : str
            Provider name ('NGFS', 'IEA', 'IPCC', 'IRENA')
        target_names : list
            List of target variable names
        
        Returns:
        --------
        harmonized_df : pd.DataFrame
            DataFrame with harmonized variable names
        """
        mapping = self.VARIABLE_MAPPINGS.get(provider, {})
        
        # Create reverse mapping
        reverse_mapping = {v: k for k, v in mapping.items()}
        
        # Rename columns
        df_harmonized = df.copy()
        for target_name in target_names:
            if target_name in reverse_mapping:
                source_name = reverse_mapping[target_name]
                if source_name in df_harmonized.columns:
                    df_harmonized[target_name] = df_harmonized[source_name]
        
        return df_harmonized
    
    def interpolate_years(
        self,
        df: pd.DataFrame,
        year_col: str = 'year',
        value_col: str = 'value',
        target_years: List[int] = None
    ) -> pd.DataFrame:
        """
        Interpolate values for missing years
        
        Parameters:
        -----------
        df : pd.DataFrame
            Input data
        year_col : str
            Column name for years
        value_col : str
            Column name for values
        target_years : list
            Target years to interpolate (default: all years between min and max)
        
        Returns:
        --------
        interpolated_df : pd.DataFrame
            DataFrame with interpolated values
        """
        if target_years is None:
            target_years = list(range(df[year_col].min(), df[year_col].max() + 1))
        
        interpolated = []
        for var in df['variable'].unique():
            var_data = df[df['variable'] == var].sort_values(year_col)
            
            for year in target_years:
                if year in var_data[year_col].values:
                    value = var_data[var_data[year_col] == year][value_col].values[0]
                else:
                    # Interpolate
                    value = np.interp(
                        year,
                        var_data[year_col],
                        var_data[value_col]
                    )
                
                interpolated.append({
                    'variable': var,
                    year_col: year,
                    value_col: value
                })
        
        return pd.DataFrame(interpolated)


class ScenarioComparator:
    """
    Compare and validate scenarios across providers
    """
    
    def __init__(self, scenarios: Dict[str, pd.DataFrame]):
        self.scenarios = scenarios
        logger.info("Initialized Scenario Comparator")
    
    def calculate_divergence_metrics(
        self,
        variable: str,
        year: int
    ) -> Dict[str, float]:
        """
        Calculate divergence metrics for a variable at a given year
        
        Returns:
        --------
        metrics : dict
            Dictionary with divergence metrics
        """
        values = []
        
        for scenario_name, scenario_df in self.scenarios.items():
            data = scenario_df[
                (scenario_df['variable'] == variable) & 
                (scenario_df['year'] == year)
            ]
            
            if len(data) > 0:
                values.append(data['value'].values[0])
        
        if len(values) < 2:
            return {'error': 'Insufficient data'}
        
        values = np.array(values)
        
        metrics = {
            'mean': values.mean(),
            'std': values.std(),
            'cv': values.std() / values.mean() if values.mean() != 0 else np.inf,
            'range': values.max() - values.min(),
            'min': values.min(),
            'max': values.max(),
            'iqr': np.percentile(values, 75) - np.percentile(values, 25)
        }
        
        return metrics
    
    def identify_outliers(
        self,
        variable: str,
        year: int,
        threshold: float = 2.0
    ) -> List[str]:
        """
        Identify outlier scenarios using Z-score
        
        Parameters:
        -----------
        variable : str
            Variable to check
        year : int
            Year to check
        threshold : float
            Z-score threshold for outlier detection
        
        Returns:
        --------
        outliers : list
            List of outlier scenario names
        """
        values = []
        names = []
        
        for scenario_name, scenario_df in self.scenarios.items():
            data = scenario_df[
                (scenario_df['variable'] == variable) & 
                (scenario_df['year'] == year)
            ]
            
            if len(data) > 0:
                values.append(data['value'].values[0])
                names.append(scenario_name)
        
        values = np.array(values)
        z_scores = np.abs(stats.zscore(values))
        
        outliers = [names[i] for i in range(len(names)) if z_scores[i] > threshold]
        
        return outliers
    
    def generate_comparison_report(
        self,
        variables: List[str],
        years: List[int]
    ) -> pd.DataFrame:
        """
        Generate comprehensive comparison report
        
        Parameters:
        -----------
        variables : list
            Variables to compare
        years : list
            Years to compare
        
        Returns:
        --------
        report : pd.DataFrame
            Comparison report
        """
        report_rows = []
        
        for var in variables:
            for year in years:
                metrics = self.calculate_divergence_metrics(var, year)
                outliers = self.identify_outliers(var, year)
                
                report_rows.append({
                    'variable': var,
                    'year': year,
                    **metrics,
                    'outliers': ', '.join(outliers) if outliers else 'None'
                })
        
        return pd.DataFrame(report_rows)


# Example usage
if __name__ == "__main__":
    # Create sample scenario data
    years = list(range(2025, 2051))
    
    ngfs_nz2050 = pd.DataFrame({
        'year': years,
        'variable': ['CO2 Emissions'] * len(years),
        'value': [37.4 * (0.95 ** (y - 2023)) for y in years],
        'lower': [37.4 * (0.93 ** (y - 2023)) for y in years],
        'upper': [37.4 * (0.97 ** (y - 2023)) for y in years]
    })
    
    iea_nze = pd.DataFrame({
        'year': years,
        'variable': ['CO2 Emissions'] * len(years),
        'value': [37.4 * (0.94 ** (y - 2023)) for y in years],
        'lower': [37.4 * (0.92 ** (y - 2023)) for y in years],
        'upper': [37.4 * (0.96 ** (y - 2023)) for y in years]
    })
    
    ipcc_c1 = pd.DataFrame({
        'year': years,
        'variable': ['CO2 Emissions'] * len(years),
        'value': [37.4 * (0.93 ** (y - 2023)) for y in years],
        'lower': [37.4 * (0.91 ** (y - 2023)) for y in years],
        'upper': [37.4 * (0.95 ** (y - 2023)) for y in years]
    })
    
    scenarios = {
        'NGFS NZ2050': ngfs_nz2050,
        'IEA NZE': iea_nze,
        'IPCC C1': ipcc_c1
    }
    
    # Initialize ensemble
    ensemble = ScenarioEnsemble(scenarios)
    
    # Calculate temperature weights for 1.5°C target
    scenario_temps = {
        'NGFS NZ2050': 1.5,
        'IEA NZE': 1.5,
        'IPCC C1': 1.5
    }
    weights = ensemble.calculate_temperature_weights(scenario_temps, 1.5)
    
    # Generate ensemble
    results = ensemble.generate_ensemble(
        variables=['CO2 Emissions'],
        years=[2030, 2040, 2050],
        weights=weights
    )
    
    print("Ensemble Results:")
    print(results)
    
    # Monte Carlo simulation
    mc_results = ensemble.monte_carlo_simulation(
        variables=['CO2 Emissions'],
        years=[2050],
        n_simulations=10000
    )
    
    print("\nMonte Carlo Results for 2050 CO2 Emissions:")
    print(f"Mean: {mc_results['CO2 Emissions_2050'].mean():.2f} Gt")
    print(f"Std: {mc_results['CO2 Emissions_2050'].std():.2f} Gt")
    print(f"5th percentile: {np.percentile(mc_results['CO2 Emissions_2050'], 5):.2f} Gt")
    print(f"95th percentile: {np.percentile(mc_results['CO2 Emissions_2050'], 95):.2f} Gt")
```

---

## 7. Validation Framework

### 7.1 Backtesting Methodology

```python
def backtest_scenarios(
    scenario_projections: pd.DataFrame,
    historical_data: pd.DataFrame,
    variables: List[str],
    test_years: List[int]
) -> pd.DataFrame:
    """
    Backtest scenario projections against historical data
    
    Parameters:
    -----------
    scenario_projections : pd.DataFrame
        Scenario projections
    historical_data : pd.DataFrame
        Actual historical observations
    variables : list
        Variables to test
    test_years : list
        Years to include in backtest
    
    Returns:
    --------
    backtest_results : pd.DataFrame
        Backtest metrics for each scenario-variable combination
    """
    results = []
    
    for scenario in scenario_projections['scenario'].unique():
        for var in variables:
            scenario_data = scenario_projections[
                (scenario_projections['scenario'] == scenario) &
                (scenario_projections['variable'] == var)
            ]
            
            actual_data = historical_data[
                (historical_data['variable'] == var) &
                (historical_data['year'].isin(test_years))
            ]
            
            if len(scenario_data) > 0 and len(actual_data) > 0:
                merged = pd.merge(
                    scenario_data[['year', 'value']],
                    actual_data[['year', 'value']],
                    on='year',
                    suffixes=('_proj', '_actual')
                )
                
                if len(merged) > 0:
                    # Calculate metrics
                    mae = np.mean(np.abs(merged['value_proj'] - merged['value_actual']))
                    rmse = np.sqrt(np.mean((merged['value_proj'] - merged['value_actual'])**2))
                    mape = np.mean(np.abs((merged['value_proj'] - merged['value_actual']) / merged['value_actual'])) * 100
                    bias = np.mean(merged['value_proj'] - merged['value_actual'])
                    
                    # Directional accuracy
                    proj_changes = np.diff(merged['value_proj'])
                    actual_changes = np.diff(merged['value_actual'])
                    directional_accuracy = np.mean((proj_changes > 0) == (actual_changes > 0)) * 100
                    
                    results.append({
                        'scenario': scenario,
                        'variable': var,
                        'MAE': mae,
                        'RMSE': rmse,
                        'MAPE': mape,
                        'Bias': bias,
                        'Directional_Accuracy': directional_accuracy,
                        'n_observations': len(merged)
                    })
    
    return pd.DataFrame(results)
```

### 7.2 Cross-Validation

```python
def cross_validate_ensemble(
    scenarios: Dict[str, pd.DataFrame],
    historical_data: pd.DataFrame,
    variables: List[str],
    k_folds: int = 5
) -> pd.DataFrame:
    """
    K-fold cross-validation for ensemble weights
    
    Parameters:
    -----------
    scenarios : dict
        Scenario data
    historical_data : pd.DataFrame
        Historical observations
    variables : list
        Variables to validate
    k_folds : int
        Number of folds
    
    Returns:
    --------
    cv_results : pd.DataFrame
        Cross-validation results
    """
    years = historical_data['year'].unique()
    fold_size = len(years) // k_folds
    
    cv_results = []
    
    for fold in range(k_folds):
        # Split data
        test_years = years[fold * fold_size:(fold + 1) * fold_size]
        train_years = [y for y in years if y not in test_years]
        
        train_data = historical_data[historical_data['year'].isin(train_years)]
        
        # Train ensemble on training data
        ensemble = ScenarioEnsemble(scenarios)
        weights = ensemble.calculate_bma_weights(train_data, variables)
        
        # Test on holdout data
        test_data = historical_data[historical_data['year'].isin(test_years)]
        backtest = backtest_scenarios(
            pd.concat([df.assign(scenario=name) for name, df in scenarios.items()]),
            test_data,
            variables,
            test_years
        )
        
        backtest['fold'] = fold
        backtest['weight_method'] = 'BMA'
        cv_results.append(backtest)
    
    return pd.concat(cv_results, ignore_index=True)
```

---

*End of Technical Implementation Guide*
