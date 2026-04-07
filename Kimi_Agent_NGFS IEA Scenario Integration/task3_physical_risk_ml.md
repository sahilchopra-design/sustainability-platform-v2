# Task 3: Physical Risk Modeling & Stochastic Damage Functions - ML Architecture

## Executive Summary

This document presents a comprehensive machine learning architecture for physical risk modeling in mortgage portfolio management. The framework integrates Bayesian Neural Networks for uncertainty-aware damage function estimation, fragility curve construction for structural vulnerability assessment, copula-based multi-hazard compounding, and credit risk parameter adjustments.

---

## 1. Bayesian Neural Networks for Damage Functions

### 1.1 Theoretical Foundation

Bayesian Neural Networks (BNNs) provide a principled framework for uncertainty quantification in damage function estimation by treating network weights as probability distributions rather than point estimates.

#### 1.1.1 Probabilistic Model Specification

Given a dataset $\mathcal{D} = \{(\mathbf{x}_i, y_i)\}_{i=1}^{N}$ where $\mathbf{x}_i \in \mathbb{R}^d$ represents hazard intensity measures and property characteristics, and $y_i \in [0,1]$ represents damage ratio, the Bayesian framework specifies:

**Prior Distribution over Weights:**

$$p(\mathbf{w}) = \mathcal{N}(\mathbf{0}, \sigma_p^2 \mathbf{I}) = \frac{1}{(2\pi\sigma_p^2)^{d_w/2}} \exp\left(-\frac{\|\mathbf{w}\|^2}{2\sigma_p^2}\right)$$

where $d_w$ is the dimensionality of the weight vector.

**Likelihood Function:**

For homoscedastic noise:
$$p(y|\mathbf{x}, \mathbf{w}) = \mathcal{N}(f_{\mathbf{w}}(\mathbf{x}), \sigma_y^2) = \frac{1}{\sqrt{2\pi\sigma_y^2}} \exp\left(-\frac{(y - f_{\mathbf{w}}(\mathbf{x}))^2}{2\sigma_y^2}\right)$$

For heteroscedastic noise (aleatoric uncertainty):
$$p(y|\mathbf{x}, \mathbf{w}) = \mathcal{N}(f_{\mathbf{w}}^{\mu}(\mathbf{x}), f_{\mathbf{w}}^{\sigma}(\mathbf{x})^2)$$

where the network outputs both mean and variance:
$$f_{\mathbf{w}}(\mathbf{x}) = [f_{\mathbf{w}}^{\mu}(\mathbf{x}), f_{\mathbf{w}}^{\sigma}(\mathbf{x})]$$

**Posterior Distribution:**

$$p(\mathbf{w}|\mathcal{D}) = \frac{p(\mathcal{D}|\mathbf{w})p(\mathbf{w})}{p(\mathcal{D})} = \frac{p(\mathcal{D}|\mathbf{w})p(\mathbf{w})}{\int p(\mathcal{D}|\mathbf{w})p(\mathbf{w})d\mathbf{w}}$$

The marginal likelihood (evidence) is intractable:
$$p(\mathcal{D}) = \int p(\mathcal{D}|\mathbf{w})p(\mathbf{w})d\mathbf{w}$$

### 1.2 Variational Inference Approximation

#### 1.2.1 Evidence Lower Bound (ELBO)

We approximate the true posterior $p(\mathbf{w}|\mathcal{D})$ with a variational distribution $q_{\boldsymbol{\theta}}(\mathbf{w})$ parameterized by $\boldsymbol{\theta}$:

$$q_{\boldsymbol{\theta}}(\mathbf{w}) = \prod_{i=1}^{d_w} \mathcal{N}(w_i; \mu_i, \sigma_i^2)$$

The Kullback-Leibler divergence between the approximate and true posteriors:

$$D_{KL}(q_{\boldsymbol{\theta}}(\mathbf{w}) || p(\mathbf{w}|\mathcal{D})) = \int q_{\boldsymbol{\theta}}(\mathbf{w}) \log\frac{q_{\boldsymbol{\theta}}(\mathbf{w})}{p(\mathbf{w}|\mathcal{D})} d\mathbf{w}$$

Minimizing this divergence is equivalent to maximizing the ELBO:

$$\mathcal{L}(\boldsymbol{\theta}) = \mathbb{E}_{q_{\boldsymbol{\theta}}(\mathbf{w})}[\log p(\mathcal{D}|\mathbf{w})] - D_{KL}(q_{\boldsymbol{\theta}}(\mathbf{w}) || p(\mathbf{w}))$$

**Expanded ELBO Form:**

For the $i$-th data point:
$$\mathcal{L}_i(\boldsymbol{\theta}) = \mathbb{E}_{q_{\boldsymbol{\theta}}(\mathbf{w})}\left[\log p(y_i|\mathbf{x}_i, \mathbf{w})\right] - \frac{1}{N}D_{KL}(q_{\boldsymbol{\theta}}(\mathbf{w}) || p(\mathbf{w}))$$

The KL divergence for Gaussian prior and approximate posterior:

$$D_{KL}(q_{\boldsymbol{\theta}}(\mathbf{w}) || p(\mathbf{w})) = \frac{1}{2}\sum_{i=1}^{d_w}\left(\frac{\sigma_i^2}{\sigma_p^2} + \frac{\mu_i^2}{\sigma_p^2} - 1 - \log\frac{\sigma_i^2}{\sigma_p^2}\right)$$

#### 1.2.2 Reparameterization Trick

To enable gradient-based optimization, we use the reparameterization:

$$\mathbf{w} = \boldsymbol{\mu} + \boldsymbol{\sigma} \odot \boldsymbol{\epsilon}, \quad \boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$$

This allows Monte Carlo estimation of expectations:

$$\mathbb{E}_{q_{\boldsymbol{\theta}}(\mathbf{w})}[\log p(\mathcal{D}|\mathbf{w})] \approx \frac{1}{M}\sum_{j=1}^{M} \log p(\mathcal{D}|\mathbf{w}^{(j)})$$

where $\mathbf{w}^{(j)} = \boldsymbol{\mu} + \boldsymbol{\sigma} \odot \boldsymbol{\epsilon}^{(j)}$.

### 1.3 Bayes by Backprop Algorithm

#### 1.3.1 Local Reparameterization

For computational efficiency, we apply local reparameterization at the layer level. For layer $l$ with input $\mathbf{h}_{l-1}$:

$$\mathbf{z}_l = \mathbf{W}_l \mathbf{h}_{l-1} + \mathbf{b}_l$$

With variational parameters $\boldsymbol{\mu}_l, \boldsymbol{\sigma}_l$:

$$q(\mathbf{W}_l) = \prod_{i,j} \mathcal{N}(W_{l,ij}; \mu_{l,ij}, \sigma_{l,ij}^2)$$

The output distribution:

$$q(\mathbf{z}_l) = \prod_{i} \mathcal{N}(z_{l,i}; \gamma_{l,i}, \delta_{l,i}^2)$$

where:
$$\gamma_{l,i} = \sum_j \mu_{l,ij} h_{l-1,j} + \mu_{l,i}^{(b)}$$
$$\delta_{l,i}^2 = \sum_j \sigma_{l,ij}^2 h_{l-1,j}^2 + (\sigma_{l,i}^{(b)})^2$$

#### 1.3.2 Gradient Computation

The gradients of the ELBO with respect to variational parameters:

$$\nabla_{\boldsymbol{\mu}} \mathcal{L} = \nabla_{\boldsymbol{\mu}} \mathbb{E}_{q}[\log p(\mathcal{D}|\mathbf{w})] - \nabla_{\boldsymbol{\mu}} D_{KL}(q||p)$$

$$\nabla_{\boldsymbol{\sigma}} \mathcal{L} = \nabla_{\boldsymbol{\sigma}} \mathbb{E}_{q}[\log p(\mathcal{D}|\mathbf{w})] - \nabla_{\boldsymbol{\sigma}} D_{KL}(q||p)$$

For the KL term:

$$\nabla_{\mu_i} D_{KL} = \frac{\mu_i}{\sigma_p^2}$$

