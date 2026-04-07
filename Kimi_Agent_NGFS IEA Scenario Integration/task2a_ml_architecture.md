# Task 2A: Multi-Sector Asset Valuation Engine - Comprehensive ML Architecture

## Executive Summary

This document presents a comprehensive machine learning architecture for multi-sector asset valuation encompassing Real Estate, Energy, Financial Instruments, and Supply Chain domains. The architecture integrates state-of-the-art deep learning, probabilistic modeling, and uncertainty quantification techniques to provide robust valuation estimates with calibrated confidence intervals.

---

## 1. Spatial Graph Neural Networks (GNNs) for Real Estate Valuation

### 1.1 Mathematical Foundation

#### 1.1.1 Graph Construction

The real estate market is modeled as a heterogeneous attributed graph:

$$\mathcal{G} = (\mathcal{V}, \mathcal{E}, X, A)$$

Where:
- $\mathcal{V} = \{v_1, v_2, ..., v_N\}$ represents the set of $N$ property nodes
- $\mathcal{E} \subseteq \mathcal{V} \times \mathcal{V}$ represents spatial and transactional relationships
- $X \in \mathbb{R}^{N \times d}$ is the node feature matrix with $d$ features per property
- $A \in \mathbb{R}^{N \times N}$ is the weighted adjacency matrix

**Node Features:**
$$X_v = [x_v^{\text{structural}}, x_v^{\text{loc}}, x_v^{\text{temp}}, x_v^{\text{market}}]$$

Where individual components include:

$$x_v^{\text{structural}} = [\text{sqft}, \text{bedrooms}, \text{bathrooms}, \text{age}, \text{lot\_size}, \text{stories}, \text{garage}, \text{pool}]^T$$

$$x_v^{\text{loc}} = [\text{lat}, \text{lon}, z_v^{\text{geo}}]$$

Where $z_v^{\text{geo}} \in \mathbb{R}^{d_{\text{emb}}}$ represents learned geographic embeddings.

#### 1.1.2 Edge Construction Strategies

**K-Nearest Neighbors (Spatial):**
$$\mathcal{E}_{\text{KNN}} = \{(v, u) : u \in \text{KNN}_k(v, \text{haversine}(v, u))\}$$

**Haversine Distance:**
$$d_{\text{haversine}}(v, u) = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\phi_u - \phi_v}{2}\right) + \cos(\phi_v)\cos(\phi_u)\sin^2\left(\frac{\lambda_u - \lambda_v}{2}\right)}\right)$$

Where $R$ is Earth's radius, $\phi$ is latitude, and $\lambda$ is longitude.

**Radius-Based Edges:**
$$\mathcal{E}_{\text{radius}} = \{(v, u) : d_{\text{haversine}}(v, u) \leq r_{\text{max}}\}$$

**Transaction-Based Edges:**
$$\mathcal{E}_{\text{trans}} = \{(v, u) : \text{buyer}(v) = \text{seller}(u) \lor \text{agent}(v) = \text{agent}(u)\}$$

**Combined Edge Weight:**
$$w_{vu} = \alpha \cdot \exp\left(-\frac{d_{\text{haversine}}(v, u)^2}{2\sigma^2}\right) + \beta \cdot \mathbb{1}_{[\text{same\_neighborhood}]} + \gamma \cdot w_{\text{trans}}$$

### 1.2 Message Passing Neural Networks (MPNN)

#### 1.2.1 General Message Passing Framework

The message passing operation at layer $l$:

$$h_v^{(l+1)} = \text{UPDATE}^{(l)}\left(h_v^{(l)}, \text{AGGREGATE}^{(l)}\left(\{h_u^{(l)} : u \in \mathcal{N}(v)\}\right)\right)$$

Where:
- $h_v^{(l)} \in \mathbb{R}^{d^{(l)}}$ is the hidden state of node $v$ at layer $l$
- $\mathcal{N}(v) = \{u \in \mathcal{V} : (v, u) \in \mathcal{E}\}$ is the neighborhood
- $\text{AGGREGATE}^{(l)}: \mathbb{R}^{d^{(l)} \times |\mathcal{N}(v)|} \rightarrow \mathbb{R}^{d^{(l)}}$ aggregates neighbor information
- $\text{UPDATE}^{(l)}: \mathbb{R}^{d^{(l)}} \times \mathbb{R}^{d^{(l)}} \rightarrow \mathbb{R}^{d^{(l+1)}}$ updates node representations

#### 1.2.2 Graph Convolutional Network (GCN)

$$h_v^{(l+1)} = \sigma\left(\sum_{u \in \mathcal{N}(v) \cup \{v\}} \frac{1}{\sqrt{\hat{d}_v \hat{d}_u}} W^{(l)} h_u^{(l)}\right)$$

Where $\hat{d}_v = |\mathcal{N}(v)| + 1$ is the normalized degree.

In matrix form:
$$H^{(l+1)} = \sigma\left(\tilde{D}^{-1/2}\tilde{A}\tilde{D}^{-1/2} H^{(l)} W^{(l)}\right)$$

Where $\tilde{A} = A + I_N$ and $\tilde{D}_{ii} = \sum_j \tilde{A}_{ij}$.

### 1.3 GraphSAGE Architecture

#### 1.3.1 Mean Aggregator

$$h_{\mathcal{N}(v)}^{(l)} = \frac{1}{|\mathcal{N}(v)|} \sum_{u \in \mathcal{N}(v)} h_u^{(l)}$$

$$h_v^{(l+1)} = \sigma\left(W^{(l)} \cdot \text{CONCAT}(h_v^{(l)}, h_{\mathcal{N}(v)}^{(l)})\right)$$

#### 1.3.2 Max Pooling Aggregator

$$h_{\mathcal{N}(v)}^{(l)} = \max_{u \in \mathcal{N}(v)} \{\sigma(W_{\text{pool}} h_u^{(l)} + b)\}$$

$$h_v^{(l+1)} = \sigma\left(W^{(l)} \cdot \text{CONCAT}(h_v^{(l)}, h_{\mathcal{N}(v)}^{(l)})\right)$$

#### 1.3.3 LSTM Aggregator

The LSTM aggregator treats neighbors as a sequence:

$$h_{\mathcal{N}(v)}^{(l)} = \text{LSTM}_\theta(\{h_u^{(l)} : u \in \pi(\mathcal{N}(v))\})$$

Where $\pi$ is a random permutation of neighbors to maintain permutation invariance through randomization.

**LSTM Cell Equations:**
$$f_t = \sigma(W_f \cdot [h_{t-1}, x_t] + b_f)$$
$$i_t = \sigma(W_i \cdot [h_{t-1}, x_t] + b_i)$$
$$\tilde{C}_t = \tanh(W_C \cdot [h_{t-1}, x_t] + b_C)$$
$$C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t$$
$$o_t = \sigma(W_o \cdot [h_{t-1}, x_t] + b_o)$$
$$h_t = o_t \odot \tanh(C_t)$$

### 1.4 Graph Attention Networks (GAT)

#### 1.4.1 Single Attention Head

$$e_{vu}^{(l)} = \text{LeakyReLU}\left(a^{(l)T} [W^{(l)}h_v^{(l)} \| W^{(l)}h_u^{(l)}]\right)$$

$$\alpha_{vu}^{(l)} = \frac{\exp(e_{vu}^{(l)})}{\sum_{k \in \mathcal{N}(v)} \exp(e_{vk}^{(l)})}$$

$$h_v^{(l+1)} = \sigma\left(\sum_{u \in \mathcal{N}(v)} \alpha_{vu}^{(l)} W^{(l)} h_u^{(l)}\right)$$

#### 1.4.2 Multi-Head Attention

$$h_v^{(l+1)} = \|_{k=1}^{K} \sigma\left(\sum_{u \in \mathcal{N}(v)} \alpha_{vu}^{(l,k)} W^{(l,k)} h_u^{(l)}\right)$$

For the final layer, averaging is used:

$$h_v^{(L)} = \sigma\left(\frac{1}{K} \sum_{k=1}^{K} \sum_{u \in \mathcal{N}(v)} \alpha_{vu}^{(L,k)} W^{(L,k)} h_u^{(L-1)}\right)$$

### 1.5 Spatial Contagion Modeling

#### 1.5.1 Multi-Hop Neighborhood Aggregation

For capturing spatial contagion effects across $K$ hops:

$$h_v^{(K)} = f^{(K)}\left(\mathcal{N}_K(v)\right)$$

Where $\mathcal{N}_K(v)$ denotes the $K$-hop neighborhood:

$$\mathcal{N}_K(v) = \{u \in \mathcal{V} : d_{\mathcal{G}}(v, u) \leq K\}$$

With $d_{\mathcal{G}}$ being the graph distance.

#### 1.5.2 Jumping Knowledge Networks

To aggregate information from all layers:

$$h_v^{\text{JK}} = \text{AGGREGATE}_{l \in \{1,...,L\}}(h_v^{(l)})$$

Options for AGGREGATE:
- **Concatenation:** $h_v^{\text{JK}} = [h_v^{(1)} \| ... \| h_v^{(L)}]$
- **Max Pooling:** $h_v^{\text{JK}} = \max(h_v^{(1)}, ..., h_v^{(L)})$
- **LSTM Attention:** $h_v^{\text{JK}} = \sum_{l=1}^{L} \alpha_l h_v^{(l)}$

### 1.6 Feature Engineering for Spatial GNNs

#### 1.6.1 Location Embeddings

**Geographic Coordinate Embeddings via Fourier Features:**

$$\phi(\text{lat}, \text{lon}) = [\cos(2\pi B \cdot \text{lat}), \sin(2\pi B \cdot \text{lat}), \cos(2\pi B \cdot \text{lon}), \sin(2\pi B \cdot \text{lon})]$$

Where $B$ is a bandwidth parameter matrix.

**Tile-Based Embeddings (H3/Geohash):**

$$z_v^{\text{geo}} = \text{Embedding}(\text{H3}(\text{lat}_v, \text{lon}_v, \text{resolution}))$$

