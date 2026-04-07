# Task 6: Banking Integration & Prudential Risk Calculations
## Quantitative Models for Climate-Financial Risk Integration

---

## Executive Summary

This document provides comprehensive quantitative frameworks for integrating climate-related financial risks into banking prudential risk management. The models align with Basel IV capital requirements, IFRS 9/CECL accounting standards, and emerging supervisory guidance on climate risk management.

---

# 1. ICAAP Pillar 2 Capital Add-Ons

## 1.1 Climate Risk Capital Framework Architecture

### 1.1.1 Integrated Capital Adequacy Assessment

The Internal Capital Adequacy Assessment Process (ICAAP) requires banks to hold capital above Pillar 1 minimums for risks not fully captured. Climate risk capital add-ons follow a structured framework:

$$
K_{total}^{ICAAP} = K_{Pillar1} + K_{Pillar2}^{traditional} + K_{Pillar2}^{climate}
$$

Where the climate capital add-on decomposes into:

$$
K_{Pillar2}^{climate} = K_{physical} + K_{transition} + K_{correlation} + K_{concentration}
$$

### 1.1.2 Physical Risk Capital Charge

Physical risk capital captures potential losses from acute and chronic climate hazards:

$$
K_{physical} = \sum_{h \in \mathcal{H}} \sum_{i \in \mathcal{I}} EAD_i \times PD_{i,h}^{stressed} \times LGD_{i,h}^{stressed} \times \rho_h \times RW_{physical}
$$

Where:
- $\mathcal{H}$ = Set of relevant hazards (floods, wildfires, storms, drought, etc.)
- $\mathcal{I}$ = Set of exposures by geographic location and sector
- $\rho_h$ = Hazard correlation factor (0.3-0.7 depending on geographic clustering)
- $RW_{physical}$ = Risk weight adjustment for physical risk (typically 1.25-2.0x)

**Hazard-Specific Capital Components:**

$$
K_{physical}^{hazard} = \int_{0}^{T} \int_{A} \lambda_h(t,a) \cdot D_h(t,a) \cdot EAD(a) \cdot LGD_h(a) \, da \, dt
$$

Where $\lambda_h(t,a)$ is the hazard arrival intensity and $D_h(t,a)$ is the damage function.

### 1.1.3 Transition Risk Capital Charge

Transition risk capital addresses policy, technology, and market transition impacts:

$$
K_{transition} = \sum_{s \in \mathcal{S}} \sum_{j \in \mathcal{J}_s} EAD_j \times PD_{j,s}^{transition} \times LGD_{j,s}^{transition} \times RW_{transition} \times \theta_s
$$

Where:
- $\mathcal{S}$ = Set of carbon-intensive sectors
- $\mathcal{J}_s$ = Exposures in sector $s$
- $\theta_s$ = Sector transition vulnerability score (0-1)
- $RW_{transition}$ = Transition risk risk weight multiplier

**Policy Shock Capital Component:**

$$
K_{transition}^{policy} = \sum_{j} EAD_j \times \mathbb{E}\left[ \max\left(0, \frac{P_{carbon}^{shock} - P_{carbon}^{current}}{R_j} - \tau_j \right) \right] \times LGD_j
$$

Where $R_j$ is revenue carbon intensity and $\tau_j$ is abatement capacity.

### 1.1.4 Correlation Adjustment

Climate risk correlation adjustment accounts for systemic risk amplification:

$$
K_{correlation} = \sqrt{\sum_{i} \sum_{j} \rho_{ij}^{climate} \cdot K_i \cdot K_j} - \sum_{i} K_i
$$

Where the climate correlation matrix incorporates:

$$
\rho_{ij}^{climate} = \rho_{ij}^{baseline} + \Delta\rho_{ij}^{physical} + \Delta\rho_{ij}^{transition}
$$

**Correlation Decomposition:**

$$
\Delta\rho_{ij}^{physical} = \gamma_{geo} \cdot \mathbf{1}_{[geo_i = geo_j]} \cdot \sigma_h^{regional}
$$

$$
\Delta\rho_{ij}^{transition} = \gamma_{sector} \cdot \mathbf{1}_{[sector_i = sector_j]} \cdot \sigma_s^{transition}
$$

Where $\gamma_{geo}, \gamma_{sector}$ are correlation amplification factors (typically 0.1-0.3).

---

## 1.2 Stressed PD/LGD Matrix Construction

### 1.2.1 Baseline PD Matrix by Rating and Sector

The baseline probability of default matrix is constructed across rating grades and sectors:

$$
\mathbf{PD}^{baseline} = \begin{bmatrix}
PD_{AAA,1} & PD_{AAA,2} & \cdots & PD_{AAA,S} \\
PD_{AA,1} & PD_{AA,2} & \cdots & PD_{AA,S} \\
\vdots & \vdots & \ddots & \vdots \\
PD_{CCC,1} & PD_{CCC,2} & \cdots & PD_{CCC,S}
\end{bmatrix}
$$

Where sectors are classified by climate vulnerability:

| Sector Code | Description | Carbon Intensity | Physical Vulnerability |
|-------------|-------------|------------------|----------------------|
| 1 | Renewable Energy | Very Low | Low |
| 2 | Technology | Low | Low |
| 3 | Financial Services | Low | Low |
| 4 | Healthcare | Low | Medium |
| 5 | Manufacturing | Medium | Medium |
| 6 | Transportation | High | Low |
| 7 | Real Estate | Medium | High |
| 8 | Agriculture | Medium | Very High |
| 9 | Oil & Gas | Very High | Medium |
| 10 | Coal & Mining | Very High | High |

**Baseline PD Calibration:**

$$
PD_{r,s}^{baseline} = \Phi^{-1}\left(\frac{D_{r,s}}{N_{r,s}}\right) \times \sigma_s + \mu_r
$$

Where $D_{r,s}$ is observed defaults, $N_{r,s}$ is exposure count, $\Phi^{-1}$ is the inverse normal CDF.

### 1.2.2 Climate Stress Multipliers

Climate stress multipliers adjust baseline PDs for scenario-specific shocks:

