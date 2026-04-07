# Physical Risk Modeling & Stochastic Damage Functions
## Comprehensive Quantitative Formulations

---

## 1. Stochastic Hazard Intensity Models

### 1.1 Extreme Value Theory (EVT) Fundamentals

Extreme Value Theory provides the mathematical foundation for modeling rare, high-impact hazard events. The Fisher-Tippett-Gnedenko theorem establishes that properly normalized maxima converge to one of three extreme value distributions.

#### 1.1.1 Generalized Extreme Value (GEV) Distribution

For block maxima (e.g., annual maximum flood levels, wind speeds), the GEV distribution characterizes the limiting behavior:

$$G(x; \mu, \sigma, \xi) = \exp\left\{-\left[1 + \xi\frac{x-\mu}{\sigma}\right]^{-1/\xi}\right\}$$

where:
- $\mu \in \mathbb{R}$: location parameter (typical extreme value)
- $\sigma > 0$: scale parameter (dispersion of extremes)
- $\xi \in \mathbb{R}$: shape parameter (tail behavior)

**Domain Constraints:**
$$1 + \xi\frac{x-\mu}{\sigma} > 0$$

**Special Cases of the GEV:**

| Shape Parameter | Distribution Type | Tail Behavior |
|-----------------|-------------------|---------------|
| $\xi > 0$ | Fréchet | Heavy tail, unbounded above |
| $\xi = 0$ | Gumbel | Exponential tail |
| $\xi < 0$ | Weibull | Bounded above, finite endpoint |

**Gumbel Limit (as $\xi \to 0$):**
$$G(x; \mu, \sigma) = \exp\left\{-\exp\left(-\frac{x-\mu}{\sigma}\right)\right\}$$

**Quantile Function (Return Level):**
$$x_p = \mu - \frac{\sigma}{\xi}\left[1 - (-\ln p)^{-\xi}\right], \quad \xi \neq 0$$

For the Gumbel case:
$$x_p = \mu - \sigma \ln(-\ln p)$$

#### 1.1.2 Generalized Pareto Distribution (GPD) for Exceedances

For Peak Over Threshold (POT) analysis, exceedances above threshold $u$ follow:

$$H(y; \sigma_u, \xi) = 1 - \left(1 + \xi\frac{y}{\sigma_u}\right)^{-1/\xi}, \quad y \geq 0$$

where $y = x - u$ is the excess over threshold, and $\sigma_u$ is the scale parameter dependent on threshold $u$.

**Mean Excess Function:**
$$e(u) = E[X - u | X > u] = \frac{\sigma_u}{1 - \xi}, \quad \xi < 1$$

**Relationship Between GEV and GPD Parameters:**

If block maxima follow GEV$(\mu, \sigma, \xi)$ with block size $n$, then exceedances over threshold $u$ follow GPD with:
$$\sigma_u = \sigma + \xi(u - \mu)$$

The shape parameter $\xi$ is identical for both distributions.

#### 1.1.3 Threshold Selection for POT

**Mean Residual Life Plot:**
Plot $e(u)$ versus $u$. Linear behavior indicates appropriate threshold.

**Parameter Stability Plot:**
GPD parameters should be stable above threshold:
$$\frac{\partial \hat{\xi}}{\partial u} \approx 0, \quad \frac{\partial \hat{\sigma}_u}{\partial u} \approx 0$$

**Optimal Threshold Criteria:**
$$u^* = \arg\min_u \left\{\text{Var}(\hat{\xi}(u)) + \lambda \cdot \text{Bias}^2(\hat{\xi}(u))\right\}$$

### 1.2 Return Period Calculations

#### 1.2.1 T-Year Return Level

For annual exceedance rate $\lambda$ (expected number of exceedances per year):

$$x_T = \mu + \frac{\sigma}{\xi}\left[(T\lambda)^{\xi} - 1\right], \quad \xi \neq 0$$

For Gumbel ($\xi \to 0$):
$$x_T = \mu - \sigma \ln\left(-\ln\left(1 - \frac{1}{T\lambda}\right)\right)$$

**Approximation for Large T:**
$$x_T \approx \mu + \sigma \ln(T\lambda)$$

#### 1.2.2 Return Period from Exceedance Probability

For probability $p$ of exceedance in any given year:
$$T = \frac{1}{p}$$

For probability $p_T$ of at least one exceedance in $T$ years:
$$p_T = 1 - (1 - p)^T$$

**Example - 100-year Flood:**
- Annual exceedance probability: $p = 0.01$
- Probability of at least one exceedance in 30 years: $p_{30} = 1 - 0.99^{30} = 0.26$ (26%)

### 1.3 Non-Stationary Extreme Value Theory

Climate change introduces temporal trends in hazard distributions.

#### 1.3.1 Time-Varying GEV Parameters

$$G(x; \mu(t), \sigma(t), \xi(t)) = \exp\left\{-\left[1 + \xi(t)\frac{x-\mu(t)}{\sigma(t)}\right]^{-1/\xi(t)}\right\}$$

**Linear Trend in Location:**
$$\mu(t) = \mu_0 + \mu_1 \cdot t$$

**Exponential Trend in Scale:**
$$\sigma(t) = \sigma_0 \exp(\sigma_1 \cdot t)$$

**Climate Covariate Model:**
$$\mu(t) = \mu_0 + \mu_1 \cdot \text{GMST}(t)$$
where GMST = Global Mean Surface Temperature anomaly

#### 1.3.2 Non-Stationary Return Levels