$$\nabla_{\sigma_i} D_{KL} = \frac{\sigma_i}{\sigma_p^2} - \frac{1}{\sigma_i}$$

### 1.4 Monte Carlo Dropout as Approximate Bayesian Inference

#### 1.4.1 Dropout as Variational Approximation

Monte Carlo (MC) Dropout provides a computationally efficient approximation to Bayesian inference. Consider a neural network with $L$ layers:

$$\mathbf{h}_l = \sigma(\mathbf{W}_l \mathbf{h}_{l-1} + \mathbf{b}_l), \quad l = 1, ..., L$$

With dropout applied at each layer:

$$\mathbf{h}_l = \sigma(\mathbf{W}_l (\mathbf{z}_l \odot \mathbf{h}_{l-1}) + \mathbf{b}_l)$$

where $\mathbf{z}_l \sim \text{Bernoulli}(p_l)$ and $p_l$ is the dropout rate.

#### 1.4.2 Variational Interpretation

The dropout training objective corresponds to minimizing:

$$\mathcal{L}_{dropout} = \frac{1}{N}\sum_{i=1}^{N} \mathbb{E}_{q}[\|y_i - \hat{y}(\mathbf{x}_i, \mathbf{w})\|^2] + \lambda \sum_{l=1}^{L} \frac{p_l}{2}\|\mathbf{W}_l\|_2^2$$

This is equivalent to the ELBO with:
- Variational distribution: $q(\mathbf{W}_l) = \mathbf{M}_l \cdot \text{diag}([z_{l,j}]_{j=1}^{K_l})$
- Prior: $p(\mathbf{W}_l) = \prod_{i,j} \mathcal{N}(W_{l,ij}; 0, l^2/p_l)$

where $\mathbf{M}_l$ are the learned weight matrices and $l^2$ is a length scale hyperparameter.

#### 1.4.3 MC Dropout Prediction

For prediction with uncertainty quantification:

$$p(y|\mathbf{x}, \mathcal{D}) \approx \frac{1}{T}\sum_{t=1}^{T} p(y|\mathbf{x}, \hat{\mathbf{w}}_t)$$

where $\hat{\mathbf{w}}_t$ are weights sampled via dropout at test time.

**Algorithm: MC Dropout Prediction**

```
Algorithm: MC_Dropout_Predict
Input: Input x, Trained network with dropout, Number of samples T
Output: Predictive mean μ_pred, Predictive variance σ²_pred

1.  Initialize: predictions = []
2.  FOR t = 1 TO T DO:
3.      Enable dropout at test time
4.      y_t = forward_pass(x, dropout_enabled=True)
5.      APPEND y_t TO predictions
6.  END FOR
7.  μ_pred = MEAN(predictions)
8.  σ²_pred = VARIANCE(predictions)
9.  RETURN (μ_pred, σ²_pred)
```

### 1.5 Uncertainty Decomposition

#### 1.5.1 Epistemic Uncertainty (Model Uncertainty)

Epistemic uncertainty captures uncertainty due to limited training data and model parameters:

$$\sigma_{epistemic}^2(\mathbf{x}) = \text{Var}_{p(\mathbf{w}|\mathcal{D})}[f_{\mathbf{w}}(\mathbf{x})]$$

For MC Dropout approximation:

$$\sigma_{epistemic}^2(\mathbf{x}) \approx \frac{1}{T}\sum_{t=1}^{T} f_{\hat{\mathbf{w}}_t}(\mathbf{x})^2 - \left(\frac{1}{T}\sum_{t=1}^{T} f_{\hat{\mathbf{w}}_t}(\mathbf{x})\right)^2$$

#### 1.5.2 Aleatoric Uncertainty (Data Noise)

Aleatoric uncertainty captures irreducible noise in the data:

For homoscedastic case:
$$\sigma_{aleatoric}^2 = \sigma_y^2$$

For heteroscedastic case (learned):
$$\sigma_{aleatoric}^2(\mathbf{x}) = f_{\mathbf{w}}^{\sigma}(\mathbf{x})^2$$

#### 1.5.3 Total Predictive Uncertainty

$$\sigma_{total}^2(\mathbf{x}) = \sigma_{epistemic}^2(\mathbf{x}) + \sigma_{aleatoric}^2(\mathbf{x})$$

Or more precisely for Gaussian likelihood:

$$\sigma_{total}^2(\mathbf{x}) = \underbrace{\mathbb{E}_{p(\mathbf{w}|\mathcal{D})}[f_{\mathbf{w}}^{\sigma}(\mathbf{x})^2]}_{\text{Expected aleatoric}} + \underbrace{\text{Var}_{p(\mathbf{w}|\mathcal{D})}[f_{\mathbf{w}}^{\mu}(\mathbf{x})]}_{\text{Epistemic}}$$

### 1.6 BNN Architecture for Damage Function Estimation

```
Algorithm: BayesByBackprop_DamageNet
Input: Training data D = {(x_i, y_i)}, Learning rate η, Prior variance σ²_p
Output: Trained variational parameters θ = {μ, σ}

1.  Initialize: μ ~ N(0, 0.1), log(σ) ~ N(-3, 0.1)
2.  REPEAT until convergence:
3.      Sample minibatch B from D
4.      // Forward pass with sampling
5.      FOR each layer l:
6.          ε ~ N(0, I)  // Sample noise
7.          W_l = μ_l + σ_l ⊙ ε  // Reparameterization
8.          z_l = activation(W_l · h_{l-1} + b_l)
9.      END FOR
10.     // Compute ELBO
11.     log_likelihood = Σ_{(x,y)∈B} log N(y; f_w(x), σ²_y)
12.     KL = Σ_l Σ_{i,j} 0.5·[σ²_{l,ij}/σ²_p + μ²_{l,ij}/σ²_p - 1 - log(σ²_{l,ij}/σ²_p)]
13.     L = log_likelihood - (|B|/|D|)·KL
14.     // Backpropagation
15.     ∇_μ L, ∇_σ L = compute_gradients(L)
16.     μ = μ + η·∇_μ L
17.     σ = σ·exp(η·∇_σ L)  // Multiplicative update for positivity
18. RETURN θ = {μ, σ}
```

### 1.7 Network Architecture Specification

**Input Layer:**
- Hazard intensity measures: $IM \in \mathbb{R}^{n_{IM}}$
- Property characteristics: $\mathbf{c} \in \mathbb{R}^{n_c}$ (age, stories, construction type, etc.)
- Geospatial features: $\mathbf{g} \in \mathbb{R}^{n_g}$ (elevation, distance to coast, etc.)

**Hidden Layers (Bayesian):**
```
Layer 1: d_input → 128 neurons
    q(W_1) = N(μ_1, σ_1²), q(b_1) = N(μ_1^b, σ_1^b²)
    Activation: ReLU
    
Layer 2: 128 → 64 neurons
    q(W_2) = N(μ_2, σ_2²), q(b_2) = N(μ_2^b, σ_2^b²)
    Activation: ReLU
    
Layer 3: 64 → 32 neurons
    q(W_3) = N(μ_3, σ_3²), q(b_3) = N(μ_3^b, σ_3^b²)
    Activation: ReLU
```

**Output Layer (Heteroscedastic):**
```
Output: 32 → 2 neurons
    q(W_4) = N(μ_4, σ_4²), q(b_4) = N(μ_4^b, σ_4^b²)
    Output: [μ_damage, log(σ_damage)]
    
Damage prediction: μ_damage ∈ [0, 1] (via sigmoid)
Uncertainty: σ_damage > 0 (via softplus)
```

---

## 2. Fragility Curve Construction

### 2.1 Log-Normal Fragility Function

Fragility curves quantify the probability of exceeding a damage state given an intensity measure.

#### 2.1.1 Basic Formulation

For damage state $ds_i$, the fragility function is:

$$P(DS \geq ds_i | IM) = \Phi\left(\frac{\ln(IM) - \ln(\widehat{IM}_{ds_i})}{\beta_{ds_i}}\right)$$