#### 1.6.2 Proximity to Amenities

For amenity type $a \in \mathcal{A}$:

$$x_v^{\text{amenity}, a} = \sum_{p \in \mathcal{P}_a} \exp\left(-\frac{d(v, p)}{\sigma_a}\right)$$

Where $\mathcal{P}_a$ is the set of amenities of type $a$.

**Amenity Categories:**
- Schools: $\mathcal{P}_{\text{school}}$
- Hospitals: $\mathcal{P}_{\text{hospital}}$
- Shopping centers: $\mathcal{P}_{\text{retail}}$
- Transit stations: $\mathcal{P}_{\text{transit}}$
- Parks: $\mathcal{P}_{\text{park}}$

#### 1.6.3 Transit Accessibility

**Walk Score Computation:**

$$\text{WalkScore}_v = \frac{\sum_{c \in \mathcal{C}} w_c \cdot f(d(v, c))}{\sum_{c \in \mathcal{C}} w_c}$$

Where $f(d) = \max(0, 1 - \frac{d}{d_{\text{max}}})$ and $\mathcal{C}$ are categories with weights $w_c$.

**Transit Score:**

$$\text{TransitScore}_v = \sum_{t \in \mathcal{T}} \frac{\text{frequency}_t}{d(v, t) + \epsilon}$$

### 1.7 Complete GNN Architecture for Property Valuation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SPATIAL GNN PROPERTY VALUATION PIPELINE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT LAYER                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Property Features X ∈ ℝ^(N×d)                                     │   │
│  │  - Structural: [sqft, beds, baths, age, ...]                       │   │
│  │  - Location: [lat, lon, geo_embedding]                             │   │
│  │  - Temporal: [sale_date, market_conditions]                        │   │
│  │  - Amenity Proximity: [school_dist, transit_score, ...]            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  GRAPH CONSTRUCTION                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Edge Types:                                                        │   │
│  │  1. Spatial KNN: E_KNN = {(v,u): u ∈ KNN_k(v)}                     │   │
│  │  2. Radius: E_radius = {(v,u): d(v,u) ≤ r_max}                     │   │
│  │  3. Transaction: E_trans = shared buyers/agents                     │   │
│  │  4. Comps: E_comps = similar properties by features                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  GNN ENCODER (L layers)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Layer 1: GraphSAGE with Mean Aggregator                            │   │
│  │    h^(1) = σ(W^(1) · CONCAT(h^(0), MEAN({h_u^(0): u ∈ N(v)})))     │   │
│  │                                                                     │   │
│  │  Layer 2: GAT with Multi-Head Attention                             │   │
│  │    α_vu = softmax(LeakyReLU(a^T[Wh_v || Wh_u]))                    │   │
│  │    h^(2) = σ(Σ_u α_vu Wh_u^(1))                                    │   │
│  │                                                                     │   │
│  │  ...                                                                │   │
│  │                                                                     │   │
│  │  Layer L: Final representation                                      │   │
│  │    z_v = h_v^(L) ∈ ℝ^d_hidden                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  POOLING & READOUT                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Options:                                                           │   │
│  │  - Node-level: z_v (individual property valuation)                  │   │
│  │  - Graph-level: z_G = GlobalMeanPool({z_v: v ∈ V})                 │   │
│  │  - Hierarchical: DiffPool clustering                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  PREDICTION HEAD                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Regression Head:                                                   │   │
│  │    ŷ_v = MLP(z_v) = W_out · σ(W_hidden · z_v + b) + b_out          │   │
│  │                                                                     │   │
│  │  Uncertainty Head (Conformal):                                      │   │
│  │    [ŷ_v - q_α, ŷ_v + q_α]                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  OUTPUT                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Predicted Value: ŷ_v ∈ ℝ                                          │   │
│  │  Confidence Interval: [ŷ_v^L, ŷ_v^U]                               │   │
│  │  Attention Weights: {α_vu} for explainability                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.8 Training Objective

#### 1.8.1 Loss Function

$$\mathcal{L}_{\text{GNN}} = \frac{1}{|\mathcal{V}_{\text{train}}|} \sum_{v \in \mathcal{V}_{\text{train}}} \left[\ell(\hat{y}_v, y_v) + \lambda_{\text{reg}} \|W\|_2^2\right]$$

Where:
- $\ell(\hat{y}_v, y_v) = (\hat{y}_v - y_v)^2$ for MSE
- $\ell(\hat{y}_v, y_v) = |\hat{y}_v - y_v|$ for MAE
- $\lambda_{\text{reg}}$ is the L2 regularization coefficient

#### 1.8.2 Spatial Regularization

To enforce spatial smoothness:

$$\mathcal{L}_{\text{spatial}} = \sum_{(v,u) \in \mathcal{E}} w_{vu} \|\hat{y}_v - \hat{y}_u\|^2$$

Total loss:
$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{GNN}} + \lambda_{\text{spatial}} \mathcal{L}_{\text{spatial}}$$

---

## 2. Gradient Boosting (XGBoost/LightGBM) for Mass Appraisal

### 2.1 Mathematical Foundation

#### 2.1.1 Additive Tree Ensemble

The gradient boosting model is an additive ensemble of $K$ weak learners (trees):

$$\hat{y}_i = \phi(x_i) = \sum_{k=1}^{K} f_k(x_i), \quad f_k \in \mathcal{F}$$

Where $\mathcal{F}$ is the space of regression trees:

$$\mathcal{F} = \{f(x) = w_{q(x)}\}$$

With $q: \mathbb{R}^d \rightarrow \{1, ..., T\}$ mapping to leaf indices and $w \in \mathbb{R}^T$ being leaf weights.

#### 2.1.2 Objective Function

$$\mathcal{L}(\phi) = \sum_{i=1}^{n} \ell(\hat{y}_i, y_i) + \sum_{k=1}^{K} \Omega(f_k)$$

Where:
- $\ell(\hat{y}_i, y_i)$ is the loss function (e.g., squared loss, log loss)
- $\Omega(f)$ is the regularization term

**Regularization:**
$$\Omega(f) = \gamma T + \frac{1}{2}\lambda \|w\|^2$$

Where:
- $T$ is the number of leaves
- $\gamma$ controls leaf penalty (complexity cost)
- $\lambda$ is L2 regularization on leaf weights

### 2.2 Tree Building Algorithm

#### 2.2.1 Second-Order Taylor Approximation

At iteration $t$, the objective becomes:

$$\mathcal{L}^{(t)} = \sum_{i=1}^{n} \ell(y_i, \hat{y}_i^{(t-1)} + f_t(x_i)) + \Omega(f_t)$$

Using second-order Taylor expansion:

$$\mathcal{L}^{(t)} \approx \sum_{i=1}^{n} \left[\ell(y_i, \hat{y}_i^{(t-1)}) + g_i f_t(x_i) + \frac{1}{2}h_i f_t^2(x_i)\right] + \Omega(f_t)$$

Where:
- $g_i = \partial_{\hat{y}^{(t-1)}} \ell(y_i, \hat{y}^{(t-1)})$ (first-order gradient)
- $h_i = \partial^2_{\hat{y}^{(t-1)}} \ell(y_i, \hat{y}^{(t-1)})$ (second-order Hessian)

Removing constants:

$$\tilde{\mathcal{L}}^{(t)} = \sum_{i=1}^{n} \left[g_i f_t(x_i) + \frac{1}{2}h_i f_t^2(x_i)\right] + \gamma T + \frac{1}{2}\lambda \sum_{j=1}^{T} w_j^2$$

#### 2.2.2 Optimal Leaf Weights

For leaf $j$ with instance set $I_j = \{i : q(x_i) = j\}$:

$$w_j^* = -\frac{\sum_{i \in I_j} g_i}{\sum_{i \in I_j} h_i + \lambda}$$

#### 2.2.3 Split Gain Computation

The gain from splitting a leaf into left ($L$) and right ($R$) children:

$$\text{Gain} = \frac{1}{2}\left[\frac{G_L^2}{H_L + \lambda} + \frac{G_R^2}{H_R + \lambda} - \frac{(G_L + G_R)^2}{H_L + H_R + \lambda}\right] - \gamma$$

Where:
- $G_L = \sum_{i \in I_L} g_i$, $H_L = \sum_{i \in I_L} h_i$
- $G_R = \sum_{i \in I_R} g_i$, $H_R = \sum_{i \in I_R} h_i$

### 2.3 Quantile Loss for Uncertainty

#### 2.3.1 Pinball Loss Function

For quantile $\tau \in (0, 1)$:

$$\rho_\tau(y - \hat{y}) = \begin{cases} \tau(y - \hat{y}) & \text{if } y \geq \hat{y} \\ (\tau - 1)(y - \hat{y}) & \text{if } y < \hat{y} \end{cases}$$

Or equivalently:

$$\rho_\tau(u) = u(\tau - \mathbb{1}_{[u < 0]})$$

#### 2.3.2 Gradient and Hessian for Quantile Loss

$$g_i = \begin{cases} \tau & \text{if } y_i \geq \hat{y}_i \\ \tau - 1 & \text{if } y_i < \hat{y}_i \end{cases}$$

$$h_i = 1 \quad \text{(constant for numerical stability)}$$

### 2.4 XGBoost Specifics

#### 2.4.1 Exact Greedy Algorithm

```
Algorithm: Exact Greedy Algorithm for Split Finding
─────────────────────────────────────────────────
Input: I (instance set of current node), d (feature dimension)
Output: Split with maximum gain

gain ← 0
G ← Σ_{i∈I} g_i, H ← Σ_{i∈I} h_i
for k = 1 to d do
    G_L ← 0, H_L ← 0
    for j in sorted(I, by x_jk) do
        G_L ← G_L + g_j, H_L ← H_L + h_j
        G_R ← G - G_L, H_R ← H - H_L
        score ← max(score, GL²/(HL+λ) + GR²/(HR+λ) - G²/(H+λ))
    end for
end for
```

#### 2.4.2 Approximate Algorithm (Weighted Quantile Sketch)