$$x_T(t) = \mu(t) + \frac{\sigma(t)}{\xi(t)}\left[(T\lambda)^{\xi(t)} - 1\right]$$

**Effective Return Period:**
For non-stationary case, the T-year event in year $t$ becomes the $T'$-year event in year $t'$:
$$\frac{x_T(t) - \mu(t')}{\sigma(t')} = \frac{(T\lambda)^{\xi} - 1}{\xi}$$

### 1.4 Peak Over Threshold (POT) Methodology

#### 1.4.1 Point Process Representation

Exceedances over threshold $u$ form a Poisson point process with intensity:
$$\Lambda(A) = \int\int_A \lambda(t) \cdot f(x|x>u) \, dx \, dt$$

For stationary case with rate $\lambda_u$:
$$P(N_u = k) = \frac{(\lambda_u T)^k}{k!}e^{-\lambda_u T}$$

#### 1.4.2 Declustering Algorithms

To ensure independence of exceedances:

**Runs Declustring:**
Two exceedances belong to different clusters if separated by at least $r$ non-exceedances:
$$C_i = \{X_j : T_{i-1} + r < j \leq T_i\}$$

**Intervals Declustring:**
Clusters separated by time gap $\tau$:
$$\tau > \theta \cdot \bar{\tau}$$
where $\theta$ is extremal index and $\bar{\tau}$ is mean inter-arrival time.

**Extremal Index Estimation:**
$$\hat{\theta} = \left(\frac{C_n - 1}{N_u - 1}\right)^{-1}$$
where $C_n$ = number of clusters, $N_u$ = total exceedances.

#### 1.4.3 POT Parameter Estimation

**Maximum Likelihood Estimation:**
$$\ell(\sigma, \xi) = -N_u \ln\sigma - \left(1 + \frac{1}{\xi}\right)\sum_{i=1}^{N_u}\ln\left(1 + \xi\frac{y_i}{\sigma}\right)$$

**Probability Weighted Moments:**
$$\beta_r = E\left[X\{1 - F(X)\}^r\right]$$

For GPD:
$$\hat{\xi} = \frac{\beta_0}{\beta_0 - 2\beta_1} - 2$$
$$\hat{\sigma} = \frac{2\beta_0\beta_1}{\beta_0 - 2\beta_1}$$

### 1.5 Multivariate Extreme Value Theory

For multiple hazard variables $(X_1, X_2, ..., X_d)$:

#### 1.5.1 Multivariate GEV

$$G(\mathbf{x}) = \exp\left\{-V\left(z_1, z_2, ..., z_d\right)\right\}$$
where $z_i = \left[1 + \xi_i\frac{x_i - \mu_i}{\sigma_i}\right]^{1/\xi_i}$ and $V$ is the exponent measure.

#### 1.5.2 Extremal Dependence Measures

**Upper Tail Dependence Coefficient:**
$$\chi = \lim_{u \to 1} P(F_2(X_2) > u | F_1(X_1) > u)$$

**Coefficient of Tail Dependence:**
$$\bar{\chi} = \lim_{u \to 1} \frac{2\ln(1-u)}{\ln P(F_1(X_1) > u, F_2(X_2) > u)} - 1$$

---

## 2. Acute Hazard Damage Functions

### 2.1 Flood Damage by Depth

#### 2.1.1 Depth-Damage Curve Formulation

The standard depth-damage relationship models damage as a function of flood depth $h$:

$$D(h) = D_{max} \cdot \frac{h^{\alpha}}{h^{\alpha} + h_{50}^{\alpha}}$$

where:
- $D_{max}$: maximum damage (replacement cost)
- $h_{50}$: depth at which 50% damage occurs
- $\alpha$: shape parameter controlling curve steepness

**Alternative Logistic Form:**
$$D(h) = \frac{D_{max}}{1 + e^{-\beta(h - h_{50})}}$$

**Piecewise Linear Approximation:**
$$D(h) = \begin{cases}
0 & h < h_{threshold} \\
D_{max} \cdot \frac{h - h_{threshold}}{h_{crit} - h_{threshold}} & h_{threshold} \leq h < h_{crit} \\
D_{max} & h \geq h_{crit}
\end{cases}$$

#### 2.1.2 Component-Level Damage Functions

**Structural Damage:**
$$D_{struct}(h) = D_{struct,max} \cdot \Phi\left(\frac{h - \mu_{struct}}{\sigma_{struct}}\right)$$
where $\Phi$ is the standard normal CDF.

**Foundation Damage (Basement):**
$$D_{foundation}(h) = D_{f,max} \cdot \mathbb{1}_{[h > h_{slab}]} \cdot \left(1 - e^{-\gamma_f(h - h_{slab})}\right)$$

**Content Damage:**
$$D_{content}(h) = D_{c,max} \cdot \left(1 - e^{-\gamma_c h}\right) \cdot \eta(h_{inventory})$$
where $\eta(h_{inventory})$ is inventory height factor.

**Inventory Protection Factor:**
$$\eta(h_{inventory}) = \begin{cases}
1 & h_{inventory} = 0 \\
\max\left(0, 1 - \frac{h_{elevated}}{h}\right) & h > 0
\end{cases}$$

#### 2.1.3 Building Type-Specific Curves

**Residential Depth-Damage Parameters:**

| Building Type | $D_{max}$ ($/sq ft) | $h_{50}$ (ft) | $\alpha$ |
|--------------|---------------------|---------------|----------|
| Single-family | 85-120 | 4.0 | 2.5 |
| Multi-family | 65-95 | 3.5 | 2.0 |
| Mobile home | 45-70 | 2.5 | 3.0 |
| Commercial | 150-250 | 5.0 | 2.0 |

