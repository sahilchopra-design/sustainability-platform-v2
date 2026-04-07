# Task 1: Foundational Framework & Macro-Transmission
## Quantitative Financial Risk Modeling for Climate Hazard Integration

**Agent 2: Quant Financial Risk Modeler**  
**AA Impact Inc.**  
*Coordinated with Agent 5: Regulatory & Compliance Specialist*

---

## Executive Summary

This document establishes the end-to-end quantitative framework coupling climate hazard data with financial risk models. The framework integrates NGFS Phase 4 scenarios, Vector Autoregression (VAR) models, Dynamic Stochastic General Equilibrium (DSGE) structures, and macro-to-micro transmission channels to deliver regulatory-compliant climate risk assessments.

---

# Section 1: NGFS Phase 4 Scenario Integration

## 1.1 Scenario Overview and Taxonomy

The Network for Greening the Financial System (NGFS) Phase 4 scenarios provide six distinct pathways for climate and economic futures. Each scenario is characterized by a unique combination of physical and transition risk intensities.

### 1.1.1 Scenario Classification Matrix

| Scenario | Transition Risk | Physical Risk | Carbon Price Path | Temperature Outcome |
|----------|----------------|---------------|-------------------|---------------------|
| **Current Policies (CP)** | Low → Medium | High | Gradual, limited | ~3.0°C by 2100 |
| **NDCs** | Medium | Medium-High | Moderate increase | ~2.6°C by 2100 |
| **Net Zero 2050 (NZ2050)** | High (front-loaded) | Low | Sharp early rise | ~1.5°C by 2100 |
| **Below 2°C (B2DS)** | Medium-High | Low-Medium | Steady increase | <2.0°C by 2100 |
| **Delayed Transition (DT)** | Very High (back-loaded) | Medium-High | Delayed then sharp | ~2.0°C by 2100 |
| **Fragmented World (FW)** | Uncoordinated | High | Regional divergence | ~2.8°C by 2100 |

## 1.2 Mathematical Specification of Scenario Variables

### 1.2.1 GDP Path Dynamics

For each scenario $s \in \{CP, NDC, NZ2050, B2DS, DT, FW\}$, the GDP trajectory follows a stochastic growth model with climate damage:

$$\frac{dY_t^{(s)}}{Y_t^{(s)}} = \left(g_t^{(s)} - \delta_t^{(s)}(T_t, \tau_t)\right)dt + \sigma_Y^{(s)}dW_t^Y$$

Where:
- $Y_t^{(s)}$: Real GDP under scenario $s$ at time $t$
- $g_t^{(s)}$: Baseline growth rate (scenario-dependent)
- $\delta_t^{(s)}(T_t, \tau_t)$: Climate damage function
- $\sigma_Y^{(s)}$: GDP volatility parameter
- $W_t^Y$: Standard Brownian motion

The climate damage function decomposes into physical and transition components:

$$\delta_t^{(s)}(T_t, \tau_t) = \delta_t^{phys}(T_t) + \delta_t^{trans}(\tau_t)$$

**Physical damage component:**

$$\delta_t^{phys}(T_t) = \theta_0 + \theta_1 T_t + \theta_2 T_t^2 + \theta_3 T_t^{\phi}$$

Where $T_t$ represents global mean temperature anomaly (°C above pre-industrial), and $\phi > 2$ captures catastrophic tail risks.

**Transition damage component:**

$$\delta_t^{trans}(\tau_t) = \gamma_0 \cdot \mathbb{1}_{\{\tau_t > \bar{\tau}\}} \cdot \left(\frac{\tau_t - \bar{\tau}}{\bar{\tau}}\right)^{\psi}$$

Where $\tau_t$ is the carbon price and $\bar{\tau}$ is the critical threshold for economic disruption.

### 1.2.2 Carbon Price Trajectory Specification

The carbon price under scenario $s$ follows a regime-switching process:

$$\tau_t^{(s)} = \begin{cases}
\tau_0^{(s)} \cdot e^{\mu_{\tau}^{(s)} t + \sigma_{\tau}^{(s)} W_t^{\tau}} & \text{if } t < t_{policy}^{(s)} \\
\tau_{jump}^{(s)} + \tau_0^{(s)} \cdot e^{\mu_{\tau}^{(s),post} (t-t_{policy}^{(s)})} & \text{if } t \geq t_{policy}^{(s)}
\end{cases}$$

**Scenario-specific carbon price parameters:**

| Scenario | $\tau_0$ ($/tCO2) | $\mu_{\tau}$ | $t_{policy}$ | $\tau_{2050}$ ($/tCO2) |
|----------|-------------------|---------------|--------------|------------------------|
| CP | 5 | 0.02 | N/A | ~25 |
| NDC | 15 | 0.04 | 2030 | ~75 |
| NZ2050 | 50 | 0.08 | 2025 | ~250 |
| B2DS | 30 | 0.06 | 2025 | ~180 |
| DT | 10 | 0.12 (post-2035) | 2035 | ~300 |
| FW | Regional | Variable | Variable | 20-150 |

### 1.2.3 Energy Mix Transition Dynamics

The energy sector transformation is modeled through share equations:

$$E_{j,t}^{(s)} = E_{total,t}^{(s)} \cdot \omega_{j,t}^{(s)}$$

Where $\omega_{j,t}^{(s)}$ represents the share of energy source $j$ under scenario $s$:

$$\omega_{j,t}^{(s)} = \frac{\omega_{j,0}^{(s)} \cdot e^{\eta_j^{(s)} t}}{\sum_{k} \omega_{k,0}^{(s)} \cdot e^{\eta_k^{(s)} t}}$$

The transition elasticity $\eta_j^{(s)}$ is carbon-price dependent:

$$\eta_j^{(s)} = \bar{\eta}_j + \beta_j \cdot \ln(1 + \tau_t^{(s)})$$

For fossil fuels ($j \in \{coal, oil, gas\}$): $\beta_j < 0$  
For renewables ($j \in \{solar, wind, hydro, nuclear\}$): $\beta_j > 0$

## 1.3 Scenario Probability Weighting and Ensemble Methods

### 1.3.1 Bayesian Scenario Weighting

Given expert judgment and historical data, we assign prior probabilities to scenarios:

$$\pi^{(s)} = P(\text{Scenario } s \text{ occurs})$$

With $\sum_{s=1}^{6} \pi^{(s)} = 1$

**Prior probability distribution (baseline):**

| Scenario | Prior Probability $\pi^{(s)}$ |
|----------|------------------------------|
| Current Policies | 0.25 |
| NDCs | 0.20 |
| Net Zero 2050 | 0.15 |
| Below 2°C | 0.15 |
| Delayed Transition | 0.15 |
| Fragmented World | 0.10 |

### 1.3.2 Posterior Probability Updating

Using Bayes' theorem with observed macroeconomic indicators $Z_t$:

$$\pi^{(s)}|Z_t = \frac{f(Z_t|\theta^{(s)}) \cdot \pi^{(s)}}{\sum_{k=1}^{6} f(Z_t|\theta^{(k)}) \cdot \pi^{(k)}}$$

Where $f(Z_t|\theta^{(s)})$ is the likelihood function under scenario parameters $\theta^{(s)}$.

### 1.3.3 Ensemble Scenario Construction

The ensemble expectation for any variable $X$:

$$\mathbb{E}^{ensemble}[X_t] = \sum_{s=1}^{6} \pi_t^{(s)} \cdot \mathbb{E}[X_t^{(s)}]$$

**Ensemble variance (accounting for scenario uncertainty):**

$$Var^{ensemble}[X_t] = \underbrace{\sum_{s=1}^{6} \pi_t^{(s)} \cdot Var[X_t^{(s)}]}_{\text{Within-scenario variance}} + \underbrace{\sum_{s=1}^{6} \pi_t^{(s)} \cdot \left(\mathbb{E}[X_t^{(s)}] - \mathbb{E}^{ensemble}[X_t]\right)^2}_{\text{Between-scenario variance}}$$