$$
PD_{i,t}^{stressed} = PD_{i,t}^{baseline} \times (1 + \alpha \cdot ClimateShock_{i,t})
$$

**Expanded Multiplier Framework:**

$$
PD_{i,t}^{stressed} = PD_{i,t}^{baseline} \times \prod_{k \in \mathcal{K}} (1 + \alpha_k \cdot Shock_{i,t}^k)
$$

Where $\mathcal{K}$ represents stress dimensions:
- $k=1$: Physical hazard intensity
- $k=2$: Carbon price shock
- $k=3$: Technology disruption
- $k=4$: Policy uncertainty
- $k=5$: Market sentiment shift

**Physical Risk Stress Multiplier:**

$$
\alpha_{physical} = \beta_0 + \beta_1 \cdot HAZARD_{i}^{score} + \beta_2 \cdot ADAPTATION_{i}^{index} + \beta_3 \cdot INSURANCE_{i}^{coverage}
$$

**Transition Risk Stress Multiplier:**

$$
\alpha_{transition} = \gamma_0 + \gamma_1 \cdot CARBON_{i}^{intensity} + \gamma_2 \cdot ABATEMENT_{i}^{cost} + \gamma_3 \cdot POLICY_{i}^{exposure}
$$

### 1.2.3 Forward-Looking PD Paths

Forward-looking PD paths incorporate scenario-conditional projections:

$$
PD_{i,t}^{forward} = PD_{i,0} \times \exp\left(\int_{0}^{t} \mu_{i,s}^{PD} \, ds + \int_{0}^{t} \sigma_{i,s}^{PD} \, dW_s^{PD}\right)
$$

**Scenario-Conditional PD Evolution:**

$$
\frac{dPD_{i,t}}{PD_{i,t}} = \mu_{i}^{PD}(\mathcal{S}_t) \, dt + \sigma_{i}^{PD} \, dW_t^{PD} + J_{i,t} \, dN_t^{climate}
$$

Where:
- $\mathcal{S}_t \in \{Orderly, Disorderly, Hot\ House\ World\}$ is the scenario state
- $J_{i,t}$ is jump size from climate tipping points
- $N_t^{climate}$ is a counting process for climate events

**Three-Scenario PD Paths:**

| Year | Orderly (°C) | Disorderly (°C) | Hot House (°C) |
|------|--------------|-----------------|----------------|
| 2025 | 1.2 | 1.2 | 1.2 |
| 2030 | 1.3 | 1.4 | 1.5 |
| 2035 | 1.4 | 1.7 | 2.0 |
| 2040 | 1.5 | 2.0 | 2.7 |
| 2045 | 1.6 | 2.3 | 3.3 |
| 2050 | 1.7 | 2.5 | 4.0 |

### 1.2.4 PD Term Structure by Climate Scenario

The complete PD term structure under climate scenarios:

$$
PD_{i,t}^{scenario} = PD_{i}^{baseline} \times \left[1 + \sum_{s \in \mathcal{S}} w_s \cdot \left(e^{\lambda_s \cdot t} - 1\right) \cdot Vulnerability_{i,s}\right]
$$

Where $w_s$ are scenario weights and $\lambda_s$ are scenario-specific decay/growth rates.

---

## 1.3 LGD Stress Adjustments

### 1.3.1 Collateral Value Haircuts

Physical risk impacts collateral values through damage and depreciation:

$$
LGD_{i}^{stressed} = 1 - \frac{V_{collateral}^{stressed}}{EAD_i} \times RecoveryRate^{stressed}
$$

**Stressed Collateral Value:**

$$
V_{collateral}^{stressed} = V_{collateral}^{current} \times (1 - Haircut_{climate})
$$

**Climate Haircut Decomposition:**

$$
Haircut_{climate} = Haircut_{acute} + Haircut_{chronic} + Haircut_{insurance} + Haircut_{liquidity}
$$

**Acute Hazard Haircut:**

$$
Haircut_{acute} = \sum_{h} p_h \times D_h \times (1 - InsuranceCoverage_h)
$$

Where $p_h$ is hazard probability and $D_h$ is damage ratio.

**Chronic Depreciation Haircut:**

$$
Haircut_{chronic} = 1 - e^{-\delta_{climate} \times T}
$$

Where $\delta_{climate}$ is the climate-induced depreciation rate premium.

### 1.3.2 Recovery Rate Reductions

Recovery rates decline under climate stress due to market disruptions:

$$
RR_{i}^{stressed} = RR_{i}^{baseline} \times (1 - \Delta RR_{climate})
$$

**Recovery Rate Reduction Model:**

$$
\Delta RR_{climate} = \phi_0 + \phi_1 \cdot MarketStress + \phi_2 \cdot FireSaleDiscount + \phi_3 \cdot LegalDelay
$$

**Sector-Specific Recovery Rate Adjustments:**

| Sector | Baseline RR | Climate-Stressed RR | Reduction |
|--------|-------------|---------------------|-----------|
| Renewable Energy | 65% | 58% | -10.8% |
| Technology | 60% | 54% | -10.0% |
| Real Estate | 55% | 38% | -30.9% |
| Agriculture | 50% | 32% | -36.0% |
| Oil & Gas | 45% | 28% | -37.8% |
| Coal & Mining | 40% | 20% | -50.0% |

### 1.3.3 Time-to-Recovery Extensions

Climate events extend workout periods, reducing present value recoveries:

$$
LGD_{i}^{TTR} = 1 - \sum_{t=1}^{T_{recovery}} \frac{CF_t^{recovery}}{(1 + r_{discount} + r_{climate})^t}
$$

**Extended Recovery Timeline:**

$$
T_{recovery}^{climate} = T_{recovery}^{baseline} \times (1 + \tau_{climate})
$$

Where $\tau_{climate}$ is the time extension factor (typically 0.2-0.5 for severe climate impacts).

---

## 1.4 Capital Calculation Framework

### 1.4.1 Climate-Adjusted Capital Formula

The comprehensive climate risk capital requirement:

$$
K_{climate} = \sum_i EAD_i \times PD_i^{stressed} \times LGD_i^{stressed} \times RW_i \times M_i \times Corr_i
$$

**Expanded Capital Formula:**

$$
K_{climate} = \sum_i \sum_t EAD_{i,t} \times PD_{i,t}^{stressed} \times LGD_{i,t}^{stressed} \times Df_t \times RW_{i,t} \times SF_{i,t}
$$

Where:
- $Df_t$ = Discount factor for time $t$
- $RW_{i,t}$ = Time-varying risk weight
- $SF_{i,t}$ = Scaling factor for model uncertainty

### 1.4.2 Risk Weight Adjustments

Climate-adjusted risk weights incorporate forward-looking assessments:

$$
RW_{i,t}^{climate} = RW_{i,t}^{baseline} \times (1 + \psi_{physical} \cdot RiskScore_{i}^{physical}) \times (1 + \psi_{transition} \cdot RiskScore_{i}^{transition})
$$

**Risk Weight Multipliers by Climate Category:**

| Climate Risk Category | RW Multiplier Range | Application |
|----------------------|---------------------|-------------|
| Very Low | 0.90 - 1.00 | Green assets, renewables |
| Low | 1.00 - 1.10 | Diversified, low carbon |
| Moderate | 1.10 - 1.25 | Standard exposures |
| High | 1.25 - 1.50 | Vulnerable sectors/regions |
| Very High | 1.50 - 2.00 | Highly concentrated risks |
| Severe | 2.00 - 3.00 | Extreme vulnerability |

### 1.4.3 Concentration Risk Add-On

Concentrated climate exposures require additional capital:

$$
K_{concentration} = \sum_{cluster} \left[ \left( \sum_{i \in cluster} K_i \right)^{\alpha} - \sum_{i \in cluster} K_i \right]
$$

Where $\alpha > 1$ captures non-linear concentration effects (typically 1.1-1.3).

---

## 1.5 Pillar 2 Guidance Documentation

### 1.5.1 Supervisory Expectations

Pillar 2 climate risk capital must address:

1. **Materiality Assessment:**
   $$
   Materiality_{climate} = \frac{K_{climate}}{K_{total}} \times 100\%
   $$
   
   - If Materiality > 10%: Dedicated capital add-on required
   - If Materiality 5-10%: Enhanced monitoring required
   - If Materiality < 5%: Documentation and review

2. **Model Risk Buffer:**
   $$
   K_{model\_risk} = \sigma_{model} \times K_{climate} \times z_{confidence}
   $$

3. **Management Buffer:**
   $$
   K_{management} = \max\left(0, K_{climate}^{stress} - K_{climate}^{base}\right) \times \beta_{conservative}
   $$

### 1.5.2 Documentation Requirements

Required Pillar 2 documentation includes:

- Climate risk identification and assessment methodology
- Scenario selection and calibration rationale
- PD/LGD stress testing framework
- Capital calculation methodology
- Model validation and backtesting results
- Governance and oversight framework
- Integration with ICAAP processes

---

# 2. ILAAP Liquidity Shock Modeling

## 2.1 Stranded Asset Write-Down Impacts

### 2.1.1 Asset Liquidity Classification Shifts

Climate-related write-downs trigger liquidity classification downgrades:

$$
P(Upgrade_{t+1} | WriteDown_t) = \alpha_0 + \alpha_1 \cdot WD_{magnitude} + \alpha_2 \cdot WD_{velocity}
$$

**Liquidity Classification Transition Matrix:**

$$
\mathbf{Q}_{climate} = \begin{bmatrix}
q_{11} & q_{12} & q_{13} & q_{14} \\
q_{21} & q_{22} & q_{23} & q_{24} \\
q_{31} & q_{32} & q_{33} & q_{34} \\
q_{41} & q_{42} & q_{43} & q_{44}
\end{bmatrix}
$$

Where states are: Level 1 HQLA, Level 2A HQLA, Level 2B HQLA, Non-HQLA.

**Climate-Adjusted Transition Probabilities:**

| From / To | L1 HQLA | L2A HQLA | L2B HQLA | Non-HQLA |
|-----------|---------|----------|----------|----------|
| L1 HQLA | 95% | 4% | 1% | 0% |
| L2A HQLA | 5% | 85% | 8% | 2% |
| L2B HQLA | 1% | 10% | 70% | 19% |
| Non-HQLA | 0% | 2% | 13% | 85% |

### 2.1.2 Haircut Increases

Stranded asset haircuts increase under climate stress:

$$
Haircut_{t}^{climate} = Haircut_{t}^{baseline} + \Delta Haircut_{climate} \times StrandingRisk_{t}
$$

**Haircut Expansion Formula:**

$$
\Delta Haircut_{climate} = \beta_0 + \beta_1 \cdot CarbonIntensity + \beta_2 \cdot TechnologyRisk + \beta_3 \cdot PolicyUncertainty
$$

**Haircut Schedule by Asset Type:**

| Asset Type | Baseline Haircut | Climate-Stressed Haircut | Increase |
|------------|------------------|-------------------------|----------|
| Sovereign bonds (AAA-AA) | 0% | 0% | 0% |
| Sovereign bonds (A-BBB) | 15% | 20% | +33% |
| Corporate bonds (IG) | 20% | 30% | +50% |
| Corporate bonds (HY) | 50% | 65% | +30% |
| Carbon-intensive equities | 50% | 75% | +50% |
| Stranded asset-backed securities | 30% | 60% | +100% |

### 2.1.3 Market Depth Reductions

Climate stress reduces market depth and liquidity:

$$
MarketDepth_{t} = MarketDepth_{0} \times e^{-\lambda_{climate} \times t} \times (1 - \delta_{shock} \cdot \mathbf{1}_{[Shock]})
$$

**Liquidity Impact on HQLA Eligibility:**

$$
HQLA_{effective} = \sum_{i} V_i \times Eligibility_i \times LiquidityFactor_i \times (1 - Haircut_i)
$$

Where $LiquidityFactor_i$ captures market depth:

$$
LiquidityFactor_i = \frac{AverageDailyVolume_i}{OutstandingAmount_i} \times \frac{1}{BidAskSpread_i}
$$

---

## 2.2 Liquidity Coverage Ratio (LCR) Stress

### 2.2.1 Outflow Assumptions Under Climate Stress

Climate events accelerate liability outflows:

$$
Outflows_{climate} = \sum_{category} Liability_{category} \times RunoffRate_{category}^{climate}
$$

**Stressed Runoff Rates:**

| Liability Category | Baseline Runoff | Climate Stress Runoff | Multiplier |
|-------------------|-----------------|----------------------|------------|
| Retail deposits (stable) | 5% | 10% | 2.0x |
| Retail deposits (less stable) | 10% | 25% | 2.5x |
| Wholesale funding (operational) | 25% | 50% | 2.0x |
| Wholesale funding (non-operational) | 40% | 75% | 1.9x |
| Unsecured wholesale | 100% | 100% | 1.0x |
| Secured funding | 25% | 50% | 2.0x |

**Climate-Triggered Outflow Model:**

$$
RunoffRate_{i}^{climate} = RunoffRate_{i}^{baseline} \times \left(1 + \gamma \cdot ClimateStressIndex\right)^{\eta_i}
$$

Where $\eta_i$ is liability category sensitivity to climate stress.

### 2.2.2 Inflow Haircuts

Climate stress reduces expected inflows:

$$
Inflows_{climate} = \sum_{j} Receivable_j \times InflowRate_j^{climate} \times (1 - Haircut_j^{climate})
$$

**Inflow Haircut Schedule:**

| Inflow Source | Baseline Rate | Climate Haircut | Effective Rate |
|---------------|---------------|-----------------|----------------|
| Performing loans | 100% | 20% | 80% |
| Non-performing loans | 50% | 50% | 25% |
| Climate-vulnerable exposures | 80% | 40% | 48% |
| Derivatives receivables | 100% | 25% | 75% |
| Securities maturing <30 days | 100% | 15% | 85% |

### 2.2.3 HQLA Eligibility Changes

Climate risk affects HQLA eligibility through credit quality:

$$
HQLA_{total} = HQLA_{Level1} + HQLA_{Level2A} + HQLA_{Level2B} - HQLA_{adjustments}
$$

**Eligibility Downgrade Impact:**

$$
\Delta HQLA = \sum_{i} V_i \times \left[Eligibility_{i}^{new} \times (1 - HC_i^{new}) - Eligibility_{i}^{old} \times (1 - HC_i^{old})\right]
$$

**Climate-Adjusted LCR:**

$$
LCR_{climate} = \frac{HQLA_{climate}}{NetCashOutflows_{climate}} \times 100\%
$$

---

## 2.3 Net Stable Funding Ratio (NSFR) Impacts

### 2.3.1 Available Stable Funding (ASF) Reductions

Climate stress reduces available stable funding:

$$
ASF_{climate} = \sum_{liability} BookValue \times ASF_{factor}^{climate}
$$

**ASF Factor Adjustments:**

| Funding Source | Baseline ASF | Climate-Stressed ASF | Rationale |
|---------------|--------------|---------------------|-----------|
| Regulatory capital | 100% | 100% | No change |
| Preferred stock | 100% | 100% | No change |
| Retail deposits | 95% | 85% | Increased run-off risk |
| Wholesale funding (<1yr) | 50% | 30% | Rollover risk |
| Wholesale funding (>1yr) | 100% | 80% | Market access risk |
| Corporate deposits | 50% | 25% | Concentration risk |

**ASF Reduction Formula:**

$$
ASF_{factor}^{climate} = ASF_{factor}^{baseline} \times (1 - \delta_{ASF} \times ClimateVulnerability)
$$

### 2.3.2 Required Stable Funding (RSF) Increases

Climate-vulnerable assets require more stable funding:

$$
RSF_{climate} = \sum_{asset} CarryingValue \times RSF_{factor}^{climate}
$$

**RSF Factor Increases:**

| Asset Category | Baseline RSF | Climate-Stressed RSF | Increase |
|---------------|--------------|---------------------|----------|
| Unencumbered Level 1 HQLA | 0% | 0% | 0% |
| Unencumbered Level 2 HQLA | 15% | 20% | +33% |
| Performing loans (residential) | 65% | 75% | +15% |
| Performing loans (commercial) | 85% | 100% | +18% |
| Climate-vulnerable loans | 85% | 115% | +35% |
| Stranded assets | 100% | 125% | +25% |
| Fixed assets | 100% | 100% | 0% |

### 2.3.3 NSFR Stress Calculation

$$
NSFR_{climate} = \frac{ASF_{climate}}{RSF_{climate}} \times 100\%
$$

**NSFR Breach Probability:**

$$
P(NSFR_{climate} < 100\%) = \Phi\left(\frac{100\% - \mu_{NSFR}}{\sigma_{NSFR}}\right)
$$

---

## 2.4 Contingent Liquidity Needs

### 2.4.1 Credit Line Drawdowns

Climate stress triggers contingent liquidity needs:

$$
Drawdown_{climate} = \sum_{facility} CommittedAmount_i \times DrawdownRate_i^{climate}
$$

**Drawdown Rate Model:**

$$
DrawdownRate_i^{climate} = \min\left(1, \alpha_0 + \alpha_1 \cdot PD_i^{shock} + \alpha_2 \cdot MarketStress + \alpha_3 \cdot CounterpartyDistress\right)
$$

**Expected Drawdown by Facility Type:**

| Facility Type | Baseline Drawdown | Climate Stress Drawdown | Increase |
|---------------|-------------------|------------------------|----------|
| Revolving credit (corporate) | 30% | 60% | +100% |
| Revolving credit (SME) | 40% | 75% | +88% |
| Trade finance | 20% | 45% | +125% |
| Project finance | 15% | 35% | +133% |
| Committed repo | 10% | 25% | +150% |

### 2.4.2 Collateral Margin Calls

Climate stress increases margin requirements:

$$
MarginCall_{climate} = \sum_{position} Exposure_i \times (VM_i^{new} - VM_i^{old}) + IM_i^{climate}
$$

