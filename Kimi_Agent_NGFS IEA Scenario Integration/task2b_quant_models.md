# Task 2B: Multi-Sector Asset Valuation Engine - Quantitative Financial Models

## Executive Summary

This document presents a comprehensive quantitative framework for climate-integrated asset valuation across multiple sectors. The models incorporate stochastic credit risk dynamics, sovereign yield curve adjustments, structured product spatial concentration analysis, real options for stranded assets, DCF impairment methodologies, and correlation structures for physical-transition risk interactions.

---

# 1. Merton Structural Model for Corporate Bonds and Loans

## 1.1 Foundation: Classical Merton Framework

### 1.1.1 Firm Value Dynamics

The Merton (1974) structural model posits that the firm's total asset value $V_t$ follows geometric Brownian motion under the physical measure $\mathbb{P}$:

$$dV_t = \mu V_t dt + \sigma_V V_t dW_t^\mathbb{P}, \quad V_0 > 0$$

where:
- $\mu$: Drift rate (expected return on assets)
- $\sigma_V$: Asset volatility
- $W_t^\mathbb{P}$: Standard Brownian motion under $\mathbb{P}$
- $V_0$: Initial firm value

Under the risk-neutral measure $\mathbb{Q}$, the dynamics become:

$$dV_t = r V_t dt + \sigma_V V_t dW_t^\mathbb{Q}$$

where $r$ is the risk-free rate.

### 1.1.2 Solution to the Stochastic Differential Equation

Applying Itô's lemma to $\ln(V_t)$:

$$d\ln(V_t) = \frac{1}{V_t}dV_t - \frac{1}{2V_t^2}(dV_t)^2 = \left(\mu - \frac{\sigma_V^2}{2}\right)dt + \sigma_V dW_t^\mathbb{P}$$

Integrating from $0$ to $T$:

$$\ln(V_T) - \ln(V_0) = \left(\mu - \frac{\sigma_V^2}{2}\right)T + \sigma_V W_T^\mathbb{P}$$

Since $W_T^\mathbb{P} \sim \mathcal{N}(0, T)$, we have:

$$\ln(V_T) \sim \mathcal{N}\left(\ln(V_0) + \left(\mu - \frac{\sigma_V^2}{2}\right)T, \sigma_V^2 T\right)$$

### 1.1.3 Default Condition and Payoff Structure

**Default Event:** Default occurs at maturity $T$ if firm value falls below debt face value:

$$\text{Default} \iff V_T < D$$

where $D$ is the total debt obligation (face value).

**Equity Payoff:**
$$E_T = \max(V_T - D, 0) = (V_T - D)^+$$

This is identical to a European call option on firm assets with strike $D$.

**Debt Payoff:**
$$B_T = \min(V_T, D) = D - \max(D - V_T, 0) = D - (D - V_T)^+$$

Debt equals risk-free debt minus a put option on firm assets.

### 1.1.4 Distance to Default (DD)

The distance to default measures how many standard deviations the firm is from default:

$$DD = \frac{\mathbb{E}[\ln(V_T)] - \ln(D)}{\sqrt{\text{Var}[\ln(V_T)]}}$$

Substituting the log-normal parameters:

$$\boxed{DD = \frac{\ln(V_0/D) + \left(\mu - \frac{\sigma_V^2}{2}\right)T}{\sigma_V\sqrt{T}}}$$

### 1.1.5 Probability of Default (PD)

The physical probability of default:

$$\boxed{PD^\mathbb{P} = \Phi(-DD) = \Phi\left(-\frac{\ln(V_0/D) + \left(\mu - \frac{\sigma_V^2}{2}\right)T}{\sigma_V\sqrt{T}}\right)}$$

Under the risk-neutral measure:

$$PD^\mathbb{Q} = \Phi\left(-\frac{\ln(V_0/D) + \left(r - \frac{\sigma_V^2}{2}\right)T}{\sigma_V\sqrt{T}}\right)$$

### 1.1.6 Expected Loss Given Default (LGD)

The loss given default is:

$$LGD = 1 - \frac{\mathbb{E}[V_T | V_T < D]}{D}$$

For log-normal $V_T$:

$$\mathbb{E}[V_T | V_T < D] = V_0 e^{\mu T} \frac{\Phi(-d_1)}{\Phi(-d_2)}$$

where:
$$d_1 = \frac{\ln(V_0/D) + (\mu + \frac{\sigma_V^2}{2})T}{\sigma_V\sqrt{T}}$$
$$d_2 = d_1 - \sigma_V\sqrt{T}$$

### 1.1.7 Expected Credit Loss (ECL)

$$ECL = PD \times LGD \times EAD$$

where $EAD$ is exposure at default.

---

## 1.2 Climate-Adjusted Merton Model

### 1.2.1 Climate Risk Transmission Mechanism

Climate risk affects firm value through multiple channels:

$$\mu^{climate} = \mu - \underbrace{\delta^{transition}}_{\text{Policy impact}} - \underbrace{\delta^{physical}}_{\text{Physical damages}}$$

$$\sigma_V^{climate} = \sigma_V \times (1 + \underbrace{\beta_{climate}}_{\text{Sensitivity}} \cdot \underbrace{CRS}_{\text{Climate Risk Score}})$$

### 1.2.2 Climate Risk Score (CRS) Construction

$$CRS = w_1 \cdot CRS_{transition} + w_2 \cdot CRS_{physical} + w_3 \cdot CRS_{liability}$$

where weights sum to unity: $\sum w_i = 1$

**Transition Risk Score:**
$$CRS_{transition} = \sum_{j} \alpha_j \cdot \text{CarbonIntensity}_j \cdot \text{PolicyShock}_j$$

**Physical Risk Score:**
$$CRS_{physical} = \sum_{k} \beta_k \cdot \text{Exposure}_k \cdot \text{HazardIntensity}_k$$

**Liability Risk Score:**
$$CRS_{liability} = \gamma \cdot \text{LitigationProbability} \cdot \text{PotentialDamages}$$

### 1.2.3 Climate-Adjusted Asset Volatility

$$\boxed{\sigma_V^{climate} = \sigma_V \times \left(1 + \beta_{climate} \cdot CRS\right)}$$

where $\beta_{climate}$ is the sector-specific climate sensitivity coefficient.

### 1.2.4 Climate-Adjusted Distance to Default

$$DD^{climate} = \frac{\ln(V_0/D) + \left(\mu^{climate} - \frac{(\sigma_V^{climate})^2}{2}\right)T}{\sigma_V^{climate}\sqrt{T}}$$

### 1.2.5 Climate-Adjusted Probability of Default

$$\boxed{PD^{climate} = \Phi(-DD^{climate})}$$

### 1.2.6 Climate-Adjusted Expected Credit Loss

$$ECL^{climate} = PD^{climate} \times LGD^{climate} \times EAD$$

---

## 1.3 Multi-Period Extension: First Passage Time Model

### 1.3.1 Barrier Formulation

The Black-Cox (1976) extension allows default at any time before maturity:

$$\tau = \inf\{t \geq 0 : V_t \leq D(t)\}$$

where $D(t)$ may be time-varying (e.g., coupon-paying debt).

### 1.3.2 First Passage Time Distribution

For constant barrier $D$:

$$\mathbb{P}(\tau \leq T) = \Phi\left(\frac{\ln(D/V_0) - (\mu - 0.5\sigma_V^2)T}{\sigma_V\sqrt{T}}\right) + \left(\frac{D}{V_0}\right)^{\frac{2(\mu - 0.5\sigma_V^2)}{\sigma_V^2}} \Phi\left(\frac{\ln(D/V_0) + (\mu - 0.5\sigma_V^2)T}{\sigma_V\sqrt{T}}\right)$$

### 1.3.3 Climate-Adjusted First Passage Model

$$\tau^{climate} = \inf\{t \geq 0 : V_t \leq D \cdot (1 + \theta_{climate} \cdot t)\}$$

where $\theta_{climate}$ captures the increasing debt burden from climate adaptation costs.

---

## 1.4 LGD Modeling with Recovery Rate Uncertainty

### 1.4.1 Stochastic Recovery Rate

Model recovery rate $R$ as a random variable:

$$R \sim \text{Beta}(\alpha, \beta)$$

with mean $\mathbb{E}[R] = \frac{\alpha}{\alpha + \beta}$ and variance $\text{Var}(R) = \frac{\alpha\beta}{(\alpha+\beta)^2(\alpha+\beta+1)}$

### 1.4.2 Climate-Adjusted Recovery Distribution

Climate events affect recovery through:

$$R^{climate} = R \times (1 - \epsilon_{climate})$$

where $\epsilon_{climate}$ is the climate-induced recovery impairment:

$$\epsilon_{climate} = \begin{cases} \epsilon_{physical} & \text{if physical event} \\ \epsilon_{transition} & \text{if transition event} \\ \epsilon_{both} & \text{if combined} \end{cases}$$

### 1.4.3 Expected LGD with Climate Adjustment

$$\mathbb{E}[LGD^{climate}] = 1 - \mathbb{E}[R^{climate}] = 1 - \mathbb{E}[R](1 - \mathbb{E}[\epsilon_{climate}])$$

### 1.4.4 LGD Volatility

$$\sigma_{LGD}^2 = \text{Var}(R^{climate}) + \text{Var}(\epsilon_{climate}) + 2\text{Cov}(R^{climate}, \epsilon_{climate})$$

---

## 1.5 Numerical Example: Climate-Adjusted Corporate Bond

### 1.5.1 Base Parameters

| Parameter | Value |
|-----------|-------|
| $V_0$ | $100 million |
| $D$ | $80 million |
| $\mu$ | 8% p.a. |
| $\sigma_V$ | 25% p.a. |
| $T$ | 5 years |
| $r$ | 3% p.a. |

### 1.5.2 Classical Merton Calculation

$$DD = \frac{\ln(100/80) + (0.08 - 0.5 \times 0.25^2) \times 5}{0.25 \times \sqrt{5}}$$

$$DD = \frac{0.2231 + 0.2438}{0.5590} = \frac{0.4669}{0.5590} = 0.835$$

$$PD = \Phi(-0.835) = 0.2023 = 20.23\%$$

### 1.5.3 Climate-Adjusted Calculation