where:
- $\Phi(\cdot)$ is the standard normal cumulative distribution function
- $\widehat{IM}_{ds_i}$ is the median intensity at which $P(DS \geq ds_i | IM) = 0.5$
- $\beta_{ds_i}$ is the logarithmic standard deviation (dispersion)

**Alternative Parameterization:**

$$P(DS \geq ds_i | IM) = \Phi\left(\frac{\ln(IM/\widehat{IM}_{ds_i})}{\beta_{ds_i}}\right)$$

#### 2.1.2 Damage State Probabilities

For discrete damage states $ds_0, ds_1, ..., ds_k$ where $ds_0$ = "no damage":

$$P(DS = ds_i | IM) = P(DS \geq ds_i | IM) - P(DS \geq ds_{i+1} | IM)$$

With boundary conditions:
- $P(DS \geq ds_0 | IM) = 1$
- $P(DS \geq ds_{k+1} | IM) = 0$

The complete probability mass function:

$$P(DS = ds_i | IM) = \begin{cases}
1 - \Phi\left(\frac{\ln(IM) - \ln(\widehat{IM}_{ds_1})}{\beta_{ds_1}}\right) & i = 0 \\
\Phi\left(\frac{\ln(IM) - \ln(\widehat{IM}_{ds_i})}{\beta_{ds_i}}\right) - \Phi\left(\frac{\ln(IM) - \ln(\widehat{IM}_{ds_{i+1}})}{\beta_{ds_{i+1}}}\right) & 1 \leq i < k \\
\Phi\left(\frac{\ln(IM) - \ln(\widehat{IM}_{ds_k})}{\beta_{ds_k}}\right) & i = k
\end{cases}$$

### 2.2 Maximum Likelihood Estimation

#### 2.2.1 Likelihood Function

Given observed data $\{(IM_j, ds_j)\}_{j=1}^{N}$ where $ds_j \in \{0, 1, ..., k\}$:

$$\mathcal{L}(\boldsymbol{\theta}; \mathcal{D}) = \prod_{j=1}^{N} P(DS = ds_j | IM_j; \boldsymbol{\theta})$$

where $\boldsymbol{\theta} = \{\ln(\widehat{IM}_{ds_i}), \beta_{ds_i}\}_{i=1}^{k}$.

**Log-Likelihood:**

$$\ell(\boldsymbol{\theta}; \mathcal{D}) = \sum_{j=1}^{N} \log P(DS = ds_j | IM_j; \boldsymbol{\theta})$$

#### 2.2.2 Score Function and Fisher Information

The score function (gradient of log-likelihood):

$$\mathbf{U}(\boldsymbol{\theta}) = \nabla_{\boldsymbol{\theta}} \ell(\boldsymbol{\theta}; \mathcal{D}) = \sum_{j=1}^{N} \frac{\nabla_{\boldsymbol{\theta}} P(DS = ds_j | IM_j; \boldsymbol{\theta})}{P(DS = ds_j | IM_j; \boldsymbol{\theta})}$$

For a single parameter $\theta_i$:

$$U_i(\boldsymbol{\theta}) = \sum_{j=1}^{N} \frac{\partial}{\partial \theta_i} \log P(DS = ds_j | IM_j; \boldsymbol{\theta})$$

**Fisher Information Matrix:**

$$\mathbf{I}(\boldsymbol{\theta}) = \mathbb{E}\left[\mathbf{U}(\boldsymbol{\theta})\mathbf{U}(\boldsymbol{\theta})^T\right] = -\mathbb{E}\left[\nabla_{\boldsymbol{\theta}}^2 \ell(\boldsymbol{\theta}; \mathcal{D})\right]$$

The observed information matrix:

$$\mathbf{J}(\hat{\boldsymbol{\theta}}) = -\nabla_{\boldsymbol{\theta}}^2 \ell(\hat{\boldsymbol{\theta}}; \mathcal{D})$$

#### 2.2.3 Confidence Intervals

Asymptotic normality of MLE:

$$\hat{\boldsymbol{\theta}} \xrightarrow{d} \mathcal{N}(\boldsymbol{\theta}_0, \mathbf{I}(\boldsymbol{\theta}_0)^{-1})$$

For parameter $\theta_i$, the $(1-\alpha)$ confidence interval:

$$\hat{\theta}_i \pm z_{1-\alpha/2} \cdot \sqrt{[\mathbf{J}(\hat{\boldsymbol{\theta}})^{-1}]_{ii}}$$

For the fragility curve itself, using the delta method:

$$\text{Var}(\hat{P}(DS \geq ds_i | IM)) \approx \nabla_{\boldsymbol{\theta}} P^T \cdot \mathbf{J}(\hat{\boldsymbol{\theta}})^{-1} \cdot \nabla_{\boldsymbol{\theta}} P$$

where:

$$\nabla_{\boldsymbol{\theta}} P = \left[\frac{\partial P}{\partial \ln(\widehat{IM}_{ds_i})}, \frac{\partial P}{\partial \beta_{ds_i}}\right]^T$$

$$\frac{\partial P}{\partial \ln(\widehat{IM}_{ds_i})} = -\frac{1}{\beta_{ds_i}} \phi\left(\frac{\ln(IM) - \ln(\widehat{IM}_{ds_i})}{\beta_{ds_i}}\right)$$

$$\frac{\partial P}{\partial \beta_{ds_i}} = -\frac{\ln(IM) - \ln(\widehat{IM}_{ds_i})}{\beta_{ds_i}^2} \phi\left(\frac{\ln(IM) - \ln(\widehat{IM}_{ds_i})}{\beta_{ds_i}}\right)$$

### 2.3 Hierarchical Bayesian Fragility Curves

#### 2.3.1 Hierarchical Model Structure

For multiple building classes $c = 1, ..., C$:

**Level 1 (Observation):**
$$P(DS_{j,c} \geq ds_i | IM_{j,c}) = \Phi\left(\frac{\ln(IM_{j,c}) - \ln(\widehat{IM}_{ds_i,c})}{\beta_{ds_i,c}}\right)$$

**Level 2 (Building Class):**
$$\ln(\widehat{IM}_{ds_i,c}) \sim \mathcal{N}(\mu_{\ln IM, ds_i}, \sigma_{\ln IM, ds_i}^2)$$
$$\beta_{ds_i,c} \sim \text{Log-Normal}(\mu_{\beta, ds_i}, \sigma_{\beta, ds_i}^2)$$

**Level 3 (Hyperprior):**
$$\mu_{\ln IM, ds_i} \sim \mathcal{N}(\mu_0, \sigma_0^2)$$
$$\sigma_{\ln IM, ds_i}^2 \sim \text{Inv-Gamma}(\alpha_0, \beta_0)$$

#### 2.3.2 Posterior Inference

The joint posterior:

$$p(\{\ln(\widehat{IM}_{ds_i,c}), \beta_{ds_i,c}\}, \{\mu_{\ln IM, ds_i}, \sigma_{\ln IM, ds_i}^2\} | \mathcal{D})$$

$$\propto \prod_{c=1}^{C}\prod_{j=1}^{N_c} P(DS_{j,c} | IM_{j,c}; \ln(\widehat{IM}_{ds_i,c}), \beta_{ds_i,c})$$
$$\times \prod_{c=1}^{C} p(\ln(\widehat{IM}_{ds_i,c}) | \mu_{\ln IM, ds_i}, \sigma_{\ln IM, ds_i}^2) p(\beta_{ds_i,c} | \mu_{\beta, ds_i}, \sigma_{\beta, ds_i}^2)$$
$$\times p(\mu_{\ln IM, ds_i}) p(\sigma_{\ln IM, ds_i}^2)$$

#### 2.3.3 MCMC Sampling