**Initial Margin Add-On for Climate Risk:**

$$
IM_i^{climate} = IM_i^{baseline} \times (1 + \gamma_{climate} \times VolatilityShock)
$$

**Variation Margin Impact:**

$$
\Delta VM = NPV_{portfolio} \times (Haircut^{new} - Haircut^{old})
$$

---

# 3. Dynamic Collateral Haircut Adjustments

## 3.1 Physical Exposure Score Integration

### 3.1.1 RiskThinking.ai Score Mapping

The Physical Exposure Score (PES) from riskthinking.ai provides granular asset-level climate risk assessment:

$$
PES_i = f(HazardExposure_i, Vulnerability_i, Adaptation_i, Insurance_i)
$$

**Score Decomposition:**

$$
PES_i = \sum_{h \in \mathcal{H}} w_h \times Score_{i,h}
$$

Where $\mathcal{H}$ includes: floods, wildfires, storms, drought, heat stress, sea level rise.

**Score Interpretation:**

| PES Range | Risk Level | Interpretation |
|-----------|------------|----------------|
| 0-20 | Very Low | Minimal climate exposure |
| 20-40 | Low | Limited climate exposure |
| 40-60 | Moderate | Moderate climate exposure |
| 60-75 | High | Significant climate exposure |
| 75-85 | Very High | Severe climate exposure |
| 85-100 | Extreme | Critical climate exposure |

### 3.1.2 Score Tiers and Haircut Schedules

Haircuts are dynamically adjusted based on PES tiers:

$$
Haircut_{tier} = Haircut_{base} + \Delta Haircut_{tier}
$$

**Haircut Schedule by PES Tier:**

| PES Tier | Base Haircut | Climate Add-On | Total Haircut | Cap |
|----------|--------------|----------------|---------------|-----|
| 0-20 | 10% | 0% | 10% | 15% |
| 20-40 | 10% | 2% | 12% | 18% |
| 40-50 | 10% | 5% | 15% | 22% |
| 50-60 | 10% | 10% | 20% | 28% |
| 60-70 | 10% | 18% | 28% | 38% |
| 70-80 | 10% | 30% | 40% | 52% |
| 80-90 | 10% | 50% | 60% | 75% |
| 90-100 | 10% | 75% | 85% | 95% |

---

## 3.2 Haircut Formula

### 3.2.1 Base Haircut Adjustment

The dynamic haircut formula integrates PES:

$$
Haircut_{new} = Haircut_{base} + \beta \times PhysicalExposureScore
$$

**Expanded Haircut Formula:**

$$
Haircut_{new} = Haircut_{base} + \beta_1 \times PES + \beta_2 \times PES^2 + \beta_3 \times HazardConcentration + \beta_4 \times InsuranceGap
$$

**Coefficient Calibration:**

| Parameter | Value | Interpretation |
|-----------|-------|----------------|
| $\beta_0$ (intercept) | 0.10 | Base haircut |
| $\beta_1$ (linear) | 0.005 | Per-point PES increase |
| $\beta_2$ (quadratic) | 0.0001 | Convexity for high scores |
| $\beta_3$ (concentration) | 0.02 | Per hazard concentration |
| $\beta_4$ (insurance) | 0.15 | Uninsured exposure premium |

### 3.2.2 Time-Varying Haircut Adjustment

Haircuts evolve with climate risk projections:

$$
Haircut_t = Haircut_0 + \int_0^t \frac{\partial Haircut}{\partial PES} \cdot \frac{dPES}{ds} \, ds
$$

**Forward Haircut Path:**

$$
Haircut_{t}^{forward} = Haircut_{base} + \beta \times PES_t^{projected} \times (1 + \gamma \times t)
$$

---

## 3.3 Threshold Effects

### 3.3.1 Uninsurability Triggers

When insurance coverage falls below thresholds, haircuts increase discontinuously:

$$
Haircut_{uninsurable} = \begin{cases}
Haircut_{normal} & \text{if } Coverage \geq Threshold \\
Haircut_{normal} + \Delta_{uninsurable} & \text{if } Coverage < Threshold
\end{cases}
$$

**Uninsurability Thresholds:**

| Asset Type | Coverage Threshold | Haircut Add-On |
|------------|-------------------|----------------|
| Residential real estate | 80% | +25% |
| Commercial real estate | 85% | +30% |
| Industrial facilities | 90% | +35% |
| Infrastructure | 85% | +40% |
| Agricultural assets | 70% | +45% |

### 3.3.2 Maximum Haircut Caps

Haircuts are subject to regulatory and practical caps:

$$
Haircut_{effective} = \min(Haircut_{calculated}, Haircut_{max})
$$

**Maximum Haircut Schedule:**

| Asset Class | Maximum Haircut | Rationale |
|-------------|-----------------|-----------|
| Residential property | 75% | Recovery value floor |
| Commercial property | 80% | Recovery value floor |
| Industrial equipment | 85% | Salvage value |
| Inventory | 90% | Liquidation value |
| Receivables | 70% | Collection probability |

---

## 3.4 Re-Margining Frequency Adjustments

### 3.4.1 Frequency Scaling

Higher climate risk requires more frequent re-margining:

$$
Frequency_{new} = Frequency_{base} \times (1 + \phi \times PES)
$$

**Re-Margining Schedule:**

| PES Range | Base Frequency | Adjusted Frequency |
|-----------|---------------|-------------------|
| 0-40 | Quarterly | Quarterly |
| 40-60 | Quarterly | Monthly |
| 60-75 | Quarterly | Bi-weekly |
| 75-85 | Quarterly | Weekly |
| 85-100 | Quarterly | Daily |

### 3.4.2 Trigger-Based Re-Margining

Specific events trigger immediate re-margining:

$$
Trigger_{re-margin} = \mathbf{1}_{[PES \uparrow > \Delta_{threshold}]} \lor \mathbf{1}_{[HazardEvent]} \lor \mathbf{1}_{[InsuranceCancellation]}
$$

---

## 3.5 Cross-Collateral Impacts

