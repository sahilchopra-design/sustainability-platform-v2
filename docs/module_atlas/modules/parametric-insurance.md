# Parametric Insurance Analyser
**Module ID:** `parametric-insurance` · **Route:** `/parametric-insurance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Parametric (index-based) insurance product design and analysis. Covers trigger design (rainfall, temperature, wind speed), basis risk quantification, and climate risk transfer pricing.

> **Business value:** Parametric insurance closes protection gaps by paying quickly based on measurable triggers, without loss adjustment. Critical for climate-vulnerable regions where traditional insurance markets fail. This module enables product design, back-testing, and climate adjustment for NGOs, sovereigns, and corporates.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BASIS_RISK_COMPARISON`, `COUNTRIES`, `COVERAGE_TYPES`, `HISTORICAL_TRIGGERS`, `PAYOUT_TYPES`, `PRODUCTS`, `PRODUCT_STATUS`, `SCHEMES`, `SOVEREIGN_PROGRAMS`, `TABS`, `TRIGGER_COLORS`, `TRIGGER_TYPES`, `TRIGGER_UNITS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TRIGGER_UNITS` | `['mm','km/h','°C','Mw','Index','m'];` |
| `triggerIdx` | `Math.floor(s1*TRIGGER_TYPES.length);` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `payoutType` | `PAYOUT_TYPES[Math.floor(s3*PAYOUT_TYPES.length)];` |
| `coverageType` | `COVERAGE_TYPES[Math.floor(s4*COVERAGE_TYPES.length)];` |
| `status` | `PRODUCT_STATUS[Math.floor(s5*3)];` |
| `scheme` | `SCHEMES[Math.floor(s6*SCHEMES.length)];` |
| `triggerThreshold` | `triggerType==='Rainfall'?Math.round(50+s7*300):triggerType==='Wind Speed'?Math.round(80+s7*180):triggerType==='Temperature'?+(30+s7*15).toFixed(1):tri` |
| `exitThreshold` | `triggerType==='Rainfall'?Math.round(triggerThreshold*1.8+50):triggerType==='Wind Speed'?Math.round(triggerThreshold*1.5):triggerType==='Temperature'?+` |
| `maxPayout` | `Math.round(1+s8*49);` |
| `premium` | `+(maxPayout*0.03+s9*maxPayout*0.12).toFixed(2);` |
| `attachmentProb` | `+(5+s1*25).toFixed(1);` |
| `exhaustionProb` | `+(1+s2*8).toFixed(1);` |
| `expectedLoss` | `+(premium*0.5+s3*premium*0.4).toFixed(2);` |
| `basisRisk` | `+(5+s4*35).toFixed(1);` |
| `historicalTriggers` | `Math.round(1+s5*12);` |
| `avgPayoutTime` | `Math.round(3+s6*25);` |
| `beneficiaries` | `Math.round(500+s7*49500);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `COVERAGE_TYPES`, `PAYOUT_TYPES`, `PRODUCT_STATUS`, `SCHEMES`, `SOVEREIGN_PROGRAMS`, `TABS`, `TRIGGER_COLORS`, `TRIGGER_TYPES`, `TRIGGER_UNITS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Triggers Covered | — | Product types | Common parametric indices |
| Basis Risk | — | Product quality | Fraction of actual loss not covered by parametric payout |
| Speed of Payout | — | Key benefit | Parametric pays within weeks; traditional claims take months |
- **Weather station data** → Index historical simulation → **Trigger calibration**
- **Loss data** → Correlation analysis → **Basis risk quantification**
- **Climate projections** → Hazard frequency adjustment → **Future premium pricing**

## 5 · Intermediate Transformation Logic
**Methodology:** Parametric trigger and basis risk model
**Headline formula:** `Payout = MaxPayout × max(0, (Trigger-Index)/Trigger); BasisRisk = Var(ActualLoss - Payout)`
**Standards:** ['IBRD', 'InsuResilience', 'Munich Re Parametric']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).