```
Algorithm: Hierarchical_Fragility_MCMC
Input: Data D = {(IM_j,c, DS_j,c)}, Number of samples S
Output: Posterior samples {θ^(s)}_{s=1}^S

1.  Initialize: θ^(0) = {ln(IM̂_ds_i,c)^(0), β_ds_i,c^(0)}
2.  FOR s = 1 TO S DO:
3.      // Sample building class parameters (Gibbs/Metropolis)
4.      FOR each class c DO:
5.          Propose: ln(IM̂_ds_i,c)* ~ q(·|ln(IM̂_ds_i,c)^(s-1))
6.          Compute: α = min(1, p(θ*|D)/p(θ^(s-1)|D) · q(θ^(s-1)|θ*)/q(θ*|θ^(s-1)))
7.          Accept/Reject ln(IM̂_ds_i,c)^(s) with probability α
8.          Repeat for β_ds_i,c
9.      END FOR
10.     // Sample hyperparameters (conjugate Gibbs)
11.     Sample μ_ln IM,ds_i^(s) ~ N(μ_n, σ_n²)
12.     Sample σ²_ln IM,ds_i^(s) ~ Inv-Gamma(α_n, β_n)
13. END FOR
14. RETURN {θ^(s)}_{s=1}^S
```

### 2.4 Fragility Curve Aggregation

#### 2.4.1 Portfolio-Level Fragility

For a portfolio with building class distribution $w_c$:

$$P_{portfolio}(DS \geq ds_i | IM) = \sum_{c=1}^{C} w_c \cdot P_c(DS \geq ds_i | IM)$$

#### 2.4.2 Spatial Aggregation

For geographic regions $r = 1, ..., R$ with exposure $E_r$:

$$P_{regional}(DS \geq ds_i | IM) = \frac{\sum_{r=1}^{R} E_r \cdot P_r(DS \geq ds_i | IM_r)}{\sum_{r=1}^{R} E_r}$$

---

## 3. Damage Function Mathematical Forms

### 3.1 Power Law Damage Function

#### 3.1.1 Basic Form

$$Damage(IM) = a \cdot IM^b$$

where:
- $a > 0$ is the scale parameter
- $b > 0$ is the elasticity parameter
- $IM$ is the intensity measure

**Properties:**
- $Damage(0) = 0$
- $rac{d}{dIM}Damage(IM) = ab \cdot IM^{b-1} > 0$ (monotonically increasing)
- $rac{d^2}{dIM^2}Damage(IM) = ab(b-1) \cdot IM^{b-2}$ (convex if $b > 1$, concave if $b < 1$)

#### 3.1.2 Bounded Power Law

To ensure $Damage \in [0, 1]$:

$$Damage(IM) = \min\left(1, a \cdot IM^b\right)$$

Or with smooth saturation:

$$Damage(IM) = \frac{a \cdot IM^b}{1 + a \cdot IM^b}$$

#### 3.1.3 Parameter Estimation

Linearization via log-transform:

$$\ln(Damage) = \ln(a) + b \cdot \ln(IM) + \epsilon$$

OLS estimation:

$$\hat{b} = \frac{\sum_{i=1}^{N}(\ln(IM_i) - \overline{\ln(IM)})(\ln(Damage_i) - \overline{\ln(Damage)})}{\sum_{i=1}^{N}(\ln(IM_i) - \overline{\ln(IM)})^2}$$

$$\widehat{\ln(a)} = \overline{\ln(Damage)} - \hat{b} \cdot \overline{\ln(IM)}$$

### 3.2 Exponential Damage Function

#### 3.2.1 Basic Form

$$Damage(IM) = 1 - e^{-c \cdot IM}$$

where $c > 0$ controls the rate of damage accumulation.

**Properties:**
- $Damage(0) = 0$
- $\lim_{IM \to \infty} Damage(IM) = 1$
- $\frac{d}{dIM}Damage(IM) = c \cdot e^{-c \cdot IM} > 0$
- $\frac{d^2}{dIM^2}Damage(IM) = -c^2 \cdot e^{-c \cdot IM} < 0$ (concave)

#### 3.2.2 Modified Exponential

With threshold intensity $IM_0$:

$$Damage(IM) = \begin{cases}
0 & IM < IM_0 \\
1 - e^{-c(IM - IM_0)} & IM \geq IM_0
\end{cases}$$

#### 3.2.3 Double Exponential

For multi-phase damage:

$$Damage(IM) = 1 - e^{-c_1 \cdot IM} - c_2 \cdot IM \cdot e^{-c_3 \cdot IM}$$

### 3.3 Sigmoid Damage Function

#### 3.3.1 Logistic Form

$$Damage(IM) = \frac{1}{1 + e^{-k(IM - IM_{50})}}$$

where:
- $k > 0$ controls the steepness
- $IM_{50}$ is the intensity at which $Damage = 0.5$

**Properties:**
- $Damage(IM_{50}) = 0.5$
- $\frac{d}{dIM}Damage(IM) = k \cdot Damage(IM) \cdot (1 - Damage(IM))$
- Maximum slope at $IM = IM_{50}$: $\frac{d}{dIM}Damage(IM_{50}) = \frac{k}{4}$

#### 3.3.2 Generalized Sigmoid

$$Damage(IM) = Damage_{min} + \frac{Damage_{max} - Damage_{min}}{1 + e^{-k(IM - IM_{50})}}$$

where $Damage_{min}$ and $Damage_{max}$ bound the damage range.

#### 3.3.3 Double Sigmoid

For bimodal damage patterns:

$$Damage(IM) = w_1 \cdot \sigma(k_1(IM - IM_{50,1})) + w_2 \cdot \sigma(k_2(IM - IM_{50,2}))$$

where $\sigma(\cdot)$ is the sigmoid function and $w_1 + w_2 = 1$.

### 3.4 Piecewise Linear Damage Function

#### 3.4.1 Multi-Segment Form

For intensity thresholds $IM_0 < IM_1 < ... < IM_m$:

$$Damage(IM) = \begin{cases}
0 & IM < IM_0 \\
a_1 \cdot IM + b_1 & IM_0 \leq IM < IM_1 \\
a_2 \cdot IM + b_2 & IM_1 \leq IM < IM_2 \\
\vdots & \vdots \\
1 & IM \geq IM_m
\end{cases}$$

**Continuity Constraints:**

At each breakpoint $IM_i$:
$$a_i \cdot IM_i + b_i = a_{i+1} \cdot IM_i + b_{i+1}$$

#### 3.4.2 Constrained Estimation

Optimization problem:

$$\min_{\{a_i, b_i\}} \sum_{j=1}^{N} (Damage_j - Damage(IM_j))^2$$

Subject to:
- $Damage(IM_0) = 0$
- $Damage(IM_m) = 1$
- Continuity at breakpoints
- $a_i \geq 0$ (monotonicity)
- $a_{i+1} \geq a_i$ (convexity, optional)

### 3.5 Asset-Specific Parameterization

#### 3.5.1 Construction Type Modifiers

For construction type $c$:

$$Damage_c(IM) = Damage_{base}(IM) \cdot \gamma_c$$

where $\gamma_c$ is the vulnerability modifier.

#### 3.5.2 Multi-Factor Model

$$Damage(IM; \mathbf{x}) = Damage_{base}(IM) \cdot \prod_{f=1}^{F} \delta_f^{x_f}$$

where:
- $\mathbf{x}$ is a vector of binary building characteristics
- $\delta_f$ is the damage modifier for factor $f$

#### 3.5.3 Age-Dependent Deterioration

$$Damage(IM; age) = Damage_{base}(IM) \cdot (1 + \alpha \cdot age^{\beta})$$

where $\alpha, \beta > 0$ model structural deterioration.

### 3.6 Damage Function Selection Criteria

#### 3.6.1 Information Criteria

**Akaike Information Criterion:**
$$AIC = 2k - 2\ell(\hat{\boldsymbol{\theta}})$$

**Bayesian Information Criterion:**
$$BIC = k\ln(N) - 2\ell(\hat{\boldsymbol{\theta}})$$

where $k$ is the number of parameters and $N$ is the sample size.

#### 3.6.2 Cross-Validation

$$CV = \frac{1}{N}\sum_{i=1}^{N} (Damage_i - \hat{D}_{-i}(IM_i))^2$$

where $\hat{D}_{-i}$ is the prediction with the $i$-th observation excluded.

---

## 4. Copulas for Multi-Hazard Compounding

### 4.1 Copula Fundamentals

