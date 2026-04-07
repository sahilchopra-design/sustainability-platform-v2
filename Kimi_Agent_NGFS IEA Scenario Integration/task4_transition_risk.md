# Task 4: Transition Risk Overlay - DCF Impairment and Stranded Asset Modeling

## Comprehensive Quantitative Framework for Climate Transition Risk Assessment

---

## Executive Summary

This document presents a rigorous mathematical framework for quantifying transition risk impacts on asset valuations through DCF impairment analysis and stranded asset modeling. The framework integrates NGFS carbon price scenarios, sectoral elasticity estimation, technological displacement dynamics, and policy mandate impacts to provide a complete transition risk overlay for financial risk management.

---

## 1. Carbon Pricing Trajectory Models

### 1.1 NGFS Carbon Price Scenario Framework

The Network for Greening the Financial System (NGFS) provides three primary carbon price scenarios that form the foundation of transition risk modeling:

#### 1.1.1 Current Policies (CP) Scenario

Under current policy commitments, carbon prices follow a gradual escalation path:

$$P_t^{CP} = P_0^{CP} \cdot e^{g^{CP} \cdot t} \cdot \left(1 + \alpha^{CP} \cdot \sin\left(\frac{2\pi t}{T_{cycle}}\right)\right)$$

Where:
- $P_0^{CP}$: Initial carbon price (USD/tCO₂e)
- $g^{CP}$: Annual growth rate under CP (~3-5%)
- $\alpha^{CP}$: Cyclical amplitude factor (~0.1)
- $T_{cycle}$: Policy cycle period (typically 4-5 years)

**Numerical Example (Global Average):**
```
P_0^CP = $25/tCO₂e (2024)
g^CP = 0.04 (4% annual growth)
α^CP = 0.12
T_cycle = 5 years

P_5^CP = 25 × e^(0.04×5) × (1 + 0.12×sin(2π))
       = 25 × 1.2214 × 1.00
       = $30.54/tCO₂e (2029)

P_10^CP = 25 × e^(0.04×10) × (1 + 0.12×sin(4π))
        = 25 × 1.4918 × 1.00
        = $37.30/tCO₂e (2034)

P_30^CP = 25 × e^(0.04×30) × (1 + 0.12×sin(12π))
        = 25 × 3.3201 × 1.00
        = $83.00/tCO₂e (2054)
```

#### 1.1.2 Net Zero 2050 (NZ) Scenario

The Net Zero pathway requires steep carbon price escalation to achieve emissions targets:

$$P_t^{NZ} = P_0^{NZ} \cdot e^{g_t^{NZ} \cdot t} \cdot \mathbb{1}_{t \leq T_{netzero}}$$

Where the time-varying growth rate follows:

$$g_t^{NZ} = g_0^{NZ} + \beta^{NZ} \cdot t + \gamma^{NZ} \cdot \ln\left(\frac{E_t^{target}}{E_t^{actual}}\right)$$

With:
- $g_0^{NZ}$: Initial growth rate (~8-12%)
- $\beta^{NZ}$: Acceleration parameter (~0.002)
- $\gamma^{NZ}$: Emissions gap sensitivity (~0.15)
- $T_{netzero}$: Net zero target year (2050)

**Numerical Example (Net Zero 2050):**
```
P_0^NZ = $50/tCO₂e (2024)
g_0^NZ = 0.10 (10% initial growth)
β^NZ = 0.002
γ^NZ = 0.15

Year-by-year projection:
P_2025^NZ = 50 × e^(0.10×1) = $55.26/tCO₂e
P_2030^NZ = 50 × e^(0.115×6) = $100.43/tCO₂e
P_2040^NZ = 50 × e^(0.135×16) = $442.38/tCO₂e
P_2050^NZ = 50 × e^(0.155×26) = $2,945.67/tCO₂e
```

#### 1.1.3 Delayed Transition (DT) Scenario

Delayed action results in a sudden price jump when policy is eventually implemented:

$$P_t^{DT} = \begin{cases}
P_0^{DT} \cdot e^{g^{DT} \cdot t} & \text{if } t < T_{delay} \\
P_{T_{delay}}^{DT} \cdot (1 + J) \cdot e^{g^{post} \cdot (t - T_{delay})} & \text{if } t \geq T_{delay}
\end{cases}$$

Where:
- $T_{delay}$: Year of policy implementation delay
- $J$: Jump factor representing policy shock (~2-4x)
- $g^{post}$: Post-delay growth rate (~15-20%)

**Numerical Example (Delayed Transition):**
```
P_0^DT = $20/tCO₂e (2024)
g^DT = 0.03 (3% pre-delay growth)
T_delay = 2035 (11 years)
J = 3.0 (300% jump)
g^post = 0.18 (18% post-delay growth)

Pre-delay (2024-2035):
P_2030^DT = 20 × e^(0.03×6) = $23.94/tCO₂e
P_2035^DT = 20 × e^(0.03×11) = $27.81/tCO₂e

Post-jump (2035):
P_2035+^DT = 27.81 × (1 + 3.0) = $111.24/tCO₂e

Post-delay trajectory:
P_2040^DT = 111.24 × e^(0.18×5) = $271.82/tCO₂e
P_2050^DT = 111.24 × e^(0.18×15) = $1,818.31/tCO₂e
```

### 1.2 Regional Carbon Price Differential Model

Carbon prices vary significantly across jurisdictions:

$$P_t^{region} = P_t^{global} \cdot \left(1 + \delta^{region}\right) \cdot e^{\sigma^{region} \cdot W_t}$$

Where:
- $\delta^{region}$: Regional price differential factor
- $\sigma^{region}$: Regional volatility parameter
- $W_t$: Standard Brownian motion

**Regional Differential Parameters:**

| Region | $\delta^{region}$ | $\sigma^{region}$ | Current Price (2024) |
|--------|-------------------|-------------------|---------------------|
| EU ETS | +0.45 | 0.25 | €85/tCO₂e |
| UK ETS | +0.40 | 0.28 | £75/tCO₂e |
| California | +0.15 | 0.22 | $35/tCO₂e |
| RGGI | -0.20 | 0.18 | $15/tCO₂e |
| China ETS | -0.35 | 0.30 | ¥65/tCO₂e |
| Emerging Markets | -0.50 | 0.35 | $10-15/tCO₂e |

### 1.3 Carbon Border Adjustment Mechanism (CBAM) Impact

The EU CBAM creates additional cost layers:

$$P_t^{CBAM} = P_t^{EU} \cdot \left(1 - \frac{P_t^{origin}}{P_t^{EU}}\right) \cdot \mathbb{1}_{P_t^{origin} < P_t^{EU}} \cdot Coverage_t$$

Where:
- $P_t^{origin}$: Carbon price in origin country
- $Coverage_t$: CBAM coverage rate (phasing in 2026-2034)

**CBAM Phase-in Schedule:**
```
2026: Coverage = 2.5% (reporting only)
2027: Coverage = 25%
2028: Coverage = 50%
2029: Coverage = 75%
2030: Coverage = 100%
```

**CBAM Cost Example (Steel Import):**
```
EU Carbon Price: €100/tCO₂e
Origin Price (China): ¥65/tCO₂e ≈ €8.50/tCO₂e
Carbon Intensity (Steel): 1.9 tCO₂/t steel
Import Volume: 10,000 tonnes

CBAM per tonne = (100 - 8.50) × 1.9 × Coverage
2027: CBAM = €91.50 × 1.9 × 0.25 = €43.46/t steel
2028: CBAM = €91.50 × 1.9 × 0.50 = €86.93/t steel
2030: CBAM = €91.50 × 1.9 × 1.00 = €173.85/t steel

Total CBAM cost (10,000t):
2027: €434,600
2028: €869,300
2030: €1,738,500
```

### 1.4 Shadow Carbon Pricing for Internal Decisions

Organizations use internal shadow prices for capital allocation:

$$P_t^{shadow} = E[P_t^{policy}] + \lambda \cdot \sigma[P_t^{policy}] + \pi \cdot RiskPremium$$