### 3.5.1 Portfolio-Level Haircut Adjustments

Cross-collateral impacts consider portfolio concentration:

$$
Haircut_{portfolio} = Haircut_{individual} \times (1 + \kappa \times Concentration_{region} + \lambda \times Concentration_{sector})
$$

**Concentration Adjustment:**

$$
Concentration_{factor} = \frac{\sum_{i} Exposure_i^2}{\left(\sum_{i} Exposure_i\right)^2} \times HerfindahlIndex
$$

---

# 4. Insurance Retreat Impact Modeling

## 4.1 Uninsurability Probability Models

### 4.1.1 Hazard Intensity Thresholds

Insurance retreat occurs when hazard intensity exceeds sustainable levels:

$$
P(Uninsurable | Hazard_h) = \Phi\left(\frac{Intensity_h - \mu_{insurable}}{\sigma_{insurable}}\right)
$$

**Hazard Intensity Thresholds by Type:**

| Hazard Type | Insurable Threshold | Uninsurable Threshold | Transition Zone |
|-------------|--------------------:|----------------------:|----------------:|
| Flood (annual probability) | < 1% | > 5% | 1% - 5% |
| Wildfire (annual probability) | < 2% | > 10% | 2% - 10% |
| Hurricane (wind speed) | < 130 mph | > 160 mph | 130-160 mph |
| Drought (severity index) | < 3 | > 5 | 3 - 5 |
| Heat stress (days/year >35°C) | < 30 | > 60 | 30 - 60 |
| Sea level rise (cm/decade) | < 10 | > 30 | 10 - 30 |

### 4.1.2 Claim Frequency Thresholds

Insurers exit markets when claim frequency exceeds profitability:

$$
P(Uninsurable | Claims) = \begin{cases}
0 & \text{if } \frac{Claims}{Premium} < 0.6 \\
\frac{\frac{Claims}{Premium} - 0.6}{0.4} & \text{if } 0.6 \leq \frac{Claims}{Premium} < 1.0 \\
1 & \text{if } \frac{Claims}{Premium} \geq 1.0
\end{cases}
$$

**Combined Loss Ratio Model:**

$$
CLRatio = \frac{IncurredLosses + Expenses}{EarnedPremiums}
$$

$$
P(MarketExit) = \mathbf{1}_{[CLRatio > 1.05 \text{ for } T \geq 3 \text{ years}]}
$$

### 4.1.3 Market Withdrawal Indicators

Market withdrawal is modeled as a compound process:

$$
P(Withdrawal_{t}) = 1 - \prod_{i=1}^{N_t} (1 - p_i)
$$

Where $p_i$ is individual insurer withdrawal probability.

**Withdrawal Probability Model:**

$$
p_i = \alpha_0 + \alpha_1 \cdot LossRatio_i + \alpha_2 \cdot CapitalStrain_i + \alpha_3 \cdot ReinsuranceCost_i + \alpha_4 \cdot RegulatoryPressure_i
$$

---

## 4.2 Collateral Value Impact

### 4.2.1 Effective Value Reduction

Uninsurability reduces effective collateral value:

$$
V_{effective} = V_{market} \times (1 - UninsurabilityDiscount)
$$

**Discount Factor Components:**

$$
UninsurabilityDiscount = \delta_{direct} + \delta_{indirect} + \delta_{liquidity}
$$

Where:
- $\delta_{direct}$ = Direct damage exposure
- $\delta_{indirect}$ = Marketability reduction
- $\delta_{liquidity}$ = Liquidity premium

### 4.2.2 Discount Factor Model

$$
UninsurabilityDiscount = 1 - e^{-\lambda_{uninsurable} \times PES \times (1 - Coverage)}
$$

**Discount Factors by Hazard and Region:**

| Region | Flood | Wildfire | Hurricane | Drought | Composite |
|--------|-------|----------|-----------|---------|-----------|
| US Gulf Coast | 15% | 5% | 35% | 5% | 45% |
| US West Coast | 8% | 40% | 0% | 15% | 48% |
| US Midwest | 25% | 3% | 5% | 20% | 42% |
| Europe Coastal | 30% | 2% | 5% | 5% | 35% |
| Europe Southern | 10% | 15% | 2% | 35% | 48% |
| Asia Pacific | 35% | 8% | 30% | 10% | 52% |
| Australia | 15% | 35% | 10% | 25% | 55% |

---

## 4.3 Alternative Risk Transfer Costs

### 4.3.1 Catastrophe Bond Pricing

Alternative risk transfer costs increase with uninsurability:

$$
CATBondSpread = Spread_{baseline} + \Delta Spread_{climate} \times P(Uninsurable)
$$

**Spread Decomposition:**

$$
Spread_{CAT} = r_f + RP_{natural} + RP_{climate} + RP_{illiquidity} + RP_{basis}
$$

**Climate Risk Premium:**

$$
RP_{climate} = \lambda_{climate} \times \sigma_{climate} \times Corr_{climate,market}
$$

### 4.3.2 Parametric Insurance Costs

Parametric insurance costs under climate stress:

$$
Premium_{parametric} = ExpectedLoss \times (1 + Loading_{parametric}) \times ClimateFactor
$$

Where:

$$
ClimateFactor = 1 + \beta_1 \times Trend_hazard + \beta_2 \times Volatility_hazard
$$

---

# 5. IFRS 9 / CECL ECL Provisions

## 5.1 Lifetime Expected Credit Loss Formula

### 5.1.1 Core ECL Calculation

The lifetime Expected Credit Loss under IFRS 9:

$$
ECL = \sum_{t=1}^{T} PD_t \times LGD_t \times EAD_t \times Df_t
$$

**Expanded ECL Formula:**

$$
ECL = \sum_{t=1}^{T} \sum_{s \in \mathcal{S}} p_s \times PD_{t,s} \times LGD_{t,s} \times EAD_{t,s} \times Df_{t,s}
$$

Where $\mathcal{S}$ is the set of scenarios and $p_s$ are scenario probabilities.

### 5.1.2 Point-in-Time vs. Through-the-Cycle