### 1.3.4 Risk-Adjusted Scenario Weighting

For risk management applications, we apply spectral risk measures:

$$\rho_{\phi}(X_t) = \int_0^1 \phi(u) \cdot F_{X_t}^{-1}(u) \, du$$

Where $\phi(u)$ is a risk spectrum function satisfying:
- $\phi(u) \geq 0$
- $\int_0^1 \phi(u) \, du = 1$
- $\phi'(u) \geq 0$ (risk-aversion)

For Expected Shortfall at confidence level $\alpha$:

$$\phi(u) = \frac{1}{\alpha} \cdot \mathbb{1}_{\{u \leq \alpha\}}$$

---

# Section 2: Vector Autoregression (VAR) Model Specification

## 2.1 Full VAR(p) Formulation

The climate-macroeconomic system is modeled as a Vector Autoregression of order $p$:

$$\boxed{Y_t = c + \sum_{i=1}^{p} A_i Y_{t-i} + \epsilon_t}$$

### 2.1.1 State Vector Definition

$$Y_t = \begin{bmatrix}
GDP_t \\
CPI_t \\
CarbonPrice_t \\
EnergyConsumption_t \\
Unemployment_t \\
PolicyRate_t \\
CreditSpread_t \\
EquityIndex_t
\end{bmatrix}$$

Where:
- $GDP_t$: Log real GDP (deviation from trend)
- $CPI_t$: Consumer price inflation rate
- $CarbonPrice_t$: Log carbon price ($/tCO2)
- $EnergyConsumption_t$: Log total energy consumption
- $Unemployment_t$: Unemployment rate
- $PolicyRate_t$: Central bank policy rate
- $CreditSpread_t$: Corporate credit spread (BAA-AAA)
- $EquityIndex_t$: Log equity market index

### 2.1.2 Expanded VAR Form

$$\begin{bmatrix}
GDP_t \\
CPI_t \\
CarbonPrice_t \\
EnergyConsumption_t \\
Unemployment_t \\
PolicyRate_t \\
CreditSpread_t \\
EquityIndex_t
\end{bmatrix} = \begin{bmatrix}
c_1 \\
c_2 \\
c_3 \\
c_4 \\
c_5 \\
c_6 \\
c_7 \\
c_8
\end{bmatrix} + \sum_{i=1}^{p} \begin{bmatrix}
a_{11}^{(i)} & a_{12}^{(i)} & \cdots & a_{18}^{(i)} \\
a_{21}^{(i)} & a_{22}^{(i)} & \cdots & a_{28}^{(i)} \\
\vdots & \vdots & \ddots & \vdots \\
a_{81}^{(i)} & a_{82}^{(i)} & \cdots & a_{88}^{(i)}
\end{bmatrix} \begin{bmatrix}
GDP_{t-i} \\
CPI_{t-i} \\
CarbonPrice_{t-i} \\
EnergyConsumption_{t-i} \\
Unemployment_{t-i} \\
PolicyRate_{t-i} \\
CreditSpread_{t-i} \\
EquityIndex_{t-i}
\end{bmatrix} + \begin{bmatrix}
\epsilon_{1,t} \\
\epsilon_{2,t} \\
\epsilon_{3,t} \\
\epsilon_{4,t} \\
\epsilon_{5,t} \\
\epsilon_{6,t} \\
\epsilon_{7,t} \\
\epsilon_{8,t}
\end{bmatrix}$$

### 2.1.3 Error Structure

The error term follows a multivariate normal distribution:

$$\epsilon_t \sim N(0, \Sigma_{\epsilon})$$

Where the covariance matrix:

$$\Sigma_{\epsilon} = \begin{bmatrix}
\sigma_1^2 & \sigma_{12} & \cdots & \sigma_{18} \\
\sigma_{21} & \sigma_2^2 & \cdots & \sigma_{28} \\
\vdots & \vdots & \ddots & \vdots \\
\sigma_{81} & \sigma_{82} & \cdots & \sigma_8^2
\end{bmatrix}$$

For time-varying volatility (stochastic volatility extension):

$$\epsilon_t = H_t^{1/2} \cdot z_t, \quad z_t \sim N(0, I)$$