| Climate Parameter | Value |
|-------------------|-------|
| $CRS$ | 0.35 |
| $\beta_{climate}$ | 0.40 |
| $\delta^{transition}$ | 2% p.a. |
| $\delta^{physical}$ | 1% p.a. |

$$\mu^{climate} = 0.08 - 0.02 - 0.01 = 0.05$$

$$\sigma_V^{climate} = 0.25 \times (1 + 0.40 \times 0.35) = 0.25 \times 1.14 = 0.285$$

$$DD^{climate} = \frac{\ln(100/80) + (0.05 - 0.5 \times 0.285^2) \times 5}{0.285 \times \sqrt{5}}$$

$$DD^{climate} = \frac{0.2231 + 0.0469}{0.6374} = \frac{0.2700}{0.6374} = 0.424$$

$$PD^{climate} = \Phi(-0.424) = 0.3357 = 33.57\%$$

### 1.5.4 Climate Impact Summary

| Metric | Base | Climate-Adjusted | Change |
|--------|------|------------------|--------|
| DD | 0.835 | 0.424 | -49.2% |
| PD | 20.23% | 33.57% | +66.0% |
| $\sigma_V$ | 25% | 28.5% | +14.0% |

---

## 1.6 Python Implementation: Merton Model

```python
import numpy as np
from scipy.stats import norm
from scipy.optimize import minimize_scalar

class ClimateMertonModel:
    """
    Climate-adjusted Merton structural credit model
    """
    
    def __init__(self, V0, D, mu, sigma_V, T, r):
        self.V0 = V0
        self.D = D
        self.mu = mu
        self.sigma_V = sigma_V
        self.T = T
        self.r = r
    
    def distance_to_default(self, mu_adj=None, sigma_adj=None):
        """Calculate distance to default"""
        mu_eff = mu_adj if mu_adj is not None else self.mu
        sigma_eff = sigma_adj if sigma_adj is not None else self.sigma_V
        
        numerator = np.log(self.V0 / self.D) + (mu_eff - 0.5 * sigma_eff**2) * self.T
        denominator = sigma_eff * np.sqrt(self.T)
        return numerator / denominator
    
    def probability_of_default(self, mu_adj=None, sigma_adj=None, measure='physical'):
        """Calculate probability of default"""
        if measure == 'risk_neutral':
            mu_eff = self.r
        else:
            mu_eff = mu_adj if mu_adj is not None else self.mu
        sigma_eff = sigma_adj if sigma_adj is not None else self.sigma_V
        
        dd = self.distance_to_default(mu_eff, sigma_eff)
        return norm.cdf(-dd)
    
    def climate_adjustment(self, crs, beta_climate, delta_transition, delta_physical):
        """Apply climate adjustments"""
        mu_climate = self.mu - delta_transition - delta_physical
        sigma_climate = self.sigma_V * (1 + beta_climate * crs)
        return mu_climate, sigma_climate
    
    def equity_value(self):
        """Calculate equity as call option (Black-Scholes)"""
        d1 = (np.log(self.V0 / self.D) + (self.r + 0.5 * self.sigma_V**2) * self.T) / (self.sigma_V * np.sqrt(self.T))
        d2 = d1 - self.sigma_V * np.sqrt(self.T)
        return self.V0 * norm.cdf(d1) - self.D * np.exp(-self.r * self.T) * norm.cdf(d2)
    
    def debt_value(self):
        """Calculate debt value"""
        return self.V0 - self.equity_value()
    
    def credit_spread(self):
        """Calculate credit spread in basis points"""
        pd_rn = self.probability_of_default(measure='risk_neutral')
        return -np.log(1 - pd_rn) / self.T * 10000

# Example usage
model = ClimateMertonModel(V0=100, D=80, mu=0.08, sigma_V=0.25, T=5, r=0.03)

# Base case
dd_base = model.distance_to_default()
pd_base = model.probability_of_default()

# Climate-adjusted
mu_climate, sigma_climate = model.climate_adjustment(
    crs=0.35, beta_climate=0.40, 
    delta_transition=0.02, delta_physical=0.01
)
dd_climate = model.distance_to_default(mu_climate, sigma_climate)
pd_climate = model.probability_of_default(mu_climate, sigma_climate)

print(f"Base DD: {dd_base:.3f}, PD: {pd_base:.2%}")
print(f"Climate DD: {dd_climate:.3f}, PD: {pd_climate:.2%}")
```

---

# 2. Sovereign Bond Yield Curve Adjustments

## 2.1 Nelson-Siegel Yield Curve Parameterization

### 2.1.1 Foundation Model

The Nelson-Siegel (1987) model provides a parsimonious representation of the yield curve:

$$\boxed{y(\tau) = \beta_0 + \beta_1\frac{1-e^{-\lambda\tau}}{\lambda\tau} + \beta_2\left(\frac{1-e^{-\lambda\tau}}{\lambda\tau} - e^{-\lambda\tau}\right)}$$

where:
- $\tau$: Time to maturity
- $\beta_0$: Long-term level (as $\tau \to \infty$, $y \to \beta_0$)
- $\beta_1$: Short-term slope component
- $\beta_2$: Medium-term curvature component
- $\lambda$: Decay parameter controlling curve shape

### 2.1.2 Factor Loadings Analysis

Define the factor loadings:

$$L_0(\tau) = 1$$
$$L_1(\tau) = \frac{1-e^{-\lambda\tau}}{\lambda\tau}$$
$$L_2(\tau) = \frac{1-e^{-\lambda\tau}}{\lambda\tau} - e^{-\lambda\tau}$$

Then:

$$y(\tau) = \beta_0 L_0(\tau) + \beta_1 L_1(\tau) + \beta_2 L_2(\tau)$$

### 2.1.3 Limiting Behavior

**Short maturity ($\tau \to 0$):**
Using L'Hôpital's rule:
$$\lim_{\tau \to 0} \frac{1-e^{-\lambda\tau}}{\lambda\tau} = 1$$
$$\lim_{\tau \to 0} y(\tau) = \beta_0 + \beta_1$$

**Long maturity ($\tau \to \infty$):**
$$\lim_{\tau \to \infty} y(\tau) = \beta_0$$

### 2.1.4 Instantaneous Forward Rate

The instantaneous forward rate is:

$$f(\tau) = y(\tau) + \tau \frac{\partial y(\tau)}{\partial \tau}$$

$$f(\tau) = \beta_0 + \beta_1 e^{-\lambda\tau} + \beta_2 \lambda\tau e^{-\lambda\tau}$$

---

## 2.2 Dynamic Nelson-Siegel (DNS) Model

### 2.2.1 State-Space Representation

Diebold-Li (2006) dynamic extension:

**Measurement equation:**
$$y_t(\tau) = L(\tau)' \beta_t + \varepsilon_t(\tau), \quad \varepsilon_t(\tau) \sim \mathcal{N}(0, \sigma_\varepsilon^2)$$

**Transition equation:**
$$\beta_t = \mu + A\beta_{t-1} + \eta_t, \quad \eta_t \sim \mathcal{N}(0, Q)$$

where $\beta_t = (\beta_{0t}, \beta_{1t}, \beta_{2t})'$.

### 2.2.2 VAR(1) Factor Dynamics

$$\beta_t = c + \Phi \beta_{t-1} + \eta_t$$

In matrix form:
$$\begin{pmatrix} \beta_{0t} \\ \beta_{1t} \\ \beta_{2t} \end{pmatrix} = \begin{pmatrix} c_0 \\ c_1 \\ c_2 \end{pmatrix} + \begin{pmatrix} \phi_{00} & \phi_{01} & \phi_{02} \\ \phi_{10} & \phi_{11} & \phi_{12} \\ \phi_{20} & \phi_{21} & \phi_{22} \end{pmatrix} \begin{pmatrix} \beta_{0,t-1} \\ \beta_{1,t-1} \\ \beta_{2,t-1} \end{pmatrix} + \begin{pmatrix} \eta_{0t} \\ \eta_{1t} \\ \eta_{2t} \end{pmatrix}$$

---

## 2.3 Climate Risk Premium Integration

### 2.3.1 Climate-Adjusted Yield Curve

$$\boxed{y^{climate}(\tau) = y(\tau) + \gamma(\tau) \cdot ClimateExposure_{country}}$$

where:
- $\gamma(\tau)$: Climate risk premium term structure
- $ClimateExposure_{country}$: Country-specific climate vulnerability index

### 2.3.2 Term Structure of Climate Risk Premium

The climate premium varies by maturity:

$$\gamma(\tau) = \gamma_0 + \gamma_1 e^{-\kappa\tau} + \gamma_2 \tau$$

where:
- $\gamma_0$: Long-term climate premium
- $\gamma_1$: Short-term climate shock
- $\gamma_2$: Climate trend component
- $\kappa$: Decay rate of short-term effects

### 2.3.3 Climate-Adjusted Nelson-Siegel

$$y^{climate}(\tau) = \beta_0^{climate} + \beta_1^{climate}\frac{1-e^{-\lambda\tau}}{\lambda\tau} + \beta_2^{climate}\left(\frac{1-e^{-\lambda\tau}}{\lambda\tau} - e^{-\lambda\tau}\right)$$

where climate-adjusted factors:
$$\beta_i^{climate} = \beta_i + \Delta\beta_i^{climate}$$

### 2.3.4 Climate Factor Decomposition

$$\Delta\beta_0^{climate} = \gamma_0 \cdot CE$$
$$\Delta\beta_1^{climate} = \gamma_1 \cdot CE$$
$$\Delta\beta_2^{climate} = \gamma_2 \cdot CE$$

where $CE = ClimateExposure_{country}$.

---

## 2.4 Country-Specific Climate Vulnerability Index

### 2.4.1 Multi-Dimensional Vulnerability Framework

$$ClimateExposure_{country} = \sum_{k=1}^{K} w_k \cdot Vulnerability_k$$

### 2.4.2 Physical Risk Vulnerability

$$Vulnerability_{physical} = w_{nat} \cdot V_{natural} + w_{infra} \cdot V_{infrastructure} + w_{agri} \cdot V_{agriculture}$$

where:
- $V_{natural}$: Natural capital exposure
- $V_{infrastructure}$: Infrastructure vulnerability
- $V_{agriculture}$: Agricultural sector exposure

### 2.4.3 Transition Risk Vulnerability

$$Vulnerability_{transition} = w_{energy} \cdot V_{energy} + w_{export} \cdot V_{exports} + w_{fiscal} \cdot V_{fiscal}$$