Where:
- $\lambda$: Risk aversion parameter (typically 1.5-2.5)
- $\pi$: Probability of accelerated policy
- $RiskPremium$: Additional premium for uncertainty

**Shadow Price Example (Conservative Corporate):**
```
Expected 2030 Carbon Price: $75/tCO₂e
Price Volatility (σ): $25/tCO₂e
Risk Aversion (λ): 2.0
Probability of Acceleration (π): 0.30
Risk Premium: $50/tCO₂e

P_shadow = 75 + 2.0 × 25 + 0.30 × 50
         = 75 + 50 + 15
         = $140/tCO₂e (internal decision price)
```

---

## 2. Carbon Price Elasticity Estimation

### 2.1 Sectoral Emission Intensity Framework

Sectoral carbon intensity determines elasticity:

$$\epsilon_{sector} = \frac{\partial (Cost/Revenue)}{\partial P^{carbon}} = \frac{EI_{sector} \cdot Output}{Revenue} = \frac{EI_{sector}}{Price_{output}}$$

Where $EI_{sector}$ is emission intensity (tCO₂e per unit output).

**Sectoral Emission Intensities and Elasticities:**

| Sector | Emission Intensity (tCO₂e/$k revenue) | Elasticity ($\epsilon$) | Abatement Potential |
|--------|--------------------------------------|-------------------------|---------------------|
| Coal Mining | 2.50 | 2.50 | Low |
| Oil & Gas Extraction | 0.85 | 0.85 | Medium |
| Power Generation (Coal) | 3.20 | 3.20 | High |
| Power Generation (Gas) | 1.10 | 1.10 | High |
| Steel Production | 1.80 | 1.80 | Medium-High |
| Cement | 2.10 | 2.10 | Medium |
| Aluminum | 1.40 | 1.40 | High |
| Chemicals | 0.65 | 0.65 | Medium |
| Aviation | 0.95 | 0.95 | Low |
| Shipping | 0.70 | 0.70 | Medium |
| Automotive (ICE) | 0.45 | 0.45 | High |
| Real Estate | 0.25 | 0.25 | High |
| Agriculture | 0.55 | 0.55 | Medium |

### 2.2 Pass-Through Rate Analysis

The ability to pass carbon costs to consumers:

$$PTR_{sector} = \frac{\Delta P_{output}}{\Delta Cost_{carbon}} = \frac{\eta_D}{\eta_D - \eta_S} \cdot MarketPower_{sector}$$

Where:
- $\eta_D$: Price elasticity of demand
- $\eta_S$: Price elasticity of supply
- $MarketPower_{sector}$: Market concentration index (HHI/10000)

**Pass-Through Rate by Sector:**

| Sector | Demand Elasticity ($\eta_D$) | Supply Elasticity ($\eta_S$) | Market Power | PTR |
|--------|----------------------------|----------------------------|--------------|-----|
| Utilities | -0.3 | 0.8 | 0.75 | 0.85 |
| Steel | -0.6 | 0.5 | 0.60 | 0.55 |
| Cement | -0.4 | 0.3 | 0.70 | 0.75 |
| Aviation | -0.8 | 1.2 | 0.45 | 0.40 |
| Chemicals | -0.7 | 0.9 | 0.55 | 0.50 |

**Numerical Example (Cement Sector):**
```
Carbon Price Increase: $50/tCO₂e
Emission Intensity: 2.1 tCO₂/t cement
Cost Increase: $50 × 2.1 = $105/t cement
Current Price: $120/t cement
Pass-Through Rate: 0.75

Price Increase Passed: $105 × 0.75 = $78.75/t
New Price: $120 + $78.75 = $198.75/t
Price Increase %: 65.6%

Consumer Burden: $78.75/t
Producer Burden: $26.25/t
```

### 2.3 Marginal Abatement Cost (MAC) Curves

The MAC curve represents abatement opportunities ranked by cost:

$$MAC(q) = \min_{i} \left\{ C_i^{abate} : \sum_{j=1}^{i} q_j^{abate} \geq q \right\}$$

Where:
- $q$: Cumulative abatement quantity
- $C_i^{abate}$: Cost of abatement option $i$
- $q_j^{abate}$: Abatement potential of option $j$

**MAC Curve for Power Sector (Example):**

| Abatement Option | Abatement Potential (MtCO₂) | Cost ($/tCO₂) | Cumulative |
|-----------------|---------------------------|---------------|------------|
| LED lighting | 50 | -$30 | 50 |
| Building insulation | 80 | -$15 | 130 |
| Industrial efficiency | 120 | $5 | 250 |
| Wind (onshore) | 200 | $10 | 450 |
| Solar PV | 300 | $15 | 750 |
| Wind (offshore) | 150 | $35 | 900 |
| CCS (power) | 100 | $60 | 1000 |
| Green hydrogen | 80 | $120 | 1080 |
| Direct air capture | 50 | $400 | 1130 |

**MAC Curve Integration:**

Total abatement at carbon price $P$:

$$Q^{abate}(P) = \int_0^{\bar{q}} \mathbb{1}_{MAC(q) \leq P} \, dq$$

**Example Calculation:**
```
Carbon Price: $50/tCO₂e

Abatement achieved:
- LED lighting: 50 MtCO₂ (cost: -$30 < $50)
- Building insulation: 80 MtCO₂ (cost: -$15 < $50)
- Industrial efficiency: 120 MtCO₂ (cost: $5 < $50)
- Wind onshore: 200 MtCO₂ (cost: $10 < $50)
- Solar PV: 300 MtCO₂ (cost: $15 < $50)
- Wind offshore: 150 MtCO₂ (cost: $35 < $50)
- CCS power: 100 MtCO₂ (cost: $60 > $50) → NOT included

Total Abatement: 50 + 80 + 120 + 200 + 300 + 150 = 900 MtCO₂
```

### 2.4 Technological Change Effects on MAC Curves

Learning curves shift MAC curves over time:

$$MAC_t(q) = MAC_0(q) \cdot \left(\frac{Q_t^{cumulative}}{Q_0^{cumulative}}\right)^{-b(q)}$$

Where:
- $b(q)$: Learning rate for abatement option $q$
- $Q_t^{cumulative}$: Cumulative deployment by time $t$

**Learning Rates by Technology:**

| Technology | Learning Rate (b) | Cost Reduction per Doubling |
|------------|------------------|----------------------------|
| Solar PV | 0.35 | 22% |
| Wind (onshore) | 0.18 | 12% |
| Wind (offshore) | 0.12 | 8% |
| Battery Storage | 0.28 | 18% |
| Electrolyzers | 0.22 | 15% |
| CCS | 0.08 | 5% |

**MAC Curve Shift Example (Solar PV):**
```
Initial Cost (2020): $30/tCO₂ avoided
Cumulative Deployment (2020): 500 GW
Learning Rate: 0.35

Projected Cost (2030):
Cumulative Deployment (2030): 3,500 GW
Doublings: log₂(3500/500) = log₂(7) ≈ 2.81

Cost Reduction Factor: 7^(-0.35) = 0.52
Cost (2030): $30 × 0.52 = $15.60/tCO₂ avoided

Cost Reduction: 48% over decade
```

### 2.5 Demand Elasticity for Carbon-Intensive Goods

Cross-price elasticity between conventional and low-carbon alternatives:

$$\eta_{XY} = \frac{\partial Q_X / Q_X}{\partial P_Y / P_Y}$$

**Demand Elasticity Matrix:**

| Good | Own-Price Elasticity | Cross-Elasticity (Green Alt) | Income Elasticity |
|------|---------------------|------------------------------|-------------------|
| Gasoline | -0.7 | +0.4 | +0.3 |
| Coal Power | -0.5 | +0.6 | +0.2 |
| Natural Gas | -0.6 | +0.5 | +0.4 |
| Air Travel | -0.9 | +0.3 | +1.2 |
| Beef | -0.8 | +0.2 | +0.6 |

---

## 3. DCF Impairment from Transition Risk

### 3.1 Revenue Impact Model