$$vech(H_t) = c_H + \sum_{j=1}^{q} B_j \cdot vech(H_{t-j}) + \sum_{j=1}^{r} C_j \cdot vech(\epsilon_{t-j}\epsilon_{t-j}')$$

## 2.2 Lag Order Selection Criteria

### 2.2.1 Information Criteria

**Akaike Information Criterion (AIC):**

$$AIC(p) = \ln|\hat{\Sigma}_{\epsilon}(p)| + \frac{2pn^2}{T}$$

**Bayesian Information Criterion (BIC/Schwarz):**

$$BIC(p) = \ln|\hat{\Sigma}_{\epsilon}(p)| + \frac{pn^2 \ln(T)}{T}$$

**Hannan-Quinn Criterion (HQ):**

$$HQ(p) = \ln|\hat{\Sigma}_{\epsilon}(p)| + \frac{2pn^2 \ln(\ln(T))}{T}$$

Where:
- $n = 8$ (number of variables)
- $T$ = sample size
- $\hat{\Sigma}_{\epsilon}(p)$ = residual covariance matrix with lag order $p$

### 2.2.2 Selection Algorithm

$$p^* = \arg\min_{p \in \{1, 2, ..., p_{max}\}} IC(p)$$

Typical maximum lag: $p_{max} = 12$ for monthly data, $p_{max} = 4$ for quarterly data.

### 2.2.3 Diagnostic Tests for Lag Selection

**LM Test for Serial Correlation:**

$$LM_{SC}(h) = T \cdot tr(\hat{\Sigma}_{\epsilon}^{-1}\hat{\Sigma}_{\epsilon,h}) \sim \chi^2(hn^2)$$

**Jarque-Bera Multivariate Normality Test:**

$$JB_{MV} = T \left[\frac{b_1^2}{6} + \frac{(b_2-3)^2}{24}\right]$$

Where $b_1$ and $b_2$ are multivariate skewness and kurtosis measures.

## 2.3 Granger Causality Testing

### 2.3.1 Climate-Macro Granger Causality

**Test: Does Carbon Price Granger-cause GDP?**

Null hypothesis: $H_0: a_{13}^{(i)} = 0$ for all $i = 1, ..., p$

Alternative: $H_1: \exists i$ such that $a_{13}^{(i)} \neq 0$

**F-statistic:**

$$F_{CP \to GDP} = \frac{(RSS_R - RSS_{UR})/p}{RSS_{UR}/(T - 2p - 1)} \sim F(p, T-2p-1)$$

Where:
- $RSS_R$ = restricted model residual sum of squares
- $RSS_{UR}$ = unrestricted model residual sum of squares

### 2.3.2 Climate Causality Matrix

| Causality Direction | Null Hypothesis | Test Statistic |
|--------------------|-----------------|----------------|
| Carbon Price → GDP | $a_{13}^{(i)} = 0 \, \forall i$ | $F_{CP \to GDP}$ |
| Carbon Price → CPI | $a_{23}^{(i)} = 0 \, \forall i$ | $F_{CP \to CPI}$ |
| Carbon Price → Unemployment | $a_{53}^{(i)} = 0 \, \forall i$ | $F_{CP \to U}$ |
| GDP → Carbon Price | $a_{31}^{(i)} = 0 \, \forall i$ | $F_{GDP \to CP}$ |
| Energy → Credit Spread | $a_{74}^{(i)} = 0 \, \forall i$ | $F_{E \to CS}$ |
| Policy Rate → Carbon Price | $a_{36}^{(i)} = 0 \, \forall i$ | $F_{PR \to CP}$ |

### 2.3.3 Block Exogeneity Test

For testing joint causality from climate block to macro block:

$$Y_t = \begin{bmatrix} Y_t^{macro} \\ Y_t^{climate} \end{bmatrix}$$

Test $H_0: A_{12}^{(i)} = 0$ for all $i$, where $A_{12}$ represents cross-block coefficients.

$$LR = T(\ln|\hat{\Sigma}_R| - \ln|\hat{\Sigma}_{UR}|) \sim \chi^2(p \cdot n_{macro} \cdot n_{climate})$$

## 2.4 Impulse Response Functions

### 2.4.1 Carbon Price Shock Impulse Response

The impulse response function traces the effect of a one-standard-deviation shock to carbon price:

$$IRF_{j,CP}(h) = \frac{\partial Y_{j,t+h}}{\partial \epsilon_{CP,t}}$$

**MA(∞) Representation:**

$$Y_t = \mu + \sum_{i=0}^{\infty} \Phi_i \epsilon_{t-i}$$

Where $\Phi_i$ are computed recursively:

$$\Phi_i = \sum_{j=1}^{i} \Phi_{i-j} A_j, \quad \Phi_0 = I$$

**Impulse response at horizon $h$:**

$$IRF(h) = \Phi_h \cdot \Sigma_{\epsilon}^{1/2}$$

### 2.4.2 Orthogonalized Impulse Responses (OIRF)

Using Cholesky decomposition $\Sigma_{\epsilon} = PP'$:

$$OIRF(h) = \Phi_h P$$

Ordering matters: Climate variables typically ordered first if they are more exogenous.

**Suggested ordering for climate-macroeconomic VAR:**
1. Carbon Price (most exogenous)
2. Energy Consumption
3. GDP
4. Unemployment
5. CPI
6. Policy Rate
7. Credit Spread
8. Equity Index

### 2.4.3 Generalized Impulse Responses (GIRF)

Invariant to ordering:

$$GIRF_{j,CP}(h) = \frac{\Phi_h \Sigma_{\epsilon} e_{CP}}{\sqrt{e_{CP}' \Sigma_{\epsilon} e_{CP}}}$$

Where $e_{CP}$ is a selection vector for carbon price.

### 2.4.4 Accumulated Impulse Responses

For cumulative effects (e.g., on GDP level):

$$AIRF_{j,CP}(H) = \sum_{h=0}^{H} IRF_{j,CP}(h)$$

## 2.5 Confidence Interval Construction via Bootstrap

### 2.5.1 Recursive Bootstrap Method

**Step 1:** Estimate VAR(p) and obtain residuals $\hat{\epsilon}_t$ and coefficients $\hat{A}_i$.

**Step 2:** Center residuals: $\tilde{\epsilon}_t = \hat{\epsilon}_t - \bar{\hat{\epsilon}}$

**Step 3:** Generate bootstrap sample:

$$Y_t^* = \hat{c} + \sum_{i=1}^{p} \hat{A}_i Y_{t-i}^* + \epsilon_t^*$$

Where $\epsilon_t^*$ is drawn with replacement from $\{\tilde{\epsilon}_t\}_{t=1}^{T}$.

**Step 4:** Re-estimate VAR on $Y_t^*$ and compute IRFs.

**Step 5:** Repeat $B$ times (typically $B = 2,000$).

### 2.5.2 Confidence Interval Methods

**Percentile Method:**

$$CI_{1-\alpha}^{perc}(h) = [IRF^{*(\alpha/2)}(h), IRF^{*(1-\alpha/2)}(h)]$$

**Bias-Corrected Percentile:**

$$CI_{1-\alpha}^{BC}(h) = [IRF^{*(2\hat{z}_0 - z_{1-\alpha/2})}(h), IRF^{*(2\hat{z}_0 - z_{\alpha/2})}(h)]$$

Where $\hat{z}_0 = \Phi^{-1}(\frac{1}{B}\sum_{b=1}^{B} \mathbb{1}_{\{IRF^{*b} \leq IRF\}})$

**Hall's Confidence Interval:**

$$CI_{1-\alpha}^{Hall}(h) = [2IRF - IRF^{*(1-\alpha/2)}(h), 2IRF - IRF^{*(\alpha/2)}(h)]$$

### 2.5.3 Bootstrap After Bootstrap (BaB) for Bias Correction

For small samples, apply double bootstrap to reduce bias in IRF estimates.

---

# Section 3: Dynamic Stochastic General Equilibrium (DSGE) Model

## 3.1 Full DSGE Structure with Climate Damage

### 3.1.1 Model Overview

The DSGE model integrates climate physics with macroeconomic dynamics through a damage function. The model consists of:
- Representative household
- Production firms with climate vulnerability
- Climate system dynamics
- Monetary and fiscal policy authorities

### 3.1.2 Household Optimization

The representative household maximizes expected lifetime utility:

$$\boxed{\max_{C_t, L_t, K_{t+1}, B_{t+1}} \mathbb{E}_0 \sum_{t=0}^{\infty} \beta^t U(C_t, L_t)}$$

**Period utility function (separable):**

$$U(C_t, L_t) = \frac{C_t^{1-\sigma}}{1-\sigma} - \chi \frac{L_t^{1+\varphi}}{1+\varphi}$$

Where:
- $C_t$: Consumption
- $L_t$: Labor supply
- $\beta \in (0,1)$: Discount factor
- $\sigma > 0$: Inverse of intertemporal elasticity of substitution
- $\varphi > 0$: Inverse of Frisch elasticity
- $\chi > 0$: Labor disutility weight

**Budget constraint:**

$$C_t + K_{t+1} - (1-\delta)K_t + \frac{B_{t+1}}{1+r_t} = w_t L_t + R_t^k K_t + \Pi_t + T_t$$

Where:
- $K_t$: Capital stock
- $B_t$: Bond holdings
- $w_t$: Real wage
- $R_t^k$: Rental rate of capital
- $\Pi_t$: Firm profits
- $T_t$: Government transfers
- $\delta$: Capital depreciation rate

**First-order conditions:**

**Euler equation:**

$$C_t^{-\sigma} = \beta \mathbb{E}_t\left[C_{t+1}^{-\sigma}(1 + r_t)\right]$$

**Labor supply:**

$$\chi L_t^{\varphi} = w_t C_t^{-\sigma}$$

**Capital accumulation:**

$$C_t^{-\sigma} = \beta \mathbb{E}_t\left[C_{t+1}^{-\sigma}(R_{t+1}^k + 1 - \delta)\right]$$

### 3.1.3 Firm Production with Climate Damage

**Final goods producer:**

$$\boxed{Y_t = A_t K_t^{\alpha} L_t^{1-\alpha} D(T_t)}$$

Where:
- $A_t$: Total factor productivity (TFP)
- $\alpha \in (0,1)$: Capital share
- $D(T_t)$: Climate damage function

**Climate Damage Function:**

$$\boxed{D(T_t) = \frac{1}{1 + \theta_1 T_t + \theta_2 T_t^2}}$$

Where $T_t$ is the temperature anomaly. This specification ensures:
- $D(0) = 1$ (no damage at pre-industrial levels)
- $D(T_t) \in (0, 1]$ for all $T_t \geq 0$
- Marginal damage increases with temperature

**Alternative damage specifications:**

**Nordhaus (exponential):**

$$D^{Nordhaus}(T_t) = \frac{1}{1 + \pi_1 T_t + \pi_2 T_t^{\pi_3}}$$

**Weitzman (catastrophic):**

$$D^{Weitzman}(T_t) = \frac{1}{1 + \left(\frac{T_t}{T_{crit}}\right)^{\gamma}}$$

**Burke-Hsiang-Miguel (empirical):**

$$D^{BHM}(T_t) = e^{-\beta_1 T_t - \beta_2 T_t^2}$$

### 3.1.4 TFP Dynamics with Climate Feedback

$$\ln A_t = (1-\rho_A)\ln \bar{A} + \rho_A \ln A_{t-1} + \varepsilon_{A,t} - \kappa \cdot \Delta T_t$$

Where:
- $\rho_A \in (0,1)$: TFP persistence
- $\varepsilon_{A,t} \sim N(0, \sigma_A^2)$: TFP shock
- $\kappa$: Climate impact on productivity growth

## 3.2 Climate System Dynamics

### 3.2.1 Carbon Cycle Model

**Atmospheric carbon concentration:**

$$M_t = (1-\delta_M)M_{t-1} + E_t^{ind} + E_t^{land}$$

Where:
- $M_t$: Atmospheric CO2 concentration (GtC)
- $\delta_M$: Natural carbon decay rate
- $E_t^{ind}$: Industrial emissions
- $E_t^{land}$: Land use emissions

**Emissions from production:**

$$E_t^{ind} = \phi_1 Y_t - \phi_2 \tau_t^{\psi} Y_t$$

Where $\tau_t$ is carbon tax and $\psi$ is abatement elasticity.

### 3.2.2 Temperature Dynamics

**Radiative forcing:**

$$F_t = \eta \ln\left(\frac{M_t}{M_{pre}}\right) + F_t^{exo}$$

**Temperature adjustment:**

$$T_t = T_{t-1} + \lambda_1 \left[F_t - \lambda_2 T_{t-1} - \lambda_3 (T_{t-1} - T_{t-1}^{ocean})\right]$$

**Ocean temperature:**

$$T_t^{ocean} = T_{t-1}^{ocean} + \lambda_4 (T_{t-1} - T_{t-1}^{ocean})$$

### 3.2.3 Climate Shock Process

Climate tipping points modeled as regime-switching:

$$s_t \in \{Normal, Tipping\}$$

$$P(s_t = Tipping | s_{t-1} = Normal, T_{t-1}) = p_{tip}(T_{t-1}) = \frac{1}{1 + e^{-\xi(T_{t-1} - T_{threshold})}}$$

## 3.3 Policy Reaction Functions

### 3.3.1 Monetary Policy (Taylor Rule with Climate)

$$\boxed{i_t = \rho_i i_{t-1} + (1-\rho_i)\left[r^* + \pi^* + \phi_{\pi}(\pi_t - \pi^*) + \phi_y \tilde{y}_t + \phi_{clim} \cdot \text{ClimateRisk}_t\right] + \varepsilon_{i,t}}$$

Where:
- $i_t$: Nominal policy rate
- $\rho_i$: Interest rate smoothing
- $r^*$: Natural real rate
- $\pi^*$: Inflation target
- $\tilde{y}_t$: Output gap
- $\text{ClimateRisk}_t$: Climate risk indicator
- $\phi_{clim}$: Climate risk response coefficient

**Climate risk indicator:**

$$\text{ClimateRisk}_t = \omega_1 \Delta T_t + \omega_2 \Delta \tau_t + \omega_3 \text{TransitionStress}_t$$

### 3.3.2 Fiscal Policy Rule

$$G_t = \bar{G} + \phi_G^{auto} \cdot \tilde{y}_t + \phi_G^{clim} \cdot \text{GreenInvestment}_t$$

**Government budget:**

$$B_t^g = (1+r_{t-1})B_{t-1}^g + G_t - T_t + \tau_t^{carbon} \cdot E_t$$

### 3.3.3 Carbon Pricing Policy

**Optimal carbon tax (Pigouvian):**

$$\tau_t^* = SCC_t = \sum_{s=t}^{\infty} \beta^{s-t} \frac{\partial D(T_s)}{\partial E_t} \cdot \frac{\lambda_s}{\lambda_t}$$

Where $SCC_t$ is the Social Cost of Carbon and $\lambda_t$ is the shadow price of consumption.

## 3.4 Linearization and Solution Methods

### 3.4.1 Log-Linearization

Define log-deviations from steady state: $\hat{x}_t = \ln(x_t) - \ln(\bar{x})$

**Linearized Euler equation:**

$$\hat{c}_t = \mathbb{E}_t[\hat{c}_{t+1}] - \frac{1}{\sigma}(\hat{i}_t - \mathbb{E}_t[\hat{\pi}_{t+1}])$$

**Linearized production:**

$$\hat{y}_t = \hat{a}_t + \alpha \hat{k}_t + (1-\alpha)\hat{l}_t + D'(\bar{T})\bar{T}\hat{T}_t$$

**Linearized climate damage:**

$$\hat{d}_t = -\frac{\theta_1 \bar{T} + 2\theta_2 \bar{T}^2}{1 + \theta_1 \bar{T} + \theta_2 \bar{T}^2} \hat{T}_t$$

### 3.4.2 State-Space Representation

$$\begin{bmatrix} X_{t+1} \\ \mathbb{E}_t[Y_{t+1}] \end{bmatrix} = A \begin{bmatrix} X_t \\ Y_t \end{bmatrix} + B \epsilon_{t+1}$$

Where:
- $X_t$: Predetermined state variables (capital, debt, carbon stock, temperature)
- $Y_t$: Jump variables (consumption, inflation, asset prices)
- $\epsilon_t$: Exogenous shocks

### 3.4.3 Blanchard-Kahn Solution

The system has a unique stable solution if:

$$\text{Number of unstable eigenvalues of } A = \text{Number of jump variables}$$

Solution takes the form:

$$Y_t = C X_t$$

$$X_{t+1} = (A_{11} + A_{12}C)X_t + B_1 \epsilon_{t+1}$$

Where $C$ solves the matrix quadratic equation.

### 3.4.4 Perturbation Methods

For higher-order approximations:

**Second-order perturbation:**

$$\hat{x}_t = g_x \hat{x}_{t-1} + g_\epsilon \epsilon_t + \frac{1}{2}g_{xx}(\hat{x}_{t-1} \otimes \hat{x}_{t-1}) + g_{x\epsilon}(\hat{x}_{t-1} \otimes \epsilon_t) + \frac{1}{2}g_{\epsilon\epsilon}(\epsilon_t \otimes \epsilon_t)$$

**Third-order perturbation** (for skewness and kurtosis):

Includes cubic terms for capturing precautionary behavior and time-varying risk premia.

---

# Section 4: Macro-to-Micro Transmission Channels

## 4.1 Transmission Channel Framework

The macro-to-micro transmission maps economy-wide shocks to individual entity risk parameters through four primary channels.

### 4.1.1 General Transmission Function

$$\boxed{PD_i^{stressed} = PD_i^{baseline} \times f(\Delta GDP, \Delta CarbonPrice, Sector_i)}$$

Where the stress multiplier function:

$$f(\cdot) = \exp\left(\sum_{c=1}^{4} \beta_c \cdot Channel_c + \frac{1}{2}\sum_{c=1}^{4}\sum_{d=1}^{4}\gamma_{cd} \cdot Channel_c \cdot Channel_d\right)$$

## 4.2 Channel 1: GDP Shock → Corporate Revenue → PD Shift

### 4.2.1 Revenue Impact Function

$$\Delta Revenue_i = \eta_i^{GDP} \cdot \Delta GDP + \frac{1}{2}\eta_i^{GDP,2} \cdot (\Delta GDP)^2$$

Where:
- $\eta_i^{GDP} = \frac{\partial Revenue_i}{\partial GDP}$: Revenue elasticity to GDP
- $\eta_i^{GDP,2}$: Convexity parameter for deep recessions

### 4.2.2 Sector-Specific Elasticities

| Sector | $\eta^{GDP}$ | $\eta^{GDP,2}$ | Cyclicality |
|--------|-------------|---------------|-------------|
| Consumer Discretionary | 1.8 | 0.3 | Procyclical |
| Energy | 0.9 | 0.1 | Neutral |
| Financials | 1.4 | 0.4 | Procyclical |
| Healthcare | 0.4 | 0.0 | Defensive |
| Industrials | 1.6 | 0.2 | Procyclical |
| Technology | 1.2 | 0.2 | Procyclical |
| Utilities | 0.5 | 0.0 | Defensive |

### 4.2.3 PD Mapping via Merton Model

**Distance to default:**

$$DD_i = \frac{\ln(V_{A,i}/D_i) + (\mu_{A,i} - 0.5\sigma_{A,i}^2)T}{\sigma_{A,i}\sqrt{T}}$$

**Stressed distance to default:**

$$DD_i^{stressed} = DD_i^{baseline} \cdot \left(1 - \delta^{GDP} \cdot \Delta GDP\right)$$

**PD conversion:**

$$PD_i = \Phi(-DD_i)$$

**Stressed PD:**

$$PD_i^{stressed} = \Phi\left(-DD_i^{baseline} \cdot \left(1 - \delta^{GDP} \cdot \Delta GDP\right)\right)$$

### 4.2.4 Vasicek ASRF Model Extension

For portfolio-level PD aggregation:

$$PD_i^{stressed}(X) = \Phi\left(\frac{\Phi^{-1}(PD_i^{stressed}) - \sqrt{\rho_i} \cdot X}{\sqrt{1-\rho_i}}\right)$$

Where $X \sim N(0,1)$ is the systematic risk factor (correlated with GDP shock).

## 4.3 Channel 2: Carbon Price → Operating Costs → DCF Impairment

### 4.3.1 Operating Cost Impact

$$\Delta OpEx_i = \epsilon_i^{carbon} \cdot \Delta CarbonPrice \cdot EmissionsIntensity_i$$

Where emissions intensity:

$$EmissionsIntensity_i = \frac{CO_2 emissions_i (tCO_2)}{Revenue_i}$$

### 4.3.2 Carbon Cost Pass-Through

Effective cost impact depends on pass-through ability:

$$\Delta OpEx_i^{effective} = \Delta OpEx_i \cdot (1 - PT_i)$$

Where pass-through rate $PT_i$ depends on market structure:

$$PT_i = \frac{\epsilon_{demand,i}}{\epsilon_{demand,i} + \frac{1}{n_i} \cdot \epsilon_{supply,industry}}$$

With $n_i$ being the number of competitors (inverse of concentration).

### 4.3.3 DCF Impairment Model

**Free cash flow impact:**

$$FCF_t^{stressed} = FCF_t^{baseline} - \Delta OpEx_i^{effective} \cdot (1 - TaxRate)$$

**Enterprise value:**

$$EV_i = \sum_{t=1}^{T} \frac{FCF_t}{(1+WACC)^t} + \frac{TV}{(1+WACC)^T}$$

**Stressed EV:**

$$EV_i^{stressed} = \sum_{t=1}^{T} \frac{FCF_t^{stressed}}{(1+WACC^{stressed})^t} + \frac{TV^{stressed}}{(1+WACC^{stressed})^T}$$

**Impairment ratio:**

$$Impairment_i = \frac{EV_i^{baseline} - EV_i^{stressed}}{EV_i^{baseline}}$$

### 4.3.4 Carbon Beta Estimation

Asset sensitivity to carbon price:

$$\beta_i^{carbon} = \frac{Cov(R_i, \Delta CarbonPrice)}{Var(\Delta CarbonPrice)}$$

**Factor model extension:**

$$R_{i,t} - r_f = \alpha_i + \beta_i^{mkt}(R_{m,t} - r_f) + \beta_i^{carbon} \Delta CarbonPrice_t + \epsilon_{i,t}$$

## 4.4 Channel 3: Energy Prices → Input Costs → Margin Compression

### 4.4.1 Energy Cost Function

$$EnergyCost_i = \sum_{e \in \{oil,gas,coal,electricity\}} P_e \cdot Q_{i,e}$$

Where:
- $P_e$: Energy price for source $e$
- $Q_{i,e}$: Quantity of energy $e$ consumed by firm $i$

### 4.4.2 Energy Price Shock Transmission

$$\Delta EnergyCost_i = \sum_e \left(\frac{\partial P_e}{\partial CarbonPrice} \cdot \Delta CarbonPrice\right) \cdot Q_{i,e}$$

**Energy price-carbon price elasticity:**

$$\frac{\partial P_e}{\partial CarbonPrice} = \phi_e \cdot \frac{P_e}{CarbonPrice}$$

Where $\phi_e$ is the carbon intensity of energy source $e$.

### 4.4.3 Margin Compression Formula

**EBITDA margin:**

$$EBITDAMargin_i = \frac{Revenue_i - COGS_i - OpEx_i}{Revenue_i}$$

**Stressed EBITDA margin:**

$$EBITDAMargin_i^{stressed} = EBITDAMargin_i^{baseline} - \frac{\Delta EnergyCost_i}{Revenue_i}$$

**Interest coverage ratio impact:**

$$ICR_i^{stressed} = \frac{EBITDA_i^{stressed}}{InterestExpense_i}$$

**PD adjustment via ICR mapping:**

$$PD_i^{stressed} = f(ICR_i^{stressed})$$

Where $f(\cdot)$ is empirically calibrated.

### 4.4.4 Input-Output Matrix Approach

For sectoral spillovers, use Leontief input-output analysis:

$$\Delta Cost = (I - A)^{-1} \cdot \Delta EnergyCost$$

Where $A$ is the technical coefficients matrix.

## 4.5 Channel 4: Unemployment → Household Default Rates

### 4.5.1 Unemployment-Default Relationship

**Logistic default probability:**

$$PD_{h,t} = \frac{1}{1 + e^{-(\alpha_h + \beta_h \cdot Unemployment_t + \gamma_h \cdot \Delta Unemployment_t)}}$$

### 4.5.2 Household Heterogeneity

Segment by income level and debt-to-income:

$$PD_{h,t}^{(segment)} = \frac{1}{1 + e^{-(\alpha^{(segment)} + \beta^{(segment)} \cdot Unemployment_t)}}$$

| Segment | DTI Range | $\beta^{(segment)}$ |
|---------|-----------|---------------------|
| Low Risk | <30% | 2.5 |
| Medium Risk | 30-50% | 4.0 |
| High Risk | >50% | 6.5 |

### 4.5.3 Mortgage Default Model

**Option-theoretic default (structural):**

$$Default_h = \mathbb{1}_{\{H_t < (1+\kappa) \cdot L_t\}} \cup \mathbb{1}_{\{Income_h < Payment_h\}}$$

Where:
- $H_t$: House value
- $L_t$: Loan balance
- $\kappa$: Transaction costs
- Payment-to-income threshold

**Double-trigger model:**

$$PD_h = \Phi_2(-d_1, -d_2; \rho)$$

Where $d_1$ relates to negative equity and $d_2$ to income shock.

### 4.5.4 Credit Card and Consumer Loan Defaults

$$PD_{consumer} = \alpha_0 + \alpha_1 \cdot Unemployment + \alpha_2 \cdot Unemployment^2 + \alpha_3 \cdot CCI$$

Where $CCI$ is consumer confidence index.

## 4.6 Integrated Multi-Channel Model

### 4.6.1 Joint Transmission Function

$$\boxed{PD_i^{stressed} = PD_i^{baseline} \cdot \exp\left(\sum_{c=1}^{4} \beta_{i,c} \cdot Shock_c + \frac{1}{2}\sum_{c=1}^{4}\sum_{d=1}^{4}\gamma_{c,d} \cdot Shock_c \cdot Shock_d\right)}$$

Where:
- $Shock_1 = \Delta GDP$
- $Shock_2 = \Delta CarbonPrice$
- $Shock_3 = \Delta EnergyPrice$
- $Shock_4 = \Delta Unemployment$

### 4.6.2 Sector-Specific Coefficient Matrix

| Sector | $\beta_1$ (GDP) | $\beta_2$ (Carbon) | $\beta_3$ (Energy) | $\beta_4$ (Unemp) |
|--------|----------------|-------------------|-------------------|------------------|
| Fossil Fuel | 0.8 | 3.5 | 0.5 | 0.4 |
| Renewable Energy | 1.0 | -1.2 | 0.3 | 0.5 |
| Utilities | 0.4 | 2.0 | 1.5 | 0.3 |
| Manufacturing | 1.5 | 1.8 | 1.2 | 0.8 |
| Transportation | 1.2 | 2.5 | 2.0 | 0.7 |
| Real Estate | 1.8 | 0.8 | 0.6 | 1.2 |
| Financial | 1.4 | 0.5 | 0.4 | 1.0 |

### 4.6.3 Gaussian Copula for Joint Default

For portfolio-level risk aggregation:

$$C(u_1, u_2, ..., u_n; \Sigma) = \Phi_{\Sigma}(\Phi^{-1}(u_1), ..., \Phi^{-1}(u_n))$$

Where:
- $u_i = PD_i^{stressed}$
- $\Sigma$ is the correlation matrix
- $\Phi_{\Sigma}$ is the multivariate normal CDF

**Portfolio default distribution:**

$$P(L \leq x) = \int_{-\infty}^{\infty} P(L \leq x | Z = z) \cdot \phi(z) \, dz$$

Where $Z$ is the systematic factor.

---

# Section 5: Regulatory Alignment Matrix

## 5.1 ECB Climate Risk Stress Testing Framework

### 5.1.1 ECB Climate Stress Test Architecture

The European Central Bank's climate stress testing follows a three-pillar approach:

**Pillar 1: Short-term climate risk (3-year horizon)**

$$Loss_{t}^{ST} = \sum_{i} EAD_i \cdot PD_i^{ST}(ClimateShock) \cdot LGD_i^{ST}$$

**Pillar 2: Medium-term transition risk (5-year horizon)**

$$Loss_{t}^{MT} = \sum_{i} EAD_i \cdot PD_i^{MT}(TransitionPath) \cdot LGD_i^{MT}$$

**Pillar 3: Long-term physical risk (30-year horizon)**

$$Loss_{t}^{LT} = \sum_{i} EAD_i \cdot PD_i^{LT}(PhysicalScenario) \cdot LGD_i^{LT}$$

### 5.1.2 ECB Scenario Specifications

| Scenario | Carbon Price 2030 | GDP Impact | Temperature |
|----------|------------------|------------|-------------|
| Orderly | €75/tCO2 | -2% vs baseline | 1.5°C |
| Disorderly | €150/tCO2 (2030) | -4% vs baseline | 1.5°C |
| Hot House World | €10/tCO2 | -6% vs baseline (2050) | 3°C |

### 5.1.3 ECB Expected Credit Loss Calculation

$$ECL_{ECB} = \sum_{t=1}^{T} \frac{PD_t \cdot LGD_t \cdot EAD_t}{(1 + r_t + \rho)^t}$$

Where $\rho$ is the climate risk premium add-on.

## 5.2 PRA SS3/19: Supervisory Expectations

### 5.2.1 PRA SS3/19 Requirements

The UK Prudential Regulation Authority's Supervisory Statement 3/19 mandates:

**1. Governance:**
- Board-level climate risk oversight
- Clear roles and responsibilities
- Climate risk appetite framework

**2. Risk Management:**
- Integration into ICAAP and ILAAP
- Stress testing capabilities
- Scenario analysis

**3. Disclosure:**
- TCFD-aligned reporting
- Materiality assessment
- Forward-looking metrics

### 5.2.2 PRA Scenario Parameters

| Scenario | Description | Carbon Price Path |
|----------|-------------|-------------------|
| Early Action | Smooth transition | £50 (2025) → £200 (2050) |
| Late Action | Delayed transition | £20 (2030) → £400 (2050) |
| No Additional Action | Current policies | £15 (2025) → £50 (2050) |

### 5.2.3 PRA Capital Requirement Integration

$$Pillar2A_{climate} = f(ClimateRiskExposure, ScenarioSeverity)$$

Total capital requirement:

$$TotalCapital = Pillar1 + Pillar2A_{traditional} + Pillar2A_{climate} + Pillar2B$$

## 5.3 FED Climate Scenario Analysis

### 5.3.1 FED Six-Module Approach

The Federal Reserve's climate scenario analysis framework comprises six modules:

**Module 1: Scenario Design**
- NGFS scenario adaptation
- Regional specificity
- Sectoral granularity

**Module 2: Economic Modeling**
- DSGE model integration
- VAR projections
- Input-output analysis

**Module 3: Financial Risk Translation**
- Credit risk models
- Market risk models
- Liquidity risk assessment

**Module 4: Counterparty Exposure**
- Counterparty PD adjustments
- Collateral valuation
- Wrong-way risk

**Module 5: Portfolio Impact**
- Aggregation methodologies
- Concentration risk
- Correlation effects

**Module 6: Reverse Stress Testing**
- Vulnerability identification
- Business model resilience
- Recovery planning

### 5.3.2 FED Scenario Specifications

| Scenario | Physical Risk | Transition Risk | GDP Impact |
|----------|--------------|-----------------|------------|
| Current Policy | High | Low | -2% (2050) |
| Net Zero 2050 | Low | High (early) | -1% (2030), +1% (2050) |
| Delayed Action | Medium | Very High (late) | -4% (2035) |

### 5.3.3 FED Climate Risk Capital Buffer

$$CCyB_{climate} = \max\left(0, \kappa \cdot \frac{ClimateRiskExposure}{RWA} - \tau\right)$$

Where:
- $\kappa$: Buffer calibration parameter
- $\tau$: Threshold level

## 5.4 OSFI B-15: Guideline B-15 Compliance

### 5.4.1 OSFI B-15 Requirements

The Office of the Superintendent of Financial Institutions Guideline B-15 mandates:

**1. Climate Risk Management:**
- Risk identification and assessment
- Governance and oversight
- Strategy and risk appetite

**2. Scenario Analysis:**
- Range of climate scenarios
- Time horizons: short (1-5 years), medium (5-10 years), long (10+ years)
- Qualitative and quantitative elements

**3. Disclosure:**
- Annual climate-related disclosure
- TCFD-aligned framework
- Materiality-based approach

### 5.4.2 OSFI Scenario Requirements

| Time Horizon | Minimum Scenarios | Key Variables |
|--------------|-------------------|---------------|
| Short-term | 2 | GDP, interest rates, sector impacts |
| Medium-term | 3 | Carbon prices, technology shifts |
| Long-term | 2 | Physical damages, transition costs |

### 5.4.3 OSFI Capital Adequacy

Climate risk integration into:

$$CAR = \frac{Tier1 + Tier2}{RWA_{credit} + RWA_{market} + RWA_{operational} + RWA_{climate}}$$

Where $RWA_{climate}$ captures climate-related risk-weighted assets.

## 5.5 Regulatory Alignment Summary Matrix

| Requirement | ECB | PRA SS3/19 | FED | OSFI B-15 |
|------------|-----|------------|-----|-----------|
| **Scenario Count** | 3 | 3 | 3+ | 4+ |
| **Time Horizon** | 3-30 years | 5-30 years | 1-30 years | 1-10+ years |
| **Carbon Price Spec** | Required | Required | Required | Required |
| **Physical Risk** | Required | Required | Required | Required |
| **Transition Risk** | Required | Required | Required | Required |
| **Stress Testing** | Mandatory | Mandatory | Pilot | Mandatory |
| **Capital Impact** | Under review | Pillar 2 | Under review | Under review |
| **Disclosure** | TCFD-aligned | TCFD-aligned | TCFD-aligned | TCFD-aligned |
| **Frequency** | Annual | Annual | Biennial | Annual |

## 5.6 Cross-Regulatory Scenario Harmonization

### 5.6.1 Common Scenario Framework

To ensure consistency across jurisdictions, we map scenarios as follows:

| NGFS Scenario | ECB | PRA | FED | OSFI |
|---------------|-----|-----|-----|------|
| Net Zero 2050 | Orderly | Early Action | Net Zero 2050 | Net Zero |
| Below 2°C | Orderly | Early Action | Net Zero 2050 | Transition |
| NDCs | Disorderly | Late Action | Delayed Action | Delayed |
| Current Policies | Hot House | No Additional | Current Policy | Baseline |

### 5.6.2 Regulatory Capital Overlay

$$TotalCapitalRequirement = \max\left(Capital_{ECB}, Capital_{PRA}, Capital_{FED}, Capital_{OSFI}\right) + Buffer_{conservative}$$

---

# Section 6: Pipeline Architecture

## 6.1 Data Flow Architecture

### 6.1.1 High-Level Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIMATE-FINANCE DATA PIPELINE                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  CLIMATE DATA   │───▶│  SCENARIO ENGINE │───▶│  MACRO MODELS   │
│   SOURCES       │    │   (NGFS/REMIND)  │    │  (VAR/DSGE)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
        ┌───────────────────────────────────────────────┼───────────────┐
        ▼                                               ▼               ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  HAZARD DATA    │    │  ECONOMIC       │    │  TRANSMISSION   │
│  (Flood/Storm/  │◀───│  PROJECTIONS    │───▶│  CHANNELS       │
│   Heat/Drought) │    │  (GDP/CPI/      │    │  (PD/LGD/EAD)   │
└─────────────────┘    │   Unemployment) │    └─────────────────┘
        │              └─────────────────┘               │
        │                       ▲                        │
        │                       │                        ▼
        │              ┌─────────────────┐    ┌─────────────────┐
        └─────────────▶│  VULNERABILITY  │◀───│  RISK METRICS   │
                       │  ASSESSMENT     │    │  (EL/VaR/ES)    │
                       │  (Exposure/     │    └─────────────────┘
                       │   Sensitivity)  │             │
                       └─────────────────┘             ▼
                                              ┌─────────────────┐
                                              │  REGULATORY     │
                                              │  REPORTING      │
                                              │  (ECB/PRA/FED/  │
                                              │   OSFI)         │
                                              └─────────────────┘
```

### 6.1.2 Data Layer Specification

**Layer 1: Raw Data Ingestion**

| Data Source | Type | Frequency | Format | Volume |
|-------------|------|-----------|--------|--------|
| CMIP6 Climate Models | Gridded | Daily | NetCDF | ~10TB/year |
| NGFS Scenarios | Tabular | Quarterly | CSV/Parquet | ~1GB |
| Macroeconomic Indicators | Time Series | Monthly | API/JSON | ~100MB/month |
| Corporate Financials | Tabular | Quarterly | XBRL/CSV | ~50GB/quarter |
| Asset-Level Data | Geospatial | Monthly | GeoJSON/Shapefile | ~500GB |
| Market Data | Time Series | Real-time | FIX/Kafka | ~1TB/day |

**Layer 2: Climate Data Processing**

```python
# Pseudo-code for climate data processing pipeline
class ClimateDataProcessor:
    def process_cmip6(self, model_output):
        # Downscale to required resolution
        downscaled = self.downscale(model_output, target_resolution='0.25deg')
        
        # Calculate hazard indicators
        hazards = {
            'flood_depth': self.calculate_flood_depth(downscaled),
            'heat_days': self.calculate_heat_stress(downscaled),
            'drought_index': self.calculate_spei(downscaled),
            'wind_speed': self.calculate_extreme_wind(downscaled)
        }
        
        # Apply bias correction
        bias_corrected = self.quantile_mapping(hazards, historical_obs)
        
        return bias_corrected
```

**Layer 3: Scenario Integration**

$$ScenarioOutput_t = \sum_{s=1}^{6} w_s \cdot f_s(ClimateData_t, MacroData_t)$$

## 6.2 API Integration Points

### 6.2.1 External API Specifications

**NGFS Scenario Portal API**

```
Endpoint: https://data.ngfs.net/api/v1/scenarios
Method: GET
Parameters:
  - scenario: [CurrentPolicies, NDC, NetZero2050, Below2C, Delayed, Fragmented]
  - variable: [GDP, CarbonPrice, EnergyMix, Temperature]
  - region: [Global, OECD, EMDE, ...]
  - frequency: [annual, quarterly]
  - horizon: [2030, 2050, 2100]

Response Format:
{
  "scenario": "NetZero2050",
  "variable": "CarbonPrice",
  "data": [
    {"year": 2024, "value": 65.0, "unit": "USD/tCO2"},
    {"year": 2025, "value": 72.5, "unit": "USD/tCO2"},
    ...
  ]
}
```

**Climate Data Store API (Copernicus)**

```
Endpoint: https://cds.climate.copernicus.eu/api/v2
Method: POST
Parameters:
  - dataset: [reanalysis, seasonal, projections]
  - variable: [temperature, precipitation, wind]
  - area: [N, W, S, E bounding box]
  - date: [start_date, end_date]

Authentication: API Key
```

**Macroeconomic Data API (IMF/WB)**

```
Endpoint: https://api.worldbank.org/v2/country/{country}/indicator/{indicator}
Method: GET
Parameters:
  - format: json
  - date: YYYY:YYYY
  - frequency: [A, Q, M]

Example: /country/USA/indicator/NY.GDP.MKTP.KD.ZG?date=2020:2050
```

### 6.2.2 Internal API Architecture

**Risk Calculation API**

```python
# FastAPI-based internal service
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class RiskCalculationRequest(BaseModel):
    portfolio_id: str
    scenario: str
    horizon: int
    confidence_level: float

class RiskCalculationResponse(BaseModel):
    expected_loss: float
    value_at_risk: float
    expected_shortfall: float
    pd_distribution: List[float]

@app.post("/api/v1/risk/calculate")
async def calculate_risk(request: RiskCalculationRequest):
    # Load portfolio data
    portfolio = load_portfolio(request.portfolio_id)
    
    # Apply scenario shocks
    shocked_portfolio = apply_scenario(portfolio, request.scenario)
    
    # Calculate risk metrics
    results = calculate_metrics(
        shocked_portfolio,
        horizon=request.horizon,
        confidence=request.confidence_level
    )
    
    return RiskCalculationResponse(**results)
```

### 6.2.3 API Security and Governance

| Aspect | Implementation |
|--------|---------------|
| Authentication | OAuth 2.0 + JWT tokens |
| Rate Limiting | 1000 requests/minute per API key |
| Data Encryption | TLS 1.3 for transit, AES-256 for storage |
| Audit Logging | All API calls logged with timestamp, user, payload hash |
| Versioning | URL versioning (/api/v1/, /api/v2/) |

## 6.3 Frequency of Updates

### 6.3.1 Data Update Schedule

| Data Category | Update Frequency | Trigger | Latency Requirement |
|---------------|------------------|---------|---------------------|
| Climate Projections | Quarterly | NGFS releases | < 24 hours |
| Hazard Maps | Monthly | Model updates | < 48 hours |
| Macroeconomic Indicators | Monthly | Official releases | < 4 hours |
| Market Data | Real-time | Exchange feeds | < 100ms |
| Corporate Financials | Quarterly | Earnings releases | < 24 hours |
| Emissions Data | Annually | CDP/EPA updates | < 1 week |
| Scenario Parameters | Quarterly | Model recalibration | < 24 hours |

### 6.3.2 Model Recalibration Schedule

| Model Component | Recalibration Frequency | Trigger Criteria |
|-----------------|------------------------|------------------|
| VAR Parameters | Quarterly | AIC degradation > 5% |
| DSGE Parameters | Semi-annually | Structural break tests |
| PD Models | Annually | ROC degradation > 2% |
| LGD Models | Annually | Backtest failures |
| EAD Models | Quarterly | Portfolio changes > 10% |
| Correlation Models | Annually | Correlation regime shift |

### 6.3.3 Batch Processing Windows

```
Daily Batch (02:00-04:00 UTC):
  - Market data aggregation
  - Risk metric calculations
  - Position updates

Weekly Batch (Sunday 00:00-06:00 UTC):
  - Model performance monitoring
  - Data quality checks
  - Regulatory report preparation

Monthly Batch (1st of month, 00:00-12:00 UTC):
  - VAR model recalibration
  - Scenario update integration
  - Stress test execution

Quarterly Batch (Quarter end + 5 days):
  - Full model recalibration
  - Backtesting suite
  - ICAAP/ILAAP updates
```

## 6.4 Data Quality and Validation Framework

### 6.4.1 Data Quality Checks

```python
class DataQualityFramework:
    def validate_climate_data(self, data):
        checks = {
            'completeness': self.check_missing_values(data, threshold=0.01),
            'consistency': self.check_temporal_consistency(data),
            'plausibility': self.check_physical_bounds(data),
            'timeliness': self.check_latency(data, max_hours=48)
        }
        return all(checks.values())
    
    def validate_financial_data(self, data):
        checks = {
            'referential_integrity': self.check_foreign_keys(data),
            'business_rules': self.check_financial_ratios(data),
            'outliers': self.detect_statistical_outliers(data, threshold=3.5),
            'reconciliation': self.reconcile_with_source(data)
        }
        return all(checks.values())
```

### 6.4.2 Validation Metrics

| Metric | Threshold | Action on Breach |
|--------|-----------|------------------|
| Missing data rate | < 1% | Alert + interpolation |
| Out-of-range values | < 0.1% | Alert + manual review |
| Temporal gaps | None allowed | Halt processing |
| Cross-field inconsistency | < 0.5% | Alert + correction |
| Latency breach | < 5% of updates | Escalation |

## 6.5 Technology Stack

### 6.5.1 Infrastructure Components

| Layer | Technology | Purpose |
|-------|------------|---------|
| Data Lake | AWS S3 / Azure Data Lake | Raw data storage |
| Data Warehouse | Snowflake / BigQuery | Structured analytics |
| Stream Processing | Apache Kafka / Flink | Real-time data ingestion |
| Batch Processing | Apache Spark / Databricks | Large-scale computations |
| ML Platform | MLflow / Kubeflow | Model management |
| API Gateway | Kong / AWS API Gateway | API management |
| Visualization | Tableau / Power BI | Reporting dashboards |

### 6.5.2 Computational Requirements

| Workload | CPU Cores | Memory | Storage | GPU |
|----------|-----------|--------|---------|-----|
| VAR Estimation | 32 | 128 GB | 500 GB | No |
| DSGE Solution | 64 | 256 GB | 1 TB | Optional |
| Climate Downscaling | 128 | 512 GB | 10 TB | Yes (V100) |
| Portfolio Risk | 32 | 64 GB | 200 GB | No |
| Scenario Generation | 64 | 256 GB | 2 TB | No |

---

# Appendix A: Mathematical Notation Reference

## A.1 Variable Definitions

| Symbol | Description | Units |
|--------|-------------|-------|
| $Y_t$ | Real GDP | Local currency |
| $C_t$ | Consumption | Local currency |
| $K_t$ | Capital stock | Local currency |
| $L_t$ | Labor | Hours/FTE |
| $I_t$ | Investment | Local currency |
| $\pi_t$ | Inflation rate | % per annum |
| $i_t$ | Nominal interest rate | % per annum |
| $r_t$ | Real interest rate | % per annum |
| $T_t$ | Temperature anomaly | °C |
| $M_t$ | Atmospheric CO2 | GtC / ppm |
| $\tau_t$ | Carbon price | $/tCO2 |
| $PD$ | Probability of default | [0,1] |
| $LGD$ | Loss given default | [0,1] |
| $EAD$ | Exposure at default | Currency |
| $ECL$ | Expected credit loss | Currency |

## A.2 Greek Letters

| Symbol | Description |
|--------|-------------|
| $\alpha$ | Capital share, significance level |
| $\beta$ | Discount factor, regression coefficient |
| $\gamma$ | Climate damage parameter, risk aversion |
| $\delta$ | Depreciation rate, damage function |
| $\epsilon$ | Error term, shock |
| $\eta$ | Elasticity |
| $\theta$ | Damage function parameter |
| $\lambda$ | Eigenvalue, Lagrange multiplier |
| $\mu$ | Mean, drift parameter |
| $\pi$ | Probability, inflation |
| $\rho$ | Correlation, persistence |
| $\sigma$ | Volatility, standard deviation |
| $\tau$ | Carbon tax, time constant |
| $\phi$ | Policy parameter, PDF |
| $\chi$ | Labor disutility weight |
| $\psi$ | Abatement elasticity |
| $\omega$ | Weight, energy share |

## A.3 Matrix and Vector Notation

| Symbol | Description |
|--------|-------------|
| $Y_t$ | Vector of endogenous variables |
| $A_i$ | Coefficient matrix (lag $i$) |
| $\Sigma$ | Covariance matrix |
| $\Phi$ | Impulse response matrix |
| $\Psi$ | Structural impact matrix |
| $I$ | Identity matrix |
| $e_i$ | Selection vector |

---

# Appendix B: Model Calibration Parameters

## B.1 VAR Model Parameters (Illustrative)

```yaml
var_model:
  lag_order: 4
  variables:
    - GDP
    - CPI
    - CarbonPrice
    - EnergyConsumption
    - Unemployment
    - PolicyRate
    - CreditSpread
    - EquityIndex
  
  coefficients:
    c: [0.002, 0.0015, 0.01, 0.003, -0.001, 0.0005, 0.002, 0.008]
    
  covariance:
    sigma_epsilon: |
      [[0.001, 0.0002, 0.0001, 0.0003, -0.0002, 0.0001, 0.0002, 0.0004],
       [0.0002, 0.0008, 0.0001, 0.0002, 0.0001, 0.0003, 0.0001, 0.0002],
       [0.0001, 0.0001, 0.025, 0.005, 0.001, 0.002, 0.003, 0.008],
       [0.0003, 0.0002, 0.005, 0.004, 0.0005, 0.001, 0.001, 0.003],
       [-0.0002, 0.0001, 0.001, 0.0005, 0.0015, -0.0003, 0.0005, -0.001],
       [0.0001, 0.0003, 0.002, 0.001, -0.0003, 0.0009, 0.0004, 0.001],
       [0.0002, 0.0001, 0.003, 0.001, 0.0005, 0.0004, 0.006, 0.002],
       [0.0004, 0.0002, 0.008, 0.003, -0.001, 0.001, 0.002, 0.015]]
```

## B.2 DSGE Model Parameters (Illustrative)

```yaml
dsge_model:
  household:
    beta: 0.99        # Discount factor
    sigma: 1.5        # Risk aversion
    chi: 1.0          # Labor disutility
    varphi: 1.0       # Frisch elasticity
    
  production:
    alpha: 0.33       # Capital share
    delta: 0.025      # Depreciation rate
    
  climate_damage:
    theta_1: 0.00236  # Linear damage coefficient
    theta_2: 0.000041 # Quadratic damage coefficient
    
  climate_system:
    delta_M: 0.01     # Carbon decay rate
    lambda_1: 0.037   # Temperature adjustment
    lambda_2: 3.0     # Climate sensitivity
    
  monetary_policy:
    rho_i: 0.8        # Interest smoothing
    phi_pi: 1.5       # Inflation response
    phi_y: 0.5        # Output response
    phi_clim: 0.1     # Climate risk response
```

---

# Document Information

**Version:** 1.0  
**Date:** 2024  
**Classification:** Internal Use  
**Authors:** Agent 2 (Quant Financial Risk Modeler), coordinated with Agent 5 (Regulatory & Compliance Specialist)  
**Review Cycle:** Quarterly  

---

*End of Document*