where:
- $V_{energy}$: Fossil fuel dependency
- $V_{exports}$: Carbon-intensive export exposure
- $V_{fiscal}$: Fiscal capacity for transition

### 2.4.4 Composite Climate Vulnerability Score

$$\boxed{CE = \alpha \cdot Vulnerability_{physical} + (1-\alpha) \cdot Vulnerability_{transition}}$$

---

## 2.5 Sovereign Credit Risk Integration

### 2.5.1 Sovereign Default Intensity

Under reduced-form models, default intensity $\lambda_t$:

$$\lambda_t = \lambda_0 + \lambda_{macro} \cdot X_t + \lambda_{climate} \cdot CE_t$$

where $X_t$ is a vector of macroeconomic variables.

### 2.5.2 Climate-Adjusted Survival Probability

$$Q(t, T) = \mathbb{E}^\mathbb{Q}\left[\exp\left(-\int_t^T \lambda_s ds\right) \bigg| \mathcal{F}_t\right]$$

### 2.5.3 Sovereign CDS Spread

$$CDS^{climate}(t, T) = (1-R) \cdot \mathbb{E}^\mathbb{Q}\left[\int_t^T \lambda_s^{climate} e^{-\int_t^s (r_u + \lambda_u^{climate}) du} ds\right]$$

where $R$ is recovery rate and:
$$\lambda_s^{climate} = \lambda_s + \theta \cdot CE_s$$

---

## 2.6 Numerical Example: Climate-Adjusted Sovereign Yield Curve

### 2.6.1 Base Nelson-Siegel Parameters

| Parameter | Value |
|-----------|-------|
| $\beta_0$ | 4.0% |
| $\beta_1$ | -2.0% |
| $\beta_2$ | 1.0% |
| $\lambda$ | 0.5 |

### 2.6.2 Climate Parameters

| Parameter | Value |
|-----------|-------|
| $\gamma_0$ | 50 bps |
| $\gamma_1$ | 30 bps |
| $\gamma_2$ | 5 bps/year |
| $\kappa$ | 0.3 |
| $CE$ | 0.6 |

### 2.6.3 Yield Calculations

For maturity $\tau = 5$ years:

**Base yield:**
$$y(5) = 0.04 - 0.02 \times \frac{1-e^{-0.5 \times 5}}{0.5 \times 5} + 0.01 \times \left(\frac{1-e^{-0.5 \times 5}}{0.5 \times 5} - e^{-0.5 \times 5}\right)$$

$$y(5) = 0.04 - 0.02 \times 0.3616 + 0.01 \times 0.2442 = 0.0352 = 3.52\%$$

**Climate premium:**
$$\gamma(5) = 0.0050 + 0.0030 \times e^{-0.3 \times 5} + 0.0005 \times 5$$
$$\gamma(5) = 0.0050 + 0.00067 + 0.0025 = 0.00817 = 81.7 \text{ bps}$$

**Climate-adjusted yield:**
$$y^{climate}(5) = 3.52\% + 0.817\% \times 0.6 = 3.52\% + 0.49\% = 4.01\%$$

### 2.6.4 Term Structure Comparison

| Maturity (years) | Base Yield | Climate Premium | Adjusted Yield | Spread (bps) |
|------------------|------------|-----------------|----------------|--------------|
| 1 | 3.21% | 75.1 bps | 3.66% | 45 |
| 3 | 3.42% | 79.5 bps | 3.90% | 48 |
| 5 | 3.52% | 81.7 bps | 4.01% | 49 |
| 10 | 3.73% | 86.2 bps | 4.25% | 52 |
| 30 | 4.00% | 95.0 bps | 4.57% | 57 |

---

## 2.7 Python Implementation: Climate-Adjusted Yield Curve

```python
import numpy as np
from scipy.optimize import curve_fit

class ClimateNelsonSiegel:
    """
    Climate-adjusted Nelson-Siegel yield curve model
    """
    
    def __init__(self, beta0, beta1, beta2, lambda_param):
        self.beta0 = beta0
        self.beta1 = beta1
        self.beta2 = beta2
        self.lambda_param = lambda_param
    
    def yield_curve(self, tau):
        """Calculate yield for maturity tau"""
        term1 = self.beta0
        term2 = self.beta1 * (1 - np.exp(-self.lambda_param * tau)) / (self.lambda_param * tau)
        term3 = self.beta2 * ((1 - np.exp(-self.lambda_param * tau)) / (self.lambda_param * tau) - np.exp(-self.lambda_param * tau))
        return term1 + term2 + term3
    
    def climate_premium(self, tau, gamma0, gamma1, gamma2, kappa):
        """Calculate climate risk premium"""
        return gamma0 + gamma1 * np.exp(-kappa * tau) + gamma2 * tau
    
    def climate_adjusted_yield(self, tau, climate_exposure, gamma_params):
        """Calculate climate-adjusted yield"""
        base_yield = self.yield_curve(tau)
        premium = self.climate_premium(tau, **gamma_params)
        return base_yield + premium * climate_exposure
    
    def forward_rate(self, tau):
        """Calculate instantaneous forward rate"""
        return (self.beta0 + self.beta1 * np.exp(-self.lambda_param * tau) + 
                self.beta2 * self.lambda_param * tau * np.exp(-self.lambda_param * tau))
    
    @staticmethod
    def fit(tau_data, yield_data):
        """Fit Nelson-Siegel to market data"""
        def ns_model(tau, beta0, beta1, beta2, lambda_param):
            term1 = beta0
            term2 = beta1 * (1 - np.exp(-lambda_param * tau)) / (lambda_param * tau)
            term3 = beta2 * ((1 - np.exp(-lambda_param * tau)) / (lambda_param * tau) - np.exp(-lambda_param * tau))
            return term1 + term2 + term3
        
        popt, _ = curve_fit(ns_model, tau_data, yield_data, 
                           p0=[0.03, -0.01, 0.005, 0.5],
                           bounds=([0, -1, -1, 0.01], [0.5, 1, 1, 5]))
        return ClimateNelsonSiegel(*popt)

# Example usage
ns = ClimateNelsonSiegel(beta0=0.04, beta1=-0.02, beta2=0.01, lambda_param=0.5)

gamma_params = {
    'gamma0': 0.0050,
    'gamma1': 0.0030,
    'gamma2': 0.0005,
    'kappa': 0.3
}

climate_exposure = 0.6
maturities = np.array([1, 3, 5, 10, 30])

print("Maturity | Base Yield | Climate Adj. | Spread (bps)")
print("-" * 55)
for tau in maturities:
    base = ns.yield_curve(tau) * 100
    adj = ns.climate_adjusted_yield(tau, climate_exposure, gamma_params) * 100
    spread = (adj - base) * 100
    print(f"{tau:8} | {base:9.2f}% | {adj:11.2f}% | {spread:11.0f}")
```

---

# 3. MBS/CMBS Spatial Concentration Modeling

## 3.1 Pool-Level Default Correlation via Gaussian Copula

### 3.1.1 Gaussian Copula Foundation

For $n$ loans in a pool, let $X_i$ be the standardized asset return for loan $i$:

$$X_i = \frac{\ln(V_{i,T}/D_i) - \mu_{i,T}}{\sigma_{i,T}}$$

Under the Gaussian copula:

$$\mathbf{X} = (X_1, X_2, ..., X_n)' \sim \mathcal{N}_n(\mathbf{0}, \mathbf{\Sigma})$$

where $\mathbf{\Sigma}$ is the correlation matrix with elements $\rho_{ij}$.

### 3.1.2 Default Thresholds

Define default threshold for loan $i$:

$$c_i = \Phi^{-1}(PD_i)$$

Loan $i$ defaults if $X_i < c_i$.

### 3.1.3 Joint Default Probability

The joint probability that loans $i$ and $j$ both default:

$$\mathbb{P}(D_i \cap D_j) = \mathbb{P}(X_i < c_i, X_j < c_j) = \Phi_2(c_i, c_j; \rho_{ij})$$

where $\Phi_2(\cdot, \cdot; \rho)$ is the bivariate standard normal CDF with correlation $\rho$.

### 3.1.4 Default Correlation

$$\rho_{ij}^{default} = \frac{\mathbb{P}(D_i \cap D_j) - PD_i \cdot PD_j}{\sqrt{PD_i(1-PD_i) \cdot PD_j(1-PD_j)}}$$

$$\rho_{ij}^{default} = \frac{\Phi_2(c_i, c_j; \rho_{ij}) - \Phi(c_i)\Phi(c_j)}{\sqrt{\Phi(c_i)(1-\Phi(c_i))\Phi(c_j)(1-\Phi(c_j))}}$$

### 3.1.5 Large Homogeneous Portfolio (LHP) Approximation

For a portfolio with identical loans ($PD_i = PD$, $\rho_{ij} = \rho$ for all $i \neq j$):

The conditional default probability given systematic factor $Y$:

$$PD(Y) = \Phi\left(\frac{\Phi^{-1}(PD) - \sqrt{\rho}Y}{\sqrt{1-\rho}}\right)$$

The portfolio loss distribution:

$$\mathbb{P}(L \leq x) = \Phi\left(\frac{\sqrt{1-\rho}\Phi^{-1}(x) - \Phi^{-1}(PD)}{\sqrt{\rho}}\right)$$

---

## 3.2 Geographic Concentration Metrics

### 3.2.1 Herfindahl-Hirschman Index (HHI)

For geographic concentration across $m$ regions:

$$\boxed{HHI = \sum_{i=1}^{m} s_i^2}$$

where $s_i$ is the share of portfolio exposure in region $i$:

$$s_i = \frac{\text{Exposure}_i}{\text{Total Exposure}}$$

### 3.2.2 HHI Interpretation

| HHI Range | Concentration Level |
|-----------|---------------------|
| < 0.15 | Low concentration |
| 0.15 - 0.25 | Moderate concentration |
| > 0.25 | High concentration |

### 3.2.3 Geographic Diversification Score

$$GDS = 1 - HHI = 1 - \sum_{i=1}^{m} s_i^2$$

Alternatively, using effective number of regions:

$$N_{eff} = \frac{1}{HHI} = \frac{1}{\sum_{i=1}^{m} s_i^2}$$

### 3.2.4 Spatial Correlation Structure

Define spatial correlation between regions $i$ and $j$:

$$\rho_{ij}^{spatial} = \exp\left(-\frac{d_{ij}}{d_0}\right)$$

where:
- $d_{ij}$: Distance between region centroids
- $d_0$: Spatial decay parameter

### 3.2.5 Climate Zone Exposure Aggregation

Group regions by climate zone $z$:

$$Exposure_z = \sum_{i \in Zone_z} Exposure_i$$

Climate zone concentration:

$$HHI_{climate} = \sum_{z=1}^{Z} \left(\frac{Exposure_z}{Total Exposure}\right)^2$$

---

## 3.3 Climate Risk Integration in MBS

### 3.3.1 Climate-Adjusted Default Probability

For loan $i$ in climate zone $z$:

$$PD_i^{climate} = PD_i \times (1 + \alpha_z \cdot HazardIntensity_z)$$

### 3.3.2 Spatial Climate Correlation

Climate events create spatial correlation:

$$\rho_{ij}^{climate} = \begin{cases} \rho_{zone} & \text{if } i,j \in \text{same climate zone} \\ \rho_{zone} \cdot e^{-d_{ij}/d_c} & \text{otherwise} \end{cases}$$

### 3.3.3 Combined Correlation Structure

$$\mathbf{\Sigma}^{climate} = \mathbf{\Sigma}^{credit} + \mathbf{\Sigma}^{climate} - \mathbf{\Sigma}^{credit} \circ \mathbf{\Sigma}^{climate}$$

where $\circ$ denotes Hadamard (element-wise) product.

---

## 3.4 Tranche Waterfall with Climate Losses

### 3.4.1 Pool Cash Flow Structure

Total pool principal: $P = \sum_{i=1}^{n} P_i$

Total pool loss: $L = \sum_{i=1}^{n} L_i \cdot \mathbf{1}_{\{Default_i\}}$

Loss rate: $\ell = L / P$

### 3.4.2 Tranche Structure

For tranches $k = 1, ..., K$ with attachment points $A_k$ and detachment points $D_k$:

$$0 = A_1 < D_1 = A_2 < D_2 = A_3 < ... < D_K = 1$$

### 3.4.3 Tranche Loss Allocation

Loss absorbed by tranche $k$:

$$L_k = \min(\max(\ell - A_k, 0), D_k - A_k) \times P$$

### 3.4.4 Climate-Adjusted Waterfall

With climate losses $L^{climate} > L^{base}$:

$$L_k^{climate} = \min(\max(\ell^{climate} - A_k, 0), D_k - A_k) \times P$$

### 3.4.5 Tranche Expected Loss

$$EL_k = \mathbb{E}[L_k] = \int_{0}^{1} \min(\max(\ell - A_k, 0), D_k - A_k) f(\ell) d\ell$$

### 3.4.6 Tranche Credit Rating

Map expected loss to rating:

$$Rating_k = \text{Map}(EL_k, \sigma_{L_k})$$

---

## 3.5 Numerical Example: CMBS Pool Analysis

### 3.5.1 Pool Composition

| Region | Exposure ($M) | Share ($s_i$) | PD (base) | Climate Zone |
|--------|---------------|---------------|-----------|--------------|
| Florida | 150 | 0.30 | 3% | Hurricane |
| Texas | 100 | 0.20 | 2% | Multi-risk |
| California | 125 | 0.25 | 2.5% | Wildfire |
| New York | 75 | 0.15 | 1.5% | Flood |
| Illinois | 50 | 0.10 | 2% | Tornado |
| **Total** | **500** | **1.00** | | |

### 3.5.2 Geographic Concentration

$$HHI = 0.30^2 + 0.20^2 + 0.25^2 + 0.15^2 + 0.10^2 = 0.09 + 0.04 + 0.0625 + 0.0225 + 0.01 = 0.225$$

$$N_{eff} = 1/0.225 = 4.44 \text{ regions}$$

Moderate concentration (HHI = 0.225).

### 3.5.3 Climate-Adjusted PDs

| Region | Hazard Intensity | Climate Multiplier | PD (climate) |
|--------|------------------|-------------------|--------------|
| Florida | 0.40 | 1.20 | 3.6% |
| Texas | 0.25 | 1.10 | 2.2% |
| California | 0.35 | 1.15 | 2.875% |
| New York | 0.20 | 1.08 | 1.62% |
| Illinois | 0.15 | 1.06 | 2.12% |

### 3.5.4 Pool-Level Expected Loss

**Base case:**
$$EL_{base} = 150 \times 0.03 + 100 \times 0.02 + 125 \times 0.025 + 75 \times 0.015 + 50 \times 0.02 = 4.5 + 2.0 + 3.125 + 1.125 + 1.0 = 11.75M$$

**Climate-adjusted:**
$$EL_{climate} = 150 \times 0.036 + 100 \times 0.022 + 125 \times 0.02875 + 75 \times 0.0162 + 50 \times 0.0212 = 5.4 + 2.2 + 3.59 + 1.22 + 1.06 = 13.47M$$

**Climate impact:** $+14.6\%$ increase in expected loss

### 3.5.5 Tranche Analysis

| Tranche | Attachment | Detachment | Base EL | Climate EL | Rating Impact |
|---------|------------|------------|---------|------------|---------------|
| Senior | 30% | 100% | 0.5% | 1.2% | AAA → AA |
| Mezzanine | 15% | 30% | 3.2% | 5.8% | A → BBB |
| Junior | 5% | 15% | 12.5% | 18.3% | BB → B |
| Equity | 0% | 5% | 45.0% | 52.1% | NR → NR |

---

## 3.6 Python Implementation: MBS Climate Model

```python
import numpy as np
from scipy.stats import norm, multivariate_normal
from scipy.integrate import quad

class ClimateMBSModel:
    """
    Climate-adjusted MBS/CMBS pool model with spatial correlation
    """
    
    def __init__(self, exposures, base_pds, climate_zones, hazard_intensities):
        self.exposures = np.array(exposures)
        self.base_pds = np.array(base_pds)
        self.climate_zones = climate_zones
        self.hazard_intensities = np.array(hazard_intensities)
        self.n_loans = len(exposures)
        self.total_exposure = np.sum(exposures)
    
    def climate_adjusted_pd(self, alpha=0.5):
        """Calculate climate-adjusted default probabilities"""
        climate_multipliers = 1 + alpha * self.hazard_intensities
        return self.base_pds * climate_multipliers
    
    def geographic_hhi(self):
        """Calculate Herfindahl-Hirschman Index"""
        shares = self.exposures / self.total_exposure
        return np.sum(shares**2)
    
    def effective_regions(self):
        """Calculate effective number of regions"""
        return 1 / self.geographic_hhi()
    
    def build_correlation_matrix(self, base_corr=0.2, climate_corr_factor=0.3):
        """Build correlation matrix with climate effects"""
        corr = np.eye(self.n_loans) * (1 - base_corr)
        
        for i in range(self.n_loans):
            for j in range(i+1, self.n_loans):
                # Base correlation
                rho = base_corr
                
                # Add climate zone correlation
                if self.climate_zones[i] == self.climate_zones[j]:
                    rho += climate_corr_factor
                
                corr[i, j] = corr[j, i] = min(rho, 0.99)
        
        return corr
    
    def pool_expected_loss(self, use_climate=True, alpha=0.5):
        """Calculate pool-level expected loss"""
        if use_climate:
            pds = self.climate_adjusted_pd(alpha)
        else:
            pds = self.base_pds
        
        return np.sum(self.exposures * pds)
    
    def tranche_loss(self, loss_rate, attachment, detachment):
        """Calculate tranche loss given pool loss rate"""
        return np.minimum(np.maximum(loss_rate - attachment, 0), detachment - attachment)
    
    def simulate_pool_loss(self, n_sims=10000, use_climate=True, alpha=0.5):
        """Monte Carlo simulation of pool losses"""
        corr = self.build_correlation_matrix()
        
        if use_climate:
            pds = self.climate_adjusted_pd(alpha)
        else:
            pds = self.base_pds
        
        # Generate correlated normals
        thresholds = norm.ppf(pds)
        Z = multivariate_normal.rvs(mean=np.zeros(self.n_loans), cov=corr, size=n_sims)
        
        # Default indicators
        defaults = Z < thresholds
        
        # Calculate losses
        losses = np.sum(defaults * self.exposures, axis=1)
        loss_rates = losses / self.total_exposure
        
        return losses, loss_rates

# Example usage
exposures = [150, 100, 125, 75, 50]  # $M
base_pds = [0.03, 0.02, 0.025, 0.015, 0.02]
climate_zones = ['Hurricane', 'Multi', 'Wildfire', 'Flood', 'Tornado']
hazard_intensities = [0.40, 0.25, 0.35, 0.20, 0.15]

mbs = ClimateMBSModel(exposures, base_pds, climate_zones, hazard_intensities)

print(f"Geographic HHI: {mbs.geographic_hhi():.3f}")
print(f"Effective regions: {mbs.effective_regions():.2f}")
print(f"Base EL: ${mbs.pool_expected_loss(use_climate=False):.2f}M")
print(f"Climate EL: ${mbs.pool_expected_loss(use_climate=True):.2f}M")

# Tranche analysis
losses, loss_rates = mbs.simulate_pool_loss(n_sims=50000)
tranches = [(0, 0.05), (0.05, 0.15), (0.15, 0.30), (0.30, 1.0)]

for name, (att, det) in zip(['Equity', 'Junior', 'Mezz', 'Senior'], tranches):
    tranche_losses = [mbs.tranche_loss(lr, att, det) * 500 for lr in loss_rates]
    print(f"{name} tranche EL: ${np.mean(tranche_losses):.2f}M")
```

---

# 4. Real Options Analysis for Stranded Assets

## 4.1 Option to Abandon

### 4.1.1 Abandonment Option Payoff

The option to abandon provides the right to cease operations and recover salvage value:

$$\boxed{V_{abandon} = \max(0, S - K)}$$

where:
- $S$: Salvage value (scrap, resale, alternative use)
- $K$: Shutdown costs (decommissioning, remediation, severance)

### 4.1.2 Expanded Abandonment Formulation

For climate-stranded assets:

$$V_{abandon}^{climate}(t) = \max\left(0, S(t) - K(t) - L(t)\right)$$

where $L(t)$ is the expected liability cost from climate litigation or remediation.