For large datasets, XGBoost uses histogram-based approximation:

1. **Propose candidate split points** $\{s_{k1}, s_{k2}, ..., s_{kl}\}$ for feature $k$
2. **Assign weights:** $h_i$ as weight for each data point
3. **Find split points** satisfying:

$$|r_k(s_{k,j}) - r_k(s_{k,j+1})| < \epsilon$$

Where $r_k(s)$ is the rank function:

$$r_k(s) = \frac{1}{\sum_{(x,h) \in \mathcal{D}_k} h} \sum_{(x,h) \in \mathcal{D}_k, x < s} h$$

### 2.5 LightGBM Optimizations

#### 2.5.1 Gradient-Based One-Side Sampling (GOSS)

1. **Sort** instances by absolute gradient
2. **Keep** top-$a\%$ instances with largest gradients
3. **Randomly sample** $b\%$ from remaining instances
4. **Amplify** sampled small gradients by factor $\frac{1-a}{b}$

#### 2.5.2 Exclusive Feature Bundling (EFB)

For sparse features, bundle mutually exclusive features:

$$x_{\text{bundle}} = \sum_{j=1}^{m} x_j \cdot R_j + \text{offset}_j$$

Where $R_j$ are ranges ensuring non-overlapping values.

#### 2.5.3 Leaf-Wise Tree Growth

LightGBM grows trees leaf-wise (best-first) rather than level-wise:

$$\text{Choose leaf } j^* = \arg\max_j \text{Gain}(j)$$

### 2.6 Feature Importance

#### 2.6.1 Gain-Based Importance

$$\text{Importance}_{\text{gain}}(j) = \sum_{k=1}^{K} \sum_{t \in T_k^{(j)}} \text{Gain}(t)$$

Where $T_k^{(j)}$ are splits on feature $j$ in tree $k$.

#### 2.6.2 Cover-Based Importance

$$\text{Importance}_{\text{cover}}(j) = \sum_{k=1}^{K} \sum_{t \in T_k^{(j)}} H_t$$

Where $H_t$ is the Hessian sum at split $t$.

#### 2.6.3 Frequency-Based Importance

$$\text{Importance}_{\text{weight}}(j) = \sum_{k=1}^{K} |T_k^{(j)}|$$

### 2.7 SHAP Values for Explainability

#### 2.7.1 SHAP Definition

The SHAP value for feature $j$:

$$\phi_j = \sum_{S \subseteq N \setminus \{j\}} \frac{|S|!(|N| - |S| - 1)!}{|N|!} [f_{S \cup \{j\}}(x_{S \cup \{j\}}) - f_S(x_S)]$$

Where:
- $N$ is the set of all features
- $S$ is a subset of features
- $f_S$ is the model trained on subset $S$

#### 2.7.2 TreeSHAP for Gradient Boosting

TreeSHAP computes SHAP values in polynomial time for trees:

$$\phi_j = \sum_{m \in M} w_m \cdot \mathbb{1}_{[j \in \text{path}(m)]} \cdot (v_m - v_{\text{parent}(m)})$$

Where $M$ is the set of leaves and $w_m$ is the fraction of samples reaching leaf $m$.

### 2.8 Hyperparameter Optimization

#### 2.8.1 Search Space

| Parameter | Description | Range |
|-----------|-------------|-------|
| $\eta$ | Learning rate | $[0.01, 0.3]$ |
| $\max\_depth$ | Maximum tree depth | $[3, 12]$ |
| $\min\_child\_weight$ | Minimum sum of Hessian | $[1, 10]$ |
| $\gamma$ | Minimum loss reduction | $[0, 5]$ |
| $\lambda$ | L2 regularization | $[0, 5]$ |
| $\alpha$ | L1 regularization | $[0, 5]$ |
| $n\_estimators$ | Number of trees | $[100, 1000]$ |
| $subsample$ | Row sampling ratio | $[0.5, 1.0]$ |
| $colsample\_bytree$ | Column sampling ratio | $[0.5, 1.0]$ |

#### 2.8.2 Bayesian Optimization

Using Gaussian Process as surrogate:

$$p(f | \mathcal{D}_{1:t}) \sim \mathcal{GP}(\mu(x), k(x, x'))$$

Acquisition function (Expected Improvement):

$$\text{EI}(x) = \mathbb{E}[\max(f(x) - f(x^+), 0)]$$

### 2.9 Handling Categorical Features

#### 2.9.1 One-Hot Encoding

For categorical feature $c$ with $m$ categories:

$$x_c \rightarrow [\mathbb{1}_{[x_c = 1]}, \mathbb{1}_{[x_c = 2]}, ..., \mathbb{1}_{[x_c = m]}]$$

#### 2.9.2 Target Encoding

$$x_c^{\text{encoded}} = \mathbb{E}[y | x_c = v] = \frac{\sum_{i: x_{i,c} = v} y_i}{|\{i: x_{i,c} = v\}|}$$

With smoothing:

$$x_c^{\text{encoded}} = \frac{n_v \cdot \bar{y}_v + \lambda \cdot \bar{y}_{\text{global}}}{n_v + \lambda}$$

### 2.10 Missing Value Handling

XGBoost handles missing values natively by learning optimal direction:

$$\text{direction} = \arg\max_{d \in \{\text{left}, \text{right}\}} \text{Gain}(d)$$

For each split, the algorithm tries both directions for missing values and chooses the one with higher gain.

---

## 3. Conformal Prediction for Confidence Intervals

### 3.1 Mathematical Foundation

#### 3.1.1 Conformal Prediction Framework

Given training data $\{(X_1, Y_1), ..., (X_n, Y_n)\}$ i.i.d. from distribution $P_{XY}$, and a new test point $X_{n+1}$, conformal prediction constructs a prediction set $C(X_{n+1})$ such that:

$$P(Y_{n+1} \in C(X_{n+1})) \geq 1 - \alpha$$

Where $1 - \alpha$ is the desired coverage level (e.g., 0.95 for 95% confidence).

#### 3.1.2 Nonconformity Score

A nonconformity measure $S(X, Y)$ quantifies how "strange" a point $(X, Y)$ is relative to the training data. Lower scores indicate better conformity.

For regression with fitted model $\hat{\mu}$:

$$S(X, Y) = |Y - \hat{\mu}(X)|$$

Or for normalized scores:

$$S(X, Y) = \frac{|Y - \hat{\mu}(X)|}{\hat{\sigma}(X)}$$

Where $\hat{\sigma}(X)$ estimates the local uncertainty.

### 3.2 Split Conformal Prediction

#### 3.2.1 Algorithm

```
Algorithm: Split Conformal Prediction
─────────────────────────────────────
Input: Training data D = {(X_i, Y_i)}_{i=1}^n, 
       Test point X_{n+1}, 
       Miscoverage level α ∈ (0,1)
Output: Prediction interval C(X_{n+1})

1. Split D into D_train (size m) and D_cal (size n-m)

2. Fit model μ̂ on D_train

3. Compute nonconformity scores on calibration set:
   S_i = |Y_i - μ̂(X_i)|,  for i ∈ D_cal

4. Compute empirical quantile:
   q̂_{1-α} = ⌈(n-m+1)(1-α)⌉-th quantile of {S_i}_{i∈D_cal}

5. Return prediction interval:
   C(X_{n+1}) = [μ̂(X_{n+1}) - q̂_{1-α}, μ̂(X_{n+1}) + q̂_{1-α}]
```

#### 3.2.2 Coverage Guarantee

**Theorem:** For exchangeable data, split conformal prediction satisfies:

$$P(Y_{n+1} \in C(X_{n+1})) \geq 1 - \alpha$$

Moreover, if the nonconformity scores are almost surely distinct:

$$1 - \alpha \leq P(Y_{n+1} \in C(X_{n+1})) \leq 1 - \alpha + \frac{1}{n_{\text{cal}} + 1}$$

### 3.3 Jackknife+ and Cross-Validation+

#### 3.3.1 Leave-One-Out Jackknife

For each $i \in \{1, ..., n\}$:
1. Fit model $\hat{\mu}_{-i}$ on all data except $(X_i, Y_i)$
2. Compute residual: $R_i = |Y_i - \hat{\mu}_{-i}(X_i)|$

Prediction interval:

$$C_{\text{jackknife}}(X_{n+1}) = \left[\hat{\mu}(X_{n+1}) - q_{1-\alpha}(R), \hat{\mu}(X_{n+1}) + q_{1-\alpha}(R)\right]$$

**Limitation:** No finite-sample coverage guarantee.

#### 3.3.2 Jackknife+

```
Algorithm: Jackknife+
─────────────────────
Input: Data {(X_i, Y_i)}_{i=1}^n, Test X_{n+1}, Level α
Output: Prediction interval C(X_{n+1})

1. For i = 1 to n:
      Fit μ̂_{-i} on all data except (X_i, Y_i)
      Compute R_i = |Y_i - μ̂_{-i}(X_i)|
      Compute μ̂_{-i}(X_{n+1})

2. Return:
   C(X_{n+1}) = [q_α({μ̂_{-i}(X_{n+1}) - R_i}_{i=1}^n),
                 q_{1-α}({μ̂_{-i}(X_{n+1}) + R_i}_{i=1}^n)]
```

**Coverage Guarantee:**

$$1 - 2\alpha \leq P(Y_{n+1} \in C_{\text{jackknife+}}(X_{n+1})) \leq 1 - \alpha$$

#### 3.3.3 Cross-Validation+ (CV+)

For $K$-fold cross-validation:

1. Split data into $K$ folds: $\mathcal{D}_1, ..., \mathcal{D}_K$
2. For each fold $k$, fit $\hat{\mu}_{-k}$ on $\mathcal{D} \setminus \mathcal{D}_k$
3. Compute residuals: $R_i = |Y_i - \hat{\mu}_{-k(i)}(X_i)|$ for $i \in \mathcal{D}_k$
4. Compute predictions: $\hat{\mu}_{-k}(X_{n+1})$ for all $k$

Prediction interval:

$$C_{\text{CV+}}(X_{n+1}) = \left[q_\alpha\left(\bigcup_{k=1}^{K} \{\hat{\mu}_{-k}(X_{n+1}) - R_i : i \in \mathcal{D}_k\}\right), q_{1-\alpha}\left(\bigcup_{k=1}^{K} \{\hat{\mu}_{-k}(X_{n+1}) + R_i : i \in \mathcal{D}_k\}\right)\right]$$

### 3.4 Adaptive Conformal Inference

#### 3.4.1 Problem: Distribution Shift

Standard conformal prediction assumes exchangeability. For time-varying data:

$$P_{XY}^{(t)} \neq P_{XY}^{(t+1)}$$

#### 3.4.2 Online Adaptive Algorithm

```
Algorithm: Online Adaptive Conformal Inference
─────────────────────────────────────────────
Input: Stream of data, Initial quantile q̂_1, 
       Learning rate γ, Target coverage 1-α
Output: Adaptive prediction intervals

Initialize: q̂_1

For t = 1, 2, ...:
    1. Observe X_t
    2. Predict C_t(X_t) = [μ̂(X_t) - q̂_t, μ̂(X_t) + q̂_t]
    3. Observe Y_t
    4. Compute error indicator: Err_t = 1_{Y_t ∉ C_t(X_t)}
    5. Update quantile:
       q̂_{t+1} = q̂_t + γ(α - Err_t)
```

#### 3.4.3 Weighted Conformal Prediction

For covariate shift where $P_{X}^{\text{test}} \neq P_{X}^{\text{train}}$:

$$w(X) = \frac{dP_{X}^{\text{test}}(X)}{dP_{X}^{\text{train}}(X)}$$

Weighted quantile computation:

$$\hat{q}_{1-\alpha} = \inf\left\{q : \frac{\sum_{i=1}^{n} w(X_i) \mathbb{1}_{[S_i \leq q]}}{\sum_{i=1}^{n} w(X_i)} \geq 1 - \alpha\right\}$$

### 3.5 Conformalized Quantile Regression (CQR)

#### 3.5.1 Algorithm

```
Algorithm: Conformalized Quantile Regression
───────────────────────────────────────────
Input: Training data D, Test X_{n+1}, 
       Quantiles [α_lo, α_hi] (e.g., [0.05, 0.95])
Output: Prediction interval C(X_{n+1})

1. Split D into D_train and D_cal

2. Fit two quantile regressors on D_train:
   - μ̂_lo estimating α_lo quantile
   - μ̂_hi estimating α_hi quantile

3. On calibration set, compute:
   E_i = max(μ̂_lo(X_i) - Y_i, Y_i - μ̂_hi(X_i))

4. Compute q̂ = ⌈(n_cal+1)(1-α)⌉-th quantile of {E_i}

5. Return:
   C(X_{n+1}) = [μ̂_lo(X_{n+1}) - q̂, μ̂_hi(X_{n+1}) + q̂]
```

### 3.6 Full Conformal Prediction

#### 3.6.1 Algorithm

```
Algorithm: Full Conformal Prediction
────────────────────────────────────
Input: Training data {(X_i, Y_i)}_{i=1}^n, 
       Test X_{n+1}, Candidate values Y, Level α
Output: Prediction set C(X_{n+1})

C(X_{n+1}) = ∅

For each candidate y ∈ Y:
    1. Augment data: D_y = D ∪ {(X_{n+1}, y)}
    
    2. Fit model μ̂_y on D_y
    
    3. Compute scores:
       S_i = |Y_i - μ̂_y(X_i)| for i = 1,...,n
       S_{n+1} = |y - μ̂_y(X_{n+1})|
    
    4. Compute p-value:
       π(y) = (|{i: S_i ≥ S_{n+1}}| + 1) / (n + 1)
    
    5. If π(y) > α, add y to C(X_{n+1})

Return C(X_{n+1})
```

**Advantage:** Exact coverage guarantee
**Disadvantage:** Computationally expensive (requires refitting for each candidate)

### 3.7 Conformal Prediction for GNNs

#### 3.7.1 Graph-Aware Nonconformity Score

$$S(X_v, Y_v) = |Y_v - \hat{\mu}(X_v, \mathcal{G})| + \lambda \sum_{u \in \mathcal{N}(v)} |Y_v - Y_u| \cdot w_{vu}$$

Where the second term enforces spatial smoothness.

---

## 4. Transformers/LSTMs for Energy Price Forecasting

### 4.1 Long Short-Term Memory (LSTM) Networks

#### 4.1.1 LSTM Cell Architecture

An LSTM cell maintains two states:
- **Cell state** $C_t$: Long-term memory
- **Hidden state** $h_t$: Short-term output

**Forget Gate:** Controls what information to discard
$$f_t = \sigma(W_f \cdot [h_{t-1}, x_t] + b_f)$$

**Input Gate:** Controls what new information to store
$$i_t = \sigma(W_i \cdot [h_{t-1}, x_t] + b_i)$$

**Candidate Cell State:** New candidate values
$$\tilde{C}_t = \tanh(W_C \cdot [h_{t-1}, x_t] + b_C)$$

**Cell State Update:**
$$C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t$$

**Output Gate:** Controls what to output
$$o_t = \sigma(W_o \cdot [h_{t-1}, x_t] + b_o)$$

**Hidden State:**
$$h_t = o_t \odot \tanh(C_t)$$

Where $\sigma$ is the sigmoid function and $\odot$ is element-wise multiplication.

#### 4.1.2 Gated Recurrent Unit (GRU) Variant

Simplified architecture with fewer gates:

**Update Gate:**
$$z_t = \sigma(W_z \cdot [h_{t-1}, x_t])$$

**Reset Gate:**
$$r_t = \sigma(W_r \cdot [h_{t-1}, x_t])$$

**Candidate Activation:**
$$\tilde{h}_t = \tanh(W \cdot [r_t \odot h_{t-1}, x_t])$$

**Hidden State:**
$$h_t = (1 - z_t) \odot h_{t-1} + z_t \odot \tilde{h}_t$$

### 4.2 Transformer Architecture

#### 4.2.1 Multi-Head Self-Attention

**Scaled Dot-Product Attention:**

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

Where:
- $Q \in \mathbb{R}^{n \times d_k}$: Query matrix
- $K \in \mathbb{R}^{m \times d_k}$: Key matrix
- $V \in \mathbb{R}^{m \times d_v}$: Value matrix
- $\sqrt{d_k}$: Scaling factor

**Multi-Head Attention:**

$$\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, ..., \text{head}_h)W^O$$

Where each head:

$$\text{head}_i = \text{Attention}(QW_i^Q, KW_i^K, VW_i^V)$$

With parameter matrices:
- $W_i^Q \in \mathbb{R}^{d_{\text{model}} \times d_k}$
- $W_i^K \in \mathbb{R}^{d_{\text{model}} \times d_k}$
- $W_i^V \in \mathbb{R}^{d_{\text{model}} \times d_v}$
- $W^O \in \mathbb{R}^{hd_v \times d_{\text{model}}}$

#### 4.2.2 Positional Encoding

Since Transformers have no inherent notion of sequence order:

**Sinusoidal Encoding:**

$$PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)$$

$$PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)$$

**Learned Positional Encoding:**

$$PE = \text{Embedding}(pos)$$

#### 4.2.3 Transformer Encoder Block

$$\text{Input: } X$$
$$X' = \text{LayerNorm}(X + \text{MultiHead}(X, X, X))$$
$$X'' = \text{LayerNorm}(X' + \text{FFN}(X'))$$

Where FFN is a feed-forward network:

$$\text{FFN}(x) = \max(0, xW_1 + b_1)W_2 + b_2$$

### 4.3 Temporal Fusion Transformer (TFT)

#### 4.3.1 Variable Selection Network

For selecting relevant features at each time step:

$$v_{\chi_t} = \text{Softmax}(W_{\chi} \cdot \varsigma_t + b_{\chi})$$

$$\tilde{\xi}_t^{(i)} = v_{\chi_t}^{(i)} \cdot \xi_t^{(i)}$$

Where $\varsigma_t$ is a context vector from static covariates.

#### 4.3.2 Gating Mechanism

$$\text{GatedResidual}(x, y) = \text{LayerNorm}(x + \text{GLU}(y))$$

Where GLU (Gated Linear Unit):

$$\text{GLU}(a, b) = a \odot \sigma(b)$$

#### 4.3.3 Interpretable Multi-Head Attention

$$\text{InterpretableAttention}(Q, K, V) = \tilde{A}VW_V$$

Where $\tilde{A}$ is the averaged attention pattern across heads.

### 4.4 Multi-Horizon Forecasting

#### 4.4.1 Direct Multi-Horizon

Train separate models for each horizon:

$$\hat{y}_{t+h} = f_h(x_t, x_{t-1}, ..., x_{t-p})$$

For $h = 1, ..., H$

#### 4.4.2 Recursive Multi-Horizon

Use previous predictions as inputs:

$$\hat{y}_{t+h} = f(\hat{y}_{t+h-1}, ..., \hat{y}_{t+1}, x_t, ..., x_{t-p})$$

#### 4.4.3 Sequence-to-Sequence

Encoder-Decoder architecture:

$$\text{Encoder: } z = f_{\text{enc}}(x_{t-p:t})$$
$$\text{Decoder: } \hat{y}_{t+1:t+H} = f_{\text{dec}}(z, \text{teacher\_forcing})$$

### 4.5 Quantile Forecasting

#### 4.5.1 Multi-Quantile Output

For quantiles $\tau_1 < \tau_2 < ... < \tau_m$:

$$\hat{y}_t^{(\tau_1)}, ..., \hat{y}_t^{(\tau_m)} = f(x_t, \tau_1, ..., \tau_m)$$

With monotonicity constraint:

$$\hat{y}_t^{(\tau_i)} \leq \hat{y}_t^{(\tau_{i+1})}$$

#### 4.5.2 Loss Function

