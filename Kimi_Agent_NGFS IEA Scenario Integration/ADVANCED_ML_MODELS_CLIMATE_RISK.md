# Advanced Machine Learning Models for Climate Risk Analysis
## Enhanced Physical and Transition Risk Computation

---

**Document Classification:** Technical Research  
**Version:** 1.0  
**Date:** April 2026  
**Prepared by:** AA Impact Inc. ML Engineering Team  

---

## Executive Summary

This document presents advanced machine learning models for enhanced computation of climate risk (both physical and transition). These models go beyond traditional approaches to capture complex spatiotemporal dependencies, non-linear relationships, and uncertainty quantification required for institutional-grade climate risk assessment.

### Model Categories

| Category | Models | Application |
|----------|--------|-------------|
| **Transformer-Based** | iTransformer, Informer, PatchTST, GraphCast | Time series forecasting, spatial-temporal modeling |
| **Graph Neural Networks** | ST-GNN, GNN-rP, GraphCast | Spatial contagion, network effects |
| **Ensemble Methods** | XGBoost, LightGBM, Random Forest, Stacking | Risk prediction, classification |
| **Bayesian Methods** | BNN, GP, MC Dropout | Uncertainty quantification |
| **Hybrid Models** | Physics-Guided ML, Digital Twins | Process-aware prediction |
| **Reinforcement Learning** | PPO, SAC | Optimal adaptation strategies |

---

## Table of Contents