**Velocity-Depth Combined Damage:**
$$D(h, v) = D_{max} \cdot \frac{(h \cdot v^{\beta_v})^{\alpha}}{(h \cdot v^{\beta_v})^{\alpha} + (h_{50} \cdot v_{ref}^{\beta_v})^{\alpha}}$$

**Hazus-MH Flood Model:**
$$D(h) = D_{max} \cdot \sum_{i=1}^{n} w_i \cdot f_i(h)$$
where $f_i$ are basis functions and $w_i$ are calibrated weights.

#### 2.1.4 Duration and Contamination Effects

**Duration Multiplier:**
$$M_{dur}(t) = 1 + \delta \cdot \ln(1 + t/t_{ref})$$

**Contamination Damage:**
$$D_{contaminated}(h) = D(h) \cdot (1 + \kappa \cdot C_{haz})$$
where $C_{haz}$ is hazard coefficient (1.0 for clean water, 1.5 for black water).

### 2.2 Wind Damage by Speed

#### 2.2.1 Wind Speed-Damage Relationship

The standard wind damage model uses a Weibull-type formulation:

$$D(v) = 1 - e^{-(v/v_{crit})^k}$$

where:
- $v$: 3-second gust wind speed at 10m height
- $v_{crit}$: critical wind speed for damage initiation
- $k$: shape parameter (typically 3-9)

**Alternative Power Law:**
$$D(v) = \min\left(1, \left(\frac{v - v_{threshold}}{v_{collapse} - v_{threshold}}\right)^n\right)$$

#### 2.2.2 Component-Level Wind Damage

**Roof Cover Damage:**
$$D_{roof}(v) = \Phi\left(\frac{v - v_{roof,50}}{\sigma_{roof}}\right)$$
where $v_{roof,50}$ is wind speed for 50% roof damage.

**Window Failure:**
$$P_{window}(v) = 1 - \exp\left[-\left(\frac{v}{v_{window}}\right)^{k_w}\right]$$

**Door Failure:**
$$P_{door}(v) = 1 - \exp\left[-\left(\frac{v - v_{door,0}}{v_{door}}\right)^{k_d}\right]$$

**Structural Collapse:**
$$P_{collapse}(v) = 1 - \exp\left[-\left(\frac{v}{v_{collapse}}\right)^{k_c}\right]$$

#### 2.2.3 Building-Specific Wind Vulnerability

**Saffir-Simpson Scale Damage Approximation:**

| Category | Wind Speed (mph) | Damage Ratio |
|----------|-----------------|--------------|
| TD (<74) | < 74 | 0.02 - 0.05 |
| Cat 1 | 74-95 | 0.05 - 0.15 |
| Cat 2 | 96-110 | 0.15 - 0.35 |
| Cat 3 | 111-129 | 0.35 - 0.55 |
| Cat 4 | 130-156 | 0.55 - 0.80 |
| Cat 5 | >156 | 0.80 - 1.00 |

**Building Code Factor:**
$$D_{actual}(v) = D_{base}(v) \cdot f_{code}(Y_{built})$$
where $f_{code}(Y_{built})$ adjusts for building code vintage.

#### 2.2.4 Wind-Induced Water Intrusion

Combined wind and rain damage:
$$D_{total}(v, r) = D_{wind}(v) + (1 - D_{wind}(v)) \cdot D_{water}(r) \cdot P_{breach}(v)$$

where $P_{breach}(v)$ is probability of envelope breach:
$$P_{breach}(v) = 1 - (1 - P_{window}(v))^{n_w} \cdot (1 - P_{door}(v))^{n_d}$$

### 2.3 Wildfire Damage

#### 2.3.1 Ember Exposure Modeling

Wildfire damage depends on ember exposure, radiant heat, and direct flame contact:

**Ember Density Model:**
$$\lambda_{ember}(d) = \lambda_0 \cdot e^{-\gamma d} \cdot f_{wind}(v_w)$$
where $d$ is distance from fire front, $\lambda_0$ is baseline ember density.

**Ignition Probability from Embers:**
$$P_{ignition}^{ember} = 1 - \exp(-\lambda_{ember} \cdot A_{vulnerable} \cdot S_{ignition})$$

where $S_{ignition}$ is structure ignitability score:
$$S_{ignition} = w_1 \cdot R_{roof} + w_2 \cdot R_{eave} + w_3 \cdot R_{vent} + w_4 \cdot R_{deck}$$

#### 2.3.2 Defensible Space Effectiveness

**Defensible Space Zones:**

| Zone | Distance | Treatment |
|------|----------|-----------|
| Immediate | 0-5 ft | Non-combustible |
| Intermediate | 5-30 ft | Reduced fuel |
| Extended | 30-100 ft | Managed vegetation |

**Defensible Space Effectiveness:**
$$E_{defensible} = 1 - e^{-\beta_1 Z_1 - \beta_2 Z_2 - \beta_3 Z_3}$$

where $Z_i$ are zone compliance scores (0-1).

**Conditional Damage Probability:**
$$P(D | fire) = P_{ignition}^{ember} \cdot (1 - E_{defensible}) \cdot (1 - R_{construction})$$

where $R_{construction}$ is construction fire resistance:
$$R_{construction} = \sum_{i} w_i \cdot R_i$$

#### 2.3.3 Structure Ignitability Score

**Component Ratings (0-1 scale):**