Transition risk affects revenues through demand shifts and price changes:

$$\Delta Rev_t = Rev_t \cdot \left[\epsilon_{demand} \cdot \Delta Policy_t + \eta_{substitution} \cdot \Delta MarketShare_t^{green}\right]$$

Where:
- $\epsilon_{demand}$: Demand elasticity to carbon intensity
- $\Delta Policy_t$: Policy stringency change index
- $\eta_{substitution}$: Substitution elasticity
- $\Delta MarketShare_t^{green}$: Green alternative market share change

**Policy Stringency Index:**

$$\Delta Policy_t = \sum_{i} w_i \cdot \frac{Policy_{i,t} - Policy_{i,0}}{Policy_{i,0}}$$

Where $w_i$ are policy weights summing to 1.

**Revenue Impact Example (Coal Power Plant):**
```
Baseline Revenue (2024): $500 million
Demand Elasticity (ε): -0.5
Policy Stringency Change: +0.40 (40% increase)
Substitution Elasticity (η): 0.6
Green Market Share Change: +0.15 (15 percentage points)

ΔRev = 500 × [-0.5 × 0.40 + 0.6 × 0.15]
     = 500 × [-0.20 + 0.09]
     = 500 × [-0.11]
     = -$55 million

Adjusted Revenue: $500 - $55 = $445 million (-11%)
```

### 3.2 Cost Impact Model

Carbon pricing directly increases operating costs:

$$\Delta Cost_t^{carbon} = Emissions_t \cdot P_t^{carbon} \cdot (1 - Abatement_t) \cdot (1 - PassThrough_t)$$

Where:
- $Abatement_t$: Fraction of emissions abated
- $PassThrough_t$: Fraction of costs passed to customers

**Cost Impact Example (Steel Mill):**
```
Annual Emissions: 2.5 MtCO₂e
Carbon Price: $75/tCO₂e
Abatement Rate: 15%
Pass-Through Rate: 55%

Gross Carbon Cost: 2.5M × $75 = $187.5 million
Net Carbon Cost: $187.5M × (1 - 0.15) × (1 - 0.55)
                = $187.5M × 0.85 × 0.45
                = $71.72 million

As % of EBITDA (assuming $200M): 35.9%
```

### 3.3 Adjusted Cash Flow Model

The complete cash flow adjustment:

$$CF_t^{adjusted} = (Rev_t + \Delta Rev_t) - (OpEx_t + \Delta Cost_t^{carbon} + \Delta Cost_t^{abatement}) - CapEx_t^{transition} - \Delta WC_t$$

Where:
- $\Delta Cost_t^{abatement}$: Abatement technology costs
- $CapEx_t^{transition}$: Transition capital expenditures
- $\Delta WC_t$: Working capital changes

**Abatement Cost Component:**

$$\Delta Cost_t^{abatement} = \sum_{i} CapEx_i^{abate} \cdot CRF_i + OpEx_i^{abate}$$

Where $CRF_i$ is the capital recovery factor:

$$CRF_i = \frac{r(1+r)^{n_i}}{(1+r)^{n_i} - 1}$$

**Full DCF Example (Coal Power Plant - 10 Year Projection):**

```
Baseline Parameters:
- Capacity: 500 MW
- Capacity Factor: 60%
- Electricity Price: $50/MWh
- Variable Cost: $25/MWh
- Fixed Cost: $20 million/year
- Emission Factor: 0.9 tCO₂/MWh
- Current Carbon Price: $30/tCO₂e
- WACC: 8%

Year 1 (2024):
Revenue: 500 × 8760 × 0.60 × $50 = $131.4M
Variable Cost: 500 × 8760 × 0.60 × $25 = $65.7M
Carbon Cost: 500 × 8760 × 0.60 × 0.9 × $30 = $71.0M
Fixed Cost: $20M

Unadjusted CF: $131.4M - $65.7M - $71.0M - $20M = -$25.3M (LOSS)

With Transition Risk (Net Zero Scenario):
Carbon Price Trajectory: $30 → $55 → $100 → $180 → $320...

Year 1 CF: -$25.3M
Year 5 CF (Carbon $180): -$94.1M
Year 10 CF (Carbon $580): -$240.8M

Terminal Value Impact:
Economic Life: 30 years
Stranded Year: 15 (early retirement)
Unadjusted Terminal Value: $45M
Adjusted Terminal Value: -$120M (decommissioning cost)

NPV Impact:
Baseline NPV: $85M
Transition-Adjusted NPV: -$180M
Impairment: $265M (311% of book value)
```

### 3.4 Terminal Value Impairment for Stranded Assets

Stranded assets require terminal value recalculation:

$$TV^{stranded} = \sum_{t=T_{stranded}}^{T_{economic}} \frac{CF_t}{(1+r)^t} - Decommissioning_{T_{stranded}}$$

Where:
- $T_{stranded}$: Year of stranding
- $T_{economic}$: Original economic life
- $Decommissioning$: Asset retirement obligation

**Terminal Value Impairment Formula:**

$$\Delta TV = TV^{original} - TV^{stranded}$$

**Stranded Terminal Value Example (Oil Field):**
```
Original Parameters:
- Reserves: 100 million barrels
- Extraction Rate: 5 million barrels/year
- Oil Price: $70/barrel
- Lifting Cost: $25/barrel
- Economic Life: 20 years
- WACC: 10%

Original Terminal Value (Year 10):
Remaining Reserves: 50 million barrels
Remaining Life: 10 years
Annual CF: 5M × ($70 - $25) = $225M
TV = $225M × [(1 - 1.10^(-10)) / 0.10] = $1,383M

Stranded Scenario (Policy phase-out 2035):
Stranded Year: 11 (2035)
Remaining Reserves at Stranding: 45 million barrels
Decommissioning Cost: $150M

Stranded TV: -$150M (no positive cash flows)

Impairment: $1,383M - (-$150M) = $1,533M
```

### 3.5 Sensitivity Analysis Matrix

Comprehensive sensitivity analysis for transition risk:

| Variable | Base Case | Low | Medium | High | Impact on NPV |
|----------|-----------|-----|--------|------|---------------|
| Carbon Price (2030) | $75/t | $40/t | $75/t | $150/t | -$45M / -$120M / -$280M |
| Pass-Through Rate | 55% | 40% | 55% | 70% | -$80M / -$50M / -$20M |
| Abatement Cost | $50/t | $30/t | $50/t | $80/t | -$30M / -$50M / -$90M |
| Policy Stringency | +40% | +20% | +40% | +70% | -$30M / -$65M / -$140M |
| Green Market Share | +15pp | +8pp | +15pp | +25pp | -$25M / -$55M / -$110M |
| Technology Disruption | 2035 | 2040 | 2035 | 2030 | -$40M / -$85M / -$180M |

**Tornado Diagram Sensitivity Ranking:**
```
Carbon Price:        ████████████████████  $280M impact
Policy Stringency:   ████████████████      $140M impact
Technology Disrupt:  ██████████████        $120M impact
Green Market Share:  ██████████            $85M impact
Abatement Cost:      ████████              $60M impact
Pass-Through Rate:   ██████                $60M impact
```

---

## 4. Technological Displacement Models

### 4.1 Technology S-Curve Adoption Model

Market share evolution follows logistic growth:

$$MarketShare_t^{tech} = \frac{L}{1 + e^{-k(t - t_0)}}$$

Where:
- $L$: Saturation level (market ceiling, typically 0.7-0.95)
- $k$: Growth rate parameter
- $t_0$: Inflection point year (50% adoption)

**S-Curve Parameters by Technology:**

| Technology | L (Saturation) | k (Growth Rate) | t₀ (Inflection) |
|------------|---------------|-----------------|-----------------|
| EVs | 0.90 | 0.35 | 2028 |
| Solar PV | 0.85 | 0.28 | 2025 |
| Wind | 0.80 | 0.22 | 2023 |
| Heat Pumps | 0.75 | 0.25 | 2030 |
| Green Hydrogen | 0.60 | 0.40 | 2035 |
| CCS | 0.50 | 0.18 | 2038 |