#### 4.1.1 Sklar's Theorem

For random variables $X_1, ..., X_n$ with marginal CDFs $F_1, ..., F_n$ and joint CDF $F$, there exists a copula $C$ such that:

$$F(x_1, ..., x_n) = C(F_1(x_1), ..., F_n(x_n))$$

If the marginals are continuous, $C$ is unique.

**Converse:** Given any copula $C$ and marginals $F_1, ..., F_n$, the function $F$ defined above is a valid joint CDF.

#### 4.1.2 Copula Density

The joint probability density function:

$$f(x_1, ..., x_n) = c(F_1(x_1), ..., F_n(x_n)) \cdot \prod_{i=1}^{n} f_i(x_i)$$

where $c$ is the copula density:

$$c(u_1, ..., u_n) = \frac{\partial^n C(u_1, ..., u_n)}{\partial u_1 ... \partial u_n}$$

### 4.2 Archimedean Copulas

#### 4.2.1 General Form

$$C(u_1, ..., u_n) = \phi^{-1}\left(\sum_{i=1}^{n} \phi(u_i)\right)$$

where $\phi: [0,1] \to [0,\infty]$ is the generator function with properties:
- $\phi(1) = 0$
- $\phi$ is strictly decreasing
- $\phi$ is convex

#### 4.2.2 Clayton Copula (Lower Tail Dependence)

**Generator:**
$$\phi(t) = \frac{1}{\theta}(t^{-\theta} - 1), \quad \theta > 0$$

**Copula Function:**
$$C_{\theta}^{Cl}(u_1, ..., u_n) = \left(\sum_{i=1}^{n} u_i^{-\theta} - n + 1\right)^{-1/\theta}$$

**Bivariate Form:**
$$C_{\theta}^{Cl}(u, v) = (u^{-\theta} + v^{-\theta} - 1)^{-1/\theta}$$

**Kendall's Tau:**
$$\tau = \frac{\theta}{\theta + 2}$$

**Lower Tail Dependence:**
$$\lambda_L = 2^{-1/\theta}$$

**Upper Tail Dependence:**
$$\lambda_U = 0$$

**Application:** Suitable for modeling simultaneous extreme events (e.g., hurricane wind and storm surge).

#### 4.2.3 Gumbel Copula (Upper Tail Dependence)

**Generator:**
$$\phi(t) = (-\ln t)^{\theta}, \quad \theta \geq 1$$

**Copula Function:**
$$C_{\theta}^{Gu}(u_1, ..., u_n) = \exp\left(-\left(\sum_{i=1}^{n} (-\ln u_i)^{\theta}\right)^{1/\theta}\right)$$

**Bivariate Form:**
$$C_{\theta}^{Gu}(u, v) = \exp\left(-\left[(-\ln u)^{\theta} + (-\ln v)^{\theta}\right]^{1/\theta}\right)$$

**Kendall's Tau:**
$$\tau = 1 - \frac{1}{\theta}$$

**Lower Tail Dependence:**
$$\lambda_L = 0$$

**Upper Tail Dependence:**
$$\lambda_U = 2 - 2^{1/\theta}$$

**Application:** Suitable for modeling cascading extreme events (e.g., heat waves and drought).

#### 4.2.4 Frank Copula (Symmetric Tail Dependence)

**Generator:**
$$\phi(t) = -\ln\left(\frac{e^{-\theta t} - 1}{e^{-\theta} - 1}\right), \quad \theta \in \mathbb{R}\setminus\{0\}$$

**Copula Function:**
$$C_{\theta}^{Fr}(u, v) = -\frac{1}{\theta}\ln\left(1 + \frac{(e^{-\theta u} - 1)(e^{-\theta v} - 1)}{e^{-\theta} - 1}\right)$$

**Kendall's Tau:**
$$\tau = 1 - \frac{4}{\theta}\left(1 - \frac{1}{\theta}\int_0^{\theta}\frac{t}{e^t - 1}dt\right)$$

**Tail Dependence:**
$$\lambda_L = \lambda_U = 0$$

### 4.3 Elliptical Copulas

#### 4.3.1 Gaussian Copula

$$C_{\mathbf{R}}^{Ga}(u_1, ..., u_n) = \Phi_{\mathbf{R}}(\Phi^{-1}(u_1), ..., \Phi^{-1}(u_n))$$

where:
- $\Phi_{\mathbf{R}}$ is the multivariate normal CDF with correlation matrix $\mathbf{R}$
- $\Phi^{-1}$ is the standard normal quantile function

**Density:**
$$c_{\mathbf{R}}^{Ga}(\mathbf{u}) = \frac{1}{\sqrt{|\mathbf{R}|}}\exp\left(-\frac{1}{2}\mathbf{z}^T(\mathbf{R}^{-1} - \mathbf{I})\mathbf{z}\right)$$

where $z_i = \Phi^{-1}(u_i)$.

#### 4.3.2 t-Copula

$$C_{\nu, \mathbf{R}}^{t}(u_1, ..., u_n) = t_{\nu, \mathbf{R}}(t_{\nu}^{-1}(u_1), ..., t_{\nu}^{-1}(u_n))$$

where:
- $t_{\nu, \mathbf{R}}$ is the multivariate t CDF with $\nu$ degrees of freedom
- $t_{\nu}^{-1}$ is the univariate t quantile function

**Tail Dependence:**
$$\lambda = 2t_{\nu+1}\left(-\sqrt{\frac{(\nu+1)(1-\rho)}{1+\rho}}\right)$$

### 4.4 Vine Copulas for High Dimensions

#### 4.4.1 Pair-Copula Construction

For $n$ dimensions, the joint density can be decomposed as:

$$f(x_1, ..., x_n) = \prod_{i=1}^{n} f_i(x_i) \cdot \prod_{j=1}^{n-1}\prod_{i=1}^{n-j} c_{i,i+j|i+1,...,i+j-1}$$

#### 4.4.2 C-Vine (Canonical Vine)

$$f(\mathbf{x}) = \prod_{k=1}^{n} f_k(x_k) \cdot \prod_{j=1}^{n-1}\prod_{i=1}^{n-j} c_{j,j+i|1,...,j-1}$$

#### 4.4.3 D-Vine (Drawable Vine)

$$f(\mathbf{x}) = \prod_{k=1}^{n} f_k(x_k) \cdot \prod_{j=1}^{n-1}\prod_{i=1}^{n-j} c_{i,i+j|i+1,...,i+j-1}$$

### 4.5 Conditional Damage Given Multiple Hazards

#### 4.5.1 Joint Damage Distribution

For hazards $IM_1$ and $IM_2$, the conditional damage probability:

$$P(D > d | IM_1, IM_2) = 1 - C(1 - F_D(d|IM_1), 1 - F_D(d|IM_2))$$

where $C$ is the copula linking the survival functions.

#### 4.5.2 Compounding Effect Quantification

**Independent Hazards:**
$$P(D > d | IM_1, IM_2)_{ind} = 1 - (1 - F_D(d|IM_1))(1 - F_D(d|IM_2))$$

**Dependent Hazards:**
$$P(D > d | IM_1, IM_2)_{dep} = 1 - C(1 - F_D(d|IM_1), 1 - F_D(d|IM_2))$$

**Compounding Factor:**
$$\lambda_{compound} = \frac{P(D > d | IM_1, IM_2)_{dep}}{P(D > d | IM_1, IM_2)_{ind}}$$

#### 4.5.3 Multi-Hazard Damage Function

$$Damage(IM_1, IM_2) = 1 - \bar{C}(1 - Damage_1(IM_1), 1 - Damage_2(IM_2))$$

where $\bar{C}$ is the survival copula:
$$\bar{C}(u, v) = u + v - 1 + C(1-u, 1-v)$$

### 4.6 Copula Parameter Estimation

#### 4.6.1 Maximum Likelihood

$$\ell(\theta; \mathbf{u}) = \sum_{i=1}^{N} \log c(u_{i1}, ..., u_{in}; \theta)$$

#### 4.6.2 Inference Functions for Margins (IFM)