### 4.1.3 Optimal Abandonment Boundary

The optimal exercise boundary $V^*(t)$ satisfies:

$$V^*(t) = \inf\{V : V_{operating}(V, t) \leq S(t) - K(t)\}$$

---

## 4.2 Option to Expand/Contract Capacity

### 4.2.1 Expansion Option

The option to expand capacity by factor $\gamma$ at cost $I$:

$$V_{expand} = \max(0, \gamma V - I)$$

### 4.2.2 Contraction Option

The option to reduce capacity by factor $\delta$ and save costs:

$$V_{contract} = \max(0, \delta C - R)$$

where $C$ is cost savings and $R$ is restructuring cost.

### 4.2.3 Combined Option Portfolio

For a firm with multiple options:

$$V_{total} = V_{base} + V_{abandon} + V_{expand} + V_{contract} + V_{switch}$$

---

## 4.3 Binomial Tree Valuation Framework

### 4.3.1 Tree Parameters

For asset value $V$ with volatility $\sigma$ over time step $\Delta t$:

**Up factor:**
$$\boxed{u = e^{\sigma\sqrt{\Delta t}}}$$

**Down factor:**
$$\boxed{d = e^{-\sigma\sqrt{\Delta t}} = \frac{1}{u}}$$

**Risk-neutral probability:**
$$\boxed{p = \frac{e^{r\Delta t} - d}{u - d}}$$

### 4.3.2 Asset Value Evolution

At node $(i, j)$ (time $i$, state $j$):

$$V_{i,j} = V_0 \cdot u^j \cdot d^{i-j}$$

### 4.3.3 Backward Induction

Option value at node $(i, j)$:

$$C_{i,j} = \max\left(\text{Exercise Value}, e^{-r\Delta t}\left[p C_{i+1,j+1} + (1-p) C_{i+1,j}\right]\right)$$

### 4.3.4 Climate-Adjusted Volatility

$$\sigma^{climate} = \sigma \times (1 + \beta_{climate} \cdot PolicyUncertainty)$$

---

## 4.4 Carbon Price Trajectory Impact

### 4.4.1 Carbon Price Dynamics

Model carbon price $P_t^c$ as stochastic process:

$$dP_t^c = \alpha(\bar{P}^c - P_t^c)dt + \sigma_c dW_t^c$$

Or with jumps for policy shocks:

$$dP_t^c = \alpha(\bar{P}^c - P_t^c)dt + \sigma_c dW_t^c + J dN_t$$

where $N_t$ is a Poisson process with intensity $\lambda_p$.

### 4.4.2 Cash Flow Impact

Carbon cost impact on operating cash flows:

$$CF_t^{carbon} = CF_t - E_t \cdot P_t^c$$

where $E_t$ is emissions at time $t$.

### 4.4.3 Asset Value Under Carbon Pricing

$$V_t = \sum_{s=t}^{T} \frac{CF_s - E_s \cdot P_s^c}{(1+r)^{s-t}}$$

### 4.4.4 Stranding Threshold

Asset is stranded when:

$$V_t < V_{abandon} \iff \sum_{s=t}^{T} \frac{CF_s - E_s \cdot P_s^c}{(1+r)^{s-t}} < S(t) - K(t)$$

---

## 4.5 Optimal Shutdown Timing

### 4.5.1 Stopping Time Problem

Find optimal stopping time $\tau^*$:

$$\tau^* = \arg\max_{\tau} \mathbb{E}^\mathbb{Q}\left[\int_0^{\tau} e^{-rt} CF_t dt + e^{-r\tau}(S(\tau) - K(\tau))\right]$$

### 4.5.2 Hamilton-Jacobi-Bellman Equation

The value function $V(V, t)$ satisfies:

$$\max\left\{S - K - V, \frac{\partial V}{\partial t} + \mu V \frac{\partial V}{\partial V} + \frac{1}{2}\sigma^2 V^2 \frac{\partial^2 V}{\partial V^2} - rV + CF\right\} = 0$$

### 4.5.3 Policy Uncertainty Impact

With policy uncertainty $\theta$:

$$V(V, t, \theta) = \mathbb{E}\left[V(V, t) | \theta\right]$$

Higher policy uncertainty increases option value of waiting:

$$\frac{\partial V_{option}}{\partial \theta} > 0$$

---

## 4.6 Numerical Example: Coal Power Plant Stranding

### 4.6.1 Asset Parameters

| Parameter | Value |
|-----------|-------|
| Initial capacity value ($V_0$) | $500M |
| Annual cash flow ($CF$) | $50M |
| Annual emissions ($E$) | 5 Mt CO2 |
| Salvage value ($S$) | $100M |
| Shutdown cost ($K$) | $30M |
| Volatility ($\sigma$) | 20% |
| Risk-free rate ($r$) | 5% |

### 4.6.2 Carbon Price Scenarios

| Scenario | Carbon Price ($/tCO2) | Probability |
|----------|----------------------|-------------|
| Low | $25 | 30% |
| Medium | $50 | 50% |
| High | $100 | 20% |

### 4.6.3 Carbon Cost Impact

| Scenario | Annual Carbon Cost | Adjusted CF |
|----------|-------------------|-------------|
| Low | $125M | -$75M (loss) |
| Medium | $250M | -$200M (loss) |
| High | $500M | -$450M (loss) |

### 4.6.4 Binomial Tree Valuation

With $\Delta t = 1$ year, $\sigma = 0.20$:

$$u = e^{0.20 \times \sqrt{1}} = 1.2214$$
$$d = 1/u = 0.8187$$
$$p = \frac{e^{0.05} - 0.8187}{1.2214 - 0.8187} = \frac{1.0513 - 0.8187}{0.4027} = 0.577$$

### 4.6.5 Abandonment Decision

Expected carbon cost (probability-weighted):
$$\bar{C}_{carbon} = 0.30 \times 125 + 0.50 \times 250 + 0.20 \times 500 = 37.5 + 125 + 100 = 262.5M$$

Expected cash flow:
$$\overline{CF} = 50 - 262.5 = -212.5M \text{ (annual loss)}$$

Immediate abandonment value:
$$V_{abandon} = 100 - 30 = 70M$$

**Decision:** Abandon immediately (avoid $212.5M annual losses).

### 4.6.6 Option Value Analysis

| Metric | Value |
|--------|-------|
| Base asset value (no carbon) | $500M |
| Value with expected carbon | -$2.3B (stranded) |
| Abandonment option value | $70M |
| Optimal decision | Exercise abandonment |
| Value destruction avoided | $2.37B |

---

## 4.7 Python Implementation: Real Options Model

```python
import numpy as np
from scipy.stats import norm
from scipy.optimize import minimize_scalar

class RealOptionsModel:
    """
    Real options analysis for climate-stranded assets
    """
    
    def __init__(self, V0, cash_flows, emissions, carbon_prices, 
                 salvage_value, shutdown_cost, sigma, r, T):
        self.V0 = V0
        self.cash_flows = np.array(cash_flows)
        self.emissions = np.array(emissions)
        self.carbon_prices = np.array(carbon_prices)
        self.salvage_value = salvage_value
        self.shutdown_cost = shutdown_cost
        self.sigma = sigma
        self.r = r
        self.T = T
    
    def carbon_adjusted_cf(self):
        """Calculate carbon-adjusted cash flows"""
        carbon_costs = self.emissions * self.carbon_prices
        return self.cash_flows - carbon_costs
    
    def binomial_params(self, dt):
        """Calculate binomial tree parameters"""
        u = np.exp(self.sigma * np.sqrt(dt))
        d = 1 / u
        p = (np.exp(self.r * dt) - d) / (u - d)
        return u, d, p
    
    def build_tree(self, n_steps):
        """Build asset value binomial tree"""
        dt = self.T / n_steps
        u, d, p = self.binomial_params(dt)
        
        # Asset values at each node
        tree = np.zeros((n_steps + 1, n_steps + 1))
        tree[0, 0] = self.V0
        
        for i in range(1, n_steps + 1):
            for j in range(i + 1):
                tree[i, j] = self.V0 * (u ** j) * (d ** (i - j))
        
        return tree, u, d, p
    
    def abandonment_option(self, n_steps=50):
        """Value abandonment option using binomial tree"""
        dt = self.T / n_steps
        tree, u, d, p = self.build_tree(n_steps)
        
        # Terminal values
        values = np.maximum(tree[-1, :], self.salvage_value - self.shutdown_cost)
        
        # Backward induction
        for i in range(n_steps - 1, -1, -1):
            for j in range(i + 1):
                # Continuation value
                cont_value = np.exp(-self.r * dt) * (p * values[j+1] + (1-p) * values[j])
                
                # Exercise value
                exercise_value = self.salvage_value - self.shutdown_cost
                
                # Option value
                values[j] = np.maximum(cont_value, exercise_value)
        
        return values[0]
    
    def optimal_shutdown_time(self):
        """Find optimal shutdown time"""
        adjusted_cf = self.carbon_adjusted_cf()
        
        def value_at_t(t):
            if t >= len(adjusted_cf):
                return self.salvage_value - self.shutdown_cost
            
            # PV of future cash flows
            pv_cf = sum([adjusted_cf[s] / (1 + self.r) ** (s - t) 
                        for s in range(t, min(t + 10, len(adjusted_cf)))])
            
            # Abandonment value
            abandon_value = self.salvage_value - self.shutdown_cost
            
            return max(pv_cf, abandon_value)
        
        # Find optimal time
        times = range(len(adjusted_cf))
        values = [value_at_t(t) for t in times]
        optimal_t = np.argmax(values)
        
        return optimal_t, values[optimal_t]

# Example: Coal power plant
model = RealOptionsModel(
    V0=500,
    cash_flows=[50] * 20,  # $50M/year for 20 years
    emissions=[5] * 20,    # 5 Mt CO2/year
    carbon_prices=[50] * 20,  # $50/tCO2
    salvage_value=100,
    shutdown_cost=30,
    sigma=0.20,
    r=0.05,
    T=20
)

abandon_value = model.abandonment_option()
optimal_t, optimal_value = model.optimal_shutdown_time()

print(f"Abandonment option value: ${abandon_value:.2f}M")
print(f"Optimal shutdown time: Year {optimal_t}")
print(f"Value at optimal time: ${optimal_value:.2f}M")

# Carbon price sensitivity
carbon_scenarios = [25, 50, 75, 100, 150]
print("\nCarbon Price Sensitivity:")
for cp in carbon_scenarios:
    model.carbon_prices = [cp] * 20
    opt_t, opt_v = model.optimal_shutdown_time()
    print(f"Carbon ${cp}/tCO2: Shutdown Year {opt_t}, Value ${opt_v:.2f}M")
```