**EV Adoption Example:**
```
Parameters: L = 0.90, k = 0.35, t₀ = 2028

Market Share Calculations:
2024: MS = 0.90 / (1 + e^(-0.35×(2024-2028)))
        = 0.90 / (1 + e^(1.4))
        = 0.90 / (1 + 4.06)
        = 0.90 / 5.06 = 17.8%

2028: MS = 0.90 / (1 + e^0) = 0.90 / 2 = 45.0%

2032: MS = 0.90 / (1 + e^(-0.35×4))
        = 0.90 / (1 + 0.247)
        = 0.90 / 1.247 = 72.2%

2036: MS = 0.90 / (1 + e^(-0.35×8))
        = 0.90 / (1 + 0.061)
        = 0.90 / 1.061 = 84.8%
```

### 4.2 Learning Curve Effects (Experience Curve)

Cost reduction through cumulative production:

$$Cost_t = Cost_0 \cdot \left(\frac{Cumulative_t}{Cumulative_0}\right)^{-b}$$

Where:
- $b$: Learning rate (progress ratio parameter)
- $Cumulative_t$: Cumulative production/installation

**Progress Ratio:**

$$PR = 2^{-b}$$

Cost reduction per doubling of cumulative output = $(1 - PR) \times 100\%$

**Learning Curve Example (Battery Storage):**
```
Initial Cost (2015): $1,200/kWh
Cumulative (2015): 10 GWh
Learning Rate (b): 0.18
Progress Ratio: 2^(-0.18) = 0.88 (12% reduction per doubling)

Cost Trajectory:
2020 (Cumulative: 150 GWh):
Doublings: log₂(150/10) = 3.91
Cost = $1,200 × (15)^(-0.18) = $1,200 × 0.60 = $720/kWh

2024 (Cumulative: 800 GWh):
Doublings: log₂(800/10) = 6.32
Cost = $1,200 × (80)^(-0.18) = $1,200 × 0.45 = $540/kWh

2030 (Cumulative: 4,000 GWh):
Doublings: log₂(4000/10) = 8.64
Cost = $1,200 × (400)^(-0.18) = $1,200 × 0.33 = $396/kWh

Cost Reduction 2015-2030: 67%
```

### 4.3 Disruption Timing Uncertainty

Disruption timing follows a probability distribution:

$$T_{disruption} \sim \text{LogNormal}(\mu_T, \sigma_T^2)$$

With probability density:

$$f_T(t) = \frac{1}{t \sigma_T \sqrt{2\pi}} \exp\left(-\frac{(\ln t - \mu_T)^2}{2\sigma_T^2}\right)$$

**Disruption Probability Parameters:**

| Technology | μ_T (Mean Year) | σ_T (Std Dev) | P(Disrupt < 2030) |
|------------|----------------|---------------|-------------------|
| EVs vs ICE | 2028 | 2.5 | 78% |
| Renewables vs Coal | 2025 | 1.8 | 95% |
| Heat Pumps vs Gas | 2032 | 3.0 | 25% |
| Green H2 vs Grey H2 | 2035 | 4.0 | 15% |

**Expected Value Calculation:**

$$E[T_{disruption}] = e^{\mu_T + \sigma_T^2/2}$$

```
EV Disruption Example:
μ_T = ln(2028) = 7.615
σ_T = 2.5 years

E[T] = e^(7.615 + 3.125/2) = e^9.178 = 9,700 (incorrect - need adjustment)

Correct Approach:
If T ~ LogNormal(μ, σ²) in years:
E[T] = e^μ × e^(σ²/2) (if μ is in log-years)

For μ_T = 2028, σ_T = 2.5:
ln(2028) = 7.615
E[T] = e^(7.615 + 3.125/2) = e^9.178 ≈ 9,700 (error in parameterization)

Correct parameterization:
If E[T] = 2028, then:
μ = ln(2028) - σ²/2 = 7.615 - 1.56 = 6.055

P(T < 2030) = Φ((ln(2030) - 6.055)/2.5)
            = Φ((7.616 - 6.055)/2.5)
            = Φ(0.624) = 73.4%
```

### 4.4 Winner-Take-All Dynamics

Technology markets exhibit winner-take-all characteristics:

$$MarketShare_t^{leader} = \frac{e^{\beta \cdot Quality_t^{leader}}}{\sum_{i} e^{\beta \cdot Quality_t^{i}}}$$

Where:
- $\beta$: Differentiation sensitivity (typically 2-5)
- $Quality_t^{i}$: Quality score of technology $i$

**Quality Score Components:**

$$Quality_t^{i} = w_1 \cdot Performance_t^{i} + w_2 \cdot Cost_t^{i} + w_3 \cdot Network_t^{i} + w_4 \cdot Policy_t^{i}$$

**Winner-Take-All Example (EV Market):**
```
Tesla vs Competitors (2024):
Tesla Quality Score: 8.5
Competitor Avg Score: 6.0
β = 3.0

Tesla Market Share = e^(3×8.5) / [e^(3×8.5) + 5×e^(3×6.0)]
                   = e^25.5 / [e^25.5 + 5×e^18]
                   = 1.21×10^11 / [1.21×10^11 + 5×6.57×10^7]
                   = 1.21×10^11 / 1.21×10^11
                   ≈ 99.7%

(Note: This is illustrative; actual market shares are more distributed due to regional preferences, brand loyalty, etc.)
```

### 4.5 Network Effects and Tipping Points

Network effects accelerate adoption:

$$\frac{dN_t}{dt} = \alpha \cdot N_t \cdot (N^{max} - N_t) + \beta \cdot N_t \cdot NetworkEffect_t$$

Where:
- $N_t$: Number of adopters at time $t$
- $N^{max}$: Maximum potential adopters
- $\alpha$: Intrinsic adoption rate
- $\beta$: Network effect strength
- $NetworkEffect_t$: Network externality function

**Tipping Point Condition:**

A tipping point occurs when:

$$\frac{d^2N_t}{dt^2} = 0 \text{ and } \frac{d^3N_t}{dt^3} > 0$$

**Network Effect Example (EV Charging):**
```
Parameters:
N_max = 100 million vehicles
α = 0.001 (intrinsic adoption)
β = 0.005 (network effect)

Network Effect Function:
NetworkEffect_t = (ChargingStations_t / 1 million)^0.5

Tipping Point Calculation:
When charging stations reach 500,000:
NetworkEffect = (0.5)^0.5 = 0.707

Adoption Rate = 0.001 × N × (100M - N) + 0.005 × N × 0.707
              = 0.001N(100M - N) + 0.0035N

Tipping point occurs when network effect term dominates:
0.0035N > 0.001N(100M - N)
0.0035 > 0.001(100M - N)
3.5 > 100M - N
N > 99,996,500

This indicates the tipping point is near market saturation for this parameterization.

More realistic with adjusted parameters:
α = 0.01, β = 0.02, NetworkEffect = (Stations/100,000)^0.8

At 50,000 stations:
NetworkEffect = 0.5^0.8 = 0.574

Tipping point when:
0.02 × 0.574 × N > 0.01 × N × (100M - N)
0.0115 > 0.01(100M - N)
N > 100M - 1.15M = 98.85M

Still near saturation - need stronger network effects:
β = 0.1, NetworkEffect = (Stations/50,000)^1.2

At 30,000 stations:
NetworkEffect = (0.6)^1.2 = 0.54

Tipping point:
0.1 × 0.54 × N > 0.01 × N × (100M - N)
0.054 > 0.01(100M - N)
N > 100M - 5.4M = 94.6M
```

---

## 5. Policy Mandate Impact Assessment

### 5.1 Phase-Out Schedule Models

Policy phase-outs follow announced schedules with uncertainty:

$$PhaseOut_t^{sector} = \begin{cases}
1 & \text{if } t < T_{announce} \\
1 - \frac{t - T_{announce}}{T_{phaseout} - T_{announce}} & \text{if } T_{announce} \leq t < T_{phaseout} \\
0 & \text{if } t \geq T_{phaseout}
\end{cases}$$