1. Estimate marginals: $\hat{F}_j = \arg\max \sum_{i=1}^{N} \log f_j(x_{ij}; \theta_j)$
2. Transform to uniform: $\hat{u}_{ij} = \hat{F}_j(x_{ij})$
3. Estimate copula: $\hat{\theta} = \arg\max \sum_{i=1}^{N} \log c(\hat{u}_{i1}, ..., \hat{u}_{in}; \theta)$

#### 4.6.3 Canonical Maximum Likelihood

1. Transform to uniform using empirical CDF: $\tilde{u}_{ij} = \frac{R_{ij}}{N+1}$
2. Estimate copula: $\hat{\theta} = \arg\max \sum_{i=1}^{N} \log c(\tilde{u}_{i1}, ..., \tilde{u}_{in}; \theta)$

---

## 5. Asset Footprint to Hazard Mapping

### 5.1 Geospatial Intersection Algorithms

#### 5.1.1 Point-in-Polygon Test

For property location $\mathbf{p} = (x_p, y_p)$ and polygon $\mathcal{P}$ with vertices $\{(x_i, y_i)\}_{i=1}^{n}$:

**Ray Casting Algorithm:**

```
Algorithm: PointInPolygon
Input: Point p = (x_p, y_p), Polygon P with vertices [(x_i, y_i)]
Output: Boolean (inside/outside)

1.  inside = FALSE
2.  j = n  // Previous vertex index
3.  FOR i = 1 TO n DO:
4.      // Check if edge (i, j) intersects ray from p
5.      IF ((y_i > y_p) ≠ (y_j > y_p)) THEN
6.          x_intersect = x_i + (y_p - y_i) * (x_j - x_i) / (y_j - y_i)
7.          IF x_intersect > x_p THEN
8.              inside = NOT inside
9.          END IF
10.     END IF
11.     j = i
12. END FOR
13. RETURN inside
```

**Winding Number Algorithm:**

$$wn = \frac{1}{2\pi}\sum_{i=1}^{n} \arctan\left(\frac{(x_i - x_p)(y_{i+1} - y_p) - (y_i - y_p)(x_{i+1} - x_p)}{(x_i - x_p)(x_{i+1} - x_p) + (y_i - y_p)(y_{i+1} - y_p)}\right)$$

Point is inside if $wn \neq 0$.

#### 5.1.2 Polygon Intersection

For property polygon $\mathcal{P}_a$ and hazard zone $\mathcal{P}_h$:

**Sutherland-Hodgman Clipping:**

```
Algorithm: PolygonIntersection
Input: Subject polygon S, Clip polygon C
Output: Intersection polygon I

1.  output_list = S.vertices
2.  FOR each edge E of C DO:
3.      input_list = output_list
4.      output_list = []
5.      S = input_list[-1]
6.      FOR each point E in input_list DO:
7.          IF E is inside edge E THEN
8.              IF S is outside edge E THEN
9.                  APPEND intersection(S, E) TO output_list
10.             END IF
11.             APPEND E TO output_list
12.         ELSE IF S is inside edge E THEN
13.             APPEND intersection(S, E) TO output_list
14.         END IF
15.         S = E
16.     END FOR
17. END FOR
18. RETURN output_list
```

### 5.2 Raster-Based Intensity Extraction

#### 5.2.1 Nearest Neighbor Interpolation

For property location $\mathbf{p}$ and raster grid points $\{\mathbf{g}_{ij}\}$:

$$IM(\mathbf{p}) = IM(\mathbf{g}_{i^*, j^*})$$

where $(i^*, j^*) = \arg\min_{i,j} \|\mathbf{p} - \mathbf{g}_{ij}\|$

#### 5.2.2 Bilinear Interpolation

For $\mathbf{p}$ in grid cell with corners $\mathbf{g}_{00}, \mathbf{g}_{10}, \mathbf{g}_{01}, \mathbf{g}_{11}$:

$$IM(\mathbf{p}) = (1-\alpha)(1-\beta)IM_{00} + \alpha(1-\beta)IM_{10} + (1-\alpha)\beta IM_{01} + \alpha\beta IM_{11}$$

where:
$$\alpha = \frac{x_p - x_0}{x_1 - x_0}, \quad \beta = \frac{y_p - y_0}{y_1 - y_0}$$

#### 5.2.3 Bicubic Interpolation

$$IM(\mathbf{p}) = \sum_{i=0}^{3}\sum_{j=0}^{3} a_{ij} \alpha^i \beta^j$$

Coefficients $a_{ij}$ determined from 16 neighboring grid points and their derivatives.

### 5.3 Zonal Statistics for Portfolio Aggregation

#### 5.3.1 Property-Level Aggregation

For property $k$ covering raster cells $\mathcal{C}_k$:

**Mean Intensity:**
$$\bar{IM}_k = \frac{1}{|\mathcal{C}_k|}\sum_{c \in \mathcal{C}_k} IM_c$$

**Maximum Intensity:**
$$IM_k^{max} = \max_{c \in \mathcal{C}_k} IM_c$$

**Intensity Variance:**
$$\sigma^2_{IM,k} = \frac{1}{|\mathcal{C}_k|}\sum_{c \in \mathcal{C}_k} (IM_c - \bar{IM}_k)^2$$

#### 5.3.2 Portfolio-Level Aggregation

For portfolio $\mathcal{P}$ with properties $\{k\}_{k=1}^{K}$ and exposures $\{E_k\}$:

**Exposure-Weighted Mean:**
$$\bar{IM}_{\mathcal{P}} = \frac{\sum_{k=1}^{K} E_k \cdot \bar{IM}_k}{\sum_{k=1}^{K} E_k}$$

**Average Annual Loss (AAL):**
$$AAL = \sum_{e} \lambda_e \cdot \sum_{k=1}^{K} E_k \cdot Damage(IM_{e,k})$$

where $\lambda_e$ is the event occurrence rate.

### 5.4 Resolution Mismatch Handling

#### 5.4.1 Downscaling Methods

**Statistical Downscaling:**

$$IM_{high}(\mathbf{x}) = IM_{low}(\mathbf{x}) + \epsilon(\mathbf{x})$$

where $\epsilon(\mathbf{x}) \sim \mathcal{N}(0, \sigma_{downscale}^2)$ with spatial correlation.

**Regression-Based Downscaling:**

$$IM_{high} = \beta_0 + \beta_1 IM_{low} + \beta_2 Z_1 + ... + \beta_p Z_p + \epsilon$$

where $Z_i$ are high-resolution covariates (elevation, land use, etc.).

**Kriging Interpolation:**

$$IM_{high}(\mathbf{x}_0) = \sum_{i=1}^{n} w_i IM_{low}(\mathbf{x}_i)$$

Weights determined by:
$$\mathbf{w} = \mathbf{C}^{-1}\mathbf{c}_0$$

where $C_{ij} = Cov(IM(\mathbf{x}_i), IM(\mathbf{x}_j))$ and $c_{0i} = Cov(IM(\mathbf{x}_0), IM(\mathbf{x}_i))$.

#### 5.4.2 Upsampling Methods

**Aggregation:**
$$IM_{low}(\mathbf{g}) = \frac{1}{|\mathcal{H}(\mathbf{g})|}\sum_{\mathbf{h} \in \mathcal{H}(\mathbf{g})} IM_{high}(\mathbf{h})$$

where $\mathcal{H}(\mathbf{g})$ are high-resolution cells within low-resolution cell $\mathbf{g}$.

### 5.5 Geospatial Pipeline Architecture

