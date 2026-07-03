# Reinsurance Climate Analyser
**Module ID:** `reinsurance-climate` · **Route:** `/reinsurance-climate` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Reinsurance treaty analysis incorporating climate-adjusted cat losses. Covers quota share, excess of loss, aggregate stop loss, and retrocession with climate premium adequacy assessment.

> **Business value:** Climate change is the dominant repricing pressure in global reinsurance markets. Treaties priced on historical loss experience are systematically underpriced for future hazard. This module enables actuarial assessment of climate adequacy for treaty pricing, purchasing, and capital optimisation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAT_BONDS`, `CLIMATE_UPLIFT_BY_PERIL`, `LOSS_HISTORY`, `PERILS`, `PERIL_COLORS`, `PIE_COLORS`, `REGIONS`, `REGION_UPLIFT`, `REINSURERS`, `RETRO_LAYERS`, `TABS`, `TREATIES`, `TREATY_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Treaty Portfolio','Climate-Adjusted Pricing','ILS & Cat Bond Market','Retrocession & Systemic Risk'];` |
| `reinsurer` | `REINSURERS[Math.floor(s1*REINSURERS.length)];` |
| `type` | `TREATY_TYPES[Math.floor(s2*TREATY_TYPES.length)];` |
| `peril` | `PERILS[Math.floor(s3*PERILS.length)];` |
| `region` | `REGIONS[Math.floor(s4*REGIONS.length)];` |
| `limit` | `Math.round(50+s5*450);` |
| `retention` | `Math.round(5+s6*limit*0.3);` |
| `premium` | `+(limit*0.02+s7*limit*0.07).toFixed(1);` |
| `technicalPrice` | `+(premium*(0.85+s8*0.3)).toFixed(1);` |
| `climateAdjPrice` | `+(technicalPrice*(1.05+s9*0.35)).toFixed(1);` |
| `historicalLR` | `+(0.3+s1*0.5).toFixed(2);` |
| `climateAdjLR` | `+(historicalLR*(1.1+s2*0.3)).toFixed(2);` |
| `rateOnLine` | `+(premium/limit*100).toFixed(2);` |
| `climateUplift` | `+(1.05+s3*0.40).toFixed(2);` |
| `yearsOnBook` | `Math.round(1+s4*15);` |
| `rating` | `['A++','A+','A','A-','B++','B+'][Math.floor(s5*6)];` |
| `collateral` | `Math.round(limit*0.3+s6*limit*0.5);` |
| `reinstatements` | `Math.floor(s7*3);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PERILS`, `PERIL_COLORS`, `PIE_COLORS`, `REGIONS`, `REINSURERS`, `RETRO_LAYERS`, `TABS`, `TREATY_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Loading | — | Model | Premium loading for future climate hazard increase |
| Attachment Probability | — | Contract | Frequency at which treaty attaches |
| Exhaustion Probability | — | Contract | Frequency at which limit is consumed |
- **Primary loss model** → Climate hazard adjustment → **Climate-adjusted cat loss**
- **Treaty structure** → Loss cession calculation → **Treaty loss distribution**
- **Treaty loss** → Pricing adequacy check → **Climate-adjusted combined ratio**

## 5 · Intermediate Transformation Logic
**Methodology:** Treaty performance under climate scenarios
**Headline formula:** `TreatyLoss = max(0, PortfolioLoss - Retention) × TreatyShare; LossRatio = TreatyLoss / Premium`
**Standards:** ["Lloyd's of London", 'IAIS ICP 25', 'Swiss Re ClimateWise']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).