**Major Phase-Out Commitments:**

| Sector/Technology | Jurisdiction | Announcement | Phase-Out Year | Certainty |
|------------------|--------------|--------------|----------------|-----------|
| Coal Power | EU | 2020 | 2030 | High |
| Coal Power | UK | 2021 | 2024 | Certain |
| ICE Vehicles | EU | 2022 | 2035 | High |
| ICE Vehicles | UK | 2020 | 2030 | High |
| ICE Vehicles | California | 2020 | 2035 | High |
| Gas Boilers | UK | 2021 | 2035 | Medium |
| Oil & Gas | Denmark | 2020 | 2050 | Medium |
| Coal Mining | Germany | 2020 | 2038 | Medium |

**Phase-Out Impact Calculation:**

$$Revenue_t^{affected} = Revenue_t^{baseline} \cdot PhaseOut_t^{sector} \cdot (1 - Substitution_t)$$

**Coal Power Phase-Out Example (EU):**
```
Plant Capacity: 600 MW
Capacity Factor: 70%
Electricity Price: €60/MWh
Operating Cost: €35/MWh

Annual Revenue (Baseline):
600 × 8760 × 0.70 × €60 = €220.8M

Annual Operating Cost:
600 × 8760 × 0.70 × €35 = €128.5M

Phase-Out Schedule (2030):
2024: 100% operational
2025: 83.3% (5 years remaining)
2026: 66.7%
2027: 50.0%
2028: 33.3%
2029: 16.7%
2030: 0%

Cash Flow Impact:
2024: (220.8 - 128.5) × 1.00 = €92.3M
2025: (220.8 - 128.5) × 0.833 = €76.9M
2026: (220.8 - 128.5) × 0.667 = €61.6M
2027: (220.8 - 128.5) × 0.500 = €46.2M
2028: (220.8 - 128.5) × 0.333 = €30.7M
2029: (220.8 - 128.5) × 0.167 = €15.4M
2030: €0M (plant closed)

NPV Impact (8% discount):
Baseline NPV (30 years): €1,038M
Phase-Out NPV: €254M
Impairment: €784M (76% of baseline value)
```

### 5.2 Renewable Portfolio Standards (RPS)

RPS requirements create demand shifts:

$$RPS_t^{jurisdiction} = RPS_0^{jurisdiction} + \gamma^{RPS} \cdot t$$

Where $\gamma^{RPS}$ is the annual RPS increase rate.

**RPS Impact on Conventional Generation:**

$$Demand_t^{conventional} = Demand_t^{total} \cdot (1 - RPS_t) - Demand_t^{nuclear} - Demand_t^{hydro}$$

**RPS Example (US State with 50% by 2030 Target):**
```
Current RPS (2024): 25%
Target RPS (2030): 50%
Annual Increase: (50% - 25%) / 6 = 4.17%/year

Total Demand: 100 TWh
Nuclear: 20 TWh
Hydro: 10 TWh

Conventional Demand:
2024: 100 × (1 - 0.25) - 20 - 10 = 45 TWh
2026: 100 × (1 - 0.333) - 20 - 10 = 36.7 TWh
2028: 100 × (1 - 0.417) - 20 - 10 = 28.3 TWh
2030: 100 × (1 - 0.50) - 20 - 10 = 20 TWh

Conventional Demand Reduction: 45 → 20 TWh (-55.6%)
```

### 5.3 Energy Efficiency Mandates

Efficiency standards reduce energy demand:

$$Demand_t^{efficiency} = Demand_t^{baseline} \cdot \prod_{i} (1 - EI_t^{i})^{w_i}$$

Where:
- $EI_t^{i}$: Efficiency improvement rate for sector $i$
- $w_i$: Sector weight in total demand

**Energy Efficiency Impact Example (Buildings):**
```
Baseline Building Energy: 500 TWh/year
Building Code Tightening: 3%/year improvement
Stock Turnover: 2%/year

Effective Annual Improvement:
EI_effective = 0.03 × 0.02 = 0.06% (immediate impact)
Plus: 0.03 × 0.98 = 2.94% (stock turnover impact)
Total: ~3%/year

Demand Trajectory:
2024: 500 TWh
2027: 500 × (0.97)^3 = 456 TWh
2030: 500 × (0.97)^6 = 416 TWh
2035: 500 × (0.97)^11 = 353 TWh

Cumulative Reduction by 2035: 29.4%
```

### 5.4 Building Code Changes

Building code stringency affects real estate valuations:

$$PropertyValue^{adjusted} = PropertyValue^{baseline} \cdot (1 - \delta^{code})^{Age} \cdot CompliancePenalty$$

Where:
- $\delta^{code}$: Annual value depreciation from code obsolescence
- $CompliancePenalty$: Value impact of non-compliance

**Building Code Impact Example (Commercial Real Estate):**
```
Office Building:
- Current Value: $50M
- Year Built: 2010
- Current Code: ASHRAE 90.1-2019
- Future Code: Net Zero Ready (2030)

Compliance Gap:
Energy Use: 150 kWh/m²/year
Target (2030): 75 kWh/m²/year
Gap: 50%

Retrofit Cost: $800/m² × 20,000 m² = $16M
Annual Energy Savings: $400,000
Simple Payback: 40 years (not economic)

Value Impact:
Without Retrofit: Value = $50M × 0.70 = $35M (30% discount for non-compliance)
With Retrofit: Value = $50M - $16M + NPV(savings) = $38M

Stranded Asset Outcome: $15M impairment (30%)
```

### 5.5 Compliance Cost Quantification

Total compliance cost framework:

$$ComplianceCost_t = \sum_{i} CapEx_i \cdot \delta(t - T_i) + \sum_{j} OpEx_j(t) + Penalty_t \cdot \mathbb{1}_{NonCompliance}$$

Where:
- $CapEx_i$: Capital expenditure for compliance measure $i$
- $OpEx_j$: Ongoing compliance operating costs
- $Penalty_t$: Non-compliance penalties

**Compliance Cost Example (Industrial Facility):**
```
Facility: Steel Mill
Emissions: 2.5 MtCO₂e/year

Compliance Options:
1. Carbon Capture (CCS):
   - CapEx: $500M
   - OpEx: $40M/year
   - Capture Rate: 90%
   - Residual Emissions: 0.25 MtCO₂e/year

2. Buy Carbon Credits:
   - Price: $80/tCO₂e
   - Annual Cost: 2.5M × $80 = $200M/year

3. Production Reduction:
   - Reduce output by 30%
   - Revenue Loss: $180M/year

NPV Analysis (10 years, 8% discount):
Option 1 (CCS):
NPV = -$500M - $40M × 6.71 - 0.25M × $80 × 6.71
    = -$500M - $268M - $134M
    = -$902M

Option 2 (Carbon Credits):
NPV = -$200M × 6.71 = -$1,342M

Option 3 (Production Reduction):
NPV = -$180M × 6.71 = -$1,208M

Optimal Choice: CCS with -$902M NPV
Compliance Cost: $902M over 10 years
```

### 5.6 Penalty Structures for Non-Compliance

Penalty functions vary by jurisdiction:

$$Penalty_t = \min\left(P_t^{carbon} \cdot Shortfall_t \cdot (1 + \pi^{penalty}), Penalty_t^{max}\right)$$

Where:
- $\pi^{penalty}$: Penalty premium over carbon price (typically 0.5-2.0)
- $Penalty_t^{max}$: Maximum penalty cap

**Penalty Structure Comparison:**

| Jurisdiction | Base Penalty | Premium | Max Penalty | Enforcement |
|--------------|--------------|---------|-------------|-------------|
| EU ETS | Market Price | 100% excess | €100/t | Strong |
| California | Fixed ($75-150) | N/A | $150/t | Moderate |
| China ETS | ¥50-100/t | 50% | ¥150/t | Developing |
| UK ETS | Market Price | 200% excess | £100/t | Strong |

---

## 6. Stranded Asset Timeline Calculation

### 6.1 Economic Stranding vs Policy Stranding

