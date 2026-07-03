# DME PD Engine
**Module ID:** `dme-pd-engine` · **Route:** `/dme-pd-engine` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Probability of default adjustment model that integrates Dynamic Materiality Engine scores into credit risk assessment, producing ESG-adjusted PD estimates for loan and bond portfolios. Quantifies how material ESG topics translate into credit deterioration risk. Supports IFRS 9 staging and ECB supervisory disclosure requirements.

> **Business value:** Integrates ESG risk into credit decisions by producing defensible, model-based PD adjustments anchored to empirical data. Supports IFRS 9 staging, ECB supervisory expectations, and loan pricing adjustments for ESG-elevated credit risk.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLLATERAL_TYPES`, `ENTITIES`, `LGD_BY_COLLATERAL`, `REGIONS`, `SECTORS`, `SECTOR_CFG`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `mertonDD` | `(A,D,r,sigma,t_yrs)=>(Math.log(A/D)+(r+0.5*sigma**2)*t_yrs)/(sigma*Math.sqrt(Math.max(0.0001,t_yrs)));` |
| `logistic` | `(x)=>1/(1+Math.exp(-x));` |
| `branchA` | `(pdBase,alpha,vT)=>Math.min(0.999,Math.max(0.0001,pdBase*Math.exp(alpha*vT)));` |
| `logit` | `beta0+beta1*esg+beta2*ghg+beta3*rev+beta4;` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Latin America','Middle East'];` |
| `region` | `REGIONS[Math.floor(sr(i*7)*REGIONS.length)];` |
| `esgScore` | `Math.round(20+sr(i*11)*75);` |
| `ghgIntensity` | `+(100+sr(i*13)*400).toFixed(0);   // tCO2e/$M` |
| `revenueGrowth` | `+(sr(i*17)*0.15-0.03).toFixed(3); // -3% to +12%` |
| `assetVal` | `Math.round(500+sr(i*23)*4500);          // $M` |
| `debtFace` | `Math.round(assetVal*(0.25+sr(i*29)*0.45));` |
| `assetVol` | `+(0.12+sr(i*31)*0.32).toFixed(3);` |
| `pdBase` | `+(0.005+sr(i*43)*0.07).toFixed(5);` |
| `ead` | `Math.round(debtFace*(0.8+sr(i*47)*0.3));     // $M EAD` |
| `collateralIdx` | `Math.floor(sr(i*53)*COLLATERAL_TYPES.length);` |
| `pdC` | `+branchC(cfg.b0,cfg.b1,esgScore,cfg.b2,ghgIntensity/1000,cfg.b3,revenueGrowth,cfg.b4).toFixed(5);` |
| `pdD` | `+branchD_mc(assetVal,debtFace,mu,assetVol,3,i+1).toFixed(5);` |
| `pdConsensus` | `+((pdA*0.25+pdB*0.30+pdC*0.20+pdD*0.25)).toFixed(5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg PD Uplift (Portfolio) | — | DME PD engine | Mean ESG-driven probability of default increase across the credit portfolio |
| Entities with PD Uplift > 100 bps | — | PD engine | Count of borrowers where ESG materiality drives a PD uplift exceeding 100 basis points |
| Portfolio Weighted PD (ESG-Adjusted) | — | PD aggregation | Exposure-weighted average ESG-adjusted PD across the full credit portfolio |
| β Calibration R² | — | Historical calibration | Goodness of fit of the ESG-PD relationship estimated from historical default and ESG score data |
- **DME materiality scores (all credit obligors)** → PD multiplier calculation: exp(α + β × MaterialityScore) → **ESG-adjusted PD per obligor with base vs. adjusted comparison**
- **Base credit model PD (internal ratings or external agency)** → Log-linear adjustment application and portfolio exposure weighting → **Exposure-weighted portfolio ESG-adjusted PD**
- **Historical default and ESG score dataset (calibration)** → Logistic regression to estimate β and sector α parameters → **Calibrated β/α coefficients with goodness-of-fit statistics**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG-Adjusted PD
**Headline formula:** `PDₐₛᵍ = PDᵇᵃˢᵉ × exp(α + β × MaterialityScore)`
**Standards:** ['ECB Guide on Climate Risks in Credit', 'NGFS Supervisory Scenario PD Adjustments', 'IFRS 9 Staging Criteria']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).