$$\mathcal{L}_{\text{quantile}} = \frac{1}{n} \sum_{i=1}^{n} \sum_{j=1}^{m} \rho_{\tau_j}(y_i - \hat{y}_i^{(\tau_j)})$$

Where $\rho_\tau$ is the pinball loss.

### 4.6 Weather Feature Integration

#### 4.6.1 Cross-Attention Mechanism

For integrating weather data $W_t$ with price data $P_t$:

$$\text{Price2Weather} = \text{Attention}(Q=P_t, K=W_t, V=W_t)$$
$$\text{Weather2Price} = \text{Attention}(Q=W_t, K=P_t, V=P_t)$$

$$\text{Fused} = \text{Concat}(P_t, \text{Price2Weather}) + \text{Concat}(W_t, \text{Weather2Price})$$

#### 4.6.2 Weather Features

- Temperature: $T_t$ (current, forecast)
- Humidity: $H_t$
- Wind speed: $W_t^{\text{wind}}$
- Solar irradiance: $I_t^{\text{solar}}$
- Precipitation: $R_t$

### 4.7 Complete Energy Price Forecasting Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 ENERGY PRICE FORECASTING ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT LAYERS                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │   Historical Prices │  │   Weather Data      │  │   Calendar Features │ │
│  │   {P_t, P_{t-1},...}│  │   {T_t, H_t, W_t}   │  │   {hour, day, month}│ │
│  │   Shape: (T, d_p)   │  │   Shape: (T, d_w)   │  │   Shape: (T, d_c)   │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│           ↓                      ↓                      ↓                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    EMBEDDING LAYERS                                 │   │
│  │  Price Embedding: e_p = Linear(P_t)                                 │   │
│  │  Weather Embedding: e_w = Linear(W_t)                               │   │
│  │  Calendar Embedding: e_c = Embedding(categorical)                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              TEMPORAL ENCODER (LSTM or Transformer)                 │   │
│  │                                                                     │   │
│  │  Option A: Stacked LSTM                                             │   │
│  │    h_t^1 = LSTM(e_t, h_{t-1}^1)                                    │   │
│  │    h_t^2 = LSTM(h_t^1, h_{t-1}^2)                                  │   │
│  │    z_t = h_t^L                                                      │   │
│  │                                                                     │   │
│  │  Option B: Transformer Encoder                                      │   │
│  │    X' = X + PositionalEncoding                                       │   │
│  │    Z = TransformerEncoder(X', num_layers=L)                         │   │
│  │                                                                     │   │
│  │  Option C: Temporal Fusion Transformer                              │   │
│  │    Variable Selection → LSTM → Multi-Head Attention → FFN           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              WEATHER-PRICE FUSION (Cross-Attention)                 │   │
│  │                                                                     │   │
│  │    Q = W_Q · z_t          (from price encoding)                     │   │
│  │    K = W_K · e_w          (from weather embedding)                  │   │
│  │    V = W_V · e_w                                                    │   │
│  │                                                                     │   │
│  │    Attn = Softmax(QK^T/√d) · V                                      │   │
│  │    fused_t = LayerNorm(z_t + Attn)                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              MULTI-HORIZON DECODER                                  │   │
│  │                                                                     │   │
│  │    For horizon h = 1 to H:                                          │   │
│  │      context = [fused_t, ŷ_{t+1}, ..., ŷ_{t+h-1}]                  │   │
│  │      ŷ_{t+h} = MLP(context)                                        │   │
│  │                                                                     │   │
│  │    Or using Seq2Seq with attention:                                 │   │
│  │      decoder_hidden = Attention(encoder_outputs, decoder_hidden)    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              QUANTILE OUTPUT LAYER                                  │   │
│  │                                                                     │   │
│  │    For each quantile τ ∈ {0.1, 0.5, 0.9}:                          │   │
│  │      ŷ_{t+h}^{(τ)} = Linear(decoder_hidden, num_quantiles)         │   │
│  │                                                                     │   │
│  │    Enforce monotonicity:                                            │   │
│  │      ŷ^{(τ_i)} = ŷ^{(τ_1)} + Σ_{j=2}^i softplus(δ_j)               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  OUTPUT                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Point Forecast: ŷ_{t+1}, ..., ŷ_{t+H}                             │   │
│  │  Prediction Intervals: [ŷ^{(0.05)}, ŷ^{(0.95)}] for each horizon   │   │
│  │  Attention Weights: For interpretability                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.8 Training Considerations

#### 4.8.1 Loss Function

$$\mathcal{L} = \lambda_1 \mathcal{L}_{\text{point}} + \lambda_2 \mathcal{L}_{\text{quantile}} + \lambda_3 \mathcal{L}_{\text{smooth}}$$

Where:
- $\mathcal{L}_{\text{point}} = \frac{1}{H} \sum_{h=1}^{H} (y_{t+h} - \hat{y}_{t+h})^2$
- $\mathcal{L}_{\text{quantile}} = \frac{1}{H} \sum_{h=1}^{H} \sum_{\tau} \rho_\tau(y_{t+h} - \hat{y}_{t+h}^{(\tau)})$
- $\mathcal{L}_{\text{smooth}} = \frac{1}{H-1} \sum_{h=1}^{H-1} (\hat{y}_{t+h+1} - \hat{y}_{t+h})^2$

---

## 5. Gaussian Copulas for Joint Default Probability

### 5.1 Copula Theory Foundation

#### 5.1.1 Sklar's Theorem

For any multivariate distribution $F$ with marginal distributions $F_1, ..., F_d$, there exists a copula $C$ such that:

$$F(x_1, ..., x_d) = C(F_1(x_1), ..., F_d(x_d))$$

If the marginals are continuous, $C$ is unique.

#### 5.1.2 Copula Definition

A copula $C: [0,1]^d \rightarrow [0,1]$ is a multivariate distribution with uniform marginals:

$$C(u_1, ..., u_d) = P(U_1 \leq u_1, ..., U_d \leq u_d)$$

Where $U_i \sim \text{Uniform}(0,1)$.

### 5.2 Gaussian Copula Construction

#### 5.2.1 Definition

The Gaussian copula with correlation matrix $R$:

$$C_R(u_1, ..., u_d) = \Phi_R(\Phi^{-1}(u_1), ..., \Phi^{-1}(u_d))$$

Where:
- $\Phi$ is the standard normal CDF
- $\Phi_R$ is the multivariate normal CDF with correlation matrix $R$

#### 5.2.2 Density Function

$$c_R(u_1, ..., u_d) = \frac{1}{\sqrt{|R|}} \exp\left(-\frac{1}{2} \mathbf{x}^T (R^{-1} - I) \mathbf{x}\right)$$

Where $x_i = \Phi^{-1}(u_i)$.

### 5.3 Correlation Matrix Estimation

#### 5.3.1 Kendall's Tau

For variables $X$ and $Y$:

$$\tau(X, Y) = P((X_1 - X_2)(Y_1 - Y_2) > 0) - P((X_1 - X_2)(Y_1 - Y_2) < 0)$$

Empirical estimator:

$$\hat{\tau} = \frac{2}{n(n-1)} \sum_{1 \leq i < j \leq n} \text{sign}(X_i - X_j) \cdot \text{sign}(Y_i - Y_j)$$

#### 5.3.2 Relationship to Pearson Correlation

For Gaussian copula:

$$\rho = \sin\left(\frac{\pi \tau}{2}\right)$$

#### 5.3.3 Correlation Matrix Estimation Pipeline

```
Algorithm: Gaussian Copula Correlation Estimation
───────────────────────────────────────────────
Input: Default indicator data D ∈ {0,1}^{n×d}
Output: Correlation matrix R

1. Transform to pseudo-observations:
   For each variable j = 1 to d:
      u_ij = (rank(D_ij) - 0.5) / n

2. Apply inverse normal CDF:
   x_ij = Φ^{-1}(u_ij)

3. Compute Kendall's tau for each pair:
   τ_{jk} = KendallTau(x_j, x_k)

4. Convert to Pearson correlation:
   ρ_{jk} = sin(π · τ_{jk} / 2)

5. Assemble correlation matrix R = [ρ_{jk}]

6. Ensure positive definiteness:
   If R is not PD:
      R̃ = R + λI for smallest λ making R̃ PD
      Or use eigenvalue clipping
```

### 5.4 Tail Dependence

#### 5.4.1 Lower Tail Dependence

$$\lambda_L = \lim_{u \to 0^+} \frac{C(u, u)}{u} = \lim_{u \to 0^+} P(U_2 \leq u | U_1 \leq u)$$

For Gaussian copula:

$$\lambda_L = \lambda_U = 0 \quad \text{(for } \rho < 1\text{)}$$

**Limitation:** Gaussian copula has no tail dependence, which may underestimate joint defaults during crises.

#### 5.4.2 t-Copula for Tail Dependence

$$C_{R,\nu}(u_1, ..., u_d) = t_{R,\nu}(t_\nu^{-1}(u_1), ..., t_\nu^{-1}(u_d))$$

Where $t_\nu$ is the t-distribution CDF with $\nu$ degrees of freedom.

Tail dependence coefficient:

$$\lambda_L = 2 \cdot t_{\nu+1}\left(-\sqrt{\frac{(\nu+1)(1-\rho)}{1+\rho}}\right)$$

### 5.5 Joint Default Probability

#### 5.5.1 Single Default Probability

For entity $i$:

$$p_i = P(D_i = 1) = P(X_i \leq x_i^*) = F_i(x_i^*)$$

Where $x_i^*$ is the default threshold.

#### 5.5.2 Joint Default Probability

For entities $i$ and $j$:

$$p_{ij} = P(D_i = 1, D_j = 1) = C(p_i, p_j; \rho_{ij})$$

For $d$ entities:

$$p_{1:d} = C_R(p_1, ..., p_d) = \Phi_R(\Phi^{-1}(p_1), ..., \Phi^{-1}(p_d))$$

#### 5.5.3 Conditional Default Probability

$$P(D_j = 1 | D_i = 1) = \frac{C(p_i, p_j)}{p_i}$$

### 5.6 Application to CMBS/MBS

#### 5.6.1 Spatial Concentration Risk

For properties in geographic regions:

$$R = \begin{bmatrix} 
1 & \rho_{12} & \rho_{13} & \cdots \\
\rho_{21} & 1 & \rho_{23} & \cdots \\
\rho_{31} & \rho_{32} & 1 & \cdots \\
\vdots & \vdots & \vdots & \ddots
\end{bmatrix}$$

Where $\rho_{ij}$ depends on geographic distance:

$$\rho_{ij} = \exp\left(-\frac{d_{ij}}{\delta}\right)$$

#### 5.6.2 Portfolio Loss Distribution

For a portfolio of $n$ loans with exposures $E_i$ and LGDs $\lambda_i$:

$$L = \sum_{i=1}^{n} E_i \cdot \lambda_i \cdot D_i$$

Expected loss:

$$\mathbb{E}[L] = \sum_{i=1}^{n} E_i \cdot \lambda_i \cdot p_i$$

Loss variance:

$$\text{Var}(L) = \sum_{i=1}^{n} \sum_{j=1}^{n} E_i E_j \lambda_i \lambda_j \cdot \text{Cov}(D_i, D_j)$$

Where:

$$\text{Cov}(D_i, D_j) = p_{ij} - p_i p_j$$

### 5.7 Vine Copulas for High Dimensions

#### 5.7.1 Pair-Copula Construction

For $d$-dimensional distributions, use vine structure:

$$c(u_1, ..., u_d) = \prod_{i=1}^{d-1} \prod_{j=1}^{d-i} c_{i,i+j|1,...,i-1}$$

#### 5.7.2 C-Vine and D-Vine Structures

**C-Vine (Canonical):**
$$c(u) = \prod_{j=1}^{d-1} \prod_{i=1}^{d-j} c_{j,j+i|1,...,j-1}$$

**D-Vine (Drawable):**
$$c(u) = \prod_{j=1}^{d-1} \prod_{i=1}^{d-j} c_{i,i+j|i+1,...,i+j-1}$$

---

## 6. Temporal Spatial Graph Neural Networks (ST-GNNs)

### 6.1 Spatio-Temporal Graph Construction

#### 6.1.1 Dynamic Graph Definition

$$\mathcal{G}_t = (\mathcal{V}_t, \mathcal{E}_t, X_t)$$

Where graph structure and features evolve over time.

#### 6.1.2 Temporal Edge Construction

**Time-Decaying Edge Weights:**

$$w_{vu}^{(t)} = w_{vu}^{\text{spatial}} \cdot \exp\left(-\frac{t - t_{\text{last}}}{\tau}\right)$$

### 6.2 Diffusion Convolution

#### 6.2.1 Graph Laplacian

**Combinatorial Laplacian:**

$$L = D - A$$

**Normalized Laplacian:**

$$\tilde{L} = I - D^{-1/2}AD^{-1/2}$$

Where $D$ is the degree matrix.

#### 6.2.2 Chebyshev Polynomial Approximation

$$\Theta *_\mathcal{G} X = \sum_{k=0}^{K} \theta_k T_k(\tilde{L}) X$$

Where:
- $T_k$ are Chebyshev polynomials: $T_0(x) = 1$, $T_1(x) = x$, $T_k(x) = 2xT_{k-1}(x) - T_{k-2}(x)$
- $\tilde{L} = \frac{2}{\lambda_{\max}}L - I$ (scaled to $[-1, 1]$)

#### 6.2.3 Diffusion Convolutional Recurrent Neural Network (DCRNN)

**Diffusion Step:**

$$X_{:,p} *_{\mathcal{G}} f_\theta = \sum_{k=0}^{K-1} \left(\theta_{k,1}(D_O^{-1}W)^k + \theta_{k,2}(D_I^{-1}W^T)^k\right) X_{:,p}$$

Where:
- $D_O$ is out-degree matrix
- $D_I$ is in-degree matrix
- Bidirectional diffusion captures both upstream and downstream effects

### 6.3 Temporal Attention Mechanisms

#### 6.3.1 Graph Attention with Temporal Context

$$\alpha_{vu}^{(t)} = \frac{\exp\left(\text{LeakyReLU}\left(a^T [Wh_v^{(t)} \| Wh_u^{(t)} \| W_\tau(t - t_u)]\right)\right)}{\sum_{k \in \mathcal{N}(v)} \exp(...)}$$

Where $t - t_u$ encodes temporal distance.

#### 6.3.2 Temporal Self-Attention

For sequence of graph states $\{H^{(1)}, ..., H^{(T)}\}$:

$$\text{TemporalAttn}(H^{(t)}) = \sum_{s=1}^{T} \beta_{ts} H^{(s)} W_V$$

Where attention weights:

$$\beta_{ts} = \frac{\exp\left(\frac{(H^{(t)}W_Q)(H^{(s)}W_K)^T}{\sqrt{d_k}}\right)}{\sum_{s'} \exp(...)}$$

### 6.4 ST-GNN Architectures

#### 6.4.1 Spatio-Temporal Graph Convolutional Network (ST-GCN)

$$H^{(t+1)} = \sigma\left(\sum_{k=0}^{K} A^k H^{(t)} W_k^{(s)} + H^{(t-1)} W^{(t)}\right)$$

#### 6.4.2 Graph WaveNet

**Adaptive Adjacency Matrix:**

$$\tilde{A}_{\text{adp}} = \text{Softmax}(\text{ReLU}(E_1 E_2^T))$$

Where $E_1, E_2$ are learnable node embeddings.

**Dilated Causal Convolution for Temporal:**

$$x \star_d f(t) = \sum_{s=0}^{K-1} f(s) \cdot x_{t - d \cdot s}$$

#### 6.4.3 Attention Based Spatial-Temporal Graph Convolutional Network (ASTGCN)

**Spatial Attention:**

$$S = V_s \cdot \sigma((X^{(r-1)} W_1) W_2 (W_3 X^{(r-1)})^T + b_s)$$

**Temporal Attention:**

$$E = V_t \cdot \sigma(((\mathcal{X}_h^{(r-1)})^T U_1) U_2 (U_3 \mathcal{X}_h^{(r-1)}) + b_t)$$

### 6.5 Application to Supply Chain Contagion

#### 6.5.1 Supply Chain Graph

Nodes: Suppliers, manufacturers, distributors, retailers

Edges: Material flows, information flows, financial dependencies

$$\mathcal{G}^{\text{SC}} = (\mathcal{V}^{\text{sup}} \cup \mathcal{V}^{\text{man}} \cup \mathcal{V}^{\text{dis}} \cup \mathcal{V}^{\text{ret}}, \mathcal{E}^{\text{flow}})$$

#### 6.5.2 Disruption Propagation Model

**Node State:**

$$s_v^{(t)} = [\text{inventory}_v^{(t)}, \text{capacity}_v^{(t)}, \text{disruption}_v^{(t)}, \text{demand}_v^{(t)}]$$

**Contagion Dynamics:**

$$s_v^{(t+1)} = f_{\text{ST-GNN}}(s_v^{(t)}, \{s_u^{(t)} : u \in \mathcal{N}(v)\}, \{s_v^{(\tau)} : \tau < t\})$$

---

## 7. Reinforcement Learning for Supply Chain Rerouting

### 7.1 Markov Decision Process Formulation

#### 7.1.1 MDP Definition

The supply chain optimization problem is formulated as:

$$\mathcal{M} = (\mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma)$$

Where:
- $\mathcal{S}$: State space
- $\mathcal{A}$: Action space
- $\mathcal{P}: \mathcal{S} \times \mathcal{A} \times \mathcal{S} \rightarrow [0,1]$: Transition dynamics
- $\mathcal{R}: \mathcal{S} \times \mathcal{A} \rightarrow \mathbb{R}$: Reward function
- $\gamma \in [0,1]$: Discount factor

### 7.2 State Space Design

#### 7.2.1 Node-Level State

For each node $v \in \mathcal{V}$ at time $t$:

$$s_v^{(t)} = [\underbrace{I_v^{(t)}}_{\text{inventory}}, \underbrace{C_v^{(t)}}_{\text{capacity}}, \underbrace{\delta_v^{(t)}}_{\text{disruption}}, \underbrace{D_v^{(t)}}_{\text{demand}}, \underbrace{L_v^{(t)}}_{\text{lead time}}, \underbrace{c_v^{(t)}}_{\text{cost}}]$$

#### 7.2.2 Network-Level State

$$s^{(t)} = \{s_v^{(t)} : v \in \mathcal{V}\} \cup \{f_{uv}^{(t)} : (u,v) \in \mathcal{E}\}$$

Where $f_{uv}^{(t)}$ represents flow on edge $(u,v)$.

#### 7.2.3 State Encoding

$$\phi(s^{(t)}) = \text{GNN}(s^{(t)}, \mathcal{G})$$

### 7.3 Action Space Design

#### 7.3.1 Routing Decisions

$$a_{\text{route}}^{(t)} = \{(u, v, q) : \text{ship } q \text{ units from } u \text{ to } v\}$$

#### 7.3.2 Supplier Selection

$$a_{\text{supplier}}^{(t)} = \{(v, u) : \text{node } v \text{ sources from supplier } u\}$$

#### 7.3.3 Inventory Actions

$$a_{\text{inventory}}^{(t)} = \{(v, o) : \text{node } v \text{ places order } o\}$$

#### 7.3.4 Composite Action Space

$$\mathcal{A}(s) = \mathcal{A}_{\text{route}}(s) \times \mathcal{A}_{\text{supplier}}(s) \times \mathcal{A}_{\text{inventory}}(s)$$

### 7.4 Reward Function Design

#### 7.4.1 Multi-Objective Reward

$$R(s, a) = \lambda_1 R_{\text{cost}} + \lambda_2 R_{\text{service}} + \lambda_3 R_{\text{resilience}}$$

**Cost Component:**

$$R_{\text{cost}} = -\left(\sum_{(u,v)} c_{uv}^{\text{trans}} \cdot f_{uv} + \sum_v c_v^{\text{hold}} \cdot I_v + \sum_v c_v^{\text{short}} \cdot \max(0, D_v - I_v)\right)$$

**Service Level:**

$$R_{\text{service}} = \frac{1}{|\mathcal{V}|} \sum_v \mathbb{1}_{[I_v \geq D_v]}$$

**Resilience Penalty:**

$$R_{\text{resilience}} = -\sum_v \mathbb{1}_{[\delta_v > 0]} \cdot \text{impact}(v)$$

#### 7.4.2 Reward Shaping

Potential-based shaping:

$$F(s, a, s') = \gamma \Phi(s') - \Phi(s)$$

Where $\Phi(s)$ is a potential function (e.g., negative of optimal cost).

### 7.5 Proximal Policy Optimization (PPO)

#### 7.5.1 Policy Gradient Foundation

Objective:

$$J(\theta) = \mathbb{E}_{\pi_\theta}\left[\sum_{t=0}^{T} \gamma^t R(s_t, a_t)\right]$$

Gradient:

$$\nabla_\theta J(\theta) = \mathbb{E}_{\pi_\theta}\left[\nabla_\theta \log \pi_\theta(a|s) \cdot A^{\pi_\theta}(s, a)\right]$$

#### 7.5.2 Clipped Surrogate Objective

$$L^{\text{CLIP}}(\theta) = \mathbb{E}_t\left[\min\left(r_t(\theta) \hat{A}_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon) \hat{A}_t\right)\right]$$

Where:
- $r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{\text{old}}}(a_t|s_t)}$ (probability ratio)
- $\hat{A}_t$ is the advantage estimate
- $\epsilon$ is the clipping parameter (typically 0.1 or 0.2)