**Economic Stranding:**

Occurs when operating costs exceed revenues:

$$T_{economic}^{strand} = \min\{t : CF_t < 0 \text{ and } E[CF_{t+1:t+n}] < 0\}$$

**Policy Stranding:**

Occurs when policy mandates early retirement:

$$T_{policy}^{strand} = T_{mandate}$$

**Effective Stranding Date:**

$$T_{strand} = \min(T_{economic}^{strand}, T_{policy}^{strand})$$

**Stranding Type Comparison:**

| Asset Type | Economic Stranding | Policy Stranding | Expected Stranding |
|------------|-------------------|------------------|-------------------|
| Coal Power (EU) | 2032 | 2030 | 2030 (Policy) |
| Coal Power (US) | 2035 | None | 2035 (Economic) |
| ICE Vehicles | 2040 | 2035 (EU) | 2035 (Policy) |
| Oil Sands | 2030 | None | 2030 (Economic) |
| Gas Pipelines | 2045 | 2050 (some) | 2045 (Economic) |

### 6.2 Stranded Value Formula

The core stranded value calculation:

$$SV = \sum_{t=1}^{T^*} \frac{CF_t}{(1+r)^t} - \sum_{t=1}^{T} \frac{CF_t}{(1+r)^t} = \sum_{t=T+1}^{T^*} \frac{CF_t}{(1+r)^t}$$

Where:
- $T^*$: Economic life (original)
- $T$: Stranded date (actual retirement)
- $SV$: Stranded value (loss)

**Alternative Formulation with Terminal Value:**

$$SV = TV^{original} - TV^{stranded} + Decommissioning_T$$

### 6.3 Stranded Value Example (Coal Power Plant)

```
Plant Parameters:
- Capacity: 600 MW
- Economic Life: 40 years (built 2010, planned 2050)
- Stranded Date: 2030 (policy)
- Remaining Life at Stranding: 20 years
- WACC: 8%

Cash Flow Projection (Post-2024):
Year    Revenue    OpCost    Carbon    Net CF
2025    $180M      $80M      $45M      $55M
2026    $175M      $82M      $55M      $38M
2027    $170M      $84M      $70M      $16M
2028    $165M      $86M      $90M      -$11M
2029    $160M      $88M      $115M     -$43M
2030    $0M        $0M       $0M       $0M (stranded)
...
2050    $0M        $0M       $0M       $0M

Stranded Value Calculation:
Lost CF (2030-2050): Sum of discounted cash flows
PV(2030-2050) = Σ CF_t / (1.08)^t

Assuming average CF of $20M/year (2030-2040) and $0 (2040-2050):
PV = $20M × [(1 - 1.08^(-10)) / 0.08] / (1.08)^6
   = $20M × 6.71 / 1.587
   = $84.6M

Decommissioning Cost (2030): $30M

Total Stranded Value: $84.6M + $30M = $114.6M

As % of Book Value ($200M): 57.3%
```

### 6.4 Optimal Retirement Timing Under Uncertainty

Real options approach to optimal retirement:

$$V^{option} = \max_{\tau} E\left[\sum_{t=1}^{\tau} \frac{CF_t}{(1+r)^t} + \max\left(\frac{V_{\tau}^{continue}}{(1+r)^{\tau}}, \frac{Salvage_{\tau}}{(1+r)^{\tau}}\right)\right]$$

Where:
- $\tau$: Optimal stopping time
- $V_{\tau}^{continue}$: Value of continuing operations
- $Salvage_{\tau}$: Salvage value at retirement

**Optimal Retirement Example (Oil Field):**
```
Current Production: 50,000 barrels/day
Decline Rate: 8%/year
Oil Price: $70/barrel (volatile, σ = 25%)
Lifting Cost: $35/barrel (increasing 3%/year)
WACC: 10%

Option Value Analysis:
Continue Operating:
Year 1 CF: 50,000 × 365 × ($70 - $35) = $638.9M
Year 2 CF: 46,000 × 365 × ($70 - $36.05) = $570.2M
...

Salvage Value:
If retired now: $200M (equipment resale)
If retired later: declining by 10%/year

Real Option Value:
V_continue = $638.9M + PV(future CFs) = $638.9M + $2,100M = $2,739M
V_retire = $200M

Optimal Decision: Continue (value > salvage)

Trigger Price for Retirement:
Find P* where V_continue = V_retire
P* = $42/barrel (when oil drops below this, retire)

With uncertainty (σ = 25%):
Option value increases due to upside potential
Trigger price increases to P* = $38/barrel
(wait longer due to optionality)
```

### 6.5 Salvage Value Estimation

Salvage value depends on asset type and market conditions:

$$Salvage_t = \sum_{i} ComponentValue_t^{i} \cdot LiquidationFactor^{i} \cdot MarketCondition_t$$

**Salvage Value Components:**

| Asset Component | Liquidation Factor | Market Dependency |
|----------------|-------------------|-------------------|
| Land | 80-100% | Location dependent |
| Buildings | 30-50% | Real estate market |
| Machinery | 20-40% | Commodity prices |
| Electrical Equipment | 25-45% | Copper prices |
| Steel Structures | 15-30% | Steel scrap prices |
| Specialized Equipment | 5-15% | Limited resale market |

**Salvage Value Example (Power Plant):**
```
Power Plant Components:
- Land (50 acres): $5M book value
- Turbine/Generator: $80M book value
- Cooling System: $30M book value
- Transmission Equipment: $40M book value
- Buildings: $25M book value
- Total Book Value: $180M

Salvage Value (Liquidation):
- Land: $5M × 0.90 = $4.5M
- Turbine: $80M × 0.15 = $12.0M (specialized, limited market)
- Cooling: $30M × 0.25 = $7.5M
- Transmission: $40M × 0.35 = $14.0M (copper value)
- Buildings: $25M × 0.20 = $5.0M

Total Salvage Value: $43.0M
Salvage Rate: 23.9% of book value

Decommissioning Cost: $25M
Net Salvage: $43M - $25M = $18M
```

### 6.6 Write-Down Schedules for Accounting

IFRS/GAAP impairment recognition:

$$Impairment_t = \max(0, CarryingValue_t - RecoverableAmount_t)$$

Where:

$$RecoverableAmount_t = \max(FairValue_t - CostsToSell_t, ValueInUse_t)$$

**Value in Use Calculation:**

$$ValueInUse_t = \sum_{i=t}^{T} \frac{CF_i}{(1+r)^{i-t}}$$

**Write-Down Schedule Example:**
```
Asset: Coal Power Plant
Book Value (2024): $200M
Economic Life: 30 years remaining
Stranding Date: 2030 (6 years)

Annual Write-Down (Straight-Line to Stranding):
Write-Down per Year = $200M / 6 = $33.3M/year

Schedule:
2024: Book Value $200M → $166.7M (impairment: $33.3M)
2025: Book Value $166.7M → $133.3M (impairment: $33.3M)
2026: Book Value $133.3M → $100.0M (impairment: $33.3M)
2027: Book Value $100.0M → $66.7M (impairment: $33.3M)
2028: Book Value $66.7M → $33.3M (impairment: $33.3M)
2029: Book Value $33.3M → $0M (impairment: $33.3M)
2030: Asset retired

Alternative (Accelerated Based on Cash Flows):
If CFs decline faster than straight-line:
2024: CF $50M (PV remaining: $180M) → Impairment: $20M
2025: CF $40M (PV remaining: $140M) → Impairment: $40M
2026: CF $30M (PV remaining: $100M) → Impairment: $40M
...

Total impairment same, but front-loaded
```

---

## 7. Physical-Transition Risk Correlation

### 7.1 Joint Distribution Modeling

The correlation between physical and transition risk requires joint distribution modeling:

$$(R_P, R_T) \sim C(F_P(R_P), F_T(R_T); \theta)$$

Where:
- $R_P$: Physical risk random variable
- $R_T$: Transition risk random variable
- $C$: Copula function
- $\theta$: Dependence parameter

**Gaussian Copula Specification:**