1. [Transformer-Based Models](#1-transformer-based-models)
2. [Graph Neural Networks for Spatial Risk](#2-graph-neural-networks-for-spatial-risk)
3. [Ensemble Learning Methods](#3-ensemble-learning-methods)
4. [Bayesian Deep Learning](#4-bayesian-deep-learning)
5. [Physics-Guided Neural Networks](#5-physics-guided-neural-networks)
6. [Hybrid and Multi-Modal Models](#6-hybrid-and-multi-modal-models)
7. [Model Selection Framework](#7-model-selection-framework)

---

## 1. Transformer-Based Models

### 1.1 iTransformer (Inverted Transformer)

**Paper:** "iTransformer: Inverted Transformers Are Effective for Time Series Forecasting" (2024)

#### Architecture

iTransformer inverts the traditional Transformer architecture by applying attention across variables rather than time steps:

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

Where:
- $Q, K, V$ are projections of the **variable embeddings** (not time embeddings)
- Each variable's entire time series is treated as a single token

#### Key Innovation

```
Traditional Transformer: Attention across time → Each time step contains all variables
iTransformer: Attention across variables → Each variable contains all time steps
```

#### Mathematical Formulation

For multivariate time series $\mathbf{X} \in \mathbb{R}^{T \times D}$:

1. **Tokenization:** Each variable's series becomes a token:
   $$\mathbf{x}_i = [x_{1,i}, x_{2,i}, ..., x_{T,i}] \in \mathbb{R}^T$$

2. **Embedding:** Project to latent space:
   $$\mathbf{h}_i = \text{MLP}(\mathbf{x}_i) \in \mathbb{R}^d$$

3. **Multi-head self-attention across variables:**
   $$\text{Attention}_i = \sum_{j=1}^{D} \alpha_{ij} \mathbf{h}_j$$
   
   Where attention weights:
   $$\alpha_{ij} = \frac{\exp(\mathbf{h}_i W_Q W_K^T \mathbf{h}_j^T / \sqrt{d_k})}{\sum_{k=1}^{D} \exp(\mathbf{h}_i W_Q W_K^T \mathbf{h}_k^T / \sqrt{d_k})}$$

4. **Feed-forward per variable:**
   $$\mathbf{h}_i' = \mathbf{h}_i + \text{FFN}(\text{Attention}_i)$$

5. **Forecast projection:**
   $$\hat{\mathbf{y}}_i = \text{MLP}(\mathbf{h}_i') \in \mathbb{R}^{T_{pred}}$$

#### Climate Risk Applications

| Application | Input Variables | Output |
|-------------|-----------------|--------|
| **Multi-hazard forecasting** | Temperature, precipitation, wind, pressure | Future hazard intensity |
| **Portfolio risk** | Asset values, hazard exposures, correlations | Loss distributions |
| **Transition risk** | Carbon prices, policy indicators, tech adoption | Stranding timelines |

#### Performance

- **iTransformer achieves:**
  - MedianAbsE: 1.21
  - MeanAbsE: 1.24
  - RMSE: 1.43
  - Best for multivariate forecasting with variable interactions

---

### 1.2 Informer

**Paper:** "Informer: Beyond Efficient Transformer for Long Sequence Time-Series Forecasting" (AAAI 2021)

#### Key Innovation: ProbSparse Attention

Standard self-attention has $O(L^2)$ complexity. Informer introduces ProbSparse Attention with $O(L \log L)$:

$$\text{ProbSparseAttention}(Q, K, V) = \text{softmax}\left(\frac{\bar{Q}K^T}{\sqrt{d}}\right)V$$

Where $\bar{Q}$ contains only the top-$u$ dominant queries:

$$u = c \cdot \log L$$

#### Self-Attention Distilling

Progressively reduces sequence length:

$$\mathbf{X}_{j+1} = \text{MaxPool}(\text{ELU}(\text{Conv1d}([\mathbf{X}_j]_{AB})))$$

Where $[\cdot]_{AB}$ denotes attention block.

#### Generative Style Decoder

$$\hat{\mathbf{y}} = \text{Decoder}(\mathbf{X}_{enc}, \mathbf{X}_{dec}^{(0)})$$

Where $\mathbf{X}_{dec}^{(0)}$ contains start tokens and placeholders.

#### Climate Risk Applications

- **Long-term climate projections** (2050-2100)
- **Chronic risk trends** (sea level rise, temperature)
- **Scenario ensemble generation**

---

### 1.3 PatchTST (Patch Time Series Transformer)

**Paper:** "A Time Series is Worth 64 Words: Long-term Forecasting with Transformers" (ICLR 2023)

#### Architecture

1. **Patching:** Divide series into patches of length $P$ with stride $S$:
   $$\mathbf{x}_p^{(i)} = [x_{iS}, x_{iS+1}, ..., x_{iS+P-1}]$$

2. **Patch embedding:**
   $$\mathbf{h}_i = \text{Linear}(\mathbf{x}_p^{(i)}) + \mathbf{W}_{pos}$$

3. **Transformer encoder:** Standard Transformer blocks

4. **Flatten head:**
   $$\hat{\mathbf{y}} = \text{Linear}(\text{Flatten}(\mathbf{H}))$$

#### Channel Independence

Each variable processed independently, then combined:

$$\hat{\mathbf{Y}} = \sum_{i=1}^{D} \hat{\mathbf{y}}^{(i)}$$

#### Climate Risk Applications

- **Short-term hazard forecasting** (1-30 days)
- **Extreme event prediction**
- **High-frequency risk monitoring**

#### Performance

- RMSE: 1.46
- MedianAbsE: 1.00
- Best for short-to-medium term forecasting

---

### 1.4 GraphCast

**Paper:** "GraphCast: Learning skillful medium-range global weather forecasting" (Science 2023)

#### Architecture: Encode-Process-Decode

```
Input Grid → Encoder → Graph Network → Decoder → Output Grid
```

**Encoder:** Grid-to-Graph
$$\mathbf{h}_i^{(0)} = \text{MLP}(\mathbf{x}_i^{grid})$$

**Processor:** Graph Neural Network with $M$ layers
$$\mathbf{h}_i^{(m+1)} = \mathbf{h}_i^{(m)} + \text{GNN}^{(m)}(\mathbf{h}_i^{(m)}, \{\mathbf{h}_j^{(m)}\}_{j \in \mathcal{N}(i)})$$

**Decoder:** Graph-to-Grid
$$\hat{\mathbf{y}}_i = \text{MLP}(\mathbf{h}_i^{(M)})$$

#### Graph Construction

- **Nodes:** Grid points in icosahedral mesh
- **Edges:** Connect nearby nodes (spatial) + same location (temporal)

#### Climate Risk Applications

- **Medium-range weather forecasting** (3-10 days)
- **Hazard trajectory prediction**
- **Compound event modeling**

---

## 2. Graph Neural Networks for Spatial Risk

### 2.1 Spatial-Temporal Graph Neural Network (ST-GNN)

#### Graph Construction for Climate Risk

**Nodes:** Assets/locations with features $\mathbf{x}_i \in \mathbb{R}^d$

**Edges:** Based on:
- Geographic proximity: $e_{ij} = 1$ if $d(i,j) < \tau$
- Economic correlation: $e_{ij} = \rho_{ij}$
- Supply chain connections: $e_{ij} = 1$ if direct link

#### Message Passing Framework

**Spatial convolution:**
$$\mathbf{h}_i^{(l+1)} = \sigma\left(\sum_{j \in \mathcal{N}(i)} \frac{1}{c_{ij}} \mathbf{W}^{(l)} \mathbf{h}_j^{(l)}\right)$$

Where $c_{ij} = \sqrt{|\mathcal{N}(i)| \cdot |\mathcal{N}(j)|}$ (symmetric normalization)

**Temporal convolution:**
$$\mathbf{H}_{t+1} = \text{TCN}([\mathbf{H}_{t-K+1}, ..., \mathbf{H}_t])$$

#### Combined ST-GNN Layer

$$\mathbf{H}^{(l+1)} = \text{STConv}(\mathbf{H}^{(l)}) = \text{ReLU}(\text{GNN}^{(l)}(\text{TCN}^{(l)}(\mathbf{H}^{(l)})))$$

#### Climate Risk Applications

| Application | Graph Structure | Output |
|-------------|-----------------|--------|
| **Portfolio contagion** | Assets as nodes, correlations as edges | Cascading loss estimates |
| **Supply chain risk** | Facilities as nodes, flows as edges | Disruption propagation |
| **Regional risk** | Locations as nodes, proximity as edges | Spatial loss distributions |

---

### 2.2 GNN-rP (GNN with r-Pareto Processes)

**Paper:** "Spatial Modeling and Risk Zoning of Global Extreme Precipitation via Graph Neural Networks and r-Pareto Processes" (2025)

#### Hybrid Architecture

Combines GNN with Extreme Value Theory for spatial extremes:

1. **Graph Construction from Precipitation Data:**
   - Nodes: Grid cells
   - Edges: Learned from spatial dependence patterns

2. **GNN Encoder:**
   $$\mathbf{h}_i = \text{GNN}(\mathbf{x}_i, \{\mathbf{x}_j\}_{j \in \mathcal{N}(i)})$$

3. **r-Pareto Process:**
   Models joint exceedances above high thresholds:
   $$P(\mathbf{X} > \mathbf{u} | \|\mathbf{X}\|_\infty > u) = \frac{\Lambda([0, \mathbf{x}]^c \cap \{\|\mathbf{y}\|_\infty > u\})}{\Lambda(\{\|\mathbf{y}\|_\infty > u\})}$$

4. **Risk Zoning:**
   - Cluster nodes by similar extreme behavior
   - Quantify temporal persistence of risk zones

#### Climate Risk Applications

- **Extreme precipitation risk zoning**
- **Compound flooding assessment**
- **Infrastructure vulnerability mapping**

---

### 2.3 Hierarchical Graph Representation (HGRA)

**Paper:** "Transformer based models with hierarchical graph representations for enhanced climate forecasting" (2025)

#### Architecture Components

1. **Dynamic Temporal Graph Attention (DT-GAM):**
   $$\alpha_{ij}^t = \frac{\exp(\text{LeakyReLU}(\mathbf{a}^T[\mathbf{W}\mathbf{h}_i^t \| \mathbf{W}\mathbf{h}_j^t]))}{\sum_{k \in \mathcal{N}(i)} \exp(\text{LeakyReLU}(\mathbf{a}^T[\mathbf{W}\mathbf{h}_i^t \| \mathbf{W}\mathbf{h}_k^t]))}$$

2. **Hierarchical Graph Representation (HGRA):**
   - Multi-scale graph structure
   - Local, regional, global levels

3. **Spatial-Temporal Fusion Module (STFM):**
   $$\mathbf{h}_{st} = [\mathbf{h}_t; \mathbf{h}_s]$$
   $$\mathbf{h}_f = \text{ReLU}(\mathbf{W}_f \mathbf{h}_{st} + \mathbf{b}_f)$$

---

## 3. Ensemble Learning Methods

### 3.1 Gradient Boosting (XGBoost/LightGBM)

#### XGBoost for Climate Risk

**Objective:**
$$\mathcal{L}(\phi) = \sum_{i=1}^{n} l(y_i, \hat{y}_i) + \sum_{k=1}^{K} \Omega(f_k)$$

Where:
- $l$ = loss function (quantile loss for uncertainty)
- $\Omega(f_k) = \gamma T + \frac{1}{2}\lambda \|w\|^2$ = regularization

#### Quantile Regression for Risk

Predict multiple quantiles simultaneously:

$$\hat{y}^{(\alpha)} = \text{XGBoost}_\alpha(\mathbf{x})$$

For $\alpha \in \{0.05, 0.25, 0.5, 0.75, 0.95\}$

**VaR estimation:**
$$VaR_\alpha = \hat{y}^{(1-\alpha)}$$

#### LightGBM Features

- **Leaf-wise tree growth:** Faster training
- **Histogram-based algorithms:** Memory efficient
- **Categorical feature support:** Native handling

#### Climate Risk Applications

| Task | Features | Output |
|------|----------|--------|
| **Damage prediction** | Hazard intensity, asset characteristics | Loss percentage |
| **Default prediction** | Climate risk scores, financial metrics | PD |
| **Stranding risk** | Carbon intensity, policy exposure | Stranding probability |

---

### 3.2 Random Forest

**Ensemble of decision trees:**

$$\hat{y} = \frac{1}{B} \sum_{b=1}^{B} T_b(\mathbf{x})$$

Where each tree $T_b$ is trained on bootstrap sample.

#### Feature Importance

**Permutation importance:**
$$\text{Importance}_j = \frac{1}{B} \sum_{b=1}^{B} \left[\text{MSE}_b - \text{MSE}_b^{(j)}\right]$$

Where $\text{MSE}_b^{(j)}$ is MSE after permuting feature $j$.

#### Out-of-Bag Error Estimation

$$
\text{OOB Error} = \frac{1}{n} \sum_{i=1}^{n} l(y_i, \hat{y}_i^{\text{OOB}})$$

---

### 3.3 Stacking Ensemble

**Meta-learner combines base models:**

Level 0 (Base models):
- Model 1: XGBoost
- Model 2: LightGBM
- Model 3: Neural Network
- Model 4: Random Forest

Level 1 (Meta-learner):
$$\hat{y} = \text{MetaLearner}(\hat{y}_1, \hat{y}_2, \hat{y}_3, \hat{y}_4)$$

Typically logistic regression or ridge regression.

---

## 4. Bayesian Deep Learning

### 4.1 Bayesian Neural Networks (BNN)

**Probabilistic formulation:**

Prior: $p(\mathbf{w}) = \mathcal{N}(\mathbf{0}, \sigma_p^2 \mathbf{I})$

Likelihood: $p(y | \mathbf{x}, \mathbf{w}) = \mathcal{N}(f_{\mathbf{w}}(\mathbf{x}), \sigma_y^2)$

Posterior: $p(\mathbf{w} | \mathcal{D}) = \frac{p(\mathcal{D} | \mathbf{w}) p(\mathbf{w})}{p(\mathcal{D})}$

#### Variational Inference

Approximate posterior with variational distribution $q_\theta(\mathbf{w})$:

$$\mathcal{L}(\theta) = \mathbb{E}_{q_\theta}[\log p(\mathcal{D} | \mathbf{w})] - \text{KL}(q_\theta(\mathbf{w}) || p(\mathbf{w}))$$

**Bayes by Backprop:**
$$\frac{\partial \mathcal{L}}{\partial \theta} = \frac{\partial}{\partial \theta} \mathbb{E}_{q_\theta}[\log p(\mathcal{D} | \mathbf{w})] - \frac{\partial}{\partial \theta} \text{KL}(q_\theta || p)$$

#### Predictive Uncertainty

$$p(y^* | \mathbf{x}^*, \mathcal{D}) = \int p(y^* | \mathbf{x}^*, \mathbf{w}) q_\theta(\mathbf{w}) d\mathbf{w}$$

Approximate with Monte Carlo:
$$p(y^* | \mathbf{x}^*, \mathcal{D}) \approx \frac{1}{T} \sum_{t=1}^{T} p(y^* | \mathbf{x}^*, \mathbf{w}^{(t)})$$

Where $\mathbf{w}^{(t)} \sim q_\theta(\mathbf{w})$

---

### 4.2 Monte Carlo Dropout

**Simple approximation to Bayesian inference:**

Dropout at test time:
$$\hat{y} = \frac{1}{T} \sum_{t=1}^{T} f_{\hat{\mathbf{w}}_t}(\mathbf{x})$$

Where $\hat{\mathbf{w}}_t$ includes dropout masks.

**Uncertainty decomposition:**

Total uncertainty = Aleatoric + Epistemic

$$\text{Var}(y) = \underbrace{\frac{1}{T} \sum_{t=1}^{T} f_{\hat{\mathbf{w}}_t}(\mathbf{x})^2 - \left(\frac{1}{T} \sum_{t=1}^{T} f_{\hat{\mathbf{w}}_t}(\mathbf{x})\right)^2}_{\text{Epistemic}} + \underbrace{\sigma_y^2}_{\text{Aleatoric}}$$

---

### 4.3 Gaussian Processes

**Non-parametric Bayesian approach:**

$$f(\mathbf{x}) \sim \mathcal{GP}(m(\mathbf{x}), k(\mathbf{x}, \mathbf{x}'))$$

**Common kernels:**
- RBF: $k(\mathbf{x}, \mathbf{x}') = \sigma^2 \exp\left(-\frac{\|\mathbf{x} - \mathbf{x}'\|^2}{2l^2}\right)$
- Matérn: $k(\mathbf{x}, \mathbf{x}') = \sigma^2 \frac{2^{1-\nu}}{\Gamma(\nu)} \left(\frac{\sqrt{2\nu}r}{l}\right)^\nu K_\nu\left(\frac{\sqrt{2\nu}r}{l}\right)$

**Predictive distribution:**
$$p(f^* | \mathbf{x}^*, \mathcal{D}) = \mathcal{N}(\mu^*, \sigma^{*2})$$

Where:
$$\mu^* = \mathbf{k}_*^T (\mathbf{K} + \sigma_n^2 \mathbf{I})^{-1} \mathbf{y}$$
$$\sigma^{*2} = k(\mathbf{x}^*, \mathbf{x}^*) - \mathbf{k}_*^T (\mathbf{K} + \sigma_n^2 \mathbf{I})^{-1} \mathbf{k}_*$$

---

## 5. Physics-Guided Neural Networks

### 5.1 Physics-Informed Neural Networks (PINNs)

**Incorporate physical constraints into loss function:**

$$\mathcal{L} = \mathcal{L}_{data} + \lambda_{phys} \mathcal{L}_{physics}$$

Where:
- $\mathcal{L}_{data} = \frac{1}{N} \sum_{i=1}^{N} (y_i - \hat{y}_i)^2$
- $\mathcal{L}_{physics} = \frac{1}{M} \sum_{j=1}^{M} (\mathcal{N}[\hat{y}](\mathbf{x}_j))^2$

**Example: Heat equation constraint**
$$\mathcal{N}[u] = \frac{\partial u}{\partial t} - \alpha \nabla^2 u = 0$$

### 5.2 Climate Model Emulators

**Emulate expensive climate models:**

$$\hat{y}_{climate} = f_{NN}(\text{inputs}; \theta)$$

Trained on CMIP6/CMIP5 simulations.

**Downscaling:**
$$y_{high-res}(\mathbf{x}, t) = f_{downscale}(y_{low-res}(\mathbf{x}, t), \text{topo}(\mathbf{x}))$$

---

## 6. Hybrid and Multi-Modal Models

### 6.1 Physics-Guided Multimodal Transformer

**Paper:** "A Physics-guided Multimodal Transformer Path to Weather and Climate Sciences" (2025)

#### Architecture

Integrates multiple data modalities:
- Satellite imagery (CNN/ViT encoder)
- Weather station data (Transformer encoder)
- Atmospheric probes (MLP encoder)
- Climate model outputs (Transformer encoder)

**Fusion:**
$$\mathbf{h}_{fused} = \text{CrossAttention}(\mathbf{h}_{sat}, \mathbf{h}_{station}, \mathbf{h}_{probe}, \mathbf{h}_{model})$$

#### Next-Token Prediction Framework

$$\mathbf{x}_{\tau+1} \sim P_\Theta(\mathbf{x}_1 | \mathbf{x}_1, \mathbf{x}_2, ..., \mathbf{x}_\tau)$$

Unified approach for:
- Forecasting
- Downscaling
- Reanalysis

---

### 6.2 Digital Twins

**Concept:** High-fidelity virtual replicas of physical systems.

**Climate Digital Twin Components:**
1. **Data assimilation:** Merge observations with models
2. **Real-time simulation:** Continuous updating
3. **Scenario testing:** What-if analysis
4. **Predictive analytics:** Forward projections

**Applications:**
- Asset-level risk assessment
- Portfolio optimization
- Adaptation planning

---

## 7. Model Selection Framework

### 7.1 Selection Criteria

| Criterion | Metrics | Priority |
|-----------|---------|----------|
| **Accuracy** | RMSE, MAE, R² | High |
| **Uncertainty** | Calibration, sharpness | High |
| **Interpretability** | Feature importance, SHAP | Medium |
| **Scalability** | Training time, inference time | High |
| **Data efficiency** | Sample complexity | Medium |
| **Robustness** | OOD performance, adversarial | High |

### 7.2 Model Recommendations by Task

| Task | Recommended Models | Rationale |
|------|-------------------|-----------|
| **Long-term climate projections** | Informer, iTransformer, PINNs | Long sequence modeling |
| **Short-term hazard forecasting** | PatchTST, GraphCast, ST-GNN | Fast inference |
| **Spatial risk contagion** | ST-GNN, GNN-rP, GAT | Graph structure |
| **Damage function estimation** | BNN, GP, XGBoost | Uncertainty quantification |
| **Portfolio risk aggregation** | Ensemble, Copula-GNN | Multi-asset correlation |
| **Stranding risk** | XGBoost, LightGBM, RL | Decision optimization |
| **Scenario ensemble** | Physics-Guided Transformer | Physical consistency |

### 7.3 Implementation Priority

**Phase 1 (Immediate):**
1. XGBoost/LightGBM for tabular risk data
2. iTransformer for multivariate forecasting
3. ST-GNN for spatial contagion

**Phase 2 (Short-term):**
1. Bayesian Neural Networks for uncertainty
2. GraphCast for weather forecasting
3. Ensemble methods for robustness

**Phase 3 (Medium-term):**
1. Physics-Guided Transformers
2. Digital Twin architecture
3. Reinforcement Learning for adaptation

---

## Appendices

### Appendix A: Model Complexity Comparison

| Model | Parameters | Training Time | Inference | GPU Required |
|-------|------------|---------------|-----------|--------------|
| XGBoost | 1K-100K | Minutes | Milliseconds | No |
| LightGBM | 1K-100K | Minutes | Milliseconds | No |
| iTransformer | 1M-10M | Hours | Seconds | Yes |
| Informer | 1M-10M | Hours | Seconds | Yes |
| PatchTST | 100K-1M | Hours | Milliseconds | Optional |
| GraphCast | 10M-100M | Days | Minutes | Yes |
| ST-GNN | 100K-1M | Hours | Seconds | Yes |
| BNN | 1M-10M | Hours-Days | Seconds | Yes |

### Appendix B: Python Libraries

```python
# Transformers
pip install transformers, pytorch-forecasting, neuralforecast

# Graph Neural Networks
pip install torch-geometric, dgl, pytorch-geometric-temporal

# Gradient Boosting
pip install xgboost, lightgbm, catboost

# Bayesian ML
pip install pyro-ppl, tensorflow-probability, blitz

# Physics-Guided
pip install deepxde, simupy, pysindy
```

---

*End of Document*