---

# 5. DCF Impairment for Transition Risk

## 5.1 Standard DCF Framework

### 5.1.1 Enterprise Value Formula

The fundamental DCF valuation:

$$\boxed{V = \sum_{t=1}^{T} \frac{CF_t}{(1+r)^t} + \frac{TV}{(1+r)^T}}$$

where:
- $CF_t$: Free cash flow in year $t$
- $r$: Discount rate (WACC)
- $TV$: Terminal value
- $T$: Explicit forecast period

### 5.1.2 Free Cash Flow Definition

$$FCF_t = EBIT_t(1-\tau) + D\&A_t - CapEx_t - \Delta NWC_t$$

where:
- $EBIT$: Earnings before interest and taxes
- $\tau$: Corporate tax rate
- $D\&A$: Depreciation and amortization
- $CapEx$: Capital expenditures
- $\Delta NWC$: Change in net working capital

### 5.1.3 Terminal Value

Gordon growth model:

$$TV = \frac{FCF_{T+1}}{r - g} = \frac{FCF_T(1+g)}{r - g}$$

where $g$ is the perpetual growth rate.

---

## 5.2 Climate-Adjusted Cash Flows

### 5.2.1 Physical Risk Adjustment

$$\boxed{CF_t^{physical} = CF_t \times (1 - \delta_t^{physical})}$$

where:
$$\delta_t^{physical} = \sum_{h} p_{h,t} \cdot d_h$$

- $p_{h,t}$: Probability of hazard $h$ in year $t$
- $d_h$: Damage factor for hazard $h$

### 5.2.2 Transition Risk Adjustment

$$\boxed{CF_t^{transition} = CF_t \times (1 - \delta_t^{transition})}$$

where:
$$\delta_t^{transition} = f(CarbonPrice_t, PolicyStringency_t, TechnologyCost_t)$$

### 5.2.3 Combined Climate Adjustment

$$\boxed{CF_t^{climate} = CF_t \times (1 - \delta_t^{physical}) \times (1 - \delta_t^{transition})}$$

### 5.2.4 Carbon Cost Integration

$$CF_t^{climate} = CF_t - E_t \cdot P_t^c - CapEx_t^{adaptation} - Litigation_t$$

where:
- $E_t$: Emissions
- $P_t^c$: Carbon price
- $CapEx_t^{adaptation}$: Climate adaptation capex
- $Litigation_t$: Expected litigation costs

---

## 5.3 Terminal Value Adjustments

### 5.3.1 Stranded Asset Terminal Value

For assets facing obsolescence:

$$TV^{stranded} = \frac{FCF_T(1+g)}{r - g} \times (1 - \pi_{strand}) + S \times \pi_{strand}$$

where:
- $\pi_{strand}$: Probability of stranding
- $S$: Salvage value if stranded

### 5.3.2 Declining Terminal Value

For sunset industries:

$$TV^{decline} = \sum_{t=T+1}^{\infty} \frac{FCF_T \times (1 - \delta)^{t-T}}{(1+r)^{t-T}}$$

where $\delta$ is the annual decline rate.

### 5.3.3 Terminal Value with Climate Risk

$$TV^{climate} = \frac{CF_T^{climate}(1+g^{climate})}{r^{climate} - g^{climate}}$$

where climate-adjusted growth and discount rates account for transition impacts.

---

## 5.4 Carbon Price Elasticity Sensitivity

### 5.4.1 Carbon Price Trajectory

$$P_t^c = P_0^c \times e^{g_c t}$$

where $g_c$ is the carbon price growth rate.

### 5.4.2 Cash Flow Sensitivity

$$\frac{\partial CF_t}{\partial P_t^c} = -E_t$$

### 5.4.3 Value Sensitivity

$$\frac{\partial V}{\partial P^c} = -\sum_{t=1}^{T} \frac{E_t}{(1+r)^t}$$

### 5.4.4 Carbon Beta

$$\beta_{carbon} = \frac{Cov(V, P^c)}{Var(P^c)}$$

---

## 5.5 Impairment Testing Framework

### 5.5.1 IFRS 9 Impairment

Expected credit loss:

$$ECL = \sum_{t=1}^{T} PD_t \times LGD_t \times EAD_t \times DF_t$$

where $DF_t$ is the discount factor.

### 5.5.2 IAS 36 Impairment

Recoverable amount:

$$RA = \max(FVLCD, VIU)$$

where:
- $FVLCD$: Fair value less costs of disposal
- $VIU$: Value in use (DCF)

Impairment loss:

$$IL = \max(0, Carrying Amount - RA)$$

### 5.5.3 Climate-Adjusted Impairment

$$RA^{climate} = \max(FVLCD^{climate}, VIU^{climate})$$

where climate adjustments apply to both fair value and value in use calculations.

---

## 5.6 Numerical Example: Oil Company DCF

### 5.6.1 Base Case Parameters

| Parameter | Value |
|-----------|-------|
| Current FCF | $1,000M |
| FCF growth (years 1-5) | 3% |
| FCF growth (years 6-10) | 1% |
| Terminal growth | 0% |
| WACC | 8% |
| Emissions (Mt CO2) | 50 |

### 5.6.2 Carbon Price Scenarios

| Year | Base CP | High CP |
|------|---------|---------|
| 1 | $50 | $50 |
| 5 | $75 | $100 |
| 10 | $100 | $200 |

### 5.6.3 Physical Risk Assumptions

| Hazard | Probability | Damage |
|--------|-------------|--------|
| Hurricane | 5%/year | 2% of assets |
| Flood | 3%/year | 1% of assets |
| Drought | 2%/year | 0.5% of assets |

$$\delta^{physical} = 0.05 \times 0.02 + 0.03 \times 0.01 + 0.02 \times 0.005 = 0.001 + 0.0003 + 0.0001 = 0.0014 = 0.14\%$$

### 5.6.4 DCF Calculation: Base Case

| Year | FCF | Carbon Cost | Adjusted FCF | PV |
|------|-----|-------------|--------------|-----|
| 1 | $1,030M | $2,500M | -$1,470M | -$1,361M |
| 2 | $1,061M | $3,750M | -$2,689M | -$2,305M |
| ... | ... | ... | ... | ... |

**Base case value:** Negative (stranded)

### 5.6.5 DCF Calculation: With Carbon Capture

With $500M/year carbon capture investment, reducing emissions by 80%:

| Year | FCF | Carbon Cost | Capture Cost | Adjusted FCF | PV |
|------|-----|-------------|--------------|--------------|-----|
| 1 | $1,030M | $500M | $500M | $30M | $28M |
| 2 | $1,061M | $750M | $500M | -$189M | -$162M |

### 5.6.6 Impairment Summary

| Scenario | Enterprise Value | Impairment |
|----------|------------------|------------|
| No carbon price | $12,500M | None |
| Base carbon price | -$8,200M | Full impairment |
| With carbon capture | $2,100M | 83% impairment |

---

## 5.7 Python Implementation: Climate DCF Model

```python
import numpy as np

class ClimateDCFModel:
    """
    Climate-adjusted DCF valuation model
    """
    
    def __init__(self, initial_fcf, growth_rates, wacc, terminal_growth,
                 emissions, carbon_price_trajectory, physical_damage_rate=0):
        self.initial_fcf = initial_fcf
        self.growth_rates = growth_rates  # Dict of {year_range: growth_rate}
        self.wacc = wacc
        self.terminal_growth = terminal_growth
        self.emissions = emissions
        self.carbon_prices = carbon_price_trajectory
        self.physical_damage_rate = physical_damage_rate
    
    def project_cash_flows(self, years=10):
        """Project base cash flows"""
        cf = [self.initial_fcf]
        
        for t in range(1, years):
            # Find appropriate growth rate
            growth = 0
            for year_range, rate in self.growth_rates.items():
                if t in year_range:
                    growth = rate
                    break
            
            cf.append(cf[-1] * (1 + growth))
        
        return np.array(cf)
    
    def climate_adjust_cash_flows(self, cash_flows, carbon_capture_efficiency=0):
        """Apply climate adjustments to cash flows"""
        adjusted_cf = []
        
        for t, cf in enumerate(cash_flows):
            # Physical risk adjustment
            cf_adj = cf * (1 - self.physical_damage_rate)
            
            # Carbon cost
            effective_emissions = self.emissions * (1 - carbon_capture_efficiency)
            carbon_cost = effective_emissions * self.carbon_prices[t]
            cf_adj -= carbon_cost
            
            adjusted_cf.append(cf_adj)
        
        return np.array(adjusted_cf)
    
    def calculate_terminal_value(self, final_cf, climate_adjusted=True):
        """Calculate terminal value"""
        if climate_adjusted and final_cf < 0:
            # Stranded asset - no terminal value
            return 0
        
        if self.terminal_growth >= self.wacc:
            raise ValueError("Terminal growth must be less than WACC")
        
        return final_cf * (1 + self.terminal_growth) / (self.wacc - self.terminal_growth)
    
    def enterprise_value(self, years=10, carbon_capture_efficiency=0):
        """Calculate enterprise value"""
        # Project cash flows
        base_cf = self.project_cash_flows(years)
        
        # Climate adjustment
        adj_cf = self.climate_adjust_cash_flows(base_cf, carbon_capture_efficiency)
        
        # Discount factors
        discount_factors = [(1 + self.wacc) ** (t + 1) for t in range(years)]
        
        # PV of explicit period
        pv_explicit = sum([cf / df for cf, df in zip(adj_cf, discount_factors)])
        
        # Terminal value
        tv = self.calculate_terminal_value(adj_cf[-1])
        pv_terminal = tv / discount_factors[-1]
        
        return pv_explicit + pv_terminal, adj_cf, tv
    
    def impairment_test(self, carrying_amount, years=10):
        """Test for impairment under IAS 36"""
        recoverable_amount, _, _ = self.enterprise_value(years)
        
        if recoverable_amount < carrying_amount:
            impairment = carrying_amount - recoverable_amount
            return True, impairment, recoverable_amount
        else:
            return False, 0, recoverable_amount

# Example: Oil company
model = ClimateDCFModel(
    initial_fcf=1000,
    growth_rates={range(0, 5): 0.03, range(5, 10): 0.01},
    wacc=0.08,
    terminal_growth=0.0,
    emissions=50,  # Mt CO2
    carbon_price_trajectory=[50, 55, 62, 70, 80, 90, 100, 115, 130, 150],
    physical_damage_rate=0.0014
)

# Base case
ev_base, cf_base, tv_base = model.enterprise_value()
print(f"Base EV: ${ev_base:.0f}M")

# With 80% carbon capture
ev_cc, cf_cc, tv_cc = model.enterprise_value(carbon_capture_efficiency=0.80)
print(f"With carbon capture EV: ${ev_cc:.0f}M")

# Impairment test
carrying = 12500
impaired, impairment, ra = model.impairment_test(carrying)
print(f"\nImpairment test (carrying: ${carrying}M):")
print(f"Recoverable amount: ${ra:.0f}M")
print(f"Impairment required: {impaired}, Amount: ${impairment:.0f}M")
```