$$C(u, v; \rho) = \Phi_2(\Phi^{-1}(u), \Phi^{-1}(v); \rho)$$

Where:
- $\Phi_2$: Bivariate normal CDF
- $\Phi^{-1}$: Inverse standard normal CDF
- $\rho$: Correlation coefficient

### 7.2 Scenario-Conditional Correlation

Correlation varies by climate scenario:

| Scenario | Transition Risk Level | Physical Risk Level | Correlation ($\rho$) |
|----------|----------------------|--------------------|---------------------|
| Net Zero 2050 | High | Low | -0.6 |
| Delayed Transition | Very High | Medium | -0.4 |
| Current Policies | Low | High | -0.3 |
| NDCs | Medium | Medium-High | -0.2 |
| Fragmented World | Low | Very High | -0.1 |

**Conditional Joint Distribution:**

$$f(R_P, R_T | Scenario) = f_P(R_P | Scenario) \cdot f_T(R_T | Scenario) \cdot c(F_P, F_T; \rho_{Scenario})$$

### 7.3 Double-Counting Avoidance

Conditional probability approach to avoid double-counting:

$$P(Loss > L^* | Scenario) = P(Loss_P + Loss_T > L^* | Scenario)$$

Using convolution for independent components:

$$P(Loss > L^*) = \int_{0}^{L^*} f_P(x) \cdot F_T(L^* - x) \, dx$$

**Scenario-Weighted Aggregation:**

$$E[Loss] = \sum_{s} P(Scenario_s) \cdot E[Loss | Scenario_s]$$

Where:

$$E[Loss | Scenario_s] = E[Loss_P | Scenario_s] + E[Loss_T | Scenario_s] + \rho_s \cdot \sigma_P \cdot \sigma_T$$

### 7.4 Correlation Matrix by Sector/Region

**Sector-Level Correlation Matrix:**

| Sector | Physical Risk | Transition Risk | Correlation |
|--------|--------------|-----------------|-------------|
| Coastal Real Estate | High | Low | -0.5 |
| Agriculture | High | Medium | -0.2 |
| Utilities | Medium | High | -0.4 |
| Oil & Gas | Low | Very High | -0.7 |
| Coal Mining | Low | Very High | -0.8 |
| Insurance | High | Medium | -0.3 |
| Transportation | Medium | High | -0.4 |
| Manufacturing | Medium | Medium | -0.1 |

**Regional Correlation Matrix:**

| Region | Physical Risk | Transition Risk | Correlation |
|--------|--------------|-----------------|-------------|
| EU | Medium | Very High | -0.6 |
| US | Medium-High | High | -0.4 |
| China | High | High | -0.3 |
| India | Very High | Medium | -0.2 |
| Africa | Very High | Low | -0.1 |
| Small Island States | Very High | Low | -0.2 |

### 7.5 Integrated Risk Calculation Example

**Portfolio-Level Risk Aggregation:**
```
Portfolio Composition:
- Coal Power (EU): $100M, σ_P = 5%, σ_T = 35%, ρ = -0.7
- Coastal Real Estate (US): $150M, σ_P = 25%, σ_T = 10%, ρ = -0.5
- Oil & Gas (Global): $200M, σ_P = 8%, σ_T = 30%, ρ = -0.6
- Utilities (Mixed): $100M, σ_P = 12%, σ_T = 20%, ρ = -0.4

Scenario Probabilities (NGFS):
- Net Zero 2050: 25%
- Delayed Transition: 20%
- Current Policies: 35%
- NDCs: 15%
- Fragmented World: 5%

Risk Calculation (Net Zero Scenario):
Coal Power:
E[Loss_P] = $100M × 0.05 = $5M
E[Loss_T] = $100M × 0.35 = $35M
Covariance = -0.7 × 5 × 35 = -$122.5M²
Total Risk = $5M + $35M - $12.25M = $27.75M

Coastal Real Estate:
E[Loss_P] = $150M × 0.25 = $37.5M
E[Loss_T] = $150M × 0.10 = $15M
Covariance = -0.5 × 37.5 × 15 = -$281.25M²
Total Risk = $37.5M + $15M - $16.88M = $35.62M

Oil & Gas:
E[Loss_P] = $200M × 0.08 = $16M
E[Loss_T] = $200M × 0.30 = $60M
Covariance = -0.6 × 16 × 60 = -$576M²
Total Risk = $16M + $60M - $24M = $52M

Utilities:
E[Loss_P] = $100M × 0.12 = $12M
E[Loss_T] = $100M × 0.20 = $20M
Covariance = -0.4 × 12 × 20 = -$96M²
Total Risk = $12M + $20M - $9.6M = $22.4M

Portfolio Total (Net Zero):
$27.75M + $35.62M + $52M + $22.4M = $137.77M

Scenario-Weighted Expected Loss:
E[Loss] = 0.25 × $137.77M + 0.20 × $185M + 0.35 × $95M + 
          0.15 × $125M + 0.05 × $200M
        = $34.44M + $37M + $33.25M + $18.75M + $10M
        = $133.44M

As % of Portfolio ($550M): 24.3%
```

### 7.6 Copula Implementation for Joint Risk

**Student-t Copula for Tail Dependence:**

$$C(u, v; \rho, \nu) = t_{\nu, \rho}(t_{\nu}^{-1}(u), t_{\nu}^{-1}(v))$$

Where:
- $t_{\nu, \rho}$: Bivariate t-distribution CDF
- $t_{\nu}^{-1}$: Inverse univariate t-distribution CDF
- $\nu$: Degrees of freedom (typically 3-8 for fat tails)

**Tail Dependence Coefficients:**

$$\lambda_{upper} = \lim_{u \to 1} P(V > u | U > u) = 2 - 2 \cdot t_{\nu+1}\left(\sqrt{\frac{(\nu+1)(1-\rho)}{1+\rho}}\right)$$

$$\lambda_{lower} = \lim_{u \to 0} P(V < u | U < u) = 2 \cdot t_{\nu+1}\left(-\sqrt{\frac{(\nu+1)(1-\rho)}{1+\rho}}\right)$$

**Numerical Example (Coal Asset):**
```
Parameters:
ρ = -0.7 (correlation)
ν = 4 (degrees of freedom)
Physical Risk Distribution: Lognormal(μ=2, σ=0.5)
Transition Risk Distribution: Lognormal(μ=3, σ=1.0)

Tail Dependence Calculation:
λ_upper = 2 - 2 × t_5(√((5)(1.7)/(0.3)))
        = 2 - 2 × t_5(√28.33)
        = 2 - 2 × t_5(5.32)
        ≈ 2 - 2 × 0.9997
        ≈ 0.0006 (very low upper tail dependence)

λ_lower = 2 × t_5(-√28.33)
        = 2 × 0.0003
        = 0.0006

Interpretation: Low tail dependence due to negative correlation
When physical risk is extreme (high), transition risk is low, and vice versa
```

---

## 8. Integrated Transition Risk Overlay Framework

### 8.1 Complete DCF Model with Transition Risk

$$NPV^{transition} = \sum_{t=1}^{T} \frac{CF_t^{adjusted}}{(1 + r + \lambda_t)^t} + \frac{TV^{stranded}}{(1 + r + \lambda_T)^T}$$

Where:
- $CF_t^{adjusted}$: Risk-adjusted cash flows
- $\lambda_t$: Time-varying transition risk premium
- $TV^{stranded}$: Stranded terminal value

**Risk-Adjusted Discount Rate:**

$$r_t^{adjusted} = r_f + \beta^{market} \cdot ERP + \beta^{transition} \cdot TRP_t$$

Where:
- $TRP_t$: Transition risk premium
- $\beta^{transition}$: Transition risk beta

### 8.2 Transition Risk Premium Calculation

$$TRP_t = \gamma_0 + \gamma_1 \cdot P_t^{carbon} + \gamma_2 \cdot PolicyStringency_t + \gamma_3 \cdot TechDisplacement_t$$