| Component | Non-combustible | Combustible |
|-----------|-----------------|-------------|
| Roof | 0.0 (Class A) | 1.0 (wood shake) |
| Eave | 0.0 (boxed) | 1.0 (open) |
| Vent | 0.0 (ember-resistant) | 1.0 (standard) |
| Siding | 0.0 (stucco/brick) | 1.0 (wood/vinyl) |
| Deck | 0.0 (concrete) | 1.0 (wood) |

**Composite Ignitability:**
$$I_{structure} = 1 - \prod_{i=1}^{n}(1 - w_i \cdot c_i)$$
where $c_i$ is combustibility of component $i$.

### 2.4 Earthquake Damage

#### 2.4.1 Spectral Acceleration-Based Fragility

Earthquake damage is characterized using spectral acceleration $S_a$:

**Fragility Function:**
$$P(DS \geq ds_i | S_a) = \Phi\left(\frac{\ln(S_a) - \ln(\hat{S}_{a,ds_i})}{\beta_{ds_i}}\right)$$

where:
- $DS$: damage state
- $\hat{S}_{a,ds_i}$: median spectral acceleration for damage state $i$
- $\beta_{ds_i}$: logarithmic standard deviation

**Damage State Probabilities:**
$$P(DS = ds_i | S_a) = P(DS \geq ds_i | S_a) - P(DS \geq ds_{i+1} | S_a)$$

#### 2.4.2 Damage State Definitions

| Damage State | Description | Damage Ratio |
|--------------|-------------|--------------|
| DS0 (None) | No damage | 0.00 |
| DS1 (Slight) | Minor cracks | 0.02 - 0.05 |
| DS2 (Moderate) | Significant damage | 0.10 - 0.30 |
| DS3 (Extensive) | Major damage | 0.50 - 0.80 |
| DS4 (Complete) | Collapse | 1.00 |

**Expected Damage Ratio:**
$$EDR(S_a) = \sum_{i=0}^{4} P(DS = ds_i | S_a) \cdot DR_i$$

#### 2.4.3 Capacity Spectrum Method

**Building Capacity Curve:**
$$S_a^{cap}(d) = \frac{F_y}{W} \cdot \frac{1 + \alpha(d - d_y)}{1 + r_{eff}(d - d_y)}$$

**Demand Spectrum:**
$$S_a^{dem}(T_{eff}, \xi_{eff}) = S_a^{design}(T_{eff}) \cdot \eta(\xi_{eff})$$

**Performance Point:**
$$S_a^{cap}(d^*) = S_a^{dem}(d^*)$$

---

## 3. Chronic Hazard Impact Models

### 3.1 Sea Level Rise (SLR) Impact Models

#### 3.1.1 Probabilistic Sea Level Rise

**Regional Sea Level Rise:**
$$SLR(t) = SLR_{global}(t) + VLM(t) + \epsilon_{regional}(t)$$

where:
- $SLR_{global}$: global mean sea level rise
- $VLM$: vertical land motion
- $\epsilon_{regional}$: regional ocean dynamics

**IPCC AR6 Projections (probabilistic):**
$$SLR_{global}(t) = \sum_{i} w_i \cdot SLR_i(t, SSP_j)$$

where $w_i$ are scenario weights and $SSP_j$ are shared socioeconomic pathways.

#### 3.1.2 Annual Exceedance Probability Evolution

**Time-Varying Exceedance Probability:**
$$p_t(h) = P(H_t > h) = 1 - F_{H_t}(h)$$

**Shifted Distribution:**
$$F_{H_t}(h) = F_{H_0}(h - SLR(t))$$

**Effective Return Period Reduction:**
$$T_t(h) = \frac{T_0(h)}{1 + \frac{SLR(t)}{\sigma} \cdot \frac{\partial T}{\partial \mu}}$$

**Flood Frequency Amplification:**
$$AF(t) = \frac{p_t(h)}{p_0(h)} = \frac{1 - F_{H_0}(h - SLR(t))}{1 - F_{H_0}(h)}$$

For GEV with $\xi = 0$:
$$AF(t) \approx \exp\left(\frac{SLR(t)}{\sigma}\right)$$

#### 3.1.3 Saltwater Intrusion Impacts

**Interface Position (Ghyben-Herzberg):**
$$z_{interface} = \frac{\rho_f}{\rho_s - \rho_f} \cdot h_{fresh}$$

**Saltwater Intrusion Distance:**
$$x_{intrusion}(t) = \sqrt{\frac{K \cdot b \cdot SLR(t) \cdot t}{n \cdot W}}$$

where:
- $K$: hydraulic conductivity
- $b$: aquifer thickness
- $n$: porosity
- $W$: aquifer width

**Well Salinity Impact:**
$$C_{well}(t) = C_0 + (C_{max} - C_0) \cdot \Phi\left(\frac{x_{well} - x_{intrusion}(t)}{\sigma_x}\right)$$

### 3.2 Heat Stress Impact Models

#### 3.2.1 Cooling Degree Day (CDD) Impacts

**Cooling Degree Days:**
$$CDD = \sum_{d=1}^{365} \max(0, T_d - T_{base})$$

**Energy Cost Impact:**
$$\Delta Cost_{cooling} = EUI_{cooling} \cdot CDD \cdot P_{electricity} \cdot A_{floor}$$

where $EUI_{cooling}$ is energy use intensity (kWh/sq ft/CDD).

**Projected CDD Change:**
$$CDD_{future} = CDD_{historic} \cdot \left(1 + \gamma_{CDD} \cdot \Delta T_{global}\right)$$

#### 3.2.2 Labor Productivity Degradation