```
Algorithm: HazardMappingPipeline
Input: Property footprints P, Hazard raster R, Mapping parameters θ
Output: Property-level hazard intensities {IM_k}

1.  // Preprocessing
2.  Reproject P and R to common CRS
3.  Align R extent to cover all properties in P
4.  
5.  // Spatial indexing for efficiency
6.  Build R-tree index on property footprints
7.  
8.  // Raster extraction
9.  FOR each property k in P DO:
10.     // Determine intersection method
11.     IF property k is point THEN
12.         cell = RasterCellContaining(point_k)
13.         IM_k = Interpolate(R, cell, θ.interp_method)
14.     ELSE IF property k is polygon THEN
15.         cells = RasterCellsIntersecting(polygon_k)
16.         IF θ.zonal_stat = "mean" THEN
17.             IM_k = Mean(R[cells], weights=AreaOverlap)
18.         ELSE IF θ.zonal_stat = "max" THEN
19.             IM_k = Max(R[cells])
20.         ELSE IF θ.zonal_stat = "centroid" THEN
21.             centroid_k = Centroid(polygon_k)
22.             IM_k = Interpolate(R, centroid_k, θ.interp_method)
23.         END IF
24.     END IF
25.     
26.     // Resolution adjustment
27.     IF Resolution(R) ≠ θ.target_resolution THEN
28.         IM_k = AdjustResolution(IM_k, θ.resolution_method)
29.     END IF
30. END FOR
31. 
32. RETURN {IM_k}
```

---

## 6. LTV Shock Calculation from Physical Damage

### 6.1 Post-Damage Property Valuation

#### 6.1.1 Basic Damage Adjustment

For property with pre-disaster value $V_{pre}$ and damage ratio $D \in [0,1]$:

$$V_{post} = V_{pre} \times (1 - D)$$

**Component-Level Damage:**

For damage to structure ($D_s$), contents ($D_c$), and additional living expenses ($D_{ale}$):

$$V_{post} = V_{pre} \times (1 - D_s) - V_{contents} \times D_c - ALE$$

#### 6.1.2 Depreciated Replacement Cost

$$V_{post} = (RC_{structure} \times (1 - D_s) + LandValue) \times (1 - Depreciation)$$

where $RC_{structure}$ is the replacement cost of the structure.

#### 6.1.3 Market Value Impact

Incorporating stigma and demand effects:

$$V_{post}^{market} = V_{post}^{physical} \times (1 - \delta_{stigma}) \times (1 - \delta_{demand})$$

where:
- $\delta_{stigma}$ captures buyer aversion to previously damaged properties
- $\delta_{demand}$ captures reduced demand in affected areas

### 6.2 Updated LTV Calculation

#### 6.2.1 Post-Event LTV

For outstanding loan balance $L$:

$$LTV_{new} = \frac{L}{V_{post}}$$

#### 6.2.2 LTV Shock Magnitude

$$\Delta LTV = LTV_{new} - LTV_{original} = \frac{L}{V_{pre}(1-D)} - \frac{L}{V_{pre}}$$

$$\Delta LTV = LTV_{original} \times \left(\frac{1}{1-D} - 1\right) = LTV_{original} \times \frac{D}{1-D}$$

**Approximation for Small Damage:**

For $D \ll 1$:
$$\Delta LTV \approx LTV_{original} \times D$$

### 6.3 Threshold Effects for Negative Equity

#### 6.3.1 Negative Equity Condition

Negative equity occurs when:

$$V_{post} < L \iff D > 1 - \frac{L}{V_{pre}} = 1 - LTV_{original}$$

**Critical Damage Threshold:**

$$D_{critical} = 1 - LTV_{original}$$

#### 6.3.2 Probability of Negative Equity

$$P(NE) = P(D > D_{critical}) = 1 - F_D(D_{critical})$$

where $F_D$ is the CDF of the damage distribution.

#### 6.3.3 Expected Negative Equity Amount

$$ENE = \mathbb{E}[L - V_{post} | D > D_{critical}] \cdot P(D > D_{critical})$$

$$ENE = L \cdot P(D > D_{critical}) - V_{pre} \cdot \mathbb{E}[(1-D) | D > D_{critical}] \cdot P(D > D_{critical})$$

### 6.4 LTV Shock Distribution

#### 6.4.1 Distribution of Post-Event LTV

Given $D \sim f_D(d)$, the distribution of $LTV_{new}$:

$$f_{LTV_{new}}(l) = f_D\left(1 - \frac{LTV_{original}}{l}\right) \cdot \frac{LTV_{original}}{l^2}$$

for $l \in [LTV_{original}, \infty)$.

#### 6.4.2 Moments of LTV Shock

**Expected LTV Shock:**
$$\mathbb{E}[\Delta LTV] = LTV_{original} \cdot \mathbb{E}\left[\frac{D}{1-D}\right]$$

**Variance of LTV Shock:**
$$\text{Var}(\Delta LTV) = LTV_{original}^2 \cdot \text{Var}\left(\frac{D}{1-D}\right)$$

### 6.5 Portfolio LTV Aggregation

#### 6.5.1 Exposure-Weighted Portfolio LTV

$$LTV_{portfolio}^{post} = \frac{\sum_{k=1}^{K} L_k}{\sum_{k=1}^{K} V_{post,k}}$$

#### 6.5.2 LTV Distribution Shift

Pre-event LTV distribution: $F_{LTV}^{pre}(l)$

Post-event LTV distribution:

$$F_{LTV}^{post}(l) = \int_0^1 F_{LTV}^{pre}\left(\frac{l}{1-d}\right) f_D(d) dd$$

---

## 7. PD/LGD Shifts from Physical Risk

### 7.1 PD Adjustment Framework

#### 7.1.1 Physical Risk-Adjusted PD

$$PD_{physical} = PD_{base} + \Delta PD_{damage} + \Delta PD_{LTV}$$

where:
- $\Delta PD_{damage} = \alpha \cdot D$ (direct damage effect)
- $\Delta PD_{LTV} = \beta \cdot \Delta LTV$ (LTV shock effect)

**Combined Formula:**

$$PD_{physical} = PD_{base} + \alpha \cdot D + \beta \cdot LTV_{original} \cdot \frac{D}{1-D}$$

#### 7.1.2 Logistic Transformation

To ensure $PD \in [0,1]$:

$$\text{logit}(PD_{physical}) = \text{logit}(PD_{base}) + \alpha' \cdot D + \beta' \cdot \Delta LTV$$

$$PD_{physical} = \frac{1}{1 + \exp(-(\text{logit}(PD_{base}) + \alpha' \cdot D + \beta' \cdot \Delta LTV))}$$

#### 7.1.3 Time-Dependent PD Adjustment

Incorporating recovery dynamics:

$$PD_{physical}(t) = PD_{base} + (\alpha \cdot D + \beta \cdot \Delta LTV) \cdot e^{-\gamma t}$$

where $\gamma$ is the recovery rate.

### 7.2 LGD Adjustment Framework

#### 7.2.1 Physical Risk-Adjusted LGD

$$LGD_{physical} = LGD_{base} + \gamma \cdot D$$

where $\gamma$ captures the incremental loss due to physical damage.

#### 7.2.2 Comprehensive LGD Model

$$LGD_{physical} = LGD_{base} + \gamma_1 \cdot D + \gamma_2 \cdot \mathbb{1}_{D > D_{critical}} + \gamma_3 \cdot NE$$

where:
- $\gamma_1$: direct damage effect
- $\gamma_2$: additional loss from negative equity
- $\gamma_3$: loss given negative equity

#### 7.2.3 Foreclosure LGD

For properties entering foreclosure post-disaster:

$$LGD_{foreclosure} = \frac{L - (V_{post} - FC - DC)}{L}$$

where:
- $FC$ = foreclosure costs
- $DC$ = disposition costs

### 7.3 Correlation Between Physical Damage and Default

#### 7.3.1 Copula-Based Joint Model

Joint distribution of damage and default indicator:

$$F(D, Y) = C(F_D(D), F_Y(Y); \rho)$$

where $Y \in \{0,1\}$ is the default indicator.

#### 7.3.2 Conditional Default Probability

$$P(Y=1|D) = \frac{\partial C(u, v)}{\partial u}\bigg|_{u=F_D(D), v=P(Y=1)}$$

#### 7.3.3 Correlation Measures

**Pearson Correlation:**
$$\rho_{D,Y} = \frac{\text{Cov}(D, Y)}{\sigma_D \sigma_Y}$$

**Kendall's Tau:**
$$\tau = 4 \int_0^1 \int_0^1 C(u,v) dC(u,v) - 1$$

### 7.4 Stress Testing Matrices