#### 7.5.3 Generalized Advantage Estimation (GAE)

$$\hat{A}_t^{\text{GAE}(\gamma, \lambda)} = \sum_{l=0}^{\infty} (\gamma\lambda)^l \delta_{t+l}^{V}$$

Where TD residual:

$$\delta_t^V = r_t + \gamma V(s_{t+1}) - V(s_t)$$

### 7.6 Soft Actor-Critic (SAC)

#### 7.6.1 Maximum Entropy Objective

$$J(\pi) = \sum_{t=0}^{T} \mathbb{E}_{(s_t, a_t) \sim \rho_\pi}\left[r(s_t, a_t) + \alpha \mathcal{H}(\pi(\cdot|s_t))\right]$$

Where $\mathcal{H}$ is the entropy and $\alpha$ is the temperature parameter.

#### 7.6.2 Soft Q-Learning

**Soft Q-function:**

$$Q_{\text{soft}}^\pi(s, a) = r(s, a) + \gamma \mathbb{E}_{s' \sim P}\left[V_{\text{soft}}^\pi(s')\right]$$

**Soft Value Function:**

$$V_{\text{soft}}^\pi(s) = \mathbb{E}_{a \sim \pi}\left[Q_{\text{soft}}^\pi(s, a) - \alpha \log \pi(a|s)\right]$$