**Wet Bulb Globe Temperature (WBGT):**
$$WBGT = 0.7 \cdot T_{wet} + 0.2 \cdot T_{globe} + 0.1 \cdot T_{dry}$$

**Productivity Loss Function:**
$$L_{productivity}(WBGT) = \begin{cases}
0 & WBGT < 24°C \\
0.05 \cdot (WBGT - 24) & 24°C \leq WBGT < 28°C \\
0.2 + 0.1 \cdot (WBGT - 28) & 28°C \leq WBGT < 32°C \\
0.6 + 0.15 \cdot (WBGT - 32) & 32°C \leq WBGT < 35°C \\
1.0 & WBGT \geq 35°C
\end{cases}$$

**Annual Productivity Loss:**
$$AL = \sum_{d=1}^{365} L_{productivity}(WBGT_d) \cdot H_{work,d} \cdot N_{workers}$$

#### 3.2.3 Equipment Derating

**Transformer Capacity Reduction:**
$$C_{rated}(T_{ambient}) = C_{nominal} \cdot \left(1 - \alpha_T \cdot (T_{ambient} - T_{rated})\right)$$

**Transmission Line Capacity:**
$$C_{line}(T) = C_0 \cdot \sqrt{\frac{T_{max} - T}{T_{max} - T_0}}$$

### 3.3 Drought Impact Models

#### 3.3.1 Water Scarcity Impacts

**Standardized Precipitation Index (SPI):**
$$SPI = \frac{P - \mu_P}{\sigma_P}$$

**Palmer Drought Severity Index (PDSI):**
$$PDSI_t = 0.897 \cdot PDSI_{t-1} + \frac{Z_t}{3}$$

**Water Supply Reliability:**
$$R_{water} = \frac{Q_{available}}{Q_{demand}} = \frac{Q_{baseline} \cdot (1 - \delta_{drought})}{Q_{demand}}$$

**Operational Impact Cost:**
$$C_{drought} = C_{shortage} \cdot \max(0, 1 - R_{water}) + C_{substitute} \cdot Q_{substitute}$$

#### 3.3.2 Agricultural Yield Effects

**Yield Response Function:**
$$Y = Y_{max} \cdot \left(1 - \sum_{i} k_{y,i} \cdot \left(1 - \frac{ET_{a,i}}{ET_{p,i}}\right)\right)$$

where:
- $k_y$: yield response factor
- $ET_a$: actual evapotranspiration
- $ET_p$: potential evapotranspiration

**Revenue Impact:**
$$\Delta Revenue = (Y_{drought} - Y_{normal}) \cdot P_{crop} \cdot A_{planted}$$

### 3.4 Compound Chronic Effects

#### 3.4.1 Multi-Hazard Interaction

**Combined Impact Score:**
$$CI = 1 - \prod_{i=1}^{n}(1 - I_i)^{w_i}$$

**Correlated Hazard Model:**
$$\mathbf{I} = \mathbf{W} \cdot \mathbf{H} + \boldsymbol{\epsilon}$$

where $\mathbf{W}$ is the impact weight matrix and $\mathbf{H}$ is the hazard vector.

#### 3.4.2 Time-Integrated Damage Accumulation

**Cumulative Damage Function:**
$$D_{cumulative}(t) = \int_0^t \delta(\tau) \cdot e^{-\lambda(t-\tau)} \, d\tau$$

where $\delta(\tau)$ is damage rate and $\lambda$ is recovery rate.

---

## 4. Portfolio-Level Aggregation

### 4.1 Expected Annual Loss (EAL)

#### 4.1.1 EAL Definition and Calculation

The Expected Annual Loss represents the average annual damage across all possible hazard intensities:

$$EAL = \int_0^\infty Damage(IM) \cdot f_{IM}(IM) \cdot dIM$$

where:
- $IM$: intensity measure (e.g., flood depth, wind speed)
- $Damage(IM)$: damage function
- $f_{IM}(IM)$: probability density of intensity measure

**Discrete Approximation:**
$$EAL = \sum_{i=1}^{n} Damage(IM_i) \cdot P(IM_i) \cdot \Delta IM_i$$

#### 4.1.2 EAL for Multiple Assets

For portfolio with $N$ assets:
$$EAL_{portfolio} = \sum_{j=1}^{N} V_j \cdot EAL_j$$

where $V_j$ is the value of asset $j$.

**Geographic Aggregation:**
$$EAL_{region} = \sum_{k=1}^{K} EAL_k \cdot A_k$$
where $A_k$ is area weight for grid cell $k$.

#### 4.1.3 EAL Decomposition

$$EAL = EAL_{acute} + EAL_{chronic}$$

**Acute Component:**
$$EAL_{acute} = \sum_{hazard} \int_{IM} D_h(IM) \cdot \lambda_h(IM) \cdot dIM$$

**Chronic Component:**
$$EAL_{chronic} = \sum_{t=1}^{T} \frac{D_{chronic}(t)}{(1 + r)^t}$$

### 4.2 Probable Maximum Loss (PML)

#### 4.2.1 PML by Return Period

The Probable Maximum Loss at return period $T$:

$$PML_T = Damage(IM_T) = Damage\left(F_{IM}^{-1}\left(1 - \frac{1}{T}\right)\right)$$

**Portfolio PML:**
$$PML_T^{portfolio} = \sum_{j=1}^{N} V_j \cdot D_j(IM_{j,T})$$

**Occurrence PML vs. Aggregate PML:**
- Occurrence PML: Maximum loss from single event
- Aggregate PML: Maximum annual loss from all events