#### 7.4.1 Scenario Definition

**Hazard Scenarios:**
| Scenario | Return Period | Wind Speed (mph) | Flood Depth (ft) |
|----------|--------------|------------------|------------------|
| Base     | -            | -                | -                |
| Minor    | 10-year      | 74               | 1                |
| Moderate | 50-year      | 100              | 3                |
| Severe   | 100-year     | 130              | 6                |
| Extreme  | 500-year     | 157              | 10               |

#### 7.4.2 Credit Parameter Shifts

| Scenario | Avg Damage | Avg ΔLTV | PD Shift | LGD Shift |
|----------|------------|----------|----------|-----------|
| Base     | 0%         | 0%       | 0 bps    | 0%        |
| Minor    | 5%         | 3%       | 25 bps   | 3%        |
| Moderate | 15%        | 12%      | 85 bps   | 10%       |
| Severe   | 35%        | 35%      | 200 bps  | 22%       |
| Extreme  | 60%        | 80%      | 450 bps  | 40%       |

#### 7.4.3 Expected Loss Calculation

$$EL_{physical} = PD_{physical} \times LGD_{physical} \times EAD$$

**Scenario Analysis:**

$$\Delta EL_{scenario} = EL_{scenario} - EL_{base}$$

$$EL_{scenario} = \sum_{k=1}^{K} PD_{physical,k}(scenario) \times LGD_{physical,k}(scenario) \times EAD_k$$

### 7.5 Integrated Risk Model Algorithm

```
Algorithm: PhysicalCreditRiskIntegration
Input: Portfolio P, Hazard scenarios H, Damage models M, Credit params θ
Output: Risk-adjusted credit metrics

1.  // Initialize
2.  results = {}
3.  
4.  FOR each scenario s in H DO:
5.      scenario_results = {}
6.      
7.      // Step 1: Hazard mapping
8.      FOR each property k in P DO:
9.          IM_k = HazardMapping(k.location, s.hazard_raster)
10.     END FOR
11.     
12.     // Step 2: Damage estimation
13.     FOR each property k in P DO:
14.         D_k = DamageFunction(IM_k, k.characteristics, M)
15.         // Add uncertainty
16.         D_k_samples = SampleDamageUncertainty(D_k, M.uncertainty)
17.     END FOR
18.     
19.     // Step 3: LTV shock calculation
20.     FOR each property k in P DO:
21.         V_post_k = k.V_pre * (1 - D_k)
22.         LTV_new_k = k.LoanBalance / V_post_k
23.         ΔLTV_k = LTV_new_k - k.LTV_original
24.     END FOR
25.     
26.     // Step 4: PD adjustment
27.     FOR each property k in P DO:
28.         PD_phys_k = PD_Adjustment(k.PD_base, D_k, ΔLTV_k, θ)
29.     END FOR
30.     
31.     // Step 5: LGD adjustment
32.     FOR each property k in P DO:
33.         LGD_phys_k = LGD_Adjustment(k.LGD_base, D_k, θ)
34.     END FOR
35.     
36.     // Step 6: Expected loss calculation
37.     EL_s = 0
38.     FOR each property k in P DO:
39.         EL_k = PD_phys_k * LGD_phys_k * k.EAD
40.         EL_s += EL_k
41.     END FOR
42.     
43.     // Step 7: Aggregate metrics
44.     scenario_results.EL = EL_s
45.     scenario_results.avg_PD = MEAN({PD_phys_k})
46.     scenario_results.avg_LGD = MEAN({LGD_phys_k})
47.     scenario_results.neg_equity_count = COUNT(V_post_k < k.LoanBalance)
48.     
49.     results[s] = scenario_results
50. END FOR
51. 
52. // Step 8: Risk metrics
53. metrics.VaR = ComputeVaR(results, confidence=0.99)
54. metrics.CTE = ComputeCTE(results, confidence=0.99)
55. metrics.stressed_EL = MAX({results[s].EL})
56. 
57. RETURN results, metrics
```

---

## 8. Summary of Key Mathematical Formulations

### 8.1 Bayesian Neural Networks

| Component | Formula |
|-----------|---------|
| Prior | $p(\mathbf{w}) = \mathcal{N}(\mathbf{0}, \sigma_p^2\mathbf{I})$ |
| Likelihood | $p(y|\mathbf{x},\mathbf{w}) = \mathcal{N}(f_{\mathbf{w}}(\mathbf{x}), \sigma_y^2)$ |
| Posterior | $p(\mathbf{w}|\mathcal{D}) \propto p(\mathcal{D}|\mathbf{w})p(\mathbf{w})$ |
| ELBO | $\mathcal{L}(\boldsymbol{\theta}) = \mathbb{E}_{q}[\log p(\mathcal{D}|\mathbf{w})] - D_{KL}(q||p)$ |
| MC Dropout | $p(y|\mathbf{x},\mathcal{D}) \approx \frac{1}{T}\sum_{t=1}^{T} p(y|\mathbf{x},\hat{\mathbf{w}}_t)$ |

### 8.2 Fragility Curves

| Component | Formula |
|-----------|---------|
| Fragility Function | $P(DS \geq ds_i|IM) = \Phi\left(\frac{\ln(IM) - \ln(\widehat{IM}_{ds_i})}{\beta_{ds_i}}\right)$ |
| Damage State Prob | $P(DS=ds_i|IM) = P(DS \geq ds_i|IM) - P(DS \geq ds_{i+1}|IM)$ |
| MLE | $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} \sum_{j=1}^{N} \log P(DS_j|IM_j;\boldsymbol{\theta})$ |

### 8.3 Damage Functions

| Type | Formula |
|------|---------|
| Power Law | $Damage = a \cdot IM^b$ |
| Exponential | $Damage = 1 - e^{-c \cdot IM}$ |
| Sigmoid | $Damage = \frac{1}{1 + e^{-k(IM - IM_{50})}}$ |
| Piecewise | $Damage(IM) = a_i \cdot IM + b_i$ for $IM \in [IM_{i-1}, IM_i]$ |

### 8.4 Copulas

| Component | Formula |
|-----------|---------|
| Sklar's Theorem | $F(x_1,...,x_n) = C(F_1(x_1),...,F_n(x_n))$ |
| Clayton Copula | $C_{\theta}^{Cl}(u,v) = (u^{-\theta} + v^{-\theta} - 1)^{-1/\theta}$ |
| Gumbel Copula | $C_{\theta}^{Gu}(u,v) = \exp(-[(-\ln u)^{\theta} + (-\ln v)^{\theta}]^{1/\theta})$ |
| Conditional Damage | $P(D>d|IM_1,IM_2) = 1 - C(1-F_D(d|IM_1), 1-F_D(d|IM_2))$ |

### 8.5 LTV and Credit Risk

| Component | Formula |
|-----------|---------|
| Post-Damage Value | $V_{post} = V_{pre} \times (1 - D)$ |
| New LTV | $LTV_{new} = \frac{L}{V_{post}}$ |
| LTV Shock | $\Delta LTV = LTV_{original} \times \frac{D}{1-D}$ |
| PD Adjustment | $PD_{physical} = PD_{base} + \alpha \cdot D + \beta \cdot \Delta LTV$ |
| LGD Adjustment | $LGD_{physical} = LGD_{base} + \gamma \cdot D$ |

---

## References

1. Blundell, C., Cornebise, J., Kavukcuoglu, K., & Wierstra, D. (2015). Weight uncertainty in neural networks. ICML.

2. Gal, Y., & Ghahramani, Z. (2016). Dropout as a Bayesian approximation. ICML.

3. Nelsen, R. B. (2006). An Introduction to Copulas. Springer.

4. FEMA. (2012). Multi-hazard loss estimation methodology (HAZUS-MH).

5. Porter, K., et al. (2017). Overview of damage functions. Risk Analysis.

6. Aas, K., et al. (2009). Pair-copula constructions of multiple dependence. Insurance: Mathematics and Economics.

---

*Document generated for AA Impact Inc. Physical Risk Modeling Framework*
*Version: 1.0 | Date: 2024*
