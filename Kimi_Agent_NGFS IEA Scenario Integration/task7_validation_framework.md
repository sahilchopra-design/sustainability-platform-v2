# Task 7: System Testing, Validation, and User Persona Acceptance (UAT)
## Model Risk Management Framework - 4x Expanded Research

**Document Version:** 1.0  
**Classification:** Model Risk Management - Technical Specification  
**Prepared by:** Lead Model Risk Management & QA Director  
**Date:** January 2025  
**Status:** Draft for Review

---

## Executive Summary

This document presents a comprehensive Model Risk Management (MRM) framework for the Climate Risk Analytics Platform, covering quantitative validation methodologies, backtesting protocols, sensitivity analysis, explainable AI techniques, load testing specifications, forecast comparison tests, and ongoing performance monitoring. The framework ensures statistical rigor, regulatory compliance, and operational reliability for climate risk projection systems processing 140 billion data points.

---

## Table of Contents

1. [Quantitative Validation Framework](#1-quantitative-validation-framework)
2. [Backtesting Using Historical Extremes](#2-backtesting-using-historical-extremes)
3. [Variance-Based Sensitivity Analysis (Sobol Indices)](#3-variance-based-sensitivity-analysis-sobol-indices)
4. [Explainable AI (SHAP Values)](#4-explainable-ai-shap-values)
5. [Load Testing for 140B Projections](#5-load-testing-for-140b-projections)
6. [Diebold-Mariano Forecast Comparison Tests](#6-diebold-mariano-forecast-comparison-tests)
7. [Model Performance Monitoring](#7-model-performance-monitoring)
8. [User Acceptance Testing (UAT) Framework](#8-user-acceptance-testing-uat-framework)
9. [Appendices](#9-appendices)

---

## 1. Quantitative Validation Framework

### 1.1 Model Validation Lifecycle

#### 1.1.1 Development Validation Phase

The development validation phase ensures that models are conceptually sound, mathematically correct, and appropriate for their intended use before implementation.

**1.1.1.1 Conceptual Soundness Assessment**

| Validation Component | Assessment Criteria | Acceptance Threshold | Documentation Required |
|---------------------|---------------------|---------------------|----------------------|
| Theoretical Foundation | Economic/climate theory alignment | Peer-reviewed literature support | Literature review document |
| Mathematical Correctness | Algorithm implementation | 100% unit test coverage | Unit test reports |
| Assumption Documentation | Explicit assumption listing | All assumptions documented | Assumption register |
| Limitation Identification | Known model boundaries | Complete limitation matrix | Limitation assessment |
| Use Case Alignment | Intended purpose validation | Approved use case document | Use case specification |

**Conceptual Soundness Evaluation Matrix:**

```
Score Matrix (1-5 scale):
┌─────────────────────────────────────────────────────────────────┐
│ Score │ Description                    │ Action Required        │
├─────────────────────────────────────────────────────────────────┤
│   5   │ Fully sound, no concerns       │ Proceed to next phase  │
│   4   │ Minor concerns, mitigable      │ Document mitigations   │
│   3   │ Moderate concerns              │ Requires remediation   │
│   2   │ Significant concerns           │ Major revision needed  │
│   1   │ Fundamentally unsound          │ Reject model           │
└─────────────────────────────────────────────────────────────────┘
```

**1.1.1.2 Developmental Testing Protocol**

| Test Category | Test Type | Sample Size | Statistical Test | Pass Criteria |
|--------------|-----------|-------------|------------------|---------------|
| In-sample | Training fit | Full dataset | R-squared, RMSE, MAE | R-squared > 0.85 |
| Out-of-sample | Holdout validation | 20% holdout | Cross-validation | CV-RMSE < 1.2× train |
| Sensitivity | Parameter perturbation | 1000 iterations | Distribution comparison | < 5% output variance |
| Edge cases | Boundary testing | All boundaries | Error handling | Zero unhandled exceptions |
| Stress | Extreme input values | Synthetic extremes | Stability check | Convergence guaranteed |

**1.1.1.3 Development Documentation Requirements**

```
Required Documentation Package:
├── Model Development Document (MDD)
│   ├── 1. Executive Summary
│   ├── 2. Business Purpose and Use Cases
│   ├── 3. Theoretical Foundation
│   ├── 4. Mathematical Specification
│   ├── 5. Data Requirements and Sources
│   ├── 6. Variable Selection Process
│   ├── 7. Model Estimation Results
│   ├── 8. Diagnostic Testing Results
│   ├── 9. Sensitivity Analysis
│   ├── 10. Limitations and Constraints
│   └── 11. References and Appendices
├── Technical Specification
├── Code Documentation
├── Test Plans and Results
└── Sign-off Documentation
```

#### 1.1.2 Implementation Validation Phase

**1.1.2.1 Implementation Accuracy Verification**

| Verification Level | Methodology | Tools | Acceptance Criteria |
|-------------------|-------------|-------|---------------------|
| Code Review | Peer review, static analysis | SonarQube, ESLint | Zero critical issues |
| Unit Testing | Function-level validation | Jest, pytest | >95% code coverage |
| Integration Testing | Component interaction | Postman, custom scripts | All interfaces validated |
| System Testing | End-to-end validation | Automated test suites | 100% test pass rate |
| Parallel Testing | Dev vs. production comparison | Statistical equivalence | p-value > 0.05 for equivalence |

**Implementation Validation Checklist:**

```
□ Source code matches mathematical specification
□ All parameters correctly implemented
□ Data transformations verified
□ Edge cases handled appropriately
□ Error handling comprehensive
□ Logging sufficient for debugging
□ Performance meets requirements
□ Security controls implemented
□ Documentation complete and accurate
```

**1.1.2.2 Data Pipeline Validation**

| Pipeline Component | Validation Focus | Test Method | Frequency |
|-------------------|------------------|-------------|-----------|
| Data Ingestion | Completeness, accuracy | Reconciliation reports | Daily |
| Data Transformation | Correctness, consistency | Unit tests, data profiling | Per deployment |
| Feature Engineering | Accuracy, stability | Feature drift monitoring | Continuous |
| Model Scoring | Prediction accuracy | Backtesting | Monthly |
| Output Generation | Format, completeness | Schema validation | Per execution |

**Data Quality Metrics:**

| Metric | Definition | Threshold | Action if Breached |
|--------|------------|-----------|-------------------|
| Completeness | % non-null values | >99.5% | Data quality alert |
| Accuracy | % correct values | >99.9% | Investigation required |
| Consistency | Cross-field validation | 100% | Pipeline halt |
| Timeliness | Data freshness | <24 hours | SLA escalation |
| Uniqueness | Duplicate detection | <0.1% | Deduplication process |

#### 1.1.3 Ongoing Monitoring Phase

**1.1.3.1 Continuous Monitoring Framework**

```
Monitoring Hierarchy:
┌─────────────────────────────────────────────────────────────┐
│                    STRATEGIC MONITORING                      │
│         (Executive dashboards, monthly reviews)              │
├─────────────────────────────────────────────────────────────┤
│                    TACTICAL MONITORING                       │
│         (Manager dashboards, weekly reviews)                 │
├─────────────────────────────────────────────────────────────┤
│                    OPERATIONAL MONITORING                    │
│         (Real-time alerts, daily monitoring)                 │
├─────────────────────────────────────────────────────────────┤
│                    TECHNICAL MONITORING                      │
│         (Infrastructure metrics, continuous)                 │
└─────────────────────────────────────────────────────────────┘
```

**1.1.3.2 Monitoring Frequency Matrix**

| Monitoring Activity | Frequency | Responsible Party | Escalation Path |
|--------------------|-----------|-------------------|-----------------|
| Prediction accuracy | Daily | Model Operations | MRM Team Lead |
| Feature drift | Daily | Data Engineering | Chief Data Officer |
| Model performance | Weekly | Model Validation | Chief Risk Officer |
| Business metrics | Weekly | Business Analysts | Product Owner |
| Full validation | Annual | Independent Validation | Model Risk Committee |
| Regulatory reporting | Quarterly | Compliance | Regulatory Affairs |

**1.1.3.3 Trigger-Based Review Protocol**

| Trigger Type | Threshold | Response Time | Action |
|-------------|-----------|---------------|--------|
| Performance degradation | >10% accuracy drop | 24 hours | Investigation |
| Data quality breach | >1% null rate | 4 hours | Pipeline review |
| Concept drift detected | p < 0.01 | 48 hours | Model assessment |
| Regulatory inquiry | N/A | Immediate | Full documentation |
| Incident report | Any severity | 2 hours | Incident response |

### 1.2 Validation Criteria

#### 1.2.1 Conceptual Soundness Criteria

**1.2.1.1 Theoretical Foundation Requirements**

| Criterion | Assessment Method | Minimum Standard | Evidence Required |
|-----------|------------------|------------------|-------------------|
| Economic rationale | Literature review | Peer-reviewed support | ≥3 relevant papers |
| Climate science basis | Expert consultation | IPCC-aligned | Expert sign-off |
| Statistical validity | Methodology review | Established technique | Methodology document |
| Assumption reasonableness | Sensitivity testing | Impact quantified | Sensitivity report |

**1.2.1.2 Assumption Documentation Standards**

```
Assumption Register Template:
┌────────┬────────────────┬─────────────┬──────────┬─────────────┬──────────┐
│ ID     │ Assumption     │ Rationale   │ Impact   │ Sensitivity │ Review   │
│        │ Description    │             │ Level    │ Tested      │ Date     │
├────────┼────────────────┼─────────────┼──────────┼─────────────┼──────────┤
│ A001   │ [Description]  │ [Rationale] │ High/Med │ Yes/No      │ [Date]   │
└────────┴────────────────┴─────────────┴──────────┴─────────────┴──────────┘

Required Fields:
- Unique identifier
- Detailed description
- Business/scientific rationale
- Impact classification (High/Medium/Low)
- Sensitivity testing status
- Review date and owner
```

#### 1.2.2 Data Quality Criteria

**1.2.2.1 Data Quality Dimensions**

| Dimension | Metric | Target | Minimum Acceptable | Measurement Method |
|-----------|--------|--------|-------------------|-------------------|
| Accuracy | Error rate | <0.1% | <0.5% | Sampling audit |
| Completeness | Coverage | 100% | >99% | Null analysis |
| Consistency | Cross-reference match | 100% | >99% | Reconciliation |
| Currency | Age of data | <1 day | <7 days | Timestamp analysis |
| Validity | Format compliance | 100% | >99% | Schema validation |
| Uniqueness | Duplicate rate | <0.01% | <0.1% | Deduplication analysis |

**1.2.2.2 Data Lineage Requirements**

```
Data Lineage Documentation:
Source → Ingestion → Transformation → Storage → Consumption
   ↓         ↓            ↓             ↓           ↓
[Meta]   [Quality]    [Version]    [Access]   [Output]

Required for each data element:
□ Source system identification
□ Ingestion timestamp
□ Transformation logic
□ Quality metrics at each stage
□ Version control reference
□ Access permissions
□ Usage tracking
```

**1.2.2.3 Data Validation Test Suite**

| Test Category | Test Description | Expected Result | Automation |
|--------------|------------------|-----------------|------------|
| Schema | Field type validation | All types match | Yes |
| Range | Value boundary checks | Within defined ranges | Yes |
| Referential | Foreign key integrity | No orphans | Yes |
| Temporal | Date sequence validation | Chronological order | Yes |
| Statistical | Distribution checks | Within expected bounds | Yes |
| Business | Rule-based validation | All rules satisfied | Yes |

#### 1.2.3 Implementation Accuracy Criteria

**1.2.3.1 Code Quality Standards**

| Quality Attribute | Measurement | Target | Minimum | Tool |
|------------------|-------------|--------|---------|------|
| Code coverage | % lines tested | >95% | >85% | Coverage.py |
| Cyclomatic complexity | McCabe index | <10 | <15 | Radon |
| Maintainability index | Microsoft metric | >80 | >60 | Visual Studio |
| Code duplication | % duplicated | <3% | <5% | SonarQube |
| Documentation coverage | % documented | 100% | >80% | Pydoc |

**1.2.3.2 Implementation Verification Matrix**

| Component | Verification Method | Test Coverage | Sign-off Required |
|-----------|-------------------|---------------|-------------------|
| Data ingestion | Unit + integration | 100% | Data Engineer |
| Feature engineering | Unit + regression | 100% | ML Engineer |
| Model inference | Unit + performance | 100% | ML Engineer |
| API layer | Contract + load | 100% | Backend Engineer |
| Frontend | UI + E2E | >90% | Frontend Engineer |
| Infrastructure | IaC validation | 100% | DevOps Engineer |

#### 1.2.4 Performance Testing Criteria

**1.2.4.1 Performance Benchmarks**

| Metric | Target | Acceptable | Degraded | Critical |
|--------|--------|------------|----------|----------|
| API response (p50) | <100ms | <200ms | <500ms | >500ms |
| API response (p95) | <300ms | <500ms | <1000ms | >1000ms |
| API response (p99) | <500ms | <1000ms | <2000ms | >2000ms |
| Batch processing | >10K rec/s | >5K rec/s | >1K rec/s | <1K rec/s |
| Query execution | <5s | <10s | <30s | >30s |
| Concurrent users | >1000 | >500 | >100 | <100 |

**1.2.4.2 Performance Test Scenarios**

| Scenario | Load Level | Duration | Success Criteria |
|----------|------------|----------|------------------|
| Baseline | Normal load | 1 hour | All metrics at target |
| Peak | 2× normal | 30 min | <10% degradation |
| Stress | 5× normal | 15 min | Graceful degradation |
| Spike | 10× normal | 5 min | Recovery <2 min |
| Endurance | Normal load | 24 hours | No memory leaks |
| Soak | 1.5× normal | 72 hours | Stable performance |

### 1.3 Validation Documentation Requirements

#### 1.3.1 Documentation Hierarchy

```
Validation Documentation Structure:

Level 1: Executive Summary
├── Model Risk Rating
├── Validation Conclusion
├── Key Findings
├── Recommendations
└── Sign-off

Level 2: Technical Validation Report
├── 1. Validation Scope and Objectives
├── 2. Model Description
├── 3. Validation Methodology
├── 4. Testing Results
│   ├── 4.1 Conceptual Soundness
│   ├── 4.2 Data Quality
│   ├── 4.3 Implementation Accuracy
│   └── 4.4 Performance Testing
├── 5. Findings and Issues
├── 6. Recommendations
└── 7. Appendices

Level 3: Supporting Documentation
├── Test Plans and Results
├── Code Review Reports
├── Data Quality Reports
├── Performance Test Results
├── Sensitivity Analysis Results
└── Backtesting Results

Level 4: Working Papers
├── Calculation Spreadsheets
├── Analysis Scripts
├── Raw Test Outputs
└── Meeting Minutes
```

#### 1.3.2 Documentation Standards

| Document Type | Retention Period | Format | Approval Required |
|--------------|------------------|--------|-------------------|
| Validation report | 7 years | PDF + source | MRM Director |
| Test results | 7 years | Structured data | Validation Lead |
| Code review | 5 years | PDF + comments | Tech Lead |
| Working papers | 3 years | Native format | Analyst |
| Email correspondence | 3 years | Archived | N/A |

#### 1.3.3 Documentation Quality Checklist

```
□ All sections complete and accurate
□ Mathematical notation consistent
□ Tables and figures numbered and referenced
□ Sources cited appropriately
□ Assumptions clearly stated
□ Limitations identified
□ Recommendations actionable
□ Signatures obtained
□ Version control applied
□ Distribution list defined
```

### 1.4 Independence Standards

#### 1.4.1 Three Lines of Defense Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    THREE LINES OF DEFENSE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   FIRST LINE    │    │  SECOND LINE    │    │ THIRD LINE  │ │
│  │  Model Owners   │◄──►│ Model Validation│◄──►│  Internal   │ │
│  │  Model Developers│   │   MRM Function  │    │   Audit     │ │
│  │   Data Owners   │    │  Risk Oversight │    │             │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│         ▲                       ▲                      ▲       │
│         │                       │                      │       │
│    Development             Independent            Independent   │
│    & Implementation        Validation             Assurance     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.4.2 Independence Requirements

| Aspect | Requirement | Evidence | Review Frequency |
|--------|-------------|----------|------------------|
| Organizational | Separate reporting lines | Org chart | Annual |
| Compensation | No model development incentives | Compensation review | Annual |
| Career path | Independent advancement track | HR documentation | Annual |
| Budget | Independent budget authority | Budget documents | Annual |
| Access | Unrestricted access to all materials | Access logs | Quarterly |
| Authority | Authority to challenge and escalate | Policy document | Annual |

#### 1.4.3 Conflict of Interest Management

```
Conflict of Interest Assessment:

Before Validation Assignment:
□ Review prior involvement with model
□ Assess personal relationships
□ Evaluate financial interests
□ Check for competing priorities

During Validation:
□ Document all interactions
□ Escalate potential conflicts
□ Recuse if conflict identified
□ Maintain objectivity

Documentation Required:
□ Independence declaration
□ Conflict assessment form
□ Recusal documentation (if applicable)
□ Annual reaffirmation
```

---

## 2. Backtesting Using Historical Extremes

### 2.1 Historical Event Selection

#### 2.1.1 Event Selection Criteria

| Criterion | Description | Weight | Minimum Threshold |
|-----------|-------------|--------|-------------------|
| Severity | Economic impact magnitude | 30% | >$10B damages |
| Data availability | Quality and completeness | 25% | >80% coverage |
| Relevance | Applicability to use case | 25% | Direct applicability |
| Geographic diversity | Spatial representation | 10% | Multiple regions |
| Temporal diversity | Time period spread | 10% | >5 year spread |

#### 2.1.2 Selected Historical Events

**2.1.2.1 Texas Freeze (February 2021)**

| Attribute | Details |
|-----------|---------|
| Event Type | Winter storm / Cold wave |
| Duration | February 10-20, 2021 |
| Geographic Scope | Texas, Oklahoma, Louisiana |
| Economic Impact | $195-295 billion (estimated) |
| Insured Losses | $15-20 billion |
| Fatalities | 246 direct and indirect |
| Power Outages | 4.5 million customers |
| Key Characteristics | Grid failure, infrastructure cascade |

**Backtesting Data Sources:** NOAA Storm Events Database, Texas Railroad Commission reports, ERCOT operational data, Insurance claims data (PCI, ISO), Academic studies (Galbraith et al., 2022)

**Model Input Requirements:** Temperature (hourly, grid-level), Precipitation (hourly), Wind speed (hourly), Power grid status, Infrastructure age/condition, Population density, Building stock characteristics, Insurance coverage data, Economic indicators

**2.1.2.2 Hurricane Katrina (August 2005)**

| Attribute | Details |
|-----------|---------|
| Event Type | Category 5 hurricane |
| Landfall | August 29, 2005 |
| Geographic Scope | Gulf Coast (LA, MS, AL) |
| Economic Impact | $161-200 billion (2023 USD) |
| Insured Losses | $82 billion |
| Fatalities | 1,833 confirmed |
| Flood Damage | $81 billion |
| Key Characteristics | Levee failures, urban flooding |

**Backtesting Data Sources:** NOAA Hurricane Database (HURDAT2), USACE post-event analysis, FEMA disaster declarations, NFIP claims data, RMS/EQECAT industry reports

**2.1.2.3 California Wildfires (2017-2020)**

| Attribute | Details |
|-----------|---------|
| Event Type | Wildfire complex |
| Peak Season | 2017, 2018, 2020 |
| Geographic Scope | Northern and Southern California |
| Economic Impact | $50+ billion (2017-2020) |
| Insured Losses | $25+ billion |
| Structures Destroyed | 40,000+ |
| Key Characteristics | Urban-wildland interface, PG&E liability |

**2.1.2.4 European Heatwave (2003)**

| Attribute | Details |
|-----------|---------|
| Event Type | Extreme heatwave |
| Duration | July-August 2003 |
| Geographic Scope | Western and Central Europe |
| Economic Impact | €13 billion |
| Excess Mortality | 70,000+ deaths |
| Agricultural Losses | €13 billion |
| Key Characteristics | Compound drought-heat event |

**2.1.2.5 Australian Bushfires (2019-2020)**

| Attribute | Details |
|-----------|---------|
| Event Type | Bushfire season (Black Summer) |
| Duration | June 2019 - March 2020 |
| Geographic Scope | Eastern and Southern Australia |
| Economic Impact | A$100+ billion |
| Area Burned | 24.3 million hectares |
| Structures Destroyed | 3,000+ |
| Key Characteristics | Unprecedented scale, climate change signal |

### 2.2 Backtesting Methodology

#### 2.2.1 Actual vs. Predicted Comparison

**Point Estimate Comparison Metrics:**

| Metric | Formula | Interpretation | Target |
|--------|---------|----------------|--------|
| Prediction Error | PE = Actual - Predicted | Direction of bias | Symmetric around 0 |
| Percentage Error | PE% = (Actual - Predicted) / Actual × 100 | Relative error | <20% |
| Mean Absolute Error | MAE = sum|Actual - Predicted| / n | Average magnitude | <15% of mean |
| Root Mean Square Error | RMSE = sqrt(MSE) | Standard deviation | <20% of mean |
| Mean Absolute % Error | MAPE = sum|PE%| / n | Average % error | <15% |

**Prediction Interval Coverage:**

| Coverage Level | Expected Coverage | Acceptable Range | Test |
|----------------|-------------------|------------------|------|
| 50% PI | 50% of actuals | 40-60% | Binomial test |
| 80% PI | 80% of actuals | 70-90% | Binomial test |
| 90% PI | 90% of actuals | 85-95% | Binomial test |
| 95% PI | 95% of actuals | 90-98% | Binomial test |
| 99% PI | 99% of actuals | 97-100% | Binomial test |

**Bias and Calibration Metrics:**

| Metric | Formula | Target | Action if Breached |
|--------|---------|--------|-------------------|
| Mean Bias | B = sum(Actual - Predicted) / n | ≈ 0 | Investigate systematic error |
| Calibration Slope | β from regression | ≈ 1 | Recalibration needed |
| Calibration Intercept | α from regression | ≈ 0 | Bias correction needed |
| Brier Score | BS = sum(f - o)² / n | Minimize | Compare to benchmark |
| Reliability | Component of BS | <0.1 | Improve calibration |
| Resolution | Component of BS | Maximize | Enhance discrimination |

### 2.3 Statistical Tests for Backtesting

#### 2.3.1 Kupiec Test for PD Backtesting

**Test Specification:**

The Kupiec test evaluates whether the observed default rate is consistent with the predicted probability of default.

**Null Hypothesis:** H₀: p = p̂ (The model is correctly calibrated)

**Test Statistic:**
```
LR_uc = -2 × ln[((1-p)^(T-N) × p^N) / ((1-N/T)^(T-N) × (N/T)^N)]
```

Where:
- p = Predicted probability of default
- N = Number of observed defaults
- T = Total number of observations
- N/T = Observed default rate

**Decision Rule:**

| Significance Level | Critical Value | Decision |
|-------------------|----------------|----------|
| α = 0.10 | 2.706 | Reject if LR > 2.706 |
| α = 0.05 | 3.841 | Reject if LR > 3.841 |
| α = 0.01 | 6.635 | Reject if LR > 6.635 |

**Python Implementation:**
```python
import numpy as np
from scipy import stats

def kupiec_test(predicted_pd, actual_defaults, total_observations):
    N = actual_defaults
    T = total_observations
    p = predicted_pd
    
    if N == 0:
        lr = -2 * T * np.log(1 - p)
    elif N == T:
        lr = -2 * T * np.log(p)
    else:
        lr = -2 * np.log(
            ((1-p)**(T-N) * p**N) / 
            ((1-N/T)**(T-N) * (N/T)**N)
        )
    
    p_value = 1 - stats.chi2.cdf(lr, df=1)
    
    return {
        'lr_statistic': lr,
        'p_value': p_value,
        'reject_05': lr > 3.841,
        'observed_rate': N/T,
        'predicted_rate': p
    }
```

#### 2.3.2 Binomial Test for Default Predictions

**Test Specification:**

The binomial test directly tests whether the observed number of defaults is consistent with the binomial distribution implied by the PD.

**Null Hypothesis:** H₀: N ~ Binomial(T, p)

**Two-Sided Test:**
```
p-value = 2 × min(P(X ≤ N), P(X ≥ N))
```

**Python Implementation:**
```python
from scipy.stats import binom_test

def binomial_backtest(predicted_pd, actual_defaults, total_observations):
    p_value = binom_test(
        actual_defaults, 
        total_observations, 
        predicted_pd,
        alternative='two-sided'
    )
    
    return {
        'p_value': p_value,
        'significant_05': p_value < 0.05,
        'observed_defaults': actual_defaults,
        'expected_defaults': total_observations * predicted_pd
    }
```

#### 2.3.3 Christoffersen Test for Independence

**Test Specification:**

The Christoffersen test extends the Kupiec test to evaluate whether exceptions (violations) are independently distributed over time.

**Null Hypothesis:** H₀: Exceptions are independently distributed

**Test Statistic:**
```
LR_ind = -2 × ln[((1-π)^(n₀₀+n₁₀) × π^(n₀₁+n₁₁)) / 
                 ((1-π₀)^n₀₀ × π₀^n₀₁ × (1-π₁)^n₁₀ × π₁^n₁₁)]
```

**Contingency Table:**

|  | No Exception (t) | Exception (t) | Total |
|---|------------------|---------------|-------|
| No Exception (t-1) | n₀₀ | n₀₁ | n₀₀ + n₀₁ |
| Exception (t-1) | n₁₀ | n₁₁ | n₁₀ + n₁₁ |

**Python Implementation:**
```python
def christoffersen_test(exception_series):
    n = len(exception_series)
    
    # Build contingency table
    n00 = n01 = n10 = n11 = 0
    for i in range(1, n):
        if exception_series[i-1] == 0 and exception_series[i] == 0:
            n00 += 1
        elif exception_series[i-1] == 0 and exception_series[i] == 1:
            n01 += 1
        elif exception_series[i-1] == 1 and exception_series[i] == 0:
            n10 += 1
        else:
            n11 += 1
    
    # Calculate probabilities
    pi = (n01 + n11) / (n00 + n01 + n10 + n11)
    pi0 = n01 / (n00 + n01) if (n00 + n01) > 0 else 0
    pi1 = n11 / (n10 + n11) if (n10 + n11) > 0 else 0
    
    # Likelihood ratio
    lr = -2 * np.log(
        ((1-pi)**(n00+n10) * pi**(n01+n11)) /
        ((1-pi0)**n00 * pi0**n01 * (1-pi1)**n10 * pi1**n11)
    )
    
    p_value = 1 - stats.chi2.cdf(lr, df=1)
    
    return {
        'lr_statistic': lr,
        'p_value': p_value,
        'reject_05': lr > 3.841,
        'contingency_table': [[n00, n01], [n10, n11]]
    }
```

#### 2.3.4 Combined Tests and Traffic Light Approach

| Zone | Kupiec p-value | Christoffersen p-value | Interpretation |
|------|---------------|----------------------|----------------|
| Green | >0.05 | >0.05 | Model acceptable |
| Yellow | 0.01-0.05 | 0.01-0.05 | Model requires attention |
| Red | <0.01 | <0.01 | Model requires remediation |

**Regulatory Backtesting Requirements:**

| Coverage Level | Yellow Zone Threshold | Red Zone Threshold |
|----------------|----------------------|-------------------|
| 99% VaR | 4-9 exceptions | ≥10 exceptions |
| 99% VaR (250 days) | 5-9 exceptions | ≥10 exceptions |
| 95% VaR | 11-18 exceptions | ≥19 exceptions |

### 2.4 Benchmark Datasets

#### 2.4.1 Insurance Claims Data

| Dataset | Provider | Coverage | Time Period | Update Frequency |
|---------|----------|----------|-------------|------------------|
| PCS Catastrophe Series | Verisk | US property | 1949-present | Event-based |
| PERILS | PERILS AG | European property | 2009-present | Quarterly |
| CATDAT | Risk Layer | Global multi-peril | 1900-present | Annual |
| Sigma | Swiss Re | Global property | 1970-present | Annual |
| Natural Catastrophe Review | Munich Re | Global property | 1980-present | Annual |

#### 2.4.2 Government Disaster Relief Data

| Dataset | Agency | Coverage | Access |
|---------|--------|----------|--------|
| Disaster Declarations | FEMA | US federal | Public API |
| NFIP Claims | FEMA | US flood insurance | FOIA request |
| SBA Disaster Loans | SBA | US small business | Public data |
| Crop Insurance | USDA/RMA | US agriculture | Public data |
| EM-DAT | CRED | Global disasters | Subscription |

#### 2.4.3 Academic Study Data

| Study | Authors | Event | Data Type |
|-------|---------|-------|-----------|
| Texas Freeze Economic Impact | Galbraith et al. (2022) | 2021 Texas Freeze | Economic analysis |
| Hurricane Katrina Damage | RMS (2005) | Hurricane Katrina | Engineering assessment |
| California Wildfire Risk | Kolden (2019) | 2017-2018 fires | Risk modeling |
| European Heatwave Mortality | Robine et al. (2008) | 2003 heatwave | Health impact |
| Australian Bushfire Analysis | Ward et al. (2020) | 2019-2020 fires | Climate attribution |

---

## 3. Variance-Based Sensitivity Analysis (Sobol Indices)

### 3.1 Mathematical Foundations

#### 3.1.1 Variance Decomposition

For a model Y = f(X₁, X₂, ..., Xₐ) where inputs are independent, the variance can be decomposed as:

```
V(Y) = sum(V_i) + sum(V_ij) + sum(V_ijk) + ... + V₁₂...ₐ
```

Where:
- V_i = V_Xi(E_X~i[Y|X_i]) - First-order effect
- V_ij = V_Xi,Xj(E_X~ij[Y|X_i,X_j]) - V_i - V_j - Second-order interaction
- Higher-order terms capture complex interactions

#### 3.1.2 First-Order Sobol Index

**Definition:**
```
S_i = V_Xi(E_X~i[Y|X_i]) / V(Y)
```

**Interpretation:**
- S_i represents the fraction of output variance attributable to input X_i alone
- Range: 0 ≤ S_i ≤ 1
- sum(S_i) ≤ 1 (equality only for additive models)

#### 3.1.3 Total-Order Sobol Index

**Definition:**
```
S_Ti = E_X~i[V_Xi(Y|X~i)] / V(Y)
```

**Alternative Formulation:**
```
S_Ti = 1 - V_X~i(E_Xi[Y|X~i]) / V(Y)
```

**Interpretation:**
- S_Ti represents the total effect of X_i, including all interactions
- S_Ti ≥ S_i always
- S_Ti - S_i represents interaction effects involving X_i

### 3.2 Computation Methods

#### 3.2.1 Monte Carlo Estimation

**Saltelli's Estimator for First-Order Indices:**
```
S_i ≈ [mean(f(A) * f(A_B^(i))) - f₀²] / V_hat(Y)
```

Where:
- A, B = Two independent sample matrices (N × d)
- A_B^(i) = Matrix A with column i replaced by column i from B
- f₀ = mean(f(A))

**Total-Order Estimator:**
```
S_Ti ≈ [mean((f(A) - f(A_B^(i)))²) / 2] / V_hat(Y)
```

**Python Implementation:**
```python
import numpy as np
from scipy.stats import qmc

def sobol_indices_mc(model, d, n_samples, distributions):
    # Generate sample matrices using Sobol sequence
    sampler = qmc.Sobol(d, scramble=True)
    A = sampler.random(n_samples)
    B = sampler.random(n_samples)
    
    # Transform to actual distributions
    A_scaled = np.zeros_like(A)
    B_scaled = np.zeros_like(B)
    for i, dist in enumerate(distributions):
        A_scaled[:, i] = dist.ppf(A[:, i])
        B_scaled[:, i] = dist.ppf(B[:, i])
    
    # Evaluate model
    f_A = model(A_scaled)
    f_B = model(B_scaled)
    
    # Estimate variance
    var_y = np.var(np.concatenate([f_A, f_B]), ddof=1)
    f_0 = np.mean(np.concatenate([f_A, f_B]))
    
    # Calculate indices
    S1 = np.zeros(d)
    ST = np.zeros(d)
    
    for i in range(d):
        # Create A_B^i matrix
        A_B_i = A_scaled.copy()
        A_B_i[:, i] = B_scaled[:, i]
        f_A_B_i = model(A_B_i)
        
        # First-order index
        S1[i] = (np.mean(f_A * f_A_B_i) - f_0**2) / var_y
        
        # Total-order index
        ST[i] = np.mean((f_A - f_A_B_i)**2) / (2 * var_y)
    
    return {'S1': S1, 'ST': ST, 'variance': var_y}
```

#### 3.2.2 Polynomial Chaos Expansion

**Mathematical Formulation:**
```
Y = f(X) ≈ sum(c_α × Ψ_α(X)) for α in A
```

Where:
- Ψ_α = Multivariate orthogonal polynomials
- c_α = Expansion coefficients
- A = Index set

**Sobol Indices from PCE:**

First-order index:
```
S_i = [sum(c_α² × ||Ψ_α||²) for α in A_i] / Var(Y)
```

Where A_i = {α : α_i > 0, α_j≠i = 0}

Total-order index:
```
S_Ti = [sum(c_α² × ||Ψ_α||²) for α in A_i*] / Var(Y)
```

Where A_i* = {α : α_i > 0}

**Python Implementation:**
```python
import chaospy as cp

def sobol_indices_pce(model, distribution, order=3):
    # Generate orthogonal polynomials
    poly = cp.orth_ttr(order, distribution)
    
    # Generate samples and evaluate model
    samples = distribution.sample(2*len(poly), 'S')
    evaluations = model(samples)
    
    # Fit PCE using regression
    approx = cp.fit_regression(poly, samples, evaluations)
    
    # Calculate Sobol indices
    S1 = cp.Sens_m(approx, distribution)
    ST = cp.Sens_t(approx, distribution)
    
    return {'S1': S1, 'ST': ST, 'variance': cp.Var(approx, distribution)}
```

#### 3.2.3 Gaussian Process Emulation

**Python Implementation:**
```python
import GPy
import numpy as np

def sobol_indices_gp(X_train, Y_train, d, n_samples=10000):
    # Train GP model
    kernel = GPy.kern.RBF(d, ARD=True)
    model = GPy.models.GPRegression(X_train, Y_train.reshape(-1, 1), kernel)
    model.optimize()
    
    # Generate samples
    X = np.random.rand(n_samples, d)
    
    # Estimate Sobol indices using GP predictions
    f_A = model.predict(X)[0].flatten()
    
    S1 = np.zeros(d)
    ST = np.zeros(d)
    
    for i in range(d):
        X_B = X.copy()
        X_B[:, i] = np.random.rand(n_samples)
        f_A_B_i = model.predict(X_B)[0].flatten()
        
        var_y = np.var(np.concatenate([f_A, f_A_B_i]))
        f_0 = np.mean(np.concatenate([f_A, f_A_B_i]))
        
        S1[i] = max(0, (np.mean(f_A * f_A_B_i) - f_0**2) / var_y)
        ST[i] = min(1, np.mean((f_A - f_A_B_i)**2) / (2 * var_y))
    
    return {'S1': S1, 'ST': ST, 'variance': var_y}
```

### 3.3 Interpretation Guidelines

#### 3.3.1 Index Interpretation Matrix

| Index Value | Interpretation | Action |
|-------------|----------------|--------|
| S_i > 0.5 | Dominant input | Focus uncertainty reduction here |
| 0.2 < S_i ≤ 0.5 | Important input | Include in detailed analysis |
| 0.05 < S_i ≤ 0.2 | Moderate input | Monitor for changes |
| S_i ≤ 0.05 | Minor input | May simplify/fix value |

#### 3.3.2 Interaction Analysis

| Relationship | Condition | Interpretation |
|--------------|-----------|----------------|
| Additive | S_Ti ≈ S_i for all i | No significant interactions |
| Interactive | S_Ti > S_i for some i | Interactions present |
| Highly interactive | sum(S_i) << 1 | Strong interactions |
| Redundant | S_Ti < S_i | Numerical error or correlation |

#### 3.3.3 Convergence Assessment

| Metric | Target | Assessment |
|--------|--------|------------ |
| Index stability | <5% change | Increase samples if exceeded |
| Bootstrap CI width | <0.1 | Increase samples if exceeded |
| Sum of first-order | sum(S_i) ≤ 1 | Check for errors if >1 |
| Sum of total-order | sum(S_Ti) ≥ 1 | Check for errors if <1 |

### 3.4 Input Prioritization

**Prioritization Score:**
```
P_i = S_Ti × U_i × C_i
```

Where:
- S_Ti = Total-order Sobol index
- U_i = Input uncertainty (coefficient of variation)
- C_i = Cost of uncertainty reduction (inverse)

---

## 4. Explainable AI (SHAP Values)

### 4.1 Mathematical Foundations

#### 4.1.1 Shapley Value Background

From cooperative game theory, the Shapley value distributes the total gain among players fairly based on their marginal contributions.

For a prediction game:
- Players = Features
- Coalition value = Prediction for that feature subset
- Total gain = Prediction - baseline

#### 4.1.2 SHAP Value Definition

**Mathematical Formula:**
```
φ_j(f) = sum over S⊆N\\{j} of [|S|!(|N|-|S|-1)! / |N|!] × [f_S∪{j}(x_S∪{j}) - f_S(x_S)]
```

Where:
- N = Set of all features
- S = Subset of features not including feature j
- f_S = Model prediction using only features in S
- |S| = Number of features in subset S
- |N| = Total number of features

**Component Breakdown:**

| Component | Description |
|-----------|-------------|
| |S|!(|N|-|S|-1)! / |N|! | Weight for subset S (Shapley weighting) |
| f_S∪{j}(x_S∪{j}) | Prediction with feature j included |
| f_S(x_S) | Prediction without feature j |
| Difference term | Marginal contribution of feature j |

#### 4.1.3 SHAP Properties

**Efficiency (Local Accuracy):**
```
sum(φ_j(f)) = f(x) - E[f(X)]
```

**Symmetry:**
If f(S ∪ {i}) = f(S ∪ {j}) for all S, then φ_i = φ_j

**Dummy:**
If f(S ∪ {i}) = f(S) for all S, then φ_i = 0

**Additivity:**
For f = f₁ + f₂, φ_j(f) = φ_j(f₁) + φ_j(f₂)

### 4.2 Computation Algorithms

#### 4.2.1 TreeSHAP for Tree-Based Models

**Algorithm Overview:**

TreeSHAP computes SHAP values exactly for tree-based models in polynomial time.

**Complexity:** O(TLD²) where:
- T = Number of trees
- L = Maximum leaves per tree
- D = Maximum depth

**Python Implementation:**
```python
import shap
import xgboost as xgb

def compute_treeshap(model, X_background, X_explain):
    # Create TreeExplainer
    explainer = shap.TreeExplainer(model, X_background)
    
    # Compute SHAP values
    shap_values = explainer(X_explain)
    
    return shap_values
```

#### 4.2.2 KernelSHAP for Model-Agnostic Explanations

**Algorithm Overview:**

KernelSHAP approximates SHAP values using weighted linear regression.

**Approximation:**
```
φ = argmin_φ sum over z'∈Z of π_z' × (f(h_x(z')) - φ₀ - sum(φ_j × z'_j))²
```

Where:
- z' = Coalition vector (1 if feature present, 0 if absent)
- π_z' = Shapley kernel weight
- h_x = Mapping from coalition to feature values

**Shapley Kernel Weights:**
```
π_z' = (M-1) / [C(M,|z'|) × |z'| × (M-|z'|)]
```

Where |z'| is the number of features in the coalition.

**Python Implementation:**
```python
import shap

def compute_kernelshap(model, X_background, X_explain, nsamples=100):
    # Create KernelExplainer
    explainer = shap.KernelExplainer(model, X_background)
    
    # Compute SHAP values
    shap_values = explainer.shap_values(X_explain, nsamples=nsamples)
    
    return shap_values
```

#### 4.2.3 DeepSHAP for Neural Networks

**Python Implementation:**
```python
import shap
import tensorflow as tf

def compute_deepshap(model, X_background, X_explain):
    # Create DeepExplainer
    explainer = shap.DeepExplainer(model, X_background)
    
    # Compute SHAP values
    shap_values = explainer.shap_values(X_explain)
    
    return shap_values
```

### 4.3 Aggregation Methods

#### 4.3.1 Mean Absolute SHAP Values

**Definition:**
```
φ̄_j = (1/n) × sum(|φ_j^(i)|)
```

**Interpretation:**
- Average magnitude of feature j's impact across all predictions
- Higher values indicate more important features

**Python Implementation:**
```python
import numpy as np

def mean_abs_shap(shap_values):
    return np.mean(np.abs(shap_values), axis=0)
```

#### 4.3.2 SHAP Interaction Values

**Definition:**
```
φ_j,k(f) = (1/2) × sum over S⊆N\\{j,k} of [|S|!(|N|-|S|-2)! / (|N|-1)!] × Δ_j,k(S)
```

Where:
```
Δ_j,k(S) = f(S ∪ {j,k}) - f(S ∪ {j}) - f(S ∪ {k}) + f(S)
```

**Interpretation:**
- Captures interaction effect between features j and k
- Beyond individual SHAP values

**Python Implementation:**
```python
import shap

def compute_interaction_values(model, X_background, X_explain):
    explainer = shap.TreeExplainer(model, X_background)
    interaction_values = explainer.shap_interaction_values(X_explain)
    
    return interaction_values
```

#### 4.3.3 SHAP Dependence Plots

**Python Implementation:**
```python
import shap
import matplotlib.pyplot as plt

def plot_shap_dependence(shap_values, X, feature_name, interaction_feature=None):
    shap.dependence_plot(
        feature_name,
        shap_values.values,
        X,
        interaction_index=interaction_feature
    )
```

### 4.4 Black-Box Avoidance Strategies

#### 4.4.1 Surrogate Model Explanations

**LIME (Local Interpretable Model-agnostic Explanations):**

```python
import lime
import lime.lime_tabular

def lime_explanation(model, X_train, X_instance, feature_names):
    explainer = lime.lime_tabular.LimeTabularExplainer(
        X_train,
        feature_names=feature_names,
        mode='regression'
    )
    
    explanation = explainer.explain_instance(X_instance, model)
    
    return explanation
```

**Surrogate Decision Trees:**

```python
from sklearn.tree import DecisionTreeRegressor, export_text

def surrogate_tree_explanation(model, X, max_depth=3):
    # Get predictions from black-box model
    y_pred = model(X)
    
    # Train surrogate tree
    surrogate = DecisionTreeRegressor(max_depth=max_depth)
    surrogate.fit(X, y_pred)
    
    return surrogate
```

#### 4.4.2 Feature Importance Documentation

**Permutation Importance:**

```python
from sklearn.inspection import permutation_importance

def compute_permutation_importance(model, X, y, n_repeats=10):
    result = permutation_importance(
        model, X, y, 
        n_repeats=n_repeats,
        random_state=42
    )
    
    return {
        'importances_mean': result.importances_mean,
        'importances_std': result.importances_std
    }
```

**Partial Dependence Plots:**

```python
from sklearn.inspection import partial_dependence
import matplotlib.pyplot as plt

def plot_partial_dependence(model, X, features, feature_names):
    fig, ax = plt.subplots(figsize=(12, 4))
    
    partial_dependence(
        model, X, features,
        feature_names=feature_names,
        grid_resolution=50,
        ax=ax
    )
    
    plt.tight_layout()
    return fig
```

#### 4.4.3 Model Simplification Trade-offs

| Approach | Complexity | Interpretability | Accuracy Trade-off | Use Case |
|----------|-----------|------------------|-------------------|----------|
| Linear model | Low | High | -10-20% | Regulatory reporting |
| Decision tree | Medium | High | -5-10% | Business explanation |
| Rule-based | Low | Very High | -15-25% | Compliance |
| Surrogate model | Variable | Variable | -5-15% | Explanation layer |
| SHAP summary | N/A | High | None | Model documentation |

---

## 5. Load Testing for 140B Projections

### 5.1 Performance Benchmarks

#### 5.1.1 Ingestion Throughput

| Metric | Target | Acceptable | Stress Test | Unit |
|--------|--------|------------|-------------|------|
| Records/second | 100,000 | 50,000 | 200,000 | rec/s |
| MB/second | 500 | 250 | 1,000 | MB/s |
| Concurrent batches | 20 | 10 | 50 | batches |
| Batch processing time | <5 min | <10 min | <2 min | minutes |

**Ingestion Calculation for 140B Projections:**

```
Total projections: 140,000,000,000
Target ingestion rate: 100,000 records/second
Time required: 140,000,000,000 / 100,000 = 1,400,000 seconds
                                    = 16.2 days

Parallel processing (50 batches):
Time per batch: 2,800,000,000 / 100,000 = 28,000 seconds = 7.8 hours
Total time: 7.8 hours (parallel)
```

#### 5.1.2 Query Response Times

| Metric | p50 Target | p95 Target | p99 Target | Unit |
|--------|-----------|-----------|-----------|------|
| Simple query | <50 | <100 | <200 | ms |
| Aggregation query | <200 | <500 | <1000 | ms |
| Complex analytics | <1000 | <3000 | <5000 | ms |
| Export query | <5000 | <10000 | <30000 | ms |
| Dashboard load | <500 | <1000 | <2000 | ms |

#### 5.1.3 Concurrent User Capacity

| User Type | Concurrent Users | Request Rate | Think Time |
|-----------|-----------------|--------------|------------|
| Analysts | 500 | 10 req/min | 30 sec |
| Executives | 100 | 2 req/min | 60 sec |
| API clients | 1000 | 100 req/sec | N/A |
| Batch processes | 50 | 1 batch/min | N/A |
| Total | 1,650 | ~120 req/sec | - |

### 5.2 AWS Load Testing

#### 5.2.1 API Gateway Throttling

| Setting | Value | Rationale |
|---------|-------|-----------|
| Default throttle | 10,000 req/sec | Baseline capacity |
| Burst limit | 5,000 req/sec | Handle traffic spikes |
| Account-level limit | 20,000 req/sec | Reserved capacity |
| Per-method limits | Configurable | Protect critical paths |

**Throttling Configuration:**
```yaml
# API Gateway Throttling Configuration
throttleSettings:
  rateLimit: 10000
  burstLimit: 5000
  
methodSettings:
  - method: POST /projections
    rateLimit: 5000
    burstLimit: 2500
  - method: GET /dashboard
    rateLimit: 10000
    burstLimit: 5000
  - method: GET /analytics
    rateLimit: 2000
    burstLimit: 1000
```

#### 5.2.2 Lambda Concurrency Limits

| Function | Reserved Concurrency | Provisioned Concurrency | Timeout |
|----------|---------------------|------------------------|---------|
| Ingestion | 500 | 100 | 15 min |
| Query | 1000 | 200 | 30 sec |
| Analytics | 200 | 50 | 5 min |
| Export | 100 | 20 | 15 min |
| Notification | 500 | 100 | 10 sec |

#### 5.2.3 RDS Connection Pooling

| Parameter | Value | Description |
|-----------|-------|-------------|
| max_connections | 5,000 | Database limit |
| max_pool_size | 100 | Per-application pool |
| min_pool_size | 10 | Minimum connections |
| connection_timeout | 30 sec | Connection wait timeout |
| idle_timeout | 10 min | Idle connection timeout |

### 5.3 Stress Testing Scenarios

#### 5.3.1 Peak Load Simulation

**Scenario: Monthly Reporting Peak**

| Parameter | Value |
|-----------|-------|
| Duration | 4 hours |
| Concurrent users | 2,000 |
| Request rate | 500 req/sec |
| Data volume | 10B projections |
| User mix | 70% analysts, 30% executives |

#### 5.3.2 Degraded Performance Testing

| Condition | Impact | Expected Behavior |
|-----------|--------|-------------------|
| 50% DB capacity | 2× query time | Queue requests, no errors |
| Read replica lag | Stale data | Serve cached data |
| Cache miss rate 50% | Increased DB load | Graceful degradation |
| Lambda cold starts | 5 sec latency | Provisioned concurrency |

**Degradation Test Matrix:**

| Test | Degradation Level | Success Criteria |
|------|------------------|------------------|
| DB capacity | 50% | <5% error rate |
| Cache hit rate | 70% | <20% latency increase |
| Lambda concurrency | 50% | Queue depth <1000 |
| Network latency | +100ms | <10% timeout rate |

#### 5.3.3 Recovery Testing

**Recovery Scenarios:**

| Failure Type | Recovery Time Objective | Recovery Point Objective | Test Method |
|--------------|------------------------|-------------------------|-------------|
| AZ failure | <5 min | <1 min | AZ shutdown |
| Database crash | <10 min | <5 min | Instance restart |
| Cache failure | <2 min | <30 sec | Redis failover |
| Lambda error | <1 min | 0 | Function redeploy |
| Network partition | <3 min | <1 min | Security group change |

### 5.4 Monitoring and Alerting Thresholds

#### 5.4.1 Performance Monitoring Metrics

| Metric | Warning | Critical | Emergency | Dashboard |
|--------|---------|----------|-----------|-----------|
| API latency (p95) | >500ms | >1000ms | >2000ms | Yes |
| Error rate | >1% | >5% | >10% | Yes |
| CPU utilization | >70% | >85% | >95% | Yes |
| Memory utilization | >70% | >85% | >95% | Yes |
| DB connections | >70% | >85% | >95% | Yes |
| Queue depth | >100 | >500 | >1000 | Yes |
| Disk I/O | >70% | >85% | >95% | No |
| Network I/O | >70% | >85% | >95% | No |

---

## 6. Diebold-Mariano Forecast Comparison Tests

### 6.1 Loss Differential Framework

#### 6.1.1 Loss Differential Definition

**Mathematical Formulation:**
```
d_t = L(e₁t) - L(e₂t)
```

Where:
- e₁t = Forecast error from model 1 at time t
- e₂t = Forecast error from model 2 at time t
- L(·) = Loss function

**Forecast Errors:**
```
e_it = y_t - ŷ_it
```

Where:
- y_t = Actual value at time t
- ŷ_it = Forecast from model i at time t

#### 6.1.2 Loss Functions

| Loss Function | Formula | Use Case |
|--------------|---------|----------|
| Squared Error (SE) | L(e) = e² | Standard regression |
| Absolute Error (AE) | L(e) = |e| | Robust to outliers |
| Percentage Error (PE) | L(e) = |e/y| | Relative comparisons |
| Quantile Loss | L_q(e) = e(q - I(e<0)) | Probabilistic forecasts |
| Economic Loss | Custom | Business decisions |

**Quantile Loss Function:**
```
L_q(e) = q × e     if e ≥ 0
       = (q-1) × e if e < 0
```

Where q ∈ (0, 1) is the quantile level.

### 6.2 Test Statistic

#### 6.2.1 Diebold-Mariano Statistic

**Formula:**
```
DM = d̄ / sqrt(V̂(d̄)/T)
```

Where:
- d̄ = (1/T) × sum(d_t) = Sample mean of loss differentials
- V̂(d̄) = Estimated variance of d̄
- T = Number of forecasts

**Variance Estimation:**

For h-step ahead forecasts with autocorrelation:
```
V̂(d̄) = (1/T) × (γ₀ + 2 × sum(γ_j) for j=1 to h-1)
```

Where γ_j is the j-th autocovariance of d_t.

#### 6.2.2 Autocovariance Estimation

**Newey-West Estimator:**
```
γ̂_j = (1/T) × sum((d_t - d̄) × (d_{t-j} - d̄)) for t=j+1 to T
```

**HAC (Heteroskedasticity and Autocorrelation Consistent) Variance:**
```
V̂_HAC(d̄) = (1/T) × sum(k(j) × γ̂_j) for j=-(h-1) to h-1
```

Where k(j) is a kernel weight function (e.g., Bartlett kernel).

#### 6.2.3 Implementation

```python
import numpy as np
from scipy import stats

def diebold_mariano_test(y_true, y_pred1, y_pred2, loss='se', h=1):
    T = len(y_true)
    
    # Calculate forecast errors
    e1 = y_true - y_pred1
    e2 = y_true - y_pred2
    
    # Calculate loss differentials
    if loss == 'se':
        d = e1**2 - e2**2
    elif loss == 'ae':
        d = np.abs(e1) - np.abs(e2)
    elif loss == 'pe':
        d = np.abs(e1/y_true) - np.abs(e2/y_true)
    else:
        raise ValueError(f"Unknown loss function: {loss}")
    
    # Mean loss differential
    d_bar = np.mean(d)
    
    # Variance estimation with HAC correction
    gamma_0 = np.var(d, ddof=0)
    
    # Autocovariances for h-step forecasts
    autocov_sum = 0
    for j in range(1, h):
        gamma_j = np.mean((d[j:] - d_bar) * (d[:-j] - d_bar))
        autocov_sum += gamma_j
    
    var_d_bar = (gamma_0 + 2 * autocov_sum) / T
    
    # DM statistic
    dm_stat = d_bar / np.sqrt(var_d_bar)
    
    # P-value (two-tailed)
    p_value = 2 * (1 - stats.norm.cdf(np.abs(dm_stat)))
    
    return {
        'dm_statistic': dm_stat,
        'p_value': p_value,
        'mean_differential': d_bar,
        'variance': var_d_bar,
        'better_model': 1 if d_bar < 0 else 2,
        'significant_05': p_value < 0.05
    }
```

### 6.3 Multiple Comparison Corrections

#### 6.3.1 Family-Wise Error Rate

When comparing multiple models, the probability of false positives increases.

**Bonferroni Correction:**
```
α_adjusted = α / m
```

Where m is the number of comparisons.

**Holm-Bonferroni Method:**

1. Order p-values: p_(1) ≤ p_(2) ≤ ... ≤ p_(m)
2. Find largest k such that p_(k) ≤ α/(m+1-k)
3. Reject H₀ for all i ≤ k

#### 6.3.2 False Discovery Rate

**Benjamini-Hochberg Procedure:**

1. Order p-values: p_(1) ≤ p_(2) ≤ ... ≤ p_(m)
2. Find largest k such that p_(k) ≤ (k/m) × α
3. Reject H₀ for all i ≤ k

#### 6.3.3 Model Confidence Set

**Hansen et al. (2011) Model Confidence Set:**

```python
def model_confidence_set(losses, alpha=0.10, B=10000):
    T, M = losses.shape
    
    # Calculate relative performance
    d_ij = losses[:, :, None] - losses[:, None, :]
    d_bar_ij = np.mean(d_ij, axis=0)
    
    # Bootstrap statistics
    t_max_b = np.zeros(B)
    for b in range(B):
        idx = np.random.choice(T, T, replace=True)
        d_b = d_ij[idx]
        d_bar_b = np.mean(d_b, axis=0)
        var_b = np.var(d_b, axis=0, ddof=1) / T
        t_stat_b = d_bar_b / np.sqrt(var_b)
        t_max_b[b] = np.max(np.abs(t_stat_b))
    
    # Critical value
    t_crit = np.percentile(t_max_b, 100 * (1 - alpha))
    
    # Elimination procedure
    included = set(range(M))
    while len(included) > 1:
        worst = max(included, key=lambda i: np.max([d_bar_ij[i, j] for j in included if j != i]))
        
        t_stat = np.max([d_bar_ij[worst, j] / np.sqrt(np.var(d_ij[:, worst, j]) / T) 
                        for j in included if j != i])
        
        if t_stat > t_crit:
            included.remove(worst)
        else:
            break
    
    return {
        'mcs_models': list(included),
        'critical_value': t_crit
    }
```

### 6.4 Power Analysis

#### 6.4.1 Test Power Calculation

**Power Definition:**
```
Power = P(Reject H₀ | H₁ is true)
```

**Factors Affecting Power:**

| Factor | Effect on Power | Recommendation |
|--------|----------------|----------------|
| Sample size (T) | Increases | Maximize available data |
| Effect size | Increases | Focus on meaningful differences |
| Significance level | Increases | Balance with Type I error |
| Forecast horizon (h) | Decreases | Use direct multi-step forecasts |
| Loss function | Varies | Choose appropriate metric |

#### 6.4.2 Minimum Detectable Effect

```
MDE = (z_{1-α/2} + z_{1-β}) × sqrt(2σ²/T)
```

Where:
- z_{1-α/2} = Critical value for significance level
- z_{1-β} = Critical value for power
- σ² = Variance of loss differential
- T = Sample size

**Power Analysis Implementation:**
```python
def dm_power_analysis(effect_size, n_obs, alpha=0.05, power_target=0.80):
    from scipy.stats import norm
    
    # Critical values
    z_alpha = norm.ppf(1 - alpha/2)
    z_beta = norm.ppf(power_target)
    
    # Required sample size for target power
    n_required = ((z_alpha + z_beta) / effect_size) ** 2
    
    # Achieved power with given sample
    z_beta_achieved = np.sqrt(n_obs) * effect_size - z_alpha
    power_achieved = norm.cdf(z_beta_achieved)
    
    # Minimum detectable effect
    mde = (z_alpha + z_beta) / np.sqrt(n_obs)
    
    return {
        'n_required': int(np.ceil(n_required)),
        'power_achieved': power_achieved,
        'minimum_detectable_effect': mde,
        'sufficient_power': power_achieved >= power_target
    }
```

---

## 7. Model Performance Monitoring

### 7.1 Key Performance Indicators

#### 7.1.1 Prediction Accuracy Drift

| Metric | Baseline | Warning | Critical | Calculation |
|--------|----------|---------|----------|-------------|
| R² | >0.85 | 0.75-0.85 | <0.75 | 1 - SSE/SST |
| RMSE | <10% | 10-20% | >20% | sqrt(MSE) |
| MAE | <8% | 8-15% | >15% | Mean|error| |
| MAPE | <10% | 10-20% | >20% | Mean|%error| |
| Bias | ±2% | ±2-5% | >±5% | Mean error |

**Drift Detection:**
```python
def detect_accuracy_drift(y_true, y_pred, baseline_metrics, window=30):
    from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
    
    errors = y_true - y_pred
    
    # Current metrics
    current_r2 = r2_score(y_true, y_pred)
    current_rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    current_mae = mean_absolute_error(y_true, y_pred)
    current_bias = np.mean(errors)
    
    # Drift detection
    drift_detected = {
        'r2': current_r2 < baseline_metrics['r2'] * 0.9,
        'rmse': current_rmse > baseline_metrics['rmse'] * 1.2,
        'mae': current_mae > baseline_metrics['mae'] * 1.2,
        'bias': abs(current_bias) > abs(baseline_metrics['bias']) * 2
    }
    
    return {
        'current_metrics': {
            'r2': current_r2,
            'rmse': current_rmse,
            'mae': current_mae,
            'bias': current_bias
        },
        'drift_detected': drift_detected,
        'any_drift': any(drift_detected.values())
    }
```

#### 7.1.2 Feature Distribution Drift

| Drift Type | Test | Threshold | Action |
|------------|------|-----------|--------|
| Population drift | PSI | >0.25 | Investigate |
| Population drift | PSI | >0.50 | Retrain |
| Mean shift | T-test | p<0.01 | Investigate |
| Variance change | F-test | p<0.01 | Investigate |
| Shape change | KS test | p<0.01 | Investigate |

**Population Stability Index (PSI):**
```
PSI = sum((Actual_i - Expected_i) × ln(Actual_i / Expected_i))
```

**Implementation:**
```python
def calculate_psi(expected, actual, buckets=10):
    # Create bins based on expected distribution
    breakpoints = np.percentile(expected, np.linspace(0, 100, buckets + 1))
    breakpoints[-1] += 0.001
    
    # Calculate proportions
    expected_counts, _ = np.histogram(expected, breakpoints)
    actual_counts, _ = np.histogram(actual, breakpoints)
    
    expected_perc = expected_counts / len(expected)
    actual_perc = actual_counts / len(actual)
    
    # Calculate PSI
    psi = np.sum((actual_perc - expected_perc) * np.log(actual_perc / expected_perc))
    
    return psi
```

#### 7.1.3 Output Distribution Drift

| Metric | Test | Threshold | Interpretation |
|--------|------|-----------|----------------|
| Mean prediction | Z-test | p<0.01 | Systematic shift |
| Prediction variance | F-test | p<0.01 | Uncertainty change |
| Prediction shape | KS test | p<0.01 | Distribution change |
| Quantile coverage | Binomial | p<0.05 | Calibration drift |

### 7.2 Alert Thresholds

#### 7.2.1 Statistical Significance Levels

| Test | Warning | Critical | Emergency | Response Time |
|------|---------|----------|-----------|---------------|
| Accuracy drift | p<0.05 | p<0.01 | p<0.001 | 24-48 hours |
| Feature drift | PSI>0.1 | PSI>0.25 | PSI>0.5 | 24-72 hours |
| Output drift | p<0.05 | p<0.01 | p<0.001 | 24-48 hours |
| Data quality | >1% errors | >5% errors | >10% errors | 4-24 hours |

#### 7.2.2 Business Impact Thresholds

| Impact Level | Financial Impact | Customer Impact | Regulatory Impact | Response |
|--------------|-----------------|-----------------|-------------------|----------|
| Low | <$10K | <10 customers | None | Log only |
| Medium | $10K-$100K | 10-100 customers | Reportable | 24 hours |
| High | $100K-$1M | 100-1000 customers | Violation risk | 4 hours |
| Critical | >$1M | >1000 customers | Breach | 1 hour |

### 7.3 Remediation Procedures

#### 7.3.1 Model Retraining Triggers

| Trigger | Condition | Retraining Approach | Timeline |
|---------|-----------|---------------------|----------|
| Scheduled | Quarterly | Full retraining | 2 weeks |
| Performance | >10% accuracy drop | Full retraining | 1 week |
| Data drift | PSI>0.25 | Incremental retraining | 3 days |
| Concept drift | Detected | Full retraining | 1 week |
| New data | >20% new data | Incremental retraining | 3 days |

#### 7.3.2 Fallback Procedures

| Scenario | Fallback Model | Activation Criteria | Rollback Time |
|----------|---------------|---------------------|---------------|
| Model failure | Previous version | >5% error rate | <1 hour |
| Data issues | Simplified model | Data quality breach | <2 hours |
| Performance degradation | Conservative model | >10% accuracy drop | <4 hours |
| System outage | Cached predictions | System unavailable | <30 min |

**Fallback Decision Tree:**
```
Issue Detected
    │
    ├── Data Quality Issue?
    │   ├── Yes → Use Cached Predictions
    │   └── No → Continue
    │
    ├── Model Performance Issue?
    │   ├── Yes → Activate Previous Version
    │   └── No → Continue
    │
    ├── System Issue?
    │   ├── Yes → Use Simplified Model
    │   └── No → Continue
    │
    └── Normal Operations
```

---

## 8. User Acceptance Testing (UAT) Framework

### 8.1 Multi-Persona Validation Scenarios

#### 8.1.1 Persona Definitions

| Persona | Role | Technical Level | Primary Use Case | Key Concerns |
|---------|------|----------------|------------------|--------------|
| Climate Scientist | Researcher | High | Model validation, research | Accuracy, methodology |
| Risk Analyst | Analyst | Medium | Portfolio analysis, reporting | Data quality, insights |
| Executive | Decision-maker | Low | Strategic decisions, reporting | Summary metrics, trends |
| Regulator | Compliance | Medium | Regulatory reporting, audit | Compliance, transparency |
| Developer | Technical | High | Integration, automation | API, performance |

#### 8.1.2 Climate Scientist Persona

**Use Cases:**
1. Validate model outputs against known climate patterns
2. Compare projections with IPCC scenarios
3. Assess uncertainty quantification
4. Review methodology documentation

**Test Scenarios:**

| Scenario | Steps | Expected Result | Pass Criteria |
|----------|-------|-----------------|---------------|
| Scenario comparison | Load RCP4.5 and RCP8.5 → Compare temperature trends | Clear divergence after 2050 | Difference >2°C by 2100 |
| Uncertainty review | View prediction intervals → Check coverage | 90% PI covers historical | >85% coverage |
| Methodology review | Access documentation → Verify equations | Complete mathematical spec | All equations present |
| Data export | Export raw projections → Verify format | NetCDF/CSV with metadata | Correct format |

#### 8.1.3 Risk Analyst Persona

**Use Cases:**
1. Analyze portfolio climate risk exposure
2. Generate risk reports for stakeholders
3. Perform scenario analysis
4. Track risk metrics over time

**Test Scenarios:**

| Scenario | Steps | Expected Result | Pass Criteria |
|----------|-------|-----------------|---------------|
| Portfolio analysis | Upload portfolio → Run risk assessment | Risk scores by asset | <5 min processing |
| Report generation | Select parameters → Generate PDF | Professional report | All sections complete |
| Scenario analysis | Change scenario → Compare results | Clear differences highlighted | Delta values shown |
| Trend monitoring | View time series → Identify patterns | Clear trend visualization | Interactive charts |

#### 8.1.4 Executive Persona

**Use Cases:**
1. View executive dashboard
2. Understand key risk metrics
3. Make strategic decisions
4. Present to board

**Test Scenarios:**

| Scenario | Steps | Expected Result | Pass Criteria |
|----------|-------|-----------------|---------------|
| Dashboard review | Open executive dashboard → Review KPIs | At-a-glance metrics | Load <3 seconds |
| Risk summary | View risk summary → Understand exposure | Clear risk categorization | Plain language |
| Trend overview | View 30-year trend → Understand direction | Clear trend arrow | Visual indicators |
| Board presentation | Export presentation → Review slides | Board-ready slides | Professional format |

#### 8.1.5 Regulator Persona

**Use Cases:**
1. Audit model compliance
2. Review documentation
3. Verify data lineage
4. Assess transparency

**Test Scenarios:**

| Scenario | Steps | Expected Result | Pass Criteria |
|----------|-------|-----------------|---------------|
| Documentation audit | Access model documentation → Review completeness | Complete documentation | All sections present |
| Data lineage review | Trace data sources → Verify provenance | Complete lineage | All sources documented |
| Transparency check | Review explainability features → Assess clarity | Clear explanations | SHAP values accessible |
| Compliance verification | Check regulatory requirements → Verify alignment | Compliance checklist | All items addressed |

#### 8.1.6 Developer Persona

**Use Cases:**
1. Integrate with internal systems
2. Automate data pipelines
3. Build custom dashboards
4. Scale infrastructure

**Test Scenarios:**

| Scenario | Steps | Expected Result | Pass Criteria |
|----------|-------|-----------------|---------------|
| API integration | Call API endpoints → Verify responses | Correct JSON responses | <200ms latency |
| Authentication | Test OAuth flow → Verify tokens | Valid access tokens | Token refresh works |
| Rate limiting | Send requests → Verify throttling | 429 on limit exceeded | Clear error messages |
| Webhook testing | Configure webhook → Receive events | Events delivered | <5 sec delivery |

### 8.2 UAT Test Plan

#### 8.2.1 Test Coverage Matrix

| Feature | Scientist | Analyst | Executive | Regulator | Developer |
|---------|-----------|---------|-----------|-----------|-----------|
| Dashboard | Review | Primary | Primary | Review | N/A |
| Reporting | Review | Primary | Primary | Review | N/A |
| API | N/A | Secondary | N/A | N/A | Primary |
| Data Export | Primary | Primary | Secondary | Primary | Secondary |
| Documentation | Primary | Secondary | Secondary | Primary | Secondary |
| Explainability | Primary | Secondary | N/A | Primary | N/A |
| Admin | N/A | N/A | N/A | N/A | Primary |

#### 8.2.2 Test Execution Timeline

| Phase | Duration | Activities | Deliverables |
|-------|----------|------------|--------------|
| Preparation | 1 week | Environment setup, test data | Test environment ready |
| Execution | 2 weeks | Persona-based testing | Test results logged |
| Defect resolution | 1 week | Fix issues, retest | Defects closed |
| Sign-off | 3 days | Final review, approval | UAT sign-off |

#### 8.2.3 Acceptance Criteria

| Category | Criteria | Measurement | Target |
|----------|----------|-------------|--------|
| Functional | All critical features work | Test case pass rate | >95% |
| Performance | Response times acceptable | Load testing | Meet SLAs |
| Usability | Users can complete tasks | Task completion rate | >90% |
| Documentation | Complete and accurate | Review checklist | 100% |
| Security | No critical vulnerabilities | Security scan | Zero critical |

---

## 9. Appendices

### Appendix A: Statistical Tables

#### A.1 Critical Values for Common Tests

| Test | α=0.10 | α=0.05 | α=0.01 | α=0.001 |
|------|--------|--------|--------|---------|
| Z-test (two-tailed) | 1.645 | 1.960 | 2.576 | 3.291 |
| Chi-square (df=1) | 2.706 | 3.841 | 6.635 | 10.828 |
| Chi-square (df=5) | 9.236 | 11.070 | 15.086 | 20.515 |
| t-test (df=30) | 1.697 | 2.042 | 2.750 | 3.646 |
| F-test (5,30) | 2.05 | 2.53 | 3.70 | 5.39 |

#### A.2 PSI Interpretation Guidelines

| PSI Range | Interpretation | Action |
|-----------|----------------|--------|
| 0 - 0.1 | No significant change | None |
| 0.1 - 0.25 | Moderate change | Monitor |
| 0.25 - 0.5 | Significant change | Investigate |
| >0.5 | Major change | Retrain |

### Appendix B: Glossary

| Term | Definition |
|------|------------|
| Backtesting | Testing model predictions against historical outcomes |
| Concept drift | Change in the relationship between inputs and outputs |
| Feature drift | Change in the distribution of input features |
| PSI | Population Stability Index - measure of distribution shift |
| SHAP | SHapley Additive exPlanations - feature attribution method |
| Sobol index | Sensitivity measure based on variance decomposition |
| UAT | User Acceptance Testing - validation by end users |
| VaR | Value at Risk - quantile-based risk measure |

### Appendix C: References

1. Diebold, F.X. and Mariano, R.S. (1995). "Comparing Predictive Accuracy." Journal of Business & Economic Statistics.
2. Sobol, I.M. (2001). "Global Sensitivity Indices for Nonlinear Mathematical Models." Mathematical Modeling and Computational Experiment.
3. Lundberg, S.M. and Lee, S.I. (2017). "A Unified Approach to Interpreting Model Predictions." NeurIPS.
4. Christoffersen, P.F. (1998). "Evaluating Interval Forecasts." International Economic Review.
5. Kupiec, P.H. (1995). "Techniques for Verifying the Accuracy of Risk Measurement Models." Journal of Derivatives.
6. Hansen, P.R., Lunde, A., and Nason, J.M. (2011). "The Model Confidence Set." Econometrica.

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01 | MRM Team | Initial release |

**Approval**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead MRM Director | [Name] | [Date] | [Signature] |
| Chief Risk Officer | [Name] | [Date] | [Signature] |
| Model Risk Committee | [Name] | [Date] | [Signature] |

---

*End of Document*