#### 4.2.2 PML Confidence Intervals

**Parameter Uncertainty:**
$$PML_T^{lower} = Damage\left(\hat{IM}_T - z_{\alpha/2} \cdot \sigma_{IM}\right)$$
$$PML_T^{upper} = Damage\left(\hat{IM}_T + z_{\alpha/2} \cdot \sigma_{IM}\right)$$

**Model Uncertainty:**
$$PML_T^{adj} = PML_T \cdot (1 + \epsilon_{model})$$

### 4.3 Value at Risk (VaR) for Physical Risk

#### 4.3.1 VaR Definition

Value at Risk at confidence level $\alpha$:

$$VaR_\alpha = F_{Loss}^{-1}(\alpha)$$

where $F_{Loss}$ is the cumulative distribution function of portfolio losses.

**Interpretation:**
- $VaR_{0.95}$: Loss level exceeded with 5% probability
- $VaR_{0.99}$: Loss level exceeded with 1% probability

#### 4.3.2 VaR Calculation Methods

**Historical Simulation:**
$$VaR_\alpha = L_{(\lceil\alpha \cdot n\rceil)}$$
where $L_{(i)}$ is the $i$-th ordered loss.

**Parametric VaR:**
$$VaR_\alpha = \mu_L + \sigma_L \cdot \Phi^{-1}(\alpha)$$

**Extreme Value VaR:**
$$VaR_\alpha = u + \frac{\sigma_u}{\xi}\left[\left(\frac{n}{N_u}(1-\alpha)\right)^{-\xi} - 1\right]$$

#### 4.3.3 Time Horizon Scaling

**Square Root of Time Rule:**
$$VaR_{\alpha, T} = VaR_{\alpha, 1} \cdot \sqrt{T}$$

**Exact Scaling for i.i.d. Losses:**
$$VaR_{\alpha, T} = F_{L_T}^{-1}(\alpha) = F_{\sum L_i}^{-1}(\alpha)$$

### 4.4 Expected Shortfall (CVaR)

#### 4.4.1 CVaR Definition

Conditional Value at Risk (Expected Shortfall):

$$CVaR_\alpha = E[Loss | Loss > VaR_\alpha] = \frac{1}{1-\alpha} \int_\alpha^1 VaR_u \, du$$

**Alternative Expression:**
$$CVaR_\alpha = VaR_\alpha + \frac{1}{1-\alpha} E[(Loss - VaR_\alpha)^+]$$

#### 4.4.2 CVaR for Different Distributions

**Normal Distribution:**
$$CVaR_\alpha = \mu + \sigma \cdot \frac{\phi(\Phi^{-1}(\alpha))}{1-\alpha}$$

**GPD Tail:**
$$CVaR_\alpha = \frac{VaR_\alpha}{1-\xi} + \frac{\sigma_u - \xi u}{1-\xi}$$

#### 4.4.3 Spectral Risk Measures

Generalized risk measure:
$$M_\phi = \int_0^1 \phi(p) \cdot VaR_p \, dp$$

where $\phi(p)$ is a risk aversion function satisfying:
- $\phi(p) \geq 0$
- $\int_0^1 \phi(p) \, dp = 1$
- $\phi'(p) \geq 0$ (risk aversion)

For CVaR: $\phi(p) = \frac{1}{1-\alpha} \cdot \mathbb{1}_{[p > \alpha]}$

### 4.5 Portfolio Risk Aggregation

#### 4.5.1 Correlation-Adjusted Aggregation

**Gaussian Copula Aggregation:**
$$F_{portfolio}(x) = \Phi_d\left(\Phi^{-1}(F_1(x_1)), ..., \Phi^{-1}(F_d(x_d)); \mathbf{\Sigma}\right)$$

**Variance-Covariance Method:**
$$\sigma_{portfolio}^2 = \sum_{i=1}^{N} \sum_{j=1}^{N} w_i w_j \sigma_i \sigma_j \rho_{ij}$$

#### 4.5.2 Tail Dependence Adjustment

**Tail-Adjusted VaR:**
$$VaR_\alpha^{adj} = VaR_\alpha \cdot \left(1 + \chi_{upper} \cdot \frac{\ln(1-\alpha)}{\ln(0.99)}\right)$$

where $\chi_{upper}$ is upper tail dependence coefficient.

---

## 5. Insurance Pricing Integration

### 5.1 Risk-Based Premium Calculation

#### 5.1.1 Fundamental Premium Equation

$$Premium = EAL + RiskLoad + ExpenseLoad$$

**Expanded Form:**
$$P = \underbrace{E[L]}_{\text{Pure Premium}} + \underbrace{\rho \cdot \sigma_L}_{\text{Risk Load}} + \underbrace{e \cdot P}_{\text{Expense Load}}$$

where:
- $\rho$: risk load factor (return on risk capital)
- $\sigma_L$: standard deviation of losses
- $e$: expense ratio

#### 5.1.2 Risk Load Calculation Methods

**Standard Deviation Method:**
$$RiskLoad = \lambda \cdot \sigma_L$$

**VaR-Based Method:**
$$RiskLoad = r \cdot (VaR_\alpha - E[L])$$

where $r$ is the required return on allocated capital.

**Tail Value at Risk Method:**
$$RiskLoad = \gamma \cdot (TVaR_\alpha - E[L])$$

**Expected Utility Method:**
$$RiskLoad = \frac{1}{2} \cdot A \cdot \sigma_L^2$$
where $A$ is the insurer's risk aversion coefficient.