**Risk Premium Example:**
```
Baseline Parameters:
r_f = 3%
ERP = 5%
β_market = 1.2
β_transition = 0.8

γ_0 = 1%
γ_1 = 0.001 (per $/tCO₂)
γ_2 = 0.5 (per unit policy stringency)
γ_3 = 0.3 (per unit tech displacement)

Year 2024:
Carbon Price: $50/t
Policy Stringency: 0.4
Tech Displacement: 0.2

TRP = 1% + 0.001×50 + 0.5×0.4 + 0.3×0.2
    = 1% + 0.05% + 0.20% + 0.06%
    = 1.31%

Adjusted Discount Rate:
r_adj = 3% + 1.2×5% + 0.8×1.31%
      = 3% + 6% + 1.05%
      = 10.05%

vs. Standard WACC: 3% + 6% = 9%
Transition Premium: +112 bps
```

### 8.3 Summary: Key Formulas and Relationships

| Component | Formula | Key Variables |
|-----------|---------|---------------|
| Carbon Price | $P_t = P_0 \cdot e^{g_t \cdot t}$ | $g_t$: growth rate |
| Sector Elasticity | $\epsilon = EI / Price_{output}$ | $EI$: emission intensity |
| Revenue Impact | $\Delta Rev = Rev \cdot \epsilon_{demand} \cdot \Delta Policy$ | Policy stringency |
| Cost Impact | $\Delta Cost = Emissions \cdot P_t \cdot (1 - Abatement)$ | Abatement rate |
| MAC Curve | $MAC(q) = \min_i C_i^{abate}$ | Abatement options |
| S-Curve | $MS = L / (1 + e^{-k(t-t_0)})$ | $k$: adoption rate |
| Learning Curve | $Cost_t = Cost_0 \cdot (Cumulative_t/Cumulative_0)^{-b}$ | $b$: learning rate |
| Stranded Value | $SV = \sum_{t=T+1}^{T^*} CF_t / (1+r)^t$ | $T$: stranding date |
| Joint Risk | $C(u,v;\rho) = \Phi_2(\Phi^{-1}(u), \Phi^{-1}(v); \rho)$ | $\rho$: correlation |

---

## 9. Numerical Case Study: Integrated Transition Risk Assessment

### 9.1 Asset: 500MW Coal-Fired Power Plant

**Baseline Parameters:**
- Location: EU
- Commissioned: 2010
- Economic Life: 50 years (to 2060)
- Capacity: 500 MW
- Capacity Factor: 70%
- Heat Rate: 9,500 BTU/kWh
- Fuel Cost: $2.50/MMBTU
- Fixed O&M: $25/kW-year
- Emission Factor: 0.95 tCO₂/MWh
- Book Value: $400M

### 9.2 Scenario Analysis

**Scenario 1: Net Zero 2050**
```
Carbon Price Trajectory:
2024: €85/t
2025: €100/t
2030: €180/t
2035: €320/t
2040: €580/t (plant stranded)

Policy: EU coal phase-out by 2040

Cash Flow Projection:
Year  Revenue    Fuel      Carbon    O&M      CF
2024  €153.3M   €72.6M    €69.7M    €12.5M   -€1.5M
2025  €150.0M   €74.8M    €81.4M    €12.8M   -€19.0M
2030  €135.0M   €85.0M    €130.9M   €14.5M   -€95.4M

Stranding Date: 2028 (economic)

Stranded Value:
Lost CF (2028-2060): -€1,250M (NPV)
Decommissioning: €40M
Total Impairment: €1,290M

vs. Book Value: €400M
Required Write-Down: €400M (full impairment)
```

**Scenario 2: Delayed Transition**
```
Carbon Price Trajectory:
2024-2035: €85/t (flat)
2035: Jump to €250/t
2040: €400/t
2050: €800/t (plant stranded)

Stranding Date: 2045 (policy)

Cash Flow Projection:
Year  Revenue    Fuel      Carbon    O&M      CF
2024  €153.3M   €72.6M    €69.7M    €12.5M   -€1.5M
2030  €140.0M   €80.0M    €69.7M    €13.5M   -€23.2M
2035  €130.0M   €85.0M    €195.0M   €14.5M   -€164.5M

Stranded Value:
Lost CF (2045-2060): -€450M (NPV)
Decommissioning: €40M
Total Impairment: €490M

vs. Book Value: €200M (after depreciation)
Required Write-Down: €200M (full impairment)
```

**Scenario 3: Current Policies**
```
Carbon Price Trajectory:
2024: €85/t
2030: €110/t
2040: €150/t
2050: €200/t
2060: €280/t

No explicit phase-out policy

Stranding Date: 2055 (economic - end of life)

Cash Flow Projection:
Year  Revenue    Fuel      Carbon    O&M      CF
2024  €153.3M   €72.6M    €69.7M    €12.5M   -€1.5M
2030  €145.0M   €78.0M    €84.7M    €13.5M   -€31.2M
2040  €140.0M   €85.0M    €107.1M   €15.0M   -€67.1M
2050  €130.0M   €92.0M    €136.9M   €17.0M   -€115.9M

Stranded Value:
Minimal stranding (near end of life)
Decommissioning: €40M
Total Impairment: €40M

NPV (8% discount): -€85M (already negative)
```

### 9.3 Expected Value Across Scenarios

| Scenario | Probability | NPV | Impairment |
|----------|-------------|-----|------------|
| Net Zero 2050 | 30% | -€180M | €400M |
| Delayed Transition | 25% | -€120M | €200M |
| Current Policies | 35% | -€85M | €40M |
| NDCs | 10% | -€60M | €20M |

**Probability-Weighted Expected Value:**
```
E[NPV] = 0.30×(-€180M) + 0.25×(-€120M) + 0.35×(-€85M) + 0.10×(-€60M)
       = -€54M - €30M - €29.75M - €6M
       = -€119.75M

E[Impairment] = 0.30×€400M + 0.25×€200M + 0.35×€40M + 0.10×€20M
              = €120M + €50M + €14M + €2M
              = €186M

As % of Book Value: 46.5%
```

---

## 10. Regulatory Framework Integration

### 10.1 Basel IV Capital Requirements

Transition risk capital charge:

$$K^{transition} = \max\left(EAD \cdot PD^{transition} \cdot LGD^{transition} \cdot M^{transition}, K^{floor}\right)$$

Where:
- $PD^{transition}$: Transition risk-adjusted probability of default
- $LGD^{transition}$: Loss given default under transition scenarios
- $M^{transition}$: Maturity adjustment for transition risk

### 10.2 IFRS 9 Expected Credit Loss

Forward-looking ECL with transition scenarios:

$$ECL = \sum_{s} P(Scenario_s) \cdot \sum_{t} PD_{t|s} \cdot LGD_{t|s} \cdot EAD_t \cdot Df_t$$

### 10.3 NGFS Scenario Alignment

Portfolio alignment with NGFS scenarios:

$$AlignmentScore = \sum_{assets} w_i \cdot \mathbb{1}_{Asset_i \in ScenarioAligned}$$

---

## Appendices

### Appendix A: Parameter Calibration Guide

| Parameter | Data Source | Calibration Method |
|-----------|-------------|-------------------|
| Carbon Price | NGFS, ICAP | Scenario-weighted average |
| Emission Intensity | EPA, IEA | Sectoral averages |
| Pass-Through | Academic studies | Regression analysis |
| Learning Rate | IEA, NREL | Historical cost data |
| S-Curve | Historical adoption | Logistic regression |
| Correlation | Stress testing | Expert judgment |

### Appendix B: Model Validation Checklist

- [ ] Carbon price scenarios align with NGFS
- [ ] Sectoral elasticities validated against historical data
- [ ] MAC curves reviewed by industry experts
- [ ] S-curve parameters calibrated to historical adoption
- [ ] Stranding dates consistent with policy announcements
- [ ] Correlation matrix reviewed for consistency
- [ ] Double-counting checks implemented
- [ ] Sensitivity analysis covers key variables
- [ ] Model outputs backtested where possible

---

*Document prepared by: Quant Financial Risk Modeling Team*
*Version: 1.0*
*Date: 2024*