#### 7.6.3 Policy Update

$$\pi_{\text{new}} = \arg\min_{\pi'} \mathbb{E}_{s \sim \mathcal{D}}\left[\text{KL}\left(\pi'(\cdot|s) \Big\| \frac{\exp(Q_{\text{soft}}^{\pi_{\text{old}}}(s, \cdot)/\alpha)}{Z^{\pi_{\text{old}}}(s)}\right)\right]$$

### 7.7 Graph Neural Network Policies

#### 7.7.1 GNN-Based Actor

$$\pi_\theta(a|s) = \text{GNN-Policy}(s, \mathcal{G})$$

Architecture:

```
Input: State s, Graph G
↓
Node Embeddings: h_v = GNN_v(s, G)
↓
Edge Embeddings: h_uv = MLP([h_u, h_v, edge_features])
↓
Action Distribution: π(a|s) = Softmax(h_uv) for routing
                     π(a|s) = Gaussian(μ(h_v), σ(h_v)) for continuous
```

#### 7.7.2 GNN-Based Critic

$$V_\phi(s) = \text{GNN-Value}(s, \mathcal{G})$$

Architecture:

```
Input: State s, Graph G
↓
Graph Embedding: z = GlobalMeanPool(GNN(s, G))
↓
Value Estimate: V(s) = MLP(z)
```