#### 5.1.3 Capital Allocation

**Marginal Capital Allocation:**
$$K_i = K_{total} \cdot \frac{\partial VaR}{\partial w_i} \cdot \frac{w_i}{VaR}$$

**Euler Allocation Principle:**
$$K_i = E[L_i | L = VaR_\alpha] \cdot \frac{P(L > VaR_\alpha)}{1-\alpha}$$

### 5.2 Reinsurance Cost Pass-Through

#### 5.2.1 Reinsurance Pricing

**Excess of Loss (XoL) Premium:**
$$P_{XoL} = (1 + \theta) \cdot E[(L - D)^+]$$

where:
- $D$: deductible (attachment point)
- $\theta$: reinsurance loading

**Stop Loss Premium:**
$$P_{SL} = (1 + \theta) \cdot E[(L - D)^+ \wedge M]$$

where $M$ is the limit.

#### 5.2.2 Cost Pass-Through to Policyholders

**Proportional Pass-Through:**
$$P_{policy}^{new} = P_{policy}^{base} + \alpha \cdot \frac{P_{reinsurance}}{E[L_{policy}]}$$

**Risk-Adjusted Pass-Through:**
$$P_{policy}^{new} = P_{policy}^{base} \cdot \left(1 + \beta \cdot \frac{\Delta P_{reinsurance}}{P_{reinsurance}^{base}}\right)$$

### 5.3 Uninsurability Thresholds

#### 5.3.1 Technical Uninsurability

**Maximum Loss Ratio:**
$$LR_{max} = \frac{E[L] + RiskLoad}{Premium} \leq 0.85$$

**Coefficient of Variation Threshold:**
$$CV_L = \frac{\sigma_L}{E[L]} > CV_{max} \Rightarrow \text{Uninsurable}$$

**Typical Thresholds:**
- $CV_{max} = 3.0$ for standard risks
- $CV_{max} = 5.0$ for catastrophe risks

#### 5.3.2 Market Uninsurability

**Premium Affordability:**
$$\frac{Premium}{PropertyValue} > 0.05 \Rightarrow \text{Unaffordable}$$

**Coverage Availability:**
$$P(coverage\ available) = \Phi\left(\frac{E[L] - \mu_{market}}{\sigma_{market}}\right)$$

---

## 6. Stochastic Damage Simulation

### 6.1 Monte Carlo Framework

#### 6.1.1 Basic Simulation Algorithm

```
For each simulation s = 1 to N:
    1. Sample hazard intensity: IM_s ~ f_IM(IM)
    2. Apply damage function: D_s = Damage(IM_s)
    3. Apply vulnerability uncertainty: D_s' = D_s * ε_vuln
    4. Aggregate to portfolio: L_s = Σ(V_i * D_{i,s}')
End
```

#### 6.1.2 Hazard Intensity Sampling

**GEV Sampling (Inverse Transform):**
$$X = \mu - \frac{\sigma}{\xi}\left[1 - (-\ln U)^{-\xi}\right], \quad U \sim Uniform(0,1)$$

**GPD Sampling:**
$$Y = \frac{\sigma}{\xi}\left[(1-U)^{-\xi} - 1\right]$$

**Correlated Hazards (Gaussian Copula):**
$$\mathbf{U} = \Phi_d(\mathbf{Z}; \mathbf{\Sigma}), \quad \mathbf{Z} \sim N(0, \mathbf{\Sigma})$$

#### 6.1.3 Damage Function Application

**Stochastic Damage Function:**
$$D(IM) = \bar{D}(IM) \cdot \epsilon_{epistemic} \cdot \epsilon_{aleatory}$$

where:
- $\epsilon_{epistemic} \sim LogNormal(0, \sigma_{model})$
- $\epsilon_{aleatory} \sim LogNormal(0, \sigma_{inherent})$

**Fragility Function Sampling:**
$$P(DS \geq ds_i | IM) = \Phi\left(\frac{\ln(IM) - \ln(\hat{IM}_{ds_i})}{\beta_{ds_i}}\right)$$

### 6.2 Variance Reduction Techniques

#### 6.2.1 Importance Sampling

**Optimal Importance Density:**
$$g^*(x) = \frac{|h(x)| \cdot f(x)}{\int |h(x)| \cdot f(x) \, dx}$$

**Importance Sampling Estimator:**
$$\hat{\mu}_{IS} = \frac{1}{N} \sum_{i=1}^{N} h(X_i) \cdot \frac{f(X_i)}{g(X_i)}$$

**For Tail Probability Estimation:**
$$g(x) = f(x | X > VaR_\alpha)$$

#### 6.2.2 Stratified Sampling

**Stratification:**
$$\hat{\mu}_{strat} = \sum_{k=1}^{K} w_k \cdot \bar{h}_k$$

where $w_k = P(X \in S_k)$ and $\bar{h}_k$ is sample mean in stratum $k$.

**Optimal Allocation:**
$$N_k = N \cdot \frac{w_k \sigma_k}{\sum_j w_j \sigma_j}$$

#### 6.2.3 Antithetic Variates

**Antithetic Estimator:**
$$\hat{\mu}_{AV} = \frac{1}{2N} \sum_{i=1}^{N} [h(U_i) + h(1-U_i)]$$

**Variance Reduction:**
$$Var(\hat{\mu}_{AV}) = \frac{1}{2N}(\sigma^2 + \rho\sigma^2) = \frac{1+\rho}{2} Var(\hat{\mu}_{MC})$$

### 6.3 Convergence Diagnostics