---

# 6. Correlation Modeling for Physical-Transition Risk

## 6.1 Joint Distribution Specification

### 6.1.1 Physical and Transition Risk Variables

Define:
- $X_P$: Physical risk loss random variable
- $X_T$: Transition risk loss random variable

### 6.1.2 Marginal Distributions

**Physical risk (often heavy-tailed):**
$$X_P \sim \text{Generalized Pareto}(\xi_P, \sigma_P, \mu_P)$$

or

$$X_P \sim \text{LogNormal}(\mu_P, \sigma_P^2)$$

**Transition risk:**
$$X_T \sim \text{Normal}(\mu_T, \sigma_T^2)$$

or

$$X_T \sim \text{LogNormal}(\mu_T, \sigma_T^2)$$

### 6.1.3 Joint Distribution

The joint CDF:

$$F_{P,T}(x_P, x_T) = C(F_P(x_P), F_T(x_T); \theta)$$

where $C(\cdot, \cdot; \theta)$ is a copula with parameter $\theta$.

---

## 6.2 Copula-Based Dependency Structure

### 6.2.1 Gaussian Copula

$$C(u, v; \rho) = \Phi_2(\Phi^{-1}(u), \Phi^{-1}(v); \rho)$$

where:
- $\Phi_2$: Bivariate normal CDF
- $\Phi^{-1}$: Inverse standard normal CDF
- $\rho$: Correlation parameter

### 6.2.2 Student-t Copula

$$C(u, v; \rho, \nu) = t_{2,\nu}(t_\nu^{-1}(u), t_\nu^{-1}(v); \rho)$$

where:
- $t_{2,\nu}$: Bivariate t CDF with $\nu$ degrees of freedom
- $t_\nu^{-1}$: Inverse univariate t CDF

The t-copula captures tail dependence:

$$\lambda_{lower} = \lambda_{upper} = 2t_{\nu+1}\left(-\sqrt{\frac{(\nu+1)(1-\rho)}{1+\rho}}\right)$$

### 6.2.3 Archimedean Copulas

**Clayton Copula** (lower tail dependence):
$$C(u, v; \theta) = (u^{-\theta} + v^{-\theta} - 1)^{-1/\theta}, \quad \theta > 0$$

Tail dependence: $\lambda_{lower} = 2^{-1/\theta}$, $\lambda_{upper} = 0$

**Gumbel Copula** (upper tail dependence):
$$C(u, v; \theta) = \exp\left(-[(-\ln u)^\theta + (-\ln v)^\theta]^{1/\theta}\right), \quad \theta \geq 1$$

Tail dependence: $\lambda_{lower} = 0$, $\lambda_{upper} = 2 - 2^{1/\theta}$

---

## 6.3 Physical-Transition Correlation Structure

### 6.3.1 Direct Correlation Effects

Physical and transition risks may be:
- **Positively correlated**: Physical damages increase transition costs
- **Negatively correlated**: Transition reduces physical exposure
- **Conditionally correlated**: Correlation depends on scenario

### 6.3.2 Correlation Matrix Specification

For a portfolio with $n$ assets:

$$\mathbf{\Sigma} = \begin{pmatrix} \mathbf{\Sigma}_{PP} & \mathbf{\Sigma}_{PT} \\ \mathbf{\Sigma}_{TP} & \mathbf{\Sigma}_{TT} \end{pmatrix}$$

where:
- $\mathbf{\Sigma}_{PP}$: Physical-physical correlations
- $\mathbf{\Sigma}_{TT}$: Transition-transition correlations
- $\mathbf{\Sigma}_{PT} = \mathbf{\Sigma}_{TP}'$: Physical-transition correlations

### 6.3.3 Block Correlation Structure

For sector $s$ and asset $i$:

$$\rho_{(s,i), (s',j)}^{PT} = \rho_{sector}^{PT} \times \rho_{asset}^{PT} \times \mathbf{1}_{\{s=s'\}}$$

---

## 6.4 Avoiding Double-Counting

### 6.4.1 Conditional Probability Framework

Express transition risk conditional on physical event:

$$\mathbb{P}(X_T | X_P) = \frac{\mathbb{P}(X_T \cap X_P)}{\mathbb{P}(X_P)}$$

### 6.4.2 Additive vs. Multiplicative Combination

**Additive (with correlation adjustment):**
$$L_{total} = L_P + L_T - \rho_{PT} \sqrt{L_P L_T}$$

**Multiplicative:**
$$L_{total} = 1 - (1 - L_P)(1 - L_T) = L_P + L_T - L_P L_T$$

### 6.4.3 Copula-Based Aggregation

$$F_{total}(x) = \int\int \mathbf{1}_{\{x_P + x_T \leq x\}} dC(F_P(x_P), F_T(x_T))$$

---

## 6.5 Scenario-Conditional Correlation Matrices

### 6.5.1 Scenario-Dependent Correlations

Define correlation by scenario $s$:

$$\mathbf{\Sigma}^{(s)} = \begin{pmatrix} \mathbf{\Sigma}_{PP}^{(s)} & \mathbf{\Sigma}_{PT}^{(s)} \\ \mathbf{\Sigma}_{TP}^{(s)} & \mathbf{\Sigma}_{TT}^{(s)} \end{pmatrix}$$

### 6.5.2 NGFS Scenario Correlations

| Scenario | $\rho_{PT}$ | Rationale |
|----------|-------------|-----------|
| Net Zero 2050 | -0.3 | Rapid transition reduces physical |
| Delayed Transition | +0.4 | Late action causes both |
| NDCs | 0.0 | Independent effects |
| Current Policies | +0.2 | Limited action, both worsen |
| Fragmented World | +0.5 | Uncoordinated, both severe |

### 6.5.3 Time-Varying Correlations

$$\rho_{PT}(t) = \rho_0 + \alpha t + \beta \sin(2\pi t / T_{cycle})$$

---

## 6.6 Numerical Example: Portfolio Correlation Analysis

### 6.6.1 Portfolio Composition

| Asset | Sector | Physical Exposure | Transition Exposure |
|-------|--------|-------------------|---------------------|
| A | Coal | High | High |
| B | Renewables | Low | Low |
| C | Real Estate | High | Medium |
| D | Tech | Low | Low |

### 6.6.2 Correlation Matrix

$$\mathbf{\Sigma} = \begin{pmatrix} 
1.00 & 0.30 & 0.50 & 0.10 & 0.80 & 0.20 & 0.60 & 0.40 \\
0.30 & 1.00 & 0.20 & 0.40 & 0.20 & 0.90 & 0.30 & 0.50 \\
0.50 & 0.20 & 1.00 & 0.30 & 0.60 & 0.30 & 0.85 & 0.45 \\
0.10 & 0.40 & 0.30 & 1.00 & 0.10 & 0.40 & 0.20 & 0.70 \\
0.80 & 0.20 & 0.60 & 0.10 & 1.00 & 0.25 & 0.70 & 0.35 \\
0.20 & 0.90 & 0.30 & 0.40 & 0.25 & 1.00 & 0.35 & 0.60 \\
0.60 & 0.30 & 0.85 & 0.20 & 0.70 & 0.35 & 1.00 & 0.50 \\
0.40 & 0.50 & 0.45 & 0.70 & 0.35 & 0.60 & 0.50 & 1.00 \\
\end{pmatrix}$$

Block structure: $[PP, PT; TP, TT]$

### 6.6.3 Portfolio Loss Distribution

Using Gaussian copula with 10,000 simulations:

| Metric | Physical Only | Transition Only | Combined |
|--------|---------------|-----------------|----------|
| Mean | $50M | $30M | $75M |
| Std Dev | $25M | $15M | $35M |
| VaR 95% | $95M | $58M | $145M |
| CVaR 95% | $115M | $72M | $175M |

### 6.6.4 Correlation Impact

| $\rho_{PT}$ | Portfolio VaR | Change |
|-------------|---------------|--------|
| -0.5 | $120M | -17% |
| 0.0 | $135M | -7% |
| 0.3 | $145M | Base |
| 0.5 | $155M | +7% |
| 0.8 | $170M | +17% |

---

## 6.7 Python Implementation: Correlation Model