IFRS 9 requires point-in-time (PIT) estimates:

$$
PD_t^{PIT} = PD_t^{TTC} \times \frac{f(Macro_t)}{\bar{f}}
$$

Where $f(Macro_t)$ is the macroeconomic factor function.

**Macroeconomic Adjustment:**

$$
PD_t^{PIT} = \Phi\left(\Phi^{-1}(PD^{TTC}) + \beta' \times (Macro_t - \overline{Macro})\right)
$$

---

## 5.2 Climate-Adjusted PD Term Structure

### 5.2.1 Forward PD Curves by Scenario

Forward PD curves incorporate climate scenarios:

$$
PD_{t,s}^{forward} = PD_0 \times \exp\left(\mu_s \times t + \frac{1}{2}\sigma_s^2 \times t\right) \times ClimateFactor_{t,s}
$$

**Climate Factor Decomposition:**

$$
ClimateFactor_{t,s} = (1 + \alpha_{physical} \times PhysicalShock_{t,s}) \times (1 + \alpha_{transition} \times TransitionShock_{t,s})
$$

**Scenario-Specific PD Paths:**

$$
PD_t^{Orderly} = PD_0 \times (1 + 0.02)^t \times (1 + 0.001 \times t)
$$

$$
PD_t^{Disorderly} = PD_0 \times (1 + 0.05)^t \times (1 + 0.005 \times t^2)
$$

$$
PD_t^{HotHouse} = PD_0 \times (1 + 0.08)^t \times (1 + 0.01 \times t^2)
$$

### 5.2.2 Scenario Probability Weighting

Scenario probabilities reflect likelihood assessments:

$$
ECL_{climate} = \sum_{s \in \mathcal{S}} p_s \times ECL_s
$$

**NGFS Scenario Probabilities (Illustrative):**

| Scenario | Probability | Description |
|----------|-------------|-------------|
| Net Zero 2050 | 25% | Orderly transition, 1.5°C |
| Below 2°C | 30% | Orderly transition, <2°C |
| Divergent Net Zero | 20% | Disorderly transition |
| Nationally Determined Contributions | 15% | Delayed transition |
| Current Policies | 10% | Hot house world |

---

## 5.3 LGD Forward Projections

### 5.3.1 Collateral Value Paths

Collateral values follow scenario-dependent paths:

$$
V_{collateral,t} = V_{collateral,0} \times \prod_{s=1}^{t} (1 + g_s - \delta_s - \Delta_{climate,s})
$$

**Climate Depreciation Model:**

$$
\Delta_{climate,t} = \beta_0 + \beta_1 \times Temperature_t + \beta_2 \times HazardFrequency_t + \beta_3 \times InsuranceCost_t
$$

### 5.3.2 Recovery Rate Scenarios

Recovery rates vary by scenario:

$$
LGD_t = 1 - RR_t^{scenario} \times \frac{V_{collateral,t}}{EAD_t}
$$

**Recovery Rate by Scenario:**

| Scenario | Year 1 | Year 5 | Year 10 | Year 20 |
|----------|--------|--------|---------|---------|
| Orderly | 40% | 38% | 36% | 35% |
| Disorderly | 40% | 33% | 28% | 22% |
| Hot House | 40% | 30% | 22% | 15% |

---

## 5.4 Stage Allocation Criteria

### 5.4.1 Significant Increase in Credit Risk (SICR)

SICR determination under IFRS 9:

$$
SICR = \mathbf{1}_{[PD_{lifetime} > PD_{origination} \times (1 + Threshold)]}
$$

**Climate Risk as SICR Trigger:**

$$
SICR_{climate} = \mathbf{1}_{[\Delta PES > Threshold_{PES}]} \lor \mathbf{1}_{[InsuranceCancelled]} \lor \mathbf{1}_{[SectorDowngrade]}
$$

**SICR Thresholds:**

| Indicator | Threshold | Stage Movement |
|-----------|-----------|----------------|
| PD increase | > 50% | Stage 1 → Stage 2 |
| PES increase | > 20 points | Stage 1 → Stage 2 |
| Insurance cancellation | Any | Stage 1 → Stage 2 |
| Watch list placement | Any | Stage 1 → Stage 2 |
| Forbearance | Any | Stage 1 → Stage 2 |

### 5.4.2 Stage Transfer Matrix

$$
\mathbf{T}_{climate} = \begin{bmatrix}
t_{11} & t_{12} & t_{13} \\
t_{21} & t_{22} & t_{23} \\
0 & 0 & 1
\end{bmatrix}
$$

Where $t_{ij}$ represents probability of transfer from Stage $i$ to Stage $j$.

---

## 5.5 Macroeconomic Overlay Integration

### 5.5.1 Multi-Factor Model

ECL integrates macroeconomic factors:

$$
ECL_t = f(GDP_t, Unemployment_t, InterestRate_t, PropertyPrice_t, ClimateIndex_t)
$$

**Climate-Extended MEV Model:**

$$
ECL_t = \alpha + \sum_{i=1}^{n} \beta_i \times MEV_{i,t} + \gamma \times ClimateIndex_t + \epsilon_t
$$

### 5.5.2 Climate Index Construction

$$
ClimateIndex_t = \sum_{h} w_h \times NormalizedHazard_t^h + \delta \times CarbonPrice_t + \eta \times TransitionStress_t
$$

---

# 6. Portfolio-Level Aggregation

## 6.1 Concentration Risk Metrics

### 6.1.1 Geographic Concentration

Geographic concentration measures exposure clustering:

$$
GC = \sum_{g} \left(\frac{Exposure_g}{TotalExposure}\right)^2
$$

**Herfindahl-Hirschman Index for Geography:**

$$
HHI_{geo} = \sum_{r} \left(\frac{EAD_r}{EAD_{total}}\right)^2 \times 10,000
$$

**Concentration Risk Rating:**

| HHI Range | Concentration Level | Capital Add-On |
|-----------|--------------------:|----------------|
| < 1,500 | Low | 0% |
| 1,500 - 2,500 | Moderate | 5% |
| 2,500 - 5,000 | High | 15% |
| > 5,000 | Very High | 30% |

### 6.1.2 Sector Concentration

Sector concentration by carbon intensity:

$$
SC = \sum_{s} \left(\frac{Exposure_s}{TotalExposure}\right)^2 \times CarbonIntensity_s
$$

**Carbon-Adjusted Concentration:**

$$
SC_{carbon} = \sum_{s} \left(\frac{EAD_s}{EAD_{total}}\right) \times CI_s \times Correlation_{s,systemic}
$$

### 6.1.3 Climate Risk Factor Concentration

Climate risk factor concentration index:

$$
CRCI = \sum_{f \in \mathcal{F}} \left(\frac{RiskExposure_f}{TotalRiskExposure}\right)^2
$$

Where $\mathcal{F}$ includes: physical risk, transition risk, liability risk, reputation risk.

---

## 6.2 Diversification Benefits

### 6.2.1 Correlation-Based Adjustments

Diversification benefits depend on correlation structure:

$$
K_{portfolio} = \sqrt{\sum_{i} \sum_{j} \rho_{ij} \times K_i \times K_j}
$$

**Climate Correlation Matrix:**

$$
\mathbf{\Sigma}_{climate} = \begin{bmatrix}
1 & \rho_{PT} & \rho_{PL} & \rho_{PR} \\
\rho_{PT} & 1 & \rho_{TL} & \rho_{TR} \\
\rho_{PL} & \rho_{TL} & 1 & \rho_{LR} \\
\rho_{PR} & \rho_{TR} & \rho_{LR} & 1
\end{bmatrix}
$$

Where P=Physical, T=Transition, L=Liability, R=Reputation.

### 6.2.2 Granularity Adjustments

Granularity adjustment for idiosyncratic risk:

$$
GA = \frac{1}{2} \times \sigma^2 \times \sum_{i} \left(\frac{EAD_i}{EAD_{total}}\right)^2
$$

**Adjusted Capital:**

$$
K_{adjusted} = K_{portfolio} - GA
$$

---

## 6.3 Stress Testing Aggregation

### 6.3.1 Scenario-Conditional Losses

Aggregate losses conditional on scenarios:

$$
Loss_{scenario} = \sum_{i} EAD_i \times PD_{i,scenario} \times LGD_{i,scenario} \times Correlation_{i,scenario}
$$

**Portfolio Loss Distribution:**

$$
F_{Loss}(x) = \sum_{s} p_s \times \Phi\left(\frac{x - \mu_{loss,s}}{\sigma_{loss,s}}\right)
$$

### 6.3.2 Reverse Stress Testing

Reverse stress testing identifies scenarios causing insolvency:

$$
Find \mathcal{S}^* : Loss_{\mathcal{S}^*} = Capital_{available}
$$

**Scenario Severity Index:**

$$
SSI = \frac{Loss_{scenario}}{Capital_{available}} \times 100\%
$$

**Reverse Stress Test Thresholds:**

| SSI Range | Assessment | Required Action |
|-----------|------------|-----------------|
| < 50% | Acceptable | Monitor |
| 50-75% | Elevated | Enhanced monitoring |
| 75-100% | High | Mitigation required |
| > 100% | Critical | Immediate action |

---

# 7. Regulatory Alignment and Implementation

## 7.1 Basel IV Integration

### 7.1.1 Standardized Approach Adjustments

Basel IV standardized approach climate considerations:

$$
RWA_{climate}^{SA} = RWA^{SA} \times (1 + \alpha_{climate}) \times (1 + \beta_{concentration})
$$

### 7.1.2 Internal Ratings-Based Approach

IRB approach climate adjustments:

$$
K_{IRB}^{climate} = K_{IRB}^{baseline} \times \frac{PD^{stressed}}{PD^{baseline}} \times \frac{LGD^{stressed}}{LGD^{baseline}} \times CorrelationAdjustment
$$

---

## 7.2 NGFS Scenario Alignment

### 7.2.1 Scenario Mapping

Mapping internal scenarios to NGFS framework:

| Internal Scenario | NGFS Equivalent | Temperature | Probability |
|-------------------|-----------------|-------------|-------------|
| Green Transition | Net Zero 2050 | 1.5°C | 25% |
| Orderly Transition | Below 2°C | 1.6°C | 30% |
| Delayed Action | NDCs | 2.5°C | 15% |
| Disorderly | Divergent Net Zero | 1.7°C | 20% |
| No Action | Current Policies | 3.5°C | 10% |

---

## 7.3 Implementation Roadmap

### 7.3.1 Phase 1: Foundation (Months 1-6)
- Data collection and quality assessment
- Risk identification and materiality assessment
- Model development and calibration

### 7.3.2 Phase 2: Integration (Months 7-12)
- ICAAP/ILAAP integration
- Stress testing framework enhancement
- Governance and policy updates

### 7.3.3 Phase 3: Optimization (Months 13-18)
- Model validation and refinement
- Regulatory engagement
- Continuous improvement framework

---

# Appendix A: Mathematical Notation Reference

| Symbol | Description |
|--------|-------------|
| $PD$ | Probability of Default |
| $LGD$ | Loss Given Default |
| $EAD$ | Exposure at Default |
| $RW$ | Risk Weight |
| $K$ | Capital requirement |
| $RWA$ | Risk-weighted assets |
| $ECL$ | Expected Credit Loss |
| $PES$ | Physical Exposure Score |
| $\rho$ | Correlation coefficient |
| $\Phi$ | Standard normal CDF |
| $\mathcal{S}$ | Set of scenarios |
| $\mathcal{H}$ | Set of hazards |

---

# Appendix B: Model Validation Framework

## B.1 Backtesting Requirements

$$
Backtest_{statistic} = \frac{ActualLosses - ExpectedLosses}{\sigma_{Expected}}
$$

## B.2 Sensitivity Analysis

$$
Sensitivity_i = \frac{\partial Output}{\partial Input_i} \times \frac{Input_i}{Output}
$$

---

*Document Version: 1.0*
*Date: 2025*
*Classification: Technical Reference*