#### 6.3.1 Convergence Criteria

**Standard Error:**
$$SE = \frac{\hat{\sigma}}{\sqrt{N}}$$

**Relative Error:**
$$RE = \frac{SE}{\hat{\mu}}$$

**Target Convergence:**
$$RE < 0.01 \text{ (1\% relative error)}$$

#### 6.3.2 Convergence Tests

**Gelman-Rubin Statistic:**
$$\hat{R} = \sqrt{\frac{\hat{V}}{W}}$$

where $\hat{V}$ is pooled variance and $W$ is within-chain variance.

Convergence achieved when $\hat{R} < 1.1$.

**Effective Sample Size:**
$$N_{eff} = \frac{N}{1 + 2\sum_{k=1}^{\infty} \rho(k)}$$

where $\rho(k)$ is autocorrelation at lag $k$.

---

## 7. Numerical Examples

### 7.1 Example 1: Flood EAL Calculation

**Given:**
- Property value: $V = \\$1,000,000$
- Flood depth follows Gumbel: $\mu = 3$ ft, $\sigma = 1.5$ ft
- Depth-damage: $D(h) = \frac{h^{2.5}}{h^{2.5} + 4^{2.5}}$

**Solution:**

$$EAL = V \cdot \int_0^\infty D(h) \cdot f_H(h) \, dh$$

Using numerical integration:

```python
import numpy as np
from scipy import integrate
from scipy.stats import gumbel_r

V = 1_000_000
mu, sigma = 3, 1.5

def damage(h):
    return h**2.5 / (h**2.5 + 4**2.5)

def integrand(h):
    return damage(h) * gumbel_r.pdf(h, loc=mu, scale=sigma)

EAL_ratio, _ = integrate.quad(integrand, 0, 50)
EAL = V * EAL_ratio
```

**Result:** $EAL \\approx \\$42,500$ (4.25% of property value)

### 7.2 Example 2: 100-Year Return Level

**Given:**
- Annual maximum wind speed: GEV with $\mu = 80$ mph, $\sigma = 12$ mph, $\xi = 0.1$
- Find 100-year return level

**Solution:**

$$x_{100} = \mu + \frac{\sigma}{\xi}\left[(100)^{\xi} - 1\right]$$

$$x_{100} = 80 + \frac{12}{0.1}\left[100^{0.1} - 1\right]$$

$$x_{100} = 80 + 120 \cdot (1.2589 - 1) = 80 + 31.07 = 111.07 \text{ mph}$$

### 7.3 Example 3: Portfolio VaR Calculation

**Given:**
- Portfolio of 100 properties
- Individual losses: $L_i \sim LogNormal(\mu_i, \sigma_i)$
- Correlation: $\rho_{ij} = 0.3$ for all $i \\neq j$

**Solution:**

Using Monte Carlo with Gaussian copula:

```python
import numpy as np
from scipy.stats import lognorm, norm

n = 100
n_sims = 100_000
mu = np.array([...])  # individual means
sigma = np.array([...])  # individual std devs
values = np.array([...])  # property values

# Correlation matrix
rho = 0.3
Sigma = np.eye(n) * (1 - rho) + rho

# Generate correlated uniforms
Z = np.random.multivariate_normal(np.zeros(n), Sigma, n_sims)
U = norm.cdf(Z)

# Transform to loss ratios
loss_ratios = np.array([lognorm.ppf(U[:, i], s=sigma[i], 
    scale=np.exp(mu[i])) for i in range(n)]).T

# Portfolio losses
portfolio_losses = np.sum(loss_ratios * values, axis=1)

# VaR calculations
VaR_95 = np.percentile(portfolio_losses, 95)
VaR_99 = np.percentile(portfolio_losses, 99)
CVaR_95 = np.mean(portfolio_losses[portfolio_losses > VaR_95])
```

### 7.4 Example 4: Insurance Premium Calculation

**Given:**
- EAL = $50,000
- $\sigma_L = \\$150,000$
- Risk load factor: $\lambda = 0.15$
- Expense ratio: $e = 0.25$

**Solution:**

$$RiskLoad = 0.15 \cdot 150,000 = \\$22,500$$

$$Premium = \frac{EAL + RiskLoad}{1 - e} = \frac{50,000 + 22,500}{0.75} = \\$96,667$$

---

## 8. Regulatory Framework Integration

### 8.1 Basel IV Physical Risk Requirements

**Risk Weight Adjustment:**
$$RW_{physical} = RW_{base} \cdot (1 + \alpha \cdot RiskScore)$$

**Expected Credit Loss (ECL) under IFRS 9:**
$$ECL = PD \cdot LGD \cdot EAD \cdot (1 + \beta_{physical})$$

### 8.2 NGFS Scenario Integration

**Scenario-Conditional Loss:**
$$L_{scenario} = L_{baseline} \cdot (1 + \gamma \cdot \Delta T_{scenario})$$

**Scenario Weighting:**
$$E[L] = \sum_{i} w_i \cdot L_{scenario_i}$$

---

## References

1. Coles, S. (2001). *An Introduction to Statistical Modeling of Extreme Values*. Springer.
2. FEMA (2021). *Hazus Flood Model Technical Manual*.
3. IPCC (2021). *Climate Change 2021: The Physical Science Basis*.
4. Embrechts, P., Klüppelberg, C., & Mikosch, T. (1997). *Modelling Extremal Events*. Springer.
5. Porter, K. et al. (2017). * fragility functions for earthquake engineering*.

---

*Document prepared for AA Impact Inc. Physical Risk Assessment Framework*