```python
import numpy as np
from scipy.stats import norm, multivariate_normal, t
from scipy.integrate import dblquad

class ClimateCorrelationModel:
    """
    Physical-transition risk correlation modeling
    """
    
    def __init__(self, n_assets, physical_exposure, transition_exposure):
        self.n_assets = n_assets
        self.physical_exp = np.array(physical_exposure)
        self.transition_exp = np.array(transition_exposure)
    
    def build_correlation_matrix(self, rho_PP, rho_TT, rho_PT, sector_map=None):
        """
        Build full correlation matrix
        rho_PP: Physical-physical correlation
        rho_TT: Transition-transition correlation
        rho_PT: Physical-transition correlation
        """
        n = self.n_assets
        Sigma = np.eye(2 * n)
        
        # Physical-physical block
        for i in range(n):
            for j in range(i+1, n):
                if sector_map and sector_map[i] == sector_map[j]:
                    Sigma[i, j] = Sigma[j, i] = rho_PP * 1.5  # Same sector
                else:
                    Sigma[i, j] = Sigma[j, i] = rho_PP * 0.5  # Different sector
        
        # Transition-transition block
        for i in range(n):
            for j in range(i+1, n):
                if sector_map and sector_map[i] == sector_map[j]:
                    Sigma[n+i, n+j] = Sigma[n+j, n+i] = rho_TT * 1.5
                else:
                    Sigma[n+i, n+j] = Sigma[n+j, n+i] = rho_TT * 0.5
        
        # Physical-transition block
        for i in range(n):
            for j in range(n):
                Sigma[i, n+j] = Sigma[n+j, i] = rho_PT * np.sqrt(
                    self.physical_exp[i] * self.transition_exp[j]
                )
        
        # Ensure positive semi-definite
        eigenvalues = np.linalg.eigvalsh(Sigma)
        if np.min(eigenvalues) < 0:
            Sigma += np.eye(2*n) * (abs(np.min(eigenvalues)) + 0.01)
        
        return Sigma
    
    def gaussian_copula_sample(self, Sigma, n_samples=10000):
        """Generate samples from Gaussian copula"""
        # Generate multivariate normal
        Z = multivariate_normal.rvs(mean=np.zeros(2*self.n_assets), 
                                     cov=Sigma, size=n_samples)
        
        # Transform to uniform
        U = norm.cdf(Z)
        
        return U
    
    def t_copula_sample(self, Sigma, df, n_samples=10000):
        """Generate samples from Student-t copula"""
        # Generate multivariate t
        Z = multivariate_t.rvs(shape=Sigma, df=df, size=n_samples)
        
        # Transform to uniform
        U = t.cdf(Z, df=df)
        
        return U
    
    def simulate_losses(self, Sigma, physical_dist, transition_dist, n_samples=10000):
        """
        Simulate correlated losses
        physical_dist: Dict with {'type': 'lognormal', 'mu': x, 'sigma': y}
        transition_dist: Dict with distribution parameters
        """
        U = self.gaussian_copula_sample(Sigma, n_samples)
        
        # Transform to physical losses
        if physical_dist['type'] == 'lognormal':
            physical_losses = np.exp(
                physical_dist['mu'] + physical_dist['sigma'] * norm.ppf(U[:, :self.n_assets])
            )
        elif physical_dist['type'] == 'pareto':
            # Simplified Pareto transformation
            physical_losses = physical_dist['scale'] / (1 - U[:, :self.n_assets]) ** (1/physical_dist['shape'])
        
        # Transform to transition losses
        if transition_dist['type'] == 'normal':
            transition_losses = (transition_dist['mu'] + 
                                transition_dist['sigma'] * norm.ppf(U[:, self.n_assets:]))
        elif transition_dist['type'] == 'lognormal':
            transition_losses = np.exp(
                transition_dist['mu'] + transition_dist['sigma'] * norm.ppf(U[:, self.n_assets:])
            )
        
        # Total losses
        total_losses = np.sum(physical_losses, axis=1) + np.sum(transition_losses, axis=1)
        
        return physical_losses, transition_losses, total_losses
    
    def calculate_var_cvar(self, losses, alpha=0.95):
        """Calculate VaR and CVaR"""
        var = np.percentile(losses, alpha * 100)
        cvar = np.mean(losses[losses >= var])
        return var, cvar

# Example usage
model = ClimateCorrelationModel(
    n_assets=4,
    physical_exposure=[0.8, 0.2, 0.7, 0.3],
    transition_exposure=[0.9, 0.1, 0.5, 0.2]
)

Sigma = model.build_correlation_matrix(
    rho_PP=0.5, rho_TT=0.4, rho_PT=0.3,
    sector_map=[0, 1, 0, 1]
)

physical_dist = {'type': 'lognormal', 'mu': 2, 'sigma': 0.5}
transition_dist = {'type': 'normal', 'mu': 50, 'sigma': 20}

p_losses, t_losses, total = model.simulate_losses(Sigma, physical_dist, transition_dist, 50000)

var, cvar = model.calculate_var_cvar(total)
print(f"Portfolio VaR (95%): ${var:.0f}M")
print(f"Portfolio CVaR (95%): ${cvar:.0f}M")

# Correlation sensitivity
print("\nCorrelation Sensitivity:")
for rho_pt in [-0.5, 0, 0.3, 0.5, 0.8]:
    Sigma_test = model.build_correlation_matrix(0.5, 0.4, rho_pt)
    _, _, total_test = model.simulate_losses(Sigma_test, physical_dist, transition_dist, 10000)
    var_test, _ = model.calculate_var_cvar(total_test)
    print(f"rho_PT = {rho_pt:+.1f}: VaR = ${var_test:.0f}M")
```

---

# 7. Integrated Framework and Regulatory Alignment

## 7.1 Basel IV Integration

### 7.1.1 Standardized Approach (SA)

Credit risk capital requirements:

$$K = RW \cdot EAD \cdot \frac{1}{0.5 \cdot (1 + e^{-50 \cdot PD})}$$

Climate-adjusted risk weights:

$$RW^{climate} = RW \times (1 + \beta_{climate} \cdot CRS)$$

### 7.1.2 Internal Ratings-Based (IRB) Approach

$$K = LGD \cdot \Phi\left(\frac{\Phi^{-1}(PD) + \sqrt{\rho}\Phi^{-1}(0.999)}{\sqrt{1-\rho}}\right) - PD \cdot LGD$$

Climate-adjusted:

$$K^{climate} = LGD^{climate} \cdot \Phi\left(\frac{\Phi^{-1}(PD^{climate}) + \sqrt{\rho^{climate}}\Phi^{-1}(0.999)}{\sqrt{1-\rho^{climate}}}\right) - PD^{climate} \cdot LGD^{climate}$$

---

## 7.2 IFRS 9 / CECL Expected Credit Loss

### 7.2.1 Three-Stage Model

Stage 1 (12-month ECL):
$$ECL_1 = 12m\_PD \times LGD \times EAD \times DF$$

Stage 2 (Lifetime ECL):
$$ECL_2 = Lifetime\_PD \times LGD \times EAD \times DF$$

Stage 3 (Credit-impaired):
$$ECL_3 = (1 - Recovery) \times EAD$$

### 7.2.2 Climate-Adjusted ECL

$$ECL^{climate} = \sum_{scenarios} w_s \cdot ECL^{(s)}$$

where scenarios include climate pathways.

---

## 7.3 NGFS Scenario Alignment

### 7.3.1 Scenario Matrix

| Scenario | Carbon Price 2030 | Warming | Physical Risk | Transition Risk |
|----------|-------------------|---------|---------------|-----------------|
| Net Zero 2050 | $150/tCO2 | 1.5°C | Low | High |
| Delayed Transition | $80/tCO2 | 2.0°C | Medium | Medium-High |
| NDCs | $50/tCO2 | 2.5°C | Medium | Medium |
| Current Policies | $25/tCO2 | 3.0°C | High | Low |

### 7.3.2 Scenario Probability Weighting

$$ECL^{NGFS} = \sum_{s} p_s \cdot ECL^{(s)}$$

---

# 8. Summary and Model Integration

## 8.1 Model Interconnections

```
┌─────────────────────────────────────────────────────────────────┐
│                 CLIMATE RISK DATA INPUTS                        │
│  (Emissions, Policy, Physical Hazards, Technology, Litigation)  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   MERTON      │   │   SOVEREIGN   │   │    MBS/CMBS   │
│   MODEL       │   │   YIELD CURVE │   │   SPATIAL     │
│               │   │               │   │   MODEL       │
│  PD, LGD, ECL │   │  Term Premium │   │  Pool Loss    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CORRELATION & AGGREGATION LAYER                │
│         (Copula, Joint Distributions, Portfolio)            │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  REAL OPTIONS │   │  DCF MODEL    │   │   REGULATORY  │
│  ANALYSIS     │   │  IMPAIRMENT   │   │   CAPITAL     │
│               │   │               │   │               │
│  Stranding    │   │  Fair Value   │   │  RWA, ECL,    │
│  Timing       │   │  Adjustment   │   │  Provisions   │
└───────────────┘   └───────────────┘   └───────────────┘
```

## 8.2 Key Mathematical Relationships

| Model | Core Formula | Climate Adjustment |
|-------|--------------|-------------------|
| Merton PD | $\Phi(-DD)$ | $\sigma_V \to \sigma_V^{climate}$ |
| Sovereign Yield | $y(\tau) = NS(\beta, \lambda)$ | $y^{climate} = y + \gamma \cdot CE$ |
| MBS Loss | $L = \sum L_i \cdot \mathbf{1}_{Default_i}$ | $PD_i \to PD_i^{climate}$ |
| Real Options | Binomial tree | $\sigma \to \sigma^{climate}$ |
| DCF | $\sum CF_t / (1+r)^t$ | $CF_t \to CF_t^{climate}$ |
| Correlation | Copula $C(u,v;\rho)$ | $\rho \to \rho^{scenario}$ |

---

# Appendix: Complete Mathematical Reference

## A.1 Stochastic Calculus Reference

**Itô's Lemma:**
For $Y_t = f(t, X_t)$ where $dX_t = \mu dt + \sigma dW_t$:

$$df = \left(\frac{\partial f}{\partial t} + \mu\frac{\partial f}{\partial x} + \frac{1}{2}\sigma^2\frac{\partial^2 f}{\partial x^2}\right)dt + \sigma\frac{\partial f}{\partial x}dW_t$$

**Girsanov Theorem:**
Measure change from $\mathbb{P}$ to $\mathbb{Q}$:

$$\frac{d\mathbb{Q}}{d\mathbb{P}} = \exp\left(-\int_0^T \theta_t dW_t^\mathbb{P} - \frac{1}{2}\int_0^T \theta_t^2 dt\right)$$

## A.2 Copula Reference

**Sklar's Theorem:**
For any joint CDF $F$ with marginals $F_1, ..., F_d$:

$$F(x_1, ..., x_d) = C(F_1(x_1), ..., F_d(x_d))$$

**Kendall's Tau:**
$$\tau = 4\int_0^1\int_0^1 C(u,v) dC(u,v) - 1$$

**Spearman's Rho:**
$$\rho_S = 12\int_0^1\int_0^1 C(u,v) dudv - 3$$

---

*Document Version: 1.0*
*Generated: Task 2B - Multi-Sector Asset Valuation Engine*
*Framework: Climate-Integrated Quantitative Financial Risk Models*