### 7.8 Complete RL Pipeline for Supply Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              REINFORCEMENT LEARNING FOR SUPPLY CHAIN REROUTING              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ENVIRONMENT                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Supply Chain Network G = (V, E)                                    │   │
│  │  - Nodes: Suppliers, Plants, Warehouses, Customers                  │   │
│  │  - Edges: Transportation links with capacities and costs            │   │
│  │  - External: Demand forecasts, Disruption events                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  STATE ENCODING                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  s_t = {inventory_v, capacity_v, disruption_v, demand_v, ...}      │   │
│  │                                                                     │   │
│  │  Graph Encoding:                                                    │   │
│  │    h_v^(0) = MLP(s_v)                                              │   │
│  │    h_v^(l+1) = UPDATE(h_v^(l), AGGREGATE({h_u^(l): u ∈ N(v)}))     │   │
│  │    z_t = GlobalMeanPool({h_v^(L)})                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  POLICY NETWORK (Actor)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Input: z_t (graph embedding)                                       │   │
│  │                                                                     │   │
│  │  Routing Head:                                                      │   │
│  │    logits_route = MLP_route([h_u, h_v, edge_feat])                 │   │
│  │    π_route = Softmax(logits_route)                                 │   │
│  │                                                                     │   │
│  │  Supplier Head:                                                     │   │
│  │    logits_supp = MLP_supp([h_v, h_u for u in suppliers])           │   │
│  │    π_supp = Softmax(logits_supp)                                   │   │
│  │                                                                     │   │
│  │  Inventory Head:                                                    │   │
│  │    μ_inv, σ_inv = MLP_inv(h_v)                                     │   │
│  │    π_inv = Gaussian(μ_inv, σ_inv)                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  VALUE NETWORK (Critic)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  V(s_t) = MLP_value(z_t)                                           │   │
│  │                                                                     │   │
│  │  Q(s_t, a_t) = MLP_Q([z_t, a_t_encoded])                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  PPO/SAC UPDATE                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PPO:                                                               │   │
│  │    L_CLIP(θ) = E[min(r_t(θ)Â_t, clip(r_t, 1-ε, 1+ε)Â_t)]           │   │
│  │    L_VF(φ) = E[(V(s_t) - R_t)^2]                                   │   │
│  │    L_ENT = -E[H(π(·|s_t))]                                         │   │
│  │                                                                     │   │
│  │  SAC:                                                               │   │
│  │    L_Q(θ) = E[(Q(s,a) - (r + γV(s')))^2]                           │   │
│  │    L_π(φ) = E[αlogπ(a|s) - Q(s,a)]                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ACTION EXECUTION                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Sample a_t ~ π(·|s_t)                                             │   │
│  │  Execute in environment                                             │   │
│  │  Observe r_t, s_{t+1}                                              │   │
│  │  Store (s_t, a_t, r_t, s_{t+1}) in replay buffer                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. FinBERT for Transition Sentiment Analysis

### 8.1 BERT Architecture Foundation

#### 8.1.1 Transformer Encoder

BERT uses the Transformer encoder architecture:

$$\text{Encoder}(X) = \text{LayerNorm}(X + \text{FFN}(\text{LayerNorm}(X + \text{MultiHead}(X, X, X))))$$

#### 8.1.2 Input Representation

For input token sequence $\{w_1, ..., w_n\}$:

$$E_{w_i} = \text{TokenEmbedding}(w_i) + \text{SegmentEmbedding}(s_i) + \text{PositionEmbedding}(i)$$

Where $s_i \in \{0, 1\}$ indicates sentence A or B.

### 8.2 FinBERT Fine-Tuning

#### 8.2.1 Domain Adaptation

Pre-training on financial corpus:

$$\mathcal{L}_{\text{MLM}} = -\mathbb{E}_{x \sim \mathcal{D}_{\text{fin}}} \log P(x_{\text{mask}} | x_{\text{context}})$$

$$\mathcal{L}_{\text{NSP}} = -\mathbb{E}_{x \sim \mathcal{D}_{\text{fin}}} \log P(\text{is\_next} | x_1, x_2)$$

#### 8.2.2 Climate Sentiment Classification

Task-specific fine-tuning:

$$\mathcal{L}_{\text{sentiment}} = -\sum_{i=1}^{n} \sum_{c=1}^{C} y_{i,c} \log \hat{y}_{i,c}$$

Where:
- $C = 3$ (negative, neutral, positive)
- $\hat{y}_i = \text{Softmax}(W \cdot \text{BERT}_{\text{[CLS]}} + b)$

### 8.3 Token Classification for Risk Mentits

#### 8.3.1 Named Entity Recognition (NER)

For extracting climate risk entities:

$$\mathcal{L}_{\text{NER}} = -\sum_{i=1}^{n} \sum_{j=1}^{L} \log P(y_{i,j} | x_i)$$

Where $y_{i,j} \in \{\text{B-RISK}, \text{I-RISK}, \text{O}, ...\}$.

#### 8.3.2 Entity Types

- **Physical risks:** flood, hurricane, drought, wildfire
- **Transition risks:** regulation, carbon price, technology shift
- **Liability risks:** litigation, disclosure requirements

### 8.4 Sentiment Score Aggregation

#### 8.4.1 Document-Level Sentiment

$$\text{Sentiment}_{\text{doc}} = \frac{1}{n} \sum_{i=1}^{n} \text{score}(s_i)$$

Where $s_i$ are sentences and score maps to $[-1, 1]$.

#### 8.4.2 Entity-Level Sentiment

For entity $e$ mentioned in contexts $\mathcal{C}_e$:

$$\text{Sentiment}_e = \frac{1}{|\mathcal{C}_e|} \sum_{c \in \mathcal{C}_e} \text{score}(c) \cdot \text{attention}(e, c)$$

### 8.5 Integration with Credit Spread Forecasting

#### 8.5.1 Feature Engineering

$$x_t^{\text{sentiment}} = [\text{Sentiment}_t, \text{Sentiment}_{t-1}, ..., \text{Sentiment}_{t-p}]$$

#### 8.5.2 Combined Model

$$\Delta \text{CreditSpread}_t = f(x_t^{\text{financial}}, x_t^{\text{sentiment}})$$

Where $f$ can be a neural network or gradient boosting model.

---

## 9. Integrated Pipeline Architecture

### 9.1 End-to-End System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           MULTI-SECTOR ASSET VALUATION ENGINE - INTEGRATED PIPELINE         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      DATA INGESTION LAYER                           │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ Real Estate │ │   Energy    │ │  Financial  │ │Supply Chain │   │   │
│  │  │   Data      │ │   Data      │ │ Instruments │ │    Data     │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    FEATURE ENGINEERING LAYER                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  Spatial    │ │  Temporal   │ │   Copula    │ │   Graph     │   │   │
│  │  │  Features   │ │  Features   │ │   Features  │ │   Features  │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      MODEL LAYER                                    │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  REAL ESTATE MODULE                                         │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │   │
│  │  │  │ Spatial GNN │  │  XGBoost    │  │ Conformal Predictor │ │   │   │
│  │  │  │   (GAT)     │  │  (LightGBM) │  │   (Split Conf.)     │ │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  ENERGY MODULE                                              │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │   │
│  │  │  │  LSTM/GRU   │  │ Transformer │  │  Temporal Fusion    │ │   │   │
│  │  │  │             │  │   (TFT)     │  │     (TFT)           │ │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  FINANCIAL INSTRUMENTS MODULE                               │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │   │
│  │  │  │   Gaussian  │  │     t-      │  │      FinBERT        │ │   │   │
│  │  │  │   Copula    │  │   Copula    │  │  (Sentiment NLP)    │ │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  SUPPLY CHAIN MODULE                                        │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │   │
│  │  │  │   ST-GNN    │  │    PPO      │  │       SAC           │ │   │   │
│  │  │  │(Spatio-Temp)│  │    (RL)     │  │      (RL)           │ │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              UNCERTAINTY QUANTIFICATION LAYER                       │   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │   Split     │  │ Jackknife+  │  │     CV+     │  │  Adaptive  │ │   │
│  │  │  Conformal  │  │             │  │             │  │ Conformal  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  │                                                                     │   │
│  │  Coverage Guarantee: P(Y ∈ C(X)) ≥ 1 - α                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      OUTPUT LAYER                                   │   │
│  │                                                                     │   │
│  │  For each asset:                                                    │   │
│  │    - Point estimate: ŷ                                              │   │
│  │    - Confidence interval: [ŷ_L, ŷ_U]                               │   │
│  │    - Prediction set (classification): C(x)                         │   │
│  │    - SHAP explanations                                              │   │
│  │    - Model uncertainty: σ̂                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Model Selection Decision Tree

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODEL SELECTION GUIDE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Data Characteristics → Recommended Model                                   │
│  ─────────────────────────────────────────                                  │
│                                                                             │
│  SPATIAL RELATIONSHIPS (Real Estate, Geospatial)                            │
│  ├── Graph structure available?                                             │
│  │   ├── YES → GNN (GraphSAGE/GAT)                                         │
│  │   │       └── Large graphs? → Cluster-GCN, GraphSAINT                   │
│  │   └── NO → Build KNN graph first                                        │
│  └── Spatial autocorrelation high?                                          │
│      └── YES → Add spatial regularization                                   │
│                                                                             │
│  TABULAR DATA (Mass Appraisal, Structured Features)                         │
│  ├── Large dataset (>100K samples)?                                         │
│  │   ├── YES → LightGBM (faster training)                                  │
│  │   └── NO → XGBoost (more robust)                                        │
│  └── Need uncertainty quantification?                                       │
│      └── YES → Quantile regression + Conformal                              │
│                                                                             │
│  TIME SERIES (Energy Prices, Financial Series)                              │
│  ├── Long sequences (>1000 timesteps)?                                      │
│  │   ├── YES → Transformer (TFT, Informer)                                 │
│  │   └── NO → LSTM/GRU                                                     │
│  ├── Multiple correlated series?                                            │
│  │   └── YES → Multi-variate LSTM/Transformer                              │
│  └── Need interpretability?                                                 │
│      └── YES → TFT (variable selection)                                     │
│                                                                             │
│  SPATIO-TEMPORAL (Supply Chain, Traffic)                                    │
│  ├── Both spatial and temporal dependencies?                                │
│  │   └── YES → ST-GNN (DCRNN, Graph WaveNet)                               │
│  └── Dynamic graph structure?                                               │
│      └── YES → EvolveGCN, DySAT                                             │
│                                                                             │
│  DEPENDENCE MODELING (Default Correlation)                                  │
│  ├── Tail dependence important?                                             │
│  │   ├── YES → t-Copula, Archimedean Copula                                │
│  │   └── NO → Gaussian Copula                                              │
│  └── High dimension (>50 variables)?                                        │
│      └── YES → Vine Copula (C-Vine, D-Vine)                                 │
│                                                                             │
│  SEQUENTIAL DECISIONS (Supply Chain Optimization)                           │
│  ├── Discrete action space?                                                 │
│  │   ├── YES → PPO (stable, sample efficient)                              │
│  │   └── NO → SAC (continuous, maximum entropy)                            │
│  └── Need graph structure in policy?                                        │
│      └── YES → GNN-based Actor-Critic                                       │
│                                                                             │
│  TEXT/SENTIMENT (Climate Risk, ESG)                                         │
│  ├── Financial domain specific?                                             │
│  │   └── YES → FinBERT (pre-trained on financial corpus)                   │
│  └── Need entity extraction?                                                │
│      └── YES → Token classification (NER)                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Implementation Considerations

### 10.1 Computational Complexity

| Model | Training | Inference | Memory |
|-------|----------|-----------|--------|
| GCN | $O(L \cdot |E| \cdot d)$ | $O(L \cdot |E| \cdot d)$ | $O(|V| \cdot d)$ |
| GAT | $O(L \cdot |V| \cdot k \cdot d^2)$ | $O(L \cdot |V| \cdot k \cdot d)$ | $O(|V| \cdot k)$ |
| XGBoost | $O(K \cdot n \cdot d \cdot \log n)$ | $O(K \cdot T)$ | $O(K \cdot T)$ |
| LSTM | $O(T \cdot d^2)$ | $O(T \cdot d^2)$ | $O(d)$ |
| Transformer | $O(T^2 \cdot d)$ | $O(T^2 \cdot d)$ | $O(T^2)$ |
| Copula | $O(d^3)$ | $O(d^2)$ | $O(d^2)$ |

Where: $L$ = layers, $|E|$ = edges, $|V|$ = nodes, $d$ = dimensions, $K$ = trees, $T$ = timesteps

### 10.2 Hyperparameter Guidelines

| Model | Key Hyperparameters | Typical Range |
|-------|---------------------|---------------|
| GNN | Learning rate | $10^{-4}$ to $10^{-2}$ |
| | Hidden dim | 64 to 512 |
| | Layers | 2 to 4 |
| | Dropout | 0.1 to 0.5 |
| XGBoost | max_depth | 3 to 10 |
| | learning_rate | 0.01 to 0.3 |
| | n_estimators | 100 to 1000 |
| | min_child_weight | 1 to 10 |
| LSTM | Hidden units | 32 to 256 |
| | Layers | 1 to 3 |
| | Dropout | 0.2 to 0.5 |
| Transformer | d_model | 128 to 512 |
| | num_heads | 4 to 16 |
| | num_layers | 2 to 6 |

---

## 11. Conclusion

This comprehensive ML architecture provides a robust framework for multi-sector asset valuation, integrating cutting-edge techniques across:

1. **Graph Neural Networks** for spatial modeling in real estate
2. **Gradient Boosting** for efficient mass appraisal
3. **Conformal Prediction** for rigorous uncertainty quantification
4. **Transformers/LSTMs** for time series forecasting in energy markets
5. **Gaussian Copulas** for joint default probability estimation
6. **Spatio-Temporal GNNs** for dynamic supply chain modeling
7. **Reinforcement Learning** for adaptive supply chain optimization
8. **FinBERT** for climate sentiment analysis

The architecture emphasizes:
- **Mathematical rigor** with formal definitions and proofs
- **Uncertainty quantification** through conformal methods
- **Explainability** via SHAP values and attention mechanisms
- **Scalability** through efficient implementations
- **Integration** across heterogeneous asset classes

---

## References

1. Kipf, T. N., & Welling, M. (2016). Semi-supervised classification with graph convolutional networks. ICLR.

2. Hamilton, W. L., Ying, R., & Leskovec, J. (2017). Inductive representation learning on large graphs. NeurIPS.

3. Veličković, P., et al. (2018). Graph attention networks. ICLR.

4. Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. KDD.

5. Ke, G., et al. (2017). LightGBM: A highly efficient gradient boosting decision tree. NeurIPS.

6. Shafer, G., & Vovk, V. (2008). A tutorial on conformal prediction. JMLR.

7. Angelopoulos, A. N., & Bates, S. (2021). A gentle introduction to conformal prediction. arXiv.

8. Vaswani, A., et al. (2017). Attention is all you need. NeurIPS.

9. Lim, B., et al. (2021). Temporal fusion transformers for interpretable multi-horizon time series forecasting. IJAF.

10. Nelsen, R. B. (2006). An introduction to copulas. Springer.

11. Schulman, J., et al. (2017). Proximal policy optimization algorithms. arXiv.

12. Haarnoja, T., et al. (2018). Soft actor-critic: Off-policy maximum entropy deep RL. ICML.

13. Araci, D. (2019). FinBERT: Financial sentiment analysis with pre-trained language models.

---

*Document Version: 1.0*
*Last Updated: 2024*
*Author: ML Architecture Team, AA Impact Inc.*
